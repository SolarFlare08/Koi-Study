import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CROCHET_KEY,crochetResumeDetails,loadCrochet,logYarnUse,yarnShoppingList,yarnStashYards,yarnSubstitution} from '../dist/crochet.js';
import {createBackup,readBackup} from '../dist/backup.js';
import {loadCheckpointPhotos} from '../dist/checkpoint-photos.js';
import {freshState} from '../dist/state.js';

test('project resume uses the latest checkpoint and shows only upcoming instructions',()=>{
  const project={id:'cardigan',name:'Cardigan',rows:20,rowInstruction:{row:20,text:'Finish the body'},
    counters:[{id:'sleeve',name:'Left sleeve',count:17,instruction:{row:18,text:'Decrease at both ends'}}],
    checkpoints:[
      {id:'new',at:2000,note:'Switch to 4 mm hook',rows:20,counterId:'sleeve',counters:[{id:'sleeve',name:'Left sleeve',count:17}]},
      {id:'old',at:1000,note:'Start the sleeve',rows:19,counters:[]}
    ]};
  const [saved]=loadCrochet({getItem:()=>JSON.stringify({projects:[project]})}).projects;
  const {checkpoint,counts,instructions}=crochetResumeDetails(saved);
  assert.equal(checkpoint?.note,'Switch to 4 mm hook');
  assert.equal(counts,'Left sleeve 17');
  assert.deepEqual(instructions,[{name:'Left sleeve',row:18,text:'Decrease at both ends'}]);
});

test('shopping combines matching dye lots and credits yarn already used without counting finished work',()=>{
  const storage={getItem:()=>JSON.stringify({
    yarn:[{id:'a',name:'Merino',colorway:'Fern',grams:60},{id:'b',name:'Merino',colorway:'fern',grams:40},{id:'c',name:'Cotton',colorway:'Fern',grams:200}],
    projects:[{id:'p',name:'Cardigan',status:'making',yarnIds:['a'],yarnNeeds:{a:130}},{id:'q',name:'Hat',status:'planned',yarnIds:['b'],yarnNeeds:{b:70}},
      {id:'r',name:'Finished scarf',status:'finished',yarnIds:['a'],yarnNeeds:{a:500}}],
    usage:[{id:'use',yarnId:'b',projectId:'p',grams:20,at:1}]
  })};
  const [row,...other]=yarnShoppingList(loadCrochet(storage));
  assert.equal(row.onHand,100);
  assert.equal(row.needed,180);
  assert.equal(row.shortage,80);
  assert.deepEqual(row.projects.map(project=>project.name),['Cardigan','Hat']);
  assert.deepEqual(other,[]);
});

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

test('row instructions keep their target numbers through Stitchbook backup and restore',()=>{
  const storage={getItem:key=>key===CROCHET_KEY?JSON.stringify({
    projects:[{id:'p',name:'Cardigan',rows:17,rowInstruction:{text:'  Decrease at both ends.  '},
      counters:[{id:'s',name:'Sleeve',count:10,instruction:{row:12,text:'Switch to ribbing.'}},
        {id:'legacy',name:'Hem',count:8}]}],
    yarn:[{id:'a',name:'Wool',grams:75,skeinYards:220,skeinGrams:100}],usage:[]
  }):null};
  const {crochet}=readBackup(JSON.stringify(createBackup(freshState(),storage,[])));
  const [project]=crochet.projects;
  assert.deepEqual(project.rowInstruction,{row:18,text:'Decrease at both ends.'});
  assert.deepEqual(project.counters[0].instruction,{row:12,text:'Switch to ribbing.'});
  assert.equal(project.counters[1].instruction,undefined);
  assert.equal(yarnStashYards(crochet.yarn[0]),165);
});

test('substitution credits partial skeins and rounds only the balance up to whole skeins',()=>{
  const yarn={grams:75,skeinYards:220,skeinGrams:100};
  const yards=yarnStashYards(yarn);
  assert.equal(yards,165);
  assert.equal(yarnStashYards({grams:100,skeinYards:220}),0);
  assert.deepEqual(yarnSubstitution(1200,220,yards+155),{totalSkeins:6,remainingYards:880,toBuy:4});
  assert.deepEqual(yarnSubstitution(165,220,yards),{totalSkeins:1,remainingYards:0,toBuy:0});
  assert.equal(yarnSubstitution(0.1+0.2,0.1).toBuy,3);
  assert.equal(yarnSubstitution(1200,0),null);
  assert.equal(yarnSubstitution(1200,220,-1),null);
  assert.equal(yarn.grams,75);
});

test('checkpoint photos are limited to resized JPEG records and included in Stitchbook backups',()=>{
  const photo={name:'sleeve.jpg',src:'data:image/jpeg;base64,/9j/2Q=='};
  const raw=[{src:'data:image/svg+xml;base64,AAAA'},{src:'data:image/jpeg;base64,'+'A'.repeat(100_000)},photo,photo,photo,photo];
  assert.deepEqual(loadCheckpointPhotos(raw),[photo,photo,photo]);
  const project={id:'p',name:'Sleeves',checkpoints:[{id:'c',at:1,note:'Seam pickup',rows:18,photos:[photo]}]};
  const storage={getItem:key=>key===CROCHET_KEY?JSON.stringify({projects:[project]}):null};
  const loaded=loadCrochet(storage).projects[0].checkpoints[0];
  assert.deepEqual(loaded.photos,[photo]);
  assert.equal(loaded.note,'Seam pickup');
  const backup=readBackup(JSON.stringify(createBackup(freshState(),storage,[])));
  assert.deepEqual(backup.crochet.projects[0].checkpoints[0].photos,[photo]);
});
