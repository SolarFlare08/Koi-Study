import {dayKey, taskOccursOn, taskPriority, taskStatus} from './state.js';

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
  return task.time ? task.occurrenceTimes?.[occurrence]||task.time : '';
}

export function blockFocusTiming(task, blockId, occurrence, now = Date.now()) {
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
  return {available: Math.max(0, end - Math.max(start, now)), split: minutes > 60, early: now < start};
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
        if(day===today)blocks.push({task,blockId:entry.id,start,end:Math.min(end,minutesPerDay),occurrence:today,continues:false});
        else if(end>minutesPerDay)blocks.push({task,blockId:entry.id,start:0,end:end-minutesPerDay,occurrence:yesterday,continues:true});
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

function openFocusBlock({task,occurrence}){
  return !task.done&&task.completedOn!==occurrence&&!task.completions?.includes(occurrence);
}

export function focusCalendarBlock(task,date=new Date()){
  return calendarBlocks([task],date).find(openFocusBlock);
}

export function focusTaskQueue(tasks,date=new Date(),pinnedIds=[]){
  const scheduled=[...new Set(calendarBlocks(tasks,date).filter(openFocusBlock).map(block=>block.task))];
  const queued=new Set(scheduled);
  const unscheduled=tasks.filter(task=>!queued.has(task)&&taskStatus(task,date)==='todo');
  const automatic=[...scheduled,...unscheduled.sort((a,b)=>taskPriority(a)-taskPriority(b))];
  const rank=new Map(pinnedIds.map((id,index)=>[id,index]));
  return pinnedIds.length?automatic.sort((a,b)=>(rank.get(a.id)??pinnedIds.length)-(rank.get(b.id)??pinnedIds.length)):automatic;
}

export function replanToday(tasks,events,now=new Date(),lockedTaskId){
  const day=dayKey(now);
  const elapsed=now.getHours()*60+now.getMinutes()+now.getSeconds()/60+now.getMilliseconds()/60000;
  const roundUp=minute=>Math.ceil(minute/15)*15;
  const blocks=calendarBlocks(tasks,now,events);
  const busy=blocks.filter(block=>block.end>elapsed&&(block.event||openFocusBlock(block)));
  const missed=blocks.filter(block=>block.task&&!block.continues&&block.end<=elapsed&&block.task.id!==lockedTaskId&&openFocusBlock(block));
  const moves=[], unplaced=[];
  for(const block of missed){
    const {task,blockId,start}=block;
    const entry=task.blocks?.find(item=>item.id===blockId);
    const minutes=entry?.minutes||task.estimate||defaultBlockMinutes;
    const details={taskId:task.id,blockId:blockId||null,title:task.text,from:start,minutes};
    let slot=roundUp(elapsed);
    for(const interval of busy){
      if(slot+minutes<=interval.start)break;
      if(slot<interval.end)slot=roundUp(interval.end);
    }
    if(slot+minutes>minutesPerDay){unplaced.push(details);continue;}
    moves.push({...details,to:slot});
    busy.push({start:slot,end:slot+minutes});
    busy.sort((a,b)=>a.start-b.start);
  }
  return {day,moves,unplaced};
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
