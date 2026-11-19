import test from 'node:test';
import assert from 'node:assert/strict';
import {gardenStarProgress,starConstellations} from '../dist/garden-growth.js';
import {createShootingStars,gardenGrowthMarkup,gardenLandmarkPositions,starLight} from '../dist/scenery.js';

test('earned constellations unlock at dated star milestones and keep fixed sky positions',()=>{
  const history=Array.from({length:21},(_,i)=>({kind:'test',sourceId:String(i),title:'Test',day:'2026-11-'+String(i+1).padStart(2,'0')})).reverse();
  history.push({kind:'project',sourceId:'one',title:'Project',day:'2026-11-01'});
  assert.equal(gardenStarProgress(history,{through:'2026-11-02'}).next.id,'crane');
  const first=gardenStarProgress(history,{through:'2026-11-03'}).unlocked;
  assert.equal(first.length,1);
  assert.equal(first[0].day,'2026-11-03');
  assert.deepEqual(gardenStarProgress(history).unlocked.map(({id,x,y})=>[id,x,y]),starConstellations.map(({id,x,y})=>[id,x,y]));
  const art=gardenGrowthMarkup(history,{through:'2026-11-06'}).stars;
  assert.match(art,/data-constellation-art="kite"/);
  assert.doesNotMatch(art,/data-constellation-art="gate"/);
  assert.doesNotMatch(gardenGrowthMarkup(history,{visible:new Set([19,20,21])}).stars,/data-constellation-art/);
});

test('star brightness follows apparent magnitude and earned stars have separate positions',()=>{
  assert.ok(starLight(.18).radius>starLight(1.64).radius);
  assert.ok(starLight(1.64).opacity>starLight(3.66).opacity);
  assert.equal(starLight(3.66).halo,0);
  const history=Array.from({length:21},(_,i)=>({kind:'test',sourceId:String(i),title:'Test',day:'2026-11-19'}));
  const points=gardenLandmarkPositions(history).map(({position})=>position);
  assert.ok(points.every(([x,y],index)=>points.slice(0,index).every(([a,b])=>Math.hypot(x-a,y-b)>=22)));
  const x=points.map(point=>point[0]);
  assert.ok(Math.max(...x)-Math.min(...x)>1000);
  assert.ok(starConstellations.every(item=>item.magnitudes.length===item.points.length));
});

test('shooting stars wait for dark skies, while an on-demand preview can play in daylight',()=>{
  const attributes=new Map([['opacity',0]]);
  const scene={
    querySelector:()=>({setAttribute:(name,value)=>attributes.set(name,value)}),
    getBoundingClientRect:()=>({width:1600,height:900}),
    viewBox:{baseVal:{x:0,y:0,width:1600,height:900}}
  };
  const stars=createShootingStars(scene,()=>.2);
  const day={allowed:true,dark:false},night={...day,dark:true};
  stars.frame(0,day);
  stars.frame(60000,night);
  stars.frame(113999,night);
  assert.equal(attributes.get('opacity'),0);
  stars.frame(114000,night);
  stars.frame(114400,night);
  const position=attributes.get('transform');
  assert.ok(attributes.get('opacity')>0);
  stars.frame(114700,night);
  assert.notEqual(attributes.get('transform'),position);
  stars.frame(115150,night);
  assert.equal(attributes.get('opacity'),0);
  stars.frame(116000,night);
  assert.equal(attributes.get('opacity'),0);

  stars.preview(117000);
  stars.frame(117540,day);
  assert.ok(attributes.get('opacity')>0);
  stars.frame(117600,{allowed:false,dark:false});
  assert.equal(attributes.get('opacity'),0);
  stars.frame(117800,day);
  assert.equal(attributes.get('opacity'),0);
});
