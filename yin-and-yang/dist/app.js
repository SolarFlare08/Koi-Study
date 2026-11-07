import {STORAGE_KEY,loadState,remaining,startPause,reset,record,settle,todayProgress,duration} from './state.js';
import {renderLandscape,objects,blossomMarkup} from './landscape.js';

const $=s=>document.querySelector(s);
const icons={
  play:'<path d="m8 5 11 7-11 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',reset:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',skip:'<path d="m5 5 10 7-10 7zM19 5v14"/>',expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',collapse:'<path d="M3 8h5V3m8 0v5h5M8 21v-5H3m13 5v-5h5"/>',focus:'<path d="M9 3H5a2 2 0 0 0-2 2v4m12-6h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4"/><circle cx="12" cy="12" r="3"/>',music:'<path d="M9 18V5l12-2v13M9 9l12-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="16" rx="3" ry="3"/>',spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',external:'<path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||''}</svg>`;
function applyIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storage;
try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}};}
let state=loadState(storage),activePanel=null,lastAnchor=null,idleTimeout,toastTimeout,lastBlossoms=-1;
const root=$('#panel-root');
function persist(){try{storage.setItem(STORAGE_KEY,JSON.stringify(state));$('#saved-status').innerHTML='<span class="tiny-dot"></span>Saved on this device';}catch{$('#saved-status').textContent='Storage unavailable — keep this tab open';toast('Your browser could not save changes. Keep this tab open.');}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('visible'),4200);}
function announce(text){$('#announcer').textContent=text;}
$('#landscape').innerHTML=renderLandscape();
$('#objects').innerHTML=objects.map(o=>`<button class="world-object ${o.className}" data-panel="${o.id}" aria-label="${o.hint}" aria-haspopup="dialog" aria-expanded="false"><span class="object-art">${o.art}</span><span class="object-label">${o.label}<small>${o.hint}</small></span></button>`).join('');
applyIcons();

function render(){
  const ms=remaining(state),seconds=Math.ceil(ms/1000),mins=Math.floor(seconds/60),secs=seconds%60,t=state.timer;
  $('#countdown').innerHTML=`${String(mins).padStart(2,'0')}<span>:</span>${String(secs).padStart(2,'0')}`;
  $('#countdown').setAttribute('aria-label',`${mins} minutes ${secs} seconds of ${t.mode==='focus'?'focus':'rest'} remaining`);
  const clock=new Date();
  $('#wall-clock').textContent=clock.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  $('#wall-clock').dateTime=clock.toISOString();
  const task=state.tasks.find(v=>v.id===state.activeTask&&!v.done);
  $('#current-task').textContent=t.mode==='break'?'A little room to breathe.':(task?.text||state.intention||'One thing at a time.');
  $('#current-task').title=task?'Change active task':'Choose a task or set an intention';
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
$('#reset-timer').onclick=()=>action(()=>{if(state.timer.id){record(state,'skipped');toast('Timer reset. The unfinished session was marked skipped.');}reset(state);});
$('#skip-timer').onclick=()=>action(()=>{const started=!!state.timer.id;record(state,'skipped');reset(state,state.timer.mode==='focus'?'break':'focus');toast(started?'Session skipped. It won’t count as completed.':`${state.timer.mode==='focus'?'Focus':'Rest'} timer ready.`);});
document.querySelectorAll('[data-mode]').forEach(el=>el.onclick=()=>{if(el.dataset.mode===state.timer.mode)return;action(()=>{if(state.timer.id){record(state,'skipped');toast('Unfinished session marked skipped.');}reset(state,el.dataset.mode);});});
$('#current-task').onclick=()=>openPanel('tasks',$('[data-panel="tasks"]'));
$('#music-shortcut').onclick=()=>openPanel('music',$('[data-panel="music"]'));
document.querySelectorAll('[data-panel]').forEach(el=>el.onclick=()=>activePanel===el.dataset.panel?closePanel():openPanel(el.dataset.panel,el));
$('#show-areas').onclick=()=>{const enabled=$('#app').classList.toggle('show-areas');$('#show-areas').setAttribute('aria-pressed',enabled);};
$('#focus-mode').onclick=()=>{state.focusMode=!state.focusMode;persist();render();wake();toast(state.focusMode?'Focus mode on. Controls fade after a quiet moment.':'Focus mode off.');};
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Use your browser’s fullscreen option to fill the screen.');}catch{toast('Fullscreen is unavailable here. Open in your browser and use F11.');}}
$('#fullscreen').onclick=fullscreen;
document.addEventListener('fullscreenchange',()=>{const full=!!document.fullscreenElement;$('#fullscreen').innerHTML=icon(full?'collapse':'expand');$('#fullscreen').setAttribute('aria-label',full?'Exit fullscreen':'Enter fullscreen');$('#fullscreen').title=full?'Exit fullscreen':'Enter fullscreen';});

function wake(){clearTimeout(idleTimeout);$('#app').classList.remove('is-idle');if(state.focusMode&&state.timer.status==='running'&&!activePanel)idleTimeout=setTimeout(()=>$('#app').classList.add('is-idle'),6500);}
for(const event of ['pointermove','pointerdown','keydown','focusin'])document.addEventListener(event,wake,{passive:true});
function header(eyebrow,title){return `<div class="panel-header"><div><span class="eyebrow">${eyebrow}</span><h2 id="panel-title">${title}</h2></div><button class="icon-button close-panel" aria-label="Close panel">${icon('close')}</button></div>`;}
function taskList(){return state.tasks.length?`<ul class="task-list">${state.tasks.map(t=>`<li class="task-row ${t.done?'done':''}" data-task="${escape(t.id)}"><input type="checkbox" class="task-check" aria-label="Complete ${escape(t.text)}" ${t.done?'checked':''}><input class="task-text" aria-label="Edit task" value="${escape(t.text)}" maxlength="160"><button class="task-active" aria-label="Focus on ${escape(t.text)}" title="Make active task" aria-pressed="${state.activeTask===t.id}" ${t.done?'disabled':''}>${icon('target')}</button><button class="delete-task" aria-label="Delete ${escape(t.text)}">×</button></li>`).join('')}</ul>`:'<div class="empty-state">A clear path starts<br>with one small step.</div>';}
function panelContent(id){
  if(id==='pagoda')return `${header('THE PAVILION','Find your rhythm.')}<p>A little structure. A lot of space.</p><form id="timer-settings"><div class="duration-fields"><div><label class="field-label" for="focus-minutes">Focus</label><div class="minute-field"><input id="focus-minutes" name="focus" type="number" min="1" max="180" step="1" value="${state.settings.focus}" required><span>min</span></div></div><div><label class="field-label" for="break-minutes">Rest</label><div class="minute-field"><input id="break-minutes" name="break" type="number" min="1" max="180" step="1" value="${state.settings.break}" required><span>min</span></div></div></div><label class="field-label" for="intention">What are you making space for?</label><input id="intention" name="intention" value="${escape(state.intention)}" placeholder="e.g. Understand a little more" maxlength="160"><p class="panel-subtle">${state.timer.id?'New durations apply to your next session.':'Choose a pace that works for you.'}</p><div class="panel-actions"><button class="panel-primary" type="submit">Save rhythm</button><button type="button" class="text-button" id="panel-timer-toggle">${state.timer.status==='running'?'Pause timer':state.timer.status==='paused'?'Continue timer':'Start timer'}</button></div></form><div class="panel-rule"></div><p class="panel-subtle">Sessions finish when time runs out. Rest starts when you’re ready. Resetting or changing an unfinished session marks it as skipped.</p>`;
  if(id==='tasks')return `${header('THE STONE PATH','One step at a time.')}<p>Choose one thing. Give it your attention.</p><form id="add-task" class="task-add"><input id="new-task" aria-label="New task" placeholder="What’s your next small step?" maxlength="160" required><button type="submit" aria-label="Add task">+</button></form><div id="task-list-wrap">${taskList()}</div><p class="panel-subtle">${icon('target')} Select the circle beside a task to bring it into focus. Tap a task’s text to edit it.</p>`;
  if(id==='notes')return `${header('THE LANTERN','Leave it here.')}<p>A thought for later. A little less to carry now.</p><label class="field-label" for="notes-input">Your wandering thoughts</label><textarea id="notes-input" placeholder="Write it down, then come back to the moment…" rows="7" maxlength="20000">${escape(state.notes)}</textarea><p class="panel-subtle" id="notes-saved">Saved as you type, on this device.</p><div class="panel-actions"><span class="panel-subtle">Only for you.</span><button class="text-button" id="clear-notes">Clear notes</button></div>`;
  if(id==='progress'){
    const p=todayProgress(state);return `${header('THE GROWING TREE','Small things grow.')}<p>${new Date().toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}</p><div class="progress-numbers"><div><strong>${p.completed}</strong><span>completed sessions</span></div><div><strong>${p.minutes}</strong><span>focus minutes</span></div></div><p class="panel-subtle">Each completed focus session adds a blossom.<br>Skipped sessions are recorded separately.</p><div class="panel-rule"></div>${p.items.length?`<ul class="history-list">${[...p.items].reverse().map(h=>`<li><span>${escape(h.intention||'A moment of focus')}<br><time>${new Date(h.finishedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})} · ${Math.floor(h.focusMs/60000)} min</time></span><span class="outcome ${h.outcome==='skipped'?'skipped':''}">${h.outcome==='completed'?'Completed':'Skipped'}</span></li>`).join('')}</ul>`:'<div class="empty-state">No need to hurry.<br>The first blossom will come.</div>'}<p class="panel-subtle">${p.skipped} skipped today · A new day is a fresh garden.</p>`;
  }
  return `${header('BY THE LAKE','Your own soundtrack.')}<p>Bring a favorite Spotify playlist into the garden.</p><label class="field-label" for="spotify-link">Spotify playlist, album, or track link</label><form id="spotify-form" class="music-link"><input id="spotify-link" type="url" value="${escape(state.spotify)}" placeholder="https://open.spotify.com/playlist/…" required><button class="panel-primary" type="submit">Load</button></form><div id="music-player-wrap"></div><p id="spotify-error" role="status" class="panel-subtle"></p><div class="panel-actions"><a class="panel-primary" href="https://open.spotify.com/" target="_blank" rel="noopener noreferrer">Open Spotify ${icon('external')}</a><button class="text-button" id="remove-player" ${state.spotify?'':'hidden'}>Remove player</button></div><p class="music-tip">Spotify controls playback and volume in the player or its app. Playback may require sign-in. Closing this panel keeps an embedded player loaded.</p><p class="panel-subtle">This garden is silent. Music playing elsewhere stays in your hands.</p>`;
}
function positionPanel(panel,anchor){
  if(!anchor)return;
  const r=anchor.getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight,W=window.innerWidth,H=window.innerHeight;
  let x=r.left+r.width/2-w/2,y=r.top-h+15;
  if(W>600){if(r.left<W/3){x=r.right+8;y=r.top+15;}else if(r.left>W*.65){x=r.left-w+25;y=r.top+30;}}
  if(y<16)y=r.bottom-15;
  panel.style.left=`${Math.max(14,Math.min(x,W-w-14))}px`;
  panel.style.top=`${Math.max(16,Math.min(y,H-h-16))}px`;
}
function visiblePanel(){return root.querySelector('.panel:not(.music-hidden)');}
function openPanel(id,anchor){
  closePanel(false);activePanel=id;lastAnchor=anchor;anchor?.setAttribute('aria-expanded','true');
  let panel=root.querySelector('#music-panel');
  if(id==='music'&&panel){panel.classList.remove('music-hidden');panel.setAttribute('aria-hidden','false');panel.querySelector('h2').id='panel-title';panel.setAttribute('aria-labelledby','panel-title');panel.inert=false;}
  else{panel=document.createElement('section');panel.className='panel';if(id==='music')panel.id='music-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','panel-title');panel.innerHTML=panelContent(id);root.appendChild(panel);if(id==='music')mountSpotify();}
  positionPanel(panel,anchor);wake();
  (panel.querySelector('input,textarea')||panel.querySelector('button')).focus({preventScroll:true});
}
function closePanel(restore=true){
  const p=visiblePanel();if(p){if(p.id==='music-panel'){p.classList.add('music-hidden');p.setAttribute('aria-hidden','true');p.inert=true;p.querySelector('h2').id='music-hidden-title';p.setAttribute('aria-labelledby','music-hidden-title');}else p.remove();}
  if(lastAnchor){lastAnchor.setAttribute('aria-expanded','false');if(restore)lastAnchor.focus({preventScroll:true});}
  activePanel=null;wake();
}
function refreshPanel(){if(!activePanel||activePanel==='music')return;const p=visiblePanel();if(p){const focusId=p.contains(document.activeElement)?document.activeElement.id:null;p.innerHTML=panelContent(activePanel);positionPanel(p,lastAnchor);if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});}}
function refreshTasks(){const wrap=$('#task-list-wrap');if(wrap)wrap.innerHTML=taskList();render();positionPanel(visiblePanel(),lastAnchor);}
function spotifyPath(link){try{const u=new URL(link);if(u.protocol!=='https:'||u.hostname!=='open.spotify.com')return null;return u.pathname.match(/^\/(?:intl-[a-z]+\/)?(playlist|album|track)\/([a-zA-Z0-9]{10,40})\/?$/)?.slice(1).join('/')||null;}catch{return null;}}
function mountSpotify(){const wrap=$('#music-player-wrap');if(!wrap)return;const p=spotifyPath(state.spotify);if(!p)return;wrap.innerHTML=`<iframe class="spotify-embed" title="Spotify player" src="https://open.spotify.com/embed/${p}?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;}

root.addEventListener('click',e=>{
  const btn=e.target.closest('button');if(!btn)return;
  if(btn.classList.contains('close-panel'))closePanel();
  if(btn.id==='panel-timer-toggle')$('#toggle-timer').click();
  if(btn.id==='clear-notes'){const previous=state.notes;if(!previous)return;state.notes='';$('#notes-input').value='';persist();toast('Notes cleared.');$('#notes-input').focus();}
  if(btn.id==='remove-player'){state.spotify='';$('#music-player-wrap').innerHTML='';$('#spotify-link').value='';btn.hidden=true;persist();toast('Spotify player removed.');}
  const row=btn.closest('[data-task]');if(!row)return;
  if(btn.classList.contains('delete-task')){const index=state.tasks.findIndex(t=>t.id===row.dataset.task);state.tasks=state.tasks.filter(t=>t.id!==row.dataset.task);if(state.activeTask===row.dataset.task)state.activeTask=state.tasks.find(t=>!t.done)?.id||null;persist();refreshTasks();const rows=root.querySelectorAll('.task-row');(rows[Math.min(index,rows.length-1)]?.querySelector('.delete-task')||$('#new-task')).focus();}
  if(btn.classList.contains('task-active')){state.activeTask=row.dataset.task;persist();refreshTasks();root.querySelector(`[data-task="${state.activeTask}"] .task-active`)?.focus();}
});
root.addEventListener('input',e=>{
  if(e.target.id==='notes-input'){state.notes=e.target.value;persist();}
  if(e.target.id==='intention'){state.intention=e.target.value;persist();render();}
  if(e.target.classList.contains('task-text')){const task=state.tasks.find(t=>t.id===e.target.closest('[data-task]').dataset.task);if(task){task.text=e.target.value;persist();render();}}
});
root.addEventListener('change',e=>{
  if(e.target.classList.contains('task-check')){const task=state.tasks.find(t=>t.id===e.target.closest('[data-task]').dataset.task);if(task){task.done=e.target.checked;if(task.done&&state.activeTask===task.id)state.activeTask=state.tasks.find(t=>!t.done)?.id||null;persist();refreshTasks();root.querySelector(`[data-task="${task.id}"] .task-check`)?.focus();}}
});
root.addEventListener('submit',e=>{
  e.preventDefault();
  if(e.target.id==='timer-settings'){
    state.settings.focus=Number($('#focus-minutes').value);state.settings.break=Number($('#break-minutes').value);state.intention=$('#intention').value.trim();
    if(!state.timer.id)reset(state);
    persist();render();toast('Your rhythm is saved.');closePanel();
  }
  if(e.target.id==='add-task'){const input=$('#new-task'),text=input.value.trim();if(!text)return;const t={id:crypto.randomUUID(),text,done:false};state.tasks.push(t);if(!state.activeTask)state.activeTask=t.id;input.value='';persist();refreshTasks();input.focus();announce('Task added.');}
  if(e.target.id==='spotify-form'){const link=$('#spotify-link').value.trim();if(!spotifyPath(link)){$('#spotify-error').textContent='Use a Spotify playlist, album, or track link from open.spotify.com.';return;}state.spotify=link;persist();mountSpotify();$('#spotify-error').textContent='Use the Spotify player to start your music.';$('#remove-player').hidden=false;positionPanel(visiblePanel(),lastAnchor);}
});
document.addEventListener('pointerdown',e=>{if(activePanel&&!e.target.closest('.panel')&&!e.target.closest('[data-panel]')&&!e.target.closest('#music-shortcut')&&!e.target.closest('#current-task'))closePanel(false);});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&activePanel){e.preventDefault();closePanel();return;}
  const p=visiblePanel();
  if(e.key==='Tab'&&p){const els=[...p.querySelectorAll('button:not(:disabled):not([hidden]),input,textarea,a[href],iframe')].filter(el=>el.offsetParent!==null);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  if(e.code==='Space'&&!activePanel&&!e.target.closest('button,a,input,textarea')){e.preventDefault();$('#toggle-timer').click();}
});
window.addEventListener('resize',()=>{const p=visiblePanel();if(p)positionPanel(p,lastAnchor);});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkCompletion();render();wake();}});
window.addEventListener('pageshow',()=>{checkCompletion();render();});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){state=loadState(storage);checkCompletion();render();if(activePanel&&!visiblePanel()?.contains(document.activeElement))refreshPanel();}});
checkCompletion();render();wake();
setInterval(()=>{checkCompletion();render();},500);
