import {matchCommands} from './command-palette.js';
import {installPromptReference} from './prompt-reference.js';
import {plannerDate,plannerDateWords} from './planner-data.js';
import {dayKey} from './state.js';

const promptWorkspaces={
  garden:'focus',planner:'planner',calendar:'calendar',notes:'notes',reading:'reading',journal:'journal',crochet:'crochet'
};
const timerCommands={
  status:['status','See the current timer and time remaining.'],
  start:['start','Start or resume the current countdown.'],
  pause:['pause','Pause a running countdown.'],
  focus:['focus 25m','Start a timed focus session.'],
  rest:['rest 5m','Start a timed break.']
};
const promptPath='Yin:\\Garden>';
const focusUsage='Use focus 25m, focus . 25m, or focus "task name" 25m with a duration from 1s to 180m.';
const taskTarget=/^(?:"([^"]+)"|“([^”]+)”|(\.))\s+(.+)$/;

function promptDuration(value){
  const units=/^(\d+)\s*([ms])$/i.exec(value);
  if(units)return Number(units[1])*(units[2].toLowerCase()==='m'?60000:1000);
  const clock=/^(\d{1,4}):([0-5]\d)$/.exec(value);
  return clock?(Number(clock[1])*60+Number(clock[2]))*1000:0;
}

function promptTime(value){
  const match=/^(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?$/i.exec(value);
  if(!match)return -1;
  const hour=Number(match[1]),period=match[3]?.toLowerCase();
  if(period?(hour<1||hour>12):hour>23)return -1;
  return (period?hour%12+(period==='pm'?12:0):hour)*60+Number(match[2]||0);
}

function promptMessage(value){
  const quoted=/^(?:"([\s\S]*)"|“([\s\S]*)”)$/.exec(value);
  return (quoted?(quoted[1]??quoted[2]):/^["“]/.test(value)?'':value).trim();
}

function quotedTitle(title){
  if(!title.includes('"'))return `"${title}"`;
  return /[“”]/.test(title)?null:`“${title}”`;
}

function singleEdit(left,right){
  if(left.length>right.length)return singleEdit(right,left);
  if(right.length-left.length>1)return false;
  let first=0;
  while(first<left.length&&left[first]===right[first])first++;
  if(left.length<right.length)return left.slice(first)===right.slice(first+1);
  return left!==right&&(left.slice(first+1)===right.slice(first+1)||
    left[first]===right[first+1]&&left[first+1]===right[first]&&left.slice(first+2)===right.slice(first+2));
}

function suggestion(value,options){
  const word=value?.trim().toLowerCase().replace(/\s+/g,' ');
  if(!word||word.length<3)return '';
  const matches=options.filter(option=>singleEdit(word,option));
  return matches.length===1?` Did you mean ${matches[0]}?`:'';
}

const acceptedDates='Dates: today, tomorrow, a full weekday name (its next occurrence), next week (7 days from today), or YYYY-MM-DD.';
const acceptedTimes='Time: 4pm, 4:30 PM, or 16:30.';
const detailedHelp={
  focus:[focusUsage,'Use m for minutes, s for seconds, or MM:SS. Example: focus . 25m uses the current task.'],
  rest:['rest <duration>','Examples: rest 5m, rest 90s, or rest 02:30.'],
  agenda:['agenda tomorrow','Use agenda today --actual for recorded focus activity, pause reasons, and early finishes.'],
  gap:['gap 45m this week','Use gap 45m next week to search the following Monday through Sunday.'],
  due:['due next week','Use due this week for deadlines through this Sunday.'],
  open:['open <workspace>','Workspaces: garden, planner, calendar, notes, reading, journal, and crochet.'],
  move:[
    'move "task title" <date> <start time>',
    'Move an existing calendar block and keep its duration. If multiple blocks match, choose one by date and time.',
    acceptedDates,acceptedTimes,
    'Examples: move "Lab report" tomorrow 4pm · move "Lab report" Friday 16:30 · move "Lab report" 2027-01-15 4:30 PM',
    'Use move . tomorrow 4pm for the current Garden task.',
    'Use move . next gap to find the earliest opening for its full duration within the next seven days.',
    'Review the old time, new time, and overlaps. Type yes to move the block or cancel to dismiss.'
  ],
  schedule:['schedule "task title" <date> <start time> <duration>',acceptedDates,acceptedTimes,
    'Example: schedule "Lab report" tomorrow 3pm 45m. Review the preview, then type yes or cancel.'],
  plan:['plan "task title" by <date>',acceptedDates,'Choose today or a future date. Example: plan "Exam 2" by Friday.'],
  snooze:['snooze "task title" until <date>',acceptedDates,'Choose a future date. Example: snooze "Order yarn" until Friday.'],
  'resume .':['resume .','Show the current Garden task’s handoff, next unchecked subtask, and pinned reference.',
    'Loads the suggested focus timer when it is idle. Type start or confirm Start focus when ready.'],
  'block next':['block next','Show the next timed calendar entry and when it starts. For an available task block, choose Start block focus or type yes.'],
  'block skip':['block skip "Physics lab" Friday','Preview skipping one occurrence of a recurring task or calendar event. Type yes to confirm.',
    acceptedDates],
  deadline:['deadline . Friday','Change the current task’s deadline after reviewing it. Scheduled calendar blocks stay in place.',acceptedDates],
  unblock:['unblock .','Review the task’s waiting hold, follow-up, and fallback. Type yes to clear the hold. You can also use unblock "task title".'],
  'note find':['note find "boundary terms"','Search sticky notes and the Note inbox. Open a numbered result with pick, such as pick 2.'],
  'book reviews due':['book reviews due','List scheduled chapter reviews due today or earlier, within each book’s spoiler cutoff.'],
  'stitch resume':['stitch resume "Cardigan"','Show a project’s latest checkpoint and upcoming row instructions. Choose Open in Stitchbook or type yes to open the project.'],
  'recap today':['recap today','List today’s completed work, schedule moves, and tomorrow’s first task. Type copy to copy the report.'],
  'ref open':['ref open .','Open the current task’s pinned reference beside the Garden timer.'],
  'left .':['left .','Compare the current task’s estimate, logged focus, and calendar time still booked.'],
  wrap:['wrap 3m','Reserve the last three minutes of the current focus countdown. Use 0m to turn it off or wrap default to restore the saved setting.'],
  switch:['switch "Lab report"','Preview the current timer, the new task’s countdown, and where to pick up. Type yes to switch or cancel to stay.'],
  free:['free tomorrow','List tomorrow’s free windows from midnight to midnight, after calendar buffers, cooldowns, and saved availability.'],
  conflicts:['conflicts tomorrow','List each pair of overlapping calendar commitments and the time they share. Uses scheduled times.'],
  alias:['alias <name> = <command>', 'Examples: alias calc = setup "Calculus" · alias cls = clear',
    'Run the shortcut by typing its name. Type alias to list shortcuts or unalias <name> to remove one.'],
  history:['history <words> · Search recent and named commands.',
    'history save "Weekly check-in" · Name the last repeatable command.',
    'history recall "Weekly check-in" · Load it in the input. Press Enter to rerun.',
    'history remove "Weekly check-in" · Remove the saved name.']
};

export function installCommandPrompt({root,getEntries,getNoteEntries,openWorkspace,runTimer,getFocusTasks,getTasks,getTaskDetails,getProjects,projectResume,inboxNext,officeList,taskDetails,previewTask,subtasks,check,today,agenda,freeTomorrow,conflictsTomorrow,actualAgenda,blockSplit,getSkips,skipBlock,blockNext,resumeTask,setWrap,switchTask,openReference,timeLeft,estimate,gap,due,setDeadline,plan,wait,getWaitingTasks,getWaitingTask,unblock,getMistakes,retry,resumeJournal,pin,pause,next,fit,handoff,stuck,schedule,getBlocks,move,extend,finish,snooze,getBooks,getCounters,read,bookResume,bookReviewsDue,bookGoal,row,rowStatus,checkpoint,getStitchProjects,stitchResume,shutdown,recapToday,backupStatus,getViewpoints,postcard,dusk,reviewWeek,getSoundtracks,play,addTask,capture,version,openHelp,editHistory,getAliases,saveAliases,getSetups,startSetup,getCurrentTask,getNamedHistory,saveNamedHistory}){
  const commands={
    ...timerCommands,
    pauseReason:['pause "Looking up the formula"','Pause focus and save the reason in the session replay.'],
    namedFocus:['focus "LinAlg" 40m','Select a task by name and start its timer.'],
    today:['today','Show the next commitment, pinned focus tasks, and overdue work.'],
    agenda:['agenda tomorrow','Show tomorrow’s commitments, first task, and open gaps.'],
    free:['free tomorrow','Show every free window tomorrow, including the effect of saved buffers.'],
    conflicts:['conflicts tomorrow','Show overlapping calendar commitments and how long each pair overlaps.'],
    actualAgenda:['agenda today --actual','Show today’s recorded focus activity and pause notes.'],
    estimate:['estimate "Reading"','Compare estimates and logged focus for matching completed tasks.'],
    gap:['gap 45m this week','Find open windows that fit a duration.'],
    due:['due next week','List hard deadlines and estimated work remaining.'],
    deadline:['deadline . Friday','Preview changing the current task’s deadline.'],
    plan:['plan "Exam 2" by Friday','Draft study blocks by a date and show any shortfall.'],
    wait:['wait "Lab report"','Show the blocker, follow-up, and fallback decision.'],
    unblock:['unblock .','Review and clear a task’s waiting hold.'],
    retry:['retry "Boundary terms"','Start a timed mistake retry in Garden.'],
    journal:['journal resume','Reopen the most recently edited draft.'],
    project:['project resume "Thermodynamics"','Open the next ready task and its project context in Garden.'],
    inbox:['inbox next','Review the oldest unsorted thought and choose what to do with it.'],
    office:['office list "LinAlg"','Show unanswered questions and their references.'],
    queue:['queue pin "LinAlg" first','Move a ready task to the front of today’s focus queue.'],
    next:['next','Show the next ready task, estimate, and saved handoff.'],
    fit:['fit 20m','Find full tasks or useful first steps for the time you have.'],
    handoff:['handoff "Resume at problem 4b"','Save the current task’s next step.'],
    stuck:['stuck "Why does this boundary term vanish?"','Save an office-hours question for the current task.'],
    schedule:['schedule "Lab report" tomorrow 3pm 45m','Preview a task block and review overlaps before placing it.'],
    move:['move "Lab report" tomorrow 4pm','Review a new time for an existing block.'],
    moveCurrent:['move . tomorrow 4pm','Review a new time for the current task’s block.'],
    moveNextGap:['move . next gap','Find the first opening that fits the current task’s full block.'],
    block:['block split "Practice exam" 50m','Preview focus chunks and breaks in an existing block.'],
    blockNext:['block next','See your next calendar block and start focus if it’s a task.'],
    blockSkip:['block skip "Physics lab" Friday','Preview skipping Friday’s occurrence, then confirm.'],
    resume:['resume .','Read the current task’s context and prepare its focus timer.'],
    reference:['ref open .','Open the current task’s pinned reference beside the timer.'],
    timeLeft:['left .','Compare the current task’s estimate, logged focus, and booked time.'],
    wrap:['wrap 3m','Reserve the final three minutes for wrap-up in this countdown.'],
    switch:['switch "Lab report"','Review what will happen to the timer before switching tasks.'],
    extend:['extend 10m','Review overlaps before adding time to a running session.'],
    finish:['task done','Complete the current task, then rest or start the next one.'],
    quickAdd:['task add Review chapter 4 tomorrow for 30m','Preview a task with a date and estimate before saving.'],
    taskShow:['task show "Lab report"','Show a task’s deadline, checklist, estimate, and next step.'],
    subtasks:['subtasks','List the current focus task’s numbered checklist.'],
    check:['check 2','Complete item 2 from the last listed checklist.'],
    snooze:['snooze "Order yarn" until Friday','Hide a task from focus until the selected date.'],
    read:['read "Golden Son" p143','Save a reading position and show pages left.'],
    book:['book resume "Golden Son"','Show the saved position, pages left, and next reading goal.'],
    bookGoal:['book goal "Golden Son" p180','Set a reading target and see how many pages away it is.'],
    bookReviewsDue:['book reviews due','List due chapter notes within each book’s spoiler cutoff.'],
    row:['row "Left sleeve" +2','Adjust a Stitchbook counter and show its last checkpoint.'],
    rowStatus:['row status "Left sleeve"','Show a counter’s count, instruction, and checkpoint.'],
    stitchResume:['stitch resume "Cardigan"','See the latest checkpoint and upcoming instructions before opening a project.'],
    checkpoint:['checkpoint "Left sleeve" "Switch to 4 mm hook"','Save the current count with a note about where to resume.'],
    shutdown:['shutdown','Review the evening checklist, tomorrow’s first task, and open work.'],
    recap:['recap today','Show today’s completed items and moves, plus tomorrow’s first task.'],
    backup:['backup status','Show when and where your latest backup was saved.'],
    postcard:['postcard "Autumn dusk"','Open the export preview for a saved Garden viewpoint.'],
    garden:['garden dusk','Preview dusk lighting in Garden.'],
    review:['review week','Show this week’s focus time, completed tasks, and open next steps.'],
    play:['play "Deep work"','Load a saved soundtrack in Music & video.'],
    open:['open calendar','Switch to a workspace.'],
    find:['find ','Search tasks, notes, books, and journal entries.'],
    noteFind:['note find "boundary terms"','Search sticky notes and captured thoughts in the Note inbox.'],
    pick:['pick 2','Open result 2 from the latest find command.'],
    setup:['setup "Calculus"','Start a saved focus setup by name.'],
    alias:['alias cls = clear','Save a personal shortcut. Type alias alone to list shortcuts.'],
    unalias:['unalias cls','Remove a saved shortcut.'],
    copy:['copy','Copy the most recent output without the command line.'],
    history:['history','Find and recall commands. Use history <words> to search.'],
    historySave:['history save "Weekly check-in"','Name the most recent repeatable command.'],
    historyRecall:['history recall "Weekly check-in"','Load a named command into the input for review.'],
    historyRemove:['history remove "Weekly check-in"','Remove a name from command history.'],
    yes:['yes','Confirm the change in the current preview.'],
    cancel:['cancel','Dismiss the current preview.'],
    undo:['undo','Undo the most recent supported Prompt edit.'],
    redo:['redo','Reapply the most recently undone Prompt edit.'],
    task:['task ','Open the task editor with a title filled in.'],
    capture:['capture ','Save a thought to the Note inbox.'],
    version:['version','Show the current app version.'],
    help:['help','See command syntax and examples.'],
    commandHelp:['help move','See move syntax, examples, and accepted dates.'],
    clear:['clear','Clear the session transcript.']
  };
  const verbs=[...new Set(Object.values(commands).map(([example])=>example.split(' ')[0]))].sort();
  const subcommands={
    agenda:['today','tomorrow'],backup:['status'],block:['next','skip','split'],book:['goal','resume','reviews'],
    conflicts:['tomorrow'],free:['tomorrow'],garden:['dusk'],
    inbox:['next'],journal:['resume'],office:['list'],project:['resume'],queue:['pin'],review:['week'],
    note:['find'],recap:['today'],ref:['open'],row:['status'],stitch:['resume'],task:['add','done','show'],history:['save','recall','remove'],help:verbs
  };
  const titleSources={
    focus:getFocusTasks,switch:getFocusTasks,'queue pin':getFocusTasks,'task show':getTaskDetails,estimate:getTaskDetails,
    schedule:getTasks,snooze:getTasks,plan:getTasks,wait:getTasks,deadline:getTasks,unblock:getWaitingTasks,
    move:getBlocks,'block split':getBlocks,
    read:getBooks,'book goal':getBooks,'book resume':getBooks,play:getSoundtracks,setup:getSetups,
    'stitch resume':getStitchProjects,
    'history recall':()=>getNamedHistory().map(({name})=>({title:name})),
    'history remove':()=>getNamedHistory().map(({name})=>({title:name})),
    find:()=>getEntries().filter(item=>item.kind==='Task'||item.kind==='Book')
  };
  root.innerHTML=`<div class="prompt-wrap"><div class="prompt-console">
    <header class="prompt-heading">
      <h2 id="prompt-heading"><span data-icon="terminal" aria-hidden="true"></span>Command Prompt</h2>
      <div class="prompt-tools">
        <button type="button" data-prompt-commands aria-haspopup="dialog">Commands</button>
        <button type="button" data-prompt-help>Help guide</button>
      </div>
    </header>
    <div class="prompt-screen" role="region" aria-label="Terminal" tabindex="0">
      <div class="prompt-log" role="log" aria-label="Command output"><p class="prompt-banner"></p><p>Type <code>help</code> to browse commands.</p></div>
      <form class="prompt-form"><span aria-hidden="true">${promptPath}</span><label for="prompt-input" class="sr-only">Enter an app command</label>
        <input id="prompt-input" type="text" maxlength="2040" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="prompt-history-hint">
        <button type="submit">Run</button>
      </form>
    </div>
    <footer class="prompt-hint" id="prompt-history-hint"><kbd>Enter</kbd> run · <kbd>Tab</kbd> complete · <kbd>↑</kbd> <kbd>↓</kbd> history</footer>
  </div></div>`;
  const form=root.querySelector('.prompt-form'),input=form.querySelector('input'),log=root.querySelector('.prompt-log');
  const screen=root.querySelector('.prompt-screen');
  const openCommandReference=installPromptReference(root,commands,example=>{
    const words=example.trim().split(' ');
    return (detailedHelp[example.trim()]||detailedHelp[words.slice(0,2).join(' ')]||detailedHelp[words[0]]||[]).join(' ');
  },recallCommand);
  log.querySelector('.prompt-banner').textContent=`Yin and Yang [Version ${version}]`;
  const history=[];
  let historyIndex=0,draft='';
  let completion,activePreview,lastResults=[];

  const personalAliases=()=>getAliases().filter(({name,command})=>
    !verbs.includes(name)&&verbs.includes(command.split(/\s/,1)[0].toLowerCase())&&!/^(alias|unalias)(?:\s|$)/i.test(command));

  function manageAlias(arg,remove=false){
    const aliases=personalAliases();
    if(!arg&&!remove)return aliases.length?aliases.map(({name,command})=>`${name} → ${command}`).join('\n'):'No personal aliases yet. Try alias cls = clear.';
    const namePattern=/^[a-z][a-z0-9_-]{0,23}$/;
    if(remove){
      const name=arg.toLowerCase();
      if(!aliases.some(item=>item.name===name))return 'No saved alias by that name.';
      return saveAliases(aliases.filter(item=>item.name!==name))?`Removed alias ${name}.`:'Could not save aliases.';
    }
    const definition=/^(\S+)\s*=\s*(.+)$/.exec(arg);
    const name=definition?.[1].toLowerCase(),command=definition?.[2];
    if(!namePattern.test(name||''))return 'Use alias <name> = <command>. Start the name with a letter and use up to 24 letters, digits, hyphens, or underscores.';
    if(verbs.includes(name))return `${name} is already a built-in command.`;
    const verb=command.split(/\s/,1)[0].toLowerCase();
    if(!verbs.includes(verb)||verb==='alias'||verb==='unalias')return 'Use a built-in app command as the shortcut target.';
    const next=aliases.filter(item=>item.name!==name);
    if(next.length>=40)return 'You can save up to 40 aliases. Remove one with unalias first.';
    return saveAliases([...next,{name,command}])?`Saved alias · ${name} → ${command}`:'Could not save aliases.';
  }
  function helpFor(arg){
    const name=arg.toLowerCase().replace(/\s+/g,' ');
    if(Object.hasOwn(detailedHelp,name))return detailedHelp[name].join('\n');
    const topics=Object.values(commands).filter(([example])=>example.trim().toLowerCase()===name||
      example.toLowerCase().startsWith(name+' '));
    if(topics.length)return topics.map(([example,detail])=>`${example.trim()} · ${detail}`).join('\n');
    return 'No help topic by that name.'+suggestion(name,verbs)+' Type help for available commands.';
  }
  async function copyOutput(){
    const output=[...log.querySelectorAll('.prompt-output:not([data-copy-output])')].reverse().find(entry=>entry.textContent.trim());
    if(!output)return 'No output to copy yet.';
    const value=(output.children.length?output.innerText:output.textContent).trim();
    try{await navigator.clipboard.writeText(value);return 'Copied the last output.';}
    catch{return 'Clipboard unavailable. Select the output above and press Ctrl+C.';}
  }

  function appendChoices(entry,results,numbered=false){
    const list=document.createElement(numbered?'ol':'ul');
    list.className='prompt-results';
    for(const {label,run} of results){
      const row=document.createElement('li'),button=document.createElement('button');
      button.type='button';button.textContent=label;button.onclick=run;
      row.append(button);list.append(row);
    }
    entry.append(list);
    return list;
  }

  function resultsFor(query,entry,entries=getEntries(),empty='No matching items.'){
    lastResults=matchCommands(entries,query).filter(result=>result.kind!=='Action').slice(0,8);
    if(!lastResults.length)return empty;
    entry.append('Open a result with pick <number>, or select it below.');
    appendChoices(entry,lastResults.map(result=>({
      label:[result.title,result.kind,result.detail].filter(Boolean).join(' · '),run:result.run
    })),true);
    return '';
  }

  function recallCommand(line){
    historyIndex=history.length;draft='';completion=undefined;
    input.value=line;
    input.setSelectionRange(line.length,line.length);
    input.focus();
  }
  function showCommandHistory(arg,entry){
    const saved=getNamedHistory();
    const recent=[...new Set(history.slice().reverse().filter(item=>item.repeatable).map(item=>item.line))];
    const action=/^(save|recall|remove)(?:\s+(.+))?$/i.exec(arg);
    if(action){
      const label=promptMessage(action[2]||'');
      if(!label||label.length>80)return 'Enter a name of 1 to 80 characters. Type help history for examples.';
      const existing=saved.find(item=>item.name.toLowerCase()===label.toLowerCase());
      switch(action[1].toLowerCase()){
        case 'recall':
          if(!existing)return 'No saved history entry by that name.';
          recallCommand(existing.command);
          return `Loaded ${existing.name}. Press Enter to run.`;
        case 'remove':
          if(!existing)return 'No saved history entry by that name.';
          return saveNamedHistory(saved.filter(item=>item!==existing))?`Removed ${existing.name}.`:'Could not save command history.';
        case 'save':
          if(!recent.length)return 'Run a command before naming it.';
          if(!existing&&saved.length>=40)return 'You can save up to 40 names. Remove one with history remove first.';
          return saveNamedHistory([{name:label,command:recent[0]},...saved.filter(item=>item!==existing)])?
            `Saved history · ${label} → ${recent[0]}`:'Could not save command history.';
      }
    }
    const namedCommands=new Set(saved.map(({command})=>command));
    const items=[
      ...saved.map(({name,command})=>({title:name,command,search:command,named:true})),
      ...recent.filter(command=>!namedCommands.has(command)).map(command=>({title:command,command}))
    ];
    const query=promptMessage(arg);
    if(arg&&!query)return 'Enter search words or type help history.';
    const results=(query?matchCommands(items,query):items).slice(0,12);
    if(!results.length)return 'No matching command history.';
    entry.append('Choose a command to load it, then press Enter to run.');
    appendChoices(entry,results.map(({title,command,named})=>({
      label:named?`${title} · ${command}`:command,run:()=>recallCommand(command)
    })));
    return '';
  }

  function pickResult(arg){
    const index=/^\d+$/.test(arg)?Number(arg):0;
    if(!Number.isSafeInteger(index)||index<1)return 'Use pick <result number>, such as pick 2.';
    if(!lastResults.length)return 'Run find <words> or note find <words> to get numbered results first.';
    const result=lastResults[index-1];
    if(!result)return `Choose a result from 1 to ${lastResults.length}.`;
    result.run();
    return `Opened ${result.title}.`;
  }

  function completions(before,after){
    const match=/^(\s*)(\S+)(?:\s+(.*))?$/.exec(before);
    if(!match)return [];
    const [,indent,verb,arg]=match,name=verb.toLowerCase();
    const options=Object.hasOwn(subcommands,name)?subcommands[name]:null;
    const action=options&&arg!==undefined&&/^(\S+)\s+(.*)$/.exec(arg);
    if(arg===undefined||options&&!action){
      if(after&&!/^\s/.test(after))return [];
      const prefix=arg===undefined?indent:`${indent}${name} `;
      const query=(arg??verb).toLowerCase();
      return (arg===undefined?[...verbs,...personalAliases().map(({name})=>name)].sort():options).filter(item=>item.startsWith(query))
        .map(item=>({text:prefix+item,tail:after}));
    }
    const phrase=action?`${name} ${action[1].toLowerCase()}`:name;
    const source=Object.hasOwn(titleSources,phrase)?titleSources[phrase]:null;
    if(!source)return [];
    const partial=action?action[2]:arg;
    if(partial.trim()==='.')return [];
    const quoted=/^(?:"([^"]*)|“([^”]*))$/.exec(partial);
    if(!quoted&&/["“”]/.test(partial))return [];
    const tail=quoted&&after.startsWith(partial[0]==='"'?'"':'”')?after.slice(1):after;
    if(tail&&!/^\s/.test(tail))return [];
    const query=(quoted?.[1]??quoted?.[2]??partial).trim();
    const items=source();
    const matches=query?matchCommands(items,query):items;
    return [...new Set(matches.map(({title})=>quotedTitle(title)).filter(Boolean))]
      .map(title=>({text:`${indent}${phrase} ${title}`,tail}));
  }

  function completeInput(){
    const caret=input.selectionStart,value=input.value;
    if(caret!==input.selectionEnd)return false;
    if(completion?.value!==value||completion.caret!==caret){
      const choices=completions(value.slice(0,caret),value.slice(caret));
      const current=choices.findIndex(({text,tail})=>text+tail===value);
      if(!choices.length||choices.length===1&&current===0)return false;
      completion={choices,index:current};
    }
    const {choices}=completion;
    completion.index=(completion.index+1)%choices.length;
    const {text,tail}=choices[completion.index];
    input.value=text+tail;
    input.setSelectionRange(text.length,text.length);
    completion.value=input.value;completion.caret=text.length;
    if(choices.length===1)completion=undefined;
    return true;
  }

  function chooseMatch(query,items,entry,run,noun,action){
    const matches=matchCommands(items,query);
    if(!matches.length)return `No ${noun} matches “${query}”.`;
    return chooseFrom(matches,entry,run,noun,action);
  }
  function chooseTaskTarget(query,context,items,entry,run,noun,action){
    if(!context)return chooseMatch(query,items,entry,run,noun,action);
    const id=getCurrentTask();
    if(!id)return 'There’s no current Garden task. Select one in Garden or enter its title.';
    const matches=items.filter(item=>(item.taskId??item.id)===id);
    return matches.length?chooseFrom(matches,entry,run,noun,action):`The current task has no ${noun} available for this command.`;
  }
  function chooseFrom(matches,entry,run,noun,action){
    if(matches.length===1)return run(matches[0]);
    entry.append(`Several ${noun}s match. Choose one to ${action}:`);
    appendChoices(entry,matches.map(item=>({
      label:[item.title,item.context].filter(Boolean).join(' · '),
      run:()=>{
        entry.replaceChildren();
        const response=run(item);
        if(response)entry.textContent=response;
        const first=entry.querySelector('button');
        if(first||document.activeElement===document.body)(first||input).focus();
      }
    })));
    return '';
  }

  function runFocus(arg,entry){
    const named=taskTarget.exec(arg);
    const ms=promptDuration(named?named[4]:arg);
    if(!ms||ms>10800000)return focusUsage;
    if(!named)return runTimer('focus',ms);
    const query=(named[1]??named[2]??named[3]).trim();
    if(!query)return focusUsage;
    return chooseTaskTarget(query,named[3],getFocusTasks(),entry,({id})=>runTimer('focus',ms,id),'ready focus task','start focus');
  }

  function closePreview(){
    activePreview?.controls.remove();
    activePreview?.hint.remove();
    activePreview=undefined;
  }
  function actOnPreview(output,action){
    closePreview();
    return action(output);
  }
  function offerPreview(entry,choices,confirm,cancelled){
    closePreview();
    const cancel=()=>cancelled;
    const hint=document.createElement('div');
    hint.textContent=confirm?'Type yes to confirm or cancel to dismiss.':'Choose an action below or type cancel to dismiss.';
    entry.append(hint);
    const controls=appendChoices(entry,[...choices,{label:'Cancel',run:cancel}].map(({label,run})=>({
      label,run:()=>{
        if(activePreview?.controls!==controls)return;
        const response=actOnPreview(entry,run);
        if(response)entry.textContent=response;
        if(document.activeElement===document.body)(entry.querySelector('button')||input).focus();
      }
    })));
    activePreview={controls,hint,confirm,cancel};
  }
  function showPreview(entry,result,cancelled){
    entry.textContent=result.text;
    if(result.image){
      const diagram=document.createElement('img');
      diagram.className='prompt-reference-image';
      diagram.src=result.image;diagram.alt=result.imageAlt;
      entry.append(diagram);
    }
    if(result.confirm){
      const confirm=output=>showPreview(output,result.confirm(),cancelled);
      offerPreview(entry,[{label:result.label,run:confirm}],confirm,cancelled);
    }
    return '';
  }
  function showChoices(entry,result,cancelled){
    entry.textContent=result.text;
    if(result.choices)offerPreview(entry,result.choices,undefined,cancelled);
    return '';
  }

  function runTaskPlanning(name,arg,entry){
    const named=taskTarget.exec(arg);
    const query=(named?.[1]??named?.[2]??named?.[3]??'').trim();
    const usage=`Use ${commands[name][0]}.`;
    if(!query)return usage;
    const [, , ,context,rest]=named;
    if(name==='deadline'){
      const date=plannerDate(rest);
      if(!date)return usage+suggestion(rest,plannerDateWords)+' Type help deadline for date formats.';
      return chooseTaskTarget(query,context,getTasks(),entry,({id})=>showPreview(entry,setDeadline(id,date),'Deadline change cancelled.'),'open task','set a deadline for');
    }
    if(name==='plan'){
      const by=/^by\s+(.+)$/i.exec(rest);
      const date=by&&plannerDate(by[1]);
      if(!date||date<dayKey())return usage+' Choose today or a future date.'+suggestion(by?.[1],plannerDateWords);
      return chooseTaskTarget(query,context,getTasks(),entry,({id})=>showPreview(entry,plan(id,date),'Study plan cancelled.'),'open task','plan');
    }
    if(name==='snooze'){
      const until=/^until\s+(.+)$/i.exec(rest);
      const date=until&&plannerDate(until[1]);
      if(!date||date<=dayKey())return usage+' Choose a future date.'+suggestion(until?.[1],plannerDateWords.filter(word=>word!=='today'));
      return chooseTaskTarget(query,context,getTasks(),entry,({id})=>snooze(id,date),'open task','snooze');
    }
    if(name==='move'){
      if(/^next\s+gap$/i.test(rest))return chooseTaskTarget(query,context,getBlocks(),entry,
        block=>showPreview(entry,move(block,'next gap'),'Move cancelled.'),'scheduled block','move');
      const fields=/^(.+?)\s+(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)$/i.exec(rest);
      const date=fields&&plannerDate(fields[1]),start=fields?promptTime(fields[2]):-1;
      if(!date)return usage+' Use a valid date.'+suggestion(fields?.[1],plannerDateWords)+' Type help move for date formats.';
      if(start<0)return usage+' Use a valid start time.';
      return chooseTaskTarget(query,context,getBlocks(),entry,block=>showPreview(entry,move(block,{date,start}),'Move cancelled.'),'scheduled block','move');
    }
    const fields=/^(.+?)\s+(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)\s+(.+)$/i.exec(rest);
    if(!fields)return usage;
    const date=plannerDate(fields[1]),start=promptTime(fields[2]),minutes=promptDuration(fields[3])/60000;
    if(!date)return usage+' Use a valid date.'+suggestion(fields[1],plannerDateWords)+' Type help schedule for date formats.';
    if(start<0||!Number.isInteger(minutes)||minutes<1||minutes>1440)return usage+' Use a valid start time and whole-minute length.';
    return chooseTaskTarget(query,context,getTasks(),entry,({id})=>showPreview(entry,schedule(id,{date,start,minutes}),'Scheduling cancelled.'),'open task','schedule');
  }

  function runProgress(name,arg,entry){
    if(name==='row'){
      const status=/^status(?:\s+(.+))?$/i.exec(arg);
      if(status){
        const query=promptMessage(status[1]||'');
        return query?chooseMatch(query,getCounters(),entry,rowStatus,'counter','inspect'):'Use '+commands.rowStatus[0]+'.';
      }
    }
    const named=/^(?:"([^"]+)"|“([^”]+)”)\s+(.+)$/.exec(arg);
    const query=(named?.[1]??named?.[2]??'').trim();
    const usage=`Use ${commands[name][0]}.`;
    if(!query)return usage;
    if(name==='read'||name==='bookGoal'){
      const page=Number(/^(?:p\.?\s*)?(\d+)$/i.exec(named[3])?.[1]);
      if(!Number.isInteger(page)||page<1||page>100000)return usage+' Enter a positive page number.';
      const update=name==='read'?read:bookGoal;
      return chooseMatch(query,getBooks(),entry,({id})=>update(id,page),'book',name==='read'?'update':'set a goal for');
    }
    if(name==='checkpoint'){
      const note=promptMessage(named[3]);
      if(!note)return usage;
      return chooseMatch(query,getCounters(),entry,item=>checkpoint(item,note),'counter','save a checkpoint');
    }
    const step=Number(/^[+-]\d+$/.exec(named[3])?.[0]);
    if(!Number.isSafeInteger(step)||step===0||Math.abs(step)>100000)return usage+' Enter a signed whole number.';
    return chooseMatch(query,getCounters(),entry,item=>row(item,step),'counter','update');
  }
  function runTask(arg,entry){
    if(arg.toLowerCase()==='done')return showChoices(entry,finish(),'Task completion cancelled.');
    const action=/^(add|show)(?:\s+(.+))?$/i.exec(arg);
    const value=action?.[2];
    if(action?.[1].toLowerCase()==='add')return value?
      showPreview(entry,previewTask(value),'Task cancelled.'):`Use ${commands.quickAdd[0]}.`;
    if(action){
      const query=promptMessage(value||'');
      return query?chooseTaskTarget(query,value==='.',getTaskDetails(),entry,({id})=>taskDetails(id),'task','show'):`Use ${commands.taskShow[0]}.`;
    }
    return arg?addTask(arg):'Use task <title>, task add <details>, task show <title>, or task done.';
  }

  function execute(name,arg,entry){
    if(name==='focus')return runFocus(arg,entry);
    if(name==='pause'&&arg){
      const reason=promptMessage(arg);
      return reason?pause(reason):`Use ${commands.pauseReason[0]}.`;
    }
    if(name==='rest'){
      const ms=promptDuration(arg);
      return ms>0&&ms<=10800000?runTimer(name,ms):'Use rest with a duration from 1s to 180m, such as rest 5m.';
    }
    if(Object.hasOwn(timerCommands,name))return arg?`Use ${name} without an argument.`:runTimer(name);
    if(name==='today'||name==='next')return arg?`Use ${name} without an argument.`:name==='today'?today():next();
    if(name==='schedule'||name==='snooze'||name==='move'||name==='plan'||name==='deadline')return runTaskPlanning(name,arg,entry);
    if(name==='read'||name==='row'||name==='checkpoint')return runProgress(name,arg,entry);
    if(name==='handoff'||name==='stuck'){
      const example=commands[name][0];
      const message=promptMessage(arg);
      if(!message)return `Use ${example}.`;
      return name==='handoff'?handoff(message):stuck(message);
    }
    switch(name){
      case 'project': {
        const match=/^resume\s+(.+)$/i.exec(arg);
        const query=match&&promptMessage(match[1]);
        return query?chooseMatch(query,getProjects(),entry,({id})=>projectResume(id),'project','resume'):`Use ${commands.project[0]}.`;
      }
      case 'inbox':return arg.toLowerCase()==='next'?showChoices(entry,inboxNext(),'Thought left in the inbox.'):'Use inbox next.';
      case 'office': {
        const match=/^list\s+(.+)$/i.exec(arg);
        const query=match&&promptMessage(match[1]);
        if(!query)return `Use ${commands.office[0]}.`;
        return chooseMatch(query,[...getProjects(),{id:'',title:'General'}],entry,({id})=>officeList(id),'office-hours sheet','show');
      }
      case 'block': {
        if(arg.toLowerCase()==='next')return showPreview(entry,blockNext(),'Block start cancelled.');
        const skip=/^skip(?:\s+(.+))?$/i.exec(arg);
        if(skip){
          const match=taskTarget.exec(skip[1]||'');
          const query=(match?.[1]??match?.[2]??match?.[3]??'').trim();
          const day=match&&plannerDate(match[4]);
          if(!query||!day)return `Use ${commands.blockSkip[0]}.`+suggestion(match?.[4],plannerDateWords);
          const occurrences=getSkips(day).filter(item=>!match[3]||item.kind==='task');
          return chooseTaskTarget(query,match[3],occurrences,entry,item=>
            showPreview(entry,skipBlock(item,day),'Skip cancelled.'),'recurring occurrence','skip');
        }
        const split=/^split\s+(.+)$/i.exec(arg);
        const match=split&&taskTarget.exec(split[1]);
        const query=(match?.[1]??match?.[2]??match?.[3]??'').trim(),minutes=match?promptDuration(match[4])/60000:0;
        if(!query||!Number.isInteger(minutes)||minutes<1||minutes>1440)return `Use ${commands.block[0]}.`;
        return chooseTaskTarget(query,match[3],getBlocks(),entry,block=>blockSplit(block,minutes),'scheduled block','preview');
      }
      case 'estimate': {
        const query=promptMessage(arg);
        return query?estimate(query):`Use ${commands.estimate[0]}.`;
      }
      case 'resume':return arg==='.'?showPreview(entry,resumeTask(),'Focus start cancelled. The prepared timer is still ready.'):'Use resume . for the current Garden task.';
      case 'ref':return /^open\s+\.$/i.test(arg)?openReference():'Use ref open . for the current task’s pinned reference.';
      case 'left':return arg==='.'?timeLeft():'Use left . for the current Garden task.';
      case 'wrap': {
        if(arg.toLowerCase()==='default')return setWrap(null);
        const minutes=Number(/^(\d{1,2})\s*m$/i.exec(arg)?.[1]);
        return minutes>=0&&minutes<=15?setWrap(minutes):'Use wrap 3m with 0–15 whole minutes, or wrap default.';
      }
      case 'switch': {
        const query=promptMessage(arg);
        return query?chooseMatch(query,getFocusTasks(),entry,({id})=>showPreview(entry,switchTask(id),'Task switch cancelled.'),'ready focus task','switch to'):
          `Use ${commands.switch[0]}.`;
      }
      case 'book': {
        if(/^reviews\s+due$/i.test(arg))return bookReviewsDue();
        const goal=/^goal(?:\s+(.+))?$/i.exec(arg);
        if(goal)return runProgress('bookGoal',goal[1]||'',entry);
        const resume=/^resume\s+(.+)$/i.exec(arg);
        const query=resume&&promptMessage(resume[1]);
        return query?chooseMatch(query,getBooks(),entry,({id})=>bookResume(id),'book','resume'):`Use ${commands.book[0]}.`;
      }
      case 'shutdown':return arg?'Use shutdown without an argument.':shutdown();
      case 'recap':return arg.toLowerCase()==='today'?recapToday():`Use ${commands.recap[0]}.`;
      case 'stitch': {
        const resume=/^resume\s+(.+)$/i.exec(arg);
        const query=resume&&promptMessage(resume[1]);
        return query?chooseMatch(query,getStitchProjects(),entry,({id})=>
          showPreview(entry,stitchResume(id),'Stayed in Prompt.'),'Stitchbook project','resume'):`Use ${commands.stitchResume[0]}.`;
      }
      case 'backup':return arg.toLowerCase()==='status'?backupStatus():`Use ${commands.backup[0]}.`;
      case 'postcard': {
        const query=promptMessage(arg);
        if(!query)return `Use ${commands.postcard[0]}.`;
        const views=getViewpoints();
        if(!views.length)return 'No saved postcard viewpoints. Save one from Garden’s Export postcard panel.';
        const exact=views.filter(view=>view.title.toLowerCase()===query.toLowerCase());
        return chooseMatch(query,exact.length?exact:views,entry,({id})=>postcard(id),'postcard viewpoint','preview');
      }
      case 'garden':return arg.toLowerCase()==='dusk'?dusk():'Use garden dusk.';
      case 'wait': {
        const query=promptMessage(arg);
        return query?chooseTaskTarget(query,arg==='.',getTasks(),entry,({id})=>wait(id),'open task','inspect'):`Use ${commands.wait[0]}.`;
      }
      case 'unblock': {
        const query=promptMessage(arg);
        if(!query)return `Use ${commands.unblock[0]}.`;
        const tasks=getWaitingTasks();
        const preview=({id})=>showPreview(entry,unblock(id),'Waiting hold kept.');
        if(arg!=='.')return chooseMatch(query,tasks,entry,preview,'waiting task','unblock');
        if(!tasks.length)return 'No tasks are on hold.';
        const waitingId=getWaitingTask();
        const current=tasks.find(item=>item.id===waitingId);
        return current?preview(current):chooseFrom(tasks,entry,preview,'waiting task','unblock');
      }
      case 'retry': {
        const query=promptMessage(arg);
        return query?chooseMatch(query,getMistakes(),entry,({id})=>retry(id),'saved mistake','retry'):`Use ${commands.retry[0]}.`;
      }
      case 'journal':return arg.toLowerCase()==='resume'?resumeJournal():'Use journal resume.';
      case 'agenda':
        if(/^today\s+--actual$/i.test(arg))return actualAgenda();
        return arg.toLowerCase()==='tomorrow'?agenda():'Use agenda tomorrow or agenda today --actual.'+suggestion(arg,['tomorrow','today --actual']);
      case 'free':
      case 'conflicts':
        return arg.toLowerCase()==='tomorrow'?(name==='free'?freeTomorrow():conflictsTomorrow()):
          `Use ${name} tomorrow.`+suggestion(arg,['tomorrow']);
      case 'gap': {
        const match=/^(.+?)\s+(this|next)\s+week$/i.exec(arg);
        const minutes=match?promptDuration(match[1])/60000:0;
        return Number.isInteger(minutes)&&minutes>0&&minutes<=1440?
          gap(minutes,match[2].toLowerCase()==='next'):'Use gap 45m this week or gap 45m next week.';
      }
      case 'due': {
        const match=/^(this|next)\s+week$/i.exec(arg);
        return match?due(match[1].toLowerCase()==='next'):'Use due next week or due this week.';
      }
      case 'queue': {
        const pinArgs=/^pin\s+(.+)$/i.exec(arg);
        const match=pinArgs&&taskTarget.exec(pinArgs[1]);
        const query=(match?.[1]??match?.[2]??match?.[3]??'').trim();
        if(!query||match[4].toLowerCase()!=='first')return `Use ${commands.queue[0]}.`;
        return chooseTaskTarget(query,match[3],getFocusTasks(),entry,({id})=>pin(id),'ready focus task','pin first');
      }
      case 'extend': {
        const minutes=promptDuration(arg)/60000;
        if(!Number.isInteger(minutes)||minutes<1||minutes>1440)return 'Use extend with whole minutes, such as extend 10m.';
        return showPreview(entry,extend(minutes),'Extension cancelled.');
      }
      case 'review':return arg.toLowerCase()==='week'?reviewWeek():'Use review week.';
      case 'play': {
        const query=promptMessage(arg);
        if(!query)return 'Use play "Deep work".';
        const tracks=getSoundtracks();
        if(!tracks.length)return 'No soundtracks saved. Save one in Garden → Music & video.';
        return chooseMatch(query,tracks,entry,({id})=>play(id),'saved soundtrack','load');
      }
      case 'fit': {
        const minutes=promptDuration(arg)/60000;
        return Number.isInteger(minutes)&&minutes>0&&minutes<=1440?fit(minutes):'Use fit with whole minutes, such as fit 20m (up to 1440m).';
      }
      case 'open': {
        const target=arg.toLowerCase();
        if(!Object.hasOwn(promptWorkspaces,target))return 'Use open <workspace>. Try garden, planner, calendar, notes, reading, journal, or crochet.';
        return openWorkspace(promptWorkspaces[target])?'Opened '+target+'.':'Close the current panel before switching workspaces.';
      }
      case 'task':return runTask(arg,entry);
      case 'subtasks':return arg?'Use subtasks without an argument.':subtasks();
      case 'check': {
        const index=/^\d+$/.test(arg)?Number(arg):NaN;
        return Number.isSafeInteger(index)&&index>0?check(index):'Use check <item number>, such as check 2.';
      }
      case 'capture':return arg?capture(arg):'Use capture <thought>.';
      case 'find': {
        lastResults=[];
        const query=promptMessage(arg);
        return query?resultsFor(query,entry):'Use find <words to search for>.';
      }
      case 'note': {
        const find=/^find(?:\s+(.+))?$/i.exec(arg);
        if(find)lastResults=[];
        const query=promptMessage(find?.[1]||'');
        return query?resultsFor(query,entry,getNoteEntries(),'No matching notes or captured thoughts.'):`Use ${commands.noteFind[0]}.`;
      }
      case 'pick':return pickResult(arg);
      case 'setup': {
        const query=promptMessage(arg);
        return query?chooseMatch(query,getSetups(),entry,({id})=>startSetup(id),'saved focus setup','start'):`Use ${commands.setup[0]}.`;
      }
      case 'alias':return manageAlias(arg);
      case 'unalias':return manageAlias(arg,true);
      case 'copy':return !arg||arg.toLowerCase()==='output'?copyOutput():'Use copy to copy the latest output.';
      case 'history':return showCommandHistory(arg,entry);
      case 'yes':
      case 'cancel': {
        if(arg)return `Use ${name} without an argument.`;
        if(!activePreview)return 'There’s no current preview.';
        const action=name==='yes'?activePreview.confirm:activePreview.cancel;
        return action?actOnPreview(entry,action):'Choose one of the actions shown in the preview.';
      }
      case 'undo':
      case 'redo':return arg?`Use ${name} without an argument.`:editHistory(name);
      case 'version':return 'Yin and Yang '+version;
      case 'help':
        if(arg)return helpFor(arg);
        openCommandReference();
        return 'Opened the command reference. Type help <command> for syntax and examples.';
      default:return 'Unknown command.'+suggestion(name,[...verbs,...personalAliases().map(({name})=>name)])+' Type help to see the available commands.';
    }
  }

  form.addEventListener('submit',event=>{
    event.preventDefault();
    const line=input.value.trim();
    if(!line)return;
    const [,typedVerb,extra]=line.match(/^(\S+)(?:\s+([\s\S]*))?$/);
    const alias=personalAliases().find(item=>item.name===typedVerb.toLowerCase());
    const [,verb,arg='']=(alias&&!extra?alias.command:line).match(/^(\S+)(?:\s+([\s\S]*))?$/);
    const name=verb.toLowerCase();
    if(history.at(-1)?.line!==line)history.push({line,repeatable:!['history','yes','cancel','clear'].includes(name)});
    if(history.length>50)history.shift();
    historyIndex=history.length;draft='';input.value='';completion=undefined;
    if(name!=='yes'&&name!=='cancel')closePreview();
    if(name==='clear'){lastResults=[];log.replaceChildren();input.focus();return;}
    const group=document.createElement('div'),command=document.createElement('code'),entry=document.createElement('div');
    command.className='prompt-echo';command.textContent=promptPath+line;
    entry.className='prompt-output';group.append(command,entry);
    if(name==='copy')entry.dataset.copyOutput='';
    const response=alias&&extra?'Run the alias by itself.':execute(name,arg,entry);
    if(response instanceof Promise){
      entry.textContent=name==='copy'?'Copying output…':'Checking backup status…';
      response.then(message=>{entry.textContent=message;},()=>{entry.textContent='Could not finish the command.';});
    }else if(response)entry.textContent=response;
    log.append(group);
    if(log.children.length>60)log.firstElementChild.remove();
    screen.scrollTop=screen.scrollHeight;
    if(!root.hidden&&(form.contains(document.activeElement)||document.activeElement===document.body))input.focus();
  });
  input.addEventListener('input',()=>{completion=undefined;});
  input.addEventListener('blur',()=>{completion=undefined;});
  input.addEventListener('keydown',event=>{
    if(event.isComposing||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.key==='Escape'&&completion){completion=undefined;event.preventDefault();return;}
    if(event.key==='Tab'&&!event.shiftKey&&completeInput()){event.preventDefault();return;}
    if(!history.length||!['ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();
    completion=undefined;
    if(historyIndex===history.length)draft=input.value;
    historyIndex=Math.max(0,Math.min(history.length,historyIndex+(event.key==='ArrowUp'?-1:1)));
    input.value=history[historyIndex]?.line??draft;
    input.setSelectionRange(input.value.length,input.value.length);
  });
  root.querySelector('[data-prompt-help]').onclick=openHelp;
  return {focus:()=>input.focus({preventScroll:true})};
}
