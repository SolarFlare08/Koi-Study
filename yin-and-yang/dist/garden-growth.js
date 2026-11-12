export const landmarkTypes = {
  project:{name:'Tree',event:'Project finished',mark:'sprout'},
  book:{name:'Lantern',event:'Book finished',mark:'book'},
  test:{name:'Star',event:'Test completed',mark:'spark'},
  milestone:{name:'Cairn',event:'Milestone reached',mark:'target'}
};

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
    for(const [field,limit] of [['result',100],['detail',1000]]){
      if(typeof item[field]==='string'&&item[field].trim())entry[field]=item[field].trim().slice(0,limit);
    }
    history.push(entry);
  }
  return history;
}

export function earnGardenDetail(history, kind, sourceId, title, day, {result,detail}={}) {
  if (gardenReward(history, kind, sourceId)) return history;
  const [entry] = loadGardenGrowth([{kind, sourceId, title, day, result, detail}]);
  return entry ? [...history, entry] : history;
}
