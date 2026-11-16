import {loadAppearance} from './garden-appearance.js';

export const gardenPieceOptions={
  mountains:{classic:'Layered peaks',summit:'Snowcapped summit',karst:'Ink pillars',valley:'Cloud valley',twins:'Twin peaks',rounded:'Soft ridges',highlands:'Distant highlands'},
  shoreline:{classic:'Reed banks',inlet:'Stone inlet',meadow:'Low meadow'},
  pavilion:{pagoda:'Lakeside pagoda',tiered:'Three-tier pagoda',tea:'Tea shelter',gate:'Moon gate',vermilion:'Vermilion pavilion',bell:'Stone bell tower'},
  foundation:{auto:'Match the shore',stone:'Stone outcrop',timber:'Timber landing'},
  boat:{seasonal:'Changes with season',junk:'Junk under sail',sampan:'Covered sampan',skiff:'Reed skiff',lotus:'Lotus ferry',none:'Quiet lake'},
  lantern:{classic:'Small oval',silk:'Round silk',hex:'Hexagonal bronze',paper:'Paper cylinder',none:'No lantern'},
  path:{none:'No path',stones:'Stepping stones',lanterns:'Lantern path',boardwalk:'Timber boardwalk'}
};
export const gardenCameras={
  wide:{name:'Full landscape',viewBox:[0,0,1600,900]},
  lake:{name:'Across the lake',viewBox:[155,171,1280,720]},
  east:{name:'Pagoda shore',viewBox:[426,229,1152,648]}
};
export const defaultPavilionPosition={x:1096,y:615};
export const defaultGardenDesign={mountains:'classic',shoreline:'classic',pavilion:'pagoda',foundation:'auto',
  boat:'seasonal',lantern:'classic',path:'none',camera:'wide',pavilionPosition:null,placements:{},props:[]};
export const pavilionBounds={x:[90,1510],y:[557,848]};
export const gardenPropBounds={x:[32,1568],y:[446,883]};
export const gardenPropLimit=36;
export const gardenPropTypes={
  bridge:{name:'Stone arch bridge',x:1200,y:673},
  dock:{name:'Wooden dock',x:1428,y:781},
  lantern:{name:'Stone lantern',x:1158,y:621},
  bamboo:{name:'Bamboo grove',x:1496,y:828},
  pine:{name:'Leaning pine',x:290,y:843},
  plum:{name:'Plum blossoms',x:98,y:758},
  rocks:{name:'Shore rocks',x:377,y:809},
  reeds:{name:'Golden reeds',x:1442,y:804},
  lilies:{name:'Lily pads',x:529,y:768},
  crane:{name:'White crane',x:1260,y:705}
};
export function loadGardenProps(value){
  const props=new Map();
  for(const item of Array.isArray(value)?value:[]){
    if(typeof item?.id!=='string'||!/^[a-z0-9_-]{1,80}$/i.test(item.id)||!Object.hasOwn(gardenPropTypes,item.kind)||
      !Number.isFinite(item.x)||!Number.isFinite(item.y))continue;
    const size=Number.isFinite(item.size)?Math.max(50,Math.min(200,Math.round(item.size/5)*5)):100;
    props.set(item.id,{id:item.id,kind:item.kind,...clampGardenPlacement(item.x,item.y,gardenPropBounds),size});
    if(props.size===gardenPropLimit)break;
  }
  return [...props.values()];
}
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

export function clampGardenPlacement(x,y,bounds=placementBounds){
  return Object.fromEntries(Object.entries({x,y}).map(([axis,value])=>{
    const [min,max]=bounds[axis];
    return [axis,Math.round(Math.max(min,Math.min(max,value)))];
  }));
}
export function loadGardenDesign(value){
  const design={...defaultGardenDesign,placements:{},props:loadGardenProps(value?.props)};
  for(const [piece,options] of Object.entries(gardenPieceOptions)){
    if(Object.hasOwn(options,value?.[piece]))design[piece]=value[piece];
  }
  if(Number.isFinite(value?.pavilionPosition?.x)&&Number.isFinite(value.pavilionPosition.y)){
    design.pavilionPosition=clampGardenPlacement(value.pavilionPosition.x,value.pavilionPosition.y,pavilionBounds);
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

export const gardenActivities={focus:'Focus',rest:'Rest',shutdown:'Shutdown'};
export function loadGardenActivityLayouts(value,layouts){
  const saved=new Set(layouts.map(layout=>layout.id));
  return Object.fromEntries(Object.keys(gardenActivities).flatMap(activity=>
    saved.has(value?.[activity])?[[activity,value[activity]]]:[]));
}

export function gardenActivityLayout(layouts,assignments,{mode,shutdown}){
  const activity=shutdown?'shutdown':mode==='break'?'rest':'focus';
  return layouts.find(layout=>layout.id===assignments[activity]);
}

export function gardenFrame(camera){
  return (Object.hasOwn(gardenCameras,camera)?gardenCameras[camera]:gardenCameras.wide).viewBox;
}
export function gardenViewport(camera,width,height){
  const [x,y,w,h]=gardenFrame(camera),scale=Math.max(width/w,height/h);
  return {scale,x:(width-w*scale)/2-x*scale,y:(height-h*scale)/2-y*scale};
}
