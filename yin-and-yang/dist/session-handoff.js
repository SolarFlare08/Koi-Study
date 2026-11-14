export function handoffLink(value){
  if(typeof value!=='string'||value.length>2000)return '';
  try{
    const url=new URL(value.trim());
    return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';
  }catch{return '';}
}
