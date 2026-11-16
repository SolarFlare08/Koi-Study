export function handoffLink(value){
  if(typeof value!=='string'||value.length>2000)return '';
  try{
    const url=new URL(value.trim());
    return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';
  }catch{return '';}
}

export const nextFocusSubtask=task=>task?.subtasks?.find(item=>!item.done);

export function sessionHandoff(value){
  const location=typeof value?.resumeLocation==='string'?value.resumeLocation.trim().slice(0,240):'';
  const note=(typeof value?.resumeNote==='string'?value.resumeNote.trim().slice(0,500):'')||nextFocusSubtask(value)?.text||'';
  const resource=handoffLink(value?.resumeResource);
  return location||note||resource?{resumeLocation:location,resumeNote:note,resumeResource:resource}:null;
}
