import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addTaskBlock, calendarBlocks, scheduleTask, weekDays} from '../dist/calendar.js';
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

test('one task keeps multiple overlapping blocks and its recurring schedule after reload',()=>{
  const state=freshState();
  const task={id:'practice',text:'Practice',done:false,repeat:'daily',date:'2026-11-09',time:'09:00'};
  state.tasks.push(task);
  const first=addTaskBlock(task,'2026-11-09','09:30');
  const second=addTaskBlock(task,'2026-11-09','10:15',30);
  const restored=loadState({getItem:()=>JSON.stringify(state)});
  const blocks=calendarBlocks(restored.tasks,new Date(2026,10,9));
  assert.deepEqual(blocks.map(block=>block.blockId),[undefined,first.id,second.id]);
  assert.deepEqual(blocks.map(block=>[block.start,block.end]),[[540,600],[570,630],[615,645]]);
  assert.equal(calendarBlocks(restored.tasks,new Date(2026,10,10)).length,1);
});
