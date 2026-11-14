export function journalLabels(value){
  const labels=new Map();
  const items=typeof value==='string'?value.split(','):Array.isArray(value)?value:[];
  for(const raw of items){
    if(typeof raw!=='string')continue;
    const label=raw.trim().slice(0,40);
    const key=label.toLowerCase();
    if(label&&!labels.has(key))labels.set(key,label);
    if(labels.size===20)break;
  }
  return [...labels.values()];
}

function validDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const date=new Date(value+'T12:00:00');
  return Number.isFinite(+date)&&localDay(date)===value?date:null;
}
const localDay=date=>`${String(date.getFullYear()).padStart(4,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

export function journalWeek(value,offset=0){
  const date=validDate(value);
  if(!date)return '';
  date.setDate(date.getDate()-(date.getDay()+6)%7+offset*7);
  return localDay(date);
}
export function entriesInWeek(entries,week){
  return entries.filter(entry=>!entry.draft&&journalWeek(entry.date)===week)
    .sort((a,b)=>a.date.localeCompare(b.date)||(a.updatedAt||0)-(b.updatedAt||0));
}
export function weeklyReflection(value){
  if(typeof value?.week!=='string'||!value.week||journalWeek(value.week)!==value.week||typeof value.body!=='string'||!value.body.trim())return null;
  return {week:value.week,body:value.body.trim().slice(0,12000),
    entryIds:Array.isArray(value.entryIds)?[...new Set(value.entryIds.filter(id=>typeof id==='string'&&id))]:[],
    updatedAt:Number.isFinite(value.updatedAt)?value.updatedAt:0};
}
export function loadWeeklyReflections(value){
  const records=new Map();
  for(const raw of Array.isArray(value)?value:[]){
    const entry=weeklyReflection(raw);
    if(entry&&(!records.has(entry.week)||entry.updatedAt>=records.get(entry.week).updatedAt))records.set(entry.week,entry);
  }
  return [...records.values()];
}

export function journalFacets(entries){
  const result={mood:new Map(),tags:new Map(),themes:new Map()};
  for(const entry of entries){
    for(const [type,labels] of [['mood',entry.mood?[entry.mood]:[]],['tags',entry.tags||[]],['themes',entry.themes||[]]]){
      for(const label of labels){
        const key=label.toLowerCase(), current=result[type].get(key);
        if(current)current.count++;
        else result[type].set(key,{key,label,count:1});
      }
    }
  }
  return Object.fromEntries(Object.entries(result).map(([key,values])=>[key,[...values.values()].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label))]));
}

export function matchingJournal(entries,query,filters){
  return entries.filter(item=>
    [item.title,item.body,item.mood,...(item.tags||[]),...(item.themes||[])].join(' ').toLowerCase().includes(query)&&
    (!filters.mood||item.mood?.toLowerCase()===filters.mood)&&
    (!filters.tags||item.tags?.some(label=>label.toLowerCase()===filters.tags))&&
    (!filters.themes||item.themes?.some(label=>label.toLowerCase()===filters.themes)));
}
