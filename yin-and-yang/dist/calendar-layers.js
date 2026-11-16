export const personalCalendarId='personal';
export const calendarColors={jade:'Jade',blue:'Blue',plum:'Plum',rose:'Rose',amber:'Amber',slate:'Slate'};
export const defaultCalendar={id:personalCalendarId,name:'Personal',color:'jade'};
export function loadCalendars(value){
  const calendars=new Map([[defaultCalendar.id,defaultCalendar]]);
  for(const item of Array.isArray(value)?value:[]){
    const name=typeof item?.name==='string'?item.name.trim().slice(0,60):'';
    if(!name||typeof item.id!=='string'||!/^[a-z0-9_-]{1,80}$/i.test(item.id)||item.id==='tasks')continue;
    calendars.set(item.id,{id:item.id,name,color:Object.hasOwn(calendarColors,item.color)?item.color:'jade'});
  }
  return [...calendars.values()];
}
export function loadHiddenCalendars(value){
  return Array.isArray(value)?[...new Set(value.filter(id=>typeof id==='string'&&id.length>0&&id.length<=190))]:[];
}
export function eventCalendarId(event,calendars){
  if(!event.manual)return 'import:'+(event.source||'Imported calendar');
  return calendars.some(calendar=>calendar.id===event.calendarId)?event.calendarId:personalCalendarId;
}
const importedColors=['blue','plum','amber','rose','slate'];
function importedCalendarColor(id){
  let hash=0;
  for(const character of id)hash=(hash*31+character.codePointAt(0))>>>0;
  return importedColors[hash%importedColors.length];
}
export function eventCalendarColor(event,calendars){
  const id=eventCalendarId(event,calendars);
  return event.manual?(calendars.find(calendar=>calendar.id===id)?.color||'jade'):importedCalendarColor(id);
}
export function calendarCatalog(calendars,events){
  const imports=new Map();
  for(const event of events){
    if(event.manual)continue;
    const id=eventCalendarId(event,calendars);
    if(!imports.has(id))imports.set(id,{id,name:(event.source||'Imported calendar').replace(/[.]ics$/i,''),color:importedCalendarColor(id),imported:true});
  }
  return [...calendars,...[...imports.values()].sort((a,b)=>a.name.localeCompare(b.name))];
}
export function visibleCalendarEvents(events,calendars,hidden){
  if(!hidden.length)return events;
  const omitted=new Set(hidden);
  return events.filter(event=>!omitted.has(eventCalendarId(event,calendars)));
}
export function calendarSlotMinute(offset,height){
  return Math.max(0,Math.min(1425,Math.floor(offset/Math.max(1,height)*96)*15));
}
