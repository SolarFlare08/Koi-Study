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
  let lastAttempt=0,lastData='',lastDiskData='',pendingDisk,writing=false,points=[],diskPoint;
  let status={local:'Waiting for first automatic backup',disk:desktop?'Waiting for disk backup':'Disk backups are available in the Windows app'};
  function publish(){window.dispatchEvent(new CustomEvent('garden-backup-status',{detail:{...status}}));}
  const backupTime=at=>new Date(at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  const snapshot=native=>createBackup(getState(),storage,getCaptures(native));
  readPoints().then(value=>{
    if(!points.length){
      points=value;
      if(points[0])lastData=JSON.stringify(points[0].snapshot.data);
    }
    if(points[0])status.local='Local backup · '+backupTime(points[0].snapshot.exportedAt);
    publish();
  }).catch(()=>{status.local='Local backup storage unavailable. Download a backup or use Windows disk backups.';publish();});
  // The desktop also uses this on a normal window close, before disposing WebView2.
  window.gardenDesktopSnapshot=native=>JSON.stringify(snapshot(native));
  desktop?.addEventListener('message',event=>{
    const result=event.data;
    if(result?.type!=='backup-result')return;
    if(result.requestId){
      if(pendingDisk?.id!==result.requestId)return;
      clearTimeout(pendingDisk.timeout);
      if(!result.error&&Number.isFinite(Date.parse(result.at)))lastDiskData=pendingDisk.data;
      pendingDisk=undefined;
    }else if(pendingDisk)return;
    if(result.error)status.disk='Disk backup status unavailable: '+result.error;
    else if(Number.isFinite(Date.parse(result.at))){
      diskPoint={at:result.at,path:result.path};
      status.disk='Disk backup · '+backupTime(result.at);
    }else{
      diskPoint=undefined;
      status.disk='No disk backup saved yet';
    }
    publish();
  });
  desktop?.postMessage({type:'backup-status'});
  function saveDisk(snapshot,data){
    const id=crypto.randomUUID();
    const timeout=setTimeout(()=>{
      if(pendingDisk?.id!==id)return;
      pendingDisk=undefined;
      status.disk='Disk backup has not confirmed. Try Back up now.';publish();
    },20000);
    pendingDisk={id,data,timeout};
    try{desktop.postMessage({type:'backup',requestId:id,snapshot});}
    catch{
      clearTimeout(timeout);pendingDisk=undefined;
      status.disk='Could not send the disk backup. Try Back up now.';
    }
  }
  async function run(force=false){
    if(writing)return;
    if(!force&&Date.now()-lastAttempt<BACKUP_INTERVAL)return;
    lastAttempt=Date.now();
    writing=true;
    try {
      const value=structuredClone(snapshot()),data=JSON.stringify(value.data);
      // Native disk protection is independent of the browser backup quota.
      if(desktop&&!pendingDisk&&(force||data!==lastDiskData))saveDisk(value,data);
      if(force||data!==lastData){
        try{points=await writePoint(value);lastData=data;status.local='Local backup · '+backupTime(value.exportedAt);}
        catch{status.local='Local backup could not fit. Download a backup or use the Windows disk backup.';}
      }
    } catch {status.local='Automatic backup failed. Download a backup while this window is open.';}
    finally{writing=false;publish();}
  }
  setTimeout(()=>run(),10000);
  setInterval(()=>run(),60000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)run();});
  return {points:()=>points,latestLocalPoint:()=>readPoints().then(([latest])=>latest).catch(()=>undefined),
    diskPoint:()=>diskPoint,run:()=>run(true),status:()=>({...status}),openFolder:()=>desktop?.postMessage({type:'open-backups'}),desktop:Boolean(desktop)};
}
