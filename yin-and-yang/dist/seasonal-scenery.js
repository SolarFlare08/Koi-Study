const blossom='M0-3C1-6 5-6 4-2C8-2 7 3 3 3C4 7-2 8-2 3C-6 5-8 0-4-1C-6-4-2-6 0-3Z';
const maple='M0 8 1 3-7 1-4-1-7-5-3-4-2-8 0-4 3-8 4-4 8-5 5-1 8 1 2 3Z';
const pos=(x,y,scale=1)=>`translate(${x} ${y}) scale(${scale})`;
const hues=['#f6d4d5','#edb2b8','#fff0db','#d78a98'];
function flower(x,y,scale,hue,stem=false){
  return `<g transform="${pos(x,y,scale)}">${stem?'<path d="M0 10 0 0m0 7-4-2m4 4 3-2" fill="none" stroke="#638363" stroke-width="1.1" stroke-linecap="round"/>':''}<path d="${blossom}" fill="${hue}"/><circle r="1.5" fill="#c98d68"/></g>`;
}
const cherryClusters=[
  [-51,-139,23,12],[-29,-152,23,14],[-12,-166,21,14],[12,-174,22,13],[36,-162,28,14],
  [63,-148,24,12],[30,-144,30,12],[-13,-145,32,12],[-64,-118,23,11],
  [-38,-121,27,13],[-15,-111,24,11],[30,-120,29,13],[60,-121,25,11],
  [-29,-85,24,10],[-54,-88,26,12],[24,-88,23,11],[43,-96,24,11]
];
const copperClusters=[
  [-45,-147,23,13],[-28,-165,23,16],[-3,-179,27,15],[28,-169,28,16],
  [53,-152,28,14],[26,-147,28,14],[-16,-141,28,12],[-63,-117,22,12],
  [-40,-119,27,13],[-16,-112,20,12],[34,-121,26,12],[62,-112,23,11],
  [-38,-91,25,12],[-15,-83,23,11],[29,-88,29,11],[55,-93,20,11]
];
function canopy(clusters,colors){
  return clusters.map(([x,y,rx,ry],i)=>`<path transform="${pos(x,y)}" d="M${-rx} 1Q${-rx} ${-ry} ${-rx*.52} ${-ry*.66}Q${-rx*.27} ${-ry*1.54} ${rx*.18} ${-ry*.82}Q${rx*.58} ${-ry*1.17} ${rx*.72} ${-ry*.3}Q${rx*1.16} ${-ry*.22} ${rx} 2Q${rx*.77} ${ry*.7} ${rx*.28} ${ry*.57}Q${-rx*.38} ${ry} ${-rx} 1Z" fill="${colors[i%colors.length]}"/>`).join('');
}
export function seasonalTree(x,y,scale){
  const trunk=`<path d="M-10 2Q-2-18-3-45Q-5-67 2-95L5-133L14-173L12-139L14-105Q6-66 8-44Q7-19 16 2Z" fill="var(--tree-bark)"/>
    <path d="M5-93Q-16-121-48-142M6-67Q22-92 57-109M8-118Q28-143 50-154M4-49Q-12-67-41-80M4-106Q-5-138-23-160" fill="none" stroke="var(--tree-bark)" stroke-width="5" stroke-linecap="round"/>`;
  return `<g transform="${pos(x,y,scale)}">
    <ellipse class="season-layer spring-scene autumn-scene winter-scene" cx="3" cy="1" rx="27" ry="4" fill="#415758" opacity=".19"/>
    <g class="season-layer spring-scene" style="--tree-bark:#745d60">
      ${trunk}${canopy(cherryClusters,['#db9ba9','#e9b5bd','#f1c4c6','#d88f9e','#f5d2cb'])}
      ${cherryClusters.map(([cx,cy],i)=>flower(cx+(i%3-1)*6,cy-3,.56+(i%3)*.16,hues[i%hues.length])).join('')}
      ${cherryClusters.filter((_,i)=>i%2===0).map(([cx,cy],i)=>flower(cx+12,cy+3,.42,hues[(i+1)%hues.length])).join('')}
    </g>
    <g class="season-layer autumn-scene" style="--tree-bark:#67483d">
      ${trunk}${canopy(copperClusters,['#ad4e36','#cc6f42','#e09a51','#b5593d','#ebaf59','#c06444'])}
      ${copperClusters.map(([cx,cy],i)=>`<path transform="${pos(cx+7,cy-2,.43)} rotate(${i*67})" d="${maple}" fill="#f5bb68" opacity=".75"/>`).join('')}
    </g>
    <g class="season-layer winter-scene" style="--tree-bark:#485b61">
      ${trunk}
      <path d="M13-153 21-174 19-193M19-173 32-182M14-173 9-192M10-155-2-167-7-183M-22-159-33-176-33-191m0 16-16-8m27 23 1-17M-48-142-61-155-70-175m8 19-20-10M50-154 58-167 62-186m-4 20 17-11m-30 27 25-4 12-9M57-109 69-126 77-130m-13 13 23-5m-46 23 2-19 7-12M-41-80-55-95-61-111m11 23-19-10m40 24-1-18-7-12" fill="none" stroke="#485b61" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M-45-145Q-18-132-8-112m20-8q15-22 33-32m-28 75q17-21 36-29m-89 29 25 14" fill="none" stroke="#c5d6da" stroke-width="2.4" stroke-linecap="round" opacity=".83"/>
    </g>
  </g>`;
}

const snowbanks={
  left:'M0 630C39 639 61 654 88 686C115 719 138 727 176 733C202 737 223 747 241 756Q222 755 205 749Q184 746 172 744Q118 739 82 696Q45 654 0 648Z',
  right:'M1600 745C1546 750 1512 760 1478 782C1439 808 1408 809 1368 815C1336 820 1307 830 1303 837Q1326 831 1357 826Q1374 826 1393 818Q1444 814 1487 789Q1537 765 1600 760Z',
  far:'M1600 580C1519 553 1451 551 1392 562C1359 569 1327 566 1302 569C1247 574 1194 584 1150 594Q1204 586 1251 581Q1296 581 1319 576Q1375 581 1410 569Q1493 557 1600 594Z'
};
export const snowbank=side=>`<path class="season-layer winter-scene" fill="#e4edef" opacity=".93" d="${snowbanks[side]}"/>`;
export const mountainSnowCut='M45 247H246V349Q217 336 197 320Q185 309 177 313L164 304L145 323L132 316Q104 348 63 366H45ZM1092 276H1278V371Q1252 357 1230 342L1203 337L1185 324L1171 340L1159 334Q1130 366 1106 383H1092Z';

function lotus(x,y,s,color){
  return `<g transform="${pos(x,y,s)}"><path d="M-14 1C-14-6 7-8 14-3L4 0 14 3C7 9-14 7-14 1Z" fill="#799a79"/><path d="M-6-1C-12-8-8-12-5-9L-1-5Q-5-10 0-15Q5-10 1-5L6-10Q12-9 7-2Q0 4-6-1Z" fill="${color}"/><path d="M-3-2 0-6 4-2" fill="none" stroke="#c89276" stroke-width="1" stroke-linecap="round"/></g>`;
}
export function shoreDetails(){
  const grass=[[21,671,1.4],[53,690,.86],[75,713,1.2],[48,756,1.65],[93,761,.9],[121,768,1.15],[152,754,.9],[213,754,1.05],[208,797,.7],[1327,830,.7],[1351,825,.85],[1392,819,1.05],[1505,779,.7],[1555,780,1.4],[1583,795,1.6]];
  const leaves=[[20,672],[41,689],[56,693],[77,708],[87,724],[55,736],[70,754],[96,771],[134,783],[202,759],[226,763],[1490,789],[1519,776],[1551,781],[1397,821],[1359,830],[1391,834],[470,762],[549,792],[1038,683],[1182,718]];
  return `<g class="season-layer spring-scene">
    ${grass.map(([x,y,s],i)=>flower(x,y,s,hues[i%hues.length],true)+flower(x+8,y+4,s*.61,hues[(i+1)%hues.length],true)+flower(x-5,y+7,s*.49,hues[(i+2)%hues.length],true)).join('')}
    ${lotus(509,727,.75,'#f4c1ca')}${lotus(534,739,.6,'#f2d0d3')}${lotus(1062,755,.72,'#efb1bb')}${lotus(1086,765,.49,'#f5d5cc')}
    <path d="M462 675q15-3 32-1m554 54h38m-511 55h22" stroke="#e7c4bd" fill="none" opacity=".6" stroke-linecap="round"/>
  </g>
  <g class="season-layer summer-scene">
    ${lotus(466,736,.9,'#eee0a6')}${lotus(496,749,.59,'#e8cd91')}${lotus(1106,701,.73,'#eadc98')}
    <g class="summer-dragonfly" transform="translate(602 689)" stroke="#a6b4a1" stroke-width="1.1" stroke-linecap="round" fill="none"><path d="M0-3v8M0-1Q-9-8-9-4Q-9-1 0 0Q9-8 9-4Q9-1 0 0M0 1q-10 2-6 3M0 1q10 2 6 3"/></g>
  </g>
  <g class="season-layer autumn-scene">
    ${leaves.map(([x,y],i)=>`<path d="${maple}" transform="${pos(x,y,.28+(i%4)*.15)} rotate(${i*57})" fill="${['#b75a40','#de9a57','#d47b45','#e4ad60'][i%4]}" opacity=".86"/>`).join('')}
    <path d="M22 697q15 1 27 8m59 64q20 7 46 10m1242 49q18-2 29-7" stroke="#d9ab68" stroke-width="2.2" fill="none" opacity=".63"/>
  </g>
  <g class="season-layer winter-scene" fill="none" stroke-linecap="round" stroke="#dbe9eb">
    <path d="M228 775q26-2 46 2l-15 4 23 2m-77 13 23-2m1019 25 38-4 11 1 19-6m15 42-18 1 11 3-31 2" opacity=".72"/>
    <path d="M469 794h35l10 3h14m484-113 19 2 20-1m-580-97 34 2" opacity=".4"/>
  </g>`;
}

export function alternateBoats(){
  return `<g class="season-layer spring-scene">
    <ellipse cy="9" rx="52" ry="4" fill="#557b79" opacity=".22"/>
    <g class="boat-bob">
      <path d="M-52-4Q-35-2-23-6Q4 2 29-7Q46-11 55-17Q51-2 37 4Q-8 16-39 5Z" fill="#557c6f"/>
      <path d="M-46-4Q-15 4 29-5Q44-9 54-15" stroke="#aec1a3" stroke-width="1.7" fill="none"/>
      <path d="M-14-3C-26-6-32-16-31-22Q-21-22-12-15Q-17-30-10-35Q-1-30 0-17Q1-32 12-38Q18-27 13-17Q24-25 32-22Q33-12 21-5Q8 3-14-3Z" fill="#e7adb5"/>
      <path d="M-12-6Q-22-12-23-17Q-10-16-5-8Q-7-22 2-29Q10-20 8-8Q18-18 26-18Q22-8 13-5Z" fill="#f7d1cd"/>
      <path d="M-4-7q4-9 9-10 4 4 3 10" fill="#f4ce91"/>
    </g>
  </g>
  <g class="season-layer autumn-scene">
    <ellipse cy="12" rx="55" ry="4" fill="#436962" opacity=".24"/>
    <g class="boat-bob">
      <path d="M-52-9Q-26 0 2-1Q36-4 55-15Q45 3 30 8Q-11 14-39 6Z" fill="#65514b"/>
      <path d="M-48-8Q-22 2 4 0Q33-2 53-13M-36 5Q2 12 33 5" stroke="#d5a26f" fill="none" stroke-width="1.25" stroke-linecap="round"/>
      <path d="M-32-6-35-20H-7L-10-6Z" fill="#987454"/><path d="M-33-18h24m-23 5h22m-19-6 2 10m5-10 1 10m6-10-1 10" stroke="#c69864" stroke-width="1.1"/>
      <path d="M-31-20q-4-8 3-8 6-1 7 7m0 0q-3-11 4-12 8 1 6 12m16 15Q-4-12 3-18Q12-25 22-16Q29-8 18-5Z" fill="#d98549"/>
      <path d="M12-19q-4 7-1 13m5-14q5 7 2 13m-4-14v-4m-38-2v-3m6-4v-3" stroke="#735c43" fill="none" stroke-width="1.15" stroke-linecap="round"/>
      <path d="M35-8v-31q-2-4-6-3" stroke="#564c45" fill="none" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M24-39h7l3 4-2 8H24l-2-8Z" fill="#d5a26f" stroke="#865d46" stroke-width="1"/>
    </g>
  </g>
  <g class="season-layer winter-scene">
    <ellipse cy="13" rx="58" ry="4" fill="#476573" opacity=".28"/>
    <g class="boat-bob">
      <path d="M-45-8-41-27Q-24-43 3-39L22-29 26-8Z" fill="#63797a"/>
      <path d="M-42-25Q-36-41-15-42Q8-44 24-29L20-26Q11-32 5-33Q-20-37-40-23Z" fill="#e0ebeb"/>
      <path d="M-31-26Q-19-33-7-30V-10H-32ZM0-30q11 1 17 7l3 13H0Z" fill="#446366"/>
      <path d="M-26-24h12v12h-12zm30 1h9l3 11H4Z" fill="#c9a586"/>
      <path d="M-20-24v12m-6-6h12m23-4v10" stroke="#687777" stroke-width="1"/>
      <path d="M-54-10Q-24 0 3-2Q40-5 57-15Q50 0 30 9Q-10 15-40 5Z" fill="#405d67"/>
      <path d="M-49-9Q-19 1 3-1Q38-5 53-13" stroke="#dce7ea" fill="none" stroke-width="1.55"/>
      <path d="M30-8v-19m-3 0h7" stroke="#52666a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    </g>
  </g>`;
}
export function alternateBoatLights(){
  return `<g class="boat-bob">
    <g class="season-layer spring-scene"><circle cx="3" cy="-12" r="30" fill="url(#lamp-halo)"/><path d="M-4-7q4-9 9-10 4 4 3 10" fill="#ffd89a"/></g>
    <g class="season-layer autumn-scene"><circle cx="28" cy="-33" r="23" fill="url(#lamp-halo)"/><path d="M25-37h5l2 3-1 6h-5l-2-6Z" fill="#ffd09a"/></g>
    <g class="season-layer winter-scene"><ellipse cx="-7" cy="-18" rx="35" ry="24" fill="url(#lamp-halo)"/><path d="M-26-24h12v12h-12zm30 1h9l3 11H4Z" fill="#ffca8b"/><path d="M-20-24v12m-6-6h12m23-4v10" stroke="#9f7358" stroke-width="1"/></g>
  </g>`;
}

export function weatherMarkup(){
  const particles=(count,draw)=>Array.from({length:count},(_,i)=>draw((i*173+37)%1600,(i*101+27)%900,i)).join('');
  const floating=(shape,count)=>particles(count,(x,y,i)=>`<g transform="${pos(x,y,.44+(i%4)*.21)}"><path class="weather-drift" style="--weather-delay:-${i%17}s" d="${shape}"/></g>`);
  const fallingSnow=particles(58,(x,y,i)=>`<circle class="weather-snowflake" style="--weather-delay:-${i%15}s" cx="${x}" cy="${y}" r="${.85+i%4*.46}"/>`);
  const rain=particles(76,(x,y,i)=>`<path class="weather-raindrop" style="--weather-delay:-${(i%19)*.12}s" d="M${x} ${y}l-3 ${9+i%8}"/>`);
  return `<g class="weather-layer weather-petals" fill="#e9aeb6">${floating('M-4 2Q-5-2 5-3Q4 3-4 2Z',23)}</g>
    <g class="weather-layer weather-leaves" fill="#d99156">${floating(maple,20)}</g>
    <g class="weather-layer weather-rain"><path fill="#557383" opacity=".12" d="M0 0h1600v900H0z"/><g stroke="#c2d6d9" stroke-linecap="round" stroke-width="1.2">${rain}</g><g class="weather-ripple" fill="none" stroke="#dae6dc" opacity=".45"><ellipse cx="475" cy="698" rx="13" ry="2.6"/><ellipse cx="917" cy="626" rx="12" ry="2.4"/><ellipse cx="1069" cy="790" rx="21" ry="3"/></g></g>
    <g class="weather-layer weather-mist"><path class="weather-cloudbank" fill="url(#mist)" opacity=".68" d="M0 397h1600v262H0z"/><path fill="url(#mist)" opacity=".39" d="M0 544h1600v177H0z"/></g>
    <g class="weather-layer weather-frost"><path class="weather-cloudbank" fill="url(#ice-mist)" opacity=".79" d="M0 372h1600v324H0z"/><path fill="url(#ice-mist)" opacity=".56" d="M0 551h1600v241H0z"/></g>
    <g class="weather-layer weather-snow" fill="#edf6fb">${fallingSnow}</g>
    <g class="weather-layer weather-heat"><path fill="url(#heat-haze)" opacity=".42" d="M0 180h1600v470H0z"/><path class="weather-shimmer" fill="none" stroke="#ffedbb" stroke-linecap="round" stroke-width="1.6" d="M550 560q18-4 49 0m38 10q39-4 70 0m117-12q21-4 46-1m102 7q17-3 40 0m-345 29q31-3 59 1m54 13q41-4 72 0m-287 16q25-3 44 0"/></g>`;
}
