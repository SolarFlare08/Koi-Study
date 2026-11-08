// One continuous day per focus session. Values are independent of frame rate.
const frames = [
  [0,   '#172a43', '#354359', '#60526c', .62, 1],
  [.12, '#b9cbd0', '#ebc9af', '#f7bc86', .08, .15],
  [.3,  '#c3dfe2', '#e5e6d0', '#f4e8c5', 0, 0],
  [.55, '#b2d5df', '#e0e6d4', '#efe8ca', 0, 0],
  [.74, '#b5b9cb', '#edbc9e', '#f8b176', .05, .05],
  [.86, '#7b86a6', '#ce8b89', '#ed986f', .2, .4],
  [.95, '#374865', '#68647f', '#a37683', .48, .9],
  [1,   '#172a43', '#354359', '#60526c', .62, 1]
];
const rgb = hex => hex.match(/[0-9a-f]{2}/gi).map(n=>parseInt(n,16));
export const blend = (a,b,t) => `rgb(${rgb(a).map((v,i)=>Math.round(v+(rgb(b)[i]-v)*t)).join(',')})`;
export function sunPosition(progress,width=1600,height=900){
  const scale=Math.max(width/1600,height/900);
  const apex=Math.max(57,(900-height/scale)/2+50);
  const radius=482-apex,angle=Math.PI*Math.max(0,Math.min(1,progress));
  return {x:800-radius*Math.cos(angle),y:482-radius*Math.sin(angle)};
}
export function daylight(progress){
  const p=Math.max(0,Math.min(1,progress));
  let i=0;while(i<frames.length-2 && p>frames[i+1][0])i++;
  const a=frames[i],b=frames[i+1],v=(p-a[0])/(b[0]-a[0]),t=v*v*(3-2*v);
  const ramp=x=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v);};
  const sunlight=ramp(p/.06)*ramp((1-p)/.08);
  const night=a[5]+(b[5]-a[5])*t;
  const lamplight=ramp((night-.05)/.37);
  return {p,top:blend(a[1],b[1],t),middle:blend(a[2],b[2],t),horizon:blend(a[3],b[3],t),shade:a[4]+(b[4]-a[4])*t,night,sunlight,lamplight};
}
export function ridge(points,bottom=650){
  let d=`M${points[0].join(' ')}`;
  for(let i=0;i<points.length-1;i++){
    const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],e=points[Math.min(points.length-1,i+2)];
    d+=`C${b[0]+(c[0]-a[0])/6} ${b[1]+(c[1]-a[1])/6} ${c[0]-(e[0]-b[0])/6} ${c[1]-(e[1]-b[1])/6} ${c[0]} ${c[1]}`;
  }
  return d+`V${bottom}H${points[0][0]}Z`;
}
