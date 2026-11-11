import {calendarBlocks, calendarTaskBlock, openFocusBlock, shiftDay} from './calendar.js';
import {dayKey, taskStatus} from './state.js';

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

export function canPlanDeadline(task) {
  return !task.done && Number.isInteger(task.estimate) && task.estimate > 0 && Boolean(task.deadline);
}

export function planDeadline(task, tasks, events, history, now, cutoff, dailyCapacity) {
  if (!canPlanDeadline(task)) return null;
  const deadline = new Date(`${task.deadline}T00:00:00`);
  if (!Number.isFinite(+deadline) || dayKey(deadline) !== task.deadline) return null;
  const today = shiftDay(now, 0);
  const lastDay = shiftDay(deadline, 1);
  const firstDay = new Date(Math.max(+today, +shiftDay(deadline, -365)));
  const recurring = task.repeat && task.repeat !== 'none';
  let occurrence = null;
  if (recurring) {
    for (let date = deadline; date >= firstDay; date = shiftDay(date, -1)) {
      if (taskStatus(task, date) !== 'todo') continue;
      occurrence = dayKey(date);
      break;
    }
    if (!occurrence) return {slots: [], unplaced: task.estimate, booked: 0, recorded: 0, noOccurrence: true};
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
  let unplaced = Math.max(0, task.estimate - recorded - booked);
  const days = [];
  const slots = [];

  function takeLatest(day) {
    const range = day.ranges.at(-1);
    if (!range || day.capacity <= 0 || unplaced <= 0) return;
    const minutes = Math.min(focusBlockMinutes, day.capacity, unplaced, range.end - range.start);
    slots.push({date: day.date, start: range.end - minutes, minutes});
    day.capacity -= minutes;
    unplaced -= minutes;
    range.end -= minutes;
    if (range.end === range.start) day.ranges.pop();
  }

  // Spread the first blocks over separate days before adding more on a day.
  for (let date = deadline; unplaced > 0 && date >= firstDay; date = shiftDay(date, -1)) {
    const busy = commitments(tasks, events, date);
    const planned = busy.reduce((total, block) => total + (block.task ? block.end - block.start : 0), 0);
    const capacity = Math.max(0, dailyCapacity - planned);
    if (!capacity) continue;
    const from = dayKey(date) === dayKey(now) ? Math.max(workdayStart, Math.ceil(minuteOfDay(now))) : workdayStart;
    const ranges = freeRanges(busy, from, cutoff);
    if (!ranges.length) continue;
    const day = {date: dayKey(date), capacity, ranges};
    days.push(day);
    takeLatest(day);
  }
  for (const day of days) {
    while (unplaced > 0 && day.capacity > 0 && day.ranges.length) takeLatest(day);
  }
  slots.sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  return {slots, unplaced, booked, recorded, occurrence, lastYearOnly: firstDay > today};
}
