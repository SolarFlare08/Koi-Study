import test from 'node:test';
import assert from 'node:assert/strict';
import {gardenStarProgress,starConstellations} from '../dist/garden-growth.js';
import {defaultGardenDesign} from '../dist/garden-layout.js';
import {createShootingStars,gardenGrowthMarkup,gardenLandmarkPositions,renderLandscape,starLight} from '../dist/scenery.js';

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

test('the sky stars and earned constellations paint before the landscape in every mountain style',()=>{
  for(const mountains of ['classic','summit','karst','valley','twins','rounded','highlands']){
    const svg=renderLandscape({...defaultGardenDesign,mountains});
    const ridge=svg.indexOf('data-garden-piece="mountains"');
    assert.ok(ridge>0);
    for(const id of ['stars','garden-growth-stars','garden-day-sky','garden-meteor']){
      const stars=svg.indexOf(`id="${id}"`);
      assert.ok(stars>=0&&stars<ridge);
    }
  }
});

test('every lit constellation point replaces exactly one earned star in live and historical art',()=>{
  const history=Array.from({length:40},(_,i)=>({kind:'test',sourceId:String(i),title:'Exam '+i,day:new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10)}));
  for(const count of [2,3,5,6,20,21,24,37,38,40]){
    const through=history[count-1].day;
    const progress=gardenStarProgress(history,{through});
    const {stars:art,swallows}=gardenGrowthMarkup(history,{through});
    assert.equal((art.match(/class="garden-earned-star"/g)||[]).length,progress.free);
    assert.equal((art.match(/class="sky-star-point"/g)||[]).length,progress.assigned.size);
    assert.equal(progress.free+progress.assigned.size,count);
    assert.equal((swallows.match(/class="day-swallow"/g)||[]).length,count);
    assert.equal(progress.assigned.size,progress.unlocked.reduce((sum,item)=>sum+item.starIndices.length,0));
  }
  assert.equal(gardenStarProgress(history).free,2);
  const courses=[{stars:history.slice(0,3).map((item,index)=>({item,index}))}];
  assert.doesNotMatch(gardenGrowthMarkup(history,{through:history[2].day,courses}).stars,/stroke="#9ec6d8"/);
});

test('shooting stars wait for dark skies, while an on-demand preview can play in daylight',()=>{
  const attributes=new Map([['opacity',0]]);
  const trail=new Map();
  const scene={
    querySelector:selector=>({setAttribute:(name,value)=>(selector==='.meteor-tail'?trail:attributes).set(name,value)}),
    querySelectorAll:()=>[{isPointInFill:({y})=>y>=420}],
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
  stars.frame(115800,night);
  assert.equal(attributes.get('opacity'),1);
  assert.ok(Number(attributes.get('transform').split(/[ ()]+/)[2])>420);
  assert.match(trail.get('transform'),/^scale\(/);
  stars.frame(115960,night);
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
