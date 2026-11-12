import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBackup,readBackup,restoreBackup} from '../dist/backup.js';
import {CAPTURE_PREFIX,readCaptures} from '../dist/capture.js';
import {CROCHET_KEY,loadCrochet,logCrochetTime} from '../dist/crochet.js';
import {JOURNAL_KEY,loadJournal} from '../dist/journal.js';
import {annotationContext,readingShelf} from '../dist/reading-shelf.js';
import {dayKey,STORAGE_KEY,freshState,loadState} from '../dist/state.js';
import {matchCommands} from '../dist/command-palette.js';
import {exportCalendar} from '../dist/calendar-export.js';
import {parseCalendarImport} from '../dist/calendar-import.js';

test('calendar export preserves short and instant events at midnight',()=>{
  const day=new Date(2026,10,11);
  const midnight=day.getTime();
  const short={id:'short',title:'Quick check-in',start:midnight-10000,end:midnight+10000};
  const instant={id:'point',title:'Midnight reminder',start:midnight,end:midnight};
  const previous={id:'previous',title:'Previous day reminder',start:midnight-1000,end:midnight-1000};
  const {content,count}=exportCalendar([],[short,instant,previous],{scope:'day',date:dayKey(day)},day);
  assert.equal(count,2);
  const {events,skipped}=parseCalendarImport(content,day);
  assert.equal(skipped,0);
  assert.deepEqual(events.map(({title,start,end})=>({title,start,end})),
    [short,instant].map(({title,start,end})=>({title,start,end})));
});

function memoryStorage(initial=[]){
  const values=new Map(initial);
  return {
    values,
    get length(){return values.size;},
    key:index=>[...values.keys()][index],
    getItem:key=>values.get(key)??null,
    setItem:(key,value)=>values.set(key,value),
    removeItem:key=>values.delete(key)
  };
}

test('a backup restores linked notes, journal, projects, settings and pending captures on another device',()=>{
  const state=freshState();
  state.settings.focus=45;
  state.tasks.push({id:'read',text:'Read the book',done:false});
  state.stickyNotes.push({id:'quote',title:'Quote',body:'A passage',taskId:'read'});
  const journal=[{id:'journal',title:'Evening',body:'Read two chapters',date:'2026-11-10'}];
  const crochet={projects:[{id:'socks',name:'Socks'}],yarn:[],usage:[],timeLog:[]};
  const day=dayKey();
  assert.equal(logCrochetTime(crochet,{projectId:'unknown',date:day,minutes:75}),false);
  assert.equal(logCrochetTime(crochet,{projectId:'socks',date:'2026-02-30',minutes:75}),false);
  assert.equal(logCrochetTime(crochet,{projectId:'socks',date:day,minutes:75}),true);
  const original=memoryStorage([[JOURNAL_KEY,JSON.stringify(journal)],[CROCHET_KEY,JSON.stringify(crochet)]]);
  const capture={key:'native:0123456789abcdef0123456789abcdef',text:'Read chapter 3',createdAt:10};
  const backup=JSON.stringify(createBackup(state,original,[capture]));
  const target=memoryStorage([[CAPTURE_PREFIX+'old','{}'],['unrelated','keep']]);
  restoreBackup(target,readBackup(backup));
  const restored=loadState(target);
  assert.equal(restored.settings.focus,45);
  assert.equal(restored.tasks[0].id,restored.stickyNotes[0].taskId);
  assert.deepEqual(loadJournal(target),journal);
  assert.equal(loadCrochet(target).projects[0].name,'Socks');
  assert.deepEqual(loadCrochet(target).timeLog,crochet.timeLog);
  assert.deepEqual(readCaptures(target).map(note=>note.text),['Read chapter 3']);
  assert.equal(target.getItem(CAPTURE_PREFIX+'old'),null);
  assert.equal(target.getItem('unrelated'),'keep');
});

test('failed writes roll back the previous backup data and invalid files fail validation',()=>{
  const target=memoryStorage([[STORAGE_KEY,'old state'],[JOURNAL_KEY,'old journal'],[CAPTURE_PREFIX+'old','old capture']]);
  const before=new Map(target.values);
  const setItem=target.setItem;
  let fail=true;
  target.setItem=(key,value)=>{
    if(key===JOURNAL_KEY&&fail){fail=false;throw new Error('Quota exceeded');}
    setItem(key,value);
  };
  const backup=readBackup(JSON.stringify(createBackup(freshState(),memoryStorage(),[])));
  assert.throws(()=>restoreBackup(target,backup),/previous data was restored/);
  assert.deepEqual(target.values,before);
  assert.throws(()=>readBackup('{"data":{}}'),/not a supported/);
});

test('the reading shelf groups matching book logs and finds the last chapter recorded',()=>{
  const books=readingShelf({
    '2026-11-08':{annotate:{title:'The Book',author:'A. Writer',chapters:'Chapter 1\nChapter 2'}},
    '2026-11-09':{annotate:{title:'the  book',author:'a. writer',chapters:'chapter 2\nChapter 3'}},
    '2026-11-10':{annotate:{title:'The Book',author:'A. Writer',chapters:''}},
    '2026-11-11':{annotate:{title:'The Book',author:'Other Writer',chapters:'Chapter 8'}}
  });
  assert.equal(books.length,2);
  const book=books.find(item=>item.author==='A. Writer');
  assert.equal(book.entries.length,3);
  assert.equal(book.chapters.length,3);
  assert.deepEqual(book.last,{date:'2026-11-09',chapter:'Chapter 3'});
});

test('an unfinished page goal carries forward without mixing stopping points from different books',()=>{
  const state=freshState();
  state.dailyRituals={
    '2026-11-08':{annotate:{title:'Tides',chapters:'Chapter 1',position:'Page 25',done:true}},
    '2026-11-09':{annotate:{title:'Dunes',position:'Page 51',done:true}},
    '2026-11-10':{annotate:{title:'tides',goal:'50',goalType:'page',done:false}},
  };
  const {dailyRituals}=loadState(memoryStorage([[STORAGE_KEY,JSON.stringify(state)]]));
  const next=annotationContext(dailyRituals,'2026-11-11');
  assert.deepEqual([next.goalType,next.goal,next.last],['page','50','Page 25']);
  dailyRituals['2026-11-11']={annotate:{done:true}};
  assert.equal(annotationContext(dailyRituals,'2026-11-12').goal,undefined);
  dailyRituals['2026-11-10'].annotate.done=true;
  assert.equal(annotationContext(dailyRituals,'2026-11-11').goal,undefined);
  assert.equal(annotationContext(dailyRituals,'2026-11-10').goal,'50');
});

test('command search finds text inside records and ranks matching titles first',()=>{
  const action={kind:'Action',title:'Start timer',search:'focus'},
    note={kind:'Note',title:'Ideas',search:'A résumé for the garden'},
    task={kind:'Task',title:'Resume for the garden'},
    journal={kind:'Journal',title:'Tuesday',search:'A draft of the résumé'};
  const entries=[action,note,task,journal];
  assert.deepEqual(matchCommands(entries,''),[action]);
  assert.deepEqual(matchCommands(entries,'resume'),[task,note,journal]);
  assert.deepEqual(matchCommands(entries,'journal resume'),[journal]);
});
