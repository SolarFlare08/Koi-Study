const props={
  bridge:`<ellipse cy="5" rx="57" ry="6" fill="#345e64" opacity=".19"/>
    <path d="M-56 1Q-43-5-27-17C-10-33 11-33 29-16Q44-5 56 1L52 6H25C21-9 10-17 0-17S-21-9-25 6H-52Z" fill="#9eab9d" stroke="#607a78" stroke-width="1.4"/>
    <path d="M-51 0Q-41-6-25-19C-8-33 9-33 26-19Q42-7 51 0" fill="none" stroke="#d1ceaf" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M-47-1q-1-5-1-7m10 3-2-8m14 0-2-9m13 1-1-8m16 4v-8m15 11 1-8m12 14 2-8m10 16 2-7m10 11 1-6" fill="none" stroke="#708880" stroke-width="1.7"/>
    <path d="M-24 3Q-17-17 0-17Q17-17 24 3" fill="none" stroke="#516e6c" stroke-width="1.8"/>
    <path d="M-12 9h34m-46 3h21m27 2h18" stroke="#d9ddc7" opacity=".56" stroke-linecap="round"/>`,
  dock:`<path d="M-49 4l15-9 80 1 8 4-20 9Z" fill="#3d6969" opacity=".25"/>
    <path d="M-45-4v12m11-15V6m7-5v14m62-16v11m8-19v13" stroke="#665d4e" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M-49-6l20-11 77 1-21 13Z" fill="#aa9876" stroke="#625f52" stroke-width="1.3"/>
    <path d="M-39-7l22-10m-8 11 21-10m-8 10 21-10M1-6l21-10M14-5l21-11" stroke="#786c56" opacity=".77"/>
    <path d="M-47-8q10-10 19-9m55 14 20-12" fill="none" stroke="#d0b38a" stroke-width="1.4"/>`,
  lantern:`<ellipse cy="1" rx="20" ry="4" fill="#3e6566" opacity=".23"/>
    <path d="M-13 0h26l-2 3h-22ZM-5-5h10V0H-5Z" fill="#74877f"/>
    <path d="M-2-18h4v13h-4Z" fill="#a1ab94"/>
    <path d="M-6-27H6v10H-6Z" fill="#758879" stroke="#566d64"/>
    <rect x="-3" y="-25" width="6" height="6" rx=".6" fill="#b8986a"/>
    <path d="M-11-27q8-2 11-8 3 6 11 8Z" fill="#607b72"/>
    <path d="M0-35v-3" stroke="#a7b199" stroke-width="1.5"/>`,
  bamboo:`<ellipse cy="0" rx="24" ry="4" fill="#3a605e" opacity=".22"/>
    <path d="M-14 0q0-38-9-69M-4 0q-2-44 1-81M6 0q-1-40 11-76M13 0q8-33 19-54" fill="none" stroke="#6f865d" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M-20-48l-5 1m10 20-6 1m17-30h-6m5 28h-5m15-11 6 2m0-26 5 2m4 43 5 2m0-25 5 3" stroke="#435f53" stroke-width="1.3"/>
    <path d="M-20-49q-10-16-24-13 11 11 24 13m4 17q-8-11-21-12 8 9 21 12m10-24q-8-18-20-22 6 14 20 22m3-10q7-10 19-12-7 9-19 12
    m6 13q10-10 23-10-9 8-23 10m11-8q11-11 25-12-7 8-25 12m-2 22q9-15 26-17-8 11-26 17m9 16q10-11 22-10-8 7-22 10" fill="#80966e"/>
    <path d="M-20-49q13-11 22-7-9 7-22 7m16 13q-10-12-22-12 10 9 22 12m16-5q-10-11-19-10 6 8 19 10m13-6q5-10 16-13-5 12-16 13" fill="#4f7565"/>`,
  pine:`<ellipse cy="1" rx="28" ry="6" fill="#375f5f" opacity=".17"/>
    <path d="M-17 0q17-6 23-19 8-16 7-27 3-12 15-18M5-20q-4-16-17-20m26-4q14 1 27-5M7-13Q2-3 13 0Z" fill="none" stroke="#625f50" stroke-width="4.7" stroke-linecap="round"/>
    <path d="M2-63C14-77 29-77 42-67Q51-69 58-61Q42-55 23-57Q9-56 2-63ZM21-48Q38-63 52-54Q62-56 70-49Q61-41 38-43Q25-43 21-48ZM-37-39Q-27-53-11-49Q-1-48 6-41Q-9-32-37-39Z" fill="#4d756d"/>
    <path d="M-28-41Q-16-49-5-44M15-64q14-8 27-1m-7 16q13-6 24-2" fill="none" stroke="#9ca991" opacity=".69" stroke-width="1.4" stroke-linecap="round"/>`,
  plum:`<ellipse cy="0" rx="26" ry="5" fill="#47776e" opacity=".19"/>
    <path d="M-8 1q10-15 9-36T13-62M1-26q-8-7-21-15m22 2q10-6 24-4m-8 1 10-14M4-50q-6-9-14-12" fill="none" stroke="#795d54" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M-28-42q10-9 19-2 5-1 8 4-2 7-17 7-11 0-10-9ZM-17-64q12-13 24-2 7-1 9 5-4 8-20 6-8 0-13-9ZM13-58q14-12 26-1 3 5-4 8-12 4-22-7ZM13-41q9-9 20-6 11 1 11 7-7 8-20 6-7-1-11-7Z" fill="#c58b93"/>
    <path d="M-24-42q9-5 14 0m-1-22q9-6 17-1m13 8q8-5 15-1m-12 17q11-6 17 0" fill="none" stroke="#f0b8b0" stroke-linecap="round" stroke-width="3.2"/>
    <path d="M-19-8q4-3 8 0-5 3-8 0m41-5q4-4 10-3-5 5-10 3" fill="#d8a19e"/>`,
  rocks:`<ellipse cy="4" rx="40" ry="8" fill="#45696b" opacity=".21"/>
    <path d="M-31 0-19-10 0-12 18-5 23 3H-24ZM11 2l13-11 15 3 9 9-20 3ZM-47 4l9-5 12 2 4 5-13 2Z" fill="#748c88"/>
    <path d="M-31 0-19-10 0-12 9-8-5-4-22-3ZM20-5l7-4 12 3-8 3ZM-44 3l6-4 10 2-8 2Z" fill="#a5b1a0"/>
    <path d="M-14 8h24m17 2h9m-66-1h12" stroke="#c8d6c4" stroke-width="1" stroke-linecap="round" opacity=".55"/>`,
  reeds:`<ellipse rx="29" ry="4" fill="#668777" opacity=".23"/>
    <path d="M-15 0q-3-26-15-42m17 42q-2-43 3-58m8 57q3-28 16-46m-10 48q9-36 32-45M2 0q1-24-12-41m-5 40q-15-20-26-24m51 26q15-18 30-21" stroke="#9fa477" stroke-width="1.9" fill="none" stroke-linecap="round"/>
    <path d="M-30-42l-5-8m25-8 1-8m23 19 4-8m18 11 5-6" stroke="#b59b73" stroke-width="3.2" stroke-linecap="round"/>`,
  lilies:`<path d="M-7-2c-4-9-31-11-40-3-7 8 15 13 28 10l-5-5Zm22 3c8-8 29-9 37-3 8 7-14 13-26 10l5-5ZM-10 8c4-5 24-5 28-1 6 5-9 10-20 7l5-3Z" fill="#83a185"/>
    <path d="M-28-4q-9-3-10-10 7 0 11 6-1-9 4-13 7 7 4 13 3-5 10-6-3 8-11 10Z" fill="#d9a7a0"/>
    <path d="M-26-6q0-4 3-7l4 6Z" fill="#f0ceb4"/>
    <path d="M-45 9q15 3 29 1m41 4q11-1 24-4" fill="none" stroke="#cadbc3" stroke-linecap="round" opacity=".61"/>`,
  redbridge:`<ellipse cy="5" rx="61" ry="6" fill="#3d6265" opacity=".22"/>
    <path d="M-57 0Q0-48 57 0L51 6Q0-32-51 6Z" fill="#a4604f"/>
    <path d="M-60-5Q0-52 60-5M-58-11Q0-60 58-11" stroke="#774c48" stroke-width="2.6" fill="none"/>
    <path d="M-55 6v-19m12 10v-18m15 12v-20m15 16v-22m13 22v-24m14 25v-22m15 26v-20m15 29v-20m12 30v-20" stroke="#a76853" stroke-width="2"/>
    <path d="M-43 11h24m34 3h26m-54 3h20" stroke="#d1c4a6" opacity=".64" stroke-linecap="round"/>`,
  maple:`<ellipse cy="3" rx="30" ry="5" fill="#526f69" opacity=".22"/>
    <path d="M1 2q-4-20 2-39t-5-30M1-22q-9-16-24-25M4-36q14-12 28-20" stroke="#685b4f" stroke-width="4.4" fill="none" stroke-linecap="round"/>
    <path d="M-37-48q-9-7 5-16 3-9 20-9 9-13 25-6 18-1 22 11 14 3 12 15 1 13-17 14-6 8-24 3-16 4-30-3-14 1-13-9Z" fill="#ab7260"/>
    <path d="M-30-53q1-11 17-10 4-9 20-8 17 0 20 8-10 0-17 6-15-4-25 2-9 5-15 2Z" fill="#c68b68"/>
    <path d="M28-39q-11 11-24 3-17 6-26-3 14-8 22-7 12-6 28 7Z" fill="#8e6258"/>
    <path d="M-21-20q6-2 8 2-4 3-8-2m52 3q5-3 9-2-2 5-9 2Z" fill="#cb9a74"/>`,
  cascade:`<ellipse cy="8" rx="51" ry="7" fill="#4a7878" opacity=".36"/>
    <path d="M-45 3-35-21-22-30-18-47 5-52 24-41 33-17 46 2 32 8-24 9Z" fill="#718b88"/>
    <path d="M-43 3-35-21-22-30-12-33-7-25-23-19-21-7-34 3Zm50-54 17 10 9 24 13 19-15-1-13-17-1-22Z" fill="#a0aea0"/>
    <path d="M-16-43q17 5 30 1-3 16-12 24 1 17 16 24Q4 11-16 5l7-14-3-13Z" fill="#afcec6"/>
    <path d="M-6-41q2 12-4 19 7 16-1 26m14-44q1 14-5 20 0 14 9 24M-32 11q18 6 49 4m-10 5h22" fill="none" stroke="#e0e9d7" stroke-width="2" stroke-linecap="round" opacity=".77"/>`,
  floater:`<ellipse cy="5" rx="30" ry="5" fill="none" stroke="#cbd8bc" opacity=".53"/>
    <path d="M-20 0Q0-8 20 0L12 5h-24Z" fill="#777c61"/>
    <path d="M-8-3l2-16h12l2 16Z" fill="#ca9b65" stroke="#8a7159" stroke-width="1.2"/>
    <path d="M-7-19h14m-15 16H8m-8-16v16" stroke="#9b7961"/>
    <path d="M-24 11h16m14-1h16" stroke="#d3d4b5" stroke-linecap="round" opacity=".63"/>`,
  wheel:`<ellipse cy="8" rx="40" ry="4" fill="#547a79" opacity=".29"/>
    <path d="M-33 5-28-35m45 40-4-40m-43 0h43" fill="none" stroke="#776a55" stroke-width="4"/>
    <circle cx="0" cy="-20" r="25" fill="none" stroke="#8a765a" stroke-width="6"/>
    <path d="M0-48v56m-28-28h56m-48-20 40 40m-40 0 40-40" stroke="#a58963" stroke-width="2.5"/>
    <circle cy="-20" r="5" fill="#715f50"/><path d="M-38 11h18m15 3h27" stroke="#cddbc5" opacity=".7" stroke-linecap="round"/>`,
  crane:`<ellipse cy="1" rx="23" ry="3.2" fill="#467176" opacity=".18"/>
    <path d="M-5-20q2 11 0 20m8-20q2 9 8 15l5 1" fill="none" stroke="#596f66" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M-25-23q19 2 30-6 4-6 0-10-9-9-1-16 5-4 11-2 4 2 3 5-8-2-9 4-1 2 4 6 8 9 2 16-9 11-29 8Z" fill="#e4e4ce"/>
    <path d="M-23-22q13 1 21-8 3-4 5-4-1 14-12 16Z" fill="#758886"/>
    <path d="M16-54l14 3-13 2Z" fill="#897a5e"/><ellipse cx="14" cy="-55" rx="3" ry="1.5" fill="#b27662"/>`
};
export const gardenPropArtwork=kind=>props[kind];
const floaterGlow='<ellipse cy="-10" rx="25" ry="19" fill="url(#lamp-halo)"/><path d="M-6-4l2-14h8l2 14Z" fill="#ffd193"/>';
const lanternGlow='<circle cy="-22" r="19" fill="url(#lamp-halo)"/><rect x="-3" y="-25" width="6" height="6" rx=".6" fill="#ffcf89"/>';
export function gardenPropTransform({x,y,size}){
  const scale=Math.round(size*(.79+(y-446)/1000))/100;
  return `translate(${x} ${y}) scale(${scale})`;
}
export function renderGardenProps(items,lights=false){
  return [...items].sort((a,b)=>a.y-b.y).map(item=>{
    const art=lights?({lantern:lanternGlow,floater:floaterGlow}[item.kind]||''):props[item.kind];
    return art?`<g data-garden-prop="${item.id}" data-prop-type="${item.kind}" transform="${gardenPropTransform(item)}">${art}</g>`:'';
  }).join('');
}
