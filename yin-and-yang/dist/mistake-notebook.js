const clean=(value,limit)=>typeof value==='string'?value.trim().slice(0,limit):'';
export function mistakeEntry(value){
  const id=clean(value?.id,100), taskId=clean(value?.taskId,160), examId=clean(value?.examId,100), topicId=clean(value?.topicId,100);
  const mistake=clean(value?.mistake,1600), correction=clean(value?.correction,2400);
  if(!id||!mistake||!correction||!Number.isFinite(value.createdAt)||(!taskId&&!examId)||examId&&!topicId)return null;
  const retries=(Array.isArray(value.retries)?value.retries:[]).filter(item=>Number.isFinite(item?.at)&&typeof item.passed==='boolean')
    .map(({at,passed})=>({at,passed})).sort((a,b)=>a.at-b.at);
  return {id,taskId,examId,topicId,source:clean(value.source,300),mistake,correction,createdAt:value.createdAt,retries};
}
export function loadMistakes(value){
  const items=new Map();
  for(const raw of Array.isArray(value)?value:[]){
    const item=mistakeEntry(raw);
    if(item&&!items.has(item.id))items.set(item.id,item);
  }
  return [...items.values()];
}
export function needsRetry(item){return item.retries.at(-1)?.passed!==true;}

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const dateLabel=at=>new Date(at).toLocaleDateString([],{dateStyle:'medium'});

export function installMistakeNotebook({dialog,getState,save,notify}){
  let scope={}, trigger, mode='review', editId='', revealed=new Set();
  const matching=()=>getState().mistakes.filter(item=>scope.taskId?item.taskId===scope.taskId:
    scope.examId?item.examId===scope.examId:true);
  function source(item){
    const state=getState();
    const task=state.tasks.find(task=>task.id===item.taskId);
    const exam=state.projects.flatMap(project=>project.exams||[]).find(exam=>exam.id===item.examId);
    const topic=exam?.topics.find(topic=>topic.id===item.topicId);
    return task?.text||(exam&&topic?`${exam.title} · ${topic.title}`:item.source)||'Saved mistake';
  }
  function render(){
    const entries=matching(), item=entries.find(item=>item.id===editId);
    const reviewing=mode==='review';
    const visible=entries.filter(entry=>!reviewing||needsRetry(entry)).sort((a,b)=>b.createdAt-a.createdAt);
    const exam=getState().projects.flatMap(project=>project.exams||[]).find(exam=>exam.id===scope.examId);
    const choices=exam?.topics||[];
    const mayAdd=Boolean(scope.taskId||choices.length);
    dialog.innerHTML=`<header><div>${scope.title?`<small>${escape(scope.title)}</small>`:''}<h2 id="mistake-title">Mistake notebook</h2></div>
      <button type="button" data-mistake-close aria-label="Close mistake notebook">×</button></header>
      <div class="mistake-tabs" role="group" aria-label="Mistake view">
        <button type="button" data-mistake-mode="review" aria-pressed="${reviewing}">To retry · ${entries.filter(needsRetry).length}</button>
        <button type="button" data-mistake-mode="all" aria-pressed="${!reviewing}">All · ${entries.length}</button>
      </div>
      ${item||mayAdd?`<details class="mistake-editor" ${item?'open':''}><summary>${item?'Edit mistake':'Log a mistake'}</summary>
        <form id="mistake-form">
          ${scope.examId&&!item?`<label>Exam topic<select name="topicId" required>${choices.map(topic=>`<option value="${escape(topic.id)}">${escape(topic.title)}</option>`).join('')}</select></label>`:''}
          <label>What went wrong<textarea name="mistake" rows="2" maxlength="1600" required>${escape(item?.mistake)}</textarea></label>
          <label>Corrected reasoning<textarea name="correction" rows="3" maxlength="2400" required>${escape(item?.correction)}</textarea></label>
          <div class="mistake-actions"><button class="workspace-primary">${item?'Save changes':'Save mistake'}</button>
          ${item?'<button type="button" data-mistake-cancel>Cancel</button>':''}</div><p role="alert" id="mistake-error"></p>
        </form></details>`:scope.examId?'<p>Add and save an exam topic before logging a mistake.</p>':''}
      ${visible.length?`<ul class="mistake-list">${visible.map(entry=>{
        const show=revealed.has(entry.id);
        const last=entry.retries.at(-1);
        return `<li data-mistake-id="${escape(entry.id)}"><div class="mistake-source"><strong>${escape(source(entry))}</strong>
          <small>${last?last.passed?'Retried successfully':'Retry again':'Needs retry'} · ${dateLabel(last?.at??entry.createdAt)}</small></div>
          <p class="mistake-text">${escape(entry.mistake)}</p>
          ${show?`<div class="mistake-correction"><strong>Corrected reasoning</strong><p class="mistake-text">${escape(entry.correction)}</p></div>`:''}
          <div class="mistake-actions"><button type="button" data-mistake-reveal aria-expanded="${show}">${show?'Hide reasoning':'Reveal reasoning'}</button>
            ${show?`<button type="button" data-mistake-retry="passed">Solved it</button><button type="button" data-mistake-retry="failed">Still stuck</button>`:''}
            <button type="button" data-mistake-edit>Edit</button></div></li>`;
      }).join('')}</ul>`:`<p>${reviewing?'No mistakes waiting for a retry.':'No mistakes logged here yet.'}</p>`}`;
  }
  function restoreFocus(){
    dialog.querySelector('[data-mistake-mode][aria-pressed="true"]')?.focus({preventScroll:true});
  }
  dialog.addEventListener('submit',event=>{
    if(event.target.id!=='mistake-form')return;
    event.preventDefault();
    const fields=Object.fromEntries(new FormData(event.target));
    const entries=getState().mistakes, old=entries.find(item=>item.id===editId);
    const base=old||{id:crypto.randomUUID(),createdAt:Date.now(),taskId:scope.taskId,examId:scope.examId,topicId:fields.topicId};
    const item=mistakeEntry({...base,mistake:fields.mistake,correction:fields.correction,source:old?.source||source(base)});
    if(!item){dialog.querySelector('#mistake-error').textContent='Enter both the mistake and the corrected reasoning.';return;}
    if(!save(old?entries.map(entry=>entry===old?item:entry):[...entries,item]))return;
    editId='';render();restoreFocus();notify('Mistake saved.');
  });
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    const {mistakeMode:next,mistakeRetry:retry}=button.dataset;
    if(button.hasAttribute('data-mistake-close')){dialog.close();return;}
    if(next){mode=next;editId='';render();restoreFocus();return;}
    if(button.hasAttribute('data-mistake-cancel')){editId='';render();restoreFocus();return;}
    const id=button.closest('[data-mistake-id]')?.dataset.mistakeId;
    if(!id)return;
    if(button.hasAttribute('data-mistake-reveal')){
      if(revealed.has(id))revealed.delete(id);else revealed.add(id);
      render();dialog.querySelector(`[data-mistake-id="${CSS.escape(id)}"] [data-mistake-reveal]`)?.focus({preventScroll:true});return;
    }
    if(button.hasAttribute('data-mistake-edit')){
      editId=id;render();dialog.querySelector('#mistake-form textarea')?.focus();return;
    }
    if(retry){
      const entries=getState().mistakes;
      if(!save(entries.map(item=>item.id===id?{...item,retries:[...item.retries,{at:Date.now(),passed:retry==='passed'}]}:item)))return;
      revealed.delete(id);render();restoreFocus();notify(retry==='passed'?'Marked as successfully retried.':'Kept in the retry queue.');
    }
  });
  dialog.addEventListener('close',()=>trigger?.focus({preventScroll:true}));
  return {open(context,anchor){
    scope=context;trigger=anchor;mode='review';editId='';revealed=new Set();
    render();if(!dialog.open)dialog.showModal();
    dialog.scrollTop=0;restoreFocus();
  }};
}
