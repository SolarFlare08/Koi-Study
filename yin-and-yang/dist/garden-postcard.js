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
    text.textContent=title;group.append(background,text);copy.append(group);
  }
  return new XMLSerializer().serializeToString(copy);
}

export async function postcardPng(scene,caption){
  const source=new Blob([postcardSvg(scene,caption)],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(source);
  try{
    const image=new Image();
    image.src=url;await image.decode();
    const canvas=document.createElement('canvas');
    canvas.width=postcardSize.width;canvas.height=postcardSize.height;
    canvas.getContext('2d').drawImage(image,0,0);
    return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG encoding failed')),'image/png'));
  }finally{URL.revokeObjectURL(url);}
}
