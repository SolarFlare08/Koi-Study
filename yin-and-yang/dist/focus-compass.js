import {remaining,todayProgress} from './state.js';

export function focusCompass(state,now=Date.now()){
  const t=state.timer,left=remaining(state,now),total=Math.max(1,t.total);
  const progress=t.status==='overtime'?1:Math.max(0,Math.min(1,1-left/total));
  const goal=Number.isInteger(state.settings.dailyFocusGoal)?state.settings.dailyFocusGoal:120;
  const today=todayProgress(state,new Date(now));
  return {progress,goal,today,ratio:Math.min(1,today.minutes/goal),
    endsAt:t.status==='running'?t.endAt:null,
    label:t.status==='overtime'?'Extra time · finish when ready':t.status==='paused'?'Paused · your place is saved':t.status==='running'?(t.mode==='focus'?'Focusing':'Resting'):'A little space to begin'};
}

export function installFocusCompass({getState,save,notify}){
  const root=document.querySelector('.sky');
  const meta=document.createElement('div');meta.className='focus-compass';
  meta.innerHTML=`<svg viewBox="0 0 32 32" aria-hidden="true"><circle class="compass-track" cx="16" cy="16" r="13"/><circle id="compass-progress" cx="16" cy="16" r="13" pathLength="100"/></svg><span id="compass-caption"></span><button type="button" id="compass-bell" title="Timer chimes" aria-label="Turn on timer chimes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Zm5 3h4"/><path class="bell-slash" d="m3 3 18 18"/></svg></button>`;
  root.querySelector('.timer-readout').after(meta);
  const goal=document.createElement('button');goal.type='button';goal.className='daily-focus-goal';goal.setAttribute('aria-haspopup','dialog');root.append(goal);
  const dialog=document.createElement('dialog');dialog.className='workspace-dialog focus-goal-dialog';dialog.setAttribute('aria-labelledby','daily-goal-title');
  dialog.innerHTML=`<form method="dialog"><header><div><small>YOUR DAILY RHYTHM</small><h2 id="daily-goal-title">Make room for focus.</h2></div><button value="cancel" formnovalidate aria-label="Close daily goal">×</button></header><p>Choose a gentle target. Only completed focus minutes count; skipped sessions stay separate.</p><label>Daily focus minutes<input name="minutes" type="number" min="5" max="720" step="5" required></label><div class="goal-presets"><button type="button" data-minutes="30">30 min</button><button type="button" data-minutes="60">1 hour</button><button type="button" data-minutes="120">2 hours</button></div><p id="daily-goal-summary"></p><button class="workspace-primary" value="save">Save goal</button></form>`;
  document.body.append(dialog);
  goal.onclick=()=>{dialog.querySelector('input').value=focusCompass(getState()).goal;dialog.showModal();};
  dialog.querySelectorAll('[data-minutes]').forEach(b=>b.onclick=()=>{dialog.querySelector('input').value=b.dataset.minutes;});
  dialog.querySelector('form').onsubmit=e=>{
    if(e.submitter?.value!=='save'){e.preventDefault();dialog.close();return;}
    e.preventDefault();const value=Number(dialog.querySelector('input').value);
    if(!Number.isInteger(value)||value<5||value>720)return;
    const state=getState(),old=state.settings.dailyFocusGoal;state.settings.dailyFocusGoal=value;
    if(save()){dialog.close();notify('Daily focus goal saved.');}else state.settings.dailyFocusGoal=old;
  };
  const bell=meta.querySelector('button');
  bell.onclick=()=>{
    const state=getState(),old={...state.sounds},on=(state.sounds.focus>0||state.sounds.break>0);
    if(on){state.sounds.focus=0;state.sounds.break=0;}
    else {state.sounds.focus=35;state.sounds.break=25;}
    if(!save())state.sounds=old;
    else notify(on?'Timer chimes off.':'Timer chimes on. Master mute and music mode still apply.');
  };
  const tools=root.querySelector('.session-tools');
  const toggle=document.createElement('button');toggle.type='button';toggle.className='session-tools-toggle';toggle.textContent='Session tools';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','session-tool-drawer');
  for(const id of ['resume-task','focus-bundle','focus-project-context','focus-linked-notes'])tools.prepend(document.getElementById(id));
  tools.id='session-tool-drawer';tools.before(toggle);tools.hidden=true;
  toggle.onclick=()=>{tools.hidden=!tools.hidden;toggle.setAttribute('aria-expanded',String(!tools.hidden));};
  function closeTools(){tools.hidden=true;toggle.setAttribute('aria-expanded','false');}
  document.addEventListener('pointerdown',event=>{if(!tools.hidden&&!tools.contains(event.target)&&!toggle.contains(event.target))closeTools();});
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!tools.hidden){event.stopPropagation();closeTools();toggle.focus();}});
  return {render(now=Date.now()){
    const state=getState(),data=focusCompass(state,now);
    meta.querySelector('#compass-progress').style.strokeDashoffset=100-data.progress*100;
    meta.querySelector('#compass-caption').textContent=data.endsAt?'Until '+new Date(data.endsAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit',hour12:true}):data.label;
    const on=(state.sounds.focus>0||state.sounds.break>0);
    bell.setAttribute('aria-pressed',String(on));bell.setAttribute('aria-label',on?'Turn off timer chimes':'Turn on timer chimes');
    goal.textContent=`${data.today.minutes} / ${data.goal} min today${data.ratio===1?' · Goal reached':''}`;
    goal.style.setProperty('--goal-progress',data.ratio*100+'%');
    dialog.querySelector('#daily-goal-summary').textContent=`Today: ${data.today.completed} completed sessions · ${data.today.skipped} skipped.`;
    // Completion/retry controls must remain discoverable when an outcome is pending.
    const urgent=['review-focus','finish-retry','review-retry'].some(id=>!document.getElementById(id)?.hidden);
    toggle.textContent=urgent?'Session tools · Review ready':'Session tools';
  }};
}
