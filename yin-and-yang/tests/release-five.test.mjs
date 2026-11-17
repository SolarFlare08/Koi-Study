import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyQuickTimerLength,extendTimer,freshState,startPause,reset,loadState,remaining,settle,startTaskTiming,STORAGE_KEY,dayKey} from '../dist/state.js';
import {focusCompass,focusWeek} from '../dist/focus-compass.js';
import {createBackup,readBackup,saveRestorePoint,loadRestorePoints} from '../dist/backup.js';
import {installAutomaticBackup,rotateAutomaticPoints} from '../dist/automatic-backup.js';

const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};};
test('automatic backups initialize on the website without a desktop bridge',async t=>{
  t.mock.timers.enable({apis:['setTimeout','setInterval']});
  const window=new EventTarget();
  const document=new EventTarget();
  const globals={window,document,location:{hostname:'127.0.0.1'}};
  for(const [key,value] of Object.entries(globals)){
    const original=Object.getOwnPropertyDescriptor(globalThis,key);
    Object.defineProperty(globalThis,key,{value,configurable:true});
    t.after(()=>{if(original)Object.defineProperty(globalThis,key,original);else delete globalThis[key];});
  }
  const statusEvent=new Promise(resolve=>window.addEventListener('garden-backup-status',resolve,{once:true}));
  const backups=installAutomaticBackup({storage:memory(),getState:freshState,getCaptures:()=>[]});
  assert.equal(backups.desktop,false);
  assert.doesNotThrow(()=>backups.openFolder());
  const event=await statusEvent;
  assert.match(event.detail.disk,/Windows app/);
});
test('focus ring follows timestamps and pauses, resets without retaining old progress',()=>{
  const state=freshState(),now=Date.now();startPause(state,now);
  assert.equal(focusCompass(state,now).progress,0);
  assert.equal(focusCompass(state,now+state.timer.total/2).progress,.5);
  startPause(state,now+60000);
  assert.equal(focusCompass(state,now+600000).endsAt,null);
  assert.equal(focusCompass(state,now+600000).progress,focusCompass(state,now+60000).progress);
  reset(state,'focus',now+600000);
  assert.equal(focusCompass(state,now+600000).progress,0);
});
test('daily goal survives settings load and portable backup, excluding skipped sessions',()=>{
  const state=freshState(),storage=memory(),now=Date.now();state.settings.dailyFocusGoal=90;
  state.history=[{id:'done',day:dayKey(new Date(now)),mode:'focus',outcome:'completed',focusMs:30*60000,finishedAt:now},
    {id:'skip',day:dayKey(new Date(now)),mode:'focus',outcome:'skipped',focusMs:20*60000,finishedAt:now}];
  storage.setItem(STORAGE_KEY,JSON.stringify(state));
  const loaded=loadState(storage);assert.equal(loaded.settings.dailyFocusGoal,90);
  const summary=focusCompass(loaded,now);assert.equal(summary.today.minutes,30);assert.equal(summary.ratio,1/3);
  assert.equal(readBackup(JSON.stringify(createBackup(state,storage,[]))).state.settings.dailyFocusGoal,90);
});
test('automatic snapshots rotate independently, remain restorable, and do not mutate previous snapshots',()=>{
  const storage=memory(),state=freshState();saveRestorePoint(storage,createBackup(state,storage,[]));
  let points=[];
  for(let i=0;i<5;i++){state.intention='Snapshot '+i;points=rotateAutomaticPoints(points,createBackup(structuredClone(state),storage,[]));}
  assert.equal(loadRestorePoints(storage).length,1);
  assert.equal(points.length,3);assert.equal(points[0].snapshot.data.state.intention,'Snapshot 4');
  assert.equal(readBackup(JSON.stringify(points[2].snapshot)).state.intention,'Snapshot 2');
  const before=JSON.stringify(points);rotateAutomaticPoints(points,createBackup(state,storage,[]));
  assert.equal(JSON.stringify(points),before);
});
test('adding time keeps elapsed progress and the same session across reloads and pauses',()=>{
  const state=freshState(),storage=memory(),start=Date.now(),minute=60000;
  const time=start+10*minute;startPause(state,start);
  const {id,endAt}=state.timer,before=focusCompass(state,time).progress;
  assert.equal(extendTimer(state,5*minute,time),true);
  assert.equal(state.timer.id,id);assert.equal(state.timer.endAt,endAt+5*minute);
  assert.equal(focusCompass(state,time).progress,before);
  storage.setItem(STORAGE_KEY,JSON.stringify(state));
  const loaded=loadState(storage);
  assert.equal(focusCompass(loaded,time).progress,before);
  startPause(loaded,time+minute);
  const progress=focusCompass(loaded,time+minute).progress;
  assert.equal(extendTimer(loaded,minute,time+2*minute),true);
  assert.equal(remaining(loaded,time+4*minute),20*minute);
  assert.equal(loaded.timer.endAt,null);
  assert.equal(focusCompass(loaded,time+4*minute).progress,progress);
  startPause(loaded,time+4*minute);
  assert.equal(extendTimer(loaded,minute,loaded.timer.endAt),false);
  assert.equal(settle(loaded,loaded.timer.endAt+minute).focusMs,31*minute);
  reset(loaded,'focus');assert.equal(loaded.timer.total,25*minute);
});
test('quick times set the default or change one task phase without discarding its plan',()=>{
  const state=freshState();
  assert.equal(applyQuickTimerLength(state,45),true);
  reset(state);assert.equal(state.timer.total,45*60000);
  startTaskTiming(state,'task',90);
  assert.equal(applyQuickTimerLength(state,25),true);
  assert.equal(state.timer.taskPlan.totalMs,90*60000);
  const now=Date.now();startPause(state,now);
  assert.equal(applyQuickTimerLength(state,15),false);
  state.timer.block={taskId:'task',left:60000};
  assert.equal(extendTimer(state,60000,now),false);
});
test('focus week spans seven local dates and distinguishes skipped sessions from goal progress',()=>{
  const state=freshState(),now=new Date(2026,10,3,10);
  state.settings.dailyFocusGoal=30;
  state.history=[
    {day:'2026-10-27',mode:'focus',outcome:'completed',focusMs:60*60000},
    {day:'2026-10-28',mode:'focus',outcome:'completed',focusMs:15*60000},
    {day:'2026-11-01',mode:'focus',outcome:'skipped',focusMs:30*60000},
    {day:'2026-11-03',mode:'focus',outcome:'completed',focusMs:30*60000},
    {day:'2026-11-03',mode:'break',outcome:'completed',focusMs:5*60000}
  ];
  const week=focusWeek(state,+now);
  assert.equal(week.days[0].key,'2026-10-28');assert.equal(week.days.length,7);
  assert.equal(week.days.find(day=>day.key==='2026-11-01').skipped,1);
  assert.equal(week.total,45);assert.equal(week.met,1);
});
