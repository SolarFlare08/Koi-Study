const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const discussionKinds={quote:'Quotes',question:'Questions',insight:'Insights'};
const chapters=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});

const chapterLabel=chapter=>/^[0-9]+$/.test(chapter.trim())?`Chapter ${chapter}`:chapter;

function discussionSheet(book,notes){
  return `<header class="reading-sheet-heading"><p>Reading discussion</p><h2>${escape(book.title)}</h2>
    ${book.author?`<p>${escape(book.author)}</p>`:''}</header>
    ${Object.entries(discussionKinds).map(([kind,label])=>{
      const entries=notes.filter(note=>note.kind===kind);
      return entries.length?`<section class="reading-sheet-section"><h3>${label}</h3><ol>
        ${entries.map(note=>`<li><p class="reading-sheet-reference">${escape(chapterLabel(note.chapter))}</p>
          <${kind==='quote'?'blockquote':'p'} class="reading-sheet-text">${escape(note.text)}</${kind==='quote'?'blockquote':'p'}></li>`).join('')}
      </ol></section>`:'';
    }).join('')}`;
}

export function installReadingDiscussion(root,noteKinds){
  const dialog=document.createElement('dialog'), printout=document.createElement('article');
  dialog.id='reading-discussion-dialog';
  dialog.setAttribute('aria-labelledby','reading-discussion-title');
  printout.id='reading-discussion-print';
  printout.hidden=true;
  root.append(dialog);
  document.body.append(printout);
  let book,notes=[],trigger;
  function update(){
    const checked=[...dialog.querySelectorAll('[data-discussion-note]:checked')];
    const chosen=checked.map(input=>notes[Number(input.value)]);
    const all=dialog.querySelector('#reading-discussion-all');
    all.checked=chosen.length===notes.length&&notes.length>0;
    all.indeterminate=chosen.length>0&&chosen.length<notes.length;
    dialog.querySelector('#reading-discussion-count').textContent=`${chosen.length} of ${notes.length} selected`;
    dialog.querySelector('[data-discussion-print]').disabled=!chosen.length;
    const preview=dialog.querySelector('.reading-discussion-preview');
    preview.innerHTML=chosen.length?discussionSheet(book,chosen):'<p>Choose notes to preview your sheet.</p>';
  }
  dialog.addEventListener('change',event=>{
    if(event.target.id==='reading-discussion-all'){
      for(const input of dialog.querySelectorAll('[data-discussion-note]'))input.checked=event.target.checked;
    }
    update();
  });
  dialog.addEventListener('click',event=>{
    if(event.target.closest('[data-discussion-close]'))dialog.close();
    if(event.target.closest('[data-discussion-print]:not(:disabled)')){
      printout.innerHTML=dialog.querySelector('.reading-discussion-preview').innerHTML;
      printout.hidden=false;
      window.print();
    }
  });
  function clearPrintout(){printout.hidden=true;printout.replaceChildren();}
  window.addEventListener('afterprint',clearPrintout);
  dialog.addEventListener('close',()=>{
    clearPrintout();
    const anchor=trigger?.isConnected?trigger:root.querySelector('[data-reading-discussion]');
    anchor?.focus({preventScroll:true});
  });
  return {open(current,chapterNotes,anchor){
    book=current;
    notes=[...chapterNotes].sort((a,b)=>chapters.compare(a.chapter,b.chapter));
    trigger=anchor;
    dialog.innerHTML=`<header class="reading-discussion-header"><div><h2 id="reading-discussion-title">Discussion sheet</h2>
      <p>${escape(book.title)}</p></div><button type="button" data-discussion-close aria-label="Close discussion sheet">×</button></header>
      <div class="reading-discussion-content">
        <section aria-label="Choose chapter notes"><label class="reading-discussion-toggle"><input type="checkbox" id="reading-discussion-all" ${notes.length?'':'disabled'}> Select all</label>
        ${notes.length?`<ul>${notes.map((note,index)=>`<li><label><input type="checkbox" value="${index}" data-discussion-note>
          <span><strong>${noteKinds[note.kind]} · ${escape(chapterLabel(note.chapter))}</strong><span class="reading-discussion-note">${escape(note.text)}</span></span></label></li>`).join('')}</ul>`:
          '<p>Add a quote, question, or insight under Chapter notes to build a sheet.</p>'}</section>
        <section class="reading-discussion-preview" aria-label="Print preview"></section>
      </div>
      <footer class="reading-discussion-footer"><span id="reading-discussion-count" role="status"></span>
        <button type="button" data-discussion-print disabled>Print / Save PDF</button></footer>`;
    update();
    dialog.showModal();
  }};
}
