import {dayKey, taskOccursOn, taskPriority, taskStatus, unfinishedPrerequisites} from './state.js';
import {unavailableRanges} from './availability.js';

const minutesPerDay = 24 * 60;
export const defaultBlockMinutes = 60;
export const calendarDragType = 'application/x-yin-task';

export function shiftDay(date, offset) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
}

export function weekDays(date) {
  const monday = shiftDay(date, -((date.getDay() + 6) % 7));
  return Array.from({length: 7}, (_, index) => shiftDay(monday, index));
}

export function timeValue(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function timeLabel(minutes) {
  const hours = Math.floor(minutes / 60) % 24;
  const fraction = minutes % 60;
  return `${hours % 12 || 12}${fraction ? ':' + String(fraction).padStart(2, '0') : ''} ${hours < 12 ? 'AM' : 'PM'}`;
}

export function scheduleTask(task, date, start) {
  task.date = date;
  task.time = timeValue(start);
}

export function timeMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function calendarEventFromFields(fields, id) {
  const {startDay, endDay, startTime, endTime, allDay} = fields;
  const title = fields.title.trim();
  if (!title) throw new Error('Give the event a title.');
  const localDay = value => {
    const date = new Date(`${value}T00:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(+date) || dayKey(date) !== value) {
      throw new Error('Choose valid start and end dates.');
    }
    return date;
  };
  localDay(startDay);
  const last = localDay(endDay);
  const event = {id, title, description: fields.description.trim(), manual: true};
  if (allDay) {
    if (endDay < startDay) throw new Error('The last day can’t be before the first day.');
    return {...event, day: startDay, endDay: dayKey(shiftDay(last, 1))};
  }
  const localTime = (day, time) => {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Choose valid start and end times.');
    const date = new Date(`${day}T${time}:00`);
    if (timeValue(date.getHours() * 60 + date.getMinutes()) !== time) throw new Error('That time is unavailable on this date.');
    return +date;
  };
  const start = localTime(startDay, startTime), end = localTime(endDay, endTime);
  if (end <= start) throw new Error('The end needs to be after the start.');
  return {...event, start, end};
}

export function addTaskBlock(task, date, time, minutes = task.estimate || defaultBlockMinutes) {
  const block = {id: globalThis.crypto.randomUUID(), date, time, minutes};
  (task.blocks ??= []).push(block);
  return block;
}

export function scheduledTaskTime(task,occurrence){
  return task.time ? task.occurrenceTimes?.[occurrence]??task.time : '';
}

export function calendarTaskBlock(task,blockId,occurrence){
  const date = new Date(`${occurrence}T00:00:00`);
  const entry = blockId
    ? task.blocks?.find(block => block.id === blockId && block.date === occurrence)
    : taskOccursOn(task, date) && task;
  const time=entry&&(blockId?entry.time:scheduledTaskTime(task,occurrence));
  if (!time) return null;
  const minutes = entry.minutes || task.estimate || defaultBlockMinutes;
  const start = new Date(`${occurrence}T${time}`);
  const end = new Date(date);
  end.setMinutes(timeMinutes(time) + minutes);
  return {start,end,minutes,taskDay:entry.taskDay||occurrence};
}

export function blockFocusTiming(task, blockId, occurrence, now = Date.now()) {
  const scheduled=calendarTaskBlock(task,blockId,occurrence);
  if(!scheduled)return null;
  const {start,end,minutes}=scheduled;
  return {available: Math.max(0, end - Math.max(start, now)), split: minutes > 60, early: now < start};
}

export function calendarFocusKey(taskId,occurrence,blockId){
  return JSON.stringify([taskId,occurrence,blockId||null]);
}
export const blockProgressLabels={focused:'Focused',partial:'Partly done',missed:'Missed'};

export function calendarFocusTotals(history){
  const totals=new Map();
  for(const session of history){
    if(session.mode!=='focus'||!session.calendarBlock||session.focusMs<=0)continue;
    const {occurrence,blockId}=session.calendarBlock;
    const key=calendarFocusKey(session.taskId,occurrence,blockId);
    totals.set(key,(totals.get(key)||0)+session.focusMs);
  }
  return totals;
}

export function calendarBlockProgress(task,blockId,occurrence,totals,now=Date.now()){
  const scheduled=calendarTaskBlock(task,blockId,occurrence);
  if(!scheduled)return {status:'',focusMs:0};
  const focusMs=totals.get(calendarFocusKey(task.id,occurrence,blockId))||0;
  const {minutes}=scheduled;
  const target=minutes<=60?minutes:Math.floor(minutes/60)*50+Math.min(50,minutes%60);
  const status=focusMs>=target*60000?'focused':focusMs>0?'partial':scheduled.end<=now?'missed':'';
  return {status,focusMs};
}

export function allDayEvents(events,date){
  const day=dayKey(date);
  return events.filter(event=>event.day&&event.day<=day&&day<event.endDay);
}

export function calendarBlocks(tasks, date, events=[]) {
  const previous = shiftDay(date, -1);
  const blocks = [];
  const today = dayKey(date);
  const yesterday = dayKey(previous);
  for (const task of tasks) {
    for (const day of [today,yesterday]) {
      const schedules=(task.blocks||[]).filter(entry=>entry.date===day);
      const time=scheduledTaskTime(task,day);
      if(time&&taskOccursOn(task,day===today?date:previous))schedules.push({time,minutes:task.estimate||defaultBlockMinutes});
      for(const entry of schedules){
        const start=timeMinutes(entry.time), end=start+entry.minutes;
        if(day===today)blocks.push({task,blockId:entry.id,taskDay:entry.taskDay,start,end:Math.min(end,minutesPerDay),occurrence:today,continues:false});
        else if(end>minutesPerDay)blocks.push({task,blockId:entry.id,taskDay:entry.taskDay,start:0,end:end-minutesPerDay,occurrence:yesterday,continues:true});
      }
    }
  }
  const dayStart=new Date(date.getFullYear(),date.getMonth(),date.getDate()).getTime();
  const dayEnd=shiftDay(date,1).getTime();
  const clockMinute=timestamp=>{
    const local=new Date(timestamp);
    return local.getHours()*60+local.getMinutes();
  };
  for(const event of events){
    if(event.day||event.start>=dayEnd||Math.max(event.end,event.start+60000)<=dayStart)continue;
    const start=event.start<=dayStart?0:clockMinute(event.start);
    const end=event.end>=dayEnd?1440:Math.max(start+1,clockMinute(event.end));
    blocks.push({event,start,end,continues:event.start<dayStart});
  }
  return layoutBlocks(blocks);
}

export function openFocusBlock({task,occurrence,taskDay=occurrence}){
  return !task.done&&task.completedOn!==taskDay&&!task.completions?.includes(taskDay);
}

export function focusCalendarBlock(task,date=new Date()){
  return calendarBlocks([task],date).find(openFocusBlock);
}

export function focusTaskQueue(tasks,date=new Date(),pinnedIds=[],tasksById=new Map(tasks.map(task=>[task.id,task]))){
  const day=dayKey(date);
  const ready=tasks.filter(task=>!(task.snoozedUntil>day)&&!unfinishedPrerequisites(task,tasksById).length);
  const scheduled=[...new Set(calendarBlocks(ready,date).filter(openFocusBlock).map(block=>block.task))];
  const queued=new Set(scheduled);
  const unscheduled=ready.filter(task=>!queued.has(task)&&taskStatus(task,date)==='todo');
  const automatic=[...scheduled,...unscheduled.sort((a,b)=>taskPriority(a)-taskPriority(b))];
  const rank=new Map(pinnedIds.map((id,index)=>[id,index]));
  return pinnedIds.length?automatic.sort((a,b)=>(rank.get(a.id)??pinnedIds.length)-(rank.get(b.id)??pinnedIds.length)):automatic;
}

export function tasksWithinTime(queue,minutes){
  return queue.filter(task=>Number.isInteger(task.estimate)&&task.estimate>0&&task.estimate<=minutes)
    .sort((a,b)=>taskPriority(a)-taskPriority(b)||b.estimate-a.estimate).slice(0,5);
}

const replanStep=15;
const roundUp=minute=>Math.ceil(minute/replanStep)*replanStep;
function openSlots(busy,from,cutoff){
  const slots=[];
  let start=roundUp(from);
  for(const block of busy){
    if(start>=cutoff)break;
    const end=Math.min(block.start,cutoff);
    if(start<end)slots.push({start,end});
    start=Math.max(start,roundUp(block.end));
  }
  if(start<cutoff)slots.push({start,end:cutoff});
  return slots;
}
function tomorrowBusy(tasks,events,date,previous){
  const day=dayKey(date);
  return calendarBlocks(tasks,date,events).filter(block=>(block.event||openFocusBlock(block))&&
    !(previous?.ownsBlock&&previous.day===day&&block.occurrence===day&&block.task?.id===previous.taskId&&block.blockId===previous.blockId));
}
export function withCooldown(blocks,minutes=0){
  return blocks.map(block=>({...block,start:block.start-minutes,end:block.end+minutes}));
}

export function tomorrowFocusSlot(tasks,events,date,minutes,previous,availability=[],cooldown=0){
  const busy=[...withCooldown(tomorrowBusy(tasks,events,date,previous),cooldown),...unavailableRanges(availability,date)].sort((a,b)=>a.start-b.start);
  return openSlots(busy,9*60,minutesPerDay)
    .find(slot=>slot.end-slot.start>=minutes)?.start??null;
}
export function reserveTomorrowFocus(tasks,events,date,{taskId,start,minutes},previous,availability=[]){
  const day=dayKey(date),task=tasks.find(item=>item.id===taskId);
  if(!task||!Number.isInteger(start)||start<0||!Number.isInteger(minutes)||minutes<1||start+minutes>minutesPerDay){
    throw new Error('Choose a task and a focus block that fits within tomorrow.');
  }
  const blocked=unavailableRanges(availability,date).find(range=>range.start<start+minutes&&range.end>start);
  if(blocked)throw new Error(`That time is unavailable (${blocked.name}). Choose a different time.`);
  const overlaps=tomorrowBusy(tasks,events,date,previous).filter(block=>block.start<start+minutes&&block.end>start);
  const existing=overlaps.find(block=>block.task?.id===taskId&&!block.continues&&block.start===start&&block.end===start+minutes);
  if(overlaps.some(block=>block!==existing))throw new Error('That time overlaps a calendar block. Pick another time.');
  const changes=new Map();
  const ownedTask=previous?.day===day&&previous.ownsBlock&&tasks.find(item=>item.id===previous.taskId);
  const owned=ownedTask?.blocks?.find(block=>block.id===previous.blockId&&block.date===day);
  if(owned)changes.set(ownedTask.id,ownedTask.blocks.filter(block=>block!==owned));
  const block=existing?null:{...(ownedTask===task?owned:null),id:ownedTask===task&&owned?owned.id:globalThis.crypto.randomUUID(),date:day,time:timeValue(start),minutes};
  if(block)changes.set(task.id,[...(changes.get(task.id)||task.blocks||[]),block]);
  return {plan:{day,taskId,blockId:block?.id||existing?.blockId||null,ownsBlock:Boolean(block)},changes};
}
function twoSlots(slots,minutes){
  if(minutes<2*replanStep)return null;
  for(let index=0;index<slots.length;index++){
    const first=slots[index];
    const firstMinutes=Math.min(first.end-first.start,minutes-replanStep);
    if(firstMinutes<replanStep)continue;
    const second=slots.slice(index+1).find(slot=>slot.end-slot.start>=minutes-firstMinutes);
    if(second)return [{to:first.start,minutes:firstMinutes},{to:second.start,minutes:minutes-firstMinutes}];
  }
  return null;
}

export function replanToday(tasks,events,now=new Date(),lockedTaskId,options){
  const cutoff=options?.cutoff??minutesPerDay;
  const cooldown=options?.cooldown??0;
  const focus=options?.focus??new Map();
  const day=dayKey(now);
  const nextDate=shiftDay(now,1), tomorrow=dayKey(nextDate);
  const elapsed=now.getHours()*60+now.getMinutes()+now.getSeconds()/60+now.getMilliseconds()/60000;
  const blocks=calendarBlocks(tasks,now,events);
  const isBusy=block=>block.event||openFocusBlock(block);
  const busy=withCooldown(blocks.filter(block=>block.end+cooldown>elapsed&&isBusy(block)),cooldown);
  const busyTomorrow=options?withCooldown(calendarBlocks(tasks,nextDate,events).filter(isBusy),cooldown):[];
  if(options?.availability){
    busy.push(...unavailableRanges(options.availability,now));
    busyTomorrow.push(...unavailableRanges(options.availability,nextDate));
    busy.sort((a,b)=>a.start-b.start);
    busyTomorrow.sort((a,b)=>a.start-b.start);
  }
  const missed=blocks.filter(block=>block.task&&!block.continues&&block.end<=elapsed&&block.task.id!==lockedTaskId&&openFocusBlock(block)&&
    !focus.get(calendarFocusKey(block.task.id,block.occurrence,block.blockId)));
  const moves=[], unplaced=[];
  for(const block of missed){
    const {task,blockId,start}=block;
    const entry=task.blocks?.find(item=>item.id===blockId);
    const minutes=entry?.minutes||task.estimate||defaultBlockMinutes;
    const details={taskId:task.id,blockId:blockId||null,title:task.text,from:start,minutes};
    const slots=openSlots(busy,elapsed,cutoff);
    const whole=slots.find(slot=>slot.end-slot.start>=minutes);
    let parts=whole?[{to:whole.start,minutes}]:options?twoSlots(slots,minutes):null;
    let targetDay=day, reserved=busy;
    if(!parts&&options){
      const next=openSlots(busyTomorrow,9*60,cutoff).find(slot=>slot.end-slot.start>=minutes);
      if(next){parts=[{to:next.start,minutes}];targetDay=tomorrow;reserved=busyTomorrow;}
    }
    if(!parts){unplaced.push(details);continue;}
    moves.push({...details,to:parts[0].to,...(options?{day:targetDay,parts}:{})});
    reserved.push(...withCooldown(parts.map(part=>({start:part.to,end:part.to+part.minutes})),cooldown));
    reserved.sort((a,b)=>a.start-b.start);
  }
  return {day,moves,unplaced};
}

export function applyCalendarReplan(task,sourceDay,move){
  const {day,parts,blockId}=move;
  const recurring=task.repeat&&task.repeat!=='none';
  const existing=task.blocks?.find(block=>block.id===blockId);
  const taskDay=existing?.taskDay||(recurring?sourceDay:undefined);
  const first=parts[0];
  if(existing){
    Object.assign(existing,{date:day,time:timeValue(first.to),minutes:first.minutes,taskDay});
  }else if(parts.length===1&&!recurring){
    scheduleTask(task,day,first.to);
    task.occurrenceTimes={};
    return;
  }else if(parts.length===1&&day===sourceDay){
    task.occurrenceTimes={...task.occurrenceTimes,[sourceDay]:timeValue(first.to)};
    return;
  }else task.occurrenceTimes={...task.occurrenceTimes,[sourceDay]:''};
  for(const part of existing?parts.slice(1):parts){
    const block=addTaskBlock(task,day,timeValue(part.to),part.minutes);
    if(taskDay)block.taskDay=taskDay;
  }
}

function layoutBlocks(blocks) {
  blocks.sort((a, b) => a.start - b.start || b.end - a.end);
  let group = [];
  let laneEnds = [];
  let groupEnd = 0;
  function finishGroup() {
    for (const block of group) block.lanes = laneEnds.length;
    group = [];
    laneEnds = [];
    groupEnd = 0;
  }
  for (const block of blocks) {
    if (block.start >= groupEnd) finishGroup();
    const free = laneEnds.findIndex(end => end <= block.start);
    block.lane = free === -1 ? laneEnds.length : free;
    laneEnds[block.lane] = block.end;
    groupEnd = Math.max(groupEnd, block.end);
    group.push(block);
  }
  finishGroup();
  return blocks;
}
