import {canExtendTimer,formatDuration,overtimeElapsed,remaining} from './state.js';
import {paintReference} from './focus-reference.js';
import {currentFocusPause} from './focus-replay.js';

export function installMiniTimer({launch,getState,taskTitle,reference,savePauseNote,toggle,extend,capture,notify}){
  let companion;
  function mount(win){
    companion=win;
    const doc=win.document;
    doc.title='Garden mini timer';
    const css=doc.createElement('link');
    css.rel='stylesheet';css.href=new URL('./mini-timer.css',location.href).href;
    doc.head.append(css);
    doc.body.innerHTML=`<main><header><span id="mode"></span><small id="status"></small></header>
      <output id="time" role="timer"></output><p id="task"></p>
      <nav><button id="toggle"></button><button id="extend">+5 min</button></nav>
      <aside id="mini-reference" aria-label="Pinned reference" hidden><div data-reference-text></div><img alt="Pinned diagram" hidden></aside>
      <details id="mini-pause-note" hidden><summary>Add pause note</summary><form id="pause-form"><label for="pause-text">Why did you pause?</label>
        <div><input id="pause-text" maxlength="240"><button>Save</button></div><small role="status"></small></form></details>
      <form id="capture-form"><label for="thought">Quick capture</label><div><input id="thought" required maxlength="4000" placeholder="Leave a thought…" autocomplete="off"><button>Save</button></div><small role="status"></small></form></main>`;
    const find=id=>doc.getElementById(id);
    const pausePanel=find('mini-pause-note'),pauseField=find('pause-text'),pauseForm=find('pause-form');
    let pause,pauseKey='';
    function paint(){
      const state=getState(),t=state.timer;
      find('mode').textContent=t.mode==='focus'?'Garden · Focus':'Garden · Rest';
      find('status').textContent={idle:'Ready',paused:'Paused',running:'In session',overtime:'Overtime'}[t.status];
      find('time').textContent=t.status==='overtime'?'+'+formatDuration(overtimeElapsed(t)):formatDuration(remaining(state));
      find('task').textContent=taskTitle()||'Open focus';
      find('toggle').textContent={running:'Pause',paused:'Continue',idle:'Start',overtime:'Finish overtime'}[t.status];
      find('extend').disabled=!canExtendTimer(state,300000);
      paintReference(find('mini-reference'),reference());
      pause=currentFocusPause(t);
      pausePanel.hidden=!pause;
      pausePanel.querySelector('summary').textContent=pause?.event.note?'Edit pause note':'Add pause note';
      const key=pause?pause.sessionId+':'+pause.index:'';
      if(key!==pauseKey){
        pauseKey=key;pausePanel.open=false;pauseField.value=pause?.event.note||'';
        pauseForm.querySelector('[role=status]').textContent='';
      }else if(pause&&!pausePanel.open)pauseField.value=pause.event.note||'';
    }
    find('toggle').onclick=()=>{toggle();paint();};
    find('extend').onclick=()=>{extend();paint();};
    pauseForm.onsubmit=event=>{
      event.preventDefault();
      if(savePauseNote(pause,pauseField.value)){pausePanel.open=false;paint();}
      else pauseForm.querySelector('[role=status]').textContent='Could not save this pause note.';
    };
    const captureForm=find('capture-form');
    captureForm.onsubmit=event=>{
      event.preventDefault();
      const field=find('thought');
      if(!field.value.trim())return;
      try{capture(field.value);field.value='';captureForm.querySelector('[role=status]').textContent='Saved to note inbox.';}
      catch{captureForm.querySelector('[role=status]').textContent='Could not save. Your thought is still here.';}
    };
    paint();
    const interval=win.setInterval(paint,500);
    win.addEventListener('pagehide',()=>{win.clearInterval(interval);if(companion===win)companion=null;},{once:true});
  }
  window.mountGardenMini=mount;
  window.addEventListener('pagehide',()=>companion?.close());
  launch.onclick=async()=>{
    if(companion&&!companion.closed){companion.focus();return;}
    if(location.hostname!=='yin-and-yang.local'&&window.documentPictureInPicture){
      try{mount(await documentPictureInPicture.requestWindow({width:372,height:325}));return;}catch{}
    }
    const popup=window.open('./mini-timer.html','garden-mini','popup,width=372,height=325');
    if(!popup)notify('Allow pop-ups for this site to open the mini timer.');
  };
}
