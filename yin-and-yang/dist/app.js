import {STORAGE_KEY,loadState,remaining,startPause,startBlockFocus,skipPhase,reset,record,settle,consumeTimerWarning,todayProgress,duration,formatDuration,formatTypedDuration,parseDuration,dayKey,taskOccursOn,taskStatus,recordTaskCompletion,taskFrequencies,taskPriority} from './state.js';
import {renderLandscape,objects,blossomMarkup,animateLandscape} from './scenery.js';
import {addTaskBlock, allDayEvents, blockFocusTiming, calendarBlocks, calendarDragType, calendarEventFromFields, scheduleTask, shiftDay, timeLabel, timeMinutes, timeValue} from './calendar.js';
import {CAPTURE_PREFIX, readCaptures, saveCapture} from './capture.js';
import {installPlanner} from './planner.js';
import {lightingOptions,seasonOptions,weatherBySeason,gardenWeather,loadAppearance,loadGardenSchedule,scheduledAppearance} from './garden-appearance.js';
import {installCrochet,loadCrochet} from './crochet.js';
import {installJournal} from './journal.js';
import {createGardenAudio,soundChannels} from './garden-audio.js';
import {createSpotifyEmbed} from './spotify-embed.js';
import {captureTaskChange,restoreDeletedTask,restoreActiveTask} from './task-undo.js';

const $=s=>document.querySelector(s);
const icons={
  down:'<path d="m6 9 6 6 6-6"/>',
  left:'<path d="m14 6-6 6 6 6"/>',right:'<path d="m10 6 6 6-6 6"/>',
  calendar:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4m8-4v4m-8 7h2m4 0h2"/>',
  list:'<path d="m4 7 1 1 2-2m-3 6 1 1 2-2m-3 6 1 1 2-2M10 7h10m-10 5h10m-10 5h10"/>',
  sidebar:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v14m-3-9h.1m-.1 4h.1"/>',
  journal:'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M8 3v18m3-12h6m-6 4h6"/>',
  sprout:'<path d="M12 20v-8m0 2c-5 0-8-3-8-7 5 0 8 3 8 7Zm0-2c0-5 3-8 8-8 0 5-3 8-8 8Z"/>',
  sliders:'<path d="M4 7h5m4 0h7M4 17h10m4 0h2"/><circle cx="11" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
  appearance:'<path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/><circle cx="12" cy="12" r="4"/>',
  yarn:'<circle cx="11" cy="10" r="6.5"/><path d="m5 9 7 7m-5-11 9 9m-4-10 5 5m-3 7c0 2 2 3 4 3h3"/>',
  play:'<path d="m8 5 11 7-11 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',reset:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',skip:'<path d="m5 5 10 7-10 7zM19 5v14"/>',expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',collapse:'<path d="M3 8h5V3m8 0v5h5M8 21v-5H3m13 5v-5h5"/>',focus:'<path d="M9 3H5a2 2 0 0 0-2 2v4m12-6h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4"/><circle cx="12" cy="12" r="3"/>',music:'<path d="M9 18V5l12-2v13M9 9l12-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="16" rx="3" ry="3"/>',spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',external:'<path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||''}</svg>`;
function applyIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storage;
try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}};}
let state=loadState(storage),activePanel=null,lastAnchor=null,idleTimeout,toastTimeout,lastBlossoms=-1;
const app=$('#app');
const focusModeButton=$('#focus-mode');
const timerButton=$('#toggle-timer');
const currentTaskButton=$('#current-task');
const currentTaskName=$('#current-task-name');
const root=$('#panel-root');
const taskSidebar=$('#task-sidebar');
const calendarPanel=$('#calendar-panel');
const calendarScroll=$('#calendar-scroll');
const calendarGrid=$('#calendar-grid');
const calendarTray=$('#calendar-task-tray');
const calendarShelf=$('#calendar-queue');
const calendarShelfToggle=$('#calendar-queue-toggle');
const calendarShelfSearch=$('#calendar-queue-search');
const miniCalendar=$('#mini-calendar');
const taskMenu=$('#task-menu');
const builtinRoutines=[{id:'classic',name:'Classic',focus:25*60000,rest:5*60000},{id:'deep',name:'Deep work',focus:50*60000,rest:10*60000}];
const desktopTasks=matchMedia('(min-width: 981px)');
let editingTaskId=null,editingBlockId=null,renderedTaskDay='',agendaMinute=-1,agendaOffset=0;
let taskDraft=null,blockDraft=null,calendarLayoutDay='',calendarOpenMinute;
let calendarAnchor=null,calendarExit=null,menuTaskId=null,menuAnchor=null;
const plannerDateCount=43;
let plannerDays=[],plannerColumnWidth=0,plannerOffset=0,plannerVisibleRange='',plannerScrollEnd;
let dragOffset=0,workspace='focus';
let capturePointer=null,nativeNotes=[],captureApiAvailable=true,syncingCaptures=false;
let reopenTasksAfterCalendar=false;
let effectiveAppearance=state.appearance, resumeTaskId=null, captureActionKey=null;
const gardenAudio=createGardenAudio();
let spotifyPlayback='idle';
const spotifyEmbed=createSpotifyEmbed(playback=>{spotifyPlayback=playback;syncSound();});
const undoToast=$('#undo-toast'),undoButton=$('#undo-action');
let pendingUndo,undoTimeout,undoReturn;
function persist(){try{storage.setItem(STORAGE_KEY,JSON.stringify(state));$('#saved-status').innerHTML='<span class="tiny-dot"></span>Saved on this device';return true;}catch{$('#saved-status').textContent='Storage unavailable — keep this tab open';toast('Your browser could not save changes. Keep this tab open.');return false;}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('visible'),4200);}
function announce(text){$('#announcer').textContent=text;}
function syncSound(unlock=false){
  gardenAudio.sync(state.sounds,spotifyPlayback!=='idle');
  if(unlock)gardenAudio.unlock();
  const status=$('#garden-sound-status');
  if(status)status.textContent=state.sounds.muted?'App sounds muted.':state.sounds.musicMode?'App sounds paused for outside music.':
    spotifyPlayback==='unknown'?'App sounds paused while Spotify playback is unconfirmed.':spotifyPlayback==='playing'?'App sounds paused while Spotify plays.':'Set any slider to zero to turn that sound off.';
}
function dismissUndo(){
  pendingUndo=null;clearTimeout(undoTimeout);undoToast.hidden=true;
}
function queueUndoExpiry(){
  clearTimeout(undoTimeout);
  if(pendingUndo&&!undoToast.matches(':hover, :focus-within'))undoTimeout=setTimeout(dismissUndo,12000);
}
function confirmChange(message,undo){
  if(!undo){toast(message);announce(message);return;}
  undoReturn=document.activeElement;
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
undoButton.onclick=()=>{
  const undo=pendingUndo;
  if(!undo)return;
  dismissUndo();
  const reverted=undo(state);
  if(reverted){
    persist();refreshTasks();
    if(activePanel==='task-editor')updateTaskCompletionButton();
  }
  const target=undoReturn?.isConnected&&undoReturn.getClientRects().length?undoReturn:inSchedule()?$('#planner-heading'):currentTaskButton;
  target.focus({preventScroll:true});
  const message=reverted?'Change undone.':'This item changed before it could be undone.';
  toast(message);announce(message);
};
const planner=installPlanner({
  root:calendarPanel,getState:()=>state,commit:()=>{const saved=persist();refreshTasks();return saved;},
  editTask:openTaskEditor,openBlock:openCalendarBlock,taskMenu:openTaskMenu,
  calendarChanged:showPlannerCalendar,calendarDate:leadingPlannerDay,notify:confirmChange,completeTask:markTask,hasPanel:()=>Boolean(activePanel)||!taskMenu.hidden
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
$('#objects').innerHTML=objects.map(o=>`<button class="world-object ${o.className}" data-panel="${o.id}" aria-label="${o.hint}" aria-haspopup="dialog" aria-expanded="false"><span class="tool-icon">${icon(({pagoda:"focus",tasks:"target",music:"music",notes:"spark",progress:"target",appearance:"appearance"})[o.id])}</span><span>${({pagoda:"Settings",tasks:"Tasks",music:"Music",notes:"Notes",progress:"Today",appearance:"Appearance"})[o.id]}</span></button>`).join('');
installCrochet({root:$('#crochet-workspace'),storage,notify:message=>{toast(message);announce(message);}});
installJournal({root:$('#journal-workspace'),storage,projects:()=>loadCrochet(storage).projects,notify:confirmChange});
applyIcons();

function setTaskSidebar(open){
  open=open&&!state.focusMode;
  taskSidebar.hidden=!open;
  const toggle=$('[data-panel="tasks"]');
  toggle.setAttribute('aria-expanded',String(open));
}
const taskToggle=$('[data-panel="tasks"]');
taskToggle.removeAttribute('aria-haspopup');
taskToggle.setAttribute('aria-controls','task-sidebar');
taskToggle.setAttribute('aria-label','Show or hide tasks');
const calendarToggle=$('#workspace-tabs [data-workspace="calendar"]');
function inSchedule(){return workspace==='planner'||workspace==='calendar';}
let sidebarBeforeFocus=desktopTasks.matches;
setTaskSidebar(sidebarBeforeFocus);
desktopTasks.addEventListener('change',()=>setTaskSidebar(workspace==='focus'&&desktopTasks.matches));

function showWorkspace(next){
  workspace=next;
  app.dataset.workspace=next;
  $('.sky').hidden=next!=='focus';
  $('#crochet-workspace').hidden=next!=='crochet';
  $('#journal-workspace').hidden=next!=='journal';
  $('#objects').hidden=next!=='focus';
  $('#penguin').hidden=next!=='focus';
  document.querySelectorAll('[data-workspace]').forEach(button=>{
    if(button.tagName==='BUTTON')button.setAttribute('aria-pressed',String(button.dataset.workspace===next));
  });
}
$('#workspace-tabs').addEventListener('click',event=>{
  const button=event.target.closest('button[data-workspace]');
  if(!button||button.dataset.workspace===workspace)return;
  closePanel(false);closeTaskMenu(false);
  const next=button.dataset.workspace;
  if(next==='planner'||next==='calendar'){openSchedule(next,button);return;}
  if(inSchedule()){
    closeCalendar();
    if(next==='focus'){button.focus({preventScroll:true});return;}
  }
  showWorkspace(next);
  setTaskSidebar(next==='focus'&&desktopTasks.matches);
  button.focus({preventScroll:true});
});

function focusedTask(date=new Date()){
  if(state.timer.block)return state.tasks.find(task=>task.id===state.timer.block.taskId);
  return gardenTasks().find(task=>task.id===state.activeTask&&taskStatus(task,date)==='todo');
}
function gardenTasks(){return state.tasks.filter(task=>!state.projects.some(project=>project.id===task.projectId&&project.archived));}

function render(){
  syncFocusMode();
  const clock=new Date();
  effectiveAppearance=scheduledAppearance(state.appearance,state.gardenSchedule,clock);
  app.dataset.lighting=effectiveAppearance.lighting;
  app.dataset.season=effectiveAppearance.season;
  const weather=gardenWeather(effectiveAppearance,clock.getTime());
  if(app.dataset.weather!==weather)app.dataset.weather=weather;
  const weatherCurrent=$('#garden-weather-current');
  if(weatherCurrent){
    const label=weatherBySeason[effectiveAppearance.season][weather];
    if(weatherCurrent.textContent!==label)weatherCurrent.textContent=label;
  }
  const activePreset=$('#garden-active-preset');
  if(activePreset){
    const label=effectiveAppearance.time?`Active since ${timeLabel(timeMinutes(effectiveAppearance.time))} · ${seasonOptions[effectiveAppearance.season].name} · ${lightingOptions[effectiveAppearance.lighting]}`:'Manual appearance';
    if(activePreset.textContent!==label)activePreset.textContent=label;
  }
  const ms=remaining(state),seconds=Math.ceil(ms/1000),mins=Math.floor(seconds/60),secs=seconds%60,t=state.timer;
  $('#countdown').innerHTML=`${String(mins).padStart(2,'0')}<span>:</span>${String(secs).padStart(2,'0')}`;
  $('#countdown').setAttribute('aria-label',`${mins} minutes ${secs} seconds of ${t.mode==='focus'?'focus':'rest'} remaining`);
  const [hour,period]=clock.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}).split(/\s+/);
  $('#wall-clock').innerHTML=hour+'<small>'+period+'</small>';

  $('#wall-clock').dateTime=clock.toISOString();
  if(planner.checkReminders(clock))persist();
  const task=focusedTask(clock);
  const taskName=task?.text||'Choose a task';
  if(currentTaskName.textContent!==taskName)currentTaskName.textContent=taskName;
  currentTaskButton.title=task?task.text:'Choose a task';
  const resume=state.tasks.find(item=>item.id===resumeTaskId&&t.mode==='break')||task;
  const resumeButton=$('#resume-task');
  resumeButton.hidden=!resume||!resume.resumeNote&&t.mode!=='break';
  const nextStep=resume?.resumeNote?`Next step · ${resume.resumeNote}`:'Leave a next step';
  if(resumeButton.textContent!==nextStep)resumeButton.textContent=nextStep;
  resumeButton.dataset.resumeId=resume?.id||'';
  if(renderedTaskDay!==dayKey(clock)){
    const wasShowingToday=inSchedule()&&planner.calendarVisible()&&dayKey(leadingPlannerDay())===renderedTaskDay;
    renderTasks(clock);
    if(inSchedule()){
      renderCalendar();
      if(wasShowingToday)scrollCalendarTo(clock);
    }
  }
  if(agendaMinute!==Math.floor(clock.getTime()/60000)){
    renderAgenda(clock);
    calendarGrid.querySelector('.calendar-now')?.style.setProperty('--now-minute',clock.getHours()*60+clock.getMinutes());
  }
  if(activePanel==='calendar-block')updateBlockPreview(clock.getTime());
  const running=t.status==='running';
  timerButton.innerHTML=icon(running?'pause':'play')+`<span>${running?'Pause':t.status==='paused'?'Continue':t.mode==='focus'?'Begin focus':'Begin rest'}</span>`;
  $('[data-mode="focus"]').setAttribute('aria-pressed',t.mode==='focus');
  $('[data-mode="break"]').setAttribute('aria-pressed',t.mode==='break');
  app.classList.toggle('focus-running',running);
  const progress=todayProgress(state);
  if(progress.completed!==lastBlossoms){$('#blossoms').innerHTML=blossomMarkup(progress.completed);lastBlossoms=progress.completed;}
  document.title=t.status==='idle'?'Yin and Yang — A quiet place to focus':`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')} · ${t.mode==='focus'?'Focus':'Rest'} — Yin and Yang`;
}
function checkCompletion(){
  const now=Date.now(),wasBlock=Boolean(state.timer.block);
  let completed=null;
  let focused=false;
  for(let phase=settle(state,now);phase;phase=settle(state,now)){
    completed=phase;
    if(phase.mode==='focus'){focused=true;resumeTaskId=phase.taskId||null;}
  }
  const warning=completed?null:consumeTimerWarning(state,now);
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
  const message=wasBlock
    ? state.timer.block ? (state.timer.mode==='break'?'Focus complete. A short rest has started.':'Rest complete. Focus has resumed.') : 'Calendar block finished.'
    : completed.mode==='focus'?'Focus session complete. Your break is ready.':'Break complete. Your focus timer is ready.';
  persist();render();planner.refreshReporting();toast(message);announce(message);
  notifyTimer(completed.mode==='focus'?'Focus finished':'Break finished',message,`${completed.id}-complete`);
  gardenAudio.cue(completed.mode);
  if(activePanel==='progress'||activePanel==='focus-task')refreshPanel();
  wake();
}
const notificationsSupported=()=>globalThis.isSecureContext&&typeof Notification!=='undefined';
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
timerButton.onclick=()=>action(()=>{startPause(state);announce(state.timer.status==='running'?`${state.timer.mode} timer started.`:'Timer paused.');});
$('#reset-timer').onclick=()=>action(()=>{
  if(state.timer.id){record(state,'skipped');toast('Timer reset. The unfinished session was marked skipped.');}
  reset(state);
});
$('#skip-timer').onclick=()=>action(()=>{const skipped=skipPhase(state);toast(skipped?'Session skipped. It won’t count as completed.':`${state.timer.mode==='focus'?'Focus':'Rest'} timer ready.`);});
document.querySelectorAll('[data-mode]').forEach(el=>el.onclick=()=>{if(el.dataset.mode===state.timer.mode)return;action(()=>{if(state.timer.id){record(state,'skipped');toast('Unfinished session marked skipped.');}reset(state,el.dataset.mode);});});
currentTaskButton.onclick=()=>{
  if(activePanel==='focus-task'){closePanel();return;}
  openPanel('focus-task',currentTaskButton);
  const selected=root.querySelector('[data-focus-task][aria-pressed="true"]')||root.querySelector('[data-focus-task], #focus-task-edit, #focus-task-add');
  selected?.focus({preventScroll:true});
};
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
$('#planner-appearance').onclick=()=>openPanel('appearance',$('#planner-appearance'));
$('#resume-task').onclick=()=>openPanel('resume',$('#resume-task'));
$('#close-task-sidebar').onclick=()=>{setTaskSidebar(false);taskToggle.focus();};
document.querySelectorAll('[data-panel]').forEach(el=>el.onclick=()=>{
  if(el===taskToggle){
    if(!desktopTasks.matches&&inSchedule()){closeCalendar();setTaskSidebar(true);taskToggle.focus();}
    else setTaskSidebar(taskSidebar.hidden);
    return;
  }
  if(activePanel===el.dataset.panel)closePanel();else openPanel(el.dataset.panel,el);
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
  if(state.focusMode&&state.timer.status==='running'&&!activePanel)idleTimeout=setTimeout(()=>app.classList.add('is-idle'),4000);
}
for(const event of ['pointermove','pointerdown','keydown','focusin'])document.addEventListener(event,wake,{passive:true});
document.addEventListener('pointermove',event=>{
  capturePointer={x:event.clientX,y:event.clientY,screenX:event.screenX,screenY:event.screenY};
},{passive:true});
function header(eyebrow,title){return `<div class="panel-header"><div><span class="eyebrow">${eyebrow}</span><h2 id="panel-title">${title}</h2></div><button class="icon-button close-panel" aria-label="Close panel">${icon('close')}</button></div>`;}
function taskCard(task,status,date){
  const details=[];
  if(task.date && (task.date>dayKey(date) || task.repeat==='none')){
    const day=new Date(`${task.date}T00:00:00`);
    if(!Number.isNaN(day.valueOf()))details.push(day.toLocaleDateString([],{month:'short',day:'numeric'}));
  }
  if(task.time){
    const [hours,minutes]=task.time.split(':').map(Number);
    details.push(new Date(2000,0,1,hours,minutes).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}));
  }
  if(task.estimate)details.push(`${task.estimate} min`);
  if(task.repeat!=='none'){
    const start=new Date(`${task.date}T00:00:00`);
    details.push(task.repeat==='weekly'&&!Number.isNaN(start.valueOf())?start.toLocaleDateString([],{weekday:'long'})+'s':taskFrequencies[task.repeat]);
  }
  const selected=status==='todo'&&state.activeTask===task.id;
  const name=escape(task.text);
  return `<li class="task-card${selected?' task-selected':''}" data-task="${escape(task.id)}" draggable="true">
    <div class="task-card-title">
      ${status==='upcoming'?'':`<input type="checkbox" class="task-check" aria-label="${status==='done'?'Reopen':'Complete'} ${name}" ${status==='done'?'checked':''}>`}
      <button type="button" class="task-open" aria-label="Edit ${name}" aria-haspopup="dialog">${name}</button>
      <button type="button" class="task-more" aria-label="Actions for ${name}" aria-haspopup="menu" aria-expanded="false">⋯</button>
    </div>
    ${task.priority?'<span class="task-priority">Priority</span>':''}
    ${task.description?`<p class="task-description">${escape(task.description)}</p>`:''}
    ${details.length?`<p class="task-meta">${escape(details.join(' · '))}</p>`:''}
    ${status==='todo'?`<button type="button" class="task-active" aria-label="Focus on ${name}" aria-pressed="${selected}">${icon('target')} ${selected?'In focus':'Focus on this'}</button>`:''}
  </li>`;
}
function renderTasks(date=new Date()){
  const upcomingOpen=$('.task-upcoming')?.open;
  const groups={todo:[],done:[],upcoming:[]};
  const ordered=gardenTasks().sort((a,b)=>taskPriority(a)-taskPriority(b));
  for(const task of ordered){
    const status=taskStatus(task,date);
    groups[status].push(taskCard(task,status,date));
  }
  const list=group=>group.length?`<ul>${group.join('')}</ul>`:'';
  $('#task-board').innerHTML=`<div class="task-columns">
    <section class="task-column"><h3>To do <span>${groups.todo.length}</span></h3>${list(groups.todo)||'<p class="task-empty">Nothing due.</p>'}</section>
    <section class="task-column"><h3>Done <span>${groups.done.length}</span></h3>${list(groups.done)||'<p class="task-empty">No completed tasks.</p>'}</section>
  </div>${groups.upcoming.length?`<details class="task-upcoming" ${upcomingOpen?'open':''}><summary>Upcoming <span>${groups.upcoming.length}</span></summary>${list(groups.upcoming)}</details>`:''}`;
  renderedTaskDay=dayKey(date);
}
function openTaskEditor(id,anchor,defaults=null){
  editingTaskId=id??null;
  taskDraft=defaults;
  if(!inSchedule())setTaskSidebar(true);
  openPanel('task-editor',anchor);
}
function openBlockEditor(id,anchor,blockId=null,defaults=null){
  editingTaskId=id;
  editingBlockId=blockId;
  blockDraft=defaults;
  openPanel('block-editor',anchor);
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
      <input id="block-minutes" name="minutes" type="number" min="1" max="1440" value="${block?.minutes||task.estimate||60}" required>
      <div class="panel-actions"><button class="panel-primary" type="submit">Save block</button>${block?'<button type="button" class="text-button" id="delete-block">Remove block</button>':''}</div>
    </form>`;
}
function timerRoutines(){
  const routines=[...builtinRoutines,...state.routines];
  return `<section class="routine-section"><h3>Timer routines</h3>
    <div class="routine-list">${routines.map(routine=>`<div class="routine-row"><button type="button" data-routine="${escape(routine.id)}"><strong>${escape(routine.name)}</strong><span>${formatDuration(routine.focus)} / ${formatDuration(routine.rest)}</span></button>${state.routines.includes(routine)?`<button type="button" class="routine-remove" data-delete-routine="${escape(routine.id)}" aria-label="Delete ${escape(routine.name)} routine">×</button>`:''}</div>`).join('')}</div>
    <form id="save-routine" class="routine-save"><label class="sr-only" for="routine-name">Routine name</label><input id="routine-name" name="name" placeholder="Name these durations" maxlength="40" required><button class="panel-primary" type="submit">Save routine</button></form>
  </section>`;
}

function availableCaptures(){
  let notes=[];
  try{notes=readCaptures(storage);}catch{ /* Storage may be unavailable. */ }
  const processed=new Set(state.processedCaptures);
  return [...notes,...nativeNotes].filter(note=>!processed.has(note.key)).sort((a,b)=>b.createdAt-a.createdAt);
}
function captureCards(){
  return availableCaptures().map(note=>`<article class="capture-card" data-capture-key="${escape(note.key)}"><p>${escape(note.text)}</p><button type="button" data-dismiss-capture="${escape(note.key)}" aria-label="Dismiss captured note" title="Dismiss note">×</button>
    <div class="capture-actions"><button type="button" data-capture-action="task">Make a task</button><button type="button" data-capture-action="project">Attach to project</button><button type="button" data-capture-action="notes">Quick Notes</button></div></article>`).join('');
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
}
async function syncNativeCaptures(){
  if(!captureApiAvailable||syncingCaptures||!['localhost','127.0.0.1'].includes(location.hostname))return;
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
function taskEditor(){
  const task=state.tasks.find(item=>item.id===editingTaskId);
  const values=task||taskDraft||{};
  const options=Object.entries(taskFrequencies).map(([value,label])=>`<option value="${value}" ${values.repeat===value?'selected':''}>${label}</option>`).join('');
  const projects=state.projects.filter(project=>!project.archived||project.id===values.projectId);
  const projectName=projects.find(project=>project.id===values.projectId)?.name||'Inbox';
  const projectOptions=projects.map(project=>`<option value="${escape(project.id)}" ${project.id===values.projectId?'selected':''}>${escape(project.name)}</option>`).join('');
  const subtasks=task?.subtasks||[];
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
          <label class="field-label" for="task-description">Description</label>
          <textarea id="task-description" name="description" rows="3" maxlength="2000" placeholder="Add a description…">${escape(values.description)}</textarea>
          <label class="field-label" for="task-resume">Next step</label><textarea id="task-resume" name="resumeNote" rows="2" maxlength="500" placeholder="Pick up here next time…">${escape(values.resumeNote)}</textarea>
          <section class="task-detail-section" aria-labelledby="task-subtask-heading">
            <h3 id="task-subtask-heading">Subtasks ${subtasks.length?`<small>${subtasks.filter(sub=>sub.done).length}/${subtasks.length}</small>`:''}</h3>
            ${subtasks.map(sub=>`<div class="task-editor-subtask"><input type="checkbox" name="done:${escape(sub.id)}" aria-label="Complete ${escape(sub.text)}" ${sub.done?'checked':''}><input name="sub:${escape(sub.id)}" aria-label="Edit subtask ${escape(sub.text)}" maxlength="160" value="${escape(sub.text)}"></div>`).join('')}
            <label class="sr-only" for="task-subtasks">Add subtasks, one per line</label>
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
            </div>
            <p id="task-repeat-hint" ${values.repeat&&values.repeat!=='none'?'':'hidden'}>The date sets the first occurrence. Leave it blank to start today.</p>
            <div id="task-interval-field" ${values.repeat==='interval'?'':'hidden'}><label class="field-label" for="task-interval">Days between occurrences</label><input id="task-interval" name="repeatEvery" type="number" min="2" max="365" value="${values.repeatEvery||2}" ${values.repeat==='interval'?'':'disabled'}></div>
          </fieldset>
          <div class="task-detail-property">
            <label class="field-label" for="task-deadline">Deadline</label><input id="task-deadline" name="deadline" type="date" value="${escape(values.deadline)}">
          </div>
          <div class="task-detail-property">
            <label class="field-label" for="task-priority">Priority</label><select id="task-priority" name="priorityLevel">${[1,2,3,4].map(level=>`<option value="${level}" ${level===taskPriority(values)?'selected':''}>${level===4?'P4 · Normal':`P${level}`}</option>`).join('')}</select>
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
      <footer class="panel-actions task-detail-footer">${task?'<button type="button" class="text-button" id="delete-task">Delete task</button>':''}<button class="panel-primary" type="submit">Save task</button></footer>
    </form>`;
}
function taskOccurrence(anchor){
  const key=anchor?.closest('[data-occurrence]')?.dataset.occurrence;
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
function calendarBlockPreview(){
  const task=state.tasks.find(item=>item.id===lastAnchor.dataset.task);
  return `${header('CALENDAR BLOCK',escape(task?.text||'Task unavailable'))}
    <p id="block-focus-time"></p>
    <div class="panel-actions">
      <button class="panel-primary" type="button" id="start-block-focus">${icon('play')} Start focus</button>
      <button type="button" class="text-button" id="edit-calendar-block">${lastAnchor.dataset.block?'Edit block':'Edit task'}</button>
    </div>`;
}

function selectedBlockTiming(now){
  const {task,block,occurrence}=lastAnchor.dataset;
  const selected=state.tasks.find(item=>item.id===task);
  return selected ? blockFocusTiming(selected,block,occurrence,now) : null;
}

function updateBlockPreview(now){
  const timing=selectedBlockTiming(now);
  const start=$('#start-block-focus');
  start.disabled=!timing?.available;
  const message=!timing?.available?'This block has ended or is no longer scheduled.':
    `${formatDuration(timing.available)} ${timing.early?'if you start now':'left in this block'}.${timing.split&&timing.available>50*60000?' The timer alternates up to 50 minutes of focus with 10 minutes of rest.':''}`;
  const label=$('#block-focus-time');
  if(label.textContent!==message)label.textContent=message;
}

function focusTaskPicker(){
  const current=focusedTask();
  const edit=current?'<button type="button" class="text-button" id="focus-task-edit">Edit current task</button>':'';
  if(state.timer.block){
    return `${header('CURRENT TASK','Calendar session')}
      ${current?`<p class="block-task-name">${escape(current.text)}</p>`:''}
      <p>This timer follows its scheduled task.</p><div class="panel-actions">${edit}</div>`;
  }
  const tasks=gardenTasks().filter(task=>taskStatus(task)==='todo').sort((a,b)=>taskPriority(a)-taskPriority(b));
  const choices=tasks.map(task=>{
    const selected=task.id===current?.id;
    return `<li><button type="button" data-focus-task="${escape(task.id)}" aria-pressed="${selected}"><span>${escape(task.text)}</span>${selected?'<span class="task-current-indicator" aria-hidden="true">Current</span>':''}</button></li>`;
  }).join('');
  return `${header('CURRENT TASK','Choose what to work on')}
    ${choices?`<ul class="focus-task-list">${choices}</ul>`:'<p>No unfinished tasks for today.</p>'}
    <div class="panel-actions"><button type="button" class="panel-primary" id="focus-task-add">Add task</button>${edit}</div>`;
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
function panelContent(id){
  if(id==='capture-project'){
    const projects=state.projects.filter(project=>!project.archived);
    return `${header('CAPTURED THOUGHT','Attach to a project')}${projects.length?`<form id="capture-project-form"><label class="field-label" for="capture-project-id">Project</label><select id="capture-project-id" required>${projects.map(project=>`<option value="${escape(project.id)}">${escape(project.name)}</option>`).join('')}</select><div class="panel-actions"><button class="panel-primary">Attach thought</button></div></form>`:'<p>Create a project in Planner to attach a thought.</p>'}`;
  }
  if(id==='appearance'){
    const {lighting,season}=state.appearance;
    return `${header('GARDEN APPEARANCE','Light and seasons')}
      <fieldset class="appearance-options"><legend>Lighting</legend><div class="lighting-options">
        ${Object.entries(lightingOptions).map(([value,label])=>`<label><input class="sr-only" type="radio" name="garden-lighting" value="${value}" ${lighting===value?'checked':''}><span>${label}</span></label>`).join('')}
      </div><p>Follow timer gives each focus session its own sunrise and sunset.</p></fieldset>
      <fieldset class="appearance-options"><legend>Season</legend><div class="season-options">
        ${Object.entries(seasonOptions).map(([value,item])=>`<label><input class="sr-only" type="radio" name="garden-season" value="${value}" ${season===value?'checked':''}><span style="--season-a:${item.colors[0]};--season-b:${item.colors[1]}"><i aria-hidden="true"></i><strong>${item.name}</strong><small>${item.detail}</small></span></label>`).join('')}
      </div></fieldset>
      <fieldset class="appearance-options weather-options"><legend>Weather</legend>
        <select id="garden-weather" name="garden-weather" aria-label="Weather">${gardenWeatherOptions()}</select>
        <p>Now in the Garden <strong id="garden-weather-current">${weatherBySeason[season][gardenWeather(state.appearance)]}</strong></p>
      </fieldset>
      <section class="garden-schedule"><h3>Daily Garden presets</h3><label><input type="checkbox" id="garden-schedule-enabled" ${state.gardenSchedule.enabled?'checked':''}> Switch looks by time of day</label>
      <p id="garden-active-preset"></p><p>Choose a look above, then save its start time. Changing the look pauses the schedule until you save or turn it back on.</p>
      <form id="garden-preset-form"><label for="garden-preset-time">Start time</label><input id="garden-preset-time" name="time" type="time" required><button class="panel-primary">Save preset</button></form>
      <ul>${state.gardenSchedule.presets.map(item=>`<li><span>${timeLabel(timeMinutes(item.time))} · ${seasonOptions[item.season].name} · ${lightingOptions[item.lighting]}</span><button type="button" data-remove-garden-preset="${item.time}" aria-label="Remove preset at ${timeLabel(timeMinutes(item.time))}">×</button></li>`).join('')}</ul></section>`;
  }
  if(id==='focus-task')return focusTaskPicker();
  if(id==='event-editor')return calendarEventEditor();
  if(id==='imported-event'){
    const event=state.calendarEvents.find(item=>item.id===lastAnchor?.dataset.calendarEvent);
    return event?`${header('IMPORTED CALENDAR',escape(event.title))}<p>${event.day?`All day · ${escape(event.day)}`:escape(new Date(event.start).toLocaleString())}${event.source?` · ${escape(event.source)}`:''}</p><p class="imported-description">${escape(event.description)}</p>`:header('CALENDAR','Event unavailable');
  }
  if(id==='resume'){
    const task=state.tasks.find(item=>item.id===lastAnchor?.dataset.resumeId);
    return task?`${header('PICK UP WHERE YOU LEFT OFF',escape(task.text))}<form id="resume-form" data-task-id="${escape(task.id)}"><label class="field-label" for="resume-text">Next step</label><textarea id="resume-text" maxlength="500" rows="3" placeholder="What should you do first next time?">${escape(task.resumeNote)}</textarea><div class="panel-actions"><button class="panel-primary">Save next step</button></div></form>`:header('NEXT STEP','Task unavailable');
  }
  if(id==='calendar-block')return calendarBlockPreview();
  if(id==='pagoda')return `${header('TIMER SETTINGS','Find your rhythm.')}<p>A little structure. A lot of space.</p><form id="timer-settings"><div class="duration-fields"><div><label class="field-label" for="focus-minutes">Focus</label><div class="minute-field"><input id="focus-minutes" name="focus" inputmode="numeric" maxlength="6" value="${formatDuration(duration(state,'focus'))}" required></div></div><div><label class="field-label" for="break-minutes">Rest</label><div class="minute-field"><input id="break-minutes" name="break" inputmode="numeric" maxlength="6" value="${formatDuration(duration(state,'break'))}" required></div></div></div><label class="field-label" for="intention">What are you making space for?</label><input id="intention" name="intention" value="${escape(state.intention)}" placeholder="e.g. Understand a little more" maxlength="160"><p class="panel-subtle">${state.timer.id?'New durations apply to your next session.':'Choose a pace that works for you.'}</p><div class="panel-actions"><button class="panel-primary" type="submit">Save rhythm</button><button type="button" class="text-button" id="panel-timer-toggle">${state.timer.status==='running'?'Pause timer':state.timer.status==='paused'?'Continue timer':'Start timer'}</button></div></form>${timerNotificationControls()}${timerRoutines()}`;
  if(id==='task-editor')return taskEditor();
  if(id==='block-editor')return blockEditor();
  if(id==='capture')return `${header('QUICK CAPTURE','Leave a thought here.')}
    <form id="capture-form">
      <label class="sr-only" for="capture-text">Quick note</label>
      <textarea class="note-field" id="capture-text" name="thought" rows="4" maxlength="1000" placeholder="What’s on your mind?" required></textarea>
      <div class="note-actions"><button class="note-primary" type="submit">Save note</button><button type="button" class="note-secondary" id="capture-window">Open mini window</button></div>
      <p class="note-caption"><kbd>Ctrl+Enter</kbd> to save</p>
    </form>`;
  if(id==='notes')return `${header('GARDEN NOTES','Leave it here.')}
    <div class="note-label"><label for="notes-input">Notes</label><span>Saved as you type</span></div>
    <textarea class="note-field" id="notes-input" placeholder="What’s on your mind?" rows="5" maxlength="20000">${escape(state.notes)}</textarea>
    <div class="note-actions">
      <button type="button" class="note-primary" id="quick-capture">Quick capture</button>
      <button type="button" class="note-secondary" id="capture-window">Open mini window</button>
      <button type="button" class="note-secondary" id="clear-notes">Clear notes</button>
    </div>
    <p class="note-caption"><kbd>Ctrl+Alt+N</kbd> for quick capture</p>
    <div id="notes-captures">${captureCards()}</div>`;
  if(id==='progress'){
    const p=todayProgress(state);return `${header('TODAY','Small things grow.')}<p>${new Date().toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}</p><div class="progress-numbers"><div><strong>${p.completed}</strong><span>completed sessions</span></div><div><strong>${p.minutes}</strong><span>focus minutes</span></div></div><p class="panel-subtle">Each completed focus session adds a blossom.<br>Skipped sessions are recorded separately.</p><div class="panel-rule"></div>${p.items.length?`<ul class="history-list">${[...p.items].reverse().map(h=>`<li><span>${escape(h.intention||'A moment of focus')}<br><time>${new Date(h.finishedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})} · ${Math.floor(h.focusMs/60000)} min</time></span><span class="outcome ${h.outcome==='skipped'?'skipped':''}">${h.outcome==='completed'?'Completed':'Skipped'}</span></li>`).join('')}</ul>`:'<div class="empty-state">No need to hurry.<br>The first blossom will come.</div>'}<p class="panel-subtle">${p.skipped} skipped today · A new day is a fresh garden.</p>`;
  }
  return `${header('BY THE LAKE','Your own soundtrack.')}<label class="field-label" for="spotify-link">Spotify playlist, album, or track link</label><form id="spotify-form" class="music-link"><input id="spotify-link" type="url" value="${escape(state.spotify)}" placeholder="https://open.spotify.com/playlist/…" required><button class="panel-primary" type="submit">Load</button></form><div id="music-player-wrap"></div><p id="spotify-error" role="status" class="panel-subtle"></p><div class="panel-actions"><a class="panel-primary" id="open-spotify-external" href="https://open.spotify.com/" target="_blank" rel="noopener noreferrer">Open Spotify ${icon('external')}</a><button class="text-button" id="remove-player" ${state.spotify?'':'hidden'}>Remove player</button></div><p class="music-tip">The embedded player pauses app sounds automatically. Open Spotify enables the outside music switch below.</p>${soundControls()}`;
}
function positionPanel(panel,anchor){
  if(!anchor)return;
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
  if(panel.classList.contains('task-editor'))return;
  const r=anchor.getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight,W=window.innerWidth,H=window.innerHeight;
  let x=r.left+r.width/2-w/2,y=r.top-h+15;
  if(anchor.classList.contains('world-object')) y=r.bottom+12;
  if(y<16)y=r.bottom-15;
  panel.style.left=`${Math.max(14,Math.min(x,W-w-14))}px`;
  panel.style.top=`${Math.max(16,Math.min(y,H-h-16))}px`;
}
function visiblePanel(){return root.querySelector('.panel:not(.music-hidden)');}
function openPanel(id,anchor){
  closePanel(false);activePanel=id;lastAnchor=anchor;anchor?.setAttribute('aria-expanded','true');
  let panel=root.querySelector('#music-panel');
  if(id==='music'&&panel){panel.classList.remove('music-hidden');panel.setAttribute('aria-hidden','false');panel.querySelector('h2').id='panel-title';panel.setAttribute('aria-labelledby','panel-title');panel.inert=false;}
  else{panel=document.createElement('section');panel.className=id==='capture'?'panel capture-panel lake-note':id==='notes'?'panel lake-note':id==='task-editor'?'panel task-editor task-detail-panel':id==='event-editor'?'panel task-editor event-editor':id==='block-editor'?'panel task-editor':id==='appearance'?'panel appearance-panel':'panel';if(id==='music')panel.id='music-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','panel-title');panel.innerHTML=panelContent(id);root.appendChild(panel);if(id==='music')mountSpotify();}
  if(id==='music')syncSound();
  positionPanel(panel,anchor);wake();
  const firstControl=panel.querySelector(id==='appearance'?'input:checked':'input,textarea,select')||panel.querySelector('button');
  const initialFocus=id==='task-editor'&&editingTaskId?panel.querySelector('#panel-title'):firstControl;
  if(initialFocus.id==='panel-title')initialFocus.tabIndex=-1;
  initialFocus.focus({preventScroll:true});
}
function closePanel(restore=true){
  const p=visiblePanel();if(p){if(p.id==='music-panel'){p.classList.add('music-hidden');p.setAttribute('aria-hidden','true');p.inert=true;p.querySelector('h2').id='music-hidden-title';p.setAttribute('aria-labelledby','music-hidden-title');}else p.remove();}
  if(lastAnchor){
    lastAnchor.setAttribute('aria-expanded','false');
    if(restore){
      const anchor=lastAnchor.isConnected?lastAnchor:inSchedule()?$('#planner-heading'):$('#sidebar-calendar');
      anchor.focus({preventScroll:true});
    }
  }
  activePanel=null;wake();
}
function refreshPanel(){
  if(!activePanel||activePanel==='music')return;
  const p=visiblePanel();
  if(!p)return;
  const focusId=p.contains(document.activeElement)?document.activeElement.id:null;
  p.innerHTML=panelContent(activePanel);
  if(activePanel==='calendar-block')updateBlockPreview(Date.now());
  positionPanel(p,lastAnchor);
  if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});
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
  $('#agenda-range').textContent=range;
  const ticks=Array.from({length:5},(_,index)=>`<div>${timeLabel(((start+index*60)%1440+1440)%1440)}</div>`).join('');
  const columns=[];
  for(let day=firstDay;day<=lastDay;day++){
    const date=shiftDay(now,day);
    const from=Math.max(0,start-day*1440),to=Math.min(1440,end-day*1440);
    const blocks=calendarBlocks(gardenTasks(),date,state.calendarEvents).filter(block=>block.start<to&&block.end>from);
    columns.push(`<div class="calendar-day mini-calendar-day" data-date="${dayKey(date)}" data-from="${from}" data-span="${to-from}" style="--slice-offset:${day*1440+from-start};--slice-span:${to-from}">${blocks.map(block=>calendarBlockMarkup(block,date,Math.max(block.start,from)-from,Math.min(block.end,to)-from)).join('')}</div>`);
  }
  const nowLine=minute>=start&&minute<end?`<div class="mini-now" style="--now-minute:${minute-start}" title="Current time"></div>`:'';
  const grid=`<div class="mini-hours calendar-hours" aria-hidden="true">${ticks}</div><div class="mini-track">${columns.join('')}${nowLine}</div>`;
  $('#agenda-list').innerHTML=grid;
  calendarPanel.querySelector('.calendar-now')?.style.setProperty('--now-minute',minute);
  agendaMinute=Math.floor(now.getTime()/60000);
}

function calendarBlockMarkup(block,date,visibleStart=block.start,visibleEnd=block.end){
  const {task,blockId,start,end,lane,lanes,continues,occurrence}=block;
  const time=`${timeLabel(start)} – ${timeLabel(end)}`;
  if(block.event)return `<button type="button" class="calendar-block ${block.event.manual?'manual-event':'imported-block'}" data-calendar-event="${escape(block.event.id)}" aria-haspopup="dialog" aria-label="${escape(block.event.title)}, ${time}, ${block.event.manual?'event':'imported event'}" style="--start:${visibleStart};--length:${visibleEnd-visibleStart};--lane:${lane};--lanes:${lanes}"><strong>${escape(block.event.title)}</strong><span>${time}</span></button>`;
  const title=`${task.text}, ${date.toLocaleDateString([],{weekday:'long'})}, ${time}${continues?', continued from the previous day':''}`;
  const done=taskStatus(task,new Date(`${occurrence}T00:00:00`))==='done';
  return `<button type="button" draggable="true" class="calendar-block${task.priority?' calendar-priority':''}${done?' calendar-done':''}" data-priority="${taskPriority(task)}" data-task="${escape(task.id)}" data-block="${escape(blockId)}" data-occurrence="${occurrence}" aria-label="Open ${escape(title)}${done?', done':''}" aria-haspopup="dialog" title="${escape(title)}" style="--start:${visibleStart};--length:${visibleEnd-visibleStart};--lane:${lane};--lanes:${lanes}"><strong>${escape(task.text)}</strong><span>${escape(time)}</span></button>`;
}
function availableTaskId(){return gardenTasks().find(task=>taskStatus(task)==='todo')?.id??null;}

function renderCalendar(){
  planner.render();
}

function calendarStartMinute(date,visibleDays){
  const tasks=planner.calendarTasks();
  let minute=8*60;
  for(let offset=0;offset<visibleDays;offset++){
    for(const block of calendarBlocks(tasks,shiftDay(date,offset),state.calendarEvents)){
      minute=Math.min(minute,Math.max(0,block.start-30));
    }
  }
  return minute;
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
    scrollCalendarTo(date,calendarOpenMinute??calendarStartMinute(date,visibleDays));
    calendarOpenMinute=undefined;
  }
  updatePlannerViewport();
  renderCalendarShelf();
}

function renderCalendarShelf(){
  const scroll=calendarTray.scrollTop;
  const query=calendarShelfSearch.value.trim().toLowerCase();
  const projects=new Map(state.projects.map(project=>[project.id,project.name]));
  const tasks=planner.calendarTasks().filter(task=>taskStatus(task)!=='done');
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

function renderPlannerDays(){
  const now=new Date(),today=dayKey(now),minute=now.getHours()*60+now.getMinutes();
  const tasks=planner.calendarTasks(),showCompleted=$('#planner-completed').checked;
  const headers=plannerDays.map(date=>{
    const key=dayKey(date),current=key===today;
    const allDay=tasks.filter(task=>!task.time&&(taskOccursOn(task,date)||!task.date&&task.deadline===key)&&(showCompleted||taskStatus(task,date)!=='done'));
    const imports=allDayEvents(state.calendarEvents,date);
    const stamp=`<span>${current?'Today':date.toLocaleDateString([],{weekday:'short'})}</span><strong>${date.getDate()}</strong>`;
    const dayLabel=escape(date.toLocaleDateString([],{dateStyle:'full'}));
    const heading=workspace==='calendar'?`<button class="calendar-day-heading" type="button" data-calendar-day="${key}" aria-label="Open day view for ${dayLabel}">${stamp}</button>`:`<div class="calendar-day-heading">${stamp}</div>`;
    return `<div class="calendar-date${current?' calendar-today':''}"${current?' aria-current="date"':''}>${heading}${allDay.length||imports.length?`<div class="calendar-all-day">${allDay.map(task=>`<button type="button" class="calendar-all-day-task" data-task="${escape(task.id)}" data-occurrence="${key}" title="${escape(task.text)}">${escape(task.text)}</button>`).join('')}${imports.map(event=>`<button type="button" class="calendar-all-day-task ${event.manual?'manual-event':'imported-block'}" data-calendar-event="${escape(event.id)}" title="${escape(event.title)}">${escape(event.title)}</button>`).join('')}</div>`:''}</div>`;
  }).join('');
  const hours=Array.from({length:24},(_,hour)=>`<div>${timeLabel(hour*60)}</div>`).join('');
  const columns=plannerDays.map(date=>{
    const blocks=calendarBlocks(tasks,date,state.calendarEvents).filter(block=>block.event||showCompleted||taskStatus(block.task,new Date(`${block.occurrence}T00:00:00`))!=='done').map(block=>calendarBlockMarkup(block,date)).join('');
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

calendarScroll.addEventListener('scroll',()=>{
  updatePlannerViewport();
  clearTimeout(plannerScrollEnd);
  plannerScrollEnd=setTimeout(extendPlannerDates,160);
},{passive:true});
calendarScroll.addEventListener('keydown',event=>{
  if(event.target!==calendarScroll||!['ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();
  scrollCalendarTo(shiftDay(leadingPlannerDay(),event.key==='ArrowRight'?1:-1));
});
new ResizeObserver(updatePlannerViewport).observe(calendarScroll);

function openSchedule(destination,anchor,date=new Date(),minute){
  closePanel(false);
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
  $('#sidebar-calendar').setAttribute('aria-expanded',String(destination==='calendar'));
  calendarLayoutDay='';
  calendarOpenMinute=minute;
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
  const actions=[['edit','Edit task'],['priority',task.priority?'Remove priority':'Prioritize'],['schedule','Add a block…']];
  actions.push(['duplicate','Duplicate task']);
  if(anchor.classList.contains('calendar-block'))actions.unshift(['block-focus','Start focus…']);
  if(anchor.dataset.block)actions.push(['edit-block','Edit block'],['remove-block','Remove block']);
  if(taskStatus(task)==='todo')actions.push(['focus',state.activeTask===id?'Clear focus':'Focus on this']);
  if(status!=='upcoming')actions.push(['complete',status==='done'?'Reopen task':'Mark done']);
  if(task.date&&task.time&&!anchor.dataset.block)actions.push(['unschedule','Remove scheduled time']);
  actions.push(['delete','Delete task']);
  taskMenu.innerHTML=actions.map(([key,label])=>`<button type="button" role="menuitem" data-task-action="${key}">${label}</button>`).join('');
  taskMenu.hidden=false;
  const box=anchor.getBoundingClientRect();
  taskMenu.style.left=`${Math.max(8,Math.min(x??box.right-taskMenu.offsetWidth,innerWidth-taskMenu.offsetWidth-8))}px`;
  taskMenu.style.top=`${Math.max(8,Math.min(y??box.bottom+5,innerHeight-taskMenu.offsetHeight-8))}px`;
  if(anchor.classList.contains('task-more'))anchor.setAttribute('aria-expanded','true');
  taskMenu.querySelector('button').focus();
  wake();
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
  if(state.activeTask===id)state.activeTask=availableTaskId();
  persist();refreshTasks();
  const focus=state.focusMode?currentTaskButton:inSchedule()?$('#planner-heading'):taskSidebar.hidden?taskToggle:$('#sidebar-add-task');
  focus.focus({preventScroll:true});
  confirmChange('Task deleted.',restoreActiveTask(undo,before,state.activeTask));
}
function animateTaskCompletion(anchor){
  if(motionPreference.matches||!anchor?.getClientRects().length)return;
  const title=anchor.closest('.planner-task,.task-card,.task-detail-panel')?.querySelector('.planner-task-title,.task-open,#panel-title')||anchor;
  const rect=title.getBoundingClientRect();
  const width=Math.min(rect.width,innerWidth-rect.left,190);
  if(width<=0||rect.bottom<0||rect.bottom>innerHeight)return;
  const effect=document.createElement('span');
  effect.className='task-completion-ink';
  effect.setAttribute('aria-hidden','true');
  effect.style.left=`${rect.left}px`;
  effect.style.top=`${rect.bottom}px`;
  effect.style.width=`${width}px`;
  app.append(effect);
  effect.addEventListener('animationend',()=>effect.remove(),{once:true});
  setTimeout(()=>effect.remove(),760);
}
function markTask(task,done,day=new Date(),anchor){
  const before=state.activeTask;
  const undo=recordTaskCompletion(state,task,done,day);
  if(done&&undo)animateTaskCompletion(anchor);
  if(done&&state.activeTask===task.id&&taskStatus(task)==='done')state.activeTask=availableTaskId();
  return restoreActiveTask(undo,before,state.activeTask);
}

taskMenu.addEventListener('click',event=>{
  const action=event.target.closest('[data-task-action]')?.dataset.taskAction;
  const task=state.tasks.find(item=>item.id===menuTaskId);
  if(!action||!task)return;
  const anchor=menuAnchor;
  const blockSurface=anchor.closest('#mini-calendar')||calendarPanel;
  closeTaskMenu(false);
  if(action==='block-focus'){openCalendarBlock(anchor);return;}
  if(action==='edit'){openTaskEditor(task.id,anchor);return;}
  if(action==='schedule'||action==='edit-block'){openBlockEditor(task.id,anchor,action==='edit-block'?anchor.dataset.block:null);return;}
  if(action==='delete'){deleteTask(task.id);return;}
  if(action==='duplicate'){
    const copy=structuredClone(task);
    Object.assign(copy,{id:crypto.randomUUID(),done:false,completedOn:'',completions:[],reminderShown:false});
    copy.subtasks?.forEach(subtask=>{subtask.id=crypto.randomUUID();subtask.done=false;});
    copy.blocks?.forEach(block=>{block.id=crypto.randomUUID();});
    state.tasks.push(copy);persist();refreshTasks();announce('Task duplicated.');
    (inSchedule()?$('#planner-heading'):taskButton(copy.id))?.focus({preventScroll:true});return;
  }
  if(action==='priority'){
    task.priorityLevel=taskPriority(task)===4?1:4;
    task.priority=task.priorityLevel!==4;
  }
  if(action==='focus')state.activeTask=state.activeTask===task.id?null:task.id;
  let undo,message;
  if(action==='complete'){
    const day=taskOccurrence(anchor);
    const done=taskStatus(task,day)!=='done';
    undo=markTask(task,done,day,anchor);
    message=done?'Task completed.':'Task reopened.';
  }
  if(action==='unschedule'||action==='remove-block'){
    const scheduleUndo=captureTaskChange(task,['time','blocks']);
    if(action==='unschedule')task.time='';
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
    event.dataTransfer.setData(calendarDragType,JSON.stringify({task:card.dataset.task,move:card.classList.contains('calendar-block'),block:card.dataset.block||null}));
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
function onCalendarDrop(event){
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
  const finishUndo=captureTaskChange(task,drag.block||!drag.move?['blocks']:['date','time']);
  const before=state.activeTask;
  dragOffset=0;
  if(drag.block){
    const block=task.blocks?.find(item=>item.id===drag.block);
    if(!block)return;
    block.date=column.dataset.date;
    block.time=timeValue(minute);
  }else if(drag.move)scheduleTask(task,column.dataset.date,minute);
  else addTaskBlock(task,column.dataset.date,timeValue(minute));
  if(state.activeTask===task.id&&taskStatus(task)!=='todo')state.activeTask=availableTaskId();
  persist();refreshTasks();
  confirmChange(`Task scheduled for ${timeLabel(minute)}.`,restoreActiveTask(finishUndo(),before,state.activeTask));
}
for(const calendar of [calendarPanel,miniCalendar]){
  calendar.addEventListener('dragover',onCalendarDragOver);
  calendar.addEventListener('dragleave',onCalendarDragLeave);
  calendar.addEventListener('drop',onCalendarDrop);
}
function openCalendarBlock(block){
  if(block.dataset.calendarEvent){
    const event=state.calendarEvents.find(item=>item.id===block.dataset.calendarEvent);
    openPanel(event?.manual?'event-editor':'imported-event',block);return;
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
function calendarEventEditor(){
  const event=state.calendarEvents.find(item=>item.manual&&item.id===lastAnchor?.dataset.calendarEvent);
  const draft=calendarDraft();
  const start=event?.start!==undefined?new Date(event.start):new Date(`${draft.date}T${draft.time}:00`);
  const end=event?.end!==undefined?new Date(event.end):new Date(+start+3600000);
  const allDay=Boolean(event?.day);
  const time=date=>timeValue(date.getHours()*60+date.getMinutes());
  const timeField=(name,value,label)=>`<label class="event-field" data-event-time ${allDay?'hidden':''}>${label}<input name="${name}" type="time" value="${value}" required ${allDay?'disabled':''}></label>`;
  return `${header('CALENDAR',event?'Edit event':'Add event')}
    <form id="calendar-event-form" data-event-id="${escape(event?.id)}">
      <label class="event-field">Title<input name="title" value="${escape(event?.title)}" maxlength="160" placeholder="Class, appointment, or anything else" required></label>
      <label class="event-all-day"><input type="checkbox" name="allDay" ${allDay?'checked':''}> All day</label>
      <div class="event-date-grid">
        <label class="event-field"><span data-event-start-label>${allDay?'First day':'Start date'}</span><input name="startDay" type="date" value="${event?.day||dayKey(start)}" required></label>
        ${timeField('startTime',time(start),'Start time')}
        <label class="event-field"><span data-event-end-label>${allDay?'Last day':'End date'}</span><input name="endDay" type="date" value="${allDay?dayKey(shiftDay(new Date(event.endDay+'T00:00:00'),-1)):dayKey(end)}" required></label>
        ${timeField('endTime',time(end),'End time')}
      </div>
      <label class="event-field">Notes <textarea name="description" rows="3" maxlength="3000" placeholder="Optional">${escape(event?.description)}</textarea></label>
      <p class="event-error" role="alert" hidden></p>
      <div class="panel-actions">${event?'<button type="button" class="text-button event-delete" id="delete-calendar-event">Delete event</button>':''}<button class="panel-primary">Save event</button></div>
    </form>`;
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
calendarPanel.addEventListener('click',event=>{
  const dayHeading=event.target.closest('[data-calendar-day]');
  if(dayHeading){
    planner.setCalendarLayout('day',new Date(`${dayHeading.dataset.calendarDay}T00:00:00`));
    calendarScroll.focus({preventScroll:true});
    return;
  }
  const addEvent=event.target.closest('[data-calendar-add-event]');
  if(addEvent){openPanel('event-editor',addEvent);return;}
  const add=event.target.closest('[data-calendar-new]');
  if(add){
    const project=$('#calendar-project').value;
    openTaskEditor(null,add,{...calendarDraft(),projectId:project==='all'||project==='inbox'?'':project});
    return;
  }
  const step=event.target.closest('[data-calendar-step]')?.dataset.calendarStep;
  if(step){
    if(!planner.calendarVisible())planner.jumpMonth(new Date(),step==='today'?0:step==='next'?1:-1);
    else if(step==='today')scrollCalendarTo(new Date(),Math.max(0,new Date().getHours()-1)*60);
    else scrollCalendarTo(shiftDay(leadingPlannerDay(),Number(calendarPanel.dataset.visibleDays)*(step==='next'?1:-1)));
    return;
  }
  const block=event.target.closest('.calendar-block');
  if(block){openCalendarBlock(block);return;}
  const allDay=event.target.closest('.calendar-all-day-task');
  if(allDay){if(allDay.dataset.calendarEvent)openCalendarBlock(allDay);else openTaskEditor(allDay.dataset.task,allDay);return;}
  const trayTask=event.target.closest('.calendar-tray-task');
  if(trayTask)openBlockEditor(trayTask.dataset.task,trayTask,null,workspace==='calendar'?calendarDraft():null);
});
calendarScroll.addEventListener('dblclick',event=>{
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
    state.activeTask=card.dataset.task;
    persist();refreshTasks();
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
function spotifyPath(link){try{const u=new URL(link);if(u.protocol!=='https:'||u.hostname!=='open.spotify.com')return null;return u.pathname.match(/^\/(?:intl-[a-z]+\/)?(playlist|album|track)\/([a-zA-Z0-9]{10,40})\/?$/)?.slice(1).join('/')||null;}catch{return null;}}
function mountSpotify(){
  const wrap=$('#music-player-wrap'),path=spotifyPath(state.spotify);
  if(wrap&&path)spotifyEmbed.mount(wrap,path);
}
function changeSound(key,value){
  state.sounds[key]=value;
  const field=$(`[data-sound-level="${key}"]`);
  if(field){field.value=value;field.nextElementSibling.value=`${value}%`;}
  syncSound(true);
}

root.addEventListener('click',e=>{
  if(e.target.closest('#open-spotify-external')){
    changeSound('musicMode',true);
    const field=$('#outside-music');
    if(field)field.checked=true;
    persist();
  }
  const btn=e.target.closest('button');if(!btn)return;
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
  if(btn.dataset.focusTask){
    const task=state.tasks.find(item=>item.id===btn.dataset.focusTask);
    if(!task||state.timer.block||taskStatus(task)!=='todo')return;
    state.activeTask=task.id;
    closePanel(false);persist();refreshTasks();
    timerButton.focus({preventScroll:true});
    announce(`Current task: ${task.text}`);
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
    if(!timing?.available){updateBlockPreview(now);return;}
    const id=lastAnchor.dataset.task;
    const skipped=record(state,'skipped',now);
    startBlockFocus(state,id,timing.available,timing.split,now);
    closePanel(false);
    if(inSchedule())closeCalendar();
    if(!durationForm.hidden)finishEdit();
    persist();refreshTasks();wake();
    $('#toggle-timer').focus({preventScroll:true});
    const message=skipped?'Block focus started. The previous session was skipped.':'Block focus started.';
    toast(message);announce(message);
  }
  if(btn.id==='panel-timer-toggle')$('#toggle-timer').click();
  if(btn.id==='timer-notifications')toggleNotifications();
  if(btn.id==='timer-open-sounds')openPanel('music',$('[data-panel="music"]'));
  if(btn.dataset.removeGardenPreset){
    state.gardenSchedule.presets=state.gardenSchedule.presets.filter(item=>item.time!==btn.dataset.removeGardenPreset);
    persist();render();refreshPanel();$('#garden-preset-time')?.focus();
  }
  if(btn.id==='silence-ambience'){
    for(const kind of ['rain','water','wind'])changeSound(kind,0);
    persist();
  }
  if(btn.id==='quick-capture')openPanel('capture',$('[data-panel="notes"]'));
  if(btn.id==='capture-window'){
    const left=Math.round(capturePointer?.screenX??window.screenX);
    const top=Math.round(capturePointer?.screenY??window.screenY);
    const windowRef=window.open('./capture.html','yin-yang-capture',`popup,width=360,height=245,left=${left},top=${top}`);
    if(windowRef){windowRef.focus();closePanel();}else toast('Open the quick note page in another tab to capture a thought.');
  }
  if(btn.dataset.routine){
    const routine=[...builtinRoutines,...state.routines].find(item=>item.id===btn.dataset.routine);
    if(!routine)return;
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
  if(btn.id==='clear-notes'){const previous=state.notes;if(!previous)return;state.notes='';$('#notes-input').value='';persist();toast('Notes cleared.');$('#notes-input').focus();}
  if(btn.id==='remove-player'){state.spotify='';spotifyEmbed.clear($('#music-player-wrap'));$('#spotify-link').value='';btn.hidden=true;persist();toast('Spotify player removed.');}
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
root.addEventListener('input',e=>{
  if(e.target.id==='focus-minutes'||e.target.id==='break-minutes')formatDurationInput(e);
  if(e.target.dataset.soundLevel)changeSound(e.target.dataset.soundLevel,Number(e.target.value));
  if(e.target.id==='notes-input'){state.notes=e.target.value;persist();}
  if(e.target.id==='intention'){state.intention=e.target.value;persist();render();}
  if(e.target.id==='task-title')e.target.setCustomValidity('');
  if(e.target.id==='task-date'||e.target.id==='task-repeat')$('#task-date').setCustomValidity('');
});
root.addEventListener('change',event=>{
  const form=event.target.form;
  if(form?.id==='calendar-event-form'){
    const fields=form.elements, allDay=fields.allDay.checked;
    if(event.target===fields.startDay&&fields.endDay.value<fields.startDay.value)fields.endDay.value=fields.startDay.value;
    if(event.target===fields.allDay){
      form.querySelectorAll('[data-event-time]').forEach(label=>{label.hidden=allDay;label.querySelector('input').disabled=allDay;});
      form.querySelector('[data-event-start-label]').textContent=allDay?'First day':'Start date';
      form.querySelector('[data-event-end-label]').textContent=allDay?'Last day':'End date';
    }
  }
  if(event.target.id==='garden-schedule-enabled'){
    state.gardenSchedule.enabled=event.target.checked;
    persist();render();
  }
  if(event.target.dataset.soundLevel)persist();
  if(event.target.id==='mute-garden'||event.target.id==='outside-music'){
    changeSound(event.target.id==='mute-garden'?'muted':'musicMode',event.target.checked);
    persist();
  }
  const appearanceField={'garden-lighting':'lighting','garden-season':'season','garden-weather':'weather'}[event.target.name];
  if(appearanceField){
    const value=event.target.value;
    const appearance={...state.appearance,[appearanceField]:value};
    if(appearanceField==='season'||appearanceField==='weather'&&value==='auto')appearance.weatherSince=Date.now();
    if(appearanceField==='season')appearance.weather='auto';
    state.appearance=loadAppearance(appearance);
    state.gardenSchedule.enabled=false;
    $('#garden-schedule-enabled').checked=false;
    if(appearanceField==='season')$('#garden-weather').innerHTML=gardenWeatherOptions();
    persist();render();
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
  if(e.target.id==='calendar-event-form'){
    const form=e.target, fields=new FormData(form), editing=form.dataset.eventId, prior=state.calendarEvents;
    if(editing&&!prior.some(item=>item.id===editing&&item.manual))return;
    const error=form.querySelector('.event-error');
    let event;
    try{
      event=calendarEventFromFields({...Object.fromEntries(fields),allDay:fields.has('allDay')},editing||`manual:${crypto.randomUUID()}`);
    }catch(err){error.textContent=err.message;error.hidden=false;return;}
    state.calendarEvents=editing?prior.map(item=>item.id===editing?event:item):[...prior,event];
    if(!persist()){state.calendarEvents=prior;return;}
    finishCalendarEventChange(event);
    confirmChange(editing?'Event updated.':'Event added.');
    return;
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
      closePanel();refreshTasks();toast('Thought attached. Open the project’s Thoughts button to read it.');
    }
    return;
  }
  if(e.target.id==='resume-form'){
    const task=state.tasks.find(item=>item.id===e.target.dataset.taskId);
    if(!task)return;
    task.resumeNote=$('#resume-text').value.trim();
    if(persist()){closePanel();render();toast('Next step saved.');}
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
      if(!saveCapture(storage,$('#capture-text').value))return;
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
    state.intention=$('#intention').value.trim();
    if(!state.timer.id)reset(state);
    persist();render();toast('Your rhythm is saved.');closePanel();
  }
  if(e.target.id==='task-editor-form'){
    const fields=new FormData(e.target);
    const text=fields.get('title').replace(/\s*\n\s*/g,' ').trim();
    if(!text){const title=$('#task-title');title.setCustomValidity('Enter a task name.');title.reportValidity();return;}
    const existing=state.tasks.find(task=>task.id===editingTaskId);
    const finishMove=existing&&captureTaskChange(existing,['date','time','projectId','sectionId']);
    const before=state.activeTask;
    const repeat=fields.get('repeat');
    const sameRepeatType=existing&&(existing.repeat==='none')===(repeat==='none');
    const priorityLevel=Number(fields.get('priorityLevel'));
    const reminderAt=fields.get('reminder')?new Date(fields.get('reminder')).getTime():null;
    const subtasks=(existing?.subtasks||[]).flatMap(sub=>{
      const text=String(fields.get(`sub:${sub.id}`)||'').trim();
      return text?[{...sub,text,done:fields.has(`done:${sub.id}`)}]:[];
    });
    for(const line of fields.get('subtasks').split('\n')){
      const text=line.trim().slice(0,160);
      if(text)subtasks.push({id:crypto.randomUUID(),text,done:false});
    }
    const comments=[...(existing?.comments||[])];
    const comment=fields.get('comment').trim();
    if(comment)comments.push({id:crypto.randomUUID(),text:comment,at:Date.now()});
    const task={
      id:existing?.id??crypto.randomUUID(), text,
      description:fields.get('description').trim(),
      resumeNote:String(fields.get('resumeNote')||'').trim(),
      date:fields.get('date')||(repeat!=='none'||fields.get('time')?dayKey():''),
      time:fields.get('time'), estimate:Number(fields.get('estimate'))||null, repeat,
      repeatEvery:Number(fields.get('repeatEvery'))||2,
      priority:priorityLevel!==4, priorityLevel,
      projectId:fields.get('projectId'), sectionId:fields.get('sectionId'), deadline:fields.get('deadline'),
      labels:[...new Set(fields.get('labels').split(',').map(label=>label.trim().replace(/^[@%]/,'').slice(0,40)).filter(Boolean))],
      reminderAt:Number.isFinite(reminderAt)?reminderAt:null, reminderShown:existing?.reminderAt===reminderAt&&existing?.reminderShown===true,
      subtasks,comments,done:repeat==='none'&&existing?.done===true,
      completedOn:sameRepeatType?existing.completedOn||'':'',completions:sameRepeatType?existing.completions||[]:[]
    };
    const captureKey=!existing&&taskDraft?.captureKey;
    if(captureKey&&state.processedCaptures.includes(captureKey)){toast('This thought was already filed.');return;}
    if(existing)Object.assign(existing,task);else state.tasks.push(task);
    const status=taskStatus(task);
    if(state.activeTask===task.id && status!=='todo')state.activeTask=availableTaskId();
    if(!focusedTask() && status==='todo')state.activeTask=task.id;
    const fromCurrentTask=lastAnchor===currentTaskButton;
    if(captureKey){
      if(!saveCaptureDestination(captureKey,()=>{},()=>{
        state.tasks=state.tasks.filter(item=>item.id!==task.id);state.activeTask=before;
      }))return;
    }else persist();
    closePanel(false);refreshTasks();
    if(status==='upcoming'&&workspace==='focus')$('.task-upcoming')?.setAttribute('open','');
    if(fromCurrentTask)currentTaskButton.focus({preventScroll:true});
    else if(inSchedule())$('#planner-heading').focus({preventScroll:true});
    else taskSidebar.querySelector(`[data-task="${CSS.escape(task.id)}"] .task-open`)?.focus();
    const move=finishMove?.();
    if(move)confirmChange('Task moved.',restoreActiveTask(move,before,state.activeTask));
    else announce(existing?'Task updated.':'Task added.');
  }
  if(e.target.id==='block-editor-form'){
    const task=state.tasks.find(item=>item.id===editingTaskId);
    if(!task)return;
    const fields=new FormData(e.target);
    const date=fields.get('date'),time=fields.get('time'),minutes=Number(fields.get('minutes'));
    const existing=task.blocks?.find(item=>item.id===editingBlockId);
    const finishUndo=captureTaskChange(task,['blocks']);
    if(existing)Object.assign(existing,{date,time,minutes});else addTaskBlock(task,date,time,minutes);
    closePanel(false);persist();refreshTasks();
    openSchedule('calendar',calendarToggle,new Date(`${date}T00:00:00`),Math.max(0,timeMinutes(time)-60));
    confirmChange(existing?'Block updated.':'Block scheduled.',finishUndo());
  }
  if(e.target.id==='spotify-form'){const link=$('#spotify-link').value.trim();if(!spotifyPath(link)){$('#spotify-error').textContent='Use a Spotify playlist, album, or track link from open.spotify.com.';return;}state.spotify=link;persist();mountSpotify();$('#spotify-error').textContent='Use the Spotify player to start your music.';$('#remove-player').hidden=false;positionPanel(visiblePanel(),lastAnchor);}
});
document.addEventListener('click',()=>syncSound(true),{capture:true});
document.addEventListener('pointerdown',e=>{
  if(!taskMenu.hidden&&!e.target.closest('#task-menu'))closeTaskMenu(false);
  if(activePanel&&!e.target.closest('.panel, #undo-toast')&&!e.target.closest('[data-panel]')&&!e.target.closest('#music-shortcut')&&!e.target.closest('#current-task, #resume-task'))closePanel(false);
});
document.addEventListener('click',async event=>{
  const action=event.target.closest('[data-capture-action]');
  if(action){
    const key=action.closest('[data-capture-key]').dataset.captureKey;
    const note=availableCaptures().find(item=>item.key===key);
    if(!note)return;
    if(action.dataset.captureAction==='task'){
      openTaskEditor(null,action,{text:note.text.split(/\r?\n/)[0].slice(0,160),description:note.text,captureKey:key});
    }else if(action.dataset.captureAction==='project'){
      captureActionKey=key;openPanel('capture-project',action);
    }else{
      const previous=state.notes;
      if(saveCaptureDestination(key,()=>{state.notes=[previous.trimEnd(),note.text].filter(Boolean).join('\n\n');},()=>{state.notes=previous;})){
        const input=$('#notes-input');if(input)input.value=state.notes;
        toast('Thought saved to Quick Notes.');
        (input||$('[data-panel="notes"]')).focus({preventScroll:true});
      }
    }
    return;
  }
  const dismiss=event.target.closest('[data-dismiss-capture]');
  if(!dismiss)return;
  const key=dismiss.dataset.dismissCapture;
  try{
    if(key.startsWith('native:')){
      const response=await fetch(`./api/capture-inbox/${key.slice(7)}`,{method:'DELETE'});
      if(!response.ok)throw new Error('Capture inbox unavailable');
      nativeNotes=nativeNotes.filter(note=>note.key!==key);
    }else storage.removeItem(key);
    renderCaptures();
  }catch{toast('Could not dismiss the note.');}
});
document.addEventListener('keydown',e=>{
  if(e.target.closest('#planner-dialog, #crochet-dialog, #journal-dialog'))return;
  if(e.ctrlKey&&e.altKey&&e.code==='KeyN'&&!e.repeat){
    e.preventDefault();
    if(activePanel!=='capture'){
      const fallback=state.focusMode?focusModeButton:$('#workspace-tabs button[aria-pressed="true"]');
      openPanel('capture',document.activeElement===document.body?fallback:document.activeElement);
    }
    return;
  }
  if(activePanel==='capture'&&e.key==='Enter'&&(e.ctrlKey||e.metaKey)){
    e.preventDefault();$('#capture-form').requestSubmit();return;
  }
  if(e.key==='Escape'&&!taskMenu.hidden){e.preventDefault();closeTaskMenu();return;}
  if(e.key==='Escape'&&activePanel){e.preventDefault();closePanel();return;}
  if(e.key==='Escape'&&inSchedule()&&planner.calendarVisible()&&!calendarShelf.hidden){e.preventDefault();setCalendarShelf(false);return;}
  if(e.key==='Escape'&&inSchedule()){e.preventDefault();closeCalendar();return;}
  if(e.key==='Escape'&&state.focusMode&&!e.defaultPrevented){e.preventDefault();toggleFocusMode();return;}
  const p=visiblePanel();
  if(e.key==='Tab'&&p){
    const controls=[...p.querySelectorAll('button,input,textarea,select,a[href],iframe')].filter(el=>!el.disabled&&el.offsetParent!==null&&(el.type!=='radio'||el.checked));
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
document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkCompletion();render();wake();}});
window.addEventListener('focus',syncNativeCaptures);
window.addEventListener('pageshow',()=>{checkCompletion();render();});
window.addEventListener('storage',e=>{
  if(e.key===STORAGE_KEY){state=loadState(storage);syncSound();checkCompletion();refreshTasks();renderCaptures();if(activePanel&&!visiblePanel()?.contains(document.activeElement))refreshPanel();}
  if(e.key===null||e.key?.startsWith(CAPTURE_PREFIX))renderCaptures();
});
renderCaptures();
syncNativeCaptures();
setInterval(()=>{if(!document.hidden)syncNativeCaptures();},4000);
checkCompletion();render();wake();
setInterval(()=>{checkCompletion();render();},500);

const editDuration=$('#edit-duration'),durationForm=$('#duration-form'),typed=$('#typed-duration');
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
editDuration.onclick=()=>{typed.value=formatDuration(duration(state));typed.setCustomValidity('');editDuration.hidden=true;durationForm.hidden=false;typed.focus();typed.select();};
$('#cancel-duration').onclick=()=>finishEdit();
typed.oninput=formatDurationInput;
typed.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();finishEdit();}};
durationForm.onsubmit=e=>{
  e.preventDefault();
  const ms=readDuration(typed);
  if(ms===null)return;
  const mode=state.timer.mode;
  action(()=>{
    if(state.timer.id)record(state,'skipped');
    state.settings[mode]=ms/60000;
    reset(state,mode);
  });
  finishEdit(timerButton);
  announce(`Timer set to ${formatDuration(ms)}.`);
};


const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
function environmentFrame(now){const t=state.timer;animateLandscape(now,t.mode==='break'?1:1-remaining(state)/t.total,motionPreference.matches,effectiveAppearance.lighting);requestAnimationFrame(environmentFrame);}
requestAnimationFrame(environmentFrame);
