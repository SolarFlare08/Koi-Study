import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addTaskBlock, allDayEvents, applyCalendarReplan, blockFocusTiming, calendarBlockProgress, calendarBlocks, calendarEventFromFields, calendarFocusTotals, planningEventRanges, focusTaskQueue, replanToday, reserveTomorrowFocus, scheduleTask, tomorrowFocusSlot, weekDays} from '../dist/calendar.js';
import {freshState, loadState, record, reset, settle, startBlockFocus} from '../dist/state.js';
import {exportCalendar} from '../dist/calendar-export.js';
import {ritualComplete} from '../dist/daily-rituals.js';
import {calendarTaskBlock,calendarBlockDurationChange,planRunningBlockExtension} from '../dist/calendar.js';
import {extendCalendarTimer} from '../dist/state.js';

test('extending a running recurring block previews overnight conflicts and updates only its occurrence',()=>{
  const minute=60000,day='2026-11-10',next='2026-11-11',start=+new Date(day+'T23:30');
  const state=freshState(),task={id:'read',text:'Read',done:false,date:day,time:'23:30',repeat:'daily',estimate:30};
  state.tasks=[task,{id:'review',text:'Review',done:false,date:next,time:'00:03',repeat:'none',estimate:20}];
  state.calendarEvents=[{id:'class',title:'Class',start:+new Date(next+'T00:12'),end:+new Date(next+'T01:00'),bufferBefore:5}];
  startBlockFocus(state,task.id,30*minute,false,start,day);
  const original=state.timer,now=start+3*minute;
  const plan=planRunningBlockExtension(state,10,now);
  assert.deepEqual(plan.conflicts.map(row=>[row.title,row.type]),[['Review','Task block'],['Class','Event buffer']]);
  assert.equal(state.timer,original);
  assert.equal(extendCalendarTimer(state,10*minute,now),true);
  Object.assign(task,calendarBlockDurationChange(task,null,day,plan.minutes));
  assert.equal(state.timer.id,original.id);
  assert.equal(state.timer.endAt,original.endAt+10*minute);
  const restored=loadState({getItem:()=>JSON.stringify(state)}).tasks[0];
  assert.equal(calendarTaskBlock(restored,null,day).minutes,40);
  assert.equal(calendarTaskBlock(restored,null,next).minutes,30);
});

test('extending a split calendar session keeps its current phase and adds time after the queued phases',()=>{
  const minute=60000,day='2026-11-10',start=+new Date(day+'T09:00');
  const state=freshState(),task={id:'read',text:'Read',blocks:[{id:'a',date:day,time:'09:00',minutes:75}]};
  state.tasks=[task];
  startBlockFocus(state,task.id,75*minute,true,start,day,'a');
  const original=state.timer;
  assert.equal(extendCalendarTimer(state,10*minute,start+minute),true);
  assert.equal(state.timer.endAt,original.endAt);
  assert.equal(state.timer.block.left,35*minute);
  settle(state,start+50*minute);
  assert.equal(state.timer.mode,'break');
  assert.equal(state.timer.total,10*minute);
  assert.equal(state.timer.block.left,25*minute);
});

test('tomorrow’s reservation avoids commitments, persists, and replaces only its own block',()=>{
  const date=new Date(2026,10,11),day='2026-11-11',state=freshState();
  const read={id:'read',text:'Read',done:false,blocks:[{id:'manual',date:day,time:'10:30',minutes:45}]};
  const review={id:'review',text:'Review',done:false,blocks:[]};
  state.tasks=[read,review];
  const events=[{start:+new Date(2026,10,11,8,30),end:+new Date(2026,10,11,9,45)}];
  const start=tomorrowFocusSlot(state.tasks,events,date,30);
  assert.equal(start,585);
  assert.throws(()=>reserveTomorrowFocus(state.tasks,events,date,{taskId:'read',start:540,minutes:30}),/overlaps/);
  const apply=({plan,changes})=>{
    for(const task of state.tasks)if(changes.has(task.id))task.blocks=changes.get(task.id);
    state.tomorrowPlan=plan;
  };
  apply(reserveTomorrowFocus(state.tasks,events,date,{taskId:'read',start,minutes:30}));
  const restored=loadState({getItem:()=>JSON.stringify(state)});
  assert.deepEqual(restored.tomorrowPlan,state.tomorrowPlan);
  assert.deepEqual(restored.tasks[0].blocks.map(block=>block.time),['10:30','09:45']);
  apply(reserveTomorrowFocus(state.tasks,events,date,{taskId:'review',start,minutes:30},state.tomorrowPlan));
  assert.deepEqual(read.blocks.map(block=>block.id),['manual']);
  assert.equal(review.blocks[0].id,state.tomorrowPlan.blockId);
  apply(reserveTomorrowFocus(state.tasks,events,date,{taskId:'read',start:630,minutes:45},state.tomorrowPlan));
  assert.equal(state.tomorrowPlan.ownsBlock,false);
  assert.equal(state.tomorrowPlan.blockId,'manual');
  assert.equal(read.blocks.length,1);
  assert.equal(review.blocks.length,0);
});

test('a cutoff splits a missed block or offers tomorrow while preserving recurrence',()=>{
  const now=new Date(2026,10,10,19), day='2026-11-10', tomorrow='2026-11-11';
  const state=freshState();
  const split={id:'read',text:'Read',done:false,repeat:'daily',date:day,time:'08:00',estimate:60};
  const move={id:'write',text:'Write',done:false,repeat:'daily',date:day,time:'11:00',estimate:45};
  state.tasks=[split,move];
  const event={start:+new Date(2026,10,10,19,30),end:+new Date(2026,10,10,20,30)};
  const plan=replanToday(state.tasks,[event],now,null,{cutoff:21*60});
  assert.deepEqual(plan.moves.map(item=>[item.day,item.parts]),[
    [day,[{to:1140,minutes:30},{to:1230,minutes:30}]],
    [tomorrow,[{to:540,minutes:45}]]
  ]);
  applyCalendarReplan(split,day,plan.moves[0]);
  applyCalendarReplan(move,day,plan.moves[1]);
  const restored=loadState({getItem:()=>JSON.stringify(state)});
  assert.deepEqual(calendarBlocks(restored.tasks,now).map(block=>[block.task.id,block.start]),[['read',1140],['read',1230]]);
  assert.deepEqual(calendarBlocks(restored.tasks,new Date(2026,10,11)).map(block=>[block.task.id,block.start,block.taskDay]),[
    ['read',480,undefined],['write',540,day],['write',660,undefined]
  ]);
});

test('recorded focus follows a specific block and keeps partially worked blocks out of Replan',()=>{
  const day='2026-11-10', state=freshState();
  const task={id:'study',text:'Study',done:false,blocks:[
    {id:'a',date:day,time:'08:00',minutes:30},
    {id:'b',date:day,time:'09:00',minutes:30},
    {id:'c',date:day,time:'10:00',minutes:30}
  ]};
  state.tasks.push(task);
  const start=+new Date(2026,10,10,8);
  startBlockFocus(state,task.id,30*60000,false,start,day,'a');
  record(state,'skipped',start+8*60000);
  reset(state);
  startBlockFocus(state,task.id,30*60000,false,start+3600000,day,'b');
  settle(state,start+90*60000);
  const restored=loadState({getItem:()=>JSON.stringify(state)});
  const totals=calendarFocusTotals(restored.history), now=new Date(2026,10,10,11);
  assert.deepEqual(['a','b','c'].map(id=>calendarBlockProgress(task,id,day,totals,+now)),[
    {status:'partial',focusMs:8*60000},{status:'focused',focusMs:30*60000},{status:'missed',focusMs:0}
  ]);
  assert.deepEqual(replanToday([task],[],now,null,{cutoff:21*60,focus:totals}).moves.map(move=>move.blockId),['c']);
});

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

test('repeating events keep local times, overnight tails, and planning buffers',()=>{
  const state=freshState();
  state.calendarEvents=[calendarEventFromFields({
    title:'Study group',description:'',startDay:'2026-03-01',startTime:'23:30',endDay:'2026-03-02',endTime:'00:30',
    repeat:'weekly',bufferBefore:15,bufferAfter:20
  },'manual:weekly')];
  const {calendarEvents}=loadState({getItem:()=>JSON.stringify(state)});
  const sunday=new Date(2026,2,8),monday=new Date(2026,2,9);
  const [start]=calendarBlocks([],sunday,calendarEvents),[tail]=calendarBlocks([],monday,calendarEvents);
  assert.deepEqual([start.start,start.end,tail.start,tail.end,tail.continues],[1410,1440,0,30,true]);
  assert.equal(planningEventRanges(calendarEvents,monday)[0].end,50);
  assert.equal(calendarBlocks([],new Date(2026,2,7),calendarEvents).length,0);
  const exported=exportCalendar([],calendarEvents,{scope:'week',date:'2026-03-09'});
  assert.equal(exported.count,2);
});

test('an all-day series spans its original number of days on each interval',()=>{
  const event=calendarEventFromFields({
    title:'Workshop',description:'',allDay:true,startDay:'2026-11-17',endDay:'2026-11-18',
    repeat:'interval',repeatEvery:'4'
  },'manual:interval');
  assert.equal(allDayEvents([event],new Date(2026,10,20)).length,0);
  const [repeat]=allDayEvents([event],new Date(2026,10,22));
  assert.equal(repeat.day,'2026-11-21');
  assert.equal(repeat.endDay,'2026-11-23');
});
