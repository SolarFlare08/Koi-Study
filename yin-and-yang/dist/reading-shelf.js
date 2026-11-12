const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const normalized=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const formatDay=day=>new Date(day+'T12:00:00').toLocaleDateString([],{dateStyle:'medium'});
const bookKey=(title='',author='')=>JSON.stringify([normalized(title),normalized(author)]);
const chapterLines=value=>(value||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
const lastPosition=item=>item.position||chapterLines(item.chapters).at(-1)||'';

export function annotationContext(rituals,date,book){
  const entry=rituals[date]?.annotate;
  const records=Object.entries(rituals).filter(([day,item])=>day<=date&&item.annotate?.title?.trim())
    .sort(([a],[b])=>b.localeCompare(a));
  const selected=book||records[0]?.[1].annotate;
  const key=selected&&bookKey(selected.title,selected.author);
  const matching=records.filter(([,item])=>bookKey(item.annotate.title,item.annotate.author)===key);
  const last=matching.find(([,item])=>lastPosition(item.annotate));
  const [recentDate,recentDay]=matching[0]||[];
  const recent=recentDay?.annotate;
  const checkedSince=recent?.goal&&Object.entries(rituals).some(([day,item])=>
    day>recentDate&&day<=date&&item.annotate?.done&&!item.annotate.title);
  const goal=entry?.title?entry:entry?.done||recent?.done||checkedSince?null:recent;
  return {book:selected,last:last?lastPosition(last[1].annotate):'',goal:goal?.goal,goalType:goal?.goalType};
}

const noteKinds={question:'Question',quote:'Quote',insight:'Insight'};

export function loadReadingNotes(value){
  if(!Array.isArray(value))return [];
  return value.filter(note=>typeof note?.id==='string'&&typeof note.bookTitle==='string'&&note.bookTitle.trim()&&
    typeof note.chapter==='string'&&note.chapter.trim()&&typeof note.text==='string'&&note.text.trim()&&Object.hasOwn(noteKinds,note.kind))
    .map(note=>({id:note.id,bookTitle:note.bookTitle.slice(0,250),bookAuthor:typeof note.bookAuthor==='string'?note.bookAuthor.slice(0,200):'',
      chapter:note.chapter.slice(0,120),text:note.text.slice(0,2000),kind:note.kind,queued:note.queued===true}));
}

export function readingShelf(rituals,notes=[]){
  const books=new Map();
  for(const [date,day] of Object.entries(rituals).sort(([a],[b])=>b.localeCompare(a))){
    const entry=day.annotate;
    if(!entry?.title?.trim())continue;
    const title=entry.title.trim(),author=entry.author?.trim()||'';
    const id=bookKey(title,author);
    if(!books.has(id))books.set(id,{id,title,author,entries:[]});
    const chapters=chapterLines(entry.chapters);
    books.get(id).entries.push({date,chapters,...(entry.position?{position:entry.position}:{}),
      ...(entry.totalPages?{totalPages:entry.totalPages}:{})});
  }
  for(const note of notes){
    const id=bookKey(note.bookTitle,note.bookAuthor);
    if(!books.has(id))books.set(id,{id,title:note.bookTitle,author:note.bookAuthor,entries:[]});
  }
  return [...books.values()].map(book=>{
    const chapters=new Map();
    for(const entry of book.entries){
      for(const chapter of entry.chapters)if(!chapters.has(normalized(chapter)))chapters.set(normalized(chapter),chapter);
    }
    const last=book.entries.find(entry=>entry.position||entry.chapters.length);
    return {...book,chapters:[...chapters.values()],last:last?{date:last.date,chapter:last.position||last.chapters.at(-1)}:null};
  });
}

export function countReadingChapters(rituals){
  return readingShelf(rituals).reduce((total,book)=>{
    const ranges=[],names=new Set();
    for(const chapter of book.chapters){
      const match=normalized(chapter).match(/^(?:chapters?\s+)?(\d{1,5})(?:\s*[-–—]\s*(\d{1,5}))?$/);
      if(!match){names.add(normalized(chapter));continue;}
      const start=Number(match[1]),end=Number(match[2]||match[1]);
      if(end>=start)ranges.push({start,end});
      else names.add(normalized(chapter));
    }
    ranges.sort((a,b)=>a.start-b.start);
    let last=-1, count=names.size;
    for(const {start,end} of ranges){
      count+=Math.max(0,end-Math.max(last,start-1));
      last=Math.max(last,end);
    }
    return total+count;
  },0);
}

export function readingForecast(book){
  const total=book.entries.find(entry=>entry.totalPages)?.totalPages;
  const pages=book.entries.flatMap(entry=>{
    const match=normalized(entry.position).match(/^(?:page\s+|p\.?\s*)?(\d{1,6})$/);
    return match?[Number(match[1])]:[];
  });
  const current=pages[0];
  if(!total||current===undefined)return null;
  const remaining=Math.max(0,total-current);
  const advances=pages.slice(0,-1).map((page,index)=>page-pages[index+1]).filter(delta=>delta>0).slice(0,5);
  const pace=advances.length?advances.reduce((sum,value)=>sum+value,0)/advances.length:0;
  return {current,total,remaining,samples:advances.length,pace,sittings:remaining===0?0:pace?Math.ceil(remaining/pace):null};
}

function forecastMarkup(book){
  const forecast=readingForecast(book);
  if(!forecast)return '';
  const {current,total,remaining,sittings,pace,samples}=forecast;
  const prediction=!remaining?'Finished':sittings===null?'Log another page position to estimate your pace.':
    `About ${sittings} ${sittings===1?'sitting':'sittings'} left at ${Math.round(pace)} pages per log.`;
  return `<section class="reading-forecast"><h4>Reading pace</h4><p>Page ${current} of ${total} · ${remaining} pages left</p>
    <p>${prediction}${samples&&remaining?` Based on ${samples} recent ${samples===1?'advance':'advances'} between page logs.`:''}</p></section>`;
}

export function installReadingShelf({root,getRituals,getNotes,saveNotes,openCalendar,linkedNotes=()=>'',bookReward,finishBook}){
  root.innerHTML=`<div class="reading-wrap">
    <header class="reading-heading"><h2 id="reading-heading">Reading shelf</h2><div class="reading-actions">
      <button type="button" id="reading-review" aria-pressed="false">Review queue</button><button type="button" id="reading-calendar">Open Calendar</button></div></header>
    <p class="sr-only" id="reading-note-status" role="status"></p>
    <div class="reading-layout"><section class="reading-books" aria-label="Books">
      <label class="sr-only" for="reading-search">Find a book</label><input type="search" id="reading-search" placeholder="Find a book">
      <div id="reading-books"></div></section>
      <section id="reading-history" aria-label="Annotation history"></section>
    </div></div>`;
  const search=root.querySelector('#reading-search');
  const list=root.querySelector('#reading-books');
  const history=root.querySelector('#reading-history');
  let selected='',review=false,editingNote='';
  const reviewButton=root.querySelector('#reading-review');
  const status=root.querySelector('#reading-note-status');

  function noteList(notes,showBook=false){
    return `<ul class="reading-note-list">${notes.map(note=>`<li>
      <p class="reading-note-meta">${showBook?`${escape(note.bookTitle)} · `:''}${escape(note.chapter)} · ${noteKinds[note.kind]}</p>
      <p class="reading-note-text">${escape(note.text)}</p>
      <div class="reading-note-actions">
        <button type="button" data-note-review="${escape(note.id)}">${note.queued?(showBook?'Mark reviewed':'Remove from queue'):'Add to queue'}</button>
        ${showBook?'':`<button type="button" data-note-edit="${escape(note.id)}">Edit</button>`}
      </div></li>`).join('')}</ul>`;
  }

  function noteEditor(book,notes){
    const note=notes.find(item=>item.id===editingNote);
    const chapter=note?.chapter||book.entries.find(entry=>entry.chapters.length)?.chapters.at(-1)||'';
    return `<section class="reading-notes"><h4>Chapter notes</h4>
      <details ${note?'open':''}><summary>${note?'Edit chapter note':'Add chapter note'}</summary>
        <form id="reading-note-form">
          <label>Chapter<input name="chapter" maxlength="120" required list="reading-note-chapters" value="${escape(chapter)}"></label>
          <datalist id="reading-note-chapters">${book.chapters.map(item=>`<option value="${escape(item)}"></option>`).join('')}</datalist>
          <label>Type<select name="kind">${Object.entries(noteKinds).map(([value,label])=>`<option value="${value}" ${note?.kind===value?'selected':''}>${label}</option>`).join('')}</select></label>
          <label>Note<textarea name="text" maxlength="2000" required rows="4">${escape(note?.text)}</textarea></label>
          <label class="reading-note-check"><input name="queued" type="checkbox" ${note?.queued!==false?'checked':''}> Add to review queue</label>
          <div class="reading-note-actions"><button type="submit">Save note</button>${note?'<button type="button" data-note-cancel>Cancel edit</button><button type="button" data-note-delete>Delete note</button>':''}</div>
        </form></details>${noteList(notes)}</section>`;
  }

  function render(){
    const query=normalized(search.value);
    const notes=getNotes(),queued=notes.filter(note=>note.queued);
    reviewButton.textContent=`Review queue${queued.length?` (${queued.length})`:''}`;
    reviewButton.setAttribute('aria-pressed',String(review));
    const books=readingShelf(getRituals(),notes).filter(book=>normalized(`${book.title} ${book.author}`).includes(query));
    const current=books.find(book=>book.id===selected)||books[0];
    list.innerHTML=books.map(book=>`<button type="button" data-reading-book="${escape(book.id)}" aria-pressed="${book===current}">
      <strong>${escape(book.title)}</strong><small>${book.author?`${escape(book.author)} · `:''}${book.entries.length} ${book.entries.length===1?'entry':'entries'}</small>
    </button>`).join('')||`<p>${query?'No books match your search.':'No books logged yet.'}</p>`;
    if(review){
      history.innerHTML=`<h3>Review queue</h3>${queued.length?noteList(queued,true):'<p>Mark chapter notes for review to see them here.</p>'}`;
      return;
    }
    if(!current){
      history.innerHTML=query?'':'<p>Use Annotate on a calendar day to add your first book and chapter notes.</p>';
      return;
    }
    selected=current.id;
    const reward=bookReward(current.id);
    const chips=current.chapters.map(chapter=>`<li>${escape(chapter)}</li>`).join('');
    history.innerHTML=`<h3>${escape(current.title)}</h3>${current.author?`<p class="reading-author">${escape(current.author)}</p>`:''}
      <div class="reading-growth-action">${reward?'<span class="garden-growth-status" id="reading-growth-status" tabindex="-1">Finished · Lantern lit</span>':
        '<button type="button" class="garden-growth-action" data-finish-book>Mark book finished</button>'}</div>
      ${current.last?`<div class="reading-resume"><span>Where you left off</span><strong>${escape(current.last.chapter)}</strong><time datetime="${current.last.date}">${escape(formatDay(current.last.date))}</time></div>`:''}
      ${reward?'':forecastMarkup(current)}
      ${chips?`<h4>Chapters annotated</h4><ul class="reading-chapters">${chips}</ul>`:''}
      ${linkedNotes(current.id)}
      ${noteEditor(current,notes.filter(note=>bookKey(note.bookTitle,note.bookAuthor)===current.id))}
      <h4>History</h4><ol class="reading-timeline">${current.entries.map(entry=>`<li>
        <time datetime="${entry.date}">${escape(formatDay(entry.date))}</time>
        ${entry.chapters.length?`<ul>${entry.chapters.map(chapter=>`<li>${escape(chapter)}</li>`).join('')}</ul>`:''}
        ${entry.position?`<p>Stopped at ${escape(entry.position)}</p>`:entry.chapters.length?'':'<p>No chapters logged.</p>'}
      </li>`).join('')}</ol>`;
  }
  search.addEventListener('input',()=>{review=false;editingNote='';render();});
  reviewButton.addEventListener('click',()=>{review=!review;editingNote='';render();});
  root.querySelector('#reading-calendar').addEventListener('click',openCalendar);
  list.addEventListener('click',event=>{
    const book=event.target.closest('[data-reading-book]');
    if(!book)return;
    selected=book.dataset.readingBook;review=false;editingNote='';
    render();
    list.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
  });
  history.addEventListener('submit',event=>{
    if(event.target.id!=='reading-note-form')return;
    event.preventDefault();
    const form=event.target,fields=new FormData(form),notes=getNotes();
    const book=readingShelf(getRituals(),notes).find(item=>item.id===selected);
    if(!book)return;
    const chapter=String(fields.get('chapter')).trim(),text=String(fields.get('text')).trim();
    if(!chapter||!text){
      const input=chapter?form.elements.text:form.elements.chapter;
      input.setCustomValidity('Enter a chapter and a note.');input.reportValidity();return;
    }
    const note={id:editingNote||crypto.randomUUID(),bookTitle:book.title,bookAuthor:book.author,chapter,text,kind:fields.get('kind'),queued:fields.has('queued')};
    const next=editingNote?notes.map(item=>item.id===editingNote?note:item):[...notes,note];
    if(saveNotes(next)){editingNote='';render();history.querySelector('summary')?.focus();status.textContent='Chapter note saved.';}
  });
  history.addEventListener('input',event=>event.target.setCustomValidity?.(''));
  history.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if('finishBook' in button.dataset){
      const book=readingShelf(getRituals(),getNotes()).find(item=>item.id===selected);
      if(book&&finishBook(book)){
        render();
        history.querySelector('#reading-growth-status')?.focus({preventScroll:true});
      }
      return;
    }
    const {noteReview,noteEdit,noteCancel,noteDelete}=button.dataset;
    if(noteReview){
      const notes=getNotes(),item=notes.find(note=>note.id===noteReview);
      if(item&&saveNotes(notes.map(note=>note===item?{...note,queued:!note.queued}:note))){
        render();status.textContent=item.queued?'Removed from review queue.':'Added to review queue.';
        (history.querySelector(`[data-note-review="${CSS.escape(noteReview)}"]`)||reviewButton).focus();
      }
    }else if(noteEdit){
      editingNote=noteEdit;render();history.querySelector('[name="text"]')?.focus();
    }else if(noteCancel!==undefined||noteDelete!==undefined&&saveNotes(getNotes().filter(note=>note.id!==editingNote))){
      editingNote='';render();history.querySelector('summary')?.focus();
    }
  });
  return {render,openBook(id){selected=id;review=false;editingNote='';search.value='';render();list.querySelector('[aria-pressed="true"]')?.focus();}};
}
