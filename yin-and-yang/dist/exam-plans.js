const clean=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
const confidence=['Not rated','Needs work','Getting there','Confident'];
const day=value=>{
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';
  const date=new Date(value+'T00:00:00Z');
  return Number.isFinite(+date)&&date.toISOString().slice(0,10)===value?value:'';
};
const unique=(value,load)=>{
  const items=new Map();
  for(const raw of Array.isArray(value)?value:[]){
    const item=load(raw);
    if(item&&!items.has(item.id))items.set(item.id,item);
  }
  return [...items.values()];
};
export function examPlan(value){
  const id=clean(value?.id,100), title=clean(value?.title,120);
  if(!id||!title)return null;
  const topics=unique(value.topics,item=>{
    const id=clean(item?.id,100), title=clean(item?.title,120);
    if(id&&title)return {id,title,confidence:Number.isInteger(item.confidence)&&confidence[item.confidence]?item.confidence:0};
  });
  const practice=unique(value.practice,item=>{
    const id=clean(item?.id,100), title=clean(item?.title,120), date=day(item?.date);
    if(id&&title&&date&&Number.isFinite(item.score)&&Number.isFinite(item.maximum)&&item.maximum>0&&item.score>=0&&item.score<=item.maximum)
      return {id,title,date,score:item.score,maximum:item.maximum};
  });
  const takenOn=day(value.result?.takenOn);
  return {id,title,date:day(value.date),topics,practice,
    result:takenOn?{takenOn,score:clean(value.result.score,100),reflection:clean(value.result.reflection,1000)}:null};
}
export function loadExamPlans(value){return unique(value,examPlan);}

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const dateLabel=date=>new Date(date+'T12:00:00').toLocaleDateString([],{dateStyle:'medium'});
export function installExamPlans({dialog,projects,today,save,openMistakes}){
  let projectId='', examId='', anchor;
  const project=()=>projects().find(item=>item.id===projectId);
  const active=()=>project()?.exams?.find(item=>item.id===examId);
  function render(focus){
    const owner=project();
    if(!owner){dialog.close();return;}
    const exam=active();
    const header=`<header><div><small>${escape(owner.name)}</small><h2 id="exam-dialog-title">${escape(exam?.title||'Exam prep')}</h2></div>
      <button type="button" data-exam-close aria-label="Close exam prep">×</button></header>`;
    if(!exam){
      dialog.innerHTML=header+`<ul class="exam-plan-list">${(owner.exams||[]).map(item=>`<li><button type="button" data-exam-open="${escape(item.id)}"><strong>${escape(item.title)}</strong>
        <small>${item.result?'Completed':item.date?`Scheduled ${dateLabel(item.date)}`:'No exam date'} · ${item.topics.filter(topic=>topic.confidence===3).length}/${item.topics.length} confident</small></button></li>`).join('')}</ul>
        <form data-exam-form="new"><h3>Add an exam</h3><label>Exam name<input name="title" maxlength="120" required></label>
        <label>Exam date <span>(optional)</span><input name="date" type="date"></label>
        <button class="workspace-primary">Create exam plan</button><p role="alert" data-exam-error></p></form>`;
    }else{
      dialog.innerHTML=header+`<button type="button" class="exam-back" data-exam-back>‹ All exams</button>
      <div class="exam-plan-summary"><span>${exam.result?`Taken ${dateLabel(exam.result.takenOn)}`:exam.date?`Scheduled ${dateLabel(exam.date)}`:'No exam date'}</span>
      <span>${exam.topics.filter(topic=>topic.confidence===3).length} / ${exam.topics.length} topics confident</span>
      <button type="button" data-exam-mistakes aria-haspopup="dialog">Review mistakes</button></div>
      <form data-exam-form="prep"><h3>Prep plan</h3>
        <div class="exam-fields"><label>Exam name<input name="title" maxlength="120" required value="${escape(exam.title)}"></label>
        <label>Exam date<input name="date" type="date" value="${exam.date}"></label></div>
        <div class="exam-topics">${exam.topics.map((topic,index)=>`<div class="exam-topic">
          <label>Topic ${index+1}<input name="topic:${escape(topic.id)}" maxlength="120" value="${escape(topic.title)}" required></label>
          <label>Confidence<select name="confidence:${escape(topic.id)}">${confidence.map((label,value)=>`<option value="${value}" ${value===topic.confidence?'selected':''}>${label}</option>`).join('')}</select></label>
          <label class="exam-remove"><input type="checkbox" name="remove:${escape(topic.id)}"> Remove</label></div>`).join('')}</div>
        <label>New topics <span>(one per line)</span><textarea name="topics" rows="2" maxlength="6000" placeholder="Series convergence"></textarea></label>
        <button class="workspace-primary">Save prep plan</button><p role="alert" data-exam-error></p></form>
      <form data-exam-form="practice"><h3>Practice scores</h3>
        ${exam.practice.length?`<ul class="exam-score-list">${[...exam.practice].sort((a,b)=>b.date.localeCompare(a.date)).map(item=>`<li><span><strong>${escape(item.title)}</strong><small>${dateLabel(item.date)}</small></span>
          <b>${item.score} / ${item.maximum}</b><button type="button" data-exam-remove-score="${escape(item.id)}" aria-label="Remove ${escape(item.title)} score">×</button></li>`).join('')}</ul>`:''}
        <div class="exam-fields"><label>Practice name<input name="title" maxlength="120" required></label><label>Date<input name="date" type="date" value="${today()}" max="${today()}" required></label>
          <label>Score<input name="score" type="number" min="0" step="any" required></label><label>Out of<input name="maximum" type="number" min="0.01" step="any" required></label></div>
        <button class="workspace-primary">Log practice score</button><p role="alert" data-exam-error></p></form>
      <form data-exam-form="result"><h3>Final result</h3>
        <div class="exam-fields"><label>Date taken<input name="takenOn" type="date" value="${exam.result?.takenOn||today()}" max="${today()}" required></label>
        <label>Result <span>(optional)</span><input name="score" maxlength="100" placeholder="e.g. 92%" value="${escape(exam.result?.score)}"></label></div>
        <label>Reflection<textarea name="reflection" rows="3" maxlength="1000" placeholder="What worked? What will you change next time?">${escape(exam.result?.reflection)}</textarea></label>
        <button class="workspace-primary">${exam.result?'Update result':'Save result and add Garden star'}</button><p role="alert" data-exam-error></p></form>`;
    }
    if(focus)dialog.querySelector(focus)?.focus({preventScroll:true});
  }
  function store(value){
    const exam=examPlan(value);
    if(!exam||!save(projectId,exam))return false;
    examId=exam.id;
    return true;
  }
  dialog.addEventListener('submit',event=>{
    event.preventDefault();
    const form=event.target, fields=Object.fromEntries(new FormData(form)), type=form.dataset.examForm;
    const old=active(), id=old?.id||crypto.randomUUID();
    let draft={...old,id};
    if(type==='new'||type==='prep'){
      Object.assign(draft,{title:fields.title,date:fields.date});
      const topics=(old?.topics||[]).filter(item=>!fields[`remove:${item.id}`])
        .map(item=>({...item,title:fields[`topic:${item.id}`],confidence:Number(fields[`confidence:${item.id}`])}));
      for(const title of (fields.topics||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean)){
        if(!topics.some(item=>item.title.toLowerCase()===title.toLowerCase()))topics.push({id:crypto.randomUUID(),title,confidence:0});
      }
      draft.topics=topics;
    }else if(type==='practice'&&old){
      const score=Number(fields.score),maximum=Number(fields.maximum);
      if(!fields.title.trim()||score>maximum||fields.date>today()){
        form.querySelector('[data-exam-error]').textContent='Enter a practice name, a date through today, and a score within the maximum.';return;
      }
      draft.practice=[...old.practice,{...fields,id:crypto.randomUUID(),score,maximum}];
    }else if(type==='result'&&old&&fields.takenOn<=today()){
      draft.result={takenOn:fields.takenOn,score:fields.score,reflection:fields.reflection};
    }else return;
    if(!store(draft)){form.querySelector('[data-exam-error]').textContent='Enter an exam name and check that your changes can be saved.';return;}
    if(type==='new'){dialog.scrollTop=0;render('[data-exam-back]');}
    else{
      // Keep drafts in the other forms while refreshing the one that was saved.
      const otherForms=[...dialog.querySelectorAll('form')].filter(item=>item!==form);
      const scroll=dialog.scrollTop;
      render();
      for(const item of otherForms)dialog.querySelector(`[data-exam-form="${item.dataset.examForm}"]`)?.replaceWith(item);
      dialog.querySelector(`[data-exam-form="${type}"] button[type="submit"],[data-exam-form="${type}"] .workspace-primary`)?.focus({preventScroll:true});
      dialog.scrollTop=scroll;
    }
  });
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.hasAttribute('data-exam-mistakes')){const exam=active();if(exam)openMistakes({examId:exam.id,title:exam.title},button);return;}
    if(button.hasAttribute('data-exam-close'))dialog.close();
    if(button.hasAttribute('data-exam-back')||button.dataset.examOpen){
      examId=button.dataset.examOpen||'';dialog.scrollTop=0;render(examId?'[data-exam-back]':'[data-exam-form="new"] input');
    }
    if(button.dataset.examRemoveScore){
      const old=active();
      if(!old||!store({...old,practice:old.practice.filter(item=>item.id!==button.dataset.examRemoveScore)}))return;
      button.closest('li')?.remove();
      dialog.querySelector('[data-exam-form="practice"] input')?.focus({preventScroll:true});
    }
  });
  dialog.addEventListener('close',()=>anchor?.focus({preventScroll:true}));
  return {open(id,exam,trigger){
    projectId=id;examId=exam||'';anchor=trigger;
    render();
    if(!dialog.open)dialog.showModal();
    dialog.scrollTop=0;
    dialog.querySelector(examId?'[data-exam-back]':'[data-exam-open], [data-exam-form="new"] input')?.focus({preventScroll:true});
  }};
}
