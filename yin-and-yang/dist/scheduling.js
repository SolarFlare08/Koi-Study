import {allDayEvents, calendarBlocks, calendarTaskBlock, openFocusBlock, planningEventRanges, shiftDay, withCooldown} from './calendar.js';
import {dayKey, taskPriority, taskStatus, unfinishedPrerequisites} from './state.js';
import {unavailableRanges} from './availability.js';

const dayMinutes = 24 * 60;
const minuteMs = 60_000;
const workdayStart = 9 * 60;
const focusBlockMinutes = 50;

function occupiedMinutes(ranges, from, to) {
  if (from >= to) return 0;
  let cursor = from;
  let minutes = 0;
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    const end = Math.min(to, range.end);
    const start = Math.max(cursor, range.start);
    if (end <= start) continue;
    minutes += end - start;
    cursor = end;
  }
  return minutes;
}

function commitments(tasks, events, date, replacing) {
  return calendarBlocks(tasks, date, events).filter(block => {
    if (block.event) return true;
    if (!openFocusBlock(block)) return false;
    return !replacing || block.task.id !== replacing.taskId ||
      (block.blockId || null) !== replacing.blockId;
  });
}

function minuteOfDay(date) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60 + date.getMilliseconds() / minuteMs;
}

export function scheduleImpact(tasks, events, {date, start, minutes, replacing}, now, cutoff) {
  const day = new Date(`${date}T00:00:00`);
  if (!Number.isFinite(+day) || dayKey(day) !== date ||
      !Number.isInteger(start) || start < 0 || start >= dayMinutes ||
      !Number.isInteger(minutes) || minutes < 1 || minutes > dayMinutes) return null;
  const isToday = date === dayKey(now);
  const from = isToday ? Math.ceil(minuteOfDay(now)) : workdayStart;
  const proposal = {start, end: Math.min(start + minutes, dayMinutes)};
  const busy = commitments(tasks, events, day, replacing);
  const freeBefore = Math.max(0, cutoff - from) - occupiedMinutes(busy, from, cutoff);
  const freeAfter = Math.max(0, cutoff - from) - occupiedMinutes([...busy, proposal], from, cutoff);
  const overlaps = [];
  function addOverlaps(ranges, window, day) {
    for (const block of ranges) {
      const start = Math.max(window.start, block.start);
      const end = Math.min(window.end, block.end);
      if (end > start) overlaps.push({title: block.event ? block.event.title : block.task.text, date: day, start, end});
    }
  }
  addOverlaps(busy, proposal, date);
  if (start + minutes > dayMinutes) {
    const next = shiftDay(day, 1);
    addOverlaps(commitments(tasks, events, next, replacing), {start: 0, end: start + minutes - dayMinutes}, dayKey(next));
  }
  return {isToday, freeAfter, usesFreeMinutes: freeBefore - freeAfter, overlaps};
}

function freeRanges(busy, from, to) {
  const ranges = [];
  let cursor = from;
  for (const block of busy) {
    if (cursor >= to || block.start >= to) break;
    if (block.start > cursor) ranges.push({start: cursor, end: block.start});
    cursor = Math.max(cursor, block.end);
  }
  if (cursor < to) ranges.push({start: cursor, end: to});
  return ranges;
}

function studyDay(tasks,events,availability,day,from,end,capacity,cooldown){
  const busy=commitments(tasks,[],day);
  const eventRanges=planningEventRanges(events,day,cooldown);
  const unavailable=unavailableRanges(availability,day);
  const allDay=allDayEvents(events,day);
  const booked=busy.reduce((total,block)=>total+(block.task?block.end-block.start:0),0);
  const ranges=allDay.length?[]:freeRanges([...withCooldown(busy,cooldown),...eventRanges,...unavailable].sort((a,b)=>a.start-b.start),from,end);
  const context={from,end,booked,free:ranges.reduce((total,range)=>total+range.end-range.start,0),
    commitments:[...allDay.map(event=>({title:event.title,allDay:true})),...busy.map(block=>({title:block.task.text,start:block.start,end:block.end})),
      ...eventRanges,...unavailable.map(block=>({title:block.name,start:block.start,end:block.end}))].filter(block=>block.allDay||block.end+cooldown>from&&block.start-cooldown<end)};
  return {date:dayKey(day),ranges,context,remaining:Math.max(0,capacity-booked),slots:[]};
}

export function canPlanDeadline(task) {
  return !task.done && Number.isInteger(task.estimate) && task.estimate > 0 && Boolean(task.deadline);
}

function deadlineWork(task, history, now, firstDay, deadline) {
  const lastDay = shiftDay(deadline, 1);
  const recurring = task.repeat && task.repeat !== 'none';
  let occurrence = null;
  if (recurring) {
    for (let date = deadline; date >= firstDay; date = shiftDay(date, -1)) {
      if (taskStatus(task, date) !== 'todo') continue;
      occurrence = dayKey(date);
      break;
    }
    if (!occurrence) return {unplaced: task.estimate, booked: 0, recorded: 0, noOccurrence: true};
  }
  const blocks = task.blocks || [];
  const recorded = Math.floor(history.filter(session => {
    if (session.taskId !== task.id || session.mode !== 'focus' || session.outcome !== 'completed' ||
      session.finishedAt > +now || session.finishedAt >= +lastDay) return false;
    if (!recurring) return true;
    const link = session.calendarBlock;
    const block = blocks.find(item => item.id === link?.blockId);
    return (link?.taskDay || block?.taskDay || link?.occurrence || session.day) === occurrence;
  }).reduce((total, session) => total + session.focusMs, 0) / minuteMs);

  const existing = blocks.filter(block => !recurring || (block.taskDay || block.date) === occurrence)
    .map(block => calendarTaskBlock(task, block.id, block.date));
  if (task.date && task.time) existing.push(calendarTaskBlock(task, null, occurrence || task.date));
  const booked = Math.floor(occupiedMinutes(existing.filter(Boolean).map(block => ({start: +block.start, end: +block.end})),
    +now, +lastDay) / minuteMs);
  return {unplaced: Math.max(0, task.estimate - recorded - booked), booked, recorded, occurrence};
}

export function planDeadline(task, tasks, events, history, now, cutoff, dailyCapacity, {availability=[],cooldown=0}={}) {
  if (!canPlanDeadline(task)) return null;
  const deadline = new Date(`${task.deadline}T00:00:00`);
  if (!Number.isFinite(+deadline) || dayKey(deadline) !== task.deadline) return null;
  const today = shiftDay(now, 0);
  const firstDay = new Date(Math.max(+today, +shiftDay(deadline, -365)));
  const work = deadlineWork(task, history, now, firstDay, deadline);
  if (work.noOccurrence) return {slots: [], ...work};
  let {unplaced, booked, recorded, occurrence} = work;
  const days = [];
  const slots = [];

  function takeLatest(day) {
    const range = day.ranges.at(-1);
    if (!range || day.capacity <= 0 || unplaced <= 0) return;
    const minutes = Math.min(focusBlockMinutes, day.capacity, unplaced, range.end - range.start);
    slots.push({date: day.date, start: range.end - minutes, minutes});
    day.capacity -= minutes;
    unplaced -= minutes;
    range.end -= minutes+cooldown;
    if (range.end <= range.start) day.ranges.pop();
  }

  // Spread the first blocks over separate days before adding more on a day.
  for (let date = deadline; unplaced > 0 && date >= firstDay; date = shiftDay(date, -1)) {
    const from = dayKey(date) === dayKey(now) ? Math.max(workdayStart, Math.ceil(minuteOfDay(now))) : workdayStart;
    const day = studyDay(tasks,events,availability,date,from,cutoff,dailyCapacity,cooldown);
    if(!day.ranges.length||!day.remaining)continue;
    day.capacity=day.remaining;
    days.push(day);
    takeLatest(day);
  }
  for (const day of days) {
    while (unplaced > 0 && day.capacity > 0 && day.ranges.length) takeLatest(day);
  }
  slots.sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  return {slots, unplaced, booked, recorded, occurrence, lastYearOnly: firstDay > today,
    contexts:Object.fromEntries(days.map(day=>[day.date,day.context]))};
}

export function draftStudyWeek({tasks, events, history, availability, tasksById}, {date, start, end, capacity,cooldown=0,proposed}, now = new Date()) {
  const first = new Date(`${date}T00:00:00`);
  const today = dayKey(now);
  if (!Number.isFinite(+first) || dayKey(first) !== date || date < today ||
    !Number.isInteger(start) || start < 0 || !Number.isInteger(end) || end > dayMinutes || start >= end ||
    !Number.isInteger(capacity) || capacity < 1 || capacity > dayMinutes || !Number.isInteger(cooldown)||cooldown<0||cooldown>30) return null;

  const days = Array.from({length: 7}, (_, index) => {
    const day = shiftDay(first, index);
    const key = dayKey(day);
    const from = key === today ? Math.max(start, Math.ceil(minuteOfDay(now))) : start;
    return studyDay(tasks,events,availability,day,from,end,capacity,cooldown);
  });

  const last = days.at(-1).date;
  const risks = [];
  const deadlines = tasks.filter(task => !task.done && task.deadline && task.deadline <= last)
    .sort((a, b) => a.deadline.localeCompare(b.deadline) || taskPriority(a) - taskPriority(b));
  const workByTask=new Map(deadlines.filter(canPlanDeadline).flatMap(task=>{
    const deadline=new Date(`${task.deadline}T00:00:00`);
    return dayKey(deadline)===task.deadline?[[task.id,deadlineWork(task,history,now,shiftDay(now,0),deadline)]]:[];
  }));
  const invalid=[],planned=new Map();
  if(proposed){
    const byDay=new Map(days.map(day=>[day.date,day]));
    const byTask=new Map(deadlines.map(task=>[task.id,task]));
    for(const slot of [...proposed].sort((a,b)=>a.start-b.start)){
      const day=byDay.get(slot.date),task=byTask.get(slot.taskId),work=workByTask.get(slot.taskId);
      if(!day)continue;
      day.slots.push(slot);
      const minutes=slot.minutes,start=slot.start;
      const fits=day.ranges.some(range=>range.start<=start&&start+minutes<=range.end);
      const overlaps=day.slots.some(other=>other!==slot&&other.start+other.minutes+cooldown>start);
      if(!task||!work||work.noOccurrence||slot.occurrence!==work.occurrence||task.deadline<slot.date||task.snoozedUntil>slot.date||
        unfinishedPrerequisites(task,tasksById).length||!Number.isInteger(start)||!Number.isInteger(minutes)||minutes<1||
        minutes>focusBlockMinutes||minutes>day.remaining||!fits||overlaps){invalid.push(slot);continue;}
      day.remaining-=minutes;
      planned.set(task.id,(planned.get(task.id)||0)+minutes);
    }
  }
  for (const task of deadlines) {
    const deadline = new Date(`${task.deadline}T00:00:00`);
    if (!Number.isFinite(+deadline) || dayKey(deadline) !== task.deadline) continue;
    if (!canPlanDeadline(task)) {
      if (task.repeat === 'none' || !task.repeat || !task.completedOn || task.completedOn < task.deadline) {
        risks.push({task, reason: 'estimate'});
      }
      continue;
    }
    const work = workByTask.get(task.id);
    let unplaced = Math.max(0,work.unplaced-(planned.get(task.id)||0));
    if (!unplaced) continue;
    let reason = proposed?'unplanned':'capacity';
    if (task.deadline < today) reason = 'overdue';
    else if (work.noOccurrence) reason = 'occurrence';
    else if (unfinishedPrerequisites(task, tasksById).length) reason = 'prerequisite';
    else if(!proposed){
      for (const day of days) {
        if (day.date > task.deadline || !unplaced) break;
        if (task.snoozedUntil > day.date) continue;
        while (unplaced && day.remaining && day.ranges.length) {
          const range = day.ranges[0];
          const minutes = Math.min(focusBlockMinutes, day.remaining, unplaced, range.end - range.start);
          day.slots.push({taskId: task.id, date: day.date, start: range.start, minutes, occurrence: work.occurrence});
          range.start += minutes+cooldown;
          day.remaining -= minutes;
          unplaced -= minutes;
          if (range.start >= range.end) day.ranges.shift();
        }
      }
    }
    if (unplaced) risks.push({task, reason, unplaced});
  }

  return {days: days.map(({date, slots, context}) => ({date, slots,context})), risks, invalid, deadlines: deadlines.length};
}
