import {allDayEvents,calendarBlocks,calendarTaskBlock,calendarEventFromFields,shiftDay,timeValue} from './calendar.js';
import {personalCalendarId,calendarColor} from './calendar-layers.js';
import {dayKey,taskOccursOn,taskPriority,taskCalendarColor} from './state.js';

const dateFor=day=>new Date(day+'T12:00:00');
export const validTemplateDay=day=>typeof day==='string'&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day)&&dayKey(dateFor(day))===day;
const clean=(value,limit)=>typeof value==='string'?value.trim().slice(0,limit):'';
const minute=date=>date.getHours()*60+date.getMinutes();
const dayDistance=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);

export function loadDayTemplates(value){
  const templates=new Map();
  for(const raw of Array.isArray(value)?value:[]){
    if(typeof raw?.id!=='string'||!raw.id||!clean(raw.name,80)||!Array.isArray(raw.rows))continue;
    const rows=[];
    for(const row of raw.rows){
      if(!['task','event'].includes(row?.kind)||!clean(row.title,500))continue;
      const allDay=row.allDay===true;
      const start=allDay?0:row.start,duration=allDay?(row.days??1):row.minutes;
      if(!Number.isInteger(start)||start<0||start>=1440||!Number.isInteger(duration)||duration<1||duration>(allDay?366:1440))continue;
      rows.push({kind:row.kind,title:clean(row.title,500),description:clean(row.description,2000),
        allDay,start,...(allDay?{days:duration}:{minutes:duration}),
        ...(row.kind==='event'&&calendarColor(row.color)?{color:calendarColor(row.color)}:{}),
        ...(row.kind==='event'&&row.calendarId?{calendarId:clean(row.calendarId,80)}:{}),
        taskKey:clean(row.taskKey,200),projectId:clean(row.projectId,200),priorityLevel:[1,2,3,4].includes(row.priorityLevel)?row.priorityLevel:4,
        calendarColor:taskCalendarColor(row.calendarColor)});
    }
    if(rows.length)templates.set(raw.id,{id:raw.id,name:clean(raw.name,80),rows});
  }
  return [...templates.values()];
}

export function captureCalendarDay(tasks,events,day){
  if(!validTemplateDay(day))return [];
  const date=dateFor(day);
  const taskRow=(task,fields)=>({kind:'task',title:task.text,description:task.description,taskKey:task.id,
    projectId:task.projectId,priorityLevel:taskPriority(task),calendarColor:task.calendarColor,...fields});
  const timed=calendarBlocks(tasks,date,events).filter(block=>!block.continues).map(block=>{
    if(block.task){
      const entry=calendarTaskBlock(block.task,block.blockId,block.occurrence);
      return taskRow(block.task,{start:block.start,minutes:entry?.minutes??(block.end-block.start)});
    }
    const event=block.event,end=new Date(event.end);
    return {kind:'event',title:event.title,description:event.description,start:block.start,...(event.manual&&{calendarId:event.calendarId,color:event.color}),
      minutes:Math.max(1,dayDistance(day,dayKey(end))*1440+minute(end)-block.start)};
  });
  const scheduled=new Set(timed.filter(row=>row.kind==='task').map(row=>row.taskKey));
  const untimed=tasks.filter(task=>!task.time&&taskOccursOn(task,date)&&!scheduled.has(task.id))
    .map(task=>taskRow(task,{allDay:true}));
  const allDay=allDayEvents(events,date).filter(event=>event.day===day).map(event=>({kind:'event',title:event.title,
    description:event.description,allDay:true,...(event.manual&&{calendarId:event.calendarId,color:event.color}),days:dayDistance(day,event.endDay)}));
  return [...allDay,...untimed,...timed];
}

export function previewCalendarDay(template,day,tasks,events){
  if(!template||!validTemplateDay(day))return [];
  const date=dateFor(day),following=shiftDay(date,1);
  const occupied=[...calendarBlocks(tasks,date,events),...calendarBlocks(tasks,following,events)
    .map(block=>({...block,start:block.start+1440,end:block.end+1440}))];
  return template.rows.map((row,index)=>{
    if(row.allDay)return {row,index,conflicts:[]};
    const end=row.start+row.minutes;
    const conflicts=occupied.filter(block=>block.start<end&&block.end>row.start).map(block=>block.event?.title||block.task?.text);
    const overlaps=template.rows.flatMap((other,i)=>i!==index&&!other.allDay&&other.start<end&&other.start+other.minutes>row.start?[i]:[]);
    const clock=new Date(day+'T'+timeValue(row.start));
    let unavailable=minute(clock)!==row.start;
    if(row.kind==='event'){
      const endDay=dayKey(shiftDay(date,Math.floor(end/1440)));
      unavailable||=minute(new Date(endDay+'T'+timeValue(end%1440)))!==end%1440;
    }
    return {row,index,conflicts:[...new Set(conflicts.filter(Boolean))],overlaps,unavailable};
  });
}

export function copyCalendarDay(template,day,indices,{tasks,projects,calendarEvents,calendars=[]}){
  const selected=new Set(indices);
  const preview=previewCalendarDay(template,day,tasks,calendarEvents).filter(item=>selected.has(item.index)&&!item.unavailable);
  const date=dateFor(day),copies=new Map(),events=[];
  for(const {row,index} of preview){
    if(row.kind==='event'){
      const end=row.start+(row.minutes||0);
      const saved=calendarEventFromFields({title:row.title,description:row.description,allDay:row.allDay,startDay:day,
        endDay:dayKey(shiftDay(date,row.allDay?row.days-1:Math.floor(end/1440))),
        startTime:timeValue(row.start),endTime:timeValue(end%1440)},'manual:'+crypto.randomUUID());
      if(row.calendarId)saved.calendarId=calendars.some(item=>item.id===row.calendarId)?row.calendarId:personalCalendarId;
      if(calendarColor(row.color))saved.color=row.color;
      events.push(saved);
      continue;
    }
    const key=row.taskKey||index;
    if(!copies.has(key))copies.set(key,{id:crypto.randomUUID(),text:row.title,description:row.description,done:false,repeat:'none',
      date:day,time:'',estimate:row.allDay?null:row.minutes,priorityLevel:row.priorityLevel,priority:row.priorityLevel<4,
      calendarColor:row.calendarColor,projectId:projects.some(project=>project.id===row.projectId&&!project.archived)?row.projectId:'',
      blocks:[],subtasks:[],comments:[],labels:[]});
    if(!row.allDay)copies.get(key).blocks.push({id:crypto.randomUUID(),date:day,time:timeValue(row.start),minutes:row.minutes});
  }
  const tasksAdded=[...copies.values()];
  for(const task of tasksAdded){
    if(task.blocks.length)task.time=task.blocks.shift().time;
  }
  return {tasks:tasksAdded,events,count:preview.length};
}
