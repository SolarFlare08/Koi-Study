export {blossomMarkup} from './landscape.js';
import {daylight,blend,sunPosition} from './daylight.js';
import {gardenFrame,gardenLandmarkKey,defaultGardenDesign,gardenScenery,gardenSceneryObject,gardenSceneryTransform} from './garden-layout.js';
import {gardenPieces} from './garden-pieces.js';
import {styledBoat} from './garden-ornaments.js';
import {renderGardenProps} from './garden-props.js';
import {pine,rock,daySwallow,sceneReeds,lowIsland,stoneCairn,westCloud,lakeRipplePath,starDiamond,moonFace} from './garden-scene-art.js';
import {gardenStarProgress,starConstellations} from './garden-growth.js';
import {gardenWeather,sceneProgress,sceneryWeatherLayers} from './garden-appearance.js';
import {alternateBoats,alternateBoatLights,mountainSnowCut,seasonalTree,shoreDetails,snowbank,weatherMarkup} from './seasonal-scenery.js';
const boatOrigin='783 751';
const lakeRipples=[
  [233,600,97,5],[482,590,118,4],[889,604,102,6],[1113,583,147,4],
  [321,660,149,7],[683,647,106,5],[1010,681,172,6],
  [194,726,95,7],[465,787,130,9],[837,825,187,10],[1119,770,159,7]
];
function lakeRippleMarkup(){
  return `<g class="lake-ripples" fill="url(#lake-ripple)" opacity=".5">${lakeRipples.map(([x,y,width,height])=>
    `<path transform="translate(${x} ${y}) scale(${width/100} ${height})" d="${lakeRipplePath}"/>`
  ).join('')}</g>`;
}
function shoreTree(x,y,scale){
  return `<g class="season-layer summer-scene">${pine(x,y,scale)}</g>${seasonalTree(x,y,scale)}`;
}

const groveSlots = [
  [732,677,.27],[707,678,.19],[755,675,.21],[720,670,.17],[747,670,.16],
  [1184,608,.28],[1214,602,.24],[1245,596,.32],[1274,590,.25],[1293,600,.20],
  [1370,836,.31],[1393,831,.24],[1423,829,.29],[1450,818,.23]
];
const lanternSlots = [
  [921,745,1],[892,734,.85],[956,747,.95],[992,692,.8],[1025,717,.78],
  [843,797,1.05],[891,784,1],[934,805,1.1],[977,757,.88],[1027,732,.87],
  [1081,700,.77],[1135,680,.7],[1189,667,.67],[1242,661,.64]
];
const landmarkSlots = {
  project:groveSlots,book:lanternSlots,
  test:[[179,114,1],[689,79,.92],[1041,248,.95],[484,67,.92],[1208,72,.88],[665,201,.94],[1446,174,.88]],
  milestone:[[792,681,.9],[689,689,.8],[1149,638,.88],[1295,626,1],[1353,837,1],[706,681,.76]]
};
const placementSlots={
  west:{project:[[204,827,.31],[253,839,.27],[144,803,.25]],book:[[276,763,.95],[331,796,.85],[380,812,.9]],milestone:[[188,854,1],[231,861,.86],[125,845,.88]]},
  island:{project:groveSlots.slice(0,5),book:[[836,702,.83],[870,713,.85],[852,755,.9]],milestone:[[765,686,.86],[699,685,.78],[779,682,.76]]},
  east:{project:groveSlots.slice(5,10),book:lanternSlots.slice(-4),milestone:[[1149,638,.88],[1235,629,.82],[1295,626,1]]}
};
export function eveningCamera(width,height){
  const scale=Math.max(width/1600,height/900);
  const compact=width<650,zoom=compact?1.65:1.28;
  const targetX=width*(compact?.5:.66), targetY=height*(compact?.43:.62);
  const limit=(value,size,extent)=>Math.max(-(extent*zoom-size)/2,Math.min((extent*zoom-size)/2,value));
  return {zoom,width:1600*scale,height:900*scale,
    x:limit(targetX-width/2-(1096-800)*scale*zoom,width,1600*scale),
    y:limit(targetY-height/2-(615-450)*scale*zoom,height,900*scale)};
}

function growthPosition(slots,index){
  const [x,y,scale]=slots[index%slots.length];
  const layer=Math.floor(index/slots.length);
  if(!layer)return [x,y,scale];
  const angle=layer*2.4, radius=Math.min(14,5+layer);
  return [x+Math.cos(angle)*radius,y+Math.sin(angle)*radius/3,scale*Math.max(.32,.72-layer*.04)];
}

export function gardenLandmarkPositions(history,courses=[],placements={},sizes={}){
  const positions=new Map();
  const courseCenters=[[478,228],[1048,107],[700,147],[1250,286],[241,61],[1442,62],[824,74],[1061,275],[425,120],[1310,187]];
  courses.forEach((course,index)=>{
    const [x,y]=courseCenters[index%courseCenters.length],layer=Math.floor(index/courseCenters.length);
    [...course.stars].sort((a,b)=>a.index-b.index).forEach(({index:star},i)=>{
      const angle=i*2.4+index, radius=i?Math.min(52,16+Math.sqrt(i)*7):0;
      positions.set(star,[x+Math.cos(angle)*radius+layer*9,y+Math.sin(angle)*radius*.68+layer*8,.86]);
    });
  });
  const skyPoints=[...positions.values()];
  let candidate=0;
  const counts=new Map();
  const occupied=new Set();
  return history.map((item,originalIndex)=>{
    if(positions.has(originalIndex))return {item,index:originalIndex,position:positions.get(originalIndex)};
    if(item.kind==='test'){
      let position;
      for(let attempts=0;attempts<180;attempts++){
        const index=candidate++;
        position=landmarkSlots.test[index]||[166+(index*.61803398875%1)*1280,55+(index*.41421356237%1)*239,.82];
        const [x,y]=position;
        const overlaps=starConstellations.some(item=>Math.abs(x-item.x)<65&&Math.abs(y-item.y)<49)||
          (x>883&&x<1001&&y>83&&y<267)||skyPoints.some(([sx,sy])=>Math.hypot(x-sx,y-sy)<22);
        if(!overlaps)break;
      }
      skyPoints.push(position);
      return {item,index:originalIndex,position};
    }
    const key=`${item.kind}:${item.zone||''}`;
    let index=counts.get(key)||0,position,spot;
    const slots=placementSlots[item.zone]?.[item.kind]||landmarkSlots[item.kind];
    do{
      position=growthPosition(slots,index++);
      spot=`${item.kind}:${position[0]}:${position[1]}`;
    }while(occupied.has(spot));
    counts.set(key,index);occupied.add(spot);
    const landmarkKey=gardenLandmarkKey(item),custom=placements[landmarkKey];
    const scale=position[2]*((sizes[landmarkKey]??100)/100);
    return {item,index:originalIndex,position:[custom?.x??position[0],custom?.y??position[1],scale]};
  });
}

function landmarkGround(x,y,scale){
  return `<g transform="translate(${x} ${y}) scale(${scale})" aria-hidden="true">
    <ellipse cy="7" rx="31" ry="8" fill="#416965" opacity=".23"/>
    <path d="M-33 4Q-24-3-7-3Q11-8 32 1Q42 7 16 11Q-6 15-33 4Z" fill="url(#shore)"/>
    <path d="M-25 3Q-2-5 23 1" fill="none" stroke="var(--shore-upper,#9cb28d)" stroke-width="1.7" opacity=".72"/>
  </g>`;
}
export function starLight(magnitude){
  const flux=10**(-.4*(magnitude-.18));
  return {radius:Math.min(3.3,.85+2.2*flux**.36),opacity:Math.min(1,.25+.75*flux**.36),
    halo:magnitude<1.85?Math.min(.34,.32*flux**.55):0};
}
function starPoint(x,y,magnitude,color='var(--garden-star-gold,#efd58e)'){
  const {radius,opacity,halo}=starLight(magnitude);
  return `${halo?`<circle cx="${x}" cy="${y}" r="${(radius*2.5).toFixed(2)}" fill="url(#halo)" opacity="${halo.toFixed(2)}"/>`:''}
    <circle class="sky-star-point" cx="${x}" cy="${y}" r="${radius.toFixed(2)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`;
}
function earnedStarSparkle(id){
  let hash=2166136261;
  for(const char of id)hash=Math.imul(hash^char.codePointAt(0),16777619);
  hash=Math.imul(hash^(hash>>>16),0x7feb352d);
  hash=Math.imul(hash^(hash>>>15),0x846ca68b);
  hash^=hash>>>16;
  const size=.58+(hash&255)/255*.47;
  const period=3.5+((hash>>>8)&255)/255*4.5;
  const phase=-period*((hash>>>16)&255)/255;
  return `<g transform="scale(${size.toFixed(3)})"><g class="garden-star-twinkle"
    style="--star-period:${period.toFixed(2)}s;--star-phase:${phase.toFixed(2)}s">
    <circle r="14" fill="url(#halo)" opacity=".54"/>
    ${starDiamond}
  </g></g>`;
}
const orionStars=[
  ['Betelgeuse',901,126,.45,'#ffc38c'],['Meissa',932,101,3.66,'#ebd4a1'],
  ['Bellatrix',974,133,1.64,'#f5dda5'],['Mintaka',949,173,2.41,'#efd69d'],
  ['Alnilam',938,178,1.69,'#f5dfab'],['Alnitak',927,183,1.82,'#f7e0a5'],
  ['Saiph',916,250,2.07,'#f0d9a4'],['Rigel',983,235,.18,'#ffe9b7']
];
export function constellationLitPoints(item){
  return item.points.map(([x,y],index)=>[x,y,item.magnitudes[index]])
    .sort((a,b)=>a[2]-b[2]).slice(0,item.starIndices?.length??item.points.length);
}
function constellationShape(item){
  const lines=item.lines.map(line=>`<polyline points="${line.map(index=>item.points[index].join(',')).join(' ')}"/>`).join('');
  const stars=constellationLitPoints(item).map(([x,y,magnitude])=>starPoint(x,y,magnitude)).join('');
  return `<g fill="none" stroke="currentColor" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round" opacity=".5">${lines}</g>
    <g fill="currentColor">${stars}</g>`;
}
export function gardenConstellationSketch(item){
  return `<svg viewBox="-65 -50 130 105" aria-hidden="true">${constellationShape(item)}</svg>`;
}

export function gardenGrowthMarkup(history,{courses=[],through='',visible,design=defaultGardenDesign}={}){
  const trees=[],lanterns=[],lights=[];
  const stars=[],swallows=[],cairns=[];
  const {assigned,unlocked}=gardenStarProgress(history,{through,visible});
  for(const item of unlocked){
    stars.push(`<g class="garden-unlocked-constellation" data-constellation-art="${item.id}" transform="translate(${item.x} ${item.y})"><title>${item.name}</title>${constellationShape(item)}</g>`);
    const formation=constellationLitPoints(item).map(([x,y,magnitude],index)=>
      daySwallow(item.x+x,item.y+y,(.22+starLight(magnitude).radius*.065).toFixed(2),item.threshold+index,item.threshold%2?1:-1)).join('');
    swallows.push(`<g data-swallow-flock="${item.id}">${formation}</g>`);
  }
  let hasIsland=false;
  const layout=gardenLandmarkPositions(history,courses,design.placements,design.landmarkSizes);
  const courseStars=new Set(courses.flatMap(course=>course.stars.map(({index})=>index)));
  let nextStar=0;
  const starMagnitudes=[1.05,2.7,1.85,3.1,1.4,2.45,3.45,2.2,2.9,1.6,3.7];
  for(const course of courses){
    const points=course.stars.filter(({item,index})=>!assigned.has(index)&&(!through||item.day<=through)&&(!visible||visible.has(index))).map(({index})=>layout[index].position.slice(0,2).join(','));
    if(points.length>1)stars.push(`<polyline points="${points.join(' ')}" fill="none" stroke="#9ec6d8" stroke-width="1.4" opacity=".75"/>`);
  }
  for(const {item,index,position} of layout){
    const magnitude=item.kind==='test'?starMagnitudes[nextStar++%starMagnitudes.length]:null;
    if(visible&&!visible.has(index))continue;
    if(through&&item.day>through)continue;
    if(assigned.has(index))continue;
    const [x,y,scale]=position;
    const placed=Object.hasOwn(design.placements,gardenLandmarkKey(item));
    const transform=`translate(${x} ${y}) scale(${scale})`;
    if(item.kind==='project'){
      trees.push({y,art:(placed?landmarkGround(x,y,Math.max(.66,scale*3)):"")+shoreTree(x,y,scale)});
      if(!placed&&x>=684&&x<=786)hasIsland=true;
    }else if(item.kind==='book'){
      lanterns.push(`<g transform="${transform}">
        <ellipse rx="12" ry="3" fill="#385e5b" opacity=".35"/>
        <path d="M-8-1h16l-3 3H-5Z" fill="#795f53"/>
        <path d="M-5-1l-1-9h12L5-1Z" fill="#dfae7c" stroke="#956e56" stroke-width=".85"/>
        <path d="M0-10v9" stroke="#f3d0a2" stroke-width=".8"/>
      </g>`);
      lights.push(`<g transform="${transform}">
        <ellipse cy="-6" rx="24" ry="16" fill="url(#lamp-halo)"/>
        <path d="M-4-8h8l-1 6h-6Z" fill="#ffe0a1"/>
        <path d="M-5 5H5m-3 3h6" stroke="#ffd498" stroke-linecap="round" opacity=".43"/>
      </g>`);
    }else if(item.kind==='test'){
      const artwork=courseStars.has(index)?starPoint(0,0,magnitude):earnedStarSparkle(item.sourceId);
      stars.push(`<g class="garden-earned-star" transform="${transform}">${artwork}</g>`);
      swallows.push(daySwallow(x,y,(scale*.52).toFixed(2),index));
    }else if(item.kind==='milestone'){
      if(!placed&&item.zone==='island')hasIsland=true;
      if(placed)cairns.push(landmarkGround(x,y,scale*.78));
      cairns.push(`<g transform="${transform}">${stoneCairn}</g>`);
    }
  }
  const island=hasIsland?`<g transform="translate(734 682)">${lowIsland('url(#shore)')}</g>`:'';
  return {trees:island+trees.sort((a,b)=>a.y-b.y).map(tree=>tree.art).join(''),
    lanterns:lanterns.join(''),lights:lights.join(''),stars:stars.join(''),swallows:swallows.join(''),cairns:cairns.join('')};
}

const fieldSketches={
  project:'<path d="M24 33q4-9 2-20" stroke="#b28d6c" stroke-width="2" fill="none"/><path d="M9 19q5-5 9-6 4-8 10-7 5 1 8 7l7 4q-5 5-15 3-8 3-19-1Zm4 7q8-8 15-5 7-3 13 4-13 5-28 1Z" fill="#7aaa97"/><path d="M7 34q16-5 35 0" stroke="#9ac2a8" fill="none" opacity=".6"/>',
  book:'<ellipse cx="25" cy="29" rx="17" ry="6" fill="#99b9ba" opacity=".24"/><path d="M17 26l-1-13h17l-1 13Z" fill="#e8b17e" stroke="#a87860"/><path d="M24 14v11m-10 2h21l-4 4H18Z" stroke="#ffe1a4" fill="none"/><path d="M12 34h25" stroke="#efd09f" opacity=".55"/>',
  test:'<path d="m10 27 13-14 14 8" fill="none" stroke="#9ec6d8"/><circle cx="10" cy="27" r="2" fill="#dceaf0"/><circle cx="37" cy="21" r="2" fill="#dceaf0"/><path d="M23 5q1 7 8 8-7 1-8 8-1-7-8-8 7-1 8-8Z" fill="#fff1cb"/>',
  milestone:'<ellipse cx="25" cy="32" rx="15" ry="4" fill="#54766c"/><path d="M11 30q3-7 15-6 9 0 13 5l-3 4H16Z" fill="#86988c"/><path d="M16 24q1-6 10-8 7 1 8 6l-3 3Z" fill="#aab398"/><path d="M21 16q-2-5 3-9 6-1 8 6l-3 4Z" fill="#ceaf89"/>'
};
export function gardenFieldSketch(kind){
  return `<svg viewBox="0 0 50 40" aria-hidden="true">${fieldSketches[kind]}</svg>`;
}
const seasonalBoat=()=>`<g transform="translate(${boatOrigin})">
  ${alternateBoats()}
  <g class="season-layer summer-scene">
  <ellipse cy="10" rx="50" ry="4" fill="#315e60" opacity=".2"/>
  <ellipse class="boat-wake" cy="10" rx="48" ry="6" fill="none" stroke="#d2dcc9" opacity=".28"/>
  <path d="M-63 10h19m83 4h20m-92 5h50" fill="none" stroke="#d9dec9" stroke-linecap="round" opacity=".38"/>
  <g class="boat-bob">
    <path d="M-32-2v-15q14-23 34-7L9-3Z" fill="#6d7b60"/>
    <path d="M-30-15q13-20 32-8l4 7q-15-9-36 1Z" fill="#a7ad87"/>
    <path d="M-25-4v-11q10-7 23-4L1-4Z" fill="#3e5d56"/>
    <path d="M-30-16q12-7 32-7M-31-10q6-4 13-5" fill="none" stroke="#d0c9a2" stroke-width=".85" opacity=".65"/>
    <path d="M-3-16v4" stroke="#344f46" stroke-width=".8"/>
    <ellipse cx="-3" cy="-9" rx="3.2" ry="4" fill="#a87354"/>
    <path d="M15-18q5-3 8 2l2 7 10 4h-20l-2-7Z" fill="#426760"/>
    <path d="M20-15l7 5 5-2" fill="none" stroke="#416760" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="19" cy="-21" r="3" fill="#ab8c6c"/>
    <path d="M9-22l9-6 9 5q-7 3-18 1Z" fill="#bfa77e"/>
    <path d="M27-9q13-19 32-24" fill="none" stroke="#435d53" stroke-width="1.45" stroke-linecap="round"/>
    <path d="M59-33q6 17 5 38" fill="none" stroke="#e9e3c5" stroke-width=".75" opacity=".76"/>
    <path d="M-49-8Q-23 0 0-1q32 0 49-8Q44 1 34 7q-39 8-70 0Z" fill="#385f5c"/>
    <path d="M-46-7Q-8 6 45-7M-34 3q27 8 64 2" fill="none" stroke="#c4b693" stroke-width="1.2" stroke-linecap="round" opacity=".72"/>
  </g>
  <g transform="translate(64 7)"><ellipse class="fishing-ripple" rx="11" ry="3" fill="none" stroke="#e4e8d5" opacity=".28"/><circle cy="-1" r="1.65" fill="#cf916d"/></g>
  </g>
</g>`;
const seasonalBoatLights=()=>`<g transform="translate(${boatOrigin})">
    ${alternateBoatLights()}
    <g class="boat-bob season-layer summer-scene">
      <circle cx="-3" cy="-9" r="19" fill="url(#lamp-halo)"/>
      <ellipse cx="-3" cy="-9" rx="3.2" ry="4" fill="#ffcd86"/>
      <ellipse cx="-3" cy="-9" rx="1.55" ry="2.5" fill="#ffecd0"/>
    </g>
  </g>`;
const boatPiece=(style,lights=false)=>style==='seasonal'?(lights?seasonalBoatLights():seasonalBoat()):
  `<g transform="translate(${boatOrigin})">${styledBoat(style,lights)}</g>`;
const propPiece=stack=>({option:'props',key:design=>JSON.stringify(design.props||[]),render:items=>renderGardenProps(items||[],stack)});
const scenicPiece=section=>({option:'scenery',key:design=>JSON.stringify(design.scenery||{}),render:(_,design)=>
  Object.keys(gardenScenery).filter(id=>gardenScenery[id].section===section).map(id=>{
    const item=gardenSceneryObject(design,id);
    if(item.hidden)return '';
    const art=item.kind==='shorepine'?shoreTree(0,0,1):item.kind==='boulder'?rock(0,0,1):sceneReeds(0,0);
    return `<g data-garden-scenery="${id}" transform="${gardenSceneryTransform(item)}">${art}</g>`;
  }).join('')});
const scenePieces={...gardenPieces,props:propPiece('middle'),backProps:propPiece('back'),frontProps:propPiece('front'),skyProps:propPiece('sky'),
  farScenery:scenicPiece('far'),westScenery:scenicPiece('west'),shoreScenery:scenicPiece('shore'),
  boat:{option:'boat',render:style=>boatPiece(style)},
  boatLights:{option:'boat',render:style=>boatPiece(style,true)}};
const pieceKey=(piece,design)=>piece.key?.(design)||'';

const pieceMarkup=(id,design)=>{
  const piece=scenePieces[id],value=Array.isArray(design[piece.option])?'custom':design[piece.option];
  return `<g data-garden-piece="${id}" data-variant="${value}">${piece.render(design[piece.option],design)}</g>`;
};
export function applyGardenDesign(scene,design){
  for(const node of scene.querySelectorAll('[data-garden-piece]')){
    const piece=scenePieces[node.dataset.gardenPiece];
    const variant=design[piece.option],value=Array.isArray(variant)?'custom':variant,key=pieceKey(piece,design);
    if(node.dataset.variant===value&&(node.dataset.pieceKey||'')===key)continue;
    node.innerHTML=piece.render(variant,design);
    node.dataset.variant=value;node.dataset.pieceKey=key;
  }
  scene.setAttribute('viewBox',gardenFrame(design.camera).join(' '));
}
export function renderLandscape(design=defaultGardenDesign){return `<svg class="world" viewBox="${gardenFrame(design.camera).join(' ')}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="air" x2="0" y2="1"><stop id="zenith" stop-color="#c8d9d7"/><stop id="sky-middle" offset=".67" stop-color="#eee4d4"/><stop id="horizon" offset="1" stop-color="#f5d9ba"/></linearGradient>
<linearGradient id="season-sky" x2="0" y2="1"><stop stop-color="var(--season-sky,#dce9e8)" stop-opacity="0"/><stop offset="1" stop-color="var(--season-sky,#dce9e8)" stop-opacity="var(--season-sky-strength,0)"/></linearGradient>
<linearGradient id="far" x2="0" y2="1"><stop stop-color="var(--far-ridge,#a6bdb9)"/><stop offset="1" stop-color="var(--far-base,#d6dcd0)"/></linearGradient>
<linearGradient id="middle" x2=".36" y2="1"><stop stop-color="var(--ridge-middle,#719893)"/><stop offset="1" stop-color="var(--ridge-mist,#b7c9b9)"/></linearGradient>
<linearGradient id="near" x2=".42" y2="1"><stop stop-color="var(--ridge-near,#487775)"/><stop offset="1" stop-color="var(--ridge-base,#8bb0a2)"/></linearGradient>
<linearGradient id="cloud-light" x2="0" y2="1"><stop stop-color="#fff3db" stop-opacity=".63"/><stop offset="1" stop-color="#f4eddf" stop-opacity=".1"/></linearGradient>
<radialGradient id="cloud-veil">
  <stop stop-color="#f8f0de" stop-opacity=".60"/><stop offset=".42" stop-color="#f1ebdf" stop-opacity=".46"/>
  <stop offset=".76" stop-color="#f0ecdf" stop-opacity=".19"/><stop offset="1" stop-color="#f0ecdf" stop-opacity="0"/>
</radialGradient>
<radialGradient id="cloud-wisp">
  <stop stop-color="#fcf6e8" stop-opacity=".55"/><stop offset=".58" stop-color="#f4efde" stop-opacity=".27"/>
  <stop offset="1" stop-color="#f4efde" stop-opacity="0"/>
</radialGradient>
<filter id="cloud-soft-edge" x="-8%" y="-50%" width="116%" height="200%"><feGaussianBlur stdDeviation="2.6"/></filter>
<linearGradient id="slope-wash" x2=".22" y2="1"><stop stop-color="#2c595c" stop-opacity=".32"/><stop offset="1" stop-color="#2c595c" stop-opacity="0"/></linearGradient>
<linearGradient id="water" x2="0" y2="1"><stop stop-color="var(--water-horizon,#ced7c6)"/><stop offset=".35" stop-color="var(--water-middle,#adc9bc)"/><stop offset="1" stop-color="var(--water-near,#6d9c98)"/></linearGradient>
<linearGradient id="mist" x2="0" y2="1"><stop stop-color="#f6eddc" stop-opacity="0"/><stop offset=".5" stop-color="#f6eddc" stop-opacity=".8"/><stop offset="1" stop-color="#f6eddc" stop-opacity="0"/></linearGradient>
<linearGradient id="ice-mist" x2="0" y2="1"><stop stop-color="#e4f2f5" stop-opacity="0"/><stop offset=".55" stop-color="#dcebf0" stop-opacity=".76"/><stop offset="1" stop-color="#dcebf0" stop-opacity="0"/></linearGradient>
<radialGradient id="heat-haze"><stop stop-color="#fff0c4" stop-opacity=".29"/><stop offset=".46" stop-color="#ffe2aa" stop-opacity=".13"/><stop offset="1" stop-color="#ffe2aa" stop-opacity="0"/></radialGradient>
<linearGradient id="lake-ripple" x2="1" y2="0"><stop stop-color="#e6e4cc" stop-opacity="0"/><stop offset=".43" stop-color="#e6e4cc" stop-opacity=".36"/><stop offset="1" stop-color="#e6e4cc" stop-opacity="0"/></linearGradient>
<linearGradient id="reflection" x2="0" y2="1"><stop stop-color="#fce4bb" stop-opacity=".7"/><stop offset="1" stop-color="#fce4bb" stop-opacity="0"/></linearGradient>
<radialGradient id="halo"><stop stop-color="#ffe9bd" stop-opacity=".65"/><stop offset="1" stop-color="#ffe9bd" stop-opacity="0"/></radialGradient>
<radialGradient id="lamp-halo"><stop stop-color="#ffbe75" stop-opacity=".52"/><stop offset=".36" stop-color="#e6a66d" stop-opacity=".24"/><stop offset="1" stop-color="#e6a66d" stop-opacity="0"/></radialGradient>
<radialGradient id="moon-halo"><stop stop-color="#e5effd" stop-opacity=".22"/><stop offset="1" stop-color="#bbd8fc" stop-opacity="0"/></radialGradient>
<linearGradient id="meteor-tail" gradientUnits="userSpaceOnUse" x1="-128" y1="0" x2="0" y2="0">
  <stop stop-color="#acd7ee" stop-opacity="0"/><stop offset=".58" stop-color="#bcdef6" stop-opacity=".54"/><stop offset=".93" stop-color="#ffe547"/><stop offset="1" stop-color="#fff772"/>
</linearGradient>
<radialGradient id="meteor-glow"><stop stop-color="#fff78e" stop-opacity=".52"/><stop offset=".35" stop-color="#ffe52d" stop-opacity=".30"/><stop offset="1" stop-color="#ffd737" stop-opacity="0"/></radialGradient>
<linearGradient id="bank" x2=".4" y2="1"><stop stop-color="var(--bank-upper,#547d6b)"/><stop offset="1" stop-color="var(--bank-lower,#294f4d)"/></linearGradient>
<linearGradient id="shore" x2="0" y2="1"><stop stop-color="var(--shore-upper,#8eac91)"/><stop offset="1" stop-color="var(--shore-lower,#527e70)"/></linearGradient>
<linearGradient id="rock-face" x2=".55" y2="1"><stop stop-color="#9cae99"/><stop offset="1" stop-color="#597b73"/></linearGradient>
<clipPath id="mountain-snow-cut"><path d="${mountainSnowCut}"/></clipPath>
</defs>
<path fill="url(#air)" d="M0 0h1600v900H0z"/>
<path id="season-sky-wash" fill="url(#season-sky)" d="M0 0h1600v568H0z"/>
<g id="sun-halo"><circle r="135" fill="url(#halo)"/></g><circle id="travelling-sun" r="34" fill="#fff0cd"/>
<g class="cloud-drift cloud-high" data-cloud-layer="high" fill="url(#cloud-wisp)" opacity=".75">
  <ellipse cx="648" cy="83" rx="277" ry="17" transform="rotate(-3 648 83)"/>
  <ellipse cx="1092" cy="66" rx="226" ry="15" transform="rotate(-2 1092 66)"/>
  <ellipse cx="887" cy="103" rx="172" ry="10" opacity=".70"/>
</g>
<g id="garden-starlight" opacity="0">
<g id="stars" fill="#f5d99c" opacity=".6">
  <circle cx="321" cy="116" r="1.2"/><circle cx="1013" cy="87" r="1"/><circle cx="1280" cy="167" r="1.3"/><circle cx="460" cy="237" r=".9"/><circle cx="1107" cy="247" r="1"/><circle cx="620" cy="66" r="1"/><circle cx="1423" cy="88" r=".8"/>
  <g class="orion"><title>Orion</title><path d="M901 126L932 101L974 133L949 173L938 178L927 183L901 126M927 183L916 250L983 235L949 173" stroke="#b6c8d9" stroke-width=".85" opacity=".38" fill="none"/>
    ${orionStars.map(([name,x,y,magnitude,color])=>`<g data-star-name="${name}"><title>${name}</title>${starPoint(x,y,magnitude,color)}</g>`).join('')}
  </g>
</g>
<g id="garden-growth-stars"/>
</g>
<g id="garden-day-sky" opacity="0">
  <g opacity=".76">${daySwallow(340,145,.73,0,1,820)}${daySwallow(1190,173,.58,1,-1,850)}${daySwallow(460,219,.53,2,1,745)}</g>
  <g id="garden-growth-swallows"/>
</g>
<g data-cloud-layer="middle" fill="url(#cloud-light)" filter="url(#cloud-soft-edge)">
  <g class="cloud-drift">${westCloud}</g>
  <g class="cloud-drift cloud-east"><path d="M1033 146C1090 143 1114 130 1153 133C1184 135 1205 111 1241 114C1270 116 1278 131 1308 134C1350 139 1378 134 1428 140C1386 149 1356 147 1325 150C1272 155 1242 146 1199 149C1136 153 1086 151 1033 146Z"/><path d="M1194 165C1239 165 1264 157 1308 159C1340 160 1366 162 1400 156C1367 171 1321 167 1286 168Q1239 172 1194 165Z" opacity=".56"/></g>
</g>
<g class="weather-overcast" fill="url(#cloud-veil)" aria-hidden="true">
  <g class="weather-cover-west">
    <ellipse cx="234" cy="151" rx="574" ry="68" transform="rotate(-3 234 151)"/>
    <ellipse cx="435" cy="174" rx="340" ry="33" opacity=".50"/>
  </g>
  <g class="weather-cover-east">
    <ellipse cx="1345" cy="166" rx="554" ry="73" transform="rotate(3 1345 166)"/>
    <ellipse cx="1127" cy="131" rx="288" ry="35" opacity=".43"/>
  </g>
</g>
<g class="cloud-drift cloud-low" data-cloud-layer="low" fill="url(#cloud-veil)" opacity=".56">
  <ellipse cx="404" cy="259" rx="372" ry="33" transform="rotate(-2 404 259)"/>
  <ellipse cx="724" cy="283" rx="257" ry="22" opacity=".70"/>
  <ellipse cx="1256" cy="253" rx="352" ry="35" transform="rotate(2 1256 253)"/>
</g>
<g class="sky-flock" fill="none" stroke="#5f8586" stroke-width="1.5" stroke-linecap="round" opacity="0">
  <path d="M492 195q4-4 8 0 4-5 8-3M520 180q3-4 7-1 3-4 7-2M538 201q3-4 7-1 3-4 7-2"/>
</g>
${pieceMarkup('skyProps',design)}
<g id="garden-meteor" opacity="0" data-live-scenery>
  <g class="meteor-tail">
    <path d="M-128 0Q-40-1 0-5L0 5Q-40 1-128 0Z" fill="url(#meteor-tail)" opacity=".26"/>
    <path d="M-128 0Q-40-.85 0-2.2L0 2.2Q-40 .85-128 0Z" fill="url(#meteor-tail)"/>
  </g>
  <circle r="21" fill="url(#meteor-glow)"/><circle r="4.9" fill="#e7ca65"/><circle r="4.15" fill="#f7f2d4"/>
</g>
${pieceMarkup("mountains",design)}
<path fill="url(#water)" d="M0 548q297-24 524-6t463-1 613 6v353H0Z"/>
<path class="valley-fog shore-fog" fill="url(#mist)" d="M0 474h1600v133H0z"/>
<g id="shine"><ellipse cx="0" cy="640" rx="105" ry="150" fill="url(#halo)" opacity=".35"/><g stroke="#fff1cd" stroke-linecap="round" opacity=".65"><path d="M-64 556H62M-43 563H49M-78 575H66M-28 590H42M-62 612H82M-38 646H59M-69 695H51"/><path d="M-108 573h19m169 27h32m-132 62h24m-65 66h34" opacity=".5"/></g></g>
${lakeRippleMarkup()}
<g fill="none" stroke="#f3ebcf" stroke-linecap="round">
  <path class="lake-glimmer" d="M650 734h20m-12 5h7" opacity="0"/>
  <path class="lake-glimmer glimmer-late" d="M878 704h13m-8 4h4" opacity="0"/>
</g>
${pieceMarkup("backProps",design)}
<g class="far-shore">
  <path d="M1600 641C1515 624 1453 622 1387 624C1293 626 1203 634 1129 636C1096 636 1068 631 1041 626C1069 642 1101 646 1147 645C1283 641 1397 634 1481 640C1530 644 1567 650 1600 658Z" fill="#6a948a" opacity=".28"/>
  <path fill="url(#shore)" d="M1600 580C1519 553 1451 551 1392 562C1359 569 1327 566 1302 569C1234 574 1181 582 1141 596C1102 610 1069 615 1041 620C1030 623 1044 628 1067 631C1121 639 1179 633 1234 626C1300 618 1367 612 1429 616C1491 620 1545 633 1600 644Z"/>
  <path fill="#abc1a4" opacity=".7" d="M1060 622C1103 615 1132 601 1168 593C1226 578 1311 572 1375 571C1346 574 1316 581 1287 591C1208 610 1118 629 1060 622Z"/>
  <path d="M1058 631C1120 641 1209 631 1265 627M1364 623C1415 621 1460 626 1504 634" fill="none" stroke="#d3dbc2" stroke-width="1.4" stroke-linecap="round" opacity=".56"/>
  ${snowbank('far')}
  ${pieceMarkup("farScenery",design)}
  <path d="M1074 623C1101 619 1129 619 1149 611C1171 602 1187 600 1200 600C1180 611 1160 620 1132 624C1108 627 1092 625 1074 623Z" fill="var(--far-shore-detail,#759986)"/>
</g>
${pieceMarkup("pavilion",design)}
<g id="blossoms" transform="translate(1185 452) scale(.22)"/>
<g id="garden-growth-lanterns"/>
${pieceMarkup("boat",design)}
${pieceMarkup("westBank",design)}
${pieceMarkup("westScenery",design)}
${pieceMarkup("eastBank",design)}
${pieceMarkup("shoreScenery",design)}
${shoreDetails()}
${pieceMarkup("path",design)}
${pieceMarkup("props",design)}
<g id="garden-growth-trees"/>
<g id="garden-growth-cairns"/>
${pieceMarkup("frontProps",design)}
<rect id="night-shade" width="1600" height="900" fill="#071730" opacity="0"/>
<g id="evening-lights" opacity="0">
  <g id="garden-growth-lights"/>
  <g class="far-shore">
    ${pieceMarkup("pavilionLights",design)}
  </g>
${pieceMarkup("boatLights",design)}
</g>
<g id="garden-moon" opacity="0"><circle r="64" fill="url(#moon-halo)"/>${moonFace}</g>
${weatherMarkup()}
</svg>`;}
export function applySceneryAppearance(container,{season,palette},weather){
  if(container.dataset.palette!==palette)container.dataset.palette=palette;
  if(container.dataset.season===season&&container.dataset.weather===weather)return;
  container.dataset.season=season;
  container.dataset.weather=weather;
  for(const [layer,opacity] of Object.entries(sceneryWeatherLayers(season,weather)))container.style.setProperty(`--scene-${layer}`,opacity);
}

function lightNodes(scope,app){
  const find=id=>scope.querySelector('#'+id);
  return {sun:find('travelling-sun'),halo:find('sun-halo'),shine:find('shine'),top:find('zenith'),
    middle:find('sky-middle'),bottom:find('horizon'),wash:find('season-sky-wash'),shade:find('night-shade'),
    lamps:find('evening-lights'),stars:find('garden-starlight'),daySky:find('garden-day-sky'),moon:find('garden-moon'),app};
}
let nodes,lastFrame,previewId=0;
function paintDay(p,lighting){
  const width=innerWidth,height=innerHeight;
  if(lastFrame?.p===p&&lastFrame.lighting===lighting&&lastFrame.width===width&&lastFrame.height===height)return lastFrame.darkSky;
  nodes??=lightNodes(document,document.querySelector('#app'));
  const darkSky=paintLight(nodes,p,lighting,width,height);
  lastFrame={p,lighting,width,height,darkSky};
  return darkSky;
}
function paintLight(nodes,p,lighting,width,height){
  const light=daylight(p),k=light.p,{x,y}=sunPosition(k,width,height);
  nodes.sun.setAttribute('cx',x);nodes.sun.setAttribute('cy',y);nodes.halo.setAttribute('transform',`translate(${x} ${y})`);nodes.shine.setAttribute('transform',`translate(${x} 0)`);
  nodes.top.setAttribute('stop-color',light.top);nodes.middle.setAttribute('stop-color',light.middle);nodes.bottom.setAttribute('stop-color',light.horizon);
  nodes.wash.setAttribute('opacity',1-light.night);
  nodes.shade.setAttribute('opacity',light.shade);nodes.stars.setAttribute('opacity',light.starlight);
  const dayOnly=lighting==='day';
  nodes.daySky.setAttribute('opacity',dayOnly?1:0);
  nodes.app.style.setProperty('--prop-day-visibility',dayOnly?'visible':'hidden');
  nodes.app.style.setProperty('--prop-night-visibility',light.starlight>0?'visible':'hidden');
  nodes.app.style.setProperty('--prop-starlight',light.starlight);
  nodes.app.style.setProperty('--prop-lamplight',light.lamplight);
  nodes.app.toggleAttribute('data-sky-landmarks',light.starlight>0||dayOnly);
  nodes.lamps.setAttribute('opacity',light.lamplight);
  const scale=Math.max(width/1600,height/900);
  nodes.moon.setAttribute('transform',`translate(${800+Math.min(280,width/scale*.34)} ${Math.max(145,(900-height/scale)/2+83)})`);
  nodes.moon.setAttribute('opacity',lighting==='night'?'.94':'0');
  nodes.shine.setAttribute('opacity',(1-light.night)*light.sunlight);nodes.sun.setAttribute('opacity',light.sunlight);nodes.halo.setAttribute('opacity',light.sunlight);nodes.sun.setAttribute('fill',blend('#fff2ca','#eea177',Math.pow(Math.abs(k-.5)*2,3)));
  const dark=light.night>=.58;
  nodes.app.style.setProperty('--garden-ink',dark?'#f6edd7':'#263f43');
  nodes.app.style.setProperty('--garden-muted',dark?'#e1ddd0':'#385359');
  nodes.app.style.setProperty('--garden-paper',dark?'#26394a':'#e9e6d8');
  nodes.app.style.setProperty('--scene-ink',blend('#34565a','#f1e6d3',light.night));
  nodes.app.style.setProperty('--scene-muted',blend('#55726c','#c9cdd1',light.night));
  nodes.app.style.setProperty('--scene-paper',blend('#e7eadc','#26394a',light.night));
  nodes.app.style.setProperty('--scene-twilight',Math.min(1,Math.max(.22,(light.night-.16)*1.4)));
  nodes.app.style.setProperty('--garden-star-gold',blend('#9e7937','#f9dfa2',light.night));
  return light.night>=.65;
}

export function mountGardenPreview(container,appearance,{history=[],courses=[],through='',visible,design=defaultGardenDesign,daylightSample=false}={}){
  const template=document.createElement('template');
  template.innerHTML=renderLandscape(design);
  const scene=template.content.firstElementChild;
  const art=gardenGrowthMarkup(history,{courses,through,visible,design});
  for(const [part,markup] of Object.entries(art))scene.querySelector(`#garden-growth-${part}`).innerHTML=markup;
  const lighting=daylightSample&&appearance.lighting!=='day'?'session':appearance.lighting;
  const progress=daylightSample ? .43 : sceneProgress(0,lighting,false,'still');
  paintLight(lightNodes(scene,container),progress,lighting,1600,900);
  applySceneryAppearance(container,appearance,gardenWeather(appearance,appearance.weatherSince));
  // Each preview carries its own paint servers and clip paths alongside the live landscape.
  const prefix=`garden-preview-${++previewId}-`;
  for(const node of scene.querySelectorAll('[id]'))node.id=prefix+node.id;
  for(const node of scene.querySelectorAll('[fill*="url(#"],[stroke*="url(#"],[clip-path],[filter],[mask]')){
    for(const attr of ['fill','stroke','clip-path','filter','mask']){
      const value=node.getAttribute(attr);
      if(value?.startsWith('url(#'))node.setAttribute(attr,`url(#${prefix}${value.slice(5)}`);
    }
  }
  container.replaceChildren(scene);
  return scene;
}
export function animateLandscape(_now,progress,reduced,lighting='session',motion='gentle'){
// Progress already comes from an end timestamp at animation-frame precision.
// Drawing it directly also makes resets and mode changes instant.
return paintDay(sceneProgress(progress,lighting,reduced,motion),lighting);
}

export function mountainRidges(scene){
  return [...scene.querySelectorAll('[data-garden-piece="mountains"] :is(path[fill="url(#far)"],path[fill="url(#middle)"],path[fill="url(#near)"])')];
}
export function mountainCovers(ridges,x,y){
  return ridges.some(ridge=>ridge.isPointInFill({x,y}));
}

export function createShootingStars(scene,random=Math.random){
  const artwork=scene.querySelector('#garden-meteor');
  const trail=scene.querySelector('.meteor-tail');
  let next=0,flight=null,visible=false;

  function clear(){
    next=0;flight=null;
    if(visible){artwork.setAttribute('opacity',0);visible=false;}
  }

  function launch(now,preview=false){
    const {width,height}=scene.getBoundingClientRect();
    const frame=scene.viewBox.baseVal;
    const zoom=Math.max(width/frame.width,height/frame.height);
    const w=width/zoom,h=height/zoom;
    const left=frame.x+(frame.width-w)/2,top=frame.y+(frame.height-h)/2;
    // Use the visible ridge art to find launch points, including when Studio changes the mountains.
    const ridges=mountainRidges(scene);
    const skylineAt=x=>{
      let sky=0,ground=540;
      for(let i=0;i<9;i++){
        const y=(sky+ground)/2;
        if(mountainCovers(ridges,x,y))ground=y;
        else sky=y;
      }
      return sky;
    };
    const lanes=[.19,.31,.43,.55,.67,.79].map(fraction=>{
      const x=left+w*(fraction+(random()-.5)*.08);
      return {x,sky:skylineAt(x)};
    });
    const open=lanes.filter(lane=>lane.sky>top+Math.min(140,h*.25));
    const {x,sky}=open.length?open[Math.floor(random()*open.length)]:lanes.reduce((best,lane)=>lane.sky>best.sky?lane:best);
    const y=Math.max(top+28,Math.min(top+h*(.06+random()*.13),sky-52));
    const destinations=[left+w*(.12+random()*.12),left+w*(.74+random()*.12)];
    const choices=destinations.filter(end=>Math.abs(end-x)>=Math.min(520,w*.38));
    const endX=choices.length?choices[Math.floor(random()*choices.length)]:
      destinations.reduce((farther,end)=>Math.abs(end-x)>Math.abs(farther-x)?end:farther);
    const dx=endX-x,dy=655-y;
    const duration=1750+random()*1050;
    trail.setAttribute('transform',`scale(${.6+random()*.8} ${.72+random()*.60})`);
    flight={start:now,x,y,dx,dy,duration,angle:Math.atan2(dy,dx)*180/Math.PI,preview};
    next=now+180000+random()*180000;
  }

  return {
    clear,
    preview(now){clear();launch(now+140,true);},
    frame(now,{allowed,dark}){
      if(!allowed||(!dark&&!flight?.preview)){clear();return;}
      if(!next)next=now+45000+random()*45000;
      if(!flight&&now>=next)launch(now);
      if(!flight)return;
      const elapsed=(now-flight.start)/flight.duration;
      if(elapsed<0)return;
      if(elapsed>=1){
        artwork.setAttribute('opacity',0);visible=false;flight=null;
        return;
      }
      const {x,y,dx,dy,angle}=flight;
      artwork.setAttribute('transform',`translate(${x+dx*elapsed} ${y+dy*elapsed}) rotate(${angle})`);
      artwork.setAttribute('opacity',Math.min(1,elapsed/.08));
      visible=true;
    }
  };
}
