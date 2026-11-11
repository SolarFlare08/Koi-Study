import {CAPTURE_PREFIX} from './capture.js';
import {CROCHET_KEY,loadCrochet} from './crochet.js';
import {JOURNAL_KEY,loadJournal} from './journal.js';
import {STORAGE_KEY,loadState,reset} from './state.js';

const format='yin-and-yang-backup';
const version=1;
const validCapture=note=>typeof note?.key==='string'&&
  (note.key.startsWith(CAPTURE_PREFIX)||/^native:[a-f0-9]{32}$/.test(note.key))&&
  typeof note.text==='string'&&Number.isFinite(note.createdAt);

export function createBackup(state,storage,captures,now=new Date()){
  return {
    format,version,exportedAt:now.toISOString(),
    data:{state,journal:loadJournal(storage),crochet:loadCrochet(storage),captures}
  };
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
  for(const {key,text,createdAt} of data.captures){
    if(key.startsWith('native:')){
      captures.set(CAPTURE_PREFIX+'portable-'+key.slice(7),{text,createdAt});
      if(!state.processedCaptures.includes(key))state.processedCaptures.push(key);
    }else captures.set(key,{text,createdAt});
  }
  return {state,journal,crochet,captures};
}

export function restoreBackup(storage,{state,journal,crochet,captures}){
  const next=new Map([
    [STORAGE_KEY,JSON.stringify(state)],
    [JOURNAL_KEY,JSON.stringify(journal)],
    [CROCHET_KEY,JSON.stringify(crochet)]
  ]);
  for(const [key,note] of captures)next.set(key,JSON.stringify(note));
  const previous=new Map();
  for(let index=0;index<storage.length;index++){
    const key=storage.key(index);
    if(key?.startsWith(CAPTURE_PREFIX))previous.set(key,storage.getItem(key));
  }
  for(const key of next.keys())if(!previous.has(key))previous.set(key,storage.getItem(key));
  const touched=new Set();
  try{
    for(const [key,value] of previous){
      if(value!==null&&!next.has(key)){storage.removeItem(key);touched.add(key);}
    }
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

export function installBackup({dialog,storage,getState,getCaptures,notify}){
  dialog.innerHTML=`<form id="backup-form">
    <header><h2 id="backup-title">Backup and restore</h2><button type="button" data-backup-close aria-label="Close backup and restore">×</button></header>
    <p>Download your tasks, calendar, journal, notes, reading history, crochet projects, and settings in one file.</p>
    <button type="button" id="download-backup">Download backup</button>
    <div class="backup-restore">
      <label for="backup-file">Restore from a backup</label><input type="file" id="backup-file" accept=".json,application/json">
      <p id="backup-status" role="status" hidden></p>
      <button type="submit" id="apply-backup" hidden>Replace data on this device</button>
    </div></form>`;
  const file=dialog.querySelector('#backup-file');
  const status=dialog.querySelector('#backup-status');
  const apply=dialog.querySelector('#apply-backup');
  let staged, revision=0;
  function report(message){
    status.textContent=message;
    status.hidden=!message;
  }
  function clear(){
    revision++;
    staged=null;
    file.value='';
    apply.hidden=true;
    report('');
  }
  file.addEventListener('change',async()=>{
    const request=++revision, chosen=file.files[0];
    staged=null;
    apply.hidden=true;
    if(!chosen){report('');return;}
    report('Reading backup…');
    try{
      const parsed=readBackup(await chosen.text());
      if(request!==revision||!dialog.open)return;
      staged=parsed;
      report(`This backup has ${parsed.state.tasks.length} tasks, ${parsed.journal.length} journal entries, and ${parsed.state.stickyNotes.length} sticky notes. Restoring replaces the data currently on this device.`);
      apply.hidden=false;
    }catch(error){if(request===revision)report(error.message);}
  });
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
    if(!staged)return;
    try{restoreBackup(storage,staged);}
    catch(error){report(error.message);return;}
    location.reload();
  });
  dialog.addEventListener('close',clear);
  return {open(){clear();dialog.showModal();}};
}
