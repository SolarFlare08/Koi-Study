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

function* completedTaskWork(state){
  const sessions=new Map(),completions=new Map();
  for(const session of state.history){
    if(session.mode!=='focus'||session.outcome!=='completed'||!session.taskId||session.focusMs<=0)continue;
    if(!sessions.has(session.taskId))sessions.set(session.taskId,[]);
    sessions.get(session.taskId).push(session);
  }
  for(const event of state.taskActivity){
    if(!completions.has(event.taskId))completions.set(event.taskId,[]);
    completions.get(event.taskId).push(event);
  }
  for(const [taskId,events] of completions){
    const work=sessions.get(taskId)?.sort((a,b)=>a.finishedAt-b.finishedAt);
    if(!work)continue;
    let index=0;
    for(const event of events.sort((a,b)=>a.at-b.at)){
      let actual=0;
      while(index<work.length&&work[index].finishedAt<=event.at)actual+=work[index++].focusMs;
      if(actual)yield {event,actual};
    }
  }
}

export function estimateAccuracy(state,filters={},now=new Date()){
  const visible=new Set(reportEvents(state,{...filters,type:'task'},now).map(event=>event.id));
  const rows=new Map();
  for(const {event,actual} of completedTaskWork(state)){
    if(!Number.isInteger(event.estimate)||event.estimate<=0||!visible.has(event.id))continue;
    const row=rows.get(event.taskId)||{taskId:event.taskId,text:'',samples:0,over:0,estimatedMs:0,actualMs:0};
    const estimated=event.estimate*60000;
    row.text=event.text;
    row.samples++;
    row.over+=Number(actual>estimated);
    row.estimatedMs+=estimated;
    row.actualMs+=actual;
    rows.set(event.taskId,row);
  }
  return [...rows.values()].map(row=>({...row,consistent:row.over>=2&&row.over*2>row.samples}))
    .sort((a,b)=>Number(b.consistent)-Number(a.consistent)||b.over-a.over||a.text.localeCompare(b.text));
}

export function suggestTaskEstimate(state,task){
  const title=task.text.trim().toLowerCase();
  const labels=new Set((task.labels||[]).map(label=>label.toLowerCase()));
  const terms=text=>[...(text.toLowerCase().match(/[\p{L}]{4,}/gu)||[])]
    .map(word=>word.length>=7?word.replace(/ing$/,''):word)
    .filter(word=>!['finish','complete','work','task','with','from','that','this'].includes(word));
  const words=new Set(terms(title));
  if(!title&&!labels.size)return null;
  const known=new Map(state.tasks.map(item=>[item.id,item]));
  const samples=[];
  for(const {event,actual} of completedTaskWork(state)){
    const priorLabels=Array.isArray(event.labels)?event.labels:known.get(event.taskId)?.labels||[];
    const score=event.text.trim().toLowerCase()===title?3:
      priorLabels.some(label=>typeof label==='string'&&labels.has(label.toLowerCase()))?2:
      terms(event.text).some(word=>words.has(word))?1:0;
    if(score)samples.push({score,at:event.at,minutes:Math.max(1,Math.round(actual/60000))});
  }
  if(!samples.length)return null;
  samples.sort((a,b)=>b.score-a.score||b.at-a.at);
  const minutes=samples.slice(0,5).map(item=>item.minutes).sort((a,b)=>a-b);
  const midpoint=Math.floor(minutes.length/2);
  const median=minutes.length%2?minutes[midpoint]:(minutes[midpoint-1]+minutes[midpoint])/2;
  return {count:minutes.length,min:minutes[0],max:minutes.at(-1),estimate:Math.min(1440,Math.round(median))};
}

export function estimateSummary({count,min,max}){
  const range=min===max?`${min} min`:`${min}–${max} min`;
  return `${count} similar completed ${count===1?'task took':'tasks took'} ${range} of logged focus${count===1?'':' each'}.`;
}

function toCsv(rows){
  const cell=value=>{
    const text=String(value??'');
    const safe=/^\s*[=+@-]/.test(text)?`'${text}`:text;
    return `"${safe.replace(/"/g,'""')}"`;
  };
  return rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
export function reportCsv(events, projectName) {
  return toCsv([['Date','Activity','Task or session','Project','Focus minutes'],...events.map(event=>[
    event.day,activityLabels[event.type],event.text,projectName(event.projectId),event.type==='focus'?Math.round(event.ms/6000)/10:''
  ])]);
}
export function estimateCsv(rows){
  const average=(ms,samples)=>Math.round(ms/samples/6000)/10;
  return toCsv([['Task','Samples','Over estimate','Average estimate (min)','Average focus (min)','Consistently over'],...rows.map(row=>[
    row.text,row.samples,row.over,average(row.estimatedMs,row.samples),average(row.actualMs,row.samples),row.consistent?'Yes':''
  ])]);
}
