import {calendarBlocks,calendarTaskBlock,applyCalendarReplan,timeLabel,timeValue,openFocusBlock,allDayEvents} from './calendar.js';
import {dayKey} from './state.js';

const dateOf=day=>new Date(day+'T00:00:00');
function identify(block){
  return JSON.stringify(block.event?['event',block.event.id,block.event.start]:['task',block.task.id,block.blockId||'',block.occurrence]);
}
export function batchChoices(tasks,events,day){
  return calendarBlocks(tasks,dateOf(day),events).filter(b=>!b.continues&&(b.event?b.event.manual:openFocusBlock(b))).map(b=>{
    const slot=b.event||calendarTaskBlock(b.task,b.blockId,b.occurrence);
    const minutes=b.event?(slot.end-slot.start)/60000:slot.minutes;
    return {key:identify(b),title:b.event?.title||b.task.text,start:b.start,minutes,taskId:b.task?.id,blockId:b.blockId,eventId:b.event?.id};
  });
}
export function batchPreview(tasks,events,source,target,offset,rows){
  if(!target||!Number.isFinite(+dateOf(target))||!Number.isInteger(offset)||!rows.length)return {error:'Choose blocks, a destination day, and a shift in minutes.'};
  if(target===source&&!offset)return {error:'Choose a new day or shift the start times.'};
  const moved=new Set(rows.map(row=>row.key));
  const busy=calendarBlocks(tasks,dateOf(target),events).filter(block=>!moved.has(identify(block)));
  const allDay=allDayEvents(events,dateOf(target)).map(e=>e.title);
  const moves=[];
  for(const row of rows){
    const to=row.start+offset,end=to+row.minutes;
    if(to<0||end>1440)return {error:'Each moved block must fit within the destination day.'};
    const start=new Date(target+'T'+timeValue(to));
    if(start.getHours()*60+start.getMinutes()!==to)return {error:'A selected time is unavailable on that date.'};
    const conflicts=busy.filter(b=>b.start<end&&to<b.end).map(b=>b.event?.title||b.task.text);
    for(const other of rows){
      if(other.key!==row.key&&other.start+offset<end&&to<other.start+offset+other.minutes)conflicts.push(other.title);
    }
    moves.push({...row,to,startAt:+start,conflicts:[...new Set([...allDay,...conflicts])]});
  }
  return {moves};
}
export function applyBatch(tasks,events,source,target,moves){
  const taskIds=new Set(moves.map(move=>move.taskId)),eventIds=new Set(moves.map(move=>move.eventId));
  tasks=tasks.map(task=>taskIds.has(task.id)?structuredClone(task):task);
  events=events.map(event=>eventIds.has(event.id)?{...event}:event);
  for(const move of moves){
    if(move.taskId){
      applyCalendarReplan(tasks.find(t=>t.id===move.taskId),source,{day:target,blockId:move.blockId,parts:[{to:move.to,minutes:move.minutes}]});
    }else{
      let event=events.find(e=>e.id===move.eventId);
      if(event.repeat&&event.repeat!=='none'){
        event.excludedDays=[...new Set([...(event.excludedDays||[]),source])];
        event={...event,id:'manual:'+crypto.randomUUID(),repeat:'none'};
        delete event.excludedDays;events.push(event);
      }
      event.start=move.startAt;event.end=move.startAt+move.minutes*60000;
    }
  }
  return {tasks,calendarEvents:events};
}

export function installBatchMove({button,getState,visibleTasks,visibleEvents,startDay,save,notify}){
  const dialog=document.createElement('dialog');
  dialog.className='workspace-dialog batch-move';dialog.setAttribute('aria-labelledby','batch-title');
  dialog.innerHTML=`<header><h2 id="batch-title">Move blocks together</h2><button type="button" aria-label="Close">×</button></header>
    <label>From day<input type="date" name="source"></label><fieldset><legend>Choose scheduled blocks</legend><button type="button" id="batch-afternoon">Select afternoon · noon–6 PM</button><div id="batch-list"></div></fieldset>
    <div class="batch-fields"><label>Destination day<input type="date" name="target"></label><label>Shift by minutes<input type="number" name="offset" step="1" value="30"></label></div>
    <h3>Preview</h3><div id="batch-preview" aria-live="polite"></div><button class="workspace-primary" id="batch-save">Move selected blocks</button>`;
  document.body.append(dialog);
  const find=s=>dialog.querySelector(s),source=find('[name=source]'),target=find('[name=target]'),offset=find('[name=offset]'),list=find('#batch-list'),preview=find('#batch-preview'),submit=find('#batch-save');
  let choices=[],approved='';
  function populate(){
    choices=source.value?batchChoices(visibleTasks(),visibleEvents(),source.value):[];
    list.replaceChildren();
    for(const row of choices){
      const label=document.createElement('label'),check=document.createElement('input');
      check.type='checkbox';check.value=row.key;label.append(check,timeLabel(row.start)+' · '+row.title);list.append(label);
    }
    if(!choices.length)list.textContent='No timed tasks or editable events on this day.';
    find('#batch-afternoon').disabled=!choices.some(row=>row.start>=720&&row.start<1080);
    render();
  }
  function calculate(){
    const selected=new Set([...list.querySelectorAll(':checked')].map(c=>c.value));
    const rows=batchChoices(visibleTasks(),visibleEvents(),source.value).filter(row=>selected.has(row.key));
    if(rows.length!==selected.size)return {error:'The schedule changed. Reopen Move blocks to select again.'};
    const state=getState();
    return batchPreview(state.tasks,state.calendarEvents,source.value,target.value,offset.valueAsNumber,rows);
  }
  function render(){
    const result=calculate();approved=JSON.stringify(result);
    preview.replaceChildren();submit.disabled=!!result.error;
    if(result.error){preview.textContent=result.error;return;}
    for(const move of result.moves){
      const line=document.createElement('p');
      line.textContent=timeLabel(move.to)+' · '+move.title+(move.conflicts.length?' — overlaps '+move.conflicts.join(', '):'');
      preview.append(line);
    }
    submit.textContent=result.moves.some(m=>m.conflicts.length)?'Move with overlaps':'Move selected blocks';
  }
  button.onclick=()=>{source.value=target.value=dayKey(startDay());offset.value='30';populate();dialog.showModal();};
  find('header button').onclick=()=>dialog.close();
  find('#batch-afternoon').onclick=()=>{
    const afternoon=new Set(choices.filter(row=>row.start>=720&&row.start<1080).map(row=>row.key));
    for(const check of list.querySelectorAll('input'))check.checked=afternoon.has(check.value);
    render();
  };
  source.onchange=()=>{target.value=source.value;populate();};
  target.oninput=offset.oninput=list.onchange=render;
  submit.onclick=()=>{
    const result=calculate();
    if(JSON.stringify(result)!==approved||result.error){render();notify('Review the updated preview.');return;}
    const state=getState();
    if(save(applyBatch(state.tasks,state.calendarEvents,source.value,target.value,result.moves))){
      dialog.close();notify('Moved '+result.moves.length+' calendar blocks.');
    }
  };
}
