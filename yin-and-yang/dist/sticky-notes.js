export const scratchNoteId='quick-notes';
const colors=['jade','sand','rose'];
const bounds={minWidth:200,maxWidth:720,minHeight:150,maxHeight:680,maxOffset:6000};
const clamp=(value,min,max)=>Number.isFinite(value)?Math.max(min,Math.min(max,Math.round(value))):min;
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const relatedKinds={book:'Books',project:'Projects',journal:'Journal entries'};
const editedFormat=new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'});
const validEditedAt=value=>Number.isFinite(value)&&value>0&&value<=8.64e15;
function editedTimeMarkup(value){
  if(!validEditedAt(value))return 'Not recorded';
  const date=new Date(value);
  return `<time datetime="${date.toISOString()}">${escape(editedFormat.format(date))}</time>`;
}

export function noteRelatedItems(note){
  if(!Array.isArray(note.related))return [];
  const seen=new Set();
  return note.related.flatMap(item=>{
    if(!item||!Object.hasOwn(relatedKinds,item.kind)||typeof item.id!=='string'||!item.id)return [];
    const key=JSON.stringify([item.kind,item.id]);
    if(seen.has(key))return [];
    seen.add(key);
    return [{kind:item.kind,id:item.id}];
  });
}

export function noteTaskIds(note){
  return [...new Set([note.taskId,...(note.taskIds||[])].filter(id=>typeof id==='string'&&id))];
}

export function selectedNoteText(value,start,end){
  const first=value.lastIndexOf('\n',start-1)+1;
  const next=value.indexOf('\n',start);
  return (start!==end?value.slice(start,end):value.slice(first,next===-1?undefined:next)).trim();
}

export function loadStickyNotes(value,scratch=''){
  if(!Array.isArray(value))return scratch.trim()?[{
    id:scratchNoteId,title:'Quick Notes',body:scratch,x:24,y:24,width:280,height:235,color:'jade'
  }]:[];
  return value.filter(note=>typeof note?.id==='string'&&typeof note.body==='string').map(note=>({
    id:note.id,title:typeof note.title==='string'?note.title.slice(0,100):'',body:note.body,
    taskId:typeof note.taskId==='string'?note.taskId:'',
    taskIds:Array.isArray(note.taskIds)?[...new Set(note.taskIds.filter(id=>typeof id==='string'&&id))]:[],
    related:noteRelatedItems(note),
    ...(typeof note.stackId==='string'&&note.stackId&&typeof note.stackName==='string'&&note.stackName.trim()?
      {stackId:note.stackId,stackName:note.stackName.trim().slice(0,80)}:{}),
    ...(validEditedAt(note.editedAt)?{editedAt:note.editedAt}:{}),
    x:clamp(note.x||0,0,bounds.maxOffset),y:clamp(note.y||0,0,bounds.maxOffset),
    width:clamp(note.width||252,bounds.minWidth,bounds.maxWidth),
    height:clamp(note.height||216,bounds.minHeight,bounds.maxHeight),
    color:colors.includes(note.color)?note.color:colors[0]
  }));
}

export function noteStacks(notes){
  const groups=new Map();
  for(const note of notes){
    if(!note.stackId)continue;
    if(!groups.has(note.stackId))groups.set(note.stackId,{id:note.stackId,name:note.stackName,notes:[]});
    groups.get(note.stackId).notes.push(note);
  }
  return [...groups.values()];
}

export function stackNotes(notes,from,to,name){
  const source=notes.find(n=>n.id===from),target=notes.find(n=>n.id===to);
  if(!source||!target||from===to||source.stackId&&source.stackId===target.stackId||!name.trim())return null;
  const id=target.stackId||source.stackId||crypto.randomUUID();
  const involved=note=>note===source||note===target||Boolean(note.stackId&&(note.stackId===source.stackId||note.stackId===target.stackId));
  const members=[target,...notes.filter(note=>note!==target&&involved(note))]
    .map(note=>({...note,stackId:id,stackName:name.trim().slice(0,80)}));
  return [...notes.filter(note=>!involved(note)),...members];
}

export function spreadNotes(notes,stackId,columns){
  const group=noteStacks(notes).find(stack=>stack.id===stackId);
  if(!group)return notes;
  const [anchor]=group.notes;
  const occupied=notes.filter(n=>n.stackId!==stackId);
  const spread=new Map();
  const width=Math.max(...group.notes.map(n=>n.width))+16,height=Math.max(...group.notes.map(n=>n.height))+16;
  const stride=Math.max(1,Math.min(columns,Math.floor(bounds.maxOffset/width)+1));
  const rows=Math.floor(bounds.maxOffset/height)+1;
  const left=Math.min(anchor.x,bounds.maxOffset-(stride-1)*width);
  const firstRow=Math.floor(anchor.y/height);
  for(const note of group.notes){
    const {stackId:oldId,stackName,...placed}=note;
    if(note!==anchor){
      for(let i=0;i<rows*stride;i++){
        const x=left+i%stride*width,y=(firstRow+Math.floor(i/stride))%rows*height;
        if(!occupied.some(n=>x<n.x+n.width+8&&x+placed.width+8>n.x&&y<n.y+n.height+8&&y+placed.height+8>n.y)){
          placed.x=x;placed.y=y;break;
        }
      }
    }
    occupied.push(placed);spread.set(note.id,placed);
  }
  return notes.map(note=>spread.get(note.id)||note);
}

function stackPager(container,{getNotes,saveNotes,onEdit,onSpread}){
  let selected='',index=0,key='';
  function render(){
    const groups=noteStacks(getNotes());
    const group=groups.find(item=>item.id===selected)||groups[0],notes=group?.notes||[];
    if(group?.id!==selected){selected=group?.id||'';index=0;}
    index=Math.max(0,Math.min(index,notes.length-1));
    const note=notes[index];
    const nextKey=JSON.stringify([groups.map(g=>[g.id,g.name]),selected,index,note?.id,notes.length]);
    if(key!==nextKey){
      key=nextKey;
      container.innerHTML=note?`<label>Stack<select data-stack-select>${groups.map(g=>`<option value="${escape(g.id)}" ${g.id===selected?'selected':''}>${escape(g.name)}</option>`).join('')}</select></label>
        <div class="sticky-stack-nav"><button type="button" data-stack-step="-1" ${index===0?'disabled':''}>Previous</button>
        <span>${index+1} of ${notes.length}</span><button type="button" data-stack-step="1" ${index===notes.length-1?'disabled':''}>Next</button></div>
        <label>Title<input data-stack-field="title" maxlength="100" value="${escape(note.title)}"></label>
        <label>Note<textarea data-stack-field="body" rows="6">\n${escape(note.body)}</textarea></label>
        <details class="sticky-stack-edit-info"><summary>Note options</summary><p>Last edited <span data-note-edited></span></p></details>
        ${onSpread?'<button type="button" data-spread>Spread out on board</button>':''}`:'<p>No note stacks yet.</p>';
    }else if(note){
      for(const field of container.querySelectorAll('[data-stack-field]')){
        const value=note[field.dataset.stackField];
        if(field!==document.activeElement&&field.value!==value)field.value=value;
      }
    }
    if(note)container.querySelector('[data-note-edited]').innerHTML=editedTimeMarkup(note.editedAt);
  }
  container.addEventListener('change',event=>{
    if(!event.target.matches('[data-stack-select]'))return;
    selected=event.target.value;index=0;render();container.querySelector('select')?.focus();
  });
  container.addEventListener('click',event=>{
    const button=event.target.closest('[data-stack-step]');
    if(button){
      const step=Number(button.dataset.stackStep);index+=step;render();
      (container.querySelector(`[data-stack-step="${step}"]:not(:disabled)`)||container.querySelector('[data-stack-field=body]'))?.focus();
    }
    if(event.target.closest('[data-spread]'))onSpread?.(selected);
  });
  container.addEventListener('input',event=>{
    const field=event.target.dataset.stackField;
    if(!field)return;
    const note=noteStacks(getNotes()).find(g=>g.id===selected)?.notes[index];
    if(!note)return;
    if(saveNotes(getNotes().map(n=>n===note?{...n,[field]:event.target.value}:n))){render();onEdit?.();}
  });
  return {render,open(id,indexToShow=0){selected=id;index=indexToShow;render();}};
}

const icons={
  move:'<circle cx="6" cy="4" r=".8"/><circle cx="12" cy="4" r=".8"/><circle cx="6" cy="9" r=".8"/><circle cx="12" cy="9" r=".8"/><circle cx="6" cy="14" r=".8"/><circle cx="12" cy="14" r=".8"/>',
  back:'<path d="M4 4h10M9 7v7m-3-3 3 3 3-3"/>',
  front:'<path d="M4 14h10M9 11V4m-3 3 3-3 3 3"/>',
  delete:'<path d="m5 5 8 8m0-8-8 8"/>',
  link:'<path d="m7 11 4-4M8 5l1.5-1.5a3 3 0 0 1 4.2 4.2L12 9.3M10 13l-1.5 1.5a3 3 0 0 1-4.2-4.2L6 8.7"/>',
  task:'<rect x="3" y="3" width="12" height="12" rx="2"/><path d="M6 9h6M9 6v6"/>',
  stack:'<path d="m2 6 7-4 7 4-7 4-7-4Zm0 4 7 4 7-4M2 13l7 4 7-4"/>',
  resize:'<path d="m5 13 8-8m-4 8 4-4"/>'
};
const control=(action,label)=>`<button type="button" data-note-action="${action}" title="${label}" aria-label="${label}" ${action==='move'||action==='resize'?'aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"':''}><svg viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">${icons[action]}</svg></button>`;

export function installStickyNotes({root,getNotes,getTasks,getRelated=()=>[],saveNotes,createTask,notify}){
  root.innerHTML=`<header class="sticky-heading">
    <div><span class="sticky-kicker">GARDEN DESK</span><h2 id="notes-heading">Notes</h2><p>Drag to arrange, resize, or stack your notes.</p></div>
    <div class="note-workspace-actions"><button type="button" id="open-capture-inbox" aria-haspopup="dialog">Note inbox</button>
    <button type="button" id="sticky-add"><span aria-hidden="true">+</span> New note</button></div>
  </header><div class="sticky-viewport" role="region" aria-label="Sticky note board" tabindex="0"><div class="sticky-board"></div></div>
  <dialog id="sticky-link-dialog" class="workspace-dialog" aria-labelledby="sticky-link-title">
    <form><header><h2 id="sticky-link-title">Link sticky note</h2><button type="button" data-link-close aria-label="Close link editor">×</button></header>
      <fieldset class="sticky-link-choices"><legend>Tasks</legend><div id="sticky-link-tasks"></div></fieldset>
      <div id="sticky-link-related"></div>
      <button class="workspace-primary" type="submit">Save links</button>
    </form>
  </dialog>`;
  const board=root.querySelector('.sticky-board');
  const viewport=root.querySelector('.sticky-viewport');
  const add=root.querySelector('#sticky-add');
  const linkDialog=root.querySelector('#sticky-link-dialog');
  const linkChoices=root.querySelector('#sticky-link-tasks');
  let linkingId='';
  let gesture=null;
  const stackDialog=document.createElement('dialog'),stackEditor=document.createElement('dialog');
  stackDialog.className=stackEditor.className='workspace-dialog sticky-stack-dialog';
  stackDialog.setAttribute('aria-label','Read note stacks');
  stackEditor.setAttribute('aria-label','Stack notes');
  stackDialog.innerHTML='<header><h2>Note stacks</h2><button type="button" aria-label="Close">×</button></header><div class="sticky-stack-pages"></div>';
  stackDialog.querySelector('header button').onclick=()=>stackDialog.close();
  root.append(stackDialog,stackEditor);
  const pager=stackPager(stackDialog.querySelector('.sticky-stack-pages'),{getNotes,saveNotes,onEdit:render,onSpread:id=>{
    const group=noteStacks(getNotes()).find(group=>group.id===id);
    if(!group)return;
    const width=Math.max(...group.notes.map(n=>n.width))+16;
    if(saveNotes(spreadNotes(getNotes(),id,Math.max(1,Math.floor(viewport.clientWidth/width))))){
      stackDialog.close();render();add.focus();notify('Stack spread out on the board.');
    }
  }});
  function chooseStack(sourceId,targetId){
    const notes=getNotes(),source=notes.find(n=>n.id===sourceId);
    if(!source)return;
    const candidates=visibleNotes().filter(n=>n.id!==sourceId&&(!source.stackId||n.stackId!==source.stackId));
    if(!candidates.length){notify('Add another note to build a stack.');return;}
    stackEditor.innerHTML=`<header><h2>Stack notes</h2><button type="button" aria-label="Cancel">×</button></header><form>
      <label>Stack with<select name="target">${candidates.map(n=>`<option value="${escape(n.id)}">${escape(n.stackName||n.title||'Untitled note')}</option>`).join('')}</select></label>
      <label>Stack name<input name="name" maxlength="80" required></label><button class="workspace-primary">Save stack</button></form>`;
    const form=stackEditor.querySelector('form');
    if(targetId)form.elements.target.value=targetId;
    const suggest=()=>{
      const target=candidates.find(n=>n.id===form.elements.target.value);
      form.elements.name.value=target?.stackName||source.stackName||target?.title||'';
    };
    suggest();form.elements.target.onchange=suggest;
    stackEditor.querySelector('header button').onclick=()=>stackEditor.close();
    form.onsubmit=event=>{
      event.preventDefault();
      const next=stackNotes(getNotes(),sourceId,form.elements.target.value,form.elements.name.value);
      if(!next||!saveNotes(next))return;
      stackEditor.close();render();
      cardFor(form.elements.target.value)?.querySelector('[data-note-action=open-stack]')?.focus();
      notify('Note stack saved.');
    };
    stackEditor.showModal();form.elements.name.focus();form.elements.name.select();
  }

  function visibleNotes(){
    const seen=new Set();
    return getNotes().filter(note=>{
      if(!note.stackId)return true;
      if(seen.has(note.stackId))return false;
      seen.add(note.stackId);return true;
    });
  }

  function cardFor(id){
    return board.querySelector(`[data-sticky-id="${CSS.escape(id)}"]`);
  }
  function sizeBoard(){
    const notes=visibleNotes();
    const width=notes.reduce((extent,note)=>Math.max(extent,note.x+note.width+20),0);
    const height=notes.reduce((extent,note)=>Math.max(extent,note.y+note.height+20),0);
    board.style.setProperty('--board-width',`${width}px`);
    board.style.setProperty('--board-height',`${height}px`);
  }
  function render(){
    if(gesture)return;
    const taskNames=new Map(getTasks().map(task=>[task.id,task.text]));
    const targets=getNotes().some(note=>note.related?.length)?getRelated():[];
    const targetNames=new Map(targets.map(item=>[JSON.stringify([item.kind,item.id]),item.title]));
    const groups=new Map(noteStacks(getNotes()).map(group=>[group.id,group]));
    board.innerHTML=visibleNotes().map((note,layer)=>{
      const group=groups.get(note.stackId);
      const links=[...noteTaskIds(note).map(id=>taskNames.get(id)||'Task unavailable'),
        ...noteRelatedItems(note).map(item=>targetNames.get(JSON.stringify([item.kind,item.id]))||'Linked item unavailable')].join(', ');
      return `<article class="sticky-note${group?' sticky-stack':''}" data-sticky-id="${escape(note.id)}" data-color="${note.color}"
        aria-label="${escape(note.title||'Untitled note')}" style="left:${note.x}px;top:${note.y}px;width:${note.width}px;height:${note.height}px;z-index:${layer+1}">
      <header>${control('move','Move note (arrow keys)')}${group?`<button type="button" data-note-action="open-stack">${escape(group.name)} · ${group.notes.length}</button>`:
        `<input type="text" aria-label="Note title" data-note-field="title" maxlength="100" placeholder="Untitled note" value="${escape(note.title)}">`}
        <details class="sticky-note-menu"><summary title="Note options" aria-label="Note options">⋯</summary>
          <div class="sticky-note-options"><p>Last edited <span data-note-edited></span></p>${group?'':control('delete','Delete note')}</div>
        </details></header>
      <textarea aria-label="Note text" data-note-field="body" placeholder="Write something here…" spellcheck="true">
${escape(note.body)}</textarea>
      <footer><div class="sticky-layer">${group?'':control('back','Send note to back')+control('front','Bring note to front')}${control('stack','Stack with another note')}${control('link','Link note to task, book, project, or journal entry')}${control('task','Create task from note text')}</div>
      ${links?`<span class="sticky-task-badge" title="${escape(links)}">${escape(links)}</span>`:''}${control('resize','Resize note (arrow keys)')}</footer>
    </article>`;
    }).join('')||'<div class="sticky-empty"><span aria-hidden="true">✧</span><p>Room for a thought</p><small>Add a note to start your board.</small></div>';
    sizeBoard();
  }
  function newNote(body='',title=''){
    const notes=visibleNotes();
    const available=viewport.clientWidth||root.parentElement.clientWidth-48;
    const width=Math.min(252,Math.max(bounds.minWidth,available-36));
    const height=216;
    const columns=Math.max(1,Math.floor((available-16)/(width+18)));
    let x=18,y=18;
    // Find the first free spot so a new note doesn't cover the one you were reading.
    for(let index=0;index<=notes.length*4;index++){
      x=18+index%columns*(width+18);
      y=Math.min(bounds.maxOffset,18+Math.floor(index/columns)*(height+18));
      if(!notes.some(note=>x<note.x+note.width+8&&x+width+8>note.x&&y<note.y+note.height+8&&y+height+8>note.y))break;
    }
    return {id:crypto.randomUUID(),title,body,taskId:'',editedAt:Date.now(),x,y,width,height,color:colors[notes.length%colors.length]};
  }
  function update(id,changes){
    return saveNotes(getNotes().map(note=>note.id===id?{...note,...changes}:note));
  }
  function setRect(card,rect){
    Object.assign(card.style,{left:`${rect.x}px`,top:`${rect.y}px`,width:`${rect.width}px`,height:`${rect.height}px`});
  }
  function adjusted(note,action,dx,dy){
    return action==='move'
      ? {x:clamp(note.x+dx,0,bounds.maxOffset),y:clamp(note.y+dy,0,bounds.maxOffset),width:note.width,height:note.height}
      : {x:note.x,y:note.y,width:clamp(note.width+dx,bounds.minWidth,bounds.maxWidth),height:clamp(note.height+dy,bounds.minHeight,bounds.maxHeight)};
  }

  add.addEventListener('click',()=>{
    const note=newNote();
    if(!saveNotes([...getNotes(),note]))return;
    render();
    const card=cardFor(note.id);
    card.scrollIntoView({block:'nearest',inline:'nearest'});
    card.querySelector('[data-note-field="title"]').focus({preventScroll:true});
  });
  board.addEventListener('input',event=>{
    const field=event.target.dataset.noteField;
    if(!field)return;
    const card=event.target.closest('.sticky-note');
    if(!update(card.dataset.stickyId,{[field]:event.target.value}))return;
    if(field==='title')card.setAttribute('aria-label',event.target.value||'Untitled note');
    if(card.querySelector('.sticky-note-menu').open)updateMenuTimestamp(card);
  });
  function updateMenuTimestamp(card){
    const note=getNotes().find(item=>item.id===card.dataset.stickyId);
    card.querySelector('[data-note-edited]').innerHTML=editedTimeMarkup(note?.editedAt);
  }
  function openMenus(){return board.querySelectorAll('.sticky-note-menu[open]');}
  board.addEventListener('toggle',({target})=>{
    if(!target.matches('.sticky-note-menu[open]'))return;
    for(const menu of openMenus())if(menu!==target)menu.open=false;
    updateMenuTimestamp(target.closest('[data-sticky-id]'));
  },true);
  document.addEventListener('pointerdown',event=>{
    for(const menu of openMenus())if(!menu.contains(event.target))menu.open=false;
  });
  board.addEventListener('click',event=>{
    const button=event.target.closest('[data-note-action]');
    const action=button?.dataset.noteAction;
    if(action==='stack'){chooseStack(button.closest('.sticky-note').dataset.stickyId);return;}
    if(action==='open-stack'){
      const note=getNotes().find(n=>n.id===button.closest('.sticky-note').dataset.stickyId);
      if(note){pager.open(note.stackId);stackDialog.showModal();}
      return;
    }
    if(action==='task'){
      const card=button.closest('.sticky-note');
      const field=card.querySelector('[data-note-field="body"]');
      const {value,selectionStart:start,selectionEnd:end,selectionDirection:direction,scrollTop,scrollLeft}=field;
      const text=selectedNoteText(value,start,end);
      if(!text){notify('Select note text or place the cursor on a line.');field.focus();return;}
      createTask(card.dataset.stickyId,text,button,{value,start,end,direction,scrollTop,scrollLeft});
      return;
    }
    if(action==='link'){
      const note=getNotes().find(item=>item.id===button.closest('.sticky-note').dataset.stickyId);
      if(!note)return;
      linkingId=note.id;
      const linked=new Set(noteTaskIds(note));
      const tasks=new Map(getTasks().map(task=>[task.id,task.text]));
      for(const id of linked)if(!tasks.has(id))tasks.set(id,'Task unavailable');
      linkChoices.innerHTML=[...tasks].map(([id,title])=>
        `<label><input type="checkbox" name="task" value="${escape(id)}" ${linked.has(id)?'checked':''}> ${escape(title)}</label>`).join('')||'<p>No tasks available.</p>';
      const targets=getRelated(),related=noteRelatedItems(note);
      linkDialog.querySelector('#sticky-link-related').innerHTML=Object.entries(relatedKinds).map(([kind,label])=>{
        const selected=new Set(related.filter(item=>item.kind===kind).map(item=>item.id));
        const items=new Map(targets.filter(item=>item.kind===kind).map(item=>[item.id,item.title]));
        for(const id of selected)if(!items.has(id))items.set(id,'Linked item unavailable');
        return `<details class="sticky-link-choices" ${selected.size?'open':''}><summary>${label}${selected.size?` (${selected.size})`:''}</summary><div>
          ${[...items].map(([id,title])=>`<label><input type="checkbox" name="${kind}" value="${escape(id)}" ${selected.has(id)?'checked':''}> ${escape(title)}</label>`).join('')||'<p>No items available.</p>'}</div></details>`;
      }).join('');
      linkDialog.showModal();
      return;
    }
    if(!['back','front','delete'].includes(action))return;
    const notes=getNotes();
    const index=notes.findIndex(note=>note.id===button.closest('.sticky-note').dataset.stickyId);
    if(index<0)return;
    const next=notes.slice();
    const [note]=next.splice(index,1);
    if(action==='front')next.push(note);
    if(action==='back')next.unshift(note);
    if(!saveNotes(next))return;
    render();
    if(action!=='delete'){cardFor(note.id).querySelector(`[data-note-action="${action}"]`).focus({preventScroll:true});return;}
    add.focus({preventScroll:true});
    notify('Sticky note deleted.',latest=>{
      if(latest.stickyNotes.some(item=>item.id===note.id))return false;
      latest.stickyNotes.splice(index,0,note);
      if(note.id===scratchNoteId)latest.notes=note.body;
      return true;
    });
  });
  linkDialog.querySelector('[data-link-close]').addEventListener('click',()=>linkDialog.close());
  linkDialog.addEventListener('submit',event=>{
    event.preventDefault();
    if(!getNotes().some(note=>note.id===linkingId)){linkDialog.close();return;}
    const fields=new FormData(event.target),ids=fields.getAll('task');
    const related=Object.keys(relatedKinds).flatMap(kind=>fields.getAll(kind).map(id=>({kind,id})));
    if(!update(linkingId,{taskId:ids[0]||'',taskIds:ids.slice(1),related}))return;
    linkDialog.close();
    render();
    notify(ids.length||related.length?'Sticky note links saved.':'Sticky note unlinked.');
  });
  linkDialog.addEventListener('close',()=>{
    (cardFor(linkingId)?.querySelector('[data-note-action="link"]')||add).focus({preventScroll:true});
  });
  board.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('[data-note-action]');
    const action=handle?.dataset.noteAction;
    if(gesture||!event.isPrimary||event.button!==0||!['move','resize'].includes(action))return;
    const card=handle.closest('.sticky-note');
    const note=getNotes().find(item=>item.id===card.dataset.stickyId);
    if(!note)return;
    handle.setPointerCapture(event.pointerId);
    gesture={handle,card,note,action,pointerId:event.pointerId,x:event.clientX+viewport.scrollLeft,y:event.clientY+viewport.scrollTop,rect:note};
    card.classList.add('sticky-adjusting');
  });
  board.addEventListener('pointermove',event=>{
    if(gesture?.pointerId!==event.pointerId)return;
    const {note,action,x,y,card}=gesture;
    gesture.rect=adjusted(note,action,event.clientX+viewport.scrollLeft-x,event.clientY+viewport.scrollTop-y);
    setRect(card,gesture.rect);
    if(action==='move'){
      gesture.over?.classList.remove('sticky-stack-target');
      gesture.over=null;
      if(Math.hypot(gesture.rect.x-note.x,gesture.rect.y-note.y)>12){
        gesture.over=document.elementsFromPoint(event.clientX,event.clientY).map(el=>el.closest('[data-sticky-id]'))
          .find(target=>target&&target!==card&&board.contains(target));
        gesture.over?.classList.add('sticky-stack-target');
      }
    }
  });
  function stopGesture(event,save){
    if(gesture?.pointerId!==event.pointerId)return;
    const {card,note,rect,over}=gesture;
    gesture=null;
    card.classList.remove('sticky-adjusting');
    over?.classList.remove('sticky-stack-target');
    if(save&&over){setRect(card,note);chooseStack(note.id,over.dataset.stickyId);return;}
    if(save&&rect!==note&&update(note.id,rect))sizeBoard();
    else setRect(card,note);
  }
  board.addEventListener('pointerup',event=>stopGesture(event,true));
  board.addEventListener('pointercancel',event=>stopGesture(event,false));
  board.addEventListener('lostpointercapture',event=>stopGesture(event,false));
  board.addEventListener('keydown',event=>{
    const menu=event.target.closest('.sticky-note-menu[open]');
    if(menu&&event.key==='Escape'){
      event.preventDefault();event.stopPropagation();menu.open=false;menu.querySelector('summary').focus({preventScroll:true});return;
    }
    const direction={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[event.key];
    const action=event.target.dataset.noteAction;
    if(!direction||!['move','resize'].includes(action))return;
    event.preventDefault();
    const card=event.target.closest('.sticky-note');
    const note=getNotes().find(item=>item.id===card.dataset.stickyId);
    if(!note)return;
    const step=event.shiftKey?32:12;
    const rect=adjusted(note,action,direction[0]*step,direction[1]*step);
    if(update(note.id,rect)){setRect(card,rect);sizeBoard();card.scrollIntoView({block:'nearest',inline:'nearest'});}
  });
  render();
  return {newNote,render,restoreSelection(id,selection){
    const field=cardFor(id)?.querySelector('[data-note-field="body"]');
    if(!field||root.hidden)return;
    field.focus({preventScroll:true});
    if(selection){
      const {value,start,end,direction,scrollTop,scrollLeft}=selection;
      // A note edited elsewhere may place different text at the saved offsets.
      field.setSelectionRange(start,field.value===value?end:start,direction);
      field.scrollTop=scrollTop;
      field.scrollLeft=scrollLeft;
    }
    return field;
  },focusNote(id){
    const note=getNotes().find(n=>n.id===id);
    if(note?.stackId){
      const group=noteStacks(getNotes()).find(g=>g.id===note.stackId);
      pager.open(group.id,group.notes.findIndex(n=>n.id===id));stackDialog.showModal();return;
    }
    const card=cardFor(id);
    if(!card)return;
    card.classList.add('sticky-search-focus');
    card.addEventListener('focusout',event=>{if(!card.contains(event.relatedTarget))card.classList.remove('sticky-search-focus');});
    card.scrollIntoView({block:'center',inline:'nearest'});
    card.querySelector('[data-note-field="title"]').focus({preventScroll:true});
  }};
}

export function installFocusNotes({button,stackButton,panel,getNotes,saveNotes,onEdit}){
  const list=panel.querySelector('.focus-notes-list');
  const stackPages=panel.querySelector('.sticky-stack-pages');
  const pager=stackPager(stackPages,{getNotes,saveNotes,onEdit});
  let taskId='',shown=false,rowsKey='';
  let mode='task';
  function sync(task,visible){
    const nextId=visible?task?.id||'':'';
    if(nextId!==taskId){taskId=nextId;if(mode==='task')shown=false;}
    const notes=taskId?getNotes().filter(note=>noteTaskIds(note).includes(taskId)):[];
    const hasStacks=visible&&getNotes().some(note=>note.stackId);
    button.hidden=!notes.length;
    stackButton.hidden=!hasStacks;
    if(!visible||!(mode==='task'?notes.length:hasStacks))shown=false;
    button.setAttribute('aria-expanded',String(shown&&mode==='task'));
    stackButton.setAttribute('aria-expanded',String(shown&&mode==='stack'));
    panel.hidden=!shown;
    if(!shown)return;
    panel.querySelector('h2').textContent=mode==='task'?'Task notes':'Note stacks';
    list.hidden=mode!=='task';stackPages.hidden=mode!=='stack';
    if(mode==='stack'){pager.render();return;}
    const nextKey=JSON.stringify(notes.map(note=>[note.id,note.title]));
    if(nextKey!==rowsKey){
      rowsKey=nextKey;
      list.innerHTML=notes.map(note=>`<label><span>${escape(note.title||'Untitled note')}</span>
        <textarea data-focus-note="${escape(note.id)}" rows="4">
${escape(note.body)}</textarea></label>`).join('');
      return;
    }
    const bodies=new Map(notes.map(note=>[note.id,note.body]));
    for(const field of list.querySelectorAll('textarea')){
      const value=bodies.get(field.dataset.focusNote);
      if(document.activeElement!==field&&field.value!==value)field.value=value;
    }
  }
  let current;
  function update(task,visible){current={task,visible};sync(task,visible);}
  function toggle(next=mode){
    shown=!(shown&&mode===next);
    mode=next;
    sync(current?.task,current?.visible);
    const opener=mode==='task'?button:stackButton;
    (shown?(mode==='task'?list.querySelector('textarea'):stackPages.querySelector('select')):
      opener.getClientRects().length?opener:document.querySelector('.session-tools-toggle'))?.focus({preventScroll:true});
  }
  button.addEventListener('click',()=>toggle('task'));
  stackButton.addEventListener('click',()=>toggle('stack'));
  panel.querySelector('[data-focus-notes-close]').addEventListener('click',()=>toggle());
  panel.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();toggle();}
  });
  list.addEventListener('input',event=>{
    const field=event.target.closest('[data-focus-note]');
    if(!field)return;
    const notes=getNotes().map(note=>note.id===field.dataset.focusNote?{...note,body:field.value}:note);
    if(saveNotes(notes))onEdit();
  });
  return {update};
}
