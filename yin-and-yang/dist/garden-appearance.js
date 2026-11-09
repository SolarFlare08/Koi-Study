export const lightingOptions={session:'Follow timer',day:'Day',night:'Night'};
export const seasonOptions={
  spring:{name:'Spring',detail:'Blossoms',colors:['#83a78a','#d992a0']},
  summer:{name:'Summer',detail:'Jade greens',colors:['#588373','#b6c98c']},
  autumn:{name:'Autumn',detail:'Copper leaves',colors:['#c38255','#e3b371']},
  winter:{name:'Winter',detail:'Frost & snow',colors:['#81a3b3','#e5eef2']}
};
export const weatherBySeason={
  spring:{petals:'Petal breeze',rain:'Spring showers',mist:'Morning mist'},
  summer:{clear:'Clear skies',heat:'Summer heat',rain:'Warm rain'},
  autumn:{leaves:'Leaf gusts',mist:'Lake mist',rain:'Drizzle'},
  winter:{snow:'Snow flurries',frost:'Freezing fog',clear:'Crisp skies'}
};
export const weatherInterval=8*60*1000;

export function loadAppearance(value,now=Date.now()) {
  const lighting=Object.hasOwn(lightingOptions,value?.lighting)?value.lighting:'session';
  const season=Object.hasOwn(seasonOptions,value?.season)?value.season:'summer';
  const weather=Object.hasOwn(weatherBySeason[season],value?.weather)?value.weather:'auto';
  const weatherSince=Number.isFinite(value?.weatherSince)?value.weatherSince:now;
  return {lighting,season,weather,weatherSince};
}

export function gardenWeather({season,weather,weatherSince},now=Date.now()) {
  const cycle=Object.keys(weatherBySeason[season]);
  const slot=Math.floor(Math.max(0,now-weatherSince)/weatherInterval);
  return weather==='auto'?cycle[slot%cycle.length]:weather;
}

export function sceneProgress(progress,lighting,reduced) {
  if (lighting==='day') return .43;
  if (lighting==='night') return 1;
  return reduced&&progress>0&&progress<1?.43:progress;
}

