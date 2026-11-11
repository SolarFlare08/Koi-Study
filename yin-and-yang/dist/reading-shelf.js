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

export function readingShelf(rituals){
  const books=new Map();
  for(const [date,day] of Object.entries(rituals).sort(([a],[b])=>b.localeCompare(a))){
    const entry=day.annotate;
    if(!entry?.title?.trim())continue;
    const title=entry.title.trim(),author=entry.author?.trim()||'';
    const id=bookKey(title,author);
    if(!books.has(id))books.set(id,{id,title,author,entries:[]});
    const chapters=chapterLines(entry.chapters);
    books.get(id).entries.push({date,chapters,...(entry.position?{position:entry.position}:{})});
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

export function installReadingShelf({root,getRituals,openCalendar}){
  root.innerHTML=`<div class="reading-wrap">
    <header class="reading-heading"><h2 id="reading-heading">Reading shelf</h2><button type="button" id="reading-calendar">Open Calendar</button></header>
    <div class="reading-layout"><section class="reading-books" aria-label="Books">
      <label class="sr-only" for="reading-search">Find a book</label><input type="search" id="reading-search" placeholder="Find a book">
      <div id="reading-books"></div></section>
      <section id="reading-history" aria-label="Annotation history"></section>
    </div></div>`;
  const search=root.querySelector('#reading-search');
  const list=root.querySelector('#reading-books');
  const history=root.querySelector('#reading-history');
  let selected='';

  function render(){
    const query=normalized(search.value);
    const books=readingShelf(getRituals()).filter(book=>normalized(`${book.title} ${book.author}`).includes(query));
    const current=books.find(book=>book.id===selected)||books[0];
    list.innerHTML=books.map(book=>`<button type="button" data-reading-book="${escape(book.id)}" aria-pressed="${book===current}">
      <strong>${escape(book.title)}</strong><small>${book.author?`${escape(book.author)} · `:''}${book.entries.length} ${book.entries.length===1?'entry':'entries'}</small>
    </button>`).join('')||`<p>${query?'No books match your search.':'No books logged yet.'}</p>`;
    if(!current){
      history.innerHTML=query?'':'<p>Use Annotate on a calendar day to add your first book and chapter notes.</p>';
      return;
    }
    selected=current.id;
    const chips=current.chapters.map(chapter=>`<li>${escape(chapter)}</li>`).join('');
    history.innerHTML=`<h3>${escape(current.title)}</h3>${current.author?`<p class="reading-author">${escape(current.author)}</p>`:''}
      ${current.last?`<div class="reading-resume"><span>Where you left off</span><strong>${escape(current.last.chapter)}</strong><time datetime="${current.last.date}">${escape(formatDay(current.last.date))}</time></div>`:''}
      ${chips?`<h4>Chapters annotated</h4><ul class="reading-chapters">${chips}</ul>`:''}
      <h4>History</h4><ol class="reading-timeline">${current.entries.map(entry=>`<li>
        <time datetime="${entry.date}">${escape(formatDay(entry.date))}</time>
        ${entry.chapters.length?`<ul>${entry.chapters.map(chapter=>`<li>${escape(chapter)}</li>`).join('')}</ul>`:''}
        ${entry.position?`<p>Stopped at ${escape(entry.position)}</p>`:entry.chapters.length?'':'<p>No chapters logged.</p>'}
      </li>`).join('')}</ol>`;
  }
  search.addEventListener('input',render);
  root.querySelector('#reading-calendar').addEventListener('click',openCalendar);
  list.addEventListener('click',event=>{
    const book=event.target.closest('[data-reading-book]');
    if(!book)return;
    selected=book.dataset.readingBook;
    render();
    list.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
  });
  return {render,openBook(id){selected=id;search.value='';render();list.querySelector('[aria-pressed="true"]')?.focus();}};
}
