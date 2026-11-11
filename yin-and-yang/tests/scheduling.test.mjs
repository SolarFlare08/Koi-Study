import {test} from 'node:test';
import assert from 'node:assert/strict';
import {focusTaskQueue} from '../dist/calendar.js';
import {planDeadline,scheduleImpact} from '../dist/scheduling.js';
import {createsDependencyCycle,freshState,loadState,recordTaskCompletion} from '../dist/state.js';

const date = (day,hour=0,minute=0) => new Date(2026,10,day,hour,minute);
const event = (title,start,end) => ({title,start:+start,end:+end});

test('deadline plans work backward, credit existing effort, and show a shortfall',()=>{
  const task={id:'report',text:'Write report',estimate:150,deadline:'2026-11-13',done:false,blocks:[
    {id:'draft',date:'2026-11-11',time:'20:00',minutes:30}
  ]};
  const other={id:'read',text:'Read',done:false,blocks:[{id:'reading',date:'2026-11-13',time:'19:00',minutes:20}]};
  const events=[event('Meeting',date(12,20,15),date(12,21))];
  const history=[{taskId:task.id,mode:'focus',outcome:'completed',finishedAt:+date(10,17),focusMs:15*60_000}];
  const plan=planDeadline(task,[task,other],events,history,date(11,18),21*60,50);
  assert.deepEqual(plan.slots,[
    {date:'2026-11-11',start:1240,minutes:20},
    {date:'2026-11-12',start:1165,minutes:50},
    {date:'2026-11-13',start:1230,minutes:30}
  ]);
  assert.equal(plan.recorded,15);
  assert.equal(plan.booked,30);
  assert.equal(plan.unplaced,5);
  assert.equal(task.blocks.length,1);
});

test('deadline planning can use multiple gaps on a day and skips elapsed time',()=>{
  const task={id:'paper',text:'Paper',estimate:95,deadline:'2026-11-11',done:false};
  const events=[event('Dinner',date(11,19),date(11,20))];
  const plan=planDeadline(task,[task],events,[],date(11,18,25),21*60,240);
  assert.deepEqual(plan.slots,[
    {date:'2026-11-11',start:1105,minutes:35},
    {date:'2026-11-11',start:1200,minutes:10},
    {date:'2026-11-11',start:1210,minutes:50}
  ]);
  assert.equal(plan.unplaced,0);
});

test('a recurring deadline plan credits bookings for the chosen occurrence only',()=>{
  const task={id:'practice',text:'Practice',estimate:75,deadline:'2026-11-13',date:'2026-11-11',repeat:'daily',done:false,blocks:[
    {id:'earlier',date:'2026-11-12',time:'18:00',minutes:15},
    {id:'latest',date:'2026-11-13',time:'20:00',minutes:20}
  ]};
  const plan=planDeadline(task,[task],[],[],date(11,18),21*60,45);
  assert.equal(plan.occurrence,'2026-11-13');
  assert.equal(plan.booked,20);
  assert.deepEqual(plan.slots,[
    {date:'2026-11-12',start:1230,minutes:30},
    {date:'2026-11-13',start:1235,minutes:25}
  ]);
});

test('schedule previews count overlapping commitments once and exclude the edited block',()=>{
  const task={id:'report',text:'Report',done:false,blocks:[{id:'draft',date:'2026-11-11',time:'19:00',minutes:60}]};
  const events=[
    event('Class',date(11,18),date(11,19)),
    event('Office hours',date(11,18,30),date(11,19,30)),
    event('Late shift',date(12,0,10),date(12,1))
  ];
  const impact=scheduleImpact([task],events,{date:'2026-11-11',start:19*60,minutes:60,
    replacing:{taskId:task.id,blockId:'draft'}},date(11,17),21*60);
  assert.equal(impact.freeAfter,120);
  assert.equal(impact.usesFreeMinutes,30);
  assert.deepEqual(impact.overlaps,[{title:'Office hours',date:'2026-11-11',start:1140,end:1170}]);
  const overnight=scheduleImpact([task],events,{date:'2026-11-11',start:23*60+30,minutes:60},date(11,17),21*60);
  assert.deepEqual(overnight.overlaps,[{title:'Late shift',date:'2026-11-12',start:10,end:30}]);
});

test('a scheduled task waits for its saved prerequisites and unlocks on completion',()=>{
  const state=freshState();
  state.tasks=[
    {id:'analysis',text:'Finish analysis',done:false},
    {id:'sources',text:'Read sources',done:true},
    {id:'report',text:'Write report',done:false,date:'2026-11-11',time:'16:00',prerequisiteIds:['analysis','sources','analysis']}
  ];
  const restored=loadState({getItem:()=>JSON.stringify(state)});
  const [analysis,,report]=restored.tasks;
  const tasksById=new Map(restored.tasks.map(task=>[task.id,task]));
  assert.deepEqual(report.prerequisiteIds,['analysis','sources']);
  assert.equal(createsDependencyCycle('analysis',['report'],tasksById),true);
  assert.equal(createsDependencyCycle('analysis',['sources'],tasksById),false);
  assert.deepEqual(focusTaskQueue(restored.tasks,date(11,15),['report']).map(task=>task.id),['analysis']);
  const undo=recordTaskCompletion(restored,analysis,true,date(11),+date(11,15));
  assert.deepEqual(focusTaskQueue(restored.tasks,date(11,15)).map(task=>task.id),['report']);
  assert.equal(undo(restored),true);
  assert.deepEqual(focusTaskQueue(restored.tasks,date(11,15)).map(task=>task.id),['analysis']);
});
