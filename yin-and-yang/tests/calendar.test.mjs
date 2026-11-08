import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calendarBlocks, scheduleTask, weekDays} from '../dist/calendar.js';
import {freshState, loadState} from '../dist/state.js';

test('overlapping tasks get different lanes and an unsized task occupies one hour',()=>{
  const date=new Date(2026,10,9);
  const first={id:'reading',repeat:'none'};
  const second={id:'notes',repeat:'none',estimate:30};
  const next={id:'practice',repeat:'none',estimate:30};
  scheduleTask(first,'2026-11-09',540);
  scheduleTask(second,'2026-11-09',555);
  scheduleTask(next,'2026-11-09',600);
  const blocks=calendarBlocks([first,second,next],date);
  assert.equal(blocks[0].end-blocks[0].start,60);
  assert.deepEqual(blocks.map(block=>[block.lane,block.lanes]),[[0,2],[1,2],[0,1]]);
});

test('priority and a scheduled repeating block survive reload and continue after midnight',()=>{
  const state=freshState();
  const task={id:'review',text:'Review',done:false,repeat:'daily',priority:true,estimate:90};
  scheduleTask(task,'2026-11-08',23*60+30);
  state.tasks.push(task);
  const restored=loadState({getItem:()=>JSON.stringify(state)});
  const [startOfWeek]=weekDays(new Date(2026,10,9));
  const [carry,evening]=calendarBlocks(restored.tasks,startOfWeek);
  assert.equal(carry.task.priority,true);
  assert.deepEqual([carry.start,carry.end,carry.continues],[0,60,true]);
  assert.deepEqual([evening.start,evening.end,evening.continues],[1410,1440,false]);
  assert.deepEqual(calendarBlocks([],startOfWeek),[]);
});
