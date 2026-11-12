import {dayKey} from './state.js';
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
    return Array.isArray(items)?items.filter(item=>typeof item?.id==='string'&&typeof item.title==='string'&&typeof item.body==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)):[];
  }catch{return [];}
}
export function installJournal({root,storage,projects,notify,onChange,getTemplates=()=>[],saveTemplates=()=>false,linkedNotes=()=>''}){
  let entries=loadJournal(storage),query='';
  root.innerHTML=`<div class="journal-wrap"><header class="journal-hero"><div><span class="journal-kicker">THE QUIET COAST</span><h2 id="journal-heading">Journal</h2><p>Daily reflections, study notes, and crochet progress.</p></div><button id="journal-add" type="button"><span aria-hidden="true">+</span> New entry</button></header>
    <section class="journal-library" aria-labelledby="journal-library-title"><div class="journal-library-bar"><div><h3 id="journal-library-title">Your entries</h3><p id="journal-count"></p></div><label class="journal-search"><span class="sr-only">Search journal</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/></svg><input id="journal-search" type="search" placeholder="Search entries"></label></div><div id="journal-entries"></div></section></div><dialog id="journal-dialog"></dialog>`;
  const $=selector=>root.querySelector(selector);
  const dialog=$('#journal-dialog'), add=$('#journal-add');
  root.parentElement.append(dialog);
  function save(next){
    try{storage.setItem(JOURNAL_KEY,JSON.stringify(next));entries=next;}
    catch{notify('Could not save this journal entry on this device.');return false;}
    onChange();
    return true;
  }
  function render(){
    const items=entries.filter(item=>`${item.title} ${item.body} ${item.mood||''}`.toLowerCase().includes(query))
      .sort((a,b)=>b.date.localeCompare(a.date)||(b.updatedAt||0)-(a.updatedAt||0));
    const names=new Map(projects().map(project=>[project.id,project.name]));
    $('#journal-count').textContent=query?`${items.length} of ${entries.length}`:`${entries.length} ${entries.length===1?'entry':'entries'}`;
    $('#journal-entries').innerHTML=items.map(item=>`<article class="journal-entry"><div><time datetime="${esc(item.date)}">${esc(new Date(item.date+'T12:00:00').toLocaleDateString([],{dateStyle:'long'}))}</time>
      ${item.mood?`<span>${esc(item.mood)}</span>`:''}${names.has(item.projectId)?`<span>${esc(names.get(item.projectId))}</span>`:''}</div>
      <h4><button type="button" data-journal-edit="${esc(item.id)}">${esc(item.title)}</button></h4><p>${esc(item.body)}</p>${linkedNotes(item.id)}</article>`).join('')||`<p class="journal-empty">${query?'No entries match your search.':'Your reflections will appear here.'}</p>`;
  }
  let anchor, returnFocus;
  function templateOptions(){
    return '<option value="">Blank entry</option>'+[...builtInTemplates,...getTemplates()].map(template=>
      `<option value="${esc(template.id)}">${esc(template.name)}</option>`).join('');
  }
  function open(item,trigger,date=dayKey(),restore){
    anchor=trigger;
    returnFocus=restore;
    dialog.innerHTML=`<form data-entry-id="${esc(item?.id)}"><header>
      <h3 id="journal-editor-title" class="sr-only">${item?'Edit entry':'New entry'}</h3>
      <label class="journal-title-field"><span class="sr-only">Title</span><input class="journal-title" name="title" required maxlength="120" value="${esc(item?.title)}" placeholder="Entry title"></label>
      <button type="button" data-journal-close aria-label="Close journal editor">×</button>
      </header>
      <div class="journal-fields"><label>Date<input name="date" type="date" required value="${esc(item?.date||date)}"></label>
      <label>Mood<select name="mood"><option value="">Optional</option>${moods.map(mood=>`<option ${item?.mood===mood?'selected':''}>${mood}</option>`).join('')}</select></label>
      <label>Crochet project<select name="projectId"><option value="">General journal</option>${projects().map(project=>`<option value="${esc(project.id)}" ${project.id===item?.projectId?'selected':''}>${esc(project.name)}</option>`).join('')}</select></label>
      ${item?'':`<div class="journal-template-controls"><label>Template<select id="journal-template">${templateOptions()}</select></label>
        <button type="button" data-journal-template="apply" disabled>Insert template</button>
        <button type="button" data-journal-template="remove" hidden>Remove template</button>
        <details><summary>Save as template</summary><label>Template name<input id="journal-template-name" maxlength="80"></label>
          <button type="button" data-journal-template="save">Save current text as template</button></details></div>`}</div>
      <label class="journal-writing"><span class="sr-only">Entry</span><textarea name="body" placeholder="What stayed with you today?" required>${esc(item?.body)}</textarea></label>
      <div><p id="journal-error" role="alert" hidden></p><footer><span id="journal-word-count"></span>${item?'<button type="submit" value="delete" formnovalidate>Delete entry</button>':''}<button type="submit" value="save">Save entry</button></footer></div></form>`;
    const body=dialog.querySelector('[name="body"]');
    const updateWordCount=()=>{
      const count=body.value.match(/\S+/g)?.length||0;
      dialog.querySelector('#journal-word-count').textContent=`${count} ${count===1?'word':'words'}`;
    };
    body.addEventListener('input',updateWordCount);
    updateWordCount();
    dialog.setAttribute('aria-labelledby','journal-editor-title');
    dialog.showModal();
    (item?body:dialog.querySelector('[name="title"]')).focus();
  }
  add.onclick=()=>open(null,add);
  $('#journal-search').oninput=event=>{query=event.target.value.trim().toLowerCase();render();};
  root.addEventListener('click',event=>{
    const edit=event.target.closest('[data-journal-edit]');
    if(edit){const item=entries.find(entry=>entry.id===edit.dataset.journalEdit);if(item)open(item,edit);}
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
      body.dispatchEvent(new Event('input'));body.focus();return;
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
    const form=event.target,data=new FormData(form),id=form.dataset.entryId||crypto.randomUUID();
    const deleting=event.submitter?.value==='delete',previous=entries.find(item=>item.id===id);
    if(deleting&&event.submitter.dataset.confirm!=='true'){
      event.submitter.dataset.confirm='true';event.submitter.textContent='Confirm delete';return;
    }
    const title=String(data.get('title')).trim(),body=String(data.get('body')).trim();
    const error=dialog.querySelector('#journal-error');
    if(!deleting&&(!title||!body)){
      error.textContent='Enter a title and an entry.';error.hidden=false;return;
    }
    const next=entries.filter(item=>item.id!==id);
    if(!deleting)next.push({id,title,body,date:data.get('date'),mood:data.get('mood'),projectId:data.get('projectId'),updatedAt:Date.now()});
    if(!save(next)){
      error.textContent='Storage is unavailable. Keep this editor open to copy your entry.';error.hidden=false;return;
    }
    dialog.close();render();
    notify(deleting?'Journal entry deleted.':'Journal entry saved.',deleting&&previous?()=>{
      const latest=loadJournal(storage);
      if(latest.some(item=>item.id===id)||!save([...latest,previous]))return false;
      render();return true;
    }:null);
  });
  dialog.addEventListener('close',()=>{
    if(returnFocus)returnFocus();
    else (anchor?.isConnected?anchor:add).focus({preventScroll:true});
  });
  window.addEventListener('storage',event=>{if(event.key===JOURNAL_KEY||event.key===null){entries=loadJournal(storage);render();onChange();}});
  new MutationObserver(()=>{if(!root.hidden)render();}).observe(root,{attributes:true,attributeFilter:['hidden']});
  render();
  return {
    openEntry(id){
      const item=entries.find(entry=>entry.id===id);
      if(item)open(item,root.querySelector(`[data-journal-edit="${CSS.escape(id)}"]`)||add);
    },
    completedAt(date){
      return entries.reduce((latest,item)=>item.date===date?Math.max(latest,item.updatedAt||1):latest,0);
    },
    openDate(date,restore){
      const item=entries.filter(entry=>entry.date===date).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0];
      open(item,add,date,restore);
    }
  };
}
