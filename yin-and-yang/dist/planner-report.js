import {dayKey} from './state.js';
import {shiftDay} from './calendar.js';

export const activityLabels={task:'Completed tasks',focus:'Completed focus sessions',skipped:'Skipped focus sessions'};

function reportDateRange(period,now){
  if(period==='all')return {first:'',last:''};
  return {first:dayKey(shiftDay(now,1-Number(period))),last:dayKey(now)};
}

export function reportExportFilename(kind,period,days,now=new Date()){
  let {first,last}=reportDateRange(period,now);
  if(period==='all'){
    for(const day of days){
      if(!day)continue;
      if(!first||day<first)first=day;
      if(day>last)last=day;
    }
  }
  const range=first?(first===last?first:`${first}-to-${last}`):'all-dates';
  return `yin-and-yang-${kind}-${range}.csv`;
}

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
  const {first,last}=reportDateRange(period,now);
  return events.filter(event=>(period==='all'||event.day>=first&&event.day<=last)&&
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

function* estimatedWork(state,filters,now){
  const visible=new Set(reportEvents(state,{...filters,type:'task'},now).map(event=>event.id));
  for(const {event,actual} of completedTaskWork(state)){
    if(!Number.isInteger(event.estimate)||event.estimate<=0||!visible.has(event.id))continue;
    yield {event,actual,estimated:event.estimate*60000};
  }
}

export function estimateReportDays(state,filters,now){
  return Array.from(estimatedWork(state,filters,now),({event})=>dayKey(new Date(event.at)));
}

export function estimateAccuracy(state,filters={},now=new Date()){
  const rows=new Map();
  for(const {event,actual,estimated} of estimatedWork(state,filters,now)){
    const row=rows.get(event.taskId)||{taskId:event.taskId,text:'',samples:0,over:0,estimatedMs:0,actualMs:0};
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

export function courseEstimateAccuracy(state,filters={},now=new Date()){
  const rows=new Map();
  for(const {event,actual,estimated} of estimatedWork(state,filters,now)){
    const projectId=event.projectId||'';
    const row=rows.get(projectId)||{projectId,samples:0,estimatedMs:0,actualMs:0};
    row.samples++;
    row.estimatedMs+=estimated;
    row.actualMs+=actual;
    rows.set(projectId,row);
  }
  const sortKey={average:'averageDifferenceMs',planned:'estimatedMs'}[filters.courseSort]||'differenceMs';
  return [...rows.values()].map(row=>{
    const differenceMs=row.actualMs-row.estimatedMs;
    return {...row,differenceMs,averageDifferenceMs:differenceMs/row.samples};
  }).sort((a,b)=>b[sortKey]-a[sortKey]||b.samples-a.samples||a.projectId.localeCompare(b.projectId));
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

export function taskSplitSuggestion(state,task){
  if(!task?.estimate)return null;
  const row=estimateAccuracy(state).find(item=>item.taskId===task.id&&item.consistent);
  const lastDone=state.taskActivity.reduce((last,item)=>item.taskId===task.id?Math.max(last,item.at):last,0);
  const recent=state.history.filter(h=>h.taskId===task.id&&h.mode==='focus'&&h.outcome==='completed'&&h.finishedAt>lastDone);
  const minutes=Math.round(recent.reduce((sum,h)=>sum+h.focusMs,0)/60000);
  if(!row&&(recent.length<3||minutes<=task.estimate))return null;
  const typical=row?Math.ceil(row.actualMs/row.samples/60000):minutes;
  const count=Math.max(2,Math.min(6,Math.ceil(typical/Math.min(50,task.estimate))));
  return {count,minutes:Math.ceil(typical/count),reason:row?
    `Over estimate on ${row.over} of ${row.samples} completions.`:
    `${minutes} minutes across ${recent.length} sessions against a ${task.estimate}-minute estimate.`};
}

function toCsv(rows){
  const cell=value=>{
    const text=String(value??'');
    const safe=typeof value!=='number'&&/^\s*[=+@-]/.test(text)?`'${text}`:text;
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
export function courseEstimateCsv(rows,projectName){
  const minutes=ms=>Math.sign(ms)*Math.round(Math.abs(ms)/6000)/10;
  return toCsv([['Course or project','Samples','Planned minutes','Actual focus minutes','Difference (min)','Average difference per completed task (min)'],...rows.map(row=>[
    projectName(row.projectId),row.samples,minutes(row.estimatedMs),minutes(row.actualMs),minutes(row.differenceMs),minutes(row.averageDifferenceMs)
  ])]);
}
