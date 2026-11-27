const snapshot=(task,fields)=>Object.fromEntries(fields.map(key=>[key,structuredClone(task[key])]));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function captureTaskChange(task,fields) {
  const before=snapshot(task,fields);
  return ()=>{
    const after=snapshot(task,fields);
    const changed=fields.filter(key=>!same(before[key],after[key]));
    if (!changed.length) return null;
    const apply=(state,from,to)=>{
      const latest=state.tasks.find(item=>item.id===task.id);
      if (!latest||changed.some(key=>!same(latest[key],from[key]))) return false;
      for (const key of changed) latest[key]=structuredClone(to[key]);
      return true;
    };
    const undo=state=>apply(state,after,before);
    undo.redo=state=>apply(state,before,after);
    return undo;
  };
}

export function captureAddedTask(task,index){
  const restore=restoreDeletedTask(task,index);
  const added=structuredClone(task);
  const undo=state=>{
    const position=state.tasks.findIndex(item=>item.id===added.id);
    if(position<0||!same(state.tasks[position],added)||state.activeTask===added.id||state.timer?.taskSnapshot?.id===added.id||
      state.tasks.some(item=>item.prerequisiteIds?.includes(added.id))||state.stickyNotes?.some(note=>note.taskId===added.id))return false;
    state.tasks.splice(position,1);
    return true;
  };
  undo.redo=state=>(!added.projectId||state.projects.some(project=>project.id===added.projectId&&!project.archived))&&restore(state);
  return undo;
}

export function restoreDeletedTask(task,index) {
  const deleted=structuredClone(task);
  return state=>{
    if (state.tasks.some(item=>item.id===deleted.id)) return false;
    state.tasks.splice(Math.min(index,state.tasks.length),0,structuredClone(deleted));
    return true;
  };
}

export function restoreActiveTask(undo,before,after) {
  if (!undo||before===after) return undo;
  return state=>{
    if (!undo(state)) return false;
    if (state.activeTask===after) state.activeTask=before;
    return true;
  };
}
