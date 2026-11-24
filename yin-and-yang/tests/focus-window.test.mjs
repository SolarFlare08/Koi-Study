import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarFocusWindow,focusWindowTasks,taskTimeFit} from '../dist/calendar.js';
import {focusWrapUp,focusWrapUpDuration,freshState,loadState,startPause} from '../dist/state.js';
import {currentFocusPause,editFocusPause,loadReplay} from '../dist/focus-replay.js';

test('class fit uses the next timed occurrence and subtracts preparation and mid-session rest',()=>{
  const now=new Date('2026-11-18T13:00'),at=+new Date('2026-11-18T13:35');
  const events=[{id:'a',day:'2026-11-18',endDay:'2026-11-19'},{id:'b',start:at,end:at+3600000},
    {id:'c',start:at-1800000,end:at,skippedOccurrence:true}];
  assert.equal(calendarFocusWindow(events,5,now).minutes,30);
  const ready=[{estimate:30},{estimate:35},{estimate:61}];
  assert.deepEqual(focusWindowTasks(ready,30),[ready[0]]);
  assert.equal(focusWindowTasks(ready,65).includes(ready[2]),false);
  assert.equal(focusWindowTasks(ready,68).includes(ready[2]),true);
});

test('minimum useful time fits a partial session without changing the full estimate',()=>{
  const assignment={estimate:90,minimumUsefulMinutes:15};
  assert.deepEqual(taskTimeFit(assignment,20,true),{minutes:20,partial:true});
  assert.deepEqual(focusWindowTasks([assignment],20),[assignment]);
  assert.equal(taskTimeFit(assignment,14,true),null);
  assert.deepEqual(taskTimeFit(assignment,100,true),{minutes:90,partial:false});
  assert.equal(assignment.estimate,90);
});

test('wrap-up uses the last focus minutes and a dated first-task pin survives reload',()=>{
  const state=freshState(),start=3600000;
  state.tasks=[{id:'study',text:'Study',done:false,minimumUsefulMinutes:15}];
  state.tomorrowPin={day:'2026-11-23',taskId:'study'};
  state.settings.wrapMinutes=3;
  assert.equal(focusWrapUpDuration(state),180000);
  state.timer.total=90000;
  assert.equal(focusWrapUpDuration(state),30000);
  state.timer.total=1500000;
  startPause(state,start);
  assert.equal(focusWrapUp(state,state.timer.endAt-180001),false);
  assert.equal(focusWrapUp(state,state.timer.endAt-180000),true);
  const restored=loadState({getItem:()=>JSON.stringify(state)});
  assert.deepEqual(restored.tomorrowPin,state.tomorrowPin);
  assert.equal(restored.tasks[0].minimumUsefulMinutes,15);
  restored.settings.wrapMinutes=0;
  assert.equal(focusWrapUp(restored,restored.timer.endAt-60000),false);
  restored.settings.wrapMinutes=3;
  restored.timer.mode='break';
  assert.equal(focusWrapUpDuration(restored),0);
});

test('pause notes persist on the intended replay event and a stale editor cannot edit a later pause',()=>{
  const timer={id:'focus',mode:'focus',status:'paused',replay:[{action:'start',at:100},{action:'pause',at:200}]};
  const first=currentFocusPause(timer);
  timer.replay=loadReplay(editFocusPause(timer,first,' looked up a formula '));
  assert.equal(timer.replay[1].note,'looked up a formula');
  timer.replay.push({action:'resume',at:300},{action:'pause',at:400});
  assert.equal(editFocusPause(timer,first,'wrong pause'),null);
});
