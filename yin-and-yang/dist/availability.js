const isTime=value=>typeof value==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const minute=value=>Number(value.slice(0,2))*60+Number(value.slice(3));

export function loadAvailability(value){
  if(!Array.isArray(value))return [];
  return value.flatMap(rule=>{
    if(typeof rule?.id!=='string'||typeof rule.name!=='string'||!rule.name.trim()||!Array.isArray(rule.days))return [];
    const days=[...new Set(rule.days.filter(day=>Number.isInteger(day)&&day>=0&&day<=6))].sort();
    if(!days.length)return [];
    const allDay=rule.allDay===true;
    if(!allDay&&(!isTime(rule.start)||!isTime(rule.end)||rule.start===rule.end))return [];
    return [{id:rule.id,name:rule.name.trim().slice(0,60),days,allDay,start:allDay?'':rule.start,end:allDay?'':rule.end}];
  });
}

export function unavailableRanges(rules,date){
  const weekday=date.getDay(),previous=(weekday+6)%7;
  const ranges=[];
  for(const rule of rules){
    if(rule.allDay){
      if(rule.days.includes(weekday))ranges.push({start:0,end:1440,name:rule.name});
      continue;
    }
    const start=minute(rule.start),end=minute(rule.end),overnight=end<start;
    if(rule.days.includes(weekday))ranges.push({start,end:overnight?1440:end,name:rule.name});
    if(overnight&&end>0&&rule.days.includes(previous))ranges.push({start:0,end,name:rule.name});
  }
  return ranges.sort((a,b)=>a.start-b.start);
}
