import {applyQuickTimerLength,canExtendTimer,dayKey,extendTimer,formatDuration,quickTimerLengths,timerProgress,todayProgress} from './state.js';

export function focusCompass(state,now=Date.now()){
  const t=state.timer,progress=timerProgress(state,now);
  const goal=Number.isInteger(state.settings.dailyFocusGoal)?state.settings.dailyFocusGoal:120;
  const today=todayProgress(state,new Date(now));
  return {progress,goal,today,ratio:Math.min(1,today.minutes/goal),
    endsAt:t.status==='running'?t.endAt:null,
    label:t.status==='overtime'?'Extra time · finish when ready':t.status==='paused'?'Paused · your place is saved':t.status==='running'?(t.mode==='focus'?'Focusing':'Resting'):'A little space to begin'};
}

export function focusWeek(state,now=Date.now()){
  const today=new Date(now);
  const days=Array.from({length:7},(_,index)=>{
    const date=new Date(today.getFullYear(),today.getMonth(),today.getDate()-6+index,12);
    const {minutes,completed,skipped}=todayProgress(state,date);
    return {date,key:dayKey(date),minutes,completed,skipped};
  });
  const {goal}=focusCompass(state,now);
  return {days,goal,total:days.reduce((sum,day)=>sum+day.minutes,0),met:days.filter(day=>day.minutes>=goal).length};
}

function timeDescription(minutes){
  const hours=Math.floor(minutes/60),rest=minutes%60;
  return hours?`${hours} h${rest?` ${rest} min`:''}`:`${rest} min`;
}

export function installFocusCompass({getState,save,notify,beforeTimerChange,afterTimerChange,onGoalChanged}){
  const root=document.querySelector('.sky');
  const meta=document.createElement('div');meta.className='focus-compass';
  meta.innerHTML=`<svg viewBox="0 0 32 32" aria-hidden="true"><circle class="compass-track" cx="16" cy="16" r="13"/><circle id="compass-progress" cx="16" cy="16" r="13" pathLength="100"/></svg><span id="compass-caption"></span><button type="button" id="compass-bell" title="Timer chimes" aria-label="Turn on timer chimes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Zm5 3h4"/><path class="bell-slash" d="m3 3 18 18"/></svg></button>`;
  root.querySelector('.timer-readout').after(meta);
  const goal=document.createElement('button');goal.type='button';goal.className='daily-focus-goal';goal.title='See seven days of focus and edit the daily goal';goal.setAttribute('aria-haspopup','dialog');root.append(goal);
  const dialog=document.createElement('dialog');dialog.className='workspace-dialog focus-goal-dialog';dialog.setAttribute('aria-labelledby','daily-goal-title');
  dialog.innerHTML=`<form method="dialog"><header><div><small>YOUR DAILY RHYTHM</small><h2 id="daily-goal-title">Focus this week</h2></div><button value="cancel" formnovalidate aria-label="Close focus week">×</button></header><section class="focus-week" aria-label="Last seven days"><p id="focus-week-summary"></p><div class="focus-week-bars" role="group" aria-label="Choose a day"></div><p class="focus-week-detail" aria-live="polite"></p></section><label>Daily focus goal (minutes)<input name="minutes" type="number" min="5" max="720" step="5" required></label><div class="goal-presets"><button type="button" data-minutes="30">30 min</button><button type="button" data-minutes="60">1 hour</button><button type="button" data-minutes="120">2 hours</button></div><button class="workspace-primary" value="save">Save goal</button></form>`;
  document.body.append(dialog);
  const bars=dialog.querySelector('.focus-week-bars'),detail=dialog.querySelector('.focus-week-detail');
  const shortDay=new Intl.DateTimeFormat(undefined,{weekday:'short'}),longDay=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'short',day:'numeric'});
  let selectedDay,weekSignature;
  function renderWeek(now){
    const week=focusWeek(getState(),now);
    const last=week.days.at(-1).key;
    if(!week.days.some(day=>day.key===selectedDay))selectedDay=last;
    const signature=JSON.stringify(week);
    if(signature!==weekSignature){
      weekSignature=signature;
      const focused=document.activeElement?.dataset.focusDay;
      dialog.querySelector('#focus-week-summary').textContent=`${timeDescription(week.total)} focused · ${week.met} of 7 days at your current goal`;
      const range=Math.max(week.goal,...week.days.map(day=>day.minutes));
      bars.replaceChildren(...week.days.map(day=>{
        const button=document.createElement('button');button.type='button';button.dataset.focusDay=day.key;
        button.setAttribute('aria-label',`${day.key===last?'Today':longDay.format(day.date)}: ${timeDescription(day.minutes)} focused`);
        button.innerHTML='<span class="focus-week-value"></span><span class="focus-week-track" aria-hidden="true"><i></i><b></b></span><span class="focus-week-day"></span>';
        button.querySelector('.focus-week-value').textContent=day.minutes?timeDescription(day.minutes):'–';
        button.querySelector('.focus-week-day').textContent=day.key===last?'Today':shortDay.format(day.date);
        button.style.setProperty('--week-focus',`${100*day.minutes/range}%`);
        button.style.setProperty('--week-target',`${100*week.goal/range}%`);
        button.dataset.goalMet=String(day.minutes>=week.goal);
        return button;
      }));
      if(focused)bars.querySelector(`[data-focus-day="${focused}"]`)?.focus({preventScroll:true});
    }
    const day=week.days.find(day=>day.key===selectedDay);
    for(const button of bars.children)button.setAttribute('aria-pressed',String(button.dataset.focusDay===selectedDay));
    const text=`${day.key===last?'Today':longDay.format(day.date)}: ${timeDescription(day.minutes)} focused · ${day.completed} completed · ${day.skipped} skipped`;
    if(detail.textContent!==text)detail.textContent=text;
  }
  bars.onclick=event=>{
    const day=event.target.closest('[data-focus-day]');
    if(day){selectedDay=day.dataset.focusDay;renderWeek(Date.now());}
  };
  function openGoal(){
    const now=Date.now();selectedDay=dayKey(new Date(now));dialog.querySelector('input').value=focusCompass(getState(),now).goal;
    renderWeek(now);dialog.showModal();
  }
  goal.onclick=openGoal;
  dialog.querySelectorAll('[data-minutes]').forEach(b=>b.onclick=()=>{dialog.querySelector('input').value=b.dataset.minutes;});
  dialog.querySelector('form').onsubmit=e=>{
    if(e.submitter?.value!=='save'){e.preventDefault();dialog.close();return;}
    e.preventDefault();const value=Number(dialog.querySelector('input').value);
    if(!Number.isInteger(value)||value<5||value>720)return;
    const state=getState(),old=state.settings.dailyFocusGoal;state.settings.dailyFocusGoal=value;
    if(save()){dialog.close();onGoalChanged?.();notify('Daily focus goal saved.');}else state.settings.dailyFocusGoal=old;
  };
  const bell=meta.querySelector('button');
  bell.onclick=()=>{
    const state=getState(),old={...state.sounds},on=(state.sounds.focus>0||state.sounds.break>0);
    if(on){state.sounds.focus=0;state.sounds.break=0;}
    else {state.sounds.focus=35;state.sounds.break=25;}
    if(!save())state.sounds=old;
    else notify(on?'Timer chimes off.':'Timer chimes on. Master mute and music mode still apply.');
  };
  const times=document.createElement('button');times.type='button';times.className='quick-timer-button';times.setAttribute('aria-haspopup','dialog');
  meta.append(times);
  const timerDialog=document.createElement('dialog');timerDialog.className='workspace-dialog focus-goal-dialog quick-timer-dialog';timerDialog.setAttribute('aria-labelledby','quick-timer-title');
  timerDialog.innerHTML=`<header><div><small>GARDEN TIMER</small><h2 id="quick-timer-title"></h2></div><form method="dialog"><button aria-label="Close timer lengths">×</button></form></header><p class="quick-timer-hint"></p><div class="quick-timer-options"></div>`;
  document.body.append(timerDialog);
  const options=timerDialog.querySelector('.quick-timer-options');
  let timerChoices,lastTimer;
  function renderTimes(state,now){
    const t=state.timer,ready=t.status==='idle',locked=Boolean(t.block||t.sequence||t.mistakeId);
    times.hidden=locked||!ready&&!canExtendTimer(state,60000,now);
    const buttonText=ready?'Quick times':'+ Time';
    if(times.textContent!==buttonText)times.textContent=buttonText;
    if(!timerDialog.open)return;
    if(times.hidden||lastTimer!==t){timerDialog.close();return;}
    const lengths=ready?quickTimerLengths(t.mode):[1,5,10].filter(mins=>canExtendTimer(state,mins*60000,now));
    const signature=lengths.join(',');
    if(timerChoices===signature)return;
    timerChoices=signature;
    timerDialog.querySelector('h2').textContent=ready?(t.mode==='focus'?'Choose a focus length':'Choose a rest length'):'Add a little time';
    timerDialog.querySelector('.quick-timer-hint').textContent=ready?(t.taskPlan||t.taskBreak?'This changes only the current phase. Reset returns to its planned length.':'Use one of these lengths, or click the countdown to type your own.'):'Keep the same session and task. Reset still uses your original length.';
    options.replaceChildren(...lengths.map(mins=>{
      const button=document.createElement('button');button.type='button';button.dataset.minutes=mins;
      button.textContent=`${ready?'':'+'}${mins} min`;
      if(ready&&t.total===mins*60000)button.classList.add('current-length');
      return button;
    }));
  }
  times.onclick=()=>{
    timerChoices=null;lastTimer=getState().timer;
    timerDialog.showModal();renderTimes(getState(),Date.now());options.firstElementChild?.focus();
  };
  options.onclick=event=>{
    const button=event.target.closest('[data-minutes]');
    if(!button)return;
    beforeTimerChange();
    const state=getState(),{settings,timer}=state,minutes=Number(button.dataset.minutes),ready=timer.status==='idle';
    if(timer!==lastTimer||!(ready?applyQuickTimerLength(state,minutes):extendTimer(state,minutes*60000))){timerDialog.close();return;}
    if(!save()){Object.assign(state,{settings,timer});return;}
    timerDialog.close();afterTimerChange();
    notify(ready?`Timer set to ${formatDuration(state.timer.total)}.`:`Added ${minutes} ${minutes===1?'minute':'minutes'} to this session.`);
  };
  const tools=root.querySelector('.session-tools');
  const toggle=document.createElement('button');toggle.type='button';toggle.className='session-tools-toggle';toggle.textContent='Session tools';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','session-tool-drawer');
  for(const id of ['resume-task','focus-bundle','focus-project-context','focus-linked-notes'])tools.prepend(document.getElementById(id));
  tools.id='session-tool-drawer';tools.before(toggle);tools.hidden=true;
  toggle.onclick=()=>{tools.hidden=!tools.hidden;toggle.setAttribute('aria-expanded',String(!tools.hidden));};
  function closeTools(){tools.hidden=true;toggle.setAttribute('aria-expanded','false');}
  document.addEventListener('pointerdown',event=>{if(!tools.hidden&&!tools.contains(event.target)&&!toggle.contains(event.target))closeTools();});
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!tools.hidden){event.stopPropagation();closeTools();toggle.focus();}});
  return {openGoal,render(now=Date.now()){
    const state=getState(),data=focusCompass(state,now);
    meta.querySelector('#compass-progress').style.strokeDashoffset=100-data.progress*100;
    meta.querySelector('#compass-caption').textContent=data.endsAt?'Until '+new Date(data.endsAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit',hour12:true}):data.label;
    const on=(state.sounds.focus>0||state.sounds.break>0);
    bell.setAttribute('aria-pressed',String(on));bell.setAttribute('aria-label',on?'Turn off timer chimes':'Turn on timer chimes');
    goal.textContent=`${data.today.minutes} / ${data.goal} min today${data.ratio===1?' · Goal reached':''}`;
    goal.style.setProperty('--goal-progress',data.ratio*100+'%');
    if(dialog.open)renderWeek(now);
    renderTimes(state,now);
    // Completion/retry controls must remain discoverable when an outcome is pending.
    const urgent=['review-focus','finish-retry','review-retry'].some(id=>!document.getElementById(id)?.hidden);
    toggle.textContent=urgent?'Session tools · Review ready':'Session tools';
  }};
}
