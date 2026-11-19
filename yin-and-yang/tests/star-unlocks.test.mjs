import test from 'node:test';
import assert from 'node:assert/strict';
import {gardenStarProgress,starConstellations} from '../dist/garden-growth.js';
import {gardenGrowthMarkup} from '../dist/scenery.js';

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
