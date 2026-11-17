import {installReadingDiscussion} from './reading-discussion.js';
import {collectionKinds,loadReadingCollections,readingDay,relinkReadingCollections,rereadRecord,reviewChapter,validReadingDay,bookRating,ratingTier,radiantRatingLabels} from './reading-progress.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const normalized=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const formatDay=day=>new Date(day+'T12:00:00').toLocaleDateString([],{dateStyle:'medium'});
const bookKey=(title='',author='')=>JSON.stringify([normalized(title),normalized(author)]);
export const libraryStatuses={want:'Want to read',reading:'Reading'};
const cleanText=(value,limit)=>typeof value==='string'?value.trim().slice(0,limit):'';
const pageCount=value=>Number.isInteger(value)&&value>=1&&value<=100000?value:null;

export function loadLibraryBooks(value){
  const books=new Map();
  for(const item of Array.isArray(value)?value:[]){
    const title=cleanText(item?.title,250),author=cleanText(item?.author,200);
    if(!title)continue;
    const id=bookKey(title,author);
    books.set(id,{id,title,author,status:Object.hasOwn(libraryStatuses,item.status)?item.status:'want',
      totalPages:pageCount(item.totalPages),addedOn:validReadingDay(item.addedOn)?item.addedOn:'',
      ...(item.archived===true?{archived:true}:{}),
      ...(Number.isSafeInteger(item.shelfOrder)&&item.shelfOrder>=0?{shelfOrder:item.shelfOrder}:{})});
  }
  return [...books.values()];
}

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

export function readingShelf(rituals,notes=[],finished=[],library=[]){
  const books=new Map(library.map(item=>[item.id,{id:item.id,title:item.title,author:item.author,library:item,entries:[]}]));
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
    totalPages:pageCount(value.totalPages),
    rating:bookRating(value.rating),
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

function readingIdentityChanges(state,oldKey,updated,{syncPages=false}={}){
  const newKey=bookKey(updated.title,updated.author);
  const matches=(title,author)=>bookKey(title,author)===oldKey;
  const dailyRituals=Object.fromEntries(Object.entries(state.dailyRituals).map(([day,rituals])=>{
    if(!rituals.annotate?.title||!matches(rituals.annotate.title,rituals.annotate.author))return [day,rituals];
    const annotate={...rituals.annotate,title:updated.title,author:updated.author};
    if(syncPages){
      if(updated.totalPages)annotate.totalPages=updated.totalPages;else delete annotate.totalPages;
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
  return {dailyRituals,readingNotes,stickyNotes,readingCollections:relinkReadingCollections(state.readingCollections,oldKey,newKey)};
}

export function saveLibraryBook(state,id,values){
  const library=state.libraryBooks||[];
  const previous=library.find(item=>item.id===id);
  const [updated]=loadLibraryBooks([{addedOn:readingDay(),...previous,...values}]);
  if(!updated)return {error:'Enter a book title.'};
  const shelf=readingShelf(state.dailyRituals,state.readingNotes,state.finishedBooks,library);
  const current=shelf.find(book=>book.id===id);
  if(id&&!current)return {error:'This book is no longer on the shelf.'};
  if(current?.finished)return {error:'Use Edit book details for a finished book.'};
  if(updated.id!==id&&shelf.some(book=>book.id===updated.id))return {error:'A book with that title and author is already on your shelf.'};
  return {bookId:updated.id,changes:{
    ...(id?readingIdentityChanges(state,id,updated):{}),
    libraryBooks:previous?library.map(item=>item===previous?updated:item):[...library,updated]
  }};
}

export function editFinishedBook(state,id,values){
  const previous=state.finishedBooks.find(item=>item.id===id);
  const updated=finishedBook({...previous,...values,id});
  if(!previous||!updated)return {error:'Enter a title and a valid finish date.'};
  const oldKey=bookKey(previous.title,previous.author), newKey=bookKey(updated.title,updated.author);
  const books=readingShelf(state.dailyRituals,state.readingNotes,state.finishedBooks,state.libraryBooks);
  if(newKey!==oldKey&&books.some(book=>book.id===newKey))return {error:'A book with that title and author is already on your shelf.'};
  return {bookId:newKey,changes:{
    ...readingIdentityChanges(state,oldKey,updated,{syncPages:updated.totalPages!==previous.totalPages}),
    libraryBooks:(state.libraryBooks||[]).map(item=>item.id===oldKey?{...item,id:newKey,title:updated.title,author:updated.author,totalPages:updated.totalPages}:item),
    finishedBooks:state.finishedBooks.map(item=>item===previous?updated:item)}};
}

export function mergeShelfBooks(state,sourceId,targetId){
  const books=readingShelf(state.dailyRituals,state.readingNotes,state.finishedBooks,state.libraryBooks);
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
  const libraryBooks=(state.libraryBooks||[]).filter(item=>item.id!==sourceId&&item.id!==targetId);
  if(target.library||source.library)libraryBooks.push({...source.library,...target.library,id:targetId,title:target.title,author:target.author,
    totalPages:target.library?.totalPages||source.library?.totalPages||null});
  return {bookId:targetId,changes:{dailyRituals,readingNotes,stickyNotes,finishedBooks,gardenGrowth,libraryBooks,
    readingCollections:relinkReadingCollections(state.readingCollections,sourceId,targetId)}};
}

const booksPerShelf=12,maxShelfRows=100;
export const loadShelfRows=value=>Number.isInteger(value)?Math.max(2,Math.min(maxShelfRows,value)):2;

function shelfSlots(books){
  const slots=new Map(),overflow=[];
  for(const book of [...books].sort(shelfOrder)){
    const position=book.library?.shelfOrder;
    if(position>=0&&position<booksPerShelf*maxShelfRows&&!slots.has(position))slots.set(position,book);
    else overflow.push(book);
  }
  let position=0;
  for(const book of overflow){
    while(slots.has(position))position++;
    slots.set(position,book);
  }
  return slots;
}

const shelfOrder=(a,b)=>(a.library?.shelfOrder??Infinity)-(b.library?.shelfOrder??Infinity)||
  a.title.localeCompare(b.title)||a.author.localeCompare(b.author);

export function manageShelfBook(state,id,action,targetId){
  const books=readingShelf(state.dailyRituals,state.readingNotes,state.finishedBooks,state.libraryBooks);
  const slots=shelfSlots(books);
  const rows=Math.max(loadShelfRows(state.readingShelfRows),...Array.from(slots.keys(),position=>Math.floor(position/booksPerShelf)+1));
  if(action==='add-shelf')return rows>=maxShelfRows?{error:'The shelf limit has been reached.'}:
    {changes:{readingShelfRows:rows+1}};
  const book=books.find(item=>item.id===id);
  if(!book)return {error:'This book is no longer on the shelf.'};
  const libraryBooks=[...state.libraryBooks];
  const update=(item,changes)=>{
    const [record]=loadLibraryBooks([{title:item.title,author:item.author,status:bookStatus(item)==='reading'?'reading':'want',
      ...item.library,...changes}]);
    const index=libraryBooks.findIndex(entry=>entry.id===item.id);
    if(index<0)libraryBooks.push(record);else libraryBooks[index]=record;
  };
  if(action==='archive'||action==='restore'){
    update(book,{archived:action==='archive'});
    return {bookId:id,changes:{libraryBooks}};
  }
  if(action==='move'||action==='place'){
    const from=[...slots].find(([,item])=>item===book)[0];
    const to=action==='place'?targetId:[...slots].find(([,item])=>item.id===targetId)?.[0];
    if(!Number.isInteger(to)||to<0||to>=rows*booksPerShelf||to===from)return {error:'Choose another position.'};
    const displaced=slots.get(to);
    slots.delete(from);
    if(displaced)slots.set(from,displaced);
    slots.set(to,book);
    for(const [position,item] of slots)update(item,{shelfOrder:position});
    return {bookId:id,changes:{libraryBooks}};
  }
  if(action!=='delete')return {error:'Unknown shelf action.'};
  const matches=(title,author)=>bookKey(title,author)===id;
  const finished=state.finishedBooks.filter(item=>matches(item.title,item.author));
  const rewards=new Set([id,...finished.map(item=>item.id)]);
  return {bookId:id,changes:{
    libraryBooks:libraryBooks.filter(item=>item.id!==id),
    finishedBooks:state.finishedBooks.filter(item=>!finished.includes(item)),
    gardenGrowth:state.gardenGrowth.filter(item=>item.kind!=='book'||!rewards.has(item.sourceId)),
    dailyRituals:Object.fromEntries(Object.entries(state.dailyRituals).map(([date,day])=>
      matches(day.annotate?.title,day.annotate?.author)?[date,{...day,annotate:{done:day.annotate.done===true}}]:[date,day])),
    readingNotes:state.readingNotes.filter(note=>!matches(note.bookTitle,note.bookAuthor)),
    stickyNotes:state.stickyNotes.map(note=>note.related?.some(item=>item.kind==='book'&&item.id===id)?
      {...note,related:note.related.filter(item=>item.kind!=='book'||item.id!==id)}:note),
    readingCollections:state.readingCollections.map(group=>({...group,books:group.books.filter(key=>key!==id)}))
  }};
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
  const total=book.library?.totalPages||book.entries.find(entry=>entry.totalPages)?.totalPages;
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

const tierBadges={
  dud:{label:'Poop',art:'<path fill="#a76539" stroke="#f8c895" stroke-width="1.3" d="M7.1 11.3c-1.3-2 .4-3.7 2.4-3.8C9 5.7 10.5 4.2 13.8 3c-.6 1.7-.2 3 1.5 4 1.6.9 2.1 2.5 1.4 4.1 3.1.1 4.4 2.5 3.2 4.4 1.1.4 2.1 1.6 2.1 3 0 1.6-1 2.4-2.8 2.4H4.8c-1.8 0-2.8-.8-2.8-2.4 0-1.4 1-2.6 2.1-3-1.1-1.9.3-4.3 3-4.2Z"/><circle fill="#fff0d1" cx="9" cy="14.8" r="1"/><circle fill="#fff0d1" cx="15" cy="14.8" r="1"/><path stroke="#fff0d1" stroke-width="1.2" stroke-linecap="round" d="M10 17.2q2 2 4 0" fill="none"/>'},
  bronze:{label:'Bronze',art:'<circle cx="12" cy="12" r="9" fill="#9a5b3d" stroke="#f2bb87" stroke-width="1.5"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="#edab75"/><path fill="#ffe0ab" d="m12 7.8 1.2 2.8 3 .2-2.3 2 .7 3L12 14.2l-2.6 1.6.7-3-2.3-2 3-.2Z"/>'},
  silver:{label:'Silver',art:'<path fill="#a7c3d5" stroke="#f3fbff" stroke-width="1.5" d="M12 2.9 20 6v5.6c0 4.5-3.5 7.7-8 9.5-4.5-1.8-8-5-8-9.5V6Z"/><path fill="none" stroke="#31485a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="m8 10 4 4 4-4"/>'},
  gold:{label:'Gold',art:'<path fill="#d19027" stroke="#ffeb9e" stroke-width="1.4" stroke-linejoin="round" d="m9 14-3 7 4-1 2 2 1-6m2-2 3 7-4-1-2 2-1-6"/><circle cx="12" cy="9.5" r="6.5" fill="#ffcd55" stroke="#fff3b9" stroke-width="1.4"/><path stroke="#885413" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none" d="m8.5 9.3 2.4 2.4 4.7-4.5"/>'},
  crystal:{label:'Crystal',art:'<path fill="#5be2d4" stroke="#e0fff5" stroke-width="1.45" stroke-linejoin="round" d="m6 4.5 12 0 4 5L12 21 2 9.5Z"/><path fill="#147d98" d="m2.5 9.5 9.5 10.8-3.6-10.8Zm13.1 0L12 20.3l9.5-10.8Z"/><path fill="none" stroke="#e3fff7" stroke-width="1.15" stroke-linejoin="round" d="M2.7 9.5h18.6m-14.8-5 2 5L12 21l3.5-11.5 2-5"/>'},
  aurora:{label:'Aurora',art:'<circle cx="12.1" cy="11.9" r="6.2" fill="#d69bff" stroke="#fff2ff" stroke-width="1.3"/><path fill="none" stroke="#fff1a5" stroke-width="1.65" stroke-linecap="round" d="M6.6 10.4C2.7 13.1.9 15.6 2 17q2.2 2.7 11.7-2.8C20 10.4 23 6.7 21.7 5.5q-1.1-1-3.5 0"/><path fill="#fff9c9" d="M4 2.2 4.7 4 6.5 4.7 4.7 5.4 4 7.2 3.3 5.4 1.5 4.7 3.3 4Zm15.8 14.4.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z"/>'},
  unrated:{label:'Unrated',art:'<path fill="none" stroke="#eee8ce" stroke-width="1.6" stroke-linejoin="round" d="M7 4h10v16l-5-4-5 4Z"/>'}
};
function tierBadge(tier){
  return `<svg class="reading-tier-badge" data-tier="${tier}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${tierBadges[tier].art}</svg>`;
}
function stars(rating,{number=true}={}){
  if(!rating)return '';
  const tier=ratingTier(rating);
  return `<span class="reading-rating" data-tier="${tier}" role="img" aria-label="${rating} out of 5 stars · ${tierBadges[tier].label}">${tierBadge(tier)}<span class="reading-stars" aria-hidden="true">
    ${Array.from({length:rating>5?6:5},(_,index)=>{
      const fill=Math.max(0,Math.min(1,rating-index))*100;
      const shape=index===5?'M12 0 15 8.5 24 12l-9 3.5L12 24l-3-8.5L0 12l9-3.5Z':'m12 1 3.4 7 7.6 1-5.5 5.5 1.3 7.6-6.8-3.6-6.8 3.6 1.3-7.6L1 9l7.6-1Z';
      const svg=`<svg viewBox="0 0 24 24" focusable="false"><path fill="currentColor" d="${shape}"/></svg>`;
      return `<span class="reading-star" style="--star-fill:${fill.toFixed(0)}%">${svg}${svg}</span>`;
    }).join('')}</span>${number?`<b aria-hidden="true">${rating}<small>/5</small></b>`:''}</span>`;
}
function ratingInput(label,rating){
  return `<div class="reading-rating-editor">
    <label>${label}<input type="number" name="rating" inputmode="decimal" min="1" max="6" step="0.1" placeholder="Unrated" value="${rating??''}"></label>
    <div class="reading-rating-int" aria-label="Quick star ratings" role="group">${[1,2,3,4,5,6].map(value=>
      `<button type="button" data-book-stars="${value}" aria-label="Rate ${value} out of 5" title="${value}/5">${value===6?'✦':value}</button>`).join('')}</div>
    <span data-rating-preview>${stars(rating)||'<small>1–6 · tenths allowed</small>'}</span>
  </div>`;
}
const bookStatus=book=>book.finished?'finished':book.library?.status||(book.entries.length?'reading':'want');
const statusLabels={...libraryStatuses,finished:'Finished'};
function bookMonogram(title){return title.trim().split(/\s+/).slice(0,2).map(word=>Array.from(word)[0]).join('').toUpperCase();}
const coverNumber=book=>Array.from(book.id).reduce((sum,char)=>(sum+char.codePointAt(0))%5,0);
function spineWidth(book){
  const pages=book.finished?.totalPages??book.library?.totalPages??book.entries.find(entry=>entry.totalPages)?.totalPages??350;
  return Math.max(25,Math.min(56,Math.round(23+pages/35)));
}
const bookAttributes=book=>`data-tier="${ratingTier(book.finished?.rating)}" data-cover="${coverNumber(book)}"`;
function coverArt(book){
  return `<span class="reading-cover" ${bookAttributes(book)}>
    <span class="reading-cover-foil" aria-hidden="true">${escape(bookMonogram(book.title))}</span>
    <strong>${escape(book.title)}</strong><small>${escape(book.author)}</small>
    ${stars(book.finished?.rating)||`<span class="reading-cover-state">${statusLabels[bookStatus(book)]}</span>`}
  </span>`;
}

function pageLookupMarkup(){
  return `<div class="reading-page-lookup">
    <label>ISBN (optional)<input name="lookupISBN" inputmode="text" maxlength="25" placeholder="For your edition’s page count"></label>
    <button type="button" data-lookup-pages>Find pages on Open Library</button>
    <p data-lookup-status role="status" hidden></p>
    <div data-lookup-results></div>
  </div>`;
}

export function installReadingShelf({root,getRituals,getNotes,saveNotes,getLibrary,saveLibrary,manageBook,getShelfRows,openCalendar,linkedNotes=()=>'',getFinished,bookReward,finishBook,saveBook,mergeBooks,getCollections,saveCollections}){
  root.innerHTML=`<div class="reading-wrap">
    <header class="reading-heading"><div><h2 id="reading-heading">My library</h2><p id="reading-count"></p></div>
      <div class="reading-actions"><button type="button" id="reading-collections-toggle" aria-expanded="false" aria-controls="reading-collections">Collections</button>
      <button type="button" id="reading-review">Review queue</button><button type="button" id="reading-calendar">Calendar</button>
      <button type="button" id="reading-add-book">+ Add book</button></div></header>
    <p class="sr-only" id="reading-note-status" role="status"></p>
    <section id="reading-collections" aria-label="Reading collections" hidden></section>
    <section class="reading-books" aria-label="Bookshelf">
      <div class="reading-shelf-tools">
        <div class="reading-filters" role="group" aria-label="Filter bookshelf">
          <button type="button" data-reading-filter="all" aria-pressed="true">All books</button>
          <button type="button" data-reading-filter="reading" aria-pressed="false">Reading</button>
          <button type="button" data-reading-filter="want" aria-pressed="false">Want to read</button>
          <button type="button" data-reading-filter="finished" aria-pressed="false">Finished</button>
          <button type="button" data-reading-filter="archived" aria-pressed="false">Archived</button>
        </div>
        <label class="sr-only" for="reading-search">Find a book</label><input type="search" id="reading-search" placeholder="Find a book">
        <label class="reading-sort"><span class="sr-only">Sort books</span><select id="reading-sort"><option value="shelf">Shelf order</option><option value="last">Recent activity</option><option value="title">Title</option><option value="finished">Finish date</option><option value="rating">Rating</option></select></label>
      </div>
      <button id="reading-add-shelf" type="button">+ Add shelf</button>
      <div id="reading-books"></div>
    </section></div>
    <dialog id="reading-history" aria-labelledby="reading-detail-title"><button type="button" class="reading-dialog-close" data-reading-close aria-label="Close book">×</button><div id="reading-detail"></div></dialog>
    <dialog id="reading-library-editor" aria-labelledby="reading-library-title"></dialog>`;
  const search=root.querySelector('#reading-search');
  const list=root.querySelector('#reading-books');
  const details=root.querySelector('#reading-history'),history=details.querySelector('#reading-detail');
  const libraryEditor=root.querySelector('#reading-library-editor');
  const addBook=root.querySelector('#reading-add-book'),addShelf=root.querySelector('#reading-add-shelf');
  let selected='',review=false,editingNote='',editingBook=false,filter='all',editingLibraryId='',detailAnchor=null;
  let collectionId='',editingReread=null,visibleBooks=[],draggedBook='';
  const collections=root.querySelector('#reading-collections');
  const collectionToggle=root.querySelector('#reading-collections-toggle');
  const sort=root.querySelector('#reading-sort');
  const reviewButton=root.querySelector('#reading-review');

  const status=root.querySelector('#reading-note-status');
  const shelf=()=>readingShelf(getRituals(),getNotes(),getFinished(),getLibrary());
  const discussion=installReadingDiscussion(root,noteKinds);
  const notesForBook=(book,notes=getNotes())=>notes.filter(note=>bookKey(note.bookTitle,note.bookAuthor)===book.id);

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
      <p><time datetime="${item.finishedOn}">${formatDay(item.finishedOn)}</time>${item.rating?stars(item.rating):''}</p>
      ${item.review?`<p class="finished-book-review">${escape(item.review)}</p>`:''}<button type="button" data-edit-reread="${escape(item.id)}">Edit reread</button></article>`).join('')}
      ${editingReread===null?'<button type="button" data-edit-reread="">Log a reread</button>':`<form id="reading-reread-form">
        <label>Reread finish date<input type="date" name="finishedOn" value="${current?.finishedOn||readingDay()}" required></label>
        ${ratingInput('Reread rating',current?.rating)}
        <label>Reread review<textarea name="review" rows="5" maxlength="6000">${escape(current?.review)}</textarea></label>
        <p role="alert" id="reread-error" hidden></p><div class="reading-note-actions"><button type="submit">Save reread</button><button type="button" data-cancel-reread>Cancel</button></div>
      </form>`}</section>`;
  }

  function finishedMarkup(record){
    const hasReview=record.review||record.takeaway||record.rating;
    const lamp=bookReward(record.id)?' · Lantern lit':'';
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
        ${pageLookupMarkup()}
        ${ratingInput('Rating',record.rating)}
        <label>Final review<textarea name="review" maxlength="6000" rows="7" placeholder="What did you think of the book?">${escape(record.review)}</textarea></label>
        <label>Main takeaway<textarea name="takeaway" maxlength="500" rows="2" placeholder="What do you want to remember?">${escape(record.takeaway)}</textarea></label>
        <p role="alert" id="finished-book-error" hidden></p>
        <div class="reading-note-actions"><button type="submit">Save finished book</button><button type="button" data-finished-cancel>Cancel</button></div>
      </form>`:`<div class="reading-note-actions">
        <button type="button" data-edit-finished="title">Edit book details</button>
        <button type="button" data-edit-finished="review">${hasReview?'Edit final review':'Write final review'}</button></div>
        ${hasReview?`<h4>Final review</h4>${stars(record.rating)}
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
    return `<section class="reading-notes"><div class="reading-chapter-heading"><h4>Chapter notes</h4>
      <button type="button" data-reading-discussion aria-haspopup="dialog">Discussion sheet</button></div>
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
    for(const button of root.querySelectorAll('[data-reading-filter]'))button.setAttribute('aria-pressed',String(button.dataset.readingFilter===filter));
    const all=shelf();
    root.querySelector('#reading-count').textContent=all.length?`${all.length} ${all.length===1?'book':'books'} · ${all.filter(book=>book.finished).length} finished`:'';
    if(!collections.hidden)collections.innerHTML=collectionMarkup(all);
    const finishedOn=book=>[book.finished?.finishedOn||'',...(book.finished?.rereads||[]).map(item=>item.finishedOn)].sort().at(-1);
    const last=book=>[book.entries[0]?.date||'',book.library?.addedOn||'',finishedOn(book)].sort().at(-1);
    const books=all.filter(book=>(filter==='archived'?book.library?.archived:!book.library?.archived&&(filter==='all'||bookStatus(book)===filter))&&normalized(`${book.title} ${book.author}`).includes(query));
    books.sort((a,b)=>{
      if(sort.value==='shelf')return shelfOrder(a,b);
      if(sort.value==='title')return a.title.localeCompare(b.title)||a.author.localeCompare(b.author);
      if(sort.value==='rating'&&(a.finished?.rating||0)!==(b.finished?.rating||0))return (b.finished?.rating||0)-(a.finished?.rating||0);
      if(sort.value==='finished'&&finishedOn(a)!==finishedOn(b))return finishedOn(b).localeCompare(finishedOn(a));
      return last(b).localeCompare(last(a))||a.title.localeCompare(b.title);
    });
    const current=all.find(book=>book.id===selected);
    const arranged=sort.value==='shelf'&&filter==='all'&&!query;
    const slots=shelfSlots(all);
    const rows=Math.max(getShelfRows(),...Array.from(slots.keys(),position=>Math.floor(position/booksPerShelf)+1));
    addShelf.hidden=!arranged;
    list.classList.toggle('reading-spatial-shelf',arranged);
    list.classList.toggle('reading-shelf-empty',!arranged&&!books.length);
    visibleBooks=books;
    const bookMarkup=book=>`<button type="button" class="reading-spine-button" ${bookAttributes(book)} style="--book-width:${spineWidth(book)}px" data-reading-book="${escape(book.id)}"
      draggable="${arranged}" aria-label="${escape([book.title,book.author,book.finished?.rating?`${book.finished.rating}/5 · ${tierBadges[ratingTier(book.finished.rating)].label}`:null].filter(Boolean).join(' · '))}" aria-haspopup="dialog">
      <span class="reading-spine"><span>${escape(book.title)}</span>${tierBadge(ratingTier(book.finished?.rating))}</span>
      <span class="reading-spine-preview" aria-hidden="true">${coverArt(book)}</span></button>`;
    list.innerHTML=arranged?Array.from({length:rows},(_,row)=>`<div class="reading-shelf-row" role="group" aria-label="Shelf ${row+1}">
      ${Array.from({length:booksPerShelf},(_,index)=>{
        const position=row*booksPerShelf+index,book=slots.get(position);
        return `<div class="reading-shelf-slot" data-book-position="${position}">${book&&!book.library?.archived?bookMarkup(book):''}</div>`;
      }).join('')}</div>`).join(''):books.map(bookMarkup).join('')||
      `<p>${query?'No books match your search.':filter!=='all'?'No books on this shelf yet.':'Add a book to start your library.'}</p>`;
    if(!details.open)return;
    if(review){
      details.dataset.tier='unrated';
      history.innerHTML=`<h3 id="reading-detail-title">Review queue</h3>${due.length?noteList(due,true):'<p>No chapter reviews due today.</p>'}
        ${upcoming.length?`<h4>Upcoming reviews</h4><ul>${upcoming.map(note=>`<li>${escape(note.bookTitle)} · ${escape(note.chapter)} · ${formatDay(note.reviewDue)}</li>`).join('')}</ul>`:''}`;
      return;
    }
    if(!current){
      history.innerHTML='<h3 id="reading-detail-title">Book unavailable</h3>';
      return;
    }
    selected=current.id;
    const memberships=getCollections().filter(group=>group.books.includes(current.id));
    const chips=current.chapters.map(chapter=>`<li>${escape(chapter)}</li>`).join('');
    const rating=current.finished?.rating;
    const tier=ratingTier(rating),tierLabel=radiantRatingLabels[tier];
    details.dataset.tier=tier;
    const neighbors=all.filter(book=>Boolean(book.library?.archived)===Boolean(current.library?.archived)).sort(shelfOrder);
    const index=neighbors.indexOf(current),currentSlot=[...slots].find(([,book])=>book===current)[0];
    const moveButton=(step,label)=>neighbors[index+step]?`<button type="button" data-shelf-move="${escape(neighbors[index+step].id)}" data-shelf-step="${step}">${label}</button>`:'';
    history.innerHTML=`<header class="reading-detail-hero">
      ${coverArt(current)}
      <div><p class="reading-detail-state">${statusLabels[bookStatus(current)]}${tierLabel?' · '+tierLabel:''}</p>
        <h3 id="reading-detail-title">${escape(current.title)}</h3>${current.author?`<p class="reading-author">${escape(current.author)}</p>`:''}
        ${stars(rating)}
        ${!current.finished&&current.library?.totalPages?`<p>${current.library.totalPages} pages</p>`:''}
      </div></header>
      <div class="reading-note-actions reading-shelf-actions">
        <button type="button" data-shelf-action="${current.library?.archived?'restore':'archive'}">${current.library?.archived?'Restore to shelf':'Archive book'}</button>
        ${moveButton(-1,'Move left')}${moveButton(1,'Move right')}
      </div>
      ${current.library?.archived?'':`<details class="reading-merge"><summary>Place on shelf</summary>
        <form id="reading-place-book"><div class="finished-book-fields">
          <label>Shelf<select name="shelf">${Array.from({length:rows},(_,row)=>`<option value="${row}" ${Math.floor(currentSlot/booksPerShelf)===row?'selected':''}>Shelf ${row+1}</option>`).join('')}</select></label>
          <label>Slot<select name="slot">${Array.from({length:booksPerShelf},(_,slot)=>`<option value="${slot}" ${currentSlot%booksPerShelf===slot?'selected':''}>${slot+1}</option>`).join('')}</select></label>
        </div><button type="submit">Place book</button></form></details>`}
      <details class="reading-merge"><summary>Delete book</summary>
        <form id="reading-delete-form">
          <p>Delete this book’s reviews, reading notes, annotation history, and any earned Garden lantern. Linked sticky notes stay in Notes.</p>
          <label class="reading-delete-confirm"><input type="checkbox" required> Permanently delete this book</label>
          <button type="submit">Delete book</button><p data-shelf-error role="alert" hidden></p>
        </form>
      </details>
      ${memberships.length?`<p class="reading-author">${memberships.map(group=>`${escape(group.name)} · #${group.books.indexOf(current.id)+1}`).join(' / ')}</p>`:''}
      ${all.length>1?`<details class="reading-merge"><summary>Merge duplicate book</summary><form id="reading-merge-form">
        <p>Move this book’s annotation history and notes into the book you keep. If both are finished, the kept book supplies the rating and finish date. Review text is combined.</p>
        <label>Book to keep<select name="target" required><option value="">Choose a book</option>${all.filter(book=>book!==current).map(book=>
          `<option value="${escape(book.id)}">${escape([book.title,book.author].filter(Boolean).join(' · '))}</option>`).join('')}</select></label>
        <p role="alert" id="reading-merge-error" hidden></p><button type="submit">Merge into selected book</button></form></details>`:''}
      ${current.finished?finishedMarkup(current.finished):'<div class="reading-growth-action reading-note-actions"><button type="button" data-edit-library>Edit library entry</button><button type="button" class="garden-growth-action" data-finish-book>Mark book finished</button></div>'}
      ${current.finished?rereadsMarkup(current.finished):''}
      ${current.last?`<div class="reading-resume"><span>Where you left off</span><strong>${escape(current.last.chapter)}</strong><time datetime="${current.last.date}">${escape(formatDay(current.last.date))}</time></div>`:''}
      ${current.finished?'':forecastMarkup(current)}
      ${chips?`<h4>Chapters annotated</h4><ul class="reading-chapters">${chips}</ul>`:''}
      ${linkedNotes(current.id)}
      ${noteEditor(current,notesForBook(current,notes))}
      ${current.entries.length?`<h4>Annotation history</h4><ol class="reading-timeline">${current.entries.map(entry=>`<li>
        <time datetime="${entry.date}">${escape(formatDay(entry.date))}</time>
        ${entry.chapters.length?`<ul>${entry.chapters.map(chapter=>`<li>${escape(chapter)}</li>`).join('')}</ul>`:''}
        ${entry.position?`<p>Stopped at ${escape(entry.position)}</p>`:entry.chapters.length?'':'<p>No chapters logged.</p>'}
      </li>`).join('')}</ol>`:''}`;
  }
  search.addEventListener('input',render);
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
      showDetail(data.openCollectionBook,event.target.closest('button'));return;
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
  reviewButton.addEventListener('click',()=>showDetail('',reviewButton));
  for(const button of root.querySelectorAll('[data-reading-filter]')){
    button.addEventListener('click',()=>{filter=button.dataset.readingFilter;render();});
  }
  root.querySelector('#reading-calendar').addEventListener('click',openCalendar);
  const bookButtonFor=id=>[...list.querySelectorAll('[data-reading-book]')].find(button=>button.dataset.readingBook===id);
  function changeShelf(action,target){
    const result=manageBook(selected,action,target);
    if(result.error){status.textContent=result.error;return false;}
    if(action==='move'||action==='place'){
      sort.value='shelf';
      if(action==='place'){filter='all';search.value='';}
    }else details.close();
    render();
    status.textContent={move:'Shelf order saved.',place:'Book placed.',archive:'Book archived.',restore:'Book restored.',delete:'Book deleted.'}[action];
    return true;
  }
  addShelf.addEventListener('click',()=>{
    const result=manageBook('','add-shelf');
    if(result.error){status.textContent=result.error;return;}
    render();
    list.lastElementChild?.scrollIntoView({block:'nearest'});
    status.textContent='Shelf added.';
  });
  list.addEventListener('dragstart',event=>{
    const button=event.target.closest('[data-reading-book][draggable="true"]');
    if(!button)return;
    draggedBook=button.dataset.readingBook;
    event.dataTransfer.setData('text/plain',draggedBook);
    event.dataTransfer.effectAllowed='move';
    list.classList.add('reading-reordering');
  });
  list.addEventListener('dragover',event=>{
    if(!draggedBook||!event.target.closest('[data-book-position]'))return;
    event.preventDefault();event.dataTransfer.dropEffect='move';
  });
  list.addEventListener('drop',event=>{
    const slot=event.target.closest('[data-book-position]');
    if(!draggedBook||!slot)return;
    event.preventDefault();
    if(slot.querySelector('[data-reading-book]')?.dataset.readingBook!==draggedBook){
      selected=draggedBook;
      if(changeShelf('place',Number(slot.dataset.bookPosition)))bookButtonFor(selected)?.focus({preventScroll:true});
    }
    draggedBook='';list.classList.remove('reading-reordering');
  });
  list.addEventListener('dragend',()=>{draggedBook='';list.classList.remove('reading-reordering');});
  list.addEventListener('keydown',event=>{
    const button=event.target.closest('[data-reading-book]');
    if(!button||!event.altKey||sort.value!=='shelf'||!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();
    const index=visibleBooks.findIndex(book=>book.id===button.dataset.readingBook);
    const target=visibleBooks[index+(event.key==='ArrowLeft'?-1:1)];
    if(!target)return;
    selected=button.dataset.readingBook;
    if(changeShelf('move',target.id))bookButtonFor(selected)?.focus();
  });
  list.addEventListener('click',event=>{
    const book=event.target.closest('[data-reading-book]');
    if(!book)return;
    showDetail(book.dataset.readingBook,book);
  });
  history.addEventListener('submit',event=>{
    if(event.target.id==='reading-place-book'){
      event.preventDefault();
      const {shelf,slot}=event.target.elements;
      if(changeShelf('place',Number(shelf.value)*booksPerShelf+Number(slot.value)))focusDetailTitle();
      return;
    }
    if(event.target.id==='reading-delete-form'){
      event.preventDefault();
      if(!changeShelf('delete')){
        const error=event.target.querySelector('[data-shelf-error]');
        error.textContent='Could not delete the book. Try again.';error.hidden=false;
      }
      return;
    }
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
      focusDetailTitle();status.textContent='Books merged.';return;
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
  function refreshStars(form){
    const input=form.elements.rating,preview=form.querySelector('[data-rating-preview]');
    preview.innerHTML=stars(bookRating(Number(input.value)))||'<small>1–6 · tenths allowed</small>';
  }
  history.addEventListener('input',event=>{
    event.target.setCustomValidity?.('');
    if(event.target.name==='rating')refreshStars(event.target.form);
  });
  history.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.dataset.bookStars){
      const form=button.closest('form');form.elements.rating.value=button.dataset.bookStars;refreshStars(form);return;
    }
    if(button.dataset.shelfAction){changeShelf(button.dataset.shelfAction);return;}
    if(button.dataset.shelfMove){
      if(changeShelf('move',button.dataset.shelfMove)){
        const next=history.querySelector('[data-shelf-step="'+button.dataset.shelfStep+'"]');
        if(next)next.focus({preventScroll:true});else focusDetailTitle();
      }
      return;
    }
    if('editLibrary' in button.dataset){openLibraryEditor(shelf().find(book=>book.id===selected));return;}
    if('readingDiscussion' in button.dataset){
      const book=shelf().find(item=>item.id===selected);
      if(book)discussion.open(book,notesForBook(book),button);
      return;
    }
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
  function focusDetailTitle(){
    const heading=history.querySelector('#reading-detail-title');
    if(!heading)return;
    heading.tabIndex=-1;heading.focus({preventScroll:true});
  }
  function showDetail(id,anchor){
    selected=id;review=!id;editingNote='';editingBook=false;editingReread=null;detailAnchor=anchor;
    if(!details.open)details.showModal();
    render();details.scrollTop=0;focusDetailTitle();
  }
  function openLibraryEditor(book){
    editingLibraryId=book?.id||'';
    libraryEditor.innerHTML=`<form id="reading-library-form">
      <header><h3 id="reading-library-title">${book?'Edit library entry':'Add a book'}</h3>
        <button type="button" class="reading-dialog-close" data-library-close aria-label="Close book editor">×</button></header>
      <label>Title<input name="title" required maxlength="250" value="${escape(book?.title)}"></label>
      <label>Author<input name="author" maxlength="200" value="${escape(book?.author)}"></label>
      <div class="finished-book-fields">
        <label>Pages<input type="number" name="totalPages" min="1" max="100000" value="${book?.library?.totalPages??book?.entries.find(entry=>entry.totalPages)?.totalPages??''}"></label>
        <label>Shelf<select name="status">${Object.entries(libraryStatuses).map(([key,label])=>`<option value="${key}" ${bookStatus(book||{entries:[]})===key?'selected':''}>${label}</option>`).join('')}</select></label>
      </div>
      ${pageLookupMarkup()}
      <p data-library-error role="alert" hidden></p>
      <button type="submit" class="reading-library-save">${book?'Save changes':'Add to library'}</button>
    </form>`;
    if(!libraryEditor.open)libraryEditor.showModal();
    libraryEditor.querySelector('input').focus();
  }
  addBook.addEventListener('click',()=>openLibraryEditor());
  libraryEditor.addEventListener('click',event=>{
    if(event.target===libraryEditor||event.target.closest('[data-library-close]'))libraryEditor.close();
  });
  libraryEditor.addEventListener('submit',event=>{
    event.preventDefault();
    const fields=Object.fromEntries(new FormData(event.target));
    fields.totalPages=Number(fields.totalPages);
    const result=saveLibrary(editingLibraryId,fields);
    if(result.error){const error=libraryEditor.querySelector('[data-library-error]');error.hidden=false;error.textContent=result.error;return;}
    filter='all';search.value='';libraryEditor.close();render();
    const bookButton=[...list.querySelectorAll('[data-reading-book]')].find(button=>button.dataset.readingBook===result.bookId);
    showDetail(result.bookId,bookButton||addBook);
    status.textContent=editingLibraryId?'Library entry saved.':'Book added to your library.';
  });
  root.addEventListener('click',async event=>{
    const button=event.target.closest('[data-lookup-pages]');
    if(!button)return;
    const form=button.form,{title,author,totalPages,lookupISBN}=form.elements;
    const message=form.querySelector('[data-lookup-status]'),results=form.querySelector('[data-lookup-results]');
    const isbn=lookupISBN.value.replace(/[^0-9x]/gi,'').toUpperCase(),titleText=title.value.trim(),authorText=author.value.trim();
    message.hidden=false;results.replaceChildren();
    if(lookupISBN.value&&!/^(?:[0-9]{9}[0-9X]|[0-9]{13})$/.test(isbn)){
      message.textContent='Enter a 10- or 13-character ISBN.';return;
    }
    if(!isbn&&!titleText){message.textContent='Enter a title or ISBN first.';return;}
    button.disabled=true;message.textContent='Searching Open Library…';
    try{
      const params=new URLSearchParams({title:titleText,fields:'title,author_name,number_of_pages_median,first_publish_year',limit:6});
      if(authorText)params.set('author',authorText);
      const path=isbn?`/isbn/${isbn}.json`:`/search.json?${params}`;
      const response=await fetch('https://openlibrary.org'+path,{signal:AbortSignal.timeout(10000)});
      const data=response.ok?await response.json():null;
      if(!response.ok&&response.status!==404)throw new Error('Catalog unavailable');
      if(!form.isConnected||!form.closest('dialog')?.open)return;
      const candidates=isbn?(data?[{title:data.title,pages:data.number_of_pages}]:[]):
        (Array.isArray(data?.docs)?data.docs:[]).map(book=>({title:book.title,author:book.author_name?.[0],pages:book.number_of_pages_median,year:book.first_publish_year}));
      const matches=candidates.filter(item=>pageCount(item.pages));
      message.textContent=matches.length?(isbn?'Select the catalog edition.':'Select a match. Title search uses the median across editions.'):
        'No page count found. Try the ISBN or enter pages manually.';
      for(const match of matches){
        const option=document.createElement('button');option.type='button';
        option.textContent=[match.title,match.author,match.year,match.pages+' pages'].filter(Boolean).join(' · ');
        option.onclick=()=>{
          if(!title.value.trim()&&match.title)title.value=match.title.slice(0,250);
          if(!author.value.trim()&&match.author)author.value=match.author.slice(0,200);
          totalPages.value=String(match.pages);results.replaceChildren();
          message.textContent=match.pages+' pages added. Save the book to keep the page count.';
          totalPages.focus();
        };
        results.append(option);
      }
    }catch{message.textContent='Open Library is unavailable. You can still enter pages manually.';}
    finally{button.disabled=false;}
  });
  details.addEventListener('click',event=>{
    if(event.target===details||event.target.closest('[data-reading-close]'))details.close();
  });
  details.addEventListener('close',()=>{
    if(root.hidden)return;
    const bookButton=[...list.querySelectorAll('[data-reading-book]')].find(button=>button.dataset.readingBook===selected);
    const anchor=detailAnchor?.isConnected?detailAnchor:bookButton||addBook;
    anchor.focus({preventScroll:true});
  });
  return {render,openBook(id){filter='all';search.value='';showDetail(id);},
    close(){filter='all';search.value='';for(const dialog of root.querySelectorAll('dialog[open]'))dialog.close();}};
}
