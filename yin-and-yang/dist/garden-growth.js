const kinds = new Set(['project', 'book']);

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
    if (!kinds.has(item?.kind) || typeof item.sourceId !== 'string' || !item.sourceId ||
      typeof item.title !== 'string' || !item.title.trim() || !validDay(item.day)) continue;
    const {kind, sourceId, title, day} = item;
    const key = JSON.stringify([kind, sourceId]);
    if (seen.has(key)) continue;
    seen.add(key);
    history.push({kind, sourceId, title: title.trim().slice(0, 500), day});
  }
  return history;
}

export function earnGardenDetail(history, kind, sourceId, title, day) {
  if (gardenReward(history, kind, sourceId)) return history;
  const [detail] = loadGardenGrowth([{kind, sourceId, title, day}]);
  return detail ? [...history, detail] : history;
}
