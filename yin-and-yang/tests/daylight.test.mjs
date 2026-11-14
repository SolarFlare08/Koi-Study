import {test} from 'node:test';
import assert from 'node:assert/strict';
import {daylight,sunPosition} from '../dist/daylight.js';
import {animateLandscape} from '../dist/scenery.js';
import {gardenWeather,loadAppearance,loadGardenLooks,sceneProgress,sceneryWeatherLayers,scheduledAppearance,weatherInterval} from '../dist/garden-appearance.js';

test('sunrise brightens into day; sunset darkens into night',()=>{
  assert.ok(daylight(0).shade>daylight(.12).shade);
  assert.equal(daylight(.5).shade,0);
  assert.ok(daylight(.86).shade>daylight(.74).shade);
  assert.ok(daylight(1).shade>daylight(.95).shade);
  assert.equal(daylight(1).night,1);
});
test('lighting stays continuous across each phase boundary',()=>{
  for(const p of [.12,.3,.55,.74,.86,.95]){
    const a=daylight(p-.000001),b=daylight(p+.000001);
    assert.ok(Math.abs(a.shade-b.shade)<.0001);
    for(const key of ['top','middle','horizon'])assert.equal(a[key],b[key]);
  }
});
test('the end of focus matches its start with all sunlight hidden',()=>{
  const {p:start,...dawn}=daylight(0),{p:end,...night}=daylight(1);
  assert.deepEqual(dawn,night);
  assert.equal(dawn.sunlight,0);
  assert.ok(daylight(.01).sunlight<daylight(.03).sunlight);
  assert.ok(daylight(.99).sunlight<daylight(.96).sunlight);
});
test('lamps fade out through dawn and light up before sunset',()=>{
  assert.equal(daylight(0).lamplight,1);
  assert.ok(daylight(.08).lamplight>daylight(.16).lamplight);
  assert.equal(daylight(.5).lamplight,0);
  assert.ok(daylight(.8).lamplight>0);
  assert.ok(daylight(.88).lamplight>daylight(.8).lamplight);
  assert.equal(daylight(1).lamplight,1);
});
test('reset immediately returns the sun and lighting to sunrise; noon is high',()=>{
  const nodes=new Map();
  globalThis.innerWidth=1600;globalThis.innerHeight=900;
  globalThis.document={querySelector:selector=>{
    if(!nodes.has(selector))nodes.set(selector,{attrs:{},style:{setProperty(){}},setAttribute(name,value){this.attrs[name]=value;}});
    return nodes.get(selector);
  }};
  animateLandscape(0,.93,false);
  animateLandscape(16,0,false);
  const sun=nodes.get('#travelling-sun');
  assert.equal(sun.attrs.cx,375);
  assert.equal(sun.attrs.cy,482);
  assert.equal(nodes.get('#night-shade').attrs.opacity,daylight(0).shade);
  assert.equal(nodes.get('#evening-lights').attrs.opacity,1);
  animateLandscape(32,.5,false);
  assert.ok(sun.attrs.cy<70);
  assert.equal(nodes.get('#evening-lights').attrs.opacity,0);
  animateLandscape(48,1,false);
  assert.ok(sun.attrs.cy>480);
  assert.equal(sun.attrs.opacity,0);
  assert.equal(nodes.get('#sun-halo').attrs.opacity,0);
  assert.equal(nodes.get('#shine').attrs.opacity,0);
});
test('sun follows a circular arc on standard and wide screens',()=>{
  for(const [w,h] of [[1600,900],[1920,800],[390,844]]){
    const start=sunPosition(0,w,h),radius=800-start.x;
    for(const p of [.1,.25,.5,.75,.9,1]){
      const pos=sunPosition(p,w,h);
      assert.ok(Math.abs(Math.hypot(pos.x-800,pos.y-482)-radius)<1e-8);
    }
  }
});
test('fixed lighting stays still and saved seasons load independently',()=>{
  assert.deepEqual(loadAppearance({lighting:'day',season:'winter'},0),{lighting:'day',season:'winter',weather:'auto',weatherSince:0,motion:'gentle',palette:'seasonal'});
  assert.deepEqual(loadAppearance({lighting:'unknown',season:'spring'},0),{lighting:'session',season:'spring',weather:'auto',weatherSince:0,motion:'gentle',palette:'seasonal'});
  assert.equal(sceneProgress(.12,'day',false),sceneProgress(.86,'day',false));
  assert.equal(sceneProgress(.12,'night',false),1);
  assert.equal(sceneProgress(.12,'session',false),.12);
  assert.equal(sceneProgress(.12,'session',true),sceneProgress(.86,'session',true));
});
test('named Garden looks preserve color and motion and default to silence',()=>{
  const [look]=loadGardenLooks([{id:'fall',name:' Late Autumn Dusk ',appearance:{lighting:'dusk',palette:'amber',season:'autumn',weather:'mist',motion:'still'}}]);
  assert.equal(look.name,'Late Autumn Dusk');
  assert.deepEqual(look.appearance,{lighting:'dusk',palette:'amber',season:'autumn',weather:'mist',motion:'still'});
  assert.deepEqual(look.ambient,{rain:0,water:0,wind:0});
  assert.equal(sceneProgress(.1,'dusk',false),.87);
});
test('rain carries mist into the next weather and scenery motion survives timed looks',()=>{
  const base=loadAppearance({season:'summer',motion:'still'},0);
  const schedule={enabled:true,presets:[{time:'08:00',season:'autumn',lighting:'night',weather:'auto'}]};
  assert.equal(scheduledAppearance(base,schedule,new Date(2026,10,13,9)).motion,'still');
  assert.equal(sceneProgress(.9,'session',false,'still'),.43);
  assert.equal(sceneProgress(.9,'night',false,'still'),1);
  assert.equal(gardenWeather(base,weatherInterval*2),'rain');
  assert.equal(gardenWeather(base,weatherInterval*3),'mist');
  assert.ok(sceneryWeatherLayers('summer','rain').mist>0);
  assert.equal(sceneryWeatherLayers('summer','clear').overcast,0);
  assert.ok(sceneryWeatherLayers('summer','clear').fireflies>0);
});
test('seasonal weather rotates every eight minutes and manual weather holds across reloads',()=>{
  const start=1000;
  const winter=loadAppearance({season:'winter'},start);
  assert.equal(gardenWeather(winter,start+weatherInterval-1),'snow');
  assert.equal(gardenWeather(winter,start+weatherInterval),'frost');
  assert.equal(gardenWeather(winter,start+weatherInterval*2),'clear');
  assert.equal(gardenWeather(winter,start+weatherInterval*3),'snow');
  const summer=loadAppearance({season:'summer',weather:'snow'},start);
  assert.equal(gardenWeather(summer,start+weatherInterval),'heat');
  const saved=loadAppearance({...summer,weather:'rain'},start+weatherInterval);
  assert.equal(saved.weatherSince,start);
  assert.equal(gardenWeather(saved,start+weatherInterval*8),'rain');
});
