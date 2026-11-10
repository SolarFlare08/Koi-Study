import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,startPause,startBlockFocus,skipPhase,remaining,settle,record,reset,consumeTimerWarning,parseDuration,formatTypedDuration,todayProgress,loadState,STORAGE_KEY,dayKey,taskStatus,completeTask} from '../dist/state.js';
test('finishing focus early credits elapsed time and the original task',()=>{
  const state=freshState(), start=1000000, finish=start+90000;
  state.tasks.push({id:'read',text:'Read the chapter'});
  startPause(state,start,'read');
  const session=record(state,'completed',finish,{early:true});
  assert.equal(session.finishedAt,finish);
  assert.equal(session.focusMs,90000);
  assert.equal(session.taskId,'read');
  assert.equal(record(state,'completed',finish,{early:true}),null);
});
test('running timer recovers from storage and completes once after inactive deadline',()=>{
  const s=freshState();startPause(s,1000000);
  const recovered=loadState({getItem:key=>key===STORAGE_KEY?JSON.stringify(s):null});
  assert.equal(remaining(recovered,1000000+5000),1495000);
  const h=settle(recovered,1000000+1600000);
  assert.equal(h.outcome,'completed');assert.equal(h.focusMs,1500000);assert.equal(h.finishedAt,2500000);
  assert.equal(recovered.timer.mode,'break');assert.equal(recovered.timer.status,'idle');
  assert.equal(settle(recovered,999999999),null);assert.equal(recovered.history.length,1);
});
test('paused time is excluded and pause survives refresh',()=>{
  const s=freshState();startPause(s,1000000);startPause(s,1060000);
  const recovered=loadState({getItem:()=>JSON.stringify(s)});
  assert.equal(remaining(recovered,5000000),1440000);
  startPause(recovered,5000000);assert.equal(recovered.timer.endAt,6440000);
  assert.equal(settle(recovered,6440000).focusMs,1500000);
});
test('skipped sessions do not inflate completed sessions or focus minutes',()=>{
  const s=freshState(),now=new Date(2026,10,6,10).getTime();
  startPause(s,now);record(s,'skipped',now+60000);reset(s);
  startPause(s,now+120000);settle(s,now+1620000);
  const p=todayProgress(s,new Date(now));
  assert.equal(p.completed,1);assert.equal(p.skipped,1);assert.equal(p.minutes,25);
});
test('completion belongs to its actual local finish day even when resumed the next day',()=>{
  const s=freshState(),now=new Date(2026,10,6,22).getTime();startPause(s,now);
  settle(s,now+24*3600000);assert.equal(s.history[0].day,dayKey(new Date(now+1500000)));
  assert.equal(todayProgress(s,new Date(now)).completed,1);
  assert.equal(todayProgress(s,new Date(now+24*3600000)).completed,0);
});
test('malformed storage safely falls back and invalid durations are ignored',()=>{
  assert.equal(loadState({getItem:()=>'{'}).timer.remaining,1500000);
  assert.equal(loadState({getItem:()=>JSON.stringify({settings:{focus:-1,break:Infinity},tasks:[null,{}],timer:{status:'running'}})}).settings.focus,25);
  assert.deepEqual(loadState({getItem:()=>JSON.stringify({tasks:[null,{}]})}).tasks,[]);
});
test('recording a session twice cannot duplicate progress',()=>{
  const s=freshState();startPause(s,1000000);assert.ok(record(s,'skipped',1010000));
  assert.equal(record(s,'skipped',1020000),null);assert.equal(s.history.length,1);
});
test('a daily task stays done after reload and returns to To do the next day',()=>{
  const state=freshState();
  const today=new Date(2026,10,8,23,59);
  const task={id:'reading',text:'Read notes',done:false,repeat:'daily',date:dayKey(today),time:'09:30',estimate:20,description:'Review chapter two.'};
  state.tasks.push(task);
  completeTask(task,true,today);
  const [saved]=loadState({getItem:()=>JSON.stringify(state)}).tasks;
  assert.equal(taskStatus(saved,today),'done');
  assert.equal(taskStatus(saved,new Date(2026,10,9,0,1)),'todo');
  assert.equal(saved.description,task.description);
  assert.equal(saved.time,'09:30');
});
test('weekly tasks follow their start weekday and older completed tasks remain done',()=>{
  const state=freshState();
  state.tasks.push({id:'weekly',text:'Review',done:false,repeat:'weekly',date:'2026-11-08'},{id:'old',text:'Old task',done:true});
  const [weekly,old]=loadState({getItem:()=>JSON.stringify(state)}).tasks;
  assert.equal(taskStatus(weekly,new Date(2026,10,1)),'upcoming');
  assert.equal(taskStatus(weekly,new Date(2026,10,9)),'upcoming');
  assert.equal(taskStatus(weekly,new Date(2026,10,15)),'todo');
  assert.equal(taskStatus(old,new Date(2026,10,15)),'done');
});

test('long block phases survive reload and catch up from their scheduled deadlines',()=>{
  const s=freshState(), minute=60000, start=new Date(2026,10,6,10).getTime();
  s.tasks.push({id:'reading',text:'Read chapter two',done:false,date:'2026-11-07'});
  startBlockFocus(s,'reading',90*minute,true,start);
  const recovered=loadState({getItem:()=>JSON.stringify(s)});
  assert.equal(recovered.activeTask,'reading');
  assert.equal(recovered.timer.total,50*minute);
  const wake=start+65*minute;
  assert.equal(settle(recovered,wake).intention,'Read chapter two');
  assert.equal(recovered.timer.mode,'break');
  assert.equal(recovered.timer.endAt,start+60*minute);
  assert.equal(settle(recovered,wake).mode,'break');
  assert.equal(recovered.timer.total,30*minute);
  assert.equal(remaining(recovered,wake),25*minute);
  settle(recovered,start+90*minute);
  assert.equal(todayProgress(recovered,new Date(start)).minutes,80);
  assert.equal(recovered.timer.total,25*minute);
  assert.equal(recovered.timer.status,'idle');
});

test('short blocks preserve their exact countdown and skipping rest advances a long block',()=>{
  const s=freshState(), minute=60000;
  startBlockFocus(s,'reading',33*minute+23500,false,0);
  assert.equal(s.timer.endAt,33*minute+23500);
  settle(s,s.timer.endAt);
  assert.equal(s.timer.block,undefined);
  startBlockFocus(s,'reading',120*minute,true,0);
  settle(s,50*minute);
  assert.equal(skipPhase(s,51*minute).outcome,'skipped');
  assert.equal(s.timer.endAt,101*minute);
  reset(s);
  assert.equal(s.timer.block,undefined);
});
test('timer digits fill the seconds side first',()=>{
  for(const [digits,display,seconds] of [['1','00:01',1],['10','00:10',10],['100','01:00',60],['2500','25:00',1500],['18000','180:00',10800]]){
    assert.equal(formatTypedDuration(digits),display);
    assert.equal(parseDuration(digits),seconds*1000);
    assert.equal(parseDuration(display),seconds*1000);
  }
  assert.equal(parseDuration('00:00'),null);
  assert.equal(parseDuration('18001'),null);
});

test('each running phase warns once at its own threshold, including after reload',()=>{
  const state=freshState(),start=100000;
  startPause(state,start);
  const warnAt=start+20*60000;
  assert.equal(consumeTimerWarning(state,warnAt-1),null);
  assert.equal(consumeTimerWarning(state,warnAt).left,5*60000);
  const saved=loadState({getItem:()=>JSON.stringify(state)});
  assert.equal(consumeTimerWarning(saved,warnAt+1000),null);
  settle(saved,start+25*60000);
  const breakStart=start+25*60000;
  startPause(saved,breakStart);
  assert.equal(consumeTimerWarning(saved,breakStart+149999),null);
  assert.equal(consumeTimerWarning(saved,breakStart+150000).mode,'break');
  assert.equal(consumeTimerWarning(saved,breakStart+151000),null);
});
