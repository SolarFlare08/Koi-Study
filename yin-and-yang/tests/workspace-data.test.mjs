import {test} from 'node:test';
import {customCalendarColor,eventColorAttributes,calendarCatalog,calendarSlotMinute,calendarTheme,eventCalendarColor,loadCalendars,visibleCalendarEvents} from '../dist/calendar-layers.js';
import {scheduledRituals} from '../dist/daily-rituals.js';
import {calendarBlocks,calendarEventFromFields} from '../dist/calendar.js';
import {captureCalendarDay,copyCalendarDay,loadDayTemplates,previewCalendarDay} from '../dist/calendar-day-templates.js';
import {loadProjectResources} from '../dist/project-planning.js';
import assert from 'node:assert/strict';
import {applyBackupRestore,createBackup,loadRestorePoints,planBackupRestore,readBackup,restoreBackup,saveRestorePoint} from '../dist/backup.js';
import {CAPTURE_PREFIX,readCaptures} from '../dist/capture.js';
import {CROCHET_KEY,loadCrochet,logCrochetTime} from '../dist/crochet.js';
import {JOURNAL_KEY,loadJournal} from '../dist/journal.js';
import {annotationContext,editFinishedBook,manageShelfBook,mergeShelfBooks,readingForecast,readingShelf,saveLibraryBook} from '../dist/reading-shelf.js';
import {youtubeContent,youtubeLinks} from '../dist/youtube-embed.js';
import {dayKey,STORAGE_KEY,freshState,loadState,taskPriority} from '../dist/state.js';
import {matchCommands} from '../dist/command-palette.js';
import {exportCalendar} from '../dist/calendar-export.js';
import {parseCalendarImport} from '../dist/calendar-import.js';
import {earnGardenDetail,gardenComparison,gardenCourses,gardenRange,loadGardenGrowth} from '../dist/garden-growth.js';
import {pavilionFoundation} from '../dist/garden-ornaments.js';
import {gardenPieceOptions,gardenPropCategories,gardenPropTypes,gardenPropLimit,gardenPropsInOrder,moveGardenPropLayer,dropGardenPropLayer,gardenPropMoveBounds,duplicateGardenProps,loadGardenProps,defaultGardenDesign,gardenLandmarkKey,gardenViewport,loadGardenDesign,gardenActivityLayout,loadGardenActivityLayouts} from '../dist/garden-layout.js';
import {eveningCamera,renderLandscape,gardenGrowthMarkup,gardenLandmarkPositions} from '../dist/scenery.js';
import {gardenPropBounds,gardenScenery,gardenSceneryObject,snapGardenPoint} from '../dist/garden-layout.js';

test('landmark placement survives loading and keeps grouped landmarks in the same area',()=>{
  let history=earnGardenDetail([],'project','a','Project','2026-09-01',{zone:'east',group:'Fall'});
  history=earnGardenDetail(history,'book','b','Book','2026-09-02',{zone:'east',group:'Fall'});
  history=earnGardenDetail(history,'test','c','Test','2026-09-03',{zone:'east',group:'Fall'});
  const loaded=loadGardenGrowth(history);
  assert.equal(loaded[1].group,'Fall');
  assert.equal(loaded[2].zone,undefined);
  assert.ok(gardenLandmarkPositions(loaded).slice(0,2).every(item=>item.position[0]>1000));
  for(const [width,height] of [[390,844],[1440,900],[1600,600]]){
    const view=eveningCamera(width,height);
    assert.ok(Math.abs(view.x)<=(view.width*view.zoom-width)/2);
    assert.ok(Math.abs(view.y)<=(view.height*view.zoom-height)/2);
  }
});

test('the Field Guide uses inclusive dates and snapshots keep original landmark coordinates',()=>{
  let history=earnGardenDetail([],'book','a','Early book','2026-09-01');
  history=earnGardenDetail(history,'book','b','Late book','2026-11-15');
  assert.deepEqual(gardenRange(history,'2026-09-01','2026-09-01').map(entry=>entry.index),[0]);
  assert.equal(gardenGrowthMarkup(history,{through:'2026-10-31'}).lanterns,gardenGrowthMarkup(history.slice(0,1)).lanterns);
});

test('course skies connect earned exams in date order and keep legacy and standalone stars',()=>{
  let history=earnGardenDetail([],'test','later','Final','2026-11-12');
  history=earnGardenDetail(history,'test','earlier','Midterm','2026-10-01',{courseId:'course',courseName:'Calculus'});
  history=earnGardenDetail(history,'test','manual','Placement test','2026-09-01');
  const projects=[{id:'course',name:'Calculus II',exams:[{id:'later'}]}];
  const courses=gardenCourses(history,projects);
  assert.equal(courses[0].name,'Calculus II');
  assert.deepEqual(courses[0].stars.map(entry=>entry.index),[1,0]);
  assert.equal(gardenCourses(loadGardenGrowth(history),[])[0].name,'Calculus');
  assert.match(gardenGrowthMarkup(history,{courses}).stars,/<polyline /);
  assert.doesNotMatch(gardenGrowthMarkup(history,{courses,through:'2026-10-01'}).stars,/<polyline /);
});
import {recordScheduleMoves,snapshotSchedule,summarizeDay,recapMoveTarget} from '../dist/day-recap.js';
import {remainingProjectWork} from '../dist/project-planning.js';
import {reviewChapter,ratingTier} from '../dist/reading-progress.js';
import {needsRetry} from '../dist/mistake-notebook.js';
import {bundleProgress,loadTaskBundles} from '../dist/task-bundles.js';
import {entriesInWeek,journalAnniversaries,journalFacets,journalLabels,journalWeek,matchingJournal} from '../dist/journal-patterns.js';

test('a bundle keeps its order and waits for the first unfinished occurrence',()=>{
  const [bundle]=loadTaskBundles([{id:'lab',name:'Lab',taskIds:['reading','setup','setup','quiz']}]);
  const tasks=new Map([['reading',{id:'reading',repeat:'daily',completions:['2026-11-10','2026-11-12']}],
    ['setup',{id:'setup',done:false}],['quiz',{id:'quiz',done:false}]]);
  const ready=new Set(['quiz']);
  const status=bundleProgress(bundle,tasks,ready,'2026-11-11');
  assert.deepEqual(bundle.taskIds,['reading','setup','quiz']);
  assert.equal(status.done,1);
  assert.equal(status.next.id,'setup');
  assert.equal(status.next.ready,false);
  assert.equal(bundleProgress(bundle,tasks,ready,'2026-11-13').next.id,'reading');
  assert.equal(bundleProgress(bundle,new Map([['quiz',tasks.get('quiz')]]),ready,'2026-11-13').next.task,undefined);
});

test('weekly journal patterns use completed entries and filter labels without case sensitivity',()=>{
  const week=journalWeek('2026-11-13');
  const entries=[{id:'a',date:'2026-11-09',title:'A',body:'First proof',mood:'Calm',tags:journalLabels('Study, STUDY'),themes:['Momentum']},
    {id:'b',date:'2026-11-15',title:'B',body:'Second proof',mood:'Tired',tags:['study']},
    {id:'draft',date:'2026-11-13',draft:true},{id:'other',date:'2026-11-16'}];
  assert.equal(week,'2026-11-09');
  const items=entriesInWeek(entries,week);
  assert.deepEqual(items.map(item=>item.id),['a','b']);
  assert.deepEqual(journalFacets(items).tags,[{key:'study',label:'Study',count:2}]);
  assert.deepEqual(matchingJournal(items,'proof',{mood:'calm',tags:'study',themes:'momentum'}).map(item=>item.id),['a']);
});

test('selective Planner and Journal backup restores keep bundle and reflection references',()=>{
  const state=freshState(),entry={id:'entry',title:'Friday',date:'2026-11-13',body:'Useful examples',tags:['Study'],themes:['Momentum']};
  const source=memoryStorage([[JOURNAL_KEY,JSON.stringify([entry])]]);
  state.tasks=[{id:'lab',text:'Lab',done:false}];
  state.taskBundles=[{id:'prep',name:'Prep',taskIds:['lab'],startedOn:'2026-11-12'}];
  state.activeBundle={id:'prep',startedOn:'2026-11-12',paused:true};
  state.weeklyReflections=[{week:'2026-11-09',body:'Weekly thoughts',entryIds:['entry'],updatedAt:5}];
  const backup=readBackup(JSON.stringify(createBackup(state,source,[])));
  const target=memoryStorage();
  applyBackupRestore(target,planBackupRestore(target,freshState(),backup,new Set(['journal'])));
  let restored=loadState(target);
  assert.deepEqual(restored.weeklyReflections,state.weeklyReflections);
  assert.deepEqual(restored.taskBundles,[]);
  assert.deepEqual(loadJournal(target),[entry]);
  applyBackupRestore(target,planBackupRestore(target,restored,backup,new Set(['planner'])));
  restored=loadState(target);
  assert.deepEqual(restored.activeBundle,state.activeBundle);
  assert.deepEqual(restored.taskBundles,state.taskBundles);
  assert.deepEqual(restored.weeklyReflections,state.weeklyReflections);
});

test('selective Planner restore includes mistake corrections and retry status',()=>{
  const state=freshState(), storage=memoryStorage();
  state.mistakes=[{id:'m',examId:'e',topicId:'topic',mistake:'Used the wrong sign',correction:'Check the orientation',createdAt:1,
    retries:[{at:3,passed:true},{at:2,passed:false}]}];
  const backup=readBackup(JSON.stringify(createBackup(state,storage,[])));
  const plan=planBackupRestore(storage,freshState(),backup,new Set(['planner']));
  applyBackupRestore(storage,plan);
  const [item]=loadState(storage).mistakes;
  assert.equal(item.topicId,'topic');
  assert.equal(item.correction,'Check the orientation');
  assert.equal(needsRetry(item),false);
});

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
  const [conflict]=logs.changes.filter(change=>change.action==='Replace');
  const entry=conflict.fields.find(field=>field.field==='entry');
  assert.equal(entry.current.title,'Local book');
  assert.equal(entry.incoming.title,'Incoming book');
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
  assert.deepEqual(recapMoveTarget(recap.moves[0],new Map([[task.id,task]]),[]),{task:task.id,occurrence:tomorrow});
  assert.deepEqual(recordScheduleMoves(state.scheduleMoves,after,before,now),[]);
});

test('earned Garden details stay unique and survive a backup without the original project or book',()=>{
  const state=freshState();
  assert.deepEqual(gardenGrowthMarkup(state.gardenGrowth),{trees:'',lanterns:'',lights:'',stars:'',swallows:'',cairns:''});
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
  assert.match(art.lanterns,/translate\(921 745\)/);
  assert.match(art.lights,/lamp-halo/);
});

test('test stars and milestone cairns retain their details and stable positions through a backup',()=>{
  const state=freshState(),day='2026-11-12';
  const test=earnGardenDetail([],'test','exam','Calculus midterm',day,{result:'94%',detail:'Retake practice set 3'});
  state.gardenGrowth=earnGardenDetail(test,'milestone','first','First public talk',day);
  const before=gardenLandmarkPositions(state.gardenGrowth);
  const restored=readBackup(JSON.stringify(createBackup(state,memoryStorage(),[]))).state;
  assert.deepEqual(gardenLandmarkPositions(restored.gardenGrowth),before);
  assert.equal(restored.gardenGrowth[0].result,'94%');
  assert.equal(restored.gardenGrowth[0].detail,'Retake practice set 3');
  const art=gardenGrowthMarkup(restored.gardenGrowth);
  assert.ok(art.stars.includes(`translate(${before[0].position.slice(0,2).join(' ')})`));
  assert.match(art.cairns,/translate\(792 681\)/);
});

test('milestone work credits completed focus only and surfaces unknown estimates',()=>{
  const tasks=[{task:{id:'reading',estimate:60}},{task:{id:'draft',estimate:20}},
    {task:{id:'finished',estimate:90},done:true},{task:{id:'check'}}];
  const session=(taskId,minutes,outcome='completed')=>({taskId,mode:'focus',outcome,focusMs:minutes*60000});
  assert.deepEqual(remainingProjectWork(tasks,[session('reading',25),session('reading',10,'skipped'),session('draft',45)]),
    {minutes:35,unestimated:1});
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

test('past journal weeks follow the anniversary across leap days and year boundaries',()=>{
  const entries=[
    {id:'jan',date:'2025-01-01'},{id:'dec',date:'2024-12-30'},{id:'draft',date:'2025-01-02',draft:true},
    {id:'before',date:'2024-12-29'},{id:'after',date:'2025-01-06'},
    {id:'leap',date:'2024-02-29'},{id:'feb',date:'2027-02-28'},{id:'march',date:'2027-03-01'}
  ];
  const reflections=[{week:'2024-12-30'},{week:'2023-12-25'}];
  const anniversary=journalAnniversaries(entries,reflections,'2026-01-01');
  assert.deepEqual(anniversary.map(({year,week,reflection,entries})=>[year,week,reflection,entries.map(entry=>entry.id)]),[
    [2025,'2024-12-30',true,['dec','jan']]
  ]);
  const leap=journalAnniversaries(entries,[],'2028-02-29');
  assert.deepEqual(leap.map(group=>[group.year,group.entries.map(entry=>entry.id)]),[[2027,['feb']],[2024,['leap']]]);
  assert.deepEqual(journalAnniversaries([],[],'2026-01-01'),[]);
});

test('landmark inscriptions survive backup and compare counts include both cutoff dates',()=>{
  const state=freshState();
  state.gardenGrowth=loadGardenGrowth([
    {kind:'project',sourceId:'tree',title:'Research',day:'2026-09-01',inscription:'  For the team.  '},
    {kind:'book',sourceId:'lantern',title:'A book',day:'2026-10-12'},
    {kind:'milestone',sourceId:'cairn',title:'Final draft',day:'2026-10-12',inscription:'A'.repeat(100)},
    {kind:'test',sourceId:'star',title:'Midterm',day:'2026-10-13',inscription:'Only for other landmarks'}
  ]);
  const {state:restored}=readBackup(JSON.stringify(createBackup(state,{getItem:()=>null},[])));
  assert.equal(restored.gardenGrowth[0].inscription,'For the team.');
  assert.equal(restored.gardenGrowth[2].inscription.length,90);
  assert.equal(restored.gardenGrowth[3].inscription,undefined);
  assert.deepEqual(gardenComparison(restored.gardenGrowth,'2026-09-01','2026-10-12','2026-11-14'),
    {before:'2026-09-01',after:'2026-10-12',earlier:1,later:3,added:2});
  assert.equal(gardenComparison(restored.gardenGrowth,'2026-10-12','2026-09-01','2026-11-14'),null);
  assert.equal(gardenComparison(restored.gardenGrowth,'2026-09-01','2026-11-15','2026-11-14'),null);
});

test('Studio layouts use the original scenery for old data and restore separate named designs',()=>{
  const state=freshState();
  assert.deepEqual(state.gardenDesign,defaultGardenDesign);
  const tree={kind:'project',sourceId:'section "A"',title:'First project',day:'2026-09-10'};
  const other={kind:'book',sourceId:tree.sourceId,title:'A book',day:'2026-10-01'};
  const key=gardenLandmarkKey(tree);
  const design=loadGardenDesign({mountains:'highlands',shoreline:'inlet',pavilion:'tea',path:'lanterns',camera:'lake',
    placements:{[key]:{x:1000.3,y:652.7},notJson:{x:10,y:20}}});
  assert.deepEqual(design.placements,{[key]:{x:1000,y:653}});
  state.gardenDesign=design;state.gardenGrowth=[tree,other];
  state.gardenLayouts=[{id:'autumn',name:' Autumn ',design,appearance:{season:'autumn'},through:'2026-09-30'},
    {id:'winter',name:'Winter',design:{...design,placements:{}},appearance:{season:'winter'},through:'2026-02-30'}];
  const {state:restored}=readBackup(JSON.stringify(createBackup(state,{getItem:()=>null},[])));
  assert.deepEqual(restored.gardenDesign,design);
  assert.equal(restored.gardenLayouts[0].name,'Autumn');
  assert.equal(restored.gardenLayouts[0].through,'2026-09-30');
  assert.equal(restored.gardenLayouts[1].through,'');
  const [a,b]=gardenLandmarkPositions(state.gardenGrowth,[],restored.gardenLayouts[0].design.placements);
  assert.deepEqual(a.position.slice(0,2),[1000,653]);
  assert.notDeepEqual(b.position.slice(0,2),[1000,653]);
  const scene=renderLandscape(design);
  assert.match(scene,/viewBox="155 171 1280 720"/);
  assert.match(scene,/data-garden-piece="pavilion" data-variant="tea"/);
  assert.match(scene,/data-garden-piece="path" data-variant="lanterns"/);
  const {scale,x,y}=gardenViewport('lake',1280,720);
  assert.deepEqual([scale,x+155*scale,y+171*scale],[1,0,0]);
});

test('calendar task colors, importance and both media links are portable across backups',()=>{
  const state=freshState();
  state.tasks=[{id:'color',text:'Exam review',done:false,priorityLevel:1,calendarColor:'plum'},
    {id:'legacy',text:'Old task',done:false,calendarColor:'url(fake)'}];
  state.spotify='https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO';
  state.youtube='https://youtu.be/M7lc1UVf-VE';state.mediaSource='youtube';
  const {state:restored}=readBackup(JSON.stringify(createBackup(state,{getItem:()=>null},[])));
  assert.equal(restored.tasks[0].calendarColor,'plum');
  assert.equal(taskPriority(restored.tasks[0]),1);
  assert.equal(restored.tasks[1].calendarColor,'');
  assert.equal(restored.spotify,state.spotify);assert.equal(restored.youtube,state.youtube);
  assert.equal(restored.mediaSource,'youtube');
});
test('YouTube links normalize to official watch and embed URLs',()=>{
  const link='https://youtu.be/M7lc1UVf-VE?list=PL1234567890';
  const content=youtubeContent(link);
  const urls=youtubeLinks(content,'http://localhost:5180');
  assert.equal(new URL(urls.watch).searchParams.get('v'),'M7lc1UVf-VE');
  assert.equal(new URL(urls.embed).searchParams.get('listType'),'playlist');
  assert.equal(new URL(urls.embed).searchParams.get('origin'),'http://localhost:5180');
  assert.deepEqual(youtubeContent('https://www.youtube.com/playlist?list=PL1234567890'),{video:'',list:'PL1234567890'});
  assert.equal(youtubeContent('https://www.youtube.com.other.example/watch?v=M7lc1UVf-VE'),null);
});

test('day templates preserve selected task blocks and report destination overlaps',()=>{
  const source='2026-11-17',target='2026-11-18',state=freshState();
  state.projects.push({id:'lab',name:'Lab'});
  state.tasks.push({id:'write',text:'Lab report',done:true,date:source,time:'09:00',estimate:40,projectId:'lab',
    blocks:[{id:'second',date:source,time:'13:00',minutes:25}]});
  state.calendarEvents.push(
    calendarEventFromFields({title:'Office hours',description:'Ask about methods',startDay:source,endDay:source,startTime:'14:00',endTime:'14:30'},'manual:office'),
    calendarEventFromFields({title:'Appointment',description:'',startDay:target,endDay:target,startTime:'09:15',endTime:'10:00'},'manual:appointment')
  );
  const [template]=loadDayTemplates([{id:'lab-day',name:'Lab day',rows:captureCalendarDay(state.tasks,state.calendarEvents,source)}]);
  const preview=previewCalendarDay(template,target,state.tasks,state.calendarEvents);
  assert.deepEqual(preview.map(entry=>entry.conflicts),[['Appointment'],[],[]]);
  const skippedEvent=copyCalendarDay(template,target,[0,1],state);
  assert.equal(skippedEvent.events.length,0);
  assert.equal(skippedEvent.tasks.length,1);
  assert.equal(skippedEvent.tasks[0].id===state.tasks[0].id,false);
  assert.equal(skippedEvent.tasks[0].done,false);
  assert.equal(skippedEvent.tasks[0].projectId,'lab');
  assert.deepEqual(calendarBlocks(skippedEvent.tasks,new Date(target+'T12:00:00')).map(block=>[block.start,block.end]),[[540,580],[780,805]]);
  const copiedEvent=copyCalendarDay(template,target,[2],state).events[0];
  assert.equal(copiedEvent.manual,true);
  assert.equal(dayKey(new Date(copiedEvent.start)),target);
  assert.equal(state.tasks[0].done,true);
});

test('day templates and pinned resources round-trip in their backup sections',()=>{
  const storage=memoryStorage(),state=freshState();
  const resources=loadProjectResources({pinnedResourceId:'note',resources:[
    {id:'unsafe',title:'Bad link',kind:'link',value:'javascript:alert(1)'},
    {id:'note',title:'Lab protocol',kind:'note',value:'Read section 4'},
    {id:'path',title:'Draft',kind:'path',value:'C:/Labs/draft.md'}
  ]});
  assert.equal(resources.resources.length,2);
  assert.equal(loadProjectResources({pinnedResourceId:'missing',resources:resources.resources}).pinnedResourceId,'');
  state.projects.push({id:'lab',name:'Lab',...resources});
  state.calendarDayTemplates.push(...loadDayTemplates([{id:'lab-day',name:'Lab day',rows:[{kind:'task',title:'Read',allDay:true}]}]));
  storage.setItem(STORAGE_KEY,JSON.stringify(state));
  assert.deepEqual(loadState(storage).projects[0].resources,resources.resources);
  assert.equal(loadState(storage).projects[0].pinnedResourceId,'note');
  assert.deepEqual(loadState(storage).calendarDayTemplates,state.calendarDayTemplates);
  const target=memoryStorage();
  restoreBackup(target,readBackup(JSON.stringify(createBackup(state,storage,[]))));
  assert.equal(loadState(target).projects[0].pinnedResourceId,'note');
  assert.equal(loadState(target).calendarDayTemplates[0].name,'Lab day');
});

test('Garden activities resolve independently, ignore missing layouts, and survive Garden & focus restore',()=>{
  const state=freshState(),storage=memoryStorage();
  state.gardenLayouts=[{id:'trees',name:'Grove'},{id:'lake',name:'Quiet lake'},{id:'path',name:'Lantern path'}];
  state.gardenActivityLayouts={focus:'trees',rest:'lake',shutdown:'path'};
  storage.setItem(STORAGE_KEY,JSON.stringify(state));
  const loaded=loadState(storage),layouts=loaded.gardenLayouts,assignments=loaded.gardenActivityLayouts;
  assert.equal(gardenActivityLayout(layouts,assignments,{mode:'focus'}).id,'trees');
  assert.equal(gardenActivityLayout(layouts,assignments,{mode:'break'}).id,'lake');
  assert.equal(gardenActivityLayout(layouts,assignments,{mode:'break',shutdown:true}).id,'path');
  assert.deepEqual(loadGardenActivityLayouts(assignments,layouts.slice(0,2)),{focus:'trees',rest:'lake'});
  assert.equal(gardenActivityLayout(layouts,{}, {mode:'break'}),undefined);
  const incoming=readBackup(JSON.stringify(createBackup(loaded,storage,[])));
  const target=memoryStorage();
  applyBackupRestore(target,planBackupRestore(target,freshState(),incoming,new Set(['garden'])));
  assert.deepEqual(loadState(target).gardenActivityLayouts,assignments);
});

test('movable Garden buildings use land and water foundations and keep their lights and options through backup',()=>{
  const state=freshState();
  const design=loadGardenDesign({pavilion:'tiered',boat:'junk',lantern:'hex',path:'boardwalk',pavilionPosition:{x:785,y:685},pavilionSize:65});
  assert.equal(pavilionFoundation(design),'stone');
  assert.equal(pavilionFoundation(loadGardenDesign({...design,pavilionPosition:{x:1260,y:601}})),'land');
  assert.equal(pavilionFoundation(loadGardenDesign({...design,foundation:'timber'})),'timber');
  assert.deepEqual(loadGardenDesign({...design,pavilionPosition:{x:1,y:10}}).pavilionPosition,{x:90,y:557});
  const markup=renderLandscape(design);
  assert.match(markup,/data-garden-piece="pavilion" data-variant="tiered"[^>]*><g transform="translate\(785 685\) scale\([^)]*\)" data-foundation="stone"/);
  assert.match(markup,/data-garden-piece="pavilionLights" data-variant="tiered"[^>]*><g transform="translate\(785 685\)/);
  assert.match(markup,/data-garden-piece="boat" data-variant="junk"/);
  state.gardenDesign=design;
  state.gardenLayouts=[{id:'lake',name:'A quieter lake',design:{...design,boat:'none'}}];
  const {state:restored}=readBackup(JSON.stringify(createBackup(state,memoryStorage(),[])));
  assert.deepEqual(restored.gardenDesign,design);
  assert.deepEqual(restored.gardenLayouts[0].design,{...design,boat:'none'});
});

test('resizing an earned landmark preserves its anchor and saves the scale',()=>{
  const state=freshState();
  const item={kind:'project',sourceId:'cedar',title:'Cedar',day:'2026-11-21'};
  const key=gardenLandmarkKey(item);
  state.gardenDesign=loadGardenDesign({landmarkSizes:{[key]:37}});
  const {state:restored}=readBackup(JSON.stringify(createBackup(state,memoryStorage(),[])));
  const [x,y,scale]=gardenLandmarkPositions([item])[0].position;
  assert.equal(restored.gardenDesign.landmarkSizes[key],35);
  assert.deepEqual(gardenLandmarkPositions([item],[],{},restored.gardenDesign.landmarkSizes)[0].position,[x,y,scale*.35]);
});

test('Garden mountain presets have distinct artwork and props survive layout and backup round trips',()=>{
  const presets=Object.keys(gardenPieceOptions.mountains).map(mountains=>renderLandscape(loadGardenDesign({mountains})));
  const mountainMarkup=presets.map(svg=>svg.split('data-garden-piece="mountains"')[1].split('d="M0 548')[0]);
  assert.equal(new Set(mountainMarkup.map(markup=>markup.slice(markup.indexOf('>')))).size,presets.length);
  assert.match(presets[1],/data-summit-snow/);
  const props=loadGardenProps([
    {id:'bridge',kind:'bridge',x:-9,y:711,size:190},
    {id:'lamp',kind:'lantern',x:1451,y:865,size:300},
    {id:'bad',kind:'invalid',x:1,y:2},
    {id:'bad2',kind:'reeds',x:3,y:Infinity}
  ]);
  assert.deepEqual(props.map(prop=>[prop.id,prop.x,prop.size]),[['bridge',32,190],['lamp',1451,200]]);
  const state=freshState(),design=loadGardenDesign({mountains:'summit',props});
  state.gardenDesign=design;
  state.gardenLayouts=[{id:'river',name:'River crossing',design}];
  const {state:restored}=readBackup(JSON.stringify(createBackup(state,memoryStorage(),[])));
  assert.deepEqual(restored.gardenDesign,design);
  assert.deepEqual(restored.gardenLayouts[0].design.props,props);
  const svg=renderLandscape(restored.gardenDesign);
  assert.match(svg,/data-garden-prop="lamp"[^]*?class="garden-prop-light"/);
  assert.equal(svg.split('data-garden-prop="bridge"').length-1,1);
});

test('new waterfront styles and props render and round-trip with a Studio layout',()=>{
  const props=Object.entries(gardenPropTypes).map(([kind,{x,y,category}])=>{
    assert.ok(Object.hasOwn(gardenPropCategories,category));
    return {id:kind,kind,x,y,size:130};
  });
  const state=freshState(),design=loadGardenDesign({
    shoreline:'slate',path:'gravel',pavilion:'shrine',foundation:'terrace',boat:'festival',lantern:'glass',
    props:props.slice(0,gardenPropLimit)
  });
  const svg=renderLandscape(design);
  for(const [piece,style] of [['westBank','slate'],['eastBank','slate'],['path','gravel'],['pavilion','shrine'],['boat','festival']]){
    assert.ok(svg.includes('data-garden-piece="'+piece+'" data-variant="'+style+'">'));
  }
  assert.equal(pavilionFoundation(design),'terrace');
  assert.doesNotMatch(svg,/undefined/);
  state.gardenLayouts=[{id:'water',name:'Terrace',design}];
  const restored=readBackup(JSON.stringify(createBackup(state,memoryStorage(),[]))).state;
  assert.deepEqual(restored.gardenLayouts[0].design,design);
  for(let start=0;start<props.length;start+=gardenPropLimit){
    const batch=props.slice(start,start+gardenPropLimit);
    const copy=loadGardenDesign({...design,props:batch});
    const artwork=renderLandscape(copy);
    assert.doesNotMatch(artwork,/undefined/);
    for(const {kind} of batch){
      const {group,style}=gardenPropTypes[kind];
      const lights=group==='pavilion'||group==='lantern'||style==='lanterns'||['lantern','floater','beacon'].includes(kind);
      assert.equal(artwork.split('data-prop-type="'+kind+'"').length-1,1,kind);
      const body=artwork.split('data-prop-type="'+kind+'"')[1].split('data-garden-prop=')[0];
      assert.equal(body.includes('class="garden-prop-light"'),lights,kind);
    }
  }
  const sky=loadGardenDesign({props:[
    {id:'cloud',kind:'cloud',x:400,y:130,size:65},
    {id:'swallow',kind:'swallow',x:600,y:125,size:75},
    {id:'star',kind:'star',x:650,y:140,size:85},
    {id:'stone',kind:'boulder',x:450,y:130,size:100}
  ]});
  assert.deepEqual(sky.props.map(prop=>prop.y),[130,125,140,446]);
  state.gardenDesign=sky;
  assert.deepEqual(readBackup(JSON.stringify(createBackup(state,memoryStorage(),[]))).state.gardenDesign,sky);
  const skyArtwork=renderLandscape(sky);
  const ridge=skyArtwork.indexOf('data-garden-piece="mountains"');
  const layer=skyArtwork.indexOf('data-garden-piece="skyProps"');
  for(const [id,phase] of [['cloud','sky'],['swallow','day'],['star','night']]){
    const prop=skyArtwork.indexOf(`data-garden-prop="${id}" data-prop-type="${id}" data-prop-phase="${phase}"`);
    assert.ok(layer<prop&&prop<ridge);
  }
  for(const [piece,styles] of Object.entries({pavilion:['watch','cloister'],boat:['cargo','canopy'],lantern:['lotus','window']})){
    const variants=styles.map(style=>renderLandscape(loadGardenDesign({...design,[piece]:style})));
    variants.forEach(svg=>assert.doesNotMatch(svg,/undefined/));
    assert.notEqual(...variants);
  }
  for(const shoreline of ['slate','shallows']){
    const shore=loadGardenDesign({...design,shoreline,foundation:'auto',pavilionPosition:{x:94,y:822}});
    assert.equal(pavilionFoundation(shore),'land');
    assert.equal(pavilionFoundation(loadGardenDesign({...shore,pavilionPosition:{x:650,y:717}})),'stone');
  }
});

test('Garden layer edits preserve position and survive backup and SVG rendering',()=>{
  const props=loadGardenProps([
    {id:'tree',kind:'cherry',x:815,y:691,size:130},
    {id:'rock',kind:'boulder',x:810,y:680,size:95},
    {id:'lamp',kind:'beacon',x:813,y:700,size:65},
    {id:'lake',kind:'ripple',x:815,y:680,band:'back'},
    {id:'flowers',kind:'wildflowers',x:815,y:680,band:'front'}
  ]);
  const order=items=>gardenPropsInOrder(items,'middle').map(({id})=>id);
  assert.deepEqual(order(props),['rock','tree','lamp']);
  const forward=moveGardenPropLayer(props,'rock','forward');
  assert.deepEqual(order(forward),['tree','rock','lamp']);
  const back=moveGardenPropLayer(forward,'lamp','back');
  assert.deepEqual(order(back),['lamp','tree','rock']);
  assert.equal(moveGardenPropLayer(back,'lamp','backward'),back);
  assert.deepEqual(back.map(({id,x,y,size})=>({id,x,y,size})),props.map(({id,x,y,size})=>({id,x,y,size})));
  const state=freshState();
  state.gardenDesign=loadGardenDesign({props:back});
  state.gardenLayouts=[{id:'bank',name:'Lake bank',design:state.gardenDesign}];
  const {state:restored}=readBackup(JSON.stringify(createBackup(state,memoryStorage(),[])));
  assert.deepEqual(restored.gardenLayouts[0].design,state.gardenDesign);
  const svg=renderLandscape(restored.gardenDesign);
  const indices=['data-garden-prop="lake"','data-garden-piece="westBank"','data-garden-prop="lamp"',
    'data-garden-prop="tree"','data-garden-prop="rock"','id="garden-growth-cairns"','data-garden-prop="flowers"'].map(value=>svg.indexOf(value));
  assert.ok(indices.every((value,i)=>value>=0&&(!i||indices[i-1]<value)));
  const dragged=dropGardenPropLayer(back,'tree','front','flowers',true);
  assert.deepEqual(gardenPropsInOrder(dragged,'front').map(prop=>prop.id),['flowers','tree']);
  assert.equal(dropGardenPropLayer(dragged,'tree','sky'),dragged);
  const changed=dragged.map(prop=>prop.id==='tree'?{...prop,locked:true}:prop.id==='lamp'?{...prop,hidden:true}:prop);
  assert.equal(dropGardenPropLayer(changed,'tree','back'),changed);
  assert.equal(moveGardenPropLayer(changed,'tree','back'),changed);
  state.gardenDesign={...state.gardenDesign,props:changed};
  const saved=readBackup(JSON.stringify(createBackup(state,memoryStorage(),[]))).state.gardenDesign;
  assert.deepEqual(saved.props,changed);
  assert.doesNotMatch(renderLandscape(saved),/data-garden-prop="lamp"/);
});

test('Garden group copies keep spacing, scene layers, and stack order near an edge',()=>{
  const originals=loadGardenProps([
    {id:'lamp',kind:'beacon',x:1568,y:878,band:'front',size:125,groupId:'gate'},
    {id:'bridge',kind:'bridge',x:1555,y:868,band:'back',size:70,groupId:'gate',locked:true,rotation:335,flipped:true},
    {id:'tree',kind:'cherry',x:1460,y:883,band:'front'}
  ]);
  assert.equal(gardenPropMoveBounds(originals.slice(0,2),originals[0]).x[1],1568);
  let serial=0;
  const result=duplicateGardenProps(originals,originals[0],()=>`copy-${++serial}`);
  assert.equal(result.id,'copy-2');
  const saved=loadGardenProps(result.props);
  const [lamp,bridge]=saved.filter(prop=>prop.groupId==='copy-1');
  assert.deepEqual([lamp.x-bridge.x,lamp.y-bridge.y,lamp.size,bridge.size,lamp.band,bridge.band],[13,10,125,70,'front','back']);
  assert.equal(bridge.locked,undefined);
  assert.equal(bridge.rotation,-25);
  assert.equal(bridge.flipped,true);
  assert.match(renderLandscape(loadGardenDesign({props:saved})),/data-garden-prop="copy-3"[^>]*rotate\(-25\) scale\(-[\d.]+ [\d.]+\)/);
  assert.deepEqual(gardenPropsInOrder(saved,'front').map(prop=>prop.id),['lamp','copy-2','tree']);
});

test('Garden snaps to nearby anchors and restores edited original scenery',()=>{
  const targets=[{x:820,y:715},{x:821,y:510}];
  assert.deepEqual(snapGardenPoint({x:825,y:751},gardenPropBounds,targets,10),{
    point:{x:820,y:751},guides:{x:targets[0]}
  });
  const state=freshState();
  state.gardenDesign=loadGardenDesign({scenery:{
    'west-tree-2':{x:252,size:145},'east-reeds':{hidden:true},unknown:{hidden:true}
  }});
  const restored=readBackup(JSON.stringify(createBackup(state,memoryStorage(),[]))).state.gardenDesign;
  assert.deepEqual(restored.scenery,{'west-tree-2':{x:252,size:145},'east-reeds':{hidden:true}});
  assert.equal(gardenSceneryObject(restored,'west-tree-2').y,gardenScenery['west-tree-2'].y);
  const svg=renderLandscape(restored);
  assert.match(svg,/data-garden-scenery="west-tree-2" transform="translate\(252 767\)/);
  assert.doesNotMatch(svg,/data-garden-scenery="east-reeds"/);
});

test('Reading keeps standalone library books, fractional reviews and rereads in backups',()=>{
  const state=freshState();
  const result=saveLibraryBook(state,'',{title:'A personal library',author:'W. Lin',totalPages:410,status:'reading'});
  Object.assign(state,result.changes);
  const [book]=readingShelf(state.dailyRituals,state.readingNotes,state.finishedBooks,state.libraryBooks);
  assert.equal(book.library.totalPages,410);
  assert.equal(book.library.status,'reading');
  assert.deepEqual(book.entries,[]);
  assert.ok(saveLibraryBook(state,'',{title:' A Personal Library ',author:'W. Lin'}).error);
  state.finishedBooks.push({id:'review',title:book.title,author:book.author,finishedOn:'2026-11-16',rating:5.7,
    rereads:[{id:'reread',finishedOn:'2026-11-16',rating:6}]});
  let restored=readBackup(JSON.stringify(createBackup(state,memoryStorage(),[]))).state;
  assert.equal(restored.finishedBooks[0].rating,5.7);
  assert.equal(ratingTier(5),'crystal');
  assert.equal(ratingTier(5.9),'crystal');
  assert.equal(ratingTier(6),'aurora');
  assert.equal(restored.finishedBooks[0].rereads[0].rating,6);
  assert.deepEqual(restored.libraryBooks,state.libraryBooks);
  const edit=editFinishedBook(restored,'review',{title:'The personal library',rating:6,totalPages:410});
  assert.equal(edit.changes.libraryBooks[0].id,edit.bookId);
  assert.equal(edit.changes.finishedBooks[0].rating,6);
});

test('renaming a library book moves its annotations, collections and linked notes',()=>{
  const state=freshState();
  const added=saveLibraryBook(state,'',{title:'Old title',status:'want'});
  Object.assign(state,added.changes);
  state.dailyRituals['2026-11-16']={annotate:{title:'Old title',chapters:'1'}};
  state.readingCollections=[{id:'collection',books:[added.bookId]}];
  state.stickyNotes=[{id:'note',related:[{kind:'book',id:added.bookId}]}];
  const edit=saveLibraryBook(state,added.bookId,{title:'New title',status:'reading'});
  assert.equal(edit.changes.dailyRituals['2026-11-16'].annotate.title,'New title');
  assert.deepEqual(edit.changes.readingCollections[0].books,[edit.bookId]);
  assert.equal(edit.changes.stickyNotes[0].related[0].id,edit.bookId);
});

test('calendar visibility follows event calendars without removing commitments or backup data',()=>{
  const state=freshState();
  state.calendars=loadCalendars([{id:'school',name:' School ',color:'plum'}]);
  state.hiddenCalendars=['school','import:School.ics'];
  const day='2026-11-17';
  const timed=(id,fields)=>({...calendarEventFromFields({title:id,description:'',startDay:day,endDay:day,startTime:'11:00',endTime:'12:00'},id),...fields});
  state.calendarEvents=[timed('default',{}),timed('class',{calendarId:'school'}),timed('import',{manual:false,source:'School.ics'})];
  assert.deepEqual(calendarCatalog(state.calendars,state.calendarEvents).map(item=>item.name),['Personal','School','School']);
  assert.equal(eventCalendarColor(state.calendarEvents[1],state.calendars),'plum');
  assert.deepEqual(visibleCalendarEvents(state.calendarEvents,state.calendars,state.hiddenCalendars).map(event=>event.id),['default']);
  assert.equal(calendarBlocks([],new Date(day+'T12:00:00'),state.calendarEvents).length,3);
  const template={rows:captureCalendarDay([],state.calendarEvents,day)};
  assert.ok(copyCalendarDay(template,'2026-11-18',[0,1,2],state).events.some(event=>event.calendarId==='school'));
  const restored=readBackup(JSON.stringify(createBackup(state,memoryStorage(),[]))).state;
  assert.deepEqual(restored.calendars,state.calendars);
  assert.deepEqual(restored.hiddenCalendars,state.hiddenCalendars);
  assert.deepEqual(restored.calendarEvents,state.calendarEvents);
  assert.equal(calendarSlotMinute(545,1440),540);
  assert.equal(calendarSlotMinute(5000,1440),1425);
});

test('event colors can override or inherit and survive Calendar backups and day templates',()=>{
  const state=freshState();
  assert.equal(state.calendarTheme,'day');
  assert.equal(calendarTheme('session'),'day');
  state.calendarTheme='dusk';
  state.calendars=loadCalendars([{id:'personal',name:'Personal',color:'blue'}]);
  const day='2026-11-17';
  state.calendarEvents=[{...calendarEventFromFields({title:'Reading',description:'',startDay:day,endDay:day,startTime:'11:00',endTime:'12:00'},'one'),calendarId:'personal',color:'rose'}];
  const [event]=state.calendarEvents;
  assert.equal(eventCalendarColor(event,state.calendars),'rose');
  assert.equal(eventCalendarColor({...event,color:''},state.calendars),'blue');
  assert.equal(eventCalendarColor({...event,color:'invalid'},state.calendars),'blue');
  const [template]=loadDayTemplates([{id:'one',name:'Day',rows:captureCalendarDay([],state.calendarEvents,day)}]);
  const [copy]=copyCalendarDay(template,'2026-11-18',[0],state).events;
  assert.equal(copy.color,'rose');
  const storage=memoryStorage(),backup=readBackup(JSON.stringify(createBackup(state,storage,[])));
  applyBackupRestore(storage,planBackupRestore(storage,freshState(),backup,new Set(['calendar'])));
  const restored=loadState(storage);
  assert.equal(restored.calendarTheme,'dusk');
  assert.equal(restored.calendarEvents[0].color,'rose');
});

test('custom calendar colors and independently scheduled rituals restore with Calendar',()=>{
  const state=freshState(),storage=memoryStorage();
  assert.equal(customCalendarColor(' #AbC '),'#aabbcc');
  assert.equal(customCalendarColor('#abc; color: red'),'');
  assert.equal(eventColorAttributes('bad" color'), 'data-event-tone=""');
  state.calendars=loadCalendars([{id:'personal',name:'Personal',color:'#012abc'}]);
  state.ritualSchedules.crochet={placement:'timed',days:[1,4],time:'19:30',minutes:45};
  state.ritualSchedules.journal={placement:'allDay',days:[0],time:'19:00',minutes:30};
  const backup=readBackup(JSON.stringify(createBackup(state,storage,[])));
  applyBackupRestore(storage,planBackupRestore(storage,freshState(),backup,new Set(['calendar'])));
  const restored=loadState(storage);
  assert.equal(eventCalendarColor({manual:true},restored.calendars),'#012abc');
  assert.deepEqual(restored.ritualSchedules,state.ritualSchedules);
  assert.deepEqual(scheduledRituals(restored.ritualSchedules,new Date(2026,10,16),'timed'),['crochet']);
  assert.deepEqual(scheduledRituals(restored.ritualSchedules,new Date(2026,10,16),'allDay'),[]);
  assert.deepEqual(scheduledRituals(restored.ritualSchedules,new Date(2026,10,22),'allDay'),['journal']);
});

test('shelf arrangement and archive survive reload, and deletion clears derived shelf entries',()=>{
  const storage=memoryStorage(),state=freshState();
  const apply=edit=>{assert.ok(edit.changes,edit.error);Object.assign(state,edit.changes);return edit.bookId;};
  const first=apply(saveLibraryBook(state,'',{title:'Blue',totalPages:280}));
  const second=apply(saveLibraryBook(state,'',{title:'Amber'}));
  state.dailyRituals['2026-11-16']={annotate:{title:'Blue',author:'',chapters:'1',done:true}};
  state.readingNotes=[{id:'note',bookTitle:'Blue',bookAuthor:'',chapter:'1',kind:'quote',text:'A sentence'}];
  state.finishedBooks=[{id:'finished',title:'Blue',author:'',finishedOn:'2026-11-16',rating:6}];
  apply(manageShelfBook(state,first,'move',second));
  apply(manageShelfBook(state,first,'archive'));
  apply(manageShelfBook(state,'','add-shelf'));
  apply(manageShelfBook(state,second,'place',29));
  assert.ok(manageShelfBook(state,undefined,'save-bookend',{position:29,kind:'cat'}).error);
  apply(manageShelfBook(state,undefined,'save-bookend',{position:30,kind:'moon',facing:'right'}));
  assert.ok(manageShelfBook(state,second,'place',30).error);
  storage.setItem(STORAGE_KEY,JSON.stringify(state));
  const loaded=loadState(storage);
  assert.equal(loaded.libraryBooks.find(book=>book.id===first).archived,true);
  assert.equal(loaded.libraryBooks.find(book=>book.id===first).shelfOrder,0);
  assert.equal(loaded.libraryBooks.find(book=>book.id===second).shelfOrder,29);
  assert.equal(loaded.readingShelfRows,3);
  assert.deepEqual(loaded.readingBookends,[{position:30,kind:'moon',facing:'right'}]);
  const backup=readBackup(JSON.stringify(createBackup(state,storage,[])));
  const restored=memoryStorage();
  applyBackupRestore(restored,planBackupRestore(restored,freshState(),backup,new Set(['reading'])));
  assert.deepEqual(loadState(restored).readingBookends,loaded.readingBookends);
  apply(manageShelfBook(state,30,'save-bookend',{position:32,kind:'jade'}));
  assert.deepEqual(state.readingBookends,[{position:32,kind:'jade',facing:'left'}]);
  apply(manageShelfBook(state,32,'remove-bookend'));
  assert.deepEqual(state.readingBookends,[]);
  assert.equal(loaded.libraryBooks.find(book=>book.id===first).totalPages,280);
  apply(manageShelfBook(state,first,'restore'));
  assert.equal(state.libraryBooks.find(book=>book.id===first).archived,undefined);
  apply(manageShelfBook(state,first,'delete'));
  assert.deepEqual(state.dailyRituals['2026-11-16'].annotate,{done:true});
  assert.ok(readingShelf(state.dailyRituals,state.readingNotes,state.finishedBooks,state.libraryBooks).every(book=>book.id!==first));
});
