import {STORAGE_KEY,freshState,loadState,remaining,startPause,startBlockFocus,skipPhase,reset,record,settle,consumeTimerWarning,todayProgress,duration,formatDuration,formatTypedDuration,parseDuration,dayKey,taskOccursOn,taskStatus,taskCompletionId,recordTaskCompletion,taskEnergyLevels,taskFrequencies,taskCalendarColors,taskCalendarColor,taskColorAttributes,repeatSettings,taskPriority,createsDependencyCycle,unfinishedPrerequisites,breakIdeaMinutes,breakIdeasThatFit,loadSoundtracks,startTaskTiming,resetTaskTiming,taskFinishBreak,overtimeElapsed,finishOvertime} from './state.js';
import {renderLandscape,blossomMarkup,animateLandscape,createShootingStars,eveningCamera,gardenFieldSketch,gardenGrowthMarkup,gardenLandmarkPositions,applySceneryAppearance,mountGardenPreview,applyGardenDesign,constellationLitPoints,mountainRidges,mountainCovers} from './scenery.js';
import {earnGardenDetail,gardenComparison,gardenCourses,gardenRange,gardenReward,gardenZones,landmarkInscription,landmarkPlacement,landmarkTypes} from './garden-growth.js';
import {gardenStarProgress,starConstellations} from './garden-growth.js';
import {gardenConstellationSketch} from './scenery.js';
import {addTaskBlock, allDayEvents, applyCalendarReplan, blockFocusTiming, blockProgressLabels, calendarBlockProgress, calendarBlocks, calendarDragType, calendarEventFromFields, calendarFocusTotals, calendarPlanningBuffers, calendarTaskBlock, weekDays, focusCalendarBlock, focusTaskQueue, layoutBlocks, openFocusBlock, replanToday, reserveTomorrowFocus, scheduledTaskTime, scheduleTask, shiftDay, timeLabel, timeMinutes, timeValue, tomorrowFocusSlot} from './calendar.js';
import {calendarCatalog,calendarColors,calendarColor,calendarColorName,customCalendarColor,eventColorAttributes,calendarTheme,calendarSlotMinute,eventCalendarColor,eventCalendarId,loadCalendars,personalCalendarId,visibleCalendarEvents} from './calendar-layers.js';
import {replayTaskSwitch,replaySessions,replayBlocks} from './focus-replay.js';
import {currentFocusPause,editFocusPause} from './focus-replay.js';
import {handoffLink,sessionHandoff,nextFocusSubtask} from './session-handoff.js';
import {installExamPlans} from './exam-plans.js';
import {installMistakeNotebook,needsRetry} from './mistake-notebook.js';
import {bundleProgress,installBundleEditor} from './task-bundles.js';
import {CAPTURE_PREFIX, cleanCaptureContext, readCaptures, saveCapture, storeCapture} from './capture.js';
import {recordScheduleMoves,snapshotSchedule,summarizeDay,recapMoveTarget} from './day-recap.js';
import {installPlanner} from './planner.js';
import {gardenPalettes,lightingOptions,seasonOptions,sceneryMotionOptions,weatherBySeason,gardenWeather,loadAppearance,loadGardenLooks,loadGardenSchedule,scheduledAppearance} from './garden-appearance.js';
import {createGardenStudio} from './garden-studio.js';
import {gardenViewport,gardenActivityLayout,loadGardenActivityLayouts} from './garden-layout.js';
import {comparisonPostcardPng,postcardPng,weeklyPostcardPng} from './garden-postcard.js';
import {installCrochet,loadCrochet} from './crochet.js';
import {installJournal,loadJournal} from './journal.js';
import {installFocusNotes,installStickyNotes,noteRelatedItems,noteTaskIds,scratchNoteId} from './sticky-notes.js';
import {ratingTier,radiantRatingLabels} from './reading-progress.js';
import {annotationContext,editFinishedBook,finishedBook,installReadingShelf,manageShelfBook,mergeShelfBooks,readingShelf,saveLibraryBook} from './reading-shelf.js';
import {installBackup,restoreBackup} from './backup.js';
import {adminSandboxStorage,adminSandboxUrl,isAdminSandbox,workspaceStorageEvent} from './admin-sandbox.js';
import {installAutomaticBackup} from './automatic-backup.js';
import {installFocusCompass,focusCompass,focusWeek} from './focus-compass.js';
import {timerProgress,extendTimer,canExtendCalendarTimer,extendCalendarTimer,focusWrapUp,focusWrapUpDuration,wrapUpMinutes} from './state.js';
import {calendarBlockDurationChange,planRunningBlockExtension} from './calendar.js';
import {quickTask} from './planner-data.js';
import {incompleteFocusSessions,loadFocusSetups} from './state.js';
import {installMiniTimer} from './mini-timer.js';
import {installReferenceEditor} from './focus-reference.js';
import {installCalendarResize} from './calendar-resize.js';
import {installBatchMove} from './calendar-batch.js';
import {installBrush} from './calendar-brush.js';
import {installOfficeHours} from './office-hours.js';
import {openSemesterReplay} from './semester-replay.js';
import {installPostcardViewpoints} from './postcard-viewpoints.js';
import {dailyRitualMarkup,loadRitualSchedules,ritualComplete,rituals,scheduledRituals} from './daily-rituals.js';
import {createGardenAudio,soundChannels} from './garden-audio.js';
import {createSpotifyEmbed,spotifyPath} from './spotify-embed.js';
import {createYouTubeEmbed,youtubeContent,youtubeLinks} from './youtube-embed.js';
import {captureTaskChange,restoreDeletedTask,restoreActiveTask} from './task-undo.js';
import {installCommandPalette} from './command-palette.js';
import {installHelp} from './help.js';
import {installVersionHistory} from './version-history.js';
import {canPlanDeadline,compareStudyWeeks,draftStudyWeek,examStudyBlocks,planDeadline,scheduleImpact,todayTradeoffs} from './scheduling.js';
import {nextTaskDate} from './planner-data.js';
import {loadAvailability,unavailableRanges} from './availability.js';
import {taskTemplate,projectResource} from './project-planning.js';
import {validTemplateDay,loadDayTemplates,captureCalendarDay,previewCalendarDay,copyCalendarDay} from './calendar-day-templates.js';
import {estimateSummary,suggestTaskEstimate,taskSplitSuggestion} from './planner-report.js';
import {loadRoutinePhase,routinePhases} from './state.js';
import {tasksWithinTime,taskTimeFit} from './calendar.js';
import {calendarFocusWindow,focusWindowTasks,nextCalendarCommitment} from './calendar.js';
import {eventOccurrenceDay,calendarEventOccurrences} from './calendar.js';
import {parseRubric,rubricPoints,rubricSummary} from './rubric.js';
import {blockFlexibility,waitingForRecord} from './task-readiness.js';

const $=s=>document.querySelector(s);
const icons={
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .5-1.5 1-1.5 2.5"/><circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none"/>',
  search:'<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  left:'<path d="m14 6-6 6 6 6"/>',right:'<path d="m10 6 6 6-6 6"/>',
  calendar:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4m8-4v4m-8 7h2m4 0h2"/>',
  list:'<path d="m4 7 1 1 2-2m-3 6 1 1 2-2m-3 6 1 1 2-2M10 7h10m-10 5h10m-10 5h10"/>',
  sidebar:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v14m-3-9h.1m-.1 4h.1"/>',
  journal:'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M8 3v18m3-12h6m-6 4h6"/>',
  note:'<path d="M7 4h10a2 2 0 0 1 2 2v8l-5 6H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M14 20v-4a2 2 0 0 1 2-2h3M8 8h8m-8 3h6"/>',
  book:'<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1v14M6 9h3m-3 4h3m6-4h3m-3 4h3"/>',
  sprout:'<path d="M12 20v-8m0 2c-5 0-8-3-8-7 5 0 8 3 8 7Zm0-2c0-5 3-8 8-8 0 5-3 8-8 8Z"/>',
  sliders:'<path d="M4 7h5m4 0h7M4 17h10m4 0h2"/><circle cx="11" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
  appearance:'<path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/><circle cx="12" cy="12" r="4"/>',
  mountain:'<path d="M3 18 9 8l3 5 3-8 6 13H3Zm4-6 2 2 2-2m2-2 2 2 2-2"/>',
  yarn:'<circle cx="11" cy="10" r="6.5"/><path d="m5 9 7 7m-5-11 9 9m-4-10 5 5m-3 7c0 2 2 3 4 3h3"/>',
  play:'<path d="m8 5 11 7-11 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',reset:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',skip:'<path d="m5 5 10 7-10 7zM19 5v14"/>',expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',collapse:'<path d="M3 8h5V3m8 0v5h5M8 21v-5H3m13 5v-5h5"/>',focus:'<path d="M9 3H5a2 2 0 0 0-2 2v4m12-6h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4"/><circle cx="12" cy="12" r="3"/>',music:'<path d="M9 18V5l12-2v13M9 9l12-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="16" rx="3" ry="3"/>',spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',external:'<path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||''}</svg>`;
function applyIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let liveStorage;
try{liveStorage=localStorage;}catch{liveStorage={getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}};}
const adminSandbox=isAdminSandbox(),storage=adminSandbox?adminSandboxStorage(liveStorage):liveStorage;
let state=loadState(storage),activePanel=null,lastAnchor=null,idleTimeout,toastTimeout,lastBlossoms=-1;
const app=$('#app');
$('[data-open-admin]').hidden=!adminSandbox;
app.classList.toggle('admin-sandbox',adminSandbox);
$('[data-open-admin]').onclick=event=>openPanel('admin-sandbox',event.currentTarget);
const focusModeButton=$('#focus-mode');
const timerButton=$('#toggle-timer');
const currentTaskButton=$('#current-task');
const currentTaskName=$('#current-task-name');
const finishTaskButton=$('#finish-current-task');
const root=$('#panel-root');
const taskSidebar=$('#task-sidebar'),taskBoard=$('#task-board'),taskBoardToggle=$('#task-board-toggle');
const calendarPanel=$('#calendar-panel');
const calendarScroll=$('#calendar-scroll');
const calendarRail=$('#calendar-sidebar');
const calendarRailToggle=$('#calendar-toggle-sidebar');
const compactCalendarRail=matchMedia('(max-width: 860px)');
const calendarGrid=$('#calendar-grid');
const calendarTray=$('#calendar-task-tray');
const calendarShelf=$('#calendar-queue');
const calendarShelfToggle=$('#calendar-queue-toggle');
const calendarShelfSearch=$('#calendar-queue-search');
const miniCalendar=$('#mini-calendar'),agendaList=$('#agenda-list'),agendaRange=$('#agenda-range');
const taskMenu=$('#task-menu');
const builtinRoutines=[{id:'classic',name:'Classic',focus:25*60000,rest:5*60000},{id:'deep',name:'Deep work',focus:50*60000,rest:10*60000}];
const desktopTasks=matchMedia('(min-width: 981px)');
let editingTaskId=null,editingBlockId=null,renderedTaskDay='',agendaMinute=-1,agendaOffset=0,agendaMarkup='';
let taskDraft=null,blockDraft=null,calendarLayoutDay='',calendarOpenMinute,eventDraft=null;
let railDate='',railMonth=null,railMarkup='';
let calendarAnchor=null,calendarExit=null,menuTaskId=null,menuAnchor=null,taskColorMenuId=null;
const plannerDateCount=43;
let plannerDays=[],plannerColumnWidth=0,plannerOffset=0,plannerVisibleRange='',plannerScrollEnd;
let dragOffset=0,workspace='focus';
let capturePointer=null,nativeNotes=[],captureApiAvailable=true,syncingCaptures=false;
let activeCaptureContext;
let reopenTasksAfterCalendar=false;
let effectiveAppearance=state.appearance, resumeTaskId=null, captureActionKey=null;
let renderedGardenGrowth, renderedGardenProjects, selectedLandmark=null, gardenHistoryFilter='all', recapOrigin=null;
let gardenFrom='',gardenThrough='',snapshotThrough='',selectedCourse='';
let seasonPreview='',comparisonDates=null,snapshotLayoutId='',paintedGardenDesign;
let renderedGardenDesign;
const studio=createGardenStudio({getState:()=>state,getAppearance:()=>effectiveAppearance,getDesign:sceneGardenDesign,commit:saveStudioLayouts,
  today:()=>dayKey(),download:async(scene,caption)=>{
    const blob=await postcardPng(scene,caption);
    savePostcard(blob,'garden-studio-'+dayKey()+'.png');
  }});
let handoffMarkup='', actualCalendar=false, replayRenderKey='', returnToCalendarMonth=false;
const blockExtensionMinutes=10;
let extensionPreview=null;
let renderedBundle='';
let savedSchedule=snapshotSchedule(state), captureInboxTab='inbox', returnToCaptureInbox=false, captureInboxIndex=0;
const gardenAudio=createGardenAudio();
let mediaPlayback='idle';
function updateMediaPlayback(playback){mediaPlayback=playback;syncSound();}
const spotifyEmbed=createSpotifyEmbed(updateMediaPlayback);
const youtubeEmbed=createYouTubeEmbed(updateMediaPlayback,setMediaStatus);
const undoToast=$('#undo-toast'),undoButton=$('#undo-action');
const dismissBrushButton=$('#dismiss-brush-action');
let pendingUndo,undoTimeout,undoReturn,pendingBrush;
let commitmentPreview;
const clockFormat=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
const secondsClockFormat=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true});
const weekdayFormat=new Intl.DateTimeFormat('en-US',{weekday:'short'});
function persist(){
  commitmentPreview=null;
  const previous=state.scheduleMoves, schedule=snapshotSchedule(state);
  const replay=state.timer.replay;
  if(state.timer.mode==='focus'&&state.timer.replay?.length)replayTaskSwitch(state.timer,focusedTask(),Date.now());
  state.scheduleMoves=recordScheduleMoves(previous,savedSchedule,schedule);
  try{
    storage.setItem(STORAGE_KEY,JSON.stringify(state));savedSchedule=schedule;
    $('#saved-status').innerHTML='<span class="tiny-dot"></span>'+(adminSandbox?'Saved in sandbox':'Saved on this device');return true;
  }catch{
    state.scheduleMoves=previous;
    if(replay)state.timer.replay=replay;
    $('#saved-status').textContent='Storage unavailable — keep this tab open';
    toast('Your browser could not save changes. Keep this tab open.');return false;
  }
}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('visible'),4200);}
function announce(text){$('#announcer').textContent=text;}
function constellationUnlockMessage(previous){
  const old=new Set(gardenStarProgress(previous).unlocked.map(item=>item.id));
  return gardenStarProgress(state.gardenGrowth).unlocked.filter(item=>!old.has(item.id)).map(item=>item.name).join(' and ');
}
function recordGardenGrowth(kind,id,title,day=dayKey(),metadata){
  const previous=state.gardenGrowth;
  const next=earnGardenDetail(previous,kind,id,title,day,metadata);
  if(next===previous)return false;
  state.gardenGrowth=next;
  if(!persist()){state.gardenGrowth=previous;return false;}
  renderGardenGrowth();
  const type=landmarkTypes[kind];
  const unlocked=kind==='test'&&constellationUnlockMessage(previous);
  confirmChange(unlocked?`Constellation unlocked · ${unlocked}`:`${type.event}. A ${type.name.toLowerCase()} has joined the Garden.`);
  return true;
}
function saveExamPlan(projectId,exam){
  const project=state.projects.find(item=>item.id===projectId);
  if(!project)return false;
  const exams=project.exams||[], growth=state.gardenGrowth;
  const prior=exams.find(item=>item.id===exam.id);
  const star=gardenReward(growth,'test',exam.id);
  project.exams=prior?exams.map(item=>item===prior?exam:item):[...exams,exam];
  if(exam.result){
    const {takenOn,score,reflection}=exam.result;
    const updated=earnGardenDetail([],'test',exam.id,exam.title,takenOn,{result:score,detail:reflection,courseId:project.id,courseName:project.name})[0];
    state.gardenGrowth=star?growth.map(item=>item===star?updated:item):[...growth,updated];
  }
  if(!persist()){project.exams=exams;state.gardenGrowth=growth;return false;}
  renderGardenGrowth();planner.render();
  const unlocked=exam.result&&!star&&constellationUnlockMessage(growth);
  confirmChange(unlocked?`Constellation unlocked · ${unlocked}`:exam.result&&!star?'Exam result saved. A star has joined the Garden.':'Exam plan saved.');
  return true;
}
function viewedGardenLayout(){return state.gardenLayouts.find(item=>item.id===snapshotLayoutId);}
function activityGardenLayout(){
  const setup=state.gardenLayouts.find(item=>item.id===state.timer.sequence?.setupLayoutId);
  if(setup)return setup;
  return gardenActivityLayout(state.gardenLayouts,state.gardenActivityLayouts,{mode:state.timer.mode,shutdown:activePanel==='evening-lights'});
}
function sceneGardenDesign(){return (viewedGardenLayout()||activityGardenLayout())?.design||state.gardenDesign;}
let previousActivityAppearance,activityWeatherSince=0;
function renderGardenGrowth(){
  const design=sceneGardenDesign();
  if(renderedGardenGrowth===state.gardenGrowth&&renderedGardenProjects===state.projects&&renderedGardenDesign===design)return;
  const courses=gardenCourses(state.gardenGrowth,state.projects);
  const {assigned,unlocked}=gardenStarProgress(state.gardenGrowth,{through:snapshotThrough});
  const art=gardenGrowthMarkup(state.gardenGrowth,{courses,through:snapshotThrough,design});
  for(const [part,markup] of Object.entries(art))$(`#garden-growth-${part}`).innerHTML=markup;
  const courseAnchors=new Map(courses.flatMap(course=>{
    const star=course.stars.find(({item,index})=>!assigned.has(index)&&(!snapshotThrough||item.day<=snapshotThrough));
    return star?[[star.index,course]]:[];
  }));
  $('#garden-landmarks').innerHTML=gardenLandmarkPositions(state.gardenGrowth,courses,design.placements,design.landmarkSizes).map(({item,index,position})=>{
    if(snapshotThrough&&item.day>snapshotThrough)return '';
    if(assigned.has(index))return '';
    const type=landmarkTypes[item.kind], [x,y,scale]=position;
    const center=y-({project:93,book:5,milestone:10,test:0}[item.kind]*scale);
    const course=courseAnchors.get(index);
    const label=escape(course?`Constellation · ${course.name}`:`${type.name} · ${item.title}`);
    return `<button type="button" data-garden-landmark="${index}" ${item.kind==='test'?'data-sky-star':''} ${course?`data-sky-course="${escape(course.id)}"`:''} data-x="${x}" data-y="${center}"
      aria-label="${label}" title="${label}" aria-haspopup="dialog" aria-expanded="false"></button>`;
  }).join('')+unlocked.map(item=>
    `<button type="button" data-sky-constellation="${item.id}" data-member-stars="${item.starIndices.join(' ')}" data-x="${item.x}" data-y="${item.y}"
      data-sky-points="${constellationLitPoints(item).map(([x,y])=>`${item.x+x},${item.y+y}`).join(' ')}"
      aria-label="${item.name} constellation" title="${item.name}" aria-haspopup="dialog" aria-expanded="false"></button>`).join('');
  positionGardenLandmarks();
  renderedGardenGrowth=state.gardenGrowth;
  renderedGardenProjects=state.projects;
  renderedGardenDesign=design;
}
function positionGardenLandmarks(){
  const {clientWidth:width,clientHeight:height}=app;
  const viewport=gardenViewport(sceneGardenDesign().camera,width,height);
  const ridges=mountainRidges($('#landscape .world'));
  const screenPoint=(x,y)=>[viewport.x+x*viewport.scale,viewport.y+y*viewport.scale];
  const inView=(x,y)=>x>=14&&x<=width-14&&y>=14&&y<=height-14;
  const skyVisible=(x,y)=>inView(...screenPoint(x,y))&&!mountainCovers(ridges,x,y);
  for(const button of $('#garden-landmarks').children){
    let position=[Number(button.dataset.x),Number(button.dataset.y)];
    if(button.dataset.skyPoints){
      const visiblePoint=button.dataset.skyPoints.split(' ').map(point=>point.split(',').map(Number)).find(point=>skyVisible(...point));
      if(!visiblePoint){button.hidden=true;continue;}
      if(!skyVisible(...position))position=visiblePoint;
    }
    const [x,y]=screenPoint(...position);
    button.hidden=button.hasAttribute('data-sky-star')?!skyVisible(...position):!inView(x,y);
    button.style.left=`${x}px`;button.style.top=`${y}px`;
  }
}
function positionEveningCamera(){
  const {x,y,zoom,width,height}=eveningCamera(app.clientWidth,app.clientHeight);
  app.style.setProperty('--evening-x',`${x}px`);
  app.style.setProperty('--evening-y',`${y}px`);
  app.style.setProperty('--evening-zoom',zoom);
  app.style.setProperty('--evening-width',`${width}px`);
  app.style.setProperty('--evening-height',`${height}px`);
}
function finishReadingBook(book){
  const record=finishedBook({id:crypto.randomUUID(),title:book.title,author:book.author,finishedOn:dayKey(),
    totalPages:book.library?.totalPages||book.entries.find(entry=>entry.totalPages)?.totalPages});
  if(!record||book.finished)return false;
  const previous=state.finishedBooks;
  state.finishedBooks=[...previous,record];
  if(recordGardenGrowth('book',record.id,[record.title,record.author].filter(Boolean).join(' · ')))return true;
  state.finishedBooks=previous;
  return false;
}
function saveReadingChanges(edit){
  if(edit.error)return edit;
  const previous=Object.fromEntries(Object.keys(edit.changes).map(key=>[key,state[key]]));
  Object.assign(state,edit.changes);
  if(!persist()){
    Object.assign(state,previous);
    return {error:'Could not save the book. Try again.'};
  }
  renderGardenGrowth();
  return {bookId:edit.bookId};
}
function syncSound(unlock=false){
  gardenAudio.sync(state.sounds,mediaPlayback!=='idle');
  if(unlock)gardenAudio.unlock();
  const status=$('#garden-sound-status');
  if(status)status.textContent=state.sounds.muted?'App sounds muted.':state.sounds.musicMode?'App sounds paused for outside music.':
    mediaPlayback==='unknown'?'App sounds paused while player status is unconfirmed.':mediaPlayback==='playing'?'App sounds paused while the player is active.':'Set any slider to zero to turn that sound off.';
}
function dismissUndo(){
  pendingUndo=null;pendingBrush=null;clearTimeout(undoTimeout);undoToast.hidden=true;
}
function queueUndoExpiry(){
  clearTimeout(undoTimeout);
  if(pendingUndo&&!pendingBrush&&!undoToast.matches(':hover, :focus-within'))undoTimeout=setTimeout(dismissUndo,12000);
}
function confirmChange(message,undo){
  if(!undo){toast(message);announce(message);return;}
  undoReturn=document.activeElement;
  pendingBrush=null;undoButton.textContent='Undo';
  dismissBrushButton.hidden=true;
  pendingUndo=undo;
  undoToast.hidden=false;
  $('#undo-message').textContent=message;
  announce(`${message} Undo available.`);
  queueUndoExpiry();
}
undoToast.addEventListener('pointerenter',()=>clearTimeout(undoTimeout));
undoToast.addEventListener('pointerleave',queueUndoExpiry);
undoToast.addEventListener('focusin',()=>clearTimeout(undoTimeout));
undoToast.addEventListener('focusout',()=>setTimeout(queueUndoExpiry,0));
dismissBrushButton.onclick=()=>{
  dismissUndo();
  (inSchedule()?$('#planner-heading'):currentTaskButton).focus({preventScroll:true});
};
undoButton.onclick=()=>{
  if(pendingBrush){
    const {stroke,redo}=pendingBrush,step=stroke.update(state,redo);
    if(!step){dismissUndo();toast('The painted copies changed and this action is no longer available.');return;}
    if(!commitCalendarCopies(step.changes))return;
    step.applied();
    showBrushAction(stroke,!redo,redo?'Painted copies restored.':'Painted copies removed.');
    return;
  }
  const undo=pendingUndo;
  if(!undo)return;
  dismissUndo();
  const reverted=undo(state);
  if(reverted){
    persist();refreshTasks();
    stickyBoard.render();
    if(activePanel==='task-editor')updateTaskCompletionButton();
  }
  const target=undoReturn?.isConnected&&undoReturn.getClientRects().length?undoReturn:inSchedule()?$('#planner-heading'):currentTaskButton;
  target.focus({preventScroll:true});
  const message=reverted?'Change undone.':'This item changed before it could be undone.';
  toast(message);announce(message);
};
const mistakeNotebook=installMistakeNotebook({dialog:$('#mistake-dialog'),getState:()=>state,notify:confirmChange,startFocus:startMistakeFocus,save:entries=>{
  const prior=state.mistakes;
  state.mistakes=entries;
  if(!persist()){state.mistakes=prior;return false;}
  if(activePanel==='task-editor'){
    const count=entries.filter(item=>item.taskId===editingTaskId&&needsRetry(item)).length;
    const button=$('[data-task-mistakes]');
    if(button)button.textContent=count?`Mistake notebook · ${count} to retry`:'Mistake notebook';
  }
  return true;
}});
const examPlans=installExamPlans({dialog:$('#exam-dialog'),projects:()=>state.projects,today:dayKey,save:saveExamPlan,
  openMistakes:(context,anchor)=>mistakeNotebook.open(context,anchor),openStudyBlocks:openExamStudy});
const examStudyDialog=$('#exam-study-dialog');
let examStudyContext,examStudyPreview=[];
function openExamStudy(projectId,examId,anchor){
  examStudyContext={projectId,examId,anchor};examStudyPreview=[];
  const exam=state.projects.find(item=>item.id===projectId)?.exams?.find(item=>item.id===examId);
  if(!exam)return;
  examStudyDialog.innerHTML=`<header><div><small>${escape(exam.title)}</small><h2 id="exam-study-title">Plan study blocks</h2></div>
    <button type="button" data-close-exam-study aria-label="Close study blocks">×</button></header>
    <form><label>Study minutes available <input name="budget" type="number" min="15" max="600" step="1" value="90" required></label>
    <small>Looks up to two weeks ahead, before the exam date.</small>
    <button class="workspace-primary" value="preview">Preview study blocks</button>
    <div id="exam-study-results"></div><p id="exam-study-status" role="status"></p></form>`;
  examStudyDialog.showModal();
}
function currentExamStudy(budget){
  const {projectId,examId}=examStudyContext;
  const project=state.projects.find(item=>item.id===projectId);
  const exam=!project?.archived&&project?.exams?.find(item=>item.id===examId);
  if(!exam)return [];
  return examStudyBlocks({exam,mistakes:state.mistakes,tasks:gardenTasks(),events:state.calendarEvents,availability:state.availability,
    cutoff:schedulingCutoff(),capacity:state.studyCapacity,cooldown:state.planningCooldown,budget});
}
function showExamStudy(slots,message){
  examStudyPreview=slots;
  examStudyDialog.querySelector('#exam-study-results').innerHTML=slots.length?`<ul class="tradeoff-options">${slots.map((slot,index)=>
    `<li><label><input type="checkbox" name="slot" value="${index}" checked> <strong>${escape(slot.title)}</strong></label>
    <span>${shortScheduleDate(slot.date)} · ${timeLabel(slot.start)} · ${slot.minutes} min · ${slot.retries?`${slot.retries} to retry`:'Topic practice'}</span></li>`).join('')}</ul>
    <button class="workspace-primary" value="approve">Approve selected blocks</button>`:'';
  examStudyDialog.querySelector('#exam-study-status').textContent=message||'';
}
examStudyDialog.addEventListener('click',event=>{if(event.target.closest('[data-close-exam-study]'))examStudyDialog.close();});
examStudyDialog.addEventListener('close',()=>examStudyContext?.anchor.focus({preventScroll:true}));
examStudyDialog.addEventListener('input',event=>{if(event.target.name==='budget')showExamStudy([]);});
examStudyDialog.addEventListener('submit',event=>{
  event.preventDefault();
  const data=new FormData(event.target),slots=currentExamStudy(Number(data.get('budget')));
  if(event.submitter?.value!=='approve'){
    const remaining=Number(data.get('budget'))-slots.reduce((sum,slot)=>sum+slot.minutes,0);
    showExamStudy(slots,slots.length?`${minutesLabel(remaining)} of your budget left unallocated.`:'No eligible topic and free slot fit this plan.');return;
  }
  const selected=data.getAll('slot').map(index=>examStudyPreview[Number(index)]).filter(Boolean);
  if(!selected.length){examStudyDialog.querySelector('#exam-study-status').textContent='Select at least one block.';return;}
  if(JSON.stringify(slots)!==JSON.stringify(examStudyPreview)){showExamStudy(slots,'The schedule changed. Review the new suggestions.');return;}
  const {projectId,examId}=examStudyContext;
  const exam=state.projects.find(item=>item.id===projectId).exams.find(item=>item.id===examId);
  const previous=state.tasks;
  const added=selected.map(slot=>{
    const task={id:crypto.randomUUID(),done:false,text:`Study ${slot.title}`,description:`Exam prep for ${exam.title}${slot.retries?' · Review mistakes before the exam.':''}`,
      projectId,estimate:slot.minutes,repeat:'none',date:slot.date,blocks:[]};
    addTaskBlock(task,slot.date,timeValue(slot.start),slot.minutes);return task;
  });
  state.tasks=[...previous,...added];
  const saved=new Map(added.map(task=>[task.id,JSON.stringify(task)]));
  if(!persist()){state.tasks=previous;return;}
  examStudyDialog.close();refreshTasks();
  confirmChange(`Scheduled ${added.length} exam study ${added.length===1?'block':'blocks'}.`,latest=>{
    if(added.some(task=>JSON.stringify(latest.tasks.find(item=>item.id===task.id))!==saved.get(task.id)))return false;
    latest.tasks=latest.tasks.filter(task=>!added.includes(task));return true;
  });
});
window.gardenStudioHasUnsavedChanges=studio.hasUnsavedChanges;
window.addEventListener('beforeunload',event=>{
  if(!studio.hasUnsavedChanges())return;
  event.preventDefault();
  event.returnValue='';
});
const bundleEditor=installBundleEditor({dialog:$('#bundle-dialog'),tasks:gardenTasks,save:item=>saveBundle(item),remove:id=>saveBundle(null,id)});
const planner=installPlanner({
  root:calendarPanel,getState:()=>state,commit:()=>{const saved=persist();refreshTasks();return saved;},
  editTask:openTaskEditor,openBlock:openCalendarBlock,taskMenu:openTaskMenu,
  linkedNotes:id=>linkedStickyNotes('project',id),
  nextProjectTask, resumeProject, openResources:openProjectResources, projectTimerLocked,
  openExamPlans:(project,anchor)=>examPlans.open(project,null,anchor),
  bundleStatus:taskBundleStatus, startBundle, stopBundle, editBundle,
  isActualCalendar:()=>actualCalendar,
  projectReward:id=>gardenReward(state.gardenGrowth,'project',id),
  finishProject:project=>recordGardenGrowth('project',project.id,project.name),
  previewSchedule:previewTaskSchedule,
  calendarChanged:showPlannerCalendar,calendarDate:leadingPlannerDay,calendarRail:renderCalendarRail,shownEvents:shownCalendarEvents,eventAppearance:calendarEventAppearance,dailyRituals:renderDailyRituals,monthRituals,blockProgress:progressForBlock,notify:confirmChange,completeTask:markTask,hasPanel:()=>Boolean(activePanel)||!taskMenu.hidden||Boolean(document.querySelector('dialog[open]'))
});
const penguinThoughts=[
  'Small steps still carry you forward.',
  'Start with the next line.',
  'You can take your time and still get there.',
  'A rough first try gives you something to work with.',
  'One quiet stretch of focus is enough for now.',
  'It’s okay to stop and catch your breath.',
  'Look how far all those small steps got you.'
];
let penguinThoughtIndex=0;
function nextPenguinThought(){
  penguinThoughtIndex=(penguinThoughtIndex+1)%penguinThoughts.length;
  const thought=penguinThoughts[penguinThoughtIndex];
  $('#penguin-thought').textContent=thought;
  return thought;
}
$('#penguin-next').onclick=()=>announce(nextPenguinThought());
$('#landscape').innerHTML=renderLandscape();
const shootingStars=createShootingStars($('#landscape .world'));
new ResizeObserver(()=>{
  positionGardenLandmarks();
  positionEveningCamera();
  if(activePanel==='garden-landmark')positionPanel(visiblePanel(),landmarkAnchor(selectedLandmark));
}).observe(app);
$('#garden-landmarks').addEventListener('click',event=>{
  const constellation=event.target.closest('[data-sky-constellation]');
  if(constellation){openUnlockedConstellation(constellation.dataset.skyConstellation,constellation,snapshotThrough);return;}
  const button=event.target.closest('[data-garden-landmark]');
  if(button?.dataset.skyCourse)openGardenCourse(button.dataset.skyCourse,button);
  else if(button)openGardenLandmark(Number(button.dataset.gardenLandmark));
});
$('#garden-snapshot-close').onclick=()=>setGardenSnapshot('');
$('#garden-snapshot [data-open-postcard]').onclick=event=>openGardenPostcard(undefined,event.currentTarget);
const crochet=installCrochet({root:$('#crochet-workspace'),storage,storageEvent:key=>workspaceStorageEvent(key,adminSandbox),notify:message=>{toast(message);announce(message);}});
const journal=installJournal({root:$('#journal-workspace'),storage,storageEvent:key=>workspaceStorageEvent(key,adminSandbox),projects:()=>loadCrochet(storage).projects,notify:confirmChange,
  getTemplates:()=>state.journalTemplates,saveTemplates:templates=>{
    const previous=state.journalTemplates;state.journalTemplates=templates;
    if(persist())return true;
    state.journalTemplates=previous;return false;
  },
  getReflections:()=>state.weeklyReflections,saveReflection:record=>{
    const previous=state.weeklyReflections;
    state.weeklyReflections=[...previous.filter(item=>item.week!==record.week),record];
    if(persist())return true;
    state.weeklyReflections=previous;return false;
  },
  linkedNotes:id=>linkedStickyNotes('journal',id),
  onChange:()=>{if(inSchedule())renderCalendar();}
});
const stickyBoard=installStickyNotes({root:$('#notes-workspace'),getNotes:()=>state.stickyNotes,getTasks:gardenTasks,getRelated:relatedNoteTargets,saveNotes:saveStickyNotes,
  createTask:(noteId,text,anchor)=>openTaskEditor(null,anchor,{noteId,text:text.split(/\r?\n/)[0].trim().slice(0,160),description:text.slice(0,2000)}),
  notify:confirmChange});
const focusNotes=installFocusNotes({
  button:$('#focus-linked-notes'),stackButton:$('#focus-note-stacks'),panel:$('#focus-notes-panel'),getNotes:()=>state.stickyNotes,
  saveNotes:saveStickyNotes,onEdit:()=>stickyBoard.render()
});
const reading=installReadingShelf({root:$('#reading-workspace'),getRituals:()=>state.dailyRituals,getNotes:()=>state.readingNotes,
  saveNotes:notes=>{
    const previous=state.readingNotes;
    state.readingNotes=notes;
    if(persist())return true;
    state.readingNotes=previous;
    return false;
  },openCalendar:()=>calendarToggle.click(),linkedNotes:id=>linkedStickyNotes('book',id),
  getShelfRows:()=>state.readingShelfRows,getBookends:()=>state.readingBookends,
  getLibrary:()=>state.libraryBooks,saveLibrary:(id,values)=>saveReadingChanges(saveLibraryBook(state,id,values)),
  manageBook:(id,action,target)=>saveReadingChanges(manageShelfBook(state,id,action,target)),
  getFinished:()=>state.finishedBooks,bookReward:id=>gardenReward(state.gardenGrowth,'book',id),
  getCollections:()=>state.readingCollections,saveCollections:collections=>{
    const previous=state.readingCollections;state.readingCollections=collections;
    if(persist())return true;
    state.readingCollections=previous;return false;
  },
  finishBook:finishReadingBook,saveBook:(id,values)=>saveReadingChanges(editFinishedBook(state,id,values)),
  mergeBooks:(source,target)=>saveReadingChanges(mergeShelfBooks(state,source,target))});
const automaticBackup=adminSandbox?null:installAutomaticBackup({storage,getState:()=>state,getCaptures:availableCaptures});
const backup=installBackup({dialog:$('#backup-dialog'),storage,getState:()=>state,getCaptures:availableCaptures,notify:toast,automaticBackup,sandbox:adminSandbox});
const compass=installFocusCompass({getState:()=>state,save:()=>{const ok=persist();if(ok)syncSound();return ok;},notify:toast,
  onGoalChanged:()=>{if(activePanel==='progress')refreshPanel();},
  beforeTimerChange:checkCompletion,afterTimerChange:()=>{render();wake();if(activePanel==='pagoda')refreshPanel();$('#toggle-timer').focus({preventScroll:true});}});
const commandPalette=installCommandPalette({dialog:$('#command-palette'),getEntries:commandEntries});
const openPostcardViewpoints=installPostcardViewpoints({
  getViews:()=>state.postcardViewpoints,
  save:views=>{const previous=state.postcardViewpoints;state.postcardViewpoints=views;if(persist())return true;state.postcardViewpoints=previous;return false;},
  getScene:()=>({design:sceneGardenDesign(),appearance:effectiveAppearance,through:snapshotThrough}),
  paint:(container,view,through)=>mountGardenPreview(container,view.appearance,{design:view.design,through,history:state.gardenGrowth,courses:gardenCourses(state.gardenGrowth,state.projects)}),
  download:savePostcard,dayKey
});
$('#stuck-now').onclick=$('#focus-stuck').onclick=installOfficeHours({getState:()=>state,focusedTask,notify:toast,switchTask:()=>currentTaskButton.click(),
  startRetry:startOfficeRetry,
  save:questions=>{const previous=state.studyQuestions;state.studyQuestions=questions;if(persist())return true;state.studyQuestions=previous;return false;}});
const renderReference=installReferenceEditor({button:$('#pin-focus-reference'),card:$('#focus-reference'),getTask:focusedTask,
  notify:message=>{toast(message);announce(message);},
  save:(id,reference)=>{
    const task=state.tasks.find(item=>item.id===id);if(!task)return false;
    const previous=task.reference;task.reference=reference;
    if(!persist()){task.reference=previous;return false;}
    render();return true;
  }});
installMiniTimer({launch:$('#open-mini-timer'),getState:()=>state,taskTitle:()=>focusedTask()?.text,reference:()=>focusedTask()?.reference,
  savePauseNote,
  toggle:()=>timerButton.click(),extend:()=>action(()=>extendTimer(state,300000)),
  capture:text=>{saveCapture(storage,text,currentCaptureContext());renderCaptures();},notify:toast});
const helpGuide=installHelp({dialog:$('#help-guide'),onAction:runHelpAction,canNavigate:()=>!activePanel&&!document.querySelector('dialog[open]:not(#help-guide)')});
const openVersionHistory=installVersionHistory($('#version-history'));
$('#open-help').onclick=()=>helpGuide.open();
document.querySelectorAll('[data-command-launch]').forEach(button=>button.onclick=()=>commandPalette.open());
applyIcons();

function saveStickyNotes(notes){
  const previous=state.stickyNotes, scratch=state.notes;
  state.stickyNotes=notes;
  state.notes=notes.find(note=>note.id===scratchNoteId)?.body||'';
  if(persist())return true;
  state.stickyNotes=previous;
  state.notes=scratch;
  return false;
}
function saveScratchpad(body){
  const notes=state.stickyNotes;
  const scratch=notes.find(note=>note.id===scratchNoteId);
  if(!scratch&&!body)return true;
  const next=scratch?notes.map(note=>note===scratch?{...note,body}:note):[...notes,{...stickyBoard.newNote(body,'Quick Notes'),id:scratchNoteId}];
  if(!saveStickyNotes(next))return false;
  stickyBoard.render();
  return true;
}

function setTaskSidebar(open){
  open=open&&!state.focusMode;
  taskSidebar.hidden=!open;
  const toggle=$('[data-panel="tasks"]');
  toggle.setAttribute('aria-expanded',String(open));
}
const taskToggle=$('[data-panel="tasks"]');
taskToggle.removeAttribute('aria-haspopup');
taskToggle.setAttribute('aria-controls','task-sidebar');
const calendarToggle=$('#workspace-tabs [data-workspace="calendar"]');
const workspaceNav=$('#workspace-tabs'),workspaceMore=$('#workspace-more'),workspaceLibrary=$('#workspace-library');
const compactNavigation=matchMedia('(max-width:640px)');
function setWorkspaceMenu(open,restore=false){
  workspaceMore.setAttribute('aria-expanded',String(open));
  if(restore)workspaceMore.focus({preventScroll:true});
  if(open)(workspaceLibrary.querySelector('[aria-pressed="true"]')||workspaceLibrary.querySelector('button')).focus({preventScroll:true});
}
function workspaceMenuOpen(){return workspaceMore.getAttribute('aria-expanded')==='true';}
workspaceMore.onclick=()=>{
  const open=workspaceMenuOpen();
  setWorkspaceMenu(!open,open);
};
workspaceNav.addEventListener('focusout',event=>{
  if(workspaceMenuOpen()&&event.relatedTarget&&!workspaceNav.contains(event.relatedTarget))setWorkspaceMenu(false);
});
compactNavigation.addEventListener('change',()=>{
  const focused=document.activeElement;
  setWorkspaceMenu(false);
  if(compactNavigation.matches&&workspaceLibrary.contains(focused))workspaceMore.focus({preventScroll:true});
  if(!compactNavigation.matches&&focused===workspaceMore)workspaceButton(workspace).focus({preventScroll:true});
});
function gardenToolAnchor(id){return $('#objects [data-panel="'+id+'"]')||(id==='pagoda'?$('#garden-settings'):$('#garden-tools'));}
const gardenSettingsSections=[['pagoda','Timer'],['appearance','Appearance'],['music','Music & video'],['backup','Backups']];
const gardenToolGroups=[
  ['Settings',[
    ['pagoda','focus','Timer settings','Durations, routines, warnings','pomodoro breaks chimes notifications'],
    ['appearance','appearance','Appearance','Lighting, seasons, weather','theme night day motion palette'],
    ['music','music','Music & video','Spotify, YouTube, ambient sound','audio mute volume playlists'],
    ['backup','external','Backup & restore','Protect or transfer your data','export import snapshot recovery']
  ]],
  ['Garden',[
    ['garden-studio','sliders','Edit landscape','Arrange scenery and save layouts','studio props mountains'],
    ['garden-history','sprout','Garden Field Guide','Landmarks, constellations, postcards','stars trees lanterns history']
  ]],
  ['Notes & support',[
    ['notes','note','Quick notes','Capture a thought or open the inbox','sticky distraction scratchpad'],
    ['help','help','Help guide','How-to guides and shortcuts','instructions documentation version history']
  ]]
];
let gardenToolQuery='',lastGardenTool='';

function gardenToolsMarkup(){
  return header('GARDEN','Tools')+`<label class="garden-tools-search">${icon('search')}
    <span class="sr-only">Find a Garden tool</span><input id="garden-tool-search" type="search" placeholder="Find a tool" autocomplete="off" value="${escape(gardenToolQuery)}"></label>
    <div class="garden-tool-groups">${gardenToolGroups.map(([title,tools])=>`<section class="garden-tool-group">
      <h3>${title}</h3><div class="garden-tools-list">${tools.map(([id,symbol,label,description,keywords])=>`
        <button type="button" data-home-tool="${id}" data-tool-keywords="${keywords}" aria-haspopup="dialog">
          <span class="garden-tool-icon">${icon(symbol)}</span><span><strong>${label}</strong><small>${description}</small></span>
        </button>`).join('')}</div></section>`).join('')}</div>
    <p class="garden-tools-empty" role="status" hidden>No tools match that search.</p>`;
}
function filterGardenTools(panel){
  const terms=gardenToolQuery.trim().toLowerCase().split(/\s+/);
  let matches=false;
  for(const group of panel.querySelectorAll('.garden-tool-group')){
    for(const button of group.querySelectorAll('[data-home-tool]')){
      const text=(group.querySelector('h3').textContent+' '+button.textContent+' '+button.dataset.toolKeywords).toLowerCase();
      button.hidden=!terms.every(term=>text.includes(term));
    }
    group.hidden=!group.querySelector('[data-home-tool]:not([hidden])');
    matches||=!group.hidden;
  }
  panel.querySelector('.garden-tools-empty').hidden=matches;
}
function addGardenToolsReturn(panel,id,anchor){
  panel.querySelector('[data-return-garden-tools]')?.remove();
  if(anchor?.id!=='garden-tools'||id==='garden-tools')return;
  panel.querySelector('.panel-header>div')?.insertAdjacentHTML('afterbegin',
    `<button type="button" class="garden-tools-return" data-return-garden-tools>${icon('left')}<span>All tools</span></button>`);
}
function syncSettingsNavigation(panel,id){
  panel.querySelector('.garden-settings-nav')?.remove();
  const isSettings=gardenSettingsSections.some(([section])=>section===id);
  panel.classList.toggle('garden-settings-panel',isSettings);
  if(!isSettings)return;
  panel.querySelector('.panel-header').insertAdjacentHTML('afterend',`<nav class="garden-settings-nav" aria-label="Garden settings">
    ${gardenSettingsSections.map(([section,label])=>`<button type="button" id="garden-setting-${id}-${section}" data-garden-setting="${section}" ${section===id?'aria-current="page"':''} ${section==='backup'?'aria-haspopup="dialog"':''}>${label}</button>`).join('')}</nav>`);
}
function inSchedule(){return workspace==='planner'||workspace==='calendar';}
let sidebarBeforeFocus=desktopTasks.matches;
setTaskSidebar(sidebarBeforeFocus);
desktopTasks.addEventListener('change',()=>setTaskSidebar(workspace==='focus'&&desktopTasks.matches));

function showWorkspace(next){
  workspace=next;
  app.dataset.workspace=next;
  $('.sky').hidden=next!=='focus';
  if(next!=='focus'){$('#focus-handoff').hidden=true;$('#focus-retry').hidden=true;}
  $('#crochet-workspace').hidden=next!=='crochet';
  $('#journal-workspace').hidden=next!=='journal';
  $('#notes-workspace').hidden=next!=='notes';
  if(next!=='reading')reading.close();
  $('#reading-workspace').hidden=next!=='reading';
  if(next==='notes')stickyBoard.render();
  if(next==='reading')reading.render();
  focusNotes.update(next==='focus'?focusedTask():null,next==='focus');
  $('#objects').hidden=next!=='focus';
  $('#garden-tools').hidden=next!=='focus';
  $('#garden-settings').hidden=next!=='focus';
  taskToggle.hidden=next!=='focus';
  $('#penguin').hidden=next!=='focus';
  workspaceNav.querySelectorAll('button[data-workspace]').forEach(button=>{
    button.setAttribute('aria-pressed',String(button.dataset.workspace===next));
  });
  const current=workspaceLibrary.querySelector('[aria-pressed="true"] .workspace-label');
  workspaceMore.classList.toggle('workspace-more-current',Boolean(current));
  workspaceMore.setAttribute('aria-label',current?'More workspaces · Current: '+current.textContent:'More workspaces');
  setWorkspaceMenu(false);
}
$('#workspace-tabs').addEventListener('click',event=>{
  const button=event.target.closest('button[data-workspace]');
  if(!button)return;
  const inMore=compactNavigation.matches&&workspaceLibrary.contains(button);
  if(button.dataset.workspace===workspace){if(inMore)setWorkspaceMenu(false,true);return;}
  if(closePanel(false)===false)return;
  closeTaskMenu(false);
  const next=button.dataset.workspace;
  if(next==='planner'||next==='calendar'){openSchedule(next,button);return;}
  if(inSchedule()){
    closeCalendar();
    if(next==='focus'){button.focus({preventScroll:true});return;}
  }
  showWorkspace(next);
  setTaskSidebar(next==='focus'&&desktopTasks.matches);
  (inMore?workspaceMore:button).focus({preventScroll:true});
});

function workspaceButton(name){return $(`#workspace-tabs [data-workspace="${name}"]`);}
function visitWorkspace(name){
  if(state.focusMode&&name!=='focus')toggleFocusMode();
  const button=workspaceButton(name);
  button.click();
  return button;
}
function relatedNoteTargets(){
  return [
    ...readingShelf(state.dailyRituals,state.readingNotes,state.finishedBooks,state.libraryBooks).map(book=>({kind:'book',id:book.id,title:book.author?`${book.title} · ${book.author}`:book.title})),
    ...state.projects.map(project=>({kind:'project',id:project.id,title:project.name})),
    ...loadJournal(storage).map(entry=>({kind:'journal',id:entry.id,title:`${entry.title} · ${entry.date}`}))
  ];
}
function linkedStickyNotes(kind,id){
  const notes=state.stickyNotes.filter(note=>noteRelatedItems(note).some(item=>item.kind===kind&&item.id===id));
  if(!notes.length)return '';
  return `<div class="related-sticky-notes" role="group" aria-label="Linked sticky notes">
    <strong>Sticky notes</strong>${notes.map(note=>`<button type="button" data-open-sticky="${escape(note.id)}">${escape(note.title||note.body.trim().slice(0,60)||'Untitled note')}</button>`).join('')}</div>`;
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-open-sticky]');
  if(!button)return;
  const id=button.dataset.openSticky;
  if(!state.stickyNotes.some(note=>note.id===id))return;
  button.closest('dialog[open]')?.close();
  visitWorkspace('notes');stickyBoard.focusNote(id);
});
function commandEntries(){
  const action=(title,detail,search,run)=>({kind:'Action',title,detail,search,run});
  const tasks=state.tasks.map(task=>({
    kind:'Task',title:task.text,detail:state.projects.find(project=>project.id===task.projectId)?.name||'Inbox',
    search:[task.description,...(task.labels||[])].join(' '),
    run:()=>openTaskEditor(task.id,visitWorkspace('planner'))
  }));
  const notes=state.stickyNotes.map(note=>({
    kind:'Note',title:note.title||note.body.trim().split(/\r?\n/)[0]?.slice(0,85)||'Untitled note',
    detail:note.body.trim().replace(/\s+/g,' ').slice(0,100),search:note.body,
    run:()=>{visitWorkspace('notes');stickyBoard.focusNote(note.id);}
  }));
  const books=readingShelf(state.dailyRituals,state.readingNotes,state.finishedBooks,state.libraryBooks).map(book=>({
    kind:'Book',title:book.title,detail:book.author,search:book.chapters.join(' '),
    run:()=>{visitWorkspace('reading');reading.openBook(book.id);}
  }));
  const entries=loadJournal(storage).map(entry=>({
    kind:'Journal',title:entry.title,detail:[entry.date,entry.mood].filter(Boolean).join(' · '),search:entry.body,
    run:()=>{visitWorkspace('journal');journal.openEntry(entry.id);}
  }));
  return [
    action('Help','Browse searchable instructions and keyboard shortcuts','guide how to tutorial features',()=>helpGuide.open()),
    action('Admin sandbox','Open an isolated test workspace','admin sandbox test demo sample data',()=>runHelpAction('admin-sandbox')),
    action('Version history','See what changed in each release','versions updates changelog release notes',()=>runHelpAction('versions')),
    action('Garden Studio','Edit the scene, move landmarks, and save a Garden layout','camera scenery layout personalize postcard',()=>runHelpAction('garden-studio')),
    action('Garden Field Guide','Browse landmarks, historical views, and course constellations','garden history semester stars trees lanterns cairns',()=>runHelpAction('garden-history')),
    action('Evening lights','Open the shutdown checklist by the lake','night sunset tomorrow shutdown',()=>runHelpAction('evening-lights')),
    action('Export Garden postcard','Download a PNG of your Garden','image caption semester',()=>runHelpAction('garden-postcard')),
    action('End-of-day recap','Review today’s work and tomorrow’s plans','daily recap finished moved tomorrow',()=>runHelpAction('day-recap')),
    action('Focus session replay','See actual focus time in Calendar','actual timeline pause switch',()=>runHelpAction('focus-replay')),
    action('Fit a task today','Compare which calendar blocks could move','tradeoffs trade-offs schedule today',()=>runHelpAction('tradeoffs')),
    action('Waiting for','Review tasks on hold and due follow-ups','waiting blocked response follow-up',()=>runHelpAction('waiting')),
    action('Project health','Find missing next actions, prerequisites, and deadline risks','blocked stalled capacity',()=>runHelpAction('health')),
    action('Mistake notebook','Review corrected reasoning and retry mistakes','practice errors exam topics',()=>runHelpAction('mistakes')),
    action('Task bundles','Arrange tasks and work through them in order','ordered batch routine sequence',()=>runHelpAction('bundles')),
    action('Journal patterns','Browse journal moods, tags, themes, and weekly reflections','weekly journal reflection patterns',()=>runHelpAction('journal-patterns')),
    action('Note inbox','File, link, or archive captured thoughts','capture ideas notes archive',()=>runHelpAction('capture-inbox')),
    action('Plan to deadline','Suggest focus blocks before a task is due','backward schedule estimate capacity',()=>{
      visitWorkspace('planner');$('[data-plan-deadline]')?.click();
    }),
    action('Build my week','Draft seven days of work around existing commitments','weekly plan deadlines available hours',()=>{
      visitWorkspace('planner');$('[data-build-week]')?.click();
    }),
    action('Start timer','Start or resume the current countdown','focus rest pomodoro',()=>{
      visitWorkspace('focus');closePanel(false);closeTaskMenu(false);
      if(!durationForm.hidden)finishEdit(timerButton);
      if(state.timer.status!=='running')timerButton.click();
      timerButton.focus({preventScroll:true});
    }),
    action('Replan today','Find new times for missed calendar blocks','schedule calendar',()=>{
      runHelpAction('replan');
    }),
    action('Plan tomorrow','Choose your first task and reserve time','next day schedule',()=>{
      visitWorkspace('planner');$('[data-plan-tomorrow]')?.click();
    }),
    action('Add task','Create a task in Planner','new create inbox',()=>openTaskEditor(null,visitWorkspace('planner'))),
    ...tasks,...notes,...books,...entries
  ];
}

function runHelpAction(action){
  if(action==='admin-sandbox'){
    openPanel('admin-sandbox',adminSandbox?$('[data-open-admin]'):$('#open-help'));return;
  }
  if(action==='garden-studio'){openGardenStudio();return;}
  if(action==='garden-postcard'){openGardenPostcard();return;}
  if(action==='evening-lights'){openEveningLights();return;}
  if(closePanel(false)===false)return;
  closeTaskMenu(false);
  const workspaces=['focus','planner','calendar','crochet','journal','notes','reading'];
  if(workspaces.includes(action)){visitWorkspace(action);return;}
  if(action==='search'){commandPalette.open();return;}
  if(action==='backup'){backup.open();return;}
  if(action==='focus-replay'){
    visitWorkspace('calendar');$('[data-calendar-activity="actual"]').click();return;
  }
  if(action==='versions'){openVersionHistory();return;}
  if(action==='capture-inbox'){
    visitWorkspace('notes');openCaptureInbox();return;
  }
  const views={filters:'filters',review:'review',workload:'workload',reporting:'reporting',health:'health',bundles:'bundles',waiting:'waiting'};
  if(views[action]){
    visitWorkspace('planner');
    calendarPanel.querySelector(`[data-planner-view="${views[action]}"]`)?.click();
    return;
  }
  if(action==='replan'){
    visitWorkspace('calendar');$('[data-calendar-activity="planned"]').click();$('[data-replan-today]')?.click();return;
  }
  if(action==='tradeoffs'){
    visitWorkspace('calendar');$('[data-calendar-activity="planned"]').click();$('[data-open-tradeoffs]')?.click();return;
  }
  if(action==='mistakes'){
    visitWorkspace('planner');$('[data-open-mistakes]')?.click();return;
  }
  if(action==='journal-anniversaries'){visitWorkspace('journal');journal.openAnniversaries();return;}
  if(action==='journal-patterns'){visitWorkspace('journal');journal.openPatterns();return;}
  if(action==='tomorrow'){
    visitWorkspace('planner');$('[data-plan-tomorrow]')?.click();return;
  }
  if(action==='deadline'){
    visitWorkspace('planner');$('[data-plan-deadline]')?.click();return;
  }
  if(action==='build-week'){
    visitWorkspace('planner');$('[data-build-week]')?.click();return;
  }
  if(action==='calendar-import'){
    visitWorkspace('calendar');$('[data-calendar-activity="planned"]').click();$('[data-manage="calendar-import"]')?.click();return;
  }
  if(action==='csv-import'){
    visitWorkspace('planner');$('[data-manage="import"]')?.click();return;
  }
  const panels={settings:'pagoda',appearance:'appearance',music:'music',capture:'capture',progress:'progress','garden-history':'garden-history','day-recap':'day-recap'};
  if(panels[action]){
    if(state.focusMode)toggleFocusMode();
    visitWorkspace('focus');
    const panel=panels[action];
    const anchor=panel==='capture'?'notes':['garden-history','day-recap'].includes(panel)?'progress':panel;
    openPanel(panel,gardenToolAnchor(anchor));
  }
}

function gardenFocusQueue(date=new Date(),tasks=gardenTasks(),tasksById=taskIndex()){
  const day=dayKey(date);
  const first=state.tomorrowPin?.day===day?state.tomorrowPin.taskId:null;
  const pins=state.focusPins?.day===day&&state.focusPins.ids.length?state.focusPins.ids:state.tomorrowPlan?.day===day?[state.tomorrowPlan.taskId]:[];
  if(first)return focusTaskQueue(tasks,date,[...new Set([first,...pins])],tasksById);
  return focusTaskQueue(tasks,date,pins,tasksById);
}
function pinnedFirstTask(date=new Date()){
  const day=dayKey(date),pin=state.tomorrowPin?.day===day?state.tomorrowPin:state.tomorrowPlan?.day===day?state.tomorrowPlan:null;
  return pin&&gardenFocusQueue(date).find(task=>task.id===pin.taskId);
}
function taskBundleStatus(bundle,date=new Date(),queue=gardenFocusQueue(date)){
  const run=state.activeBundle?.id===bundle.id?state.activeBundle:null;
  const tasks=new Map(gardenTasks().map(task=>[task.id,task]));
  return bundleStatusFor(bundle,date,tasks,queue,run);
}
function bundleStatusFor(bundle,date,tasks,queue,run){
  const ready=new Set(queue.map(task=>task.id));
  const startedOn=run?.startedOn||bundle.startedOn||dayKey(date);
  const progress=bundleProgress(bundle,tasks,ready,startedOn);
  const fresh=progress.next?null:bundleProgress(bundle,tasks,ready,dayKey(date));
  return {...progress,bundle,run,restart:Boolean(fresh?.next?.ready)};
}
function activeBundleStatus(date,queue){
  const bundle=state.activeBundle&&state.taskBundles.find(item=>item.id===state.activeBundle.id);
  return bundle?taskBundleStatus(bundle,date,queue):null;
}
function editBundle(id){
  const bundle=state.taskBundles.find(item=>item.id===id);
  bundleEditor.open(bundle,()=>bundle&&$(`[data-bundle-edit="${CSS.escape(bundle.id)}"]`)||$('[data-bundle-new]'));
}
function saveBundle(item,id=item?.id){
  if(item?.checkpoint?.taskId&&!item.taskIds.includes(item.checkpoint.taskId))delete item.checkpoint;
  const {taskBundles,activeBundle}=state;
  const exists=taskBundles.some(bundle=>bundle.id===id);
  state.taskBundles=item?(exists?taskBundles.map(bundle=>bundle.id===id?item:bundle):[...taskBundles,item]):taskBundles.filter(bundle=>bundle.id!==id);
  if(!item&&activeBundle?.id===id)state.activeBundle=null;
  if(!persist()){Object.assign(state,{taskBundles,activeBundle});return false;}
  refreshTasks();confirmChange(item?'Task bundle saved.':'Task bundle deleted.');return true;
}
function startBundle(id){
  checkCompletion();
  const bundle=state.taskBundles.find(item=>item.id===id);
  if(!bundle)return;
  if(projectTimerLocked()){confirmChange('Finish or reset the current focus timer before starting a bundle.');return;}
  const status=taskBundleStatus(bundle);
  if(!status.next&&!status.restart){confirmChange('Every task in this bundle is complete.');return;}
  const {taskBundles,activeBundle,activeTask,activeTaskDay}=state;
  const startedOn=status.restart?dayKey():status.run?.startedOn||bundle.startedOn||dayKey();
  const leaving=activeBundleStatus();
  state.taskBundles=taskBundles.map(item=>item===bundle?{...item,startedOn,...(status.restart?{checkpoint:null}:{})}:
    item.id===leaving?.bundle.id?{...item,checkpoint:{taskId:leaving.next?.id||null,at:Date.now()}}:item);
  state.activeBundle={id,startedOn,paused:false};
  state.activeTask=null;state.activeTaskDay=null;
  if(!persist()){Object.assign(state,{taskBundles,activeBundle,activeTask,activeTaskDay});return;}
  closePanel(false);visitWorkspace('focus');refreshTasks();
  const next=activeBundleStatus()?.next;
  if(next?.ready){timerButton.focus({preventScroll:true});announce(`Bundle ready. Next: ${next.task.text}.`);}
  else openPanel('focus-bundle',$('#focus-bundle'));
}
function stopBundle(anchor){
  const previous=state.activeBundle;
  if(!previous||previous.paused)return;
  checkCompletion();
  const {activeTask,activeTaskDay,taskBundles,timer}=state,historyLength=state.history.length;
  const status=activeBundleStatus();
  const current=focusedTask();
  state.taskBundles=taskBundles.map(item=>item.id===previous.id?{...item,checkpoint:{taskId:status?.next?.id||null,at:Date.now()}}:item);
  if(timer.id&&timer.mode==='focus'&&current&&current.id===status?.next?.id){
    record(state,'completed',Date.now(),{early:true});reset(state,'focus');
  }
  state.activeBundle={...previous,paused:true};
  if(current){state.activeTask=current.id;state.activeTaskDay=dayKey();}
  if(!persist()){Object.assign(state,{activeBundle:previous,activeTask,activeTaskDay,taskBundles,timer});state.history.length=historyLength;return;}
  const fromGarden=anchor.closest('#panel-root');
  if(fromGarden)closePanel(false);
  refreshTasks();
  (fromGarden?$('#focus-bundle'):$(`[data-bundle-start="${CSS.escape(previous.id)}"]`))?.focus({preventScroll:true});
  confirmChange('Bundle checkpoint saved. Resume it to continue in order.');
}
function pauseBundleForTask(taskId){
  const status=activeBundleStatus();
  if(status?.next&&!status.run.paused&&status.next.id!==taskId)state.activeBundle={...status.run,paused:true};
}
function taskIndex(){return new Map(state.tasks.map(task=>[task.id,task]));}
function waitingOn(task){return task?.prerequisiteIds?.length?unfinishedPrerequisites(task,taskIndex()):[];}
function focusedTask(date=new Date()){
  if(state.timer.mistakeId)return state.tasks.find(task=>task.id===state.timer.taskSnapshot?.id);
  if(state.timer.block)return state.tasks.find(task=>task.id===state.timer.block.taskId&&!task.waitingFor);
  const plan=state.timer.taskPlan;
  const planned=plan&&plan.stage!=='final'&&state.tasks.find(task=>task.id===plan.taskId&&!task.waitingFor&&taskStatus(task,date)!=='done');
  if(planned)return planned;
  const queue=gardenFocusQueue(date);
  const sessionId=state.timer.mode==='focus'?state.timer.replay?.at(-1)?.taskId||state.timer.taskSnapshot?.id:null;
  const day=dayKey(date);
  const bundle=activeBundleStatus(date,queue);
  if(bundle?.next&&!bundle.run.paused)return bundle.next.ready||bundle.next.id===sessionId&&!bundle.next.task?.waitingFor?bundle.next.task:undefined;
  const snoozedSession=state.tasks.find(task=>task.id===sessionId&&!task.waitingFor&&task.snoozedUntil>day);
  if(snoozedSession)return snoozedSession;
  const pinToday=state.tomorrowPin?.day===day||state.tomorrowPlan?.day===day;
  const selectedId=(pinToday&&state.activeTaskDay!==day?null:state.activeTask)||sessionId;
  return queue.find(task=>task.id===selectedId)||queue[0];
}
function taskFocusMinutes(task,now=Date.now()){
  const schedules=calendarBlocks([task],new Date(now)).filter(openFocusBlock)
    .map(block=>calendarTaskBlock(task,block.blockId,block.occurrence)).filter(Boolean);
  const upcoming=schedules.find(slot=>slot.start<=now&&slot.end>now)||schedules.find(slot=>slot.start>now)||schedules.at(-1);
  return upcoming?.minutes||task.estimate||[...(task.blocks||[])].sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time))[0]?.minutes;
}
function selectTaskForTimer(task,minutes){
  const prior=state.timer,previous=focusedTask();
  state.activeTask=task.id;state.activeTaskDay=dayKey();
  pauseBundleForTask(task.id);
  if(prior.block||prior.sequence||prior.mistakeId||
    minutes===undefined&&prior.taskPlan?.taskId===task.id&&prior.taskPlan.stage!=='final'||
    prior.id&&prior.mode==='focus'&&previous?.id===task.id)return;
  const wasRunning=prior.status==='running'&&prior.mode==='focus';
  if(prior.id)record(state,'skipped');
  if(!startTaskTiming(state,task.id,minutes??taskFocusMinutes(task))&&(prior.id||prior.mode!=='focus'||prior.taskPlan))reset(state,'focus');
  if(wasRunning)toggleFocusTimer(task);
}
function saveTaskSelection(task,minutes){
  checkCompletion();
  const {activeTask,activeTaskDay,activeBundle,timer}=state,length=state.history.length;
  selectTaskForTimer(task,minutes);
  if(persist())return true;
  Object.assign(state,{activeTask,activeTaskDay,activeBundle,timer});state.history.length=length;
  return false;
}
function gardenTasks(){return state.tasks.filter(task=>!state.projects.some(project=>project.id===task.projectId&&project.archived));}

function projectTimerLocked(){return Boolean(state.timer.block||state.timer.mode==='focus'&&state.timer.id);}
function nextProjectTask(projectId){return gardenFocusQueue().find(task=>task.projectId===projectId);}
function resumeProject(projectId){
  checkCompletion();
  if(projectTimerLocked()){confirmChange('Finish or reset the current focus timer before switching projects.');return;}
  const task=nextProjectTask(projectId);
  if(!task){confirmChange('This project has no task ready in the focus queue.');return;}
  if(!saveTaskSelection(task))return;
  visitWorkspace('focus');
  refreshTasks();
  const context=$('#focus-project-context');
  openPanel('project-context',context);
  announce(`Current task: ${task.text}`);
}

function renderNextCommitment(clock){
  const label=$('#next-calendar-commitment');
  if(workspace!=='focus'){label.hidden=true;return;}
  const minute=Math.floor(+clock/60000),block=state.timer.block;
  if(commitmentPreview?.state!==state||commitmentPreview.minute!==minute||
    commitmentPreview.block!==block||commitmentPreview.next?.start<=clock){
    const events=visibleCalendarEvents(state.calendarEvents,state.calendars,state.hiddenCalendars);
    commitmentPreview={state,minute,block,next:nextCalendarCommitment(state.tasks,events,clock,block)};
  }
  const {next}=commitmentPreview;
  label.hidden=!next;
  if(!next)return;
  const start=new Date(next.start),minutes=Math.ceil((start-clock)/60000);
  const time=clockFormat.format(start),when=dayKey(start)===dayKey(clock)?time:`${weekdayFormat.format(start)} ${time}`;
  const text=minutes<=60?`${next.title} in ${minutes} min`:`${next.title} · ${when}`;
  if(label.textContent!==text)label.textContent=text;
  label.title=`${next.title} · ${when}`;
}
function render(){
  syncFocusMode();
  if(app.dataset.calendarTheme!==state.calendarTheme){app.dataset.calendarTheme=state.calendarTheme;$('#calendar-theme').value=state.calendarTheme;}
  const clock=new Date();
  if(snapshotLayoutId&&!viewedGardenLayout()){
    snapshotLayoutId='';snapshotThrough='';updateGardenSnapshotLabel();renderedGardenGrowth=null;
  }
  const viewed=viewedGardenLayout(),activity=activityGardenLayout(),design=(viewed||activity)?.design||state.gardenDesign;
  if(previousActivityAppearance!==activity?.appearance){
    previousActivityAppearance=activity?.appearance;activityWeatherSince=clock.getTime();
  }
  app.classList.toggle('evening-layout',activePanel==='evening-lights'&&Boolean(activity)&&!viewed);
  effectiveAppearance=viewed?loadAppearance({...viewed.appearance,lighting:viewed.appearance.lighting==='session'?'day':viewed.appearance.lighting,weatherSince:clock.getTime()}):
    activity?loadAppearance({...activity.appearance,weatherSince:activityWeatherSince}):
    scheduledAppearance(state.appearance,state.gardenSchedule,clock);
  if(!viewed&&!activity&&!state.gardenSchedule.enabled&&state.appearance.lighting==='day')effectiveAppearance={...effectiveAppearance,lighting:'day'};
  if(paintedGardenDesign!==design){
    applyGardenDesign($('#landscape .world'),design);
    paintedGardenDesign=design;
  }
  app.dataset.lighting=effectiveAppearance.lighting;
  if(app.dataset.palette!==effectiveAppearance.palette){
    app.dataset.palette=effectiveAppearance.palette;
    $('#landscape').dataset.palette=effectiveAppearance.palette;
  }
  const {season,motion}=effectiveAppearance,weather=gardenWeather(effectiveAppearance,clock.getTime());
  if(app.dataset.motion!==motion)app.dataset.motion=motion;
  if(app.dataset.weather!==weather||app.dataset.season!==season){
    app.dataset.season=season;app.dataset.weather=weather;
    applySceneryAppearance($('#landscape'),effectiveAppearance,weather);
  }
  const weatherCurrent=$('#garden-weather-current');
  if(weatherCurrent){
    const label=weatherBySeason[effectiveAppearance.season][weather];
    if(weatherCurrent.textContent!==label)weatherCurrent.textContent=label;
  }
  const activePreset=$('#garden-active-preset');
  if(activePreset){
    const label=!viewed&&activity?`Activity layout · ${activity.name}`:effectiveAppearance.time?`Active since ${timeLabel(timeMinutes(effectiveAppearance.time))} · ${seasonOptions[effectiveAppearance.season].name} · ${lightingOptions[effectiveAppearance.lighting]}`:'Manual appearance';
    if(activePreset.textContent!==label)activePreset.textContent=label;
  }
  const t=state.timer, overtime=t.status==='overtime';
  const ms=remaining(state),seconds=overtime?Math.floor(overtimeElapsed(t,clock.getTime())/1000):Math.ceil(ms/1000);
  const mins=Math.floor(seconds/60),secs=seconds%60;
  $('#countdown').innerHTML=`${overtime?'+':''}${String(mins).padStart(2,'0')}<span>:</span>${String(secs).padStart(2,'0')}`;
  $('#countdown').setAttribute('aria-label',overtime?`${mins} minutes ${secs} seconds of overtime`:`${mins} minutes ${secs} seconds of ${t.mode==='focus'?'focus':'rest'} remaining`);
  const [hour,period]=clock.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}).split(/\s+/);
  $('#wall-clock').innerHTML=hour+'<small>'+period+'</small>';

  $('#wall-clock').dateTime=clock.toISOString();
  renderNextCommitment(clock);
  if(!$('#duration-form').hidden)renderDurationFinish(clock);
  if(planner.checkReminders(clock))persist();
  const task=focusedTask(clock);
  const bundle=activeBundleStatus(clock),bundleButton=$('#focus-bundle');
  bundleButton.hidden=!bundle;
  const bundleText=bundle?`${bundle.bundle.name} · ${bundle.done}/${bundle.steps.length}${bundle.run.paused?' · Paused':!bundle.next?' · Complete':!bundle.next.ready?' · Waiting':''}`:'';
  if(renderedBundle!==bundleText){bundleButton.textContent=bundleText;renderedBundle=bundleText;}
  focusNotes.update(task,workspace==='focus');
  renderReference(task,workspace==='focus');
  const wrapPreview=$('#focus-wrap-preview');
  const reserve=workspace==='focus'&&t.status==='idle'?focusWrapUpDuration(state):0;
  const wrapPreviewText=reserve?`Last ${reserve%60000===0?`${reserve/60000} min`:formatDuration(reserve)} for wrap-up`:'';
  wrapPreview.hidden=!reserve;
  if(wrapPreview.textContent!==wrapPreviewText)wrapPreview.textContent=wrapPreviewText;
  const wrap=workspace==='focus'&&focusWrapUp(state,clock.getTime());
  $('#focus-wrap-up').hidden=!wrap;
  $('#wrap-save-next').hidden=!task;
  $('#wrap-save-next').dataset.resumeId=task?.id||'';
  const first=workspace==='focus'&&pinnedFirstTask(clock);
  const firstPin=$('#first-task-pin');
  firstPin.hidden=!first;
  if(first){
    const name=firstPin.querySelector('strong');
    if(name.textContent!==first.text)name.textContent=first.text;
    const choose=firstPin.querySelector('button');
    choose.disabled=Boolean(t.id||t.block||t.sequence||task?.id===first.id);
    const label=task?.id===first.id?'Current task':'Choose';
    if(choose.textContent!==label)choose.textContent=label;
  }
  const pause=currentFocusPause(t);
  $('#focus-pause-note').hidden=workspace!=='focus'||!pause;
  const pauseLabel=pause?.event.note?'Edit pause note':'Add pause note';
  if($('#focus-pause-note').textContent!==pauseLabel)$('#focus-pause-note').textContent=pauseLabel;
  if(activePanel==='fit-before-class')updateClassFitResults();
  const bundleWaiting=bundle?.next&&!bundle.run.paused&&!bundle.next.ready;
  const taskName=task?.text||(t.mistakeId?'Mistake retry':'')||(bundleWaiting?'Bundle waiting':'Choose a task');
  if(currentTaskName.textContent!==taskName)currentTaskName.textContent=taskName;
  currentTaskButton.title=task?task.text:'Choose a task';
  finishTaskButton.hidden=!task||t.mode!=='focus'||Boolean(t.mistakeId);
  currentTaskButton.disabled=Boolean(t.mistakeId);
  renderSessionExtras(t);
  $('#focus-stuck').hidden=t.mode!=='focus';
  $('#stuck-now').hidden=t.mode!=='focus'||!t.id;
  compass.render(clock.getTime());
  const list=$('#focus-subtasks'),subtasks=task?.subtasks||[];
  list.hidden=!subtasks.length||Boolean(t.mistakeId);
  const checklist=`Subtasks · ${subtasks.filter(item=>item.done).length}/${subtasks.length}`;
  if(list.textContent!==checklist)list.textContent=checklist;
  const extra=$('#focus-overtime');
  extra.hidden=t.mode!=='focus'||Boolean(t.block||t.sequence||t.mistakeId)||overtime;
  extra.setAttribute('aria-pressed',String(state.focusOvertime));
  const recent=t.mode==='break'?state.history.findLast(item=>item.mode==='focus'&&item.outcome==='completed'):null;
  const previousFocus=t.mode==='break'?(resumeTaskId||recent?.replay?.at(-1)?.taskId||recent?.taskId):null;
  const resume=(previousFocus&&state.tasks.find(item=>item.id===previousFocus))||task;
  const resumeButton=$('#resume-task');
  resumeButton.hidden=!resume;
  const nextStep=hasHandoff(resume)?'Edit handoff':'Leave a handoff';
  if(resumeButton.textContent!==nextStep)resumeButton.textContent=nextStep;
  resumeButton.dataset.resumeId=resume?.id||'';
  const handoff=$('#focus-handoff');
  const showHandoff=workspace==='focus'&&t.mode==='focus'&&!t.mistakeId&&hasHandoff(task);
  app.classList.toggle('calendar-focus-context',Boolean(showHandoff&&t.block&&task?.reference));
  handoff.hidden=!showHandoff;
  if(showHandoff){
    const html=`<h2 id="focus-handoff-title">Pick up here</h2>${handoffDetails(task)}`;
    if(handoffMarkup!==html){handoff.innerHTML=html;handoffMarkup=html;}
  }
  const projectButton=$('#focus-project-context');
  const project=task?.projectId&&state.projects.find(item=>item.id===task.projectId);
  projectButton.hidden=!project;
  if(project&&projectButton.textContent!==project.name)projectButton.textContent=project.name;
  if(renderedTaskDay!==dayKey(clock)){
    const wasShowingToday=inSchedule()&&planner.calendarVisible()&&dayKey(leadingPlannerDay())===renderedTaskDay;
    renderTasks(clock);
    if(activePanel==='focus-task')refreshPanel();
    if(inSchedule()){
      renderCalendar();
      if(wasShowingToday)scrollCalendarTo(clock);
    }
  }
  if(agendaMinute!==Math.floor(clock.getTime()/60000)){
    renderAgenda(clock);
    calendarGrid.querySelector('.calendar-now')?.style.setProperty('--now-minute',clock.getHours()*60+clock.getMinutes());
    syncCalendarProgress(clock.getTime());
  }
  if(calendarHistory!==state.history||calendarHistoryLength!==state.history.length)syncCalendarProgress(clock.getTime());
  if(workspace==='calendar'&&actualCalendar)updateActualCalendar(clock);
  if(activePanel==='calendar-block')updateBlockPreview(clock.getTime());
  $('#extend-running-block').hidden=workspace!=='focus'||!canExtendCalendarTimer(state,blockExtensionMinutes*60000,clock.getTime());
  const running=t.status==='running';
  const waitingForBundle=t.mode==='focus'&&!t.id&&bundleWaiting;
  timerButton.disabled=Boolean(waitingForBundle);
  timerButton.title=waitingForBundle?'The next bundle task is unavailable':'Start or pause (Space)';
  const sequence=t.sequence;
  const phase=sequence?.phases[sequence.index];
  const routineCaption=$('#routine-phase');
  const phaseText=phase?`${sequence.name} · ${sequence.index+1}/${sequence.phases.length} · ${phase.name}`:
    overtime?'Overtime':t.taskPlan?.totalMs>3600000?({first:'Task focus · Half 1 of 2',interval:'Rest before half 2',second:'Task focus · Half 2 of 2',final:'Task break'})[t.taskPlan.stage]:'';
  routineCaption.hidden=!phaseText;
  $('#end-routine').hidden=!phase;
  if(routineCaption.textContent!==phaseText)routineCaption.textContent=phaseText;
  const outcomeButton=$('#focus-goal'), outcomeText=t.id?(t.goal||'Set outcome'):'Warm up';
  outcomeButton.hidden=t.mode!=='focus'||Boolean(t.mistakeId);
  if(outcomeButton.textContent!==outcomeText)outcomeButton.textContent=outcomeText;
  outcomeButton.title=!t.id?'Review your handoff, note, and outcome':t.goal?`Edit outcome: ${t.goal}`:'Set an outcome for this focus session';
  $('#review-focus').hidden=!pendingFocusReview();
  timerButton.innerHTML=icon(running?'pause':'play')+`<span>${overtime?'Finish overtime':running?'Pause':t.status==='paused'?'Continue':t.mode==='focus'?'Begin focus':'Begin rest'}</span>`;
  $('[data-mode="focus"]').setAttribute('aria-pressed',t.mode==='focus');
  $('[data-mode="break"]').setAttribute('aria-pressed',t.mode==='break');
  app.classList.toggle('focus-running',running||overtime);
  const progress=todayProgress(state);
  if(progress.completed!==lastBlossoms){$('#blossoms').innerHTML=blossomMarkup(progress.completed);lastBlossoms=progress.completed;}
  renderGardenGrowth();
  document.title=(adminSandbox?'[Sandbox] ':'')+(t.status==='idle'?'Yin and Yang — A quiet place to focus':`${overtime?'+':''}${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')} · ${t.mode==='focus'?'Focus':'Rest'} — Yin and Yang`);
}
function checkCompletion(){
  const now=Date.now(),wasOvertime=state.timer.status==='overtime',wasBlock=Boolean(state.timer.block),wasRoutine=Boolean(state.timer.sequence);
  let completed=null;
  let focused=false;
  for(let phase=settle(state,now);phase;phase=settle(state,now)){
    completed=phase;
    if(phase.mode==='focus'){focused=true;resumeTaskId=phase.replay?.at(-1)?.taskId??phase.taskId??null;}
  }
  if(!wasOvertime&&state.timer.status==='overtime'){
    const text='Focus time is up. Overtime is counting until you finish.';
    persist();render();toast(text);announce(text);wake();
    notifyTimer('Focus overtime',text,state.timer.id+'-overtime');
    return;
  }
  const wrapping=!completed&&state.timer.status==='running'&&focusWrapUp(state,now);
  const warning=completed?null:consumeTimerWarning(state,now);
  if(wrapping&&!state.timer.wrapSent){
    state.timer.wrapSent=true;
    const message='Wrap-up time. Save your work and leave a next step.';
    persist();toast(message);announce(message);
    notifyTimer('Wrap up',message,state.timer.id+'-wrap');
    return;
  }
  if(wrapping&&warning){persist();return;}
  if(!completed&&!warning)return;
  if(!completed){
    const label=warning.mode==='focus'?'Focus':'Break';
    const message=`${formatDuration(warning.left)} left in your ${warning.mode==='focus'?'focus session':'break'}.`;
    persist();toast(message);announce(message);
    notifyTimer(`${label} ending soon`,message,`${warning.id}-warning`);
    gardenAudio.cue(warning.mode,true);
    return;
  }
  if(focused)nextPenguinThought();
  let message=wasRoutine
    ?state.timer.sequence?`${state.timer.sequence.phases[state.timer.sequence.index].name} is ready.`:'Routine complete.'
    :wasBlock
    ? state.timer.block ? (state.timer.mode==='break'?'Focus complete. A short rest has started.':'Rest complete. Focus has resumed.') : 'Calendar block finished.'
    : completed.mode==='focus'?'Focus session complete. Your break is ready.':'Break complete. Your focus timer is ready.';
  if(completed.mistakeId)message+=' Review your retry when you’re ready.';
  else if(completed.goal)message+=' Review your outcome when you’re ready.';
  persist();render();planner.refreshReporting();toast(message);announce(message);
  notifyTimer(completed.mode==='focus'?'Focus finished':'Break finished',message,`${completed.id}-complete`);
  gardenAudio.cue(completed.mode);
  if(activePanel==='progress'||activePanel==='focus-task')refreshPanel();
  if(focused&&workspace==='planner'&&!activePanel)planner.render();
  wake();
}
const notificationsSupported=()=>!adminSandbox&&globalThis.isSecureContext&&typeof Notification!=='undefined';
function notificationStatus(){
  if(!notificationsSupported())return 'Browser notifications are unavailable here. In-app warnings are active.';
  if(Notification.permission==='denied')return 'Allow notifications in this site’s browser settings to enable them.';
  return state.notifications&&Notification.permission==='granted'?'Browser notifications are on.':'In-app warnings are active. Enable browser notifications for background alerts.';
}
function notifyTimer(title,body,tag){
  if(!state.notifications||!notificationsSupported()||Notification.permission!=='granted')return;
  try{new Notification(`Yin and Yang · ${title}`,{body,tag,silent:true});}
  catch{ /* Some browsers only support notifications from an installed app. */ }
}
async function toggleNotifications(){
  if(!notificationsSupported())return;
  if(state.notifications&&Notification.permission==='granted')state.notifications=false;
  else{
    try{state.notifications=await Notification.requestPermission()==='granted';}
    catch{state.notifications=false;}
  }
  persist();
  if(activePanel==='pagoda')refreshPanel();
}
function action(fn){checkCompletion();fn();persist();render();wake();if(activePanel==='pagoda')refreshPanel();}
function toggleFocusTimer(task,now=Date.now()){
  if(finishOvertime(state,now)){
    nextPenguinThought();
    resumeTaskId=task?.id||null;
    planner.refreshReporting();
    toast('Overtime recorded. Your break is ready.');
    return;
  }
  const freshFocus=!state.timer.id&&state.timer.mode==='focus';
  const bundle=freshFocus&&!task?activeBundleStatus(new Date(now)):null;
  if(bundle?.next&&!bundle.run.paused)return;
  replayTaskSwitch(state.timer,task,now);
  startPause(state,now,task?.id||null);
  if(!freshFocus||!task)return;
  const date=new Date(now);
  const matching=calendarBlocks([task],date).filter(block=>{
    const schedule=calendarTaskBlock(task,block.blockId,block.occurrence);
    return openFocusBlock(block)&&schedule?.start<=now&&schedule.end>now;
  });
  if(matching.length===1){
    const {occurrence,blockId,taskDay}=matching[0];
    state.timer.calendarBlock={occurrence,blockId:blockId||null,taskDay};
  }
}
timerButton.onclick=()=>action(()=>{
  const overtime=state.timer.status==='overtime';
  toggleFocusTimer(focusedTask());
  announce(overtime?'Overtime recorded.':state.timer.status==='running'?`${state.timer.mode} timer started.`:'Timer paused.');
});
$('#focus-subtasks').onclick=()=>openPanel('focus-subtasks',$('#focus-subtasks'));
$('#focus-overtime').onclick=()=>action(()=>{
  state.focusOvertime=!state.focusOvertime;
  announce(state.focusOvertime?'Overtime enabled.':'Overtime off.');
});
$('#reset-timer').onclick=()=>action(()=>{
  if(state.timer.id){
    const session=record(state,'skipped');
    toast(session?.outcome==='completed'?'Overtime saved. Timer reset.':'Timer reset. The unfinished session was marked skipped.');
  }
  const {sequence,goal,taskPlan,taskBreak,total,baseTotal}=state.timer;
  if(sequence)loadRoutinePhase(state,sequence,sequence.index);
  else if(taskPlan)resetTaskTiming(state,taskPlan);
  else if(taskBreak)taskFinishBreak(state,(baseTotal||total)/12000);
  else reset(state);
  if(goal)state.timer.goal=goal;
});
$('#skip-timer').onclick=()=>action(()=>{const skipped=skipPhase(state);toast(skipped?.outcome==='completed'?'Overtime recorded.':skipped?'Session skipped. It won’t count as completed.':`${state.timer.mode==='focus'?'Focus':'Rest'} timer ready.`);});
document.querySelectorAll('[data-mode]').forEach(el=>el.onclick=()=>{if(el.dataset.mode===state.timer.mode)return;action(()=>{if(state.timer.id){const session=record(state,'skipped');toast(session?.outcome==='completed'?'Overtime recorded.':'Unfinished session marked skipped.');}reset(state,el.dataset.mode);});});
currentTaskButton.onclick=()=>{
  if(activePanel==='focus-task'){closePanel();return;}
  openPanel('focus-task',currentTaskButton);
  const selected=root.querySelector('[data-focus-task][aria-pressed="true"]')||root.querySelector('[data-focus-task], #focus-task-edit, #focus-task-add');
  selected?.focus({preventScroll:true});
};
finishTaskButton.onclick=()=>openPanel('finish-task',finishTaskButton);
$('#focus-goal').onclick=()=>openPanel('focus-goal',$('#focus-goal'));
$('#quick-task-capture').onclick=event=>openPanel('quick-task',event.currentTarget);
$('#open-focus-setups').onclick=event=>openPanel('focus-setups',event.currentTarget);
$('#open-incomplete-focus').onclick=event=>openPanel('incomplete-focus',event.currentTarget);
$('#wrap-save-next').onclick=event=>{
  if(focusedTask())openPanel('resume',event.currentTarget);
};
$('#first-task-pin button').onclick=()=>{
  const task=pinnedFirstTask();
  if(!task||state.timer.id||state.timer.block||state.timer.sequence||!saveTaskSelection(task))return;
  refreshTasks();timerButton.focus({preventScroll:true});
};
$('#extend-running-block').onclick=event=>{
  checkCompletion();
  extensionPreview=planRunningBlockExtension(state,blockExtensionMinutes);
  openPanel('calendar-extension',event.currentTarget);
};
$('#finish-retry').onclick=finishMistakeFocus;
$('#review-retry').onclick=()=>openPanel('mistake-retry',$('#review-retry'));
$('#break-ideas').onclick=()=>{
  breakIdeaIndex=0;
  openPanel('break-ideas',$('#break-ideas'));
};
$('#review-focus').onclick=()=>openPanel('focus-review',$('#review-focus'));
$('#fit-task').onclick=()=>openPanel('fit-task',$('#fit-task'));
$('#fit-before-class').onclick=()=>openPanel('fit-before-class',$('#fit-before-class'));
let editingPause;
$('#focus-pause-note').onclick=()=>{
  editingPause=currentFocusPause(state.timer);
  if(editingPause)openPanel('focus-pause-note',$('#focus-pause-note'));
};
function savePauseNote(pause,text){
  const timer=state.timer,replay=editFocusPause(timer,pause,text);
  if(!replay)return false;
  const previous=timer.replay;
  timer.replay=replay;
  if(!persist()){timer.replay=previous;return false;}
  render();return true;
}
$('#end-routine').onclick=()=>action(()=>{
  if(!state.timer.sequence)return;
  record(state,'skipped');
  reset(state,'focus');
  timerButton.focus({preventScroll:true});announce('Routine ended.');
});
$('#sidebar-add-task').onclick=()=>openTaskEditor(null,$('#sidebar-add-task'));
$('#sidebar-calendar').onclick=()=>toggleCalendar($('#sidebar-calendar'));
$('#sidebar-capture').onclick=()=>openPanel('capture',$('#sidebar-capture'));
miniCalendar.addEventListener('click',event=>{
  const shift=event.target.closest('[data-agenda-shift]');
  if(shift){const delta=Number(shift.dataset.agendaShift);agendaOffset=delta?agendaOffset+delta:0;renderAgenda();return;}
  const block=event.target.closest('.calendar-block');
  if(block)openCalendarBlock(block);
});
$('#close-calendar').onclick=()=>closeCalendar();
$('#calendar-theme').onchange=event=>{
  const previous=state.calendarTheme;
  state.calendarTheme=calendarTheme(event.target.value);
  if(!persist()){state.calendarTheme=previous;event.target.value=previous;}
  render();
};
$('#planner-appearance').onclick=()=>openPanel('appearance',$('#planner-appearance'));
$('#resume-task').onclick=()=>openPanel('resume',$('#resume-task'));
$('#focus-bundle').onclick=()=>openPanel('focus-bundle',$('#focus-bundle'));
$('#focus-project-context').onclick=()=>openPanel('project-context',$('#focus-project-context'));
taskBoardToggle.onclick=()=>{
  const previous=state.settings.taskBoardCollapsed;
  state.settings.taskBoardCollapsed=!previous;
  if(!persist()){state.settings.taskBoardCollapsed=previous;return;}
  syncTaskBoard();
  taskSidebar.scrollTop=0;
};
$('#close-task-sidebar').onclick=()=>{setTaskSidebar(false);taskToggle.focus();};
document.querySelectorAll('[data-panel]').forEach(el=>el.onclick=()=>{
  if(el===taskToggle){
    if(!desktopTasks.matches&&inSchedule()){closeCalendar();setTaskSidebar(true);taskToggle.focus();}
    else setTaskSidebar(taskSidebar.hidden);
    return;
  }
  if(el.id==='garden-tools'){gardenToolQuery='';lastGardenTool='';}
  if(activePanel===el.dataset.panel&&lastAnchor===el)closePanel();else openPanel(el.dataset.panel,el);
});
function syncFocusMode(){
  const enabled=state.focusMode;
  if(app.classList.contains('focus-view')===enabled)return;
  if(enabled){
    if(renderedTaskDay){
      sidebarBeforeFocus=inSchedule()?reopenTasksAfterCalendar:workspace==='crochet'?desktopTasks.matches:!taskSidebar.hidden;
    }
    closePanel(false);
    closeTaskMenu(false);
    if(inSchedule())closeCalendar();
    showWorkspace('focus');
    setTaskSidebar(false);
  }
  app.classList.toggle('focus-view',enabled);
  if(!enabled)setTaskSidebar(sidebarBeforeFocus);
  focusModeButton.setAttribute('aria-pressed',String(enabled));
  $('#focus-mode-label').textContent=enabled?'Exit focus':'Focus mode';
  focusModeButton.title=enabled?'Exit focus mode (Esc)':'Hide tasks, the planner, and garden tools';
  if(!document.activeElement.getClientRects().length)focusModeButton.focus({preventScroll:true});
}
function toggleFocusMode(){
  if(activePanel==='garden-studio'&&closePanel(false)===false)return;
  state.focusMode=!state.focusMode;
  persist();render();wake();
  announce(state.focusMode?'Focus mode on. Press Escape to return to the garden.':'Focus mode off.');
}
focusModeButton.onclick=toggleFocusMode;
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Use your browser’s fullscreen option to fill the screen.');}catch{toast('Fullscreen is unavailable here. Open in your browser and use F11.');}}
$('#fullscreen').onclick=fullscreen;
document.addEventListener('fullscreenchange',()=>{const full=!!document.fullscreenElement;$('#fullscreen').innerHTML=icon(full?'collapse':'expand');$('#fullscreen').setAttribute('aria-label',full?'Exit fullscreen':'Enter fullscreen');$('#fullscreen').title=full?'Exit fullscreen':'Enter fullscreen';});

function wake(){
  clearTimeout(idleTimeout);
  app.classList.remove('is-idle');
  if(state.focusMode&&['running','overtime'].includes(state.timer.status)&&!activePanel)idleTimeout=setTimeout(()=>app.classList.add('is-idle'),4000);
}
for(const event of ['pointermove','pointerdown','keydown','focusin'])document.addEventListener(event,wake,{passive:true});
document.addEventListener('pointermove',event=>{
  capturePointer={x:event.clientX,y:event.clientY,screenX:event.screenX,screenY:event.screenY};
},{passive:true});
function header(eyebrow,title){return `<div class="panel-header"><div><span class="eyebrow">${eyebrow}</span><h2 id="panel-title">${title}</h2></div><button class="icon-button close-panel" aria-label="Close panel">${icon('close')}</button></div>`;}
function landmarkAnchor(index){
  return $(`[data-garden-landmark="${index}"]:not([hidden]),[data-member-stars~="${index}"]:not([hidden])`)||$('[data-panel="progress"]');
}
function openGardenLandmark(index){
  const item=state.gardenGrowth[index];
  if(!item)return;
  if(snapshotThrough&&item.day>snapshotThrough)setGardenSnapshot('');
  openPanel('garden-landmark',landmarkAnchor(index),index);
}
const landmarkDate=day=>new Date(`${day}T12:00:00`).toLocaleDateString([],{dateStyle:'medium'});
function updateGardenSnapshotLabel(){
  const layout=viewedGardenLayout(),visible=Boolean(snapshotThrough||layout);
  $('#garden-snapshot').hidden=!visible;
  $('#garden-snapshot-date').textContent=layout
    ?layout.name+(snapshotThrough?` · Through ${landmarkDate(snapshotThrough)}`:'')
    :snapshotThrough?`Garden on ${landmarkDate(snapshotThrough)}`:'';
  return visible;
}
function setGardenSnapshot(through,layoutId=''){
  snapshotThrough=through;snapshotLayoutId=layoutId;
  renderedGardenGrowth=null;
  render();
  const visible=updateGardenSnapshotLabel();
  closePanel(false);
  (visible?$('#garden-snapshot-close'):$('[data-panel="progress"]')).focus({preventScroll:true});
  announce(visible?$('#garden-snapshot-date').textContent:'Showing today’s Garden.');
}
function openGardenStudio(){
  if(state.focusMode)toggleFocusMode();
  visitWorkspace('focus');
  openPanel('garden-studio',$('#edit-current-landscape'));
}
function saveStudioLayouts(layouts,applied,assignments=state.gardenActivityLayouts,arrangements=state.gardenArrangements){
  const {gardenLayouts,gardenDesign,appearance,gardenSchedule,gardenActivityLayouts,gardenArrangements}=state;
  state.gardenLayouts=layouts;
  state.gardenArrangements=arrangements;
  state.gardenActivityLayouts=loadGardenActivityLayouts(assignments,layouts);
  if(applied){
    state.gardenDesign=applied.design;
    state.appearance=loadAppearance(applied.appearance);
    state.gardenSchedule={...gardenSchedule,enabled:false};
  }
  if(!persist()){Object.assign(state,{gardenLayouts,gardenDesign,appearance,gardenSchedule,gardenActivityLayouts,gardenArrangements});return false;}
  if(applied){
    snapshotThrough='';snapshotLayoutId='';
    renderedGardenGrowth=null;
    updateGardenSnapshotLabel();
  }
  render();
  return true;
}
function openGardenCourse(id,anchor){
  selectedCourse=id;
  openPanel('garden-course',anchor?.isConnected?anchor:$('[data-panel="progress"]'));
}
function gardenCourseMarkup(){
  const course=gardenCourses(state.gardenGrowth,state.projects).find(item=>item.id===selectedCourse);
  if(!course)return header('CONSTELLATION','Course unavailable');
  const stars=course.stars.filter(({item})=>!snapshotThrough||item.day<=snapshotThrough);
  return `${header('COURSE CONSTELLATION',escape(course.name))}
    <ol class="garden-growth-history">${stars.map(({item,index})=>`<li><button type="button" data-history-landmark="${index}" aria-haspopup="dialog">
      <span class="field-sketch">${gardenFieldSketch('test')}</span><span><strong>${escape(item.title)}</strong>
      ${item.result?`<small>${escape(item.result)}</small>`:''}</span><time datetime="${item.day}">${landmarkDate(item.day)}</time></button></li>`).join('')}</ol>
    <button type="button" class="text-button" data-garden-history-open>Garden Field Guide</button>`;
}
function hasHandoff(task){return Boolean(task?.resumeNote||task?.resumeLocation||task?.resumeResource||nextFocusSubtask(task));}
function handoffDetails(task){
  const resource=handoffLink(task.resumeResource),next=nextFocusSubtask(task);
  return `${task.resumeLocation?`<p><strong>${escape(task.resumeLocation)}</strong></p>`:''}
    ${task.resumeNote?`<p class="handoff-note">${escape(task.resumeNote)}</p>`:''}
    ${next?`<p class="handoff-note">Next unfinished subtask · ${escape(next.text)}</p>`:''}
    ${resource?`<a class="handoff-resource" href="${escape(resource)}" target="_blank" rel="noopener noreferrer">Open resource ${icon('external')}</a>`:''}`;
}
function handoffFields(task){
  return `<label class="field-label" for="handoff-location">Where you stopped</label>
    <input id="handoff-location" name="resumeLocation" maxlength="240" value="${escape(task.resumeLocation)}" placeholder="Problem 8, page 42, or chapter3.md">
    <label class="field-label" for="handoff-resource">Resource link <span>(optional)</span></label>
    <input id="handoff-resource" name="resumeResource" type="url" maxlength="2000" value="${escape(task.resumeResource)}" placeholder="https://…">`;
}
function readHandoff(form){
  const fields=form.elements;
  const resource=handoffLink(fields.resumeResource.value);
  fields.resumeResource.setCustomValidity(fields.resumeResource.value.trim()&&!resource?'Enter an http or https link.':'');
  if(!fields.resumeResource.reportValidity())return null;
  return {resumeNote:fields.resumeNote.value.trim(),resumeLocation:fields.resumeLocation.value.trim(),resumeResource:resource};
}
function gardenLandmarkMarkup(){
  const item=state.gardenGrowth[selectedLandmark];
  if(!item)return header('GARDEN','Landmark unavailable');
  const type=landmarkTypes[item.kind];
  const book=item.kind==='book'?readingShelf(state.dailyRituals,state.readingNotes,state.finishedBooks,state.libraryBooks)
    .find(book=>book.finished?.id===item.sourceId):null;
  const project=item.kind==='project'&&state.projects.find(project=>project.id===item.sourceId);
  const examProject=item.kind==='test'&&state.projects.find(project=>project.exams?.some(exam=>exam.id===item.sourceId));
  const exam=examProject?.exams?.find(exam=>exam.id===item.sourceId);
  const courseId=examProject?.id||item.courseId;
  const finished=book?.finished;
  const firstLog=book?.entries.filter(entry=>entry.date<=finished.finishedOn).at(-1)?.date;
  const finish=finished?.finishedOn||exam?.result?.takenOn||item.day;
  const date=(label,day)=>`<div><dt>${label}</dt><dd><time datetime="${day}">${landmarkDate(day)}</time></dd></div>`;
  const outcome=exam?.result?.score??item.result;
  const note=(exam?.result?.reflection??item.detail)||finished?.takeaway;
  const tier=ratingTier(finished?.rating),tierLabel=radiantRatingLabels[tier];
  return `${header(type.event,escape(book?.title||project?.name||exam?.title||item.title))}
    <div class="landmark-panel-body" role="region" aria-label="Landmark details" tabindex="0">
      <p id="landmark-save-status" hidden></p>
      <div class="landmark-memento" ${finished?.rating?`data-book-tier="${tier}"`:''}>
        <div class="landmark-summary"><div class="landmark-emblem" aria-hidden="true">${icon(type.mark)}</div>
          ${book?.author?`<p class="landmark-byline">${escape(book.author)}</p>`:`<p class="landmark-byline">${type.name}</p>`}
          ${finished?`<strong class="landmark-result" aria-label="${finished.rating?`Rating ${finished.rating} out of 5${tierLabel?', '+tierLabel:''}`:'Unrated'}">${finished.rating?`<span aria-hidden="true">${tier==='aurora'?'✦':'★'} ${finished.rating} / 5</span>${tierLabel?`<small aria-hidden="true">${tierLabel}</small>`:''}`:'Unrated'}</strong>`:
            outcome?`<strong class="landmark-result">${escape(outcome)}</strong>`:''}</div>
        <dl class="landmark-dates">${firstLog?date('First logged',firstLog):''}
          ${date(item.kind==='test'?'Completed':item.kind==='milestone'?'Reached':'Finished',finish)}</dl>
      </div>
      ${note?`<p class="landmark-detail">${escape(note)}</p>`:''}
      ${item.inscription?`<div class="landmark-dedication"><blockquote class="landmark-inscription">${escape(item.inscription)}</blockquote>
        <button type="button" class="text-button" data-inscription-postcard>Use as postcard caption</button></div>`:''}
      <div class="landmark-links">${book?`<button type="button" class="panel-primary" data-landmark-book="${escape(book.id)}">Open in Reading</button>`:''}
        ${examProject?`<button type="button" class="panel-primary" data-landmark-exam="${escape(item.sourceId)}" data-exam-project="${escape(examProject.id)}">Open exam plan</button>`:''}
        ${project?`<button type="button" class="panel-primary" data-view-project="${escape(project.id)}">Open project</button>`:''}
        ${courseId?`<button type="button" class="text-button" data-guide-course="${escape(courseId)}">View constellation</button>`:''}
        <button type="button" class="text-button" data-garden-history-open>Garden Field Guide</button></div>
      ${item.kind!=='test'?`<div class="landmark-editors">
        <details class="landmark-record" name="landmark-editor"><summary>${item.inscription?'Edit inscription':'Add inscription'}</summary>
          <form id="landmark-inscription-form" data-kind="${escape(item.kind)}" data-source="${escape(item.sourceId)}">
            <label>Dedication<input name="inscription" maxlength="90" value="${escape(item.inscription)}" placeholder="For the work we did together"></label>
            <button class="panel-primary">Save inscription</button>
          </form></details>
        <details class="landmark-record" name="landmark-editor">
          <summary>Place landmark <small>${item.zone?gardenZones[item.zone]:'Automatic'}</small></summary>
          <form id="landmark-place">${placementFields(item)}<button class="panel-primary">Save placement</button></form>
        </details></div>`:''}
    </div>`;
}
function saveLandmarkInscription(form){
  const previous=state.gardenGrowth;
  const index=previous.findIndex(item=>item.kind===form.dataset.kind&&item.sourceId===form.dataset.source);
  if(index<0)return;
  const {inscription:old,...record}=previous[index];
  const inscription=landmarkInscription(record.kind,form.elements.inscription.value);
  if(inscription===(old||'')){form.closest('details').open=false;return;}
  state.gardenGrowth=previous.map((item,i)=>i===index?{...record,...(inscription&&{inscription})}:item);
  if(!persist()){state.gardenGrowth=previous;return;}
  renderGardenGrowth();openGardenLandmark(index);
  confirmLandmarkEdit(inscription?'Landmark inscription saved.':'Landmark inscription cleared.');
}
function confirmLandmarkEdit(message){
  const status=$('#landmark-save-status');
  status.textContent=message;status.hidden=false;announce(message);
}
function placementFields(item={}){
  const groups=new Map(state.gardenGrowth.filter(entry=>entry.group&&entry.zone).map(entry=>[entry.group.toLowerCase(),entry]));
  return `<label>Area<select name="zone"><option value="">Automatic</option>${Object.entries(gardenZones).map(([id,name])=>
    `<option value="${id}" ${item.zone===id?'selected':''}>${name}</option>`).join('')}</select></label>
    <label><span>Group <small>(optional)</small></span><input name="group" maxlength="80" list="landmark-groups" value="${escape(item.group)}" placeholder="Project or semester"></label>
    <datalist id="landmark-groups">${[...groups.values()].map(entry=>`<option value="${escape(entry.group)}">${gardenZones[entry.zone]}</option>`).join('')}</datalist>`;
}
function selectedPlacement(kind,zone,group){
  const name=group?.trim();
  const prior=state.gardenGrowth.find(item=>item.group?.toLowerCase()===name?.toLowerCase()&&item.zone);
  return landmarkPlacement(kind,zone||prior?.zone||(name?'island':''),name);
}
function gardenHistoryMarkup(){
  const history=gardenRange(state.gardenGrowth,gardenFrom,gardenThrough);
  const matching=new Set(history.map(({index})=>index));
  const courses=gardenCourses(state.gardenGrowth,state.projects).filter(course=>course.stars.some(({index})=>matching.has(index)));
  const types=Object.entries(landmarkTypes);
  const counts=Object.fromEntries(types.map(([kind])=>[kind,history.filter(({item})=>item.kind===kind).length]));
  const entries=history.sort((a,b)=>b.item.day.localeCompare(a.item.day)||b.index-a.index)
    .filter(({item})=>gardenHistoryFilter==='all'||gardenHistoryFilter===item.kind)
    .map(({item,index})=>{
      const type=landmarkTypes[item.kind];
      return `<li><button type="button" data-history-landmark="${index}" aria-haspopup="dialog">
        <span class="field-sketch">${gardenFieldSketch(item.kind)}</span>
        <span><strong>${escape(item.title)}</strong><small>${type.event}${item.zone?` · ${gardenZones[item.zone]}`:''}${item.group?` · ${escape(item.group)}`:''}</small></span>
        <time datetime="${item.day}">${landmarkDate(item.day)}</time></button></li>`;
    }).join('');
  return `${header('GARDEN','Garden Field Guide')}
    <form id="garden-range"><label>From<input type="date" name="from" max="${dayKey()}" value="${gardenFrom}"></label>
      <label>Through<input type="date" name="through" max="${dayKey()}" value="${gardenThrough}"></label>
      <div class="panel-actions"><button class="text-button" type="submit">Filter dates</button>
      <button class="panel-primary" type="submit" value="snapshot">View Garden at end date</button>
      <button type="button" data-semester-replay>Play time-lapse</button>
      ${gardenFrom||gardenThrough?'<button class="text-button" type="button" data-garden-clear-range>Clear dates</button>':''}</div>
      <p id="garden-range-error" role="alert" hidden></p></form>
    ${starConstellationGuide(gardenThrough||snapshotThrough)}
    ${courses.length?`<div class="field-courses"><h3>Course constellations</h3><ul>${courses.map(course=>
      `<li><button type="button" data-guide-course="${escape(course.id)}">${icon('spark')} ${escape(course.name)}</button></li>`).join('')}</ul></div>`:''}
    ${state.gardenGrowth.length?`<div class="garden-history-filters" role="group" aria-label="Landmark type">
      ${[['all',{name:'All'}],...types].map(([kind,type])=>`<button type="button" data-history-filter="${kind}" aria-pressed="${kind===gardenHistoryFilter}">${type.name} · ${kind==='all'?history.length:counts[kind]}</button>`).join('')}
    </div>${entries?`<ol class="garden-growth-history">${entries}</ol>`:'<p>No landmarks match these filters.</p>'}`:
    '<p>Finish a project to plant a tree, finish a book to light a lantern, or record a test or milestone below.</p>'}
    ${state.gardenLayouts.length?`<section class="field-layouts"><h3>Saved Studio layouts</h3>
      <ul class="garden-growth-history">${[...state.gardenLayouts].reverse().map(layout=>`<li><button type="button" data-view-garden-layout="${escape(layout.id)}">
        <span><strong>${escape(layout.name)}</strong><small>${layout.through?`Landmarks through ${landmarkDate(layout.through)}`:'Shows current landmarks'} · ${seasonOptions[layout.appearance.season].name}</small></span>
        <span class="field-layout-action">View</span></button></li>`).join('')}</ul></section>`:''}
    <details class="landmark-record"><summary>Record a test or milestone</summary>
      <form id="landmark-form"><div class="landmark-form-fields">
        <label>Type<select name="kind"><option value="test">Test · Star</option><option value="milestone">Milestone · Cairn</option></select></label>
        <label>Date<input type="date" name="day" value="${dayKey()}" max="${dayKey()}" required></label></div>
        <label>Title<input name="title" maxlength="120" required></label>
        ${state.projects.some(project=>!project.archived)?`<label>Course <span>(optional for tests)</span><select name="course"><option value="">Unassigned</option>${state.projects.filter(project=>!project.archived).map(project=>`<option value="${escape(project.id)}">${escape(project.name)}</option>`).join('')}</select></label>`:''}
        <label>Result <span>(optional)</span><input name="result" maxlength="100" placeholder="e.g. 92%"></label>
        <label>Note <span>(optional)</span><textarea name="detail" maxlength="1000" rows="2"></textarea></label>
        <fieldset class="landmark-placement-fields"><legend>Cairn placement</legend>${placementFields()}</fieldset>
        <button class="panel-primary">Add to Garden</button></form></details>
    <div class="panel-actions"><button type="button" class="text-button" id="garden-history-today">Back to today’s progress</button>
    <button type="button" class="text-button" data-open-garden-comparison>Compare two dates</button>
    <button type="button" class="text-button" data-open-postcard>Export postcard</button></div>`;
}

let selectedConstellation='',constellationThrough='';
function starConstellationGuide(through){
  const {count,free,next,unlocked}=gardenStarProgress(state.gardenGrowth,{through});
  const unlockedById=new Map(unlocked.map(item=>[item.id,item]));
  const progress=next?`${next.threshold-count} more ${next.threshold-count===1?'star':'stars'} to unlock ${next.name}.`:'All five constellations unlocked.';
  return `<section class="star-constellation-guide"><h3>Star constellations</h3>
    <p>${count} earned · ${free} outside Garden constellations. ${progress}</p>
    <ul>${starConstellations.map(item=>`<li>${unlockedById.has(item.id)?
      `<button type="button" data-guide-constellation="${item.id}" aria-haspopup="dialog"><strong>${item.name}</strong><small>${unlockedById.get(item.id).starIndices.length} of ${item.points.length} points lit</small></button>`:
      `<span><strong>${item.name}</strong><small>${item.threshold} stars to unlock</small></span>`}</li>`).join('')}</ul></section>`;
}
function openUnlockedConstellation(id,anchor,through=''){
  selectedConstellation=id;constellationThrough=through;
  openPanel('star-constellation',anchor);
}
function starConstellationMarkup(){
  const item=gardenStarProgress(state.gardenGrowth,{through:constellationThrough}).unlocked.find(entry=>entry.id===selectedConstellation);
  if(!item)return header('STAR CONSTELLATIONS','Constellation unavailable');
  return `${header('STAR CONSTELLATIONS',item.name)}<div class="star-constellation-sketch">${gardenConstellationSketch(item)}</div>
    <p>${item.description}</p><p>${item.starIndices.length} of ${item.points.length} points lit · Unlocked ${landmarkDate(item.day)}</p>
    <details><summary>Tests in this constellation</summary><ul class="garden-growth-history">${item.starIndices.map(index=>{
      const star=state.gardenGrowth[index];
      return `<li><button type="button" data-history-landmark="${index}" aria-haspopup="dialog"><strong>${escape(star.title)}</strong><time datetime="${star.day}">${landmarkDate(star.day)}</time></button></li>`;
    }).join('')}</ul></details>
    <button class="text-button" type="button" data-garden-history-open>Garden Field Guide</button>`;
}
function openGardenPostcard(caption=viewedGardenLayout()?.name||'',anchor=$('[data-panel="progress"]')){
  if(state.focusMode)toggleFocusMode();
  visitWorkspace('focus');openPanel('garden-postcard',anchor);
  $('#postcard-caption').value=caption;
}
function openGardenComparison(){
  const today=dayKey(),end=gardenThrough||snapshotThrough||today;
  const start=gardenFrom||dayKey(shiftDay(new Date(end+'T12:00:00'),-30));
  const dates=gardenComparison(state.gardenGrowth,start,end,today);
  comparisonDates=dates||gardenComparison(state.gardenGrowth,dayKey(shiftDay(new Date(),-30)),today,today);
  openPanel('garden-comparison',$('[data-panel="progress"]'));
}
function gardenComparisonMarkup(){
  const {before,after}=comparisonDates,today=dayKey();
  return `${header('GARDEN FIELD GUIDE','Garden before and after')}
    <form id="garden-comparison-form">
      <div class="garden-compare-controls"><label>Before<input type="date" name="before" value="${before}" max="${today}" required></label>
        <label>After<input type="date" name="after" value="${after}" max="${today}" required></label>
        <button class="panel-primary" type="submit" value="compare">Compare dates</button></div>
      <p id="comparison-status" role="status" aria-live="polite">Both views use the same season and dusk light.</p>
      <div class="garden-compare-scenes">
        <figure><div id="garden-before-scene" class="garden-scene-preview" aria-hidden="true"></div><figcaption id="garden-before-label"></figcaption></figure>
        <figure><div id="garden-after-scene" class="garden-scene-preview" aria-hidden="true"></div><figcaption id="garden-after-label"></figcaption></figure>
      </div>
      <p id="garden-compare-summary"></p>
      <div class="garden-compare-export"><label>Postcard caption <span>(optional)</span><input name="caption" maxlength="90" placeholder="Fall semester"></label>
        <button class="text-button" type="button" data-garden-history-open>Back to Field Guide</button>
        <button class="panel-primary" type="submit" value="download">Download comparison PNG</button></div>
    </form>`;
}
function renderGardenComparison(dates){
  const appearance={...effectiveAppearance,lighting:'dusk'};
  const history=state.gardenGrowth,courses=gardenCourses(history,state.projects),design=sceneGardenDesign();
  const label=(side,date,count)=>`${side} · ${landmarkDate(date)} · ${count} ${count===1?'landmark':'landmarks'}`;
  const before=mountGardenPreview($('#garden-before-scene'),appearance,{history,courses,through:dates.before,design});
  const after=mountGardenPreview($('#garden-after-scene'),appearance,{history,courses,through:dates.after,design});
  $('#garden-before-label').textContent=label('Before',dates.before,dates.earlier);
  $('#garden-after-label').textContent=label('After',dates.after,dates.later);
  $('#garden-compare-summary').textContent=dates.added?`${dates.added} ${dates.added===1?'landmark':'landmarks'} added between these views.`:'The same landmarks appear on both dates.';
  return [before,after];
}
async function submitGardenComparison(form,submitter){
  const {before,after,caption}=form.elements,status=$('#comparison-status');
  const dates=gardenComparison(state.gardenGrowth,before.value,after.value,dayKey());
  if(!dates){status.textContent='Choose two dates with Before earlier than After.';return;}
  comparisonDates=dates;
  const scenes=renderGardenComparison(dates);
  status.textContent='Both views use the same season and dusk light.';
  if(submitter?.value!=='download')return;
  submitter.disabled=true;status.textContent='Preparing comparison postcard…';
  try{
    const labels=[$('#garden-before-label').textContent,$('#garden-after-label').textContent];
    const blob=await comparisonPostcardPng(...scenes,labels,caption.value);
    savePostcard(blob,`garden-comparison-${dates.before}-${dates.after}.png`);
    status.textContent='Comparison postcard downloaded.';
  }catch{status.textContent='Could not export the comparison. Try again.';}
  finally{submitter.disabled=false;}
}
function seasonWheelMarkup(){
  return `<fieldset class="appearance-options"><legend>Season wheel</legend>
    <div class="season-wheel">${Object.entries(seasonOptions).map(([value,item])=>`<label>
      <input class="sr-only" type="radio" name="garden-season-preview" value="${value}" ${seasonPreview===value?'checked':''}>
      <span style="--season-a:${item.colors[0]};--season-b:${item.colors[1]}"><i aria-hidden="true"></i>${item.name}</span></label>`).join('')}</div>
    <div id="garden-season-scene" class="garden-scene-preview" aria-hidden="true"></div>
    <div class="season-preview-actions"><p id="garden-season-preview-label" aria-live="polite"></p>
      <button type="button" id="apply-preview-season" class="panel-primary">Apply season</button></div></fieldset>`;
}
function previewSeasonAppearance(){
  const current=effectiveAppearance;
  return seasonPreview===current.season?current:loadAppearance({...current,season:seasonPreview,weather:'auto',weatherSince:Date.now()});
}
function renderSeasonPreview(){
  const container=$('#garden-season-scene');
  if(!container)return;
  const appearance=previewSeasonAppearance();
  if(!container.firstElementChild||container.dataset.sampleLighting!==appearance.lighting){
    const history=state.gardenGrowth,courses=gardenCourses(history,state.projects);
    mountGardenPreview(container,appearance,{history,courses,through:snapshotThrough,design:sceneGardenDesign(),daylightSample:true});
    container.dataset.sampleLighting=appearance.lighting;
  }else applySceneryAppearance(container,appearance,gardenWeather(appearance,appearance.weatherSince));
  $('#garden-season-preview-label').textContent=`${seasonOptions[appearance.season].name} · ${seasonOptions[appearance.season].detail}`;
  $('#apply-preview-season').disabled=appearance.season===effectiveAppearance.season;
}
function applyPreviewSeason(){
  const {appearance,gardenSchedule}=state;
  const selected=previewSeasonAppearance();
  state.appearance=loadAppearance({...selected,weatherSince:Date.now()});
  state.gardenSchedule={...gardenSchedule,enabled:false};
  if(!persist()){Object.assign(state,{appearance,gardenSchedule});return;}
  $('#garden-schedule-enabled').checked=false;
  $('#garden-weather').innerHTML=gardenWeatherOptions();
  const lighting=$('input[name="garden-lighting"][value="'+state.appearance.lighting+'"]');
  if(lighting)lighting.checked=true;
  $('select[name="garden-palette"]').value=state.appearance.palette;
  render();renderSeasonPreview();
  ($('input[name="garden-season-preview"]:checked')||$('#garden-look-name')).focus({preventScroll:true});
  confirmChange(`Applied ${seasonOptions[selected.season].name}.`);
}
function gardenLooksMarkup(){
  return `<section class="garden-schedule named-garden-looks"><h3>Saved Garden looks</h3>
    <p>New looks use the season selected in the wheel.</p>
    <form id="garden-look-form"><label for="garden-look-name">Look name</label>
      <input id="garden-look-name" name="name" maxlength="80" placeholder="Late Autumn Dusk" required>
      <label><input type="checkbox" name="ambient"> Include my current rain, water, and wind levels</label>
      <button class="panel-primary">Save look</button></form>
    <ul>${state.gardenLooks.map(look=>`<li><button type="button" class="text-button" data-apply-garden-look="${escape(look.id)}">${escape(look.name)}</button>
      <button type="button" data-remove-garden-look="${escape(look.id)}" aria-label="Remove ${escape(look.name)}">×</button></li>`).join('')}</ul>
    <button type="button" class="text-button" data-open-postcard>Export postcard</button></section>`;
}
function applyGardenLook(id){
  const look=state.gardenLooks.find(item=>item.id===id);
  if(!look)return;
  const {appearance,sounds,gardenSchedule}=state;
  state.appearance=loadAppearance(look.appearance);
  state.sounds={...sounds,...look.ambient};
  state.gardenSchedule={...gardenSchedule,enabled:false};
  if(!persist()){Object.assign(state,{appearance,sounds,gardenSchedule});return;}
  syncSound(true);render();seasonPreview=effectiveAppearance.season;refreshPanel();$(`[data-apply-garden-look="${CSS.escape(id)}"]`)?.focus();
  confirmChange(`Applied ${look.name}.`);
}
function savePostcard(blob,filename){
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=filename;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function downloadGardenPostcard(form){
  const button=form.querySelector('[type="submit"]'),status=form.querySelector('#postcard-status');
  const caption=form.elements.caption.value;
  const day=snapshotThrough||dayKey();
  button.disabled=true;status.hidden=false;status.textContent='Preparing postcard…';
  try{
    const weekly=form.elements.weekly.checked;
    const week=focusWeek(state,+new Date(day+'T12:00:00'));
    const range=[week.days[0],week.days.at(-1)].map(d=>d.date.toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'})).join(' – ');
    const blob=weekly?await weeklyPostcardPng($('#landscape .world'),{range,total:week.total,sessions:week.days.reduce((n,d)=>n+d.completed,0)},caption):await postcardPng($('#landscape .world'),caption);
    savePostcard(blob,`garden-${weekly?'week':'postcard'}-${day}.png`);
    status.textContent='Postcard downloaded.';
  }catch{status.textContent='Could not export the postcard. Try again.';}
  finally{button.disabled=false;}
}
function dayRecapMarkup(){
  const {today,tomorrow,finished,moves,focus,blocks,due,firstTask,allDay,rituals:todayRituals}=summarizeDay(state,gardenTasks());
  const tasks=taskIndex();
  const list=(rows,empty)=>rows.length?`<ul>${rows.join('')}</ul>`:`<p>${empty}</p>`;
  const entry=(title,detail,target)=>{
    const content=`<strong>${escape(title)}</strong>${detail?`<small>${escape(detail)}</small>`:''}`;
    return target?`<button class="recap-entry" type="button" aria-haspopup="dialog" ${target}>${content}${icon('right')}</button>`:content;
  };
  const taskTarget=(id,date)=>tasks.has(id)?`data-recap-task="${escape(id)}"${date?` data-occurrence="${escape(date)}"`:''}`:'';
  const blockTarget=({task,block,occurrence,taskDay,event})=>event?
    `data-recap-block data-calendar-event="${escape(event)}"`:
    `data-recap-block data-task="${escape(task)}" data-block="${escape(block)}" data-occurrence="${escape(occurrence)}" data-task-day="${escape(taskDay)}"`;
  const completed=[...finished].sort((a,b)=>b.at-a.at).map(item=>{
    const occurrence=item.id.slice(item.taskId.length+1);
    return `<li>${entry(item.text,'',taskTarget(item.taskId,/^\d{4}-\d{2}-\d{2}$/.test(occurrence)?occurrence:today))}</li>`;
  });
  for(const kind of ['journal','annotate','crochet']){
    if(ritualComplete(kind,todayRituals[kind],kind==='journal'?journal.completedAt(today):0))completed.push(
      `<li>${entry(rituals[kind].label,'',`data-recap-ritual="${kind}" data-date="${today}"`)}</li>`);
  }
  const position=place=>[place.date?shortScheduleDate(place.date):'',place.time?timeLabel(timeMinutes(place.time)):'',place.place].filter(Boolean).join(' · ')||'Unscheduled';
  const moved=moves.map(item=>{
    const target=recapMoveTarget(item,tasks,state.calendarEvents);
    const link=target?.event||target?.occurrence?blockTarget(target):taskTarget(target?.task);
    return `<li>${entry(item.title,`${position(item.from)} → ${position(item.to)}`,link)}</li>`;
  });
  const upcoming=[...allDay.map(event=>`<li>${entry(event.title,'All day',blockTarget({event:event.id}))}</li>`),
    ...blocks.map(block=>`<li>${entry(block.event?.title||block.task.text,`${timeLabel(block.start)}–${timeLabel(block.end)}`,
      blockTarget({event:block.event?.id,task:block.task?.id,block:block.blockId,occurrence:block.occurrence,taskDay:block.taskDay}))}</li>`),
    ...due.map(task=>`<li>${entry(task.text,task.deadline===tomorrow?'Deadline':'Dated task',taskTarget(task.id,tomorrow))}</li>`)];
  const thoughts=[...availableCaptures(),...state.captureArchive]
    .filter(note=>dayKey(new Date(note.createdAt))===today)
    .sort((a,b)=>b.createdAt-a.createdAt).map(note=>`<li>${entry(note.text.trim().split(/\r?\n/)[0].slice(0,90),
      note.archivedAt?'Archived':'Unsorted',`data-recap-capture="${escape(note.key)}"`)}</li>`);
  const focused=minutesLabel(Math.floor(focus.reduce((sum,item)=>sum+item.focusMs,0)/60000));
  return `${header(shortScheduleDate(today),'End-of-day recap')}
    <dl class="recap-totals"><div><dt>Focused</dt><dd>${focused}</dd></div>
      <div><dt>Completed</dt><dd>${completed.length}</dd></div><div><dt>Moved</dt><dd>${moves.length}</dd></div></dl>
    <div class="day-recap-sections">
      <section><h3>Finished today</h3>${list(completed,'No completed items today.')}</section>
      <section><h3>Moved today</h3>${list(moved,'No schedule changes recorded today.')}</section>
      <section><h3>Tomorrow · ${shortScheduleDate(tomorrow)}</h3>
      ${firstTask?entry(firstTask.text,'First focus task',taskTarget(firstTask.id,tomorrow)):''}${list(upcoming,'Nothing lined up yet.')}
      <button type="button" class="text-button" id="recap-open-tomorrow">Plan tomorrow</button></section>
      ${thoughts.length?`<section><h3>Captured today</h3>${list(thoughts,'')}</section>`:''}
      <button type="button" class="text-button" data-evening-lights>Evening lights</button>${shutdownMarkup(today)}
    </div>`;
}
function shutdownMarkup(today){
  const checked=new Set(state.shutdownProgress?.day===today?state.shutdownProgress.ids:[]);
  return `<section id="shutdown-checklist"><h3>Shutdown checklist</h3>
    ${state.shutdownSteps.length?`<ul>${state.shutdownSteps.map(step=>`<li><label><input type="checkbox" data-shutdown-step="${escape(step.id)}" ${checked.has(step.id)?'checked':''}> ${escape(step.text)}</label></li>`).join('')}</ul>`:'<p>No recurring steps yet.</p>'}
    <details id="shutdown-edit"><summary>Edit recurring steps</summary>
      <form id="shutdown-form"><label>One step per line<textarea name="steps" rows="4" maxlength="2100">${escape(state.shutdownSteps.map(step=>step.text).join('\n'))}</textarea></label>
      <button type="submit" class="text-button">Save steps</button><p role="alert" id="shutdown-error" hidden></p></form></details></section>`;
}
function eveningLightsMarkup(){
  const {today,tomorrow,firstTask}=summarizeDay(state,gardenTasks());
  return `${header(shortScheduleDate(today),'Evening lights')}
    <div class="evening-next"><h3>Tomorrow’s first task</h3><p>${firstTask?escape(firstTask.text):'No first task reserved.'}</p>
    <button type="button" class="text-button" id="recap-open-tomorrow">${firstTask?'Edit tomorrow’s plan':'Plan tomorrow'}</button></div>
    ${shutdownMarkup(today)}`;
}
function openEveningLights(){
  if(state.focusMode)toggleFocusMode();
  visitWorkspace('focus');
  positionEveningCamera();
  openPanel('evening-lights',$('[data-panel="progress"]'));
  app.classList.add('evening-view');
  render();
  const heading=$('#panel-title');heading.tabIndex=-1;heading.focus({preventScroll:true});
}
function saveShutdownSteps(form){
  const text=[...new Set(form.elements.steps.value.split(/\r?\n/).map(step=>step.trim()).filter(Boolean))];
  if(text.length>20||text.some(step=>step.length>100)){
    const error=$('#shutdown-error');error.hidden=false;error.textContent='Use up to 20 steps, with 100 characters per step.';return;
  }
  const old=state.shutdownSteps, progress=state.shutdownProgress;
  const ids=new Map(old.map(step=>[step.text,step.id]));
  state.shutdownSteps=text.map(step=>({id:ids.get(step)||crypto.randomUUID(),text:step}));
  const valid=new Set(state.shutdownSteps.map(step=>step.id));
  if(progress)state.shutdownProgress={...progress,ids:progress.ids.filter(id=>valid.has(id))};
  if(!persist()){state.shutdownSteps=old;state.shutdownProgress=progress;return;}
  refreshPanel();$('#shutdown-edit summary')?.focus();confirmChange('Shutdown steps saved.');
}
function taskCard(task,status,date,currentId,prerequisites){
  const details=[];
  if(task.date && (task.date>dayKey(date) || task.repeat==='none')){
    const day=new Date(`${task.date}T00:00:00`);
    if(!Number.isNaN(day.valueOf()))details.push(day.toLocaleDateString([],{month:'short',day:'numeric'}));
  }
  const scheduledTime=scheduledTaskTime(task,task.repeat==='none'?task.date:dayKey(date));
  if(scheduledTime){
    const [hours,minutes]=scheduledTime.split(':').map(Number);
    details.push(new Date(2000,0,1,hours,minutes).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}));
  }
  if(task.estimate)details.push(`${task.estimate} min`);
  if(task.repeat!=='none'){
    const start=new Date(`${task.date}T00:00:00`);
    details.push(task.repeat==='weekly'&&!Number.isNaN(start.valueOf())?start.toLocaleDateString([],{weekday:'long'})+'s':taskFrequencies[task.repeat]);
  }
  const selected=status==='todo'&&currentId===task.id;
  const name=escape(task.text);
  return `<li class="task-card${selected?' task-selected':''}" data-task="${escape(task.id)}" ${taskColorAttributes(task.calendarColor)} draggable="true">
    <div class="task-card-title">
      ${status==='upcoming'?'':`<input type="checkbox" class="task-check" aria-label="${status==='done'?'Reopen':'Complete'} ${name}" ${status==='done'?'checked':''}>`}
      <button type="button" class="task-open" aria-label="Edit ${name}" aria-haspopup="dialog">${name}</button>
      <button type="button" class="task-more" aria-label="Actions for ${name}" aria-haspopup="menu" aria-expanded="false">⋯</button>
    </div>
    ${task.priority?'<span class="task-priority">Priority</span>':''}
    ${task.description?`<p class="task-description">${escape(task.description)}</p>`:''}
    ${details.length?`<p class="task-meta">${escape(details.join(' · '))}</p>`:''}
    ${prerequisites.length?`<p class="task-waiting">Waiting on ${escape(prerequisites.map(item=>item.text).join(', '))}</p>`:''}
    ${status!=='done'&&task.snoozedUntil>dayKey(date)?`<p class="task-waiting">Snoozed until ${escape(shortScheduleDate(task.snoozedUntil))}</p>`:''}
    ${status==='todo'&&!prerequisites.length&&!(task.snoozedUntil>dayKey(date))?`<button type="button" class="task-active" aria-label="Focus on ${name}" aria-pressed="${selected}">${icon('target')} ${selected?'In focus':'Focus on this'}</button>`:''}
  </li>`;
}
function syncTaskBoard(){
  const collapsed=state.settings.taskBoardCollapsed;
  taskBoard.hidden=collapsed;
  $('#task-board-count').hidden=!collapsed;
  taskBoardToggle.setAttribute('aria-expanded',String(!collapsed));
}
function renderTasks(date=new Date()){
  const upcomingOpen=$('.task-upcoming')?.open;
  const groups={todo:[],done:[],upcoming:[]};
  const tasks=gardenTasks().filter(task=>!task.waitingFor);
  const queue=gardenFocusQueue(date,tasks);
  const queued=new Set(queue);
  const currentId=focusedTask(date)?.id;
  const ordered=[...queue,...tasks.filter(task=>!queued.has(task)).sort((a,b)=>taskPriority(a)-taskPriority(b))];
  const activity=new Map(state.taskActivity.map(event=>[event.id,event.at]));
  const tasksById=taskIndex();
  const visibleDone=[];
  let hasClearedDone=false;
  for(const task of ordered){
    const status=queued.has(task)?'todo':taskStatus(task,date);
    if(status==='done'){
      const id=taskCompletionId(task,date);
      const key=JSON.stringify([id,activity.get(id)??task.completedOn??'']);
      if(state.gardenClearedDone[task.id]===key){hasClearedDone=true;continue;}
      visibleDone.push([task.id,key]);
    }
    groups[status].push(taskCard(task,status,date,currentId,status==='done'?[]:unfinishedPrerequisites(task,tasksById)));
  }
  const list=group=>group.length?`<ul>${group.join('')}</ul>`:'';
  taskBoard.innerHTML=`<div class="task-columns">
    <section class="task-column"><h3>To do <span>${groups.todo.length}</span></h3>${list(groups.todo)||'<p class="task-empty">Nothing due.</p>'}</section>
    <section class="task-column"><div class="task-done-heading"><h3 id="garden-done-heading" tabindex="-1">Done <span>${groups.done.length}</span></h3>${visibleDone.length?'<button type="button" id="garden-clear-done">Clear done</button>':''}</div>
      ${list(groups.done)||`<p class="task-empty">${hasClearedDone?'Cleared tasks are in Planner.':'No completed tasks.'}</p>`}</section>
  </div>${groups.upcoming.length?`<details class="task-upcoming" ${upcomingOpen?'open':''}><summary>Upcoming <span>${groups.upcoming.length}</span></summary>${list(groups.upcoming)}</details>`:''}`;
  $('#task-board-count').textContent=`${groups.todo.length} to do`;
  syncTaskBoard();
  renderedTaskDay=dayKey(date);
  const clear=$('#garden-clear-done');
  if(clear)clear.onclick=()=>clearGardenDone(visibleDone);
}
function clearGardenDone(entries){
  const previous=state.gardenClearedDone;
  state.gardenClearedDone={...previous,...Object.fromEntries(entries)};
  if(!persist()){state.gardenClearedDone=previous;return;}
  renderTasks();
  $('#garden-done-heading').focus({preventScroll:true});
  const label=entries.length===1?'1 completed task':`${entries.length} completed tasks`;
  confirmChange(`Cleared ${label} from the Garden.`,latest=>{
    const cleared=new Map(Object.entries(latest.gardenClearedDone));
    let changed=false;
    for(const [id,key] of entries){
      if(cleared.get(id)!==key)continue;
      if(Object.hasOwn(previous,id))cleared.set(id,previous[id]);
      else cleared.delete(id);
      changed=true;
    }
    if(changed)latest.gardenClearedDone=Object.fromEntries(cleared);
    return changed;
  });
}
function openTaskEditor(id,anchor,defaults=null){
  editingTaskId=id??null;
  taskDraft=defaults;
  if(workspace==='focus')setTaskSidebar(true);
  openPanel('task-editor',anchor);
}
function openBlockEditor(id,anchor,blockId=null,defaults=null){
  editingTaskId=id;
  editingBlockId=blockId;
  blockDraft=defaults;
  openPanel('block-editor',anchor);
}

function flexibilityFields(value){
  return `<details class="schedule-flexibility" ${value?'open':''}><summary>Scheduling flexibility</summary>
    <label>Move policy<select name="flexMode">${[['automatic','Automatic'],['fixed','Keep fixed'],['flexible','Use limits below']].map(([id,label])=>
    `<option value="${id}" ${(value?.mode||'automatic')===id?'selected':''}>${label}</option>`).join('')}</select></label>
    <div class="task-editor-grid"><label>Earliest start<input type="time" name="flexEarliest" value="${escape(value?.earliest)}"></label>
    <label>Latest finish<input type="time" name="flexLatest" value="${escape(value?.latest)}"></label></div>
    <label class="flex-tomorrow"><input type="checkbox" name="flexTomorrow" ${value?.tomorrow?'checked':''}> Can move to tomorrow</label>
    <p>Fit a task today uses these limits for suggested moves. Automatic uses the existing scheduling rules.</p>
    <p data-flex-error role="alert" hidden></p></details>`;
}
function readFlexibility(form,fields){
  const mode=fields.get('flexMode'),earliest=fields.get('flexEarliest'),latest=fields.get('flexLatest');
  if(mode==='flexible'&&earliest&&latest&&earliest>=latest){
    const error=form.querySelector('[data-flex-error]');error.hidden=false;error.textContent='Latest finish must be after earliest start.';
    error.closest('details').open=true;form.elements.flexLatest.focus();return undefined;
  }
  return blockFlexibility({mode,earliest,latest,tomorrow:fields.has('flexTomorrow')});
}
function blockEditor(){
  const task=state.tasks.find(item=>item.id===editingTaskId);
  if(!task)return header('PLANNER','Task unavailable');
  const block=task.blocks?.find(item=>item.id===editingBlockId);
  return `${header('PLANNER',block?'Edit block':'Add a block')}
    <p>${escape(task.text)}</p>
    <form id="block-editor-form">
      <div class="task-editor-grid">
        <div><label class="field-label" for="block-date">Date</label><input id="block-date" name="date" type="date" value="${escape(block?.date||blockDraft?.date||task.date||dayKey())}" required></div>
        <div><label class="field-label" for="block-time">Time</label><input id="block-time" name="time" type="time" value="${escape(block?.time||blockDraft?.time||task.time||'09:00')}" required></div>
      </div>
      <label class="field-label" for="block-minutes">Duration (min)</label>
      <input id="block-minutes" name="minutes" type="number" min="1" max="1440" value="${block?.minutes||blockDraft?.minutes||task.estimate||60}" required>
      <div class="estimate-suggestion" data-estimate-suggestion hidden></div>
      ${schedulePreviewRegion()}
      ${flexibilityFields(block?.flexibility)}
      <div class="panel-actions"><button class="panel-primary" type="submit">Save block</button>${block?'<button type="button" class="text-button" id="delete-block">Remove block</button>':''}</div>
    </form>`;
}
function timerRoutines(){
  const routines=[...builtinRoutines,...state.routines];
  return `<section class="routine-section"><h3>Timer routines</h3>
    <div class="routine-list">${routines.map(routine=>`<div class="routine-row"><button type="button" data-routine="${escape(routine.id)}"><strong>${escape(routine.name)}</strong><span>${routine.phases?`${routine.phases.length} phases`:`${formatDuration(routine.focus)} / ${formatDuration(routine.rest)}`}</span></button>${routine.phases?`<button type="button" class="routine-remove" data-edit-routine="${escape(routine.id)}" aria-label="Edit ${escape(routine.name)} routine">Edit</button>`:''}${state.routines.includes(routine)?`<button type="button" class="routine-remove" data-delete-routine="${escape(routine.id)}" aria-label="Delete ${escape(routine.name)} routine">×</button>`:''}</div>`).join('')}</div>
    <form id="save-routine" class="routine-save"><label class="sr-only" for="routine-name">Routine name</label><input id="routine-name" name="name" placeholder="Name these durations" maxlength="40" required><button class="panel-primary" type="submit">Save routine</button></form>
    <button type="button" class="text-button" id="add-routine-sequence">Create a multi-phase routine</button>
  </section>`;
}

let editingRoutineId=null, fitMinutes=20, goalTimer=null;
function phaseFields(phase={name:'',mode:'focus',ms:5*60000}){
  return `<li class="routine-phase-fields">
    <label>Phase name<input name="phase-name" maxlength="40" required value="${escape(phase.name)}"></label>
    <label>Type<select name="phase-mode"><option value="focus">Focus</option><option value="break" ${phase.mode==='break'?'selected':''}>Break</option></select></label>
    <label>Minutes<input name="phase-minutes" type="number" min="1" max="180" required value="${phase.ms/60000}"></label>
    <div class="phase-actions"><button type="button" data-phase-action="up" aria-label="Move phase earlier">↑</button><button type="button" data-phase-action="down" aria-label="Move phase later">↓</button><button type="button" data-phase-action="remove">Remove</button></div>
  </li>`;
}
function routineEditor(){
  const routine=state.routines.find(item=>item.id===editingRoutineId&&item.phases);
  const phases=routine?.phases||[{name:'Focus',mode:'focus',ms:25*60000},{name:'Break',mode:'break',ms:5*60000}];
  return `${header('TIMER ROUTINES',routine?'Edit routine':'Create a routine')}
    <form id="routine-editor-form">
      <label class="field-label" for="sequence-name">Routine name</label><input id="sequence-name" name="name" maxlength="40" required value="${escape(routine?.name)}">
      <ol id="routine-phases">${phases.map(phaseFields).join('')}</ol>
      <p class="panel-subtle">Each phase is ready to start when the previous one ends.</p>
      <p id="routine-editor-error" class="event-error" role="alert" hidden></p>
      <div class="panel-actions"><button type="button" class="text-button" data-phase-action="add">Add phase</button><button class="panel-primary" type="submit">Save sequence</button></div>
    </form>`;
}
function changePhaseRows(button){
  const list=$('#routine-phases'),row=button.closest('li'),action=button.dataset.phaseAction;
  if(action==='add'&&list.children.length<12){
    list.insertAdjacentHTML('beforeend',phaseFields());
    list.lastElementChild.querySelector('input').focus();
  }else if(action==='remove'&&list.children.length>2){
    const next=row.nextElementSibling||row.previousElementSibling;
    row.remove();next.querySelector('input').focus();
  }else if(action==='up'&&row?.previousElementSibling){
    list.insertBefore(row,row.previousElementSibling);button.focus();
  }else if(action==='down'&&row?.nextElementSibling){
    list.insertBefore(row.nextElementSibling,row);button.focus();
  }
  updatePhaseButtons();
}
function updatePhaseButtons(){
  const list=$('#routine-phases'),rows=[...list.children];
  rows.forEach((row,index)=>{
    row.querySelector('[data-phase-action="up"]').disabled=index===0;
    row.querySelector('[data-phase-action="down"]').disabled=index===rows.length-1;
    row.querySelector('[data-phase-action="remove"]').disabled=rows.length<=2;
  });
  $('[data-phase-action="add"]').disabled=rows.length>=12;
}
function pendingMistakeRetry(){
  return state.history.findLast(session=>session.mode==='focus'&&session.outcome==='completed'&&
    session.mistakeId&&typeof session.mistakeResult!=='boolean'&&
    state.mistakes.some(item=>item.id===session.mistakeId&&!item.retries.some(retry=>retry.sessionId===session.id)));
}
let officeRetryId='',officeRetryResult=null;
function startOfficeRetry(id){
  officeRetryId=id;officeRetryResult=null;
  visitWorkspace('focus');
  openPanel('office-retry',currentTaskButton);
}
function officeRetryMarkup(){
  const question=state.studyQuestions.find(item=>item.id===officeRetryId);
  if(!question)return header('OFFICE HOURS','Question unavailable');
  return `${header('OFFICE HOURS','Try it myself')}
    <p class="session-context-text">${escape(question.question)}</p>
    ${question.ref?`<p class="panel-subtle">${escape(question.ref)}</p>`:''}
    ${officeRetryResult===null?`<form id="office-retry-form"><div class="panel-actions">
      <button type="submit" value="stuck" class="text-button">Still stuck</button>
      <button type="submit" value="solved" class="panel-primary">Solved independently</button></div></form>`:
      `<p role="status">${officeRetryResult?'Saved as solved independently.':'Saved as still stuck.'}</p>
      <details class="session-context"><summary>Reveal office-hours answer</summary><p class="session-context-text">${escape(question.answer)}</p></details>`}`;
}
function startMistakeFocus(id){
  checkCompletion();
  if(state.timer.id||state.timer.block||state.timer.sequence)return 'Finish or reset the current timer before starting a retry.';
  const item=state.mistakes.find(entry=>entry.id===id);
  if(!item)return 'This mistake is no longer available.';
  const task=state.tasks.find(entry=>entry.id===item.taskId);
  if(task?.waitingFor||waitingOn(task).length)return 'This task is waiting on something. Mark it ready before starting a retry.';
  const before=state.timer, bundle=state.activeBundle;
  pauseBundleForTask(task?.id);
  if(before.mode==='break')reset(state,'focus');
  state.timer={...state.timer,mistakeId:id,goal:''};
  startPause(state,Date.now(),task?.id??null);
  if(!persist()){
    state.timer=before;state.activeBundle=bundle;
    return 'Could not save the retry. Try again when storage is available.';
  }
  $('#exam-dialog').close();
  closePanel(false);
  visitWorkspace('focus');
  render();
  setTimeout(()=>timerButton.focus({preventScroll:true}),0);
  announce('Mistake retry started. The corrected reasoning is hidden until you finish.');
  return true;
}
function finishMistakeFocus(){
  checkCompletion();
  if(state.timer.mistakeId&&state.timer.id){
    const before=state.timer,length=state.history.length;
    record(state,'completed',Date.now(),{early:true});
    reset(state,'break');
    if(!persist()){state.timer=before;state.history.length=length;return;}
    resumeTaskId=before.taskSnapshot?.id||null;
    render();
  }
  if(pendingMistakeRetry())openPanel('mistake-retry',$('#review-retry'));
}
function renderSessionExtras(timer){
  const item=state.mistakes.find(entry=>entry.id===timer.mistakeId);
  const card=$('#focus-retry');
  card.hidden=workspace!=='focus'||!item;
  if(item&&card.dataset.mistake!==item.mistake){
    card.dataset.mistake=item.mistake;
    card.innerHTML=`<strong>Mistake retry</strong><p>${escape(item.mistake)}</p>`;
  }
  $('#finish-retry').hidden=!item;
  $('#review-retry').hidden=Boolean(timer.mistakeId)||!pendingMistakeRetry();
  $('#break-ideas').hidden=timer.mode!=='break';
  renderBreakSuggestion();
}
function mistakeRetryMarkup(){
  const session=pendingMistakeRetry();
  const item=state.mistakes.find(entry=>entry.id===session?.mistakeId);
  if(!item)return header('MISTAKE NOTEBOOK','No completed retry to review');
  return `${header('MISTAKE NOTEBOOK','How did the retry go?')}
    <p class="session-context-text">${escape(item.mistake)}</p>
    <details class="session-context"><summary>Reveal corrected reasoning</summary><p class="session-context-text">${escape(item.correction)}</p></details>
    <form id="mistake-retry-form" data-session="${escape(session.id)}">
      <div class="panel-actions"><button class="text-button" type="submit" value="stuck">Still stuck</button>
        <button class="panel-primary" type="submit" value="solved">Solved it</button></div>
    </form>`;
}
function warmupContext(){
  const task=focusedTask();
  const linked=task&&state.stickyNotes.find(note=>noteTaskIds(note).includes(task.id));
  const note=linked||(task?.projectId&&state.stickyNotes.find(note=>noteRelatedItems(note)
    .some(target=>target.kind==='project'&&target.id===task.projectId)));
  return `<div class="session-context warmup-context"><h3>Last handoff</h3>${hasHandoff(task)?handoffDetails(task):'<p>No handoff for this task yet.</p>'}
    <h3>Sticky note</h3>${note?`<p><strong>${escape(note.title||'Linked note')}</strong></p>
      ${note.body?`<p class="session-context-text">${escape(note.body)}</p>`:''}`:'<p>No linked note for this task yet.</p>'}</div>`;
}
let breakIdeaIndex=0;
function renderBreakSuggestion(){
  const suggestion=$('#break-suggestion');
  if(!suggestion)return;
  const ideas=state.timer.mode==='break'?breakIdeasThatFit(state.breakIdeas,Math.ceil(remaining(state)/1000)*1000):[];
  const idea=ideas[breakIdeaIndex%ideas.length];
  const copy=idea?`${idea.text} · ${idea.minutes} min`:state.timer.mode==='break'?'No saved idea fits the time left.':'Suggestions appear during rest.';
  if(suggestion.textContent!==copy)suggestion.textContent=copy;
  $('#next-break-idea').hidden=ideas.length<2;
}
function breakIdeasMarkup(){
  return `${header('REST','Break ideas')}
    <div class="session-context"><p id="break-suggestion" aria-live="polite"></p>
      <button type="button" id="next-break-idea" class="text-button" hidden>Another idea</button></div>
    <ul class="break-idea-list">${[...state.breakIdeas].sort((a,b)=>a.minutes-b.minutes).map(idea=>`<li>
      <span>${escape(idea.text)} · ${idea.minutes} min</span><button type="button" class="text-button" data-remove-break-idea="${escape(idea.id)}" aria-label="Remove ${escape(idea.text)}">Remove</button>
    </li>`).join('')}</ul>
    <form id="break-idea-form">
      <label class="field-label" for="break-idea-text">New idea</label><input id="break-idea-text" name="text" maxlength="160" required placeholder="Walk around the room">
      <label class="field-label" for="break-idea-length">Time needed</label>
      <select id="break-idea-length" name="minutes">${breakIdeaMinutes.map(minutes=>`<option value="${minutes}">${minutes} minutes</option>`).join('')}</select>
      <div class="panel-actions"><button class="panel-primary">Add idea</button></div>
    </form>`;
}
function saveBreakIdeas(ideas){
  const previous=state.breakIdeas;
  state.breakIdeas=ideas;
  if(!persist()){state.breakIdeas=previous;return false;}
  refreshPanel();renderBreakSuggestion();$('#break-idea-text')?.focus({preventScroll:true});
  return true;
}
function pendingFocusReview(){
  return state.history.findLast(item=>item.mode==='focus'&&item.outcome==='completed'&&item.goal&&!item.review);
}
function quickTaskCapture(){
  return `${header('PLANNER','Capture a task')}
    <form id="quick-task-capture-form"><label class="field-label" for="quick-task-line">Task in one line</label>
      <input id="quick-task-line" name="line" maxlength="300" placeholder="Review chapter 4 tomorrow for 30m" required>
      <div id="quick-task-details" class="calendar-resume-context" aria-live="polite" hidden></div>
      <div class="panel-actions"><button class="panel-primary" disabled>Add task</button></div>
    </form>`;
}
function updateQuickTask(form){
  const task=quickTask(form.elements.line.value,{},state.projects),preview=form.querySelector('#quick-task-details');
  preview.hidden=!task;
  form.querySelector('button').disabled=!task;
  preview.innerHTML=task?`<h3>${escape(task.text)}</h3><p>${[
    task.date&&shortScheduleDate(task.date),task.time&&timeLabel(timeMinutes(task.time)),
    task.estimate&&minutesLabel(task.estimate),task.repeat!=='none'&&taskFrequencies[task.repeat],
    task.deadline&&'Due '+shortScheduleDate(task.deadline),
    state.projects.find(item=>item.id===task.projectId)?.name,task.priority&&'P'+task.priorityLevel,...task.labels
  ].filter(Boolean).map(escape).join(' · ')||'Inbox · No date or duration'}</p>`:'';
}
function focusSetupsMarkup(){
  const routine=[...builtinRoutines,...state.routines];
  const options=items=>items.map(item=>`<option value="${escape(item.id)}">${escape(item.name)}</option>`).join('');
  return `${header('FOCUS','Focus setups')}
    ${state.focusSetups.length?`<div class="routine-list">${state.focusSetups.map(item=>{
      const parts=[routine.find(entry=>entry.id===item.routineId)?.name||'Unavailable routine',
        state.gardenLayouts.find(entry=>entry.id===item.layoutId)?.name||'Current Garden',
        state.soundtracks.find(entry=>entry.id===item.soundtrackId)?.name].filter(Boolean);
      return `<div class="routine-row"><button type="button" data-start-focus-setup="${escape(item.id)}"><strong>${escape(item.name)}</strong><span>${parts.map(escape).join(' · ')}</span></button></div>`;
    }).join('')}</div>`:''}
    <form id="focus-setup-form">
      <label class="field-label" for="focus-setup-name">Setup name</label><input name="name" id="focus-setup-name" maxlength="70" required>
      <label class="field-label" for="focus-setup-routine">Timer routine</label><select name="routineId" id="focus-setup-routine">${options(routine)}</select>
      <label class="field-label" for="focus-setup-layout">Garden layout</label><select name="layoutId" id="focus-setup-layout"><option value="">Current Garden</option>${options(state.gardenLayouts)}</select>
      <label class="field-label" for="focus-setup-soundtrack">Soundtrack</label><select name="soundtrackId" id="focus-setup-soundtrack"><option value="">Keep current audio</option>${options(state.soundtracks)}</select>
      <div class="panel-actions"><button class="panel-primary">Save setup</button></div>
    </form>`;
}
function startFocusSetup(id){
  checkCompletion();
  if(state.timer.id){toast('Finish or reset the current timer before starting a setup.');return;}
  const setup=state.focusSetups.find(item=>item.id===id);
  const routine=setup&&[...builtinRoutines,...state.routines].find(item=>item.id===setup.routineId);
  const layout=setup&&state.gardenLayouts.find(item=>item.id===setup.layoutId);
  const soundtrack=setup&&state.soundtracks.find(item=>item.id===setup.soundtrackId);
  if(!routine||setup.layoutId&&!layout||setup.soundtrackId&&!soundtrack){
    toast('A routine, layout, or soundtrack used by this setup is unavailable.');return;
  }
  const {timer,mediaSource,spotify,youtube}=state;
  const phases=routine.phases||[{name:'Focus',mode:'focus',ms:routine.focus},{name:'Rest',mode:'break',ms:routine.rest}];
  loadRoutinePhase(state,{name:routine.name,phases,...(layout?{setupLayoutId:layout.id}:{})});
  startPause(state,Date.now(),focusedTask()?.id);
  if(soundtrack){
    state.mediaSource=soundtrack.source;
    state[soundtrack.source]=soundtrack.link;
  }
  if(!persist()){Object.assign(state,{timer,mediaSource,spotify,youtube});return;}
  snapshotLayoutId='';snapshotThrough='';renderedGardenGrowth=null;updateGardenSnapshotLabel();
  closePanel(false);render();wake();
  if(soundtrack){
    if($('#music-panel')&&(mediaSource!==soundtrack.source||({spotify,youtube})[soundtrack.source]!==soundtrack.link))mountMedia();
    openPanel('music',mediaPanelAnchor());
  }else timerButton.focus({preventScroll:true});
  toast(`${setup.name} started.`);
}
function unfinishedFocus(){
  const tasks=new Map(gardenTasks().map(task=>[task.id,task]));
  return incompleteFocusSessions(state.history).flatMap(session=>{
    const task=tasks.get(session.taskId);
    if(!task||task.done||taskStatus(task,new Date(session.finishedAt))==='done')return [];
    return [{session,task}];
  });
}
function incompleteFocusMarkup(){
  const entries=unfinishedFocus();
  const ready=new Set(gardenFocusQueue().map(task=>task.id));
  return `${header('FOCUS','Incomplete sessions')}
    ${entries.length?`<div class="incomplete-session-list">${entries.map(({session,task})=>{
      const handoff=session.nextHandoff||sessionHandoff(task)||session.startHandoff;
      return `<section class="calendar-resume-context">
        <h3>${escape(task.text)}</h3><p>${escape(extensionTime(session.finishedAt))} · ${formatDuration(session.focusMs)} focused</p>
        ${handoff?handoffDetails(handoff):'<p>No stopping point was saved.</p>'}
        ${session.review?.next?`<p>${escape(session.review.next)}</p>`:''}
        <div class="panel-actions"><button type="button" data-incomplete-action="resume" data-session-id="${escape(session.id)}" ${state.timer.id||!ready.has(task.id)?'disabled':''}>Resume</button>
          <button type="button" data-incomplete-action="schedule" data-session-id="${escape(session.id)}">Reschedule</button>
          <button type="button" data-incomplete-action="close" data-session-id="${escape(session.id)}">Close out</button></div>
      </section>`;
    }).join('')}</div>`:'<p>No incomplete focus sessions to review.</p>'}`;
}
function actOnIncomplete(id,action,anchor){
  checkCompletion();
  const entry=unfinishedFocus().find(item=>item.session.id===id);
  if(!entry){refreshPanel();return;}
  const {session,task}=entry;
  const minutes=Math.min(1440,Math.max(1,Math.ceil((session.remainingMs||0)/60000)||
    Math.max(0,(task.estimate||0)-Math.floor(session.focusMs/60000))||Math.round(state.settings.focus)));
  if(action==='schedule'){
    const date=new Date();
    date.setMinutes(Math.floor(date.getMinutes()/30)*30+30,0,0);
    openBlockEditor(task.id,lastAnchor||anchor,null,{date:dayKey(date),time:timeValue(date.getHours()*60+date.getMinutes()),minutes,incompleteSessionId:id});
    return;
  }
  const previous=state.history,originalTimer=state.timer;
  const {activeTask,activeTaskDay,activeBundle,tasks}=state;
  if(action==='resume'){
    if(state.timer.id||!gardenFocusQueue().some(item=>item.id===task.id))return;
    if(state.timer.sequence)reset(state,'focus');
    const savedHandoff=sessionHandoff(session.nextHandoff||session.startHandoff);
    const resume=!sessionHandoff(task)&&savedHandoff?{...task,...savedHandoff}:task;
    if(resume!==task)state.tasks=tasks.map(item=>item===task?resume:item);
    selectTaskForTimer(resume,minutes);
    toggleFocusTimer(resume);
  }
  state.history=previous.map(item=>item.id===id?{...item,followUp:action==='resume'?'resumed':'closed'}:item);
  if(!persist()){Object.assign(state,{history:previous,timer:originalTimer,activeTask,activeTaskDay,activeBundle,tasks});return;}
  if(action==='resume'){closePanel(false);refreshTasks();timerButton.focus({preventScroll:true});}
  else{
    refreshPanel();
    confirmChange('Session closed out. The task remains open.',latest=>{
      const current=latest.history.find(item=>item.id===id);
      if(current?.followUp!=='closed')return false;
      delete current.followUp;return true;
    });
  }
}
function focusReviewMarkup(){
  const session=pendingFocusReview();
  if(!session)return header('FOCUS','No outcomes to review');
  return `${header('FOCUS COMPLETE','Review your outcome')}
    <p>${escape(session.goal)}</p>
    ${session.taskTitle?`<p class="panel-subtle">${escape(session.taskTitle)}</p>`:''}
    <form id="focus-review-form" data-session="${escape(session.id)}">
      <fieldset class="focus-review-choices"><legend>How far did you get?</legend>
        <label><input type="radio" name="result" value="reached" required> Reached</label>
        <label><input type="radio" name="result" value="partial" required> Partial</label>
      </fieldset>
      <label class="field-label" for="focus-review-next">Next step</label><textarea id="focus-review-next" name="next" rows="3" maxlength="500"></textarea>
      <div class="panel-actions"><button type="button" class="text-button close-panel">Later</button><button class="panel-primary" type="submit">Save review</button></div>
    </form>`;
}
function focusReviewDetails(session){
  if(!session.goal)return '';
  if(session.outcome==='skipped')return '<small class="session-review-detail">'+escape(session.goal)+'</small>';
  const result=session.review?.result==='reached'?'Reached':session.review?.result==='partial'?'Partial':'Ready to review';
  return `<small class="session-review-detail">${escape(session.goal)} · ${result}${session.review?.next?`<br>Next: ${escape(session.review.next)}`:''}</small>`;
}
let fitEnergy='';
function energyOptions(value,emptyLabel){
  return `<option value="">${emptyLabel}</option>${Object.entries(taskEnergyLevels).map(([key,label])=>
    `<option value="${key}" ${key===value?'selected':''}>${label}</option>`).join('')}`;
}
function fitTaskResults(minutes){
  if(!Number.isInteger(minutes)||minutes<1||minutes>1440)return '<p>Enter the minutes you have available.</p>';
  const tasks=tasksWithinTime(gardenFocusQueue(),minutes,fitEnergy,true);
  const locked=state.timer.block||state.timer.sequence||state.timer.mistakeId||state.timer.mode==='focus'&&state.timer.id;
  if(!tasks.length)return `<p>No ready tasks fit this window${fitEnergy?' and energy level':''}.</p>`;
  return `${locked?'<p>Finish or reset the current focus timer to choose a different task.</p>':''}
    <ul class="fit-task-results">${tasks.map(task=>`<li><button type="button" data-fit-task="${escape(task.id)}" ${locked?'disabled':''}><strong>${escape(task.text)}</strong><small>${fitTimeLabel(task,minutes)} · P${taskPriority(task)}${task.energy?` · ${taskEnergyLevels[task.energy]}`:''}</small></button></li>`).join('')}</ul>`;
}
function fitTimeLabel(task,available){
  const {minutes,partial}=taskTimeFit(task,available,true);
  return partial?`${minutes} min for a useful start${task.estimate?` · ${task.estimate} min total`:''}`:`${minutes} min`;
}

function classFitLocked(){
  const {id,block,sequence,mistakeId}=state.timer;
  return Boolean(id||block||sequence||mistakeId);
}
function classFitResults(buffer,now=new Date()){
  if(!Number.isInteger(buffer)||buffer<0||buffer>180)return '<p>Enter a preparation buffer from 0 to 180 minutes.</p>';
  const window=calendarFocusWindow(state.calendarEvents,buffer,now);
  if(!window)return '<p>No timed commitment in the next seven days. Use Find a task by time to set your own window.</p>';
  const {event,ongoing,minutes}=window;
  const date=new Date(event.start);
  const time=date.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  const when=dayKey(date)===dayKey(now)?time:`${shortScheduleDate(dayKey(date))} · ${time}`;
  if(ongoing)return `<p><strong>${escape(event.title)}</strong> is on your calendar now.</p>`;
  const tasks=focusWindowTasks(gardenFocusQueue(now),minutes),locked=classFitLocked();
  return `<p><strong>${escape(event.title)}</strong> starts ${escape(when)}.</p><p>${minutesLabel(minutes)} available after your preparation buffer.</p>
    ${locked?'<p>Finish or reset the current timer to start another task.</p>':''}
    ${tasks.length?`<ul class="fit-task-results">${tasks.map(task=>`<li><button type="button" data-class-fit-task="${escape(task.id)}" ${locked?'disabled':''}>
      <strong>${escape(task.text)}</strong><small>Start focus · ${fitTimeLabel(task,minutes)}</small></button></li>`).join('')}</ul>`:'<p>No ready tasks fit this window.</p>'}`;
}
function updateClassFitResults(){
  const field=$('#class-buffer'),results=$('#class-fit-results');
  if(!field||!results)return;
  const content=classFitResults(field.valueAsNumber);
  if(results.dataset.markup!==content){results.innerHTML=content;results.dataset.markup=content;}
}
function startClassFitTask(id,buffer){
  checkCompletion();
  const now=new Date();
  if(classFitLocked()||!Number.isInteger(buffer)||buffer<0||buffer>180)return;
  const slot=calendarFocusWindow(state.calendarEvents,buffer,now);
  const task=slot&&!slot.ongoing&&focusWindowTasks(gardenFocusQueue(now),slot.minutes).find(item=>item.id===id);
  if(!task){updateClassFitResults();toast('The available time changed. Pick a task that still fits.');return;}
  const {activeTask,activeTaskDay,activeBundle,timer}=state,oldBuffer=state.settings.classBuffer;
  state.activeTask=task.id;state.activeTaskDay=dayKey(now);pauseBundleForTask(task.id);
  state.settings.classBuffer=buffer;
  startTaskTiming(state,task.id,taskTimeFit(task,slot.minutes,true).minutes);
  toggleFocusTimer(task,+now);
  if(!persist()){
    Object.assign(state,{activeTask,activeTaskDay,activeBundle,timer});state.settings.classBuffer=oldBuffer;return;
  }
  closePanel(false);refreshTasks();timerButton.focus({preventScroll:true});announce(`Focus started for ${task.text}.`);
}

function availableCaptures(){
  let notes=[];
  try{notes=readCaptures(storage);}catch{ /* Storage may be unavailable. */ }
  const processed=new Set(state.processedCaptures);
  return [...notes,...nativeNotes].filter(note=>!processed.has(note.key)).sort((a,b)=>b.createdAt-a.createdAt);
}
function currentCaptureContext(){
  const now=new Date(),task=focusedTask(now);
  if(!task)return;
  const timer=state.timer;
  let block=timer.mode==='focus'&&(timer.block||timer.calendarBlock);
  if(!block){
    const active=calendarBlocks([task],now).filter(item=>{
      const slot=calendarTaskBlock(task,item.blockId,item.occurrence);
      return openFocusBlock(item)&&slot?.start<=now&&slot.end>now;
    });
    if(active.length===1)block=active[0];
  }
  const slot=block&&calendarTaskBlock(task,block.blockId,block.occurrence);
  return cleanCaptureContext({taskId:task.id,title:task.text,block:slot&&{occurrence:block.occurrence,blockId:block.blockId,
    time:timeValue(slot.start.getHours()*60+slot.start.getMinutes())}});
}
window.yinYangCaptureContext=()=>activePanel==='capture'?activeCaptureContext:currentCaptureContext();

function captureContextText(context){
  const cleaned=cleanCaptureContext(context);
  if(!cleaned)return '';
  const {title,block}=cleaned;
  return block?`${title} · ${shortScheduleDate(block.occurrence)} at ${timeLabel(timeMinutes(block.time))}`:title;
}
function captureContextMarkup(context){
  const label=captureContextText(context);
  return label?`<small class="captured-context">Captured during ${escape(label)}</small>`:'';
}
function captureCards(inbox=false){
  return availableCaptures().map(note=>`<article class="capture-card" data-capture-key="${escape(note.key)}"><p>${escape(note.text)}</p>
    ${captureContextMarkup(note.context)}
    ${inbox?`<time>${new Date(note.createdAt).toLocaleString([],{dateStyle:'medium',timeStyle:'short'})}</time>`:''}
    <div class="capture-actions"><button type="button" data-capture-action="task">Make a task</button>
    <button type="button" data-capture-action="project">Attach to project</button>${inbox?'<button type="button" data-capture-action="link">Link to a task</button>':''}
    <button type="button" data-capture-action="notes">${inbox?'File as sticky note':'Quick Notes'}</button>
    <button type="button" data-capture-action="archive">Archive</button></div></article>`).join('');
}
function saveCaptureDestination(key,change,revert){
  change();
  state.processedCaptures.push(key);
  if(!persist()){state.processedCaptures.pop();revert();return false;}
  renderCaptures();
  return true;
}
function renderCaptures(){
  const cards=captureCards();
  $('#captured-notes').hidden=!cards;
  $('#captured-list').innerHTML=cards;
  const notesPanel=$('#notes-captures');
  if(notesPanel)notesPanel.innerHTML=cards;
  const inbox=$('#capture-inbox-list');
  if(inbox)inbox.innerHTML=captureInboxList();
  const button=$('#open-capture-inbox');
  if(button){const count=availableCaptures().length;button.textContent=count?`Note inbox (${count})`:'Note inbox';}
}

function openCaptureInbox(resetTab=true){
  if(resetTab){captureInboxTab='inbox';captureInboxIndex=0;}
  openPanel('capture-inbox',$('#open-capture-inbox'));
}
function captureInboxList(){
  if(captureInboxTab==='inbox')return captureCards(true)||'<p>Your note inbox is clear.</p>';
  return [...state.captureArchive].sort((a,b)=>b.archivedAt-a.archivedAt).map(note=>
    `<article class="capture-card" data-capture-key="${escape(note.key)}"><p>${escape(note.text)}</p>${captureContextMarkup(note.context)}<div class="capture-actions">
    <button type="button" data-restore-capture="${escape(note.key)}">Return to inbox</button></div></article>`).join('')||'<p>No archived thoughts.</p>';
}
function archiveCapture(note){
  const previous=state.captureArchive;
  if(saveCaptureDestination(note.key,()=>{state.captureArchive=[...previous,{...note,archivedAt:Date.now()}];},()=>{state.captureArchive=previous;})){
    confirmChange('Thought archived.');return true;
  }
  return false;
}
function restoreCapture(key){
  const note=state.captureArchive.find(item=>item.key===key);
  if(!note)return;
  let newKey;
  try{newKey=storeCapture(storage,note);}catch{confirmChange('Could not return the thought to the inbox.');return;}
  const previous=state.captureArchive;
  state.captureArchive=previous.filter(item=>item!==note);
  if(!persist()){state.captureArchive=previous;storage.removeItem(newKey);return;}
  renderCaptures();confirmChange('Thought returned to the inbox.');
}
function captureInboxFocus(){
  const cards=[...root.querySelectorAll('#capture-inbox-list .capture-card')];
  captureInboxIndex=Math.max(0,Math.min(captureInboxIndex,cards.length-1));
  const target=cards[captureInboxIndex]?.querySelector('button')||$('[data-capture-inbox-tab][aria-pressed="true"]');
  target?.focus({preventScroll:true});
  cards[captureInboxIndex]?.scrollIntoView({block:'nearest'});
}
function captureInboxShortcut(event){
  if(activePanel!=='capture-inbox'||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||
    event.target.closest('input,textarea,select,[contenteditable]'))return false;
  const key=event.key.toLowerCase(), action={f:'notes',l:'link',a:'archive'}[key];
  if(!action&&!['n','p'].includes(key))return false;
  const cards=[...root.querySelectorAll('#capture-inbox-list .capture-card')];
  const focused=cards.indexOf(event.target.closest('.capture-card'));
  if(key==='n'||key==='p'){
    captureInboxIndex=focused===-1?(key==='p'?cards.length-1:0):focused+(key==='n'?1:-1);
    captureInboxFocus();
  }else if(captureInboxTab==='inbox'&&focused!==-1&&!event.repeat){
    cards[focused].querySelector(`[data-capture-action="${action}"]`)?.click();
  }
  event.preventDefault();return true;
}
function finishCaptureFiling(message){
  const reopen=returnToCaptureInbox;
  returnToCaptureInbox=false;
  if(reopen){openCaptureInbox(false);captureInboxFocus();}
  else closePanel();
  confirmChange(message);
}
async function syncNativeCaptures(){
  if(adminSandbox||!captureApiAvailable||syncingCaptures||!['localhost','127.0.0.1','yin-and-yang.local'].includes(location.hostname))return;
  syncingCaptures=true;
  try{
    const response=await fetch('./api/capture-inbox',{cache:'no-store'});
    if(response.status===404){captureApiAvailable=false;return;}
    if(!response.ok)return;
    const notes=await response.json();
    if(!Array.isArray(notes))return;
    const next=notes.filter(note=>note&&typeof note.text==='string'&&Number.isFinite(note.createdAt)&&/^[a-f0-9]{32}$/.test(note.id)).map(note=>({text:note.text,createdAt:note.createdAt,key:`native:${note.id}`}));
    if(JSON.stringify(next)!==JSON.stringify(nativeNotes)){nativeNotes=next;renderCaptures();}
  }catch{ /* The app keeps working while the local server reconnects. */ }
  finally{syncingCaptures=false;}
}
function taskDependencies(values){
  const selected=new Set(values.prerequisiteIds || []);
  const tasks=state.tasks.filter(task=>task.id!==values.id);
  tasks.sort((a,b)=>Number(selected.has(b.id))-Number(selected.has(a.id)) ||
    Number(a.done)-Number(b.done) || a.text.localeCompare(b.text));
  return `<details class="task-detail-property task-dependencies" ${selected.size?'open':''}>
    <summary>Waiting on${selected.size?` <small>· ${selected.size}</small>`:''}</summary>
    ${tasks.length?`<label class="sr-only" for="prerequisite-search">Find prerequisite tasks</label>
      <input type="search" id="prerequisite-search" placeholder="Find a task…">
      <div class="prerequisite-options">${tasks.map(task=>`<label data-prerequisite-name="${escape(task.text.toLowerCase())}">
        <input type="checkbox" name="prerequisite" value="${escape(task.id)}" ${selected.has(task.id)?'checked':''}>
        <span>${escape(task.text)}</span></label>`).join('')}</div>
      <p id="prerequisite-no-results" hidden>No matching tasks.</p>`:'<p>Add another task to set a prerequisite.</p>'}
    <p>Garden queues this task after its prerequisites are completed.</p>
    <p class="event-error" id="prerequisite-error" role="alert" hidden></p>
  </details>`;
}
function templateOptions(){
  return '<option value="">Choose a template</option>'+state.taskTemplates.map(template=>
    `<option value="${escape(template.id)}">${escape(template.name)}</option>`).join('');
}
function taskTemplateFields(isNew){
  return `<details class="task-detail-section task-templates"><summary>Task templates</summary>
    ${isNew?`<label class="field-label" for="task-template">Saved templates</label><select id="task-template">${templateOptions()}</select>
      <div class="panel-actions"><button type="button" data-template-action="apply" disabled>Use template</button>
        <button type="button" data-template-action="remove" disabled>Remove template</button></div>`:''}
    <label class="field-label" for="task-template-name">Template name</label>
    <input id="task-template-name" maxlength="100" placeholder="Use the task name">
    <button type="button" class="text-button" data-template-action="save">Save as template</button>
    <p class="event-error" id="task-template-error" role="alert" hidden></p>
    <p id="task-template-status" role="status"></p>
  </details>`;
}
function taskLabels(text){
  return [...new Set(text.split(',').map(label=>label.trim().replace(/^[@%]/,'').slice(0,40)).filter(Boolean))];
}
function editTaskTemplate(button){
  const form=button.form, fields=form.elements;
  const picker=$('#task-template'), status=$('#task-template-status'), error=$('#task-template-error');
  const selected=state.taskTemplates.find(template=>template.id===picker?.value);
  error.hidden=true;status.textContent='';
  const action=button.dataset.templateAction;
  if(action==='apply'&&selected){
    if(!fields.title.value.trim())fields.title.value=selected.name;
    if(!fields.description.value.trim())fields.description.value=selected.description;
    if(!fields.estimate.value&&selected.estimate)fields.estimate.value=selected.estimate;
    const labels=[...new Set([...taskLabels(fields.labels.value),...selected.labels])].join(', ');
    fields.labels.maxLength=Math.max(240,labels.length);
    fields.labels.value=labels;
    const subtasks=[...new Set([...fields.subtasks.value.split('\n').map(line=>line.trim()).filter(Boolean),...selected.subtasks])].join('\n');
    fields.subtasks.maxLength=Math.max(2000,subtasks.length);
    fields.subtasks.value=subtasks;
    fields.title.setCustomValidity('');
    updateScheduleEditor(form);
    status.textContent='Template added to this draft.';
    return;
  }
  const prior=state.taskTemplates;
  let template;
  if(action==='save'){
    const name=$('#task-template-name').value.trim()||fields.title.value.replace(/\s+/g,' ').trim().slice(0,100);
    template=taskTemplate({
      id:crypto.randomUUID(),name,description:fields.description.value,
      labels:taskLabels(fields.labels.value),estimate:Number(fields.estimate.value),
      subtasks:[...[...form.querySelectorAll('input[name^="sub:"]')].map(input=>input.value),...fields.subtasks.value.split('\n')]
    });
    if(!template||prior.some(item=>item.name.toLowerCase()===template.name.toLowerCase())){
      error.textContent=template?'A template already uses that name.':'Enter a name for the template.';
      error.hidden=false;$('#task-template-name').focus();return;
    }
    state.taskTemplates=[...prior,template];
  }else if(action==='remove'&&selected){
    state.taskTemplates=prior.filter(item=>item!==selected);
  }else return;
  if(!persist()){state.taskTemplates=prior;return;}
  if(picker){
    picker.innerHTML=templateOptions();
    picker.value=template?.id||'';
    updateTemplateButtons(picker);
    if(action==='remove')picker.focus();
  }
  status.textContent=template?'Template saved.':'Template removed.';
}
function updateTemplateButtons(picker){
  for(const button of picker.form.querySelectorAll('[data-template-action="apply"],[data-template-action="remove"]')){
    button.disabled=!picker.value;
  }
}
function taskEditor(){
  const task=state.tasks.find(item=>item.id===editingTaskId);
  const values=task||taskDraft||{};
  const options=Object.entries(taskFrequencies).map(([value,label])=>`<option value="${value}" ${values.repeat===value?'selected':''}>${label}</option>`).join('');
  const projects=state.projects.filter(project=>!project.archived||project.id===values.projectId);
  const projectName=projects.find(project=>project.id===values.projectId)?.name||'Inbox';
  const projectOptions=projects.map(project=>`<option value="${escape(project.id)}" ${project.id===values.projectId?'selected':''}>${escape(project.name)}</option>`).join('');
  const subtasks=task?.subtasks||[];
  const split=taskSplitSuggestion(state,task);
  const retryCount=task?state.mistakes.filter(item=>item.taskId===task.id&&needsRetry(item)).length:0;
  const reminder=task?.reminderAt?`${dayKey(new Date(task.reminderAt))}T${new Date(task.reminderAt).toTimeString().slice(0,5)}`:'';
  const day=taskEditorOccurrence();
  const canComplete=task&&(task.repeat==='none'||taskOccursOn(task,day));
  const done=canComplete&&taskStatus(task,day)==='done';
  const labels=[...new Set([...state.plannerLabels,...state.tasks.flatMap(item=>item.labels||[])])];
  return `${header(escape(projectName),task?'Edit task':'Add task')}
    <form id="task-editor-form">
      <div class="task-detail-grid">
        <div class="task-detail-main">
          <div class="task-detail-title">
            ${canComplete?`<button class="task-detail-check" id="task-detail-complete" type="button" aria-pressed="${done}" aria-label="${done?'Reopen task':'Complete task'}">${done?'✓':''}</button>`:''}
            <label class="sr-only" for="task-title">Task name</label>
            <textarea id="task-title" name="title" rows="2" maxlength="${Math.max(300,values.text?.length||0)}" placeholder="Task name" required>${escape(values.text)}</textarea>
          </div>
          <div class="task-calendar-options">
            <label class="task-important"><input type="checkbox" id="task-important" name="important" ${taskPriority(values)===1?'checked':''}> Important</label>
            <label class="task-calendar-color" for="task-calendar-color">Task color
              <span class="task-color-swatch" ${taskColorAttributes(values.calendarColor)} aria-hidden="true"></span>
              <select id="task-calendar-color" name="calendarColor"><option value="">Default</option>${Object.entries(taskCalendarColors).map(([key,label])=>
                `<option value="${key}" ${values.calendarColor===key?'selected':''}>${label}</option>`).join('')}<option value="custom" ${customCalendarColor(values.calendarColor)?'selected':''}>Custom</option></select>
            </label></div>
          ${customColorFields(values.calendarColor,!customCalendarColor(values.calendarColor))}
          ${taskTemplateFields(!task)}
          <label class="field-label" for="task-description">Description</label>
          <textarea id="task-description" name="description" rows="3" maxlength="2000" placeholder="Add a description…">${escape(values.description)}</textarea>
          <label class="field-label" for="task-resume">Next step</label><textarea id="task-resume" name="resumeNote" rows="2" maxlength="500" placeholder="Pick up here next time…">${escape(values.resumeNote)}</textarea>
          ${handoffFields(values)}
          ${task?`<button class="text-button task-mistake-link" type="button" data-task-mistakes aria-haspopup="dialog">${retryCount?`Mistake notebook · ${retryCount} to retry`:'Mistake notebook'}</button>`:''}
          <section class="task-detail-section" aria-labelledby="task-subtask-heading">
            <h3 id="task-subtask-heading">Subtasks ${subtasks.length?`<small>${subtasks.filter(sub=>sub.done).length}/${subtasks.length}</small>`:''}</h3>
            ${subtasks.map(sub=>`<div class="task-editor-subtask"><input type="checkbox" name="done:${escape(sub.id)}" aria-label="Complete ${escape(sub.text)}" ${sub.done?'checked':''}><input name="sub:${escape(sub.id)}" aria-label="Edit subtask ${escape(sub.text)}" maxlength="160" value="${escape(sub.text)}">
              ${rubricPoints(sub.points)!==null?`<span class="rubric-points">${rubricPoints(sub.points)} pts</span>`:''}</div>`).join('')}
            <p data-rubric-progress>${rubricSummary(subtasks)}</p>
            <details class="task-rubric"><summary>Import rubric</summary><label>Rubric items<textarea name="rubricText" rows="4" maxlength="12000" placeholder="Analysis | 25&#10;Citations (10 pts)"></textarea></label>
              <button type="button" data-preview-rubric>Preview items</button><div data-rubric-preview></div></details>
            <label class="sr-only" for="task-subtasks">Add subtasks, one per line</label>
            ${split?`<aside class="split-hint"><strong>Try smaller sessions</strong><p>${split.reason} Try ${split.count} parts of about ${split.minutes} minutes.</p><button type="button" class="text-button" data-draft-parts="${split.count}" data-part-minutes="${split.minutes}">Draft subtasks</button></aside>`:''}
            <textarea id="task-subtasks" name="subtasks" rows="2" maxlength="2000" placeholder="+ Add subtasks, one per line"></textarea>
          </section>
          <section class="task-detail-section" aria-labelledby="task-comment-heading">
            <h3 id="task-comment-heading">Comments</h3>
            ${(task?.comments||[]).map(comment=>`<div class="task-editor-comment"><time>${escape(new Date(comment.at).toLocaleString())}</time><p>${escape(comment.text)}</p></div>`).join('')}
            <label class="sr-only" for="task-comment">Add a comment</label>
            <textarea id="task-comment" name="comment" rows="2" maxlength="2000" placeholder="Leave a comment…"></textarea>
          </section>
        </div>
        <div class="task-detail-properties" aria-label="Task properties">
          <div class="task-detail-property task-editor-grid">
            <div><label class="field-label" for="task-project">Project</label><select id="task-project" name="projectId"><option value="">Inbox</option>${projectOptions}</select></div>
            <div><label class="field-label" for="task-section">Section</label><select id="task-section" name="sectionId">${taskSectionOptions(values.projectId,values.sectionId)}</select></div>
          </div>
          <fieldset class="task-detail-property task-detail-schedule">
            <legend>Schedule</legend>
            <div class="task-editor-grid">
              <div><label class="field-label" for="task-date">Date</label><input id="task-date" name="date" type="date" value="${escape(values.date)}"></div>
              <div><label class="field-label" for="task-time">Time</label><input id="task-time" name="time" type="time" value="${escape(values.time)}"></div>
            </div>
            <div class="task-editor-grid">
              <div><label class="field-label" for="task-repeat">Repeat</label><select id="task-repeat" name="repeat" aria-describedby="task-repeat-hint">${options}</select></div>
              <div><label class="field-label" for="task-estimate">Estimate (min)</label><input id="task-estimate" name="estimate" type="number" min="1" max="1440" step="1" value="${values.estimate??''}" placeholder="60"></div>
              <div><label class="field-label" for="task-minimum-useful">Minimum useful (min)</label><input id="task-minimum-useful" name="minimumUsefulMinutes" type="number" min="1" max="1440" step="1" value="${values.minimumUsefulMinutes??''}" placeholder="Optional"></div>
              <div><label class="field-label" for="task-energy">Energy</label><select id="task-energy" name="energy">${energyOptions(values.energy,'Not set')}</select></div>
            </div>
            <div class="estimate-suggestion" data-estimate-suggestion hidden></div>
            <p id="task-repeat-hint" ${values.repeat&&values.repeat!=='none'?'':'hidden'}>The date sets the first occurrence. Leave it blank to start today.</p>
            <div id="task-interval-field" ${values.repeat==='interval'?'':'hidden'}><label class="field-label" for="task-interval">Days between occurrences</label><input id="task-interval" name="repeatEvery" type="number" min="2" max="365" value="${values.repeatEvery||2}" ${values.repeat==='interval'?'':'disabled'}></div>
            ${schedulePreviewRegion()}
            ${flexibilityFields(values.flexibility)}
          </fieldset>
          <div class="task-detail-property">
            <label class="field-label" for="task-deadline">Deadline</label><input id="task-deadline" name="deadline" type="date" value="${escape(values.deadline)}">
            <button type="submit" value="plan-deadline" id="task-plan-deadline" class="text-button" hidden>Save and plan to deadline</button>
          </div>
          ${taskDependencies(values)}
          <div class="task-detail-property"><label class="field-label" for="task-waiting-for">Waiting for</label>
            <input id="task-waiting-for" name="waitingFor" maxlength="200" value="${escape(values.waitingFor?.subject)}" placeholder="Person, reply, or material">
            <label class="field-label" for="task-follow-up">Follow up on</label>
            <input id="task-follow-up" name="followUp" type="date" value="${escape(values.waitingFor?.followUp)}">
            <label class="field-label" for="task-decision-date">Decide on</label>
            <input id="task-decision-date" name="decisionOn" type="date" value="${escape(values.waitingFor?.decisionOn)}">
            <label class="field-label" for="task-fallback">Fallback if still waiting</label>
            <textarea id="task-fallback" name="fallback" rows="2" maxlength="500" placeholder="Use dataset B">${escape(values.waitingFor?.fallback)}</textarea>
            <p>Planner will surface your fallback on the decision date.</p></div>
          <div class="task-detail-property"><label class="field-label" for="task-snooze">Snooze until</label>
            <input id="task-snooze" name="snoozedUntil" type="date" value="${escape(values.snoozedUntil)}">
            <p>Leave blank to keep this task in the focus queue when it’s ready.</p></div>
          <div class="task-detail-property">
            <label class="field-label" for="task-priority">Priority</label><select id="task-priority" name="priorityLevel">${[1,2,3,4].map(level=>`<option value="${level}" ${level===taskPriority(values)?'selected':''}>${level===1?'P1 · Important':level===4?'P4 · Normal':`P${level}`}</option>`).join('')}</select>
          </div>
          <div class="task-detail-property">
            <label class="field-label" for="task-labels">Labels</label><input id="task-labels" name="labels" list="task-label-options" maxlength="240" value="${escape(values.labels?.join(', '))}" placeholder="reading, homework">
            <datalist id="task-label-options">${labels.map(label=>`<option value="${escape(label)}"></option>`).join('')}</datalist>
          </div>
          <div class="task-detail-property">
            <label class="field-label" for="task-reminder">Reminder</label><input id="task-reminder" name="reminder" type="datetime-local" aria-describedby="task-reminder-hint" value="${escape(reminder)}">
            <p id="task-reminder-hint">Shown while the app is open.</p>
          </div>
        </div>
      </div>
      <footer class="panel-actions task-detail-footer">${task?'<button type="button" class="text-button" id="delete-task">Delete task</button>':''}${task&&workspace==='calendar'?'<button type="button" class="text-button" data-convert-calendar-task>Change entry type</button>':''}<button class="panel-primary" type="submit">Save task</button></footer>
    </form>`;
}
function taskOccurrence(anchor){
  const data=anchor?.closest('[data-occurrence]')?.dataset;
  const key=data?.taskDay||data?.occurrence;
  return key?new Date(`${key}T00:00:00`):new Date();
}
function taskEditorOccurrence(){return taskOccurrence(lastAnchor);}
function updateTaskCompletionButton(){
  const button=$('#task-detail-complete'),task=state.tasks.find(item=>item.id===editingTaskId);
  if(!button||!task)return;
  const done=taskStatus(task,taskEditorOccurrence())==='done';
  button.setAttribute('aria-pressed',String(done));
  button.setAttribute('aria-label',done?'Reopen task':'Complete task');
  button.textContent=done?'✓':'';
}

function taskSectionOptions(projectId,current){
  const sections=state.projects.find(project=>project.id===projectId)?.sections||[];
  return '<option value="">No section</option>'+sections.map(section=>`<option value="${escape(section.id)}" ${section.id===current?'selected':''}>${escape(section.name)}</option>`).join('');
}
function taskColorPicker(task){
  const color=taskCalendarColor(task.calendarColor);
  return `<fieldset class="task-color-picker" data-color-task="${escape(task.id)}">
    <legend>Task color</legend><div class="task-color-choices">
      ${Object.entries({'':'Default',...taskCalendarColors}).map(([value,label])=>`<button type="button" data-task-color-choice="${value}" data-task-color="${value}" aria-pressed="${color===value}">
        <span class="task-color-swatch" aria-hidden="true"></span>${label}
      </button>`).join('')}
    </div>${customColorFields(color)}
    <button type="button" class="text-button" data-task-color-choice="custom">Apply custom color</button></fieldset>`;
}

function saveQuickTaskColor(button){
  const task=state.tasks.find(item=>item.id===button.closest('[data-color-task]').dataset.colorTask);
  if(!task)return;
  const choice=button.dataset.taskColorChoice;
  const color=choice==='custom'?customCalendarColor(button.closest('[data-color-task]').querySelector('[data-color-hex]').value):taskCalendarColor(choice);
  if(choice==='custom'&&!color){toast('Enter a hex color like #548F7D.');return;}
  const previous=task.calendarColor||'';
  if(color===previous)return;
  task.calendarColor=color;
  if(!persist()){task.calendarColor=previous;return;}

  const anchor=lastAnchor,scope=anchor?.closest('#mini-calendar,#calendar-panel,#task-sidebar');
  const {block,occurrence}=anchor?.dataset||{};
  refreshTasks();
  if(anchor&&!anchor.isConnected){
    const matches=[...(scope?.querySelectorAll('[data-task="'+CSS.escape(task.id)+'"]')||[])];
    const sameBlock=matches.find(el=>el.matches('.calendar-block,.planner-event,.calendar-all-day-task,.planner-month-task')&&
      el.dataset.block===block&&el.dataset.occurrence===occurrence);
    const taskMenuButton=matches.map(el=>el.querySelector('.task-more,.planner-task-more')).find(Boolean);
    lastAnchor=sameBlock||(activePanel==='calendar-block'?anchor:taskMenuButton||(inSchedule()?$('#planner-heading'):taskToggle));
    lastAnchor?.setAttribute('aria-expanded','true');
  }
  refreshPanel();
  visiblePanel()?.querySelector('[data-task-color-choice][aria-pressed="true"]')?.focus({preventScroll:true});
  announce(color?`Task color set to ${taskCalendarColors[color]||color.toUpperCase()}.`:'Default task color restored.');
}

function calendarBlockPreview(){
  const task=state.tasks.find(item=>item.id===lastAnchor.dataset.task);
  const hasReference=Boolean(task?.reference),resume=hasHandoff(task)||hasReference;
  return `${header('CALENDAR BLOCK',escape(task?.text||'Task unavailable'))}
    <p id="block-focus-time"></p>
    <p id="block-actual-focus"></p>
    <p class="task-waiting" id="block-prerequisites" hidden></p>
    ${resume?`<section class="calendar-resume-context" aria-label="Saved focus context">
      ${hasHandoff(task)?`<h3>Last handoff</h3>${handoffDetails(task)}`:''}
      ${hasReference?'<p>Pinned reference will open beside the timer.</p>':''}
    </section>`:''}
    ${task?taskColorPicker(task):''}
    <div class="panel-actions calendar-block-actions">
      <button class="panel-primary" type="button" id="start-block-focus">${icon('play')} ${resume?'Resume focus':'Start focus'}</button>
      <button type="button" class="text-button" id="edit-calendar-block">${lastAnchor.dataset.block?'Edit block':'Edit task'}</button>
      ${lastAnchor.dataset.block?'<button type="button" class="text-button" id="edit-calendar-task">Edit task</button>':''}
    </div>`;
}
function extensionTime(timestamp){
  return new Date(timestamp).toLocaleString([],{
    weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true
  });
}
function overlapDuration(ms){
  const seconds=Math.round(ms/1000);
  if(!seconds)return 'less than 1 sec';
  const minutes=Math.floor(seconds/60),extra=seconds%60;
  return [minutes&&`${minutes} min`,extra&&`${extra} sec`].filter(Boolean).join(' ');
}
function calendarExtensionPreview(){
  const plan=extensionPreview;
  if(!plan)return `${header('CALENDAR BLOCK','Extend block')}<p>This running block is no longer available to extend.</p>`;
  const task=state.tasks.find(item=>item.id===plan.taskId);
  return `${header('CALENDAR BLOCK','Add 10 minutes')}
    <p>${escape(task?.text||'Focus block')}</p>
    <dl class="calendar-extension-times">
      <div><dt>Calendar ends</dt><dd>${extensionTime(plan.plannedEnd)} → <strong>${extensionTime(plan.newPlannedEnd)}</strong></dd></div>
      ${plan.newFocusEnd!==plan.newPlannedEnd?`<div><dt>Timer ends</dt><dd>${extensionTime(plan.focusEnd)} → <strong>${extensionTime(plan.newFocusEnd)}</strong></dd></div>`:''}
    </dl>
    ${plan.conflicts.length?`<section class="calendar-resume-context"><h3>Overlaps in the extra time</h3><ul>${plan.conflicts.map(item=>
      `<li><strong>${escape(item.title)} overlaps by ${overlapDuration(item.overlapMs)}</strong><small>${item.type} · ${extensionTime(item.start)} – ${extensionTime(item.end)}</small></li>`).join('')}</ul></section>`:'<p>No timed commitments overlap the extra ten minutes.</p>'}
    <div class="panel-actions"><button type="button" class="text-button close-panel">Cancel</button><button type="button" class="panel-primary" id="confirm-block-extension">Extend 10 minutes</button></div>`;
}

function selectedBlockTiming(now){
  const {task,block,occurrence}=lastAnchor.dataset;
  const selected=state.tasks.find(item=>item.id===task);
  return selected ? blockFocusTiming(selected,block,occurrence,now) : null;
}

function updateBlockPreview(now){
  const timing=selectedBlockTiming(now);
  const start=$('#start-block-focus');
  const {task:id,block,occurrence}=lastAnchor.dataset;
  const task=state.tasks.find(item=>item.id===id);
  const prerequisites=waitingOn(task);
  start.disabled=!timing?.available||Boolean(task?.waitingFor||prerequisites.length);
  const waiting=$('#block-prerequisites');
  waiting.hidden=!task?.waitingFor&&!prerequisites.length;
  const waitingText=task?.waitingFor?`Waiting for ${task.waitingFor.subject}`:prerequisites.length?`Waiting on ${prerequisites.map(item=>item.text).join(', ')}`:'';
  if(waiting.textContent!==waitingText)waiting.textContent=waitingText;
  const message=!timing?.available?'This block has ended or is no longer scheduled.':
    `${formatDuration(timing.available)} ${timing.early?'if you start now':'left in this block'}.${timing.split&&timing.available>50*60000?' The timer alternates up to 50 minutes of focus with 10 minutes of rest.':''}`;
  const label=$('#block-focus-time');
  if(label.textContent!==message)label.textContent=message;
  const actual=$('#block-actual-focus');
  if(!task){actual.hidden=true;return;}
  const progress=calendarBlockProgress(task,block,occurrence,focusTotals(),now);
  const labelText=blockProgressLabels[progress.status];
  const value=formatDuration(progress.focusMs);
  const actualText=`${labelText?`${labelText} · `:''}${value} focus recorded`;
  if(actual.textContent!==actualText)actual.textContent=actualText;
}

function focusTaskPicker(){
  const current=focusedTask();
  const edit=current?'<button type="button" class="text-button" id="focus-task-edit">Edit current task</button>':'';
  const tasks=gardenFocusQueue();
  const pinned=state.focusPins?.day===dayKey()&&state.focusPins.ids.length>0;
  const choices=tasks.map((task,index)=>{
    const selected=task.id===current?.id;
    const id=escape(task.id), title=escape(task.text);
    return `<li class="focus-queue-row" data-queue-id="${id}">
      <span class="focus-queue-grip" aria-hidden="true" title="Drag to reorder">⠿</span>
      <button type="button" data-focus-task="${id}" aria-pressed="${selected}" ${state.timer.block?'disabled':''}><span>${title}</span>${selected?'<span class="task-current-indicator" aria-hidden="true">Current</span>':''}</button>
      <div class="focus-queue-arrows">
        <button type="button" data-queue-step="-1" aria-label="Move ${title} up" title="Move up" ${index===0?'disabled':''}>↑</button>
        <button type="button" data-queue-step="1" aria-label="Move ${title} down" title="Move down" ${index===tasks.length-1?'disabled':''}>↓</button>
      </div>
    </li>`;
  }).join('');
  return `${header('CURRENT TASK','Today’s focus queue')}
    ${state.timer.block?`<p class="block-task-name">Calendar session · ${escape(current?.text)}</p>`:''}
    ${choices?`<p class="panel-subtle">${pinned?'Pinned for today.':'Using calendar order.'} Drag tasks or use the arrows to reorder.</p><ol class="focus-task-list" aria-label="Focus order">${choices}</ol>`:'<p>No unfinished tasks for today.</p>'}
    <div class="panel-actions"><button type="button" class="panel-primary" id="focus-task-add">Add task</button>${edit}${pinned?'<button type="button" class="text-button" id="reset-focus-order">Use calendar order</button>':''}</div>`;
}

function focusBundleMarkup(){
  const status=activeBundleStatus();
  if(!status)return header('TASK BUNDLE','No active bundle');
  const {bundle,steps,next,run,restart}=status;
  return `${header('TASK BUNDLE',escape(bundle.name))}
    <ol class="focus-bundle-steps">${steps.map(step=>`<li><strong>${escape(step.task?.text||'Unavailable task')}</strong>
      <small>${step.done?'Complete':step===next?(step.ready?'Next':'Next · waiting'):'Queued'}</small></li>`).join('')}</ol>
    ${next&&!next.ready?`<p>${!next.task?'Edit the bundle to remove the unavailable task.':waitingOn(next.task).length?'Finish the prerequisites to continue.':'The next task is scheduled for later or snoozed.'}</p>`:''}
    <div class="panel-actions"><button type="button" class="text-button" data-bundle-planner>Manage bundles</button>
      ${run.paused&&next||restart?`<button type="button" class="panel-primary" data-resume-bundle="${escape(bundle.id)}">${restart?'Start again':'Resume bundle'}</button>`:
        next?'<button type="button" class="text-button" data-pause-bundle>Checkpoint &amp; pause</button>':''}</div>`;
}

function finishTaskOccurrence(task,date,timer=state.timer){
  const block=timer.block||timer.calendarBlock||focusCalendarBlock(task,date);
  const started=Number.isFinite(timer.startedAt)&&new Date(timer.startedAt);
  const startedOccurrence=state.activeBundle&&!state.activeBundle.paused&&started&&
    taskStatus(task,date)==='upcoming'&&taskStatus(task,started)==='todo'?dayKey(started):null;
  const day=block?.taskDay||block?.occurrence||startedOccurrence;
  return /^\d{4}-\d{2}-\d{2}$/.test(day)?new Date(day+'T12:00:00'):date;
}

function saveFocusOrder(ids,focusId,step){
  const previous=state.focusPins, activeTask=state.activeTask;
  state.focusPins=ids.length?{day:dayKey(),ids}:null;
  if(!state.timer.block&&(state.timer.status==='idle'||state.timer.mode==='break'))state.activeTask=null;
  if(!persist()){state.focusPins=previous;state.activeTask=activeTask;return;}
  refreshTasks();
  const list=root.querySelector('.focus-task-list');
  const scroll=list?.scrollTop||0;
  refreshPanel();
  const updated=root.querySelector('.focus-task-list');
  if(updated)updated.scrollTop=scroll;
  const row=focusId&&root.querySelector(`[data-queue-id="${CSS.escape(focusId)}"]`);
  const arrow=row?.querySelector(`[data-queue-step="${step}"]:not(:disabled)`)||row?.querySelector('[data-queue-step]:not(:disabled)');
  (arrow||root.querySelector('[data-focus-task]:not(:disabled), #focus-task-add'))?.focus({preventScroll:true});
  announce(ids.length?'Focus order pinned for today.':'Calendar order restored.');
}

function moveFocusQueueTask(id,target,step){
  const ids=gardenFocusQueue().map(task=>task.id);
  const from=ids.indexOf(id), to=target?ids.indexOf(target):from+step;
  if(from<0||to<0||to>=ids.length||from===to)return;
  ids.splice(from,1);
  ids.splice(to,0,id);
  saveFocusOrder(ids,id,step);
}

function gardenWeatherOptions(){
  const {season,weather}=state.appearance;
  return [['auto','Rotate every 8 minutes'],...Object.entries(weatherBySeason[season])]
    .map(([value,label])=>`<option value="${value}" ${value===weather?'selected':''}>${label}</option>`).join('');
}
function soundControls(){
  if(!gardenAudio.supported)return '<p class="panel-subtle">This browser does not support ambient audio. Text warnings remain available.</p>';
  const slider=key=>`<label class="garden-sound-row" for="sound-${key}"><span>${soundChannels[key]}</span><input type="range" id="sound-${key}" data-sound-level="${key}" min="0" max="100" value="${state.sounds[key]}"><output for="sound-${key}">${state.sounds[key]}%</output></label>`;
  return `<section class="garden-sound-controls" aria-labelledby="garden-sound-heading"><h3 id="garden-sound-heading">Garden sounds</h3>
    <div class="garden-sound-switches"><label><input type="checkbox" id="mute-garden" ${state.sounds.muted?'checked':''}> Mute all app sounds</label>
    <label><input type="checkbox" id="outside-music" ${state.sounds.musicMode?'checked':''}> Music playing elsewhere</label></div>
    <div class="garden-sound-mix"><h4>Ambience mix</h4><button type="button" class="text-button" id="silence-ambience">Silence</button></div>
    ${['rain','water','wind'].map(slider).join('')}
    <h4>Timer sounds</h4>${['focus','break'].map(slider).join('')}
    <p id="garden-sound-status" class="panel-subtle"></p>
  </section>`;
}
function timerNotificationControls(){
  const enabled=state.notifications&&notificationsSupported()&&Notification.permission==='granted';
  return `<div class="panel-rule"></div><section class="timer-notification-controls"><h3>Timer warnings</h3>
    <p>Focus warns at 5:00 left. Breaks warn at 2:30 left.</p>
    <button type="button" class="panel-primary" id="timer-notifications" ${!notificationsSupported()||Notification.permission==='denied'?'disabled':''}>${enabled?'Turn off browser notifications':'Enable browser notifications'}</button>
    <p class="panel-subtle">${notificationStatus()}</p>
    <button type="button" class="text-button" id="timer-open-sounds">Adjust chimes and ambience</button></section>`;
}
let dayTemplateSource='',dayTemplateTarget='',dayTemplateId='';
let resourceProjectId='',resourceEditId='';

function openDayTemplates(anchor){
  const date=planner.calendarVisible()?leadingPlannerDay():planner.calendarAnchor();
  dayTemplateSource=dayKey(date);
  dayTemplateTarget=dayKey(shiftDay(date,1));
  dayTemplateId=state.calendarDayTemplates.find(item=>item.id===dayTemplateId)?.id||state.calendarDayTemplates[0]?.id||'';
  openPanel('calendar-day-templates',anchor);
}

function dayTemplateRows(template,selected){
  const rows=previewCalendarDay(template,dayTemplateTarget,gardenTasks(),state.calendarEvents);
  if(!rows.length)return '<p>Choose a valid destination date to preview the blocks.</p>';
  return rows.map(({row,index,conflicts,overlaps,unavailable})=>{
    const time=row.allDay?(row.kind==='task'?'Untimed task':row.days>1?`All day · ${row.days} days`:'All day'):`${timeLabel(row.start)} · ${row.minutes} min`;
    return `<label class="day-template-row">
      <input type="checkbox" name="row" value="${index}" ${unavailable?'disabled':!selected||selected.has(index)?'checked':''}>
      <span><strong>${escape(row.title)}</strong><small>${time} · ${row.kind==='event'?'Event':'Task'}</small>
      ${unavailable?'<small>This time is unavailable on the selected date.</small>':''}
      ${conflicts.length?`<small class="template-conflict">Overlaps ${escape(conflicts.join(', '))}</small>`:''}
      ${overlaps?.length?'<small>Overlaps another block in this template</small>':''}</span></label>`;
  }).join('');
}

function dayTemplatesMarkup(){
  const template=state.calendarDayTemplates.find(item=>item.id===dayTemplateId);
  return `${header('CALENDAR','Day templates')}
    <form id="save-day-template" class="template-form">
      <h3>Save a day</h3>
      <div class="template-fields">
        <label>Source date<input id="day-template-source" type="date" name="date" required value="${dayTemplateSource}"></label>
        <label>Template name<input name="name" placeholder="Lab Tuesday" maxlength="80" required></label>
      </div>
      <div class="panel-actions"><button class="panel-primary" type="submit">Save template</button></div>
      <p class="template-error" role="alert" hidden></p>
    </form>
    ${template?`<form id="apply-day-template" class="template-form">
      <h3>Copy to a date</h3>
      <div class="template-fields">
        <label>Template<select id="day-template-picker">${state.calendarDayTemplates.map(item=>`<option value="${escape(item.id)}" ${item===template?'selected':''}>${escape(item.name)}</option>`).join('')}</select></label>
        <label>Destination date<input type="date" id="day-template-target" name="date" required value="${dayTemplateTarget}"></label>
      </div>
      <fieldset class="day-template-rows"><legend>Blocks to copy</legend><div id="day-template-preview">${dayTemplateRows(template)}</div></fieldset>
      <p class="template-error" role="alert" hidden></p>
      <div class="panel-actions"><button type="submit" class="panel-primary">Copy selected</button>
        <button type="button" class="text-button" id="delete-day-template">Delete template</button></div>
    </form>`:'<p>Save a day to preview how its schedule would fit on another date.</p>'}`;
}

function templateFormError(form,message){
  const error=form.querySelector('.template-error');
  error.textContent=message;error.hidden=false;
}

function updateDayTemplates(templates,id){
  const previous=state.calendarDayTemplates;
  state.calendarDayTemplates=templates;
  if(!persist()){state.calendarDayTemplates=previous;return false;}
  dayTemplateId=id;refreshPanel();
  ($('#day-template-picker')||$('#day-template-source')).focus({preventScroll:true});
  return true;
}

function saveDayTemplate(form){
  const fields=new FormData(form),date=fields.get('date');
  const name=String(fields.get('name')).trim();
  if(!name)return templateFormError(form,'Enter a name for this template.');
  const rows=captureCalendarDay(gardenTasks(),state.calendarEvents,date);
  const [item]=loadDayTemplates([{id:crypto.randomUUID(),name,rows}]);
  if(!item)return templateFormError(form,'Choose a date with calendar blocks or dated tasks.');
  dayTemplateSource=date;
  if(updateDayTemplates([...state.calendarDayTemplates,item],item.id))toast('Day template saved.');
}

function applyDayTemplate(form){
  const fields=new FormData(form),date=fields.get('date');
  const item=state.calendarDayTemplates.find(entry=>entry.id===dayTemplateId);
  if(!item||!validTemplateDay(date))return templateFormError(form,'Choose a template and a destination date.');
  let copy;
  try{copy=copyCalendarDay(item,date,fields.getAll('row').map(Number),state);}
  catch(error){return templateFormError(form,error.message);}
  if(!copy.count)return templateFormError(form,'Select at least one available block.');
  const {tasks,calendarEvents}=state;
  state.tasks=[...tasks,...copy.tasks];
  state.calendarEvents=[...calendarEvents,...copy.events];
  if(!persist()){state.tasks=tasks;state.calendarEvents=calendarEvents;return;}
  openSchedule('calendar',lastAnchor,new Date(date+'T12:00:00'));
  refreshTasks();
  toast(`Copied ${copy.count} ${copy.count===1?'block':'blocks'}.`);
}

const resourceKinds={link:'Web link',note:'Reference note',path:'File path'};
function resourceContent(resource){
  if(resource.kind==='link')return `<a href="${escape(resource.value)}" target="_blank" rel="noopener noreferrer">Open link</a>`;
  if(resource.kind==='path')return `<code>${escape(resource.value)}</code>`;
  return `<p class="imported-description">${escape(resource.value)}</p>`;
}

function openProjectResources(id,anchor){
  resourceProjectId=id;resourceEditId='';
  openPanel('project-resources',anchor);
}

function projectResourcesMarkup(){
  const project=state.projects.find(item=>item.id===resourceProjectId);
  if(!project)return header('RESOURCE SHELF','Project unavailable');
  const editing=project.resources?.find(resource=>resource.id===resourceEditId);
  return `${header(escape(project.name),'Resource shelf')}
    <ul class="resource-shelf-list">${(project.resources||[]).map(resource=>{
      const id=escape(resource.id),pinned=resource.id===project.pinnedResourceId;
      return `<li>
        <div><small>${resourceKinds[resource.kind]}${pinned?' · Pinned for focus':''}</small><strong>${escape(resource.title)}</strong></div>
        ${resourceContent(resource)}
        <div class="panel-actions">
          <button type="button" class="text-button" data-resource-pin="${id}">${pinned?'Unpin':'Pin for focus'}</button>
          <button type="button" class="text-button" data-resource-edit="${id}">Edit</button>
          <button type="button" class="text-button" data-resource-remove="${id}">Remove</button>
        </div></li>`;
    }).join('')}</ul>
    <form id="project-resource-form" class="template-form">
      <h3>${editing?'Edit resource':'Add a resource'}</h3>
      <div class="template-fields">
        <label>Name<input id="resource-title" name="title" required maxlength="80" value="${escape(editing?.title||'')}"></label>
        <label>Type<select name="kind">${Object.entries(resourceKinds).map(([kind,label])=>`<option value="${kind}" ${kind===editing?.kind?'selected':''}>${label}</option>`).join('')}</select></label>
      </div>
      <label>Link, note, or path<textarea name="value" rows="3" maxlength="2000" required>${escape(editing?.value||'')}</textarea></label>
      <p class="template-error" role="alert" hidden></p>
      <div class="panel-actions"><button type="submit" class="panel-primary">Save resource</button>
        ${editing?'<button type="button" class="text-button" id="cancel-resource-edit">Cancel edit</button>':''}</div>
    </form>`;
}

function saveProjectResources(project,resources,pinnedResourceId,undo){
  const previous=state.projects;
  state.projects=previous.map(item=>item===project?{...item,resources,pinnedResourceId}:item);
  if(!persist()){state.projects=previous;return false;}
  resourceEditId='';planner.render();
  lastAnchor=$('[data-project-resources="'+CSS.escape(project.id)+'"]')||lastAnchor;
  lastAnchor?.setAttribute('aria-expanded','true');
  refreshPanel();
  if(undo)confirmChange('Resource removed.',undo);
  return true;
}

function submitProjectResource(form){
  const project=state.projects.find(item=>item.id===resourceProjectId);
  if(!project)return;
  const fields=Object.fromEntries(new FormData(form));
  const resource=projectResource({...fields,id:resourceEditId||crypto.randomUUID()});
  if(!resource)return templateFormError(form,fields.kind==='link'?'Enter a name and a valid http:// or https:// link.':'Enter a name and some content.');
  const resources=project.resources||[];
  const next=resourceEditId?resources.map(item=>item.id===resource.id?resource:item):[...resources,resource];
  if(saveProjectResources(project,next,project.pinnedResourceId||'')){
    $('#resource-title')?.focus({preventScroll:true});
    toast('Resource saved.');
  }
}

function resourceAction(button){
  const project=state.projects.find(item=>item.id===resourceProjectId);
  const {resourceEdit,resourcePin,resourceRemove}=button.dataset;
  const resource=project?.resources?.find(item=>item.id===(resourceEdit||resourcePin||resourceRemove));
  if(!resource)return;
  if(resourceEdit){
    resourceEditId=resource.id;refreshPanel();$('#resource-title').focus();return;
  }
  const pinned=resource.id===project.pinnedResourceId;
  if(resourcePin){
    if(saveProjectResources(project,project.resources,pinned?'':resource.id))
      $('[data-resource-pin="'+CSS.escape(resource.id)+'"]')?.focus({preventScroll:true});
    return;
  }
  if(saveProjectResources(project,project.resources.filter(item=>item!==resource),pinned?'':project.pinnedResourceId,latest=>{
    const target=latest.projects.find(item=>item.id===project.id);
    if(!target||target.resources.some(item=>item.id===resource.id))return false;
    target.resources.push(resource);
    if(pinned&&!target.pinnedResourceId)target.pinnedResourceId=resource.id;
    return true;
  }))$('#resource-title')?.focus({preventScroll:true});
}

function adminSandboxMarkup(){
  if(!adminSandbox)return `${header('TEST WORKSPACE','Admin sandbox')}
    <p>Try features with separate local data. You can start with sample data or copy your regular workspace after entering.</p>
    <div class="panel-actions"><button type="button" class="panel-primary" data-admin-action="enter">Enter sandbox</button></div>`;
  const {count,free,next,unlocked}=gardenStarProgress(state.gardenGrowth);
  const milestone=unlocked.at(-1)?.threshold??0;
  const toUnlock=next?next.threshold-count:0;
  const tile=(action,symbol,title,description)=>`<button type="button" id="sandbox-${action}" data-admin-action="${action}">
    <span class="sandbox-tile-icon" aria-hidden="true">${icon(symbol)}</span><span><strong>${title}</strong><small>${description}</small></span></button>`;
  return `${header('ISOLATED WORKSPACE','Admin sandbox')}
    <section class="sandbox-sky"><h3>Garden sky</h3>
      <dl class="sandbox-sky-stats"><div><dt>Earned</dt><dd>${count}</dd></div><div><dt>Unassigned</dt><dd>${free}</dd></div>
      <div><dt>Constellations</dt><dd>${unlocked.length}<span> / ${starConstellations.length}</span></dd></div></dl>
      ${next?`<div class="sandbox-progress"><label for="sandbox-unlock-progress"><strong>${next.name}</strong><span>${toUnlock} to unlock</span></label>
        <progress id="sandbox-unlock-progress" value="${count-milestone}" max="${next.threshold-milestone}"></progress></div>`:
        '<p class="sandbox-all-unlocked">All constellations unlocked</p>'}
      <div class="sandbox-star-actions">
        <button id="sandbox-star" type="button" data-admin-action="star">Add one star</button>
        ${next?`<button id="sandbox-next-unlock" type="button" data-admin-action="next-unlock">Add ${toUnlock} to unlock</button>`:''}
      </div>
      ${tile('meteor','spark','Simulate a shooting star','Watch a new path in Garden')}
    </section>
    <section class="sandbox-tests"><h3>Test workflows</h3><div class="sandbox-test-grid">
        ${tile('timer','focus','Start a 10-second focus','Check the timer and replay')}
        ${tile('seed','list','Load sample data','Tasks, a class, a note, and two stars')}
      </div>
    </section>
    <details class="sandbox-data"><summary>Sandbox data</summary>
      ${tile('copy','note','Copy my saved workspace','Replace the sandbox with your regular data')}
      ${tile('backup','external','Backup and restore','Export or import sandbox files')}
      <button type="button" data-admin-action="reset">Reset sandbox</button>
    </details>
    <div class="sandbox-footer"><span>Changes stay in this sandbox.</span><button type="button" class="panel-primary" data-admin-action="exit">Exit sandbox</button></div>`;
}

function seedAdminSandbox(){
  const now=Date.now(),today=dayKey(new Date(now)),projectId='sandbox-course';
  const previous={projects:state.projects,tasks:state.tasks,calendarEvents:state.calendarEvents,stickyNotes:state.stickyNotes,gardenGrowth:state.gardenGrowth};
  const add=(items,...examples)=>[...items,...examples.filter(example=>!items.some(item=>item.id===example.id))];
  const task=(id,text,estimate)=>({id,text,estimate,projectId,done:false,repeat:'none',date:today,time:'',subtasks:[],blocks:[],labels:[],comments:[],prerequisiteIds:[]});
  state.projects=add(state.projects,{id:projectId,name:'Sandbox course',color:'#568579',sections:[],milestones:[],exams:[],decisions:[]});
  state.tasks=add(state.tasks,task('sandbox-practice','Practice three problems',25),task('sandbox-reading','Review lecture notes',10));
  state.calendarEvents=add(state.calendarEvents,{id:'sandbox-class',manual:true,title:'Sample class',start:now+36*60000,end:now+86*60000});
  state.stickyNotes=add(state.stickyNotes,{...stickyBoard.newNote('Try linking this note to a task.','Sandbox note'),id:'sandbox-note'});
  for(let i=1;i<=2;i++)state.gardenGrowth=earnGardenDetail(state.gardenGrowth,'test','sandbox-star-'+i,'Sample test '+i,today,{courseId:projectId,courseName:'Sandbox course'});
  if(!persist()){Object.assign(state,previous);return;}
  refreshTasks();stickyBoard.render();refreshPanel();confirmChange('Sample data loaded in the sandbox.');
}

function replaceAdminSandbox(copy){
  const label=copy?'Replace the sandbox with a copy of your saved workspace?':'Clear the current sandbox workspace?';
  if(!window.confirm(label))return;
  const source=copy?liveStorage:{getItem:()=>null};
  try{
    const next=copy?loadState(source):freshState();
    reset(next,'focus');next.notifications=false;
    restoreBackup(storage,{state:next,journal:loadJournal(source),crochet:loadCrochet(source),
      captures:new Map(readCaptures(source).map(({key,...note})=>[key,note]))});
    location.reload();
  }catch(error){toast(error.message||'Could not replace the sandbox.');}
}

function runAdminSandbox(action){
  if(action==='enter'){location.assign(adminSandboxUrl(true));return;}
  if(!adminSandbox)return;
  if(action==='exit'){location.assign(adminSandboxUrl(false));return;}
  if(action==='meteor'){
    if(!sceneryMotionEnabled()){toast('Choose Gentle or Lively scenery and turn off reduced motion to preview a shooting star.');return;}
    closePanel();visitWorkspace('focus');shootingStars.preview(performance.now());return;
  }
  if(action==='seed'){seedAdminSandbox();return;}
  if(action==='star'||action==='next-unlock'){
    const previous=state.gardenGrowth,{count,next}=gardenStarProgress(previous);
    if(action==='next-unlock'&&!next)return;
    const amount=action==='star'?1:next.threshold-count,today=dayKey();
    for(let i=1;i<=amount;i++)state.gardenGrowth=earnGardenDetail(state.gardenGrowth,'test',crypto.randomUUID(),`Sandbox test ${count+i}`,today);
    if(!persist()){state.gardenGrowth=previous;return;}
    renderGardenGrowth();
    const unlocked=constellationUnlockMessage(previous);
    confirmChange(unlocked?`Constellation unlocked · ${unlocked}`:'Test star added.');
    refreshPanel();
    return;
  }
  if(action==='copy'||action==='reset'){replaceAdminSandbox(action==='copy');return;}
  if(action==='backup'){closePanel(false);backup.open();return;}
  if(action==='timer'){
    checkCompletion();
    if(state.timer.id){toast('Finish or reset the current sandbox timer first.');return;}
    const before=state.timer;reset(state,'focus');state.timer.total=state.timer.remaining=10000;
    startPause(state,Date.now(),focusedTask()?.id??null);
    if(!persist()){state.timer=before;return;}
    closePanel(false);visitWorkspace('focus');render();timerButton.focus({preventScroll:true});
  }
}

function panelContent(id){
  if(id==='admin-sandbox')return adminSandboxMarkup();
  if(id==='star-constellation')return starConstellationMarkup();
  if(id==='fit-before-class')return `${header('GARDEN','What fits before class?')}
    <label class="field-label" for="class-buffer">Minutes to get ready</label>
    <input id="class-buffer" type="number" min="0" max="180" value="${state.settings.classBuffer??5}">
    <div id="class-fit-results">${classFitResults(state.settings.classBuffer??5)}</div>`;
  if(id==='focus-pause-note')return `${header('FOCUS','Pause note')}
    <form id="focus-pause-form"><label class="field-label" for="pause-reason">Why did you pause?</label>
      <textarea id="pause-reason" name="reason" rows="3" maxlength="240" placeholder="Looked up a formula…">${escape(editingPause?.event.note)}</textarea>
      <div class="panel-actions"><button type="button" class="text-button close-panel">Cancel</button><button class="panel-primary">Save note</button></div></form>`;
  if(id==='office-retry')return officeRetryMarkup();
  if(id==='calendar-day-templates')return dayTemplatesMarkup();
  if(id==='project-resources')return projectResourcesMarkup();
  if(id==='evening-lights')return eveningLightsMarkup();
  if(id==='focus-bundle')return focusBundleMarkup();
  if(id==='availability')return availabilityMarkup();
  if(id==='routine-editor')return routineEditor();
  if(id==='focus-review')return focusReviewMarkup();
  if(id==='quick-task')return quickTaskCapture();
  if(id==='focus-setups')return focusSetupsMarkup();
  if(id==='incomplete-focus')return incompleteFocusMarkup();
  if(id==='mistake-retry')return mistakeRetryMarkup();
  if(id==='break-ideas')return breakIdeasMarkup();
  if(id==='focus-goal')return `${header('FOCUS',state.timer.id?'Set an outcome':'Warm up')}
    ${!state.timer.id?warmupContext():''}
    <form id="focus-goal-form">
      <label class="field-label" for="session-goal">What will you finish?</label>
      <input id="session-goal" name="goal" maxlength="160" placeholder="Solve problems 1–4" value="${escape(state.timer.goal)}">
      <div class="panel-actions">
        ${state.timer.mode==='focus'&&state.timer.status==='idle'?'<button class="panel-primary" type="submit" value="begin">Save and begin</button>':''}
        <button class="text-button" type="submit" value="save">Save outcome</button>
      </div>
    </form>`;
  if(id==='focus-subtasks'){
    const task=focusedTask(),items=task?.subtasks||[];
    return header('CURRENT TASK',escape(task?.text||'Subtasks'))+
      (items.length?`<ul class="focus-subtask-list">${items.map(item=>`<li><label>
        <input type="checkbox" data-focus-subtask="${escape(item.id)}" data-subtask-parent="${escape(task.id)}" ${item.done?'checked':''}>
        <span>${escape(item.text)}</span></label></li>`).join('')}</ul>`:'<p>No subtasks for the current task.</p>');
  }
  if(id==='fit-task')return `${header('CURRENT TASK','Find a task by time')}
    <label class="field-label" for="fit-minutes">Minutes available</label>
    <input id="fit-minutes" type="number" min="1" max="1440" value="${fitMinutes}">
    <label class="field-label" for="fit-energy">Energy level</label><select id="fit-energy">${energyOptions(fitEnergy,'Any energy level')}</select>
    <div id="fit-results" aria-live="polite">${fitTaskResults(fitMinutes)}</div>`;
  if(id==='capture-project'){
    const projects=state.projects.filter(project=>!project.archived);
    return `${header('CAPTURED THOUGHT','Attach to a project')}${projects.length?`<form id="capture-project-form"><label class="field-label" for="capture-project-id">Project</label><select id="capture-project-id" required>${projects.map(project=>`<option value="${escape(project.id)}">${escape(project.name)}</option>`).join('')}</select><div class="panel-actions"><button class="panel-primary">Attach thought</button></div></form>`:'<p>Create a project in Planner to attach a thought.</p>'}`;
  }
  if(id==='capture-link'){
    const tasks=gardenTasks().filter(task=>!task.done).sort((a,b)=>a.text.localeCompare(b.text));
    return `${header('NOTE INBOX','Link to a task')}${tasks.length?`<form id="capture-link-form">
      <label class="field-label" for="capture-link-task">Task</label><select id="capture-link-task" required>${tasks.map(task=>
      `<option value="${escape(task.id)}">${escape(task.text)}</option>`).join('')}</select>
      <div class="panel-actions"><button class="panel-primary">File and link note</button></div></form>`:'<p>Add an open task to link this thought.</p>'}
      <button type="button" class="text-button" data-open-capture-inbox>Back to inbox</button>`;
  }
  if(id==='capture-inbox')return `${header('NOTES','Note inbox')}
    <div class="capture-inbox-tabs" role="group" aria-label="Captured thoughts">${['inbox','archive'].map(tab=>
      `<button type="button" data-capture-inbox-tab="${tab}" aria-pressed="${tab===captureInboxTab}">${tab==='inbox'?'Unsorted':'Archive'}</button>`).join('')}</div>
    <p class="capture-shortcuts"><kbd>N</kbd> Next <kbd>P</kbd> Previous${captureInboxTab==='inbox'?' <kbd>F</kbd> File <kbd>L</kbd> Link <kbd>A</kbd> Archive':''}</p>
    <div id="capture-inbox-list">${captureInboxList()}</div>`;
  if(id==='garden-studio')return studio.markup();
  if(id==='garden-tools')return gardenToolsMarkup();
  if(id==='appearance'){
    const {lighting,season,motion,palette}=state.appearance;
    return `${header('SETTINGS','Appearance')}
      <div class="studio-launch"><button type="button" class="panel-primary" data-open-garden-studio>Open Garden Studio</button></div>
      <fieldset class="appearance-options"><legend>Lighting</legend><div class="lighting-options">
        ${Object.entries(lightingOptions).map(([value,label])=>`<label><input class="sr-only" type="radio" name="garden-lighting" value="${value}" ${lighting===value?'checked':''}><span>${label}</span></label>`).join('')}
      </div><p>Follow timer brings stars back after sunset. Day only keeps daylight and swaps stars for swallows.</p></fieldset>
      ${seasonWheelMarkup()}
      <fieldset class="appearance-options weather-options"><legend>Weather</legend>
        <select id="garden-weather" name="garden-weather" aria-label="Weather">${gardenWeatherOptions()}</select>
        <p>Now in the Garden <strong id="garden-weather-current">${weatherBySeason[season][gardenWeather(state.appearance)]}</strong></p>
      </fieldset>
      <fieldset class="appearance-options"><legend>Scenery motion</legend><div class="lighting-options">
        ${Object.entries(sceneryMotionOptions).map(([value,label])=>`<label><input class="sr-only" type="radio" name="garden-motion" value="${value}" ${motion===value?'checked':''}><span>${label}</span></label>`).join('')}
      </div><p>Still keeps the full scene in view. Gentle drifts slowly. Lively moves faster.</p></fieldset>
      <fieldset class="appearance-options weather-options"><legend>Palette</legend>
        <select name="garden-palette" aria-label="Palette">${Object.entries(gardenPalettes).map(([value,label])=>`<option value="${value}" ${value===palette?'selected':''}>${label}</option>`).join('')}</select></fieldset>
      ${gardenLooksMarkup()}
      <section class="garden-schedule"><h3>Daily Garden presets</h3><label><input type="checkbox" id="garden-schedule-enabled" ${state.gardenSchedule.enabled?'checked':''}> Switch looks by time of day</label>
      <p id="garden-active-preset"></p><p>Choose a look above, then save its start time. Changing the look pauses the schedule until you save or turn it back on.</p>
      <form id="garden-preset-form"><label for="garden-preset-time">Start time</label><input id="garden-preset-time" name="time" type="time" required><button class="panel-primary">Save preset</button></form>
      <ul>${state.gardenSchedule.presets.map(item=>`<li><span>${timeLabel(timeMinutes(item.time))} · ${seasonOptions[item.season].name} · ${lightingOptions[item.lighting]}</span><button type="button" data-remove-garden-preset="${item.time}" aria-label="Remove preset at ${timeLabel(timeMinutes(item.time))}">×</button></li>`).join('')}</ul></section>`;
  }
  if(id==='garden-comparison')return gardenComparisonMarkup();
  if(id==='garden-postcard')return `${header('GARDEN','Export postcard')}
    <p>Save the current landscape as a PNG.</p>
    <form id="garden-postcard-form"><label for="postcard-caption">Caption (optional)</label>
      <input id="postcard-caption" name="caption" maxlength="90" placeholder="November · Fall semester">
      <label><input type="checkbox" name="weekly" id="postcard-weekly"> Include the last seven days of focus</label>
      <label id="postcard-highlight-label" hidden>Weekly highlight<select id="postcard-highlight"><option value="">Write your own caption</option></select></label>
      <div class="panel-actions"><button type="button" class="text-button" id="postcard-month">Use month</button>
      <button type="button" class="text-button" data-postcard-viewpoints>Postcard viewpoints</button>
      <button type="submit" class="panel-primary">Download PNG</button></div>
      <p id="postcard-status" role="status" hidden></p></form>`;
  if(id==='focus-task')return focusTaskPicker();
  if(id==='finish-task'){
    const task=focusedTask();
    if(!task)return header('CURRENT TASK','Nothing to finish');
    const date=new Date(),afterCompletion=taskIndex(),copy={...task,done:true};
    afterCompletion.set(task.id,copy);
    const tasks=gardenTasks().map(item=>item===task?copy:item);
    const queue=gardenFocusQueue(date,tasks,afterCompletion);
    const active=activeBundleStatus(date);
    const nextStep=active?.next?.id===task.id&&!active.run.paused?
      bundleStatusFor(active.bundle,date,new Map(tasks.map(item=>[item.id,item])),queue,active.run).next:null;
    const inBundle=active?.next?.id===task.id&&!active.run.paused;
    const next=inBundle?nextStep?.task:queue[0];
    const message=next?`Up next · <strong>${escape(next.text)}</strong>${nextStep&&!nextStep.ready?' · Waiting':''}`:
      nextStep?'The next bundle task is unavailable.':inBundle?'This finishes the bundle.':'Your task queue is clear after this.';
    return `${header('CURRENT TASK','Finish early?')}<p>Mark <strong>${escape(task.text)}</strong> complete.</p>
      ${state.timer.sequence?'<p>This also ends the current routine.</p>':''}
      <p>${message}</p>
      <div class="panel-actions"><button type="button" class="text-button" data-finish-task="break" data-task-id="${escape(task.id)}">Take a break</button><button type="button" class="panel-primary" data-finish-task="focus" data-task-id="${escape(task.id)}">${inBundle&&(!nextStep||!nextStep.ready)?'Finish task':'Keep going'}</button></div>`;
  }
  if(id==='event-editor')return calendarEventEditor();
  if(id==='calendar-list-editor')return calendarListEditor();
  if(id==='replan-today')return replanMarkup();
  if(id==='plan-tomorrow')return planTomorrowMarkup();
  if(id==='plan-deadline')return deadlinePlannerMarkup();
  if(id==='build-week')return buildWeekMarkup();
  if(id==='schedule-drop')return scheduleDropMarkup();
  if(id==='daily-ritual')return ritualEditor();
  if(id==='ritual-schedules')return ritualScheduleEditor();
  if(id==='imported-event'){
    const event=state.calendarEvents.find(item=>item.id===lastAnchor?.dataset.calendarEvent);
    return event?`${header('IMPORTED CALENDAR',escape(event.title))}<p>${event.day?`All day · ${escape(event.day)}`:escape(new Date(event.start).toLocaleString())}${event.source?` · ${escape(event.source)}`:''}</p><p class="imported-description">${escape(event.description)}</p>
      ${event.day?'':`<form id="event-buffer-form" data-event-id="${escape(event.id)}">${eventBufferFields(event)}
        <p class="event-error" role="alert" hidden></p><button class="panel-primary">Save buffers</button></form>`}`:header('CALENDAR','Event unavailable');
  }
  if(id==='resume'){
    const task=state.tasks.find(item=>item.id===lastAnchor?.dataset.resumeId);
    return task?`${header('SESSION HANDOFF',escape(task.text))}<form id="resume-form" data-task-id="${escape(task.id)}">
      ${handoffFields(task)}
      <label class="field-label" for="resume-text">Next step</label><textarea id="resume-text" name="resumeNote" maxlength="500" rows="3" placeholder="What should you do first next time?">${escape(task.resumeNote)}</textarea>
      <div class="panel-actions"><button class="panel-primary" aria-keyshortcuts="Control+Enter Meta+Enter" title="Save handoff (Ctrl+Enter)">Save handoff</button>
      ${state.timer.mode==='focus'&&state.timer.id&&focusedTask()?.id===task.id?`<button class="text-button" type="submit" value="end">Save and end focus</button>`:''}</div></form>`:header('SESSION HANDOFF','Task unavailable');
  }
  if(id==='project-context'){
    const task=focusedTask();
    const project=task&&state.projects.find(item=>item.id===task.projectId);
    if(!project)return header('PROJECT','Project unavailable');
    const pinned=project.resources?.find(resource=>resource.id===project.pinnedResourceId);
    return `${header(escape(project.name),escape(task.text))}
      ${pinned?`<section class="pinned-project-resource">
        <small>Pinned resource</small><h3>${escape(pinned.title)}</h3>${resourceContent(pinned)}</section>`:''}
      ${hasHandoff(task)?handoffDetails(task):''}
      ${task.description?`<p class="imported-description">${escape(task.description)}</p>`:''}
      ${linkedStickyNotes('project',project.id)}
      <div class="panel-actions"><button type="button" class="panel-primary" id="project-context-ready">Back to timer</button>
      <button type="button" class="text-button" data-view-project="${escape(project.id)}">Open project</button></div>`;
  }
  if(id==='calendar-block')return calendarBlockPreview();
  if(id==='calendar-extension')return calendarExtensionPreview();
  if(id==='task-color'){
    const task=state.tasks.find(item=>item.id===taskColorMenuId);
    return header('TASK COLOR',escape(task?.text||'Task unavailable'))+(task?taskColorPicker(task):'');
  }
  if(id==='task-tradeoffs')return tradeoffsMarkup();
  if(id==='focus-replay')return focusReplayMarkup();
  if(id==='pagoda')return `${header('SETTINGS','Timer')}<form id="timer-settings"><div class="duration-fields"><div><label class="field-label" for="focus-minutes">Focus</label><div class="minute-field"><input id="focus-minutes" name="focus" inputmode="numeric" maxlength="6" value="${formatDuration(duration(state,'focus'))}" required></div></div><div><label class="field-label" for="break-minutes">Rest</label><div class="minute-field"><input id="break-minutes" name="break" inputmode="numeric" maxlength="6" value="${formatDuration(duration(state,'break'))}" required></div></div></div><label class="field-label" for="wrap-minutes">Wrap-up minutes</label><input id="wrap-minutes" name="wrapMinutes" type="number" min="0" max="15" step="1" value="${wrapUpMinutes(state.settings.wrapMinutes)}" required><p class="panel-subtle">Use the last few minutes to save your work. Set 0 to turn this off.</p><label class="field-label" for="intention">What are you making space for?</label><input id="intention" name="intention" value="${escape(state.intention)}" placeholder="e.g. Understand a little more" maxlength="160"><p class="panel-subtle">${state.timer.id?'New durations apply to your next session.':'Choose a pace that works for you.'}</p><div class="panel-actions"><button class="panel-primary" type="submit">Save rhythm</button><button type="button" class="text-button" id="panel-timer-toggle">${state.timer.status==='running'?'Pause timer':state.timer.status==='paused'?'Continue timer':'Start timer'}</button></div></form>${timerNotificationControls()}<button type="button" class="text-button" id="open-break-ideas">Manage break ideas</button>${timerRoutines()}`;
  if(id==='task-editor')return taskEditor();
  if(id==='block-editor')return blockEditor();
  if(id==='capture')return `${header('QUICK CAPTURE','Leave a thought here.')}
    <form id="capture-form">
      <label class="sr-only" for="capture-text">Quick note</label>
      <textarea class="note-field" id="capture-text" name="thought" rows="4" maxlength="1000" placeholder="What’s on your mind?" required></textarea>
      ${activeCaptureContext?`<label class="capture-context-choice"><input type="checkbox" name="context"> Remember ${escape(captureContextText(activeCaptureContext))}</label>`:''}
      <div class="note-actions"><button class="note-primary" type="submit">Save note</button><button type="button" class="note-secondary" id="capture-window">Open mini window</button></div>
      <p class="note-caption"><kbd>Ctrl+Enter</kbd> to save</p>
    </form>`;
  if(id==='notes')return `${header('GARDEN NOTES','Leave it here.')}
    <div class="note-label"><label for="notes-input">Notes</label><button class="text-button" type="button" id="open-notes-board">Open Notes board</button></div>
    <textarea class="note-field" id="notes-input" placeholder="What’s on your mind?" rows="5" maxlength="20000">${escape(state.notes)}</textarea>
    <div class="note-actions">
      <button type="button" class="note-primary" id="quick-capture">Quick capture</button>
      <button type="button" class="note-secondary" id="capture-window">Open mini window</button>
      <button type="button" class="note-secondary" id="clear-notes">Clear notes</button>
    </div>
    <p class="note-caption"><kbd>Ctrl+Alt+N</kbd> for quick capture</p>
    <div id="notes-captures">${captureCards()}</div>`;
  if(id==='progress'){
    const now=new Date(),{today:p,goal}=focusCompass(state,now.getTime());
    const date=now.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});
    const sessions=[...p.items].reverse().map(session=>`<li>
      <div class="focus-session-copy"><strong>${escape(session.intention||'Focus session')}</strong><time>${new Date(session.finishedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})} · ${Math.floor(session.focusMs/60000)} min</time>${focusReviewDetails(session)}</div>
      <span class="outcome ${session.outcome==='skipped'?'skipped':''}">${session.outcome==='completed'?'Completed':'Skipped'}</span></li>`).join('');
    return `${header(date,'Today’s focus')}
      <section class="focus-today-overview" aria-label="Focus summary">
        <div class="focus-today-time"><span>Focus time</span><strong>${p.minutes} <small>min</small></strong></div>
        <progress aria-label="Daily focus goal" value="${Math.min(p.minutes,goal)}" max="${goal}"></progress>
        <div class="focus-today-goal"><span>${p.minutes>=goal?'Goal reached':`${goal-p.minutes} min to go`}</span><button type="button" id="focus-today-goal" aria-haspopup="dialog">${goal} min goal</button></div>
        <dl class="focus-today-totals"><div><dt>Completed</dt><dd>${p.completed}</dd></div><div><dt>Skipped</dt><dd>${p.skipped}</dd></div></dl>
      </section>
      <section class="focus-today-sessions"><h3>Session history</h3>${sessions?`<ul class="history-list">${sessions}</ul>`:'<p class="focus-today-empty">No focus sessions recorded today.</p>'}</section>
      <div class="focus-today-links">
        <button type="button" id="open-day-recap">${icon('calendar')}<span><strong>End-of-day recap</strong><small>Review today and see tomorrow’s plans</small></span><span class="focus-today-arrow">${icon('down')}</span></button>
        <button type="button" id="open-garden-history">${icon('sprout')}<span>Garden Field Guide</span></button>
        <button type="button" data-evening-lights>${icon('spark')}<span>Evening lights</span></button>
      </div>`;
  }
  if(id==='garden-history')return gardenHistoryMarkup();
  if(id==='garden-course')return gardenCourseMarkup();
  if(id==='garden-landmark')return gardenLandmarkMarkup();
  if(id==='day-recap')return dayRecapMarkup();
  return `${header('SETTINGS','Music & video')}
    <div class="media-sources" role="group" aria-label="Media source">
      <button type="button" data-media-source="spotify">Spotify</button><button type="button" data-media-source="youtube">YouTube</button>
    </div>
    <div class="soundtrack-controls">
      <label for="soundtrack-picker">Saved soundtracks</label><div class="music-link">
        <select id="soundtrack-picker"></select><button type="button" class="text-button" id="remove-soundtrack" disabled>Remove saved</button>
      </div>
      <details><summary>Save a soundtrack</summary>
        <form id="soundtrack-form"><label for="soundtrack-name">Name</label>
          <input id="soundtrack-name" name="name" maxlength="80" placeholder="Deep work" required>
          <p>Uses the link in the player field below.</p>
          <button class="panel-primary">Save soundtrack</button>
        </form></details>
    </div>
    <label class="field-label" for="media-link" id="media-link-label">Media link</label>
    <form id="media-form" class="music-link"><input id="media-link" type="url" required><button class="panel-primary" type="submit">Load</button></form>
    <div class="music-mini-bar" hidden><strong>YouTube</strong><button type="button" id="restore-media-panel">Expand</button><button type="button" id="hide-media-mini" title="Hide video and keep playing" aria-label="Hide video and keep playing">×</button></div>
    <div id="music-player-wrap"></div>
    <p id="media-status" role="status" class="panel-subtle"></p>
    <div class="panel-actions media-actions"><a class="panel-primary" id="open-media-external" target="_blank" rel="noopener noreferrer"></a>
      <button type="button" class="text-button" id="pop-out-youtube" hidden>Pop out video</button><button type="button" class="text-button" id="remove-player" hidden>Remove player</button></div>
    ${soundControls()}`;
}
function positionLandmarkPanel(panel,anchor){
  const viewport=window.visualViewport;
  const x=viewport?.offsetLeft||0,y=viewport?.offsetTop||0;
  const right=x+(viewport?.width||innerWidth),bottom=y+(viewport?.height||innerHeight);
  const appBounds=app.getBoundingClientRect(),dock=workspaceNav.getBoundingClientRect();
  const header=$('.topbar').getBoundingClientRect();
  const floor=Math.min(bottom,appBounds.bottom)-12;
  const navCeiling=dock.height&&dock.top>y+130?dock.top-10:floor;
  const lower=Math.min(floor,navCeiling);
  const upper=Math.max(y+12,header.bottom+9);
  const top=upper+130<=lower?upper:y+12;
  const left=x+12;
  const rail=taskSidebar.getBoundingClientRect();
  const railEdge=rail.width&&rail.left-left>=370?rail.left-12:right-12;
  const edge=Math.min(right-12,railEdge);
  panel.style.setProperty('--landmark-max-height',Math.max(0,lower-top)+'px');
  panel.style.setProperty('--landmark-max-width',Math.max(0,edge-left)+'px');

  const r=anchor.getBoundingClientRect(),width=panel.offsetWidth,height=panel.offsetHeight,gap=12;
  const besideRight=r.right+gap,besideLeft=r.left-gap-width;
  let px=r.left+(r.width-width)/2,py=r.top+(r.height-height)/2;
  if(besideRight+width<=edge)px=besideRight;
  else if(besideLeft>=left)px=besideLeft;
  else if(r.bottom+gap+height<=lower)py=r.bottom+gap;
  else if(r.top-gap-height>=top)py=r.top-gap-height;

  panel.style.left=Math.max(left,Math.min(px,edge-width))+'px';
  panel.style.top=Math.max(top,Math.min(py,lower-height))+'px';
}
function repositionLandmark(){
  if(activePanel==='garden-landmark')positionPanel(visiblePanel(),landmarkAnchor(selectedLandmark));
}
const landmarkPanelSize=new ResizeObserver(repositionLandmark);
window.visualViewport?.addEventListener('resize',repositionLandmark);
window.visualViewport?.addEventListener('scroll',repositionLandmark);

function positionPanel(panel,anchor){
  if(!anchor||!panel)return;
  if(panel.classList.contains('landmark-panel')){positionLandmarkPanel(panel,landmarkAnchor(selectedLandmark));return;}
  if(panel.classList.contains('capture-panel')){
    if(capturePointer){
      const {x,y}=capturePointer;
      const width=panel.offsetWidth,height=panel.offsetHeight;
      const left=x+width+12<innerWidth?x+12:x-width-12;
      const top=y+height+12<innerHeight?y+12:y-height-12;
      panel.style.left=`${Math.max(8,Math.min(left,innerWidth-width-8))}px`;
      panel.style.top=`${Math.max(8,Math.min(top,innerHeight-height-8))}px`;
      panel.style.transform='none';
    }
    return;
  }
  if(panel.matches('.task-editor,.garden-comparison-panel,.garden-studio-panel'))return;
  const placement=anchor.isConnected?anchor:anchor.classList.contains('recap-entry')&&recapOrigin?.isConnected?recapOrigin:anchor;
  const r=placement.getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight,W=window.innerWidth,H=window.innerHeight;
  let x=r.left+r.width/2-w/2,y=r.top-h+15;
  if(panel.classList.contains('focus-checklist-panel')){
    const timer=$('.sky').getBoundingClientRect();
    if(timer.left-12-w>=14)x=timer.left-12-w;
    else if(timer.right+12+w<=W-14)x=timer.right+12;
    else if(r.bottom+12+h<=H-66)y=r.bottom+12;
  }
  if(anchor.classList.contains('garden-action')) y=r.bottom+9;
  if(y<16)y=r.bottom-15;
  panel.style.left=`${Math.max(14,Math.min(x,W-w-14))}px`;
  panel.style.top=`${Math.max(16,Math.min(y,H-h-16))}px`;
}
function visiblePanel(){return root.querySelector('.panel:not(.music-hidden,.music-mini)');}
function openPanel(id,anchor,landmarkIndex=null){
  if(closePanel(false)===false)return;
  if(id==='capture')activeCaptureContext=currentCaptureContext();
  if(id==='focus-goal')goalTimer=state.timer;
  if(id==='appearance')seasonPreview=effectiveAppearance.season;
  if(id==='garden-studio')studio.open();
  selectedLandmark=landmarkIndex;
  if(selectedLandmark!==null)$(`[data-garden-landmark="${selectedLandmark}"]`)?.classList.add('landmark-selected');
  activePanel=id;lastAnchor=anchor;anchor?.setAttribute('aria-expanded','true');
  let panel=root.querySelector('#music-panel');
  if(id==='music'&&panel){panel.classList.remove('music-hidden','music-mini');panel.querySelector('.music-mini-bar').hidden=true;panel.setAttribute('aria-hidden','false');panel.setAttribute('aria-modal','true');panel.querySelector('h2').id='panel-title';panel.setAttribute('aria-labelledby','panel-title');panel.removeAttribute('aria-label');panel.inert=false;}
  else{panel=document.createElement('section');panel.className=id==='capture'?'panel capture-panel lake-note':id==='notes'?'panel lake-note':id==='task-editor'?'panel task-editor task-detail-panel':['event-editor','calendar-list-editor','ritual-schedules','replan-today','plan-tomorrow','plan-deadline','build-week','schedule-drop','routine-editor','availability','task-tradeoffs','calendar-day-templates','project-resources'].includes(id)?'panel task-editor event-editor':id==='block-editor'?'panel task-editor':id==='appearance'?'panel appearance-panel':id==='garden-comparison'?'panel garden-comparison-panel':id==='garden-studio'?'panel garden-studio-panel':id==='garden-landmark'?'panel landmark-panel':['focus-subtasks','project-context'].includes(id)?'panel focus-checklist-panel':'panel';if(id==='music')panel.id='music-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','panel-title');panel.innerHTML=panelContent(id);root.appendChild(panel);if(id==='music')mountMedia();}
  if(id==='admin-sandbox')panel.classList.add('admin-sandbox-panel');
  if(id==='progress')panel.classList.add('focus-today-panel');
  if(id==='garden-tools'){panel.classList.add('garden-tools-panel');filterGardenTools(panel);}
  addGardenToolsReturn(panel,id,anchor);
  syncSettingsNavigation(panel,id);
  if(id==='routine-editor')updatePhaseButtons();
  if(id==='break-ideas')renderBreakSuggestion();
  if(id==='appearance')renderSeasonPreview();
  if(id==='garden-comparison')renderGardenComparison(comparisonDates);
  if(id==='garden-studio')studio.mount(panel.querySelector('#garden-studio-form'));
  const scheduleForm=panel.querySelector('#task-editor-form,#block-editor-form');
  if(scheduleForm)updateScheduleEditor(scheduleForm);
  if(id==='music')syncSound();
  positionPanel(panel,anchor);wake();
  if(id==='garden-landmark')landmarkPanelSize.observe(panel);
  const firstControl=panel.querySelector(id==='appearance'?'input:checked':id==='event-editor'?'[name=title]':'input,textarea,select')||panel.querySelector('button');
  const initialFocus=panel.classList.contains('garden-settings-panel')||['replan-today','plan-tomorrow','plan-deadline','build-week','project-context','schedule-drop','garden-landmark','garden-comparison','garden-studio','garden-tools'].includes(id)||id==='task-editor'&&editingTaskId?panel.querySelector('#panel-title'):firstControl;
  if(initialFocus.id==='panel-title')initialFocus.tabIndex=-1;
  initialFocus.focus({preventScroll:true});
}
function closePanel(restore=true){
  if(activePanel==='garden-studio'&&!studio.canLeave())return false;
  if(restore&&returnToCaptureInbox&&(['capture-project','capture-link'].includes(activePanel)||activePanel==='task-editor'&&taskDraft?.captureKey)){
    returnToCaptureInbox=false;openCaptureInbox(false);return;
  }
  const wasEvening=activePanel==='evening-lights';
  app.classList.remove('evening-view','evening-layout');
  if(activePanel==='garden-landmark')landmarkPanelSize.disconnect();
  const p=visiblePanel();if(p){if(p.id==='music-panel'){p.classList.add('music-hidden');p.setAttribute('aria-hidden','true');p.inert=true;p.querySelector('h2').id='music-hidden-title';p.setAttribute('aria-labelledby','music-hidden-title');}else p.remove();}
  if(lastAnchor){
    lastAnchor.setAttribute('aria-expanded','false');
    if(restore){
      const anchor=lastAnchor.isConnected?lastAnchor:lastAnchor.classList.contains('recap-entry')&&recapOrigin?.isConnected?recapOrigin:
        inSchedule()?$('#planner-heading'):$('#sidebar-calendar');
      anchor.focus({preventScroll:true});
    }
  }
  if(selectedLandmark!==null)$(`[data-garden-landmark="${selectedLandmark}"]`)?.classList.remove('landmark-selected');
  selectedLandmark=null;
  activePanel=null;
  if(wasEvening)render();
  wake();
}
function refreshPanel(){
  if(activePanel==='garden-studio')return;
  if(!activePanel||activePanel==='music')return;
  const p=visiblePanel();
  if(!p)return;
  const focusId=p.contains(document.activeElement)?document.activeElement.id:null;
  const sandboxDataOpen=p.querySelector('.sandbox-data')?.open;
  p.innerHTML=panelContent(activePanel);
  if(activePanel==='garden-tools')filterGardenTools(p);
  addGardenToolsReturn(p,activePanel,lastAnchor);
  syncSettingsNavigation(p,activePanel);
  if(sandboxDataOpen)p.querySelector('.sandbox-data').open=true;
  if(activePanel==='routine-editor')updatePhaseButtons();
  const scheduleForm=p.querySelector('#task-editor-form,#block-editor-form');
  if(scheduleForm)updateScheduleEditor(scheduleForm);
  if(activePanel==='calendar-block')updateBlockPreview(Date.now());
  if(activePanel==='break-ideas')renderBreakSuggestion();
  if(activePanel==='appearance')renderSeasonPreview();
  if(activePanel==='garden-comparison')renderGardenComparison(comparisonDates);
  positionPanel(p,lastAnchor);
  if(focusId)(document.getElementById(focusId)||(focusId==='sandbox-next-unlock'?$('#sandbox-star'):null))?.focus({preventScroll:true});
  else if(activePanel==='focus-task')p.querySelector('button')?.focus({preventScroll:true});
}
function refreshTasks(){renderTasks();renderAgenda();if(inSchedule())renderCalendar();render();}

function agendaStart(now){return (now.getHours()-1)*60+agendaOffset;}

function renderAgenda(now=new Date()){
  const minute=now.getHours()*60+now.getMinutes();
  const start=agendaStart(now);
  const end=start+300;
  const firstDay=Math.floor(start/1440);
  const lastDay=Math.floor((end-1)/1440);
  const startDate=shiftDay(now,firstDay);
  const endDate=shiftDay(now,Math.floor(end/1440));
  const dateLabel=date=>date.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'});
  const endLabel=dayKey(startDate)===dayKey(endDate)?'':`${dateLabel(endDate)}, `;
  const range=`${dateLabel(startDate)} · ${timeLabel(start-firstDay*1440)} – ${endLabel}${timeLabel(end-Math.floor(end/1440)*1440)}`;
  if(agendaRange.textContent!==range)agendaRange.textContent=range;
  const ticks=Array.from({length:5},(_,index)=>`<div>${timeLabel(((start+index*60)%1440+1440)%1440)}</div>`).join('');
  const columns=[],tasks=gardenTasks().filter(task=>!task.waitingFor);
  for(let day=firstDay;day<=lastDay;day++){
    const date=shiftDay(now,day);
    const from=Math.max(0,start-day*1440),to=Math.min(1440,end-day*1440);
    const blocks=calendarBlocks(tasks,date,state.calendarEvents).filter(block=>block.start<to&&block.end>from);
    const visible=layoutBlocks(blocks.map(block=>({block,start:Math.max(block.start,from),end:Math.min(block.end,to)})));
    const entries=visible.map(({block,start,end,lane,lanes})=>
      calendarBlockMarkup({...block,lane,lanes},date,start-from,end-from,true)).join('');
    columns.push(`<div class="calendar-day mini-calendar-day" data-date="${dayKey(date)}" data-from="${from}" data-span="${to-from}" style="--slice-offset:${day*1440+from-start};--slice-span:${to-from}">${entries}</div>`);
  }
  const grid=`<div class="mini-hours calendar-hours" aria-hidden="true">${ticks}</div><div class="mini-track">${columns.join('')}<div class="mini-now" aria-hidden="true"></div></div>`;
  if(grid!==agendaMarkup){
    agendaList.innerHTML=grid;
    agendaMarkup=grid;
  }
  const nowLine=agendaList.querySelector('.mini-now');
  nowLine.hidden=minute<start||minute>=end;
  if(!nowLine.hidden)nowLine.style.setProperty('--now-minute',minute-start);
  calendarPanel.querySelector('.calendar-now')?.style.setProperty('--now-minute',minute);
  agendaMinute=Math.floor(now.getTime()/60000);
}

let calendarHistory,calendarHistoryLength=-1,calendarTotals=new Map();
function focusTotals(){
  if(calendarHistory!==state.history||calendarHistoryLength!==state.history.length){
    calendarHistory=state.history;
    calendarHistoryLength=calendarHistory.length;
    calendarTotals=calendarFocusTotals(calendarHistory);
  }
  return calendarTotals;
}
function progressForBlock(block,now=Date.now()){
  return calendarBlockProgress(block.task,block.blockId,block.occurrence,focusTotals(),now);
}
function syncCalendarProgress(now){
  const tasks=new Map(state.tasks.map(task=>[task.id,task]));
  const totals=focusTotals();
  for(const button of app.querySelectorAll('.calendar-block[data-task],.planner-event[data-open-time]')){
    const {task,block,occurrence}=button.dataset;
    const item=tasks.get(task);
    if(!item)continue;
    const {status}=calendarBlockProgress(item,block,occurrence,totals,now);
    if(button.dataset.blockStatus===status)continue;
    button.dataset.blockStatus=status;
    const label=button.querySelector('.calendar-block-state');
    if(label){label.hidden=!status;label.textContent=blockProgressLabels[status]||'';}
    if(button.dataset.blockLabel)button.setAttribute('aria-label',button.dataset.blockLabel+(status?`, ${blockProgressLabels[status]}`:''));
  }
}
function shownCalendarEvents(){
  return workspace==='calendar'?visibleCalendarEvents(state.calendarEvents,state.calendars,state.hiddenCalendars):state.calendarEvents;
}
function calendarEventAppearance(event,style){
  return eventColorAttributes(eventCalendarColor(event,state.calendars),style);
}

function renderCalendarRail(selectedDate,monthOverride){
  if(workspace!=='calendar')return;
  const key=dayKey(selectedDate);
  if(key!==railDate){railDate=key;railMonth=selectedDate;}
  if(monthOverride)railMonth=monthOverride;
  const first=new Date(railMonth.getFullYear(),railMonth.getMonth(),1),start=weekDays(first)[0];
  const today=dayKey();
  const calendars=calendarCatalog(state.calendars,state.calendarEvents);
  const row=calendar=>`<div class="calendar-list-entry"><label>
    <input type="checkbox" data-calendar-visibility="${escape(calendar.id)}" ${state.hiddenCalendars.includes(calendar.id)?'':'checked'}>
    <span class="calendar-color-dot" ${eventColorAttributes(calendar.color)}></span><span>${escape(calendar.name)}</span></label>
    ${!calendar.imported&&calendar.id!=='tasks'?`<button type="button" class="calendar-list-edit" data-calendar-list-edit="${escape(calendar.id)}" aria-label="Edit ${escape(calendar.name)} calendar">${icon('sliders')}</button>`:''}</div>`;
  const monthLabel=railMonth.toLocaleDateString([],{month:'long',year:'numeric'});
  const markup=`<div class="calendar-mini-month">
    <div class="calendar-mini-heading"><strong>${monthLabel}</strong>
      <button type="button" data-calendar-mini-step="-1" aria-label="Previous mini-calendar month">${icon('left')}</button>
      <button type="button" data-calendar-mini-step="1" aria-label="Next mini-calendar month">${icon('right')}</button></div>
    <div class="calendar-mini-dates">
      ${weekDays(first).map(day=>`<span aria-hidden="true">${day.toLocaleDateString([],{weekday:'narrow'})}</span>`).join('')}
      ${Array.from({length:42},(_,index)=>{
        const date=shiftDay(start,index),id=dayKey(date);
        return `<button type="button" data-calendar-mini-day="${id}" aria-label="${escape(date.toLocaleDateString([],{dateStyle:'full'}))}" aria-pressed="${id===key}"
          ${id===today?'aria-current="date"':''} ${date.getMonth()!==first.getMonth()?'class="other-month"':''}>${date.getDate()}</button>`;
      }).join('')}
    </div></div>
    <section class="calendar-list"><header><h3>My calendars</h3>
      <button type="button" data-calendar-list-new aria-label="Add calendar" title="Add calendar">${icon('plus')}</button></header>
      ${calendars.filter(item=>!item.imported).map(row).join('')}
      ${row({id:'tasks',name:'Tasks & rituals',color:'slate'})}
    </section>
    ${calendars.some(item=>item.imported)?`<section class="calendar-list"><header><h3>Imported calendars</h3></header>${calendars.filter(item=>item.imported).map(row).join('')}</section>`:''}`;
  if(markup===railMarkup)return;
  const focused=calendarRail.contains(document.activeElement)?{...document.activeElement.dataset}:null;
  calendarRail.innerHTML=markup;railMarkup=markup;
  if(focused){
    for(const [data,value] of Object.entries(focused)){
      const target=[...calendarRail.querySelectorAll('button,input')].find(el=>el.dataset[data]===value);
      if(target){target.focus({preventScroll:true});break;}
    }
  }
}

function syncCalendarRail(){
  const open=compactCalendarRail.matches?calendarPanel.classList.contains('calendar-rail-open'):
    !calendarPanel.classList.contains('calendar-rail-collapsed');
  calendarRailToggle.setAttribute('aria-expanded',String(open));
}
compactCalendarRail.addEventListener('change',syncCalendarRail);
syncCalendarRail();

function calendarBlockMarkup(block,date,visibleStart=block.start,visibleEnd=block.end,mini=false){
  const {task,blockId,start,end,lane,lanes,continues,occurrence}=block;
  const time=`${timeLabel(start)} – ${timeLabel(end)}`;
  const length=visibleEnd-visibleStart;
  const density=mini?` data-agenda-density="${length<14?'marker':length<28?'compact':'full'}"`:'';
  const placement=`--start:${visibleStart};--length:${visibleEnd-visibleStart};--lane:${lane};--lanes:${lanes}`;
  let handles='';
  if(!mini&&workspace==='calendar'&&!block.ritual&&(!block.event||block.event.manual)){
    const slot=block.event||calendarTaskBlock(task,blockId,occurrence);
    if(slot){
      const finish=new Date(slot.end);
      const endsHere=dayKey(finish)===dayKey(date)||visibleEnd===1440&&+finish===+shiftDay(date,1);
      handles=`${continues?'':'<span data-resize-edge="start" aria-hidden="true"></span>'}
        ${endsHere?'<span data-resize-edge="end" aria-hidden="true"></span>':''}`;
    }
  }
  if(block.ritual)return `<div class="calendar-block calendar-ritual-block" style="${placement}">${renderDailyRituals(dayKey(date),[block.ritual],false)}</div>`;
  if(block.event)return `<button type="button" class="calendar-block ${block.event.manual?'manual-event':'imported-block'}" ${calendarEventAppearance(block.event,placement)} data-calendar-event="${escape(block.event.id)}" data-event-day="${eventOccurrenceDay(block.event)}"${density} aria-haspopup="dialog" title="${escape(block.event.title)} · ${time}" aria-label="${escape(block.event.title)}, ${time}, ${block.event.manual?'event':'imported event'}"><strong>${escape(block.event.title)}</strong><span>${time}</span>${handles}</button>`;
  const title=`${task.text}, ${date.toLocaleDateString([],{weekday:'long'})}, ${time}${continues?', continued from the previous day':''}`;
  const done=!openFocusBlock(block);
  const {status}=progressForBlock(block);
  const important=taskPriority(task)===1;
  const label=`Open ${escape(title)}${important?', important':''}${done?', done':''}`;
  return `<button type="button" draggable="true" class="calendar-block${task.priority?' calendar-priority':''}${done?' calendar-done':''}" data-priority="${taskPriority(task)}" ${taskColorAttributes(task.calendarColor,placement)}${density} data-important="${important}" data-task="${escape(task.id)}" data-block="${escape(blockId)}" data-occurrence="${occurrence}" data-task-day="${escape(block.taskDay)}" data-block-status="${status}" data-block-label="${label}" aria-label="${label}${status?`, ${blockProgressLabels[status]}`:''}" aria-haspopup="dialog" title="${escape(title)}"><strong>${escape(task.text)}</strong><span>${escape(time)}</span><span class="calendar-block-state" ${status?'':'hidden'}>${blockProgressLabels[status]||''}</span>${handles}</button>`;
}

function renderCalendar(){
  planner.render();
}
installBatchMove({button:$('#calendar-batch'),getState:()=>state,visibleTasks:()=>planner.calendarTasks(),visibleEvents:shownCalendarEvents,startDay:leadingPlannerDay,notify:toast,
  save:commitCalendarCopies});
function commitCalendarCopies(changes){
    const previous={tasks:state.tasks,calendarEvents:state.calendarEvents};
    Object.assign(state,changes);
    if(!persist()){Object.assign(state,previous);return false;}
    refreshTasks();return true;
}
installCalendarResize(calendarGrid,{canResize:()=>workspace==='calendar'&&!actualCalendar&&!$('.brush-active'),getState:()=>state,
  previewExtra:timedCalendarRituals,notify:toast,save:(result,draft)=>{
    if(commitCalendarCopies(result.changes))confirmChange(`Block resized to ${minutesLabel(draft.end-draft.start)}.`,result.undo);
  }});
function showBrushAction(stroke,redo,message){
  clearTimeout(undoTimeout);
  pendingUndo=null;
  pendingBrush={stroke,redo};
  undoButton.textContent=redo?'Redo':'Undo';
  dismissBrushButton.hidden=false;
  $('#undo-message').textContent=message;
  undoToast.hidden=false;
  announce(message+(redo?' Redo available.':' Undo available.'));
}
function placeStroke(stroke){
  if(!commitCalendarCopies(stroke.changes))return false;
  showBrushAction(stroke,false,`${stroke.count} calendar ${stroke.count===1?'copy':'copies'} placed.`);
  return true;
}
const closeBrush=installBrush({button:$('#calendar-brush'),grid:calendarGrid,scroller:calendarScroll,getState:()=>state,placeStroke,
  canPaint:()=>workspace==='calendar'&&!actualCalendar&&planner.calendarVisible(),initialDay:()=>dayKey(leadingPlannerDay()),minuteAt:calendarPointerMinute,notify:toast,
  sources:()=>[...planner.calendarTasks().filter(t=>!t.done).map(t=>({id:t.id,type:'task',title:t.text,minutes:t.estimate||60})),
    ...shownCalendarEvents().filter(e=>!e.day).map(e=>({id:e.id,type:'event',title:e.title,minutes:Math.min(1440,Math.max(1,Math.round((e.end-e.start)/60000)))}))]});

function currentCalendarMinute(){
  const now=new Date();
  return Math.max(0,now.getHours()*60+now.getMinutes()-30);
}
function calendarStartMinute(date,visibleDays){
  const tasks=planner.calendarTasks();
  const sessions=workspace==='calendar'&&actualCalendar?replaySessions(state.history,state.timer,Date.now()):null;
  let minute=sessions?Infinity:8*60;
  const events=shownCalendarEvents();
  for(let offset=0;offset<visibleDays;offset++){
    const day=shiftDay(date,offset);
    const blocks=sessions?replayBlocks(sessions,day,$('#calendar-project').value):calendarBlocks(tasks,day,events);
    for(const block of blocks){
      minute=Math.min(minute,Math.max(0,block.start-30));
    }
  }
  return Number.isFinite(minute)?minute:8*60;
}

function showPlannerCalendar(date,visibleDays,enteringTimeline){
  calendarGrid.style.setProperty('--planner-visible-days',visibleDays);
  calendarPanel.dataset.visibleDays=visibleDays;
  const period={1:'day',3:'three days',7:'week'}[visibleDays];
  $('[data-calendar-step="previous"]').setAttribute('aria-label',`Previous ${period}`);
  $('[data-calendar-step="next"]').setAttribute('aria-label',`Next ${period}`);
  renderPlannerDays();
  if(enteringTimeline||calendarLayoutDay!==dayKey(date)){
    calendarLayoutDay=dayKey(date);
    scrollCalendarTo(date,calendarOpenMinute??(workspace==='calendar'&&dayKey(date)===dayKey()?currentCalendarMinute():calendarStartMinute(date,visibleDays)));
    calendarOpenMinute=undefined;
  }
  updatePlannerViewport();
  renderCalendarShelf();
}

function renderCalendarShelf(){
  const scroll=calendarTray.scrollTop;
  const query=calendarShelfSearch.value.trim().toLowerCase();
  const projects=new Map(state.projects.map(project=>[project.id,project.name]));
  const tasks=planner.calendarTasks({includeHidden:true}).filter(task=>taskStatus(task)!=='done');
  $('#calendar-queue-count').textContent=tasks.length||'';
  const rows=tasks.filter(task=>`${task.text} ${projects.get(task.projectId)||'Inbox'}`.toLowerCase().includes(query))
    .sort((a,b)=>taskPriority(a)-taskPriority(b)||a.text.localeCompare(b.text)).map(task=>{
      const project=projects.get(task.projectId)||'Inbox';
      const duration=task.estimate||60;
      return `<li><button type="button" draggable="true" class="calendar-tray-task" data-task="${escape(task.id)}" data-priority="${taskPriority(task)}" aria-label="Schedule ${escape(task.text)}" aria-haspopup="dialog">
        <span class="calendar-shelf-grip" aria-hidden="true">⠿</span><span class="calendar-shelf-copy"><strong>${escape(task.text)}</strong><small>${escape(project)} · ${duration} min</small></span><span class="calendar-shelf-add" aria-hidden="true">+</span>
      </button></li>`;
    });
  calendarTray.innerHTML=rows.join('')||`<li class="calendar-shelf-empty">${tasks.length?'No matching tasks.':'No open tasks in this view.'}</li>`;
  calendarTray.scrollTop=scroll;
}

function setCalendarShelf(open){
  calendarShelf.hidden=!open;
  calendarShelfToggle.setAttribute('aria-expanded',String(open));
  (open?calendarShelfSearch:calendarShelfToggle).focus({preventScroll:true});
}
calendarShelfToggle.onclick=()=>setCalendarShelf(calendarShelf.hidden);
$('#calendar-queue-close').onclick=()=>setCalendarShelf(false);
calendarShelfSearch.oninput=renderCalendarShelf;

function renderDailyRituals(date,kinds,showDetails=true){
  if(!kinds&&workspace==='calendar'){
    kinds=scheduledRituals(state.ritualSchedules,new Date(date+'T12:00:00'),'allDay');
  }
  const now=new Date(),day=state.dailyRituals[date];
  const showReading=day?.annotate?.title||date===dayKey(now)||date===dayKey(shiftDay(now,1));
  return dailyRitualMarkup(date,day,journal.completedAt(date),showDetails&&showReading?annotationContext(state.dailyRituals,date):null,kinds);
}
const replayLabels={start:'Started',pause:'Paused',resume:'Resumed',switch:'Switched to',overtime:'Overtime began',finish:'Timer finished',early:'Finished early',skip:'Skipped'};
const replayClock=at=>new Date(at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit',second:'2-digit'});
function focusReplayMarkup(){
  const session=replaySessions(state.history,state.timer,Date.now()).find(item=>item.id===lastAnchor?.dataset.replaySession);
  if(!session)return header('CALENDAR','Session unavailable');
  const status=session.live==='overtime'?'In overtime':session.live==='running'?'In progress':session.live==='paused'?'Paused':session.events.at(-1)?.action==='early'?'Finished early':
    session.outcome==='skipped'?'Skipped':'Completed';
  const duration=formatDuration(session.focusMs);
  return `${header('ACTUAL FOCUS',escape(session.events[0]?.title||session.taskTitle||'Focus session'))}
    <p class="replay-summary"><strong>${duration} focused</strong><span>${status}</span></p>
    ${session.overtimeMs?`<p>Overtime · ${formatDuration(session.overtimeMs)}</p>`:''}
    ${session.estimated?`<p>Estimated ${replayClock(session.finishedAt-session.focusMs)}–${replayClock(session.finishedAt)}. This older session only saved its duration and finish time.</p>`:
      `<ol class="replay-events">${session.events.map(item=>`<li><time datetime="${new Date(item.at).toISOString()}">${escape(replayClock(item.at))}</time>
        <span>${replayLabels[item.action]}${item.action==='switch'||item.action==='start'&&item.title?` · ${escape(item.title||'Unassigned focus')}`:''}${item.note?`<small class="replay-pause-note">${escape(item.note)}</small>`:''}</span></li>`).join('')}</ol>`}
    ${session.goal?`<p>Outcome · ${escape(session.goal)}</p>`:''}`;
}
function actualBlockMarkup(block){
  const {session,segment,start,end,lane,lanes}=block;
  const title=segment.title||'Unassigned focus';
  const note=segment.action==='overtime'?'Overtime':session.estimated?'Estimated':session.live==='running'?'In progress':session.live==='paused'?'Paused':session.outcome==='skipped'?'Skipped':'Actual';
  const label=`${title}, ${replayClock(segment.at)} to ${replayClock(segment.end)}, ${note}`;
  return `<button type="button" class="calendar-block replay-block" data-replay-session="${escape(session.id)}"
    data-replay-segment="${block.index}" data-replay-status="${note.toLowerCase()}" aria-haspopup="dialog" title="${escape(label)}" aria-label="${escape(label)}"
    style="--start:${start};--length:${end-start};--lane:${lane};--lanes:${lanes}"><strong>${escape(title)}</strong>
    <span>${timeLabel(start)} – ${timeLabel(end)} · ${note}</span></button>`;
}
function actualReplayKey(now){
  const t=state.timer;
  return JSON.stringify([state.history.length,state.history.at(-1)?.id,t.id,t.status,t.replay?.length,t.replay?.at(-1)?.at,['running','overtime'].includes(t.status)?Math.floor(+now/60000):null]);
}
function updateActualCalendar(now){
  if(!planner.calendarVisible()||!plannerDays.length||actualReplayKey(now)===replayRenderKey||activePanel==='focus-replay')return;
  const focused=document.activeElement.closest('[data-replay-session]');
  const parent=focused?.closest('.calendar-day');
  renderPlannerDays(now);
  updatePlannerViewport();
  if(focused){
    const replacement=[...calendarGrid.querySelectorAll('[data-replay-session]')].find(button=>
      button.dataset.replaySession===focused.dataset.replaySession&&button.dataset.replaySegment===focused.dataset.replaySegment&&
      button.closest('.calendar-day').dataset.date===parent.dataset.date);
    (replacement||calendarScroll).focus({preventScroll:true});
  }
}
function setCalendarActivity(actual){
  actualCalendar=actual;
  if(actual)closeBrush();
  $('#calendar-brush').hidden=actual;
  $('#calendar-batch').hidden=actual;
  for(const button of $('#calendar-activity-mode').children){
    button.setAttribute('aria-pressed',String((button.dataset.calendarActivity==='actual')===actual));
  }
}
function timedCalendarRituals(date){
  if(workspace!=='calendar'||state.hiddenCalendars.includes('tasks'))return [];
  return scheduledRituals(state.ritualSchedules,date,'timed').map(ritual=>{
    const {time,minutes}=state.ritualSchedules[ritual],start=timeMinutes(time);
    return {ritual,start,end:Math.min(1440,start+minutes)};
  });
}
function monthRituals(date){
  const key=dayKey(date);
  return renderDailyRituals(key)+timedCalendarRituals(date).map(booking=>`<div class="calendar-month-ritual"><small>${timeLabel(booking.start)}</small>${renderDailyRituals(key,[booking.ritual],false)}</div>`).join('');
}
function renderPlannerDays(now=new Date()){
  const today=dayKey(now),minute=now.getHours()*60+now.getMinutes();
  const tasks=planner.calendarTasks(),showCompleted=$('#planner-completed').checked,events=shownCalendarEvents();
  const actual=workspace==='calendar'&&actualCalendar;
  const sessions=actual?replaySessions(state.history,state.timer,+now):null;
  replayRenderKey=actual?actualReplayKey(now):'';
  const headers=plannerDays.map(date=>{
    const key=dayKey(date),current=key===today;
    const allDay=actual?[]:tasks.filter(task=>!task.time&&(taskOccursOn(task,date)||!task.date&&task.deadline===key)&&(showCompleted||taskStatus(task,date)!=='done'));
    const imports=actual?[]:allDayEvents(events,date);
    const create=workspace==='calendar'&&!actual;
    const stamp=`<span>${current?'Today':date.toLocaleDateString([],{weekday:'short'})}</span><strong>${date.getDate()}</strong>`;
    const dayLabel=escape(date.toLocaleDateString([],{dateStyle:'full'}));
    const heading=workspace==='calendar'?`<button class="calendar-day-heading" type="button" data-calendar-day="${key}" aria-label="Open day view for ${dayLabel}">${stamp}</button>`:`<div class="calendar-day-heading">${stamp}</div>`;
    return `<div class="calendar-date${current?' calendar-today':''}"${current?' aria-current="date"':''}>${heading}${actual||create&&state.hiddenCalendars.includes('tasks')?'':renderDailyRituals(key)}${create||allDay.length||imports.length?`<div class="calendar-all-day" ${create?`data-calendar-all-day-create="${key}"`:''}>
      ${create?`<button type="button" class="calendar-all-day-new" data-calendar-all-day-create="${key}" aria-label="Add an all-day event on ${dayLabel}">+</button>`:''}${allDay.map(task=>`<button type="button" class="calendar-all-day-task${taskStatus(task,date)==='done'?' all-day-done':''}" ${taskColorAttributes(task.calendarColor)} data-important="${taskPriority(task)===1}" aria-label="${escape(task.text)}${taskPriority(task)===1?', important':''}" data-task="${escape(task.id)}" data-occurrence="${key}" title="${escape(task.text)}">${escape(task.text)}</button>`).join('')}${imports.map(event=>`<button type="button" class="calendar-all-day-task ${event.manual?'manual-event':'imported-block'}" ${calendarEventAppearance(event)} data-calendar-event="${escape(event.id)}" data-event-day="${eventOccurrenceDay(event)}" title="${escape(event.title)}">${escape(event.title)}</button>`).join('')}</div>`:''}</div>`;
  }).join('');
  const hours=Array.from({length:24},(_,hour)=>`<div>${timeLabel(hour*60)}</div>`).join('');
  const columns=plannerDays.map(date=>{
    const planned=actual?[]:calendarBlocks(tasks,date,events).filter(block=>block.event||showCompleted||openFocusBlock(block)||progressForBlock(block).focusMs);
    const blocks=actual?layoutBlocks(replayBlocks(sessions,date,$('#calendar-project').value)).map(actualBlockMarkup).join(''):
      layoutBlocks([...planned,...timedCalendarRituals(date)]).map(block=>calendarBlockMarkup(block,date)).join('');
    const nowLine=dayKey(date)===today?`<div class="mini-now calendar-now" style="--now-minute:${minute}" title="Current time"></div>`:'';
    return `<div class="calendar-day${dayKey(date)===today?' calendar-day-current':''}" data-date="${dayKey(date)}" aria-label="${date.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}">${blocks}${nowLine}</div>`;
  }).join('');
  calendarGrid.style.setProperty('--planner-date-count',plannerDays.length);
  calendarGrid.innerHTML=`<div class="calendar-days"><div class="calendar-corner"></div>${headers}</div><div class="calendar-week"><div class="calendar-hours" aria-hidden="true">${hours}</div>${columns}</div>`;
  plannerVisibleRange='';
}

function leadingPlannerIndex(){
  return Math.floor((calendarScroll.scrollLeft+1)/plannerColumnWidth);
}

function leadingPlannerDay(){
  return plannerDays[leadingPlannerIndex()]??new Date();
}

function plannerDayWidth(){
  return calendarGrid.querySelector('.calendar-date')?.getBoundingClientRect().width||0;
}

function centerPlannerDates(date){
  const middle=Math.floor(plannerDateCount/2);
  plannerDays=Array.from({length:plannerDateCount},(_,index)=>shiftDay(date,index-middle));
  renderPlannerDays();
  return middle;
}

function positionPlanner(index){
  plannerColumnWidth=plannerDayWidth();
  calendarScroll.scrollLeft=index*plannerColumnWidth;
  updatePlannerViewport();
}

function updatePlannerViewport(){
  if(!inSchedule()||!planner.calendarVisible()||!plannerDays.length)return;
  const width=plannerDayWidth();
  if(!width)return;
  // A responsive column width should not move the date under the hour labels.
  if(plannerColumnWidth&&plannerColumnWidth!==width)calendarScroll.scrollLeft=plannerOffset*width;
  plannerColumnWidth=width;
  plannerOffset=calendarScroll.scrollLeft/width;
  const first=leadingPlannerIndex();
  const gutter=calendarGrid.querySelector('.calendar-corner').offsetWidth;
  const last=Math.min(plannerDays.length-1,Math.max(first,Math.ceil((calendarScroll.scrollLeft+calendarScroll.clientWidth-gutter)/width-.02)-1));
  const rangeKey=`${first}:${last}`;
  if(plannerVisibleRange===rangeKey)return;
  plannerVisibleRange=rangeKey;
  const dateLabel=date=>date.toLocaleDateString([],{month:'short',day:'numeric',...(date.getFullYear()!==plannerDays[last].getFullYear()?{year:'numeric'}:{})});
  const start=dateLabel(plannerDays[first]),end=dateLabel(plannerDays[last]);
  $('#calendar-range').textContent=first===last?plannerDays[first].toLocaleDateString([],{dateStyle:'full'}):`${start} – ${end}, ${plannerDays[last].getFullYear()}`;
  $('#calendar-jump-date').value=dayKey(plannerDays[first]);
  renderCalendarRail(plannerDays[first]);
  if(workspace==='calendar'&&actualCalendar){
    const columns=calendarGrid.querySelectorAll('.calendar-day');
    const hasVisible=[...columns].slice(first,last+1).some(column=>column.querySelector('[data-replay-session]'));
    $('#actual-calendar-message').textContent=hasVisible?'Select a session to replay its timer events.':'No recorded focus for these dates.';
  }
  for(const selector of ['.calendar-day','.calendar-date']){
    calendarGrid.querySelectorAll(selector).forEach((column,index)=>{
      const visible=index>=first&&index<=last;
      if(visible)column.removeAttribute('aria-hidden');
      else column.setAttribute('aria-hidden','true');
      for(const button of column.querySelectorAll('button'))button.tabIndex=visible?0:-1;
    });
  }
}

function extendPlannerDates(){
  if(!inSchedule()||!planner.calendarVisible()||!plannerColumnWidth||activePanel||!taskMenu.hidden||$('.task-dragging'))return;
  const first=leadingPlannerIndex();
  const nearEnd=calendarScroll.scrollWidth-calendarScroll.clientWidth-calendarScroll.scrollLeft<3*plannerColumnWidth;
  if(first>=3&&!nearEnd)return;
  const fraction=plannerOffset-first;
  positionPlanner(centerPlannerDates(plannerDays[first])+fraction);
}

function scrollCalendarTo(date=new Date(),minute){
  const target=dayKey(date);
  let index=plannerDays.findIndex(day=>dayKey(day)===target);
  if(index<3||index>=plannerDays.length-9)index=centerPlannerDates(date);
  positionPlanner(index);
  if(minute!==undefined){
    const day=calendarGrid.querySelector('.calendar-day');
    calendarScroll.scrollTop=day.offsetHeight*minute/1440;
  }
}

const calendarSlotPreview=document.createElement('span');
calendarSlotPreview.className='calendar-slot-preview';
calendarSlotPreview.setAttribute('aria-hidden','true');
function calendarPointerMinute(event,column){
  const bounds=column.getBoundingClientRect();
  return calendarSlotMinute(event.clientY-bounds.top,bounds.height);
}
calendarScroll.addEventListener('pointermove',event=>{
  const column=workspace==='calendar'&&!actualCalendar&&!activePanel&&event.pointerType==='mouse'&&
    !event.target.closest('button')&&event.target.closest('.calendar-day');
  if(!column){calendarSlotPreview.remove();return;}
  const minute=calendarPointerMinute(event,column);
  calendarSlotPreview.style.top=`${minute/14.4}%`;
  calendarSlotPreview.textContent=`+ ${timeLabel(minute)}`;
  if(calendarSlotPreview.parentElement!==column)column.append(calendarSlotPreview);
});
calendarScroll.addEventListener('pointerleave',()=>calendarSlotPreview.remove());
calendarScroll.addEventListener('scroll',()=>{
  calendarSlotPreview.remove();
  updatePlannerViewport();
  clearTimeout(plannerScrollEnd);
  plannerScrollEnd=setTimeout(extendPlannerDates,160);
},{passive:true});
calendarScroll.addEventListener('keydown',event=>{
  if(event.target!==calendarScroll)return;
  if(event.key==='Enter'&&workspace==='calendar'&&!actualCalendar){event.preventDefault();openCalendarEvent(calendarScroll);return;}
  if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();
  scrollCalendarTo(shiftDay(leadingPlannerDay(),event.key==='ArrowRight'?1:-1));
});
new ResizeObserver(updatePlannerViewport).observe(calendarScroll);

function openSchedule(destination,anchor,date=new Date(),minute){
  if(closePanel(false)===false)return;
  closeTaskMenu(false);
  if(!inSchedule()){
    reopenTasksAfterCalendar=workspace==='focus'?!taskSidebar.hidden:desktopTasks.matches;
    calendarAnchor=anchor;
  }
  calendarExit?.cancel();
  calendarExit=null;
  setTaskSidebar(false);
  calendarPanel.inert=false;
  calendarPanel.hidden=false;
  showWorkspace(destination);
  if(destination==='calendar'&&minute!==undefined&&actualCalendar){
    setCalendarActivity(false);returnToCalendarMonth=false;
  }
  $('#sidebar-calendar').setAttribute('aria-expanded',String(destination==='calendar'));
  calendarLayoutDay='';
  calendarPanel.classList.remove('calendar-rail-open');syncCalendarRail();
  calendarOpenMinute=minute??(destination==='calendar'&&dayKey(date)===dayKey()?currentCalendarMinute():undefined);
  planner.open(destination,date,minute!==undefined);
  $('#planner-heading').focus({preventScroll:true});
  wake();
}

function closeCalendar(){
  closeTaskMenu(false);
  showWorkspace('focus');
  setTaskSidebar(reopenTasksAfterCalendar);
  $('#sidebar-calendar').setAttribute('aria-expanded','false');
  const anchor=calendarAnchor?.getClientRects().length?calendarAnchor:calendarToggle;
  anchor.focus({preventScroll:true});
  calendarPanel.inert=true;
  if(motionPreference.matches)calendarPanel.hidden=true;
  else{
    const exit=calendarPanel.animate({opacity:[1,0],translate:['0 0','0 9px']},{duration:220,easing:'ease-in',fill:'forwards'});
    calendarExit=exit;
    exit.onfinish=()=>{
      if(calendarExit!==exit)return;
      calendarPanel.hidden=true;
      exit.cancel();
      calendarExit=null;
    };
  }
  wake();
}

function toggleCalendar(anchor){
  if(workspace!=='calendar')openSchedule('calendar',anchor);else closeCalendar();
}

function taskButton(id){
  return taskSidebar.querySelector(`[data-task="${CSS.escape(id)}"] .task-more`);
}

function openTaskMenu(id,anchor,x,y){
  const task=state.tasks.find(item=>item.id===id);
  if(!task)return;
  closeTaskMenu(false);
  menuTaskId=id;
  menuAnchor=anchor;
  const status=taskStatus(task,taskOccurrence(anchor));
  const actions=[['edit','Edit task'],['color','Change color…'],['priority',task.priority?'Remove priority':'Prioritize'],['schedule','Add a block…']];
  actions.push(['duplicate','Duplicate task']);
  if(anchor.classList.contains('calendar-block'))actions.unshift(['block-focus','Start focus…']);
  if(anchor.dataset.block)actions.push(['edit-block','Edit block'],['remove-block','Remove block']);
  if(recurringTaskDate(task,anchor))actions.push(['skip-date','Skip this date']);
  if(taskStatus(task)==='todo'&&!task.waitingFor&&!waitingOn(task).length&&!(task.snoozedUntil>dayKey()))actions.push(['focus',state.activeTask===id?'Clear focus':'Focus on this']);
  if(!task.waitingFor&&canPlanDeadline(task))actions.push(['plan-deadline','Plan to deadline…']);
  if(status!=='upcoming'||!task.repeat||task.repeat==='none')actions.unshift(['complete',status==='done'?'Reopen task':'Finish task']);
  if(task.date&&task.time&&!anchor.dataset.block)actions.push(['unschedule','Remove scheduled time']);
  actions.push(['delete','Delete task']);
  showTaskMenu(actions,anchor,x,y);
}

function recurringTaskDate(task,anchor){
  if(!task?.repeat||task.repeat==='none')return '';
  const day=anchor.dataset.block?anchor.dataset.taskDay:anchor.dataset.occurrence;
  return day&&taskOccursOn(task,new Date(day+'T12:00:00'))?day:'';
}

function showTaskMenu(actions,anchor,x,y){
  taskMenu.innerHTML=actions.map(([key,label])=>`<button type="button" role="menuitem" data-task-action="${key}">${label}</button>`).join('');
  taskMenu.hidden=false;
  const box=anchor.getBoundingClientRect();
  taskMenu.style.left=`${Math.max(8,Math.min(x??box.right-taskMenu.offsetWidth,innerWidth-taskMenu.offsetWidth-8))}px`;
  taskMenu.style.top=`${Math.max(8,Math.min(y??box.bottom+5,innerHeight-taskMenu.offsetHeight-8))}px`;
  if(anchor.classList.contains('task-more'))anchor.setAttribute('aria-expanded','true');
  taskMenu.querySelector('button').focus();
  wake();
}

function skipCalendarDate(task,anchor){
  const event=state.calendarEvents.find(item=>item.id===anchor.dataset.calendarEvent);
  const day=event?anchor.dataset.eventDay:recurringTaskDate(task,anchor);
  if(!day)return;
  if(event){
    const date=new Date(day+'T00:00:00');
    if(!calendarEventOccurrences([event],date).some(item=>eventOccurrenceDay(item)===day))return;
    const omitted=event.manual?{...event,excludedDays:[...new Set([...(event.excludedDays||[]),day])]}:{...event,skippedOccurrence:true};
    if(!commitCalendarCopies({calendarEvents:state.calendarEvents.map(item=>item===event?omitted:item)}))return;
    confirmChange(`Skipped ${shortScheduleDate(day)}.`,latest=>{
      const current=latest.calendarEvents.find(item=>item.id===event.id);
      if(!current)return false;
      if(event.manual){
        if(!current.excludedDays?.includes(day))return false;
        current.excludedDays=current.excludedDays.filter(date=>date!==day);
      }else{
        if(!current.skippedOccurrence)return false;
        delete current.skippedOccurrence;
      }
      return true;
    });
  }else{
    const prior=task.excludedDays;
    task.excludedDays=[...(prior||[]),day];
    if(!persist()){task.excludedDays=prior;return;}
    refreshTasks();
    confirmChange(`Skipped ${shortScheduleDate(day)}.`,latest=>{
      const current=latest.tasks.find(item=>item.id===task.id);
      if(!current?.excludedDays?.includes(day))return false;
      current.excludedDays=current.excludedDays.filter(date=>date!==day);return true;
    });
  }
  $('#planner-heading').focus({preventScroll:true});
}

function closeTaskMenu(restore=true){
  if(taskMenu.hidden)return;
  taskMenu.hidden=true;
  if(menuAnchor?.classList.contains('task-more'))menuAnchor.setAttribute('aria-expanded','false');
  if(restore&&menuAnchor?.isConnected)menuAnchor.focus({preventScroll:true});
  menuTaskId=null;
  menuAnchor=null;
  wake();
}

function deleteTask(id){
  const index=state.tasks.findIndex(task=>task.id===id);
  if(index<0)return;
  const undo=restoreDeletedTask(state.tasks[index],index),before=state.activeTask;
  state.tasks=state.tasks.filter(task=>task.id!==id);
  if(state.activeTask===id)state.activeTask=null;
  persist();refreshTasks();
  const focus=state.focusMode?currentTaskButton:inSchedule()?$('#planner-heading'):taskSidebar.hidden?taskToggle:$('#sidebar-add-task');
  focus.focus({preventScroll:true});
  confirmChange('Task deleted.',restoreActiveTask(undo,before,state.activeTask));
}
let nextCompletionRipple=false;
function animateTaskCompletion(anchor){
  if(motionPreference.matches||!anchor?.getClientRects().length)return;
  const row=anchor.closest('.planner-task,.task-card,.task-detail-panel,.daily-ritual');
  const ripple=nextCompletionRipple;
  nextCompletionRipple=!nextCompletionRipple;
  const target=ripple
    ?row?.querySelector('.planner-check,.task-check,.task-detail-check,.ritual-check')
    :row?.querySelector('.planner-task-title,.task-open,#panel-title,.ritual-open');
  const rect=(target||anchor).getBoundingClientRect();
  const width=Math.min(rect.width,innerWidth-rect.left,190);
  if(width<=0||rect.bottom<0||rect.bottom>innerHeight)return;
  const effect=document.createElement('span');
  effect.className=ripple?'task-completion-ripple':'task-completion-ink';
  effect.setAttribute('aria-hidden','true');
  effect.style.left=`${ripple?rect.left+rect.width/2:rect.left}px`;
  effect.style.top=`${ripple?rect.top+rect.height/2:rect.bottom}px`;
  if(!ripple)effect.style.width=`${width}px`;
  app.append(effect);
  effect.addEventListener('animationend',()=>effect.remove(),{once:true});
  setTimeout(()=>effect.remove(),760);
}
function markTask(task,done,day=new Date(),anchor){
  const before=state.activeTask;
  const undo=recordTaskCompletion(state,task,done,day);
  if(done&&undo)animateTaskCompletion(anchor);
  if(done&&state.activeTask===task.id&&taskStatus(task)==='done')state.activeTask=null;
  return restoreActiveTask(undo,before,state.activeTask);
}

function finishCurrentTask(button){
  checkCompletion();
  const task=focusedTask();
  if(!task||task.id!==button.dataset.taskId){closePanel();announce('The current task changed.');return;}
  const now=Date.now();
  const priorTimer=state.timer, priorSelection=state.activeTask, priorHistoryLength=state.history.length;
  const today=new Date(now);
  const wasBundle=activeBundleStatus(today);
  const minutes=priorTimer.taskPlan?.taskId===task.id?priorTimer.taskPlan.totalMs/60000:taskFocusMinutes(task,now);
  const occurrence=finishTaskOccurrence(task,today,priorTimer);
  const undo=taskStatus(task,occurrence)!=='done'?recordTaskCompletion(state,task,true,occurrence,now):null;
  if(priorTimer.mode==='focus')record(state,'completed',now,{early:true});
  state.activeTask=null;
  if(button.dataset.finishTask==='break')taskFinishBreak(state,minutes);else reset(state,'focus');
  const active=activeBundleStatus(today);
  const finishedBundle=wasBundle?.next?.id===task.id&&!wasBundle.run.paused&&!active?.next;
  const next=finishedBundle?undefined:focusedTask();
  if(next&&state.timer.mode==='focus')startTaskTiming(state,next.id,taskFocusMinutes(next,now));
  if(next||state.timer.mode==='break'||!finishedBundle&&(!active?.next||active.run.paused))toggleFocusTimer(next,now);
  if(!persist()){
    undo?.(state);
    state.timer=priorTimer;state.activeTask=priorSelection;state.history.length=priorHistoryLength;
    return;
  }
  if(undo)animateTaskCompletion(finishTaskButton);
  resumeTaskId=null;
  closePanel(false);refreshTasks();wake();
  timerButton.focus({preventScroll:true});
  const activity=state.timer.mode==='break'?'Break started.':state.timer.status==='running'?'Focus started.':
    activeBundleStatus()?.next?'Bundle is waiting on the next task.':'Bundle complete.';
  confirmChange(`Task finished. ${activity}${next?` Up next: ${next.text}.`:''}`,undo);
}

taskMenu.addEventListener('click',event=>{
  const action=event.target.closest('[data-task-action]')?.dataset.taskAction;
  const task=state.tasks.find(item=>item.id===menuTaskId);
  if(action==='skip-date'&&menuAnchor){const anchor=menuAnchor;closeTaskMenu(false);skipCalendarDate(task,anchor);return;}
  if(!action||!task)return;
  const anchor=menuAnchor;
  const blockSurface=anchor.closest('#mini-calendar')||calendarPanel;
  closeTaskMenu(false);
  if(action==='block-focus'){openCalendarBlock(anchor);return;}
  if(action==='edit'){openTaskEditor(task.id,anchor);return;}
  if(action==='color'){taskColorMenuId=task.id;openPanel('task-color',anchor);return;}
  if(action==='plan-deadline'){openDeadlinePlanner(task.id,anchor);return;}
  if(action==='schedule'||action==='edit-block'){openBlockEditor(task.id,anchor,action==='edit-block'?anchor.dataset.block:null);return;}
  if(action==='delete'){deleteTask(task.id);return;}
  if(action==='duplicate'){
    const copy=structuredClone(task);
    Object.assign(copy,{id:crypto.randomUUID(),done:false,completedOn:'',completions:[],occurrenceTimes:{},occurrenceMinutes:{},excludedDays:[],reminderShown:false});
    copy.subtasks?.forEach(subtask=>{subtask.id=crypto.randomUUID();subtask.done=false;});
    copy.blocks?.forEach(block=>{block.id=crypto.randomUUID();});
    state.tasks.push(copy);persist();refreshTasks();announce('Task duplicated.');
    (inSchedule()?$('#planner-heading'):taskButton(copy.id))?.focus({preventScroll:true});return;
  }
  if(action==='priority'){
    task.priorityLevel=taskPriority(task)===4?1:4;
    task.priority=task.priorityLevel!==4;
  }
  if(action==='focus'){
    if(waitingOn(task).length){announce('Finish the prerequisites before focusing on this task.');return;}
    if(state.activeTask===task.id){
      state.activeTask=null;
      if(state.timer.taskPlan&&!state.timer.id)reset(state,'focus');
    }else if(!saveTaskSelection(task))return;
  }
  let undo,message;
  if(action==='complete'){
    const day=taskOccurrence(anchor);
    const done=taskStatus(task,day)!=='done';
    undo=markTask(task,done,day,anchor);
    message=done?'Task completed.':'Task reopened.';
  }
  if(action==='unschedule'||action==='remove-block'){
    const scheduleUndo=captureTaskChange(task,['time','blocks','occurrenceTimes']);
    if(action==='unschedule'){task.time='';task.occurrenceTimes={};}
    else task.blocks=task.blocks.filter(block=>block.id!==anchor.dataset.block);
    undo=scheduleUndo();message=action==='unschedule'?'Task unscheduled.':'Block deleted.';
  }
  persist();refreshTasks();
  const block=blockSurface.querySelector(`[data-task="${CSS.escape(task.id)}"]`);
  const next=anchor.classList.contains('calendar-block')?block||$(blockSurface===miniCalendar?'#sidebar-calendar':'#close-calendar'):taskButton(task.id);
  (next||(inSchedule()?$('#planner-heading'):taskToggle)).focus({preventScroll:true});
  if(message)confirmChange(message,undo);
});

taskMenu.addEventListener('keydown',event=>{
  const items=[...taskMenu.querySelectorAll('button')];
  const index=items.indexOf(document.activeElement);
  if(event.key==='Tab'){event.preventDefault();closeTaskMenu();return;}
  const next={ArrowDown:(index+1)%items.length,ArrowUp:(index+items.length-1)%items.length,Home:0,End:items.length-1}[event.key];
  if(next===undefined)return;
  event.preventDefault();items[next].focus();
});

for(const surface of [taskSidebar,calendarPanel]){
  surface.addEventListener('contextmenu',event=>{
    const calendarItem=event.target.closest('[data-calendar-event][data-event-day]');
    if(calendarItem){
      const item=state.calendarEvents.find(e=>e.id===calendarItem.dataset.calendarEvent);
      if(item&&((item.manual&&item.repeat&&item.repeat!=='none')||item.source)){
        event.preventDefault();closeTaskMenu(false);menuAnchor=calendarItem;
        const keyboard=event.clientX===0&&event.clientY===0;
        showTaskMenu([['skip-date','Skip this date']],calendarItem,keyboard?undefined:event.clientX,keyboard?undefined:event.clientY);
      }
      return;
    }
    const card=event.target.closest('[data-task]');
    if(!card)return;
    event.preventDefault();
    const anchor=card.querySelector('.task-more')||card;
    const keyboard=event.clientX===0&&event.clientY===0;
    openTaskMenu(card.dataset.task,anchor,keyboard?undefined:event.clientX,keyboard?undefined:event.clientY);
  });
  surface.addEventListener('dragstart',event=>{
    const card=event.target.closest('[data-task][draggable]');
    if(!card||!event.dataTransfer)return;
    closeTaskMenu(false);
    event.dataTransfer.setData(calendarDragType,JSON.stringify({task:card.dataset.task,move:card.classList.contains('calendar-block'),block:card.dataset.block||null,occurrence:card.dataset.occurrence}));
    event.dataTransfer.effectAllowed='move';
    const day=card.closest('.calendar-day');
    dragOffset=day?(event.clientY-card.getBoundingClientRect().top)*Number(day.dataset.span||1440)/day.offsetHeight:0;
    card.classList.add('task-dragging');
  });
}

function clearDropTarget(){
  $('.calendar-drop-target')?.classList.remove('calendar-drop-target');
}

function dropMinute(event,column){
  const bounds=column.getBoundingClientRect();
  const span=Number(column.dataset.span||1440);
  const offset=(event.clientY-bounds.top)/bounds.height*span-dragOffset;
  return Math.min(span-15,Math.max(0,Math.floor(offset/15)*15));
}

function onCalendarDragOver(event){
  if(workspace==='calendar'&&actualCalendar)return;
  const column=event.target.closest('.calendar-day');
  if(!column||!event.dataTransfer?.types.includes(calendarDragType))return;
  event.preventDefault();
  event.dataTransfer.dropEffect='move';
  if(!column.classList.contains('calendar-drop-target'))clearDropTarget();
  column.classList.add('calendar-drop-target');
  column.style.setProperty('--drop-minute',dropMinute(event,column));
}
function onCalendarDragLeave(event){
  const column=event.target.closest('.calendar-day');
  if(column&&!column.contains(event.relatedTarget))clearDropTarget();
}
document.addEventListener('dragend',()=>{dragOffset=0;clearDropTarget();$('.task-dragging')?.classList.remove('task-dragging');});
let pendingDrop;
function dropPlacement(task,drag,date,start){
  const block=drag.block&&task.blocks?.find(item=>item.id===drag.block);
  if(drag.block&&!block)return null;
  const replacing=drag.move||drag.block?{taskId:task.id,blockId:drag.block||null}:null;
  return {date,start,minutes:block?.minutes||task.estimate||60,replacing};
}
function scheduleDropMarkup(){
  const {drag,date,start}=pendingDrop;
  const task=state.tasks.find(item=>item.id===drag.task);
  const placement=task&&dropPlacement(task,drag,date,start);
  const preview=placement&&schedulePreview(placement);
  const heading=header('CALENDAR',drag.move?'Review this move':'Review this block');
  if(!preview)return `${heading}<p>This task or block is unavailable.</p>`;
  pendingDrop.overlaps=preview.overlaps;
  pendingDrop.minutes=placement.minutes;
  return `${heading}<p><strong>${escape(task.text)}</strong><br>${shortScheduleDate(date)} · ${timeLabel(start)} · ${minutesLabel(placement.minutes)}</p>
    <div class="schedule-preview">${preview.markup}</div>
    <form id="schedule-drop-form"><div class="panel-actions"><button type="button" class="text-button close-panel">Cancel</button>
      <button type="submit" class="panel-primary">${preview.overlaps.length?'Save with overlap':drag.move?'Move block':'Schedule block'}</button></div></form>`;
}
function saveScheduleDrop(){
  const {drag,date,start,minutes,overlaps}=pendingDrop;
  const task=state.tasks.find(item=>item.id===drag.task);
  const placement=task&&dropPlacement(task,drag,date,start);
  const preview=placement&&schedulePreview(placement);
  if(!preview||placement.minutes!==minutes||JSON.stringify(preview.overlaps)!==JSON.stringify(overlaps)){
    refreshPanel();announce('The schedule changed. Review the updated placement.');return;
  }
  commitCalendarDrop(task,drag,date,start);
}
function onCalendarDrop(event){
  if(workspace==='calendar'&&actualCalendar)return;
  const column=event.target.closest('.calendar-day');
  if(!column||!event.dataTransfer?.types.includes(calendarDragType))return;
  event.preventDefault();clearDropTarget();
  $('.task-dragging')?.classList.remove('task-dragging');
  let drag;
  try{drag=JSON.parse(event.dataTransfer.getData(calendarDragType));}catch{return;}
  if(!drag)return;
  const task=state.tasks.find(item=>item.id===drag.task);
  if(!task)return;
  const weekday=new Date(`${column.dataset.date}T00:00:00`).getDay();
  if(drag.move&&!drag.block&&task.repeat==='weekdays'&&(weekday===0||weekday===6)){
    toast('This task repeats on weekdays. Choose a weekday.');return;
  }
  const minute=Number(column.dataset.from||0)+dropMinute(event,column);
  const date=column.dataset.date;
  dragOffset=0;
  const placement=dropPlacement(task,drag,date,minute);
  const preview=placement&&schedulePreview(placement);
  if(!preview)return;
  if(date===dayKey()||preview.overlaps.length){
    pendingDrop={drag,date,start:minute};
    openPanel('schedule-drop',column.closest('#mini-calendar')?$('#sidebar-calendar'):calendarScroll);
    return;
  }
  commitCalendarDrop(task,drag,date,minute);
}
function commitCalendarDrop(task,drag,date,minute){
  const finishUndo=captureTaskChange(task,drag.block||!drag.move?['blocks']:['date','time','occurrenceTimes']);
  const before=state.activeTask;
  if(drag.block){
    const block=task.blocks?.find(item=>item.id===drag.block);
    if(!block)return;
    block.date=date;
    block.time=timeValue(minute);
  }else if(drag.move){
    if(drag.occurrence===date&&task.occurrenceTimes?.[date]){
      task.occurrenceTimes={...task.occurrenceTimes,[date]:timeValue(minute)};
    }else{
      scheduleTask(task,date,minute);
      task.occurrenceTimes={};
    }
  }
  else addTaskBlock(task,date,timeValue(minute));
  if(state.activeTask===task.id&&taskStatus(task)!=='todo')state.activeTask=null;
  const undo=restoreActiveTask(finishUndo(),before,state.activeTask);
  if(!persist()){undo?.(state);return;}
  if(activePanel==='schedule-drop')closePanel();
  refreshTasks();
  confirmChange(`Task scheduled for ${timeLabel(minute)}.`,undo);
}
for(const calendar of [calendarPanel,miniCalendar]){
  calendar.addEventListener('dragover',onCalendarDragOver);
  calendar.addEventListener('dragleave',onCalendarDragLeave);
  calendar.addEventListener('drop',onCalendarDrop);
}
function openCalendarBlock(block){
  if(block.dataset.calendarEvent){
    const event=state.calendarEvents.find(item=>item.id===block.dataset.calendarEvent);
    if(event?.manual)openCalendarEvent(block);else openPanel('imported-event',block);
    return;
  }
  openPanel('calendar-block',block);
  updateBlockPreview(Date.now());
  $('#start-block-focus:not(:disabled)')?.focus({preventScroll:true});
}
function calendarDraft(){
  const date=planner.calendarVisible()?leadingPlannerDay():planner.calendarAnchor();
  const now=new Date(), key=dayKey(date);
  const minute=key===dayKey(now)?Math.min(23*60+45,Math.ceil((now.getHours()*60+now.getMinutes())/15)*15):9*60;
  return {date:key,time:timeValue(minute)};
}

function schedulingCutoff(){return timeMinutes(state.replanCutoff)||24*60;}
function minutesLabel(minutes){
  const hours=Math.floor(minutes/60),rest=minutes%60;
  if(!hours)return `${rest} min`;
  return `${hours} h${rest?` ${rest} min`:''}`;
}
function shortScheduleDate(date){
  return new Date(date+'T12:00:00').toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'});
}
function schedulePreviewRegion(){
  return '<div class="schedule-preview" data-schedule-preview aria-live="polite" hidden></div>';
}
function schedulePreview(placement){
  const cutoff=schedulingCutoff();
  const impact=scheduleImpact(gardenTasks(),state.calendarEvents,placement,new Date(),cutoff);
  if(!impact)return null;
  const {isToday,freeAfter,usesFreeMinutes,overlaps}=impact;
  const when=isToday?'today':`on ${shortScheduleDate(placement.date)}`;
  const list=overlaps.map(item=>{
    const date=item.date===placement.date?'':`${shortScheduleDate(item.date)} · `;
    return `<li><span>${escape(item.title)}</span><small>${date}${timeLabel(item.start)}–${timeLabel(item.end)}</small></li>`;
  }).join('');
  const markup=`<p><strong>${minutesLabel(freeAfter)} free</strong> ${when} until ${timeLabel(cutoff)}.</p>
    <p>${usesFreeMinutes?`Uses ${minutesLabel(usesFreeMinutes)} of open time.`:'Uses none of the remaining open time.'}</p>
    ${list?`<p class="schedule-overlap-heading">Overlaps ${overlaps.length} ${overlaps.length===1?'commitment':'commitments'}</p><ul>${list}</ul><p>Saving keeps the overlap.</p>`:'<p>No timed overlaps.</p>'}`;
  return {markup,overlaps};
}
function previewTaskSchedule(task,replacing){
  if(!task.date||!task.time)return null;
  const date=nextTaskDate(task,new Date(task.date+'T00:00:00'),true);
  return date?schedulePreview({date,start:timeMinutes(task.time),minutes:task.estimate||60,replacing}):null;
}
function updateScheduleEditor(form){
  const fields=form.elements;
  const isTask=form.id==='task-editor-form';
  const task=state.tasks.find(item=>item.id===editingTaskId);
  const minutes=isTask?(fields.estimate.value?Number(fields.estimate.value):60):Number(fields.minutes.value);
  const date=fields.date.value||(isTask?dayKey():'');
  const comparable=isTask?{text:fields.title.value,labels:taskLabels(fields.labels.value)}:task;
  const suggestion=comparable&&suggestTaskEstimate(state,comparable);
  const estimateRegion=form.querySelector('[data-estimate-suggestion]');
  estimateRegion.hidden=!suggestion;
  if(suggestion){
    const hint=`<p>${estimateSummary(suggestion)}</p><button type="button" class="text-button" data-use-estimate="${suggestion.estimate}">Use ${suggestion.estimate} min</button>`;
    if(estimateRegion.innerHTML!==hint)estimateRegion.innerHTML=hint;
  }
  let preview=null;
  if(fields.time.value&&date){
    const replacing=task&&(isTask||editingBlockId)?{taskId:task.id,blockId:isTask?null:editingBlockId}:null;
    preview=isTask
      ?previewTaskSchedule({date,time:fields.time.value,estimate:minutes,repeat:fields.repeat.value,repeatEvery:Number(fields.repeatEvery.value)},replacing)
      :schedulePreview({date,start:timeMinutes(fields.time.value),minutes,replacing});
  }
  const region=form.querySelector('[data-schedule-preview]');
  region.hidden=!preview;
  const markup=preview?.markup||'';
  if(region.innerHTML!==markup)region.innerHTML=markup;
  if(isTask){
    $('#task-plan-deadline').hidden=Boolean(fields.waitingFor.value.trim())||!canPlanDeadline({done:task?.done,estimate:Number(fields.estimate.value),deadline:fields.deadline.value,repeat:fields.repeat.value});
  }else{
    form.querySelector('button[type="submit"]').textContent=preview?.overlaps.length?'Save with overlap':'Save block';
  }
}

let deadlineTaskId=null,deadlinePreview=null;
function openDeadlinePlanner(taskId,anchor){
  deadlineTaskId=taskId;
  openPanel('plan-deadline',anchor);
}
function deadlineSuggestion(task){
  return planDeadline(task,gardenTasks(),state.calendarEvents,state.history,new Date(),schedulingCutoff(),state.studyCapacity,
    {availability:state.availability,cooldown:state.planningCooldown});
}
function slotExplanation(context,deadline,cooldown,edited=false){
  if(!context)return '';
  const commitments=context.commitments.map(block=>{
    const buffers=[block.before?`${block.before} min before`:'',block.after?`${block.after} min after`:''].filter(Boolean);
    return `<li>${escape(block.title)} · ${block.allDay?'All day':`${timeLabel(block.start)}–${timeLabel(block.end)}`}${buffers.length?` reserved (event buffers: ${buffers.join(' · ')})`:''}</li>`;
  }).join('');
  return `<details class="slot-explanation"><summary>${edited?'Schedule details':'Why this time?'}</summary>
    <p>Due ${shortScheduleDate(deadline)} · ${minutesLabel(context.free)} free between ${timeLabel(context.from)} and ${timeLabel(context.end)} around existing commitments.
    ${cooldown?`Free time allows for ${cooldown} min between calendar blocks.`:''}</p>
    ${commitments?`<ul>${commitments}</ul>`:'<p>No commitments in this window.</p>'}</details>`;
}
function deadlinePlannerMarkup(){
  const tasks=gardenTasks().filter(canPlanDeadline).sort((a,b)=>a.deadline.localeCompare(b.deadline)||a.text.localeCompare(b.text));
  const selected=tasks.find(task=>task.id===deadlineTaskId)||tasks[0];
  const heading=header('PLANNER','Plan to deadline');
  deadlineTaskId=selected?.id||null;
  deadlinePreview=selected?deadlineSuggestion(selected):null;
  if(!selected)return `${heading}<p>Give an unfinished task a deadline and an estimate to get suggested blocks.</p>`;
  const plan=deadlinePreview;
  const options=tasks.map(task=>`<option value="${escape(task.id)}" ${task===selected?'selected':''}>${escape(task.text)} · ${shortScheduleDate(task.deadline)}</option>`).join('');
  const selection=`<label class="field-label" for="deadline-plan-task">Task</label><select id="deadline-plan-task">${options}</select>`;
  if(!plan)return `${heading}${selection}<p>Enter a valid deadline in the task editor.</p>`;
  if(plan.noOccurrence)return `${heading}${selection}<p>${minutesLabel(plan.unplaced)} couldn’t be scheduled. There’s no unfinished occurrence between today and the deadline.</p>`;
  const waiting=waitingOn(selected);
  const suggestions=plan.slots.map((slot,index)=>`<li><label><input type="checkbox" name="slot" value="${index}" checked>
    <span><strong>${shortScheduleDate(slot.date)}</strong><small>${timeLabel(slot.start)}–${timeLabel(slot.start+slot.minutes)} · ${slot.minutes} min</small></span></label>
    ${slotExplanation(plan.contexts[slot.date],selected.deadline,state.planningCooldown)}</li>`).join('');
  return `${heading}${selection}
    <p class="deadline-plan-details">Due ${shortScheduleDate(selected.deadline)} · ${minutesLabel(selected.estimate)} estimated.
      Suggestions use 9 AM to ${timeLabel(schedulingCutoff())} and your ${minutesLabel(state.studyCapacity)} daily study capacity.${plan.lastYearOnly?' Showing availability for up to one year before the deadline.':''}</p>
    ${plan.occurrence?`<p>Planning the ${shortScheduleDate(plan.occurrence)} occurrence.</p>`:''}
    ${plan.booked||plan.recorded?`<p>${minutesLabel(plan.booked)} already booked · ${minutesLabel(plan.recorded)} completed focus.</p>`:''}
    ${waiting.length?`<p class="task-waiting">Waiting on ${escape(waiting.map(item=>item.text).join(', '))}. You can reserve time in advance.</p>`:''}
    <form id="deadline-plan-form">
      <p id="deadline-plan-status" aria-live="polite" ${plan.unplaced?'data-shortfall':''}>${plan.unplaced?`${minutesLabel(plan.unplaced)} couldn’t fit before the deadline.`:
        plan.slots.length?'The suggestions cover the remaining estimate.':'Booked or completed focus already covers the estimate.'}</p>
      ${suggestions?`<ul class="replan-moves deadline-plan-slots">${suggestions}</ul><div class="panel-actions"><button class="panel-primary" type="submit">Add selected blocks</button></div>`:''}
    </form>`;
}
function selectedDeadlineSlots(form,plan){
  return new FormData(form).getAll('slot').map(index=>plan.slots[Number(index)]).filter(Boolean);
}
function saveDeadlinePlan(form){
  const task=gardenTasks().find(item=>item.id===deadlineTaskId);
  if(!task)return;
  const current=deadlineSuggestion(task);
  if(!current||JSON.stringify(current)!==JSON.stringify(deadlinePreview)){
    refreshPanel();announce('The schedule changed. Review the updated suggestions.');return;
  }
  const slots=selectedDeadlineSlots(form,current);
  if(!slots.length)return;
  const previous=task.blocks;
  const finishUndo=captureTaskChange(task,['blocks']);
  task.blocks=[...(previous||[])];
  for(const slot of slots){
    const block=addTaskBlock(task,slot.date,timeValue(slot.start),slot.minutes);
    if(current.occurrence)block.taskDay=current.occurrence;
  }
  if(!persist()){task.blocks=previous;return;}
  const first=slots[0];
  openSchedule('calendar',calendarToggle,new Date(first.date+'T00:00:00'),Math.max(0,first.start-30));
  refreshTasks();
  const missing=current.unplaced+current.slots.filter(slot=>!slots.includes(slot)).reduce((total,slot)=>total+slot.minutes,0);
  confirmChange(`${slots.length} focus ${slots.length===1?'block':'blocks'} added.${missing?` ${minutesLabel(missing)} still unscheduled.`:''}`,finishUndo());
}

let weekSettings, weekDraft, weekComparison=[], weekSlots=[], skippedWeekSlots=[], weekEditId=null;
const approvedWeekDays=new Map();

function openWeekBuilder(anchor){
  const end=Math.min(1439,schedulingCutoff());
  weekSettings={date:dayKey(),start:Math.min(9*60,end-1),end,capacity:state.studyCapacity,cooldown:state.planningCooldown};
  weekDraft=null;
  weekComparison=[];
  weekSlots=[];skippedWeekSlots=[];weekEditId=null;
  approvedWeekDays.clear();
  openPanel('build-week',anchor);
}

function weekData(){
  return {tasks:gardenTasks(),events:state.calendarEvents,history:state.history,availability:state.availability,tasksById:taskIndex()};
}
function currentWeekDraft(proposed){
  return draftStudyWeek(weekData(),{...weekSettings,proposed});
}
function weekComparisonMarkup(){
  if(!weekComparison.length)return '';
  return `<div class="week-comparison" aria-label="Weekly draft comparison">${weekComparison.map(({id,name,settings,draft})=>{
    const used=draft.days.filter(day=>day.slots.length);
    const planned=used.flatMap(day=>day.slots).reduce((sum,slot)=>sum+slot.minutes,0);
    const flex=draft.days.reduce((sum,day)=>sum+day.flexibility,0);
    const covered=draft.deadlines-draft.risks.length;
    return `<section><h3>${name}</h3><p>${settings.capacity} min/day limit · ${minutesLabel(planned)} proposed</p>
      <p>${covered} of ${draft.deadlines} deadlines covered · ${minutesLabel(flex)} spare study capacity</p>
      <p>${used.length?`Last new block · ${shortScheduleDate(used.at(-1).date)}`:'No new blocks'}</p>
      ${draft.risks.length?`<ul>${draft.risks.map(risk=>`<li>${escape(risk.task.text)} · ${weekRiskText(risk)}</li>`).join('')}</ul>`:''}
      <button type="button" class="panel-primary" data-use-week-draft="${id}">Use ${name.toLowerCase()}</button></section>`;
  }).join('')}</div>`;
}

function weekRiskText({reason,unplaced}){
  if(reason==='estimate')return 'Add a time estimate';
  if(reason==='overdue')return `${minutesLabel(unplaced)} unplanned · deadline passed`;
  if(reason==='occurrence')return 'No open occurrence before the deadline';
  if(reason==='prerequisite')return `${minutesLabel(unplaced)} unplanned · waiting on a prerequisite`;
  if(reason==='waiting')return `${minutesLabel(unplaced)} unplanned · waiting for a follow-up`;
  if(reason==='unplanned')return `${minutesLabel(unplaced)} still unplanned before the deadline`;
  return `${minutesLabel(unplaced)} couldn’t fit before the deadline`;
}

function buildWeekMarkup(){
  const heading=header('PLANNER','Build my week');
  const {date,start,end,capacity,cooldown}=weekSettings;
  const tasks=taskIndex();
  const results=weekDraft?.days.map(day=>{
    const approved=approvedWeekDays.get(day.date)||0;
    const label=new Date(`${day.date}T12:00:00`).toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'});
    return `<section class="week-draft-day"><h3>${label}</h3>
      ${approved?`<p>${approved} ${approved===1?'block':'blocks'} approved</p>`:''}
      ${day.slots.length?`<ul>${day.slots.map(slot=>{
        const task=tasks.get(slot.taskId);
        const invalid=weekDraft.invalid.includes(slot);
        return `<li><strong>${escape(task?.text||'Task unavailable')}</strong>
          <span>${timeLabel(slot.start)}–${timeLabel(slot.start+slot.minutes)}${invalid?' · Needs a new time':''}</span>
          ${task?.deadline?slotExplanation(day.context,task.deadline,cooldown,slot.edited):''}
          ${slot.draftId===weekEditId?`<form id="week-slot-form">
            <label>Day<select name="date">${weekDraft.days.map(option=>`<option value="${option.date}" ${option.date===slot.date?'selected':''}>${shortScheduleDate(option.date)}</option>`).join('')}</select></label>
            <label>Start time<input type="time" name="start" required value="${timeValue(slot.start)}"></label>
            <label>Minutes<input type="number" name="minutes" min="1" max="50" required value="${slot.minutes}"></label>
            <p id="week-slot-error" role="alert" hidden></p>
            <div class="week-slot-actions"><button class="panel-primary" type="submit">Save block</button><button class="text-button" type="button" data-cancel-week-slot>Cancel</button></div>
          </form>`:`<div class="week-slot-actions"><button class="text-button" type="button" data-edit-week-slot="${slot.draftId}">Edit block</button>
            <button class="text-button" type="button" data-skip-week-slot="${slot.draftId}">Skip block</button></div>`}</li>`;
      }).join('')}</ul>
        <button type="button" class="text-button" data-approve-week-day="${day.date}" aria-label="Approve ${label}">Approve day</button>`:
        approved?'':'<p>No new blocks suggested.</p>'}</section>`;
  }).join('');
  return `${heading}<p>Draft seven days for tasks due by the end of the period. The draft uses your recurring availability and keeps existing commitments in place.</p>
    <form id="build-week-form" class="week-draft-settings">
      <label>First day<input name="date" type="date" min="${dayKey()}" value="${escape(date)}" required></label>
      <label>Available from<input name="start" type="time" value="${timeValue(start)}" required></label>
      <label>Available until<input name="end" type="time" value="${timeValue(end)}" required></label>
      <label>Study minutes per day<input name="capacity" type="number" min="1" max="1440" value="${capacity}" required></label>
      <label>Cooldown between blocks (min)<input name="cooldown" type="number" min="0" max="30" value="${cooldown}" required></label>
      <p id="week-draft-error" class="event-error" role="alert" hidden></p>
      <div class="panel-actions"><button class="panel-primary" id="draft-week-button">${weekDraft?'Refresh draft':'Draft week'}</button>
      <button class="text-button" type="submit" value="compare">Compare drafts</button></div>
    </form>
    ${weekComparisonMarkup()}
    ${weekDraft?`<div id="week-draft-results">
      <div class="week-draft-summary"><h3 id="week-draft-heading" tabindex="-1">Draft schedule</h3>
        <span>${weekSlots.length} pending · ${minutesLabel(weekSlots.reduce((sum,slot)=>sum+slot.minutes,0))} planned</span></div>
      ${weekDraft.risks.length?`<section class="week-draft-risks"><h4>Deadlines at risk</h4><ul>${weekDraft.risks.map(risk=>
        `<li><strong>${escape(risk.task.text)}</strong><span>Due ${shortScheduleDate(risk.task.deadline)} · ${weekRiskText(risk)}</span></li>`).join('')}</ul></section>`:
        `<p>${weekDraft.deadlines?'The draft and existing work cover the estimated time for these deadlines.':'No open tasks have deadlines in this range or earlier.'}</p>`}
      <div class="week-draft-days">${results}</div>
      ${skippedWeekSlots.length?`<details open class="week-draft-skipped"><summary>Skipped blocks (${skippedWeekSlots.length})</summary>
        <ul>${skippedWeekSlots.map(slot=>`<li><span><strong>${escape(tasks.get(slot.taskId)?.text||'Task unavailable')}</strong>
          <small>${shortScheduleDate(slot.date)} · ${timeLabel(slot.start)} · ${minutesLabel(slot.minutes)}</small></span>
          <button type="button" class="text-button" data-restore-week-slot="${slot.draftId}">Restore block</button></li>`).join('')}</ul></details>`:''}</div>`:''}`;
}

function draftWeek(form,compare=false){
  const {date,start,end,capacity,cooldown}=form.elements;
  const previous=weekSettings;
  weekSettings={date:date.value,start:timeMinutes(start.value),end:timeMinutes(end.value),capacity:Number(capacity.value),cooldown:Number(cooldown.value)};
  const draft=currentWeekDraft();
  if(!draft){
    weekSettings=previous;
    const error=$('#week-draft-error');error.hidden=false;
    error.textContent='Choose today or a future date and an end time after the start time.';
    return;
  }
  if(compare){
    weekComparison=compareStudyWeeks(weekData(),weekSettings);
    weekSettings=previous;
    $('#week-draft-error').hidden=true;
    const existing=$('.week-comparison');
    existing?.remove();
    form.insertAdjacentHTML('afterend',weekComparisonMarkup());
    $('[data-use-week-draft]')?.focus();return;
  }
  weekComparison=[];
  if(state.planningCooldown!==weekSettings.cooldown){
    const old=state.planningCooldown;state.planningCooldown=weekSettings.cooldown;
    if(!persist())state.planningCooldown=old;
  }
  showWeekDraft(draft);
}
function showWeekDraft(draft){
  weekSlots=draft.days.flatMap(day=>day.slots);
  weekSlots.forEach((slot,index)=>{slot.draftId=index;});
  weekEditId=null;weekDraft=draft;skippedWeekSlots=[];
  refreshPanel();
  $('#week-draft-heading').focus({preventScroll:true});
}

function updateWeekSlot(form){
  const old=weekSlots.find(slot=>slot.draftId===weekEditId);
  if(!old)return;
  const fields=new FormData(form);
  const edited={...old,date:fields.get('date'),start:timeMinutes(fields.get('start')),minutes:Number(fields.get('minutes')),edited:true};
  const slots=weekSlots.map(slot=>slot===old?edited:slot);
  const draft=currentWeekDraft(slots);
  if(!draft||draft.invalid.some(slot=>slot.date===edited.date)){
    const error=$('#week-slot-error');error.hidden=false;
    error.textContent='Choose an open time before the deadline that fits the daily limit and leaves the cooldown.';return;
  }
  weekSlots=slots;weekDraft=draft;weekEditId=null;refreshPanel();
  $(`[data-edit-week-slot="${edited.draftId}"]`)?.focus({preventScroll:true});
}

function approveWeekDay(date){
  const draft=currentWeekDraft(weekSlots);
  const slots=draft?.days.find(day=>day.date===date)?.slots;
  if(!slots?.length||draft.invalid.some(slot=>slot.date===date)){
    if(draft)weekDraft=draft;
    refreshPanel();
    ($('#week-draft-heading')||$('#draft-week-button')).focus({preventScroll:true});
    confirmChange('Some blocks no longer fit. Edit or skip them before approving.');
    return;
  }
  const tasks=taskIndex(), previous=new Map();
  for(const slot of slots){
    const task=tasks.get(slot.taskId);
    if(!previous.has(task)){
      previous.set(task,task.blocks);
      task.blocks=[...(task.blocks||[])];
    }
    const block=addTaskBlock(task,date,timeValue(slot.start),slot.minutes);
    if(slot.occurrence)block.taskDay=slot.occurrence;
  }
  if(!persist()){
    for(const [task,blocks] of previous)task.blocks=blocks;
    return;
  }
  approvedWeekDays.set(date,(approvedWeekDays.get(date)||0)+slots.length);
  weekSlots=weekSlots.filter(slot=>slot.date!==date);
  weekDraft=currentWeekDraft(weekSlots);weekEditId=null;
  refreshTasks();refreshPanel();
  $('#week-draft-heading').focus({preventScroll:true});
  confirmChange(`${slots.length} focus ${slots.length===1?'block':'blocks'} added for ${shortScheduleDate(date)}.`);
}

let replanPreview;
const availabilityDays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let editingAvailabilityId='';
function availabilityMarkup(){
  const rule=state.availability.find(item=>item.id===editingAvailabilityId);
  const rows=state.availability.map(item=>`<li><span><strong>${escape(item.name)}</strong><small>${item.days.map(day=>availabilityDays[day]).join(', ')} ·
    ${item.allDay?'All day':`${timeLabel(timeMinutes(item.start))}–${timeLabel(timeMinutes(item.end))}${item.end<item.start?' next day':''}`}</small></span>
    <button type="button" class="text-button" data-edit-availability="${escape(item.id)}" aria-label="Edit ${escape(item.name)}">Edit</button></li>`).join('');
  return `${header('CALENDAR','Recurring availability')}
    <p>Build my week, Plan tomorrow, and Replan today leave these times free.</p>
    ${rows?`<ul class="availability-rules">${rows}</ul>`:''}
    <form id="availability-form">
      <label class="field-label" for="availability-name">Block name</label><input id="availability-name" name="name" maxlength="60" required placeholder="Work hours" value="${escape(rule?.name)}">
      <fieldset class="availability-days"><legend>Repeat on</legend>${availabilityDays.map((name,index)=>
        `<label><input type="checkbox" name="day" value="${index}" ${rule?.days.includes(index)?'checked':''}> ${name}</label>`).join('')}</fieldset>
      <label class="availability-all-day"><input type="checkbox" name="allDay" ${rule?.allDay?'checked':''}> All day</label>
      <div class="ritual-goal-fields" id="availability-times" ${rule?.allDay?'hidden':''}>
        <label class="field-label">Starts<input type="time" name="start" value="${rule?.start||'18:00'}" ${rule?.allDay?'disabled':''} required></label>
        <label class="field-label">Ends<input type="time" name="end" value="${rule?.end||'23:00'}" ${rule?.allDay?'disabled':''} required></label>
      </div>
      <p class="panel-subtle">An earlier end time continues into the next day.</p>
      <p class="event-error" role="alert" hidden></p>
      <div class="panel-actions">${rule?'<button type="button" class="text-button" id="new-availability">New block</button><button type="submit" value="remove" class="text-button" formnovalidate>Remove block</button>':''}
        <button type="submit" class="panel-primary">${rule?'Save changes':'Add unavailable time'}</button></div>
    </form>`;
}
function saveAvailability(form,remove){
  const fields=new FormData(form),previous=state.availability,id=editingAvailabilityId;
  if(id&&!previous.some(rule=>rule.id===id))return;
  if(remove&&id)state.availability=previous.filter(rule=>rule.id!==id);
  else{
    const [rule]=loadAvailability([{id:id||crypto.randomUUID(),name:fields.get('name'),days:fields.getAll('day').map(Number),
      allDay:fields.has('allDay'),start:fields.get('start'),end:fields.get('end')}]);
    if(!rule){
      const error=form.querySelector('[role="alert"]');error.hidden=false;
      error.textContent='Enter a name, choose at least one day, and use distinct start and end times for a timed block.';return;
    }
    state.availability=id?previous.map(item=>item.id===id?rule:item):[...previous,rule];
  }
  if(!persist()){state.availability=previous;return;}
  editingAvailabilityId='';refreshPanel();$('#availability-name').focus();
  confirmChange(remove?'Unavailable time removed.':'Unavailable time saved.');
}
function currentReplan(){
  const locked=state.timer.block?.taskId||
    (state.timer.mode==='focus'&&state.timer.status!=='idle'?state.timer.taskSnapshot?.id:null);
  const cutoff=timeMinutes(state.replanCutoff)||24*60;
  return replanToday(gardenTasks(),state.calendarEvents,new Date(),locked,{cutoff,focus:focusTotals(),availability:state.availability,cooldown:state.planningCooldown});
}
let tradeoffTaskId='', tradeoffPreview=[];
function tradeoffLockedTask(){
  const timer=state.timer;
  return timer.block?.taskId||(timer.mode==='focus'&&timer.id?(timer.replay?.at(-1)?.taskId||timer.taskSnapshot?.id):null);
}
function tradeoffChoices(now){
  const today=dayKey(now);
  const tasks=gardenTasks(), locked=tradeoffLockedTask();
  const occupied=new Set(calendarBlocks(tasks,now).filter(block=>openFocusBlock(block)&&
    block.end>now.getHours()*60+now.getMinutes()).map(block=>block.task.id));
  const byId=taskIndex();
  return tasks.filter(task=>!task.done&&!task.waitingFor&&task.id!==locked&&!occupied.has(task.id)&&!unfinishedPrerequisites(task,byId).length&&
    !(task.snoozedUntil>today)&&!(task.deadline&&task.deadline<today)&&
    (!task.repeat||task.repeat==='none'||taskStatus(task,now)==='todo'));
}
function findTradeoffs(now=new Date()){
  const task=tradeoffChoices(now).find(item=>item.id===tradeoffTaskId);
  if(!task)return [];
  return todayTradeoffs({task,tasks:gardenTasks(),events:state.calendarEvents,availability:state.availability,focus:focusTotals(),
    locked:tradeoffLockedTask(),
    cutoff:schedulingCutoff(),capacity:state.studyCapacity,cooldown:state.planningCooldown,
    protectedBlock:state.tomorrowPlan},now);
}
function tradeoffsMarkup(){
  const now=new Date(), choices=tradeoffChoices(now), today=dayKey(now);
  const options=tradeoffPreview.map(({parts,move},index)=>{
    const moved=move?.parts[0];
    return `<li><strong>${move?'Move '+escape(move.title):parts.length>1?'Split into two sessions':'Use an open slot'}</strong>
      <span>New focus · ${parts.map(part=>`${timeLabel(part.start)}–${timeLabel(part.start+part.minutes)}`).join(' + ')}</span>
      ${move?`<span>${escape(move.title)} · ${timeLabel(move.from)}–${timeLabel(move.from+moved.minutes)} → ${move.day===today?'today':'tomorrow'} ${timeLabel(moved.to)}–${timeLabel(moved.to+moved.minutes)}</span>`:''}
      <button type="button" class="panel-primary" data-apply-tradeoff="${index}">Apply option ${index+1}</button></li>`;
  }).join('');
  return `${header('CALENDAR','Fit a task today')}
    <p>Compare ways to make room before ${timeLabel(schedulingCutoff())}. Options respect availability and your daily study limit.</p>
    ${choices.length?`<form id="tradeoff-form"><label for="tradeoff-task">Task to fit</label><select name="task" id="tradeoff-task" required>
      <option value="">Choose a task</option>${choices.map(task=>`<option value="${escape(task.id)}" ${task.id===tradeoffTaskId?'selected':''}>${escape(task.text)} · ${minutesLabel(task.estimate||60)}</option>`).join('')}</select>
      <button class="panel-primary">Compare options</button></form>`:'<p>No ready, unscheduled tasks to fit today.</p>'}
    ${options?`<ol class="tradeoff-options">${options}</ol>`:tradeoffTaskId?'<p id="tradeoff-empty">No option fits today within your current limits.</p>':''}`;
}
function applyTradeoff(index){
  checkCompletion();
  const option=tradeoffPreview[index], now=new Date(), today=dayKey(now), current=findTradeoffs(now);
  if(!option||!current.some(item=>JSON.stringify(item)===JSON.stringify(option))){
    tradeoffPreview=current;refreshPanel();$('#tradeoff-task')?.focus();
    confirmChange('The schedule changed. Review the updated options.');return;
  }
  const task=state.tasks.find(item=>item.id===tradeoffTaskId), displaced=option.move&&state.tasks.find(item=>item.id===option.move.taskId);
  const previousEvents=state.calendarEvents;
  const event=previousEvents.find(item=>item.id===option.move?.eventId);
  let movedEvent;
  if(event){
    const start=+new Date(`${option.move.day}T${timeValue(option.move.parts[0].to)}`);
    movedEvent={...event,start,end:start+event.end-event.start};
    state.calendarEvents=previousEvents.map(item=>item===event?movedEvent:item);
  }
  const finishAdd=captureTaskChange(task,['blocks']);
  const finishMove=displaced&&captureTaskChange(displaced,['date','time','blocks','occurrenceTimes']);
  if(displaced)applyCalendarReplan(displaced,today,option.move);
  for(const part of option.parts){
    const block=addTaskBlock(task,today,timeValue(part.start),part.minutes);
    if(task.repeat&&task.repeat!=='none')block.taskDay=today;
  }
  const undoAdd=finishAdd(),undoMove=finishMove&&finishMove();
  const undo=latest=>{
    // Check both records before changing either one.
    const copy={tasks:structuredClone(latest.tasks.filter(item=>item.id===task.id||item.id===displaced?.id))};
    if(!undoAdd(copy)||undoMove&&!undoMove(copy))return false;
    if(movedEvent&&JSON.stringify(latest.calendarEvents.find(item=>item.id===event.id))!==JSON.stringify(movedEvent))return false;
    if(movedEvent)latest.calendarEvents=latest.calendarEvents.map(item=>item.id===event.id?event:item);
    undoAdd(latest);undoMove?.(latest);return true;
  };
  if(!persist()){undo(state);return;}
  closePanel(false);refreshTasks();
  if(workspace==='calendar'){
    if(!planner.calendarVisible())planner.setCalendarLayout('day',now);
    scrollCalendarTo(now,Math.max(0,option.parts[0].start-30));
  }
  $('[data-open-tradeoffs]')?.focus({preventScroll:true});
  confirmChange(option.move?`Scheduled ${task.text} and moved ${option.move.title}.`:`Scheduled ${task.text}.`,undo);
}
function replanMarkup(){
  const {day,moves,unplaced}=replanPreview;
  const date=new Date(day+'T12:00:00').toLocaleDateString([],{dateStyle:'long'});
  const proposed=moves.map((move,index)=>`<li><label>
    <input type="checkbox" name="move" value="${index}" checked>
    <span><strong>${escape(move.title)}</strong><small>Originally ${timeLabel(move.from)} · ${move.minutes} min</small>
      <small>${move.day===day?'Today':'Tomorrow'} · ${move.parts.map(part=>`${timeLabel(part.to)}–${timeLabel(part.to+part.minutes)}`).join(' + ')}</small></span>
  </label></li>`).join('');
  const noRoom=unplaced.map(move=>`<li>${escape(move.title)} · ${move.minutes} min</li>`).join('');
  return `${header(escape(date),'Replan today')}
    <form id="replan-cutoff-form"><label for="replan-cutoff">Stop scheduling at</label><input type="time" id="replan-cutoff" name="cutoff" value="${state.replanCutoff}" required><button type="submit" class="text-button">Update suggestions</button></form>
    ${moves.length?'<p>Choose which missed blocks to move. Each keeps its original duration.</p>':''}
    ${moves.length?`<form id="replan-form"><ul class="replan-moves">${proposed}</ul><div class="panel-actions"><button type="submit" class="panel-primary">Apply selected moves</button></div></form>`:''}
    ${unplaced.length?`<div class="replan-unplaced"><h3>No slot before the cutoff today or tomorrow</h3><ul>${noRoom}</ul></div>`:''}
    ${!moves.length&&!unplaced.length?'<p>No missed blocks for unfinished tasks today.</p>':''}`;
}
function applyReplan(form){
  const selected=new FormData(form).getAll('move').map(index=>replanPreview.moves[Number(index)]).filter(Boolean);
  if(!selected.length)return;
  const current=currentReplan();
  const currentMoves=new Set(current.moves.map(move=>JSON.stringify(move)));
  if(current.day!==replanPreview.day||selected.some(move=>!currentMoves.has(JSON.stringify(move)))){
    replanPreview=current;
    refreshPanel();
    const title=$('#panel-title');
    title.tabIndex=-1;
    title.focus({preventScroll:true});
    confirmChange('Today’s schedule changed. Review the updated suggestions.');
    return;
  }
  const snapshots=new Map();
  for(const move of selected){
    const task=state.tasks.find(item=>item.id===move.taskId);
    if(!snapshots.has(task.id))snapshots.set(task.id,captureTaskChange(task,['date','time','blocks','occurrenceTimes']));
    applyCalendarReplan(task,current.day,move);
  }
  const changes=[...snapshots.values()].map(snapshot=>snapshot()).filter(Boolean);
  const undo=latest=>{
    let changed=false;
    for(const revert of changes)changed=revert(latest)||changed;
    return changed;
  };
  if(!persist()){undo(state);return;}
  closePanel(false);refreshTasks();
  if(workspace==='calendar'){
    const first=selected.slice().sort((a,b)=>a.day.localeCompare(b.day)||a.to-b.to)[0];
    const date=new Date(first.day+'T12:00:00');
    if(planner.calendarVisible())scrollCalendarTo(date,Math.max(0,first.to-30));
    else planner.jumpMonth(date);
  }
  ($('[data-replan-today]')||$('#planner-heading')).focus({preventScroll:true});
  confirmChange(selected.length===1?'Moved 1 block.':`Moved ${selected.length} blocks.`,undo);
}
function tomorrowChoices(date){
  const tasks=gardenTasks(),tasksById=taskIndex();
  const unfinished=focusTaskQueue(tasks,new Date(),[],tasksById);
  const next=focusTaskQueue(tasks,date,[],tasksById);
  const available=new Set(next.map(task=>task.id));
  const carry=unfinished.filter(task=>!task.repeat||task.repeat==='none'||available.has(task.id));
  return {unfinished,choices:[...new Set([...carry,...next])]};
}
function tomorrowBlockDefaults(task,date){
  const previous=state.tomorrowPlan?.day===dayKey(date)?state.tomorrowPlan:null;
  const blocks=task?calendarBlocks([task],date).filter(block=>!block.continues&&openFocusBlock(block)):[];
  const existing=blocks.find(block=>previous&&previous.taskId===task.id&&(block.blockId||null)===previous.blockId)||blocks[0];
  if(existing&&!unavailableRanges(state.availability,date).some(range=>range.start<existing.end&&range.end>existing.start)){
    return {start:existing.start,minutes:existing.end-existing.start};
  }
  const minutes=task?.estimate||Math.max(1,Math.round(state.settings.focus));
  return {start:tomorrowFocusSlot(gardenTasks(),state.calendarEvents,date,minutes,previous,state.availability,state.planningCooldown),minutes};
}
function planTomorrowMarkup(){
  const date=shiftDay(new Date(),1),day=dayKey(date),{unfinished,choices}=tomorrowChoices(date);
  const pin=state.tomorrowPin?.day===day?state.tomorrowPin:state.tomorrowPlan?.day===day?state.tomorrowPlan:null;
  const selected=choices.find(task=>task.id===pin?.taskId)||choices[0];
  const {start,minutes}=tomorrowBlockDefaults(selected,date);
  return `${header(escape(date.toLocaleDateString([],{dateStyle:'full'})),'Plan tomorrow')}
    <div class="tomorrow-review"><h3>Unfinished today <span>${unfinished.length}</span></h3>
      ${unfinished.length?`<ul>${unfinished.map(task=>`<li>${escape(task.text)}</li>`).join('')}</ul>`:'<p>You have no unfinished tasks for today.</p>'}
    </div>
    ${choices.length?`<form id="plan-tomorrow-form" data-day="${day}">
      <label class="field-label" for="tomorrow-task">Tomorrow’s first task</label>
      <select name="taskId" id="tomorrow-task" required>${choices.map(task=>`<option value="${escape(task.id)}" ${task===selected?'selected':''}>${escape(task.text)}</option>`).join('')}</select>
      <div class="ritual-goal-fields">
        <label class="field-label" for="tomorrow-start">Start time<input name="start" id="tomorrow-start" type="time" required value="${start===null?'':timeValue(start)}"></label>
        <label class="field-label" for="tomorrow-minutes">Focus minutes<input name="minutes" id="tomorrow-minutes" type="number" min="1" max="1440" required value="${minutes}"></label>
      </div>
      <button type="button" class="text-button" id="tomorrow-find-slot">Find open time</button>
      <p class="event-error" role="alert" ${start===null?'':'hidden'}>${start===null?'No open time fits that duration. Try a shorter block.':''}</p>
      <div class="panel-actions"><button type="button" class="text-button" id="pin-tomorrow-task">Pin first task</button><button class="panel-primary">Reserve focus block</button></div>
      ${pin&&selected?.id===pin.taskId?`<p>First task pinned for ${escape(shortScheduleDate(day))}.</p>`:''}
    </form>`:'<p>Add a task in Planner to choose what to focus on tomorrow.</p>'}`;
}
function pinTomorrowTask(form){
  const date=shiftDay(new Date(),1),day=dayKey(date),taskId=form.elements.taskId.value;
  if(day!==form.dataset.day||!tomorrowChoices(date).choices.some(task=>task.id===taskId)){
    toast('Reopen Plan tomorrow to choose an available task.');return;
  }
  const previous=state.tomorrowPin;
  state.tomorrowPin={day,taskId};
  if(!persist()){state.tomorrowPin=previous;return;}
  refreshPanel();confirmChange('First task pinned for tomorrow.',latest=>{
    if(latest.tomorrowPin?.day!==day||latest.tomorrowPin.taskId!==taskId)return false;
    latest.tomorrowPin=previous;return true;
  });
}
function updateTomorrowSlot(form,useDefaults){
  const date=new Date(form.dataset.day+'T00:00:00');
  const task=gardenTasks().find(item=>item.id===form.elements.taskId.value);
  const suggestion=useDefaults?tomorrowBlockDefaults(task,date):{
    start:form.elements.minutes.checkValidity()?tomorrowFocusSlot(gardenTasks(),state.calendarEvents,date,Number(form.elements.minutes.value),state.tomorrowPlan,state.availability,state.planningCooldown):null
  };
  if(useDefaults)form.elements.minutes.value=suggestion.minutes;
  form.elements.start.value=suggestion.start===null?'':timeValue(suggestion.start);
  const error=form.querySelector('.event-error');
  error.hidden=suggestion.start!==null;
  error.textContent='No open time fits that duration. Try a shorter block.';
}
function saveTomorrowPlan(form){
  const date=shiftDay(new Date(),1),previous=state.tomorrowPlan,error=form.querySelector('.event-error');
  const previousPin=state.tomorrowPin,replacePin=previousPin?.day===dayKey(date);
  const fields=new FormData(form);
  const taskId=fields.get('taskId'),start=timeMinutes(fields.get('start')),minutes=Number(fields.get('minutes'));
  let result;
  try{
    if(dayKey(date)!==form.dataset.day)throw new Error('The date changed. Reopen Plan tomorrow to see the new schedule.');
    if(!tomorrowChoices(date).choices.some(task=>task.id===taskId))throw new Error('That task is no longer available.');
    result=reserveTomorrowFocus(gardenTasks(),state.calendarEvents,date,{taskId,start,minutes},previous,state.availability);
  }catch(err){error.textContent=err.message;error.hidden=false;return;}
  const updates=state.tasks.filter(task=>result.changes.has(task.id)).map(task=>[task,task.blocks,result.changes.get(task.id)]);
  for(const [task,,blocks] of updates)task.blocks=blocks;
  state.tomorrowPlan=result.plan;
  if(replacePin)state.tomorrowPin=null;
  if(!persist()){
    state.tomorrowPlan=previous;
    state.tomorrowPin=previousPin;
    for(const [task,blocks] of updates)task.blocks=blocks;
    return;
  }
  openSchedule('calendar',calendarToggle,date,Math.max(0,start-30));refreshTasks();
  confirmChange(`Tomorrow’s focus reserved for ${timeLabel(start)}.`,latest=>{
    if(JSON.stringify(latest.tomorrowPlan)!==JSON.stringify(result.plan))return false;
    const tasks=updates.map(([task,before,after])=>[latest.tasks.find(item=>item.id===task.id),before,after]);
    if(tasks.some(([task,,after])=>!task||JSON.stringify(task.blocks)!==JSON.stringify(after)))return false;
    for(const [task,before] of tasks)task.blocks=before;
    latest.tomorrowPlan=previous;
    if(replacePin&&!latest.tomorrowPin)latest.tomorrowPin=previousPin;
    return true;
  });
}
function handleRitualAction(ritualButton){
  const {ritual:kind,ritualDate:date}=ritualButton.closest('.daily-ritual').dataset;
  const previous=state.dailyRituals[date]?.[kind];
  const stamp=kind==='journal'?journal.completedAt(date):0;
  const wasComplete=ritualComplete(kind,previous,stamp);
  if('ritualOpen' in ritualButton.dataset){
    if(kind==='journal'){
      journal.openDate(date,()=>{
        const anchor=focusRitual(date,kind,'open');
        if(!wasComplete&&anchor.matches('[data-ritual-open]')&&ritualComplete(kind,state.dailyRituals[date]?.[kind],journal.completedAt(date)))animateTaskCompletion(anchor);
      });
    }else openPanel('daily-ritual',ritualButton);
    return;
  }
  const done=!wasComplete;
  const next={...previous,done,...(kind==='journal'?{stamp}:{})};
  if(!saveRitual(date,kind,next))return;
  if(done)animateTaskCompletion(ritualButton);
  renderCalendar();focusRitual(date,kind,'check');
  confirmChange(`${rituals[kind].label} marked ${done?'complete':'incomplete'}.`,latest=>{
    const day=latest.dailyRituals[date];
    if(day?.[kind]!==next)return false;
    if(previous)day[kind]=previous;
    else delete day[kind];
    if(!Object.keys(day).length)delete latest.dailyRituals[date];
    return true;
  });
  return;
}
const ritualWeek=[1,2,3,4,5,6,0];
const weekdayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function ritualScheduleEditor(){
  const date=dayKey(planner.calendarVisible()?leadingPlannerDay():planner.calendarAnchor());
  return `${header('CALENDAR','Ritual schedules')}
    <form id="ritual-schedules-form">
      <p class="panel-subtle">Choose when each ritual appears. Your past logs stay available.</p>
      ${Object.entries(rituals).map(([kind,{label}])=>{
        const schedule=state.ritualSchedules[kind],off=schedule.placement==='off',timed=schedule.placement==='timed';
        return `<fieldset class="ritual-schedule" data-ritual-settings="${kind}">
          <legend>${label}</legend>
          <label class="event-field">Placement<select name="${kind}-placement" data-ritual-placement>
            ${[['off','Off calendar'],['allDay','All day'],['timed','At a time']].map(([value,name])=>`<option value="${value}" ${value===schedule.placement?'selected':''}>${name}</option>`).join('')}
          </select></label>
          <div class="ritual-weekdays" role="group" aria-label="Repeat ${label} on" ${off?'hidden':''}>
            ${ritualWeek.map(index=>`<label title="${weekdayNames[index]}"><input type="checkbox" class="sr-only" name="${kind}-day" value="${index}" aria-label="${weekdayNames[index]}" ${schedule.days.includes(index)?'checked':''}><span>${weekdayNames[index].slice(0,3)}</span></label>`).join('')}
          </div>
          <div class="event-date-grid" data-ritual-times ${timed?'':'hidden'}>
            <label class="event-field">Start time<input type="time" name="${kind}-time" value="${schedule.time}" required ${timed?'':'disabled'}></label>
            <label class="event-field">Minutes<input type="number" name="${kind}-minutes" value="${schedule.minutes}" min="15" max="180" required ${timed?'':'disabled'}></label>
          </div>
          <button type="button" class="text-button" data-open-ritual-now="${kind}" data-date="${date}">Open ${label} · ${shortScheduleDate(date)}</button>
        </fieldset>`;
      }).join('')}
      <p class="event-error" role="alert" hidden></p>
      <div class="panel-actions"><button type="submit" class="panel-primary">Save schedules</button></div>
    </form>`;
}
function saveRitualSchedules(form){
  const fields=new FormData(form),previous=state.ritualSchedules;
  const next={};
  const error=form.querySelector('.event-error');
  for(const [kind,{label}] of Object.entries(rituals)){
    const placement=fields.get(kind+'-placement'),days=fields.getAll(kind+'-day').map(Number);
    if(placement!=='off'&&!days.length){
      error.textContent=`Choose at least one weekday for ${label}.`;error.hidden=false;return;
    }
    const time=fields.get(kind+'-time')||previous[kind].time,minutes=Number(fields.get(kind+'-minutes'))||previous[kind].minutes;
    if(placement==='timed'&&timeMinutes(time)+minutes>1440){
      error.textContent=`Choose an earlier start time or a shorter duration for ${label}.`;error.hidden=false;return;
    }
    next[kind]={placement,days,time,minutes};
  }
  state.ritualSchedules=loadRitualSchedules(next);
  if(!persist()){state.ritualSchedules=previous;return;}
  closePanel();renderCalendar();
  $('[data-calendar-rituals]')?.focus({preventScroll:true});
  confirmChange('Ritual schedules saved.');
}
function ritualEditor(){
  const {ritual:kind,ritualDate:date}=lastAnchor.closest('[data-ritual][data-ritual-date]').dataset;
  const item=state.dailyRituals[date]?.[kind]||{};
  const when=new Date(date+'T12:00:00').toLocaleDateString([],{dateStyle:'full'});
  const heading=header(escape(when),rituals[kind].label);
  if(kind==='crochet'){
    const projects=loadCrochet(storage).projects;
    return `${heading}<form id="daily-ritual-form" data-kind="${kind}" data-date="${date}">
      <label class="field-label" for="ritual-project">Stitchbook project</label>
      <select id="ritual-project" name="projectId"><option value="">No linked project</option>${projects.map(project=>`<option value="${escape(project.id)}" ${item.projectId===project.id?'selected':''}>${escape(project.name)}</option>`).join('')}</select>
      <div class="panel-actions"><button type="submit" value="open" class="text-button">Open Stitchbook</button><button class="panel-primary">Save link</button></div></form>`;
  }
  const context=annotationContext(state.dailyRituals,date);
  const book=context.book||{};
  return `${heading}<form id="daily-ritual-form" data-kind="${kind}" data-date="${date}">
    <label class="field-label" for="ritual-book">Book title</label><input id="ritual-book" name="title" maxlength="250" value="${escape(book.title)}" placeholder="Type a title or search Open Library">
    <label class="field-label" for="ritual-author">Author</label><input id="ritual-author" name="author" maxlength="200" value="${escape(book.author)}" placeholder="Optional">
    <button type="button" class="text-button ritual-lookup" id="ritual-book-search">Search Open Library</button>
    <p class="ritual-search-status" role="status" hidden></p><div class="ritual-book-results" hidden></div>
    ${context.last?`<p class="ritual-resume">Last annotated: <strong>${escape(context.last)}</strong></p>`:''}
    <div class="ritual-goal-fields">
      <label class="field-label" for="ritual-goal-type">Goal type<select id="ritual-goal-type" name="goalType"><option value="chapter">Chapter</option><option value="page" ${context.goalType==='page'?'selected':''}>Page</option></select></label>
      <label class="field-label" for="ritual-goal">Next session target<input id="ritual-goal" name="goal" maxlength="100" value="${escape(context.goal)}" placeholder="e.g. 12 or 45–60"></label>
    </div>
    <label class="field-label" for="ritual-chapters">Chapters annotated</label><textarea id="ritual-chapters" name="chapters" maxlength="3000" rows="4" placeholder="One per line or a range, e.g. Chapters 3–5">${escape(item.chapters)}</textarea>
    <label class="field-label" for="ritual-position">Where you stopped (optional)</label><input id="ritual-position" name="position" maxlength="100" value="${escape(item.position)}" placeholder="e.g. Page 52">
    <label class="field-label" for="ritual-total-pages">Total pages (optional)</label><input id="ritual-total-pages" name="totalPages" type="number" min="1" max="100000" value="${item.totalPages||book.totalPages||''}">
    <p class="panel-subtle">Enter a stopping point like Page 52 and total pages to see a forecast in Reading.</p>
    <label class="field-label" for="ritual-reading-project">Project for weekly goal</label><select id="ritual-reading-project" name="projectId">
      <option value="">No project</option>${state.projects.filter(project=>!project.archived||project.id===item.projectId).map(project=>
        `<option value="${escape(project.id)}" ${project.id===(item.projectId??book.projectId)?'selected':''}>${escape(project.name)}</option>`).join('')}</select>
    <p class="ritual-error" role="alert" hidden></p><div class="panel-actions"><button type="button" class="text-button" id="open-reading-shelf">Reading shelf</button><button class="panel-primary">Save annotation log</button></div></form>`;
}
function saveRitual(date,kind,item){
  const previous=state.dailyRituals[date];
  state.dailyRituals[date]={...previous,[kind]:item};
  if(persist())return true;
  if(previous)state.dailyRituals[date]=previous;
  else delete state.dailyRituals[date];
  return false;
}
function focusRitual(date,kind,action){
  const selector=`[data-ritual="${kind}"][data-ritual-date="${date}"] [data-ritual-${action}]`;
  const buttons=[...calendarPanel.querySelectorAll(selector)];
  const target=buttons.find(button=>button.getClientRects().length&&button.tabIndex>=0)||$('#planner-heading');
  target.focus({preventScroll:true});
  return target;
}
async function searchRitualBooks(button){
  const form=button.form;
  const title=form.elements.title.value.trim(),author=form.elements.author.value.trim();
  const status=form.querySelector('.ritual-search-status'),results=form.querySelector('.ritual-book-results');
  results.hidden=true;results.replaceChildren();
  status.hidden=false;
  if(!title&&!author){status.textContent='Enter a title or author to search.';form.elements.title.focus();return;}
  button.disabled=true;status.textContent='Searching Open Library…';
  const params=new URLSearchParams({q:[title,author].filter(Boolean).join(' '),fields:'title,author_name',limit:'6'});
  try{
    const response=await fetch(`https://openlibrary.org/search.json?${params}`,{signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw new Error('Search unavailable');
    const {docs}=await response.json();
    if(!form.isConnected)return;
    const seen=new Set();
    for(const book of docs){
      if(typeof book.title!=='string')continue;
      const name=book.title.slice(0,250);
      const writer=Array.isArray(book.author_name)?book.author_name.join(', ').slice(0,200):'';
      const label=writer?`${name} · ${writer}`:name;
      if(seen.has(label.toLowerCase()))continue;
      seen.add(label.toLowerCase());
      const choice=document.createElement('button');
      choice.type='button';
      choice.textContent=label;
      choice.onclick=()=>{
        form.elements.title.value=name;form.elements.author.value=writer;
        results.hidden=true;status.hidden=true;form.elements.chapters.focus();
        positionPanel(visiblePanel(),lastAnchor);
      };
      results.append(choice);
    }
    results.hidden=!results.childElementCount;
    status.textContent=results.hidden?'No matches. You can still enter the book yourself.':'Choose a book';
  }catch{
    if(form.isConnected)status.textContent='Book search is unavailable. You can still enter the book yourself.';
  }finally{
    button.disabled=false;
    if(form.isConnected)positionPanel(visiblePanel(),lastAnchor);
  }
}
function eventBufferFields(event,allDay=false){
  const value=key=>Number.isInteger(event?.[key])?event[key]:'';
  return `<fieldset class="event-buffer-fields" data-event-buffer ${allDay?'hidden disabled':''}><legend>Planning buffers</legend>
    <div class="event-date-grid"><label class="event-field">Minutes before<input name="bufferBefore" type="number" min="0" max="180" placeholder="0" value="${value('bufferBefore')}"></label>
    <label class="event-field">Minutes after<input name="bufferAfter" type="number" min="0" max="180" placeholder="0" value="${value('bufferAfter')}"></label></div>
    <p>Reserve travel, setup, or recovery time in week drafts and deadline plans.</p></fieldset>`;
}
function defaultEventCalendar(){
  return state.calendars.find(item=>!state.hiddenCalendars.includes(item.id))?.id||personalCalendarId;
}
function openCalendarEvent(anchor,draft=null){
  eventDraft=draft;
  openPanel('event-editor',anchor);
}
function customColorFields(color,hidden=false){
  const hex=customCalendarColor(color)||'#548f7d';
  return `<div class="custom-color-fields" ${hidden?'hidden':''}>
    <label class="event-field">Color picker<input type="color" data-color-wheel value="${hex}"></label>
    <label class="event-field">Hex color<input type="text" name="customColor" data-color-hex value="${hex.toUpperCase()}" maxlength="7" placeholder="#548F7D" spellcheck="false" autocomplete="off"></label>
  </div>`;
}
function syncCustomColor(input){
  const fields=input.closest('.custom-color-fields'),wheel=fields.querySelector('[data-color-wheel]'),hex=fields.querySelector('[data-color-hex]');
  if(input===wheel)hex.value=wheel.value.toUpperCase();
  else if(customCalendarColor(hex.value))wheel.value=customCalendarColor(hex.value);
  hex.removeAttribute('aria-invalid');
}
function calendarColorPicker(label,selected,inherited){
  const options=inherited===undefined?calendarColors:{'':'Calendar default',...calendarColors};
  const custom=customCalendarColor(selected);
  return `<fieldset class="calendar-color-picker"><legend>${label}</legend><div class="calendar-color-choices">
    ${Object.entries({...options,custom:'Custom'}).map(([color,name])=>`<label class="calendar-color-choice">
      <input type="radio" class="sr-only" name="color" value="${color}" ${(custom?'custom':selected)===color?'checked':''}>
      <span class="calendar-color-dot" ${eventColorAttributes(color==='custom'?custom||'#548f7d':color||inherited)}></span><span ${color===''?'data-inherited-color-label':''}>${name}</span>
    </label>`).join('')}
    </div>${customColorFields(custom,!custom)}</fieldset>`;
}
function updateTaskColorFields(form){
  const custom=form.elements.calendarColor.value==='custom';
  form.querySelector('.custom-color-fields').hidden=!custom;
  const swatch=form.querySelector('.task-color-swatch'),hex=customCalendarColor(form.elements.customColor.value);
  swatch.dataset.taskColor=custom?hex:taskCalendarColor(form.elements.calendarColor.value);
  if(custom&&hex)swatch.style.setProperty('--task-color',hex);
  else swatch.style.removeProperty('--task-color');
}
function calendarColorPreview(title,detail,color){
  return `<div class="calendar-color-preview" ${eventColorAttributes(color)}>
    <span class="calendar-preview-label">Preview</span><strong data-color-preview-title>${escape(title)}</strong><small data-color-preview-detail>${escape(detail)}</small>
  </div>`;
}
function displayEventColor(element,color){
  element.dataset.eventTone=color;
  if(customCalendarColor(color))element.style.setProperty('--event-color',color);
  else element.style.removeProperty('--event-color');
}
function pickedCalendarColor(form){
  return calendarColor(form.elements.color.value==='custom'?form.elements.customColor.value:form.elements.color.value);
}
function checkedCustomColor(form,choice){
  if(choice!=='custom'||customCalendarColor(form.elements.customColor.value))return true;
  const field=form.elements.customColor;
  field.setAttribute('aria-invalid','true');field.focus();
  const error=form.querySelector('.event-error');
  if(error){error.textContent='Enter a hex color like #548F7D.';error.hidden=false;}
  else toast('Enter a hex color like #548F7D.');
  return false;
}
function updateCalendarColorPreview(form){
  const {elements}=form,preview=form.querySelector('.calendar-color-preview');
  const selected=elements.color.value,custom=customCalendarColor(elements.customColor.value);
  form.querySelector('.custom-color-fields').hidden=selected!=='custom';
  displayEventColor(form.querySelector('input[name="color"][value="custom"] + .calendar-color-dot'),custom||elements.customColor.closest('.custom-color-fields').querySelector('[data-color-wheel]').value);
  const picked=pickedCalendarColor(form);
  const entry=form.id==='calendar-event-form',task=entry&&elements.entryType.value==='task';
  const calendar=entry&&!task&&state.calendars.find(item=>item.id===elements.calendarId.value);
  const fallback=task?'slate':calendar?.color||'jade';
  const color=picked||fallback;
  displayEventColor(preview,color);
  preview.querySelector('[data-color-preview-title]').textContent=entry?
    elements.title.value.trim()||(task?'Untitled task':'Untitled event'):elements.name.value.trim()||'Your calendar';
  const when=entry?(elements.allDay.checked?'All day':elements.startTime.value?timeLabel(timeMinutes(elements.startTime.value)):''):'';
  const colorLabel=picked?calendarColorName(picked):task?'Task default':'Calendar default';
  preview.querySelector('[data-color-preview-detail]').textContent=entry?
    [when,task?'Tasks & rituals':calendar?.name,colorLabel].filter(Boolean).join(' · '):
    calendarColorName(color)+' · default for events';
  const inherited=form.querySelector('input[name="color"][value=""] + .calendar-color-dot');
  if(inherited){
    displayEventColor(inherited,fallback);
    form.querySelector('[data-inherited-color-label]').textContent=task?'Task default':'Calendar default';
  }
}
function calendarListEditor(){
  const calendar=state.calendars.find(item=>item.id===lastAnchor?.dataset.calendarListEdit);
  const removable=calendar&&calendar.id!==personalCalendarId,color=calendar?.color||'jade';
  return `${header('MY CALENDARS',calendar?'Edit calendar':'New calendar')}
    <form id="calendar-list-form" data-calendar-id="${escape(calendar?.id)}">
      <label class="event-field">Name<input name="name" value="${escape(calendar?.name)}" maxlength="60" placeholder="School, work, or personal" required></label>
      ${calendarColorPicker('Calendar color',color)}
      ${calendarColorPreview(calendar?.name||'Your calendar',calendarColorName(color)+' · default for events',color)}
      <p class="event-error" role="alert" hidden></p>
      <div class="panel-actions">${removable?'<button type="button" class="text-button event-delete" data-calendar-list-delete>Remove calendar</button>':''}
        <button class="panel-primary">Save calendar</button></div>
    </form>`;
}
function saveCalendarList(form){
  const fields=new FormData(form),name=String(fields.get('name')).trim(),id=form.dataset.calendarId||crypto.randomUUID();
  const error=form.querySelector('.event-error'),previous=state.calendars;
  if(!name||previous.some(item=>item.id!==id&&item.name.toLowerCase()===name.toLowerCase())){
    error.textContent=name?'A calendar with that name already exists.':'Enter a name for this calendar.';
    error.hidden=false;return;
  }
  if(!checkedCustomColor(form,fields.get('color')))return;
  const existing=previous.some(item=>item.id===id);
  if(form.dataset.calendarId&&!existing)return;
  state.calendars=loadCalendars([...previous.filter(item=>item.id!==id),{id,name,color:pickedCalendarColor(form)}]);
  if(!persist()){state.calendars=previous;return;}
  closePanel(false);renderCalendar();
  calendarRail.querySelector('[data-calendar-list-edit="'+CSS.escape(id)+'"]')?.focus({preventScroll:true});
  confirmChange(existing?'Calendar updated.':'Calendar created.');
}
function removeCalendar(button){
  const id=button.form.dataset.calendarId;
  const calendar=state.calendars.find(item=>item.id===id&&item.id!==personalCalendarId);
  if(!calendar)return;
  if(!button.dataset.confirm){
    button.dataset.confirm='true';button.textContent='Confirm removal';
    const error=button.form.querySelector('.event-error');
    error.hidden=false;error.textContent='Its events will move to the default calendar.';return;
  }
  const previous=state.calendars,events=state.calendarEvents,hidden=state.hiddenCalendars;
  const moved=new Map();
  state.calendars=previous.filter(item=>item.id!==id);
  state.hiddenCalendars=hidden.filter(value=>value!==id);
  state.calendarEvents=events.map(event=>{
    if(!event.manual||event.calendarId!==id)return event;
    const updated={...event,calendarId:personalCalendarId};
    moved.set(event.id,updated);return updated;
  });
  if(!persist()){Object.assign(state,{calendars:previous,calendarEvents:events,hiddenCalendars:hidden});return;}
  closePanel(false);renderCalendar();calendarRail.querySelector('[data-calendar-list-new]')?.focus();
  confirmChange('Calendar removed. Its events were moved.',latest=>{
    if(latest.calendars.some(item=>item.id===id))return false;
    latest.calendars.push(calendar);
    if(hidden.includes(id))latest.hiddenCalendars.push(id);
    latest.calendarEvents=latest.calendarEvents.map(event=>moved.get(event.id)===event?{...event,calendarId:id}:event);
    return true;
  });
}
const eventColorForTask=color=>calendarColor(color)||({lake:'blue',clay:'#d1927b'})[color]||'';
const taskColorForEvent=color=>taskCalendarColor(color)||({blue:'lake',slate:'#91acbd'})[color]||'';

function calendarEventEditor(){
  const event=state.calendarEvents.find(item=>item.manual&&item.id===lastAnchor?.dataset.calendarEvent);
  const draft=eventDraft||calendarDraft(),source=draft.task;
  const type=source||draft.type==='task'?'task':'event';
  const activeProject=$('#calendar-project').value,projectId=source?.projectId??activeProject;
  const start=event?.start!==undefined?new Date(event.start):new Date(`${source?.date||draft.date}T${source?.time||draft.time}:00`);
  const end=event?.end!==undefined?new Date(event.end):new Date(+start+(source?.estimate||60)*60000);
  const title=event?.title??source?.text??'';
  const allDay=event?Boolean(event.day):source?!source.time:Boolean(draft.allDay);
  const endDay=event?.day?dayKey(shiftDay(new Date(event.endDay+'T00:00:00'),-1)):allDay?dayKey(start):dayKey(end);
  const selectedCalendar=event?eventCalendarId(event,state.calendars):defaultEventCalendar();
  const color=event?calendarColor(event.color):eventColorForTask(source?.calendarColor);
  const inherited=type==='task'?'slate':state.calendars.find(item=>item.id===selectedCalendar)?.color||'jade';
  const {repeat,repeatEvery}=repeatSettings(event?.repeat??source?.repeat,event?.repeatEvery??source?.repeatEvery);
  const time=date=>timeValue(date.getHours()*60+date.getMinutes());
  const timeField=(name,value,label)=>`<label class="event-field" data-event-time ${allDay?'hidden':''}>${label}<input name="${name}" type="time" value="${value}" required ${allDay?'disabled':''}></label>`;
  const heading=`${event||source?'Edit':'New'} ${type}`;
  return `${header('CALENDAR',heading)}
    <form id="calendar-event-form" data-event-id="${escape(event?.id)}" data-source-task="${escape(source?.id)}">
      <fieldset class="calendar-entry-type"><legend class="sr-only">Entry type</legend>
        ${['event','task'].map(kind=>`<label><input class="sr-only" type="radio" name="entryType" value="${kind}" ${type===kind?'checked':''}><span>${kind==='event'?'Event':'Task'}</span></label>`).join('')}
      </fieldset>
      <label class="event-field">Title<input name="title" value="${escape(title)}" maxlength="${Math.max(160,title.length)}" placeholder="Class, study session, or appointment" required></label>
      <label class="event-all-day"><input type="checkbox" name="allDay" ${allDay?'checked':''}> All day</label>
      <div class="event-date-grid">
        <label class="event-field"><span data-event-start-label>${allDay?(type==='task'?'Date':'First day'):'Start date'}</span><input name="startDay" type="date" value="${event?.day||dayKey(start)}" required></label>
        ${timeField('startTime',time(start),'Start time')}
        <label class="event-field" data-event-end-date ${allDay&&type==='task'?'hidden':''}><span data-event-end-label>${allDay?'Last day':'End date'}</span><input name="endDay" type="date" value="${endDay}" required ${allDay&&type==='task'?'disabled':''}></label>
        ${timeField('endTime',time(end),'End time')}
      </div>
      <div class="event-date-grid">
        <label class="event-field">Repeat<select name="repeat">${Object.entries(taskFrequencies).map(([value,label])=>`<option value="${value}" ${value===repeat?'selected':''}>${label}</option>`).join('')}</select></label>
        <label class="event-field" data-event-interval ${repeat==='interval'?'':'hidden'}>Days between<input name="repeatEvery" type="number" min="2" max="365" value="${repeatEvery}" ${repeat==='interval'?'':'disabled'}></label>
      </div>
      <p class="calendar-series-note" data-series-note ${!event||event.repeat==='none'||!event.repeat?'hidden':''}>Changes apply to the entire series.</p>
      <label class="event-field" data-event-calendar ${type==='task'?'hidden':''}>Calendar<select name="calendarId">${state.calendars.map(item=>`<option value="${escape(item.id)}" ${item.id===selectedCalendar?'selected':''}>${escape(item.name)}${state.hiddenCalendars.includes(item.id)?' (hidden)':''}</option>`).join('')}</select></label>
      <div class="event-date-grid" data-entry-task ${type==='task'?'':'hidden'}>
        <label class="event-field">Project<select name="projectId"><option value="">Inbox</option>${state.projects.filter(project=>!project.archived||project.id===projectId).map(project=>`<option value="${escape(project.id)}" ${project.id===projectId?'selected':''}>${escape(project.name)}</option>`).join('')}</select></label>
        <label class="event-all-day"><input type="checkbox" name="important" ${source&&taskPriority(source)===1?'checked':''}> Important</label>
      </div>
      ${calendarColorPicker('Color',color,inherited)}
      ${calendarColorPreview(title||`Untitled ${type}`,[allDay?'All day':timeLabel(timeMinutes(time(start))),type==='task'?'Tasks & rituals':state.calendars.find(item=>item.id===selectedCalendar)?.name,color?calendarColorName(color):type==='task'?'Task default':'Calendar default'].filter(Boolean).join(' · '),color||inherited)}
      <label class="event-field">Notes <textarea name="description" rows="2" maxlength="3000" placeholder="Optional">${escape(event?.description??source?.description)}</textarea></label>
      <details class="event-advanced" data-event-planning ${type==='task'?'hidden':''}><summary>Planning options</summary>${eventBufferFields(event,allDay)}${flexibilityFields(event?.flexibility)}</details>
      <p class="event-error" role="alert" hidden></p>
      <div class="panel-actions">${event?`<button type="button" class="text-button event-delete" id="delete-calendar-event">${event.repeat&&event.repeat!=='none'?'Delete series':'Delete event'}</button>`:''}<button class="panel-primary" data-save-calendar-entry>Save ${type}</button></div>
    </form>`;
}
function syncCalendarEntry(form){
  const {elements}=form,task=elements.entryType.value==='task',allDay=elements.allDay.checked;
  const type=task?'task':'event';
  $('#panel-title').textContent=`${form.dataset.eventId||form.dataset.sourceTask?'Edit':'New'} ${type}`;
  form.querySelector('[data-save-calendar-entry]').textContent=`Save ${type}`;
  for(const selector of ['[data-event-calendar]','[data-event-planning]'])form.querySelector(selector).hidden=task;
  form.querySelector('[data-entry-task]').hidden=!task;
  form.querySelector('[data-event-end-date]').hidden=task&&allDay;
  elements.endDay.disabled=task&&allDay;
  form.querySelectorAll('[data-event-time]').forEach(label=>{label.hidden=allDay;label.querySelector('input').disabled=allDay;});
  const buffers=form.querySelector('[data-event-buffer]');buffers.hidden=allDay;buffers.disabled=allDay||task;
  form.querySelector('[data-event-start-label]').textContent=allDay?(task?'Date':'First day'):'Start date';
  form.querySelector('[data-event-end-label]').textContent=allDay?'Last day':'End date';
  elements.repeatEvery.disabled=elements.repeat.value!=='interval';
  form.querySelector('[data-event-interval]').hidden=elements.repeatEvery.disabled;
  form.querySelector('.event-error').hidden=true;
  updateCalendarColorPreview(form);
}
function canConvertCalendarTask(task){
  const id=task.id;
  return !(task.blocks?.length||Object.keys(task.occurrenceTimes||{}).length||task.subtasks?.length||
    task.comments?.length||task.reference||task.resumeNote||task.resumeResource||task.resumeLocation||task.labels?.length||task.projectId||
    task.deadline||task.reminderAt||task.waitingFor||task.snoozedUntil||task.energy||taskPriority(task)!==4||
    task.done||task.completedOn||task.completions?.length||task.prerequisiteIds?.length||
    state.tasks.some(other=>other.prerequisiteIds?.includes(id))||
    state.stickyNotes.some(note=>noteTaskIds(note).includes(id))||state.focusPins?.ids.includes(id)||
    state.history.some(session=>session.taskId===id)||state.mistakes.some(mistake=>mistake.taskId===id)||
    state.taskBundles.some(bundle=>bundle.taskIds?.includes(id))||
    state.projects.some(project=>project.milestones?.some(item=>item.taskIds?.includes(id))||
      project.decisions?.some(item=>item.taskIds?.includes(id)))||
    state.tomorrowPlan?.taskId===id||
    state.timer.calendarBlock?.taskId===id||state.activeTask===id&&state.timer.status!=='idle');
}
function saveCalendarEntry(form){
  const fields=Object.fromEntries(new FormData(form)),{eventId,sourceTask}=form.dataset;
  const previousEvents=state.calendarEvents,previousTasks=state.tasks,previousActive=state.activeTask;
  const existingEvent=previousEvents.find(item=>item.manual&&item.id===eventId);
  const existingTask=previousTasks.find(item=>item.id===sourceTask);
  if(eventId&&!existingEvent||sourceTask&&!existingTask)return;
  const taskMode=fields.entryType==='task',allDay=Object.hasOwn(fields,'allDay');
  const error=form.querySelector('.event-error');
  const reject=message=>{error.textContent=message;error.hidden=false;};
  if(!checkedCustomColor(form,fields.color))return;
  if(!taskMode&&existingTask&&!canConvertCalendarTask(existingTask)){
    reject('This task has task details, links, or focus history. Keep the task to preserve them.');return;
  }
  let event;
  try{
    event=calendarEventFromFields({...fields,allDay,endDay:allDay&&taskMode?fields.startDay:fields.endDay,
      ...(taskMode?{bufferBefore:0,bufferAfter:0}:{})},eventId||`manual:${crypto.randomUUID()}`);
  }catch(err){reject(err.message.replace('the event',taskMode?'the task':'the event'));return;}
  const color=pickedCalendarColor(form);
  let task;
  if(taskMode){
    const nextDay=new Date(fields.endDay+'T00:00:00'),startDay=new Date(fields.startDay+'T00:00:00');
    const startMinute=allDay?0:timeMinutes(fields.startTime),endMinute=allDay?0:timeMinutes(fields.endTime);
    const dateNumber=day=>Date.UTC(day.getFullYear(),day.getMonth(),day.getDate())/86400000;
    const minutes=allDay?existingTask?.estimate??null:(dateNumber(nextDay)-dateNumber(startDay))*1440+endMinute-startMinute;
    if(!allDay&&(minutes<1||minutes>1440)){reject('Time a task for up to 24 hours.');return;}
    const recurrence=repeatSettings(fields.repeat,fields.repeatEvery);
    const keepCompletion=existingTask&&(existingTask.repeat==='none')===(recurrence.repeat==='none');
    const projectId=state.projects.some(project=>project.id===fields.projectId)?fields.projectId:'';
    const priorityLevel=fields.important?1:existingTask&&taskPriority(existingTask)!==1?taskPriority(existingTask):4;
    task={prerequisiteIds:[],subtasks:[],comments:[],labels:[],...existingTask,
      projectId,sectionId:existingTask?.projectId===projectId?existingTask.sectionId||'':'',
      priorityLevel,priority:priorityLevel!==4,
      id:existingTask?.id||crypto.randomUUID(),text:event.title,description:event.description,
      date:fields.startDay,time:allDay?'':fields.startTime,estimate:minutes,
      calendarColor:taskColorForEvent(color),...recurrence,
      done:recurrence.repeat==='none'&&existingTask?.done===true,
      completedOn:keepCompletion?existingTask.completedOn||'':'',completions:keepCompletion?existingTask.completions||[]:[]};
    if(existingTask&&['date','time','repeat','repeatEvery'].some(key=>task[key]!==existingTask[key]))task.occurrenceTimes={};
    state.tasks=existingTask?previousTasks.map(item=>item===existingTask?task:item):[...previousTasks,task];
    if(existingEvent)state.calendarEvents=previousEvents.filter(item=>item!==existingEvent);
  }else{
    const flexibility=allDay?null:readFlexibility(form,new FormData(form));
    if(flexibility===undefined)return;
    if(flexibility)event.flexibility=flexibility;
    if(color)event.color=color;
    event.calendarId=state.calendars.some(item=>item.id===fields.calendarId)?fields.calendarId:personalCalendarId;
    if(existingEvent?.excludedDays&&event.repeat)event.excludedDays=existingEvent.excludedDays;
    state.calendarEvents=existingEvent?previousEvents.map(item=>item===existingEvent?event:item):[...previousEvents,event];
    if(existingTask)state.tasks=previousTasks.filter(item=>item!==existingTask);
  }
  if(state.activeTask===existingTask?.id&&(!task||taskStatus(task)!=='todo'))state.activeTask=null;
  if(!persist()){
    Object.assign(state,{tasks:previousTasks,calendarEvents:previousEvents,activeTask:previousActive});
    return;
  }
  const converted=taskMode?existingEvent:existingTask;
  const savedEntry=converted&&JSON.stringify(taskMode?task:event);
  const undo=converted?latest=>{
    if(taskMode){
      if(!latest.tasks.includes(task)||JSON.stringify(task)!==savedEntry||latest.calendarEvents.some(item=>item.id===existingEvent.id)||
        latest.activeTask===task.id&&latest.timer.status!=='idle')return false;
      latest.tasks=latest.tasks.filter(item=>item!==task);
      latest.calendarEvents.push(existingEvent);
      if(latest.activeTask===task.id)latest.activeTask=null;
    }else{
      if(!latest.calendarEvents.includes(event)||JSON.stringify(event)!==savedEntry||latest.tasks.some(item=>item.id===existingTask.id))return false;
      latest.calendarEvents=latest.calendarEvents.filter(item=>item!==event);
      latest.tasks.splice(previousTasks.indexOf(existingTask),0,existingTask);
      if(!latest.activeTask&&previousActive===existingTask.id)latest.activeTask=previousActive;
    }
    return true;
  }:undefined;
  finishCalendarEventChange(event);
  const hidden=state.hiddenCalendars.includes(taskMode?'tasks':event.calendarId);
  const kind=taskMode?'Task':'Event',message=converted?`Converted to ${kind.toLowerCase()}.`:`${kind} ${eventId||sourceTask?'updated':'added'}.`;
  confirmChange(hidden?`${message} Its calendar is hidden.`:message,undo);
}
function finishCalendarEventChange(event){
  const anchor=lastAnchor;
  closePanel(false);refreshTasks();
  if(event&&workspace==='calendar'){
    const date=event.day?new Date(event.day+'T00:00:00'):new Date(event.start);
    if(planner.calendarVisible())scrollCalendarTo(date,event.day?undefined:Math.max(0,date.getHours()*60+date.getMinutes()-30));
    else planner.jumpMonth(date);
  }
  (anchor?.isConnected?anchor:inSchedule()?$('#planner-heading'):$('#sidebar-calendar'))?.focus({preventScroll:true});
}
$('#calendar-jump-date').addEventListener('change',event=>{
  if(!event.target.value)return;
  const date=new Date(`${event.target.value}T00:00:00`);
  if(!Number.isFinite(date.getTime()))return;
  if(planner.calendarVisible())scrollCalendarTo(date);
  else planner.jumpMonth(date);
});
calendarPanel.addEventListener('change',event=>{
  const id=event.target.dataset.calendarVisibility;
  if(!id)return;
  const previous=state.hiddenCalendars;
  state.hiddenCalendars=event.target.checked?previous.filter(item=>item!==id):[...new Set([...previous,id])];
  if(!persist()){state.hiddenCalendars=previous;event.target.checked=!event.target.checked;return;}
  renderCalendar();
});
calendarPanel.addEventListener('click',event=>{
  if(event.target.closest('#calendar-toggle-sidebar')){
    calendarPanel.classList.toggle(compactCalendarRail.matches?'calendar-rail-open':'calendar-rail-collapsed');
    syncCalendarRail();return;
  }
  const miniStep=event.target.closest('[data-calendar-mini-step]');
  if(miniStep){
    const step=Number(miniStep.dataset.calendarMiniStep);
    renderCalendarRail(new Date(railDate+'T12:00:00'),new Date(railMonth.getFullYear(),railMonth.getMonth()+step,1));return;
  }
  const miniDay=event.target.closest('[data-calendar-mini-day]');
  if(miniDay){
    const date=new Date(miniDay.dataset.calendarMiniDay+'T12:00:00');
    if(planner.calendarVisible())scrollCalendarTo(date,calendarStartMinute(date,Number(calendarPanel.dataset.visibleDays)));
    else planner.jumpMonth(date);
    if(compactCalendarRail.matches){calendarPanel.classList.remove('calendar-rail-open');syncCalendarRail();calendarRailToggle.focus();}
    return;
  }
  const listEditor=event.target.closest('[data-calendar-list-new],[data-calendar-list-edit]');
  if(listEditor){openPanel('calendar-list-editor',listEditor);return;}
  const templates=event.target.closest('[data-calendar-day-templates]');
  if(templates){openDayTemplates(templates);return;}
  const tradeoffs=event.target.closest('[data-open-tradeoffs]');
  if(tradeoffs){tradeoffTaskId='';tradeoffPreview=[];openPanel('task-tradeoffs',tradeoffs);return;}
  const mistakes=event.target.closest('[data-open-mistakes]');
  if(mistakes){mistakeNotebook.open({},mistakes);return;}
  const activity=event.target.closest('button[data-calendar-activity]');
  if(activity){
    const actual=activity.dataset.calendarActivity==='actual';
    if(actualCalendar===actual)return;
    const wasTimeline=planner.calendarVisible();
    const date=wasTimeline?leadingPlannerDay():planner.calendarAnchor();
    setCalendarActivity(actual);
    if(actual&&!calendarShelf.hidden){setCalendarShelf(false);activity.focus();}
    if(actual&&!wasTimeline){
      returnToCalendarMonth=true;planner.setCalendarLayout('day',date);
    }else if(!actual&&returnToCalendarMonth){
      returnToCalendarMonth=false;planner.setCalendarLayout('month',date);
    }else if(wasTimeline){
      renderCalendar();scrollCalendarTo(date,calendarStartMinute(date,Number(calendarPanel.dataset.visibleDays)));
    }
    return;
  }
  if(actualCalendar&&event.target.closest('[data-calendar-layout]'))returnToCalendarMonth=false;
  const replay=event.target.closest('[data-replay-session]');
  if(replay){openPanel('focus-replay',replay);return;}
  const recap=event.target.closest('[data-day-recap]');
  if(recap){openPanel('day-recap',recap);return;}
  const buildWeek=event.target.closest('[data-build-week]');
  if(buildWeek){openWeekBuilder(buildWeek);return;}
  const availability=event.target.closest('[data-open-availability]');
  if(availability){editingAvailabilityId='';openPanel('availability',availability);return;}
  const deadline=event.target.closest('[data-plan-deadline]');
  if(deadline){openDeadlinePlanner(null,deadline);return;}
  const plan=event.target.closest('[data-plan-tomorrow]');
  if(plan){openPanel('plan-tomorrow',plan);return;}
  const replan=event.target.closest('[data-replan-today]');
  if(replan){
    replanPreview=currentReplan();
    openPanel('replan-today',replan);
    return;
  }
  const ritualSchedule=event.target.closest('[data-calendar-rituals]');
  if(ritualSchedule){openPanel('ritual-schedules',ritualSchedule);return;}
  const ritualButton=event.target.closest('[data-ritual-open],[data-ritual-check]');
  if(ritualButton){handleRitualAction(ritualButton);return;}
  const dayHeading=event.target.closest('[data-calendar-day]');
  if(dayHeading){
    planner.setCalendarLayout('day',new Date(`${dayHeading.dataset.calendarDay}T00:00:00`));
    calendarScroll.focus({preventScroll:true});
    return;
  }
  const addEvent=event.target.closest('[data-calendar-add-event]');
  if(addEvent){openCalendarEvent(addEvent);return;}
  const add=event.target.closest('[data-calendar-new]');
  if(add){
    const project=$('#calendar-project').value;
    if(workspace==='calendar')openCalendarEvent(add,{...calendarDraft(),type:'task'});
    else openTaskEditor(null,add,{...calendarDraft(),projectId:project==='all'||project==='inbox'?'':project});
    return;
  }
  const step=event.target.closest('[data-calendar-step]')?.dataset.calendarStep;
  if(step){
    if(!planner.calendarVisible())planner.jumpMonth(new Date(),step==='today'?0:step==='next'?1:-1);
    else if(step==='today')scrollCalendarTo(new Date(),currentCalendarMinute());
    else scrollCalendarTo(shiftDay(leadingPlannerDay(),Number(calendarPanel.dataset.visibleDays)*(step==='next'?1:-1)));
    return;
  }
  const block=event.target.closest('.calendar-block');
  if(block){
    if(!block.classList.contains('calendar-ritual-block'))openCalendarBlock(block);
    return;
  }
  const allDay=event.target.closest('.calendar-all-day-task');
  if(allDay){if(allDay.dataset.calendarEvent)openCalendarBlock(allDay);else openTaskEditor(allDay.dataset.task,allDay);return;}
  if(workspace==='calendar'&&!actualCalendar){
    const button=event.target.closest('button');
    const allDayTarget=event.target.closest('[data-calendar-all-day-create]');
    const monthCell=event.target.closest('.planner-month-cell[data-board-day]');
    if((allDayTarget&&(!button||button===allDayTarget))||(monthCell&&!button)){
      const date=allDayTarget?.dataset.calendarAllDayCreate||monthCell.dataset.boardDay;
      openCalendarEvent(button||$('#planner-heading'),{date,time:'09:00',allDay:true});return;
    }
    const column=!button&&event.target.closest('#calendar-scroll .calendar-day[data-date]');
    if(column){
      const time=timeValue(calendarPointerMinute(event,column));
      calendarSlotPreview.remove();
      openCalendarEvent(calendarScroll,{date:column.dataset.date,time});return;
    }
  }
  const trayTask=event.target.closest('.calendar-tray-task');
  if(trayTask)openBlockEditor(trayTask.dataset.task,trayTask,null,workspace==='calendar'?calendarDraft():null);
});
calendarScroll.addEventListener('dblclick',event=>{
  if(workspace==='calendar')return;
  const day=event.target.closest('.calendar-day');
  if(!day||event.target.closest('button'))return;
  openTaskEditor(null,calendarScroll,{date:day.dataset.date,time:timeValue(dropMinute(event,day))});
});

taskSidebar.addEventListener('click',event=>{
  const button=event.target.closest('button');
  const card=button?.closest('[data-task]');
  if(!card)return;
  if(button.classList.contains('task-more')){openTaskMenu(card.dataset.task,button);return;}
  if(button.classList.contains('task-open'))openTaskEditor(card.dataset.task,button);
  if(button.classList.contains('task-active')){
    const task=state.tasks.find(item=>item.id===card.dataset.task);
    if(!task||waitingOn(task).length)return;
    if(!saveTaskSelection(task))return;
    refreshTasks();
    taskSidebar.querySelector(`[data-task="${CSS.escape(state.activeTask)}"] .task-active`)?.focus();
  }
});
taskSidebar.addEventListener('change',event=>{
  const checkbox=event.target;
  if(!checkbox.classList.contains('task-check'))return;
  const task=state.tasks.find(item=>item.id===checkbox.closest('[data-task]').dataset.task);
  if(!task || taskStatus(task)==='upcoming')return;
  const undo=markTask(task,checkbox.checked,undefined,checkbox);
  persist();refreshTasks();
  taskSidebar.querySelector(`[data-task="${CSS.escape(task.id)}"] .task-check`)?.focus();
  confirmChange(checkbox.checked?'Task completed.':'Task reopened.',undo);
});
function setMediaStatus(message){
  const status=$('#media-status');
  if(status)status.textContent=message;
}
function renderSoundtracks(selected){
  const picker=$('#soundtrack-picker');
  const current=selected??state.soundtracks.find(item=>item.source===state.mediaSource&&item.link===state[state.mediaSource])?.id??'';
  picker.innerHTML='<option value="">Choose a saved soundtrack</option>'+state.soundtracks.map(item=>
    `<option value="${escape(item.id)}">${escape(item.name)} · ${item.source==='youtube'?'YouTube':'Spotify'}</option>`).join('');
  picker.value=current;
  $('#remove-soundtrack').disabled=!picker.value;
}
function applySoundtrack(id){
  const item=state.soundtracks.find(track=>track.id===id);
  $('#remove-soundtrack').disabled=!item;
  if(!item)return;
  const previous=state[item.source],source=state.mediaSource;
  if(previous===item.link&&source===item.source)return;
  state[item.source]=item.link;state.mediaSource=item.source;
  if(!persist()){
    state[item.source]=previous;state.mediaSource=source;renderSoundtracks();
    return;
  }
  mountMedia();renderSoundtracks(id);positionPanel(visiblePanel(),lastAnchor);
}
function saveSoundtrack(form){
  const field=form.elements.name,name=field.value.trim(),source=state.mediaSource,link=$('#media-link').value.trim();
  if(!name){field.focus();return;}
  const match=state.soundtracks.find(item=>item.source===source&&item.name.toLowerCase()===name.toLowerCase());
  const [item]=loadSoundtracks([{id:match?.id||crypto.randomUUID(),name,source,link}]);
  if(!item){
    setMediaStatus('Paste a valid link for the current service before saving.');
    $('#media-link').focus();return;
  }
  const previous=state.soundtracks;
  state.soundtracks=match?previous.map(track=>track===match?item:track):[...previous,item];
  if(!persist()){state.soundtracks=previous;return;}
  renderSoundtracks();
  field.value='';form.closest('details').open=false;
  $('#soundtrack-picker').focus();
  setMediaStatus('Soundtrack saved.');
}
function mountMedia(){
  const wrap=$('#music-player-wrap'),source=state.mediaSource;
  const youtube=source==='youtube';
  const track=youtube?youtubeContent(state.youtube):spotifyPath(state.spotify);
  youtubeEmbed.clear();
  spotifyEmbed.clear(wrap);
  for(const button of root.querySelectorAll('[data-media-source]'))button.setAttribute('aria-pressed',String(button.dataset.mediaSource===source));
  const label=youtube?'YouTube':'Spotify',field=$('#media-link');
  $('#media-link-label').textContent=youtube?'YouTube video or playlist link':'Spotify playlist, album, or track link';
  field.placeholder=youtube?'https://www.youtube.com/watch?v=…':'https://open.spotify.com/playlist/…';
  field.value=state[source];
  const external=$('#open-media-external');
  external.href=youtube?(track?youtubeLinks(track).watch:'https://www.youtube.com/'):(track?'https://open.spotify.com/'+track:'https://open.spotify.com/');
  external.textContent='Open '+(youtube?'on ':'in ')+label;
  $('#remove-player').hidden=!state[source];
  $('#pop-out-youtube').hidden=!youtube||!track;
  renderSoundtracks();
  setMediaStatus(track?'Press play in the '+label+' player.':'Paste a link to start '+label+'.');
  if(!track)return;
  if(youtube)youtubeEmbed.mount(wrap,track);else spotifyEmbed.mount(wrap,track);
}
function popOutYouTube(){
  const panel=visiblePanel();
  if(panel?.id!=='music-panel'||state.mediaSource!=='youtube'||!youtubeContent(state.youtube))return;
  closePanel(false);
  panel.classList.remove('music-hidden');panel.classList.add('music-mini');
  panel.inert=false;panel.setAttribute('aria-hidden','false');panel.setAttribute('aria-modal','false');
  panel.removeAttribute('aria-labelledby');panel.setAttribute('aria-label','YouTube mini player');
  panel.querySelector('.music-mini-bar').hidden=false;
  $('#restore-media-panel').focus({preventScroll:true});
}
function mediaPanelAnchor(){
  const tools=gardenToolAnchor('music'),selected=workspaceButton(workspace);
  return tools.getClientRects().length?tools:selected?.getClientRects().length?selected:workspaceMore;
}
function changeSound(key,value){
  state.sounds[key]=value;
  const field=$(`[data-sound-level="${key}"]`);
  if(field){field.value=value;field.nextElementSibling.value=`${value}%`;}
  syncSound(true);
}

root.addEventListener('click',e=>{
  const setup=e.target.closest('[data-start-focus-setup]');
  if(setup){startFocusSetup(setup.dataset.startFocusSetup);return;}
  const incomplete=e.target.closest('[data-incomplete-action]');
  if(incomplete){actOnIncomplete(incomplete.dataset.sessionId,incomplete.dataset.incompleteAction,incomplete);return;}
  const adminAction=e.target.closest('[data-admin-action]');
  if(adminAction){runAdminSandbox(adminAction.dataset.adminAction);return;}
  const constellation=e.target.closest('[data-guide-constellation]');
  if(constellation){openUnlockedConstellation(constellation.dataset.guideConstellation,constellation,gardenThrough||snapshotThrough);return;}
  const classFit=e.target.closest('[data-class-fit-task]');
  if(classFit){startClassFitTask(classFit.dataset.classFitTask,$('#class-buffer').valueAsNumber);return;}
  if(e.target.closest('[data-preview-rubric]')){
    const form=$('#task-editor-form'),items=parseRubric(form.elements.rubricText.value);
    const preview=form.querySelector('[data-rubric-preview]');
    preview.innerHTML=items.length?`<fieldset><legend>Choose subtasks to add when you save</legend>${items.map((item,index)=>
      `<div class="rubric-row"><label><input type="checkbox" name="rubricItem" value="${index}" checked> ${escape(item.text)}</label>
        <label>Points<input name="rubricPoints:${index}" type="number" min="0" max="10000" step=".01" value="${item.points??''}"></label></div>`).join('')}</fieldset>`:
      '<p>Paste at least one rubric item to preview.</p>';
    return;
  }
  const color=e.target.closest('[data-task-color-choice]');
  if(color){saveQuickTaskColor(color);return;}
  const deleteCalendar=e.target.closest('[data-calendar-list-delete]');
  if(deleteCalendar){removeCalendar(deleteCalendar);return;}
  const resource=e.target.closest('[data-resource-edit],[data-resource-pin],[data-resource-remove]');
  if(resource){resourceAction(resource);return;}
  if(e.target.closest('#cancel-resource-edit')){
    resourceEditId='';refreshPanel();$('#resource-title').focus();return;
  }
  if(e.target.closest('#delete-day-template')){
    const removed=state.calendarDayTemplates.find(item=>item.id===dayTemplateId);
    if(!removed)return;
    const remaining=state.calendarDayTemplates.filter(item=>item!==removed);
    if(updateDayTemplates(remaining,remaining[0]?.id||''))confirmChange('Day template deleted.',latest=>{
      if(latest.calendarDayTemplates.some(item=>item.id===removed.id))return false;
      latest.calendarDayTemplates.push(removed);
      return true;
    });
    return;
  }
  if(e.target.closest('[data-return-garden-tools]')){
    openPanel('garden-tools',$('#garden-tools'));
    ($(`[data-home-tool="${lastGardenTool}"]:not([hidden])`)||$('#garden-tool-search')).focus({preventScroll:true});
    return;
  }
  const settings=e.target.closest('[data-garden-setting]');
  if(settings){
    const destination=settings.dataset.gardenSetting;
    if(destination==='backup'){backup.open();return;}
    if(destination!==activePanel){
      const anchor=lastAnchor;
      if(anchor?.id==='garden-tools')lastGardenTool=destination;
      openPanel(destination,anchor);
      $(`#garden-setting-${destination}-${destination}`).focus({preventScroll:true});
    }
    return;
  }
  const homeTool=e.target.closest('[data-home-tool]');
  if(homeTool){
    const id=homeTool.dataset.homeTool;
    lastGardenTool=id;
    if(id==='help'){closePanel();helpGuide.open();return;}
    if(id==='backup'){closePanel();backup.open();return;}
    if(id==='garden-studio'){openGardenStudio();return;}
    openPanel(id,gardenSettingsSections.some(([section])=>section===id)?$('#garden-tools'):gardenToolAnchor(id));return;
  }
  if(e.target.closest('#open-break-ideas')){openPanel('break-ideas',gardenToolAnchor('pagoda'));return;}
  if(e.target.closest('#next-break-idea')){breakIdeaIndex++;renderBreakSuggestion();return;}
  const removeIdea=e.target.closest('[data-remove-break-idea]');
  if(removeIdea){
    if(saveBreakIdeas(state.breakIdeas.filter(idea=>idea.id!==removeIdea.dataset.removeBreakIdea)))confirmChange('Break idea removed.');
    return;
  }
  const useDraft=e.target.closest('[data-use-week-draft]');
  if(useDraft){
    const option=weekComparison.find(item=>item.id===useDraft.dataset.useWeekDraft);
    if(!option)return;
    const draft=draftStudyWeek(weekData(),option.settings);
    if(!draft){weekComparison=[];refreshPanel();confirmChange('The calendar changed. Compare drafts again.');return;}
    weekSettings=option.settings;weekComparison=[];showWeekDraft(draft);return;
  }
  if(e.target.closest('[data-open-garden-studio]')){openGardenStudio();return;}
  const layoutButton=e.target.closest('[data-view-garden-layout]');
  if(layoutButton){
    const layout=state.gardenLayouts.find(item=>item.id===layoutButton.dataset.viewGardenLayout);
    if(layout)setGardenSnapshot(layout.through,layout.id);
    return;
  }
  if(e.target.closest('[data-open-postcard]')){openGardenPostcard();return;}
  if(e.target.closest('[data-postcard-viewpoints]')){openPostcardViewpoints(activePanel==='garden-studio'?studio.postcardScene():undefined);return;}
  if(e.target.closest('[data-open-garden-comparison]')){openGardenComparison();return;}
  if(e.target.closest('[data-semester-replay]')){
    const range=$('#garden-range'),from=range.elements.from.value,through=range.elements.through.value;
    if(!range.reportValidity())return;
    if(from&&through&&from>through){toast('Choose an end date after the start.');return;}
    const history=state.gardenGrowth,courses=gardenCourses(history,state.projects),design=sceneGardenDesign();
    openSemesterReplay({history,from,through,label:item=>landmarkDate(item.day)+' · '+landmarkTypes[item.kind].event+' · '+item.title,
      paint:(container,visible)=>mountGardenPreview(container,{...effectiveAppearance,lighting:'dusk',motion:'still'},{history,courses,design,visible})});return;
  }
  if(e.target.closest('#apply-preview-season')){applyPreviewSeason();return;}
  if(e.target.closest('[data-inscription-postcard]')){
    const caption=state.gardenGrowth[selectedLandmark]?.inscription;
    if(caption)openGardenPostcard(caption);
    return;
  }
  if(e.target.closest('#postcard-month')){
    $('#postcard-caption').value=new Date(`${snapshotThrough||dayKey()}T12:00:00`).toLocaleDateString([],{month:'long',year:'numeric'});
    $('#postcard-caption').focus();return;
  }
  const look=e.target.closest('[data-apply-garden-look],[data-remove-garden-look]');
  if(look){
    if(look.dataset.applyGardenLook)applyGardenLook(look.dataset.applyGardenLook);
    else{
      const previous=state.gardenLooks;
      state.gardenLooks=previous.filter(item=>item.id!==look.dataset.removeGardenLook);
      if(!persist()){state.gardenLooks=previous;return;}
      refreshPanel();$('#garden-look-name')?.focus();confirmChange('Garden look removed.');
    }
    return;
  }
  if(e.target.closest('[data-evening-lights]')){openEveningLights();return;}
  const resumeBundle=e.target.closest('[data-resume-bundle]');
  if(resumeBundle){startBundle(resumeBundle.dataset.resumeBundle);return;}
  const pauseBundle=e.target.closest('[data-pause-bundle]');
  if(pauseBundle){stopBundle(pauseBundle);return;}
  if(e.target.closest('[data-bundle-planner]')){runHelpAction('bundles');return;}
  const tradeoff=e.target.closest('[data-apply-tradeoff]');
  if(tradeoff){applyTradeoff(Number(tradeoff.dataset.applyTradeoff));return;}
  const mistake=e.target.closest('[data-task-mistakes]');
  if(mistake){
    const task=state.tasks.find(item=>item.id===editingTaskId);
    if(task)mistakeNotebook.open({taskId:task.id,title:task.text},mistake);
    return;
  }
  const inboxTab=e.target.closest('[data-capture-inbox-tab]');
  if(inboxTab){
    captureInboxTab=inboxTab.dataset.captureInboxTab;
    captureInboxIndex=0;refreshPanel();
    $(`[data-capture-inbox-tab="${captureInboxTab}"]`)?.focus();return;
  }
  const restore=e.target.closest('[data-restore-capture]');
  if(restore){restoreCapture(restore.dataset.restoreCapture);captureInboxFocus();return;}
  if(e.target.closest('#focus-today-goal')){compass.openGoal();return;}
  if(e.target.closest('#open-day-recap')){openPanel('day-recap',$('[data-panel="progress"]'));return;}
  if(e.target.closest('#recap-open-tomorrow')){runHelpAction('tomorrow');return;}
  const recap=e.target.closest('.recap-entry');
  if(recap){
    const {recapTask,recapCapture,recapRitual,date}=recap.dataset;
    recapOrigin=lastAnchor;
    if(recapTask)openTaskEditor(recapTask,recap);
    else if(recap.hasAttribute('data-recap-block'))openCalendarBlock(recap);
    else if(recapCapture){
      visitWorkspace('notes');
      captureInboxTab=state.captureArchive.some(note=>note.key===recapCapture)?'archive':'inbox';
      openCaptureInbox(false);
      captureInboxIndex=[...root.querySelectorAll('#capture-inbox-list .capture-card')].findIndex(card=>card.dataset.captureKey===recapCapture);
      captureInboxFocus();
    }else if(recapRitual==='journal'){visitWorkspace('journal');journal.openDate(date);}
    else if(recapRitual)visitWorkspace(recapRitual==='crochet'?'crochet':'reading');
    return;
  }
  const history=e.target.closest('#open-garden-history,#garden-history-today,[data-garden-history-open]');
  if(history){openPanel(history.id==='garden-history-today'?'progress':'garden-history',$('[data-panel="progress"]'));return;}
  if(e.target.closest('[data-garden-clear-range]')){
    gardenFrom='';gardenThrough='';refreshPanel();$('#garden-range input')?.focus();return;
  }
  const course=e.target.closest('[data-guide-course]');
  if(course){openGardenCourse(course.dataset.guideCourse,$('[data-panel="progress"]'));return;}
  const historyFilter=e.target.closest('[data-history-filter]');
  if(historyFilter){
    gardenHistoryFilter=historyFilter.dataset.historyFilter;refreshPanel();
    $(`[data-history-filter="${gardenHistoryFilter}"]`)?.focus({preventScroll:true});return;
  }
  const landmark=e.target.closest('[data-history-landmark]');
  if(landmark){openGardenLandmark(Number(landmark.dataset.historyLandmark));return;}
  const book=e.target.closest('[data-landmark-book]');
  if(book){visitWorkspace('reading');reading.openBook(book.dataset.landmarkBook);return;}
  const exam=e.target.closest('[data-landmark-exam]');
  if(exam){
    visitWorkspace('planner');planner.openProject(exam.dataset.examProject);
    examPlans.open(exam.dataset.examProject,exam.dataset.landmarkExam,$('[data-project-exams]'));return;
  }
  const approval=e.target.closest('[data-approve-week-day]');
  if(approval){approveWeekDay(approval.dataset.approveWeekDay);return;}
  const restoreWeek=e.target.closest('[data-restore-week-slot]');
  if(restoreWeek){
    const slot=skippedWeekSlots.find(item=>item.draftId===Number(restoreWeek.dataset.restoreWeekSlot));
    if(!slot)return;
    const slots=[...weekSlots,slot],draft=currentWeekDraft(slots);
    if(!draft){announce('Refresh the draft to update its date range.');return;}
    skippedWeekSlots=skippedWeekSlots.filter(item=>item!==slot);
    weekSlots=slots;weekDraft=draft;refreshPanel();
    $(`[data-edit-week-slot="${slot.draftId}"]`)?.focus({preventScroll:true});return;
  }
  const editWeekSlot=e.target.closest('[data-edit-week-slot],[data-cancel-week-slot],[data-skip-week-slot]');
  if(editWeekSlot){
    const {editWeekSlot:edit,skipWeekSlot:skip}=editWeekSlot.dataset;
    const returnId=weekEditId;
    weekEditId=edit===undefined?null:Number(edit);
    if(skip!==undefined){
      const slot=weekSlots.find(slot=>slot.draftId===Number(skip));
      if(!slot)return;
      const slots=weekSlots.filter(slot=>slot.draftId!==Number(skip));
      const draft=currentWeekDraft(slots);
      if(!draft){announce('Refresh the draft to update its date range.');return;}
      skippedWeekSlots=[...skippedWeekSlots,slot];weekSlots=slots;weekDraft=draft;
    }
    refreshPanel();
    const target=edit!==undefined?$('#week-slot-form select'):skip!==undefined?$('#week-draft-heading'):$(`[data-edit-week-slot="${returnId}"]`);
    target?.focus({preventScroll:true});return;
  }
  const viewProject=e.target.closest('[data-view-project]');
  if(viewProject){visitWorkspace('planner');planner.openProject(viewProject.dataset.viewProject);return;}
  if(e.target.closest('#project-context-ready')){closePanel(false);timerButton.focus({preventScroll:true});return;}
  const availability=e.target.closest('[data-edit-availability],#new-availability');
  if(availability){editingAvailabilityId=availability.dataset.editAvailability||'';refreshPanel();$('#availability-name').focus();return;}
  const phase=e.target.closest('[data-phase-action]');
  if(phase){changePhaseRows(phase);return;}
  const routineEditorButton=e.target.closest('#add-routine-sequence,[data-edit-routine]');
  if(routineEditorButton){
    editingRoutineId=routineEditorButton.dataset.editRoutine||null;
    openPanel('routine-editor',gardenToolAnchor('pagoda'));return;
  }
  const fit=e.target.closest('[data-fit-task]');
  if(fit){
    const minutes=Number($('#fit-minutes').value);
    const task=tasksWithinTime(gardenFocusQueue(),minutes,fitEnergy,true).find(item=>item.id===fit.dataset.fitTask);
    if(!task||state.timer.block||state.timer.sequence||state.timer.mistakeId||state.timer.mode==='focus'&&state.timer.id)return;
    const timing=taskTimeFit(task,minutes,true);
    if(!saveTaskSelection(task,timing.minutes))return;
    closePanel(false);refreshTasks();timerButton.focus({preventScroll:true});
    announce(`Current task: ${task.text}`);return;
  }
  const template=e.target.closest('[data-template-action]');
  if(template){editTaskTemplate(template);return;}
  const estimate=e.target.closest('[data-use-estimate]');
  const parts=e.target.closest('[data-draft-parts]');
  if(parts){
    const field=$('#task-subtasks');
    const draft=Array.from({length:Number(parts.dataset.draftParts)},(_,i)=>`Part ${i+1} · ${parts.dataset.partMinutes} min`).join('\n');
    field.value=[field.value.trimEnd(),draft].filter(Boolean).join('\n');
    field.focus();parts.disabled=true;return;
  }
  if(estimate){
    const field=estimate.form.elements.estimate||estimate.form.elements.minutes;
    field.value=estimate.dataset.useEstimate;updateScheduleEditor(estimate.form);field.focus();return;
  }
  const findTomorrow=e.target.closest('#tomorrow-find-slot');
  if(findTomorrow){updateTomorrowSlot(findTomorrow.form,false);return;}
  if(e.target.closest('#open-media-external')){
    changeSound('musicMode',true);
    const field=$('#outside-music');
    if(field)field.checked=true;
    persist();
  }
  const btn=e.target.closest('button');if(!btn)return;
  if(btn.id==='open-reading-shelf'){
    $('#workspace-tabs [data-workspace="reading"]').click();
    return;
  }
  if(btn.dataset.finishTask){finishCurrentTask(btn);return;}
  if(btn.dataset.openRitualNow){
    const kind=btn.dataset.openRitualNow,date=btn.dataset.date;
    if(kind==='journal'){closePanel(false);journal.openDate(date);}
    else{
      btn.dataset.ritual=kind;btn.dataset.ritualDate=date;
      openPanel('daily-ritual',btn);
    }
    return;
  }
  if(btn.hasAttribute('data-convert-calendar-task')){
    const task=state.tasks.find(item=>item.id===editingTaskId);
    if(task)openCalendarEvent(lastAnchor,{...calendarDraft(),task});return;
  }
  if(btn.id==='ritual-book-search'){searchRitualBooks(btn);return;}
  if(btn.classList.contains('close-panel'))closePanel();
  if(btn.id==='delete-calendar-event'){
    const id=btn.form.dataset.eventId, prior=state.calendarEvents;
    const event=prior.find(item=>item.id===id&&item.manual);
    if(!event)return;
    state.calendarEvents=prior.filter(item=>item!==event);
    if(!persist()){state.calendarEvents=prior;return;}
    finishCalendarEventChange();
    confirmChange('Event deleted.',latest=>{
      if(latest.calendarEvents.some(item=>item.id===id))return false;
      latest.calendarEvents.push(event);return true;
    });
    return;
  }
  if(btn.id==='focus-task-add'||btn.id==='focus-task-edit'){
    openTaskEditor(btn.id==='focus-task-edit'?focusedTask()?.id:null,currentTaskButton);
    return;
  }
  if(btn.dataset.queueStep){
    moveFocusQueueTask(btn.closest('[data-queue-id]').dataset.queueId,null,Number(btn.dataset.queueStep));
    return;
  }
  if(btn.id==='reset-focus-order'){saveFocusOrder([]);return;}
  if(btn.dataset.focusTask){
    const task=gardenFocusQueue().find(item=>item.id===btn.dataset.focusTask);
    if(!task||state.timer.block)return;
    if(!saveTaskSelection(task))return;
    closePanel(false);refreshTasks();
    timerButton.focus({preventScroll:true});
    announce(`Current task: ${task.text}`);
    return;
  }
  if(btn.id==='edit-calendar-task'){openTaskEditor(lastAnchor.dataset.task,lastAnchor);return;}
  if(btn.id==='confirm-block-extension'&&activePanel==='calendar-extension'){
    checkCompletion();
    const now=Date.now(),plan=planRunningBlockExtension(state,blockExtensionMinutes,now);
    if(JSON.stringify(plan)!==JSON.stringify(extensionPreview)){
      extensionPreview=plan;refreshPanel();
      $('#confirm-block-extension')?.focus({preventScroll:true});
      announce(plan?'The calendar changed. Review the updated extension.':'This block is no longer available to extend.');
      return;
    }
    if(!plan)return;
    const {tasks,timer}=state;
    if(!extendCalendarTimer(state,blockExtensionMinutes*60000,now))return;
    state.tasks=tasks.map(task=>task.id===plan.taskId?{...task,...calendarBlockDurationChange(task,plan.blockId,plan.occurrence,plan.minutes)}:task);
    if(!persist()){Object.assign(state,{tasks,timer});return;}
    closePanel();refreshTasks();wake();
    toast('Calendar block extended by 10 minutes.');announce('Calendar block extended by 10 minutes.');
    return;
  }
  if(btn.id==='edit-calendar-block'){
    const {task,block}=lastAnchor.dataset;
    if(block)openBlockEditor(task,lastAnchor,block);
    else openTaskEditor(task,lastAnchor);
  }
  if(btn.id==='start-block-focus'){
    checkCompletion();
    const now=Date.now(),timing=selectedBlockTiming(now);
    const id=lastAnchor.dataset.task;
    const task=state.tasks.find(task=>task.id===id);
    if(!timing?.available||task?.waitingFor||waitingOn(task).length){updateBlockPreview(now);return;}
    const skipped=record(state,'skipped',now);
    const {occurrence,block,taskDay}=lastAnchor.dataset;
    pauseBundleForTask(id);
    startBlockFocus(state,id,timing.available,timing.split,now,occurrence,block||null,taskDay||occurrence);
    closePanel(false);
    if(inSchedule())closeCalendar();
    if(!durationForm.hidden)finishEdit();
    persist();refreshTasks();wake();
    $('#toggle-timer').focus({preventScroll:true});
    const message=skipped?'Block focus started. The previous session was skipped.':'Block focus started.';
    toast(message);announce(message+(hasHandoff(task)||task?.reference?' Saved focus context is beside the timer.':''));
  }
  if(btn.id==='panel-timer-toggle')$('#toggle-timer').click();
  if(btn.id==='timer-notifications')toggleNotifications();
  if(btn.id==='pin-tomorrow-task'){pinTomorrowTask(btn.form);return;}
  if(btn.id==='timer-open-sounds')openPanel('music',gardenToolAnchor('music'));
  if(btn.dataset.removeGardenPreset){
    state.gardenSchedule.presets=state.gardenSchedule.presets.filter(item=>item.time!==btn.dataset.removeGardenPreset);
    persist();render();refreshPanel();$('#garden-preset-time')?.focus();
  }
  if(btn.id==='silence-ambience'){
    for(const kind of ['rain','water','wind'])changeSound(kind,0);
    persist();
  }
  if(btn.id==='quick-capture')openPanel('capture',gardenToolAnchor('notes'));
  if(btn.id==='capture-window'){
    if(adminSandbox){toast('Use in-app capture to keep this note in the sandbox.');return;}
    const left=Math.round(capturePointer?.screenX??window.screenX);
    const top=Math.round(capturePointer?.screenY??window.screenY);
    const windowRef=window.open('./capture.html','yin-yang-capture',`popup,width=380,height=285,left=${left},top=${top}`);
    if(windowRef){windowRef.focus();closePanel();}else toast('Open the quick note page in another tab to capture a thought.');
  }
  if(btn.dataset.routine){
    const routine=[...builtinRoutines,...state.routines].find(item=>item.id===btn.dataset.routine);
    if(!routine)return;
    if(routine.phases){
      checkCompletion();
      if(state.timer.id){toast('Finish or reset the current timer before switching routines.');return;}
      const prior=state.timer;
      loadRoutinePhase(state,routine);
      if(!persist()){state.timer=prior;return;}
      closePanel(false);render();timerButton.focus({preventScroll:true});
      confirmChange(`${routine.name} is ready.`);return;
    }
    action(()=>{
      state.settings.focus=routine.focus/60000;
      state.settings.break=routine.rest/60000;
      if(!state.timer.id)reset(state);
    });
    $('#focus-minutes')?.focus({preventScroll:true});
    toast(state.timer.id?'Routine ready for the next session.':'Routine applied.');
  }
  if(btn.dataset.deleteRoutine){
    state.routines=state.routines.filter(routine=>routine.id!==btn.dataset.deleteRoutine);
    persist();refreshPanel();$('#routine-name')?.focus();
  }
  if(btn.id==='open-notes-board'){
    closePanel(false);
    $('#workspace-tabs [data-workspace="notes"]').click();
    $('#sticky-add').focus({preventScroll:true});
    return;
  }
  if(btn.id==='clear-notes'){if(!state.notes||!saveScratchpad(''))return;$('#notes-input').value='';toast('Notes cleared.');$('#notes-input').focus();}
  if(btn.dataset.mediaSource&&state.mediaSource!==btn.dataset.mediaSource){
    state.mediaSource=btn.dataset.mediaSource;persist();mountMedia();positionPanel(visiblePanel(),lastAnchor);return;
  }
  if(btn.id==='pop-out-youtube'){popOutYouTube();return;}
  if(btn.id==='restore-media-panel'){openPanel('music',mediaPanelAnchor());return;}
  if(btn.id==='hide-media-mini'){
    const panel=btn.closest('#music-panel');
    panel.classList.remove('music-mini');panel.classList.add('music-hidden');panel.inert=true;
    panel.setAttribute('aria-hidden','true');panel.querySelector('.music-mini-bar').hidden=true;
    mediaPanelAnchor().focus({preventScroll:true});return;
  }
  if(btn.id==='remove-soundtrack'){
    const id=$('#soundtrack-picker').value;
    if(!id)return;
    const previous=state.soundtracks;
    state.soundtracks=previous.filter(item=>item.id!==id);
    if(!persist()){state.soundtracks=previous;return;}
    renderSoundtracks('');$('#soundtrack-picker').focus();
    setMediaStatus('Saved soundtrack removed.');return;
  }
  if(btn.id==='remove-player'){
    state[state.mediaSource]='';persist();mountMedia();$('#media-link').focus();
    positionPanel(visiblePanel(),lastAnchor);return;
  }
  if(btn.id==='delete-task'){
    closePanel(false);deleteTask(editingTaskId);
  }
  if(btn.id==='task-detail-complete'){
    const task=state.tasks.find(item=>item.id===editingTaskId);
    const day=taskEditorOccurrence();
    if(!task||task.repeat!=='none'&&!taskOccursOn(task,day))return;
    const done=taskStatus(task,day)!=='done';
    const undo=markTask(task,done,day,btn);
    persist();refreshTasks();
    updateTaskCompletionButton();
    confirmChange(done?'Task completed.':'Task reopened.',undo);
  }
  if(btn.id==='delete-block'){
    const task=state.tasks.find(item=>item.id===editingTaskId);
    if(!task)return;
    const finishUndo=captureTaskChange(task,['blocks']);
    task.blocks=task.blocks.filter(block=>block.id!==editingBlockId);
    closePanel(false);persist();refreshTasks();
    (inSchedule()?$('#planner-heading'):$('#sidebar-calendar')).focus({preventScroll:true});
    confirmChange('Block deleted.',finishUndo());
  }
});
root.addEventListener('keydown',event=>{
  if(event.target.id!=='garden-tool-search'||event.key!=='Enter'||event.isComposing)return;
  event.preventDefault();
  visiblePanel()?.querySelector('[data-home-tool]:not([hidden])')?.click();
});
root.addEventListener('input',e=>{
  if(e.target.id==='garden-tool-search'){
    gardenToolQuery=e.target.value;
    filterGardenTools(visiblePanel());
    return;
  }
  if(e.target.id==='class-buffer')updateClassFitResults();
  if(e.target.name==='rubricText')e.target.form.querySelector('[data-rubric-preview]').replaceChildren();
  if(e.target.name?.startsWith('done:')){
    const form=e.target.form,task=state.tasks.find(item=>item.id===editingTaskId);
    const summary=form?.querySelector('[data-rubric-progress]');
    if(summary&&task)summary.textContent=rubricSummary(task.subtasks.map(sub=>({...sub,done:form.elements.namedItem('done:'+sub.id)?.checked})));
  }
  if(e.target.matches('[data-color-wheel],[data-color-hex]')){
    syncCustomColor(e.target);
    if(e.target.form?.id==='task-editor-form')updateTaskColorFields(e.target.form);
  }
  if(e.target.form?.matches('#calendar-event-form,#calendar-list-form'))updateCalendarColorPreview(e.target.form);
  if(e.target.name==='resumeResource')e.target.setCustomValidity('');
  if(e.target.form?.id==='build-week-form'){
    const results=$('#week-draft-results');
    if(results)results.hidden=true;
  }
  if(e.target.id==='fit-minutes'){
    const minutes=Number(e.target.value);
    if(e.target.validity.valid&&minutes>0)fitMinutes=minutes;
    $('#fit-results').innerHTML=fitTaskResults(minutes);
  }
  if(e.target.id==='quick-task-line')updateQuickTask(e.target.form);
  if(e.target.id==='prerequisite-search'){
    const query=e.target.value.trim().toLowerCase();
    let matches=0;
    for(const label of e.target.form.querySelectorAll('[data-prerequisite-name]')){
      label.hidden=!label.dataset.prerequisiteName.includes(query);
      if(!label.hidden)matches++;
    }
    $('#prerequisite-no-results').hidden=matches>0;
  }
  if(e.target.form?.matches('#task-editor-form,#block-editor-form')&&
    ['date','time','estimate','minutes','deadline','repeat','title','labels'].includes(e.target.name))updateScheduleEditor(e.target.form);
  if(e.target.id==='focus-minutes'||e.target.id==='break-minutes')formatDurationInput(e);
  if(e.target.dataset.soundLevel)changeSound(e.target.dataset.soundLevel,Number(e.target.value));
  if(e.target.id==='notes-input')saveScratchpad(e.target.value);
  if(e.target.id==='intention'){state.intention=e.target.value;persist();render();}
  if(e.target.id==='task-title')e.target.setCustomValidity('');
  if(e.target.id==='task-date'||e.target.id==='task-repeat')$('#task-date').setCustomValidity('');
});
let focusQueueDrag;
root.addEventListener('pointerdown',event=>{
  const grip=event.target.closest('.focus-queue-grip');
  if(!grip||!event.isPrimary||event.button!==0||focusQueueDrag?.grip.isConnected)return;
  const source=grip.closest('.focus-queue-row');
  focusQueueDrag={grip,source,pointerId:event.pointerId,target:null};
  grip.setPointerCapture(event.pointerId);
  source.classList.add('focus-queue-source');
});
root.addEventListener('pointermove',event=>{
  if(focusQueueDrag?.pointerId!==event.pointerId)return;
  const list=focusQueueDrag.source.closest('.focus-task-list');
  const row=document.elementFromPoint(event.clientX,event.clientY)?.closest('.focus-queue-row');
  const target=row!==focusQueueDrag.source&&list?.contains(row)?row:null;
  if(target===focusQueueDrag.target)return;
  focusQueueDrag.target?.classList.remove('focus-queue-drop');
  focusQueueDrag.target=target;
  target?.classList.add('focus-queue-drop');
});
function endFocusQueueDrag(event,apply){
  if(focusQueueDrag?.pointerId!==event.pointerId)return;
  const {source,target}=focusQueueDrag;
  focusQueueDrag=null;
  source.classList.remove('focus-queue-source');
  target?.classList.remove('focus-queue-drop');
  if(apply&&target)moveFocusQueueTask(source.dataset.queueId,target.dataset.queueId);
}
root.addEventListener('pointerup',event=>endFocusQueueDrag(event,true));
root.addEventListener('pointercancel',event=>endFocusQueueDrag(event,false));
root.addEventListener('lostpointercapture',event=>endFocusQueueDrag(event,false));
root.addEventListener('change',event=>{
  if(event.target.id==='postcard-weekly'){
    $('#postcard-highlight-label').hidden=!event.target.checked;
    if(event.target.checked){
      const end=snapshotThrough||dayKey(),start=dayKey(shiftDay(new Date(end+'T12:00:00'),-6));
      const select=$('#postcard-highlight');select.length=1;
      const highlights=state.gardenGrowth.filter(item=>item.day>=start&&item.day<=end)
        .map(item=>[landmarkTypes[item.kind].event,item.title]);
      for(const entry of loadJournal(storage).filter(e=>!e.draft&&e.date>=start&&e.date<=end)){
        for(const line of entry.body.split(/\r?\n/).map(s=>s.trim()).filter(Boolean))highlights.push([entry.title||entry.date,line]);
      }
      for(const [title,caption] of highlights){const text=caption.slice(0,90);select.add(new Option(title+' · '+text,text));}
    }
    return;
  }
  if(event.target.id==='postcard-highlight'){
    $('#postcard-caption').value=event.target.value;$('#postcard-caption').focus();return;
  }
  if(event.target.id==='day-template-source'){dayTemplateSource=event.target.value;return;}
  if(event.target.id==='day-template-target'||event.target.id==='day-template-picker'){
    const form=event.target.form;
    const choices=[...form.querySelectorAll('input[name=row]:not(:disabled)')];
    const selected=event.target.id==='day-template-target'&&choices.length
      ?new Set([...form.querySelectorAll('input[name=row]:is(:checked,:disabled)')].map(input=>Number(input.value))):null;
    if(event.target.id==='day-template-picker')dayTemplateId=event.target.value;
    dayTemplateTarget=form.elements.date.value;
    const template=state.calendarDayTemplates.find(item=>item.id===dayTemplateId);
    $('#day-template-preview').innerHTML=dayTemplateRows(template,selected);
    form.querySelector('.template-error').hidden=true;
    return;
  }
  if(event.target.id==='soundtrack-picker'){applySoundtrack(event.target.value);return;}
  const itemId=event.target.dataset.focusSubtask;
  if(itemId){
    const task=state.tasks.find(item=>item.id===event.target.dataset.subtaskParent);
    const sub=task?.subtasks.find(item=>item.id===itemId);
    if(!sub)return;
    const previous=sub.done;
    sub.done=event.target.checked;
    if(!persist()){sub.done=previous;event.target.checked=previous;return;}
    refreshTasks();
    announce(sub.done?'Subtask completed.':'Subtask reopened.');
    return;
  }
  if(event.target.id==='task-important'){
    if(event.target.checked){event.target.dataset.previous=$('#task-priority').value;$('#task-priority').value='1';}
    else $('#task-priority').value=['2','3'].includes(event.target.dataset.previous)?event.target.dataset.previous:'4';
  }
  if(event.target.id==='task-priority')$('#task-important').checked=event.target.value==='1';
  if(event.target.id==='task-calendar-color')updateTaskColorFields(event.target.form);
  if(event.target.id==='tradeoff-task'){
    tradeoffTaskId='';tradeoffPreview=[];
    $('.tradeoff-options')?.remove();
    $('#tradeoff-empty')?.remove();
    return;
  }
  if(event.target.id==='fit-energy'){
    fitEnergy=event.target.value;
    $('#fit-results').innerHTML=fitTaskResults(Number($('#fit-minutes').value));return;
  }
  const id=event.target.dataset.shutdownStep;
  if(id){
    const day=dayKey(),previous=state.shutdownProgress;
    const checked=new Set(previous?.day===day?previous.ids:[]);
    if(event.target.checked)checked.add(id);else checked.delete(id);
    state.shutdownProgress={day,ids:[...checked]};
    if(!persist()){state.shutdownProgress=previous;event.target.checked=!event.target.checked;}
    return;
  }
  if(event.target.form?.id==='availability-form'&&event.target.name==='allDay'){
    const times=$('#availability-times');times.hidden=event.target.checked;
    times.querySelectorAll('input').forEach(input=>input.disabled=event.target.checked);
  }
  if(event.target.id==='task-template'){updateTemplateButtons(event.target);return;}
  if(event.target.id==='deadline-plan-task'){
    deadlineTaskId=event.target.value;refreshPanel();return;
  }
  if(event.target.id==='tomorrow-task'){updateTomorrowSlot(event.target.form,true);return;}
  const form=event.target.form;
  if(form?.id==='deadline-plan-form'){
    const slots=selectedDeadlineSlots(form,deadlinePreview);
    const unchecked=deadlinePreview.slots.filter(slot=>!slots.includes(slot)).reduce((total,slot)=>total+slot.minutes,0);
    const missing=deadlinePreview.unplaced+unchecked,status=$('#deadline-plan-status');
    status.toggleAttribute('data-shortfall',missing>0);
    status.textContent=missing?`${minutesLabel(missing)} will still be unscheduled.`:'The selected blocks cover the remaining estimate.';
    form.querySelector('[type="submit"]').disabled=!slots.length;
  }
  if(form?.matches('#task-editor-form,#block-editor-form')&&
    ['date','time','estimate','minutes','deadline','repeat'].includes(event.target.name))updateScheduleEditor(form);
  if(event.target.name==='prerequisite')$('#prerequisite-error').hidden=true;
  if(form?.id==='replan-form')form.querySelector('[type="submit"]').disabled=!form.querySelector('input:checked');
  if(form?.id==='ritual-schedules-form'&&event.target.matches('[data-ritual-placement]')){
    const row=event.target.closest('[data-ritual-settings]'),timed=event.target.value==='timed';
    row.querySelector('.ritual-weekdays').hidden=event.target.value==='off';
    row.querySelector('[data-ritual-times]').hidden=!timed;
    row.querySelectorAll('[data-ritual-times] input').forEach(input=>input.disabled=!timed);
  }
  if(form?.id==='calendar-list-form')updateCalendarColorPreview(form);
  if(form?.id==='calendar-event-form'){
    const {elements}=form;
    if(event.target===elements.startDay&&elements.endDay.value<elements.startDay.value)elements.endDay.value=elements.startDay.value;
    syncCalendarEntry(form);
  }
  if(event.target.id==='garden-schedule-enabled'){
    state.gardenSchedule.enabled=event.target.checked;
    persist();render();renderSeasonPreview();
  }
  if(event.target.name==='garden-motion'){
    const previous=state.appearance;
    state.appearance=loadAppearance({...previous,motion:event.target.value});
    if(!persist()){state.appearance=previous;refreshPanel();}
    render();return;
  }
  if(event.target.dataset.soundLevel)persist();
  if(event.target.id==='mute-garden'||event.target.id==='outside-music'){
    changeSound(event.target.id==='mute-garden'?'muted':'musicMode',event.target.checked);
    persist();
  }
  if(event.target.name==='garden-season-preview'){
    seasonPreview=event.target.value;renderSeasonPreview();return;
  }
  const appearanceField={'garden-lighting':'lighting','garden-weather':'weather','garden-palette':'palette'}[event.target.name];
  if(appearanceField){
    const value=event.target.value;
    const appearance={...state.appearance,[appearanceField]:value};
    if(appearanceField==='weather'&&value==='auto')appearance.weatherSince=Date.now();
    state.appearance=loadAppearance(appearance);
    state.gardenSchedule.enabled=false;
    $('#garden-schedule-enabled').checked=false;
    persist();render();renderSeasonPreview();
  }
  if(event.target.id==='task-project')$('#task-section').innerHTML=taskSectionOptions(event.target.value);
  if(event.target.id==='task-repeat'){
    const hidden=event.target.value!=='interval';
    $('#task-interval-field').hidden=hidden;
    $('#task-interval').disabled=hidden;
    $('#task-repeat-hint').hidden=event.target.value==='none';
  }
});
root.addEventListener('submit',e=>{
  e.preventDefault();
  if(e.target.id==='focus-pause-form'){
    if(savePauseNote(editingPause,e.target.elements.reason.value)){closePanel();toast('Pause note saved to session replay.');}
    else toast('This pause is no longer available to edit.');
    return;
  }
  if(e.target.id==='office-retry-form'){
    const question=state.studyQuestions.find(item=>item.id===officeRetryId);
    if(!question||officeRetryResult!==null||!['stuck','solved'].includes(e.submitter?.value))return;
    const previous=state.studyQuestions,solved=e.submitter.value==='solved';
    state.studyQuestions=previous.map(item=>item===question?
      {...item,retries:[...(item.retries||[]),{at:Date.now(),solved}].slice(-50)}:item);
    if(!persist()){state.studyQuestions=previous;return;}
    officeRetryResult=solved;refreshPanel();
    visiblePanel()?.querySelector('summary')?.focus({preventScroll:true});return;
  }
  if(e.target.id==='save-day-template'){saveDayTemplate(e.target);return;}
  if(e.target.id==='apply-day-template'){applyDayTemplate(e.target);return;}
  if(e.target.id==='project-resource-form'){submitProjectResource(e.target);return;}
  if(e.target.id==='garden-postcard-form'){downloadGardenPostcard(e.target);return;}
  if(e.target.id==='garden-comparison-form'){submitGardenComparison(e.target,e.submitter);return;}
  if(e.target.id==='landmark-inscription-form'){saveLandmarkInscription(e.target);return;}
  if(e.target.id==='garden-look-form'){
    const data=new FormData(e.target),name=String(data.get('name')).trim();
    if(!name){e.target.elements.name.focus();return;}
    const previous=state.gardenLooks;
    const match=previous.find(item=>item.name.toLowerCase()===name.toLowerCase());
    const [look]=loadGardenLooks([{id:match?.id||crypto.randomUUID(),name,appearance:previewSeasonAppearance(),ambient:data.has('ambient')?state.sounds:null}]);
    state.gardenLooks=match?previous.map(item=>item===match?look:item):[...previous,look];
    if(!persist()){state.gardenLooks=previous;return;}
    refreshPanel();$(`[data-apply-garden-look="${CSS.escape(look.id)}"]`)?.focus();confirmChange('Garden look saved.');return;
  }
  if(e.target.id==='landmark-place'){
    const index=selectedLandmark,item=state.gardenGrowth[index];
    if(!item)return;
    const {zone,group}=Object.fromEntries(new FormData(e.target));
    const {zone:oldZone,group:oldGroup,...record}=item;
    const previous=state.gardenGrowth;
    state.gardenGrowth=previous.map((entry,i)=>i===index?{...record,...selectedPlacement(item.kind,zone,group)}:entry);
    if(!persist()){state.gardenGrowth=previous;return;}
    renderGardenGrowth();openGardenLandmark(index);confirmLandmarkEdit('Landmark placement saved.');return;
  }
  if(e.target.id==='garden-range'){
    const {from,through}=Object.fromEntries(new FormData(e.target));
    const snapshot=e.submitter?.value==='snapshot';
    if((from&&through&&from>through)||(snapshot&&!through)){
      const error=$('#garden-range-error');
      error.hidden=false;error.textContent=snapshot&&!through?'Choose an end date for the Garden view.':'Choose an end date on or after the start date.';return;
    }
    gardenFrom=from;gardenThrough=through;
    if(snapshot)setGardenSnapshot(through);
    else{refreshPanel();$('#garden-range input')?.focus();}
    return;
  }
  if(e.target.id==='tradeoff-form'){
    tradeoffTaskId=e.target.elements.task.value;tradeoffPreview=findTradeoffs();refreshPanel();
    ($('[data-apply-tradeoff]')||$('#tradeoff-task'))?.focus({preventScroll:true});return;
  }
  if(e.target.id==='landmark-form'){
    const {kind,day,title,result,detail,course,zone,group}=Object.fromEntries(new FormData(e.target));
    if(!['test','milestone'].includes(kind)||day>dayKey())return;
    if(!title.trim()){e.target.elements.title.focus();return;}
    const project=kind==='test'&&state.projects.find(item=>item.id===course);
    if(recordGardenGrowth(kind,crypto.randomUUID(),title,day,{result,detail,courseId:project?.id,courseName:project?.name,...selectedPlacement(kind,zone,group)}))openGardenLandmark(state.gardenGrowth.length-1);
    return;
  }
  if(e.target.id==='availability-form'){saveAvailability(e.target,e.submitter?.value==='remove');return;}
  if(e.target.id==='break-idea-form'){
    const fields=new FormData(e.target),text=String(fields.get('text')).trim(),minutes=Number(fields.get('minutes'));
    if(!text||!breakIdeaMinutes.includes(minutes))return;
    if(saveBreakIdeas([...state.breakIdeas,{id:crypto.randomUUID(),text,minutes}]))confirmChange('Break idea saved.');
    return;
  }
  if(e.target.id==='mistake-retry-form'){
    const session=pendingMistakeRetry(),value=e.submitter?.value;
    if(session?.id!==e.target.dataset.session||!['solved','stuck'].includes(value))return;
    const previous=state.mistakes,passed=value==='solved';
    state.mistakes=previous.map(item=>item.id===session.mistakeId
      ?{...item,retries:[...item.retries,{at:Date.now(),passed,sessionId:session.id}]}:item);
    session.mistakeResult=passed;
    if(!persist()){state.mistakes=previous;delete session.mistakeResult;return;}
    closePanel(false);render();planner.render();timerButton.focus({preventScroll:true});
    confirmChange(passed?'Retry recorded as solved.':'Retry recorded. The mistake stays in To retry.');
    return;
  }
  if(e.target.id==='focus-goal-form'){
    const fields=new FormData(e.target),goal=String(fields.get('goal')).trim();
    const previous=state.timer.goal;
    if(state.timer!==goalTimer||state.timer.mode!=='focus'){toast('The focus session changed. Reopen the outcome editor.');return;}
    state.timer.goal=goal;
    if(!persist()){state.timer.goal=previous;return;}
    closePanel(false);render();
    if(e.submitter?.value==='begin'&&state.timer.status==='idle')timerButton.click();
    timerButton.focus({preventScroll:true});return;
  }
  if(e.target.id==='focus-review-form'){
    const fields=new FormData(e.target),result=fields.get('result'),next=String(fields.get('next')).trim();
    const session=state.history.find(item=>item.id===e.target.dataset.session&&item.goal&&!item.review);
    if(!session||!['reached','partial'].includes(result))return;
    const task=state.tasks.find(item=>item.id===session.taskId),previous=task?.resumeNote;
    session.review={result,next};
    if(task&&next)task.resumeNote=next;
    if(!persist()){delete session.review;if(task&&next)task.resumeNote=previous;return;}
    closePanel(false);render();timerButton.focus({preventScroll:true});confirmChange('Focus review saved.');return;
  }
  if(e.target.id==='routine-editor-form'){
    const fields=new FormData(e.target),names=fields.getAll('phase-name'),modes=fields.getAll('phase-mode'),minutes=fields.getAll('phase-minutes');
    const name=String(fields.get('name')).trim();
    const phases=routinePhases(names.map((name,index)=>({name,mode:modes[index],ms:Number(minutes[index])*60000})));
    if(!name||!phases){
      const error=$('#routine-editor-error');error.hidden=false;error.textContent='Enter a routine name and a name and duration for each phase.';return;
    }
    const prior=state.routines;
    if(editingRoutineId&&!prior.some(item=>item.id===editingRoutineId)){toast('This routine was removed in another tab.');return;}
    const routine={id:editingRoutineId||crypto.randomUUID(),name,phases};
    state.routines=editingRoutineId?prior.map(item=>item.id===editingRoutineId?routine:item):[...prior,routine];
    if(!persist()){state.routines=prior;return;}
    openPanel('pagoda',gardenToolAnchor('pagoda'));
    root.querySelector(`[data-routine="${CSS.escape(routine.id)}"]`)?.focus({preventScroll:true});
    confirmChange('Routine saved.');return;
  }
  if(e.target.id==='deadline-plan-form'){saveDeadlinePlan(e.target);return;}
  if(e.target.id==='build-week-form'){draftWeek(e.target,e.submitter?.value==='compare');return;}
  if(e.target.id==='shutdown-form'){saveShutdownSteps(e.target);return;}
  if(e.target.id==='week-slot-form'){updateWeekSlot(e.target);return;}
  if(e.target.id==='schedule-drop-form'){saveScheduleDrop();return;}
  if(e.target.id==='plan-tomorrow-form'){saveTomorrowPlan(e.target);return;}
  if(e.target.id==='quick-task-capture-form'){
    const task=quickTask(e.target.elements.line.value,{},state.projects);
    if(!task)return;
    const previous=state.tasks;state.tasks=[...previous,task];
    if(!persist()){state.tasks=previous;return;}
    closePanel();refreshTasks();confirmChange(`Added ${task.text}.`);return;
  }
  if(e.target.id==='focus-setup-form'){
    const {name,routineId,layoutId,soundtrackId}=Object.fromEntries(new FormData(e.target));
    const previous=state.focusSetups,label=name.trim();
    if(!label)return;
    const existing=previous.find(item=>item.name.toLowerCase()===label.toLowerCase());
    const item={id:existing?.id||crypto.randomUUID(),name:label,routineId,layoutId,soundtrackId};
    state.focusSetups=loadFocusSetups([...previous,item]);
    if(!persist()){state.focusSetups=previous;return;}
    refreshPanel();confirmChange('Focus setup saved.');return;
  }
  if(e.target.id==='replan-cutoff-form'){
    const cutoff=new FormData(e.target).get('cutoff'), previous=state.replanCutoff;
    state.replanCutoff=cutoff;
    if(!persist()){state.replanCutoff=previous;return;}
    replanPreview=currentReplan();
    refreshPanel();
    $('#replan-cutoff').focus({preventScroll:true});
    announce('Suggestions updated.');
    return;
  }
  if(e.target.id==='replan-form'){applyReplan(e.target);return;}
  if(e.target.id==='daily-ritual-form'){
    const form=e.target,{kind,date}=form.dataset,fields=new FormData(form);
    const item={...state.dailyRituals[date]?.[kind]};
    if(kind==='annotate'){
      for(const key of ['title','author','chapters','position','goal'])item[key]=String(fields.get(key)).trim();
      item.goalType=fields.get('goalType')==='page'?'page':'chapter';
      item.projectId=String(fields.get('projectId')||'');
      const totalPages=Number(fields.get('totalPages'));
      if(totalPages)item.totalPages=totalPages;
      else delete item.totalPages;
      if(!item.title&&(item.chapters||item.position||item.goal)){
        const error=form.querySelector('.ritual-error');
        error.textContent='Enter the book title for this reading log.';error.hidden=false;
        form.elements.title.focus();return;
      }
    }else item.projectId=String(fields.get('projectId'));
    if(!saveRitual(date,kind,item))return;
    closePanel(false);
    if(e.submitter?.value==='open'){
      $('[data-workspace="crochet"]').click();
      crochet.focusProject(item.projectId);
      return;
    }
    renderCalendar();focusRitual(date,kind,'open');
    confirmChange(kind==='annotate'?'Annotation log saved.':'Crochet link saved.');
    return;
  }
  if(e.target.id==='ritual-schedules-form'){saveRitualSchedules(e.target);return;}
  if(e.target.id==='calendar-list-form'){saveCalendarList(e.target);return;}
  if(e.target.id==='calendar-event-form'){saveCalendarEntry(e.target);return;}
  if(e.target.id==='event-buffer-form'){
    const form=e.target,prior=state.calendarEvents;
    const existing=prior.find(event=>event.id===form.dataset.eventId&&!event.day);
    if(!existing)return;
    const {bufferBefore,bufferAfter,...event}=existing;
    try{Object.assign(event,calendarPlanningBuffers(Object.fromEntries(new FormData(form))));}
    catch(error){const alert=form.querySelector('[role="alert"]');alert.hidden=false;alert.textContent=error.message;return;}
    state.calendarEvents=prior.map(item=>item===existing?event:item);
    if(!persist()){state.calendarEvents=prior;return;}
    finishCalendarEventChange(event);confirmChange('Planning buffers saved.');return;
  }
  if(e.target.id==='garden-preset-form'){
    const time=new FormData(e.target).get('time');
    state.gardenSchedule=loadGardenSchedule({enabled:true,presets:[...state.gardenSchedule.presets,{...state.appearance,time}]});
    if(persist()){render();refreshPanel();$('#garden-preset-time')?.focus();toast('Daily Garden preset saved.');}
    return;
  }
  if(e.target.id==='capture-project-form'){
    const note=availableCaptures().find(item=>item.key===captureActionKey);
    const project=state.projects.find(item=>item.id===$('#capture-project-id').value&&!item.archived);
    if(!note||!project)return;
    const prior=project.thoughts||[];
    if(saveCaptureDestination(note.key,()=>{project.thoughts=[...prior,note];},()=>{project.thoughts=prior;})){
      finishCaptureFiling('Thought attached. Open the project’s Thoughts button to read it.');refreshTasks();
    }
    return;
  }
  if(e.target.id==='capture-link-form'){
    const note=availableCaptures().find(item=>item.key===captureActionKey);
    const task=gardenTasks().find(item=>item.id===$('#capture-link-task').value&&!item.done);
    if(!note||!task)return;
    const context=captureContextText(note.context);
    const body=context?`${note.text}\n\nCaptured during ${context}`:note.text;
    const previous=state.stickyNotes, sticky={...stickyBoard.newNote(body,'Quick capture'),taskId:task.id};
    if(saveCaptureDestination(note.key,()=>{state.stickyNotes=[...previous,sticky];},()=>{state.stickyNotes=previous;})){
      stickyBoard.render();finishCaptureFiling('Thought filed as a sticky note and linked to the task.');
    }
    return;
  }
  if(e.target.id==='resume-form'){
    checkCompletion();
    const task=state.tasks.find(item=>item.id===e.target.dataset.taskId);
    if(!task)return;
    const handoff=readHandoff(e.target);
    if(!handoff)return;
    const previous=Object.fromEntries(Object.keys(handoff).map(key=>[key,task[key]]));
    const priorTimer=state.timer, historyLength=state.history.length;
    const end=e.submitter?.value==='end'&&priorTimer.mode==='focus'&&priorTimer.id&&focusedTask()?.id===task.id;
    Object.assign(task,handoff);
    const session=priorTimer.mode==='focus'&&priorTimer.id&&focusedTask()?.id===task.id;
    const savedHandoff=priorTimer.nextHandoff, savedHandoffTask=priorTimer.handoffTaskId;
    if(session){priorTimer.nextHandoff=sessionHandoff(task);priorTimer.handoffTaskId=task.id;}
    if(end){record(state,'completed',Date.now(),{early:true});reset(state,'break');}
    if(!persist()){
      Object.assign(task,previous);state.timer=priorTimer;state.history.length=historyLength;
      if(session){priorTimer.nextHandoff=savedHandoff;priorTimer.handoffTaskId=savedHandoffTask;}
      return;
    }
    if(end)resumeTaskId=task.id;
    closePanel();render();planner.refreshReporting();
    if(end)timerButton.focus({preventScroll:true});
    confirmChange(end?'Focus ended early. Your task is still open.':hasHandoff(task)?'Session handoff saved.':'Session handoff cleared.');
    return;
  }
  if(e.target.id==='save-routine'){
    const name=$('#routine-name').value.trim();
    if(!name)return;
    const focus=readDuration($('#focus-minutes'));
    if(focus===null)return;
    const rest=readDuration($('#break-minutes'));
    if(rest===null)return;
    state.routines.push({id:crypto.randomUUID(),name,focus,rest});
    persist();refreshPanel();$('#routine-name')?.focus();toast('Routine saved.');
  }
  if(e.target.id==='capture-form'){
    try{
      if(!saveCapture(storage,$('#capture-text').value,e.target.elements.context?.checked?activeCaptureContext:undefined))return;
      renderCaptures();closePanel();toast('Note captured.');
    }catch{toast('Could not save the note. Your text is still here.');}
  }
  if(e.target.id==='timer-settings'){
    const focus=readDuration($('#focus-minutes'));
    if(focus===null)return;
    const rest=readDuration($('#break-minutes'));
    if(rest===null)return;
    state.settings.focus=focus/60000;
    state.settings.break=rest/60000;
    state.settings.wrapMinutes=wrapUpMinutes(Number(e.target.elements.wrapMinutes.value));
    state.intention=$('#intention').value.trim();
    if(!state.timer.id&&!state.timer.sequence){
      const goal=state.timer.goal;
      reset(state);
      if(goal)state.timer.goal=goal;
    }
    persist();render();toast('Your rhythm is saved.');closePanel();
  }
  if(e.target.id==='task-editor-form'){
    const handoff=readHandoff(e.target);
    if(!handoff)return;
    const fields=new FormData(e.target);
    const text=fields.get('title').replace(/\s*\n\s*/g,' ').trim();
    if(!text){const title=$('#task-title');title.setCustomValidity('Enter a task name.');title.reportValidity();return;}
    const existing=state.tasks.find(task=>task.id===editingTaskId);
    if(editingTaskId&&!existing){toast('This task was removed in another tab.');return;}
    const flexibility=readFlexibility(e.target,fields);
    if(flexibility===undefined)return;
    const subject=fields.get('waitingFor').trim(),decisionOn=fields.get('decisionOn'),fallback=fields.get('fallback').trim();
    const waitingFor=waitingForRecord({subject,followUp:fields.get('followUp'),decisionOn,fallback});
    if(subject&&(decisionOn||fallback)&&!waitingFor?.decisionOn){
      toast('Enter both a decision date and a fallback to save a waiting decision.');
      (decisionOn?e.target.elements.fallback:e.target.elements.decisionOn).focus();return;
    }
    if(waitingFor&&waitingFor.subject===existing?.waitingFor?.subject&&waitingFor.followUp===existing.waitingFor.followUp)
      waitingFor.notified=existing.waitingFor.notified;
    if(waitingFor?.decisionOn&&waitingFor.subject===existing?.waitingFor?.subject&&
        waitingFor.decisionOn===existing.waitingFor.decisionOn&&waitingFor.fallback===existing.waitingFor.fallback)
      waitingFor.decisionNotified=existing.waitingFor.decisionNotified;
    const timer=state.timer;
    const timerTaskId=timer.block?.taskId||timer.replay?.at(-1)?.taskId||timer.taskSnapshot?.id;
    if(waitingFor&&existing&&timer.id&&timerTaskId===existing.id){
      toast('Finish or reset this task’s timer before putting it on hold.');return;
    }
    const id=existing?.id??crypto.randomUUID();
    const tasksById=taskIndex();
    const prerequisiteIds=[...new Set(fields.getAll('prerequisite').filter(id=>tasksById.has(id)))];
    if(createsDependencyCycle(id,prerequisiteIds,tasksById)){
      const error=$('#prerequisite-error');
      error.hidden=false;
      error.textContent='These tasks would wait on each other. Choose a different prerequisite.';
      error.closest('details').open=true;
      $('#prerequisite-search')?.focus();
      return;
    }
    const finishMove=existing&&captureTaskChange(existing,['date','time','occurrenceTimes','projectId','sectionId']);
    const before=state.activeTask;
    const repeat=fields.get('repeat');
    const sameRepeatType=existing&&(existing.repeat==='none')===(repeat==='none');
    if(!checkedCustomColor(e.target,fields.get('calendarColor')))return;
    const priorityLevel=fields.has('important')?1:Number(fields.get('priorityLevel'));
    const reminderAt=fields.get('reminder')?new Date(fields.get('reminder')).getTime():null;
    const subtasks=(existing?.subtasks||[]).flatMap(sub=>{
      const text=String(fields.get(`sub:${sub.id}`)||'').trim();
      return text?[{...sub,text,done:fields.has(`done:${sub.id}`)}]:[];
    });
    for(const line of fields.get('subtasks').split('\n')){
      const text=line.trim().slice(0,160);
      if(text)subtasks.push({id:crypto.randomUUID(),text,done:false});
    }
    const rubric=parseRubric(fields.get('rubricText')||'');
    for(const index of fields.getAll('rubricItem')){
      const item=rubric[Number(index)];
      if(!item)continue;
      const points=rubricPoints(fields.get('rubricPoints:'+index));
      subtasks.push({id:crypto.randomUUID(),text:item.text,done:false,...(points===null?{}:{points})});
    }
    const comments=[...(existing?.comments||[])];
    const comment=fields.get('comment').trim();
    if(comment)comments.push({id:crypto.randomUUID(),text:comment,at:Date.now()});
    const task={
      id, text, prerequisiteIds,snoozedUntil:fields.get('snoozedUntil'),waitingFor,flexibility,
      description:fields.get('description').trim(),
      ...handoff,
      date:fields.get('date')||(repeat!=='none'||fields.get('time')?dayKey():''),
      time:fields.get('time'), estimate:Number(fields.get('estimate'))||null,minimumUsefulMinutes:Number(fields.get('minimumUsefulMinutes'))||null,
      energy:Object.hasOwn(taskEnergyLevels,fields.get('energy'))?fields.get('energy'):'',repeat,
      repeatEvery:Number(fields.get('repeatEvery'))||2,
      priority:priorityLevel!==4, priorityLevel,calendarColor:taskCalendarColor(fields.get('calendarColor')==='custom'?fields.get('customColor'):fields.get('calendarColor')),
      projectId:fields.get('projectId'), sectionId:fields.get('sectionId'), deadline:fields.get('deadline'),
      labels:taskLabels(fields.get('labels')),
      reminderAt:Number.isFinite(reminderAt)?reminderAt:null, reminderShown:existing?.reminderAt===reminderAt&&existing?.reminderShown===true,
      subtasks,comments,done:repeat==='none'&&existing?.done===true,
      completedOn:sameRepeatType?existing.completedOn||'':'',completions:sameRepeatType?existing.completions||[]:[]
    };
    if(existing&&['date','time','repeat','repeatEvery'].some(key=>task[key]!==existing[key]))task.occurrenceTimes={};
    const captureKey=!existing&&taskDraft?.captureKey;
    const noteId=!existing&&taskDraft?.noteId;
    const linkedNote=noteId&&state.stickyNotes.find(note=>note.id===noteId);
    if(noteId&&!linkedNote){toast('The original note is unavailable.');return;}
    if(captureKey&&state.processedCaptures.includes(captureKey)){toast('This thought was already filed.');return;}
    const prior=existing&&{...existing};
    if(existing)Object.assign(existing,task);else state.tasks.push(task);
    const status=taskStatus(task);
    if(state.activeTask===task.id && (status!=='todo'||waitingFor))state.activeTask=null;
    const fromCurrentTask=lastAnchor===currentTaskButton;
    if(captureKey){
      if(!saveCaptureDestination(captureKey,()=>{},()=>{
        state.tasks=state.tasks.filter(item=>item.id!==task.id);state.activeTask=before;
      }))return;
    }else if(linkedNote){
      const ids=[...noteTaskIds(linkedNote),task.id];
      const notes=state.stickyNotes.map(note=>note===linkedNote?{...note,taskId:ids[0],taskIds:ids.slice(1)}:note);
      if(!saveStickyNotes(notes)){
        state.tasks=state.tasks.filter(item=>item!==task);
        state.activeTask=before;
        return;
      }
    }else if(!persist()){
      state.tasks=existing?state.tasks.map(item=>item===existing?prior:item):state.tasks.filter(item=>item!==task);
      state.activeTask=before;
      return;
    }
    closePanel(false);refreshTasks();
    if(captureKey&&returnToCaptureInbox){finishCaptureFiling('Thought filed as a task.');return;}
    if(e.submitter?.value==='plan-deadline'&&!waitingFor&&canPlanDeadline(task)){
      const anchor=inSchedule()?$('#planner-heading'):taskButton(task.id)||$('#sidebar-add-task');
      openDeadlinePlanner(task.id,anchor);return;
    }
    if(status==='upcoming'&&workspace==='focus')$('.task-upcoming')?.setAttribute('open','');
    if(fromCurrentTask)currentTaskButton.focus({preventScroll:true});
    else if(inSchedule())$('#planner-heading').focus({preventScroll:true});
    else if(linkedNote){
      stickyBoard.render();
      $(`[data-sticky-id="${CSS.escape(noteId)}"] [data-note-action="task"]`)?.focus({preventScroll:true});
    }
    else taskSidebar.querySelector(`[data-task="${CSS.escape(task.id)}"] .task-open`)?.focus();
    const move=finishMove?.();
    if(move)confirmChange('Task moved.',restoreActiveTask(move,before,state.activeTask));
    else if(linkedNote)confirmChange('Task created and linked to its note.');
    else announce(existing?'Task updated.':'Task added.');
  }
  if(e.target.id==='block-editor-form'){
    const task=state.tasks.find(item=>item.id===editingTaskId);
    if(!task)return;
    const fields=new FormData(e.target);
    const date=fields.get('date'),time=fields.get('time'),minutes=Number(fields.get('minutes'));
    const flexibility=readFlexibility(e.target,fields);
    if(flexibility===undefined)return;
    const existing=task.blocks?.find(item=>item.id===editingBlockId);
    if(editingBlockId&&!existing){toast('This block was removed in another tab.');return;}
    const finishUndo=captureTaskChange(task,['blocks']);
    const block=existing||addTaskBlock(task,date,time,minutes);
    Object.assign(block,{date,time,minutes});
    if(flexibility)block.flexibility=flexibility;else delete block.flexibility;
    const undo=finishUndo();
    const previous=state.history,followUpId=blockDraft?.incompleteSessionId;
    if(followUpId)state.history=previous.map(item=>item.id===followUpId&&!item.followUp?{...item,followUp:'rescheduled'}:item);
    if(!persist()){undo?.(state);state.history=previous;return;}
    closePanel(false);refreshTasks();
    openSchedule('calendar',calendarToggle,new Date(`${date}T00:00:00`),Math.max(0,timeMinutes(time)-60));
    confirmChange(existing?'Block updated.':'Block scheduled.',followUpId?latest=>{
      if(!undo?.(latest))return false;
      latest.history=latest.history.map(item=>{
        if(item.id!==followUpId||item.followUp!=='rescheduled')return item;
        const restored={...item};delete restored.followUp;return restored;
      });
      return true;
    }:undo);
  }
  if(e.target.id==='soundtrack-form'){saveSoundtrack(e.target);return;}
  if(e.target.id==='media-form'){
    const source=state.mediaSource,link=$('#media-link').value.trim();
    const valid=source==='youtube'?youtubeContent(link):spotifyPath(link);
    if(!valid){
      setMediaStatus(source==='youtube'?'Use a YouTube video or playlist link.':'Use a Spotify playlist, album, or track link from open.spotify.com.');
      return;
    }
    const previous=state[source];state[source]=link;
    if(!persist()){state[source]=previous;return;}
    mountMedia();positionPanel(visiblePanel(),lastAnchor);
  }
});
document.addEventListener('click',()=>syncSound(true),{capture:true});
document.addEventListener('pointerdown',e=>{
  if(workspaceMenuOpen()&&!workspaceNav.contains(e.target))setWorkspaceMenu(false);
  if(!taskMenu.hidden&&!e.target.closest('#task-menu'))closeTaskMenu(false);
  if(activePanel&&!e.target.closest('.panel, dialog[open], #undo-toast, [data-garden-landmark]')&&!e.target.closest('[data-panel]')&&!e.target.closest('#music-shortcut')&&!e.target.closest('#current-task, #resume-task, #finish-current-task'))closePanel(false);
});
document.addEventListener('click',event=>{
  if(event.target.closest('#open-capture-inbox,[data-open-capture-inbox]')){openCaptureInbox();return;}
  const action=event.target.closest('[data-capture-action]');
  if(action){
    const key=action.closest('[data-capture-key]').dataset.captureKey;
    const note=availableCaptures().find(item=>item.key===key);
    if(!note)return;
    const fromInbox=Boolean(action.closest('#capture-inbox-list'));
    if(fromInbox)captureInboxIndex=[...root.querySelectorAll('#capture-inbox-list .capture-card')].indexOf(action.closest('.capture-card'));
    if(action.dataset.captureAction==='archive'){
      if(archiveCapture(note)&&fromInbox)captureInboxFocus();
    }else if(action.dataset.captureAction==='task'){
      returnToCaptureInbox=fromInbox;
      const context=captureContextText(note.context);
      openTaskEditor(null,action,{text:note.text.split(/\r?\n/)[0].slice(0,160),description:context?`${note.text}\n\nCaptured during ${context}`:note.text,captureKey:key});
    }else if(action.dataset.captureAction==='project'){
      returnToCaptureInbox=fromInbox;
      captureActionKey=key;openPanel('capture-project',action);
    }else if(action.dataset.captureAction==='link'){
      returnToCaptureInbox=true;
      captureActionKey=key;openPanel('capture-link',action);
    }else{
      const previous=state.stickyNotes;
      const context=captureContextText(note.context);
      const sticky=stickyBoard.newNote(context?`${note.text}\n\nCaptured during ${context}`:note.text,'Quick capture');
      if(state.tasks.some(task=>task.id===note.context?.taskId))sticky.taskId=note.context.taskId;
      if(saveCaptureDestination(key,()=>{state.stickyNotes=[...previous,sticky];},()=>{state.stickyNotes=previous;})){
        stickyBoard.render();
        const input=$('#notes-input');
        toast('Thought saved as a sticky note.');
        if(fromInbox)captureInboxFocus();else (input||gardenToolAnchor('notes')).focus({preventScroll:true});
      }
    }
    return;
  }
});
document.addEventListener('keydown',e=>{
  if(e.key==='F1'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.repeat){
    e.preventDefault();helpGuide.open();return;
  }
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.code==='KeyK'&&!e.repeat&&
    (!e.target.closest('dialog')||e.target.closest('#command-palette'))){
    e.preventDefault();commandPalette.open();return;
  }
  if(e.target.closest('dialog'))return;
  if(e.ctrlKey&&e.altKey&&e.code==='KeyN'&&!e.repeat){
    e.preventDefault();
    if(activePanel!=='capture'){
      const activeWorkspace=workspaceButton(workspace);
      const fallback=state.focusMode?focusModeButton:activeWorkspace?.getClientRects().length?activeWorkspace:workspaceMore;
      openPanel('capture',document.activeElement===document.body?fallback:document.activeElement);
    }
    return;
  }
  if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){
    const form=activePanel==='capture'?$('#capture-form'):activePanel==='resume'?$('#resume-form'):null;
    if(form){e.preventDefault();form.requestSubmit();return;}
  }
  if(e.key==='Escape'&&workspaceMenuOpen()){e.preventDefault();setWorkspaceMenu(false,true);return;}
  if(e.key==='Escape'&&!taskMenu.hidden){e.preventDefault();closeTaskMenu();return;}
  if(e.key==='Escape'&&activePanel){e.preventDefault();closePanel();return;}
  if(e.key==='Escape'&&inSchedule()&&planner.calendarVisible()&&!calendarShelf.hidden){e.preventDefault();setCalendarShelf(false);return;}
  if(e.key==='Escape'&&inSchedule()){e.preventDefault();closeCalendar();return;}
  if(e.key==='Escape'&&state.focusMode&&!e.defaultPrevented){e.preventDefault();toggleFocusMode();return;}
  if(captureInboxShortcut(e))return;
  const p=visiblePanel();
  if(e.key==='Tab'&&p){
    const controls=[...p.querySelectorAll('button,input,textarea,select,a[href],iframe,summary,[tabindex="0"]')].filter(el=>!el.disabled&&el.offsetParent!==null&&(el.type!=='radio'||el.checked));
    const focused=document.activeElement, first=controls[0], last=controls.at(-1);
    if(pendingUndo&&(focused===undoButton||!e.shiftKey&&focused===last||e.shiftKey&&focused===first)){
      e.preventDefault();
      (focused===undoButton?(e.shiftKey?last:first):undoButton)?.focus();
      return;
    }
    if(e.shiftKey&&(focused===first||focused.id==='panel-title')){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&focused===last){e.preventDefault();first?.focus();}
  }
  if(e.code==='Space'&&!e.repeat&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&workspace==='focus'&&!activePanel&&taskMenu.hidden&&!e.target.closest('button,a,input,textarea,select,summary,[contenteditable]')){
    e.preventDefault();timerButton.click();
  }
});
window.addEventListener('resize',()=>{const p=visiblePanel();if(p)positionPanel(p,lastAnchor);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)shootingStars.clear();else{checkCompletion();render();wake();}});
window.addEventListener('focus',syncNativeCaptures);
window.addEventListener('pageshow',()=>{checkCompletion();render();});
window.addEventListener('storage',e=>{
  const key=workspaceStorageEvent(e.key,adminSandbox);
  if(key===undefined)return;
  if(key===STORAGE_KEY){
    state=loadState(storage);savedSchedule=snapshotSchedule(state);syncSound();checkCompletion();refreshTasks();stickyBoard.render();renderCaptures();
    if(workspace==='reading'&&!$('#reading-workspace dialog[open]'))reading.render();
    if(workspace==='reading')reading.render();
    if(workspace==='journal')journal.refresh();
    if(activePanel&&!visiblePanel()?.contains(document.activeElement))refreshPanel();
  }
  if(key===null||key?.startsWith(CAPTURE_PREFIX))renderCaptures();
});
renderCaptures();
syncNativeCaptures();
setInterval(()=>{if(!document.hidden)syncNativeCaptures();},4000);
checkCompletion();render();wake();
setInterval(()=>{checkCompletion();render();},500);

const editDuration=$('#edit-duration'),durationForm=$('#duration-form'),typed=$('#typed-duration');
function renderDurationFinish(now=new Date()){
  const output=$('#duration-finish-preview');
  const ms=parseDuration($('#typed-duration').value);
  const finish=ms&&new Date(+now+ms);
  const time=finish&&(ms%60000?secondsClockFormat:clockFormat).format(finish);
  const day=finish&&dayKey(finish)!==dayKey(now)?` ${weekdayFormat.format(finish)}`:'';
  const text=finish?`Ends at ${time}${day} if started now`:'';
  output.hidden=!finish;
  if(output.textContent!==text)output.textContent=text;
}
function readDuration(input){
  const ms=parseDuration(input.value);
  if(ms===null){
    input.setCustomValidity('Enter a duration from 0:01 to 180:00. For example, type 2500 for 25:00.');
    input.reportValidity();
  }
  return ms;
}
function formatDurationInput(event){
  const input=event.target;
  const raw=input.value;
  const trailing=raw.slice(input.selectionEnd??raw.length).replace(/\D/g,'').length;
  const pasted=event.inputType==='insertFromPaste'&&raw.includes(':')?parseDuration(raw):null;
  const formatted=pasted?formatDuration(pasted):formatTypedDuration(raw);
  input.value=formatted;
  input.setCustomValidity('');
  let caret=formatted.length;
  for(let count=0;count<trailing&&caret>0;){
    if(/\d/.test(formatted[--caret]))count++;
  }
  input.setSelectionRange(caret,caret);
}
function finishEdit(focusTarget=editDuration){durationForm.hidden=true;editDuration.hidden=false;focusTarget.focus({preventScroll:true});}
editDuration.onclick=()=>{
  typed.value=formatDuration(remaining(state)||state.timer.total);
  typed.setCustomValidity('');
  editDuration.hidden=true;
  durationForm.hidden=false;
  typed.focus({preventScroll:true});
  typed.setSelectionRange(0,typed.value.length);
  renderDurationFinish();
};
$('#cancel-duration').onclick=()=>finishEdit();
typed.oninput=event=>{formatDurationInput(event);renderDurationFinish();};
typed.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();finishEdit();}};
durationForm.onsubmit=e=>{
  e.preventDefault();
  const ms=readDuration(typed);
  if(ms===null)return;
  const mode=state.timer.mode;
  action(()=>{
    if(state.timer.id)record(state,'skipped');
    const {sequence,goal}=state.timer;
    if(sequence){
      const phases=sequence.phases.map((phase,index)=>index===sequence.index?{...phase,ms}:phase);
      loadRoutinePhase(state,{...sequence,phases},sequence.index);
    }else{
      state.settings[mode]=ms/60000;
      reset(state,mode);
    }
    if(goal)state.timer.goal=goal;
  });
  finishEdit(timerButton);
  announce(`Timer set to ${formatDuration(ms)}.`);
};


const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
function sceneryMotionEnabled(){return !motionPreference.matches&&effectiveAppearance.motion!=='still';}
function environmentFrame(now){
  const progress=state.timer.mode==='break'?1:timerProgress(state);
  const evening=activePanel==='evening-lights'&&effectiveAppearance.lighting!=='day'&&(!activityGardenLayout()||effectiveAppearance.lighting==='session');
  const darkSky=animateLandscape(now,progress,motionPreference.matches,evening?'night':effectiveAppearance.lighting,effectiveAppearance.motion);
  const gardenVisible=workspace==='focus'&&!document.hidden&&!activePanel&&!$('#help-guide').open;
  shootingStars.frame(now,{allowed:gardenVisible&&sceneryMotionEnabled(),dark:darkSky&&!snapshotThrough});
  requestAnimationFrame(environmentFrame);
}
requestAnimationFrame(environmentFrame);
