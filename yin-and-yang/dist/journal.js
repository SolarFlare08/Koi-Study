import {dayKey} from './state.js';
const key='yin-and-yang.journal.v1';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const moods=['Calm','Energized','Steady','Tired','Overwhelmed'];
function read(storage){
  try{
    const items=JSON.parse(storage.getItem(key));
    return Array.isArray(items)?items.filter(item=>typeof item?.id==='string'&&typeof item.title==='string'&&typeof item.body==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)):[];
  }catch{return [];}
}
export function installJournal({root,storage,projects,notify}){
  let entries=read(storage),query='';
  root.innerHTML=`<div class="journal-wrap"><header><div><span>YIN AND YANG</span><h2 id="journal-heading">Journal</h2><p>Daily reflections, study notes, and crochet progress.</p></div><button id="journal-add" type="button">New entry</button></header>
    <label class="sr-only" for="journal-search">Search journal</label><input id="journal-search" type="search" placeholder="Search your journal…"><div id="journal-entries"></div></div><dialog id="journal-dialog"></dialog>`;
  const $=selector=>root.querySelector(selector);
  const dialog=$('#journal-dialog'), add=$('#journal-add');
  function save(next){
    try{storage.setItem(key,JSON.stringify(next));entries=next;return true;}
    catch{notify('Could not save this journal entry on this device.');return false;}
  }
  function render(){
    const items=entries.filter(item=>`${item.title} ${item.body} ${item.mood||''}`.toLowerCase().includes(query))
      .sort((a,b)=>b.date.localeCompare(a.date)||(b.updatedAt||0)-(a.updatedAt||0));
    const names=new Map(projects().map(project=>[project.id,project.name]));
    $('#journal-entries').innerHTML=items.map(item=>`<article class="journal-entry"><div><time datetime="${esc(item.date)}">${esc(new Date(item.date+'T12:00:00').toLocaleDateString([],{dateStyle:'long'}))}</time>
      ${item.mood?`<span>${esc(item.mood)}</span>`:''}${names.has(item.projectId)?`<span>${esc(names.get(item.projectId))}</span>`:''}</div>
      <h3><button type="button" data-journal-edit="${esc(item.id)}">${esc(item.title)}</button></h3><p>${esc(item.body)}</p></article>`).join('')||`<p class="journal-empty">${query?'No entries match your search.':'No entries yet. Use New entry to start.'}</p>`;
  }
  let anchor;
  function open(item,trigger){
    anchor=trigger;
    dialog.innerHTML=`<form data-entry-id="${esc(item?.id)}"><header><h3 id="journal-editor-title">${item?'Edit entry':'New entry'}</h3><button type="button" data-journal-close aria-label="Close journal editor">×</button></header>
      <label>Title<input name="title" required maxlength="120" value="${esc(item?.title)}"></label>
      <div class="journal-fields"><label>Date<input name="date" type="date" required value="${item?.date||dayKey()}"></label>
      <label>Mood<select name="mood"><option value="">Optional</option>${moods.map(mood=>`<option ${item?.mood===mood?'selected':''}>${mood}</option>`).join('')}</select></label></div>
      <label>Crochet project<select name="projectId"><option value="">General journal</option>${projects().map(project=>`<option value="${esc(project.id)}" ${project.id===item?.projectId?'selected':''}>${esc(project.name)}</option>`).join('')}</select></label>
      <label>Entry<textarea name="body" rows="6" maxlength="15000" required>${esc(item?.body)}</textarea></label>
      <p id="journal-error" role="alert" hidden></p><footer>${item?'<button type="submit" value="delete" formnovalidate>Delete entry</button>':''}<button type="submit" value="save">Save entry</button></footer></form>`;
    dialog.setAttribute('aria-labelledby','journal-editor-title');
    dialog.showModal();
    dialog.querySelector('[name="title"]').focus();
  }
  add.onclick=()=>open(null,add);
  $('#journal-search').oninput=event=>{query=event.target.value.trim().toLowerCase();render();};
  root.addEventListener('click',event=>{
    const edit=event.target.closest('[data-journal-edit]');
    if(edit){const item=entries.find(entry=>entry.id===edit.dataset.journalEdit);if(item)open(item,edit);}
    if(event.target.closest('[data-journal-close]'))dialog.close();
  });
  dialog.addEventListener('submit',event=>{
    event.preventDefault();
    const form=event.target,data=new FormData(form),id=form.dataset.entryId||crypto.randomUUID();
    const deleting=event.submitter?.value==='delete',previous=entries.find(item=>item.id===id);
    if(deleting&&event.submitter.dataset.confirm!=='true'){
      event.submitter.dataset.confirm='true';event.submitter.textContent='Confirm delete';return;
    }
    const title=String(data.get('title')).trim(),body=String(data.get('body')).trim();
    if(!deleting&&(!title||!body)){
      $('#journal-error').textContent='Enter a title and an entry.';$('#journal-error').hidden=false;return;
    }
    const next=entries.filter(item=>item.id!==id);
    if(!deleting)next.push({id,title,body,date:data.get('date'),mood:data.get('mood'),projectId:data.get('projectId'),updatedAt:Date.now()});
    if(!save(next)){
      $('#journal-error').textContent='Storage is unavailable. Keep this editor open to copy your entry.';$('#journal-error').hidden=false;return;
    }
    dialog.close();render();add.focus({preventScroll:true});
    notify(deleting?'Journal entry deleted.':'Journal entry saved.',deleting&&previous?()=>{
      const latest=read(storage);
      if(latest.some(item=>item.id===id)||!save([...latest,previous]))return false;
      render();return true;
    }:null);
  });
  dialog.addEventListener('close',()=>{if(anchor?.isConnected)anchor.focus({preventScroll:true});});
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null){entries=read(storage);render();}});
  new MutationObserver(()=>{if(!root.hidden)render();}).observe(root,{attributes:true,attributeFilter:['hidden']});
  render();
}
