import {test} from 'node:test';
import assert from 'node:assert/strict';
import {focusTaskQueue,planningEventRanges,tasksWithinTime} from '../dist/calendar.js';
import {draftStudyWeek,planDeadline,scheduleImpact} from '../dist/scheduling.js';
import {createsDependencyCycle,freshState,loadState,recordTaskCompletion} from '../dist/state.js';

const date = (day,hour=0,minute=0) => new Date(2026,10,day,hour,minute);
const event = (title,start,end) => ({title,start:+start,end:+end});

test('a travel buffer can reserve time on the day before its event',()=>{
  const meeting={...event('Lab',date(13,0,15),date(13,1)),bufferBefore:45,bufferAfter:20};
  assert.deepEqual(planningEventRanges([meeting],date(12),5),[{title:'Lab',start:1410,end:1440,before:45,after:20}]);
  assert.equal(planningEventRanges([meeting],date(13),5)[0].end,80);
  const task={id:'work',deadline:'2026-11-12',estimate:45};
  const plan=draftStudyWeek({tasks:[task],events:[meeting],history:[],availability:[],tasksById:new Map([[task.id,task]])},
    {date:'2026-11-12',start:1380,end:1440,capacity:60},date(12,20));
  assert.equal(plan.days[0].slots[0].minutes,30);
  assert.equal(plan.risks[0].unplaced,15);
});

test('energy and duration filter the ready task list before ranking suggestions',()=>{
  const queue=[{id:'large',energy:'light',estimate:30},{id:'heavy',energy:'demanding',estimate:10},
    {id:'short',energy:'light',estimate:15},{id:'unrated',estimate:10}];
  assert.deepEqual(tasksWithinTime(queue,20,'light').map(task=>task.id),['short']);
  assert.equal(tasksWithinTime(queue,20).length,3);
});

test('weekly edits keep the cooldown and report work left after shortening or skipping',()=>{
  const task={id:'paper',text:'Paper',deadline:'2026-11-13',estimate:70};
  const input={tasks:[task],tasksById:new Map([[task.id,task]]),history:[],availability:[],
    events:[event('Class',date(12,9),date(12,9,30))]};
  const options={date:'2026-11-12',start:540,end:660,capacity:120,cooldown:5};
  const now=date(12,8);
  const draft=draftStudyWeek(input,options,now);
  const [first,second]=draft.days[0].slots;
  assert.equal(first.start,575);
  assert.equal(second.start,630);
  assert.equal(draft.days[0].context.commitments[0].title,'Class');
  const moved={...first,date:'2026-11-13',start:540,minutes:35};
  const result=draftStudyWeek(input,{...options,proposed:[moved]},now);
  assert.deepEqual(result.invalid,[]);
  assert.deepEqual(result.days[1].slots,[moved]);
  assert.equal(result.risks[0].unplaced,35);
  assert.equal(draftStudyWeek(input,{...options,proposed:[{...first,start:573},second]},now).invalid.length,1);
  assert.equal(draftStudyWeek(input,{...options,proposed:[first,{...second,start:628}]},now).invalid.length,1);
});

test('a weekly draft protects commitments, prioritizes deadlines, and reports work that cannot fit',()=>{
  const urgent={id:'urgent',text:'Lab report',deadline:'2026-11-12',estimate:70,blocks:[{id:'first',date:'2026-11-12',time:'09:20',minutes:15}]};
  const later={id:'later',text:'Read chapter',deadline:'2026-11-14',estimate:50};
  const waiting={id:'waiting',text:'Review report',deadline:'2026-11-13',estimate:20,prerequisiteIds:['urgent']};
  const unknown={id:'unknown',text:'Unestimated',deadline:'2026-11-15'};
  const tasks=[later,waiting,urgent,unknown];
  const input={tasks,tasksById:new Map(tasks.map(task=>[task.id,task])),history:[],events:[
    event('Class',date(12,9),date(12,9,20)),
    {title:'Away',day:'2026-11-13',endDay:'2026-11-14'}
  ],availability:[{days:[date(12).getDay()],start:'09:50',end:'10:00'}]};
  const options={date:'2026-11-12',start:540,end:600,capacity:50};
  const draft=draftStudyWeek(input,options,date(12,9,5));
  assert.deepEqual(draft.days.slice(0,3).map(day=>day.slots.map(({taskId,start,minutes})=>({taskId,start,minutes}))),[
    [{taskId:'urgent',start:575,minutes:15}],[],[{taskId:'later',start:540,minutes:50}]
  ]);
  assert.deepEqual(draft.risks.map(({task,reason,unplaced})=>[task.id,reason,unplaced]),[
    ['urgent','capacity',40],['waiting','prerequisite',20],['unknown','estimate',undefined]
  ]);
  assert.equal(urgent.blocks.length,1);

  // Simulate approving Thursday and redrafting. Only Saturday still needs approval.
  urgent.blocks.push({id:'approved',date:'2026-11-12',time:'09:35',minutes:15});
  const refreshed=draftStudyWeek(input,options,date(12,9,5));
  assert.deepEqual(refreshed.days[0].slots,[]);
  assert.deepEqual(refreshed.days[2].slots,draft.days[2].slots);
  assert.equal(refreshed.risks[0].unplaced,40);
});

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
