import {matchCommands} from './command-palette.js';

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

export function installCommandPrompt({root,getEntries,openWorkspace,runTimer,addTask,capture,version,openHelp}){
  const commands={
    ...timerCommands,
    open:['open calendar','Switch to a workspace.'],
    find:['find ','Search tasks, notes, books, and journal entries.'],
    task:['task ','Open the task editor with a title filled in.'],
    capture:['capture ','Save a thought to the Note inbox.'],
    version:['version','Show the current app version.'],
    help:['help','See command syntax and examples.'],
    clear:['clear','Clear the session transcript.']
  };
  root.innerHTML=`<div class="prompt-wrap"><header class="prompt-heading">
    <h2 id="prompt-heading">Command Prompt</h2><button type="button" data-prompt-help>Help guide</button></header>
    <div class="prompt-layout"><div class="prompt-console">
      <div class="prompt-log" role="log" aria-label="Command output" tabindex="0"><p>Type <code>help</code> for syntax, or pick a command to try.</p></div>
      <form class="prompt-form"><span aria-hidden="true">❯</span><label for="prompt-input" class="sr-only">Enter an app command</label>
        <input id="prompt-input" type="text" maxlength="1040" placeholder="Type a command…" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="prompt-history-hint">
        <button type="submit">Run</button>
      </form>
      <p class="prompt-hint" id="prompt-history-hint"><kbd>Enter</kbd> run · <kbd>↑</kbd> <kbd>↓</kbd> history</p>
    </div><aside class="prompt-reference" aria-labelledby="prompt-reference-title"><h3 id="prompt-reference-title">Commands</h3>
      <ul>${Object.values(commands).map(([example,detail])=>`<li><button type="button" data-prompt-example="${example}"><code>${example.trim()}</code><span>${detail}</span></button></li>`).join('')}</ul></aside></div></div>`;
  const form=root.querySelector('form'),input=root.querySelector('input'),log=root.querySelector('.prompt-log');
  const history=[];
  let historyIndex=0,draft='';

  function resultsFor(query,entry){
    const results=matchCommands(getEntries(),query).filter(result=>result.kind!=='Action').slice(0,8);
    if(!results.length)return 'No matching items.';
    const list=document.createElement('ul');
    list.className='prompt-results';
    for(const result of results){
      const row=document.createElement('li'),button=document.createElement('button');
      button.type='button';
      button.textContent=[result.title,result.kind,result.detail].filter(Boolean).join(' · ');
      button.onclick=result.run;
      row.append(button);list.append(row);
    }
    entry.append(list);
    return '';
  }

  function execute(name,arg,entry){
    if(Object.hasOwn(timerCommands,name))return runTimer(name,arg);
    switch(name){
      case 'open': {
        const target=arg.toLowerCase();
        if(!Object.hasOwn(promptWorkspaces,target))return 'Use open <workspace>. Try garden, planner, calendar, notes, reading, journal, or crochet.';
        return openWorkspace(promptWorkspaces[target])?'Opened '+target+'.':'Close the current panel before switching workspaces.';
      }
      case 'task':return arg?addTask(arg):'Use task <title>.';
      case 'capture':return arg?capture(arg):'Use capture <thought>.';
      case 'find':return arg?resultsFor(arg,entry):'Use find <words to search for>.';
      case 'version':return 'Yin and Yang '+version;
      case 'help':return 'Timer: status, start, pause, focus 25m, rest 5m.\nUse m for minutes, s for seconds, or MM:SS.\nWorkspace: open <workspace>, find <words>, task <title>, capture <thought>.\nPrompt: version, help, clear.';
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
    command.className='prompt-echo';command.textContent='❯ '+line;
    entry.className='prompt-output';group.append(command,entry);
    const response=execute(name,arg,entry);
    if(response)entry.textContent=response;
    log.append(group);
    if(log.children.length>60)log.firstElementChild.remove();
    log.scrollTop=log.scrollHeight;
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
    historyIndex=history.length;
    input.value=button.dataset.promptExample;
    input.focus();
  });
  return {focus:()=>input.focus({preventScroll:true})};
}
