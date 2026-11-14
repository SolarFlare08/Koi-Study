import {loadSoundSettings} from './garden-audio.js';

export const lightingOptions={session:'Follow timer',day:'Day',dusk:'Dusk',night:'Night'};
export const gardenPalettes={seasonal:'Seasonal',jade:'Jade',amber:'Amber',ink:'Blue ink'};
export const sceneryMotionOptions={still:'Still',gentle:'Gentle',lively:'Lively'};
export const seasonOptions={
  spring:{name:'Spring',detail:'Blossoms',colors:['#83a78a','#d992a0']},
  summer:{name:'Summer',detail:'Jade greens',colors:['#588373','#b6c98c']},
  autumn:{name:'Autumn',detail:'Copper leaves',colors:['#c38255','#e3b371']},
  winter:{name:'Winter',detail:'Frost & snow',colors:['#81a3b3','#e5eef2']}
};
export const weatherBySeason={
  spring:{petals:'Petal breeze',rain:'Spring showers',mist:'Morning mist'},
  summer:{clear:'Clear skies',heat:'Summer heat',rain:'Warm rain',mist:'Lake mist'},
  autumn:{leaves:'Leaf gusts',rain:'Drizzle',mist:'Lake mist'},
  winter:{snow:'Snow flurries',frost:'Freezing fog',clear:'Crisp skies'}
};
export const weatherInterval=8*60*1000;
const seasonalSignatures={spring:'petals',autumn:'leaves',winter:'snow'};
export function sceneryWeatherLayers(season,weather){
  const signature=seasonalSignatures[season];
  return {mist:weather==='mist'?1:weather==='rain'?.32:0,
    signature:signature&&signature!==weather?(weather==='rain'||weather==='frost'?.14:.42):0,
    fireflies:season==='summer'&&weather!=='rain'?(weather==='mist'?.38:.72):0,
    overcast:weather==='rain'?1:weather==='mist'||weather==='frost'?.52:0};
}

export function loadAppearance(value,now=Date.now()) {
  const lighting=Object.hasOwn(lightingOptions,value?.lighting)?value.lighting:'session';
  const season=Object.hasOwn(seasonOptions,value?.season)?value.season:'summer';
  const weather=Object.hasOwn(weatherBySeason[season],value?.weather)?value.weather:'auto';
  const weatherSince=Number.isFinite(value?.weatherSince)?value.weatherSince:now;
  const motion=Object.hasOwn(sceneryMotionOptions,value?.motion)?value.motion:'gentle';
  const palette=Object.hasOwn(gardenPalettes,value?.palette)?value.palette:'seasonal';
  return {lighting,season,weather,weatherSince,motion,palette};
}

export function loadGardenLooks(value){
  const looks=new Map();
  for(const item of Array.isArray(value)?value:[]){
    if(typeof item?.id!=='string'||!item.id||typeof item.name!=='string'||!item.name.trim())continue;
    const {lighting,season,weather,motion,palette}=loadAppearance(item.appearance);
    const {rain,water,wind}=loadSoundSettings(item.ambient);
    looks.set(item.id,{id:item.id,name:item.name.trim().slice(0,80),appearance:{lighting,season,weather,motion,palette},ambient:{rain,water,wind}});
  }
  return [...looks.values()];
}

export function gardenWeather({season,weather,weatherSince},now=Date.now()) {
  const cycle=Object.keys(weatherBySeason[season]);
  const slot=Math.floor(Math.max(0,now-weatherSince)/weatherInterval);
  return weather==='auto'?cycle[slot%cycle.length]:weather;
}

export function loadGardenSchedule(value){
  const presets=new Map();
  for(const item of Array.isArray(value?.presets)?value.presets:[]){
    if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item?.time))continue;
    const {lighting,season,weather,palette}=loadAppearance(item);
    presets.set(item.time,{time:item.time,lighting,season,weather,palette});
  }
  return {enabled:value?.enabled===true,presets:[...presets.values()].sort((a,b)=>a.time.localeCompare(b.time))};
}

export function scheduledAppearance(base,schedule,now=new Date()){
  if(!schedule.enabled||!schedule.presets.length)return base;
  const clock=now.toTimeString().slice(0,5);
  const current=schedule.presets.findLast(item=>item.time<=clock);
  const chosen=current||schedule.presets.at(-1);
  const [hours,minutes]=chosen.time.split(':').map(Number);
  const start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-(current?0:1),hours,minutes);
  return {...chosen,motion:base.motion,weatherSince:start.getTime()};
}

export function sceneProgress(progress,lighting,reduced,motion='gentle') {
  if (lighting==='day') return .43;
  if (lighting==='dusk') return .87;
  if (lighting==='night') return 1;
  if(motion==='still')return .43;
  return reduced&&progress>0&&progress<1?.43:progress;
}

