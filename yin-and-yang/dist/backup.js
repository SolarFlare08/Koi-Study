import {CAPTURE_PREFIX,cleanCaptureContext} from './capture.js';
import {CROCHET_KEY,loadCrochet} from './crochet.js';
import {JOURNAL_KEY,loadJournal} from './journal.js';
import {STORAGE_KEY,loadState,reset} from './state.js';
import {scratchNoteId} from './sticky-notes.js';

const format='yin-and-yang-backup';
const version=1;
const RESTORE_POINTS_KEY='yin-and-yang.restore-points.v1';
const restorePointLimit=5;
const validCapture=note=>typeof note?.key==='string'&&
  (note.key.startsWith(CAPTURE_PREFIX)||/^native:[a-f0-9]{32}$/.test(note.key))&&
  typeof note.text==='string'&&Number.isFinite(note.createdAt);

export function createBackup(state,storage,captures,now=new Date()){
  return {
    format,version,exportedAt:now.toISOString(),
    data:{state,journal:loadJournal(storage),crochet:loadCrochet(storage),captures}
  };
}

export function loadRestorePoints(storage){
  try{
    const value=JSON.parse(storage.getItem(RESTORE_POINTS_KEY));
    return Array.isArray(value)?value.filter(item=>typeof item?.id==='string'&&item.snapshot?.format===format&&
      Number.isFinite(Date.parse(item.snapshot.exportedAt))).slice(0,restorePointLimit):[];
  }catch{return [];}
}

export function saveRestorePoint(storage,snapshot){
  const point={id:crypto.randomUUID(),snapshot};
  const points=[point,...loadRestorePoints(storage)].slice(0,restorePointLimit);
  storage.setItem(RESTORE_POINTS_KEY,JSON.stringify(points));
  return point;
}

export function readBackup(text){
  let backup;
  try{backup=JSON.parse(text);}catch{throw new Error('Choose a valid Yin and Yang backup file.');}
  if(backup?.format!==format||backup.version!==version)throw new Error('This file is not a supported Yin and Yang backup.');
  const data=backup.data;
  if(!Array.isArray(data?.state?.tasks)||!data.state.settings||
    !Array.isArray(data.journal)||!Array.isArray(data.crochet?.projects)||
    !Array.isArray(data.crochet.yarn)||!Array.isArray(data.crochet.usage)||
    (Object.hasOwn(data.crochet,'timeLog')&&!Array.isArray(data.crochet.timeLog))||
    !Array.isArray(data.captures)||!data.captures.every(validCapture)){
    throw new Error('This backup is missing data or contains an invalid record.');
  }
  const staged=new Map([
    [STORAGE_KEY,JSON.stringify(data.state)],
    [JOURNAL_KEY,JSON.stringify(data.journal)],
    [CROCHET_KEY,JSON.stringify(data.crochet)]
  ]);
  const source={getItem:key=>staged.get(key)||null};
  const state=loadState(source),journal=loadJournal(source),crochet=loadCrochet(source);
  if(state.tasks.length!==data.state.tasks.length||journal.length!==data.journal.length||
    crochet.projects.length!==data.crochet.projects.length||crochet.yarn.length!==data.crochet.yarn.length||
    crochet.usage.length!==data.crochet.usage.length||crochet.timeLog.length!==(data.crochet.timeLog?.length??0)){
    throw new Error('This backup contains a damaged record. Your current data is safe.');
  }
  reset(state,state.timer.mode);
  const captures=new Map();
  for(const {key,text,createdAt,context} of data.captures){
    const note={text,createdAt};
    const cleaned=cleanCaptureContext(context);
    if(cleaned)note.context=cleaned;
    if(key.startsWith('native:')){
      captures.set(CAPTURE_PREFIX+'portable-'+key.slice(7),note);
      if(!state.processedCaptures.includes(key))state.processedCaptures.push(key);
    }else captures.set(key,note);
  }
  return {state,journal,crochet,captures,exportedAt:typeof backup.exportedAt==='string'?backup.exportedAt:''};
}

export function restoreBackup(storage,{state,journal,crochet,captures}){
  const next=new Map([
    [STORAGE_KEY,JSON.stringify(state)],
    [JOURNAL_KEY,JSON.stringify(journal)],
    [CROCHET_KEY,JSON.stringify(crochet)]
  ]);
  for(const [key,note] of captures)next.set(key,JSON.stringify(note));
  const remove=[];
  for(let index=0;index<storage.length;index++){
    const key=storage.key(index);
    if(key?.startsWith(CAPTURE_PREFIX)&&!next.has(key))remove.push(key);
  }
  writeBackupChanges(storage,next,remove);
}

function writeBackupChanges(storage,next,remove=[]){
  const previous=new Map();
  for(const key of [...remove,...next.keys()])previous.set(key,storage.getItem(key));
  const touched=new Set();
  try{
    for(const key of remove){storage.removeItem(key);touched.add(key);}
    for(const [key,value] of next){storage.setItem(key,value);touched.add(key);}
  }catch{
    try{
      // Free space used by this import before putting the previous values back.
      for(const key of touched)storage.removeItem(key);
      for(const key of touched)if(previous.get(key)!==null)storage.setItem(key,previous.get(key));
    }catch{throw new Error('The restore stopped, and some previous data could not be recovered. Keep your backup file.');}
    throw new Error('Could not restore the backup. Your previous data was restored.');
  }
}

const comparable=value=>JSON.stringify(value,(_,item)=>item&&typeof item==='object'&&!Array.isArray(item)?
  Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
const describe=item=>String(typeof item==='string'?item:item.title||item.name||item.taskTitle||item.text||item.date||item.day||'').slice(0,100);
function backupConflict(title,local,incoming){
  const record=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{value};
  const current=record(local), backup=record(incoming);
  const fields=[...new Set([...Object.keys(current),...Object.keys(backup)])]
    .filter(field=>comparable(current[field])!==comparable(backup[field]))
    .map(field=>({field,current:current[field],incoming:backup[field]}));
  return {action:'Replace',title,fields};
}

export function planBackupRestore(storage,current,incoming,sections){
  const state={...current,dailyRituals:{...current.dailyRituals}};
  const writes=new Map(), preview=[];
  let stateChanged=false, details;
  const include=id=>sections?.has(id)??true;
  function section(id,label,description,plan){
    details=[];
    plan(include(id));
    preview.push({id,label,description,details});
  }
  function merge(label,local,backup,key=item=>item.id){
    const items=new Map(local.map(item=>[key(item),item]));
    let added=0,replaced=0;
    const changes=[];
    const unique=new Map(backup.map(item=>[key(item),item]));
    for(const [id,item] of unique){
      let action;
      if(!items.has(id)){added++;action='Add';}
      else if(comparable(items.get(id))!==comparable(item)){replaced++;action='Replace';}
      if(action==='Replace')changes.push(backupConflict(describe(item)||describe(items.get(id))||String(id),items.get(id),item));
      else if(action==='Add'&&added<=10)changes.push({action,title:describe(item)||String(id)});
      items.set(id,item);
    }
    if(unique.size)details.push({label,added,replaced,unchanged:unique.size-added-replaced,changes});
    return [...items.values()];
  }
  function stateList(apply,key,label,identify){
    const records=merge(label,current[key],incoming.state[key],identify);
    if(apply){state[key]=records;stateChanged=true;}
  }
  function rituals(apply,kind,label){
    const entries=value=>Object.entries(value).filter(([,day])=>day[kind]).map(([date,day])=>({date,entry:day[kind]}));
    const merged=merge(label,entries(current.dailyRituals),entries(incoming.state.dailyRituals),item=>item.date);
    if(!apply)return;
    for(const {date,entry} of merged)state.dailyRituals[date]={...state.dailyRituals[date],[kind]:entry};
    stateChanged=true;
  }
  section('planner','Planner','Tasks include their scheduled blocks.',apply=>{
    stateList(apply,'tasks','Tasks');stateList(apply,'projects','Projects');stateList(apply,'taskTemplates','Task templates');
    stateList(apply,'plannerFilters','Saved views');stateList(apply,'plannerLabels','Labels',item=>item);
    stateList(apply,'taskActivity','Task completions');stateList(apply,'scheduleMoves','Schedule moves');
    for(const [key,label] of [['tomorrowPlan','First focus reservation'],['focusPins','Pinned focus order']]){
      const local=current[key], backup=incoming.state[key];
      if(!backup||local?.day>backup.day)continue;
      const changed=comparable(local)!==comparable(backup);
      details.push({label,added:!local?1:0,replaced:local&&changed?1:0,unchanged:changed?0:1,
        changes:local&&changed?[backupConflict(label,local,backup)]:[]});
      if(apply)state[key]=backup;
    }
    if(apply)state.gardenClearedDone={...current.gardenClearedDone,...incoming.state.gardenClearedDone};
  });
  section('calendar','Calendar','Events and recurring unavailable hours.',apply=>{
    stateList(apply,'calendarEvents','Events');stateList(apply,'availability','Availability rules');
  });
  section('notes','Notes','Sticky notes and captured thoughts.',apply=>{
    stateList(apply,'stickyNotes','Sticky notes');stateList(apply,'captureArchive','Archived thoughts',item=>item.key);
    const active=[...incoming.captures].map(([key,note])=>({key,...note}));
    const local=active.flatMap(({key})=>{
      const archived=current.captureArchive.find(note=>note.key===key);
      if(archived)return [archived];
      try{const note=JSON.parse(storage.getItem(key));return note?[{key,text:note.text,createdAt:note.createdAt,context:cleanCaptureContext(note.context)}]:[];}catch{return [];}
    });
    const captures=merge('Unsorted thoughts',local,active,item=>item.key);
    if(apply){
      state.notes=state.stickyNotes.find(note=>note.id===scratchNoteId)?.body||'';
      state.captureArchive=state.captureArchive.filter(note=>!incoming.captures.has(note.key));
      state.processedCaptures=[...new Set([...current.processedCaptures,...incoming.state.processedCaptures,...state.captureArchive.map(note=>note.key)])]
        .filter(key=>!incoming.captures.has(key));
      for(const {key,text,createdAt,context} of captures)writes.set(key,JSON.stringify({text,createdAt,context}));
    }
  });
  section('reading','Reading','Annotation logs match by calendar day.',apply=>{
    rituals(apply,'annotate','Annotation logs');stateList(apply,'readingNotes','Chapter notes');
    stateList(apply,'finishedBooks','Finished books and reviews');
    stateList(apply,'readingCollections','Reading collections');
  });
  section('journal','Journal','Entries, templates, and daily completion marks.',apply=>{
    const records=merge('Journal entries',loadJournal(storage),incoming.journal);
    rituals(apply,'journal','Journal completion marks');stateList(apply,'journalTemplates','Journal templates');
    if(apply)writes.set(JOURNAL_KEY,JSON.stringify(records));
  });
  section('stitchbook','Stitchbook','Projects, yarn, usage, and crochet logs.',apply=>{
    const local=loadCrochet(storage);
    const fields={projects:'Projects',yarn:'Yarn',usage:'Yarn usage',timeLog:'Time logs'};
    const records=Object.fromEntries(Object.entries(fields).map(([key,label])=>[key,merge(label,local[key],incoming.crochet[key])]));
    rituals(apply,'crochet','Crochet check-ins');
    if(apply)writes.set(CROCHET_KEY,JSON.stringify(records));
  });
  section('garden','Garden & focus','Focus history, landscape, and preferences.',apply=>{
    stateList(apply,'history','Focus and rest sessions');stateList(apply,'routines','Timer routines');
    stateList(apply,'gardenGrowth','Garden landmarks',item=>JSON.stringify([item.kind,item.sourceId]));
    const keys=['settings','appearance','gardenSchedule','sounds','notifications','intention','spotify','focusMode','replanCutoff','studyCapacity','planningCooldown','shutdownSteps','shutdownProgress'];
    const changes=keys.filter(key=>comparable(current[key])!==comparable(incoming.state[key]))
      .map(key=>backupConflict(fieldLabel(key),current[key],incoming.state[key]));
    details.push({label:'Preferences',added:0,replaced:changes.length,unchanged:keys.length-changes.length,changes});
    if(apply){for(const key of keys)state[key]=incoming.state[key];}
  });
  if(stateChanged)writes.set(STORAGE_KEY,JSON.stringify(state));
  return {preview,writes};
}

export function applyBackupRestore(storage,plan){writeBackupChanges(storage,plan.writes);}

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const fieldLabel=field=>field.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,char=>char.toUpperCase());
function conflictValue(value){
  if(value===undefined)return 'Missing';
  if(value===null||value==='')return 'Empty';
  if(typeof value==='boolean')return value?'Yes':'No';
  return escape(typeof value==='object'?JSON.stringify(value,null,2):value);
}
function backupRecordMarkup(change){
  if(!change.fields)return `<li>${change.action} ${escape(change.title)}</li>`;
  return `<li><details class="backup-conflict"><summary>Replace ${escape(change.title)}</summary>
    <table aria-label="Changed fields"><thead><tr><th scope="col">Field</th><th scope="col">Current</th><th scope="col">Incoming</th></tr></thead>
      <tbody>${change.fields.map(({field,current,incoming})=>`<tr><th scope="row">${escape(fieldLabel(field))}</th>
        <td><pre>${conflictValue(current)}</pre></td><td><pre>${conflictValue(incoming)}</pre></td></tr>`).join('')}</tbody>
    </table></details></li>`;
}

function previewMarkup(rows,selected){
  return rows.map(row=>`<section class="backup-preview-section">
    <label><input type="checkbox" name="section" value="${row.id}" ${selected.has(row.id)?'checked':''}><strong>${row.label}</strong></label>
    <p>${row.description}</p>
    ${row.details.length?`<ul>${row.details.map(detail=>`<li>${detail.label} · ${detail.added} added · ${detail.replaced} replaced${detail.unchanged?` · ${detail.unchanged} unchanged`:''}
      ${detail.changes?.length?`<details><summary>Show records</summary><ul>${detail.changes.map(backupRecordMarkup).join('')}
      ${detail.added+detail.replaced>detail.changes.length?'<li>Additional records are included in the counts.</li>':''}</ul></details>`:''}</li>`).join('')}</ul>`:
      '<p>No records in this backup section.</p>'}</section>`).join('');
}

export function installBackup({dialog,storage,getState,getCaptures,notify}){
  dialog.innerHTML=`<form id="backup-form">
    <header><h2 id="backup-title">Backup and restore</h2><button type="button" data-backup-close aria-label="Close backup and restore">×</button></header>
    <p>Download your tasks, calendar, journal, notes, reading history, crochet projects, and settings in one file.</p>
    <button type="button" id="download-backup">Download backup</button>
    <section class="backup-restore" aria-labelledby="restore-points-heading"><h3 id="restore-points-heading">Local restore points</h3>
      <p>Keep up to five snapshots in this browser. Saving another drops the oldest.</p>
      <button type="button" id="save-restore-point" class="workspace-primary">Save restore point</button>
      <ul id="restore-points-list"></ul></section>
    <div class="backup-restore">
      <label for="backup-file">Restore from a backup</label><input type="file" id="backup-file" accept=".json,application/json">
      <p id="backup-status" role="status" hidden></p>
      <fieldset id="backup-preview" hidden><legend>Choose sections to restore</legend>
        <p>Matching records are replaced. New records are added. Other records stay on this device.</p>
        <div id="backup-preview-sections"></div></fieldset>
      <button type="submit" id="apply-backup" hidden disabled>Restore selected sections</button>
    </div></form>`;
  const file=dialog.querySelector('#backup-file');
  const status=dialog.querySelector('#backup-status');
  const apply=dialog.querySelector('#apply-backup');
  const preview=dialog.querySelector('#backup-preview');
  const sectionList=dialog.querySelector('#backup-preview-sections');
  const pointList=dialog.querySelector('#restore-points-list');
  let staged, shown, revision=0;
  const selected=()=>new Set([...sectionList.querySelectorAll('input:checked')].map(input=>input.value));
  function report(message){
    status.textContent=message;
    status.hidden=!message;
  }
  function clear(){
    revision++;
    staged=null;
    file.value='';
    apply.hidden=true;apply.disabled=true;preview.hidden=true;sectionList.replaceChildren();
    report('');
  }
  function renderPoints(){
    pointList.innerHTML=loadRestorePoints(storage).map(point=>{
      const date=new Date(point.snapshot.exportedAt).toLocaleString([],{dateStyle:'medium',timeStyle:'medium'});
      return `<li><button type="button" data-restore-point="${escape(point.id)}">Preview ${escape(date)}</button></li>`;
    }).join('')||'<li>No restore points saved yet.</li>';
  }
  function stage(parsed,label){
    staged=parsed;
    shown=planBackupRestore(storage,getState(),staged,new Set()).preview;
    sectionList.innerHTML=previewMarkup(shown,new Set());
    const date=new Date(parsed.exportedAt);
    report(Number.isFinite(+date)?`${label} from ${date.toLocaleString([],{dateStyle:'medium',timeStyle:'short'})}.`:'Backup ready to preview.');
    preview.hidden=false;apply.hidden=false;apply.disabled=true;
  }
  dialog.querySelector('#save-restore-point').addEventListener('click',()=>{
    try{
      saveRestorePoint(storage,createBackup(getState(),storage,getCaptures()));
      renderPoints();report('Restore point saved.');
    }catch{report('Could not save a restore point. Existing restore points are still available.');}
  });
  pointList.addEventListener('click',event=>{
    const button=event.target.closest('[data-restore-point]');
    if(!button)return;
    clear();
    const point=loadRestorePoints(storage).find(item=>item.id===button.dataset.restorePoint);
    if(!point){report('That restore point is no longer available.');renderPoints();return;}
    try{stage(readBackup(JSON.stringify(point.snapshot)),'Restore point');preview.querySelector('input')?.focus();}
    catch(error){report(error.message);}
  });
  file.addEventListener('change',async()=>{
    const request=++revision, chosen=file.files[0];
    staged=null;
    apply.hidden=true;apply.disabled=true;preview.hidden=true;sectionList.replaceChildren();
    if(!chosen){report('');return;}
    report('Reading backup…');
    try{
      const parsed=readBackup(await chosen.text());
      if(request!==revision||!dialog.open)return;
      stage(parsed,'Backup');
    }catch(error){if(request===revision)report(error.message);}
  });
  sectionList.addEventListener('change',()=>{apply.disabled=!selected().size;});
  dialog.querySelector('#download-backup').addEventListener('click',()=>{
    const backup=createBackup(getState(),storage,getCaptures());
    const file=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(file);
    const link=document.createElement('a');
    link.href=url;
    link.download=`yin-and-yang-backup-${backup.exportedAt.slice(0,10)}.json`;
    dialog.append(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    notify('Backup downloaded.');
  });
  dialog.querySelector('[data-backup-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('submit',event=>{
    event.preventDefault();
    const choices=selected();
    if(!staged||!choices.size)return;
    try{
      const plan=planBackupRestore(storage,getState(),staged,choices);
      const chosen=rows=>rows.filter(row=>choices.has(row.id));
      if(comparable(chosen(shown))!==comparable(chosen(plan.preview))){
        shown=plan.preview;sectionList.innerHTML=previewMarkup(shown,choices);
        report('Your data changed after the preview. Review the updated comparisons before restoring.');return;
      }
      applyBackupRestore(storage,plan);
    }
    catch(error){report(error.message);return;}
    location.reload();
  });
  dialog.addEventListener('close',clear);
  return {open(){clear();renderPoints();dialog.showModal();}};
}
