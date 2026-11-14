import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyCalendarReplan,calendarFocusKey,focusTaskQueue,planningEventRanges,tasksWithinTime} from '../dist/calendar.js';
import {draftStudyWeek,planDeadline,projectHealth,scheduleImpact,todayTradeoffs} from '../dist/scheduling.js';
import {createsDependencyCycle,freshState,loadState,recordTaskCompletion} from '../dist/state.js';

const date = (day,hour=0,minute=0) => new Date(2026,10,day,hour,minute);
const event = (title,start,end) => ({title,start:+start,end:+end});

test('trade-offs name distinct future bookings and preserve deadlines and worked blocks',()=>{
  const day='2026-11-13', task={id:'new',text:'New reading',estimate:60};
  const booked=(id,time,deadline)=>({id,text:id,estimate:60,date:day,time,deadline});
  const a=booked('a','10:00'),b=booked('b','11:05'),due=booked('due','12:10',day);
  const focus=new Map([[calendarFocusKey('b',day,null),1000]]);
  const args={task,tasks:[task,a,b,due],events:[],availability:[],focus,cutoff:13*60+10,capacity:180,cooldown:5};
  const options=todayTradeoffs(args,date(13,9,30));
  assert.deepEqual(options.map(item=>item.move?.taskId),['a']);
  assert.deepEqual(options[0].parts,[{start:570,minutes:60}]);
  assert.equal(options[0].move.day,'2026-11-14');
  applyCalendarReplan(a,day,options[0].move);
  assert.equal(a.date,'2026-11-14');
  assert.equal(a.time,'09:00');
});

test('trade-offs can use two short gaps without moving commitments',()=>{
  const task={id:'review',estimate:50};
  const result=todayTradeoffs({task,tasks:[task],events:[event('Seminar',date(13,9,30),date(13,10))],
    availability:[],focus:new Map(),cutoff:630,capacity:120,cooldown:0},date(13,9));
  assert.deepEqual(result,[{parts:[{start:540,minutes:30},{start:600,minutes:20}]}]);
});

test('project health shares deadline capacity and uses dates from linked milestones',()=>{
  const state=freshState();
  state.replanCutoff='10:00';state.studyCapacity=60;state.planningCooldown=0;
  state.projects=[{id:'a',name:'A'},{id:'b',name:'B',milestones:[{date:'2026-11-13',taskIds:['b1','b2']}]}];
  state.tasks=[{id:'a1',projectId:'a',text:'First deadline',estimate:45,deadline:'2026-11-13'},
    {id:'b1',projectId:'b',text:'Blocked draft',estimate:40,prerequisiteIds:['a1']},
    {id:'b2',projectId:'b',text:'No estimate',snoozedUntil:'2026-11-14'}];
  const [a,b]=projectHealth(state,date(13,9));
  assert.equal(a.available,45);
  assert.equal(b.next,undefined);
  assert.equal(b.stalled[0].waiting[0].id,'a1');
  assert.equal(b.available,15);
  assert.equal(b.risks[0].minutes,25);
  assert.equal(b.unestimated,1);
});

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
