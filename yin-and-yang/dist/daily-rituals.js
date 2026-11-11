export const rituals = {
  crochet: {label:'Crochet', art:'<circle cx="10" cy="10" r="6"/><path d="m5 7 8 8m-5-11 8 8m-2 3c1 4 4 4 6 3"/>'},
  annotate: {label:'Annotate', art:'<path d="M10 6c-2-2-5-2-7-1v11c2-1 5-1 7 1 2-2 5-2 7-1V5c-2-1-5-1-7 1v11M5.5 8h2m-2 3h2m5-3h2m-2 3h2"/>'},
  journal: {label:'Journal', art:'<rect x="5" y="3.5" width="11" height="13" rx="2"/><path d="M8 4v12m2.5-8h3m-3 3h3M3 7h3m-3 6h3"/>'}
};
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function loadDailyRituals(value) {
  const result={};
  for(const [date,day] of Object.entries(value||{})){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!day||typeof day!=='object')continue;
    const journal=day.journal, crochet=day.crochet, annotate=day.annotate;
    const str=(value,limit)=>typeof value==='string'?value.slice(0,limit):'';
    result[date]={
      ...(typeof journal?.done==='boolean'?{journal:{done:journal.done,stamp:Number.isFinite(journal.stamp)?journal.stamp:0}}:{}),
      ...(crochet?{crochet:{done:crochet.done===true,projectId:str(crochet.projectId,200)}}:{}),
      ...(annotate?{annotate:{done:annotate.done===true,title:str(annotate.title,250),author:str(annotate.author,200),chapters:str(annotate.chapters,3000),
        ...(typeof annotate.position==='string'?{position:str(annotate.position,100)}:{}),
        ...(typeof annotate.goal==='string'?{goalType:annotate.goalType==='page'?'page':'chapter',goal:str(annotate.goal,100)}:{})}}:{})
    };
  }
  return result;
}

export function ritualComplete(kind,item,journalStamp=0){
  return item?.done===true||kind==='journal'&&journalStamp>0&&item?.stamp!==journalStamp;
}

export function dailyRitualMarkup(date,day,journalStamp,reading){
  return `<div class="daily-rituals" role="group" aria-label="Daily rituals for ${date}">${Object.entries(rituals).map(([kind,{label,art}])=>{
    const done=ritualComplete(kind,day?.[kind],journalStamp);
    const target=reading?.goal? `Goal · ${reading.goalType==='page'?'Page':'Chapter'} ${reading.goal}` : '';
    const last=reading?.last?`Last · ${reading.last}`:'';
    const details=kind==='annotate'?[target,last].filter(Boolean):[];
    return `<div class="daily-ritual" data-ritual="${kind}" data-ritual-date="${date}" data-done="${done}">
      <button type="button" class="ritual-open" data-ritual-open aria-label="Open ${label} for ${date}" title="Open ${label}"><svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${art}</svg><span>${label}</span></button>
      <button type="button" class="ritual-check" data-ritual-check aria-label="${label} complete for ${date}" aria-pressed="${done}" title="${done?'Mark incomplete':'Mark complete'}"><svg viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m3.2 7.1 2.5 2.5 5.1-5.2"/></svg></button>
      ${details.length?`<div class="ritual-reading-details">${details.map(line=>`<small title="${escape(line)}">${escape(line)}</small>`).join('')}</div>`:''}
    </div>`;
  }).join('')}</div>`;
}
