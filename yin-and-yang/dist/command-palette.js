const normalize=text=>String(text??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();

export function matchCommands(entries,query){
  const phrase=normalize(query).trim(),words=phrase.split(/\s+/).filter(Boolean);
  if(!words.length)return entries.filter(entry=>entry.kind==='Action');
  return entries.flatMap(entry=>{
    const title=normalize(entry.title),full=normalize([entry.kind,entry.title,entry.detail,entry.search].join(' '));
    if(!words.every(word=>full.includes(word)))return [];
    const score=title===phrase?4:title.startsWith(phrase)?3:title.includes(phrase)?2:words.every(word=>title.includes(word))?1:0;
    return [{entry,score}];
  }).sort((a,b)=>b.score-a.score).map(({entry})=>entry);
}

export function installCommandPalette({dialog,getEntries}){
  dialog.innerHTML=`<header><h2 id="command-title">Find or do anything</h2><button type="button" aria-label="Close command palette">×</button></header>
    <label class="sr-only" for="command-query">Search tasks, notes, books, journal entries, and actions</label>
    <input id="command-query" type="search" role="combobox" aria-autocomplete="list" aria-controls="command-results" aria-expanded="false" autocomplete="off" placeholder="Search or type an action…" autofocus>
    <p id="command-status" role="status"></p><ul id="command-results" role="listbox" aria-label="Search results"></ul>
    <footer><kbd>↑</kbd> <kbd>↓</kbd> to move <span>·</span> <kbd>Enter</kbd> to open <span>·</span> <kbd>Esc</kbd> to close</footer>`;
  const input=dialog.querySelector('#command-query'),list=dialog.querySelector('#command-results'),status=dialog.querySelector('#command-status');
  let all=[],results=[],selected=0;
  function select(index){
    selected=index;
    const options=list.querySelectorAll('[role="option"]');
    options.forEach((option,i)=>option.setAttribute('aria-selected',String(i===selected)));
    if(options[selected]){
      input.setAttribute('aria-activedescendant',options[selected].id);
      options[selected].scrollIntoView({block:'nearest'});
    }else input.removeAttribute('aria-activedescendant');
  }
  function render(){
    const matches=matchCommands(all,input.value);
    results=matches.slice(0,20);
    list.replaceChildren(...results.map((entry,index)=>{
      const row=document.createElement('li'),copy=document.createElement('span'),title=document.createElement('strong'),kind=document.createElement('span');
      row.id=`command-result-${index}`;
      row.dataset.result=index;
      row.setAttribute('role','option');
      title.textContent=entry.title;kind.textContent=entry.kind;kind.className='command-kind';
      copy.append(title);
      if(entry.detail){
        const detail=document.createElement('small');detail.textContent=entry.detail;copy.append(detail);
      }
      row.append(copy,kind);
      return row;
    }));
    status.textContent=matches.length===0?'No results.':matches.length>results.length?`Showing the first ${results.length} of ${matches.length} matches.`:'';
    input.setAttribute('aria-expanded',String(Boolean(results.length)));
    list.scrollTop=0;select(0);
  }
  function run(index){
    const entry=results[index];
    if(!entry)return;
    dialog.close();
    entry.run();
  }
  input.addEventListener('input',render);
  input.addEventListener('keydown',event=>{
    if(event.isComposing||!results.length)return;
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();
      select((selected+results.length+(event.key==='ArrowDown'?1:-1))%results.length);
    }else if(event.key==='Enter'){
      event.preventDefault();run(selected);
    }
  });
  list.addEventListener('click',event=>{
    const row=event.target.closest('[data-result]');
    if(row)run(Number(row.dataset.result));
  });
  dialog.querySelector('header button').onclick=()=>dialog.close();
  return {
    open(){
      if(dialog.open){dialog.close();return;}
      all=getEntries();input.value='';
      dialog.showModal();render();input.focus();
    }
  };
}
