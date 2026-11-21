import {defaultPavilionPosition} from './garden-layout.js';

const roof='var(--pavilion-roof,#456b62)';
const beams='#415f57';
const windows='#758b79';
const eave=(width,y,rise,fill=roof)=>`<path d="M-${width} ${y}Q-${Math.round(width*.5)} ${y-2} 0 ${y-rise}
  Q${Math.round(width*.5)} ${y-2} ${width} ${y}Q0 ${y+8} -${width} ${y}Z" fill="${fill}"/>
  <path d="M-${width} ${y}Q0 ${y+5} ${width} ${y}" fill="none" stroke="#c6c39e" stroke-opacity=".55"/>`;
const panes=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".6" fill="${fill}"/>
  <path d="M${x+w/2} ${y}v${h}M${x} ${y+h/2}h${w}" stroke="#644f49" opacity=".56" stroke-width=".8"/>`;

const buildings={
  pagoda:{
    span:28,lantern:[22,-24],panes:[[-11,-27,9,18],[4,-27,9,18]],
    art:`<path d="M-15-34h31V0h-31Z" fill="#c7c3a0"/>
      <path d="M-14-34V0m29-34V0M1-34V0" stroke="${beams}" stroke-width="2.8"/>
      ${eave(31,-35,20)}<path d="M0-55v-6" stroke="#779083" stroke-width="1.6"/>`
  },
  tiered:{
    span:35,lantern:[29,-29],panes:[[-16,-32,11,19],[5,-32,11,19],[-9,-56,18,10],[-5,-76,10,8]],
    art:`<path d="M-22-39h44V0h-44Zm7-24h30v24h-30Zm6-20H9v20H-9Z" fill="#d2c7a3"/>
      <path d="M-20-42V0M20-42V0M0-38V0m-14-64v23m28-23v23M-8-84v20m16-20v20" stroke="#785c50" stroke-width="2.7"/>
      ${eave(36,-40,15)}${eave(28,-64,16)}${eave(20,-84,17)}
      <path d="M0-101v-8m-3 4h6" stroke="#b4966c" stroke-width="1.5"/>`
  },
  tea:{
    span:39,lantern:[24,-19],panes:[],
    art:`<path d="M-29 0v-33m17 33v-33M14 0v-33M29 0v-33" stroke="${beams}" stroke-width="3.7"/>
      <path d="M-40-29Q-32-36-21-45H21Q31-37 42-30Q0-24-40-29Z" fill="${roof}"/>
      <path d="M-38-29q35 5 79 0M-14-12h25m-23 1v8m21-8v8" fill="none" stroke="#baa780" stroke-width="2"/>`
  },
  gate:{
    span:32,lantern:[28,-11],panes:[],
    art:`<path d="M-29 0v-23a29 29 0 0 1 58 0V0H17v-22a17 17 0 0 0-34 0V0Z" fill="#bcc4a9" stroke="#708775" stroke-width="2"/>
      <path d="M-32-29Q-19-52 0-54Q19-52 32-29" fill="none" stroke="${roof}" stroke-width="4"/>
      <path d="M-27-10h10m35 0h10" stroke="#dfd7b5"/>`
  },
  vermilion:{
    span:39,lantern:[30,-27],panes:[[-22,-28,14,17],[8,-28,14,17]],
    art:`<path d="M-28-39h56V0h-56Z" fill="#cfab87"/><path d="M-29-39V0m19-36V0m20-36V0m19-39V0M-30-7h60" stroke="#97594d" stroke-width="3.2"/>
      ${eave(41,-38,24,'#78574f')}<path d="M-19-48q19 4 38 0M0-64v-5" fill="none" stroke="#bc9870" stroke-width="1.4"/>`
  },
  water:{
    span:47,lantern:[39,-22],panes:[[-12,-24,10,14],[3,-24,10,14]],
    art:`<path d="M-43-1v-30m14 30v-30m59 30v-30m13 30v-30" stroke="#536b68" stroke-width="3.3"/>
      <path d="M-19-30h38V0h-38Z" fill="#b4b9a0"/>
      <path d="M-51 0h102M-43-12h24m38 0h24" stroke="#736f58" stroke-width="2.4"/>
      ${eave(49,-34,17,'#557e7d')}<path d="M-21-47Q0-53 21-47" stroke="#b6c5af" fill="none" stroke-width="1.2"/>`
  },
  shrine:{
    span:26,lantern:[19,-24],panes:[[-7,-29,14,19]],
    art:`<path d="M-19-34H19V0h-38Z" fill="#ad8c75"/>
      <path d="M-19-31V0m38-31V0m-6-28v25m-26 0v-25" stroke="#81554d" stroke-width="3.3"/>
      <path d="M-18 0h36l5 4h-46Z" fill="#776c5e"/>
      ${eave(29,-34,15,'#6b575b')}${eave(18,-52,9,'#8b6659')}
      <path d="M0-61v-5m-2 2h4" stroke="#c0a878" stroke-width="1.3"/>`
  },
  bell:{
    span:28,lantern:[22,-13],panes:[],
    art:`<path d="M-28 0v-24h7v24m42 0v-24h7v24" fill="#869493"/>
      <path d="M-4-23v5q-5 2-5 10l-2 3h22L9-8q0-8-5-10v-5Z" fill="#a58a63" stroke="#746f55"/>
      <path d="M-24-17h-5m24 14h10m21-13h-4" stroke="#c3c4aa"/>
      ${eave(30,-24,14,'#596f70')}<path d="M-21-25Q0-24 21-25" stroke="#a7a390" fill="none"/>`
  }
};

const lanternBodies={
  classic:'<ellipse rx="3" ry="4"/>',
  silk:'<ellipse rx="5.2" ry="4.7"/><path d="M0-4q-4 4 0 8m0-8q4 4 0 8" fill="none" stroke="#9a5b47" stroke-width=".65"/>',
  hex:'<path d="M-5-3 0-5 5-3 5 3 0 5-5 3Z"/><path d="M0-5V5" stroke="#8f684e" stroke-width=".8"/>',
  glass:'<path d="M-3-6h6l2 4-1 6-4 2-4-2-1-6Z"/><path d="M-2-5l-1 3 1 4m4-7 1 3-1 4" fill="none" stroke="#c7dbbf" stroke-width=".65"/>',
  tassel:'<path d="M-4-5h8Q8 0 4 5h-8Q-8 0-4-5Z"/><path d="M0 4v6m-2-3h4l1 4h-6Z" stroke="#95664d" stroke-width=".75"/><path d="M-2-4q-3 4 0 8m4-8q3 4 0 8" fill="none" stroke="#e7ad7e" stroke-width=".65"/>',
  paper:'<rect x="-3.3" y="-5" width="6.6" height="10" rx="1.3"/><path d="M-3-2h6m-6 4h6" stroke="#9f795f" opacity=".7" stroke-width=".6"/>'
};
export function gardenLantern(style,x,y,{lit=false,hanging=true,scale=1}={}){
  if(style==='none')return '';
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    ${lit?'<circle r="18" fill="url(#lamp-halo)"/>':hanging?'<path d="M0-5v-7" stroke="#705e50" stroke-width="1"/>':''}
    <g fill="${lit?'#ffd59a':style==='glass'?'#769f90':style==='paper'?'#cda779':'#b87254'}" stroke="#82644f" stroke-width=".65">${lanternBodies[style]}</g>
    <path d="M-2-5h4m-4 10h4m-2 0v2" stroke="#7e6650" stroke-width=".7" stroke-linecap="round"/>
  </g>`;
}

// Outline samples follow the SVG banks. Test the edges of the footprint so it can sit on rock at a shoreline.
const farBank=[[1038,622],[1080,613],[1140,596],[1200,580],[1300,568],[1400,561],[1490,553],[1600,580],
  [1600,644],[1490,620],[1430,616],[1370,613],[1300,618],[1235,626],[1180,633],[1120,635],[1067,631]];
const banks={
  classic:[
    [[0,630],[63,655],[116,713],[175,733],[228,750],[248,765],[177,784],[142,815],[210,900],[0,900]],
    [[1600,745],[1515,764],[1478,782],[1435,802],[1370,814],[1310,832],[1304,841],[1390,846],[1448,872],[1472,900],[1600,900]]
  ],
  inlet:[
    [[0,631],[61,660],[110,706],[146,734],[244,746],[282,774],[230,803],[186,830],[236,900],[0,900]],
    [[1600,721],[1510,758],[1463,807],[1395,824],[1360,833],[1352,849],[1394,863],[1444,883],[1468,900],[1600,900]]
  ],
  slate:[
    [[0,661],[65,665],[113,701],[170,705],[222,744],[258,765],[219,783],[175,784],[158,813],[229,900],[0,900]],
    [[1600,746],[1530,750],[1482,778],[1435,782],[1396,806],[1330,812],[1309,834],[1346,850],[1422,850],[1488,900],[1600,900]]
  ],
  shallows:[
    [[0,658],[92,698],[153,741],[216,753],[251,771],[225,792],[169,794],[142,820],[211,900],[0,900]],
    [[1600,761],[1530,786],[1471,815],[1424,827],[1369,827],[1338,847],[1389,866],[1442,880],[1469,900],[1600,900]]
  ],
  meadow:[
    [[0,652],[64,682],[126,732],[176,758],[251,769],[282,786],[258,804],[237,828],[295,900],[0,900]],
    [[1600,759],[1534,783],[1480,812],[1410,825],[1343,837],[1313,845],[1308,869],[1394,900],[1600,900]]
  ]
};
function inside(x,y,polygon){
  let land=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [x1,y1]=polygon[i],[x2,y2]=polygon[j];
    if((y1>y)!==(y2>y)&&x<(x2-x1)*(y-y1)/(y2-y1)+x1)land=!land;
  }
  return land;
}
const pavilionScale=y=>Math.min(1.45,1+(y-defaultPavilionPosition.y)/490);
export function pavilionTransform({x,y},size=100){
  return `translate(${x} ${y}) scale(${pavilionScale(y)*size/100})`;
}
export function pavilionFoundation(design){
  if(design.foundation!=='auto')return design.foundation;
  if(!design.pavilionPosition&&(!design.pavilionSize||design.pavilionSize===100))return 'land';
  const {x,y}=design.pavilionPosition||defaultPavilionPosition;
  const span=buildings[design.pavilion].span*.72*pavilionScale(y)*(design.pavilionSize??100)/100;
  const land=[farBank,...banks[design.shoreline]];
  return [x-span,x,x+span].every(px=>land.some(polygon=>inside(px,y,polygon)))?'land':'stone';
}

export function foundationArt(kind,span=35){
  if(kind==='terrace')return `<g transform="scale(${span/35} 1)">
    <ellipse cy="15" rx="57" ry="6" fill="#355c60" opacity=".2"/>
    <path d="M-52 14-39 2h78l13 12Z" fill="#768980"/>
    <path d="M-45 9-36 0h72l9 9Z" fill="#a3ad99"/>
    <path d="M-40 5-33-1h66l7 6Z" fill="#c0bda1"/>
    <path d="M-45 9h90m-97 5h104M-19 11v3m37-3v3" fill="none" stroke="#657a73" stroke-width="1.1"/>
  </g>`;
  if(kind==='stone')return `<g transform="scale(${span/31} 1)">
    <ellipse cy="12" rx="49" ry="6" fill="#335c65" opacity=".24"/>
    <path d="M-46 9-35 1-26-2 23-3 42 2 49 9 27 15-15 15Z" fill="#677f80"/>
    <path d="M-46 9-26-2 23-3 42 2 20 7-17 8Z" fill="#a2ae9f"/>
    <path class="season-layer winter-scene" d="M-37 5-26-2 23-3 37 1 18 4-17 5Z" fill="#e1ece9" opacity=".82"/>
    <path d="M-30 8-19 12m47-5-8 4M-55 14h22m48 4h30m-79 3h44" fill="none" stroke="#d4d9c3" opacity=".54" stroke-linecap="round"/>
  </g>`;
  if(kind==='timber')return `<path d="M-${span} 2v12m${span*2} -12v12" stroke="#5e6960" stroke-width="3.1"/>
    <path d="M-${span+5} 0H${span+5}l5 5h-${(span+10)*2}Z" fill="#a78c6d"/>
    <path d="M-${span+7} 5H${span+7}" stroke="#665e4f" stroke-width="2"/>`;
  return `<path d="M-${span} 0H${span}l5 4h-${(span+5)*2}Z" fill="#8ea08b"/>`;
}

export function placedPavilion(style,design,lights=false){
  const point=design.pavilionPosition||defaultPavilionPosition;
  const transform=pavilionTransform(point,design.pavilionSize);
  const building=buildings[style],base=pavilionFoundation(design);
  const [lx,ly]=building.lantern;
  if(lights){
    const panesGlow=building.panes.length?`<ellipse cy="-19" rx="39" ry="30" fill="url(#lamp-halo)" opacity=".68"/>
      ${building.panes.map(pane=>panes(...pane,'#f7c68b')).join('')}`:'';
    const reflection=base==='land'&&design.pavilionPosition?'':
      '<path d="M-15 24h29m-23 4h16m-28 5H3" stroke="#f7c58c" stroke-linecap="round" opacity=".37"/>';
    return `<g transform="${transform}">${panesGlow}${gardenLantern(design.lantern,lx,ly,{lit:true})}
      ${panesGlow||design.lantern!=='none'?reflection:''}</g>`;
  }
  return `<g transform="${transform}" data-foundation="${base}">
    ${foundationArt(base,building.span)}${building.art}${building.panes.map(pane=>panes(...pane,windows)).join('')}
    ${gardenLantern(design.lantern,lx,ly)}</g>`;
}

const boats={
  sail:{art:`<path d="M8-5v-49M-18-4v-27" stroke="#61736a" stroke-width="1.6"/>
    <path d="M6-51Q-6-33-33-10Q-12-17 6-13Z" fill="#e5d8ad"/>
    <path d="M9-48q20 15 29 34L9-11Z" fill="#c5c7a5"/>
    <path d="M-27-15q17-7 33-5m3-2q9 1 23 5m-48 6v-12" fill="none" stroke="#ad9f7d" opacity=".78"/>`,lamp:[24,-9]},
  festival:{art:`<path d="M-32-4v-25m61 25v-25" stroke="#6e6a55" stroke-width="1.8"/>
    <path d="M-36-26Q-12-32 0-33 13-32 33-27L26-23Q0-27-29-22Z" fill="#8c5a51"/>
    <path d="M-21-24v7m15-10v7m14-7v7m12-5v7" stroke="#c6a77a" stroke-width="1"/>
    <path d="M-28-10h56" stroke="#b99168" stroke-width="2.4"/>`,lamp:[-21,-15],extraLamps:[[-6,-17],[8,-17],[20,-15]]},
  junk:{art:`<path d="M-10-3v-43m29 39v-29" stroke="#545f51" stroke-width="1.8"/>
    <path d="M-12-45Q-29-47-38-34L-13-4Q-8-23-12-45ZM17-36q-18 0-23 11L17-9Q21-22 17-36Z" fill="#bc8163"/>
    <path d="M-33-29q14-9 21-9m-15 16 15-8m-9 15 10-5M-2-23l19-6m-11 10 12-4" fill="none" stroke="#e2b692" opacity=".75"/>`,lamp:[24,-10]},
  sampan:{art:`<path d="M-31-4v-14q12-24 36-11L18-4Z" fill="#657a69"/>
    <path d="M-28-14q12-21 34-11l6 8q-21-11-40 3Z" fill="#abaa8b"/>
    <path d="M-24-13q10-6 20-4L2-4h-26Z" fill="#45635c"/>
    <path d="M-21-22q15-6 27-3m-34 12q12-7 34-6" stroke="#dfd3aa" fill="none" opacity=".65"/>`,lamp:[2,-9]},
  skiff:{art:`<path d="M-34-4Q-19-11-7-5l10 5m3-3q15-6 29-4" fill="#9f8a62"/>
    <path d="M-9-7Q-8-22 4-19l7 12m-9-9 10 3 17-9" fill="#668377" stroke="#5c796a" stroke-width="2" stroke-linecap="round"/>
    <path d="M-9-20 0-26l11 5q-7 4-20 1Z" fill="#b4a278"/>
    <path d="M-12 3 30-26l3 2-42 31-5 1Z" fill="#ac9a77"/>`,lamp:[-28,-9]},
  lotus:{art:`<path d="M-31-2q25-9 58-2" fill="none" stroke="#8fa185" stroke-width="3"/>
    <path d="M0-5q-20-1-25-18 13 1 20 10Q-9-25 0-36 9-26 6-13q8-9 20-10Q22-8 0-5Z" fill="#c78991"/>
    <path d="M0-6q-12-4-15-15 11 4 15 12 6-8 15-12Q12-9 0-6Z" fill="#e9a8a5"/>
    <path d="M-5-9q1-6 5-9 4 3 5 9Z" fill="#eac499"/>`,lamp:[0,-11]}
};
export function styledBoat(style,lights=false){
  const boat=boats[style];
  if(!boat)return '';
  const lamps=[boat.lamp,...(boat.extraLamps||[])];
  if(lights)return `<g class="boat-bob">${lamps.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="14" fill="url(#lamp-halo)"/>
    <circle cx="${x}" cy="${y}" r="2.4" fill="#ffdbab"/>`).join('')}</g>`;
  return `<ellipse cy="11" rx="48" ry="4" fill="#365e61" opacity=".22"/>
    <path class="boat-wake" d="M-69 12q14 1 24 0m86 4 18-1m-92 7 46-1" fill="none" stroke="#d9e6d7" stroke-width="1.15" opacity=".64"/>
    <g class="boat-bob">${boat.art}
      <path d="M-49-8Q-12 2 47-8 44 0 33 7 2 14-33 7Z" fill="#345b5b"/>
      <path d="M-45-7Q-1 3 44-7M-32 5Q0 12 31 5" fill="none" stroke="#b9ac88" opacity=".81"/>
      ${lamps.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.5" fill="#b98660"/>`).join('')}
    </g>`;
}
