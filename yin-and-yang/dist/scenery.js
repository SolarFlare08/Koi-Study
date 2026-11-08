export {blossomMarkup} from './landscape.js';
import {daylight,blend,ridge,sunPosition} from './daylight.js';
export const objects=[['pagoda','Timer settings'],['tasks','Add tasks'],['music','Your Spotify'],['notes','Distraction notes'],['progress','Today’s progress']].map(([id,hint])=>({id,hint,label:hint,className:'',art:''}));
function pine(x,y,scale=1){
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M-9 1C1-28 1-55-4-82C-8-109 4-133 10-166L15-180C18-149 9-129 7-107C3-83 11-56 9-29Q8-13 14 1Z" fill="#315858"/>
    <path d="M3-53Q-7-76-42-90M2-87Q18-110 54-120M8-121Q-1-142-22-149" stroke="#315858" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M-51-146C-35-151-36-160-20-162C-7-176 11-187 24-173Q31-169 32-160C46-159 49-152 61-147Q55-140 36-140Q15-143 3-138Q-25-134-51-146Z" fill="#456e65"/>
    <path d="M-16-113Q-7-126 8-126C20-130 20-138 33-136Q47-144 59-133Q71-134 82-124Q70-116 58-116Q45-109 26-112Q5-108-16-113Z" fill="#527b6e"/>
    <path d="M-74-88Q-69-96-56-97C-48-110-31-113-19-104Q-6-104 2-96Q15-95 20-86Q8-78-13-80Q-34-74-54-81Z" fill="#3d665f"/>
    <path d="M-29-61Q-23-73-9-72Q4-82 18-74Q35-76 48-64Q33-56 19-59Q0-53-29-61Z" fill="#456e65"/>
    <path d="M-37-151Q-23-159-16-160Q5-180 18-174M20-125Q32-137 44-134M-57-96Q-43-107-31-106" fill="none" stroke="#83a391" stroke-width="3" stroke-linecap="round" opacity=".44"/>
  </g>`;
}
export function renderLandscape(){return `<svg class="world" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="air" x2="0" y2="1"><stop id="zenith" stop-color="#c8d9d7"/><stop id="sky-middle" offset=".67" stop-color="#eee4d4"/><stop id="horizon" offset="1" stop-color="#f5d9ba"/></linearGradient>
<linearGradient id="far" x2="0" y2="1"><stop stop-color="#a6bdb9"/><stop offset="1" stop-color="#d6dcd0"/></linearGradient>
<linearGradient id="middle" x2=".3" y2="1"><stop stop-color="#6f9894"/><stop offset="1" stop-color="#afc6b9"/></linearGradient>
<linearGradient id="near" x2=".5" y2="1"><stop stop-color="#497c7b"/><stop offset="1" stop-color="#83aaa1"/></linearGradient>
<linearGradient id="water" x2="0" y2="1"><stop stop-color="#ced7c6"/><stop offset=".35" stop-color="#adc9bc"/><stop offset="1" stop-color="#6d9c98"/></linearGradient>
<linearGradient id="mist" x2="0" y2="1"><stop stop-color="#f6eddc" stop-opacity="0"/><stop offset=".5" stop-color="#f6eddc" stop-opacity=".8"/><stop offset="1" stop-color="#f6eddc" stop-opacity="0"/></linearGradient>
<linearGradient id="reflection" x2="0" y2="1"><stop stop-color="#fce4bb" stop-opacity=".7"/><stop offset="1" stop-color="#fce4bb" stop-opacity="0"/></linearGradient>
<radialGradient id="halo"><stop stop-color="#ffe9bd" stop-opacity=".65"/><stop offset="1" stop-color="#ffe9bd" stop-opacity="0"/></radialGradient>
<linearGradient id="bank" x2=".4" y2="1"><stop stop-color="#547d6b"/><stop offset="1" stop-color="#294f4d"/></linearGradient>
<linearGradient id="shore" x2="0" y2="1"><stop stop-color="#8eac91"/><stop offset="1" stop-color="#527e70"/></linearGradient>
</defs>
<path fill="url(#air)" d="M0 0h1600v900H0z"/>
<g id="sun-halo"><circle r="135" fill="url(#halo)"/></g><circle id="travelling-sun" r="34" fill="#fff0cd"/>
<g fill="#f5f0e2" opacity=".25"><path class="cloud-drift" d="M80 221q128-20 253-5t232 0q-122 17-248 13T80 221Z"/><path class="cloud-drift cloud-east" d="M1020 173q105-14 190-5t264-2q-88 22-197 14t-257-7Z"/></g>
<g class="sky-flock" fill="none" stroke="#5f8586" stroke-width="1.5" stroke-linecap="round" opacity="0">
  <path d="M492 195q4-4 8 0 4-5 8-3M520 180q3-4 7-1 3-4 7-2M538 201q3-4 7-1 3-4 7-2"/>
</g>
<path fill="url(#far)" d="${ridge([[0,435],[100,390],[190,418],[280,355],[375,423],[475,431],[580,469],[710,452],[810,481],[920,440],[1020,451],[1120,386],[1220,411],[1340,350],[1460,419],[1540,403],[1600,434]])}"/>
<path fill="url(#middle)" d="${ridge([[0,390],[65,344],[140,278],[205,333],[270,391],[345,441],[425,459],[555,509],[710,522],[855,499],[970,476],[1050,438],[1165,331],[1255,391],[1330,416],[1420,453],[1510,473],[1600,450]])}"/>
<path class="valley-fog" fill="url(#mist)" d="M0 405h1600v170H0z"/>
<path fill="url(#near)" d="${ridge([[0,437],[70,393],[135,343],[200,407],[270,465],[355,501],[450,525],[565,530],[700,546],[825,553],[945,536],[1050,505],[1160,492],[1245,448],[1305,408],[1380,456],[1480,473],[1600,491]])}"/>
<path fill="url(#water)" d="M0 548q297-24 524-6t463-1 613 6v353H0Z"/>
<path class="valley-fog shore-fog" fill="url(#mist)" d="M0 474h1600v133H0z"/>
<g id="shine"><ellipse cx="0" cy="640" rx="105" ry="150" fill="url(#halo)" opacity=".35"/><g stroke="#fff1cd" stroke-linecap="round" opacity=".65"><path d="M-64 556H62M-43 563H49M-78 575H66M-28 590H42M-62 612H82M-38 646H59M-69 695H51"/><path d="M-108 573h19m169 27h32m-132 62h24m-65 66h34" opacity=".5"/></g></g>
<g class="lake-mist" fill="none" stroke="#e3e7d3" stroke-width="1" opacity=".4"><path d="M175 588h206m-105 28h83m176-12h189m285-22h232m-100 42h180M101 677h184m134-13h144m337 19h182m180-10h118M277 753h217m371 22h191m59-43h157"/><path d="M411 579h31m400 39h72m-207 97h54m410-57h39m-752 158h91"/></g>
<g fill="none" stroke="#f3ebcf" stroke-linecap="round">
  <path class="lake-glimmer" d="M650 734h20m-12 5h7" opacity="0"/>
  <path class="lake-glimmer glimmer-late" d="M878 704h13m-8 4h4" opacity="0"/>
</g>
<path d="M1600 641C1515 624 1453 622 1387 624C1302 626 1243 632 1187 632C1156 632 1125 627 1108 624C1136 639 1176 642 1220 641C1319 638 1400 634 1481 640C1530 644 1567 650 1600 658Z" fill="#6a948a" opacity=".28"/>
<path fill="url(#shore)" d="M1600 580C1519 553 1451 551 1392 562C1359 569 1327 566 1302 569C1255 573 1226 585 1197 599C1166 613 1131 615 1112 618C1103 620 1115 624 1134 627C1165 633 1199 631 1234 626C1300 618 1367 612 1429 616C1491 620 1545 633 1600 644Z"/>
<path fill="#abc1a4" opacity=".7" d="M1134 621C1176 616 1197 602 1226 593C1271 576 1328 572 1375 571C1346 574 1316 581 1287 591C1233 610 1183 624 1134 621Z"/>
<path d="M1128 628C1174 638 1225 630 1265 627M1364 623C1415 621 1460 626 1504 634" fill="none" stroke="#d3dbc2" stroke-width="1.4" stroke-linecap="round" opacity=".56"/>
${pine(1311,584,.46)}${pine(1352,583,.31)}${pine(1431,579,.53)}${pine(1471,585,.34)}
<g transform="translate(1252 594)"><path d="M-21 0h48l8 4h-62Z" fill="#758f77"/><path d="M-14-35h30V0h-30Z" fill="#c7c3a0"/><path d="M-11-33V0m24-33V0M1-33V0" stroke="#566d5b" stroke-width="3"/><path class="pavilion-glow" d="M3-24h8v15H3z" fill="#fff0bc" opacity=".35"/><path d="M-28-35q19-5 29-19 10 14 29 19-29 7-58 0Z" fill="#456b62"/><path d="M-27-35q29 4 57 0" fill="none" stroke="#7e9880"/><path d="M1-54v-5" stroke="#456b62"/></g>
<path d="M1213 604C1231 597 1249 593 1273 591C1292 589 1307 585 1323 581C1307 593 1293 601 1275 603C1250 606 1231 606 1213 604Z" fill="#759986"/>
<g id="blossoms" transform="translate(1185 452) scale(.22)"/>
<g transform="translate(778 671)" opacity=".65">
  <ellipse class="boat-wake" cx="0" cy="10" rx="36" ry="5" fill="none" stroke="#d2dcc9" opacity=".3"/>
  <g class="boat-bob"><path d="M-19 0q19 8 39 0l-8 8h-23Z" fill="#4c7873"/><path d="M1-4 17-23" stroke="#547c72"/><path d="M-2-2v-9" stroke="#547c72" stroke-width="3"/></g>
</g>
<path d="M0 630C39 639 61 654 88 686C115 719 138 727 176 733C202 737 223 747 241 756C252 762 244 768 227 771C203 775 176 782 159 794C137 808 141 824 158 842L210 900H0Z" fill="url(#shore)"/>
<path d="M0 663C52 678 71 705 95 739C112 766 139 778 166 788C178 793 174 800 160 804C125 812 101 823 98 837C94 851 118 876 149 900H0Z" fill="url(#bank)"/>
<path d="M115 724C139 737 165 739 189 745C213 750 233 757 239 762M237 776C205 780 175 788 156 805" fill="none" stroke="#b6c6a8" stroke-width="1.8" stroke-linecap="round" opacity=".65"/>
${pine(116,739,.64)}${pine(176,767,1.04)}${pine(216,767,.39)}
<path d="M1600 745C1546 750 1512 760 1478 782C1439 808 1408 809 1368 815C1336 820 1307 830 1303 837C1299 844 1320 845 1345 844C1391 843 1425 852 1448 872C1459 882 1466 892 1472 900H1600Z" fill="url(#shore)"/>
<path d="M1600 799C1541 791 1510 808 1480 826C1457 840 1449 862 1436 878L1417 900H1600Z" fill="url(#bank)"/>
<path d="M1314 850C1350 846 1382 851 1408 858M1452 803C1472 796 1488 786 1506 778" fill="none" stroke="#c3d0b2" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>
<g class="reed-sway" stroke="#93a690" fill="none" stroke-width="2"><path d="M1460 862q1-46-17-69m20 64q2-55 23-79m-17 84q10-40 30-48M1463 847q-18-35-38-38"/></g>
<g fill="#8b9f8a"><path d="m102 777 29-20 36 10 12 16-45 6Z"/><path d="m1512 828 29-22 42 13 17 24-59 4Z"/></g>
<rect id="night-shade" width="1600" height="900" fill="#071730" opacity="0"/>
<g id="stars" fill="#f5e8ce" opacity="0">
  <circle cx="321" cy="116" r="1.2"/><circle cx="1013" cy="87" r="1"/><circle cx="1280" cy="167" r="1.3"/><circle cx="460" cy="237" r=".9"/><circle cx="1107" cy="247" r="1"/><circle cx="620" cy="66" r="1"/><circle cx="1423" cy="88" r=".8"/>
  <g class="orion"><title>Orion</title><path d="M901 126L932 101L974 133L949 173L938 178L927 183L901 126M927 183L916 250L983 235L949 173" stroke="#b6c8d9" stroke-width=".85" opacity=".52" fill="none"/>
    <circle cx="901" cy="126" r="2.9" fill="#ffc2a1"/><circle cx="932" cy="101" r="1.5"/><circle cx="974" cy="133" r="2.1"/><circle cx="949" cy="173" r="2"/><circle cx="938" cy="178" r="2.2"/><circle cx="927" cy="183" r="2"/><circle cx="916" cy="250" r="1.8"/><circle cx="983" cy="235" r="2.7" fill="#dceaff"/>
  </g>
</g>
</svg>`;}
let nodes;
export function paintDay(p){
nodes??={sun:document.querySelector('#travelling-sun'),halo:document.querySelector('#sun-halo'),shine:document.querySelector('#shine'),top:document.querySelector('#zenith'),middle:document.querySelector('#sky-middle'),bottom:document.querySelector('#horizon'),shade:document.querySelector('#night-shade'),stars:document.querySelector('#stars'),app:document.querySelector('#app')};
const light=daylight(p),k=light.p,{x,y}=sunPosition(k,innerWidth,innerHeight);
nodes.sun.setAttribute('cx',x);nodes.sun.setAttribute('cy',y);nodes.halo.setAttribute('transform',`translate(${x} ${y})`);nodes.shine.setAttribute('transform',`translate(${x} 0)`);
nodes.top.setAttribute('stop-color',light.top);nodes.middle.setAttribute('stop-color',light.middle);nodes.bottom.setAttribute('stop-color',light.horizon);
nodes.shade.setAttribute('opacity',light.shade);nodes.stars.setAttribute('opacity',Math.max(0,(light.night-.65)/.35)*.6);
nodes.shine.setAttribute('opacity',(1-light.night)*light.sunlight);nodes.sun.setAttribute('opacity',light.sunlight);nodes.halo.setAttribute('opacity',light.sunlight);nodes.sun.setAttribute('fill',blend('#fff2ca','#eea177',Math.pow(Math.abs(k-.5)*2,3)));
nodes.app.style.setProperty('--scene-ink',blend('#34565a','#f1e6d3',light.night));
nodes.app.style.setProperty('--scene-muted',blend('#55726c','#c9cdd1',light.night));
}
export function animateLandscape(now,progress,reduced){
// Progress already comes from an end timestamp at animation-frame precision.
// Drawing it directly also makes resets and mode changes instant.
paintDay(progress);
}

