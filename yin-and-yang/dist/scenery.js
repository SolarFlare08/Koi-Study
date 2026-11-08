export {blossomMarkup} from './landscape.js';
import {daylight,blend,ridge,sunPosition} from './daylight.js';
export const objects=[['pagoda','Timer settings'],['tasks','Add tasks'],['calendar','Open calendar'],['music','Your Spotify'],['notes','Distraction notes'],['progress','Today’s progress']].map(([id,hint])=>({id,hint,label:hint,className:'',art:''}));
function pine(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-5 0Q3-40-2-74Q-5-108 9-144L12-178Q17-142 8-111Q3-80 10-50L10 0Z" fill="#315858"/><path d="M4-60-40-83M3-95 44-119M8-131-18-148" stroke="#315858" stroke-width="4" fill="none"/><g fill="#3e6863"><path d="M-64-86q16-9 26-24 6 12 22 16l24 5q-22 9-72 3Z"/><path d="M-34-143q23-11 40-33 13 21 35 31-39 8-75 2Z"/><path d="M-3-119q26-8 46-28 10 18 36 25-39 11-82 3Z"/><path d="M-39-63q20-7 28-16 13 11 33 14-24 11-61 2Z"/></g><g fill="#63867a" opacity=".6"><path d="m-60-88 22-17 16 14Z"/><path d="m-23-145 28-24 14 23Z"/><path d="m13-122 30-19 12 19Z"/></g></g>`;}
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
</defs>
<path fill="url(#air)" d="M0 0h1600v900H0z"/>
<g id="sun-halo"><circle r="135" fill="url(#halo)"/></g><circle id="travelling-sun" r="34" fill="#fff0cd"/>
<g fill="#f5f0e2" opacity=".25"><path class="cloud-drift" d="M80 221q128-20 253-5t232 0q-122 17-248 13T80 221Z"/><path class="cloud-drift cloud-east" d="M1020 173q105-14 190-5t264-2q-88 22-197 14t-257-7Z"/></g>
<g class="sky-flock" fill="none" stroke="#5f8586" stroke-width="1.5" stroke-linecap="round" opacity="0">
  <path d="M492 195q4-4 8 0 4-5 8-3M520 180q3-4 7-1 3-4 7-2M538 201q3-4 7-1 3-4 7-2"/>
</g>
<path fill="url(#far)" d="${ridge([[0,435],[100,390],[190,418],[280,355],[375,423],[475,431],[580,469],[710,452],[810,481],[920,440],[1020,451],[1120,386],[1220,411],[1340,350],[1460,419],[1540,403],[1600,434]])}"/>
<path fill="url(#middle)" d="${ridge([[0,390],[65,344],[140,278],[205,333],[270,391],[345,441],[425,459],[555,509],[710,522],[855,499],[970,476],[1050,438],[1165,331],[1255,391],[1330,416],[1420,453],[1510,473],[1600,450]])}"/>
<path fill="url(#mist)" d="M0 417h1600v152H0z"/>
<path fill="url(#near)" d="${ridge([[0,437],[70,393],[135,343],[200,407],[270,465],[355,501],[450,525],[565,530],[700,546],[825,553],[945,536],[1050,505],[1160,492],[1245,448],[1305,408],[1380,456],[1480,473],[1600,491]])}"/>
<path fill="url(#water)" d="M0 548q297-24 524-6t463-1 613 6v353H0Z"/>
<path fill="url(#mist)" d="M0 481h1600v117H0z"/>
<g id="shine"><ellipse cx="0" cy="640" rx="105" ry="150" fill="url(#halo)" opacity=".35"/><g stroke="#fff1cd" stroke-linecap="round" opacity=".65"><path d="M-64 556H62M-43 563H49M-78 575H66M-28 590H42M-62 612H82M-38 646H59M-69 695H51"/><path d="M-108 573h19m169 27h32m-132 62h24m-65 66h34" opacity=".5"/></g></g>
<g class="lake-mist" fill="none" stroke="#e3e7d3" stroke-width="1" opacity=".4"><path d="M175 588h206m-105 28h83m176-12h189m285-22h232m-100 42h180M101 677h184m134-13h144m337 19h182m180-10h118M277 753h217m371 22h191m59-43h157"/><path d="M411 579h31m400 39h72m-207 97h54m410-57h39m-752 158h91"/></g>
<g fill="none" stroke="#f3ebcf" stroke-linecap="round">
  <path class="lake-glimmer" d="M650 734h20m-12 5h7" opacity="0"/>
  <path class="lake-glimmer glimmer-late" d="M878 704h13m-8 4h4" opacity="0"/>
</g>
<path fill="#6b9382" d="M1600 581q-113-37-211-20-44 8-85 5-66-1-109 25-45 24-121 24 36 13 100 10 151-13 253 1l173 28Z"/>
<path fill="#9eb5a0" d="M1145 609q74-8 112-27 59-24 139-16-45 4-76 18-94 34-175 25Z"/>
${pine(1303,582,.49)}${pine(1335,581,.31)}${pine(1467,575,.56)}${pine(1495,580,.4)}
<g transform="translate(1228 579)"><path d="M-21 0h48l8 4h-62Z" fill="#758f77"/><path d="M-14-35h30V0h-30Z" fill="#c7c3a0"/><path d="M-11-33V0m24-33V0M1-33V0" stroke="#566d5b" stroke-width="3"/><path d="M-28-35q19-5 29-19 10 14 29 19-29 7-58 0Z" fill="#456b62"/><path d="M-27-35q29 4 57 0" fill="none" stroke="#7e9880"/><path d="M1-54v-5" stroke="#456b62"/></g>
<g id="blossoms" transform="translate(1185 452) scale(.22)"/>
<g transform="translate(778 671)" opacity=".65">
  <ellipse class="boat-wake" cx="0" cy="10" rx="36" ry="5" fill="none" stroke="#d2dcc9" opacity=".3"/>
  <g class="boat-bob"><path d="M-19 0q19 8 39 0l-8 8h-23Z" fill="#4c7873"/><path d="M1-4 17-23" stroke="#547c72"/><path d="M-2-2v-9" stroke="#547c72" stroke-width="3"/></g>
</g>
<path d="M0 629q53 7 87 56t91 47q42 1 72 25-48 7-81 26-24 12-31 32l69 85H0Z" fill="#668b78"/>
<path d="M0 674q65 6 88 62t83 63q-62 10-83 34l70 67H0Z" fill="url(#bank)"/>
${pine(71,733,1.12)}${pine(19,695,.78)}${pine(110,756,.44)}
<path d="M1600 745q-75 2-122 33t-128 35q-43 4-66 24 68-4 111 12t70 51h135Z" fill="#648878"/>
<path d="M1600 803q-84-22-146 12l-45 85h191Z" fill="#3b665d"/>
<g stroke="#93a690" fill="none" stroke-width="2"><path d="M1460 862q1-46-17-69m20 64q2-55 23-79m-17 84q10-40 30-48M1463 847q-18-35-38-38"/></g>
<g fill="#8b9f8a"><path d="m102 777 29-20 36 10 12 16-45 6Z"/><path d="m1512 828 29-22 42 13 17 24-59 4Z"/></g>
<rect id="night-shade" width="1600" height="900" fill="#071730" opacity="0"/>
<g id="stars" fill="#f5e8ce" opacity="0"><circle cx="321" cy="116" r="1.2"/><circle cx="1013" cy="87" r="1"/><circle cx="1280" cy="167" r="1.3"/><circle cx="460" cy="237" r=".9"/><circle cx="1107" cy="247" r="1"/><circle cx="923" cy="185" r=".8"/><circle cx="620" cy="66" r="1"/><circle cx="1423" cy="88" r=".8"/></g>
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

