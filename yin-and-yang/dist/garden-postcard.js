const svgNamespace='http://www.w3.org/2000/svg';
export const postcardSize={width:1600,height:900};
const copiedStyles=['display','visibility','opacity','fill','fill-opacity','stroke','stroke-opacity','stroke-width','stroke-linecap',
  'stroke-linejoin','stop-color','stop-opacity','clip-path','filter','transform','transform-origin','transform-box','translate','rotate','scale'];

export function postcardSvg(scene,caption=''){
  const copy=scene.cloneNode(true);
  const originals=[...scene.querySelectorAll('*')];
  [...copy.querySelectorAll('*')].forEach((node,index)=>{
    const computed=getComputedStyle(originals[index]);
    for(const key of copiedStyles){
      const value=computed.getPropertyValue(key);
      if(!value)continue;
      // Preserve references to gradients and clips inside the exported SVG.
      node.style.setProperty(key,value.replace(/url\(["']?[^)"']*#([^)"']+)["']?\)/g,'url(#$1)'));
    }
  });
  copy.removeAttribute('class');
  copy.setAttribute('width',postcardSize.width);
  copy.setAttribute('height',postcardSize.height);
  const frame=(copy.getAttribute('viewBox')||'0 0 1600 900').split(' ').map(Number);
  const title=String(caption).trim().replace(/\s+/g,' ').slice(0,90);
  if(title){
    const group=document.createElementNS(svgNamespace,'g');
    const background=document.createElementNS(svgNamespace,'rect');
    const text=document.createElementNS(svgNamespace,'text');
    const context=document.createElement('canvas').getContext('2d');
    context.font='34px Georgia';
    const width=Math.min(1440,Math.ceil(context.measureText(title).width)+84);
    for(const [key,value] of Object.entries({x:(1600-width)/2,y:796,width,height:66,rx:10,fill:'#132438','fill-opacity':'.82'}))background.setAttribute(key,value);
    for(const [key,value] of Object.entries({x:800,y:839,'text-anchor':'middle','font-family':'Georgia, serif','font-size':34,fill:'#fff0d8'}))text.setAttribute(key,value);
    if(width===1440){text.setAttribute('textLength',1356);text.setAttribute('lengthAdjust','spacingAndGlyphs');}
    const [x,y,sceneWidth]=frame,scale=sceneWidth/postcardSize.width;
    group.setAttribute('transform','translate('+x+' '+y+') scale('+scale+')');
    text.textContent=title;group.append(background,text);copy.append(group);
  }
  return new XMLSerializer().serializeToString(copy);
}

async function drawScene(scene,caption,context,...placement){
  const source=new Blob([postcardSvg(scene,caption)],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(source);
  try{
    const image=new Image();
    image.src=url;await image.decode();
    context.drawImage(image,...placement);
  }finally{URL.revokeObjectURL(url);}
}
function encodePostcard(canvas){
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG encoding failed')),'image/png'));
}
export async function postcardPng(scene,caption){
  const canvas=document.createElement('canvas');
  canvas.width=postcardSize.width;canvas.height=postcardSize.height;
  await drawScene(scene,caption,canvas.getContext('2d'),0,0);
  return encodePostcard(canvas);
}
export async function weeklyPostcardPng(scene,week,caption){
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1060;
  const ctx=canvas.getContext('2d');
  await drawScene(scene,'',ctx,0,0,1600,900);
  ctx.fillStyle='#203c40';ctx.fillRect(0,900,1600,160);
  ctx.fillStyle='#bed5ca';ctx.font='26px sans-serif';
  ctx.fillText(week.range,48,948);ctx.textAlign='right';
  ctx.fillText(week.total+' min focused · '+week.sessions+' completed sessions',1552,948);
  ctx.textAlign='left';ctx.fillStyle='#fff0d8';ctx.font='38px Georgia';
  ctx.fillText(caption.trim()||'A week in the Garden',48,1016,1504);
  return encodePostcard(canvas);
}

export async function comparisonPostcardPng(before,after,labels,caption=''){
  const canvas=document.createElement('canvas');
  canvas.width=3200;canvas.height=1040;
  const context=canvas.getContext('2d');
  context.fillStyle='#f4ead9';context.fillRect(0,0,canvas.width,canvas.height);
  const positions=[48,1616],width=1536,height=864;
  await Promise.all([before,after].map((scene,index)=>drawScene(scene,'',context,positions[index],72,width,height)));
  context.textAlign='center';context.fillStyle='#263e3a';context.font='34px Georgia';
  context.fillText(caption.trim()||'Garden before and after',1600,49,3000);
  context.font='30px Georgia';
  labels.forEach((label,index)=>context.fillText(label,positions[index]+width/2,995,width));
  return encodePostcard(canvas);
}
