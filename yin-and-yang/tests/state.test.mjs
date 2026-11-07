import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,startPause,remaining,settle,record,reset,todayProgress,loadState,STORAGE_KEY,dayKey} from '../dist/state.js';
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
