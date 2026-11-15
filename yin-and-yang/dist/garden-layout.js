import {loadAppearance} from './garden-appearance.js';

export const gardenPieceOptions={
  mountains:{classic:'Layered peaks',rounded:'Soft ridges',highlands:'Distant highlands'},
  shoreline:{classic:'Reed banks',inlet:'Stone inlet',meadow:'Low meadow'},
  pavilion:{pagoda:'Lakeside pagoda',tea:'Tea shelter',gate:'Moon gate'},
  path:{none:'No path',stones:'Stepping stones',lanterns:'Lantern path'}
};
export const gardenCameras={
  wide:{name:'Full landscape',viewBox:[0,0,1600,900]},
  lake:{name:'Across the lake',viewBox:[155,171,1280,720]},
  east:{name:'Pagoda shore',viewBox:[426,229,1152,648]}
};
export const defaultGardenDesign={mountains:'classic',shoreline:'classic',pavilion:'pagoda',path:'none',camera:'wide',placements:{}};
export const gardenStarterLayouts={
  spring:{name:'Blossom walk',design:{mountains:'rounded',shoreline:'meadow',pavilion:'gate',path:'stones',camera:'wide'},
    appearance:{season:'spring',lighting:'day',weather:'petals'}},
  summer:{name:'Summer tea house',design:{mountains:'classic',shoreline:'inlet',pavilion:'tea',path:'stones',camera:'lake'},
    appearance:{season:'summer',lighting:'day',weather:'clear'}},
  autumn:{name:'Autumn lantern walk',design:{mountains:'highlands',shoreline:'inlet',pavilion:'tea',path:'lanterns',camera:'lake'},
    appearance:{season:'autumn',lighting:'dusk',weather:'leaves'}},
  winter:{name:'Winter moon gate',design:{mountains:'rounded',shoreline:'meadow',pavilion:'gate',path:'lanterns',camera:'east'},
    appearance:{season:'winter',lighting:'dusk',weather:'snow'}}
};
export const placementBounds={x:[65,1535],y:[558,870]};
export const movableGardenLandmark=item=>['project','book','milestone'].includes(item?.kind);
export const gardenLandmarkKey=item=>JSON.stringify([item.kind,item.sourceId]);

export function clampGardenPlacement(x,y){
  return Object.fromEntries(Object.entries({x,y}).map(([axis,value])=>{
    const [min,max]=placementBounds[axis];
    return [axis,Math.round(Math.max(min,Math.min(max,value)))];
  }));
}
export function loadGardenDesign(value){
  const design={...defaultGardenDesign,placements:{}};
  for(const [piece,options] of Object.entries(gardenPieceOptions)){
    if(Object.hasOwn(options,value?.[piece]))design[piece]=value[piece];
  }
  if(Object.hasOwn(gardenCameras,value?.camera))design.camera=value.camera;
  for(const [key,point] of Object.entries(value?.placements||{})){
    let parts;
    try{parts=JSON.parse(key);}catch{continue;}
    if(!Array.isArray(parts)||parts.length!==2||!movableGardenLandmark({kind:parts[0]})
      ||typeof parts[1]!=='string'||!parts[1]||!Number.isFinite(point?.x)||!Number.isFinite(point?.y))continue;
    design.placements[gardenLandmarkKey({kind:parts[0],sourceId:parts[1]})]=clampGardenPlacement(point.x,point.y);
  }
  return design;
}

function layoutDay(value){
  if(typeof value!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))return '';
  const date=new Date(value+'T00:00:00Z');
  return Number.isFinite(+date)&&date.toISOString().slice(0,10)===value?value:'';
}
export function loadGardenLayouts(value){
  const layouts=new Map();
  for(const item of Array.isArray(value)?value:[]){
    const name=typeof item?.name==='string'?item.name.trim().slice(0,70):'';
    if(!name||typeof item.id!=='string'||!item.id)continue;
    const {lighting,season,weather,motion,palette}=loadAppearance(item.appearance);
    layouts.set(item.id,{id:item.id,name,design:loadGardenDesign(item.design),
      appearance:{lighting,season,weather,motion,palette},through:layoutDay(item.through),savedOn:layoutDay(item.savedOn)});
  }
  return [...layouts.values()];
}

export function gardenFrame(camera){
  return (Object.hasOwn(gardenCameras,camera)?gardenCameras[camera]:gardenCameras.wide).viewBox;
}
export function gardenViewport(camera,width,height){
  const [x,y,w,h]=gardenFrame(camera),scale=Math.max(width/w,height/h);
  return {scale,x:(width-w*scale)/2-x*scale,y:(height-h*scale)/2-y*scale};
}
