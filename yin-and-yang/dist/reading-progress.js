const pad=value=>String(value).padStart(2,'0');
export function readingDay(now=new Date(),offset=0){
  const day=new Date(now.getFullYear(),now.getMonth(),now.getDate()+offset);
  return `${day.getFullYear()}-${pad(day.getMonth()+1)}-${pad(day.getDate())}`;
}

export function validReadingDay(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(`${value}T00:00:00Z`);
  return Number.isFinite(+date)&&date.toISOString().slice(0,10)===value;
}

export function borrowedReturnStatus(book,now=new Date()){
  if(!book?.lender||!validReadingDay(book.returnBy))return '';
  const today=readingDay(now),sunday=readingDay(now,(7-now.getDay())%7);
  return book.returnBy<today?'overdue':book.returnBy<=sunday?'week':'later';
}

const reviewGaps=[3,7,14,30,60];
export function reviewChapter(note,action,now=new Date()){
  if(action==='remove')return {...note,queued:false,reviewDue:'',reviewLevel:0};
  const previous=Number.isInteger(note.reviewLevel)?note.reviewLevel:0;
  const level=action==='remembered'?Math.min(previous+1,reviewGaps.length-1):0;
  const days=action==='again'?1:reviewGaps[level];
  return {...note,queued:true,reviewDue:readingDay(now,days),reviewLevel:level};
}

export const collectionKinds={series:'Series',course:'Course',theme:'Theme'};
export function loadReadingCollections(value){
  if(!Array.isArray(value))return [];
  const seen=new Set();
  return value.flatMap(item=>{
    if(typeof item?.id!=='string'||!item.id||seen.has(item.id)||typeof item.name!=='string'||!item.name.trim()||!Object.hasOwn(collectionKinds,item.kind))return [];
    seen.add(item.id);
    const books=Array.isArray(item.books)?[...new Set(item.books.filter(id=>typeof id==='string'&&id))]:[];
    return [{id:item.id,name:item.name.trim().slice(0,80),kind:item.kind,books}];
  });
}

export function relinkReadingCollections(collections,from,to){
  return (collections||[]).map(collection=>{
    if(!collection.books.includes(from)||from===to)return collection;
    const books=collection.books.includes(to)?collection.books.filter(id=>id!==from):collection.books.map(id=>id===from?to:id);
    return {...collection,books};
  });
}

export function bookRating(value){
  return typeof value==='number'&&Number.isFinite(value)&&value>=1&&value<=6?Math.round(value*10)/10:null;
}

export function ratingTier(rating){
  return rating===6?'aurora':rating>=5?'crystal':rating>=4?'gold':rating>=3?'silver':rating>=2?'bronze':rating>=1?'dud':'unrated';
}

export const radiantRatingLabels={crystal:'Crystal',aurora:'Aurora'};

export function pageBookmark(value){
  const page=n=>Number.isInteger(n)&&n>0&&n<=100000;
  const active=value?.active;
  const last=value?.last;
  const position=value?.position;
  const bookmark={};
  if(page(active?.page)&&Number.isSafeInteger(active.startedAt)&&active.startedAt>=0){
    bookmark.active={page:active.page,startedAt:active.startedAt};
  }
  if(page(last?.from)&&page(last.to)&&last.to>=last.from&&Number.isSafeInteger(last.duration)&&last.duration>=0){
    bookmark.last={from:last.from,to:last.to,duration:last.duration,
      ...(Number.isSafeInteger(last.finishedAt)&&last.finishedAt>0?{finishedAt:last.finishedAt}:{})};
  }
  if(page(position?.page)&&Number.isSafeInteger(position.savedAt)&&position.savedAt>0&&position.savedAt<=8.64e15){
    bookmark.position={page:position.page,savedAt:position.savedAt};
  }
  return bookmark;
}

export function currentPageBookmark(bookmark){
  const {active,last,position}=bookmark||{};
  const sitting=active?{page:active.page,at:active.startedAt}:last?{page:last.to,at:last.finishedAt}:null;
  return position&&position.savedAt>=(sitting?.at||0)?{page:position.page,at:position.savedAt}:sitting;
}

export function updatePageBookmark(value,action,page,maximum,now=Date.now()){
  const bookmark=pageBookmark(value);
  if(action==='cancel'){
    delete bookmark.active;
    return bookmark;
  }
  if(!Number.isInteger(page)||page<1||page>(maximum||100000))return null;
  if(action==='position')return {...bookmark,position:{page,savedAt:now}};
  if(action==='start'&&!bookmark.active)return {...bookmark,active:{page,startedAt:now}};
  if(action==='finish'&&bookmark.active&&page>=bookmark.active.page){
    return {last:{from:bookmark.active.page,to:page,duration:Math.max(0,now-bookmark.active.startedAt),finishedAt:now}};
  }
  return null;
}

export function readingPassages(value){
  return (typeof value==='string'?value.split(/\r?\n/):[]).flatMap(line=>{
    const separator=line.indexOf('|');
    if(separator<=0)return [];
    const chapter=line.slice(0,separator).trim().slice(0,120),text=line.slice(separator+1).trim().slice(0,1000);
    return chapter&&text?[{chapter,text}]:[];
  });
}

export function rereadRecord(item){
  if(typeof item?.id!=='string'||!item.id||!validReadingDay(item.finishedOn))return null;
  return {id:item.id,finishedOn:item.finishedOn,
    rating:bookRating(item.rating),
    review:typeof item.review==='string'?item.review.trim().slice(0,6000):'',
    ...(typeof item.passages==='string'&&item.passages.trim()?{passages:item.passages.trim().slice(0,6000)}:{})};
}
