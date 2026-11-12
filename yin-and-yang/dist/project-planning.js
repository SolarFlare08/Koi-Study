const strings=(values,limit)=>Array.isArray(values)
  ? [...new Set(values.filter(value=>typeof value==='string').map(value=>value.trim().slice(0,limit)).filter(Boolean))]
  : [];

export function taskTemplate(value){
  if(typeof value?.id!=='string'||typeof value.name!=='string'||!value.name.trim())return null;
  return {
    id:value.id,name:value.name.trim().slice(0,100),
    description:typeof value.description==='string'?value.description.slice(0,2000):'',
    subtasks:strings(value.subtasks,160),
    labels:strings(value.labels,40),
    estimate:Number.isInteger(value.estimate)&&value.estimate>=1&&value.estimate<=1440?value.estimate:null
  };
}

export function projectMilestone(value){
  if(typeof value?.id!=='string'||typeof value.name!=='string'||!value.name.trim()||
    typeof value.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value.date))return null;
  const date=new Date(value.date+'T00:00:00Z');
  if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value.date)return null;
  return {id:value.id,name:value.name.trim().slice(0,100),date:value.date,taskIds:strings(value.taskIds,Infinity)};
}

export function milestoneProgress(milestone,tasksById){
  const tasks=milestone.taskIds.map(id=>{
    const task=tasksById.get(id);
    const done=Boolean(task?.done || task?.repeat&&task.repeat!=='none'&&(task.completedOn||task.completions?.length));
    return {id,task,done};
  });
  const done=tasks.filter(item=>item.done).length;
  return {milestone,tasks,done,complete:tasks.length>0&&done===tasks.length};
}
