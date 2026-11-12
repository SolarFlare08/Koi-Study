import {calendarBlocks,calendarTaskBlock,shiftDay,weekDays} from './calendar.js';
import {dayKey} from './state.js';

const text=value=>String(value??'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/[;,]/g,'\\$&');
const utc=date=>new Date(date).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
const compact=day=>day.replace(/-/g,'');
const encoder=new TextEncoder();

function fold(line){
  let output='',bytes=0;
  for(const char of line){
    const size=encoder.encode(char).length;
    if(bytes+size>75){output+='\r\n ';bytes=1;}
    output+=char;bytes+=size;
  }
  return output;
}

function localDay(value){
  const date=new Date(`${value}T00:00:00`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(+date)||dayKey(date)!==value)throw new Error('Choose a valid date.');
  return date;
}

export function exportCalendar(tasks,events,{scope,date,endDate,projectId,includeEvents=true},now=Date.now()){
  const start=localDay(date);
  let first=start,last=start;
  if(scope==='week'){
    const days=weekDays(start);
    first=days[0];last=days.at(-1);
  }else if(scope==='project'){
    if(!projectId)throw new Error('Choose a project to export.');
    last=localDay(endDate);
    if(last<first||last>shiftDay(first,365))throw new Error('Choose an end date within one year of the start.');
    tasks=tasks.filter(task=>task.projectId===projectId);
    includeEvents=false;
  }else if(scope!=='day')throw new Error('Choose a calendar export scope.');
  const after=shiftDay(last,1),stamp=utc(now),entries=new Map();
  const add=(id,title,description,times)=>{
    if(entries.has(id))return;
    entries.set(id,['BEGIN:VEVENT',`UID:${text(id)}@yin-yang`,`DTSTAMP:${stamp}`,...times,`SUMMARY:${text(title)}`,
      ...(description?[`DESCRIPTION:${text(description)}`]:[]),'END:VEVENT']);
  };
  for(let day=first;day<=last;day=shiftDay(day,1)){
    for(const block of calendarBlocks(tasks,day)){
      const {task,blockId,occurrence}=block;
      const slot=calendarTaskBlock(task,blockId,occurrence);
      if(slot&&slot.end>slot.start)add(`task-${task.id}-${blockId||'main'}-${occurrence}`,task.text,task.description,
        [`DTSTART:${utc(slot.start)}`,`DTEND:${utc(slot.end)}`]);
    }
  }
  if(includeEvents){
    for(const event of events){
      if(event.day){
        if(event.day<=dayKey(last)&&event.endDay>dayKey(first))add(`event-${event.id}`,event.title,event.description,
          [`DTSTART;VALUE=DATE:${compact(event.day)}`,`DTEND;VALUE=DATE:${compact(event.endDay)}`]);
      }else if(event.start<+after&&Math.max(event.end,event.start+60000)>+first){
        add(`event-${event.id}`,event.title,event.description,[`DTSTART:${utc(event.start)}`,`DTEND:${utc(Math.max(event.end,event.start+60000))}`]);
      }
    }
  }
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Yin and Yang//Calendar//EN','CALSCALE:GREGORIAN',...Array.from(entries.values()).flat(),'END:VCALENDAR'];
  return {content:lines.map(fold).join('\r\n')+'\r\n',count:entries.size,first:dayKey(first)};
}
