// Replace this module to change the scenery. Tool behavior lives in app.js;
// object anchors, illustrations, and the decorative world live here alone.
const pagoda=`<svg viewBox="0 0 250 300" fill="none"><ellipse cx="128" cy="280" rx="115" ry="13" fill="#47695a" opacity=".12"/><path d="M36 271h180l12 10H24z" fill="#7a8272"/><path d="M47 260h157l12 11H36z" fill="#b2ad95"/><path d="M65 190h123v70H65z" fill="#d6cbb0"/><path d="M75 194v65m103-65v65m-52-65v65" stroke="#635e4c" stroke-width="7"/><path d="M88 204h24v47H88zm51 0h24v47h-24z" fill="#a8ad92"/><path d="M72 251h109v8H72z" fill="#8b8064"/><path d="M59 177h135v17H59z" fill="#615f4b"/><path d="M30 180q43-12 55-39h84q15 30 54 39-45 15-97 15t-96-15" fill="#3f5548"/><path d="M31 180q95 16 192 0" stroke="#87947a" stroke-width="3"/><path d="M83 114h84v38H83z" fill="#c4b89a"/><path d="M93 115v34m31-34v34m33-34v34" stroke="#6c6751" stroke-width="5"/><path d="M58 111q39-12 47-40h39q11 28 48 40-28 12-67 12t-67-12" fill="#3f5548"/><path d="M59 111q66 12 132 0" stroke="#8a987e" stroke-width="2.5"/><path d="M120 70V52q5-7 10 0v18" fill="#615f4b"/><path d="M126 52V37" stroke="#615f4b" stroke-width="3"/><circle cx="126" cy="35" r="4" fill="#a58460"/><path d="M60 279h136" stroke="#e0d7c2" stroke-width="2"/><path d="M76 267h105" stroke="#ece4d2" opacity=".5"/></svg>`;
const tree=`<svg viewBox="0 0 350 330" fill="none"><ellipse cx="190" cy="314" rx="120" ry="10" fill="#234e41" opacity=".12"/><path d="M165 311q19-40 12-80-9-54 19-100l13-46-5 66q-25 50-13 87 4 26 0 73z" fill="#5e6650"/><path d="M185 248q-20-58-69-75l-33-39 40 27q48 10 69 54m0-24q27-40 63-43l34-35-25 45q-38 11-68 63" stroke="#5e6650" stroke-width="7" stroke-linecap="round"/><path d="M188 163q-28-38-64-53m77 17q18-36 41-46" stroke="#5e6650" stroke-width="5"/><g fill="#547564"><path d="M42 143q-1-19 26-25-5-24 22-27 6-26 35-18 20-18 41 2 24-5 30 16 26 13 8 33-27 20-65 15-55 22-97 4"/><path d="M168 74q-7-22 19-30 3-29 28-25 20-18 41 1 32-4 31 20 29 11 16 32-29 22-64 8-45 16-71-6"/><path d="M228 146q-11-21 15-33 1-22 24-22 19-20 40-1 30-6 31 20 19 16 0 31-22 16-53 10-37 14-57-5"/></g><g fill="#668875" opacity=".8"><path d="M47 137q15-21 41-12 20-15 45-4 26-13 55-1-41 18-72 13-38 18-69 4"/><path d="M177 68q21-17 43-10 30-15 69 3-30 19-59 8-25 12-53-1"/></g><g id="blossoms"></g><path d="M142 315q47-17 76 0" stroke="#728069" stroke-width="2"/></svg>`;
const lantern=`<svg viewBox="0 0 110 250" fill="none"><path d="M55 0v74" stroke="#645e4d" stroke-width="1.5"/><g class="lantern-sway"><path d="M43 73h24v9H43z" fill="#765c45"/><path d="M42 82q-19 12-17 35t19 36h23q18-12 19-36T68 82z" fill="#b97559"/><path d="M47 83q-12 39 0 69m16-69q12 39 0 69" stroke="#d69c79" stroke-width="2" opacity=".7"/><path d="M55 84v66" stroke="#e6b58a" opacity=".6"/><path d="M42 152h26v7H42z" fill="#765c45"/><path d="M55 159v37m-3-13v15m6-15v15" stroke="#b97559" stroke-width="2"/><path d="M47 107h16m-8-6v25m-7-10h14" stroke="#f3d2a7" stroke-width="1.4" opacity=".6"/></g></svg>`;
const stones=`<svg viewBox="0 0 160 110"><ellipse cx="83" cy="84" rx="66" ry="10" fill="#425b4a" opacity=".12"/><path d="M23 56 52 36 109 32 137 55 125 78 61 86 19 72z" fill="#b9b4a0"/><path d="m23 56 38 13 64-7 12-7-12 23-64 8-42-14z" fill="#a3a58f"/><path d="m34 54 22-12 50-3 16 13" fill="none" stroke="#dcd6c1" stroke-width="2"/><path d="m68 47-5 13m12-12-5 12m12-13-4 13" stroke="#818974" stroke-width="2"/></svg>`;
const lake=`<svg viewBox="0 0 140 85" fill="none"><g stroke="#e9eee0" stroke-width="1.6" opacity=".9"><ellipse cx="70" cy="44" rx="55" ry="12"/><ellipse cx="70" cy="44" rx="33" ry="7"/><path d="M63 38q-1-14 6-23m0 16 14-4v13" stroke-linecap="round"/><ellipse cx="64" cy="39" rx="5" ry="3" fill="#e9eee0"/><ellipse cx="78" cy="41" rx="5" ry="3" fill="#e9eee0"/></g></svg>`;
export const objects = [
  {id:'pagoda',label:'The focus pavilion',hint:'Timer & intention',className:'pagoda',art:pagoda},
  {id:'tasks',label:'One step at a time',hint:'Your tasks',className:'path-stone',art:stones},
  {id:'music',label:'A little company',hint:'Your Spotify',className:'lake',art:lake},
  {id:'notes',label:'Let the thought go',hint:'Distraction notes',className:'lantern',art:lantern},
  {id:'progress',label:'Small things grow',hint:'Today’s progress',className:'tree',art:tree}
];
export function renderLandscape() {
return `<svg class="world" viewBox="0 0 1600 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><defs>
<linearGradient id="sky" x2="0" y2="1"><stop stop-color="#f4f1e8"/><stop offset="1" stop-color="#e8eadb"/></linearGradient>
<linearGradient id="water" x2="0" y2="1"><stop stop-color="#b8cec0"/><stop offset="1" stop-color="#90b6a8"/></linearGradient>
<linearGradient id="mist" x2="0" y2="1"><stop stop-color="#edf0e5" stop-opacity="0"/><stop offset=".6" stop-color="#edf0e5" stop-opacity=".6"/><stop offset="1" stop-color="#edf0e5" stop-opacity="0"/></linearGradient>
</defs><path fill="url(#sky)" d="M0 0h1600v1000H0z"/>
<circle cx="1255" cy="260" r="54" fill="#dfc4a3" opacity=".38"/>
<g fill="#cbd5c4"><path d="M0 525q52-49 100-110l53-67q15-18 32 3l85 114 52 42 72 89H0z"/><path d="m1070 572 88-103 31-55q14-26 28-7l57 69 68-104q15-21 27-2l46 75 61 48 67 91z"/></g>
<g fill="#b5c7b4"><path d="M0 586V390l47-83q17-25 34-2l42 77 38-27q11-9 25 8l106 148 87 51 66 74H0z"/><path d="m1085 641 87-83 53-84 54 32 75-117q19-31 37-7l40 69 59-101q17-28 33-4l77 122v173z"/></g>
<path d="M0 640V468l72-31 74 82 57-113q15-24 29 0l51 66 54 15 88 122 101 44z" fill="#96b29d"/>
<path d="M1051 651q53-68 95-78l68-91q14-16 28 5l41 52 77-46 72 76 78-40 90 15v153z" fill="#9db8a3"/>
<path d="M0 588q160-18 316 25t289 9 330-7 344 5 321-29v170H0z" fill="#d9e2d2"/>
<path d="M0 549q256 44 487 37t558-4 555-20v100H0z" fill="url(#mist)"/>
<path d="M0 704q127-71 280-39t275 13q247-48 441-35t388 7q125-16 216-52v402H0z" fill="url(#water)"/>
<g class="water-lines" stroke="#e5ecdf" stroke-width="1.5" fill="none" opacity=".52"><path d="M603 719h166m74-32h162m180 35h177M728 769h195m123-9h193m-750 53h135m159 40h169m190-29h216m100 46h116M675 920h161m83-18h212"/><path d="M1010 698h55m228 79h49m-709 65h54m345 43h41m-16-142h55"/></g>
<path d="M0 626q109-54 221-20 70 20 145 29t130 65q42 26 112 28 61 2 85 20-74 36-197 29-163-11-273 40L0 860z" fill="#7d9c7f"/>
<path d="M0 715q183-23 297 37t212 15q87-30 164-1-130 3-208 55L257 927H0z" fill="#98ab88"/>
<path d="M1600 717q-127-26-240 27t-162 80q-74 52-140 64l-62 112h604z" fill="#63866c"/>
<path d="M1600 827q-136-63-270 13t-248 160h518z" fill="#789474"/>
<path d="M0 862q149-61 297-16 138 41 234 8 123-40 212 15-121 14-145 45-25 34 69 86H0z" fill="#426a53"/>
<path d="M0 918q181-76 377-24 87 31 176 25l57 81H0z" fill="#345b47"/>
<path d="M496 733q-35 16 22 30t35 26q-20 13-56 22t-47 22q-16 18 53 29t109 27q60 23 6 49t-19 62h161q-85-36-55-58t-4-50q-29-30-121-43t-73-30q10-12 49-22t35-23q-4-19-61-24t-34-17z" fill="#c5c3a8"/>
<g fill="#aaaF95" stroke="#7d9179" stroke-width="1" opacity=".86"><path d="m487 737 25-6 31 5-21 8-28-1z"/><path d="m527 748 25-3 29 7-20 8-29-5z"/><path d="m554 769 30-8 29 4-15 8-32 6z"/><path d="m516 793 29-12 35-1-15 10-32 10z"/><path d="m476 817 28-12 29-1-15 11-29 13z"/><path d="m474 837 24-12 32 4 12 14-38 3z"/><path d="m531 851 26-7 34 9-15 13-36-4z"/><path d="m598 876 28-10 33 10-18 15-30-1z"/><path d="m640 908 17-16 33 10 7 17-38 4z"/><path d="m611 938 31-16 39 8-15 20-38 7z"/><path d="m608 970 25-13 38 6 18 23-47 5z"/></g>
<g fill="#52735b"><path d="m306 625 15-51 14 51h-9v29h-10v-29z"/><path d="m338 634 12-40 13 40h-8v25h-10v-25z"/><path d="m103 613 21-68 20 68h-13v33h-14v-33z"/></g>
<g fill="#355f4d"><path d="m1466 730 17-55 18 55h-12v28h-11v-28z"/><path d="m1503 739 22-74 24 74h-17v34h-13v-34z"/></g>
<g stroke="#777f6b" fill="none" stroke-width="1.5" opacity=".65"><path d="m1047 329 9-4 8 4m20 8 7-4 7 4m-43 12 6-3 7 3"/></g>
<g fill="#d8dbc1" opacity=".8"><ellipse cx="274" cy="862" rx="3" ry="2"/><ellipse cx="284" cy="870" rx="2" ry="2"/><ellipse cx="296" cy="860" rx="2" ry="2"/><ellipse cx="1182" cy="909" rx="2" ry="2"/></g>
</svg>`;
}
export function blossomMarkup(count) {
  const points=[[105,102],[248,51],[279,121],[150,106],[206,58],[308,116],[80,121],[262,139],[229,32],[174,93],[124,85],[290,100]];
  return points.slice(0,Math.min(count,12)).map(([x,y],i)=>`<g class="blossom" style="animation-delay:${i*.06}s" transform="translate(${x} ${y})"><path d="M0-6C5-12 10-6 5-2 14 1 10 8 4 5 3 14-5 11-4 5-12 8-14 0-6-2-12-8-4-12 0-6" fill="#d8a28c"/><circle r="2" fill="#f2d8ab"/></g>`).join('');
}
