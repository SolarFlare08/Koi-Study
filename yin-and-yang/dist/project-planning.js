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

export function remainingProjectWork(items,history){
  const focus=new Map();
  for(const session of history){
    if(session.mode!=='focus'||session.outcome!=='completed')continue;
    focus.set(session.taskId,(focus.get(session.taskId)||0)+session.focusMs);
  }
  let minutes=0, unestimated=0;
  for(const {task,done} of items){
    if(done||!task)continue;
    if(!task.estimate){unestimated++;continue;}
    minutes+=Math.max(0,task.estimate-(focus.get(task.id)||0)/60000);
  }
  return {minutes:Math.ceil(minutes),unestimated};
}

export function projectDecision(value){
  const date=new Date(`${value?.date}T00:00:00Z`);
  if(typeof value?.id!=='string'||!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value.date)return null;
  const name=typeof value.name==='string'?value.name.trim().slice(0,120):'';
  const reason=typeof value.reason==='string'?value.reason.trim().slice(0,3000):'';
  if(!name||!reason)return null;
  return {id:value.id,date:value.date,name,reason,taskIds:strings(value.taskIds,Infinity),
    milestoneId:typeof value.milestoneId==='string'?value.milestoneId:''};
}
