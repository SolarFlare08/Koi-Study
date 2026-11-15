const time=value=>typeof value==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)?value:'';

export function blockFlexibility(value){
  if(value?.mode==='fixed')return {mode:'fixed'};
  if(value?.mode!=='flexible')return null;
  const earliest=time(value.earliest),latest=time(value.latest);
  if(earliest&&latest&&earliest>=latest)return {mode:'fixed'};
  return {mode:'flexible',earliest,latest,tomorrow:value.tomorrow===true};
}

export function waitingForRecord(value){
  const subject=typeof value?.subject==='string'?value.subject.trim().slice(0,200):'';
  if(!subject)return null;
  const key=value.followUp;
  const date=typeof key==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(key)?new Date(key+'T12:00:00Z'):null;
  const followUp=date&&Number.isFinite(+date)&&date.toISOString().slice(0,10)===key?key:'';
  return {subject,followUp,notified:Boolean(followUp&&value.notified===true)};
}
