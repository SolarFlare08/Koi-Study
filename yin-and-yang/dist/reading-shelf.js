import {collectionKinds,loadReadingCollections,readingDay,relinkReadingCollections,rereadRecord,reviewChapter,validReadingDay} from './reading-progress.js';

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
      chapter:note.chapter.slice(0,120),text:note.text.slice(0,2000),kind:note.kind,queued:note.queued===true,
      ...(note.queued&&validReadingDay(note.reviewDue)?{reviewDue:note.reviewDue,reviewLevel:Number.isInteger(note.reviewLevel)?Math.min(4,Math.max(0,note.reviewLevel)):0}:{})}));
}

export function readingShelf(rituals,notes=[],finished=[]){
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
  for(const record of finished){
    const id=bookKey(record.title,record.author);
    const book=books.get(id)||{id,entries:[]};
    books.set(id,{...book,title:record.title,author:record.author,finished:record});
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

export function finishedBook(value){
  if(typeof value?.id!=='string'||!value.id||typeof value.title!=='string'||!value.title.trim())return null;
  const date=new Date(`${value.finishedOn}T00:00:00Z`);
  if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value.finishedOn)return null;
  const clean=(text,limit)=>typeof text==='string'?text.trim().slice(0,limit):'';
  return {id:value.id,title:clean(value.title,250),author:clean(value.author,200),finishedOn:value.finishedOn,
    totalPages:Number.isInteger(value.totalPages)&&value.totalPages>=1&&value.totalPages<=100000?value.totalPages:null,
    rating:Number.isInteger(value.rating)&&value.rating>=1&&value.rating<=5?value.rating:null,
    review:clean(value.review,6000),takeaway:clean(value.takeaway,500),
    ...(Array.isArray(value.rereads)?{rereads:[...new Map(value.rereads.map(rereadRecord).filter(Boolean).map(item=>[item.id,item])).values()]}:{})};
}

export function loadFinishedBooks(value,growth,rituals,notes){
  const records=new Map((Array.isArray(value)?value:[]).map(finishedBook).filter(Boolean).map(item=>[item.id,item]));
  let books;
  for(const reward of growth){
    if(reward.kind!=='book'||records.has(reward.sourceId))continue;
    if(!reward.sourceId.startsWith('['))continue;
    books??=new Map(readingShelf(rituals,notes).map(book=>[book.id,book]));
    const book=books.get(reward.sourceId);
    if(book){
      const totalPages=book.entries.find(entry=>entry.totalPages)?.totalPages;
      records.set(reward.sourceId,finishedBook({id:reward.sourceId,title:book.title,author:book.author,finishedOn:reward.day,totalPages}));
    }else{
      // Old lanterns used the normalized title/author tuple as their identity.
      try{
        const [title,author]=JSON.parse(reward.sourceId);
        if(typeof title!=='string'||typeof author!=='string'||bookKey(title,author)!==reward.sourceId)continue;
        const displayTitle=author?reward.title.slice(0,reward.title.lastIndexOf(' · ')):reward.title;
        const record=finishedBook({id:reward.sourceId,title:displayTitle||title,author,finishedOn:reward.day});
        if(record)records.set(reward.sourceId,record);
      }catch{ /* Other landmark IDs do not identify a shelf entry. */ }
    }
  }
  return [...records.values()];
}

export function editFinishedBook(state,id,values){
  const previous=state.finishedBooks.find(item=>item.id===id);
  const updated=finishedBook({...previous,...values,id});
  if(!previous||!updated)return {error:'Enter a title and a valid finish date.'};
  const oldKey=bookKey(previous.title,previous.author), newKey=bookKey(updated.title,updated.author);
  const books=readingShelf(state.dailyRituals,state.readingNotes,state.finishedBooks);
  if(newKey!==oldKey&&books.some(book=>book.id===newKey))return {error:'A book with that title and author is already on your shelf.'};
  const matches=(title,author)=>bookKey(title,author)===oldKey;
  const dailyRituals=Object.fromEntries(Object.entries(state.dailyRituals).map(([day,rituals])=>{
    if(!rituals.annotate?.title||!matches(rituals.annotate.title,rituals.annotate.author))return [day,rituals];
    const annotate={...rituals.annotate,title:updated.title,author:updated.author};
    if(updated.totalPages!==previous.totalPages){
      if(updated.totalPages)annotate.totalPages=updated.totalPages;
      else delete annotate.totalPages;
    }
    return [day,{...rituals,annotate}];
  }));
  const readingNotes=state.readingNotes.map(note=>matches(note.bookTitle,note.bookAuthor)?
    {...note,bookTitle:updated.title,bookAuthor:updated.author}:note);
  const stickyNotes=newKey===oldKey?state.stickyNotes:state.stickyNotes.map(note=>{
    if(!note.related?.some(item=>item.kind==='book'&&item.id===oldKey))return note;
    const related=note.related.filter(item=>item.kind!=='book'||item.id!==oldKey&&item.id!==newKey);
    return {...note,related:[...related,{kind:'book',id:newKey}]};
  });
  return {bookId:newKey,changes:{dailyRituals,readingNotes,stickyNotes,readingCollections:relinkReadingCollections(state.readingCollections,oldKey,newKey),
    finishedBooks:state.finishedBooks.map(item=>item===previous?updated:item)}};
}

export function mergeShelfBooks(state,sourceId,targetId){
  const books=readingShelf(state.dailyRituals,state.readingNotes,state.finishedBooks);
  const source=books.find(book=>book.id===sourceId),target=books.find(book=>book.id===targetId);
  if(!source||!target||source===target)return {error:'Choose another book to keep.'};
  const from=source.finished,into=target.finished,kept=into||from;
  const combine=(first,second)=>[...new Set([first,second].filter(Boolean))].join('\n\n');
  const review=combine(into?.review,from?.review),takeaway=combine(into?.takeaway,from?.takeaway);
  if(review.length>6000||takeaway.length>500)return {error:'The combined reviews or takeaways exceed the editor limit. Shorten them before merging.'};
  const finishedBooks=state.finishedBooks.filter(item=>item!==from&&item!==into);
  if(kept)finishedBooks.push({...kept,title:target.title,author:target.author,review,takeaway,
    rereads:[...new Map([...(from?.rereads||[]),...(into?.rereads||[])].map(item=>[item.id,item])).values()],
    rating:into?.rating??from?.rating,totalPages:into?.totalPages??from?.totalPages});
  const dailyRituals=Object.fromEntries(Object.entries(state.dailyRituals).map(([date,day])=>{
    if(!day.annotate||bookKey(day.annotate.title,day.annotate.author)!==sourceId)return [date,day];
    return [date,{...day,annotate:{...day.annotate,title:target.title,author:target.author}}];
  }));
  const readingNotes=state.readingNotes.map(note=>bookKey(note.bookTitle,note.bookAuthor)===sourceId?
    {...note,bookTitle:target.title,bookAuthor:target.author}:note);
  const stickyNotes=state.stickyNotes.map(note=>{
    if(!note.related?.some(item=>item.kind==='book'&&item.id===sourceId))return note;
    const related=note.related.filter(item=>item.kind!=='book'||item.id!==sourceId&&item.id!==targetId);
    return {...note,related:[...related,{kind:'book',id:targetId}]};
  });
  let gardenGrowth=state.gardenGrowth;
  if(from&&into){
    const hasTargetLantern=gardenGrowth.some(item=>item.kind==='book'&&item.sourceId===into.id);
    gardenGrowth=gardenGrowth.flatMap(item=>item.kind==='book'&&item.sourceId===from.id?
      hasTargetLantern?[]:[{...item,sourceId:into.id}]:[item]);
  }
  return {bookId:targetId,changes:{dailyRituals,readingNotes,stickyNotes,finishedBooks,gardenGrowth,
    readingCollections:relinkReadingCollections(state.readingCollections,sourceId,targetId)}};
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
  const range=advances.length>1&&remaining?[Math.ceil(remaining/Math.max(...advances)),Math.ceil(remaining/Math.min(...advances))]:null;
  return {current,total,remaining,samples:advances.length,pace,range,sittings:remaining===0?0:pace?Math.ceil(remaining/pace):null};
}

function forecastMarkup(book){
  const forecast=readingForecast(book);
  if(!forecast)return '';
  const {current,total,remaining,sittings,pace,samples,range}=forecast;
  const prediction=!remaining?'Finished':sittings===null?'Log another page position to estimate your pace.':
    range&&range[0]!==range[1]?`About ${range[0]}–${range[1]} sittings left, based on your fastest and slowest recent advances.`:
    `About ${sittings} ${sittings===1?'sitting':'sittings'} left at ${Math.round(pace)} pages per log.`;
  return `<section class="reading-forecast"><h4>Reading pace</h4><p>Page ${current} of ${total} · ${remaining} pages left</p>
    <p>${prediction}${samples&&remaining?` Based on ${samples} recent ${samples===1?'advance':'advances'} between page logs.`:''}</p></section>`;
}

export function installReadingShelf({root,getRituals,getNotes,saveNotes,openCalendar,linkedNotes=()=>'',getFinished,bookReward,finishBook,saveBook,mergeBooks,getCollections,saveCollections}){
  root.innerHTML=`<div class="reading-wrap">
    <header class="reading-heading"><h2 id="reading-heading">Reading shelf</h2><div class="reading-actions">
      <button type="button" id="reading-finished" aria-pressed="false">Finished books</button>
      <button type="button" id="reading-collections-toggle" aria-expanded="false" aria-controls="reading-collections">Collections</button>
      <button type="button" id="reading-review" aria-pressed="false">Review queue</button><button type="button" id="reading-calendar">Open Calendar</button></div></header>
    <p class="sr-only" id="reading-note-status" role="status"></p>
    <section id="reading-collections" aria-label="Reading collections" hidden></section>
    <div class="reading-layout"><section class="reading-books" aria-label="Books">
      <label class="sr-only" for="reading-search">Find a book</label><input type="search" id="reading-search" placeholder="Find a book">
      <label class="reading-sort">Sort books<select id="reading-sort"><option value="last">Last read</option><option value="finished">Finish date</option><option value="rating">Rating</option></select></label>
      <div id="reading-books"></div></section>
      <section id="reading-history" aria-label="Annotation history"></section>
    </div></div>`;
  const search=root.querySelector('#reading-search');
  const list=root.querySelector('#reading-books');
  const history=root.querySelector('#reading-history');
  let selected='',review=false,editingNote='',editingBook=false,finishedOnly=false;
  let collectionId='',editingReread=null;
  const collections=root.querySelector('#reading-collections');
  const collectionToggle=root.querySelector('#reading-collections-toggle');
  const sort=root.querySelector('#reading-sort');
  const reviewButton=root.querySelector('#reading-review');
  const finishedButton=root.querySelector('#reading-finished');
  const status=root.querySelector('#reading-note-status');
  const shelf=()=>readingShelf(getRituals(),getNotes(),getFinished());

  function collectionMarkup(books){
    const groups=getCollections();
    const group=groups.find(item=>item.id===collectionId);
    const names=new Map(books.map(book=>[book.id,book]));
    return `<h3>Reading collections</h3><label>Collection<select id="reading-collection-picker"><option value="">New collection</option>${groups.map(item=>
      `<option value="${escape(item.id)}" ${item===group?'selected':''}>${collectionKinds[item.kind]} · ${escape(item.name)}</option>`).join('')}</select></label>
      <form id="reading-collection-form"><label>Name<input name="name" maxlength="80" required value="${escape(group?.name)}"></label>
        <label>Type<select name="kind">${Object.entries(collectionKinds).map(([key,label])=>`<option value="${key}" ${group?.kind===key?'selected':''}>${label}</option>`).join('')}</select></label>
        <button type="submit">${group?'Save collection':'Create collection'}</button></form>
      ${group?`<ol class="reading-collection-order">${group.books.map((id,index)=>{
        const title=names.get(id)?.title;
        return `<li>${title?`<button type="button" data-open-collection-book="${escape(id)}">${escape(title)}</button>`:'<span>Book unavailable</span>'}
          <button type="button" data-collection-index="${index}" data-collection-move="-1" ${index===0?'disabled':''} aria-label="Move ${escape(title||'book')} up">↑</button>
          <button type="button" data-collection-index="${index}" data-collection-move="1" ${index===group.books.length-1?'disabled':''} aria-label="Move ${escape(title||'book')} down">↓</button>
          <button type="button" data-collection-index="${index}" data-collection-remove aria-label="Remove ${escape(title||'book')}">Remove</button></li>`;
      }).join('')}</ol><form id="reading-collection-add"><label>Book to add<select name="book" required><option value="">Choose a book</option>${books.filter(book=>!group.books.includes(book.id)).map(book=>
        `<option value="${escape(book.id)}">${escape([book.title,book.author].filter(Boolean).join(' · '))}</option>`).join('')}</select></label><button type="submit">Add book</button></form>`:''}`;
  }

  function updateCollection(updated){
    const next=getCollections().filter(item=>item.id!==updated.id);
    if(!saveCollections([...next,updated]))return false;
    collectionId=updated.id;render();return true;
  }

  function rereadsMarkup(record){
    const entries=[...(record.rereads||[])].sort((a,b)=>b.finishedOn.localeCompare(a.finishedOn));
    const current=entries.find(item=>item.id===editingReread);
    return `<section class="reading-rereads"><h4>Reread log</h4>${entries.map(item=>`<article>
      <p><time datetime="${item.finishedOn}">${formatDay(item.finishedOn)}</time>${item.rating?` · ${item.rating} / 5`:''}</p>
      ${item.review?`<p class="finished-book-review">${escape(item.review)}</p>`:''}<button type="button" data-edit-reread="${escape(item.id)}">Edit reread</button></article>`).join('')}
      ${editingReread===null?'<button type="button" data-edit-reread="">Log a reread</button>':`<form id="reading-reread-form">
        <label>Reread finish date<input type="date" name="finishedOn" value="${current?.finishedOn||readingDay()}" required></label>
        <label>Reread rating<input type="number" name="rating" min="1" max="5" step="1" value="${current?.rating??''}"></label>
        <label>Reread review<textarea name="review" rows="5" maxlength="6000">${escape(current?.review)}</textarea></label>
        <p role="alert" id="reread-error" hidden></p><div class="reading-note-actions"><button type="submit">Save reread</button><button type="button" data-cancel-reread>Cancel</button></div>
      </form>`}</section>`;
  }

  function finishedMarkup(record){
    const hasReview=record.review||record.takeaway||record.rating;
    const lamp=bookReward(record.id)?' · Lantern lit':'';
    const ratingOptions=Array.from({length:5},(_,index)=>index+1).map(rating=>
      `<option value="${rating}" ${record.rating===rating?'selected':''}>${rating} / 5</option>`).join('');
    return `<section class="finished-book" aria-labelledby="finished-book-title">
      <h4 id="finished-book-title">Finished book</h4>
      <p><time datetime="${record.finishedOn}">${escape(formatDay(record.finishedOn))}</time>${record.totalPages?` · ${record.totalPages} pages`:''}${lamp}</p>
      ${editingBook?`<form id="finished-book-form">
        <div class="finished-book-fields">
          <label>Book title<input name="title" maxlength="250" required value="${escape(record.title)}"></label>
          <label>Author<input name="author" maxlength="200" value="${escape(record.author)}"></label>
          <label>Finish date<input type="date" name="finishedOn" required value="${record.finishedOn}"></label>
          <label>Total pages<input type="number" name="totalPages" min="1" max="100000" value="${record.totalPages??''}"></label>
        </div>
        <label>Rating<select name="rating"><option value="">Unrated</option>${ratingOptions}</select></label>
        <label>Final review<textarea name="review" maxlength="6000" rows="7" placeholder="What did you think of the book?">${escape(record.review)}</textarea></label>
        <label>Main takeaway<textarea name="takeaway" maxlength="500" rows="2" placeholder="What do you want to remember?">${escape(record.takeaway)}</textarea></label>
        <p role="alert" id="finished-book-error" hidden></p>
        <div class="reading-note-actions"><button type="submit">Save finished book</button><button type="button" data-finished-cancel>Cancel</button></div>
      </form>`:`<div class="reading-note-actions">
        <button type="button" data-edit-finished="title">Edit book details</button>
        <button type="button" data-edit-finished="review">${hasReview?'Edit final review':'Write final review'}</button></div>
        ${hasReview?`<h4>Final review</h4>${record.rating?`<p>Rating · ${record.rating} / 5</p>`:''}
          ${record.review?`<p class="finished-book-review">${escape(record.review)}</p>`:''}
          ${record.takeaway?`<p class="finished-book-review"><strong>Main takeaway</strong><br>${escape(record.takeaway)}</p>`:''}`:''}`}
    </section>`;
  }

  function noteList(notes,showBook=false){
    return `<ul class="reading-note-list">${notes.map(note=>`<li>
      <p class="reading-note-meta">${showBook?`${escape(note.bookTitle)} · `:''}${escape(note.chapter)} · ${noteKinds[note.kind]}</p>
      <p class="reading-note-text">${escape(note.text)}</p>
      ${note.queued?`<p>${note.reviewDue&&note.reviewDue>readingDay()?`Due ${formatDay(note.reviewDue)}`:'Due now'}</p>`:''}
      <div class="reading-note-actions">
        ${showBook?`<button type="button" data-review-result="again" data-note-review="${escape(note.id)}">Again tomorrow</button>
          <button type="button" data-review-result="remembered" data-note-review="${escape(note.id)}">Remembered</button>`:''}
        <button type="button" data-note-review="${escape(note.id)}" data-review-result="${note.queued?'remove':'schedule'}">${note.queued?'Remove from queue':'Schedule review'}</button>
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
          <label class="reading-note-check"><input name="queued" type="checkbox" ${note?.queued?'checked':''}> Schedule chapter review</label>
          <div class="reading-note-actions"><button type="submit">Save note</button>${note?'<button type="button" data-note-cancel>Cancel edit</button><button type="button" data-note-delete>Delete note</button>':''}</div>
        </form></details>${noteList(notes)}</section>`;
  }

  function render(){
    const query=normalized(search.value);
    const notes=getNotes(),queued=notes.filter(note=>note.queued);
    const due=queued.filter(note=>!note.reviewDue||note.reviewDue<=readingDay());
    const upcoming=queued.filter(note=>note.reviewDue>readingDay()).sort((a,b)=>a.reviewDue.localeCompare(b.reviewDue));
    reviewButton.textContent=`Review queue${due.length?` (${due.length})`:''}`;
    reviewButton.setAttribute('aria-pressed',String(review));
    finishedButton.setAttribute('aria-pressed',String(finishedOnly&&!review));
    const all=shelf();
    if(!collections.hidden)collections.innerHTML=collectionMarkup(all);
    const finishedOn=book=>[book.finished?.finishedOn||'',...(book.finished?.rereads||[]).map(item=>item.finishedOn)].sort().at(-1);
    const last=book=>[book.entries[0]?.date||'',finishedOn(book)].sort().at(-1);
    const books=all.filter(book=>(!finishedOnly||book.finished)&&normalized(`${book.title} ${book.author}`).includes(query));
    books.sort((a,b)=>{
      if(sort.value==='rating'&&(a.finished?.rating||0)!==(b.finished?.rating||0))return (b.finished?.rating||0)-(a.finished?.rating||0);
      if(sort.value==='finished'&&finishedOn(a)!==finishedOn(b))return finishedOn(b).localeCompare(finishedOn(a));
      return last(b).localeCompare(last(a))||a.title.localeCompare(b.title);
    });
    const current=books.find(book=>book.id===selected)||books[0];
    list.innerHTML=books.map(book=>`<button type="button" data-reading-book="${escape(book.id)}" aria-pressed="${book===current}">
      <strong>${escape(book.title)}</strong><small>${book.author?`${escape(book.author)} · `:''}${book.finished?'Finished':`${book.entries.length} ${book.entries.length===1?'entry':'entries'}`}</small>
    </button>`).join('')||`<p>${query?'No books match your search.':finishedOnly?'No finished books yet.':'No books logged yet.'}</p>`;
    if(review){
      history.innerHTML=`<h3>Review queue</h3>${due.length?noteList(due,true):'<p>No chapter reviews due today.</p>'}
        ${upcoming.length?`<h4>Upcoming reviews</h4><ul>${upcoming.map(note=>`<li>${escape(note.bookTitle)} · ${escape(note.chapter)} · ${formatDay(note.reviewDue)}</li>`).join('')}</ul>`:''}`;
      return;
    }
    if(!current){
      history.innerHTML=query||finishedOnly?'':'<p>Use Annotate on a calendar day to add your first book and chapter notes.</p>';
      return;
    }
    if(selected!==current.id){editingBook=false;editingReread=null;editingNote='';}
    selected=current.id;
    const memberships=getCollections().filter(group=>group.books.includes(current.id));
    const chips=current.chapters.map(chapter=>`<li>${escape(chapter)}</li>`).join('');
    history.innerHTML=`<h3>${escape(current.title)}</h3>${current.author?`<p class="reading-author">${escape(current.author)}</p>`:''}
      ${memberships.length?`<p class="reading-author">${memberships.map(group=>`${escape(group.name)} · #${group.books.indexOf(current.id)+1}`).join(' / ')}</p>`:''}
      ${all.length>1?`<details class="reading-merge"><summary>Merge duplicate book</summary><form id="reading-merge-form">
        <p>Move this book’s annotation history and notes into the book you keep. If both are finished, the kept book supplies the rating and finish date. Review text is combined.</p>
        <label>Book to keep<select name="target" required><option value="">Choose a book</option>${all.filter(book=>book!==current).map(book=>
          `<option value="${escape(book.id)}">${escape([book.title,book.author].filter(Boolean).join(' · '))}</option>`).join('')}</select></label>
        <p role="alert" id="reading-merge-error" hidden></p><button type="submit">Merge into selected book</button></form></details>`:''}
      ${current.finished?finishedMarkup(current.finished):'<div class="reading-growth-action"><button type="button" class="garden-growth-action" data-finish-book>Mark book finished</button></div>'}
      ${current.finished?rereadsMarkup(current.finished):''}
      ${current.last?`<div class="reading-resume"><span>Where you left off</span><strong>${escape(current.last.chapter)}</strong><time datetime="${current.last.date}">${escape(formatDay(current.last.date))}</time></div>`:''}
      ${current.finished?'':forecastMarkup(current)}
      ${chips?`<h4>Chapters annotated</h4><ul class="reading-chapters">${chips}</ul>`:''}
      ${linkedNotes(current.id)}
      ${noteEditor(current,notes.filter(note=>bookKey(note.bookTitle,note.bookAuthor)===current.id))}
      <h4>History</h4><ol class="reading-timeline">${current.entries.map(entry=>`<li>
        <time datetime="${entry.date}">${escape(formatDay(entry.date))}</time>
        ${entry.chapters.length?`<ul>${entry.chapters.map(chapter=>`<li>${escape(chapter)}</li>`).join('')}</ul>`:''}
        ${entry.position?`<p>Stopped at ${escape(entry.position)}</p>`:entry.chapters.length?'':'<p>No chapters logged.</p>'}
      </li>`).join('')}</ol>`;
  }
  search.addEventListener('input',()=>{review=false;editingNote='';editingBook=false;editingReread=null;render();});
  collectionToggle.addEventListener('click',()=>{
    collections.hidden=!collections.hidden;
    collectionToggle.setAttribute('aria-expanded',String(!collections.hidden));
    if(!collections.hidden){collections.innerHTML=collectionMarkup(shelf());collections.querySelector('select').focus();}
  });
  collections.addEventListener('change',event=>{
    if(event.target.id!=='reading-collection-picker')return;
    collectionId=event.target.value;collections.innerHTML=collectionMarkup(shelf());collections.querySelector('select').focus();
  });
  collections.addEventListener('submit',event=>{
    event.preventDefault();
    const fields=new FormData(event.target),group=getCollections().find(item=>item.id===collectionId);
    if(event.target.id==='reading-collection-form'){
      const [updated]=loadReadingCollections([{id:group?.id||crypto.randomUUID(),name:fields.get('name'),kind:fields.get('kind'),books:group?.books||[]}]);
      if(updated&&updateCollection(updated)){status.textContent='Collection saved.';collections.querySelector('#reading-collection-picker').focus();}
    }else if(event.target.id==='reading-collection-add'&&group){
      const id=fields.get('book');
      if(shelf().some(book=>book.id===id)&&!group.books.includes(id)&&updateCollection({...group,books:[...group.books,id]})){
        status.textContent='Book added.';collections.querySelector('#reading-collection-add select').focus();
      }
    }
  });
  collections.addEventListener('click',event=>{
    const data=event.target.closest('button')?.dataset;
    if(!data)return;
    if(data.openCollectionBook){
      selected=data.openCollectionBook;review=false;finishedOnly=false;editingNote='';editingBook=false;editingReread=null;search.value='';render();
      list.querySelector('[aria-pressed="true"]')?.focus();return;
    }
    if(data.collectionIndex===undefined)return;
    const group=getCollections().find(item=>item.id===collectionId),index=Number(data.collectionIndex);
    if(!group?.books[index])return;
    const books=[...group.books],next=index+Number(data.collectionMove||0);
    if('collectionRemove' in data)books.splice(index,1);
    else if(books[next])[books[index],books[next]]=[books[next],books[index]];
    if(updateCollection({...group,books})){
      status.textContent='Collection order updated.';
      const controls=collections.querySelectorAll(`[data-collection-index="${next}"]:not(:disabled)`);
      (controls[0]||collections.querySelector('#reading-collection-picker')).focus();
    }
  });
  sort.addEventListener('change',render);
  reviewButton.addEventListener('click',()=>{review=!review;editingNote='';editingBook=false;render();});
  finishedButton.addEventListener('click',()=>{finishedOnly=review||!finishedOnly;review=false;editingNote='';editingBook=false;render();});
  root.querySelector('#reading-calendar').addEventListener('click',openCalendar);
  list.addEventListener('click',event=>{
    const book=event.target.closest('[data-reading-book]');
    if(!book)return;
    selected=book.dataset.readingBook;review=false;editingNote='';editingBook=false;editingReread=null;
    render();
    list.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
  });
  history.addEventListener('submit',event=>{
    if(event.target.id==='reading-reread-form'){
      event.preventDefault();
      const record=shelf().find(book=>book.id===selected)?.finished;
      if(!record)return;
      const fields=new FormData(event.target);
      const item=rereadRecord({id:editingReread||crypto.randomUUID(),finishedOn:fields.get('finishedOn'),rating:Number(fields.get('rating')),review:fields.get('review')});
      if(!item)return;
      const result=saveBook(record.id,{rereads:[...(record.rereads||[]).filter(entry=>entry.id!==item.id),item]});
      if(result.error){const error=history.querySelector('#reread-error');error.hidden=false;error.textContent=result.error;return;}
      editingReread=null;render();history.querySelector('[data-edit-reread=""]')?.focus();status.textContent='Reread saved.';return;
    }
    if(event.target.id==='reading-merge-form'){
      event.preventDefault();
      const result=mergeBooks(selected,new FormData(event.target).get('target'));
      if(result.error){const error=history.querySelector('#reading-merge-error');error.hidden=false;error.textContent=result.error;return;}
      selected=result.bookId;search.value='';editingBook=false;editingNote='';editingReread=null;render();
      list.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});status.textContent='Books merged.';return;
    }
    if(event.target.id==='finished-book-form'){
      event.preventDefault();
      const book=shelf().find(item=>item.id===selected);
      if(!book?.finished)return;
      const values=Object.fromEntries(new FormData(event.target));
      values.rating=Number(values.rating);values.totalPages=Number(values.totalPages);
      const result=saveBook(book.finished.id,values);
      if(result.error){
        const error=history.querySelector('#finished-book-error');error.hidden=false;error.textContent=result.error;return;
      }
      if(result.bookId!==selected)search.value='';
      selected=result.bookId;editingBook=false;render();
      history.querySelector('[data-edit-finished="review"]')?.focus({preventScroll:true});
      status.textContent='Finished book saved.';return;
    }
    if(event.target.id!=='reading-note-form')return;
    event.preventDefault();
    const form=event.target,fields=new FormData(form),notes=getNotes();
    const book=shelf().find(item=>item.id===selected);
    if(!book)return;
    const chapter=String(fields.get('chapter')).trim(),text=String(fields.get('text')).trim();
    if(!chapter||!text){
      const input=chapter?form.elements.text:form.elements.chapter;
      input.setCustomValidity('Enter a chapter and a note.');input.reportValidity();return;
    }
    const previous=notes.find(item=>item.id===editingNote);
    let note={...previous,id:editingNote||crypto.randomUUID(),bookTitle:book.title,bookAuthor:book.author,chapter,text,kind:fields.get('kind')};
    if(!fields.has('queued'))note=reviewChapter(note,'remove');
    else if(!previous?.queued)note=reviewChapter(note,'schedule');
    const next=editingNote?notes.map(item=>item.id===editingNote?note:item):[...notes,note];
    if(saveNotes(next)){editingNote='';render();history.querySelector('summary')?.focus();status.textContent='Chapter note saved.';}
  });
  history.addEventListener('input',event=>event.target.setCustomValidity?.(''));
  history.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if('editReread' in button.dataset||'cancelReread' in button.dataset){
      editingReread=button.dataset.editReread??null;editingBook=false;render();
      (history.querySelector('#reading-reread-form input')||history.querySelector('[data-edit-reread=""]'))?.focus();return;
    }
    if(button.dataset.editFinished||'finishedCancel' in button.dataset){
      editingBook=Boolean(button.dataset.editFinished);editingNote='';editingReread=null;render();
      const target=editingBook?history.querySelector(`#finished-book-form [name="${button.dataset.editFinished}"]`):history.querySelector('[data-edit-finished]');
      target?.focus({preventScroll:true});return;
    }
    if('finishBook' in button.dataset){
      const book=shelf().find(item=>item.id===selected);
      if(book&&finishBook(book)){
        render();
        history.querySelector('[data-edit-finished="review"]')?.focus({preventScroll:true});
      }
      return;
    }
    const {noteReview,noteEdit,noteCancel,noteDelete}=button.dataset;
    if(noteReview){
      const notes=getNotes(),item=notes.find(note=>note.id===noteReview);
      const action=button.dataset.reviewResult;
      if(item&&saveNotes(notes.map(note=>note===item?reviewChapter(note,action):note))){
        render();status.textContent=action==='remove'?'Removed from review queue.':'Review scheduled.';
        (history.querySelector(`[data-note-review="${CSS.escape(noteReview)}"]`)||reviewButton).focus();
      }
    }else if(noteEdit){
      editingNote=noteEdit;render();history.querySelector('[name="text"]')?.focus();
    }else if(noteCancel!==undefined||noteDelete!==undefined&&saveNotes(getNotes().filter(note=>note.id!==editingNote))){
      editingNote='';render();history.querySelector('summary')?.focus();
    }
  });
  return {render,openBook(id){selected=id;review=false;finishedOnly=false;editingNote='';editingBook=false;editingReread=null;search.value='';render();list.querySelector('[aria-pressed="true"]')?.focus();}};
}
