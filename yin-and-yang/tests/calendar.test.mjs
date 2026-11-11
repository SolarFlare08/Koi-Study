import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addTaskBlock, allDayEvents, blockFocusTiming, calendarBlocks, calendarEventFromFields, focusTaskQueue, replanToday, scheduleTask, weekDays} from '../dist/calendar.js';
import {freshState, loadState} from '../dist/state.js';
import {ritualComplete} from '../dist/daily-rituals.js';

test('the focus queue follows calendar blocks before unscheduled priority',()=>{
  const date=new Date(2026,10,10);
  const dated={id:'later',date:'2026-11-10',time:'14:00',repeat:'none'};
  const custom={id:'earlier',date:'2026-11-12',repeat:'none',blocks:[{id:'review',date:'2026-11-10',time:'09:00',minutes:60}]};
  const unscheduled={id:'unscheduled',priorityLevel:1,repeat:'none'};
  const done={id:'done',date:'2026-11-10',time:'08:00',done:true,repeat:'none'};
  const tasks=[unscheduled,dated,custom,done];
  assert.deepEqual(focusTaskQueue(tasks,date).map(task=>task.id),['earlier','later','unscheduled']);
  assert.deepEqual(focusTaskQueue(tasks,date,['later','done','unscheduled']).map(task=>task.id),['later','unscheduled','earlier']);
  custom.done=true;
  assert.deepEqual(focusTaskQueue(tasks,date).map(task=>task.id),['later','unscheduled']);
});

test('replan fits unfinished past blocks around timed commitments and reports those with no room',()=>{
  const date=new Date(2026,10,10,20,3), day='2026-11-10';
  const first={id:'first',text:'First',date:day,time:'12:00',estimate:30};
  const second={id:'second',text:'Second',blocks:[{id:'extra',date:day,time:'13:00',minutes:60}]};
  const tooLong={id:'long',text:'Long',date:day,time:'14:00',estimate:120};
  const locked={id:'locked',text:'Locked',date:day,time:'16:00',estimate:20};
  const upcoming={id:'upcoming',date:day,time:'22:00',estimate:30};
  const event={start:+new Date(2026,10,10,20,45),end:+new Date(2026,10,10,21,15)};
  const plan=replanToday([first,second,tooLong,locked,upcoming],[event],date,'locked');
  assert.deepEqual(plan.moves.map(move=>[move.taskId,move.to,move.minutes]),[['first',1215,30],['second',1350,60]]);
  assert.deepEqual(plan.unplaced.map(move=>move.taskId),['long']);
  assert.equal(second.blocks[0].time,'13:00');
});

test('moving a recurring occurrence changes its calendar and focus time only on that day',()=>{
  const state=freshState();
  state.tasks.push({id:'read',text:'Read',done:false,repeat:'daily',date:'2026-11-10',time:'09:00',
    estimate:30,occurrenceTimes:{'2026-11-10':'14:00'}});
  const task=loadState({getItem:()=>JSON.stringify(state)}).tasks[0];
  assert.equal(calendarBlocks([task],new Date(2026,10,10))[0].start,14*60);
  assert.equal(calendarBlocks([task],new Date(2026,10,11))[0].start,9*60);
  assert.equal(blockFocusTiming(task,null,'2026-11-10',+new Date(2026,10,10,14,15)).available,15*60000);
});

test('daily ritual logs survive reload and a newer journal entry completes a reopened day',()=>{
  const state=freshState(), date='2026-11-09';
  state.dailyRituals[date]={
    crochet:{done:true,projectId:'cardigan'},
    annotate:{done:true,title:'Pride and Prejudice',author:'Jane Austen',chapters:'1\n2'},
    journal:{done:false,stamp:1000}
  };
  const restored=loadState({getItem:()=>JSON.stringify(state)});
  assert.deepEqual(restored.dailyRituals[date],state.dailyRituals[date]);
  assert.equal(restored.dailyRituals['2026-11-10'],undefined);
  assert.equal(ritualComplete('journal',restored.dailyRituals[date].journal,1000),false);
  assert.equal(ritualComplete('journal',restored.dailyRituals[date].journal,2000),true);
  assert.equal(ritualComplete('journal',undefined,2000),true);
});

test('a manual overnight event survives reload and appears on both calendar days',()=>{
  const event=calendarEventFromFields({
    title:'  Observing night  ',description:'  Bring a coat  ',
    startDay:'2026-11-09',startTime:'23:30',endDay:'2026-11-10',endTime:'00:30'
  },'manual:1');
  const state=freshState();
  state.calendarEvents.push(event);
  const restored=loadState({getItem:()=>JSON.stringify(state)});
  assert.deepEqual(restored.calendarEvents,[event]);
  assert.equal(event.title,'Observing night');
  assert.equal(event.description,'Bring a coat');
  assert.equal(calendarBlocks([],new Date(2026,10,9),restored.calendarEvents)[0].start,23*60+30);
  assert.equal(calendarBlocks([],new Date(2026,10,10),restored.calendarEvents)[0].end,30);
});

test('manual all-day events include the last date and reject invalid ranges',()=>{
  const fields={title:'Conference',description:'',allDay:true,startDay:'2026-11-09',endDay:'2026-11-10'};
  const event=calendarEventFromFields(fields,'manual:2');
  assert.equal(allDayEvents([event],new Date(2026,10,10)).length,1);
  assert.equal(allDayEvents([event],new Date(2026,10,11)).length,0);
  assert.throws(()=>calendarEventFromFields({...fields,endDay:'2026-11-08'},'manual:2'),/last day/);
  assert.throws(()=>calendarEventFromFields({...fields,endDay:'2026-11-31'},'manual:2'),/valid start and end dates/);
  assert.throws(()=>calendarEventFromFields({...fields,allDay:false,endDay:fields.startDay,startTime:'10:00',endTime:'09:00'},'manual:2'),/after the start/);
});

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

test('block focus measures time to the end of the original overnight occurrence',()=>{
  const task={id:'reading',repeat:'daily',date:'2026-11-09',time:'23:30',estimate:90};
  const [carry]=calendarBlocks([task],new Date(2026,10,10));
  assert.deepEqual(blockFocusTiming(task,carry.blockId,carry.occurrence,new Date(2026,10,10,0,15,30).getTime()),{
    available:44.5*60000, split:true, early:false
  });
  assert.equal(blockFocusTiming(task,null,carry.occurrence,new Date(2026,10,10,1).getTime()).available,0);
  const block=addTaskBlock(task,'2026-11-10','09:00',60);
  assert.deepEqual(blockFocusTiming(task,block.id,block.date,new Date(2026,10,10,8,30).getTime()),{
    available:60*60000, split:false, early:true
  });
});
