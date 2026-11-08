export const STORAGE_KEY = 'yin-and-yang.v1';
export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
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
  return { settings: { focus:25, break:5, savesInlineDuration:true }, intention:'', tasks:[], activeTask:null, notes:'', history:[], spotify:'', focusMode:false,
    timer:{ mode:'focus', status:'idle', remaining:25*60000, endAt:null, total:25*60000, startedAt:null, id:null } };
}
export function loadState(storage) {
  const base = freshState();
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!raw || typeof raw !== 'object') return base;
    for (const key of ['intention','notes','spotify']) if (typeof raw[key] === 'string') base[key] = raw[key];
    for (const mode of ['focus','break']) if (Number.isFinite(raw.settings?.[mode]) && raw.settings[mode]>=1/60 && raw.settings[mode]<=180) base.settings[mode]=raw.settings[mode];
    if (Array.isArray(raw.tasks)) base.tasks=raw.tasks.filter(t=>t && typeof t.id==='string' && typeof t.text==='string' && typeof t.done==='boolean');
    base.activeTask=base.tasks.some(t=>t.id===raw.activeTask && !t.done)?raw.activeTask:null;
    if (Array.isArray(raw.history)) base.history=raw.history.filter(h=>h && typeof h.id==='string' && ['completed','skipped'].includes(h.outcome) && ['focus','break'].includes(h.mode) && Number.isFinite(h.finishedAt) && Number.isFinite(h.focusMs));
    base.focusMode=raw.focusMode===true;
    const t=raw.timer;
    if (t && ['focus','break'].includes(t.mode) && ['idle','running','paused'].includes(t.status) && Number.isFinite(t.remaining) && t.remaining>=0 && t.remaining<=10800000 && Number.isFinite(t.total) && t.total>0 && t.total<=10800000 && (t.status!=='running' || (Number.isFinite(t.endAt) && typeof t.id==='string' && Number.isFinite(t.startedAt)))) {
      base.timer={...t};
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
export function record(state, outcome, now=Date.now()) {
  const t=state.timer;
  if(!t.id || state.history.some(h=>h.id===t.id)) return null;
  const finish=outcome==='completed' && t.endAt ? t.endAt : now;
  const h={id:t.id,mode:t.mode,outcome,finishedAt:finish,day:dayKey(new Date(finish)),focusMs:t.mode==='focus'?Math.max(0,t.total-remaining(state,now)):0,intention:state.intention};
  state.history.push(h); return h;
}
export function settle(state, now=Date.now()) {
  if(state.timer.status!=='running' || remaining(state,now)>0) return null;
  const h=record(state,'completed',now);
  reset(state,state.timer.mode==='focus'?'break':'focus');
  return h;
}
export function todayProgress(state, date=new Date()) {
  const items=state.history.filter(h=>h.day===dayKey(date) && h.mode==='focus');
  return {items,completed:items.filter(h=>h.outcome==='completed').length,skipped:items.filter(h=>h.outcome==='skipped').length,minutes:Math.floor(items.filter(h=>h.outcome==='completed').reduce((s,h)=>s+h.focusMs,0)/60000)};
}
