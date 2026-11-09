import {loadAppearance} from './garden-appearance.js';
import {loadSoundSettings} from './garden-audio.js';
import {captureTaskChange} from './task-undo.js';
import {loadGardenSchedule} from './garden-appearance.js';

export const STORAGE_KEY = 'yin-and-yang.v1';
export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const taskFrequencies = { none:'Does not repeat', daily:'Every day', weekdays:'Weekdays', weekly:'Every week', monthly:'Every month', yearly:'Every year', interval:'Every N days' };
const isDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value);
const dateNumber = date => Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000;
const loadCalendarEvents=value=>Array.isArray(value)?value.filter(item=>typeof item?.id==='string'&&typeof item.title==='string'&&
  (isDay(item.day)&&isDay(item.endDay)&&item.endDay>item.day||Number.isFinite(item.start)&&Number.isFinite(item.end)&&item.end>=item.start)):[];

export function taskOccursOn(task, date) {
  const day = dayKey(date);
  if (!task.date || task.date > day) return false;
  if (task.repeat === 'daily') return true;
  if (task.repeat === 'weekdays') return date.getDay() !== 0 && date.getDay() !== 6;
  const first = new Date(`${task.date}T00:00:00`);
  if (task.repeat === 'weekly') return first.getDay() === date.getDay();
  if (task.repeat === 'interval') return (dateNumber(date)-dateNumber(first))%(task.repeatEvery||2) === 0;
  if (task.repeat === 'monthly' || task.repeat === 'yearly') {
    const last = new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
    return date.getDate() === Math.min(first.getDate(),last) && (task.repeat === 'monthly' || date.getMonth() === first.getMonth());
  }
  return task.date === day;
}

export function taskStatus(task, date = new Date()) {
  const today = dayKey(date);
  if (task.repeat === 'none' || !task.repeat) {
    if (task.done) return 'done';
    return task.date > today ? 'upcoming' : 'todo';
  }
  if (!taskOccursOn(task, date)) return 'upcoming';
  return task.completedOn === today || task.completions?.includes(today) ? 'done' : 'todo';
}

export function completeTask(task, checked, date = new Date()) {
  const day = dayKey(date);
  if (!task.repeat || task.repeat === 'none') {
    task.done = checked;
    task.completedOn = checked ? day : '';
  } else {
    const completions = new Set(task.completions||[]);
    if (task.completedOn) completions.add(task.completedOn);
    if (checked) completions.add(day);
    else completions.delete(day);
    task.completions = [...completions].sort();
    task.completedOn = task.completions.at(-1)||'';
  }
}

export function recordTaskCompletion(state, task, checked, occurrence = new Date(), now = Date.now()) {
  const recurring = task.repeat && task.repeat !== 'none';
  const id = `${task.id}:${recurring ? dayKey(occurrence) : 'once'}`;
  const finishUndo=captureTaskChange(task,['done','completedOn','completions']);
  const prior=state.taskActivity.find(event=>event.id===id);
  completeTask(task, checked, recurring ? occurrence : new Date(now));
  state.taskActivity = state.taskActivity.filter(event => event.id !== id);
  if (checked) state.taskActivity.push({id, taskId:task.id, text:task.text, projectId:task.projectId||'', estimate:task.estimate||null, at:now});
  const undo=finishUndo();
  return latest=>{
    if ((latest.taskActivity.find(event=>event.id===id)?.at??null)!==(checked?now:null)) return false;
    if (!undo?.(latest)) return false;
    latest.taskActivity=latest.taskActivity.filter(event=>event.id!==id);
    if (prior) latest.taskActivity.push(prior);
    return true;
  };
}

export function taskPriority(task) { return task.priorityLevel || (task.priority ? 1 : 4); }

function loadTask(task) {
  const repeat = Object.hasOwn(taskFrequencies,task.repeat) ? task.repeat : 'none';
  return {
    id:task.id, text:task.text, done:task.done,
    description:typeof task.description === 'string' ? task.description : '',
    resumeNote:typeof task.resumeNote==='string'?task.resumeNote.slice(0,500):'',
    date:/^\d{4}-\d{2}-\d{2}$/.test(task.date) ? task.date : repeat === 'none' ? '' : dayKey(),
    time:/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(task.time) ? task.time : '',
    estimate:Number.isInteger(task.estimate) && task.estimate > 0 && task.estimate <= 1440 ? task.estimate : null,
    repeat,
    priority:task.priority === true,
    priorityLevel:[1,2,3,4].includes(task.priorityLevel)?task.priorityLevel:undefined,
    projectId:typeof task.projectId==='string'?task.projectId:'',
    sectionId:typeof task.sectionId==='string'?task.sectionId:'',
    labels:Array.isArray(task.labels)?task.labels.filter(label=>typeof label==='string'&&label.length<=40):[],
    deadline:isDay(task.deadline)?task.deadline:'',
    reminderAt:Number.isFinite(task.reminderAt)?task.reminderAt:null,
    reminderShown:task.reminderShown===true,
    repeatEvery:Number.isInteger(task.repeatEvery)&&task.repeatEvery>=2&&task.repeatEvery<=365?task.repeatEvery:2,
    subtasks:Array.isArray(task.subtasks)?task.subtasks.filter(item=>item&&typeof item.id==='string'&&typeof item.text==='string'&&typeof item.done==='boolean'):[],
    comments:Array.isArray(task.comments)?task.comments.filter(item=>item&&typeof item.id==='string'&&typeof item.text==='string'&&Number.isFinite(item.at)):[],
    completions:Array.isArray(task.completions)?task.completions.filter(isDay):[],
    blocks:Array.isArray(task.blocks) ? task.blocks.filter(block=>block && typeof block.id==='string' && /^\d{4}-\d{2}-\d{2}$/.test(block.date) && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(block.time) && Number.isInteger(block.minutes) && block.minutes>0 && block.minutes<=1440) : [],
    completedOn:/^\d{4}-\d{2}-\d{2}$/.test(task.completedOn) ? task.completedOn : ''
  };
}
export const duration = (state, mode = state.timer.mode) => Math.round(state.settings[mode] * 60) * 1000;
export function formatTypedDuration(text) {
  const digits=text.replace(/\D/g,'').replace(/^0+(?=\d)/,'').slice(0,5).padStart(4,'0');
  return `${digits.slice(0,-2)}:${digits.slice(-2)}`;
}
export function parseDuration(text) {
  const value=text.trim();
  const match = /^(\d{1,3}):(\d{1,2})$/.exec(/^\d{1,5}$/.test(value)?formatTypedDuration(value):value);
  if (!match) return null;
  const seconds = Number(match[1]) * 60 + Number(match[2] || 0);
  return seconds >= 1 && seconds <= 10800 ? seconds * 1000 : null;
}
export function formatDuration(ms) {
  const seconds = Math.ceil(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
export function freshState() {
  return { settings: { focus:25, break:5, savesInlineDuration:true }, appearance:loadAppearance(), gardenSchedule:loadGardenSchedule(), calendarEvents:[], studyCapacity:240, processedCaptures:[], sounds:loadSoundSettings(), notifications:false, routines:[], intention:'', tasks:[], projects:[], plannerFilters:[], plannerLabels:[], taskActivity:[], activeTask:null, notes:'', history:[], spotify:'', focusMode:false,
    timer:{ mode:'focus', status:'idle', remaining:25*60000, endAt:null, total:25*60000, startedAt:null, id:null } };
}
export function loadState(storage) {
  const base = freshState();
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!raw || typeof raw !== 'object') return base;
    base.appearance=loadAppearance(raw.appearance);
    base.gardenSchedule=loadGardenSchedule(raw.gardenSchedule);
    base.calendarEvents=loadCalendarEvents(raw.calendarEvents);
    if(Number.isInteger(raw.studyCapacity)&&raw.studyCapacity>=15&&raw.studyCapacity<=1440)base.studyCapacity=raw.studyCapacity;
    if(Array.isArray(raw.processedCaptures))base.processedCaptures=raw.processedCaptures.filter(key=>typeof key==='string');
    base.sounds=loadSoundSettings(raw.sounds);
    base.notifications=raw.notifications===true;
    if (Array.isArray(raw.routines)) base.routines=raw.routines.filter(routine=>routine && typeof routine.id==='string' && typeof routine.name==='string' && ['focus','rest'].every(key=>Number.isInteger(routine[key])&&routine[key]>=1000&&routine[key]<=10800000));
    for (const key of ['intention','notes','spotify']) if (typeof raw[key] === 'string') base[key] = raw[key];
    for (const mode of ['focus','break']) if (Number.isFinite(raw.settings?.[mode]) && raw.settings[mode]>=1/60 && raw.settings[mode]<=180) base.settings[mode]=raw.settings[mode];
    if (Array.isArray(raw.tasks)) base.tasks=raw.tasks.filter(t=>t && typeof t.id==='string' && typeof t.text==='string' && typeof t.done==='boolean').map(loadTask);
    if (Array.isArray(raw.projects)) base.projects=raw.projects.filter(project=>project&&typeof project.id==='string'&&typeof project.name==='string').map(project=>({
      id:project.id,name:project.name,color:/^#[\da-f]{6}$/i.test(project.color)?project.color:'#d94b49',favorite:project.favorite===true,archived:project.archived===true,
      sections:Array.isArray(project.sections)?project.sections.filter(section=>section&&typeof section.id==='string'&&typeof section.name==='string'):[],
      thoughts:Array.isArray(project.thoughts)?project.thoughts.filter(note=>typeof note?.key==='string'&&typeof note.text==='string'&&Number.isFinite(note.createdAt)):[]
    }));
    if (Array.isArray(raw.plannerFilters)) base.plannerFilters=raw.plannerFilters.filter(filter=>filter&&typeof filter.id==='string'&&typeof filter.name==='string'&&typeof filter.query==='string');
    if (Array.isArray(raw.plannerLabels)) base.plannerLabels=raw.plannerLabels.filter(label=>typeof label==='string'&&label.length>0&&label.length<=40);
    if (Array.isArray(raw.taskActivity)) base.taskActivity=raw.taskActivity.filter(event=>event&&typeof event.id==='string'&&typeof event.taskId==='string'&&typeof event.text==='string'&&Number.isFinite(event.at));
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
export function consumeTimerWarning(state,now=Date.now()) {
  const timer=state.timer;
  if (timer.status!=='running'||timer.warningSent) return null;
  const limit=timer.mode==='focus'?5*60000:150000;
  const left=remaining(state,now);
  if (timer.total<limit||left>limit||left===0) return null;
  timer.warningSent=true;
  return {id:timer.id,mode:timer.mode,left};
}
export function startPause(state, now=Date.now()) {
  const t=state.timer;
  if(t.status==='running') { t.remaining=remaining(state,now); t.endAt=null; t.status='paused'; }
  else {
    if (!t.id) {
      t.id=globalThis.crypto.randomUUID();
      t.startedAt=now;
      const task=state.tasks.find(item=>item.id===(t.block?.taskId||state.activeTask));
      if (task) t.taskSnapshot={id:task.id,text:task.text,projectId:task.projectId||''};
    }
    t.endAt=now+t.remaining;
    t.status='running';
  }
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
  const task=t.taskSnapshot||state.tasks.find(task=>task.id===t.block?.taskId);
  const intention=t.block?(task?.text||state.intention):(state.intention||task?.text||'');
  const h={id:t.id,mode:t.mode,outcome,finishedAt:finish,day:dayKey(new Date(finish)),focusMs:t.mode==='focus'?Math.max(0,t.total-remaining(state,now)):0,intention,taskTitle:task?.text||'',taskId:task?.id||'',projectId:task?task.projectId||'':null};
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
