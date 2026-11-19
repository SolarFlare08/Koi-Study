export const landmarkTypes = {
  project:{name:'Tree',event:'Project finished',mark:'sprout'},
  book:{name:'Lantern',event:'Book finished',mark:'book'},
  test:{name:'Star',event:'Test completed',mark:'spark'},
  milestone:{name:'Cairn',event:'Milestone reached',mark:'target'}
};
export const gardenZones={west:'West shore',island:'Lake island',east:'Pagoda shore'};

export const starConstellations=[
  {id:'crane',name:'The Crane',threshold:3,x:721,y:128,
    points:[[-52,9],[-22,-5],[1,7],[25,-17],[45,-21],[17,18],[-27,29]],
    lines:[[0,1,2,3,4],[2,5,6]],description:'A crane crossing the quiet lake.'},
  {id:'kite',name:'The River Kite',threshold:6,x:830,y:197,
    points:[[0,-28],[27,-4],[0,22],[-25,-4],[14,33],[5,45]],
    lines:[[0,1,2,3,0],[2,4,5]],description:'A paper kite with a tail caught in the river wind.'},
  {id:'gate',name:'The Mountain Gate',threshold:10,x:565,y:225,
    points:[[-43,-21],[-12,-28],[16,-27],[43,-21],[-18,-4],[18,-4],[-18,29],[18,29]],
    lines:[[0,1,2,3],[1,4,6],[2,5,7],[4,5]],description:'An open gate on the way into the mountains.'},
  {id:'boat',name:'The Lantern Boat',threshold:15,x:1041,y:116,
    points:[[-45,16],[-26,32],[22,34],[48,14],[0,21],[0,-28],[29,7]],
    lines:[[0,1,2,3,4,0],[4,5,6,4]],description:'A sail and a small lantern on still water.'},
  {id:'fox',name:'The Silver Fox',threshold:21,x:1156,y:221,
    points:[[-43,15],[-28,-6],[-12,6],[11,7],[24,-15],[27,-30],[36,-16],[45,-27],[48,-9],[57,0]],
    lines:[[0,1,2,3,4,5,6,7,8,9],[2,0]],description:'A fox looking back over its shoulder under moonlight.'}
];

export function gardenStarProgress(history,{through='',visible}={}){
  const stars=history.map((item,index)=>({item,index})).filter(({item,index})=>
    item.kind==='test'&&(!through||item.day<=through)&&(!visible||visible.has(index)))
    .sort((a,b)=>a.item.day.localeCompare(b.item.day)||a.index-b.index);
  return {count:stars.length,next:starConstellations.find(item=>item.threshold>stars.length),
    unlocked:starConstellations.filter(item=>item.threshold<=stars.length).map(item=>({...item,day:stars[item.threshold-1].item.day}))};
}

export function landmarkPlacement(kind,zone,group){
  if(kind==='test'||!Object.hasOwn(gardenZones,zone))return {};
  const name=typeof group==='string'?group.trim().slice(0,80):'';
  return {zone,...(name?{group:name}:{})};
}

function validDay(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === day;
}

export function landmarkInscription(kind,value){
  return ['project','book','milestone'].includes(kind)&&typeof value==='string'
    ?value.trim().replace(/\s+/g,' ').slice(0,90):'';
}

export function gardenReward(history, kind, sourceId) {
  return history.find(item => item.kind === kind && item.sourceId === sourceId);
}

export function loadGardenGrowth(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const history = [];
  for (const item of value) {
    if (!Object.hasOwn(landmarkTypes,item?.kind) || typeof item.sourceId !== 'string' || !item.sourceId ||
      typeof item.title !== 'string' || !item.title.trim() || !validDay(item.day)) continue;
    const {kind, sourceId, title, day} = item;
    const key = JSON.stringify([kind, sourceId]);
    if (seen.has(key)) continue;
    seen.add(key);
    const entry={kind, sourceId, title: title.trim().slice(0, 500), day};
    Object.assign(entry,landmarkPlacement(kind,item.zone,item.group));
    const inscription=landmarkInscription(kind,item.inscription);
    if(inscription)entry.inscription=inscription;
    for(const [field,limit] of [['result',100],['detail',1000]]){
      if(typeof item[field]==='string'&&item[field].trim())entry[field]=item[field].trim().slice(0,limit);
    }
    if(kind==='test'&&typeof item.courseId==='string'&&item.courseId){
      entry.courseId=item.courseId;
      if(typeof item.courseName==='string')entry.courseName=item.courseName.trim().slice(0,200);
    }
    history.push(entry);
  }
  return history;
}

export function earnGardenDetail(history, kind, sourceId, title, day, metadata={}) {
  if (gardenReward(history, kind, sourceId)) return history;
  const [entry] = loadGardenGrowth([{...metadata,kind,sourceId,title,day}]);
  return entry ? [...history, entry] : history;
}

export function gardenRange(history,from='',through=''){
  return history.map((item,index)=>({item,index})).filter(({item})=>
    (!from||item.day>=from)&&(!through||item.day<=through));
}

export function gardenComparison(history,before,after,today){
  if(!validDay(before)||!validDay(after)||before>=after||after>today)return null;
  const earlier=gardenRange(history,'',before).length;
  const later=gardenRange(history,'',after).length;
  return {before,after,earlier,later,added:later-earlier};
}

export function gardenCourses(history,projects){
  const byProject=new Map(projects.map(project=>[project.id,project]));
  const byExam=new Map(projects.flatMap(project=>(project.exams||[]).map(exam=>[exam.id,project])));
  const courses=new Map();
  history.forEach((item,index)=>{
    if(item.kind!=='test')return;
    const project=byExam.get(item.sourceId)||byProject.get(item.courseId);
    const id=project?.id||item.courseId;
    if(!id)return;
    if(!courses.has(id))courses.set(id,{id,name:project?.name||item.courseName||'Course',stars:[]});
    courses.get(id).stars.push({item,index});
  });
  return [...courses.values()].map(course=>({...course,stars:course.stars.sort((a,b)=>a.item.day.localeCompare(b.item.day)||a.index-b.index)}));
}
