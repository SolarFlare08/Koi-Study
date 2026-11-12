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

export function rereadRecord(item){
  if(typeof item?.id!=='string'||!item.id||!validReadingDay(item.finishedOn))return null;
  return {id:item.id,finishedOn:item.finishedOn,
    rating:Number.isInteger(item.rating)&&item.rating>=1&&item.rating<=5?item.rating:null,
    review:typeof item.review==='string'?item.review.trim().slice(0,6000):''};
}
