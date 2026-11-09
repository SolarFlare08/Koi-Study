import {dayKey} from './state.js';
import {shiftDay} from './calendar.js';

export const activityLabels={task:'Completed tasks',focus:'Completed focus sessions',skipped:'Skipped focus sessions'};

export function reportEvents(state,{period='all',project='all',type='all'}={},now=new Date()) {
  const taskActivity=state.taskActivity||[];
  const saved=new Set(taskActivity.map(event=>event.id));
  const events=taskActivity.map(event=>({...event,type:'task',day:dayKey(new Date(event.at))}));
  for (const task of state.tasks) {
    const recurring=task.repeat&&task.repeat!=='none';
    const days=recurring?new Set([...(task.completions||[]),task.completedOn]):new Set(task.done?[task.completedOn]:[]);
    for (const day of days) {
      if (!day&&recurring) continue;
      const id=`${task.id}:${recurring?day:'once'}`;
      if (!saved.has(id)) events.push({id,type:'task',day:day||'',at:null,taskId:task.id,text:task.text,projectId:task.projectId||''});
    }
  }
  for (const session of state.history.filter(item=>item.mode==='focus')) {
    events.push({id:session.id,type:session.outcome==='completed'?'focus':'skipped',day:session.day||dayKey(new Date(session.finishedAt)),
      at:session.finishedAt,taskId:session.taskId,text:session.taskTitle||session.intention||'Focus session',projectId:session.projectId??null,ms:session.focusMs});
  }
  const today=dayKey(now);
  const first=period==='all'?'':dayKey(shiftDay(now,1-Number(period)));
  return events.filter(event=>(period==='all'||event.day>=first&&event.day<=today)&&
    (project==='all'||(project==='inbox'?event.projectId==='':project==='unassigned'?event.projectId===null:event.projectId===project))&&
    (type==='all'||event.type===type)).sort((a,b)=>b.day.localeCompare(a.day)||(b.at||0)-(a.at||0));
}

export function reportMetrics(events) {
  const groups=new Map();
  const total={task:0,focus:0,skipped:0,ms:0,days:0,average:0,rate:null};
  for (const event of events) {
    total[event.type]++;
    const ms=event.type==='focus'?event.ms||0:0;
    total.ms+=ms;
    if (!event.day) continue;
    const day=groups.get(event.day)||{day:event.day,task:0,focus:0,skipped:0,ms:0};
    day[event.type]++;
    day.ms+=ms;
    groups.set(event.day,day);
  }
  total.days=[...groups.values()].filter(day=>day.task||day.focus).length;
  total.average=total.focus?total.ms/total.focus:0;
  if (total.focus+total.skipped) total.rate=total.focus/(total.focus+total.skipped);
  return {total,days:[...groups.values()].sort((a,b)=>b.day.localeCompare(a.day))};
}

export function reportCsv(events, projectName) {
  const cell=value=>{
    const text=String(value??'');
    const safe=/^\s*[=+@-]/.test(text)?`'${text}`:text;
    return `"${safe.replace(/"/g,'""')}"`;
  };
  return [['Date','Activity','Task or session','Project','Focus minutes'],...events.map(event=>[
    event.day,activityLabels[event.type],event.text,projectName(event.projectId),event.type==='focus'?Math.round(event.ms/6000)/10:''
  ])].map(row=>row.map(cell).join(',')).join('\r\n');
}
