import {loadAppearance,lightingOptions,seasonOptions,gardenWeather} from './garden-appearance.js';
import {gardenFrame,loadGardenDesign} from './garden-layout.js';
import {postcardPng} from './garden-postcard.js';

const bounded=(value,min,max,fallback)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
export function postcardFrame({zoom,x,y,design}){
  const [left,top,frameWidth,frameHeight]=gardenFrame(design?.camera);
  const width=Math.min(frameWidth,frameHeight*16/9)/bounded(zoom,1,3,1),height=width*9/16;
  return [left+(frameWidth-width)*bounded(x,0,100,50)/100,top+(frameHeight-height)*bounded(y,0,100,50)/100,width,height];
}

export function loadPostcardViewpoints(records){
  const views=new Map();
  for(const record of Array.isArray(records)?records:[]){
    if(typeof record?.id!=='string'||!record.id||typeof record.name!=='string'||!record.name.trim())continue;
    const appearance=loadAppearance({...record.appearance,motion:'still'});
    if(appearance.lighting==='session')appearance.lighting='day';
    appearance.weather=gardenWeather(appearance);
    views.set(record.id,{id:record.id,name:record.name.trim().slice(0,80),appearance,design:loadGardenDesign(record.design),
      zoom:bounded(record.zoom,1,3,1),x:bounded(record.x,0,100,50),y:bounded(record.y,0,100,50)});
  }
  return [...views.values()];
}

export function installPostcardViewpoints({getViews,save,getScene,paint,download,dayKey}){
  const dialog=document.createElement('dialog');
  dialog.className='workspace-dialog semester-replay postcard-viewpoints';
  dialog.setAttribute('aria-labelledby','viewpoint-title');
  dialog.innerHTML=`<header><h2 id="viewpoint-title">Postcard viewpoints</h2><button type="button" data-close aria-label="Close">×</button></header>
    <label>Viewpoint<select name="view"></select></label><div class="garden-scene-preview"></div>
    <div class="viewpoint-controls">
      <label>Zoom<input name="zoom" type="range" min="1" max="3" step=".05"></label>
      <label>Left to right<input name="x" type="range" min="0" max="100"></label>
      <label>Top to bottom<input name="y" type="range" min="0" max="100"></label>
      <label>Season<select name="season"></select></label><label>Lighting<select name="lighting"></select></label>
      <label>Garden through<input type="date" name="through"></label>
    </div><label>Caption<input name="caption" maxlength="90"></label>
    <form class="companion-actions"><label>New viewpoint name<input name="name" maxlength="80" required></label>
      <button class="workspace-primary">Save viewpoint</button><button type="button" data-export>Download PNG</button></form><p role="status"></p>`;
  document.body.append(dialog);
  const field=name=>dialog.querySelector('[name='+name+']');
  const status=message=>{dialog.querySelector('[role=status]').textContent=message;};
  const preview=dialog.querySelector('.garden-scene-preview');
  let base,scene,openingScene;
  field('season').append(...Object.entries(seasonOptions).map(([value,{name}])=>new Option(name,value)));
  field('lighting').append(...Object.entries(lightingOptions).filter(([key])=>key!=='session').map(([value,name])=>new Option(name,value)));
  function current(){
    const appearance=loadAppearance({...base.appearance,season:field('season').value,lighting:field('lighting').value,motion:'still'});
    appearance.weather=gardenWeather(appearance);
    return {appearance,design:base.design,...Object.fromEntries(['zoom','x','y'].map(key=>[key,field(key).valueAsNumber]))};
  }
  function crop(){scene.setAttribute('viewBox',postcardFrame(current()).join(' '));}
  function render(){scene=paint(preview,current(),field('through').value||dayKey());crop();}
  function select(view){
    field('view').replaceChildren(new Option('Current Garden',''),...getViews().map(item=>new Option(item.name,item.id)));
    field('view').value=view?.id||'';
    base=view||openingScene;
    for(const [key,value] of Object.entries({zoom:base.zoom??1,x:base.x??50,y:base.y??50,season:base.appearance.season,
      lighting:base.appearance.lighting==='session'?'day':base.appearance.lighting}))field(key).value=value;
    field('name').value='';render();
  }
  field('view').onchange=()=>{select(getViews().find(view=>view.id===field('view').value));status('');};
  for(const key of ['season','lighting','through'])field(key).onchange=render;
  for(const key of ['zoom','x','y'])field(key).oninput=crop;
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.querySelector('form').onsubmit=event=>{
    event.preventDefault();
    const name=field('name').value.trim();if(!name)return;
    const [view]=loadPostcardViewpoints([{...current(),name,id:crypto.randomUUID()}]);
    if(save([...getViews(),view])){select(view);status('Viewpoint saved.');}
  };
  const exportButton=dialog.querySelector('[data-export]');
  exportButton.onclick=async()=>{
    exportButton.disabled=true;
    try{
      const day=field('through').value||dayKey();
      const blob=await postcardPng(scene,field('caption').value);
      download(blob,'garden-viewpoint-'+day+'.png');status('Postcard downloaded.');
    }catch{status('Could not download the postcard.');}
    finally{exportButton.disabled=false;}
  };
  return (source=getScene(),viewId)=>{
    const saved=viewId===undefined?undefined:getViews().find(view=>view.id===viewId);
    if(viewId!==undefined&&!saved)return false;
    openingScene={...source,appearance:{...source.appearance,weather:gardenWeather(source.appearance)}};
    field('through').max=dayKey();
    field('through').value=source.through||dayKey();
    field('caption').value='';status('');
    dialog.showModal();select(saved);
    return true;
  };
}
