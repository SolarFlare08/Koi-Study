import {dayKey} from './state.js';
import {validReadingDay} from './reading-progress.js';
import {entriesInWeek,journalAnniversaries,journalFacets,journalLabels,journalWeek,matchingJournal,weeklyReflection} from './journal-patterns.js';
export const JOURNAL_KEY='yin-and-yang.journal.v1';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const moods=['Calm','Energized','Steady','Tired','Overwhelmed'];
const journalDate=day=>new Date(day+'T12:00:00').toLocaleDateString([],{dateStyle:'medium'});
const builtInTemplates=[
  {id:'reflection',name:'Daily reflection',body:'What went well?\n\nWhat got in the way?\n\nWhat will I try tomorrow?'},
  {id:'study',name:'Study recap',body:'What did I learn?\n\nWhat still needs practice?\n\nWhat will I study next?'}
];
function draftCursor(cursor,length){
  if(!Number.isInteger(cursor?.start)||!Number.isInteger(cursor?.end))return null;
  const start=Math.max(0,Math.min(length,cursor.start));
  return {start,end:Math.max(start,Math.min(length,cursor.end)),
    direction:['forward','backward'].includes(cursor.direction)?cursor.direction:'none',
    scrollTop:Number.isFinite(cursor.scrollTop)?Math.max(0,cursor.scrollTop):0};
}
export function loadJournal(storage){
  try{
    const items=JSON.parse(storage.getItem(JOURNAL_KEY));
    return Array.isArray(items)?items.filter(item=>typeof item?.id==='string'&&typeof item.title==='string'&&typeof item.body==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.date))
      .map(item=>({...item,...(item.mood!==undefined&&typeof item.mood!=='string'?{mood:''}:{}),
        ...(item.margins===undefined?{}:{margins:(Array.isArray(item.margins)?item.margins:[]).filter(n=>typeof n?.quote==='string'&&typeof n.reply==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(n.day))}),
        ...(item.futureQuestions===undefined?{}:{futureQuestions:(Array.isArray(item.futureQuestions)?item.futureQuestions:[]).filter(q=>
          typeof q?.id==='string'&&typeof q.quote==='string'&&typeof q.question==='string'&&validReadingDay(q.revisit))}),
        ...(item.tags===undefined?{}:{tags:journalLabels(item.tags)}),...(item.themes===undefined?{}:{themes:journalLabels(item.themes)})})):[];
  }catch{return [];}
}
export function installJournal({root,storage,storageEvent=key=>key,projects,notify,onChange,getTemplates=()=>[],saveTemplates=()=>false,linkedNotes=()=>'',getReflections,saveReflection}){
  let entries=loadJournal(storage),query='',view='entries',week=journalWeek(dayKey()),editingReflection=false;
  const filters={mood:'',tags:'',themes:''}, facetTitles={mood:'Mood',tags:'Tag',themes:'Theme'};
  root.innerHTML=`<div class="journal-wrap"><header class="journal-hero"><div><span class="journal-kicker">THE QUIET COAST</span><h2 id="journal-heading">Journal</h2><p>Daily reflections, study notes, and crochet progress.</p></div><button id="journal-add" type="button"><span aria-hidden="true">+</span> New entry</button></header>
    <nav class="journal-views" aria-label="Journal views"><button type="button" data-journal-view="entries" aria-pressed="true">Entries</button>
      <button type="button" data-journal-view="patterns" aria-pressed="false">Patterns &amp; reflections</button>
      <button type="button" data-journal-view="future" aria-pressed="false">Future questions</button>
      <button type="button" data-journal-view="anniversaries" aria-pressed="false">Past years</button></nav>
    <section class="journal-library" aria-labelledby="journal-library-title"><div class="journal-library-bar"><div><h3 id="journal-library-title">Your entries</h3><p id="journal-count"></p></div><label class="journal-search"><span class="sr-only">Search journal</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/></svg><input id="journal-search" type="search" placeholder="Search entries"></label></div>
      <div class="journal-filters">${Object.entries(facetTitles).map(([key,label])=>`<label>${label}<select data-journal-filter="${key}"></select></label>`).join('')}
        <button type="button" id="journal-clear-filters">Clear filters</button></div><div id="journal-entries"></div></section>
    <section class="journal-library" id="journal-patterns" aria-labelledby="journal-patterns-title" hidden></section>
    <section class="journal-library" id="journal-future" aria-label="Questions for your future self" hidden></section>
    <section class="journal-library" id="journal-anniversaries" aria-labelledby="journal-anniversaries-title" hidden></section></div><dialog id="journal-dialog"></dialog>`;
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
    const today=dayKey();
    const pending=entries.filter(entry=>!entry.draft).flatMap(entry=>(entry.futureQuestions||[]).filter(q=>!q.answeredOn).map(q=>({entry,q})));
    const due=pending.filter(({q})=>q.revisit<=today).length;
    const futureTab=$('[data-journal-view="future"]'),tabLabel=due?'Future questions · '+due+' due':'Future questions';
    if(futureTab.textContent!==tabLabel)futureTab.textContent=tabLabel;
    if(view==='future'){
      $('#journal-future').innerHTML=pending.sort((a,b)=>a.q.revisit.localeCompare(b.q.revisit)).map(({entry,q})=>
        `<article class="journal-entry"><div><time datetime="${esc(q.revisit)}">${q.revisit<=today?'Ready to revisit':'Revisit '+journalDate(q.revisit)}</time></div>
          <h4>${esc(q.question)}</h4><p>${esc(q.quote)}</p><button type="button" data-journal-edit="${esc(entry.id)}">Open ${esc(entry.title)}</button>
          ${q.revisit<=today?`<button type="button" data-future-entry="${esc(entry.id)}" data-future-answer="${esc(q.id)}">Answer as margin note</button>`:''}</article>`).join('')||
        '<p class="journal-empty">Select a line in a completed entry, then use Margin notes to set a revisit date.</p>';
      return;
    }
    if(view==='patterns'){if(!editingReflection)renderPatterns();return;}
    if(view==='anniversaries'){renderAnniversaries();return;}
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
    $('#journal-anniversaries').hidden=next!=='anniversaries';
    $('#journal-future').hidden=next!=='future';
    for(const button of root.querySelectorAll('[data-journal-view]'))button.setAttribute('aria-pressed',String(button.dataset.journalView===next));
    render();
  }
  function answerFuture(entryId,questionId){
    const question=loadJournal(storage).find(entry=>entry.id===entryId)?.futureQuestions?.find(q=>q.id===questionId);
    if(!question||question.answeredOn||question.revisit>dayKey())return;
    const panel=document.createElement('dialog');
    panel.className='workspace-dialog study-companion';
    panel.setAttribute('aria-labelledby','future-answer-title');
    panel.innerHTML=`<header><h2 id="future-answer-title">Answer your past self</h2><button type="button" aria-label="Close">×</button></header>
      <blockquote>${esc(question.quote)}</blockquote><p>${esc(question.question)}</p>
      <form><label>Today’s response<textarea required maxlength="3000"></textarea></label>
      <button class="workspace-primary">Save margin note</button></form><p role="status"></p>`;
    document.body.append(panel);
    panel.querySelector('header button').onclick=()=>panel.close();
    panel.onclose=()=>panel.remove();
    panel.showModal();
    panel.querySelector('textarea').focus();
    panel.querySelector('form').onsubmit=event=>{
      event.preventDefault();
      const reply=panel.querySelector('textarea').value.trim();
      if(!reply)return;
      const latest=loadJournal(storage),entry=latest.find(item=>item.id===entryId);
      const stored=entry?.futureQuestions?.find(item=>item.id===questionId);
      if(!stored||stored.answeredOn||stored.revisit>dayKey()){
        panel.querySelector('[role=status]').textContent='This question is no longer ready to answer.';return;
      }
      const day=dayKey();
      stored.answeredOn=day;
      entry.margins=[...(entry.margins||[]),{day,quote:stored.quote,question:stored.question,reply}];
      if(save(latest,false)){
        panel.close();render();$('[data-journal-view="future"]').focus();notify('Answer saved as a margin note.');
      }
    };
  }
  function renderAnniversaries(){
    const groups=journalAnniversaries(entries,getReflections(),dayKey());
    const short=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'});
    $('#journal-anniversaries').innerHTML=`<h3 id="journal-anniversaries-title" tabindex="-1">This week in past years</h3>
      ${groups.length?groups.map(({year,week,reflection,entries})=>{
        const start=new Date(week+'T12:00:00'),end=new Date(start);
        end.setDate(end.getDate()+6);
        return `<section class="journal-anniversary"><header><div><h4>${year}</h4>
          <p>${esc(short.formatRange(start,end))}</p></div>
          ${reflection?`<button type="button" data-open-reflection-week="${esc(week)}">Open weekly reflection</button>`:''}</header>
          ${entries.map(entry=>`<article class="journal-entry"><div><time datetime="${esc(entry.date)}">${esc(short.format(new Date(entry.date+'T12:00:00')))}</time>
            ${entry.mood?`<span>${esc(entry.mood)}</span>`:''}</div>
            <h4><button type="button" data-journal-edit="${esc(entry.id)}">${esc(entry.title)}</button></h4>
            <p>${esc(entry.body.slice(0,480))}</p></article>`).join('')}</section>`;
      }).join(''):'<p class="journal-empty">No completed entries or weekly reflections from this week in past years yet.</p>'}`;
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
    $('#journal-patterns').innerHTML=`<header class="journal-patterns-heading"><div><h3 id="journal-patterns-title" tabindex="-1">Weekly reflection</h3><p>${esc(period)} · ${items.length} completed ${items.length===1?'entry':'entries'}</p></div>
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
  let anchor, returnFocus, flushDraftCursor;
  function templateOptions(){
    return '<option value="">Blank entry</option>'+[...builtInTemplates,...getTemplates()].map(template=>
      `<option value="${esc(template.id)}">${esc(template.name)}</option>`).join('');
  }
  function open(item,trigger,date=dayKey(),restore){
    flushDraftCursor?.();
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
      <label class="journal-writing"><span class="sr-only">Entry</span><textarea name="body" placeholder="What stayed with you today?" required></textarea></label>
      <div><p id="journal-error" role="alert" hidden></p><footer><span id="journal-word-count"></span><span id="journal-draft-status" role="status">${item?.draft?'Draft saved':''}</span>${entryId?'<button type="button" data-margin>Margin notes</button>':''}<button type="submit" value="save">${entryId?'Save completed entry':'Mark complete'}</button><button type="submit" value="delete" formnovalidate ${item?'':'hidden'}>${item?.draft?'Discard draft':'Delete entry'}</button></footer></div></form>`;
    const body=dialog.querySelector('[name="body"]');
    body.value=item?.body??'';
    const readCursor=()=>({start:body.selectionStart,end:body.selectionEnd,direction:body.selectionDirection,scrollTop:body.scrollTop});
    let cursorTimer;
    const saveCursor=()=>{
      clearTimeout(cursorTimer);
      const latest=loadJournal(storage);
      const draft=latest.find(entry=>entry.id===draftId&&entry.draft);
      if(!draft||draft.body!==body.value)return;
      const cursor=readCursor();
      if(JSON.stringify(cursor)===JSON.stringify(draft.cursor))return;
      save(latest.map(entry=>entry===draft?{...entry,cursor}:entry),false);
    };
    flushDraftCursor=saveCursor;
    const queueCursor=()=>{
      clearTimeout(cursorTimer);
      cursorTimer=setTimeout(saveCursor,150);
    };
    for(const type of ['select','keyup','pointerup','scroll'])body.addEventListener(type,queueCursor);
    const updateWordCount=()=>{
      const count=body.value.match(/\S+/g)?.length||0;
      dialog.querySelector('#journal-word-count').textContent=`${count} ${count===1?'word':'words'}`;
    };
    dialog.querySelector('form').addEventListener('input',event=>{
      if(!event.target.name)return;
      if(event.target===body)updateWordCount();
      const form=event.currentTarget,data=new FormData(form);
      const record={id:draftId,draft:true,draftFor:entryId||'',title:data.get('title'),body:body.value,cursor:readCursor(),
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
    if(item?.draft){
      const cursor=draftCursor(item.cursor,body.value.length);
      body.setSelectionRange(cursor?.start??body.value.length,cursor?.end??body.value.length,cursor?.direction);
      if(cursor)body.scrollTop=cursor.scrollTop;
    }
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
    const answer=event.target.closest('[data-future-answer]');
    if(answer){answerFuture(answer.dataset.futureEntry,answer.dataset.futureAnswer);return;}
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
    const savedWeek=event.target.closest('[data-open-reflection-week]');
    if(savedWeek){
      week=savedWeek.dataset.openReflectionWeek;setView('patterns');
      $('#journal-patterns-title').focus();return;
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
      }:view==='anniversaries'?()=>{
        ($('#journal-anniversaries').querySelector(`[data-journal-edit="${CSS.escape(id)}"]`)||$('#journal-anniversaries-title')).focus({preventScroll:true});
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
    if(event.target.closest('[data-margin]')){
      const form=dialog.querySelector('form'),field=form.elements.body;
      const quote=field.value.slice(field.selectionStart,field.selectionEnd).trim(),id=form.dataset.entryId;
      const notes=loadJournal(storage).find(entry=>entry.id===id)?.margins||[];
      const panel=document.createElement('dialog');panel.className='workspace-dialog study-companion';panel.setAttribute('aria-label','Journal margin notes');
      panel.innerHTML=`<header><h2>Margin notes</h2><button type="button" aria-label="Close">×</button></header>
        ${notes.map(n=>`<article><small>${esc(n.day)}</small><blockquote>${esc(n.quote)}</blockquote>${n.question?`<strong>${esc(n.question)}</strong>`:''}<p>${esc(n.reply)}</p></article>`).join('')}
        ${quote?`<form><blockquote>${esc(quote)}</blockquote><label>Today’s response<textarea required maxlength="3000"></textarea></label><button class="workspace-primary">Save margin note</button></form>
          <details><summary>Ask your future self</summary><form id="journal-future-form"><label>Question<textarea required maxlength="500"></textarea></label>
          <label>Revisit on<input type="date" min="${dayKey()}" required></label><button class="workspace-primary">Schedule question</button></form></details>`:'<p>Select a sentence in the entry, then open Margin notes to respond.</p>'}<p role="status"></p>`;
      document.body.append(panel);panel.querySelector('header button').onclick=()=>panel.close();
      panel.onclose=()=>panel.remove();panel.showModal();
      if(quote)panel.querySelector('form').onsubmit=e=>{
        e.preventDefault();const reply=panel.querySelector('textarea').value.trim();if(!reply)return;
        const latest=loadJournal(storage),entry=latest.find(item=>item.id===id);
        if(!entry||!entry.body.includes(quote)){panel.querySelector('[role=status]').textContent='Select a sentence from the saved entry.';return;}
        entry.margins=[...(entry.margins||[]),{day:dayKey(),quote,reply}];
        if(save(latest,false)){panel.close();notify('Margin note saved.');}else panel.querySelector('[role=status]').textContent='Could not save this response.';
      };
      if(quote)panel.querySelector('#journal-future-form').onsubmit=e=>{
        e.preventDefault();
        const question=e.target.querySelector('textarea').value.trim(),revisit=e.target.querySelector('input').value;
        const latest=loadJournal(storage),entry=latest.find(item=>item.id===id);
        const status=panel.querySelector('[role=status]');
        if(!entry||!entry.body.includes(quote)){status.textContent='Select a sentence from the saved entry.';return;}
        if(!question||!validReadingDay(revisit)||revisit<dayKey()){status.textContent='Enter a question and a revisit date.';return;}
        entry.futureQuestions=[...(entry.futureQuestions||[]),{id:crypto.randomUUID(),quote,question,revisit}];
        if(save(latest,false)){render();panel.close();notify('Question scheduled for '+journalDate(revisit)+'.');}
      };
      return;
    }
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
    if(!deleting)next.push({id,title,body,...(previous?.margins?{margins:previous.margins}:{}),
      ...(previous?.futureQuestions?{futureQuestions:previous.futureQuestions}:{}),date:data.get('date'),mood:data.get('mood'),projectId:data.get('projectId'),
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
    flushDraftCursor?.();
    flushDraftCursor=null;
    render();
    if(returnFocus)returnFocus();
    else (anchor?.isConnected?anchor:add).focus({preventScroll:true});
  });
  window.addEventListener('pagehide',()=>{if(dialog.open)flushDraftCursor?.();});
  window.addEventListener('storage',event=>{const key=storageEvent(event.key);if(key===JOURNAL_KEY||key===null){entries=loadJournal(storage);render();onChange();}});
  window.addEventListener('focus',()=>{if(!root.hidden)render();});
  new MutationObserver(()=>{if(!root.hidden)render();}).observe(root,{attributes:true,attributeFilter:['hidden']});
  render();
  return {
    openAnniversaries(){setView('anniversaries');$('#journal-anniversaries-title').focus();},
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
