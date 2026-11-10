export const scratchNoteId='quick-notes';
const colors=['jade','sand','rose'];
const bounds={minWidth:200,maxWidth:720,minHeight:150,maxHeight:680,maxOffset:6000};
const clamp=(value,min,max)=>Number.isFinite(value)?Math.max(min,Math.min(max,Math.round(value))):min;
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function loadStickyNotes(value,scratch=''){
  if(!Array.isArray(value))return scratch.trim()?[{
    id:scratchNoteId,title:'Quick Notes',body:scratch,x:24,y:24,width:280,height:235,color:'jade'
  }]:[];
  return value.filter(note=>typeof note?.id==='string'&&typeof note.body==='string').map(note=>({
    id:note.id,title:typeof note.title==='string'?note.title.slice(0,100):'',body:note.body,
    x:clamp(note.x||0,0,bounds.maxOffset),y:clamp(note.y||0,0,bounds.maxOffset),
    width:clamp(note.width||252,bounds.minWidth,bounds.maxWidth),
    height:clamp(note.height||216,bounds.minHeight,bounds.maxHeight),
    color:colors.includes(note.color)?note.color:colors[0]
  }));
}

const icons={
  move:'<circle cx="6" cy="4" r=".8"/><circle cx="12" cy="4" r=".8"/><circle cx="6" cy="9" r=".8"/><circle cx="12" cy="9" r=".8"/><circle cx="6" cy="14" r=".8"/><circle cx="12" cy="14" r=".8"/>',
  back:'<path d="M4 4h10M9 7v7m-3-3 3 3 3-3"/>',
  front:'<path d="M4 14h10M9 11V4m-3 3 3-3 3 3"/>',
  delete:'<path d="m5 5 8 8m0-8-8 8"/>',
  resize:'<path d="m5 13 8-8m-4 8 4-4"/>'
};
const control=(action,label)=>`<button type="button" data-note-action="${action}" title="${label}" aria-label="${label}" ${action==='move'||action==='resize'?'aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"':''}><svg viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">${icons[action]}</svg></button>`;

export function installStickyNotes({root,getNotes,saveNotes,notify}){
  root.innerHTML=`<header class="sticky-heading">
    <div><span class="sticky-kicker">GARDEN DESK</span><h2 id="notes-heading">Notes</h2><p>Drag to arrange, resize, or stack your notes.</p></div>
    <button type="button" id="sticky-add"><span aria-hidden="true">+</span> New note</button>
  </header><div class="sticky-viewport" role="region" aria-label="Sticky note board" tabindex="0"><div class="sticky-board"></div></div>`;
  const board=root.querySelector('.sticky-board');
  const viewport=root.querySelector('.sticky-viewport');
  const add=root.querySelector('#sticky-add');
  let gesture=null;

  function cardFor(id){
    return board.querySelector(`[data-sticky-id="${CSS.escape(id)}"]`);
  }
  function sizeBoard(){
    const notes=getNotes();
    const width=notes.reduce((extent,note)=>Math.max(extent,note.x+note.width+20),0);
    const height=notes.reduce((extent,note)=>Math.max(extent,note.y+note.height+20),0);
    board.style.setProperty('--board-width',`${width}px`);
    board.style.setProperty('--board-height',`${height}px`);
  }
  function render(){
    if(gesture)return;
    board.innerHTML=getNotes().map((note,layer)=>`<article class="sticky-note" data-sticky-id="${escape(note.id)}" data-color="${note.color}"
        aria-label="${escape(note.title||'Untitled note')}" style="left:${note.x}px;top:${note.y}px;width:${note.width}px;height:${note.height}px;z-index:${layer+1}">
      <header>${control('move','Move note (arrow keys)')}<input type="text" aria-label="Note title" data-note-field="title" maxlength="100" placeholder="Untitled note" value="${escape(note.title)}">${control('delete','Delete note')}</header>
      <textarea aria-label="Note text" data-note-field="body" placeholder="Write something here…" spellcheck="true">
${escape(note.body)}</textarea>
      <footer><div class="sticky-layer">${control('back','Send note to back')}${control('front','Bring note to front')}</div>${control('resize','Resize note (arrow keys)')}</footer>
    </article>`).join('')||'<div class="sticky-empty"><span aria-hidden="true">✧</span><p>Room for a thought</p><small>Add a note to start your board.</small></div>';
    sizeBoard();
  }
  function newNote(body='',title=''){
    const notes=getNotes();
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
    return {id:crypto.randomUUID(),title,body,x,y,width,height,color:colors[notes.length%colors.length]};
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
    if(update(card.dataset.stickyId,{[field]:event.target.value})&&field==='title')card.setAttribute('aria-label',event.target.value||'Untitled note');
  });
  board.addEventListener('click',event=>{
    const button=event.target.closest('[data-note-action]');
    const action=button?.dataset.noteAction;
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
  });
  function stopGesture(event,save){
    if(gesture?.pointerId!==event.pointerId)return;
    const {card,note,rect}=gesture;
    gesture=null;
    card.classList.remove('sticky-adjusting');
    if(save&&rect!==note&&update(note.id,rect))sizeBoard();
    else setRect(card,note);
  }
  board.addEventListener('pointerup',event=>stopGesture(event,true));
  board.addEventListener('pointercancel',event=>stopGesture(event,false));
  board.addEventListener('lostpointercapture',event=>stopGesture(event,false));
  board.addEventListener('keydown',event=>{
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
  return {newNote,render};
}
