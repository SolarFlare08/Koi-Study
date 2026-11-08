import {dayKey, taskOccursOn} from './state.js';

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

export function addTaskBlock(task, date, time, minutes = task.estimate || defaultBlockMinutes) {
  const block = {id: globalThis.crypto.randomUUID(), date, time, minutes};
  (task.blocks ??= []).push(block);
  return block;
}

export function blockFocusTiming(task, blockId, occurrence, now = Date.now()) {
  const date = new Date(`${occurrence}T00:00:00`);
  const entry = blockId
    ? task.blocks?.find(block => block.id === blockId && block.date === occurrence)
    : taskOccursOn(task, date) && task;
  if (!entry?.time) return null;
  const minutes = entry.minutes || task.estimate || defaultBlockMinutes;
  const start = new Date(`${occurrence}T${entry.time}`);
  const end = new Date(date);
  end.setMinutes(timeMinutes(entry.time) + minutes);
  return {available: Math.max(0, end - Math.max(start, now)), split: minutes > 60, early: now < start};
}

export function calendarBlocks(tasks, date) {
  const previous = shiftDay(date, -1);
  const blocks = [];
  const today = dayKey(date);
  const yesterday = dayKey(previous);
  for (const task of tasks) {
    const schedules = [...(task.blocks || [])];
    if (task.time) schedules.push({time:task.time, minutes:task.estimate || defaultBlockMinutes});
    for (const entry of schedules) {
      const start = timeMinutes(entry.time);
      const end = start + entry.minutes;
      const occursToday = entry.id ? entry.date === today : taskOccursOn(task, date);
      const occursYesterday = entry.id ? entry.date === yesterday : taskOccursOn(task, previous);
      if (occursToday) blocks.push({task, blockId:entry.id, start, end:Math.min(end, minutesPerDay), occurrence:today, continues:false});
      if (end > minutesPerDay && occursYesterday) blocks.push({task, blockId:entry.id, start:0, end:end-minutesPerDay, occurrence:yesterday, continues:true});
    }
  }
  return layoutBlocks(blocks);
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
