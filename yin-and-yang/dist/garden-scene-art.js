export function pine(x,y,scale=1){
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

const swallowInk=['#526e70','#5b747a','#425e65'];
export function daySwallow(x,y,scale,index,heading=index%3===0?-1:1,crossing=0){
  const ink=swallowInk[index%swallowInk.length];
  const period=crossing?38+index*9:13+index*7%13;
  const delay=crossing?-period*(.25+index*.24):-(index*7%17)*.86;
  const drift=heading*(crossing?crossing/scale:11+index%5);
  const beat=(3.8+index%5*.22).toFixed(2);
  return `<g class="day-swallow" transform="translate(${x} ${y}) scale(${scale})"
    fill="none" stroke="${ink}" stroke-linecap="round" opacity=".54"
    style="--flight-period:${period}s;--flight-delay:${delay.toFixed(2)}s;--flight-drift:${drift.toFixed(1)}px;--wing-period:${beat}s">
    <g class="day-swallow-glide${crossing?' day-swallow-crossing':''}">
      <g transform="scale(${heading} 1)">
        <path class="day-swallow-wings" d="M-11-3.3Q-4.8-5.2-.8.5Q3.6-3.6 9.5-2.1" stroke-width="2"/>
        <path d="M-5.2 1.9-.7.6-4.6 3.8" stroke-width="1.25" opacity=".75"/>
      </g>
    </g>
  </g>`;
}

export function rock(x,y,scale,flip=1,face="url(#rock-face)"){
  return `<g transform="translate(${x} ${y}) scale(${scale*flip} ${scale})">
    <ellipse cy="2" rx="43" ry="5" fill="#294f52" opacity=".26"/>
    <path d="M-43-2C-39-10-32-13-25-20Q-17-32-1-30C9-30 15-23 23-22Q35-20 43-5C43-1 29 2 10 2Q-18 3-43-2Z" fill="${face}"/>
    <path d="M-38-5C-25-15-22-27-5-28C6-29 12-24 19-22C5-23-3-17-10-13C-19-8-29-8-38-5Z" fill="#bdc5ad" opacity=".64"/>
    <path d="M-15 0Q-6-8 8-12T29-17Q37-13 43-5C40 0 14 3-15 0Z" fill="#466a65" opacity=".66"/>
    <path d="M-29-12Q-21-14-16-20M4-5q10-3 19-4" stroke="#d4d5be" stroke-linecap="round" fill="none" opacity=".4"/>
  </g>`;
}

export const sceneReeds=(x,y)=>`<g transform="translate(${x} ${y})"><g transform="translate(-1458 -858)"><g class="reed-sway" fill="none" stroke="var(--shore-reed,#a7b69a)" stroke-linecap="round">
  <path d="M1458 858q3-42-16-63m19 63q1-49 24-74m-21 74q10-35 33-47" stroke-width="2"/>
  <path d="M1459 851q-12-27-32-39m36 33q1-27 13-41" stroke-width="1.25" opacity=".8"/>
  <path class="season-layer autumn-scene winter-scene" d="M1440 795l-3-7m48-4 5-7m-61 38-4-5" stroke="#8e7760" stroke-width="3"/>
</g></g></g>`;

export const lakeRipplePath='M0 .52C22 .5 30 .16 55 .23S78 .58 100 .35C80 .7 71 .62 54 .46S24 .64 0 .52Z';
export const moonFace='<path d="M8-20A22 22 0 1 0 20 12A23 23 0 0 1 8-20Z" fill="#e4eef8"/>';
export const starDiamond='<path d="M0-8Q1-1 7 0Q1 1 0 8Q-1 1-7 0Q-1-1 0-8Z" fill="#ffe4a0" stroke="#a7785d" stroke-width=".65"/>';
export const stoneCairn=`<ellipse cy="2" rx="14" ry="4" fill="#335653" opacity=".45"/>
  <path d="M-13 0Q-11-6-3-6Q8-7 13-2L10 1H-9Z" fill="#6e8075"/>
  <path d="M-9-6Q-10-10-3-13Q3-14 8-9L5-6Z" fill="#9aa389"/>
  <path d="M-5-13Q-6-17-1-20Q4-20 6-15L4-13Z" fill="#c2a688"/>`;
export const lowIsland=(fill='var(--shore-upper,#8fae8d)')=>`<path d="M-50 0q24-7 48-6t54 5q-19 7-51 7t-51-6Z" fill="var(--shore-lower,#527e70)" opacity=".76"/>
  <path d="M-45-1q17-7 39-9t51 8q-32 3-52 2t-38-1Z" fill="${fill}"/>`;
export const westCloud=`<path d="M45 211C119 204 143 190 186 188C213 186 224 172 259 172C292 172 297 189 339 190C375 191 407 200 452 199C410 209 366 204 322 207C282 210 263 215 223 211C167 205 102 220 45 211Z"/>
  <path d="M101 225C156 221 206 225 252 219C276 216 301 217 329 221C279 225 244 232 193 229Z" opacity=".65"/>`;
