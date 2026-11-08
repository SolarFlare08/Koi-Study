export const STORAGE_KEY = 'yin-and-yang.v1';
export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const taskFrequencies = { none:'Does not repeat', daily:'Every day', weekdays:'Weekdays', weekly:'Every week' };

export function taskOccursOn(task, date) {
  const day = dayKey(date);
  if (!task.date || task.date > day) return false;
  if (task.repeat === 'daily') return true;
  if (task.repeat === 'weekdays') return date.getDay() !== 0 && date.getDay() !== 6;
  if (task.repeat === 'weekly') return new Date(`${task.date}T00:00:00`).getDay() === date.getDay();
  return task.date === day;
}

export function taskStatus(task, date = new Date()) {
  const today = dayKey(date);
  if (task.repeat === 'none' || !task.repeat) {
    if (task.done) return 'done';
    return task.date > today ? 'upcoming' : 'todo';
  }
  if (!taskOccursOn(task, date)) return 'upcoming';
  return task.completedOn === today ? 'done' : 'todo';
}

export function completeTask(task, checked, date = new Date()) {
  if (!task.repeat || task.repeat === 'none') task.done = checked;
  else task.completedOn = checked ? dayKey(date) : '';
}

function loadTask(task) {
  const repeat = Object.hasOwn(taskFrequencies,task.repeat) ? task.repeat : 'none';
  return {
    id:task.id, text:task.text, done:task.done,
    description:typeof task.description === 'string' ? task.description : '',
    date:/^\d{4}-\d{2}-\d{2}$/.test(task.date) ? task.date : repeat === 'none' ? '' : dayKey(),
    time:/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(task.time) ? task.time : '',
    estimate:Number.isInteger(task.estimate) && task.estimate > 0 && task.estimate <= 1440 ? task.estimate : null,
    repeat,
    priority:task.priority === true,
    blocks:Array.isArray(task.blocks) ? task.blocks.filter(block=>block && typeof block.id==='string' && /^\d{4}-\d{2}-\d{2}$/.test(block.date) && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(block.time) && Number.isInteger(block.minutes) && block.minutes>0 && block.minutes<=1440) : [],
    completedOn:/^\d{4}-\d{2}-\d{2}$/.test(task.completedOn) ? task.completedOn : ''
  };
}
export const duration = (state, mode = state.timer.mode) => Math.round(state.settings[mode] * 60) * 1000;
export function parseDuration(text) {
  const match = /^(\d{1,3})(?::([0-5]\d))?$/.exec(text.trim());
  if (!match) return null;
  const seconds = Number(match[1]) * 60 + Number(match[2] || 0);
  return seconds >= 1 && seconds <= 10800 ? seconds * 1000 : null;
}
export function formatDuration(ms) {
  const seconds = Math.ceil(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
export function freshState() {
  return { settings: { focus:25, break:5, savesInlineDuration:true }, routines:[], intention:'', tasks:[], activeTask:null, notes:'', history:[], spotify:'', focusMode:false,
    timer:{ mode:'focus', status:'idle', remaining:25*60000, endAt:null, total:25*60000, startedAt:null, id:null } };
}
export function loadState(storage) {
  const base = freshState();
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!raw || typeof raw !== 'object') return base;
    if (Array.isArray(raw.routines)) base.routines=raw.routines.filter(routine=>routine && typeof routine.id==='string' && typeof routine.name==='string' && ['focus','rest'].every(key=>Number.isInteger(routine[key])&&routine[key]>=1000&&routine[key]<=10800000));
    for (const key of ['intention','notes','spotify']) if (typeof raw[key] === 'string') base[key] = raw[key];
    for (const mode of ['focus','break']) if (Number.isFinite(raw.settings?.[mode]) && raw.settings[mode]>=1/60 && raw.settings[mode]<=180) base.settings[mode]=raw.settings[mode];
    if (Array.isArray(raw.tasks)) base.tasks=raw.tasks.filter(t=>t && typeof t.id==='string' && typeof t.text==='string' && typeof t.done==='boolean').map(loadTask);
    base.activeTask=base.tasks.some(t=>t.id===raw.activeTask && taskStatus(t)==='todo')?raw.activeTask:null;
    if (Array.isArray(raw.history)) base.history=raw.history.filter(h=>h && typeof h.id==='string' && ['completed','skipped'].includes(h.outcome) && ['focus','break'].includes(h.mode) && Number.isFinite(h.finishedAt) && Number.isFinite(h.focusMs));
    base.focusMode=raw.focusMode===true;
    const t=raw.timer;
    if (t && ['focus','break'].includes(t.mode) && ['idle','running','paused'].includes(t.status) && Number.isFinite(t.remaining) && t.remaining>=0 && t.remaining<=10800000 && Number.isFinite(t.total) && t.total>0 && t.total<=10800000 && (t.status!=='running' || (Number.isFinite(t.endAt) && typeof t.id==='string' && Number.isFinite(t.startedAt)))) {
      base.timer={...t};
      const block=t.block;
      if (t.status==='idle' || typeof block?.taskId!=='string' || !Number.isFinite(block.left) || block.left<0 || block.left>25*3600000) delete base.timer.block;
      else if (base.tasks.some(task=>task.id===block.taskId)) base.activeTask=block.taskId;
      // Older versions saved inline edits only in the active timer.
      if (!raw.settings?.savesInlineDuration && t.total >= 1000) {
        base.settings[t.mode] = t.total / 60000;
      }
    }
    else base.timer.remaining=base.timer.total=duration(base);
    return base;
  } catch { return base; }
}
export function remaining(state, now=Date.now()) { return state.timer.status==='running' ? Math.max(0,state.timer.endAt-now) : state.timer.remaining; }
export function startPause(state, now=Date.now()) {
  const t=state.timer;
  if(t.status==='running') { t.remaining=remaining(state,now); t.endAt=null; t.status='paused'; }
  else { if (!t.id) { t.id=globalThis.crypto.randomUUID(); t.startedAt=now; } t.endAt=now+t.remaining; t.status='running'; }
}
export function reset(state, mode=state.timer.mode) {
  state.timer={mode,status:'idle',remaining:duration(state,mode),total:duration(state,mode),endAt:null,startedAt:null,id:null};
}
const blockPhaseLength={focus:50*60000,break:10*60000};

function startBlockPhase(state, mode, taskId, available, split, now) {
  const total=split ? Math.min(available,blockPhaseLength[mode]) : available;
  reset(state,mode);
  Object.assign(state.timer,{remaining:total,total,block:{taskId,left:available-total}});
  startPause(state,now);
}

export function startBlockFocus(state, taskId, available, split, now=Date.now()) {
  state.activeTask=taskId;
  startBlockPhase(state,'focus',taskId,available,split,now);
}

function advanceTimer(state, now) {
  const {mode,block}=state.timer;
  const next=mode==='focus'?'break':'focus';
  if (block?.left>0) startBlockPhase(state,next,block.taskId,block.left,true,now);
  else reset(state,block?'focus':next);
}

export function skipPhase(state, now=Date.now()) {
  const h=record(state,'skipped',now);
  advanceTimer(state,now);
  return h;
}
export function record(state, outcome, now=Date.now()) {
  const t=state.timer;
  if(!t.id || state.history.some(h=>h.id===t.id)) return null;
  const finish=outcome==='completed' && t.endAt ? t.endAt : now;
  const task=state.tasks.find(task=>task.id===t.block?.taskId);
  const h={id:t.id,mode:t.mode,outcome,finishedAt:finish,day:dayKey(new Date(finish)),focusMs:t.mode==='focus'?Math.max(0,t.total-remaining(state,now)):0,intention:task?.text??state.intention};
  state.history.push(h); return h;
}
export function settle(state, now=Date.now()) {
  if(state.timer.status!=='running' || remaining(state,now)>0) return null;
  const h=record(state,'completed',now);
  advanceTimer(state,state.timer.endAt);
  return h;
}
export function todayProgress(state, date=new Date()) {
  const items=state.history.filter(h=>h.day===dayKey(date) && h.mode==='focus');
  return {items,completed:items.filter(h=>h.outcome==='completed').length,skipped:items.filter(h=>h.outcome==='skipped').length,minutes:Math.floor(items.filter(h=>h.outcome==='completed').reduce((s,h)=>s+h.focusMs,0)/60000)};
}
