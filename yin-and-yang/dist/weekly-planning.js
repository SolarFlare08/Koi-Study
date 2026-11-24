import {calendarBlocks,allDayEvents,shiftDay,weekDays} from './calendar.js';
import {dayKey,taskOccursOn,taskStatus} from './state.js';
import {countReadingChapters} from './reading-shelf.js';
import {reportEvents} from './planner-report.js';
import {sessionHandoff} from './session-handoff.js';

export function weeklyStudySummary(state,week,{includeHandoffs=true,hideZeroFocus=false}={}){
  const within=day=>day>=week.first&&day<=week.last;
  const completed=reportEvents(state,{type:'task'}).filter(event=>within(event.day));
  const focusByDay=new Map(week.timeline.map(({key})=>[key,0]));
  for(const session of week.focus)focusByDay.set(session.day,focusByDay.get(session.day)+session.focusMs);
  const nextSteps=new Map();
  const sessions=includeHandoffs?[...state.history].sort((a,b)=>a.finishedAt-b.finishedAt):[];
  const tasks=new Map(state.tasks.map(task=>[task.id,task]));
  function saveNextStep(session,taskId,next,location=''){
    if(!taskId||(!next&&!location))return;
    const task=tasks.get(taskId),sessionTask=taskId===session.taskId;
    nextSteps.set(taskId,{
      title:(sessionTask&&session.taskTitle)||task?.text||'Focus task',
      projectId:(sessionTask?session.projectId:null)??task?.projectId??'',
      next,location
    });
  }
  for(const session of sessions){
    if(session.mode!=='focus'||!within(session.day))continue;
    const handoff=sessionHandoff(session.nextHandoff);
    const handoffTaskId=session.handoffTaskId||session.taskId,reviewNext=session.review?.next||'';
    if(handoffTaskId!==session.taskId)saveNextStep(session,session.taskId,reviewNext);
    saveNextStep(session,handoffTaskId,(handoffTaskId===session.taskId&&reviewNext)||handoff?.resumeNote||'',handoff?.resumeLocation);
  }
  const upcoming=new Map();
  for(const {task,key} of [...week.next,...week.unfinished,...week.carried.map(task=>({task,key:task.date||task.deadline}))]){
    if(!upcoming.has(task.id))upcoming.set(task.id,{title:task.text,day:key});
  }
  return {completed,focusByDay:[...focusByDay].filter(([,ms])=>!hideZeroFocus||ms>0),focusMs:week.focus.reduce((sum,session)=>sum+session.focusMs,0),
    nextSteps:[...nextSteps.values()],upcoming:[...upcoming.values()]};
}

export function weeklyProjectProgress(state,projectId,week){
  const rituals=Object.fromEntries(Object.entries(state.dailyRituals||{}).filter(([date,day])=>
    date>=week.first&&date<=week.last&&day.annotate?.projectId===projectId));
  const focusMs=week.focus.filter(session=>session.projectId===projectId).reduce((sum,session)=>sum+session.focusMs,0);
  return {focusMinutes:Math.floor(focusMs/60000),chapters:countReadingChapters(rituals)};
}

export function summarizeWeek(state,tasks,date){
  const days=weekDays(date);
  const first=dayKey(days[0]),last=dayKey(days[6]);
  const within=key=>key>=first&&key<=last;
  const open=tasks.filter(task=>task.repeat!=='none'||!task.done);
  const carried=open.filter(task=>task.repeat==='none'&&(task.date||task.deadline)&&(task.date||task.deadline)<first);
  const unfinished=open.flatMap(task=>{
    const occurrence=days.find(day=>taskOccursOn(task,day)&&taskStatus(task,day)!=='done');
    const scheduled=task.blocks?.map(block=>block.date).filter(within).sort()[0];
    const key=[occurrence&&dayKey(occurrence),scheduled,within(task.deadline)?task.deadline:''].filter(Boolean).sort()[0];
    return key?[{task,key}]:[];
  }).sort((a,b)=>a.key.localeCompare(b.key));
  const nextStart=dayKey(shiftDay(days[6],1)),nextEnd=dayKey(shiftDay(days[6],7));
  const next=open.flatMap(task=>{
    const upcoming=Array.from({length:7},(_,index)=>shiftDay(days[6],index+1))
      .find(day=>taskOccursOn(task,day)&&taskStatus(task,day)!=='done');
    const block=task.blocks?.map(item=>item.date).filter(day=>day>=nextStart&&day<=nextEnd).sort()[0];
    const deadline=task.deadline>=nextStart&&task.deadline<=nextEnd?task.deadline:'';
    const key=[upcoming&&dayKey(upcoming),block,deadline].filter(Boolean).sort()[0];
    return key?[{task,key}]:[];
  }).sort((a,b)=>a.key.localeCompare(b.key));
  const events=state.calendarEvents||[];
  const timeline=days.map(day=>{
    const key=dayKey(day);
    const blocks=calendarBlocks(open,day,events);
    const planned=blocks.filter(block=>block.task&&taskStatus(block.task,new Date(`${block.occurrence}T00:00:00`))!=='done');
    const estimate=open.filter(task=>task.estimate&&!task.time&&!task.blocks?.length&&
      (taskOccursOn(task,day)||!task.date&&task.deadline===key)&&taskStatus(task,day)!=='done')
      .reduce((sum,task)=>sum+task.estimate,0);
    let busy=0,end=0;
    for(const block of blocks.filter(block=>block.event)){
      busy+=Math.max(0,block.end-Math.max(end,block.start));
      end=Math.max(end,block.end);
    }
    return {day,key,planned:planned.reduce((sum,block)=>sum+block.end-block.start,estimate),busy,allDay:allDayEvents(events,day).length};
  });
  const focus=state.history.filter(item=>item.mode==='focus'&&item.outcome==='completed'&&within(item.day));
  return {timeline,carried,unfinished,next,focus,first,last};
}
