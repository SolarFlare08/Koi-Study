import {needsRetry} from './mistake-notebook.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const retryHistory=value=>(Array.isArray(value)?value:[]).filter(attempt=>
  Number.isFinite(attempt?.at)&&Math.abs(attempt.at)<=8.64e15&&typeof attempt.solved==='boolean')
  .slice(-50).map(({at,solved})=>({at,solved}));
export function loadQuestions(raw){
  return (Array.isArray(raw)?raw:[]).filter(q=>q&&typeof q.id==='string'&&typeof q.question==='string').map(q=>({
    id:q.id,question:q.question.slice(0,2000),projectId:String(q.projectId||''),taskId:String(q.taskId||''),taskTitle:String(q.taskTitle||''),
    ref:String(q.ref||'').slice(0,300),answer:String(q.answer||'').slice(0,3000),answered:q.answered===true,mistakeId:String(q.mistakeId||''),
    ...(q.retries?{retries:retryHistory(q.retries)}:{})
  }));
}
export function officeHoursQuestion(question,{projectId='',task,ref=''}={}){
  return {id:crypto.randomUUID(),projectId,taskId:task?.id||'',taskTitle:task?.text||'',question,ref,answered:false,answer:''};
}
export function meetingItems(state,projectId){
  const project=state.projects.find(p=>p.id===projectId);
  const questions=state.studyQuestions.filter(q=>q.projectId===projectId);
  const linked=new Set(questions.map(q=>q.mistakeId));
  const mistakes=state.mistakes.filter(m=>!linked.has(m.id)&&needsRetry(m)&&
    (state.tasks.some(t=>t.id===m.taskId&&(t.projectId||'')===projectId)||project?.exams?.some(e=>e.id===m.examId)));
  return [...questions,...mistakes.map(m=>({id:'mistake:'+m.id,mistakeId:m.id,taskId:m.taskId,projectId,
    question:m.mistake,ref:m.source,taskTitle:state.tasks.find(t=>t.id===m.taskId)?.text||'Exam mistake',answered:false,answer:''}))];
}
export function installOfficeHours({getState,save,focusedTask,switchTask,startRetry,notify}){
  const dialog=document.createElement('dialog');dialog.className='workspace-dialog study-companion';dialog.setAttribute('aria-labelledby','office-title');
  document.body.append(dialog);
  const header=title=>`<header><h2 id="office-title">${title}</h2><button type="button" data-close aria-label="Close">×</button></header>`;
  const show=()=>{if(!dialog.open)dialog.showModal();};
  let course='',includeAnswered=false;
  function capture(initialCourse,task){
    const state=getState();
    dialog.innerHTML=header(task?'Where are you stuck?':'Capture a question')+`<form id="office-capture">
      <label>Question<textarea required name="question" maxlength="2000" placeholder="What do you need to understand?"></textarea></label>
      <label>Page, problem, or file<input name="ref" maxlength="300" placeholder="e.g. Chapter 3, page 42"></label>
      <label>Question sheet<select name="course"><option value="">General</option>${state.projects.map(p=>`<option value="${esc(p.id)}" ${p.id===initialCourse?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
      <div class="companion-actions">${task?`<button value="continue">Try another approach</button><button value="switch" ${state.timer.block||state.timer.sequence||state.timer.mistakeId?'disabled':''}>Switch task</button>`:''}<button class="workspace-primary" value="sheet">Save for office hours</button></div></form>
      <button type="button" data-browse>View questions</button>`;
    course=initialCourse;show();dialog.querySelector('textarea').focus();
    dialog.querySelector('form').onsubmit=e=>{
      e.preventDefault();const fields=e.target.elements,question=fields.question.value.trim();if(!question)return;
      course=fields.course.value;
      const entry=officeHoursQuestion(question,{projectId:course,task,ref:fields.ref.value.trim()});
      if(!save([...getState().studyQuestions,entry]))return;
      if(e.submitter?.value==='sheet'){sheet(course);return;}
      dialog.close();if(e.submitter?.value==='switch')switchTask();else notify('Question saved. Your session can continue.');
    };
  }
  function sheet(projectId){
    course=projectId;const state=getState(),items=meetingItems(state,course);
    const title=state.projects.find(p=>p.id===course)?.name||'General';
    dialog.innerHTML=header('Office-hours questions')+`<p>${esc(title)}</p>
      <div class="companion-actions"><button type="button" data-new>Add question</button><button type="button" data-print>Print sheet</button>
      <label><input type="checkbox" data-answered ${includeAnswered?'checked':''}> Show answered</label></div><section class="office-items"></section>`;
    const list=dialog.querySelector('section');
    items.filter(q=>includeAnswered||!q.answered).forEach(q=>{
      const form=document.createElement('form');
      const last=q.retries?.at(-1);
      form.innerHTML=`<strong>${esc(q.question)}</strong><small>${esc([q.taskTitle,q.ref].filter(Boolean).join(' · '))}</small><label>Meeting answer<textarea maxlength="3000">${esc(q.answer)}</textarea></label>
        ${last?`<small>Last retry · ${new Date(last.at).toLocaleDateString()} · ${last.solved?'Solved independently':'Still stuck'}</small>`:''}
        <div class="companion-actions"><button>${q.answered?'Reopen question':'Check off as answered'}</button>
        <button type="button" data-office-retry ${q.answer.trim()?'':'hidden'}>Try it myself</button></div>`;
      const response=form.querySelector('textarea');
      const retry=form.querySelector('[data-office-retry]');
      const saveAnswer=answered=>{
        const all=getState().studyQuestions;
        const latest=all.find(item=>item.id===q.id)||q;
        return save([...all.filter(item=>item.id!==q.id),{...latest,answer:response.value.trim(),answered}]);
      };
      response.onchange=()=>{if(saveAnswer(q.answered))retry.hidden=!response.value.trim();};
      retry.onclick=()=>{
        const current=getState().studyQuestions.find(item=>item.id===q.id);
        if(!current?.answer.trim())return;
        dialog.close();startRetry(q.id);
      };
      form.onsubmit=e=>{e.preventDefault();if(saveAnswer(!q.answered))sheet(course);};
      list.append(form);
    });
    if(!list.children.length)list.textContent='No outstanding questions on this sheet.';
    dialog.querySelector('[data-answered]').onchange=e=>{includeAnswered=e.target.checked;sheet(course);};
    dialog.querySelector('[data-print]').onclick=()=>{
      const page=document.createElement('article');page.id='office-print';
      page.innerHTML=`<h1>${esc(title)} · Office hours</h1>`+meetingItems(getState(),course).filter(q=>includeAnswered||!q.answered).map(q=>`<section><h3>${q.answered?'☑':'☐'} ${esc(q.question)}</h3><p>${esc([q.taskTitle,q.ref].filter(Boolean).join(' · '))}</p><p>${esc(q.answer)||'Answer ______________________________________'}</p></section>`).join('');
      document.body.append(page);try{window.print();}finally{page.remove();}
    };
    show();
  }
  dialog.onclick=e=>{if(e.target.closest('[data-close]'))dialog.close();if(e.target.closest('[data-new]'))capture(course,null);if(e.target.closest('[data-browse]'))sheet(dialog.querySelector('[name=course]')?.value||'');};
  document.addEventListener('click',e=>{const button=e.target.closest('[data-office-course]');if(button){includeAnswered=false;sheet(button.dataset.officeCourse);}});
  return ()=>{const task=focusedTask();capture(task?.projectId||'',task||{text:'Independent focus'});};
}
