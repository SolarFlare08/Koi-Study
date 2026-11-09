import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CROCHET_KEY,loadCrochet,logYarnUse} from '../dist/crochet.js';

test('yarn use updates the stash and linked project together across reloads',()=>{
  const storageFor=data=>({getItem:key=>key===CROCHET_KEY?JSON.stringify(data):null});
  const data=loadCrochet(storageFor({
    yarn:[{id:'merino',name:'Merino',grams:120}],
    projects:[{id:'swatch',name:'Willow swatch',rows:6,goal:12,yarnIds:['merino','missing']},
      {id:'scarf',name:'Scarf',yarnIds:[]}]
  }));
  assert.equal(logYarnUse(data,{yarnId:'merino',projectId:'scarf',grams:25}),false);
  assert.equal(logYarnUse(data,{yarnId:'merino',projectId:'swatch',grams:130}),false);
  assert.equal(data.yarn[0].grams,120);
  assert.equal(logYarnUse(data,{yarnId:'merino',projectId:'swatch',grams:25},1000),true);
  const saved=loadCrochet(storageFor(data));
  assert.equal(saved.yarn[0].grams,95);
  assert.deepEqual(saved.projects[0].yarnIds,['merino']);
  assert.equal(saved.projects[0].rows,6);
  assert.equal(saved.usage[0].projectId,'swatch');
  assert.equal(saved.usage[0].grams,25);
});
