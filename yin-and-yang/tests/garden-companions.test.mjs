import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,loadState,STORAGE_KEY} from '../dist/state.js';
import {batchChoices,batchPreview,applyBatch} from '../dist/calendar-batch.js';
import {manageShelfBook,saveLibraryBook} from '../dist/reading-shelf.js';
import {taskSplitSuggestion} from '../dist/planner-report.js';

const reload=state=>loadState({getItem:key=>key===STORAGE_KEY?JSON.stringify(state):null});
test('batch preview detects other commitments and moves just the chosen recurring occurrences',()=>{
  const s=freshState(),day='2026-11-17',next='2026-11-18';
  s.tasks=[{id:'lab',text:'Lab',date:day,time:'11:00',estimate:45,repeat:'daily',blocks:[],done:false}];
  const start=+new Date(day+'T09:00:00');
  s.calendarEvents=[{id:'seminar',title:'Seminar',manual:true,repeat:'daily',start,end:start+3600000},
    {id:'fixed',title:'Lecture',start:start+86400000+1800000,end:start+86400000+3600000}];
  const choices=batchChoices(s.tasks,s.calendarEvents,day);
  const preview=batchPreview(s.tasks,s.calendarEvents,day,next,30,choices);
  assert.ok(preview.moves.find(row=>row.eventId).conflicts.includes('Lecture'));
  Object.assign(s,applyBatch(s.tasks,s.calendarEvents,day,next,preview.moves));
  const loaded=reload(s);
  assert.equal(batchChoices(loaded.tasks,loaded.calendarEvents,day).length,0);
  assert.deepEqual(batchChoices(loaded.tasks,loaded.calendarEvents,next).map(row=>row.start).sort((a,b)=>a-b),[540,570,660,690]);
});
test('a borrowed book survives reload and returning it keeps the library entry',()=>{
  const s=freshState(),edit=saveLibraryBook(s,'',{title:'Moss',lender:'Campus library',returnBy:'2026-12-01'});
  Object.assign(s,edit.changes);
  const loaded=reload(s);
  assert.equal(loaded.libraryBooks[0].returnBy,'2026-12-01');
  Object.assign(loaded,manageShelfBook(loaded,edit.bookId,'return').changes);
  assert.equal(loaded.libraryBooks[0].title,'Moss');assert.equal(loaded.libraryBooks[0].lender,undefined);
});
test('split suggestions count completed focus since the previous task completion',()=>{
  const s=freshState(),task={id:'reading',text:'Read',estimate:45};
  s.history=[1,2,3].map(i=>({taskId:task.id,mode:'focus',outcome:'completed',focusMs:20*60000,finishedAt:i}));
  assert.equal(taskSplitSuggestion(s,task).count,2);
  s.history[0].outcome='skipped';assert.equal(taskSplitSuggestion(s,task),null);
  s.history[0].outcome='completed';s.taskActivity=[{id:'prior',taskId:task.id,at:2}];assert.equal(taskSplitSuggestion(s,task),null);
});
