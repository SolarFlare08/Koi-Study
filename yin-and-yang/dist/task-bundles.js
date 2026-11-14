export function loadTaskBundles(value){
  const bundles=new Map();
  for(const item of Array.isArray(value)?value:[]){
    if(typeof item?.id!=='string'||!item.id||typeof item.name!=='string'||!item.name.trim()||!Array.isArray(item.taskIds))continue;
    const taskIds=[...new Set(item.taskIds.filter(id=>typeof id==='string'&&id))];
    if(taskIds.length&&!bundles.has(item.id))bundles.set(item.id,{id:item.id,name:item.name.trim().slice(0,100),taskIds,
      ...(/^\d{4}-\d{2}-\d{2}$/.test(item.startedOn)?{startedOn:item.startedOn}:{})});
  }
  return [...bundles.values()];
}

export function bundleProgress(bundle,tasks,ready,startedOn){
  const steps=bundle.taskIds.map(id=>{
    const task=tasks.get(id);
    const done=Boolean(task?.done||task?.repeat&&task.repeat!=='none'&&
      [task.completedOn,...(task.completions||[])].some(day=>day&&day>=startedOn));
    return {id,task,done,ready:ready.has(id)};
  });
  const next=steps.find(step=>!step.done);
  return {steps,next,done:steps.filter(step=>step.done).length};
}

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);

export function installBundleEditor({dialog,tasks,save,remove}){
  let bundle, ids=[], trigger;
  function renderOrder(){
    const all=tasks();
    const byId=new Map(all.map(task=>[task.id,task]));
    const select=dialog.querySelector('#bundle-task-select');
    select.innerHTML='<option value="">Choose a task</option>'+all.filter(task=>!ids.includes(task.id))
      .map(task=>`<option value="${escape(task.id)}">${escape(task.text)}${task.done?' (complete)':''}</option>`).join('');
    dialog.querySelector('[data-bundle-add]').disabled=true;
    dialog.querySelector('#bundle-order').innerHTML=ids.map((id,index)=>{
      const title=escape(byId.get(id)?.text||'Unavailable task');
      return `<li data-bundle-step="${index}"><span>${title}</span><div>
        <button type="button" data-bundle-step-action="up" aria-label="Move ${title} up" ${index===0?'disabled':''}>↑</button>
        <button type="button" data-bundle-step-action="down" aria-label="Move ${title} down" ${index===ids.length-1?'disabled':''}>↓</button>
        <button type="button" data-bundle-step-action="remove" aria-label="Remove ${title}">×</button></div></li>`;
    }).join('');
  }
  dialog.addEventListener('change',event=>{
    if(event.target.id==='bundle-task-select')dialog.querySelector('[data-bundle-add]').disabled=!event.target.value;
  });
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.hasAttribute('data-bundle-close')){dialog.close();return;}
    if(button.hasAttribute('data-bundle-delete')){
      if(button.dataset.confirm!=='true'){button.dataset.confirm='true';button.textContent='Confirm delete';return;}
      if(remove(bundle.id))dialog.close();
      return;
    }
    const select=dialog.querySelector('#bundle-task-select');
    if(button.hasAttribute('data-bundle-add')&&select.value){
      ids.push(select.value);renderOrder();select.focus();return;
    }
    const action=button.dataset.bundleStepAction;
    if(!action)return;
    const index=Number(button.closest('[data-bundle-step]').dataset.bundleStep);
    const to=action==='up'?index-1:index+1;
    const [id]=ids.splice(index,1);
    if(action!=='remove')ids.splice(to,0,id);
    renderOrder();
    const row=dialog.querySelector(`[data-bundle-step="${action==='remove'?Math.min(index,ids.length-1):to}"]`);
    (row?.querySelector(`[data-bundle-step-action="${action}"]:not(:disabled)`)||row?.querySelector('[data-bundle-step-action]:not(:disabled)')||select).focus();
  });
  dialog.addEventListener('submit',event=>{
    event.preventDefault();
    const name=event.target.elements.name.value.trim();
    if(!name||!ids.length){dialog.querySelector('#bundle-editor-error').textContent='Name the bundle and add at least one task.';return;}
    if(save({...bundle,id:bundle?.id||crypto.randomUUID(),name,taskIds:[...ids]}))dialog.close();
  });
  dialog.addEventListener('close',()=>trigger?.()?.focus({preventScroll:true}));
  return {open(item,focusTarget){
    bundle=item;ids=[...(item?.taskIds||[])];trigger=focusTarget;
    dialog.innerHTML=`<header><h2 id="bundle-editor-title">${item?'Edit bundle':'New bundle'}</h2><button type="button" data-bundle-close aria-label="Close bundle editor">×</button></header>
      <form><label>Bundle name<input name="name" required maxlength="100" value="${escape(item?.name)}" placeholder="Pre-lab routine"></label>
        <label for="bundle-task-select">Add a saved task</label><div class="bundle-task-add"><select id="bundle-task-select"></select><button type="button" data-bundle-add>Add</button></div>
        <ol id="bundle-order" aria-label="Task order"></ol><p id="bundle-editor-error" role="alert"></p>
        <div class="bundle-editor-actions"><button class="workspace-primary">Save bundle</button>${item?'<button type="button" data-bundle-delete>Delete bundle</button>':''}</div></form>`;
    renderOrder();
    dialog.showModal();
  }};
}
