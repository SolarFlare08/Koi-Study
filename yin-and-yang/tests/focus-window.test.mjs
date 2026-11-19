import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarFocusWindow,focusWindowTasks} from '../dist/calendar.js';
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

test('pause notes persist on the intended replay event and a stale editor cannot edit a later pause',()=>{
  const timer={id:'focus',mode:'focus',status:'paused',replay:[{action:'start',at:100},{action:'pause',at:200}]};
  const first=currentFocusPause(timer);
  timer.replay=loadReplay(editFocusPause(timer,first,' looked up a formula '));
  assert.equal(timer.replay[1].note,'looked up a formula');
  timer.replay.push({action:'resume',at:300},{action:'pause',at:400});
  assert.equal(editFocusPause(timer,first,'wrong pause'),null);
});
