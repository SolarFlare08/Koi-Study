export function rubricPoints(value){
  if(value===null||value===undefined||String(value).trim()==='')return null;
  const number=Number(value);
  return Number.isFinite(number)&&number>=0&&number<=10000?Math.round(number*100)/100:null;
}

export function parseRubric(text){
  return text.split(/\r?\n/).map(line=>line.trim().replace(/^(?:[-*•]\s+|\d+[.)]\s+)/,''))
    .filter(Boolean).slice(0,100).map(line=>{
      const suffix=line.match(/^(.+?)(?:\s*\|\s*(\d+(?:\.\d+)?)\s*(?:pts?\.?|points?)?|\s*\(\s*(\d+(?:\.\d+)?)\s*(?:pts?\.?|points?)?\s*\))$/i);
      const prefix=!suffix&&line.match(/^(\d+(?:\.\d+)?)\s*(?:pts?\.?|points?)\s*[:–—-]\s*(.+)$/i);
      const text=suffix?suffix[1]:prefix?prefix[2]:line;
      return {text:text.trim().slice(0,160),points:rubricPoints(suffix?(suffix[2]||suffix[3]):prefix?prefix[1]:null)};
    });
}

export function rubricSummary(subtasks){
  const scored=subtasks.filter(sub=>rubricPoints(sub.points)!==null);
  if(!scored.length)return '';
  const remaining=scored.filter(sub=>!sub.done).reduce((sum,sub)=>sum+Number(sub.points),0);
  const total=scored.reduce((sum,sub)=>sum+Number(sub.points),0);
  return `${Number(remaining.toFixed(2))} of ${Number(total.toFixed(2))} rubric points unfinished`;
}
