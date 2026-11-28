import {matchCommands} from './command-palette.js';

const groups=[
  {id:'focus',title:'Focus & timer',commands:'status start pause pauseReason focus namedFocus rest wrap extend setup switch resume reference left timeLeft next fit handoff finish subtasks check'},
  {id:'calendar',title:'Calendar & planning',commands:'today agenda free conflicts actualAgenda gap due deadline plan schedule move moveCurrent moveNextGap block blockNext blockSkip queue snooze'},
  {id:'tasks',title:'Tasks & projects',commands:'quickAdd taskShow task wait unblock project retry office stuck'},
  {id:'notes',title:'Notes & journal',commands:'capture inbox noteFind journal'},
  {id:'reading',title:'Reading & Stitchbook',commands:'read book bookGoal bookReviewsDue row rowStatus stitchResume checkpoint'},
  {id:'review',title:'Review & Garden',commands:'recap review estimate shutdown garden postcard play backup'},
  {id:'prompt',title:'Prompt shortcuts',commands:'open find pick yes cancel undo redo alias unalias copy history historySave historyRecall historyRemove version help commandHelp clear'}
];
const groupByCommand=new Map(groups.flatMap(group=>group.commands.split(' ').map(key=>[key,group])));
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function installPromptReference(root,commands,detailFor,insert){
  const launch=root.querySelector('[data-prompt-commands]');
  const dialog=document.createElement('dialog');
  dialog.className='prompt-reference';
  dialog.setAttribute('aria-labelledby','prompt-reference-title');
  dialog.innerHTML=`<header><h2 id="prompt-reference-title">Command reference</h2><button type="button" data-reference-close aria-label="Close command reference">×</button></header>
    <div class="prompt-reference-search">
      <label><span class="sr-only">Search commands</span><input type="search" placeholder="Search commands or actions" autocomplete="off"></label>
      <button type="button" data-reference-clear aria-label="Clear command search" hidden>Clear</button>
    </div>
    <div class="prompt-reference-layout">
      <nav aria-label="Command categories">${groups.map(group=>`<button type="button" data-reference-category="${group.id}">${escape(group.title)}</button>`).join('')}</nav>
      <label class="prompt-reference-mobile">Category<select>${groups.map(group=>`<option value="${group.id}">${escape(group.title)}</option>`).join('')}</select></label>
      <section class="prompt-reference-results" aria-labelledby="prompt-reference-list-title">
        <h3 id="prompt-reference-list-title"></h3><ul></ul>
      </section>
    </div>
    <footer><span role="status"></span><span>Choose a command to fill the Prompt input.</span></footer>`;
  root.append(dialog);
  const search=dialog.querySelector('input'),clear=dialog.querySelector('[data-reference-clear]');
  const select=dialog.querySelector('select'),list=dialog.querySelector('ul'),section=dialog.querySelector('.prompt-reference-results');
  const count=dialog.querySelector('[role=status]'),title=dialog.querySelector('h3');
  const entries=Object.entries(commands).map(([key,[example,detail]])=>{
    const group=groupByCommand.get(key)||groups.at(-1);
    const syntax=detailFor(example);
    return {key,title:example.trim(),detail,group,syntax,search:`${group.title} ${syntax}`};
  });
  let category=groups[0],from=null,restoreFocus=true;

  function render(){
    const query=search.value.trim();
    const phrase=query.toLowerCase().replace(/\s+/g,' ');
    const rank=({title,detail,syntax})=>title.toLowerCase().startsWith(phrase)?4:
      title.toLowerCase().includes(phrase)?3:detail.toLowerCase().includes(phrase)?2:syntax.toLowerCase().includes(phrase)?1:0;
    const matches=query?matchCommands(entries,query).sort((first,second)=>rank(second)-rank(first)):
      entries.filter(item=>item.group===category);
    clear.hidden=!query;
    select.value=category.id;
    for(const button of dialog.querySelectorAll('[data-reference-category]')){
      button.setAttribute('aria-pressed',String(!query&&button.dataset.referenceCategory===category.id));
    }
    title.textContent=query?'Search results':category.title;
    count.textContent=`${matches.length} ${matches.length===1?'command':'commands'}`;
    list.innerHTML=matches.length?matches.map(({key,title,detail,group})=>`<li><button type="button" data-prompt-example="${escape(key)}">
      <span>${query?`<small>${escape(group.title)}</small>`:''}<code>${escape(title)}</code><span>${escape(detail)}</span></span>
      <span aria-hidden="true">↵</span></button></li>`).join(''):
      '<li class="prompt-reference-empty">No matching commands. Try a shorter phrase, such as “timer” or “move”.</li>';
    section.scrollTop=0;
  }
  function chooseCategory(id){
    category=groups.find(group=>group.id===id)||groups[0];
    search.value='';render();
  }
  function chooseCommand(key){
    if(!Object.hasOwn(commands,key))return;
    restoreFocus=false;
    dialog.close();
    insert(commands[key][0]);
  }
  function open(){
    if(dialog.open){search.focus();return;}
    from=document.activeElement;restoreFocus=true;
    search.value='';render();dialog.showModal();search.focus();
  }

  launch.onclick=open;
  dialog.querySelector('[data-reference-close]').onclick=()=>dialog.close();
  clear.onclick=()=>{search.value='';render();search.focus();};
  search.oninput=render;
  select.onchange=()=>chooseCategory(select.value);
  search.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    const first=list.querySelector('button');
    if(!first)return;
    if(event.key==='Enter'&&search.value.trim()){event.preventDefault();first.click();}
    if(event.key==='ArrowDown'){event.preventDefault();first.focus();}
  });
  list.addEventListener('keydown',event=>{
    if(!['ArrowUp','ArrowDown'].includes(event.key))return;
    const buttons=[...list.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);
    if(index<0)return;
    event.preventDefault();
    (event.key==='ArrowUp'?(buttons[index-1]||search):(buttons[index+1]||buttons[index])).focus();
  });
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(button?.dataset.referenceCategory)chooseCategory(button.dataset.referenceCategory);
    if(button?.dataset.promptExample)chooseCommand(button.dataset.promptExample);
  });
  dialog.addEventListener('close',()=>{if(restoreFocus&&from?.isConnected)from.focus({preventScroll:true});});
  return open;
}
