import {allDayEvents, calendarBlocks, calendarFocusKey, calendarTaskBlock, openFocusBlock, planningEventRanges, shiftDay, timeMinutes, withCooldown} from './calendar.js';
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

export function todayTradeoffs({task,tasks,events,availability,focus,locked,cutoff,capacity,cooldown,protectedBlock},now=new Date()){
  const today=dayKey(now),tomorrowDate=shiftDay(now,1),tomorrow=dayKey(tomorrowDate);
  const minutes=task.estimate||60;
  if(task.done||task.snoozedUntil>today||task.deadline&&task.deadline<today||
    task.repeat&&task.repeat!=='none'&&taskStatus(task,now)!=='todo'||
    unfinishedPrerequisites(task,new Map(tasks.map(item=>[item.id,item]))).length)return [];
  const from=Math.max(workdayStart,Math.ceil(minuteOfDay(now)));
  if(allDayEvents(events,now).length||from>=cutoff||minutes>capacity)return [];
  const scheduled=commitments(tasks,[],now);
  if(scheduled.some(block=>block.task.id===task.id&&block.end>minuteOfDay(now)))return [];
  const fixed=new Map([now,tomorrowDate].map(date=>[date,[...planningEventRanges(events,date,cooldown),...unavailableRanges(availability,date)]]));
  function free(blocks,day,start,extra=[]){
    const busy=[...fixed.get(day),...withCooldown([...blocks,...extra],cooldown)].sort((a,b)=>a.start-b.start);
    return freeRanges(busy,start,cutoff);
  }
  const find=(ranges,length)=>ranges.find(range=>range.end-range.start>=length)?.start;
  const enough=(blocks,additional)=>blocks.reduce((sum,block)=>sum+block.end-block.start,additional)<=capacity;
  const options=[];
  const open=free(scheduled,now,from);
  if(enough(scheduled,minutes)){
    const start=find(open,minutes);
    if(start!==undefined)return [{parts:[{start,minutes}]}];
    for(const [index,first] of open.entries()){
      const firstMinutes=Math.min(first.end-first.start,minutes-15);
      if(firstMinutes<15)continue;
      const second=find(open.slice(index+1),minutes-firstMinutes);
      if(second!==undefined){
        options.push({parts:[{start:first.start,minutes:firstMinutes},{start:second,minutes:minutes-firstMinutes}]});
        break;
      }
    }
  }
  const nextBlocks=commitments(tasks,[],tomorrowDate);
  const nextOpen=allDayEvents(events,tomorrowDate).length?[]:free(nextBlocks,tomorrowDate,workdayStart);
  const moved=new Set();
  for(const block of scheduled){
    const {task:other,blockId,occurrence,start,end}=block;
    if(block.continues||occurrence!==today||start<=minuteOfDay(now)||other.id===locked||other.id===task.id||moved.has(other.id)||
      (protectedBlock?.taskId===other.id&&protectedBlock.blockId===(blockId||null)&&protectedBlock.day===today)||
      focus.get(calendarFocusKey(other.id,occurrence,blockId)))continue;
    const booking=calendarTaskBlock(other,blockId,occurrence);
    const length=end-start;
    if(!booking||booking.minutes!==length||other.deadline&&other.deadline<today)continue;
    const remaining=scheduled.filter(item=>item!==block);
    if(!enough(remaining,minutes))continue;
    const openWithoutBlock=free(remaining,now,from).filter(range=>range.end-range.start>=minutes);
    if(!openWithoutBlock.length)continue;
    const nextStart=other.deadline&&other.deadline<tomorrow||other.snoozedUntil>tomorrow||!enough(nextBlocks,length)?undefined:find(nextOpen,length);
    let startNew=openWithoutBlock[0].start, sameStart;
    if(enough(scheduled,minutes)){
      for(const range of openWithoutBlock){
        for(const start of [range.start,range.end-minutes]){
          sameStart=find(free(remaining,now,from,[{start,end:start+minutes}]),length);
          if(sameStart!==undefined){startNew=start;break;}
        }
        if(sameStart!==undefined)break;
      }
    }
    const startMoved=sameStart??nextStart;
    if(startMoved===undefined)continue;
    options.push({parts:[{start:startNew,minutes}],move:{taskId:other.id,title:other.text,blockId:blockId||null,from:start,
      day:sameStart===undefined?tomorrow:today,parts:[{to:startMoved,minutes:length}]}});
    moved.add(other.id);
    if(options.length===3)break;
  }
  return options;
}

export function projectHealth(state,now=new Date()){
  const {tasks,projects,calendarEvents,availability,history,studyCapacity,planningCooldown}=state;
  const today=dayKey(now), cutoff=timeMinutes(state.replanCutoff)||dayMinutes;
  const horizon=shiftDay(now,365), lastDay=dayKey(horizon);
  const activeProjects=projects.filter(project=>!project.archived);
  const archived=new Set(projects.filter(project=>project.archived).map(project=>project.id));
  const activeTasks=tasks.filter(task=>!archived.has(task.projectId));
  const byId=new Map(tasks.map(task=>[task.id,task]));
  const ready=new Set(activeTasks.filter(task=>taskStatus(task,now)==='todo'&&!(task.snoozedUntil>today)&&
    !unfinishedPrerequisites(task,byId).length).map(task=>task.id));
  const deadlineByTask=new Map(activeTasks.filter(task=>task.deadline).map(task=>[task.id,task.deadline]));
  for(const project of activeProjects){
    for(const milestone of project.milestones||[]){
      for(const id of milestone.taskIds){
        const task=byId.get(id);
        if(task?.projectId!==project.id||task.repeat&&task.repeat!=='none'&&(task.completedOn||task.completions?.length))continue;
        const existing=deadlineByTask.get(id);
        if(!existing||milestone.date<existing)deadlineByTask.set(id,milestone.date);
      }
    }
  }
  const timed=activeTasks.filter(task=>!task.done&&deadlineByTask.has(task.id))
    .map(task=>({...task,deadline:deadlineByTask.get(task.id)}))
    .sort((a,b)=>a.deadline.localeCompare(b.deadline)||taskPriority(a)-taskPriority(b));
  const days=new Map(), shortfalls=new Map(), capacityByTask=new Map();
  for(const task of timed){
    if(!canPlanDeadline(task)||task.deadline>lastDay)continue;
    const deadline=new Date(task.deadline+'T00:00:00');
    if(!Number.isFinite(+deadline)||dayKey(deadline)!==task.deadline)continue;
    const work=deadlineWork(task,history,now,shiftDay(now,0),deadline);
    let left=work.unplaced;
    if(work.noOccurrence&&task.deadline>=today)continue;
    const original=left;
    for(let date=shiftDay(now,0);left>0&&date<=deadline;date=shiftDay(date,1)){
      const key=dayKey(date);
      if(task.snoozedUntil>key)continue;
      if(!days.has(key)){
        const from=key===today?Math.max(workdayStart,Math.ceil(minuteOfDay(now))):workdayStart;
        days.set(key,studyDay(activeTasks,calendarEvents,availability,date,from,cutoff,studyCapacity,planningCooldown));
      }
      const day=days.get(key);
      while(left>0&&day.remaining>0&&day.ranges.length){
        const range=day.ranges[0];
        const minutes=Math.min(left,day.remaining,range.end-range.start,focusBlockMinutes);
        left-=minutes;day.remaining-=minutes;range.start+=minutes+planningCooldown;
        if(range.start>=range.end)day.ranges.shift();
      }
    }
    capacityByTask.set(task.id,{required:original,available:original-left});
    if(left)shortfalls.set(task.id,{task,minutes:left});
  }
  return activeProjects.map(project=>{
    const open=activeTasks.filter(task=>task.projectId===project.id&&!task.done);
    const next=open.find(task=>ready.has(task.id));
    const stalled=open.flatMap(task=>{
      const waiting=unfinishedPrerequisites(task,byId);
      return waiting.length?[{task,waiting}]:[];
    });
    const risks=open.flatMap(task=>shortfalls.has(task.id)?[shortfalls.get(task.id)]:[]);
    const {required,available}=open.reduce((total,task)=>{
      const capacity=capacityByTask.get(task.id);
      return capacity?{required:total.required+capacity.required,available:total.available+capacity.available}:total;
    },{required:0,available:0});
    const unestimated=open.filter(task=>deadlineByTask.has(task.id)&&!task.estimate).length;
    return {project,open:open.length,next,stalled,risks,required,available,unestimated};
  });
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
