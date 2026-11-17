import {addTaskBlock,timeLabel,timeValue} from './calendar.js';

export function paintedCopies(state,source,slots,minutes){
  if(!Number.isInteger(minutes)||minutes<1||minutes>1440||!slots.length)return null;
  const seen=new Set(),placements=[];
  for(const {date,minute} of slots){
    const stamp=new Date(date+'T'+timeValue(minute));
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(minute)||minute<0||minute>=1440||!Number.isFinite(+stamp)||stamp.getHours()*60+stamp.getMinutes()!==minute)return null;
    const key=date+'/'+minute;
    if(!seen.has(key)){seen.add(key);placements.push({date,minute,start:+stamp});}
  }
  if(source.type==='task'){
    const task=state.tasks.find(t=>t.id===source.id&&!t.done);if(!task)return null;
    const copy={...task,blocks:[...(task.blocks||[])]};
    for(const p of placements)addTaskBlock(copy,p.date,timeValue(p.minute),minutes);
    return {tasks:state.tasks.map(t=>t===task?copy:t)};
  }
  const event=state.calendarEvents.find(e=>e.id===source.id&&!e.day);if(!event)return null;
  const {id,repeat,repeatEvery,excludedDays,start,end,...details}=event;
  return {calendarEvents:[...state.calendarEvents,...placements.map(p=>({...details,manual:true,id:'manual:'+crypto.randomUUID(),start:p.start,end:p.start+minutes*60000}))]};
}

export function installBrush({button,grid,scroller,sources,canPaint,getState,commit,minuteAt,notify,initialDay}){
  const panel=document.createElement('div');panel.className='brush-bar';panel.hidden=true;
  button.closest('#calendar-toolbar').after(panel);
  panel.innerHTML=`<label>Paint copies of<select></select></label><label>Minutes<input type="number" min="1" max="1440"></label>
    <details><summary>Enter a slot</summary><input type="date" aria-label="Placement date"><input type="time" aria-label="Placement time" value="09:00"><button data-place>Add slot</button></details>
    <span role="status"></span><button data-undo>Undo last</button><button data-save>Place copies</button><button data-close>Cancel</button>`;
  const select=panel.querySelector('select'),length=panel.querySelector('[type=number]'),date=panel.querySelector('[type=date]'),time=panel.querySelector('[type=time]');
  const slots=new Map();let choices=[],pointer=null,lastPoint=null;
  function draw(){
    grid.querySelectorAll('.brush-ghost').forEach(n=>n.remove());
    for(const slot of slots.values()){
      const column=grid.querySelector('.calendar-day[data-date="'+slot.date+'"]');if(!column)continue;
      const ghost=document.createElement('div');ghost.className='brush-ghost';ghost.textContent=timeLabel(slot.minute);
      ghost.style.top=slot.minute/14.4+'%';ghost.style.height=Math.min(Number(length.value),1440-slot.minute)/14.4+'%';column.append(ghost);
    }
    panel.querySelector('[role=status]').textContent=slots.size?slots.size+' selected':'Click or drag over the timeline';
    panel.querySelector('[data-save]').disabled=panel.querySelector('[data-undo]').disabled=!slots.size;
  }
  function close(){panel.hidden=true;slots.clear();pointer=null;lastPoint=null;grid.classList.remove('brush-active');button.setAttribute('aria-expanded','false');draw();}
  button.onclick=()=>{
    if(!panel.hidden){close();return;}
    if(!canPaint()){notify('Open the planned day or week timeline to paint blocks.');return;}
    choices=sources();if(!choices.length){notify('Create a task or timed event to copy first.');return;}
    select.replaceChildren(...choices.map((c,i)=>new Option((c.type==='task'?'Task · ':'Event · ')+c.title,i)));
    length.value=choices[0].minutes;date.value=initialDay();panel.hidden=false;button.setAttribute('aria-expanded','true');grid.classList.add('brush-active');draw();select.focus();
  };
  select.onchange=()=>{length.value=choices[select.value].minutes;draw();};
  length.oninput=draw;
  function place(day,minute){
    const key=day+'/'+minute;if(slots.has(key))return;
    slots.set(key,{date:day,minute});draw();
  }
  function hit(x,y,drag){
    const column=document.elementFromPoint(x,y)?.closest('.calendar-day[data-date]');if(!column||!grid.contains(column))return;
    const minute=minuteAt({clientY:y},column),day=column.dataset.date;
    if(drag&&lastPoint?.day===day&&Math.abs(lastPoint.minute-minute)<Number(length.value))return;
    place(day,minute);lastPoint={day,minute};
  }
  scroller.addEventListener('pointerdown',e=>{
    if(panel.hidden||!e.isPrimary||e.button!==0||!e.target.closest('.calendar-day'))return;
    e.preventDefault();e.stopImmediatePropagation();pointer=e.pointerId;lastPoint=null;scroller.setPointerCapture(pointer);hit(e.clientX,e.clientY,false);
  },true);
  scroller.addEventListener('pointermove',e=>{if(pointer===e.pointerId){e.stopImmediatePropagation();hit(e.clientX,e.clientY,true);}},true);
  scroller.addEventListener('lostpointercapture',()=>{pointer=null;lastPoint=null;});
  scroller.addEventListener('click',e=>{if(!panel.hidden){e.preventDefault();e.stopImmediatePropagation();}},true);
  panel.onclick=e=>{
    if(e.target.closest('[data-close]')){close();button.focus();}
    if(e.target.closest('[data-undo]')){slots.delete([...slots.keys()].at(-1));draw();}
    if(e.target.closest('[data-place]')&&date.value&&time.value){const [h,m]=time.value.split(':').map(Number);place(date.value,h*60+m);}
    if(e.target.closest('[data-save]')){
      const changes=paintedCopies(getState(),choices[select.value],[...slots.values()],length.valueAsNumber);
      if(!changes){notify('Check the source, length, and placement times.');return;}
      if(commit(changes)){const n=slots.size;close();notify(n+' calendar copies placed.');button.focus();}
    }
  };
  new MutationObserver(()=>{if(!panel.hidden)draw();}).observe(grid,{childList:true});
  const navigation=new MutationObserver(()=>{if(!panel.hidden&&(!canPaint()||button.closest('[hidden]')))close();});
  navigation.observe(document.querySelector('#app'),{attributes:true,attributeFilter:['data-workspace']});
  navigation.observe(button.closest('#calendar-toolbar'),{attributes:true,attributeFilter:['hidden']});
  navigation.observe(scroller.parentElement,{attributes:true,attributeFilter:['hidden']});
  return close;
}
