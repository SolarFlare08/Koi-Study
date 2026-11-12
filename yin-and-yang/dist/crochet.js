import {dayKey} from './state.js';

export const CROCHET_KEY='yin-and-yang.crochet.v1';
const statuses={planned:'Planned',making:'In progress',paused:'Paused',finished:'Finished'};
const weights=['Lace','Fingering','Sport','DK','Worsted','Aran','Bulky','Super bulky','Jumbo'];
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const clean=(value,limit)=>typeof value==='string'?value.trim().slice(0,limit):'';
const whole=(value,max=100000)=>Math.min(max,Math.max(0,Math.trunc(Number(value)||0)));
const color=value=>/^#[\da-f]{6}$/i.test(value)?value:'#ad7d76';
const number=new Intl.NumberFormat().format;
const validTimeLog=({date,minutes})=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&dayKey(new Date(date+'T12:00:00'))===date&&
  Number.isInteger(minutes)&&minutes>=1&&minutes<=1440;
const formatTime=minutes=>[minutes>=60?`${number(Math.floor(minutes/60))} h`:'',minutes%60||!minutes?`${minutes%60} min`:''].filter(Boolean).join(' ');
const patternUrl=value=>{
  try {
    const url=new URL(value);
    return ['https:','http:'].includes(url.protocol)?url.href:'';
  } catch { return ''; }
};
function cleanProject(item){
  const counters=Array.isArray(item.counters)?item.counters.filter(counter=>typeof counter?.id==='string'&&clean(counter.name,60))
    .map(counter=>({id:counter.id,name:clean(counter.name,60),count:whole(counter.count)})):[];
  const checkpoints=Array.isArray(item.checkpoints)?item.checkpoints.filter(point=>typeof point?.id==='string'&&Number.isFinite(point.at)&&clean(point.note,1000))
    .map(point=>({id:point.id,at:point.at,note:clean(point.note,1000),rows:whole(point.rows),
      counters:Array.isArray(point.counters)?point.counters.filter(counter=>clean(counter?.name,60))
        .map(counter=>({name:clean(counter.name,60),count:whole(counter.count)})):[]})):[];
  const patternChanges=Array.isArray(item.patternChanges)?item.patternChanges.filter(change=>
    typeof change?.id==='string'&&Number.isFinite(change.at)&&clean(change.note,1000))
    .map(change=>({id:change.id,at:change.at,row:whole(change.row),note:clean(change.note,1000)})):[];
  const yarnIds=Array.isArray(item.yarnIds)?[...new Set(item.yarnIds.filter(id=>typeof id==='string'))]:[];
  return {id:item.id,name:clean(item.name,100),status:Object.hasOwn(statuses,item.status)?item.status:'planned',
    rows:whole(item.rows),goal:whole(item.goal),hook:clean(item.hook,40),pattern:patternUrl(clean(item.pattern,1000)),
    notes:clean(item.notes,3000),counters,checkpoints,patternChanges,yarnIds,
    yarnNeeds:Object.fromEntries(Object.entries(item.yarnNeeds||{}).filter(([id,grams])=>yarnIds.includes(id)&&Number.isInteger(grams)&&grams>0&&grams<=1000000))};
}
function cleanYarn(item){
  return {id:item.id,name:clean(item.name,100),colorway:clean(item.colorway,75),color:color(item.color),
    grams:whole(item.grams,1000000),weight:weights.includes(item.weight)?item.weight:'',fiber:clean(item.fiber,80),lot:clean(item.lot,45)};
}
export function loadCrochet(storage){
  try {
    const data=JSON.parse(storage.getItem(CROCHET_KEY));
    const records=key=>Array.isArray(data?.[key])?data[key].filter(item=>typeof item?.id==='string'):[];
    const yarn=records('yarn').map(cleanYarn).filter(item=>item.name);
    const yarnIds=new Set(yarn.map(item=>item.id));
    const projects=records('projects').map(cleanProject).filter(item=>item.name);
    for (const project of projects) project.yarnIds=project.yarnIds.filter(id=>yarnIds.has(id));
    const usage=records('usage').filter(item=>typeof item.yarnId==='string'&&Number.isInteger(item.grams)&&item.grams>0&&Number.isFinite(item.at));
    const projectIds=new Set(projects.map(item=>item.id));
    const timeLog=records('timeLog').filter(item=>projectIds.has(item.projectId)&&validTimeLog(item))
      .map(({id,projectId,date,minutes})=>({id,projectId,date,minutes}));
    return {projects,yarn,usage,timeLog};
  } catch { return {projects:[],yarn:[],usage:[],timeLog:[]}; }
}
export function logCrochetTime(data,{projectId,date,minutes}){
  if(!data.projects.some(item=>item.id===projectId)||!validTimeLog({date,minutes})||date>dayKey())return false;
  (data.timeLog??=[]).unshift({id:crypto.randomUUID(),projectId,date,minutes});
  return true;
}
export function logYarnUse(data,{yarnId,projectId='',grams},now=Date.now()){
  const yarn=data.yarn.find(item=>item.id===yarnId);
  const project=data.projects.find(item=>item.id===projectId);
  if (!yarn||!Number.isInteger(grams)||grams<1||grams>yarn.grams||projectId&&!project?.yarnIds.includes(yarnId)) return false;
  yarn.grams-=grams;
  data.usage.push({id:crypto.randomUUID(),yarnId,projectId,grams,at:now});
  return true;
}

export function yarnShoppingList(data){
  const normalized=value=>String(value||'').trim().replace(/\s+/g,' ').toLowerCase();
  const key=yarn=>JSON.stringify([yarn.name,yarn.colorway,yarn.weight].map(normalized));
  const stock=new Map(), yarnById=new Map(data.yarn.map(yarn=>[yarn.id,yarn]));
  for(const yarn of data.yarn){
    const id=key(yarn), row=stock.get(id)||{name:yarn.name,colorway:yarn.colorway,weight:yarn.weight,color:yarn.color,onHand:0,needed:0,projects:[]};
    row.onHand+=yarn.grams;stock.set(id,row);
  }
  for(const project of data.projects){
    if(project.status!=='planned'&&project.status!=='making')continue;
    const targets=new Map();
    for(const yarnId of project.yarnIds){
      const yarn=yarnById.get(yarnId), grams=project.yarnNeeds?.[yarnId];
      if(!yarn||!grams)continue;
      const id=key(yarn);targets.set(id,(targets.get(id)||0)+grams);
    }
    for(const use of data.usage){
      const yarn=yarnById.get(use.yarnId);
      if(use.projectId===project.id&&yarn&&targets.has(key(yarn)))targets.set(key(yarn),targets.get(key(yarn))-use.grams);
    }
    for(const [id,grams] of targets){
      if(grams<=0)continue;
      const row=stock.get(id);row.needed+=grams;row.projects.push({name:project.name,grams});
    }
  }
  return [...stock.values()].filter(row=>row.needed>row.onHand).map(row=>({...row,shortage:row.needed-row.onHand}))
    .sort((a,b)=>(a.colorway||a.name).localeCompare(b.colorway||b.name));
}
const yarnIllustration=`<svg viewBox="0 0 230 125" fill="none" aria-hidden="true">
  <defs><pattern id="stitchwork" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 6 7 0" stroke="#a96c62" opacity=".28" stroke-width="1.1"/></pattern></defs>
  <path d="M14 102C42 91 47 114 74 102C93 93 97 78 102 73" stroke="#ab796b" stroke-width="2.1" stroke-linecap="round"/>
  <path d="M78 34C103 14 151 31 161 57C173 83 152 105 123 105C98 106 69 92 65 72C61 56 67 45 78 34Z" fill="#cda099" stroke="#98645d" stroke-width="1.4"/>
  <path d="M78 34C103 14 151 31 161 57C173 83 152 105 123 105C98 106 69 92 65 72C61 56 67 45 78 34Z" fill="url(#stitchwork)"/>
  <path d="M69 49c17 6 34 22 52 54M74 43c19 5 40 26 57 61M79 38c23 7 44 30 60 65M88 34c24 9 46 32 60 65M97 31c25 9 46 33 59 60M108 30c22 9 39 26 51 46" stroke="#f4d3c4" stroke-width="1.5" stroke-linecap="round"/>
  <path d="m132 68 61-39c8-4 8-12 2-12-4 0-7 3-7 6" stroke="#7f8866" stroke-width="4" stroke-linecap="round"/>
  <path d="M160 86q13 15 29 11m-16-3q1-13 11-16m-5 19q10 1 14 7" stroke="#8f9879" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M37 54v12m-6-6h12m167-9v9m-5-4h10" stroke="#b98769" stroke-width="1.25" stroke-linecap="round"/>
</svg>`;

export function installCrochet({root,storage,notify}){
  let data=loadCrochet(storage),view='projects',statusFilter='all',editor=null,anchor=null;
  const $=selector=>root.querySelector(selector);
  root.innerHTML=`<div class="crochet-wrap">
    <header class="crochet-hero"><div><span>THE CRAFT ROOM</span><h2 id="crochet-heading">Stitchbook</h2><p>Keep your projects, time, row counts, and yarn in one place.</p></div>${yarnIllustration}</header>
    <div class="crochet-navigation"><div class="crochet-tabs" role="group" aria-label="Crochet views"><button type="button" data-crochet-view="projects">Projects</button><button type="button" data-crochet-view="yarn">Yarn stash</button><button type="button" data-crochet-view="shopping">Shopping list</button></div><button type="button" class="crochet-primary" id="crochet-add"></button></div>
    <div id="crochet-content"></div>
  </div><dialog id="crochet-dialog"></dialog>`;
  const content=$('#crochet-content'), dialog=$('#crochet-dialog');
  const add=$('#crochet-add');

  function commit(next){
    try { storage.setItem(CROCHET_KEY,JSON.stringify(next)); }
    catch { notify('Could not save your crochet changes on this device.'); return false; }
    data=next;
    return true;
  }
  function projectCard(project){
    const yarn=project.yarnIds.flatMap(id=>data.yarn.find(item=>item.id===id)||[]);
    const used=data.usage.filter(item=>item.projectId===project.id).reduce((sum,item)=>sum+item.grams,0);
    const worked=data.timeLog.filter(item=>item.projectId===project.id).reduce((sum,item)=>sum+item.minutes,0);
    const percent=project.goal?Math.min(100,Math.floor(project.rows/project.goal*100)):null;
    const checkpoint=project.checkpoints.at(-1);
    const change=project.patternChanges.at(-1);
    return `<article class="crochet-project" data-crochet-id="${escape(project.id)}">
      <div class="crochet-card-heading"><div><span class="crochet-status" data-status="${project.status}">${statuses[project.status]}</span><h3>${escape(project.name)}</h3></div><button type="button" class="crochet-link" data-crochet-edit="projects" aria-label="Edit ${escape(project.name)}">Edit</button></div>
      <div class="crochet-project-meta">${[project.hook?`Hook ${escape(project.hook)}`:'',project.pattern?`<a href="${escape(project.pattern)}" target="_blank" rel="noopener noreferrer">Pattern ↗</a>`:'',used?`${number(used)} g used`:''].filter(Boolean).join('<span aria-hidden="true"> · </span>')||'Project details'}</div>
      <div class="crochet-counter"><div><span>Rows</span><output aria-label="Rows for ${escape(project.name)}">${number(project.rows)}${project.goal?` <small>/ ${number(project.goal)}</small>`:''}</output></div><div class="crochet-counter-buttons"><button type="button" data-row-step="-1" aria-label="Subtract a row from ${escape(project.name)}" ${project.rows?'':'disabled'}>−</button><button type="button" data-row-step="1" aria-label="Add a row to ${escape(project.name)}" ${project.rows>=100000?'disabled':''}>+</button></div></div>
      ${percent===null?'':`<progress aria-label="Row goal progress for ${escape(project.name)}" max="100" value="${percent}"></progress>`}
      <div class="crochet-counters">${project.counters.map(counter=>`<div class="crochet-counter" data-counter-id="${escape(counter.id)}">
        <div><span>${escape(counter.name)}</span><output aria-label="${escape(counter.name)} count">${number(counter.count)}</output></div>
        <div class="crochet-counter-buttons"><button type="button" data-counter-step="-1" aria-label="Decrease ${escape(counter.name)}" ${counter.count?'':'disabled'}>−</button>
        <button type="button" data-counter-step="1" aria-label="Increase ${escape(counter.name)}" ${counter.count>=100000?'disabled':''}>+</button></div>
        <button type="button" class="crochet-link" data-crochet-counter aria-label="Edit ${escape(counter.name)} counter">Edit</button></div>`).join('')}</div>
      <div class="crochet-checkpoint-actions"><button type="button" class="crochet-link" data-crochet-counter>Add counter</button>
        <button type="button" class="crochet-link" data-crochet-checkpoint>${checkpoint?'Checkpoints':'Save checkpoint'}</button></div>
      ${checkpoint?`<div class="crochet-resume"><strong>Resume here</strong><p>${escape(checkpoint.note)}</p><small>${escape(checkpointCounts(checkpoint))}</small></div>`:''}
      <div class="crochet-worked"><span>Time worked <strong>${formatTime(worked)}</strong></span><button type="button" class="crochet-link" data-crochet-time aria-label="Log time for ${escape(project.name)}">Log time</button></div>
      <div class="crochet-worked"><span>Pattern changes <strong>${project.patternChanges.length}</strong></span>
        <button type="button" class="crochet-link" data-crochet-pattern>Log pattern change</button></div>
      ${change?`<p class="crochet-pattern-latest"><strong>Row ${number(change.row)}</strong> · ${escape(change.note)}</p>`:''}
      ${yarn.length?`<ul class="crochet-project-yarn">${yarn.map(item=>`<li><i style="--swatch:${item.color}"></i>${escape(item.colorway||item.name)}</li>`).join('')}</ul>`:''}
      ${project.notes?`<p class="crochet-project-notes">${escape(project.notes)}</p>`:''}
    </article>`;
  }
  function yarnRow(item){
    const linked=data.projects.filter(project=>project.yarnIds.includes(item.id)).length;
    const specs=[item.weight,item.fiber,item.lot?`Lot ${item.lot}`:''].filter(Boolean).join(' · ');
    return `<li class="crochet-yarn-row" data-crochet-id="${escape(item.id)}"><i class="crochet-swatch" style="--swatch:${item.color}" aria-hidden="true"></i>
      <div class="crochet-yarn-name"><h3>${escape(item.name)}</h3><p>${escape([item.colorway,specs].filter(Boolean).join(' · '))||'Yarn details'}${linked?` · ${linked} linked ${linked===1?'project':'projects'}`:''}</p></div>
      <div class="crochet-stock"><strong>${number(item.grams)} g</strong><span>on hand</span></div>
      <div class="crochet-yarn-actions"><button type="button" data-crochet-use ${item.grams?'':'disabled'} aria-label="Log yarn used from ${escape(item.name)}">Log use</button><button type="button" data-crochet-edit="yarn" aria-label="Edit ${escape(item.name)}">Edit</button></div></li>`;
  }
  function render(){
    root.querySelectorAll('[data-crochet-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.crochetView===view)));
    add.textContent=view==='projects'?'+ New project':'+ Add yarn';
    if(view==='shopping'){
      const rows=yarnShoppingList(data);
      content.innerHTML=`<div class="crochet-list-heading"><p>Shortages for planned and in-progress projects</p></div>
        ${rows.length?`<ul class="crochet-yarn-list shopping-shortages">${rows.map(row=>`<li>
          <h3>${escape(row.colorway||row.name)}</h3><p>${escape([row.colorway?row.name:'',row.weight].filter(Boolean).join(' · '))}</p>
          <strong>${number(row.shortage)} g to buy</strong><p>${number(row.needed)} g still needed · ${number(row.onHand)} g on hand</p>
          <ul>${row.projects.map(project=>`<li>${escape(project.name)} · ${number(project.grams)} g</li>`).join('')}</ul></li>`).join('')}</ul>`:
          '<div class="crochet-empty"><h3>No yarn shortages</h3><p>In a project, link yarn and enter its total grams needed to calculate what to buy.</p></div>'}`;
    }else if (view==='projects') {
      const items=data.projects.filter(item=>statusFilter==='all'||item.status===statusFilter);
      const open=data.projects.filter(item=>item.status==='making').length;
      const finished=data.projects.filter(item=>item.status==='finished').length;
      content.innerHTML=`<div class="crochet-list-heading"><p>${open} in progress <span>·</span> ${finished} finished</p><label>Status <select id="crochet-filter"><option value="all">All projects</option>${Object.entries(statuses).map(([key,name])=>`<option value="${key}" ${key===statusFilter?'selected':''}>${name}</option>`).join('')}</select></label></div>
        ${items.length?`<div class="crochet-projects">${items.map(projectCard).join('')}</div>`:`<div class="crochet-empty"><h3>${data.projects.length?'No projects with this status':'Room for your first project'}</h3><p>${data.projects.length?'Choose a different status to see more projects.':'Add a pattern, start counting rows, and link yarn from your stash.'}</p></div>`}`;
    } else {
      const total=data.yarn.reduce((sum,item)=>sum+item.grams,0);
      content.innerHTML=`<div class="crochet-list-heading"><p>${data.yarn.length} ${data.yarn.length===1?'yarn':'yarns'} <span>·</span> ${number(total)} g on hand</p></div>
        ${data.yarn.length?`<ul class="crochet-yarn-list">${data.yarn.map(yarnRow).join('')}</ul>`:'<div class="crochet-empty"><h3>Your yarn basket is empty</h3><p>Add a yarn to track its colorway, dye lot, and how much you have left.</p></div>'}`;
    }
  }

  function projectFields(item){
    const yarn=data.yarn.map(y=>`<div class="crochet-yarn-need"><label class="crochet-yarn-choice"><input type="checkbox" name="yarnIds" value="${escape(y.id)}" ${item?.yarnIds.includes(y.id)?'checked':''}><i style="--swatch:${y.color}"></i><span>${escape(y.colorway?`${y.name} · ${y.colorway}`:y.name)}</span></label>
      <label>Total grams needed<input name="need:${escape(y.id)}" type="number" min="0" max="1000000" step="1" value="${item?.yarnNeeds?.[y.id]||''}"></label></div>`).join('');
    return `<label>Project name<input name="name" required maxlength="100" value="${escape(item?.name)}" placeholder="e.g. Willow cardigan"></label>
      <div class="crochet-fields"><label>Status<select name="status">${Object.entries(statuses).map(([key,name])=>`<option value="${key}" ${item?.status===key?'selected':''}>${name}</option>`).join('')}</select></label><label>Hook size<input name="hook" maxlength="40" value="${escape(item?.hook)}" placeholder="e.g. 4 mm"></label>
      <label>Rows worked<input name="rows" type="number" min="0" max="100000" step="1" value="${item?.rows??0}"></label><label>Row goal (optional)<input name="goal" type="number" min="1" max="100000" step="1" value="${item?.goal||''}"></label></div>
      <label>Pattern link<input name="pattern" type="url" maxlength="1000" value="${escape(item?.pattern)}" placeholder="https://…"></label>
      <fieldset><legend>Yarn for this project</legend>${yarn?`<div class="crochet-yarn-choices">${yarn}</div>`:'<small>Add yarn to your stash to link it here.</small>'}</fieldset>
      <label>Project notes<textarea name="notes" maxlength="3000" rows="3" placeholder="Changes to the pattern, next steps…">${escape(item?.notes)}</textarea></label>`;
  }
  function yarnFields(item){
    return `<label>Yarn name<input name="name" maxlength="100" required value="${escape(item?.name)}" placeholder="e.g. Cascade 220"></label>
      <div class="crochet-fields"><label>Colorway<input name="colorway" maxlength="75" value="${escape(item?.colorway)}" placeholder="e.g. Dusty rose"></label><label>Swatch<input name="color" type="color" value="${color(item?.color)}"></label>
      <label>Yarn weight<select name="weight"><option value="">Choose a weight</option>${weights.map(weight=>`<option ${item?.weight===weight?'selected':''}>${weight}</option>`).join('')}</select></label>
      <label>Grams on hand<input name="grams" type="number" required min="0" max="1000000" step="1" value="${item?.grams??''}" placeholder="e.g. 100"></label>
      <label>Fiber<input name="fiber" maxlength="80" value="${escape(item?.fiber)}" placeholder="e.g. Merino wool"></label><label>Dye lot<input name="lot" maxlength="45" value="${escape(item?.lot)}"></label></div>`;
  }
  function timeFields(project){
    const today=dayKey();
    const sessions=data.timeLog.filter(item=>item.projectId===project.id).sort((a,b)=>b.date.localeCompare(a.date));
    return `<p class="crochet-use-context">${escape(project.name)} · ${formatTime(sessions.reduce((sum,item)=>sum+item.minutes,0))} logged</p>
      <div class="crochet-fields"><label>Date<input name="date" type="date" required max="${today}" value="${today}"></label>
      <label>Minutes worked<input name="minutes" type="number" min="1" max="1440" step="1" required placeholder="e.g. 45"></label></div>
      ${sessions.length?`<div class="crochet-time-history"><h4>Recent sessions</h4><ul>${sessions.slice(0,5).map(item=>`<li><time datetime="${item.date}">${escape(new Date(item.date+'T12:00:00').toLocaleDateString([],{dateStyle:'medium'}))}</time><span>${formatTime(item.minutes)}</span></li>`).join('')}</ul></div>`:''}`;
  }
  function checkpointCounts(point){
    return [`Rows ${number(point.rows)}`,...point.counters.map(counter=>`${counter.name} ${number(counter.count)}`)].join(' · ');
  }
  function checkpointFields(project){
    return `<p class="crochet-use-context">${escape(project.name)} · ${escape(checkpointCounts(project))}</p>
      <label>Where to resume<textarea name="note" maxlength="1000" rows="4" required placeholder="Start the next sleeve at row 18"></textarea></label>
      ${project.checkpoints.length?`<h4>Saved checkpoints</h4><ul class="crochet-checkpoint-history">${[...project.checkpoints].reverse().map(point=>`<li>
        <small>${escape(new Date(point.at).toLocaleString())}</small><p>${escape(point.note)}</p><small>${escape(checkpointCounts(point))}</small></li>`).join('')}</ul>`:''}`;
  }
  function patternChangeFields(project){
    return `<p class="crochet-use-context">${escape(project.name)} · ${number(project.rows)} rows</p>
      <label>Row<input name="row" type="number" min="0" max="100000" value="${project.rows}" required></label>
      <label>Pattern change<textarea name="note" rows="3" maxlength="1000" placeholder="Switched to a 4 mm hook" required></textarea></label>
      ${project.patternChanges.length?`<h4>Change history</h4><ul class="crochet-checkpoint-history">${[...project.patternChanges].reverse().map(change=>
        `<li><small>${escape(new Date(change.at).toLocaleDateString())} · Row ${number(change.row)}</small><p>${escape(change.note)}</p></li>`).join('')}</ul>`:''}`;
  }
  function openEditor(kind,id,trigger){
    const item=data[['projects','time','counter','checkpoint','pattern-change'].includes(kind)?'projects':'yarn'].find(record=>record.id===id);
    if(!['projects','yarn'].includes(kind)&&!item)return;
    const counterId=trigger.closest('[data-counter-id]')?.dataset.counterId;
    const counter=item?.counters?.find(record=>record.id===counterId);
    editor={kind,id,counterId}; anchor=trigger;
    const title=kind==='pattern-change'?'Pattern changes':kind==='counter'?(counter?'Edit counter':'Add counter'):kind==='checkpoint'?'Checkpoints':kind==='time'?'Log crochet time':kind==='use'?'Log yarn used':kind==='projects'?(item?'Edit project':'New project'):(item?'Edit yarn':'Add yarn');
    const linked=kind==='use'?data.projects.filter(project=>project.yarnIds.includes(id)):[];
    const fields=kind==='counter'?`<label>Counter name<input name="name" maxlength="60" value="${escape(counter?.name)}" required></label><label>Count<input name="count" type="number" min="0" max="100000" required value="${counter?.count??0}"></label>`:
      kind==='pattern-change'?patternChangeFields(item):kind==='checkpoint'?checkpointFields(item):kind==='time'?timeFields(item):kind==='projects'?projectFields(item):kind==='yarn'?yarnFields(item):
      `<p class="crochet-use-context">${escape(item.name)} · ${number(item.grams)} g on hand</p><label>Grams used<input name="grams" type="number" min="1" max="${item.grams}" required step="1"></label>
      <label>Project (optional)<select name="projectId"><option value="">Stash only</option>${linked.map(project=>`<option value="${escape(project.id)}">${escape(project.name)}</option>`).join('')}</select></label>`;
    const removable=counter||item&&(kind==='projects'||kind==='yarn');
    dialog.innerHTML=`<form><header><h3 id="crochet-dialog-title">${title}</h3><button type="button" data-crochet-close aria-label="Close dialog">×</button></header><div class="crochet-dialog-fields">${fields}<p role="alert" id="crochet-form-error" hidden></p></div>
      <footer>${removable?'<button type="button" class="crochet-delete" data-crochet-delete>Delete</button>':''}<button class="crochet-primary" type="submit" value="save">${kind==='pattern-change'?'Save change':kind==='checkpoint'?'Save checkpoint':kind==='time'?'Log time':kind==='use'?'Log use':'Save'}</button></footer></form>`;
    dialog.setAttribute('aria-labelledby','crochet-dialog-title');
    dialog.showModal();
    dialog.querySelector(kind==='time'?'[name="minutes"]':'input,textarea')?.focus();
  }

  function saveEditor(form,remove){
    const {kind,id,counterId}=editor;
    const fields=new FormData(form);
    const next=structuredClone(data);
    const error=$('#crochet-form-error');
    const fail=message=>{error.hidden=false;error.textContent=message;};
    if(kind==='counter'||kind==='checkpoint'||kind==='pattern-change'){
      const project=next.projects.find(item=>item.id===id);
      if(!project)return fail('This project was removed in another tab.');
      if(kind==='pattern-change'){
        const note=clean(fields.get('note'),1000);
        if(!note)return fail('Enter the pattern change.');
        project.patternChanges.push({id:crypto.randomUUID(),at:Date.now(),row:whole(fields.get('row')),note});
      }else if(kind==='checkpoint'){
        const note=clean(fields.get('note'),1000);
        if(!note)return fail('Enter a note about where to resume.');
        project.checkpoints.push({id:crypto.randomUUID(),at:Date.now(),note,rows:project.rows,
          counters:project.counters.map(({name,count})=>({name,count}))});
      }else{
        const index=project.counters.findIndex(item=>item.id===counterId);
        if(counterId&&index<0)return fail('This counter was removed in another tab.');
        if(remove)project.counters.splice(index,1);
        else{
          const name=clean(fields.get('name'),60);
          if(!name)return fail('Enter a counter name.');
          const counter={id:counterId||crypto.randomUUID(),name,count:whole(fields.get('count'))};
          if(index<0)project.counters.push(counter);else project.counters[index]=counter;
        }
      }
    }else if(kind==='time'){
      if(!logCrochetTime(next,{projectId:id,date:fields.get('date'),minutes:Number(fields.get('minutes'))}))return fail('Choose a past or current date and enter the minutes worked.');
    } else if (kind==='use') {
      if (!logYarnUse(next,{yarnId:id,projectId:fields.get('projectId'),grams:Number(fields.get('grams'))})) return fail('Check the amount remaining and the linked project.');
    } else if (remove) {
      next[kind]=next[kind].filter(item=>item.id!==id);
      if (kind==='yarn') for (const project of next.projects) project.yarnIds=project.yarnIds.filter(yarnId=>yarnId!==id);
      if (kind==='projects')next.timeLog=next.timeLog.filter(item=>item.projectId!==id);
    } else {
      const name=String(fields.get('name')).trim();
      if (!name) return fail('Enter a name.');
      const values={...Object.fromEntries(fields),id:id||crypto.randomUUID()};
      if (kind==='projects'&&values.pattern&&!patternUrl(values.pattern)) return fail('Use an http or https pattern link.');
      const yarnIds=fields.getAll('yarnIds').filter(yarnId=>next.yarn.some(item=>item.id===yarnId));
      const index=next[kind].findIndex(record=>record.id===id);
      if (id&&index<0) return fail('This item was removed in another tab.');
      const yarnNeeds=Object.fromEntries(yarnIds.map(id=>[id,Number(fields.get(`need:${id}`))]));
      const item=kind==='projects'?cleanProject({...next.projects[index],...values,yarnIds,yarnNeeds}):cleanYarn(values);
      if (index<0) next[kind].unshift(item); else next[kind][index]=item;
    }
    if (!commit(next)) return fail('Changes could not be saved on this device.');
    if (kind==='projects'&&!remove&&statusFilter!=='all'&&fields.get('status')!==statusFilter) statusFilter='all';
    render();
    if(kind==='time')anchor=content.querySelector(`[data-crochet-id="${CSS.escape(id)}"] [data-crochet-time]`);
    if(kind==='pattern-change')anchor=content.querySelector(`[data-crochet-id="${CSS.escape(id)}"] [data-crochet-pattern]`);
    if(kind==='counter'||kind==='checkpoint'){
      const card=content.querySelector(`[data-crochet-id="${CSS.escape(id)}"]`);
      anchor=kind==='checkpoint'?card?.querySelector('[data-crochet-checkpoint]'):
        (counterId&&card?.querySelector(`[data-counter-id="${CSS.escape(counterId)}"] [data-crochet-counter]`))||card?.querySelector('.crochet-checkpoint-actions [data-crochet-counter]');
    }
    dialog.close();
    notify(remove?'Removed from Stitchbook.':kind==='time'?'Crochet time logged.':kind==='use'?'Yarn use logged.':'Saved in Stitchbook.');
  }

  dialog.addEventListener('input',event=>{
    if(event.target.name?.startsWith('need:')&&event.target.valueAsNumber>0){
      event.target.closest('.crochet-yarn-need').querySelector('[name="yarnIds"]').checked=true;
    }
  });
  root.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if (!button) return;
    const id=button.closest('[data-crochet-id]')?.dataset.crochetId;
    const action=button.dataset;
    if (action.crochetView) { view=action.crochetView; render(); }
    if (button===add) openEditor(view==='projects'?'projects':'yarn',null,button);
    if (action.crochetEdit) openEditor(action.crochetEdit,id,button);
    if ('crochetUse' in action) openEditor('use',id,button);
    if ('crochetTime' in action) openEditor('time',id,button);
    if ('crochetCounter' in action) openEditor('counter',id,button);
    if ('crochetCheckpoint' in action) openEditor('checkpoint',id,button);
    if ('crochetPattern' in action) openEditor('pattern-change',id,button);
    if ('crochetClose' in action) dialog.close();
    if ('crochetDelete' in action) {
      if (button.dataset.confirm) return saveEditor(button.form,true);
      button.dataset.confirm='true';button.textContent='Confirm delete';
      const error=$('#crochet-form-error');
      error.hidden=false;error.textContent=editor.kind==='counter'?'Remove this counter? Saved checkpoints keep its recorded count.':
        editor.kind==='yarn'?'This also unlinks the yarn from its projects.':'This removes the project, its counters, checkpoints, and time log.';
    }
    if(action.counterStep){
      const row=button.closest('[data-counter-id]'),next=structuredClone(data);
      const counter=next.projects.find(item=>item.id===id)?.counters.find(item=>item.id===row.dataset.counterId);
      if(!counter)return;
      counter.count=whole(counter.count+Number(action.counterStep));
      if(!commit(next))return;
      row.querySelector('output').textContent=number(counter.count);
      row.querySelector('[data-counter-step="-1"]').disabled=counter.count===0;
      row.querySelector('[data-counter-step="1"]').disabled=counter.count>=100000;
      if(button.disabled)row.querySelector('[data-counter-step]:not(:disabled)')?.focus();
    }
    if (action.rowStep) {
      const next=structuredClone(data),project=next.projects.find(item=>item.id===id);
      if (!project) return;
      project.rows=whole(project.rows+Number(action.rowStep));
      if (!commit(next)) return;
      const card=button.closest('[data-crochet-id]');
      card.querySelector('output').innerHTML=`${number(project.rows)}${project.goal?` <small>/ ${number(project.goal)}</small>`:''}`;
      const progress=card.querySelector('progress');
      if (progress) progress.value=Math.min(100,Math.floor(project.rows/project.goal*100));
      card.querySelector('[data-row-step="-1"]').disabled=project.rows===0;
      card.querySelector('[data-row-step="1"]').disabled=project.rows>=100000;
      if (button.disabled) card.querySelector('[data-row-step]:not(:disabled)')?.focus();
    }
  });
  content.addEventListener('change',event=>{
    if (event.target.id!=='crochet-filter') return;
    statusFilter=event.target.value; render(); $('#crochet-filter').focus();
  });
  dialog.addEventListener('submit',event=>{event.preventDefault();saveEditor(event.target,false);});
  dialog.addEventListener('close',()=>{(anchor?.isConnected?anchor:add).focus({preventScroll:true});editor=null;});
  window.addEventListener('storage',event=>{if (event.key===CROCHET_KEY||event.key===null) { data=loadCrochet(storage);render(); }});
  render();
  return {
    focusProject(id){
      view='projects';statusFilter='all';render();
      const project=id&&content.querySelector(`[data-crochet-id="${CSS.escape(id)}"]`);
      project?.scrollIntoView({block:'center'});
      (project?.querySelector('[data-crochet-edit]')||add).focus({preventScroll:true});
    }
  };
}
