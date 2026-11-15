import {ridge} from './daylight.js';
import {snowbank} from './seasonal-scenery.js';
const pavilionOrigin='1096 615';
const middleRidge=ridge([[0,399],[63,358],[123,291],[163,280],[214,326],[278,395],[360,445],[458,458],[557,504],[712,524],[851,501],[966,475],[1040,438],[1105,384],[1155,318],[1195,308],[1249,351],[1309,401],[1394,424],[1509,457],[1600,436]]);
const classicMountains=`<path fill="url(#far)" d="${ridge([[0,419],[105,370],[197,405],[291,335],[371,365],[439,414],[531,423],[620,464],[745,460],[822,474],[958,426],[1037,423],[1126,363],[1209,391],[1313,322],[1397,353],[1496,411],[1600,388]])}"/>
<path fill="url(#middle)" d="${middleRidge}"/>
<path fill="url(#slope-wash)" d="M164 284C190 293 198 324 220 346C261 394 295 428 363 450C281 443 224 412 204 381C180 347 180 308 164 284ZM1194 311C1229 319 1240 348 1262 372C1299 412 1339 425 1405 435C1331 442 1277 426 1244 392C1218 363 1219 328 1194 311Z"/>
<path class="season-layer winter-scene" fill="#e4edef" opacity=".88" clip-path="url(#mountain-snow-cut)" d="${middleRidge}"/>
<path class="valley-fog" fill="url(#mist)" d="M0 405h1600v170H0z"/>
<path fill="url(#near)" d="${ridge([[0,437],[65,417],[122,366],[153,351],[201,383],[259,453],[332,494],[428,518],[555,528],[698,550],[839,551],[955,534],[1065,510],[1163,491],[1245,453],[1308,415],[1345,417],[1401,451],[1488,473],[1600,491]])}"/>
<path fill="url(#slope-wash)" d="M155 354C188 367 198 397 223 429C248 461 286 486 342 503C285 504 232 481 205 449C180 420 185 381 155 354ZM1343 421C1379 431 1400 460 1457 476C1486 485 1534 485 1578 498C1495 504 1442 494 1406 476C1370 457 1374 439 1343 421Z"/>`;
const pagoda=`  <g transform="translate(${pavilionOrigin})">
    <path d="M-21 0h48l8 4h-62Z" fill="#758f77"/>
    <path d="M-14-35h30V0h-30Z" fill="#c7c3a0"/>
    <path d="M-11-26h9v17h-9zm14 0h9v17H3z" fill="#728478"/>
    <path d="M-13-33V0m27-33V0M1-33V0" stroke="#566d5b" stroke-width="2.5"/>
    <path d="M-28-35q19-5 29-19 10 14 29 19-29 7-58 0Z" fill="var(--pavilion-roof,#456b62)"/>
    <path d="M-27-35q29 4 57 0m-29-19v-5M22-34v8" fill="none" stroke="#6a8675"/>
    <ellipse cx="22" cy="-23" rx="3" ry="4" fill="#ae7359"/>
  </g>`;
const pagodaLights=`    <g transform="translate(${pavilionOrigin})">
      <ellipse cy="-17" rx="37" ry="28" fill="url(#lamp-halo)" opacity=".8"/>
      <path d="M-11-26h9v17h-9zm14 0h9v17H3z" fill="#f9c583"/>
      <path d="M-11-20h9m5 0h9" stroke="#a67150" stroke-width=".85"/>
      <circle cx="22" cy="-23" r="16" fill="url(#lamp-halo)"/>
      <ellipse cx="22" cy="-23" rx="2.8" ry="3.7" fill="#ffd39a"/>
      <path d="M-10 26h24m-17 5h16m-20 6H3" stroke="#f7c58c" stroke-linecap="round" opacity=".34"/>
    </g>`;
const reedWest=`<path d="M0 630C39 639 61 654 88 686C115 719 138 727 176 733C202 737 223 747 241 756C252 762 244 768 227 771C203 775 176 782 159 794C137 808 141 824 158 842L210 900H0Z" fill="url(#shore)"/>
<path d="M0 663C52 678 71 705 95 739C112 766 139 778 166 788C178 793 174 800 160 804C125 812 101 823 98 837C94 851 118 876 149 900H0Z" fill="url(#bank)"/>
<path d="M115 724C139 737 165 739 189 745C213 750 233 757 239 762M237 776C205 780 175 788 156 805" fill="none" stroke="#b6c6a8" stroke-width="1.8" stroke-linecap="round" opacity=".65"/>`;
const reedEast=`<path d="M1600 745C1546 750 1512 760 1478 782C1439 808 1408 809 1368 815C1336 820 1307 830 1303 837C1299 844 1320 845 1345 844C1391 843 1425 852 1448 872C1459 882 1466 892 1472 900H1600Z" fill="url(#shore)"/>
<path d="M1600 799C1541 791 1510 808 1480 826C1457 840 1449 862 1436 878L1417 900H1600Z" fill="url(#bank)"/>
<path d="M1314 850C1350 846 1382 851 1408 858M1452 803C1472 796 1488 786 1506 778" fill="none" stroke="#c3d0b2" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>`;

const profiles={
  rounded:[
    [[0,401],[230,349],[420,382],[610,351],[815,420],[1060,334],[1240,365],[1430,339],[1600,395]],
    [[0,450],[230,374],[465,450],[690,406],[931,459],[1200,388],[1440,408],[1600,454]],
    [[0,484],[160,453],[380,478],[655,520],[860,517],[1030,463],[1240,481],[1450,452],[1600,491]]
  ],
  highlands:[
    [[0,369],[160,316],[335,355],[520,298],[730,395],[905,343],[1120,278],[1290,339],[1440,303],[1600,358]],
    [[0,436],[150,355],[310,406],[501,366],[740,455],[909,375],[1080,426],[1270,364],[1437,427],[1600,395]],
    [[0,472],[205,431],[425,496],[610,471],[820,524],[1050,480],[1200,498],[1410,450],[1600,478]]
  ]
};
function mountains(style){
  if(style==='classic')return classicMountains;
  return profiles[style].map((points,index)=>{
    const fill=['far','middle','near'][index],slope=ridge(points);
    const snow=points.map(([x,y])=>[x,y+26]);
    return `<path d="${slope}" fill="url(#${fill})"/>${index===1?`<path class="season-layer winter-scene" d="${ridge(points)+' '+ridge(snow)}" fill="#e4edef" fill-rule="evenodd" opacity=".7"/>`:''}`;
  }).join('');
}
const inletWest=`<path d="M0 631Q77 650 110 706Q128 735 244 746C304 756 277 797 230 803Q167 817 189 850L236 900H0Z" fill="url(#shore)"/>
  <path d="M0 680Q91 708 139 753Q187 779 230 768Q196 799 138 810Q113 831 170 900H0Z" fill="url(#bank)"/>
  <path d="M111 727q55 45 117 30M230 789q-63 16-85 38" fill="none" stroke="#cbd0ad" stroke-width="2" opacity=".66"/>`;
const inletEast=`<path d="M1600 721Q1503 755 1463 807Q1403 817 1360 833Q1327 855 1394 863Q1461 874 1468 900H1600Z" fill="url(#shore)"/>
  <path d="M1600 784Q1527 812 1465 844Q1442 867 1515 900H1600Z" fill="url(#bank)"/>
  <path d="M1382 841q41-1 65-12m19-4 76-29" stroke="#cbd0ad" stroke-width="2" fill="none" opacity=".69"/>`;
const meadowWest=`<path d="M0 652Q66 680 126 732Q166 756 251 769Q306 779 258 804Q223 822 250 851L295 900H0Z" fill="url(#shore)"/>
  <path d="M0 725Q70 739 127 781Q179 807 220 805Q173 845 244 900H0Z" fill="url(#bank)"/>
  <path d="M112 759q62 8 115 40m-68-29 75 16" fill="none" stroke="#c4d2a4" opacity=".57"/>`;
const meadowEast=`<path d="M1600 759Q1544 778 1480 812Q1410 825 1343 837Q1286 844 1308 869Q1334 888 1394 900H1600Z" fill="url(#shore)"/>
  <path d="M1600 823Q1547 842 1496 865Q1468 881 1484 900H1600Z" fill="url(#bank)"/>
  <path d="M1364 857q71-7 124-30" fill="none" stroke="#c4d2a4" opacity=".57"/>`;
const shelter=`<g transform="translate(${pavilionOrigin})">
  <path d="M-37 0h77l8 4h-92Z" fill="#7c9380"/>
  <path d="M-28-4v-28m17 28v-28M14-4v-28m17 28v-28" stroke="#455d4c" stroke-width="3.5"/>
  <path d="M-40-29Q-32-37-22-43H23Q32-35 42-31Q0-24-40-29Z" fill="var(--pavilion-roof,#456b62)" stroke="#526e62"/>
  <path d="M-14-12h25v4h-25zm3 4v4m20-4v4" fill="#ac9775" stroke="#796a57" stroke-width="1"/>
  <ellipse cx="22" cy="-22" rx="3.2" ry="4.5" fill="#b9765b"/>
</g>`;
const gate=`<g transform="translate(${pavilionOrigin})">
  <path d="M-33 2h66l4 3h-74Z" fill="#7a9584"/>
  <path d="M-29 0v-23a29 29 0 0 1 58 0V0H17v-22a17 17 0 0 0-34 0V0Z" fill="#bcc4a9" stroke="#708775" stroke-width="2"/>
  <path d="M-32-29Q-19-52 0-54Q19-52 32-29" fill="none" stroke="var(--pavilion-roof,#456b62)" stroke-width="4"/>
  <path d="M-27-10h10m35 0h10" stroke="#d2d2b4"/>
</g>`;
const shelterLights=`<g transform="translate(${pavilionOrigin})">
  <ellipse cx="22" cy="-22" rx="25" ry="19" fill="url(#lamp-halo)"/><ellipse cx="22" cy="-22" rx="3" ry="4" fill="#ffcc85"/>
</g>`;
const pathPoints=[[1049,630],[1061,627],[1075,624],[1087,622],[1100,624],[1113,625],[1127,624],[1142,621],[1155,617],[1171,613],[1185,610],[1198,606]];
function shorePath(style){
  if(style==='none')return '';
  const stones=pathPoints.map(([x,y],index)=>`<ellipse cx="${x}" cy="${y}" rx="${index%2?5:6}" ry="1.9" fill="#c9c6a7" stroke="#697f71" stroke-width=".7"/>`).join('');
  if(style==='stones')return stones;
  return stones+[2,5,8,11].map(i=>{
    const [x,y]=pathPoints[i];
    return `<g transform="translate(${x} ${y-2})"><ellipse cy="-4" rx="10" ry="8" fill="url(#lamp-halo)"/><path d="M-3 0v-7h6v7Z" fill="#d9a96e" stroke="#7c705b" stroke-width=".9"/><path d="M-4-7H4L0-10Z" fill="#536d60"/></g>`;
  }).join('');
}

const bankSnow={
  inlet:{
    left:'M0 631Q77 650 110 706Q128 735 244 746Q281 754 287 770Q255 761 218 757Q116 746 92 717Q56 680 0 650Z',
    right:'M1600 721Q1503 755 1463 807Q1403 817 1360 833Q1352 842 1364 848Q1410 834 1476 822Q1542 772 1600 742Z'
  },
  meadow:{
    left:'M0 652Q66 680 126 732Q166 756 251 769Q279 774 278 784Q225 775 189 767Q112 754 97 723Q42 679 0 669Z',
    right:'M1600 759Q1544 778 1480 812Q1410 825 1343 837Q1324 840 1314 850Q1401 841 1485 822Q1551 790 1600 776Z'
  }
};
function shoreBank(name,side,options){
  const snow=name==='classic'?snowbank(side):`<path class="season-layer winter-scene" d="${bankSnow[name][side]}" fill="#e2edf0" opacity=".82"/>`;
  return options[name]+snow;
}
export const gardenPieces={
  mountains:{option:'mountains',render:mountains},
  westBank:{option:'shoreline',render:name=>shoreBank(name,'left',{classic:reedWest,inlet:inletWest,meadow:meadowWest})},
  eastBank:{option:'shoreline',render:name=>shoreBank(name,'right',{classic:reedEast,inlet:inletEast,meadow:meadowEast})},
  pavilion:{option:'pavilion',render:name=>({pagoda,tea:shelter,gate})[name]},
  pavilionLights:{option:'pavilion',render:name=>({pagoda:pagodaLights,tea:shelterLights,gate:''})[name]},
  path:{option:'path',render:shorePath}
};
