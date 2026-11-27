import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyCalendarReplan,calendarFocusKey,focusTaskQueue,planningEventRanges,tasksWithinTime} from '../dist/calendar.js';
import {agendaConflicts,agendaGaps,compareStudyWeeks,draftStudyWeek,examStudyBlocks,planDeadline,projectHealth,scheduleImpact,taskTimeBudget,todayTradeoffs} from '../dist/scheduling.js';
import {createsDependencyCycle,freshState,loadState,recordTaskCompletion} from '../dist/state.js';

const date = (day,hour=0,minute=0) => new Date(2026,10,day,hour,minute);
const event = (title,start,end) => ({title,start:+start,end:+end});

test('full-day agenda windows respect event buffers, availability and cooldowns across midnight',()=>{
  const tasks=[
    {id:'before',text:'Late work',date:'2026-11-12',time:'23:45',estimate:12},
    {id:'after',text:'Early work',date:'2026-11-14',time:'00:03',estimate:20}
  ];
  const events=[{...event('Lab',date(13,9),date(13,10)),bufferBefore:30,bufferAfter:15}];
  const availability=[{days:[date(13).getDay()],start:'11:00',end:'12:00'}];
  assert.deepEqual(agendaGaps(tasks,events,availability,date(13),1440,5,0),[
    {start:2,end:510},{start:615,end:660},{start:720,end:1438}
  ]);
  assert.deepEqual(agendaGaps(tasks,[{day:'2026-11-13',endDay:'2026-11-14'}],availability,date(13),1440,5,0),[]);
});

test('agenda conflicts report each actual overlap once, clipped to the requested day',()=>{
  const minute=60000,day='2026-11-13';
  const tasks=[{id:'overnight',text:'Overnight',date:'2026-11-12',time:'23:45',estimate:45},
    {id:'done',text:'Finished',date:day,time:'00:12',estimate:30,done:true}];
  const meeting={...event('Meeting',date(13,0,10),date(13,0,35)),bufferAfter:30};
  const handoff=event('Handoff',date(13,0,35),date(13,0,40));
  const report=events=>agendaConflicts(tasks,events,date(13)).map(({first,second,start,end})=>[first.title,second.title,(end-start)/minute]);
  assert.deepEqual(report([meeting,handoff]),[['Overnight','Meeting',20]]);
  assert.deepEqual(report([meeting,handoff,{title:'Retreat',day,endDay:'2026-11-14'}]),[
    ['Overnight','Retreat',30],['Overnight','Meeting',20],['Retreat','Meeting',25],['Retreat','Handoff',5]
  ]);
});

test('task time budget deduplicates bookings and counts only that task’s recorded focus',()=>{
  const minute=60000,day='2026-11-13',now=date(13,10,30),started=+date(13,9);
  const task={id:'lab',estimate:90,blocks:[
    {id:'early',date:day,time:'08:00',minutes:30},
    {id:'current',date:day,time:'10:00',minutes:60},
    {id:'overlap',date:day,time:'10:45',minutes:30}
  ]};
  const history=[
    {mode:'focus',taskId:'lab',outcome:'completed',finishedAt:started-10*minute,focusMs:10*minute,day},
    {mode:'focus',taskId:'other',outcome:'skipped',finishedAt:started+15*minute,focusMs:15*minute,replay:[
      {action:'start',at:started,taskId:'other'},
      {action:'switch',at:started+10*minute,taskId:'lab'},
      {action:'skip',at:started+15*minute,taskId:'lab'}
    ]},
    {mode:'break',taskId:'lab',finishedAt:started+30*minute,focusMs:10*minute}
  ];
  assert.deepEqual(taskTimeBudget(task,history,now),{estimateMs:90*minute,loggedMs:15*minute,bookedMs:45*minute,remainingMs:75*minute});
});

test('recurring task time budget keeps moved blocks and logs with their original occurrence',()=>{
  const minute=60000,day='2026-11-13',tomorrow='2026-11-14';
  const task={id:'lab',date:day,repeat:'daily',estimate:50,blocks:[
    {id:'moved',date:tomorrow,taskDay:day,time:'10:00',minutes:20},
    {id:'next',date:tomorrow,time:'11:00',minutes:40}
  ]};
  const history=[
    {mode:'focus',taskId:'lab',day:tomorrow,finishedAt:+date(14,9),focusMs:10*minute,
      calendarBlock:{blockId:'moved',occurrence:tomorrow}},
    {mode:'focus',taskId:'lab',day:tomorrow,finishedAt:+date(14,9,30),focusMs:20*minute}
  ];
  assert.deepEqual(taskTimeBudget(task,history,date(14,9,45),day),{estimateMs:50*minute,loggedMs:10*minute,bookedMs:20*minute,remainingMs:40*minute});
});

test('trade-offs honor fixed blocks and event move windows',()=>{
  const day='2026-11-13',task={id:'new',estimate:60};
  const held={id:'held',text:'Booked',estimate:60,date:day,time:'10:00',flexibility:{mode:'fixed'}};
  const meetup={...event('Meetup',date(13,11),date(13,12)),id:'event',manual:true,flexibility:{mode:'flexible',earliest:'10:10',latest:'11:10',tomorrow:false}};
  const settings={task,tasks:[task,held],events:[meetup],availability:[],focus:new Map(),cutoff:12*60,capacity:180,cooldown:0};
  assert.deepEqual(todayTradeoffs(settings,date(13,9,40)),[]);
  meetup.flexibility.tomorrow=true;
  const options=todayTradeoffs(settings,date(13,9,40));
  assert.deepEqual(options.map(item=>[item.move.eventId,item.move.day,item.move.parts[0].to]),[['event','2026-11-14',610]]);
});

test('waiting tasks preserve follow-ups and stay out of focus until ready',()=>{
  const state=freshState();
  state.tasks=[{id:'pending',text:'Edit',done:false,waitingFor:{subject:' Feedback ',followUp:'2026-11-12'}},{id:'ready',text:'Read',done:false}];
  const loaded=loadState({getItem:()=>JSON.stringify(state)});
  assert.deepEqual(loaded.tasks[0].waitingFor,{subject:'Feedback',followUp:'2026-11-12',notified:false});
  assert.deepEqual(focusTaskQueue(loaded.tasks,date(13)).map(task=>task.id),['ready']);
  loaded.tasks[0].waitingFor=null;
  assert.equal(focusTaskQueue(loaded.tasks,date(13)).length,2);
});

test('exam blocks prioritize unresolved mistakes, avoid commitments and stop before exam day',()=>{
  const exam={id:'exam',date:'2026-11-14',topics:[{id:'a',title:'Series',confidence:0},{id:'b',title:'Proofs',confidence:3}]};
  const slots=examStudyBlocks({exam,mistakes:[{examId:'exam',topicId:'b',retries:[{passed:false}]}],tasks:[],
    events:[event('Class',date(13,9),date(13,10))],availability:[],cutoff:11*60,capacity:120,cooldown:5,budget:60},date(13,8));
  assert.deepEqual(slots.map(({topicId,start,minutes})=>[topicId,start,minutes]),[['b',605,40]]);
});

test('weekly comparison makes the earlier-finish draft use more daily time',()=>{
  const task={id:'task',estimate:150,deadline:'2026-11-15'};
  const [light,early]=compareStudyWeeks({tasks:[task],events:[],history:[],availability:[],tasksById:new Map([[task.id,task]])},
    {date:'2026-11-13',start:540,end:720,capacity:100,cooldown:5},date(13,8));
  assert.equal(light.settings.capacity,66);
  assert.equal(light.draft.days.filter(day=>day.slots.length).at(-1).date,'2026-11-15');
  assert.equal(early.draft.days.filter(day=>day.slots.length).at(-1).date,'2026-11-14');
});

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
