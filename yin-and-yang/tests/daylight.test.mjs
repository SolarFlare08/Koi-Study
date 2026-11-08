import {test} from 'node:test';
import assert from 'node:assert/strict';
import {daylight,sunPosition} from '../dist/daylight.js';
import {animateLandscape} from '../dist/scenery.js';

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
