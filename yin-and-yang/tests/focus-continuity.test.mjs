import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,loadState,startPause,record,settle} from '../dist/state.js';
import {replaySessions,replayTaskSwitch,replayBlocks} from '../dist/focus-replay.js';
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
