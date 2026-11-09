import {dayKey} from './state.js';
import {shiftDay} from './calendar.js';

const dayMs=86400000;
const weekdays=['SU','MO','TU','WE','TH','FR','SA'];
const unescapeText=value=>value.replace(/\\([nN,;\\])/g,(_,char)=>/[nN]/.test(char)?'\n':char);
const localDay=key=>new Date(`${key}T00:00:00`);

function parseProperty(line){
  const match=/^([\w-]+)((?:;[^:]+)*):(.*)$/.exec(line);
  if(!match)return null;
  const parameters=Object.fromEntries(match[2].split(';').slice(1).map(pair=>{
    const split=pair.indexOf('=');
    return [pair.slice(0,split).toUpperCase(),pair.slice(split+1).replace(/^"|"$/g,'')];
  }));
  return {name:match[1].toUpperCase(),value:match[3],zone:parameters.TZID};
}
function parseStamp({value,zone}){
  const match=/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value);
  if(!match)throw new Error('Unsupported event date');
  const [,y,m,d,h,mi,s,utc]=match;
  const day=`${y}-${m}-${d}`;
  if(dayKey(localDay(day))!==day||Number(h)>23||Number(mi)>59||Number(s)>59)throw new Error('Invalid event date');
  return {day,time:h?`${h}:${mi}:${s}`:'',utc:Boolean(utc),zone};
}
const formatters=new Map();
function timestamp(stamp){
  const local=`${stamp.day}T${stamp.time||'00:00:00'}`;
  if(stamp.utc)return Date.parse(local+'Z');
  if(!stamp.zone)return Date.parse(local);
  if(!formatters.has(stamp.zone))formatters.set(stamp.zone,new Intl.DateTimeFormat('en-CA',{
    timeZone:stamp.zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  }));
  const target=Date.parse(local+'Z');
  let guess=target;
  for(let attempt=0;attempt<3;attempt++){
    const p=Object.fromEntries(formatters.get(stamp.zone).formatToParts(guess).map(part=>[part.type,part.value]));
    const shown=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    if(shown===target)break;
    guess+=target-shown;
  }
  return guess;
}
const dayNumber=day=>Date.parse(day+'T00:00:00Z')/dayMs;
const plusDays=(day,count)=>new Date((dayNumber(day)+count)*dayMs).toISOString().slice(0,10);
function duration(value){
  const match=/^P(?:(\d+)W|(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value);
  if(!match)throw new Error('Unsupported event duration');
  return ((Number(match[1]||0)*7+Number(match[2]||0))*86400+Number(match[3]||0)*3600+Number(match[4]||0)*60+Number(match[5]||0))*1000;
}
function recurrenceCandidates(first,rule,from,to){
  if(!rule)return [first];
  const config=Object.fromEntries(rule.split(';').map(part=>part.split('=')));
  const interval=Number(config.INTERVAL||1), count=Number(config.COUNT||Infinity);
  if(!['DAILY','WEEKLY'].includes(config.FREQ)||!Number.isInteger(interval)||interval<1||
    !(count>0)||Object.keys(config).some(key=>!['FREQ','INTERVAL','COUNT','UNTIL','BYDAY','WKST'].includes(key)))throw new Error('Unsupported recurrence rule');
  const byday=config.BYDAY?.split(',')||[weekdays[localDay(first.day).getDay()]];
  const weekStart=weekdays.indexOf(config.WKST||'MO');
  if(weekStart<0||byday.some(day=>!weekdays.includes(day)))throw new Error('Unsupported weekday');
  const until=config.UNTIL?parseStamp({value:config.UNTIL,zone:first.zone}):null;
  const firstNumber=dayNumber(first.day), firstWeekday=localDay(first.day).getDay();
  const weekOffset=(firstWeekday-weekStart+7)%7;
  const last=dayNumber(to);
  if(Number.isFinite(count)&&last-firstNumber>37000)throw new Error('Recurrence too old');
  let seen=0;
  const result=[];
  const earliest=Number.isFinite(count)?firstNumber:Math.max(firstNumber,dayNumber(from));
  for(let number=earliest;number<=last&&seen<count;number++){
    const delta=number-firstNumber, weekday=(firstWeekday+delta)%7;
    const matches=config.FREQ==='DAILY'?delta%interval===0&&(!config.BYDAY||byday.includes(weekdays[weekday])):
      Math.floor((delta+weekOffset)/7)%interval===0&&byday.includes(weekdays[weekday]);
    if(!matches&&delta!==0)continue;
    const day=plusDays(first.day,delta), stamp={...first,day};
    if(until&&(day>until.day&&!until.time||until.time&&timestamp(stamp)>timestamp(until)))break;
    seen++;
    if(day>=from)result.push(stamp);
  }
  return result;
}

export function parseCalendarImport(text,now=new Date()){
  if(!/^BEGIN:VCALENDAR\s*$/mi.test(text))throw new Error('Choose a valid .ics calendar file.');
  const lines=text.replace(/\r?\n[ \t]/g,'').split(/\r?\n/);
  const components=[];
  let fields=null,depth=0;
  for(const line of lines){
    if(line.toUpperCase()==='BEGIN:VEVENT'){fields=[];depth=0;continue;}
    if(!fields)continue;
    if(line.toUpperCase()==='END:VEVENT'){components.push(fields);fields=null;continue;}
    if(/^BEGIN:/i.test(line)){depth++;continue;}
    if(/^END:/i.test(line)){depth--;continue;}
    if(!depth){const property=parseProperty(line);if(property)fields.push(property);}
  }
  const from=dayKey(shiftDay(now,-30)),to=dayKey(shiftDay(now,366));
  const events=new Map(), overrides=new Set();
  let skipped=0;
  const identity=(uid,stamp)=>`${uid}:${stamp.time?timestamp(stamp):stamp.day}`;
  for(const fields of components){
    const uid=fields.find(item=>item.name==='UID')?.value;
    const recurrence=fields.find(item=>item.name==='RECURRENCE-ID');
    if(uid&&recurrence)try{overrides.add(identity(uid,parseStamp(recurrence)));}catch{}
  }
  for(const fields of components){
    const get=name=>fields.find(item=>item.name===name);
    if(get('STATUS')?.value.toUpperCase()==='CANCELLED')continue;
    try{
      const first=parseStamp(get('DTSTART'));
      const end=get('DTEND')&&parseStamp(get('DTEND'));
      if(end&&Boolean(first.time)!==Boolean(end.time))throw new Error('Mismatched event dates');
      const span=end?(first.time?timestamp(end)-timestamp(first):(dayNumber(end.day)-dayNumber(first.day))*dayMs):
        get('DURATION')?duration(get('DURATION').value):first.time?0:dayMs;
      if(span<0||!Number.isFinite(span))throw new Error('Invalid event duration');
      const title=unescapeText(get('SUMMARY')?.value||'Calendar event').slice(0,300);
      const description=unescapeText(get('DESCRIPTION')?.value||'').slice(0,2000);
      const uid=get('UID')?.value||`${title}:${first.day}:${first.time}`;
      const exclusions=new Set(fields.filter(item=>item.name==='EXDATE').flatMap(item=>item.value.split(',').map(value=>identity(uid,parseStamp({...item,value})))));
      const repeated=Boolean(get('RRULE')||get('RDATE'));
      const candidates=recurrenceCandidates(first,get('RRULE')?.value,from,to);
      for(const field of fields.filter(item=>item.name==='RDATE'))for(const value of field.value.split(','))candidates.push(parseStamp({...field,value}));
      for(const stamp of candidates){
        const recurrence=get('RECURRENCE-ID');
        const occurrence=identity(uid,stamp);
        if(exclusions.has(occurrence)||!recurrence&&overrides.has(occurrence)||repeated&&(stamp.day<from||stamp.day>to))continue;
        const id=recurrence?identity(uid,parseStamp(recurrence)):occurrence;
        if(stamp.time){
          const start=timestamp(stamp);
          if(!Number.isFinite(start))throw new Error('Invalid event start');
          events.set(id,{id,title,description,start,end:start+span});
        }else events.set(id,{id,title,description,day:stamp.day,endDay:plusDays(stamp.day,Math.max(1,Math.ceil(span/dayMs)))});
      }
    }catch{skipped++;}
    if(events.size>10000)throw new Error('This file expands to more than 10,000 events. Export a shorter range.');
  }
  return {events:[...events.values()],skipped};
}

