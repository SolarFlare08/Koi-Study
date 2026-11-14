export const landmarkTypes = {
  project:{name:'Tree',event:'Project finished',mark:'sprout'},
  book:{name:'Lantern',event:'Book finished',mark:'book'},
  test:{name:'Star',event:'Test completed',mark:'spark'},
  milestone:{name:'Cairn',event:'Milestone reached',mark:'target'}
};
export const gardenZones={west:'West shore',island:'Lake island',east:'Pagoda shore'};

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
