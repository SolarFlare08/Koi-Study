import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,loadState,STORAGE_KEY} from '../dist/state.js';
import {brushStroke,paintedCopies} from '../dist/calendar-brush.js';
import {chapterReviewQueue,loadLibraryBooks,withinCutoff} from '../dist/reading-shelf.js';
import {meetingItems} from '../dist/office-hours.js';
import {semesterFrames} from '../dist/semester-replay.js';

test('painting a recurring event preserves the source and creates independent single events',()=>{
  const s=freshState(),source={id:'lecture',manual:true,title:'Lab',repeat:'weekly',calendarId:'school',start:0,end:3600000};
  s.calendarEvents.push(source);
  const slot={date:'2026-11-17',minute:600};
  const result=paintedCopies(s,{id:'lecture',type:'event'},[slot,slot,{...slot,minute:750}],60);
  assert.equal(s.calendarEvents.length,1);
  assert.deepEqual(result.calendarEvents.map(e=>e.repeat),['weekly',undefined,undefined]);
  assert.equal(new Set(result.calendarEvents.map(e=>e.id)).size,3);
  assert.equal(result.calendarEvents[2].calendarId,'school');
});
test('spoiler cutoff hides later chapters, crossing ranges and unrecognized labels',()=>{
  for(const label of ['Ch. 2','Chapters 2–4','4: Discovery'])assert.equal(withinCutoff(label,4),true);
  for(const label of ['Chapter 10','Chapters 2–6','Epilogue'])assert.equal(withinCutoff(label,4),false);
  assert.equal(withinCutoff('Epilogue',null),true);
});
test('the chapter review queue respects the cutoff for each book and separates due from upcoming',()=>{
  const today='2026-11-27';
  const library=loadLibraryBooks([{title:'Night Sky',author:'Ng',cutoff:3},{title:'Night Sky',author:'Diaz',cutoff:8}]);
  const note=(id,chapter,{bookAuthor='Ng',queued=true,reviewDue=today}={})=>({id,bookTitle:'Night Sky',bookAuthor,chapter,queued,reviewDue});
  const notes=[
    note('due','Chapter 2'),note('past','Chapter 1',{reviewDue:'2026-11-25'}),
    note('legacy','Chapter 3',{reviewDue:''}),note('range','Chapters 3–4'),note('epilogue','Epilogue'),
    note('other','Chapter 8',{bookAuthor:'Diaz'}),
    note('future','Chapter 3',{reviewDue:'2026-11-28'}),note('unqueued','Chapter 2',{queued:false})
  ];
  const {due,upcoming}=chapterReviewQueue(notes,library,today);
  assert.deepEqual(due.map(item=>item.id),['due','past','legacy','other']);
  assert.deepEqual(upcoming.map(item=>item.id),['future']);
});
test('brush undo and redo use the identities of exactly the placed copies',()=>{
  for(const type of ['task','event']){
    const state=freshState(),original={id:'original',date:'2026-11-18',time:'08:00',minutes:30};
    state.tasks=[{id:'source',done:false,blocks:[original]}];
    state.calendarEvents=[{id:'source',manual:true,title:'Class',start:0,end:1800000}];
    const read=()=>type==='task'?state.tasks[0].blocks:state.calendarEvents;
    const stroke=brushStroke(state,{type,id:'source'},Array.from({length:8},(_,i)=>({date:'2026-11-18',minute:540+i*30})),30);
    assert.equal(stroke.count,8);
    Object.assign(state,stroke.changes);
    const unrelated={...read()[0],id:'unrelated'};
    read().push(unrelated);
    read()[1].extra='edited after placement';
    const placed=read().slice(1,9);
    const undo=stroke.update(state,false);
    Object.assign(state,undo.changes);undo.applied();
    assert.deepEqual(read().map(item=>item.id),[type==='task'?'original':'source','unrelated']);
    const redo=stroke.update(state,true);
    Object.assign(state,redo.changes);redo.applied();
    assert.deepEqual(read().slice(2),placed);
    assert.equal(stroke.update(state,true),null);
  }
});
test('a course sheet keeps meeting answers separate from mistake retry progress through reload',()=>{
  let state=freshState();state.projects=[{id:'course',name:'Math'}];
  state.tasks=[{id:'practice',projectId:'course',text:'Practice',done:false}];
  state.mistakes=[{id:'m',taskId:'practice',mistake:'Sign error',correction:'Negative',source:'Page 42',createdAt:1,retries:[]}];
  const [q]=meetingItems(state,'course');assert.equal(q.ref,'Page 42');
  state.studyQuestions=[{...q,answered:true,answer:'Check the exponent'}];
  state=loadState({getItem:k=>k===STORAGE_KEY?JSON.stringify(state):null});
  assert.equal(meetingItems(state,'course').length,1);assert.equal(state.studyQuestions[0].answered,true);
  assert.equal(state.mistakes[0].retries.length,0);
});
test('a semester replay keeps separate frames for rewards earned on the same day',()=>{
  const days=['2026-10-10','2026-09-01','2026-10-10','2026-10-01'];
  const frames=semesterFrames(days.map(day=>({day})),'2026-10-01','2026-10-10');
  assert.deepEqual(frames.map(f=>f.index),[3,0,2]);
});
