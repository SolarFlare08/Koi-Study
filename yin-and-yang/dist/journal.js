import {dayKey} from './state.js';
import {entriesInWeek,journalFacets,journalLabels,journalWeek,matchingJournal,weeklyReflection} from './journal-patterns.js';
export const JOURNAL_KEY='yin-and-yang.journal.v1';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const moods=['Calm','Energized','Steady','Tired','Overwhelmed'];
const builtInTemplates=[
  {id:'reflection',name:'Daily reflection',body:'What went well?\n\nWhat got in the way?\n\nWhat will I try tomorrow?'},
  {id:'study',name:'Study recap',body:'What did I learn?\n\nWhat still needs practice?\n\nWhat will I study next?'}
];
export function loadJournal(storage){
  try{
    const items=JSON.parse(storage.getItem(JOURNAL_KEY));
    return Array.isArray(items)?items.filter(item=>typeof item?.id==='string'&&typeof item.title==='string'&&typeof item.body==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.date))
      .map(item=>({...item,...(item.mood!==undefined&&typeof item.mood!=='string'?{mood:''}:{}),
        ...(item.tags===undefined?{}:{tags:journalLabels(item.tags)}),...(item.themes===undefined?{}:{themes:journalLabels(item.themes)})})):[];
  }catch{return [];}
}
export function installJournal({root,storage,projects,notify,onChange,getTemplates=()=>[],saveTemplates=()=>false,linkedNotes=()=>'',getReflections,saveReflection}){
  let entries=loadJournal(storage),query='',view='entries',week=journalWeek(dayKey()),editingReflection=false;
  const filters={mood:'',tags:'',themes:''}, facetTitles={mood:'Mood',tags:'Tag',themes:'Theme'};
  root.innerHTML=`<div class="journal-wrap"><header class="journal-hero"><div><span class="journal-kicker">THE QUIET COAST</span><h2 id="journal-heading">Journal</h2><p>Daily reflections, study notes, and crochet progress.</p></div><button id="journal-add" type="button"><span aria-hidden="true">+</span> New entry</button></header>
    <nav class="journal-views" aria-label="Journal views"><button type="button" data-journal-view="entries" aria-pressed="true">Entries</button>
      <button type="button" data-journal-view="patterns" aria-pressed="false">Patterns &amp; reflections</button></nav>
    <section class="journal-library" aria-labelledby="journal-library-title"><div class="journal-library-bar"><div><h3 id="journal-library-title">Your entries</h3><p id="journal-count"></p></div><label class="journal-search"><span class="sr-only">Search journal</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/></svg><input id="journal-search" type="search" placeholder="Search entries"></label></div>
      <div class="journal-filters">${Object.entries(facetTitles).map(([key,label])=>`<label>${label}<select data-journal-filter="${key}"></select></label>`).join('')}
        <button type="button" id="journal-clear-filters">Clear filters</button></div><div id="journal-entries"></div></section>
    <section class="journal-library" id="journal-patterns" aria-labelledby="journal-patterns-title" hidden></section></div><dialog id="journal-dialog"></dialog>`;
  const $=selector=>root.querySelector(selector);
  const dialog=$('#journal-dialog'), add=$('#journal-add');
  root.parentElement.append(dialog);
  function save(next,completed=true){
    try{storage.setItem(JOURNAL_KEY,JSON.stringify(next));entries=next;}
    catch{notify('Could not save this journal entry on this device.');return false;}
    if(completed)onChange();
    return true;
  }
  function render(){
    if(view==='patterns'){if(!editingReflection)renderPatterns();return;}
    const facets=journalFacets(entries);
    for(const select of root.querySelectorAll('[data-journal-filter]')){
      const key=select.dataset.journalFilter;
      if(filters[key]&&!facets[key].some(item=>item.key===filters[key]))filters[key]='';
      select.innerHTML=`<option value="">Any ${facetTitles[key].toLowerCase()}</option>`+facets[key].map(item=>
        `<option value="${esc(item.key)}">${esc(item.label)} (${item.count})</option>`).join('');
      select.value=filters[key];
    }
    const filtered=query||Object.values(filters).some(Boolean);
    $('#journal-clear-filters').disabled=!filtered;
    const items=matchingJournal(entries,query,filters)
      .sort((a,b)=>b.date.localeCompare(a.date)||(b.updatedAt||0)-(a.updatedAt||0));
    const names=new Map(projects().map(project=>[project.id,project.name]));
    $('#journal-count').textContent=filtered?`${items.length} of ${entries.length}`:`${entries.length} ${entries.length===1?'entry':'entries'}`;
    $('#journal-entries').innerHTML=items.map(item=>`<article class="journal-entry"><div><time datetime="${esc(item.date)}">${esc(new Date(item.date+'T12:00:00').toLocaleDateString([],{dateStyle:'long'}))}</time>
      ${item.draft?'<span>Draft</span>':''}${item.mood?`<span>${esc(item.mood)}</span>`:''}${names.has(item.projectId)?`<span>${esc(names.get(item.projectId))}</span>`:''}
      ${(item.tags||[]).map(label=>`<span>#${esc(label)}</span>`).join('')}${(item.themes||[]).map(label=>`<span class="journal-theme-label">Theme · ${esc(label)}</span>`).join('')}</div>
      <h4><button type="button" data-journal-edit="${esc(item.id)}">${esc(item.title||(item.draft?'Untitled draft':''))}</button></h4><p>${esc(item.body)}</p>${linkedNotes(item.id)}</article>`).join('')||`<p class="journal-empty">${filtered?'No entries match these filters.':'Your reflections will appear here.'}</p>`;
  }
  function setView(next){
    view=next;editingReflection=false;
    $('.journal-library[aria-labelledby="journal-library-title"]').hidden=next!=='entries';
    $('#journal-patterns').hidden=next!=='patterns';
    for(const button of root.querySelectorAll('[data-journal-view]'))button.setAttribute('aria-pressed',String(button.dataset.journalView===next));
    render();
  }
  function renderPatterns(){
    const records=getReflections(),reflection=records.find(item=>item.week===week);
    const date=new Date(week+'T12:00:00'),end=new Date(date);
    end.setDate(end.getDate()+6);
    const short=value=>value.toLocaleDateString([],{month:'short',day:'numeric'});
    const period=`${short(date)} – ${short(end)}, ${end.getFullYear()}`;
    const items=entriesInWeek(entries,week);
    const linked=(reflection?.entryIds||[]).map(id=>({id,entry:entries.find(item=>item.id===id&&!item.draft)}));
    const itemIds=new Set(items.map(item=>item.id));
    const choices=[...items,...linked.flatMap(({id,entry})=>itemIds.has(id)?[]:[entry||{id,title:'Unavailable entry'}])];
    const summary=journalFacets(items);
    const saved=records.length?`<label class="journal-saved-reflections">Saved reflections<select id="journal-saved-week">
      <option value="">Choose a week</option>${[...records].sort((a,b)=>b.week.localeCompare(a.week)).map(item=>`<option value="${esc(item.week)}" ${item.week===week?'selected':''}>Week of ${esc(short(new Date(item.week+'T12:00:00')))}, ${esc(item.week.slice(0,4))}</option>`).join('')}</select></label>`:'';
    const links=list=>list.map(({entry})=>`<li>${entry?`<button type="button" data-journal-edit="${esc(entry.id)}">${esc(entry.title)}</button><small>${esc(short(new Date(entry.date+'T12:00:00')))}</small>`:'<span>Unavailable entry</span>'}</li>`).join('');
    const facets=Object.entries(summary).filter(([,values])=>values.length).map(([key,values])=>`<div>
      <strong>${facetTitles[key]}</strong><ul>${values.map(value=>`<li><button type="button" data-pattern-filter="${key}" data-pattern-value="${esc(value.key)}">${esc(value.label)} <span>${value.count}</span></button></li>`).join('')}</ul></div>`).join('');
    $('#journal-patterns').innerHTML=`<header class="journal-patterns-heading"><div><h3 id="journal-patterns-title">Weekly reflection</h3><p>${esc(period)} · ${items.length} completed ${items.length===1?'entry':'entries'}</p></div>
      <div class="journal-week-nav" aria-label="Reflection week"><button type="button" data-journal-week="-1" aria-label="Previous week">‹</button>
      <button type="button" data-journal-week="0">This week</button><button type="button" data-journal-week="1" aria-label="Next week" ${week>=journalWeek(dayKey())?'disabled':''}>›</button></div></header>
      ${saved}
      ${facets?`<div class="journal-facets" aria-label="Labels used this week">${facets}</div>`:''}
      ${editingReflection?`<form id="journal-reflection-form"><label>Reflection<textarea name="body" maxlength="12000" rows="6" required placeholder="What kept coming up this week?">${esc(reflection?.body)}</textarea></label>
        ${choices.length?`<fieldset><legend>Link entries</legend>${choices.map(entry=>`<label><input type="checkbox" name="entry" value="${esc(entry.id)}" ${reflection?.entryIds.includes(entry.id)?'checked':''}> <span>${esc(entry.title)}${entry.date?` <small>· ${esc(short(new Date(entry.date+'T12:00:00')))}</small>`:''}</span></label>`).join('')}</fieldset>`:''}
        <div class="journal-reflection-actions"><button type="submit">Save reflection</button><button type="button" data-journal-reflection="cancel">Cancel</button></div>
        <p id="journal-reflection-error" role="alert" hidden></p></form>`:`<div class="journal-reflection-copy">
        ${reflection?`<p>${esc(reflection.body)}</p>`:''}
        ${linked.length?`<h4>Referenced entries</h4><ul class="journal-week-entries">${links(linked)}</ul>`:''}
        <button type="button" data-journal-reflection="edit">${reflection?'Edit reflection':'Write reflection'}</button></div>`}
      ${items.length&&!editingReflection?`<details class="journal-week-list"><summary>All entries this week</summary><ul class="journal-week-entries">${links(items.map(entry=>({entry})))}</ul></details>`:''}`;
  }
  let anchor, returnFocus;
  function templateOptions(){
    return '<option value="">Blank entry</option>'+[...builtInTemplates,...getTemplates()].map(template=>
      `<option value="${esc(template.id)}">${esc(template.name)}</option>`).join('');
  }
  function open(item,trigger,date=dayKey(),restore){
    if(item&&!item.draft)item=entries.find(entry=>entry.draftFor===item.id)||item;
    anchor=trigger;
    returnFocus=restore;
    const draftId=item?.draft?item.id:crypto.randomUUID();
    const entryId=item?.draft?item.draftFor:item?.id;
    dialog.innerHTML=`<form data-entry-id="${esc(entryId)}" data-draft-id="${esc(draftId)}" data-date="${esc(item?.date||date)}"><header>
      <h3 id="journal-editor-title" class="sr-only">${item?'Edit entry':'New entry'}</h3>
      <label class="journal-title-field"><span class="sr-only">Title</span><input class="journal-title" name="title" required maxlength="120" value="${esc(item?.title)}" placeholder="Entry title"></label>
      <button type="button" data-journal-close aria-label="Close journal editor">×</button>
      </header>
      <div class="journal-fields"><label>Date<input name="date" type="date" required value="${esc(item?.date||date)}"></label>
      <label>Mood<select name="mood"><option value="">Optional</option>${moods.map(mood=>`<option ${item?.mood===mood?'selected':''}>${mood}</option>`).join('')}</select></label>
      <label>Crochet project<select name="projectId"><option value="">General journal</option>${projects().map(project=>`<option value="${esc(project.id)}" ${project.id===item?.projectId?'selected':''}>${esc(project.name)}</option>`).join('')}</select></label>
      <label>Tags<input name="tags" maxlength="840" placeholder="Study, studio" value="${esc(item?.tags?.join(', '))}"></label>
      <label>Themes<input name="themes" maxlength="840" placeholder="Finding momentum" value="${esc(item?.themes?.join(', '))}"></label>
      ${entryId?'':`<div class="journal-template-controls"><label>Template<select id="journal-template">${templateOptions()}</select></label>
        <button type="button" data-journal-template="apply" disabled>Insert template</button>
        <button type="button" data-journal-template="remove" hidden>Remove template</button>
        <details><summary>Save as template</summary><label>Template name<input id="journal-template-name" maxlength="80"></label>
          <button type="button" data-journal-template="save">Save current text as template</button></details></div>`}</div>
      <label class="journal-writing"><span class="sr-only">Entry</span><textarea name="body" placeholder="What stayed with you today?" required>${esc(item?.body)}</textarea></label>
      <div><p id="journal-error" role="alert" hidden></p><footer><span id="journal-word-count"></span><span id="journal-draft-status" role="status">${item?.draft?'Draft saved':''}</span><button type="submit" value="save">${entryId?'Save completed entry':'Mark complete'}</button><button type="submit" value="delete" formnovalidate ${item?'':'hidden'}>${item?.draft?'Discard draft':'Delete entry'}</button></footer></div></form>`;
    const body=dialog.querySelector('[name="body"]');
    const updateWordCount=()=>{
      const count=body.value.match(/\S+/g)?.length||0;
      dialog.querySelector('#journal-word-count').textContent=`${count} ${count===1?'word':'words'}`;
    };
    dialog.querySelector('form').addEventListener('input',event=>{
      if(!event.target.name)return;
      if(event.target===body)updateWordCount();
      const form=event.currentTarget,data=new FormData(form);
      const record={id:draftId,draft:true,draftFor:entryId||'',title:data.get('title'),body:data.get('body'),
        date:data.get('date')||form.dataset.date,mood:data.get('mood'),projectId:data.get('projectId'),
        tags:journalLabels(data.get('tags')),themes:journalLabels(data.get('themes')),updatedAt:Date.now()};
      const next=loadJournal(storage).filter(entry=>entry.id!==draftId);
      next.push(record);
      const status=dialog.querySelector('#journal-draft-status');
      if(save(next,false)){
        if(status.textContent!=='Draft saved')status.textContent='Draft saved';
        const discard=form.querySelector('[value="delete"]');
        discard.hidden=false;discard.textContent='Discard draft';delete discard.dataset.confirm;
      }
      else status.textContent='Draft could not be saved';
    });
    updateWordCount();
    dialog.setAttribute('aria-labelledby','journal-editor-title');
    dialog.showModal();
    (item?body:dialog.querySelector('[name="title"]')).focus();
  }
  add.onclick=()=>open(null,add);
  $('#journal-search').oninput=event=>{query=event.target.value.trim().toLowerCase();render();};
  root.addEventListener('change',event=>{
    const field=event.target,filter=field.dataset.journalFilter;
    if(filter){filters[filter]=field.value;render();}
    if(field.id==='journal-saved-week'&&field.value){
      week=field.value;editingReflection=false;renderPatterns();$('#journal-saved-week')?.focus();
    }
  });
  root.addEventListener('click',event=>{
    const viewButton=event.target.closest('[data-journal-view]');
    if(viewButton){if(view!==viewButton.dataset.journalView)setView(viewButton.dataset.journalView);return;}
    if(event.target.closest('#journal-clear-filters')){
      for(const key of Object.keys(filters))filters[key]='';
      query='';$('#journal-search').value='';render();$('#journal-search').focus();return;
    }
    const facet=event.target.closest('[data-pattern-filter]');
    if(facet){
      for(const key of Object.keys(filters))filters[key]='';
      filters[facet.dataset.patternFilter]=facet.dataset.patternValue;
      query='';$('#journal-search').value='';setView('entries');
      $(`[data-journal-filter="${facet.dataset.patternFilter}"]`)?.focus();return;
    }
    const move=event.target.closest('[data-journal-week]');
    if(move){
      const direction=Number(move.dataset.journalWeek);
      week=direction?journalWeek(week,direction):journalWeek(dayKey());editingReflection=false;renderPatterns();
      ($(`[data-journal-week="${direction}"]:not(:disabled)`)||$('[data-journal-week="0"]')).focus();return;
    }
    const reflection=event.target.closest('[data-journal-reflection]');
    if(reflection){
      editingReflection=reflection.dataset.journalReflection==='edit';renderPatterns();
      $(editingReflection?'#journal-reflection-form textarea':'[data-journal-reflection="edit"]')?.focus();return;
    }
    const edit=event.target.closest('[data-journal-edit]');
    if(edit){
      const id=edit.dataset.journalEdit,item=entries.find(entry=>entry.id===id);
      const inWeekList=Boolean(edit.closest('.journal-week-list'));
      if(item)open(item,edit,undefined,view==='patterns'?()=>{
        const list=$('.journal-week-list');
        if(inWeekList&&list)list.open=true;
        const target=(inWeekList?list:$('.journal-reflection-copy'))?.querySelector(`[data-journal-edit="${CSS.escape(id)}"]`);
        (target||$('[data-journal-reflection="edit"]'))?.focus({preventScroll:true});
      }:undefined);
    }
  });
  root.addEventListener('submit',event=>{
    if(event.target.id!=='journal-reflection-form')return;
    event.preventDefault();
    const data=new FormData(event.target);
    const record=weeklyReflection({week,body:data.get('body'),entryIds:data.getAll('entry'),updatedAt:Date.now()});
    if(!record||!saveReflection(record)){
      const error=$('#journal-reflection-error');error.textContent=record?'Could not save this reflection.':'Write a reflection before saving.';error.hidden=false;return;
    }
    editingReflection=false;renderPatterns();$('[data-journal-reflection="edit"]').focus();
    notify('Weekly reflection saved.');
  });
  function updateTemplateControls(){
    const id=dialog.querySelector('#journal-template').value;
    dialog.querySelector('[data-journal-template="apply"]').disabled=!id;
    dialog.querySelector('[data-journal-template="remove"]').hidden=!getTemplates().some(template=>template.id===id);
  }
  dialog.addEventListener('change',event=>{if(event.target.id==='journal-template')updateTemplateControls();});
  dialog.addEventListener('click',event=>{
    if(event.target.closest('[data-journal-close]')){dialog.close();return;}
    const action=event.target.closest('[data-journal-template]')?.dataset.journalTemplate;
    if(!action)return;
    const picker=dialog.querySelector('#journal-template'),body=dialog.querySelector('[name="body"]');
    const error=dialog.querySelector('#journal-error');
    error.hidden=true;
    if(action==='apply'){
      const template=[...builtInTemplates,...getTemplates()].find(item=>item.id===picker.value);
      if(!template)return;
      body.value=body.value.trim()?body.value.trimEnd()+'\n\n'+template.body:template.body;
      body.dispatchEvent(new Event('input',{bubbles:true}));body.focus();return;
    }
    if(action==='remove'){
      if(saveTemplates(getTemplates().filter(template=>template.id!==picker.value))){
        picker.innerHTML=templateOptions();updateTemplateControls();picker.focus();notify('Journal template removed.');
      }
      return;
    }
    const name=dialog.querySelector('#journal-template-name').value.trim(),text=body.value.trim();
    if(!name||!text||text.length>6000){
      error.textContent='Enter a template name and up to 6,000 characters of journal text.';error.hidden=false;return;
    }
    const template={id:crypto.randomUUID(),name,body:text};
    if(saveTemplates([...getTemplates(),template])){
      picker.innerHTML=templateOptions();picker.value=template.id;updateTemplateControls();
      event.target.closest('details').open=false;picker.focus();notify('Journal template saved.');
    }
  });
  dialog.addEventListener('submit',event=>{
    event.preventDefault();
    const form=event.target,data=new FormData(form),draftId=form.dataset.draftId;
    const deleting=event.submitter?.value==='delete',latest=loadJournal(storage);
    const draft=latest.find(item=>item.id===draftId);
    const id=deleting&&draft?draftId:form.dataset.entryId||draftId;
    const previous=latest.find(item=>item.id===id);
    if(deleting&&event.submitter.dataset.confirm!=='true'){
      event.submitter.dataset.confirm='true';event.submitter.textContent=draft?'Confirm discard':'Confirm delete';return;
    }
    const title=String(data.get('title')).trim(),body=String(data.get('body')).trim();
    const error=dialog.querySelector('#journal-error');
    if(!deleting&&(!title||!body)){
      error.textContent='Enter a title and an entry.';error.hidden=false;return;
    }
    const next=latest.filter(item=>item.id!==id&&item.id!==draftId);
    if(!deleting)next.push({id,title,body,date:data.get('date'),mood:data.get('mood'),projectId:data.get('projectId'),
      tags:journalLabels(data.get('tags')),themes:journalLabels(data.get('themes')),updatedAt:Date.now()});
    if(!save(next)){
      error.textContent='Storage is unavailable. Keep this editor open to copy your entry.';error.hidden=false;return;
    }
    dialog.close();render();
    notify(deleting?(previous?.draft?'Journal draft discarded.':'Journal entry deleted.'):'Journal entry completed.',deleting&&previous?()=>{
      const latest=loadJournal(storage);
      if(latest.some(item=>item.id===id)||!save([...latest,previous]))return false;
      render();return true;
    }:null);
  });
  dialog.addEventListener('close',()=>{
    render();
    if(returnFocus)returnFocus();
    else (anchor?.isConnected?anchor:add).focus({preventScroll:true});
  });
  window.addEventListener('storage',event=>{if(event.key===JOURNAL_KEY||event.key===null){entries=loadJournal(storage);render();onChange();}});
  new MutationObserver(()=>{if(!root.hidden)render();}).observe(root,{attributes:true,attributeFilter:['hidden']});
  render();
  return {
    openPatterns(){setView('patterns');$('[data-journal-view="patterns"]').focus();},
    refresh:render,
    openEntry(id){
      const item=entries.find(entry=>entry.id===id);
      if(item)open(item,root.querySelector(`[data-journal-edit="${CSS.escape(id)}"]`)||add);
    },
    completedAt(date){
      return entries.reduce((latest,item)=>!item.draft&&item.date===date?Math.max(latest,item.updatedAt||1):latest,0);
    },
    openDate(date,restore){
      const item=entries.filter(entry=>entry.date===date).sort((a,b)=>Number(Boolean(b.draft))-Number(Boolean(a.draft))||(b.updatedAt||0)-(a.updatedAt||0))[0];
      open(item,add,date,restore);
    }
  };
}
