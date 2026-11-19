import {addTaskBlock,calendarBlocks,calendarTaskBlock,calendarEventOccurrences,eventOccurrenceDay,shiftDay,timeLabel,timeValue} from './calendar.js';
import {dayKey,taskOccursOn} from './state.js';

const midnight=day=>new Date(day+'T00:00:00');
const minute=date=>date.getHours()*60+date.getMinutes();
const ordinal=date=>Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000;
const dateOffset=(from,to)=>ordinal(midnight(to))-ordinal(midnight(from));
const repeating=item=>item.repeat&&item.repeat!=='none';
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

export function resizeSource(state,target){
  const date=target.date;
  if(target.eventId){
    const event=state.calendarEvents.find(item=>item.id===target.eventId&&item.manual&&!item.day);
    if(!event)return null;
    const occurrence=calendarEventOccurrences([event],midnight(date)).find(item=>eventOccurrenceDay(item)===date);
    if(!occurrence)return null;
    const from=new Date(occurrence.start),to=new Date(occurrence.end);
    return {...target,event,start:minute(from),end:dateOffset(date,dayKey(to))*1440+minute(to)};
  }
  const task=state.tasks.find(item=>item.id===target.taskId);
  const slot=task&&calendarTaskBlock(task,target.blockId,date);
  return slot?{...target,task,start:minute(slot.start),end:minute(slot.start)+slot.minutes}:null;
}

export function resizePlacement(source,edge,columnDay,minuteInColumn){
  const value=dateOffset(source.date,columnDay)*1440+clamp(Math.round(minuteInColumn/5)*5,0,1440);
  const minimum=Math.min(5,source.end-source.start);
  let {start,end}=source;
  if(edge==='start')start=clamp(value,Math.max(0,end-1440),Math.min(1439,end-minimum));
  else end=clamp(value,start+minimum,start+1440);
  return {start,end};
}

export function resizeConflicts(state,source,draft,extra=()=>[]){
  const conflicts=new Set();
  for(let offset=0;offset*1440<draft.end;offset++){
    const date=shiftDay(midnight(source.date),offset);
    const blocks=[...calendarBlocks(state.tasks,date,state.calendarEvents),...extra(date)];
    for(const block of blocks){
      if(block.event&&block.event.id===source.eventId&&eventOccurrenceDay(block.event)===source.date)continue;
      if(block.task&&block.task.id===source.taskId&&(block.blockId||null)===source.blockId&&block.occurrence===source.date)continue;
      const start=block.start+offset*1440,end=block.end+offset*1440;
      if(start<draft.end&&draft.start<end)conflicts.add(block.event?.title||block.task?.text||block.ritual);
    }
  }
  return [...conflicts];
}

function stamp(date,minutes){
  const day=dayKey(shiftDay(midnight(date),Math.floor(minutes/1440)));
  const time=timeValue(minutes%1440);
  const result=new Date(day+'T'+time);
  return dayKey(result)===day&&minute(result)===minutes%1440?+result:NaN;
}

export function resizedCalendarItem(state,source,{start,end}){
  const minutes=end-start;
  if(!Number.isInteger(minutes)||minutes<1||minutes>1440||start<0||start>=1440||
      !Number.isFinite(stamp(source.date,start))||!Number.isFinite(stamp(source.date,end)))return null;
  if(source.event){
    const from=stamp(source.date,start),to=stamp(source.date,end);
    if(to<=from)return null;
    const before=source.event;
    let replacement={...before,start:from,end:to},copy;
    if(repeating(before)){
      const {excludedDays,repeat,repeatEvery,...fields}=replacement;
      copy={...fields,id:'manual:'+crypto.randomUUID()};
      replacement={...before,excludedDays:[...new Set([...(before.excludedDays||[]),source.date])]};
    }
    const updated=state.calendarEvents.map(event=>event===before?replacement:event);
    if(copy)updated.push(copy);
    return {changes:{calendarEvents:updated},undo(latest){
      const current=latest.calendarEvents.find(event=>event.id===before.id);
      if(JSON.stringify(current)!==JSON.stringify(replacement))return false;
      if(copy&&JSON.stringify(latest.calendarEvents.find(event=>event.id===copy.id))!==JSON.stringify(copy))return false;
      latest.calendarEvents=latest.calendarEvents.filter(event=>event.id!==copy?.id).map(event=>event.id===before.id?before:event);
      return true;
    }};
  }
  const before=source.task,task=structuredClone(before);
  if(source.blockId){
    const block=task.blocks.find(block=>block.id===source.blockId);
    Object.assign(block,{time:timeValue(start),minutes});
  }else if(repeating(task)){
    if(!taskOccursOn(task,midnight(source.date)))return null;
    task.occurrenceTimes={...task.occurrenceTimes,[source.date]:''};
    addTaskBlock(task,source.date,timeValue(start),minutes).taskDay=source.date;
  }else{
    task.time=timeValue(start);task.estimate=minutes;
  }
  const keys=['time','estimate','occurrenceTimes','blocks'].filter(key=>JSON.stringify(before[key])!==JSON.stringify(task[key]));
  return {changes:{tasks:state.tasks.map(item=>item===before?task:item)},undo(latest){
    const current=latest.tasks.find(item=>item.id===before.id);
    if(!current||keys.some(key=>JSON.stringify(current[key])!==JSON.stringify(task[key])))return false;
    for(const key of keys)current[key]=before[key];
    return true;
  }};
}

export function installCalendarResize(grid,{canResize,getState,previewExtra,save,notify}){
  let drag=null,suppressClick=false;
  const tip=document.createElement('div');tip.className='calendar-resize-tip';tip.setAttribute('role','status');
  function clear(){
    if(!drag)return;
    drag.block.classList.remove('calendar-resizing');
    drag.block.style.setProperty('--start',drag.originalStart);
    drag.block.style.setProperty('--length',drag.originalLength);
    tip.remove();drag=null;
  }
  grid.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('[data-resize-edge]');
    if(!handle||!event.isPrimary||event.button!==0||!canResize())return;
    const block=handle.closest('.calendar-block'),column=block.closest('[data-date]');
    const source=resizeSource(getState(),{eventId:block.dataset.calendarEvent,taskId:block.dataset.task,blockId:block.dataset.block||null,date:block.dataset.eventDay||block.dataset.occurrence});
    if(!source||source.end<=source.start||source.end-source.start>1440)return;
    event.preventDefault();event.stopPropagation();handle.setPointerCapture(event.pointerId);
    drag={source,edge:handle.dataset.resizeEdge,block,column,pointer:event.pointerId,y:event.clientY,
      originalStart:block.style.getPropertyValue('--start'),originalLength:block.style.getPropertyValue('--length')};
    block.classList.add('calendar-resizing');
  });
  grid.addEventListener('pointermove',event=>{
    if(event.pointerId!==drag?.pointer)return;
    const {column,source,edge}=drag;
    const bounds=column.getBoundingClientRect();
    if(!drag.draft&&Math.abs(event.clientY-drag.y)<3)return;
    const offset=dateOffset(source.date,column.dataset.date)*1440;
    drag.draft=resizePlacement(source,edge,column.dataset.date,(event.clientY-bounds.top)/bounds.height*1440);
    const {start,end}=drag.draft;
    drag.block.style.setProperty('--start',Math.max(0,start-offset));
    drag.block.style.setProperty('--length',Math.max(1,Math.min(1440,end-offset)-Math.max(0,start-offset)));
    const conflicts=resizeConflicts(getState(),source,drag.draft,previewExtra);
    tip.textContent=`${timeLabel(start)} – ${timeLabel(end%1440)}${end>=1440?' next day':''} · ${end-start} min · ${conflicts.length?'Overlaps '+conflicts.join(', '):'No timed overlaps'}`;
    if(!tip.isConnected)document.body.append(tip);
    tip.style.left=Math.max(8,Math.min(event.clientX+14,innerWidth-tip.offsetWidth-8))+'px';
    tip.style.top=Math.max(8,Math.min(event.clientY+12,innerHeight-tip.offsetHeight-8))+'px';
  });
  grid.addEventListener('pointerup',event=>{
    if(event.pointerId!==drag?.pointer)return;
    const {source,draft}=drag;clear();
    suppressClick=true;setTimeout(()=>{suppressClick=false;},0);
    if(!draft||draft.start===source.start&&draft.end===source.end)return;
    const state=getState(),current=resizeSource(state,source);
    if(!current||current.start!==source.start||current.end!==source.end){notify('The calendar block changed. Try resizing it again.');return;}
    const result=resizedCalendarItem(state,current,draft);
    if(result)save(result,draft);else notify('That time is unavailable. The block was not resized.');
  });
  for(const name of ['pointercancel','lostpointercapture'])grid.addEventListener(name,event=>{if(event.pointerId===drag?.pointer)clear();});
  new MutationObserver(()=>{if(drag&&!drag.block.isConnected)clear();}).observe(grid,{childList:true});
  grid.addEventListener('click',event=>{
    if(suppressClick||event.target.closest('[data-resize-edge]')){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  grid.addEventListener('dragstart',event=>{if(drag)event.preventDefault();},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&drag){event.preventDefault();clear();}});
}
