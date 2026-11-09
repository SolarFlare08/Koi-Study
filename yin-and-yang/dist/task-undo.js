const snapshot=(task,fields)=>Object.fromEntries(fields.map(key=>[key,structuredClone(task[key])]));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function captureTaskChange(task,fields) {
  const before=snapshot(task,fields);
  return ()=>{
    const after=snapshot(task,fields);
    const changed=fields.filter(key=>!same(before[key],after[key]));
    if (!changed.length) return null;
    return state=>{
      const latest=state.tasks.find(item=>item.id===task.id);
      if (!latest||changed.some(key=>!same(latest[key],after[key]))) return false;
      for (const key of changed) latest[key]=structuredClone(before[key]);
      return true;
    };
  };
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
