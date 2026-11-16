import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,loadState,startPause,record,settle,breakIdeasThatFit,startTaskTiming,taskFinishBreak,finishOvertime,overtimeElapsed,loadSoundtracks} from '../dist/state.js';
import {replaySessions,replayTaskSwitch,replayBlocks,projectSessionTimeline} from '../dist/focus-replay.js';
import {createBackup,readBackup} from '../dist/backup.js';
import {examPlan} from '../dist/exam-plans.js';
import {handoffLink} from '../dist/session-handoff.js';

test('replay preserves pauses and task switches after reload and ends at the actual early stop',()=>{
  let state=freshState();
  const start=+new Date(2026,10,13,23,55),at=minute=>start+minute*60000;
  const taskA={id:'a',text:'Review',done:false,projectId:'course'};
  const taskB={id:'b',text:'Practice',done:false};
  state.tasks=[taskA,taskB];
  startPause(state,at(0),'a');
  startPause(state,at(2));
  replayTaskSwitch(state.timer,taskB,at(4));
  state=loadState({getItem:()=>JSON.stringify(state)});
  startPause(state,at(6));
  const recorded=record(state,'completed',at(10),{early:true});
  const [session]=replaySessions(state.history,state.timer,at(10));
  assert.equal(recorded.focusMs,6*60000);
  assert.deepEqual(session.events.map(event=>event.action),['start','pause','switch','resume','early']);
  assert.deepEqual(session.segments.map(({taskId,at,end})=>[taskId,(at-start)/60000,(end-start)/60000]),
    [['a',0,2],['b',6,10]]);
  assert.deepEqual(replayBlocks([session],new Date(at(8)),'inbox').map(({start,end})=>[start,end]),[[1,5]]);
  assert.equal(replayBlocks([session],new Date(at(8)),'course').length,0);
});

test('a session settled after inactivity closes replay at its countdown deadline',()=>{
  const state=freshState(),start=Date.now();
  startPause(state,start);
  const end=state.timer.endAt;
  const recorded=settle(state,end+50000);
  assert.equal(recorded.replay.at(-1).at,end);
  assert.equal(recorded.replay.at(-1).action,'finish');
  const [legacy]=replaySessions([{mode:'focus',focusMs:60000,finishedAt:end}],state.timer,end);
  assert.equal(legacy.estimated,true);
  assert.equal(legacy.segments[0].at,end-60000);
});

test('exam plans and handoffs survive an existing-format backup',()=>{
  const state=freshState(),date='2026-11-13';
  const exam=examPlan({id:'exam',title:'Midterm',date,
    topics:[{id:'topic',title:'Proofs',confidence:3}],
    practice:[{id:'good',title:'Mock exam',date,score:16,maximum:20},{id:'bad',title:'Invalid',date,score:50,maximum:20}],
    result:{takenOn:date,score:'92%',reflection:'Practice timed proofs.'}});
  state.projects=[{id:'course',name:'Algebra',exams:[exam]}];
  state.tasks=[{id:'a',text:'Review',done:false,resumeLocation:'Proof 4',resumeNote:'Check the base case',resumeResource:'https://example.org/proofs'}];
  const restored=readBackup(JSON.stringify(createBackup(state,{getItem:()=>null},[]))).state;
  assert.deepEqual(restored.projects[0].exams,[exam]);
  assert.equal(exam.practice.length,1);
  assert.equal(restored.tasks[0].resumeLocation,'Proof 4');
  assert.equal(restored.tasks[0].resumeResource,'https://example.org/proofs');
  assert.equal(handoffLink('javascript:alert(1)'),'');
});

test('project timeline splits actual time at task switches and keeps the saved handoffs',()=>{
  let state=freshState();
  const a={id:'a',text:'Review',done:false,projectId:'course',resumeNote:'Start at problem 4'};
  const b={id:'b',text:'Practice',done:false,projectId:'course'};
  state.tasks=[a,b];
  const start=Date.now(), at=minutes=>start+minutes*60000;
  state.timer.goal='Finish problem 4';
  startPause(state,at(0),a.id);
  startPause(state,at(2));
  replayTaskSwitch(state.timer,b,at(3));
  startPause(state,at(4));
  state.timer.nextHandoff={resumeLocation:'Problem 5'};
  state.timer.handoffTaskId=b.id;
  state=loadState({getItem:()=>JSON.stringify(state)});
  const session=record(state,'completed',at(7),{early:true});
  session.review={result:'reached',next:'Check the result'};
  const [review,practice]=projectSessionTimeline(state.history,'course',state.tasks);
  assert.equal(review.entries[0].ms,120000);
  assert.equal(review.entries[0].goal,'Finish problem 4');
  assert.equal(review.entries[0].startHandoff.resumeNote,'Start at problem 4');
  assert.equal(review.entries[0].review.result,'reached');
  assert.equal(practice.entries[0].ms,180000);
  assert.equal(practice.entries[0].nextHandoff.resumeLocation,'Problem 5');
  assert.equal(practice.entries[0].goal,undefined);
});

test('a timed mistake retry has a stable link after reload and backup, and break ideas fit the available time',()=>{
  let state=freshState();
  const now=Date.now();
  state.projects=[{id:'course',name:'Algebra',exams:[{id:'exam',title:'Exam',topics:[{id:'topic',title:'Proofs'}]}]}];
  state.mistakes=[{id:'mistake',examId:'exam',topicId:'topic',mistake:'Proof gap',correction:'Check the base case.',createdAt:now,retries:[]}];
  state.timer.mistakeId='mistake';
  state.breakIdeas=[{id:'short',minutes:2,text:'Get water'},{id:'mid',minutes:5,text:'Walk'},{id:'long',minutes:10,text:'Make tea'}];
  startPause(state,now,null);
  state=loadState({getItem:()=>JSON.stringify(state)});
  const session=record(state,'completed',now+2000,{early:true});
  assert.equal(session.mistakeId,'mistake');
  assert.equal(session.projectId,'course');
  session.mistakeResult=false;
  state.mistakes[0].retries.push({at:now+2000,passed:false,sessionId:session.id});
  const restored=readBackup(JSON.stringify(createBackup(state,{getItem:()=>null},[]))).state;
  assert.equal(restored.mistakes[0].retries[0].sessionId,session.id);
  assert.equal(projectSessionTimeline(restored.history,'course',[])[0].entries[0].retry,'Still stuck');
  assert.deepEqual(breakIdeasThatFit(restored.breakIdeas,5*60000).map(idea=>idea.id),['mid']);
  assert.deepEqual(breakIdeasThatFit(restored.breakIdeas,5*60000-1).map(idea=>idea.id),['short']);
  assert.deepEqual(breakIdeasThatFit(restored.breakIdeas,60000),[]);
});

test('selected tasks over an hour keep both halves and a proportional final break through reload',()=>{
  const state=freshState(),task={id:'long',text:'Exam review',done:false};
  state.tasks=[task];const start=+new Date(2026,10,15,17),minute=60000;
  assert.equal(startTaskTiming(state,task.id,91),true);
  assert.equal(state.timer.total,45.5*minute);
  startPause(state,start,task.id);
  const restored=loadState({getItem:()=>JSON.stringify(state)});
  const deadline=restored.timer.endAt;
  settle(restored,deadline);
  assert.equal(restored.timer.taskPlan.stage,'interval');
  assert.equal(restored.timer.total,9.1*minute);
  startPause(restored,deadline);
  settle(restored,restored.timer.endAt);
  assert.equal(restored.timer.taskPlan.stage,'second');
  assert.equal(restored.timer.total,45.5*minute);
  startPause(restored,deadline+10*minute,task.id);
  settle(restored,restored.timer.endAt);
  assert.equal(restored.timer.total,18.2*minute);
  assert.equal(restored.timer.taskPlan.stage,'final');
  assert.equal(task.done,false);
  taskFinishBreak(state,50);
  assert.equal(state.timer.total,10*minute);
});

test('overtime starts at the original deadline and stays distinct in calendar replay after refresh',()=>{
  const state=freshState(),start=Date.now();
  state.focusOvertime=true;
  startPause(state,start);
  const deadline=state.timer.endAt;
  assert.equal(settle(state,deadline+42000),null);
  assert.equal(state.timer.status,'overtime');
  assert.equal(state.history.length,0);
  const restored=loadState({getItem:()=>JSON.stringify(state)});
  assert.equal(overtimeElapsed(restored.timer,deadline+60000),60000);
  const completed=finishOvertime(restored,deadline+60000);
  assert.equal(completed.focusMs,26*60000);
  assert.equal(completed.overtimeMs,60000);
  assert.deepEqual(replaySessions(restored.history,restored.timer,deadline+60000)[0].segments.map(item=>[item.action,item.end-item.at]),
    [['start',25*60000],['overtime',60000]]);
  assert.equal(restored.timer.mode,'break');
});

test('soundtracks preserve valid Spotify and YouTube entries across backup',()=>{
  const state=freshState();
  state.soundtracks=loadSoundtracks([
    {id:'1',name:'  Deep work ',source:'spotify',link:'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO'},
    {id:'2',name:'Review',source:'youtube',link:'https://youtu.be/M7lc1UVf-VE'},
    {id:'3',name:'Invalid',source:'youtube',link:'https://example.org'}
  ]);
  const {state:restored}=readBackup(JSON.stringify(createBackup(state,{getItem:()=>null},[])));
  assert.deepEqual(restored.soundtracks.map(item=>item.name),['Deep work','Review']);
});
