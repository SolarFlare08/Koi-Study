import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyBackupRestore,createBackup,loadRestorePoints,planBackupRestore,readBackup,restoreBackup,saveRestorePoint} from '../dist/backup.js';
import {CAPTURE_PREFIX,readCaptures} from '../dist/capture.js';
import {CROCHET_KEY,loadCrochet,logCrochetTime} from '../dist/crochet.js';
import {JOURNAL_KEY,loadJournal} from '../dist/journal.js';
import {annotationContext,editFinishedBook,mergeShelfBooks,readingForecast,readingShelf} from '../dist/reading-shelf.js';
import {dayKey,STORAGE_KEY,freshState,loadState} from '../dist/state.js';
import {matchCommands} from '../dist/command-palette.js';
import {exportCalendar} from '../dist/calendar-export.js';
import {parseCalendarImport} from '../dist/calendar-import.js';
import {earnGardenDetail} from '../dist/garden-growth.js';
import {gardenGrowthMarkup} from '../dist/scenery.js';
import {recordScheduleMoves,snapshotSchedule,summarizeDay} from '../dist/day-recap.js';
import {reviewChapter} from '../dist/reading-progress.js';

test('scheduled reviews space out and a reread stays separate through a Reading restore',()=>{
  const state=freshState(), storage=memoryStorage(), date=new Date(2026,10,12,10);
  const note=reviewChapter({id:'note',bookTitle:'The Waves',chapter:'1',text:'Think about the voices.',kind:'question'},'schedule',date);
  assert.equal(note.reviewDue,'2026-11-15');
  assert.equal(reviewChapter(note,'remembered',new Date(2026,10,15,10)).reviewDue,'2026-11-22');
  assert.equal(reviewChapter(note,'again',new Date(2026,10,15,10)).reviewDue,'2026-11-16');
  state.readingNotes=[note];
  state.finishedBooks=[{id:'waves',title:'The Waves',finishedOn:'2026-11-01',review:'First reading'}];
  state.readingCollections=[{id:'course',name:'Modernism',kind:'course',books:['["the waves",""]']}];
  const edit=editFinishedBook(state,'waves',{rereads:[{id:'two',finishedOn:'2026-11-12',review:'A different impression',rating:5}]});
  Object.assign(state,edit.changes);
  const backup=readBackup(JSON.stringify(createBackup(state,storage,[])));
  applyBackupRestore(storage,planBackupRestore(storage,freshState(),backup,new Set(['reading'])));
  const restored=loadState(storage);
  assert.equal(restored.finishedBooks[0].review,'First reading');
  assert.equal(restored.finishedBooks[0].rereads[0].review,'A different impression');
  assert.equal(restored.readingNotes[0].reviewDue,'2026-11-15');
  assert.deepEqual(restored.readingCollections,state.readingCollections);
});

test('restore points retain the five newest snapshots and preserve optional capture context',()=>{
  const storage=memoryStorage(),state=freshState();
  const context={taskId:'read',title:'Read chapter',block:{occurrence:'2026-11-12',time:'09:30',blockId:null}};
  for(let day=1;day<=6;day++){
    state.intention=`Day ${day}`;
    saveRestorePoint(storage,createBackup(state,storage,[{key:CAPTURE_PREFIX+'test',text:'A thought',createdAt:1,context}],new Date(2026,10,day)));
  }
  const points=loadRestorePoints(storage);
  assert.deepEqual(points.map(point=>point.snapshot.data.state.intention),['Day 6','Day 5','Day 4','Day 3','Day 2']);
  const incoming=readBackup(JSON.stringify(points.at(-1).snapshot));
  applyBackupRestore(storage,planBackupRestore(storage,freshState(),incoming,new Set(['notes'])));
  assert.deepEqual(readCaptures(storage)[0].context,context);
  assert.equal(loadState(storage).intention,'');
});

test('merged reading logs retain notes and give a range when session pace varies',()=>{
  const state=freshState(), target='["the waves",""]', source='["the wave",""]';
  state.dailyRituals={'2026-11-10':{annotate:{title:'The Waves',position:'20',totalPages:140}},
    '2026-11-11':{annotate:{title:'The Wave',position:'60'}},
    '2026-11-12':{annotate:{title:'The Waves',position:'80'}}};
  state.readingNotes=[{id:'note',bookTitle:'The Wave',chapter:'1',text:'A detail',kind:'insight'}];
  const merge=mergeShelfBooks(state,source,target);
  assert.ok(merge.changes);
  const books=readingShelf(merge.changes.dailyRituals,merge.changes.readingNotes);
  assert.equal(books.length,1);
  assert.equal(books[0].entries.length,3);
  assert.equal(merge.changes.readingNotes[0].bookTitle,'The Waves');
  assert.deepEqual(readingForecast(books[0]).range,[2,3]);
});

test('editing a legacy finished book keeps annotations, links, and its original lantern',()=>{
  const state=freshState(), day='2026-11-12', id='["draft title","author"]';
  state.dailyRituals[day]={annotate:{title:'Draft Title',author:'Author',chapters:'Chapter 2',totalPages:180}};
  state.readingNotes=[{id:'chapter',bookTitle:'Draft Title',bookAuthor:'Author',chapter:'2',text:'Consider the theme',kind:'insight'}];
  state.stickyNotes=[{id:'sticky',body:'A quote',related:[{kind:'book',id}]}];
  state.gardenGrowth=earnGardenDetail([], 'book',id,'Draft Title · Author',day);
  const loaded=loadState(memoryStorage([[STORAGE_KEY,JSON.stringify(state)]]));
  assert.equal(loaded.finishedBooks[0].totalPages,180);
  const edit=editFinishedBook(loaded,id,{...loaded.finishedBooks[0],title:'Correct Title',rating:5,review:'Memorable.',takeaway:'Notice the framing.'});
  assert.ok(edit.changes);
  Object.assign(loaded,edit.changes);
  const backup=readBackup(JSON.stringify(createBackup(loaded,memoryStorage(),[])));
  const storage=memoryStorage();
  applyBackupRestore(storage,planBackupRestore(storage,freshState(),backup,new Set(['reading'])));
  const restored=loadState(storage);
  const [book]=readingShelf(restored.dailyRituals,restored.readingNotes,restored.finishedBooks);
  assert.equal(book.title,'Correct Title');
  assert.deepEqual(book.chapters,['Chapter 2']);
  assert.equal(book.finished.review,'Memorable.');
  assert.equal(restored.readingNotes[0].bookTitle,'Correct Title');
  assert.equal(loaded.stickyNotes[0].related[0].id,edit.bookId);
  assert.deepEqual(loaded.gardenGrowth,state.gardenGrowth);
});

test('a Reading-only restore previews conflicts and preserves local tasks, rituals, and Stitchbook',()=>{
  const current=freshState(), backup=freshState(), day='2026-11-12', next='2026-11-13';
  current.tasks=[{id:'local',text:'Keep local task',done:false}];
  current.dailyRituals[day]={journal:{done:true,stamp:1},annotate:{title:'Local book'}};
  backup.tasks=[{id:'remote',text:'Incoming task',done:false}];
  backup.dailyRituals[day]={journal:{done:false},annotate:{title:'Incoming book'}};
  backup.dailyRituals[next]={annotate:{title:'Next chapter'}};
  const localCrochet=JSON.stringify({projects:[{id:'keep',name:'Keep this project'}],yarn:[],usage:[]});
  const storage=memoryStorage([[STORAGE_KEY,JSON.stringify(current)],[CROCHET_KEY,localCrochet]]);
  const incoming=readBackup(JSON.stringify(createBackup(backup,memoryStorage(),[])));
  const plan=planBackupRestore(storage,loadState(storage),incoming,new Set(['reading']));
  const [logs]=plan.preview.find(section=>section.id==='reading').details;
  assert.deepEqual([logs.added,logs.replaced],[1,1]);
  assert.equal(loadState(storage).dailyRituals[day].annotate.title,'Local book');
  applyBackupRestore(storage,plan);
  const restored=loadState(storage);
  assert.deepEqual(restored.tasks.map(task=>task.id),['local']);
  assert.equal(restored.dailyRituals[day].journal.done,true);
  assert.equal(restored.dailyRituals[day].annotate.title,'Incoming book');
  assert.equal(restored.dailyRituals[next].annotate.title,'Next chapter');
  assert.equal(storage.getItem(CROCHET_KEY),localCrochet);
});

test('day recap combines completions and tomorrow’s blocks and drops an undone move',()=>{
  const state=freshState(), now=new Date(2026,10,12,18), tomorrow='2026-11-13';
  const task={id:'review',text:'Review chapter',done:false,date:'2026-11-12',time:'17:00',estimate:30};
  state.tasks=[task];
  state.taskActivity=[{id:'done',text:'Finish worksheet',at:+now}];
  const before=snapshotSchedule(state);
  task.date=tomorrow;
  const after=snapshotSchedule(state);
  state.scheduleMoves=recordScheduleMoves([],before,after,now);
  const recap=summarizeDay(state,state.tasks,now);
  assert.equal(recap.finished[0].text,'Finish worksheet');
  assert.equal(recap.moves[0].to.date,tomorrow);
  assert.equal(recap.blocks[0].task.id,task.id);
  assert.deepEqual(recordScheduleMoves(state.scheduleMoves,after,before,now),[]);
});

test('earned Garden details stay unique and survive a backup without the original project or book',()=>{
  const state=freshState();
  assert.deepEqual(gardenGrowthMarkup(state.gardenGrowth),{trees:'',lanterns:'',lights:''});
  const grove=earnGardenDetail(state.gardenGrowth,'project','studio','Studio portfolio','2026-11-12');
  const earned=earnGardenDetail(grove,'book','["the waves","virginia woolf"]','The Waves · Virginia Woolf','2026-11-19');
  assert.strictEqual(earnGardenDetail(earned,'project','studio','Renamed portfolio','2026-11-20'),earned);
  state.gardenGrowth=earned;

  const restored=readBackup(JSON.stringify(createBackup(state,memoryStorage(),[]))).state;
  assert.deepEqual(restored.gardenGrowth,earned);
  assert.deepEqual(restored.projects,[]);
  assert.deepEqual(restored.dailyRituals,{});
  const art=gardenGrowthMarkup(restored.gardenGrowth);
  assert.equal(art.trees,gardenGrowthMarkup(grove).trees);
  assert.match(art.trees,/winter-scene/);
  assert.match(art.lanterns,/translate\(863 704\)/);
  assert.match(art.lights,/lamp-halo/);
});

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
