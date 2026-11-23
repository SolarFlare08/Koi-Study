import {loadAppearance} from './garden-appearance.js';

export const gardenPieceOptions={
  mountains:{classic:'Layered peaks',summit:'Snowcapped summit',karst:'Ink pillars',valley:'Cloud valley',twins:'Twin peaks',rounded:'Soft ridges',highlands:'Distant highlands',cirque:'Glacial bowl',terraces:'Terraced slopes'},
  shoreline:{classic:'Reed banks',inlet:'Stone inlet',meadow:'Low meadow',slate:'Slate ledges',shallows:'Lotus shallows'},
  pavilion:{pagoda:'Lakeside pagoda',tiered:'Three-tier pagoda',tea:'Tea shelter',gate:'Moon gate',vermilion:'Vermilion pavilion',bell:'Stone bell tower',water:'Water pavilion',shrine:'Hillside shrine',watch:'Ridge watchtower',cloister:'Roofed gallery'},
  foundation:{auto:'Match the shore',stone:'Stone outcrop',timber:'Timber landing',terrace:'Stone terrace'},
  boat:{seasonal:'Changes with season',junk:'Junk under sail',sampan:'Covered sampan',skiff:'Reed skiff',lotus:'Lotus ferry',sail:'Ivory sail',festival:'Lantern barge',cargo:'Tea cargo boat',canopy:'Canopy ferry',none:'Quiet lake'},
  lantern:{classic:'Small oval',silk:'Round silk',hex:'Hexagonal bronze',paper:'Paper cylinder',glass:'Celadon glass',tassel:'Tasselled silk',lotus:'Lotus lantern',window:'Lattice lantern',none:'No lantern'},
  path:{none:'No path',stones:'Stepping stones',lanterns:'Lantern path',boardwalk:'Timber boardwalk',gravel:'Gravel trail',causeway:'Slate causeway'}
};
export const gardenCameras={
  wide:{name:'Full landscape',viewBox:[0,0,1600,900]},
  lake:{name:'Across the lake',viewBox:[155,171,1280,720]},
  east:{name:'Pagoda shore',viewBox:[426,229,1152,648]}
};
export const defaultPavilionPosition={x:1096,y:615};
export const defaultGardenDesign={mountains:'classic',shoreline:'classic',pavilion:'pagoda',foundation:'auto',
  boat:'seasonal',lantern:'classic',path:'none',camera:'wide',pavilionPosition:null,pavilionSize:100,placements:{},landmarkSizes:{},props:[]};
export const pavilionBounds={x:[90,1510],y:[557,848]};
export const gardenPropBounds={x:[32,1568],y:[446,883]};
const skyPropBounds={x:gardenPropBounds.x,y:[32,530]};
export const gardenPropLimit=36;
export const gardenSizeBounds={min:25,max:200,step:5};
export function gardenObjectSize(value){
  const {min,max,step}=gardenSizeBounds;
  return Number.isFinite(value)?Math.max(min,Math.min(max,Math.round(value/step)*step)):100;
}
export const gardenPropCategories={plants:'Plants',water:'Water',structures:'Structures',details:'Details',sky:'Sky'};
const sceneProps=(group,category,x,y)=>Object.fromEntries(
  Object.entries(gardenPieceOptions[group]).filter(([style])=>style!=='none').map(([style,name])=>
    [group+'-'+style,{name:group==='path'?name+' segment':group==='lantern'?'Hanging lantern · '+name:name,category,x,y,group,style}])
);
export const gardenPropTypes={
  bridge:{name:'Stone arch bridge',category:'structures',x:1200,y:673},
  dock:{name:'Wooden dock',category:'structures',x:1428,y:781},
  lantern:{name:'Stone lantern',category:'details',x:1158,y:621},
  bamboo:{name:'Bamboo grove',category:'plants',x:1496,y:828},
  pine:{name:'Leaning pine',category:'plants',x:290,y:843},
  plum:{name:'Plum blossoms',category:'plants',x:98,y:758},
  rocks:{name:'Shore rocks',category:'details',x:377,y:809},
  reeds:{name:'Golden reeds',category:'plants',x:1442,y:804},
  lilies:{name:'Lily pads',category:'water',x:529,y:768},
  crane:{name:'White crane',category:'water',x:1260,y:705},
  redbridge:{name:'Vermilion footbridge',category:'structures',x:1230,y:660},
  maple:{name:'Copper maple',category:'plants',x:167,y:800},
  cascade:{name:'Rock cascade',category:'water',x:1255,y:622},
  floater:{name:'Floating lantern',category:'water',x:914,y:761},
  wheel:{name:'Wooden waterwheel',category:'structures',x:1145,y:635},
  willow:{name:'Weeping willow',category:'plants',x:126,y:761},
  ginkgo:{name:'Golden ginkgo',category:'plants',x:1440,y:601},
  iris:{name:'Shore irises',category:'plants',x:1464,y:827},
  ducks:{name:'Mandarin duck pair',category:'water',x:575,y:742},
  ford:{name:'Stepping-stone ford',category:'water',x:278,y:782},
  screen:{name:'Round garden gate',category:'structures',x:1342,y:604},
  well:{name:'Stone well',category:'structures',x:188,y:757},
  bellpost:{name:'Bronze wind bell',category:'details',x:1160,y:615},
  beacon:{name:'Path beacon',category:'details',x:214,y:773},
  pottery:{name:'Celadon jars',category:'details',x:1131,y:618},
  shorepine:{name:'Shore pine',category:'plants',x:161,y:780},
  cherry:{name:'Cherry blossom tree',category:'plants',x:128,y:760},
  shoremaple:{name:'Autumn shore tree',category:'plants',x:1384,y:597},
  baretree:{name:'Bare winter tree',category:'plants',x:1479,y:606},
  shorereeds:{name:'Shore reeds',category:'plants',x:1440,y:818},
  wildflowers:{name:'Shore wildflowers',category:'plants',x:207,y:774},
  leaflitter:{name:'Fallen maple leaves',category:'details',x:208,y:766},
  boulder:{name:'Rounded shore boulder',category:'details',x:1449,y:842},
  cairn:{name:'Stone cairn',category:'details',x:1441,y:824},
  island:{name:'Low lake island',category:'water',x:1030,y:735},
  shorelotus:{name:'Flowering lotus pad',category:'water',x:541,y:764},
  dragonfly:{name:'Lake dragonfly',category:'water',x:570,y:699},
  ripple:{name:'Lake ripples',category:'water',x:632,y:714,viewBox:'-62 -22 124 44'},
  ice:{name:'Shore ice',category:'water',x:421,y:768,viewBox:'-62 -22 124 44'},
  cloud:{name:'Cloud bank',category:'sky',x:430,y:164,layer:'sky',viewBox:'-72 -25 144 50'},
  swallow:{name:'Swallow',category:'sky',x:544,y:187,layer:'day',viewBox:'-15 -9 30 18'},
  star:{name:'Golden star',category:'sky',x:580,y:127,layer:'night',viewBox:'-12 -9 24 18'},
  crescent:{name:'Crescent moon',category:'sky',x:1130,y:138,layer:'night',viewBox:'-32 -29 64 58'},
  ...sceneProps('pavilion','structures',1194,655),
  ...sceneProps('path','structures',1168,643),
  ...sceneProps('lantern','details',1124,634)
};
export const gardenPropLayer=kind=>gardenPropTypes[kind]?.layer||'ground';
export const gardenPropPositionBounds=kind=>gardenPropLayer(kind)==='ground'?gardenPropBounds:skyPropBounds;
export const gardenPropBands={back:'Behind scenery',middle:'Among scenery',front:'In front of scenery'};
export const gardenPropBand=prop=>prop.band||'middle';
export const gardenPropStack=prop=>gardenPropLayer(prop.kind)==='ground'?gardenPropBand(prop):'sky';
export const gardenPropMembers=(props,prop)=>prop.groupId?props.filter(item=>item.groupId===prop.groupId):[prop];

export function gardenPropMoveBounds(members,anchor){
  return Object.fromEntries(['x','y'].map(axis=>{
    const ranges=members.map(prop=>{
      const [min,max]=gardenPropPositionBounds(prop.kind)[axis];
      return [min-prop[axis],max-prop[axis]];
    });
    return [axis,[anchor[axis]+Math.max(...ranges.map(range=>range[0])),anchor[axis]+Math.min(...ranges.map(range=>range[1]))]];
  }));
}

export function duplicateGardenProps(props,anchor,makeId=()=>crypto.randomUUID()){
  const members=gardenPropMembers(props,anchor);
  if(props.length+members.length>gardenPropLimit)return null;
  const bounds=gardenPropMoveBounds(members,anchor);
  const offset=axis=>{
    const [min,max]=bounds[axis],forward=Math.min(18,max-anchor[axis]),backward=Math.max(-18,min-anchor[axis]);
    return forward>=-backward?forward:backward;
  };
  const [dx,dy]=['x','y'].map(offset),groupId=anchor.groupId?makeId():'';
  const copies=new Map(members.map(prop=>{
    const copy={...prop,id:makeId(),x:prop.x+dx,y:prop.y+dy};
    if(groupId)copy.groupId=groupId;
    delete copy.locked;
    return [prop.id,copy];
  }));
  let next=[...props,...copies.values()];
  for(const stack of new Set(members.map(gardenPropStack))){
    const order=gardenPropsInOrder(props,stack).flatMap(prop=>copies.has(prop.id)?[prop,copies.get(prop.id)]:[prop]);
    next=rankGardenProps(next,order);
  }
  return {props:next,id:copies.get(anchor.id).id};
}

export function gardenPropsInOrder(props,stack){
  return props.filter(prop=>gardenPropStack(prop)===stack).sort((a,b)=>(a.order??a.y)-(b.order??b.y));
}

export function moveGardenPropLayer(props,id,direction){
  const prop=props.find(item=>item.id===id);
  if(!prop||prop.locked)return props;
  const ordered=gardenPropsInOrder(props,gardenPropStack(prop));
  const index=ordered.indexOf(prop),last=ordered.length-1;
  const destination={front:last,forward:index+1,backward:index-1,back:0}[direction];
  if(!Number.isInteger(destination)||destination<0||destination>last||destination===index)return props;
  ordered.splice(index,1);
  ordered.splice(destination,0,prop);
  return rankGardenProps(props,ordered);
}

// Draw order runs back to front. A drop above a row paints after it.
export function dropGardenPropLayer(props,id,stack,targetId,above){
  const prop=props.find(item=>item.id===id);
  if(!prop||prop.locked||id===targetId)return props;
  const source=gardenPropStack(prop);
  if(source==='sky'?stack!=='sky':!Object.hasOwn(gardenPropBands,stack))return props;
  const previous=gardenPropsInOrder(props,stack);
  const ordered=previous.filter(item=>item!==prop);
  const target=ordered.findIndex(item=>item.id===targetId);
  if(targetId&&target<0)return props;
  const item={...prop};
  if(stack==='middle')delete item.band;
  else if(stack!=='sky')item.band=stack;
  ordered.splice(targetId?target+Number(above):ordered.length,0,item);
  if(source===stack&&ordered.every((entry,index)=>entry.id===previous[index].id))return props;
  return rankGardenProps(props,ordered);
}

function rankGardenProps(props,ordered){
  const [min,max]=gardenPropPositionBounds(ordered[0].kind).y;
  const span=Math.max(1,ordered.length-1);
  const ranked=new Map(ordered.map((item,index)=>[item.id,{...item,order:Math.round(min+index*(max-min)/span)}]));
  return props.map(item=>ranked.get(item.id)||item);
}
export function loadGardenProps(value){
  const props=new Map();
  for(const item of Array.isArray(value)?value:[]){
    if(typeof item?.id!=='string'||!/^[a-z0-9_-]{1,80}$/i.test(item.id)||!Object.hasOwn(gardenPropTypes,item.kind)||
      !Number.isFinite(item.x)||!Number.isFinite(item.y))continue;
    const bounds=gardenPropPositionBounds(item.kind);
    const prop={id:item.id,kind:item.kind,...clampGardenPlacement(item.x,item.y,bounds),size:gardenObjectSize(item.size)};
    if(gardenPropLayer(item.kind)==='ground'&&['front','back'].includes(item.band))prop.band=item.band;
    if(Number.isFinite(item.order))prop.order=Math.round(Math.max(bounds.y[0],Math.min(bounds.y[1],item.order)));
    if(item.hidden===true)prop.hidden=true;
    if(item.locked===true)prop.locked=true;
    if(typeof item.groupId==='string'&&/^[a-z0-9_-]{1,80}$/i.test(item.groupId))prop.groupId=item.groupId;
    props.set(item.id,prop);
    if(props.size===gardenPropLimit)break;
  }
  const items=[...props.values()],groups=new Map();
  for(const {groupId} of items)if(groupId)groups.set(groupId,(groups.get(groupId)||0)+1);
  for(const prop of items)if(groups.get(prop.groupId)===1)delete prop.groupId;
  return items;
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
  const design={...defaultGardenDesign,placements:{},landmarkSizes:{},props:loadGardenProps(value?.props)};
  for(const [piece,options] of Object.entries(gardenPieceOptions)){
    if(Object.hasOwn(options,value?.[piece]))design[piece]=value[piece];
  }
  if(Number.isFinite(value?.pavilionPosition?.x)&&Number.isFinite(value.pavilionPosition.y)){
    design.pavilionPosition=clampGardenPlacement(value.pavilionPosition.x,value.pavilionPosition.y,pavilionBounds);
  }
  if(Object.hasOwn(gardenCameras,value?.camera))design.camera=value.camera;
  design.pavilionSize=gardenObjectSize(value?.pavilionSize);
  for(const [key,size] of Object.entries(value?.landmarkSizes||{})){
    let parts;
    try{parts=JSON.parse(key);}catch{continue;}
    if(!Array.isArray(parts)||parts.length!==2||!movableGardenLandmark({kind:parts[0]})||typeof parts[1]!=='string'||!parts[1])continue;
    const normalized=gardenObjectSize(size);
    if(normalized!==100)design.landmarkSizes[gardenLandmarkKey({kind:parts[0],sourceId:parts[1]})]=normalized;
  }
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
