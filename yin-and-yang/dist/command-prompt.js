import {matchCommands} from './command-palette.js';
import {plannerDate} from './planner-data.js';
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
const focusUsage='Use focus 25m or focus "task name" 25m with a duration from 1s to 180m.';

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

export function installCommandPrompt({root,getEntries,openWorkspace,runTimer,getFocusTasks,getTasks,today,next,fit,handoff,stuck,schedule,snooze,addTask,capture,version,openHelp}){
  const commands={
    ...timerCommands,
    namedFocus:['focus "LinAlg" 40m','Select a task by name and start its timer.'],
    today:['today','Show the next commitment, pinned focus tasks, and overdue work.'],
    next:['next','Show the next ready task, estimate, and saved handoff.'],
    fit:['fit 20m','Find full tasks or useful first steps for the time you have.'],
    handoff:['handoff "Resume at problem 4b"','Save the current task’s next step.'],
    stuck:['stuck "Why does this boundary term vanish?"','Save an office-hours question for the current task.'],
    schedule:['schedule "Lab report" tomorrow 3pm 45m','Preview a task block and review overlaps before placing it.'],
    snooze:['snooze "Order yarn" until Friday','Hide a task from focus until the selected date.'],
    open:['open calendar','Switch to a workspace.'],
    find:['find ','Search tasks, notes, books, and journal entries.'],
    task:['task ','Open the task editor with a title filled in.'],
    capture:['capture ','Save a thought to the Note inbox.'],
    version:['version','Show the current app version.'],
    help:['help','See command syntax and examples.'],
    clear:['clear','Clear the session transcript.']
  };
  root.innerHTML=`<div class="prompt-wrap"><div class="prompt-console">
    <header class="prompt-heading">
      <h2 id="prompt-heading"><span data-icon="terminal" aria-hidden="true"></span>Command Prompt</h2>
      <div class="prompt-tools">
        <details class="prompt-commands"><summary>Commands</summary><div class="prompt-reference">
          <ul>${Object.values(commands).map(([example,detail])=>`<li><button type="button" data-prompt-example="${example.replaceAll('"','&quot;')}"><code>${example.trim()}</code><span>${detail}</span></button></li>`).join('')}</ul>
        </div></details>
        <button type="button" data-prompt-help>Help guide</button>
      </div>
    </header>
    <div class="prompt-screen" role="region" aria-label="Terminal" tabindex="0">
      <div class="prompt-log" role="log" aria-label="Command output"><p class="prompt-banner"></p><p>Type <code>help</code> for available commands.</p></div>
      <form class="prompt-form"><span aria-hidden="true">${promptPath}</span><label for="prompt-input" class="sr-only">Enter an app command</label>
        <input id="prompt-input" type="text" maxlength="2040" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="prompt-history-hint">
        <button type="submit">Run</button>
      </form>
    </div>
    <footer class="prompt-hint" id="prompt-history-hint"><kbd>Enter</kbd> run · <kbd>↑</kbd> <kbd>↓</kbd> history</footer>
  </div></div>`;
  const form=root.querySelector('form'),input=root.querySelector('input'),log=root.querySelector('.prompt-log');
  const screen=root.querySelector('.prompt-screen'),reference=root.querySelector('.prompt-commands');
  log.querySelector('.prompt-banner').textContent=`Yin and Yang [Version ${version}]`;
  const history=[];
  let historyIndex=0,draft='';

  function appendChoices(entry,results){
    const list=document.createElement('ul');
    list.className='prompt-results';
    for(const {label,run} of results){
      const row=document.createElement('li'),button=document.createElement('button');
      button.type='button';button.textContent=label;button.onclick=run;
      row.append(button);list.append(row);
    }
    entry.append(list);
  }

  function resultsFor(query,entry){
    const results=matchCommands(getEntries(),query).filter(result=>result.kind!=='Action').slice(0,8);
    if(!results.length)return 'No matching items.';
    appendChoices(entry,results.map(result=>({
      label:[result.title,result.kind,result.detail].filter(Boolean).join(' · '),run:result.run
    })));
    return '';
  }

  function chooseTask(query,tasks,entry,run,taskType,action){
    const matches=matchCommands(tasks,query);
    if(!matches.length)return `No ${taskType} task matches “${query}”.`;
    if(matches.length===1)return run(matches[0].id);
    entry.append(`Several ${taskType} tasks match. Choose one to ${action}:`);
    appendChoices(entry,matches.map(({id,title,context})=>({
      label:[title,context].filter(Boolean).join(' · '),
      run:()=>{
        entry.replaceChildren();
        const response=run(id);
        if(response)entry.textContent=response;
        (entry.querySelector('button')||input).focus();
      }
    })));
    return '';
  }

  function runFocus(arg,entry){
    const named=/^(?:"([^"]+)"|“([^”]+)”)\s+(.+)$/.exec(arg);
    const ms=promptDuration(named?named[3]:arg);
    if(!ms||ms>10800000)return focusUsage;
    if(!named)return runTimer('focus',ms);
    const query=(named[1]??named[2]).trim();
    if(!query)return focusUsage;
    return chooseTask(query,getFocusTasks(),entry,id=>runTimer('focus',ms,id),'ready focus','start focus');
  }

  function showSchedule(entry,result){
    entry.textContent=result.text;
    if(result.confirm){
      appendChoices(entry,[
        {label:result.label,run:()=>{
          showSchedule(entry,result.confirm());
          (entry.querySelector('button')||input).focus();
        }},
        {label:'Cancel',run:()=>{
          entry.textContent='Scheduling cancelled.';
          input.focus();
        }}
      ]);
    }
    return '';
  }

  function runTaskPlanning(name,arg,entry){
    const named=/^(?:"([^"]+)"|“([^”]+)”)\s+(.+)$/.exec(arg);
    const query=(named?.[1]??named?.[2]??'').trim();
    const usage=`Use ${commands[name][0]}.`;
    if(!query)return usage;
    const rest=named[3];
    if(name==='snooze'){
      const until=/^until\s+(.+)$/i.exec(rest);
      const date=until&&plannerDate(until[1]);
      if(!date||date<=dayKey())return usage+' Choose a future date.';
      return chooseTask(query,getTasks(),entry,id=>snooze(id,date),'open','snooze');
    }
    const fields=/^(.+?)\s+(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)\s+(.+)$/i.exec(rest);
    if(!fields)return usage;
    const date=plannerDate(fields[1]),start=promptTime(fields[2]),minutes=promptDuration(fields[3])/60000;
    if(!date||start<0||!Number.isInteger(minutes)||minutes<1||minutes>1440)return usage+' Use a valid date, start time, and whole-minute length.';
    return chooseTask(query,getTasks(),entry,id=>showSchedule(entry,schedule(id,{date,start,minutes})),'open','schedule');
  }

  function execute(name,arg,entry){
    if(name==='focus')return runFocus(arg,entry);
    if(name==='rest'){
      const ms=promptDuration(arg);
      return ms>0&&ms<=10800000?runTimer(name,ms):'Use rest with a duration from 1s to 180m, such as rest 5m.';
    }
    if(Object.hasOwn(timerCommands,name))return arg?`Use ${name} without an argument.`:runTimer(name);
    if(name==='today'||name==='next')return arg?`Use ${name} without an argument.`:name==='today'?today():next();
    if(name==='schedule'||name==='snooze')return runTaskPlanning(name,arg,entry);
    if(name==='handoff'||name==='stuck'){
      const example=commands[name][0];
      const quoted=/^(?:"([\s\S]*)"|“([\s\S]*)”)$/.exec(arg);
      const message=(quoted?(quoted[1]??quoted[2]):/^["“]/.test(arg)?'':arg).trim();
      if(!message)return `Use ${example}.`;
      return name==='handoff'?handoff(message):stuck(message);
    }
    switch(name){
      case 'fit': {
        const minutes=promptDuration(arg)/60000;
        return Number.isInteger(minutes)&&minutes>0&&minutes<=1440?fit(minutes):'Use fit with whole minutes, such as fit 20m (up to 1440m).';
      }
      case 'open': {
        const target=arg.toLowerCase();
        if(!Object.hasOwn(promptWorkspaces,target))return 'Use open <workspace>. Try garden, planner, calendar, notes, reading, journal, or crochet.';
        return openWorkspace(promptWorkspaces[target])?'Opened '+target+'.':'Close the current panel before switching workspaces.';
      }
      case 'task':return arg?addTask(arg):'Use task <title>.';
      case 'capture':return arg?capture(arg):'Use capture <thought>.';
      case 'find':return arg?resultsFor(arg,entry):'Use find <words to search for>.';
      case 'version':return 'Yin and Yang '+version;
      case 'help':return 'Timer: status, start, pause, focus 25m, focus "LinAlg" 40m, rest 5m.\nUse m for minutes, s for seconds, or MM:SS.\nPlanning: today shows your agenda, next shows the first ready focus task, and fit 20m finds work that fits.\nPreview a block: schedule "Lab report" tomorrow 3pm 45m.\nHide from focus: snooze "Order yarn" until Friday.\nCurrent task: handoff "next step", stuck "question".\nWorkspace: open <workspace>, find <words>, task <title>, capture <thought>.\nPrompt: version, help, clear.';
      default:return 'Unknown command. Type help to see the available commands.';
    }
  }

  form.addEventListener('submit',event=>{
    event.preventDefault();
    const line=input.value.trim();
    if(!line)return;
    const [,verb,arg='']=line.match(/^(\S+)(?:\s+([\s\S]*))?$/);
    const name=verb.toLowerCase();
    if(history.at(-1)!==line)history.push(line);
    if(history.length>50)history.shift();
    historyIndex=history.length;draft='';input.value='';
    if(name==='clear'){log.replaceChildren();input.focus();return;}
    const group=document.createElement('div'),command=document.createElement('code'),entry=document.createElement('div');
    command.className='prompt-echo';command.textContent=promptPath+line;
    entry.className='prompt-output';group.append(command,entry);
    const response=execute(name,arg,entry);
    if(response)entry.textContent=response;
    log.append(group);
    if(log.children.length>60)log.firstElementChild.remove();
    screen.scrollTop=screen.scrollHeight;
    if(!root.hidden&&(form.contains(document.activeElement)||document.activeElement===document.body))input.focus();
  });
  input.addEventListener('keydown',event=>{
    if(event.isComposing||event.ctrlKey||event.metaKey||event.altKey||!history.length||!['ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();
    if(historyIndex===history.length)draft=input.value;
    historyIndex=Math.max(0,Math.min(history.length,historyIndex+(event.key==='ArrowUp'?-1:1)));
    input.value=history[historyIndex]??draft;
    input.setSelectionRange(input.value.length,input.value.length);
  });
  root.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if('promptHelp' in button.dataset){openHelp();return;}
    if(!button.dataset.promptExample)return;
    reference.open=false;
    historyIndex=history.length;
    input.value=button.dataset.promptExample;
    input.focus();
  });
  return {focus:()=>input.focus({preventScroll:true})};
}
