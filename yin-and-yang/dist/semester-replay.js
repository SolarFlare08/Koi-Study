export function semesterFrames(history,from,through){
  return history.map((item,index)=>({item,index})).filter(({item})=>(!from||item.day>=from)&&(!through||item.day<=through))
    .sort((a,b)=>a.item.day.localeCompare(b.item.day)||a.index-b.index);
}

export function openSemesterReplay({history,from,through,paint,label}){
  const frames=semesterFrames(history,from,through);
  const dialog=document.createElement('dialog');dialog.className='workspace-dialog semester-replay';dialog.setAttribute('aria-label','Semester time-lapse');
  dialog.innerHTML=`<header><h2>Semester time-lapse</h2><button aria-label="Close">×</button></header>
    <div class="garden-scene-preview"></div><p aria-live="polite"></p><div class="companion-actions">
    <button data-back>Previous</button><button data-play>Play</button><button data-next>Next</button><small></small></div>`;
  document.body.append(dialog);dialog.showModal();
  const find=s=>dialog.querySelector(s);
  let step=0,clock=null;
  const prior=history.flatMap((item,i)=>from&&item.day<from?[i]:[]);
  function pause(){clearInterval(clock);clock=null;find('[data-play]').textContent=step===frames.length?'Replay':'Play';}
  function render(){
    const entry=frames[step-1];
    const scene=find('.garden-scene-preview');
    paint(scene,new Set([...prior,...frames.slice(0,step).map(f=>f.index)]));
    if(step&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      scene.firstElementChild?.animate([{opacity:.8},{opacity:1}],{duration:360,easing:'ease-out'});
    }
    find('p').textContent=entry?label(entry.item):frames.length?'The Garden before the first landmark in this period.':'No landmarks earned in this period.';
    find('small').textContent=step+' / '+frames.length;find('[data-back]').disabled=!step;
    find('[data-next]').disabled=step===frames.length;find('[data-play]').disabled=!frames.length;
    if(step===frames.length)pause();
  }
  function play(){
    if(step===frames.length){step=0;render();}
    find('[data-play]').textContent='Pause';
    clock=setInterval(()=>{step++;render();},Math.max(1100,Math.min(2200,18000/frames.length)));
  }
  find('header button').onclick=()=>dialog.close();dialog.onclose=()=>{pause();dialog.remove();};
  find('[data-play]').onclick=()=>clock?pause():play();
  find('[data-next]').onclick=()=>{pause();step++;render();};
  find('[data-back]').onclick=()=>{step--;pause();render();};
  render();if(frames.length&&!matchMedia('(prefers-reduced-motion: reduce)').matches)play();
}
