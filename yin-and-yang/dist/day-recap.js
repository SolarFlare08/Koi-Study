import {allDayEvents,calendarBlocks,openFocusBlock,shiftDay,timeValue} from './calendar.js';
import {dayKey,taskOccursOn,taskStatus} from './state.js';

const label = (items,id) => items.find(item=>item.id===id)?.name || '';

export function snapshotSchedule(state) {
  const items = new Map();
  const projects = new Map(state.projects.map(project=>[project.id,project]));
  for (const task of state.tasks) {
    const project=projects.get(task.projectId);
    const place=[project?.name,label(project?.sections||[],task.sectionId)].filter(Boolean).join(' / ');
    const main={title:task.text,date:task.date||'',time:task.time||'',place,
      location:JSON.stringify([task.projectId||'',task.sectionId||''])};
    items.set(JSON.stringify([task.id,'main']),main);
    for (const block of task.blocks||[]) {
      items.set(JSON.stringify([task.id,'block',block.id]),{title:task.text,date:block.date,time:block.time});
    }
    for (const [date,time] of Object.entries(task.occurrenceTimes||{})) {
      items.set(JSON.stringify([task.id,'occurrence',date]),{title:task.text,date,time});
    }
  }
  for(const event of state.calendarEvents){
    const start=new Date(event.start);
    const date=event.day||dayKey(start);
    const time=event.day?'':timeValue(start.getHours()*60+start.getMinutes());
    items.set(JSON.stringify([event.id,'event']),{title:event.title,date,time,place:event.day?'All day':''});
  }
  return items;
}

function samePosition(a,b){
  return a.date===b.date&&a.time===b.time&&a.location===b.location;
}

export function recordScheduleMoves(history,before,after,now=new Date()) {
  const day=dayKey(now);
  const moves=new Map();
  const prior=new Map(history.filter(item=>item.day===day).map(item=>[item.id,item.from]));
  function newBlocks(snapshot,previous){
    const blocks=new Map();
    for(const [key,block] of snapshot){
      if(previous.has(key))continue;
      const [id,type]=JSON.parse(key);
      if(type==='block'&&!blocks.has(id))blocks.set(id,block);
    }
    return blocks;
  }
  const added=newBlocks(after,before),removed=newBlocks(before,after);
  for (const key of new Set([...before.keys(),...after.keys()])) {
    const previous=before.get(key), current=after.get(key);
    if(previous&&current&&samePosition(previous,current))continue;
    const [taskId,type,date]=JSON.parse(key);
    const parent=JSON.stringify([taskId,'main']);
    const fallback=snapshot=>{
      const main=snapshot.get(parent);
      return type==='occurrence'&&main?.time?{title:main.title,date,time:main.time}:null;
    };
    const from=type==='occurrence'&&previous?.time===''&&removed.has(taskId)?removed.get(taskId):previous||fallback(before);
    const to=type==='occurrence'&&current?.time===''&&added.has(taskId)?added.get(taskId):current||fallback(after);
    if (!from||!to||samePosition(from,to)) continue;
    const id=JSON.stringify([day,key]);
    const original=prior.get(id)||from;
    moves.set(id,samePosition(original,to)?null:{id,day,title:to.title,from:original,to});
  }
  if (!moves.size) return history;
  return [...history.filter(item=>!moves.has(item.id)),...Array.from(moves.values()).filter(Boolean)];
}

export function summarizeDay(state,tasks,now=new Date()) {
  const today=dayKey(now), date=shiftDay(now,1), tomorrow=dayKey(date);
  const finished=state.taskActivity.filter(item=>dayKey(new Date(item.at))===today);
  const moves=state.scheduleMoves.filter(item=>item.day===today);
  const focus=state.history.filter(item=>item.day===today&&item.mode==='focus'&&item.outcome==='completed');
  const blocks=calendarBlocks(tasks,date,state.calendarEvents).filter(block=>block.event||openFocusBlock(block));
  const scheduled=new Set(blocks.filter(block=>block.task).map(block=>block.task.id));
  const due=tasks.filter(task=>taskStatus(task,date)!=='done'&&!scheduled.has(task.id)&&
    (task.deadline===tomorrow||taskOccursOn(task,date)));
  const firstTask=state.tomorrowPlan?.day===tomorrow&&tasks.find(task=>task.id===state.tomorrowPlan.taskId&&!task.done);
  return {today,tomorrow,finished,moves,focus,blocks,due,firstTask,allDay:allDayEvents(state.calendarEvents,date),rituals:state.dailyRituals[today]||{}};
}
