import {STORAGE_KEY,loadState,remaining,startPause,reset,record,settle,todayProgress,duration,formatDuration,parseDuration,dayKey,taskStatus,completeTask,taskFrequencies} from './state.js';
import {renderLandscape,objects,blossomMarkup,animateLandscape} from './scenery.js';
import {calendarBlocks, calendarDragType, scheduleTask, shiftDay, timeLabel, weekDays} from './calendar.js';

const $=s=>document.querySelector(s);
const icons={
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18M8 14h2m4 0h2m-8 3h2"/>',
  play:'<path d="m8 5 11 7-11 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',reset:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',skip:'<path d="m5 5 10 7-10 7zM19 5v14"/>',expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',collapse:'<path d="M3 8h5V3m8 0v5h5M8 21v-5H3m13 5v-5h5"/>',focus:'<path d="M9 3H5a2 2 0 0 0-2 2v4m12-6h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4"/><circle cx="12" cy="12" r="3"/>',music:'<path d="M9 18V5l12-2v13M9 9l12-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="16" rx="3" ry="3"/>',spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',external:'<path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||''}</svg>`;
function applyIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storage;
try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}};}
let state=loadState(storage),activePanel=null,lastAnchor=null,idleTimeout,toastTimeout,lastBlossoms=-1;
const root=$('#panel-root');
const taskSidebar=$('#task-sidebar');
const calendarPanel=$('#calendar-panel');
const calendarScroll=$('#calendar-scroll');
const calendarTray=$('#calendar-task-tray');
const taskMenu=$('#task-menu');
const desktopTasks=matchMedia('(min-width: 981px)');
let editingTaskId=null,renderedTaskDay='',schedulingTask=false;
let calendarDate=new Date(),calendarAnchor=null,menuTaskId=null,menuAnchor=null;
let dragOffset=0;
let reopenTasksAfterCalendar=false;
function persist(){try{storage.setItem(STORAGE_KEY,JSON.stringify(state));$('#saved-status').innerHTML='<span class="tiny-dot"></span>Saved on this device';}catch{$('#saved-status').textContent='Storage unavailable — keep this tab open';toast('Your browser could not save changes. Keep this tab open.');}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('visible'),4200);}
function announce(text){$('#announcer').textContent=text;}
$('#landscape').innerHTML=renderLandscape();
$('#objects').classList.add('secondary');
$('#objects').innerHTML=objects.map(o=>`<button class="world-object ${o.className}" data-panel="${o.id}" aria-label="${o.hint}" aria-haspopup="dialog" aria-expanded="false"><span class="tool-icon">${icon(({pagoda:"focus",tasks:"target",calendar:"calendar",music:"music",notes:"spark",progress:"target"})[o.id])}</span><span>${({pagoda:"Settings",tasks:"Tasks",calendar:"Calendar",music:"Music",notes:"Notes",progress:"Today"})[o.id]}</span></button>`).join('');
applyIcons();

function setTaskSidebar(open){
  taskSidebar.hidden=!open;
  const toggle=$('[data-panel="tasks"]');
  toggle.setAttribute('aria-expanded',String(open));
}
const taskToggle=$('[data-panel="tasks"]');
taskToggle.removeAttribute('aria-haspopup');
taskToggle.setAttribute('aria-controls','task-sidebar');
taskToggle.setAttribute('aria-label','Show or hide tasks');
const calendarToggle=$('[data-panel="calendar"]');
calendarToggle.removeAttribute('aria-haspopup');
calendarToggle.setAttribute('aria-controls','calendar-panel');
setTaskSidebar(desktopTasks.matches);
desktopTasks.addEventListener('change',()=>setTaskSidebar(desktopTasks.matches));

function focusedTask(date=new Date()){
  return state.tasks.find(task=>task.id===state.activeTask&&taskStatus(task,date)==='todo');
}

function render(){
  const ms=remaining(state),seconds=Math.ceil(ms/1000),mins=Math.floor(seconds/60),secs=seconds%60,t=state.timer;
  $('#countdown').innerHTML=`${String(mins).padStart(2,'0')}<span>:</span>${String(secs).padStart(2,'0')}`;
  $('#countdown').setAttribute('aria-label',`${mins} minutes ${secs} seconds of ${t.mode==='focus'?'focus':'rest'} remaining`);
  const clock=new Date();
  const [hour,period]=clock.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}).split(/\s+/);
  $('#wall-clock').innerHTML=hour+'<small>'+period+'</small>';

  $('#wall-clock').dateTime=clock.toISOString();
  const task=focusedTask(clock);
  $('#current-task').textContent=task?.text||'Add task';
  $('#current-task').title=task?'Edit active task':'Add a task';
  if(renderedTaskDay!==dayKey(clock)){
    renderTasks(clock);
    if(!calendarPanel.hidden)renderCalendar();
  }
  const running=t.status==='running';
  $('#toggle-timer').innerHTML=icon(running?'pause':'play')+`<span>${running?'Pause':t.status==='paused'?'Continue':t.mode==='focus'?'Begin focus':'Begin rest'}</span>`;
  $('[data-mode="focus"]').setAttribute('aria-pressed',t.mode==='focus');
  $('[data-mode="break"]').setAttribute('aria-pressed',t.mode==='break');
  $('#session-status').textContent=running?(t.mode==='focus'?'Just this moment. Just this task.':'Breathe out. You’ve made some space.'):t.status==='paused'?'A pause is part of the practice.':t.mode==='break'?'A little rest helps you return.':'Settle in. There’s no rush.';
  $('#focus-mode').setAttribute('aria-pressed',state.focusMode);
  $('#app').classList.toggle('focus-running',running);
  const progress=todayProgress(state);
  if(progress.completed!==lastBlossoms){$('#blossoms').innerHTML=blossomMarkup(progress.completed);lastBlossoms=progress.completed;}
  document.title=t.status==='idle'?'Yin and Yang — A quiet place to focus':`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')} · ${t.mode==='focus'?'Focus':'Rest'} — Yin and Yang`;
}
function checkCompletion(){const h=settle(state);if(h){persist();render();if(h.mode==='focus'){toast('A session complete. A little blossom earned.');announce('Focus session complete. Your break is ready.');}else{toast('Welcome back. Your next focus session is ready.');announce('Break complete. Your focus timer is ready.');}if(activePanel==='progress')refreshPanel();wake();}return h;}
function action(fn){checkCompletion();fn();persist();render();wake();if(activePanel==='pagoda')refreshPanel();}
$('#toggle-timer').onclick=()=>action(()=>{startPause(state);announce(state.timer.status==='running'?`${state.timer.mode} timer started.`:'Timer paused.');});
$('#reset-timer').onclick=()=>action(()=>{
  if(state.timer.id){record(state,'skipped');toast('Timer reset. The unfinished session was marked skipped.');}
  reset(state);
});
$('#skip-timer').onclick=()=>action(()=>{const started=!!state.timer.id;record(state,'skipped');reset(state,state.timer.mode==='focus'?'break':'focus');toast(started?'Session skipped. It won’t count as completed.':`${state.timer.mode==='focus'?'Focus':'Rest'} timer ready.`);});
document.querySelectorAll('[data-mode]').forEach(el=>el.onclick=()=>{if(el.dataset.mode===state.timer.mode)return;action(()=>{if(state.timer.id){record(state,'skipped');toast('Unfinished session marked skipped.');}reset(state,el.dataset.mode);});});
$('#current-task').onclick=()=>openTaskEditor(focusedTask()?.id,$('#current-task'));
$('#sidebar-add-task').onclick=()=>openTaskEditor(null,$('#sidebar-add-task'));
$('#sidebar-calendar').onclick=()=>toggleCalendar($('#sidebar-calendar'));
$('#close-calendar').onclick=()=>closeCalendar();
$('#close-task-sidebar').onclick=()=>{setTaskSidebar(false);taskToggle.focus();};
document.querySelectorAll('[data-panel]').forEach(el=>el.onclick=()=>{
  if(el===taskToggle){
    if(!desktopTasks.matches&&!calendarPanel.hidden){closeCalendar();setTaskSidebar(true);taskToggle.focus();}
    else setTaskSidebar(taskSidebar.hidden);
    return;
  }
  if(el===calendarToggle){toggleCalendar(el);return;}
  if(activePanel===el.dataset.panel)closePanel();else openPanel(el.dataset.panel,el);
});
$('#focus-mode').onclick=()=>{state.focusMode=!state.focusMode;persist();render();wake();toast(state.focusMode?'Focus mode on. Controls fade after a quiet moment.':'Focus mode off.');};
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Use your browser’s fullscreen option to fill the screen.');}catch{toast('Fullscreen is unavailable here. Open in your browser and use F11.');}}
$('#fullscreen').onclick=fullscreen;
document.addEventListener('fullscreenchange',()=>{const full=!!document.fullscreenElement;$('#fullscreen').innerHTML=icon(full?'collapse':'expand');$('#fullscreen').setAttribute('aria-label',full?'Exit fullscreen':'Enter fullscreen');$('#fullscreen').title=full?'Exit fullscreen':'Enter fullscreen';});

function wake(){clearTimeout(idleTimeout);$('#app').classList.remove('is-idle');if(state.focusMode&&state.timer.status==='running'&&!activePanel&&calendarPanel.hidden&&taskMenu.hidden)idleTimeout=setTimeout(()=>$('#app').classList.add('is-idle'),6500);}
for(const event of ['pointermove','pointerdown','keydown','focusin'])document.addEventListener(event,wake,{passive:true});
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
  const ordered=[...state.tasks].sort((a,b)=>Number(Boolean(b.priority))-Number(Boolean(a.priority)));
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
function openTaskEditor(id,anchor,schedule=false){
  editingTaskId=id??null;
  schedulingTask=schedule;
  if(calendarPanel.hidden||desktopTasks.matches)setTaskSidebar(true);
  openPanel('task-editor',anchor);
  if(schedule)$('#task-date').focus();
}
function taskEditor(){
  const task=state.tasks.find(item=>item.id===editingTaskId);
  const options=Object.entries(taskFrequencies).map(([value,label])=>`<option value="${value}" ${task?.repeat===value?'selected':''}>${label}</option>`).join('');
  const date=task?.date||(schedulingTask?dayKey():'');
  const time=task?.time||(schedulingTask?'09:00':'');
  return `${header('TASK DETAILS',schedulingTask?'Schedule task':task?'Edit task':'Add task')}
    <form id="task-editor-form">
      <label class="field-label" for="task-title">Task name</label>
      <input id="task-title" name="title" value="${escape(task?.text)}" maxlength="160" required>
      <label class="field-label" for="task-description">Description</label>
      <textarea id="task-description" name="description" rows="3" maxlength="2000" placeholder="Anything you want to remember">${escape(task?.description)}</textarea>
      <div class="task-editor-grid">
        <div><label class="field-label" for="task-date">Date</label><input id="task-date" name="date" type="date" value="${escape(date)}" ${schedulingTask?'required':''}></div>
        <div><label class="field-label" for="task-time">Time</label><input id="task-time" name="time" type="time" value="${escape(time)}" ${schedulingTask?'required':''}></div>
        <div><label class="field-label" for="task-estimate">Estimate (min)</label><input id="task-estimate" name="estimate" type="number" min="1" max="1440" step="1" value="${task?.estimate??''}" placeholder="60"></div>
        <div><label class="field-label" for="task-repeat">Repeat</label><select id="task-repeat" name="repeat">${options}</select></div>
      </div>
      <p class="panel-subtle">Set a date and time to show this task in the calendar. An empty estimate gives it a one-hour block.</p>
      <div class="panel-actions"><button class="panel-primary" type="submit">Save task</button>${task?'<button type="button" class="text-button" id="delete-task">Delete task</button>':''}</div>
    </form>`;
}
function panelContent(id){
  if(id==='pagoda')return `${header('TIMER SETTINGS','Find your rhythm.')}<p>A little structure. A lot of space.</p><form id="timer-settings"><div class="duration-fields"><div><label class="field-label" for="focus-minutes">Focus</label><div class="minute-field"><input id="focus-minutes" name="focus" maxlength="6" value="${formatDuration(duration(state,'focus'))}" required></div></div><div><label class="field-label" for="break-minutes">Rest</label><div class="minute-field"><input id="break-minutes" name="break" maxlength="6" value="${formatDuration(duration(state,'break'))}" required></div></div></div><label class="field-label" for="intention">What are you making space for?</label><input id="intention" name="intention" value="${escape(state.intention)}" placeholder="e.g. Understand a little more" maxlength="160"><p class="panel-subtle">${state.timer.id?'New durations apply to your next session.':'Choose a pace that works for you.'}</p><div class="panel-actions"><button class="panel-primary" type="submit">Save rhythm</button><button type="button" class="text-button" id="panel-timer-toggle">${state.timer.status==='running'?'Pause timer':state.timer.status==='paused'?'Continue timer':'Start timer'}</button></div></form><div class="panel-rule"></div><p class="panel-subtle">Sessions finish when time runs out. Rest starts when you’re ready. Resetting or changing an unfinished session marks it as skipped.</p>`;
  if(id==='task-editor')return taskEditor();
  if(id==='notes')return `${header('QUICK NOTES','Leave it here.')}<p>A thought for later. A little less to carry now.</p><label class="field-label" for="notes-input">Your wandering thoughts</label><textarea id="notes-input" placeholder="Write it down, then come back to the moment…" rows="7" maxlength="20000">${escape(state.notes)}</textarea><p class="panel-subtle" id="notes-saved">Saved as you type, on this device.</p><div class="panel-actions"><span class="panel-subtle">Only for you.</span><button class="text-button" id="clear-notes">Clear notes</button></div>`;
  if(id==='progress'){
    const p=todayProgress(state);return `${header('TODAY','Small things grow.')}<p>${new Date().toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}</p><div class="progress-numbers"><div><strong>${p.completed}</strong><span>completed sessions</span></div><div><strong>${p.minutes}</strong><span>focus minutes</span></div></div><p class="panel-subtle">Each completed focus session adds a blossom.<br>Skipped sessions are recorded separately.</p><div class="panel-rule"></div>${p.items.length?`<ul class="history-list">${[...p.items].reverse().map(h=>`<li><span>${escape(h.intention||'A moment of focus')}<br><time>${new Date(h.finishedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})} · ${Math.floor(h.focusMs/60000)} min</time></span><span class="outcome ${h.outcome==='skipped'?'skipped':''}">${h.outcome==='completed'?'Completed':'Skipped'}</span></li>`).join('')}</ul>`:'<div class="empty-state">No need to hurry.<br>The first blossom will come.</div>'}<p class="panel-subtle">${p.skipped} skipped today · A new day is a fresh garden.</p>`;
  }
  return `${header('BY THE LAKE','Your own soundtrack.')}<p>Bring a favorite Spotify playlist into the garden.</p><label class="field-label" for="spotify-link">Spotify playlist, album, or track link</label><form id="spotify-form" class="music-link"><input id="spotify-link" type="url" value="${escape(state.spotify)}" placeholder="https://open.spotify.com/playlist/…" required><button class="panel-primary" type="submit">Load</button></form><div id="music-player-wrap"></div><p id="spotify-error" role="status" class="panel-subtle"></p><div class="panel-actions"><a class="panel-primary" href="https://open.spotify.com/" target="_blank" rel="noopener noreferrer">Open Spotify ${icon('external')}</a><button class="text-button" id="remove-player" ${state.spotify?'':'hidden'}>Remove player</button></div><p class="music-tip">Spotify controls playback and volume in the player or its app. Playback may require sign-in. Closing this panel keeps an embedded player loaded.</p><p class="panel-subtle">This garden is silent. Music playing elsewhere stays in your hands.</p>`;
}
function positionPanel(panel,anchor){
  if(!anchor)return;
  if(panel.classList.contains('task-editor'))return;
  const r=anchor.getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight,W=window.innerWidth,H=window.innerHeight;
  let x=r.left+r.width/2-w/2,y=r.top-h+15;
  if(anchor.classList.contains('world-object')) y=r.top-h-22;
  if(y<16)y=r.bottom-15;
  panel.style.left=`${Math.max(14,Math.min(x,W-w-14))}px`;
  panel.style.top=`${Math.max(16,Math.min(y,H-h-16))}px`;
}
function visiblePanel(){return root.querySelector('.panel:not(.music-hidden)');}
function openPanel(id,anchor){
  closePanel(false);activePanel=id;lastAnchor=anchor;anchor?.setAttribute('aria-expanded','true');
  let panel=root.querySelector('#music-panel');
  if(id==='music'&&panel){panel.classList.remove('music-hidden');panel.setAttribute('aria-hidden','false');panel.querySelector('h2').id='panel-title';panel.setAttribute('aria-labelledby','panel-title');panel.inert=false;}
  else{panel=document.createElement('section');panel.className=id==='task-editor'?'panel task-editor':'panel';if(id==='music')panel.id='music-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','panel-title');panel.innerHTML=panelContent(id);root.appendChild(panel);if(id==='music')mountSpotify();}
  positionPanel(panel,anchor);wake();
  (panel.querySelector('input,textarea')||panel.querySelector('button')).focus({preventScroll:true});
}
function closePanel(restore=true){
  const p=visiblePanel();if(p){if(p.id==='music-panel'){p.classList.add('music-hidden');p.setAttribute('aria-hidden','true');p.inert=true;p.querySelector('h2').id='music-hidden-title';p.setAttribute('aria-labelledby','music-hidden-title');}else p.remove();}
  if(lastAnchor){lastAnchor.setAttribute('aria-expanded','false');if(restore)lastAnchor.focus({preventScroll:true});}
  activePanel=null;wake();
}
function refreshPanel(){if(!activePanel||activePanel==='music')return;const p=visiblePanel();if(p){const focusId=p.contains(document.activeElement)?document.activeElement.id:null;p.innerHTML=panelContent(activePanel);positionPanel(p,lastAnchor);if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});}}
function refreshTasks(){renderTasks();if(!calendarPanel.hidden)renderCalendar();render();}
function availableTaskId(){return state.tasks.find(task=>taskStatus(task)==='todo')?.id??null;}

function renderCalendar(){
  const days=weekDays(calendarDate);
  const today=dayKey();
  const shortDate=date=>date.toLocaleDateString([],{month:'short',day:'numeric'});
  const lastDay=days.at(-1);
  $('#calendar-range').textContent=`${shortDate(days[0])} – ${shortDate(lastDay)}, ${lastDay.getFullYear()}`;
  const headers=days.map(date=>`<div class="calendar-date${dayKey(date)===today?' calendar-today':''}"><span>${date.toLocaleDateString([],{weekday:'short'})}</span><strong>${date.getDate()}</strong></div>`).join('');
  const hours=Array.from({length:24},(_,hour)=>`<div>${timeLabel(hour*60)}</div>`).join('');
  const columns=days.map(date=>{
    const blocks=calendarBlocks(state.tasks,date).map(({task,start,end,lane,lanes,continues,occurrence})=>{
      const time=`${timeLabel(start)} – ${timeLabel(end)}`;
      const title=`${task.text}, ${date.toLocaleDateString([],{weekday:'long'})}, ${time}${continues?', continued from the previous day':''}`;
      const done=taskStatus(task,new Date(`${occurrence}T00:00:00`))==='done';
      return `<button type="button" draggable="true" class="calendar-block${task.priority?' calendar-priority':''}${done?' calendar-done':''}" data-task="${escape(task.id)}" aria-label="Edit ${escape(title)}${done?', done':''}" aria-haspopup="dialog" title="${escape(title)}" style="--start:${start};--length:${end-start};--lane:${lane};--lanes:${lanes}"><strong>${escape(task.text)}</strong><span>${escape(time)}</span></button>`;
    }).join('');
    return `<div class="calendar-day" data-date="${dayKey(date)}" aria-label="${date.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}">${blocks}</div>`;
  }).join('');
  $('#calendar-grid').innerHTML=`<div class="calendar-days"><div class="calendar-corner"></div>${headers}</div><div class="calendar-week"><div class="calendar-hours" aria-hidden="true">${hours}</div>${columns}</div>`;
  const trayScroll=calendarTray.scrollLeft;
  calendarTray.hidden=!state.tasks.length;
  calendarTray.innerHTML=state.tasks.map(task=>`<button type="button" draggable="true" class="calendar-tray-task" data-task="${escape(task.id)}" aria-label="Schedule ${escape(task.text)}" aria-haspopup="dialog">${escape(task.text)}</button>`).join('');
  calendarTray.scrollLeft=trayScroll;
}

function scrollCalendarTo(date=dayKey(),minute=8*60){
  const column=calendarPanel.querySelector(`[data-date="${CSS.escape(date)}"]`);
  if(column)calendarScroll.scrollLeft=Math.max(0,column.offsetLeft-52);
  const day=calendarPanel.querySelector('.calendar-day');
  calendarScroll.scrollTop=day.offsetHeight*minute/1440;
}

function openCalendar(anchor){
  closePanel(false);
  closeTaskMenu(false);
  if(calendarPanel.hidden)reopenTasksAfterCalendar=!desktopTasks.matches&&!taskSidebar.hidden;
  calendarAnchor=anchor;
  setTaskSidebar(desktopTasks.matches);
  calendarPanel.hidden=false;
  calendarToggle.setAttribute('aria-expanded','true');
  $('#sidebar-calendar').setAttribute('aria-expanded','true');
  renderCalendar();
  scrollCalendarTo();
  $('#close-calendar').focus({preventScroll:true});
  wake();
}

function closeCalendar(){
  closeTaskMenu(false);
  calendarPanel.hidden=true;
  if(reopenTasksAfterCalendar&&!desktopTasks.matches)setTaskSidebar(true);
  calendarToggle.setAttribute('aria-expanded','false');
  $('#sidebar-calendar').setAttribute('aria-expanded','false');
  const anchor=calendarAnchor?.getClientRects().length?calendarAnchor:calendarToggle;
  anchor.focus({preventScroll:true});
  wake();
}

function toggleCalendar(anchor){
  if(calendarPanel.hidden)openCalendar(anchor);else closeCalendar();
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
  const status=taskStatus(task);
  const actions=[['edit','Edit task'],['priority',task.priority?'Remove priority':'Prioritize'],['schedule',task.date&&task.time?'Reschedule…':'Schedule…']];
  if(status==='todo')actions.push(['focus',state.activeTask===id?'Clear focus':'Focus on this']);
  if(status!=='upcoming')actions.push(['complete',status==='done'?'Reopen task':'Mark done']);
  if(task.date&&task.time)actions.push(['unschedule','Remove from calendar']);
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
  state.tasks=state.tasks.filter(task=>task.id!==id);
  if(state.activeTask===id)state.activeTask=availableTaskId();
  persist();refreshTasks();
  const focus=!calendarPanel.hidden&&!desktopTasks.matches?$('#close-calendar'):taskSidebar.hidden?taskToggle:$('#sidebar-add-task');
  focus.focus({preventScroll:true});
  announce('Task deleted.');
}

taskMenu.addEventListener('click',event=>{
  const action=event.target.closest('[data-task-action]')?.dataset.taskAction;
  const task=state.tasks.find(item=>item.id===menuTaskId);
  if(!action||!task)return;
  const anchor=menuAnchor;
  closeTaskMenu(false);
  if(action==='edit'||action==='schedule'){
    openTaskEditor(task.id,anchor,action==='schedule');
    return;
  }
  if(action==='delete'){deleteTask(task.id);return;}
  if(action==='priority')task.priority=!task.priority;
  if(action==='focus')state.activeTask=state.activeTask===task.id?null:task.id;
  if(action==='complete'){
    completeTask(task,taskStatus(task)!=='done');
    if(state.activeTask===task.id&&taskStatus(task)==='done')state.activeTask=availableTaskId();
  }
  if(action==='unschedule')task.time='';
  persist();refreshTasks();
  const block=calendarPanel.querySelector(`[data-task="${CSS.escape(task.id)}"]`);
  const next=anchor.classList.contains('calendar-block')?block||$('#close-calendar'):taskButton(task.id);
  (next||taskToggle).focus({preventScroll:true});
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
    event.dataTransfer.setData(calendarDragType,card.dataset.task);
    event.dataTransfer.effectAllowed='move';
    dragOffset=card.classList.contains('calendar-block')?event.clientY-card.getBoundingClientRect().top:0;
    card.classList.add('task-dragging');
  });
}

function clearDropTarget(){
  $('.calendar-drop-target')?.classList.remove('calendar-drop-target');
}

function dropMinute(event,column){
  const bounds=column.getBoundingClientRect();
  return Math.min(1425,Math.max(0,Math.floor((event.clientY-bounds.top-dragOffset)/bounds.height*96)*15));
}

calendarPanel.addEventListener('dragover',event=>{
  const column=event.target.closest('.calendar-day');
  if(!column||!event.dataTransfer?.types.includes(calendarDragType))return;
  event.preventDefault();
  event.dataTransfer.dropEffect='move';
  if(!column.classList.contains('calendar-drop-target'))clearDropTarget();
  column.classList.add('calendar-drop-target');
  column.style.setProperty('--drop-minute',dropMinute(event,column));
});
calendarPanel.addEventListener('dragleave',event=>{
  const column=event.target.closest('.calendar-day');
  if(column&&!column.contains(event.relatedTarget))clearDropTarget();
});
document.addEventListener('dragend',()=>{dragOffset=0;clearDropTarget();$('.task-dragging')?.classList.remove('task-dragging');});
calendarPanel.addEventListener('drop',event=>{
  const column=event.target.closest('.calendar-day');
  if(!column||!event.dataTransfer?.types.includes(calendarDragType))return;
  event.preventDefault();clearDropTarget();
  $('.task-dragging')?.classList.remove('task-dragging');
  const task=state.tasks.find(item=>item.id===event.dataTransfer.getData(calendarDragType));
  if(!task)return;
  const weekday=new Date(`${column.dataset.date}T00:00:00`).getDay();
  if(task.repeat==='weekdays'&&(weekday===0||weekday===6)){
    toast('This task repeats on weekdays. Choose a weekday.');return;
  }
  const minute=dropMinute(event,column);
  dragOffset=0;
  scheduleTask(task,column.dataset.date,minute);
  if(state.activeTask===task.id&&taskStatus(task)!=='todo')state.activeTask=availableTaskId();
  persist();refreshTasks();
  announce(`Task scheduled for ${timeLabel(minute)}.`);
});
calendarPanel.addEventListener('click',event=>{
  const week=event.target.closest('[data-week]')?.dataset.week;
  if(week){
    calendarDate=week==='today'?new Date():shiftDay(calendarDate,week==='next'?7:-7);
    renderCalendar();
    if(week==='today')scrollCalendarTo();
    return;
  }
  const block=event.target.closest('.calendar-block');
  if(block){openTaskEditor(block.dataset.task,block);return;}
  const trayTask=event.target.closest('.calendar-tray-task');
  if(trayTask)openTaskEditor(trayTask.dataset.task,trayTask,true);
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
  completeTask(task,checkbox.checked);
  if(checkbox.checked&&state.activeTask===task.id)state.activeTask=availableTaskId();
  persist();refreshTasks();
  taskSidebar.querySelector(`[data-task="${CSS.escape(task.id)}"] .task-check`)?.focus();
  announce(checkbox.checked?'Task completed.':'Task reopened.');
});
function spotifyPath(link){try{const u=new URL(link);if(u.protocol!=='https:'||u.hostname!=='open.spotify.com')return null;return u.pathname.match(/^\/(?:intl-[a-z]+\/)?(playlist|album|track)\/([a-zA-Z0-9]{10,40})\/?$/)?.slice(1).join('/')||null;}catch{return null;}}
function mountSpotify(){const wrap=$('#music-player-wrap');if(!wrap)return;const p=spotifyPath(state.spotify);if(!p)return;wrap.innerHTML=`<iframe class="spotify-embed" title="Spotify player" src="https://open.spotify.com/embed/${p}?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;}

root.addEventListener('click',e=>{
  const btn=e.target.closest('button');if(!btn)return;
  if(btn.classList.contains('close-panel'))closePanel();
  if(btn.id==='panel-timer-toggle')$('#toggle-timer').click();
  if(btn.id==='clear-notes'){const previous=state.notes;if(!previous)return;state.notes='';$('#notes-input').value='';persist();toast('Notes cleared.');$('#notes-input').focus();}
  if(btn.id==='remove-player'){state.spotify='';$('#music-player-wrap').innerHTML='';$('#spotify-link').value='';btn.hidden=true;persist();toast('Spotify player removed.');}
  if(btn.id==='delete-task'){
    closePanel(false);deleteTask(editingTaskId);
  }
});
root.addEventListener('input',e=>{
  if(e.target.id==='focus-minutes'||e.target.id==='break-minutes')e.target.setCustomValidity('');
  if(e.target.id==='notes-input'){state.notes=e.target.value;persist();}
  if(e.target.id==='intention'){state.intention=e.target.value;persist();render();}
  if(e.target.id==='task-title')e.target.setCustomValidity('');
  if(e.target.id==='task-date'||e.target.id==='task-repeat')$('#task-date').setCustomValidity('');
});
root.addEventListener('submit',e=>{
  e.preventDefault();
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
    const text=fields.get('title').trim();
    if(!text){const title=$('#task-title');title.setCustomValidity('Enter a task name.');title.reportValidity();return;}
    const existing=state.tasks.find(task=>task.id===editingTaskId);
    const wasDone=existing && taskStatus(existing)==='done';
    const repeat=fields.get('repeat');
    const task={
      id:existing?.id??crypto.randomUUID(), text,
      description:fields.get('description').trim(),
      date:fields.get('date')||(repeat==='none'?'':dayKey()),
      time:fields.get('time'), estimate:Number(fields.get('estimate'))||null, repeat,
      priority:existing?.priority??false,
      done:repeat==='none'&&Boolean(wasDone),
      completedOn:repeat!=='none'&&wasDone?dayKey():''
    };
    if(schedulingTask&&task.repeat==='weekdays'){
      const weekday=new Date(`${task.date}T00:00:00`).getDay();
      if(weekday===0||weekday===6){
        const dateInput=$('#task-date');
        dateInput.setCustomValidity('Choose a weekday for this repeating task.');
        dateInput.reportValidity();
        return;
      }
    }
    if(existing)Object.assign(existing,task);else state.tasks.push(task);
    const status=taskStatus(task);
    if(state.activeTask===task.id && status!=='todo')state.activeTask=availableTaskId();
    if(!focusedTask() && status==='todo')state.activeTask=task.id;
    closePanel(false);persist();refreshTasks();
    if(schedulingTask&&task.date&&task.time){
      calendarDate=new Date(`${task.date}T00:00:00`);
      openCalendar(calendarToggle);
      const [hour,minute]=task.time.split(':').map(Number);
      scrollCalendarTo(task.date,Math.max(0,hour*60+minute-60));
      announce('Task scheduled.');
      return;
    }
    if(status==='upcoming')$('.task-upcoming').open=true;
    taskSidebar.querySelector(`[data-task="${CSS.escape(task.id)}"] .task-open`)?.focus();
    announce(existing?'Task updated.':'Task added.');
  }
  if(e.target.id==='spotify-form'){const link=$('#spotify-link').value.trim();if(!spotifyPath(link)){$('#spotify-error').textContent='Use a Spotify playlist, album, or track link from open.spotify.com.';return;}state.spotify=link;persist();mountSpotify();$('#spotify-error').textContent='Use the Spotify player to start your music.';$('#remove-player').hidden=false;positionPanel(visiblePanel(),lastAnchor);}
});
document.addEventListener('pointerdown',e=>{
  if(!taskMenu.hidden&&!e.target.closest('#task-menu'))closeTaskMenu(false);
  if(activePanel&&!e.target.closest('.panel')&&!e.target.closest('[data-panel]')&&!e.target.closest('#music-shortcut')&&!e.target.closest('#current-task'))closePanel(false);
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!taskMenu.hidden){e.preventDefault();closeTaskMenu();return;}
  if(e.key==='Escape'&&activePanel){e.preventDefault();closePanel();return;}
  if(e.key==='Escape'&&!calendarPanel.hidden){e.preventDefault();closeCalendar();return;}
  const p=visiblePanel();
  if(e.key==='Tab'&&p){const els=[...p.querySelectorAll('button:not(:disabled):not([hidden]),input,textarea,select,a[href],iframe')].filter(el=>el.offsetParent!==null);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  if(e.code==='Space'&&!activePanel&&!e.target.closest('button,a,input,textarea')){e.preventDefault();$('#toggle-timer').click();}
});
window.addEventListener('resize',()=>{const p=visiblePanel();if(p)positionPanel(p,lastAnchor);});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkCompletion();render();wake();}});
window.addEventListener('pageshow',()=>{checkCompletion();render();});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){state=loadState(storage);checkCompletion();refreshTasks();if(activePanel&&!visiblePanel()?.contains(document.activeElement))refreshPanel();}});
checkCompletion();render();wake();
setInterval(()=>{checkCompletion();render();},500);

const editDuration=$('#edit-duration'),durationForm=$('#duration-form'),typed=$('#typed-duration');
function readDuration(input){
  const ms=parseDuration(input.value);
  if(ms===null){
    input.setCustomValidity('Enter 0:01 to 180:00, or whole minutes.');
    input.reportValidity();
  }
  return ms;
}
function finishEdit(){durationForm.hidden=true;editDuration.hidden=false;editDuration.focus();}
editDuration.onclick=()=>{typed.value=formatDuration(duration(state));typed.setCustomValidity('');editDuration.hidden=true;durationForm.hidden=false;typed.focus();typed.select();};
$('#cancel-duration').onclick=finishEdit;
typed.oninput=()=>typed.setCustomValidity('');
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
  finishEdit();
  announce(`Timer set to ${formatDuration(ms)}.`);
};


const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
function environmentFrame(now){const t=state.timer;animateLandscape(now,t.mode==='break'?1:1-remaining(state)/t.total,motionPreference.matches);requestAnimationFrame(environmentFrame);}
requestAnimationFrame(environmentFrame);
