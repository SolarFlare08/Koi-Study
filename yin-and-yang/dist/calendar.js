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

export function calendarBlocks(tasks, date) {
  const previous = shiftDay(date, -1);
  const blocks = [];
  for (const task of tasks) {
    if (!task.time) continue;
    const [hour, minute] = task.time.split(':').map(Number);
    const start = hour * 60 + minute;
    const end = start + (task.estimate || defaultBlockMinutes);
    if (taskOccursOn(task, date)) {
      blocks.push({task, start, end: Math.min(end, minutesPerDay), occurrence: dayKey(date), continues: false});
    }
    if (end > minutesPerDay && taskOccursOn(task, previous)) {
      blocks.push({task, start: 0, end: end - minutesPerDay, occurrence: dayKey(previous), continues: true});
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
