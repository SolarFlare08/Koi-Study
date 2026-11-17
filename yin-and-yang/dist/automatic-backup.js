import {createBackup} from './backup.js';

export const BACKUP_INTERVAL=5*60*1000;
export function rotateAutomaticPoints(points,snapshot){
  return [{id:crypto.randomUUID(),snapshot},...points].slice(0,3);
}
function openDatabase(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('yin-and-yang.automatic-backups',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('snapshots');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(new Error('Backup database is busy'));
  });
}
async function readPoints(){
  const db=await openDatabase();
  try{return await new Promise((resolve,reject)=>{
    const transaction=db.transaction('snapshots','readonly'),request=transaction.objectStore('snapshots').get('recent');
    transaction.oncomplete=()=>resolve(Array.isArray(request.result)?request.result:[]);
    transaction.onabort=()=>reject(transaction.error);
  });}finally{db.close();}
}
async function writePoint(snapshot){
  const db=await openDatabase();
  try{return await new Promise((resolve,reject)=>{
    const transaction=db.transaction('snapshots','readwrite'),store=transaction.objectStore('snapshots');
    const request=store.get('recent');let next;
    request.onsuccess=()=>{next=rotateAutomaticPoints(Array.isArray(request.result)?request.result:[],snapshot);store.put(next,'recent');};
    transaction.oncomplete=()=>resolve(next);
    transaction.onabort=()=>reject(transaction.error);
  });}finally{db.close();}
}
export function installAutomaticBackup({storage,getState,getCaptures}){
  const desktop=location.hostname==='yin-and-yang.local' ? window.chrome?.webview : undefined;
  let lastAttempt=0,lastData='',busy=false,writing=false,points=[];
  let status={local:'Waiting for first automatic backup',disk:desktop?'Waiting for disk backup':'Disk backups are available in the Windows app'};
  function publish(){window.dispatchEvent(new CustomEvent('garden-backup-status',{detail:{...status}}));}
  const snapshot=()=>createBackup(getState(),storage,getCaptures());
  readPoints().then(value=>{points=value;publish();}).catch(()=>{status.local='Local backup storage unavailable. Download a backup or use Windows disk backups.';publish();});
  // The desktop also uses this on a normal window close, before disposing WebView2.
  window.gardenDesktopSnapshot=()=>JSON.stringify(snapshot());
  desktop?.addEventListener('message',event=>{
    if(event.data?.type!=='backup-result')return;
    busy=false;
    status.disk=event.data.error?'Disk backup failed: '+event.data.error:'Disk backup · '+new Date(event.data.at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
    publish();
  });
  async function run(force=false){
    if(writing)return;
    if(!force&&Date.now()-lastAttempt<BACKUP_INTERVAL)return;
    lastAttempt=Date.now();
    writing=true;
    try {
      const value=structuredClone(snapshot()),data=JSON.stringify(value.data);
      if(!force&&data===lastData)return;
      // Native disk protection is independent of the browser backup quota.
      if(desktop&&!busy){busy=true;desktop.postMessage({type:'backup',snapshot:value});setTimeout(()=>{if(busy){busy=false;status.disk='Disk backup has not confirmed. Try Back up now.';publish();}},20000);}
      let saved=false;
      try {points=await writePoint(value);saved=true;status.local='Local backup · '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});}
      catch {status.local='Local backup could not fit. Download a backup or use the Windows disk backup.';}
      if(saved)lastData=data;
    } catch {status.local='Automatic backup failed. Download a backup while this window is open.';}
    finally{writing=false;publish();}
  }
  setTimeout(()=>run(),10000);
  setInterval(()=>run(),60000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)run();});
  return {points:()=>points,run:()=>run(true),status:()=>({...status}),openFolder:()=>desktop?.postMessage({type:'open-backups'}),desktop:Boolean(desktop)};
}
