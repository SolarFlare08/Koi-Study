export {blossomMarkup} from './landscape.js';
import {daylight,blend,ridge,sunPosition} from './daylight.js';
import {sceneProgress} from './garden-appearance.js';
import {alternateBoats,alternateBoatLights,mountainSnowCut,seasonalTree,shoreDetails,snowbank,weatherMarkup} from './seasonal-scenery.js';
export const objects=[['pagoda','Timer settings'],['tasks','Add tasks'],['music','Your Spotify'],['notes','Distraction notes'],['progress','Today’s progress'],['appearance','Appearance']].map(([id,hint])=>({id,hint,label:hint,className:'',art:''}));
const pavilionOrigin='1096 615';
const boatOrigin='783 751';
const middleRidge=ridge([[0,399],[63,358],[123,291],[163,280],[214,326],[278,395],[360,445],[458,458],[557,504],[712,524],[851,501],[966,475],[1040,438],[1105,384],[1155,318],[1195,308],[1249,351],[1309,401],[1394,424],[1509,457],[1600,436]]);
function pine(x,y,scale=1){
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M-9 1C1-28 1-55-4-82C-8-109 4-133 10-166L15-180C18-149 9-129 7-107C3-83 11-56 9-29Q8-13 14 1Z" fill="#315858"/>
    <path d="M3-53Q-7-76-42-90M2-87Q18-110 54-120M8-121Q-1-142-22-149" stroke="#315858" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M-51-146C-35-151-36-160-20-162C-7-176 11-187 24-173Q31-169 32-160C46-159 49-152 61-147Q55-140 36-140Q15-143 3-138Q-25-134-51-146Z" fill="var(--pine-mid,#456e65)"/>
    <path d="M-16-113Q-7-126 8-126C20-130 20-138 33-136Q47-144 59-133Q71-134 82-124Q70-116 58-116Q45-109 26-112Q5-108-16-113Z" fill="var(--pine-light,#527b6e)"/>
    <path d="M-74-88Q-69-96-56-97C-48-110-31-113-19-104Q-6-104 2-96Q15-95 20-86Q8-78-13-80Q-34-74-54-81Z" fill="var(--pine-dark,#3d665f)"/>
    <path d="M-29-61Q-23-73-9-72Q4-82 18-74Q35-76 48-64Q33-56 19-59Q0-53-29-61Z" fill="var(--pine-mid,#456e65)"/>
    <path d="M-37-151Q-23-159-16-160Q5-180 18-174M20-125Q32-137 44-134M-57-96Q-43-107-31-106" fill="none" stroke="#83a391" stroke-width="3" stroke-linecap="round" opacity=".44"/>
  </g>`;
}
function shoreTree(x,y,scale){
  return `<g class="season-layer summer-scene">${pine(x,y,scale)}</g>${seasonalTree(x,y,scale)}`;
}
function rock(x,y,scale,flip=1){
  return `<g transform="translate(${x} ${y}) scale(${scale*flip} ${scale})">
    <ellipse cy="2" rx="43" ry="5" fill="#294f52" opacity=".26"/>
    <path d="M-43-2C-39-10-32-13-25-20Q-17-32-1-30C9-30 15-23 23-22Q35-20 43-5C43-1 29 2 10 2Q-18 3-43-2Z" fill="url(#rock-face)"/>
    <path d="M-38-5C-25-15-22-27-5-28C6-29 12-24 19-22C5-23-3-17-10-13C-19-8-29-8-38-5Z" fill="#bdc5ad" opacity=".64"/>
    <path d="M-15 0Q-6-8 8-12T29-17Q37-13 43-5C40 0 14 3-15 0Z" fill="#466a65" opacity=".66"/>
    <path d="M-29-12Q-21-14-16-20M4-5q10-3 19-4" stroke="#d4d5be" stroke-linecap="round" fill="none" opacity=".4"/>
  </g>`;
}
export function renderLandscape(){return `<svg class="world" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="air" x2="0" y2="1"><stop id="zenith" stop-color="#c8d9d7"/><stop id="sky-middle" offset=".67" stop-color="#eee4d4"/><stop id="horizon" offset="1" stop-color="#f5d9ba"/></linearGradient>
<linearGradient id="season-sky" x2="0" y2="1"><stop stop-color="var(--season-sky,#dce9e8)" stop-opacity="0"/><stop offset="1" stop-color="var(--season-sky,#dce9e8)" stop-opacity="var(--season-sky-strength,0)"/></linearGradient>
<linearGradient id="far" x2="0" y2="1"><stop stop-color="var(--far-ridge,#a6bdb9)"/><stop offset="1" stop-color="var(--far-base,#d6dcd0)"/></linearGradient>
<linearGradient id="middle" x2=".36" y2="1"><stop stop-color="var(--ridge-middle,#719893)"/><stop offset="1" stop-color="var(--ridge-mist,#b7c9b9)"/></linearGradient>
<linearGradient id="near" x2=".42" y2="1"><stop stop-color="var(--ridge-near,#487775)"/><stop offset="1" stop-color="var(--ridge-base,#8bb0a2)"/></linearGradient>
<linearGradient id="cloud-light" x2="0" y2="1"><stop stop-color="#fff3db" stop-opacity=".63"/><stop offset="1" stop-color="#f4eddf" stop-opacity=".1"/></linearGradient>
<linearGradient id="slope-wash" x2=".22" y2="1"><stop stop-color="#2c595c" stop-opacity=".32"/><stop offset="1" stop-color="#2c595c" stop-opacity="0"/></linearGradient>
<linearGradient id="water" x2="0" y2="1"><stop stop-color="var(--water-horizon,#ced7c6)"/><stop offset=".35" stop-color="var(--water-middle,#adc9bc)"/><stop offset="1" stop-color="var(--water-near,#6d9c98)"/></linearGradient>
<linearGradient id="mist" x2="0" y2="1"><stop stop-color="#f6eddc" stop-opacity="0"/><stop offset=".5" stop-color="#f6eddc" stop-opacity=".8"/><stop offset="1" stop-color="#f6eddc" stop-opacity="0"/></linearGradient>
<linearGradient id="ice-mist" x2="0" y2="1"><stop stop-color="#e4f2f5" stop-opacity="0"/><stop offset=".55" stop-color="#dcebf0" stop-opacity=".76"/><stop offset="1" stop-color="#dcebf0" stop-opacity="0"/></linearGradient>
<linearGradient id="heat-haze" x2="0" y2="1"><stop stop-color="#f9da91" stop-opacity="0"/><stop offset=".62" stop-color="#ffdfa6" stop-opacity=".63"/><stop offset="1" stop-color="#ffdfa6" stop-opacity="0"/></linearGradient>
<linearGradient id="reflection" x2="0" y2="1"><stop stop-color="#fce4bb" stop-opacity=".7"/><stop offset="1" stop-color="#fce4bb" stop-opacity="0"/></linearGradient>
<radialGradient id="halo"><stop stop-color="#ffe9bd" stop-opacity=".65"/><stop offset="1" stop-color="#ffe9bd" stop-opacity="0"/></radialGradient>
<radialGradient id="lamp-halo"><stop stop-color="#ffbe75" stop-opacity=".52"/><stop offset=".36" stop-color="#e6a66d" stop-opacity=".24"/><stop offset="1" stop-color="#e6a66d" stop-opacity="0"/></radialGradient>
<radialGradient id="moon-halo"><stop stop-color="#e5effd" stop-opacity=".22"/><stop offset="1" stop-color="#bbd8fc" stop-opacity="0"/></radialGradient>
<linearGradient id="bank" x2=".4" y2="1"><stop stop-color="var(--bank-upper,#547d6b)"/><stop offset="1" stop-color="var(--bank-lower,#294f4d)"/></linearGradient>
<linearGradient id="shore" x2="0" y2="1"><stop stop-color="var(--shore-upper,#8eac91)"/><stop offset="1" stop-color="var(--shore-lower,#527e70)"/></linearGradient>
<linearGradient id="rock-face" x2=".55" y2="1"><stop stop-color="#9cae99"/><stop offset="1" stop-color="#597b73"/></linearGradient>
<clipPath id="mountain-snow-cut"><path d="${mountainSnowCut}"/></clipPath>
</defs>
<path fill="url(#air)" d="M0 0h1600v900H0z"/>
<path id="season-sky-wash" fill="url(#season-sky)" d="M0 0h1600v568H0z"/>
<g id="sun-halo"><circle r="135" fill="url(#halo)"/></g><circle id="travelling-sun" r="34" fill="#fff0cd"/>
<g fill="url(#cloud-light)">
  <g class="cloud-drift"><path d="M45 211C119 204 143 190 186 188C213 186 224 172 259 172C292 172 297 189 339 190C375 191 407 200 452 199C410 209 366 204 322 207C282 210 263 215 223 211C167 205 102 220 45 211Z"/><path d="M101 225C156 221 206 225 252 219C276 216 301 217 329 221C279 225 244 232 193 229Z" opacity=".65"/></g>
  <g class="cloud-drift cloud-east"><path d="M1033 146C1090 143 1114 130 1153 133C1184 135 1205 111 1241 114C1270 116 1278 131 1308 134C1350 139 1378 134 1428 140C1386 149 1356 147 1325 150C1272 155 1242 146 1199 149C1136 153 1086 151 1033 146Z"/><path d="M1194 165C1239 165 1264 157 1308 159C1340 160 1366 162 1400 156C1367 171 1321 167 1286 168Q1239 172 1194 165Z" opacity=".56"/></g>
  <path class="cloud-drift cloud-high" d="M572 84C612 83 639 75 667 77C692 78 718 85 754 81C727 91 690 88 655 88Q610 90 572 84Z" opacity=".33"/>
</g>
<g class="sky-flock" fill="none" stroke="#5f8586" stroke-width="1.5" stroke-linecap="round" opacity="0">
  <path d="M492 195q4-4 8 0 4-5 8-3M520 180q3-4 7-1 3-4 7-2M538 201q3-4 7-1 3-4 7-2"/>
</g>
<path fill="url(#far)" d="${ridge([[0,419],[105,370],[197,405],[291,335],[371,365],[439,414],[531,423],[620,464],[745,460],[822,474],[958,426],[1037,423],[1126,363],[1209,391],[1313,322],[1397,353],[1496,411],[1600,388]])}"/>
<path fill="url(#middle)" d="${middleRidge}"/>
<path fill="url(#slope-wash)" d="M164 284C190 293 198 324 220 346C261 394 295 428 363 450C281 443 224 412 204 381C180 347 180 308 164 284ZM1194 311C1229 319 1240 348 1262 372C1299 412 1339 425 1405 435C1331 442 1277 426 1244 392C1218 363 1219 328 1194 311Z"/>
<path class="season-layer winter-scene" fill="#e4edef" opacity=".88" clip-path="url(#mountain-snow-cut)" d="${middleRidge}"/>
<path class="valley-fog" fill="url(#mist)" d="M0 405h1600v170H0z"/>
<path fill="url(#near)" d="${ridge([[0,437],[65,417],[122,366],[153,351],[201,383],[259,453],[332,494],[428,518],[555,528],[698,550],[839,551],[955,534],[1065,510],[1163,491],[1245,453],[1308,415],[1345,417],[1401,451],[1488,473],[1600,491]])}"/>
<path fill="url(#slope-wash)" d="M155 354C188 367 198 397 223 429C248 461 286 486 342 503C285 504 232 481 205 449C180 420 185 381 155 354ZM1343 421C1379 431 1400 460 1457 476C1486 485 1534 485 1578 498C1495 504 1442 494 1406 476C1370 457 1374 439 1343 421Z"/>
<path fill="url(#water)" d="M0 548q297-24 524-6t463-1 613 6v353H0Z"/>
<path class="valley-fog shore-fog" fill="url(#mist)" d="M0 474h1600v133H0z"/>
<g id="shine"><ellipse cx="0" cy="640" rx="105" ry="150" fill="url(#halo)" opacity=".35"/><g stroke="#fff1cd" stroke-linecap="round" opacity=".65"><path d="M-64 556H62M-43 563H49M-78 575H66M-28 590H42M-62 612H82M-38 646H59M-69 695H51"/><path d="M-108 573h19m169 27h32m-132 62h24m-65 66h34" opacity=".5"/></g></g>
<g class="lake-mist" fill="none" stroke="#e3e7d3" stroke-width="1" opacity=".4"><path d="M175 588h206m-105 28h83m176-12h189m285-22h232m-100 42h180M101 677h184m134-13h144m337 19h182m180-10h118M277 753h217m371 22h191m59-43h157"/><path d="M411 579h31m400 39h72m-207 97h54m410-57h39m-752 158h91"/></g>
<g fill="none" stroke="#f3ebcf" stroke-linecap="round">
  <path class="lake-glimmer" d="M650 734h20m-12 5h7" opacity="0"/>
  <path class="lake-glimmer glimmer-late" d="M878 704h13m-8 4h4" opacity="0"/>
</g>
<g class="far-shore">
  <path d="M1600 641C1515 624 1453 622 1387 624C1293 626 1203 634 1129 636C1096 636 1068 631 1041 626C1069 642 1101 646 1147 645C1283 641 1397 634 1481 640C1530 644 1567 650 1600 658Z" fill="#6a948a" opacity=".28"/>
  <path fill="url(#shore)" d="M1600 580C1519 553 1451 551 1392 562C1359 569 1327 566 1302 569C1234 574 1181 582 1141 596C1102 610 1069 615 1041 620C1030 623 1044 628 1067 631C1121 639 1179 633 1234 626C1300 618 1367 612 1429 616C1491 620 1545 633 1600 644Z"/>
  <path fill="#abc1a4" opacity=".7" d="M1060 622C1103 615 1132 601 1168 593C1226 578 1311 572 1375 571C1346 574 1316 581 1287 591C1208 610 1118 629 1060 622Z"/>
  <path d="M1058 631C1120 641 1209 631 1265 627M1364 623C1415 621 1460 626 1504 634" fill="none" stroke="#d3dbc2" stroke-width="1.4" stroke-linecap="round" opacity=".56"/>
  ${snowbank('far')}
  ${rock(1059,625,.23,-1)}${rock(1074,628,.14)}
  ${shoreTree(1142,611,.27)}${shoreTree(1311,584,.46)}${shoreTree(1352,583,.31)}${shoreTree(1431,579,.53)}${shoreTree(1471,585,.34)}
  <g transform="translate(${pavilionOrigin})">
    <path d="M-21 0h48l8 4h-62Z" fill="#758f77"/>
    <path d="M-14-35h30V0h-30Z" fill="#c7c3a0"/>
    <path d="M-11-26h9v17h-9zm14 0h9v17H3z" fill="#728478"/>
    <path d="M-13-33V0m27-33V0M1-33V0" stroke="#566d5b" stroke-width="2.5"/>
    <path d="M-28-35q19-5 29-19 10 14 29 19-29 7-58 0Z" fill="var(--pavilion-roof,#456b62)"/>
    <path d="M-27-35q29 4 57 0m-29-19v-5M22-34v8" fill="none" stroke="#6a8675"/>
    <ellipse cx="22" cy="-23" rx="3" ry="4" fill="#ae7359"/>
  </g>
  <path d="M1074 623C1101 619 1129 619 1149 611C1171 602 1187 600 1200 600C1180 611 1160 620 1132 624C1108 627 1092 625 1074 623Z" fill="var(--far-shore-detail,#759986)"/>
</g>
<g id="blossoms" transform="translate(1185 452) scale(.22)"/>
<g transform="translate(${boatOrigin})">
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
</g>
<path d="M0 630C39 639 61 654 88 686C115 719 138 727 176 733C202 737 223 747 241 756C252 762 244 768 227 771C203 775 176 782 159 794C137 808 141 824 158 842L210 900H0Z" fill="url(#shore)"/>
<path d="M0 663C52 678 71 705 95 739C112 766 139 778 166 788C178 793 174 800 160 804C125 812 101 823 98 837C94 851 118 876 149 900H0Z" fill="url(#bank)"/>
<path d="M115 724C139 737 165 739 189 745C213 750 233 757 239 762M237 776C205 780 175 788 156 805" fill="none" stroke="#b6c6a8" stroke-width="1.8" stroke-linecap="round" opacity=".65"/>
${snowbank('left')}
${shoreTree(116,739,.64)}${shoreTree(176,767,1.04)}${shoreTree(216,767,.39)}
<path d="M1600 745C1546 750 1512 760 1478 782C1439 808 1408 809 1368 815C1336 820 1307 830 1303 837C1299 844 1320 845 1345 844C1391 843 1425 852 1448 872C1459 882 1466 892 1472 900H1600Z" fill="url(#shore)"/>
<path d="M1600 799C1541 791 1510 808 1480 826C1457 840 1449 862 1436 878L1417 900H1600Z" fill="url(#bank)"/>
<path d="M1314 850C1350 846 1382 851 1408 858M1452 803C1472 796 1488 786 1506 778" fill="none" stroke="#c3d0b2" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>
${snowbank('right')}
${rock(146,790,.83)}${rock(200,780,.43,-1)}${rock(218,784,.22)}
${rock(1514,844,1.05,-1)}${rock(1462,850,.49)}${rock(1418,854,.33,-1)}
<g class="reed-sway" fill="none" stroke="var(--shore-reed,#a7b69a)" stroke-linecap="round">
  <path d="M1458 858q3-42-16-63m19 63q1-49 24-74m-21 74q10-35 33-47" stroke-width="2"/>
  <path d="M1459 851q-12-27-32-39m36 33q1-27 13-41" stroke-width="1.25" opacity=".8"/>
  <path class="season-layer autumn-scene winter-scene" d="M1440 795l-3-7m48-4 5-7m-61 38-4-5" stroke="#8e7760" stroke-width="3"/>
</g>
${shoreDetails()}
<rect id="night-shade" width="1600" height="900" fill="#071730" opacity="0"/>
<g id="evening-lights" opacity="0">
  <g class="far-shore">
    <g transform="translate(${pavilionOrigin})">
      <ellipse cy="-17" rx="37" ry="28" fill="url(#lamp-halo)" opacity=".8"/>
      <path d="M-11-26h9v17h-9zm14 0h9v17H3z" fill="#f9c583"/>
      <path d="M-11-20h9m5 0h9" stroke="#a67150" stroke-width=".85"/>
      <circle cx="22" cy="-23" r="16" fill="url(#lamp-halo)"/>
      <ellipse cx="22" cy="-23" rx="2.8" ry="3.7" fill="#ffd39a"/>
      <path d="M-10 26h24m-17 5h16m-20 6H3" stroke="#f7c58c" stroke-linecap="round" opacity=".34"/>
    </g>
  </g>
  <g transform="translate(${boatOrigin})">
    ${alternateBoatLights()}
    <g class="boat-bob season-layer summer-scene">
      <circle cx="-3" cy="-9" r="19" fill="url(#lamp-halo)"/>
      <ellipse cx="-3" cy="-9" rx="3.2" ry="4" fill="#ffcd86"/>
      <ellipse cx="-3" cy="-9" rx="1.55" ry="2.5" fill="#ffecd0"/>
    </g>
  </g>
</g>
<g id="stars" fill="#f5e8ce" opacity="0">
  <circle cx="321" cy="116" r="1.2"/><circle cx="1013" cy="87" r="1"/><circle cx="1280" cy="167" r="1.3"/><circle cx="460" cy="237" r=".9"/><circle cx="1107" cy="247" r="1"/><circle cx="620" cy="66" r="1"/><circle cx="1423" cy="88" r=".8"/>
  <g class="orion"><title>Orion</title><path d="M901 126L932 101L974 133L949 173L938 178L927 183L901 126M927 183L916 250L983 235L949 173" stroke="#b6c8d9" stroke-width=".85" opacity=".52" fill="none"/>
    <circle cx="901" cy="126" r="2.9" fill="#ffc2a1"/><circle cx="932" cy="101" r="1.5"/><circle cx="974" cy="133" r="2.1"/><circle cx="949" cy="173" r="2"/><circle cx="938" cy="178" r="2.2"/><circle cx="927" cy="183" r="2"/><circle cx="916" cy="250" r="1.8"/><circle cx="983" cy="235" r="2.7" fill="#dceaff"/>
  </g>
</g>
<g id="garden-moon" opacity="0"><circle r="64" fill="url(#moon-halo)"/><path d="M8-20A22 22 0 1 0 20 12A23 23 0 0 1 8-20Z" fill="#e4eef8"/></g>
${weatherMarkup()}
</svg>`;}
let nodes,lastFrame;
function paintDay(p,lighting){
const width=innerWidth,height=innerHeight;
if(lastFrame?.p===p&&lastFrame.lighting===lighting&&lastFrame.width===width&&lastFrame.height===height)return;
lastFrame={p,lighting,width,height};
nodes??={sun:document.querySelector('#travelling-sun'),halo:document.querySelector('#sun-halo'),shine:document.querySelector('#shine'),top:document.querySelector('#zenith'),middle:document.querySelector('#sky-middle'),bottom:document.querySelector('#horizon'),wash:document.querySelector('#season-sky-wash'),shade:document.querySelector('#night-shade'),lamps:document.querySelector('#evening-lights'),stars:document.querySelector('#stars'),moon:document.querySelector('#garden-moon'),app:document.querySelector('#app')};
const light=daylight(p),k=light.p,{x,y}=sunPosition(k,innerWidth,innerHeight);
nodes.sun.setAttribute('cx',x);nodes.sun.setAttribute('cy',y);nodes.halo.setAttribute('transform',`translate(${x} ${y})`);nodes.shine.setAttribute('transform',`translate(${x} 0)`);
nodes.top.setAttribute('stop-color',light.top);nodes.middle.setAttribute('stop-color',light.middle);nodes.bottom.setAttribute('stop-color',light.horizon);
nodes.wash.setAttribute('opacity',1-light.night);
nodes.shade.setAttribute('opacity',light.shade);nodes.stars.setAttribute('opacity',Math.max(0,(light.night-.65)/.35)*.6);
nodes.lamps.setAttribute('opacity',light.lamplight);
const scale=Math.max(width/1600,height/900);
nodes.moon.setAttribute('transform',`translate(${800+Math.min(280,width/scale*.34)} ${Math.max(145,(900-height/scale)/2+83)})`);
nodes.moon.setAttribute('opacity',lighting==='night'?'.94':'0');
nodes.shine.setAttribute('opacity',(1-light.night)*light.sunlight);nodes.sun.setAttribute('opacity',light.sunlight);nodes.halo.setAttribute('opacity',light.sunlight);nodes.sun.setAttribute('fill',blend('#fff2ca','#eea177',Math.pow(Math.abs(k-.5)*2,3)));
nodes.app.style.setProperty('--scene-ink',blend('#34565a','#f1e6d3',light.night));
nodes.app.style.setProperty('--scene-muted',blend('#55726c','#c9cdd1',light.night));
nodes.app.style.setProperty('--scene-paper',blend('#e7eadc','#26394a',light.night));
}
export function animateLandscape(_now,progress,reduced,lighting='session'){
// Progress already comes from an end timestamp at animation-frame precision.
// Drawing it directly also makes resets and mode changes instant.
paintDay(sceneProgress(progress,lighting,reduced),lighting);
}

