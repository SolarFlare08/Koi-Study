const actions=new Set(['start','pause','resume','switch','finish','early','skip']);
const stops=new Set(['pause','finish','early','skip']);

export function loadReplay(value){
  const events=[];
  for(const item of Array.isArray(value)?value:[]){
    if(!actions.has(item?.action)||!Number.isFinite(item.at)||Math.abs(item.at)>8.64e15||item.at<(events.at(-1)?.at??-Infinity))continue;
    events.push({action:item.action,at:item.at,taskId:typeof item.taskId==='string'?item.taskId:'',
      title:typeof item.title==='string'?item.title.slice(0,160):'',
      projectId:typeof item.projectId==='string'?item.projectId:''});
  }
  return events;
}

export function addReplayEvent(timer,action,now,task){
  if(timer.mode!=='focus')return;
  if(action!=='start'&&!timer.replay?.length)return;
  const last=timer.replay?.at(-1);
  const current=task===undefined?(last||timer.taskSnapshot):task;
  timer.replay=[...(timer.replay||[]),{action,at:Math.max(now,last?.at??now),
    taskId:current?.taskId??current?.id??'',title:current?.title??current?.text??'',projectId:current?.projectId||''}];
}

export function replayTaskSwitch(timer,task,now){
  if(timer.mode!=='focus'||!timer.id||timer.block)return;
  if(timer.status==='running'&&now>=timer.endAt)return;
  const last=timer.replay?.at(-1);
  if((last?.taskId??timer.taskSnapshot?.id??'')!==(task?.id||''))addReplayEvent(timer,'switch',now,task||null);
}

export function replaySessions(history,timer,now){
  const sessions=history.filter(item=>item.mode==='focus');
  if(timer.mode==='focus'&&timer.id&&!sessions.some(item=>item.id===timer.id)){
    sessions.push({id:timer.id,replay:timer.replay,taskId:timer.taskSnapshot?.id,taskTitle:timer.taskSnapshot?.text,
      projectId:timer.taskSnapshot?.projectId,focusMs:Math.max(0,timer.total-(timer.status==='running'?Math.max(0,timer.endAt-now):timer.remaining)),
      finishedAt:timer.status==='running'?Math.min(now,timer.endAt):now,live:timer.status});
  }
  return sessions.map(session=>{
    const events=session.replay||[], segments=[];
    let start, running=false;
    function close(at){
      if(start&&at>=start.at)segments.push({...start,end:at});
      start=null;
    }
    for(const event of events){
      if(stops.has(event.action)){close(event.at);running=false;}
      else if(event.action==='switch'){close(event.at);if(running)start=event;}
      else{close(event.at);running=true;start=event;}
    }
    if(start)close(session.finishedAt);
    const estimated=!events.length&&session.focusMs>0&&!session.live;
    if(estimated)segments.push({at:session.finishedAt-session.focusMs,end:session.finishedAt,
      taskId:session.taskId,title:session.taskTitle,projectId:session.projectId});
    if(!segments.length&&events.length){
      const event=events[0];
      segments.push({...event,end:event.at});
    }
    return {...session,events,segments,estimated};
  });
}

export function replayBlocks(sessions,date,project='all'){
  const day=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const next=new Date(day);next.setDate(day.getDate()+1);
  const minute=timestamp=>{
    const local=new Date(timestamp);
    return local.getHours()*60+local.getMinutes()+local.getSeconds()/60;
  };
  const blocks=[];
  for(const session of sessions){
    session.segments.forEach((segment,index)=>{
      if(project!=='all'&&(segment.projectId||'inbox')!==project)return;
      if(segment.at>=+next||segment.end<+day||segment.end===+day&&segment.at<+day)return;
      const start=segment.at<=+day?0:Math.min(1439,Math.floor(minute(segment.at)));
      const end=segment.end>=+next?1440:Math.max(start+1,Math.ceil(minute(segment.end)));
      blocks.push({session,segment,index,start,end});
    });
  }
  return blocks;
}
