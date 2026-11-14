import {blockProgressLabels,calendarBlocks,calendarTaskBlock,allDayEvents,calendarDragType,openFocusBlock,scheduledTaskTime,shiftDay,timeLabel,timeMinutes,weekDays} from './calendar.js';
import {parseCalendarImport} from './calendar-import.js';
import {summarizeWeek,weeklyProjectProgress} from './weekly-planning.js';
import {dayKey,taskPriority,taskStatus,unfinishedPrerequisites} from './state.js';
import {captureTaskChange} from './task-undo.js';
import {importTodoistProject,matchesPlannerQuery,nextTaskDate,quickTask} from './planner-data.js';
import {activityLabels,estimateAccuracy,estimateCsv,estimateSummary,reportCsv,reportEvents,reportMetrics,suggestTaskEstimate} from './planner-report.js';
import {milestoneProgress,projectDecision,projectMilestone,remainingProjectWork} from './project-planning.js';
import {exportCalendar} from './calendar-export.js';
import {cleanCaptureContext} from './capture.js';

const views={search:'Search',inbox:'Inbox',today:'Today',upcoming:'Upcoming',review:'Weekly review',workload:'Workload',filters:'Filters & Labels',reporting:'Reporting'};
const workViewPresets={
  short:{name:'30 minutes or less',query:'estimate<=30 & !completed'},
  week:{name:'Due this week',query:'due-this-week & !completed'}
};
const calendarLayouts={day:1,'3days':3,calendar:7,month:0};
const paths={
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  inbox:'<path d="M4 13 7 5h10l3 8v6H4zM4 13h5l1 3h4l1-3h5"/>',
  today:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 9h16m-10 5h4"/>',
  upcoming:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 9h16M8 13h1m3 0h1m3 0h1m-9 3h1m3 0h1"/>',
  filters:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  reporting:'<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M7 13h3l2-4 2 6 2-3h2"/>',
  review:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="m8 13 2 2 5-5M8 3v4m8-4v4"/>',
  workload:'<path d="M4 20h16M6 16v-4m4 4V9m4 7V5m4 11v-6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',project:'<path d="m10 4-4 16m12-16-4 16M5 9h15M3 15h15"/>',
  label:'<path d="M4 13 13 4h7v7l-9 9z"/><circle cx="16.5" cy="7.5" r=".7"/>',
  check:'<path d="m6 12 4 4 8-8"/>',down:'<path d="m6 9 6 6 6-6"/>',download:'<path d="M12 3v12m-4-4 4 4 4-4M5 17v3h14v-3"/>',
  pavilion:'<path d="M3 12c4-1 7-3 9-6 2 3 5 5 9 6H3Zm4 0v7m5-7v7m5-7v7M4 19h16M12 6V4"/>',
  upload:'<path d="M12 15V4m-4 4 4-4 4 4M5 16v4h14v-4"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const parseDay=key=>new Date(`${key}T00:00:00`);
const shortDay=date=>date.toLocaleDateString([], {month:'short',day:'numeric'});
const plainDate=key=>shortDay(parseDay(key));
const scheduledTime=value=>timeLabel(timeMinutes(value));
const blankId=()=>crypto.randomUUID();

export function installPlanner({root,getState,commit,editTask,openBlock,taskMenu,calendarChanged,calendarDate,dailyRituals,blockProgress,notify,completeTask,hasPanel,previewSchedule,linkedNotes=()=>'',nextProjectTask,resumeProject,projectTimerLocked,projectReward,finishProject,openExamPlans,isActualCalendar}) {
  const $=selector=>root.querySelector(selector);
  const sidebar=$('#planner-sidebar'), content=$('#planner-content'), dialog=$('#planner-dialog');
  const sidebarToggle=$('#planner-toggle-sidebar'), smallScreen=matchMedia('(max-width: 680px)');
  const layoutSelect=$('#planner-layout'), completed=$('#planner-completed'), sort=$('#planner-sort');
  const state=()=>getState();
  let view='today', selection='', layout='list', query='', date=new Date(), quick=null, expanded=new Set(), dialogAnchor=null;
  let parkedPlanner=null, calendarLayout='calendar', calendarProject='all';
  let reviewWeek=new Date();
  let projectOverviewMarkup='';
  let reminderMinute=-1;
  const layouts=new Map(), collapsed=new Set();
  const report={mode:'activity',period:'all',project:'all',type:'task',metric:'ms'};
  const layoutKey=()=>`${view}:${selection}`;
  const defaultLayout=()=>['upcoming','project'].includes(view)?'board':'list';

  function syncSidebar(){
    const open=smallScreen.matches?root.classList.contains('planner-sidebar-open'):!root.classList.contains('planner-sidebar-compact');
    sidebarToggle.setAttribute('aria-expanded',String(open));
    sidebarToggle.title=open?'Collapse Planner sidebar':'Expand Planner sidebar';
  }
  smallScreen.addEventListener('change',syncSidebar);

  function selectLayout(next,remember=true) {
    layout=next;
    if (view==='calendar') calendarLayout=next;
    else layoutSelect.value=next;
    if (remember) layouts.set(layoutKey(),next);
  }

  function setView(next,value='') {
    view=next; selection=value; query=''; quick=null;
    selectLayout(layouts.get(layoutKey())||defaultLayout(),false);
    if (view==='today'||view==='upcoming') date=new Date();
    root.classList.remove('planner-sidebar-open');
    syncSidebar();
    content.scrollLeft=0;
    content.scrollTop=0;
    render();
    if (view==='search') $('#planner-search')?.focus();
    else $('#planner-heading').focus({preventScroll:true});
  }

  function projectFor(task) { return state().projects.find(project=>project.id===task.projectId); }
  function activeTasks() { return state().tasks.filter(task=>!projectFor(task)?.archived); }
  function todayDate(task,now) { return nextTaskDate(task,now,true)===dayKey(now)||calendarBlocks([task],now).length>0; }
  function overdueDate(task,now) {
    if (task.repeat!=='none'||task.done) return '';
    const due=nextTaskDate(task,now);
    return due<dayKey(now)?due:'';
  }
  function timeLayout() { return Boolean(calendarLayouts[layout]); }

  function matchingTasks(now=new Date()) {
    const tasks=view==='project'?state().tasks.filter(task=>task.projectId===selection):activeTasks();
    switch (view) {
      case 'calendar': return calendarProject==='all'?tasks:tasks.filter(task=>(projectFor(task)?.id||'inbox')===calendarProject);
      case 'inbox': return tasks.filter(task=>!projectFor(task));
      case 'today': return tasks.filter(task=>todayDate(task,now)||overdueDate(task,now));
      case 'label': return tasks.filter(task=>task.labels?.includes(selection));
      case 'filter': return tasks.filter(task=>matchesPlannerQuery(task,state().plannerFilters.find(item=>item.id===selection)?.query||'',state().projects,now));
      case 'search': return query?tasks.filter(task=>matchesPlannerQuery(task,query,state().projects,now)):[];
      default: return tasks;
    }
  }

  function calendarTasks() {
    return matchingTasks().filter(task=>completed.checked||task.repeat!=='none'||!task.done);
  }

  function navItem(key,label,count='',value='',mark=icon(key)) {
    const current=view===key&&selection===value;
    return `<button type="button" class="planner-nav-item" data-planner-view="${key}" data-value="${escape(value)}" title="${escape(label)}" ${current?'aria-current="page"':''}>${mark}<span class="planner-nav-label">${escape(label)}</span>${count!==''&&count>0?`<small>${count}</small>`:''}</button>`;
  }

  function renderSidebar() {
    const now=new Date(), tasks=activeTasks().filter(task=>taskStatus(task,now)!=='done');
    const projects=state().projects.filter(project=>!project.archived).sort((a,b)=>Number(b.favorite)-Number(a.favorite));
    const count={inbox:tasks.filter(task=>!projectFor(task)).length,today:tasks.filter(task=>todayDate(task,now)||overdueDate(task,now)).length};
    const plan=['inbox','today','upcoming','review','workload'].map(key=>navItem(key,views[key],count[key])).join('');
    const organize=['filters','reporting'].map(key=>navItem(key,views[key])).join('');
    const pinned=state().plannerFilters.filter(filter=>filter.pinned);
    const saved=state().plannerFilters.filter(filter=>!filter.pinned);
    const scroll=sidebar.querySelector('.planner-rail-sections')?.scrollTop||0;
    sidebar.innerHTML=`<div class="planner-brand"><span>${icon('pavilion')}</span><div><strong>Planner</strong><small>Yin and Yang</small></div></div>
      <div class="planner-rail-actions"><button class="planner-add" type="button" title="Add task (Q)" data-planner-add>${icon('plus')} <span>Add task</span> <kbd aria-hidden="true">Q</kbd></button>
      <button class="planner-search-link" type="button" data-planner-view="search" data-value="" title="Search tasks (/)" ${view==='search'?'aria-current="page"':''}>${icon('search')} <span>Search tasks</span> <kbd aria-hidden="true">/</kbd></button></div>
      <div class="planner-rail-sections">
        ${pinned.length?`<section class="planner-rail-group"><div class="planner-sidebar-heading"><h3>Pinned work views</h3></div><nav aria-label="Pinned work views">${pinned.map(filter=>navItem('filter',filter.name,'',filter.id,icon('filters'))).join('')}</nav></section>`:''}
        <section class="planner-rail-group"><div class="planner-sidebar-heading"><h3>Plan</h3></div><nav aria-label="Plan">${plan}</nav></section>
        <section class="planner-rail-group"><div class="planner-sidebar-heading"><h3>Organize</h3></div><nav aria-label="Organize">${organize}</nav></section>
        <section class="planner-rail-group"><div class="planner-sidebar-heading"><h3>Projects</h3><button type="button" data-manage="project" title="Add project" aria-label="Add project">${icon('plus')}</button></div>
          <nav aria-label="Projects">${projects.map(project=>navItem('project',project.name,tasks.filter(task=>task.projectId===project.id).length,project.id,`<span class="planner-project-mark" style="--project-color:${escape(project.color)}" aria-hidden="true"></span>`)).join('')||'<p class="planner-side-empty">Group related tasks in a project.</p>'}</nav></section>
        ${saved.length?`<section class="planner-rail-group"><div class="planner-sidebar-heading"><h3>Saved filters</h3></div><nav aria-label="Saved filters">${saved.map(filter=>navItem('filter',filter.name,'',filter.id,icon('filters'))).join('')}</nav></section>`:''}
      </div>
      <div class="planner-sidebar-foot"><button type="button" data-manage="import" title="Import Todoist CSV">${icon('upload')}<span>Import Todoist CSV</span></button><small>Stored on this device</small></div>`;
    sidebar.querySelector('.planner-rail-sections').scrollTop=scroll;
  }

  function sortTasks(tasks) {
    return [...tasks].sort((a,b)=>{
      if (sort.value==='name') return a.text.localeCompare(b.text);
      if (sort.value==='priority') return taskPriority(a)-taskPriority(b)||a.text.localeCompare(b.text);
      return (a.time||'99:99').localeCompare(b.time||'99:99')||taskPriority(a)-taskPriority(b)||a.text.localeCompare(b.text);
    });
  }

  function card(task, occurrence) {
    const current=occurrence||dayKey(), complete=taskStatus(task,parseDay(current))==='done';
    const project=projectFor(task), priority=taskPriority(task), recurring=task.repeat&&task.repeat!=='none';
    const title=escape(task.text), dateLabel=occurrence||task.date;
    const labels=(task.labels||[]).map(label=>`<button type="button" class="planner-label" data-planner-view="label" data-value="${escape(label)}">%${escape(label)}</button>`).join('');
    const subtasks=task.subtasks||[], done=subtasks.filter(sub=>sub.done).length;
    const waiting=!complete&&task.prerequisiteIds?.length
      ?unfinishedPrerequisites(task,new Map(state().tasks.map(item=>[item.id,item])))
      :[];
    return `<article class="planner-task${complete?' planner-task-done':''}" data-task="${escape(task.id)}" data-occurrence="${escape(current)}" data-priority="${priority}" draggable="true">
      <button type="button" class="planner-check" data-complete-task aria-pressed="${complete}" aria-label="${complete?'Reopen':'Complete'} ${title}">${complete?'✓':''}</button>
      <div class="planner-task-copy">
        <button type="button" class="planner-task-title" data-edit-task>${title}</button>
        ${task.description?`<p>${escape(task.description)}</p>`:''}
        <div class="planner-task-meta">
          ${dateLabel?`<span class="planner-task-date${dateLabel<dayKey()&&!complete?' is-overdue':''}">${icon('today')} ${dateLabel===dayKey()?'Today':dateLabel===dayKey(shiftDay(new Date(),1))?'Tomorrow':plainDate(dateLabel)}${task.time&&dateLabel>=dayKey()&&(recurring||task.date===dateLabel)?` ${scheduledTime(scheduledTaskTime(task,dateLabel))}`:''}${recurring?' ↻':''}</span>`:''}
          ${view==='inbox'?'':`<span class="planner-task-project">${project?icon('project'):icon('inbox')} ${escape(project?.name||'Inbox')}</span>`}
          ${priority<4?`<span class="planner-priority">P${priority}</span>`:''}
          ${task.deadline?`<span class="planner-deadline">Due ${plainDate(task.deadline)}</span>`:''}
          ${!complete&&task.snoozedUntil>dayKey()?`<span>Snoozed until ${plainDate(task.snoozedUntil)}</span>`:''}
          ${task.reminderAt?'<span title="Reminder scheduled">◷</span>':''}
          ${task.comments?.length?`<span>${task.comments.length} ${task.comments.length===1?'comment':'comments'}</span>`:''}
          ${labels}
        </div>
        ${waiting.length?`<p class="task-waiting">Waiting on ${escape(waiting.map(item=>item.text).join(', '))}</p>`:''}
        ${subtasks.length?`<details class="planner-subtasks" ${expanded.has(task.id)?'open':''}><summary>${done}/${subtasks.length} subtasks</summary>${subtasks.map(sub=>`<label><input type="checkbox" data-planner-subtask="${escape(sub.id)}" ${sub.done?'checked':''}> <span>${escape(sub.text)}</span></label>`).join('')}</details>`:''}
      </div>
      <button type="button" class="planner-task-more" data-task-menu aria-label="Actions for ${title}" aria-haspopup="menu">⋯</button>
    </article>`;
  }

  function quickScheduling() {
    if (!quick?.draft) return {};
    const task=quickTask(quick.draft,quick.defaults,state().projects);
    if(!task)return {};
    const estimate=task.time?suggestTaskEstimate(state(),task):null;
    return {preview:previewSchedule?.(task),hint:estimate?estimateSummary(estimate):''};
  }

  function quickForm(key,defaults) {
    if (quick?.key!==key) return `<button class="planner-column-add" type="button" data-planner-add data-key="${escape(key)}" data-date="${escape(defaults.date)}" data-section="${escape(defaults.sectionId)}">${icon('plus')} Add task</button>`;
    const {preview,hint}=quickScheduling();
    return `<form class="planner-quick-form" data-quick-form><label class="sr-only" for="planner-quick-name">Task name</label><input id="planner-quick-name" name="name" placeholder="Task name" maxlength="300" required value="${escape(quick.draft)}">
      <div class="planner-quick-meta">${escape(state().projects.find(project=>project.id===quick.defaults.projectId)?.name||'Inbox')}${quick.defaults.date?` · ${plainDate(quick.defaults.date)}`:''}</div>
      <small>Try “Read chapter tomorrow at 4pm p1 %reading”</small>
      <div class="schedule-preview" aria-live="polite" ${preview?'':'hidden'}>${preview?.markup||''}</div>
      <p class="estimate-suggestion" ${hint?'':'hidden'}>${hint||''}</p>
      <div class="planner-quick-actions"><button type="button" data-quick-details>More details</button><button type="button" data-quick-cancel>Cancel</button><button class="planner-primary" type="submit">${preview?.overlaps.length?'Add with overlap':'Add task'}</button></div></form>`;
  }

  function timeStack(tasks,day,splitPast=false) {
    if (!day) return '';
    const blocks=calendarBlocks(tasks,parseDay(day)).filter(block=>completed.checked||openFocusBlock(block)||blockProgress(block).focusMs);
    if (!blocks.length) return '';
    const row=block=>{
      const {status}=blockProgress(block);
      return `<button type="button" class="planner-event" data-open-time data-task="${escape(block.task.id)}" data-block="${escape(block.blockId)}" data-occurrence="${block.occurrence}" data-task-day="${escape(block.taskDay)}" data-block-status="${status}" data-priority="${taskPriority(block.task)}"><time>${timeLabel(block.start)} – ${timeLabel(block.end)}</time><span>${escape(block.task.text)}</span><small class="calendar-block-state" ${status?'':'hidden'}>${blockProgressLabels[status]||''}</small></button>`;
    };
    const now=new Date(), minute=now.getHours()*60+now.getMinutes();
    const past=splitPast?blocks.filter(block=>block.end<=minute):[];
    const rows=blocks.filter(block=>!splitPast||block.end>minute).map(row);
    return `<div class="planner-event-stack">${rows.slice(0,4).join('')}${rows.length>4?`<details><summary>${rows.length-4} more scheduled</summary>${rows.slice(4).join('')}</details>`:''}${past.length?`<details><summary>${past.length} past ${past.length===1?'event':'events'}</summary>${past.map(row).join('')}</details>`:''}</div>`;
  }

  function listGroup(key,title,body,{action='',count}={}) {
    const open=!collapsed.has(key);
    return `<section class="planner-list-group"><header><h3><button type="button" data-fold="${key}" aria-expanded="${open}" aria-controls="planner-group-${key}">${icon('down')} ${escape(title)}${count===undefined?'':`<small>${count}</small>`}</button></h3>${action}</header>
      <div id="planner-group-${key}" ${open?'':'hidden'}>${body}</div></section>`;
  }

  function inboxMarkup(tasks) {
    const visible=sortTasks(tasks.filter(task=>completed.checked||taskStatus(task)!=='done'));
    return `<section class="planner-flat-inbox">${visible.map(task=>card(task,nextTaskDate(task,new Date(),completed.checked))).join('')||'<p class="planner-empty">Your Inbox is clear.</p>'}${quickForm('general',{})}</section>`;
  }

  function todayMarkup(tasks) {
    const now=new Date(), today=dayKey(now);
    const visible=tasks.filter(task=>completed.checked||taskStatus(task,now)!=='done');
    const overdue=sortTasks(visible.filter(task=>overdueDate(task,now)));
    const due=sortTasks(visible.filter(task=>!overdueDate(task,now)&&(task.repeat==='none'||nextTaskDate(task,now,completed.checked)===today)));
    const list=due.map(task=>card(task,today)).join('');
    const schedule=timeStack(tasks,today,true);
    const dateTitle=`${shortDay(now)} · Today · ${now.toLocaleDateString([],{weekday:'long'})}`;
    return `${overdue.length?listGroup('overdue','Overdue',overdue.map(task=>card(task,overdueDate(task,now))).join(''),{count:overdue.length,action:'<button class="planner-group-action" type="button" data-manage="reschedule">Reschedule</button>'}):''}
      ${listGroup('today',dateTitle,dailyRituals(today)+schedule+list+quickForm(today,{date:today}))}`;
  }

  function column({key,title,tasks,day='',sectionId='',overdue=false,allowAdd=true,scheduleTasks=tasks}) {
    const dateForTask=task=>day||nextTaskDate(task,new Date(),true);
    const cards=sortTasks(tasks).map(task=>card(task,dateForTask(task))).join('');
    return `<section class="planner-column" ${day?`data-board-day="${day}"`:view==='project'?`data-board-section="${escape(sectionId)}"`:''}>
      <header><h3>${escape(title)} <small>${tasks.length}</small></h3>${overdue?'<button type="button" data-manage="reschedule">Reschedule</button>':''}${sectionId?`<button type="button" data-manage="section" data-value="${escape(sectionId)}" aria-label="Edit ${escape(title)} section">⋯</button>`:''}</header>
      <div class="planner-column-body">${day?dailyRituals(day):''}${timeStack(scheduleTasks,day)}${cards}${allowAdd?quickForm(key,{date:day,sectionId}):''}${!cards&&!allowAdd?'<p class="planner-empty">No tasks here.</p>':''}</div>
    </section>`;
  }

  function boardMarkup(tasks) {
    const now=new Date(),today=dayKey(now);
    const visible=tasks.filter(task=>completed.checked||task.repeat!=='none'||!task.done);
    if (view==='upcoming'||view==='today') {
      const start=view==='today'?now:date;
      const days=Array.from({length:view==='today'?1:15},(_,index)=>shiftDay(start,index));
      const byDate=new Map();
      const overdue=[];
      for (const task of visible) {
        const dateKey=nextTaskDate(task,start,completed.checked);
        if (!dateKey) continue;
        if (dateKey<today&&task.repeat==='none'&&!task.done) overdue.push(task);
        if (!byDate.has(dateKey)) byDate.set(dateKey,[]);
        byDate.get(dateKey).push(task);
      }
      const showOverdue=dayKey(start)===today&&overdue.length;
      return `${showOverdue?column({key:'overdue',title:'Overdue',tasks:overdue,overdue:true,allowAdd:false}):''}${days.map(day=>{
        const key=dayKey(day);
        const suffix=key===today?' · Today':key===dayKey(shiftDay(now,1))?' · Tomorrow':` · ${day.toLocaleDateString([],{weekday:'short'})}`;
        return column({key,title:shortDay(day)+suffix,tasks:byDate.get(key)||[],day:key,scheduleTasks:visible});
      }).join('')}`;
    }
    const listed=visible.filter(task=>completed.checked||taskStatus(task,now)!=='done');
    const project=view==='project'&&state().projects.find(item=>item.id===selection);
    if (project) {
      const sections=project.sections||[];
      return column({key:'unsectioned',title:'Tasks',tasks:listed.filter(task=>!sections.some(section=>section.id===task.sectionId))})+
        sections.map(section=>column({key:section.id,title:section.name,tasks:listed.filter(task=>task.sectionId===section.id),sectionId:section.id})).join('');
    }
    return column({key:'general',title:view==='search'?'Results':view==='inbox'?'Inbox':'Tasks',tasks:listed,allowAdd:view==='inbox'});
  }

  function filtersMarkup() {
    const labels=[...new Set([...state().plannerLabels,...state().tasks.flatMap(task=>task.labels||[])])].sort((a,b)=>a.localeCompare(b));
    const row=(name,view,id,manage,mark)=>`<div class="planner-collection-row">${navItem(view,name,'',id,mark)}<button type="button" data-manage="${manage}" data-value="${escape(id)}" aria-label="Edit ${escape(name)}">⋯</button></div>`;
    const filters=state().plannerFilters;
    const archived=state().projects.filter(project=>project.archived);
    const add=(kind,label)=>`<button class="planner-group-action" type="button" data-manage="${kind}" aria-label="${label}" title="${label}">${icon('plus')}</button>`;
    return `<div class="planner-collection">
      <div class="work-view-presets">${Object.entries(workViewPresets).map(([key,preset])=>
        `<button type="button" data-pin-work-view="${key}">Pin ${preset.name}</button>`).join('')}</div>
      ${listGroup('filters','My filters',filters.map(item=>row(item.name,'filter',item.id,'filter',icon('filters'))).join('')||'<p class="planner-empty">Save a search to revisit it anytime.</p>',{action:add('filter','Add filter'),count:filters.length})}
      ${listGroup('labels','Labels',labels.map(label=>row(label,'label',label,'label',icon('label'))).join('')||'<p class="planner-empty">Create a label to organize related tasks.</p>',{action:add('label','Add label'),count:labels.length})}
      ${archived.length?listGroup('archived','Archived projects',archived.map(project=>row(project.name,'project',project.id,'project',icon('project'))).join('')):''}</div>`;
  }

  function reportProjectName(id) {
    if (id===null) return 'Unassigned focus';
    return id?state().projects.find(project=>project.id===id)?.name||'Former project':'Inbox';
  }

  function reportControl(key,label,options) {
    const choices=options.map(([value,name])=>`<option value="${escape(value)}" ${report[key]===value?'selected':''}>${escape(name)}</option>`).join('');
    return `<select id="planner-report-${key}" data-report-control="${key}" aria-label="${label}">${choices}</select>`;
  }

  function reportDate(key) {
    if (!key) return 'Date unavailable';
    const day=parseDay(key);
    const relative=key===dayKey()?' · Today':'';
    return `${shortDay(day)}${relative} · ${day.toLocaleDateString([],{weekday:'long'})}${day.getFullYear()!==new Date().getFullYear()?` · ${day.getFullYear()}`:''}`;
  }

  function reportActivity(events) {
    const groups=new Map();
    const existing=new Set(state().tasks.map(task=>task.id));
    for (const event of events) {
      if (!groups.has(event.day)) groups.set(event.day,[]);
      groups.get(event.day).push(event);
    }
    const verbs={task:'You completed',focus:'You focused on',skipped:'You skipped focus for'};
    const row=event=>{
      const title=escape(event.text);
      const task=existing.has(event.taskId)?`<button type="button" data-report-task="${escape(event.taskId)}">${title}</button>`:`<span>${title}</span>`;
      const time=event.at?new Date(event.at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):'';
      const details=[reportProjectName(event.projectId)];
      if (event.type==='focus') details.push(`${Math.round((event.ms||0)/6000)/10} min`);
      if (time) details.push(time);
      const mark={task:'check',focus:'reporting',skipped:'today'}[event.type];
      return `<li class="planner-activity-row" data-activity="${event.type}"><span class="planner-activity-icon">${icon(mark)}</span><div>${verbs[event.type]} ${task}</div><small>${escape(details.join(' · '))}</small></li>`;
    };
    return [...groups].map(([key,items])=>`<section class="planner-activity-group"><h3>${reportDate(key)} <small>${items.length}</small></h3><ul>${items.map(row).join('')}</ul></section>`).join('');
  }

  function reportStatistics(events) {
    const {total,days}=reportMetrics(events);
    const metricNames={ms:'Focus minutes',task:'Completed tasks',focus:'Completed focus sessions',skipped:'Skipped focus sessions'};
    const mins=ms=>Math.round(ms/6000)/10;
    const values=[[total.task,'Tasks completed'],[mins(total.ms),'Focus minutes'],[total.focus,'Focus sessions'],
      [total.skipped,'Sessions skipped'],[total.days,'Active days'],[total.focus?`${mins(total.average)} min`:'—','Average focus session'],
      [total.rate===null?'—':`${Math.round(total.rate*100)}%`,'Focus completion rate']];
    const peak=days.reduce((highest,day)=>Math.max(highest,day[report.metric]),1);
    const rows=days.map(day=>`<tr><th scope="row">${reportDate(day.day)}</th><td><div class="planner-report-bar"><span aria-hidden="true" style="--bar:${day[report.metric]/peak*100}%"></span><small>${report.metric==='ms'?mins(day.ms):day[report.metric]}</small></div></td></tr>`);
    return `<dl class="planner-report-stats">${values.map(([value,label])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
      <div class="planner-metric-heading"><h3>Daily activity</h3>${reportControl('metric','Daily metric',Object.entries(metricNames))}</div>
      ${days.length?`<table><thead><tr><th scope="col">Day</th><th scope="col">${metricNames[report.metric]}</th></tr></thead><tbody>${rows.join('')}</tbody></table>`:'<p class="planner-empty">No dated activity in this range.</p>'}`;
  }

  function selectedReportEvents() {
    return reportEvents(state(),{...report,type:report.mode==='metrics'?'all':report.type});
  }
  function reportEstimates(){
    const rows=estimateAccuracy(state(),report);
    const taskIds=new Set(state().tasks.map(task=>task.id));
    const average=(ms,samples)=>Math.round(ms/samples/6000)/10;
    return `<section class="planner-estimates"><h3>Estimate accuracy</h3><p>Compares the estimate saved when you mark a task done with its logged, completed focus time. Recurring tasks count each completed occurrence separately.</p>
      ${rows.length?`<div class="planner-estimates-scroll"><table><thead><tr><th scope="col">Task</th><th scope="col">Avg. estimate</th><th scope="col">Avg. focus</th><th scope="col">Over estimate</th></tr></thead><tbody>
      ${rows.map(row=>`<tr><th scope="row">${taskIds.has(row.taskId)?`<button type="button" data-report-task="${escape(row.taskId)}">${escape(row.text)}</button>`:escape(row.text)}</th><td>${average(row.estimatedMs,row.samples)} min</td><td>${average(row.actualMs,row.samples)} min</td><td>${row.over}/${row.samples}${row.consistent?' <span class="planner-estimate-over">Consistently over</span>':''}</td></tr>`).join('')}
      </tbody></table></div>`:'<p class="planner-empty">Set a task estimate, finish a focus session with that task selected, then mark the task done to start comparing.</p>'}</section>`;
  }

  function reportingMarkup() {
    const events=report.mode==='accuracy'?[]:selectedReportEvents();
    return `<div class="planner-report"><div class="planner-report-controls">
      ${reportControl('mode','Report view',[['activity','Activity log'],['metrics','Metrics'],['accuracy','Estimate accuracy']])}
      ${reportControl('project','Report project',[['all','All projects'],['inbox','Inbox'],...state().projects.map(project=>[project.id,project.name]),['unassigned','Unassigned focus']])}
      ${report.mode==='activity'?reportControl('type','Activity type',[['all','All activity'],...Object.entries(activityLabels)]):''}
      ${reportControl('period','Date range',[['all','Any date'],['1','Today'],['7','Last 7 days'],['30','Last 30 days']])}
      </div>${report.mode==='accuracy'?reportEstimates():report.mode==='metrics'?reportStatistics(events):reportActivity(events)||'<p class="planner-empty">No matching activity yet.</p>'}</div>`;
  }

  function exportReport() {
    const accuracy=report.mode==='accuracy';
    const csv=accuracy?estimateCsv(estimateAccuracy(state(),report)):reportCsv(selectedReportEvents(),reportProjectName);
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url; link.download=`yin-and-yang-${accuracy?'estimates':'activity'}-${dayKey()}.csv`;
    root.append(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function monthMarkup(tasks) {
    const month=date.getMonth(), first=new Date(date.getFullYear(),month,1);
    const start=weekDays(first)[0], today=dayKey();
    const headings=weekDays(first).map(day=>`<div class="planner-month-weekday">${day.toLocaleDateString([],{weekday:'short'})}</div>`).join('');
    const cells=Array.from({length:42},(_,index)=>{
      const day=shiftDay(start,index), key=dayKey(day);
      const allDay=tasks.filter(task=>!task.time&&nextTaskDate(task,day,true)===key&&(completed.checked||taskStatus(task,day)!=='done'));
      return `<section class="planner-month-cell${day.getMonth()!==month?' other-month':''}" data-board-day="${key}">
        <button type="button" data-month-day="${key}" aria-label="Open ${escape(day.toLocaleDateString([],{dateStyle:'full'}))}" ${key===today?'aria-current="date"':''}>${day.getDate()}</button>
        ${dailyRituals(key)}
        ${allDay.map(task=>`<button type="button" class="planner-month-task${taskStatus(task,day)==='done'?' all-day-done':''}" data-month-task data-task="${escape(task.id)}" data-occurrence="${key}" title="${escape(task.text)}">${escape(task.text)}</button>`).join('')}
        ${allDayEvents(state().calendarEvents,day).map(event=>`<button type="button" class="planner-month-event" data-calendar-event="${escape(event.id)}" title="${escape(event.title)}">${escape(event.title)}</button>`).join('')}
        ${calendarBlocks([],day,state().calendarEvents).map(block=>`<button type="button" class="planner-month-event" data-calendar-event="${escape(block.event.id)}" title="${escape(block.event.title)}">${timeLabel(block.start)} · ${escape(block.event.title)}</button>`).join('')}
        ${timeStack(tasks,key)}</section>`;
    }).join('');
    return `<div class="planner-month-grid">${headings}${cells}</div>`;
  }

  function weeklyGoalsMarkup(week){
    const projects=state().projects.filter(project=>!project.archived);
    const metrics=[['focusMinutes','Focus','min'],['chapters','Reading','chapters']];
    return `<section class="weekly-project-goals"><h3>Weekly project goals</h3>
      ${projects.length?projects.map(project=>{
        const goals=metrics.filter(([key])=>project.weeklyGoals?.[key]);
        const progress=goals.length?weeklyProjectProgress(state(),project.id,week):{};
        return `<article><header><strong>${escape(project.name)}</strong>
          <button type="button" data-manage="weekly-goals" data-value="${escape(project.id)}" aria-label="Set weekly goals for ${escape(project.name)}">${goals.length?'Edit goals':'Set goals'}</button></header>
          ${goals.map(([key,label,unit])=>{
            const target=project.weeklyGoals[key],actual=progress[key];
            return `<div class="weekly-goal-meter"><span>${label} · ${actual}/${target} ${unit}${actual>=target?' · Reached':''}</span>
              <progress aria-label="${escape(project.name)} ${label.toLowerCase()} goal" max="${target}" value="${Math.min(actual,target)}"></progress></div>`;
          }).join('')}</article>`;
      }).join(''):'<p class="planner-empty">Add a project to set a weekly goal.</p>'}</section>`;
  }

  function weekMarkup(){
    const week=summarizeWeek(state(),activeTasks(),reviewWeek);
    const hours=minutes=>`${Math.round(minutes/6)/10} h`;
    const header=`<div class="week-tools"><strong>${plainDate(week.first)} – ${plainDate(week.last)}</strong><nav aria-label="Review week">
      <button type="button" data-review-step="-7" aria-label="Previous review week">‹</button><button type="button" data-review-step="0">This week</button><button type="button" data-review-step="7" aria-label="Next review week">›</button></nav></div>`;
    if(view==='workload'){
      const capacity=state().studyCapacity;
      return header+`<form id="study-capacity-form" class="week-capacity"><label>Daily study capacity (minutes) <input name="minutes" type="number" min="15" max="1440" value="${capacity}" required></label><button class="planner-primary">Save capacity</button></form>
        <p class="planner-empty">Planned work includes timed tasks and estimates for dated tasks with no blocks. Overlapping study blocks count separately. Imported commitments are shown beside study time.</p>
        <div class="week-workload">${week.timeline.map(item=>`<article><div><strong>${item.day.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}</strong><span>${hours(item.planned)} planned${item.planned>capacity?` · <b>${hours(item.planned-capacity)} over</b>`:''}</span></div>
          <progress max="${capacity}" value="${Math.min(item.planned,capacity)}" aria-label="Planned study minutes against capacity"></progress><small>${hours(item.busy)} calendar commitments${item.allDay?` · ${item.allDay} all-day`:''}</small></article>`).join('')}</div>`;
    }
    const completions=reportEvents(state(),{type:'task'}).filter(event=>event.day>=week.first&&event.day<=week.last).length;
    const rows=(items,canCarry=false)=>items.map(({task,key})=>`<div class="week-task"><div>${card(task,key)}</div>${canCarry?`<button type="button" data-review-carry="${escape(task.id)}">Move to today</button>`:''}</div>`).join('')||'<p class="planner-empty">Nothing here.</p>';
    return header+`<dl class="planner-report-stats"><div><dt>Tasks completed</dt><dd>${completions}</dd></div><div><dt>Focus sessions</dt><dd>${week.focus.length}</dd></div><div><dt>Focus time</dt><dd>${hours(week.focus.reduce((sum,item)=>sum+item.focusMs,0)/60000)}</dd></div></dl>
      ${weeklyGoalsMarkup(week)}
      ${listGroup('review-carried','Still open from earlier weeks',rows(week.carried.map(task=>({task,key:task.date||task.deadline})),true),{count:week.carried.length})}
      ${listGroup('review-unfinished','Open this week',rows(week.unfinished),{count:week.unfinished.length})}
      ${listGroup('review-next','Next week',rows(week.next),{count:week.next.length})}`;
  }

  function renderContent() {
    const left=content.scrollLeft, top=content.scrollTop;
    const columns=[...content.querySelectorAll('.planner-column-body')].map(column=>column.scrollTop);
    const tasks=matchingTasks();
    const month=layout==='month'&&!['filters','reporting','search'].includes(view);
    content.className=month?'planner-month':layout==='board'&&view!=='search'&&!['filters','reporting'].includes(view)?'planner-board':'planner-list';
    if (view==='filters') content.innerHTML=filtersMarkup();
    else if (view==='reporting') content.innerHTML=reportingMarkup();
    else if (view==='review'||view==='workload') content.innerHTML=weekMarkup();
    else if (month) content.innerHTML=monthMarkup(calendarTasks());
    else if (layout==='list'&&view==='inbox') content.innerHTML=inboxMarkup(tasks);
    else if (layout==='list'&&view==='today') content.innerHTML=todayMarkup(tasks);
    else content.innerHTML=boardMarkup(tasks);
    content.scrollLeft=left;
    content.scrollTop=top;
    content.querySelectorAll('.planner-column-body').forEach((column,index)=>{column.scrollTop=columns[index]||0;});
    $('#planner-search-count').textContent=view==='search'&&query?`${tasks.length} results`:'';
  }

  function upcomingProjectBlocks(projectId, now){
    const tasks=state().tasks.filter(task=>task.projectId===projectId);
    const blocks=[];
    for(let offset=0;offset<14&&blocks.length<5;offset++){
      for(const block of calendarBlocks(tasks,shiftDay(now,offset))){
        if(!openFocusBlock(block)||offset&&block.continues)continue;
        const schedule=calendarTaskBlock(block.task,block.blockId,block.occurrence);
        if(schedule?.end>now)blocks.push({...block,...schedule});
      }
    }
    return blocks.sort((a,b)=>a.start-b.start).slice(0,5);
  }

  function renderProjectOverview(project){
    const overview=$('#planner-project-overview');
    overview.hidden=!project;
    if(!project){delete overview.dataset.projectId;return;}
    if(overview.dataset.projectId!==project.id){
      overview.open=true;
      overview.dataset.projectId=project.id;
    }
    const now=new Date();
    const task=nextProjectTask(project.id);
    const locked=projectTimerLocked();
    const milestones=milestonesFor(project);
    const next=milestones.find(item=>!item.complete);
    const remaining=remainingProjectWork(next?.tasks||[],state().history);
    const hours=new Intl.NumberFormat(undefined,{maximumFractionDigits:1});
    const effort=remaining.minutes<60?`${remaining.minutes} min`:`${hours.format(remaining.minutes/60)} h`;
    const effortLabel=next?.tasks.some(item=>!item.done&&item.task?.estimate)?`${effort} estimated work left`:'No remaining work estimated';
    const blocks=upcomingProjectBlocks(project.id,now);
    const sessions=state().history.filter(item=>item.projectId===project.id&&item.mode==='focus')
      .sort((a,b)=>b.finishedAt-a.finishedAt).slice(0,5);
    const notes=linkedNotes(project.id);
    const reward=projectReward(project.id);
    const timestamp=date=>date.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
    const markup=`<section class="project-overview-next" aria-label="Resume project">
      <div><strong>${task?escape(task.text):'No task ready in Garden'}</strong>
      ${task?.resumeNote?`<p>Next step · ${escape(task.resumeNote)}</p>`:''}
      ${locked&&task?'<p>Finish or reset the current focus timer to switch projects.</p>':''}</div>
      <div class="project-overview-actions"><button type="button" class="planner-primary" data-resume-project="${escape(project.id)}" ${!task||locked?'disabled':''}>Resume project</button>
      ${reward?'<span class="garden-growth-status" id="project-growth-status" tabindex="-1">Finished · Tree planted</span>':!project.archived?
        '<button type="button" class="garden-growth-action" data-finish-project>Mark project finished</button>':''}</div></section>
      <div class="project-overview-sections">
        <section><h3>Next milestone</h3>${next?`<button type="button" class="project-context-item" data-manage="milestones"><strong>${escape(next.milestone.name)}</strong>
          <span>${plainDate(next.milestone.date)} · ${next.done}/${next.tasks.length} tasks complete</span>
          ${next.tasks.length?`<progress class="milestone-overview-progress" value="${next.done}" max="${next.tasks.length}" aria-label="Linked tasks completed"></progress>`:''}
          <span><b>${effortLabel}</b>${remaining.unestimated?` · ${remaining.unestimated} without an estimate`:''}</span></button>`:
          `<p>${milestones.length?'All milestones complete.':'No milestones yet.'}</p>`}</section>
        <section><h3>Upcoming blocks</h3>${blocks.length?`<ul>${blocks.map(block=>`<li><button type="button" class="project-context-item" data-open-time
          data-task="${escape(block.task.id)}" data-block="${escape(block.blockId)}" data-occurrence="${block.occurrence}" data-task-day="${escape(block.taskDay)}" aria-haspopup="dialog">
          <strong>${escape(block.task.text)}</strong><span>${shortDay(block.start)} · ${timestamp(block.start)}–${timestamp(block.end)}</span></button></li>`).join('')}</ul>`:
          '<p>No upcoming blocks in the next 14 days.</p>'}</section>
        <section><h3>Linked notes</h3>${notes||'<p>No linked notes.</p>'}</section>
        <section><h3>Exam prep</h3><button type="button" class="project-context-item" data-project-exams="${escape(project.id)}" aria-haspopup="dialog">
          <strong>${project.exams?.length?`${project.exams.length} ${project.exams.length===1?'exam plan':'exam plans'}`:'Add an exam plan'}</strong>
          <span>${project.exams?.filter(exam=>!exam.result).length||0} open</span></button></section>
        <section><h3>Recent focus</h3>${sessions.length?`<ul>${sessions.map(session=>`<li class="project-context-item"><strong>${escape(session.taskTitle||'Focus session')}</strong>
          <span>${shortDay(new Date(session.finishedAt))} · ${Math.round(session.focusMs/60000)} min · ${session.outcome==='skipped'?'Skipped':'Completed'}</span></li>`).join('')}</ul>`:
          '<p>No recorded focus sessions.</p>'}</section>
      </div>`;
    if(projectOverviewMarkup!==markup){
      $('#planner-project-context').innerHTML=markup;
      projectOverviewMarkup=markup;
    }
  }

  function render() {
    const project=view==='project'?state().projects.find(item=>item.id===selection):null;
    const filter=view==='filter'?state().plannerFilters.find(item=>item.id===selection):null;
    if (view==='project'&&!project||view==='filter'&&!filter) { view='upcoming'; selection=''; selectLayout(defaultLayout(),false); }
    const standalone=view==='calendar';
    const actual=standalone&&isActualCalendar();
    sidebar.hidden=standalone;
    if (!standalone) renderSidebar();
    const sectionView=['filters','reporting','search','review','workload'].includes(view);
    const calendar=timeLayout()&&!sectionView;
    root.dataset.plannerView=view;
    root.dataset.plannerLayout=layout;
    $('#planner-heading').textContent=standalone?'Calendar':project?.name||filter?.name||(view==='label'?`%${selection}`:views[view]);
    const detail=$('#planner-heading-detail');
    detail.hidden=view!=='today'&&view!=='inbox';
    if (!detail.hidden) {
      const count=matchingTasks().filter(task=>taskStatus(task)!=='done').length;
      detail.innerHTML=`${icon(view==='inbox'?'inbox':'check')} ${count} open ${count===1?'task':'tasks'}`;
    }
    renderProjectOverview(project);
    $('#planner-breadcrumb').textContent=standalone?'Schedule':project?.archived?'Archived project':'Task workspace';
    const addTask=`<button class="planner-heading-add${standalone?'':' planner-mobile-add'}" type="button" ${standalone?'data-calendar-new':'data-planner-add'}>${icon('plus')} New task</button>`;
    const settings=project?`<button type="button" data-manage="section">+ Section</button><button type="button" data-manage="project" data-value="${escape(project.id)}">Project settings</button>`:filter?`<button type="button" data-manage="filter" data-value="${escape(filter.id)}">Edit filter</button>`:view==='reporting'?`<button type="button" data-report-export>${icon('download')} Export CSV</button>`:'';
    const replan=standalone||view==='today'?'<button type="button" data-replan-today aria-haspopup="dialog">Replan today</button>':'';
    $('#planner-heading-actions').innerHTML=actual?'':addTask+settings+replan+(standalone?`<button type="button" data-calendar-add-event>${icon('plus')} Add event</button><button type="button" data-manage="calendar-import">Import .ics</button>`:'<button type="button" data-plan-tomorrow aria-haspopup="dialog">Plan tomorrow</button><button type="button" data-plan-deadline aria-haspopup="dialog">Plan to deadline</button>');
    if(!standalone)$('#planner-heading-actions').insertAdjacentHTML('beforeend','<button type="button" data-build-week aria-haspopup="dialog">Build my week</button>');
    if(view==='today')$('#planner-heading-actions').insertAdjacentHTML('beforeend','<button type="button" data-day-recap aria-haspopup="dialog">End-of-day recap</button>');
    if(!actual)$('#planner-heading-actions').insertAdjacentHTML('beforeend','<button type="button" data-open-availability aria-haspopup="dialog">Availability</button>');
    if(standalone&&!actual||project)$('#planner-heading-actions').insertAdjacentHTML('beforeend',
      `<button type="button" data-manage="calendar-export" data-value="${escape(project?.id)}">Export .ics</button>`);
    if(project)$('#planner-heading-actions').insertAdjacentHTML('beforeend','<button type="button" data-manage="milestones" aria-haspopup="dialog">Milestones</button>');
    if(project)$('#planner-heading-actions').insertAdjacentHTML('beforeend','<button type="button" data-manage="decisions" aria-haspopup="dialog">Decision log</button>');
    if(project?.thoughts?.length)$('#planner-heading-actions').insertAdjacentHTML('beforeend',`<button type="button" data-manage="project-thoughts">Thoughts (${project.thoughts.length})</button>`);
    $('#planner-layout-label').hidden=sectionView||standalone;
    $('#planner-toggle-sidebar').hidden=standalone;
    $('#calendar-layout-controls').hidden=!standalone;
    root.querySelectorAll('[data-calendar-layout]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.calendarLayout===layout));
      button.disabled=actual&&button.dataset.calendarLayout==='month';
    });
    $('#planner-sort-label').hidden=standalone;
    $('#calendar-project-label').hidden=!standalone;
    if (standalone) {
      const projectSelect=$('#calendar-project');
      const options=[['all','All projects'],['inbox','Inbox'],...state().projects.filter(item=>!item.archived).map(item=>[item.id,item.name])];
      if (!options.some(([value])=>value===calendarProject)) calendarProject='all';
      projectSelect.innerHTML=options.map(([value,name])=>`<option value="${escape(value)}">${escape(name)}</option>`).join('');
      projectSelect.value=calendarProject;
    }
    $('#planner-board-tools').hidden=sectionView||standalone||calendar||(view!=='upcoming'&&layout!=='month');
    $('#calendar-toolbar').hidden=!standalone&&!calendar;
    $('#calendar-activity-mode').hidden=!standalone;
    $('#actual-calendar-message').hidden=!actual;
    $('#planner-display').hidden=actual||sectionView&&view!=='search';
    $('#calendar-queue-toggle').hidden=!calendar||actual;
    if (standalone&&layout==='month') {
      $('#calendar-range').textContent=date.toLocaleDateString([],{month:'long',year:'numeric'});
      $('#calendar-jump-date').value=dayKey(date);
      root.querySelector('[data-calendar-step="previous"]').setAttribute('aria-label','Previous month');
      root.querySelector('[data-calendar-step="next"]').setAttribute('aria-label','Next month');
    }
    $('#planner-month').textContent=date.toLocaleDateString([],{month:'long',year:'numeric'});
    $('#planner-jump-date').value=dayKey(date);
    $('#planner-search-row').hidden=view!=='search';
    if ($('#planner-search').value!==query) $('#planner-search').value=query;
    const enteringTimeline=calendar&&$('#planner-calendar-view').hidden;
    $('#planner-calendar-view').hidden=!calendar;
    content.hidden=calendar;
    $('#planner-quick-strip').hidden=quick?.key!=='top';
    $('#planner-quick-strip').innerHTML=quick?.key==='top'?quickForm('top',quick.defaults):'';
    if (calendar) calendarChanged(date,calendarLayouts[layout],enteringTimeline);
    else renderContent();
  }

  function open(destination,anchorDate,timeFocus=false) {
    if (destination==='calendar') {
      if (view!=='calendar') {
        parkedPlanner={view,selection,query,date:timeLayout()?calendarDate():date,layout,quick,left:content.scrollLeft,top:content.scrollTop};
      }
      view='calendar'; selection=''; query=''; quick=null; date=anchorDate;
      selectLayout((timeFocus||isActualCalendar())&&calendarLayout==='month'?'day':calendarLayout,false);
    } else if (parkedPlanner) {
      ({view,selection,query,date,quick}=parkedPlanner);
      selectLayout(parkedPlanner.layout,false);
    } else {
      selectLayout(layout,false);
    }
    root.classList.remove('planner-sidebar-open');
    syncSidebar();
    render();
    if (destination==='planner'&&parkedPlanner) {
      content.scrollLeft=parkedPlanner.left; content.scrollTop=parkedPlanner.top;
      parkedPlanner=null;
    }
  }

  function setCalendarLayout(next,target=timeLayout()?calendarDate():date) {
    date=target; quick=null;
    selectLayout(next);
    render();
  }

  function jumpMonth(target,step=0) {
    date=step?new Date(date.getFullYear(),date.getMonth()+step,1):target;
    render();
  }

  function add(button) {
    const key=timeLayout()||layout==='month'?'top':button?.dataset.key||'top';
    const defaults={date:button?.dataset.date||(view==='today'?dayKey():''),projectId:view==='project'?selection:'',sectionId:button?.dataset.section||''};
    quick={key,defaults,draft:''};
    render();
    $('#planner-quick-name')?.focus();
  }

  function milestonesFor(project) {
    const tasksById=new Map(state().tasks.map(task=>[task.id,task]));
    return (project.milestones||[]).map(item=>milestoneProgress(item,tasksById))
      .sort((a,b)=>a.milestone.date.localeCompare(b.milestone.date));
  }

  function milestoneList(project) {
    const milestones=milestonesFor(project);
    const next=milestones.find(item=>!item.complete);
    const tasksById=new Map(state().tasks.map(task=>[task.id,task]));
    return `<header><h3 id="planner-dialog-title">Milestones</h3><button type="button" data-dialog-close aria-label="Close dialog">×</button></header>
      <div class="milestone-list">${milestones.map(item=>{
        const {milestone,tasks,done,complete}=item;
        const remaining=tasks.filter(link=>!link.done);
        const status=complete?'Complete':milestone.date<dayKey()?'Overdue':item===next?'Up next':'Upcoming';
        return `<section><div class="milestone-row"><h4>${escape(milestone.name)}</h4>
          <button type="button" data-manage="milestone" data-value="${escape(milestone.id)}" aria-label="Edit ${escape(milestone.name)}">Edit</button></div>
          <p>${plainDate(milestone.date)} · ${status} · ${done}/${tasks.length} tasks complete</p>
          ${remaining.length?`<ul>${remaining.map(({task})=>{
            if(!task)return '<li>Removed task</li>';
            const waiting=unfinishedPrerequisites(task,tasksById);
            return `<li><button type="button" data-milestone-task="${escape(task.id)}">${escape(task.text)}</button>${waiting.length?`<small>Waiting on ${escape(waiting.map(link=>link.text).join(', '))}</small>`:''}</li>`;
          }).join('')}</ul>`:complete?'':'<p>Link tasks to track progress.</p>'}</section>`;
      }).join('')||'<p>Add a target date and link the tasks needed to reach it.</p>'}</div>
      <footer><button class="planner-primary" type="button" data-manage="milestone">Add milestone</button></footer>`;
  }

  function showDialog(type,id,anchor) {
    dialogAnchor=anchor;
    const project=state().projects.find(item=>item.id===id), filter=state().plannerFilters.find(item=>item.id===id);
    const currentProject=state().projects.find(item=>item.id===selection);
    let title, fields, extra='';
    if(type==='decisions'){
      if(!currentProject)return;
      const records=[...(currentProject.decisions||[])].sort((a,b)=>b.date.localeCompare(a.date));
      dialog.innerHTML=`<header><h3 id="planner-dialog-title">Decision log</h3><button type="button" data-dialog-close aria-label="Close dialog">×</button></header>
        <p>${escape(currentProject.name)}</p><div class="project-thoughts decision-list">${records.map(item=>{
          const tasks=item.taskIds.map(taskId=>state().tasks.find(task=>task.id===taskId)).filter(Boolean);
          const milestone=currentProject.milestones?.find(record=>record.id===item.milestoneId);
          return `<article><time datetime="${item.date}">${plainDate(item.date)}, ${item.date.slice(0,4)}</time><h4>${escape(item.name)}</h4><p>${escape(item.reason)}</p>
            <div class="decision-links">${tasks.map(task=>`<button type="button" data-milestone-task="${escape(task.id)}">${escape(task.text)}</button>`).join('')}
            ${milestone?`<button type="button" data-manage="milestone" data-value="${escape(milestone.id)}">${escape(milestone.name)}</button>`:''}</div>
            <button type="button" data-manage="decision" data-value="${escape(item.id)}">Edit decision</button></article>`;
        }).join('')||'<p>No decisions recorded yet.</p>'}</div><footer><button type="button" class="planner-primary" data-manage="decision">Add decision</button></footer>`;
      dialog.setAttribute('aria-labelledby','planner-dialog-title');
      if(!dialog.open)dialog.showModal();
      dialog.querySelector('[data-manage="decision"]')?.focus();return;
    }
    if(type==='decision'){
      if(!currentProject)return;
      const item=currentProject.decisions?.find(decision=>decision.id===id);
      title=item?'Edit decision':'Add decision';
      const links=state().tasks.filter(task=>task.projectId===selection||item?.taskIds.includes(task.id));
      fields=`<label>Decision<input name="name" maxlength="120" required value="${escape(item?.name)}"></label>
        <label>Date<input name="date" type="date" required value="${item?.date||dayKey()}"></label>
        <label>Why did you decide this?<textarea name="reason" rows="4" required maxlength="3000">${escape(item?.reason)}</textarea></label>
        <label>Milestone<select name="milestoneId"><option value="">None</option>${(currentProject.milestones||[]).map(milestone=>
          `<option value="${escape(milestone.id)}" ${item?.milestoneId===milestone.id?'selected':''}>${escape(milestone.name)}</option>`).join('')}</select></label>
        <fieldset class="milestone-links"><legend>Affected tasks</legend>${links.map(task=>
          `<label class="planner-check-label"><input type="checkbox" name="task" value="${escape(task.id)}" ${item?.taskIds.includes(task.id)?'checked':''}> ${escape(task.text)}</label>`).join('')||'<p>No tasks in this project yet.</p>'}</fieldset>
        <p role="alert" id="decision-error" hidden></p>`;
      extra='<button type="button" data-manage="decisions">Back to decision log</button>';
    } else if(type==='milestones'){
      if(!currentProject)return;
      dialog.innerHTML=milestoneList(currentProject);
      dialog.setAttribute('aria-labelledby','planner-dialog-title');
      if(!dialog.open)dialog.showModal();
      dialog.querySelector('[data-manage="milestone"]')?.focus();
      return;
    } else if(type==='milestone'){
      if(!currentProject)return;
      const milestone=currentProject.milestones?.find(item=>item.id===id);
      const selected=new Set(milestone?.taskIds||[]);
      const tasks=state().tasks.filter(task=>task.projectId===currentProject.id||selected.has(task.id));
      const links=tasks.map(task=>`<label class="planner-check-label"><input type="checkbox" name="task" value="${escape(task.id)}" ${selected.has(task.id)?'checked':''}> ${escape(task.text)}</label>`);
      for(const missing of selected){
        if(!tasks.some(task=>task.id===missing))links.push(`<label class="planner-check-label"><input type="checkbox" name="task" value="${escape(missing)}" checked> Removed task</label>`);
      }
      title=milestone?'Edit milestone':'Add milestone';
      fields=`<label>Milestone name<input name="name" maxlength="100" required value="${escape(milestone?.name)}"></label>
        <label>Target date<input type="date" name="date" required value="${escape(milestone?.date||dayKey())}"></label>
        <fieldset class="milestone-links"><legend>Linked tasks</legend>${links.join('')||'<p>Add tasks to this project to link them here.</p>'}</fieldset>`;
      extra='<button type="button" data-manage="milestones">Back</button>';
      if(milestone)extra+='<button type="submit" value="remove" formnovalidate>Remove milestone</button>';
    } else if(type==='weekly-goals'){
      if(!project)return;
      title='Weekly project goals';
      fields=`<p>${escape(project.name)}</p>
        <label>Focus minutes per week<input type="number" name="focusMinutes" min="1" max="10080" step="1" value="${project.weeklyGoals?.focusMinutes||''}"></label>
        <label>Chapters per week<input type="number" name="chapters" min="1" max="1000" step="1" value="${project.weeklyGoals?.chapters||''}"></label>
        <p>Leave a target blank to remove it. For reading progress, select this project when saving an Annotate log.</p>`;
    } else if (type==='project') {
      title=project?'Project settings':'Add project';
      fields=`<label>Project name<input name="name" maxlength="80" required value="${escape(project?.name)}"></label><label>Color<input name="color" type="color" value="${escape(project?.color||'#8dbfab')}"></label><label class="planner-check-label"><input type="checkbox" name="favorite" ${project?.favorite?'checked':''}> Add to favorites</label>`;
      if (project) extra=`<button type="submit" value="archive">${project.archived?'Restore project':'Archive project'}</button>`;
    } else if (type==='section') {
      if (!currentProject) return;
      const section=currentProject.sections.find(item=>item.id===id);
      title=section?'Edit section':'Add section';
      fields=`<label>Section name<input name="name" maxlength="80" required value="${escape(section?.name)}"></label>`;
      if (section) extra='<button type="submit" value="remove" formnovalidate>Remove section</button>';
    } else if (type==='filter') {
      title=filter?'Edit filter':'Add filter';
      fields=`<label>Filter name<input name="name" maxlength="80" required value="${escape(filter?.name)}"></label><label>Query<input name="query" maxlength="180" required value="${escape(filter?.query)}" placeholder="today &amp; p1 | %reading"></label><p>Use dates, #projects, %labels, p1–p4, overdue, undated, recurring, estimate&lt;=30, or due-this-week. Use | for alternatives and ! to exclude.</p>
        <label class="planner-check-label"><input type="checkbox" name="pinned" ${filter?.pinned?'checked':''}> Pin in Planner</label>`;
      if (filter) extra='<button type="submit" value="remove" formnovalidate>Remove filter</button>';
    } else if (type==='import') {
      title='Import Todoist project';
      fields='<label>Todoist project CSV<input type="file" name="csv" accept=".csv,text/csv" required></label><label>Project name (optional)<input name="name" maxlength="80" placeholder="Use the filename"></label><p>Imports a new project. Unsupported schedule text is kept in the task description.</p><p role="alert" id="planner-import-error" hidden></p>';
    } else if(type==='calendar-export'){
      const start=timeLayout()?calendarDate():date;
      const defaultScope=project?'project':layout==='day'?'day':'week';
      title='Export calendar';
      fields=`<label>Scope<select name="scope">${['day','week','project'].map(scope=>`<option value="${scope}" ${scope===defaultScope?'selected':''}>${scope[0].toUpperCase()+scope.slice(1)}</option>`).join('')}</select></label>
        <label>Date<input type="date" name="date" required value="${dayKey(start)}"></label>
        <label data-export-project ${project?'':'hidden'}>Project<select name="projectId" required ${project?'':'disabled'}><option value="">Choose a project</option>
          ${state().projects.map(item=>`<option value="${escape(item.id)}" ${item.id===project?.id?'selected':''}>${escape(item.name)}</option>`).join('')}</select></label>
        <label data-export-project ${project?'':'hidden'}>Through<input type="date" name="endDate" required ${project?'':'disabled'} value="${dayKey(shiftDay(start,29))}"></label>
        <label class="planner-check-label" data-export-events ${project?'hidden':''}><input type="checkbox" name="includeEvents" checked> Include calendar events</label>
        <p>Week exports use Monday through Sunday. Project exports include its timed task blocks in the selected date range.</p>
        <p id="calendar-export-error" role="alert" hidden></p>`;
    } else if (type==='calendar-import') {
      title='Import calendar';
      const sources=[...new Set(state().calendarEvents.filter(event=>!event.manual).map(event=>event.source||'Imported calendar'))];
      fields=`<label>iCalendar file<input type="file" name="calendar" accept=".ics,text/calendar" required></label><p>For Canvas, open Calendar → Calendar Feed and download the .ics file. Import it here again to refresh your assignments and events.</p><p><a href="https://community.instructure.com/en/kb/articles/662804-how-do-i-view-the-calendar-ical-feed-to-subscribe-to-an-external-calendar" target="_blank" rel="noopener noreferrer">Canvas calendar instructions ↗</a></p><p role="alert" id="planner-import-error" hidden></p>${sources.map(source=>`<p class="import-source">${escape(source)} <button type="button" data-remove-calendar="${escape(source)}">Remove</button></p>`).join('')}`;
    } else if (type==='project-thoughts') {
      if(!currentProject)return;
      dialog.innerHTML=`<header><h3 id="planner-dialog-title">${escape(currentProject.name)} · Thoughts</h3><button type="button" data-dialog-close aria-label="Close dialog">×</button></header><div class="project-thoughts">${(currentProject.thoughts||[]).map(note=>{
        const context=cleanCaptureContext(note.context);
        const captured=context?.block?`${context.title} · ${plainDate(context.block.occurrence)} at ${scheduledTime(context.block.time)}`:context?.title;
        return `<article><time>${escape(new Date(note.createdAt).toLocaleDateString())}</time><p>${escape(note.text)}</p>${captured?`<small>Captured during ${escape(captured)}</small>`:''}</article>`;
      }).join('')}</div>`;
      dialog.setAttribute('aria-labelledby','planner-dialog-title');
      dialog.showModal();
      return;
    } else if (type==='label') {
      title=id?'Edit label':'Add label'; fields=`<label>Label name<input name="name" maxlength="40" required value="${escape(id)}"></label>`;
      if (id) extra='<button type="submit" value="remove" formnovalidate>Remove label</button>';
    } else {
      title='Reschedule overdue tasks'; fields=`<label>New date<input name="date" type="date" required min="${dayKey()}" value="${dayKey()}"></label>`;
    }
    dialog.innerHTML=`<form data-manage-form="${type}" data-value="${escape(id)}"><header><h3 id="planner-dialog-title">${title}</h3><button type="button" data-dialog-close aria-label="Close dialog">×</button></header>${fields}<footer>${extra}<button class="planner-primary" type="submit" value="save">${type==='reschedule'?'Reschedule':type==='calendar-export'?'Download .ics':type.endsWith('import')?'Import':'Save'}</button></footer></form>`;
    dialog.setAttribute('aria-labelledby','planner-dialog-title');
    if(!dialog.open)dialog.showModal();
    if(type==='milestone')dialog.querySelector('[name="name"]').focus();
  }

  async function importCalendar(form,fields){
    const file=fields.get('calendar'),button=form.querySelector('[type="submit"]');
    const error=form.querySelector('#planner-import-error');
    button.disabled=true;
    try{
      if(!file?.size||file.size>2_000_000)throw new Error('Choose a nonempty .ics file smaller than 2 MB.');
      const data=parseCalendarImport(await file.text());
      if(!dialog.open||!form.isConnected)return;
      if(!data.events.length)throw new Error(data.skipped?'No supported events were found in this file.':'No calendar events were found.');
      if(data.events.length>10000)throw new Error('This file expands to more than 10,000 events. Export a shorter range.');
      const source=file.name.slice(0,150);
      const oldById=new Map(state().calendarEvents.map(event=>[event.id,event]));
      const events=new Map(state().calendarEvents.filter(event=>event.source!==source).map(event=>[event.id,event]));
      for(const event of data.events){
        const old=oldById.get(event.id),settings={};
        for(const key of ['bufferBefore','bufferAfter'])if(!event.day&&old?.[key])settings[key]=old[key];
        events.set(event.id,{...event,source,...settings});
      }
      if(events.size>10000)throw new Error('Remove an existing calendar before exceeding 10,000 imported events.');
      const previous=state().calendarEvents;
      state().calendarEvents=[...events.values()];
      if(!commit()){state().calendarEvents=previous;render();throw new Error('Calendar could not be saved. Try importing a shorter range.');}
      dialog.close();$('#planner-heading').focus({preventScroll:true});
      notify(`Imported ${data.events.length} calendar ${data.events.length===1?'event':'events'}.${data.skipped?` Skipped ${data.skipped} unsupported entries.`:''}`);
    }catch(cause){error.textContent=cause.message;error.hidden=false;}
    finally{button.disabled=false;}
  }

  async function importProject(form,fields) {
    const file=fields.get('csv'), button=form.querySelector('[type="submit"]');
    const error=form.querySelector('#planner-import-error');
    button.disabled=true;
    try {
      if (!file?.size||file.size>1_000_000) throw new Error('Choose a nonempty CSV smaller than 1 MB.');
      const csv=await file.text();
      if (!dialog.open||!form.isConnected) return;
      const name=(String(fields.get('name')||'').trim()||file.name.replace(/\.csv$/i,'')).slice(0,80);
      const result=importTodoistProject(csv,name);
      state().projects.push(result.project);
      state().tasks.push(...result.tasks);
      view='project'; selection=result.project.id; selectLayout(defaultLayout(),false); quick=null;
      dialog.close(); commit();
      $('#planner-heading').focus({preventScroll:true});
      notify(`Imported ${result.tasks.length} tasks.${result.unmappedDates?` ${result.unmappedDates} schedules were saved as text.`:''}`);
    } catch (cause) {
      error.textContent=cause.message; error.hidden=false;
    } finally { button.disabled=false; }
  }

  function saveDialog(form,action) {
    const type=form.dataset.manageForm,id=form.dataset.value, fields=new FormData(form);
    if(type==='decision'){
      const project=state().projects.find(item=>item.id===selection);
      if(!project)return;
      const item=projectDecision({id:id||blankId(),name:fields.get('name'),date:fields.get('date'),reason:fields.get('reason'),
        milestoneId:fields.get('milestoneId'),taskIds:fields.getAll('task')});
      const error=form.querySelector('#decision-error');
      if(!item){error.hidden=false;error.textContent='Enter a decision, date, and reason.';return;}
      const before=project.decisions||[];
      if(id&&!before.some(record=>record.id===id)){error.hidden=false;error.textContent='This decision was removed.';return;}
      project.decisions=[...before.filter(record=>record.id!==item.id),item];
      if(!commit()){project.decisions=before;return;}
      showDialog('decisions','',$('[data-manage="decisions"]'));notify('Decision saved.');return;
    }
    if (type==='import') return importProject(form,fields);
    if (type==='calendar-import') return importCalendar(form,fields);
    if(type==='calendar-export'){
      const options={...Object.fromEntries(fields),includeEvents:fields.has('includeEvents')};
      try{
        const {content,count,first}=exportCalendar(options.scope==='project'?state().tasks:activeTasks(),state().calendarEvents,options);
        const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));
        const download=document.createElement('a');
        download.href=url;download.download=`yin-yang-${options.scope}-${first}.ics`;
        dialog.append(download);download.click();download.remove();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
        dialog.close();notify(`Exported ${count} calendar ${count===1?'item':'items'}.`);
      }catch(error){
        const message=form.querySelector('#calendar-export-error');message.hidden=false;message.textContent=error.message;
      }
      return;
    }
    const name=String(fields.get('name')||'').trim();
    const projects=state().projects, filters=state().plannerFilters;
    if (action==='save'&&!['reschedule','weekly-goals'].includes(type)&&!name) {
      const input=form.elements.name;
      input.setCustomValidity('Enter a name.'); input.reportValidity(); return;
    }
    const rescheduleUndos=[];
    if(type==='weekly-goals'){
      const project=projects.find(item=>item.id===id);
      if(!project)return;
      const previous=project.weeklyGoals;
      project.weeklyGoals=Object.fromEntries(['focusMinutes','chapters'].filter(key=>fields.get(key))
        .map(key=>[key,Number(fields.get(key))]));
      if(!commit()){project.weeklyGoals=previous;render();return;}
      dialog.close();
      ($(`[data-manage="weekly-goals"][data-value="${CSS.escape(id)}"]`)||$('#planner-heading')).focus({preventScroll:true});
      notify('Weekly goals saved.');
      return;
    }
    if(type==='milestone'){
      const project=projects.find(item=>item.id===selection);
      if(!project)return;
      const previous=project.milestones||[];
      if(id&&!previous.some(item=>item.id===id))return;
      if(action==='remove'){
        project.milestones=previous.filter(item=>item.id!==id);
      }else{
        const item=projectMilestone({id:id||blankId(),name,date:fields.get('date'),taskIds:fields.getAll('task')});
        if(!item){
          form.elements.date.setCustomValidity('Choose a valid target date.');
          form.elements.date.reportValidity();
          return;
        }
        project.milestones=id?previous.map(old=>old.id===id?item:old):[...previous,item];
      }
      if(!commit()){project.milestones=previous;render();return;}
      showDialog('milestones','',$('[data-manage="milestones"]'));
      return;
    } else if (type==='project') {
      const project=projects.find(item=>item.id===id);
      if (action==='archive'&&project) {
        project.archived=!project.archived;
        if (project.archived&&state().tasks.some(task=>task.projectId===project.id&&task.id===state().activeTask)) state().activeTask=null;
      }
      else {
        const values={name,color:fields.get('color'),favorite:fields.has('favorite')};
        if (project) Object.assign(project,values);
        else {
          const created={id:blankId(),sections:[],...values};
          projects.push(created); view='project'; selection=created.id; selectLayout(defaultLayout(),false);
        }
      }
    } else if (type==='section') {
      const project=projects.find(item=>item.id===selection);
      if (project) {
        const section=project.sections.find(item=>item.id===id);
        if (section&&action==='remove') {
          project.sections=project.sections.filter(item=>item.id!==id);
          for (const task of state().tasks.filter(item=>item.projectId===project.id&&item.sectionId===id)) task.sectionId='';
        } else if (section) section.name=name;
        else project.sections.push({id:blankId(),name});
      }
    } else if (type==='filter') {
      const existing=filters.find(item=>item.id===id);
      if (action==='remove') state().plannerFilters=filters.filter(item=>item.id!==id);
      else{
        const values={name,query:String(fields.get('query')).trim(),pinned:fields.has('pinned')};
        if(existing)Object.assign(existing,values);
        else filters.push({id:blankId(),...values});
      }
    } else if (type==='label') {
      const labels=state().plannerLabels.filter(label=>label!==id);
      if (action!=='remove') labels.push(name);
      state().plannerLabels=[...new Set(labels)];
      for (const task of state().tasks.filter(item=>item.labels?.includes(id))) task.labels=[...new Set(task.labels.flatMap(label=>label===id?(action==='remove'?[]:[name]):[label]))];
      if (view==='label') { view='filters'; selection=''; selectLayout(defaultLayout(),false); }
    } else {
      const now=new Date(), target=fields.get('date');
      for (const task of activeTasks()) {
        if (!overdueDate(task,now)) continue;
        const finishUndo=captureTaskChange(task,['date']);
        task.date=target;
        const undo=finishUndo();
        if (undo) rescheduleUndos.push(undo);
      }
    }
    dialog.close();
    commit();
    $('#planner-heading').focus({preventScroll:true});
    if (rescheduleUndos.length) notify('Overdue tasks rescheduled.',latest=>rescheduleUndos.map(undo=>undo(latest)).some(Boolean));
  }

  root.addEventListener('click',event=>{
    const button=event.target.closest('button');
    const preset=button&&workViewPresets[button.dataset.pinWorkView];
    if(preset){
      const prior=state().plannerFilters;
      const existing=prior.find(item=>item.query===preset.query);
      const filter={id:existing?.id||blankId(),...preset,...existing,pinned:true};
      state().plannerFilters=existing?prior.map(item=>item===existing?filter:item):[...prior,filter];
      if(!commit()){state().plannerFilters=prior;render();return;}
      setView('filter',filter.id);return;
    }
    if (!button) return;
    const data=button.dataset;
    if(data.projectExams)return openExamPlans(data.projectExams,button);
    if('finishProject' in data){
      const project=state().projects.find(item=>item.id===selection&&!item.archived);
      if(view==='project'&&project&&finishProject(project)){
        renderProjectOverview(project);
        $('#project-growth-status')?.focus({preventScroll:true});
      }
      return;
    }
    if(data.resumeProject)return resumeProject(data.resumeProject);
    if(data.removeCalendar){
      const source=data.removeCalendar;
      const removed=state().calendarEvents.filter(event=>!event.manual&&(event.source||'Imported calendar')===source);
      state().calendarEvents=state().calendarEvents.filter(event=>event.manual||(event.source||'Imported calendar')!==source);
      dialog.close();commit();$('#planner-heading').focus({preventScroll:true});
      return notify('Imported calendar removed.',latest=>{
        const ids=new Set(latest.calendarEvents.map(event=>event.id));
        const restored=removed.filter(event=>!ids.has(event.id));
        latest.calendarEvents.push(...restored);
        return Boolean(restored.length);
      });
    }
    if(data.reviewStep){
      reviewWeek=data.reviewStep==='0'?new Date():shiftDay(reviewWeek,Number(data.reviewStep));
      renderContent();content.querySelector(`[data-review-step="${data.reviewStep}"]`)?.focus();return;
    }
    if(data.reviewCarry){
      const task=state().tasks.find(item=>item.id===data.reviewCarry);
      if(!task)return;
      const finish=captureTaskChange(task,['date']);
      task.date=dayKey();commit();$('#planner-heading').focus({preventScroll:true});return notify('Task moved to today.',finish());
    }
    if (data.calendarLayout&&data.calendarLayout!==layout) return setCalendarLayout(data.calendarLayout);
    if (data.plannerView) return setView(data.plannerView,data.value);
    if (data.fold) {
      const open=collapsed.has(data.fold);
      if (open) collapsed.delete(data.fold); else collapsed.add(data.fold);
      button.setAttribute('aria-expanded',String(open));
      $(`#planner-group-${data.fold}`).hidden=!open;
      return;
    }
    if ('reportExport' in data) return exportReport();
    if (data.reportTask) return editTask(data.reportTask,button);
    if (data.plannerStep) {
      if (data.plannerStep==='0') date=new Date();
      else if (layout==='month') date=new Date(date.getFullYear(),date.getMonth()+Math.sign(Number(data.plannerStep)),1);
      else date=shiftDay(date,Number(data.plannerStep));
      quick=null; content.scrollLeft=0; return render();
    }
    if (button.id==='planner-toggle-sidebar') {
      root.classList.toggle(smallScreen.matches?'planner-sidebar-open':'planner-sidebar-compact');
      syncSidebar(); return;
    }
    if ('plannerAdd' in data) return add(button);
    if ('quickCancel' in data) { quick=null; return render(); }
    if ('quickDetails' in data) {
      const defaults=quickTask(quick.draft,quick.defaults,state().projects)||{...quick.defaults,text:quick.draft};
      quick=null; render(); return editTask(null,$('#planner-heading'),defaults);
    }
    if(data.milestoneTask){
      dialogAnchor=null;dialog.close();
      return editTask(data.milestoneTask,$('#planner-heading'));
    }
    if (data.manage) return showDialog(data.manage,data.value||'',dialog.contains(button)?dialogAnchor:button);
    if ('dialogClose' in data) return dialog.close();
    if (data.monthDay) {
      setCalendarLayout(view==='calendar'?'day':'calendar',parseDay(data.monthDay));
      $('#calendar-scroll').focus({preventScroll:true});
      return;
    }
    if (data.calendarEvent && button.classList.contains('planner-month-event')) return openBlock(button);
    if ('monthTask' in data) return editTask(data.task,button);
    const card=button.closest('.planner-task');
    if ('openTime' in data) return openBlock(button);
    if (!card) return;
    const task=state().tasks.find(item=>item.id===card.dataset.task);
    if (!task) return;
    if ('editTask' in data) return editTask(task.id,button);
    if ('taskMenu' in data) return taskMenu(task.id,button);
    if ('completeTask' in data) {
      const day=parseDay(card.dataset.occurrence), done=taskStatus(task,day)!=='done';
      const undo=completeTask(task,done,day,button);
      commit();
      const next=content.querySelector(`[data-task="${CSS.escape(task.id)}"] [data-complete-task]`);
      (next||$('#planner-heading')).focus({preventScroll:true});
      notify(done?'Task completed.':'Task reopened.',undo);
    }
  });

  root.addEventListener('submit',event=>{
    const form=event.target;
    if(form.id==='study-capacity-form'){
      event.preventDefault();
      state().studyCapacity=Number(form.elements.minutes.value);
      commit();$('#study-capacity-form input')?.focus();return notify('Study capacity saved.');
    }
    if (form.matches('[data-manage-form]')) { event.preventDefault(); return saveDialog(form,event.submitter?.value||'save'); }
    if (!form.matches('[data-quick-form]')) return;
    event.preventDefault();
    const task=quickTask(form.elements.name.value,quick.defaults,state().projects);
    if (!task) { form.elements.name.setCustomValidity('Enter a task name.'); form.elements.name.reportValidity(); return; }
    state().tasks.push(task);
    if (!state().activeTask&&taskStatus(task)==='todo') state().activeTask=task.id;
    quick.draft=''; commit(); $('#planner-quick-name')?.focus({preventScroll:true}); notify('Task added.');
  });

  root.addEventListener('input',event=>{
    const input=event.target;
    if (input.id==='planner-search') { query=input.value.trim(); renderContent(); }
    if (input.id==='planner-quick-name'&&quick) {
      quick.draft=input.value; input.setCustomValidity('');
      const {preview,hint}=quickScheduling(), region=input.form.querySelector('.schedule-preview');
      region.hidden=!preview;
      const markup=preview?.markup||'';
      if(region.innerHTML!==markup)region.innerHTML=markup;
      const estimate=input.form.querySelector('.estimate-suggestion');
      estimate.hidden=!hint;estimate.textContent=hint||'';
      input.form.querySelector('button[type="submit"]').textContent=preview?.overlaps.length?'Add with overlap':'Add task';
    }
    if (input.closest('[data-manage-form]')) input.setCustomValidity?.('');
  });
  root.addEventListener('change',event=>{
    const input=event.target;
    if(input.name==='scope'&&input.form?.dataset.manageForm==='calendar-export'){
      const project=input.value==='project';
      for(const field of input.form.querySelectorAll('[data-export-project]')){
        field.hidden=!project;field.querySelector('input,select').disabled=!project;
      }
      input.form.querySelector('[data-export-events]').hidden=project;
    }
    if (input===layoutSelect) { selectLayout(input.value); quick=null; content.scrollLeft=0; return render(); }
    if (input.dataset.reportControl) {
      report[input.dataset.reportControl]=input.value;
      renderContent(); $(`#${input.id}`)?.focus({preventScroll:true}); return;
    }
    if (input===completed||input===sort) return render();
    if (input.id==='calendar-project') { calendarProject=input.value; return render(); }
    if (input.id==='planner-jump-date'&&input.value) { date=parseDay(input.value); quick=null; content.scrollLeft=0; return render(); }
    if (!input.dataset.plannerSubtask) return;
    const card=input.closest('.planner-task');
    const task=state().tasks.find(item=>item.id===card.dataset.task);
    const sub=task?.subtasks.find(item=>item.id===input.dataset.plannerSubtask);
    if (sub) {
      sub.done=input.checked; expanded.add(task.id); commit();
      root.querySelector(`[data-planner-subtask="${CSS.escape(sub.id)}"]`)?.focus({preventScroll:true});
    }
  });
  root.addEventListener('toggle',event=>{
    const details=event.target;
    if (!details.matches('.planner-subtasks')||!details.isConnected) return;
    const id=details.closest('.planner-task').dataset.task;
    if (details.open) expanded.add(id); else expanded.delete(id);
  },true);
  dialog.addEventListener('close',()=>{if (dialogAnchor?.isConnected) dialogAnchor.focus({preventScroll:true});});

  const dropColumn=event=>event.target.closest('[data-board-day], [data-board-section]');
  root.addEventListener('dragover',event=>{
    const column=dropColumn(event);
    if (!column||!event.dataTransfer.types.includes(calendarDragType)) return;
    event.preventDefault(); column.classList.add('planner-drop');
  });
  root.addEventListener('dragleave',event=>{
    const column=dropColumn(event);
    if (column&&!column.contains(event.relatedTarget)) column.classList.remove('planner-drop');
  });
  root.addEventListener('drop',event=>{
    const column=dropColumn(event);
    if (!column||!event.dataTransfer.types.includes(calendarDragType)) return;
    event.preventDefault(); column.classList.remove('planner-drop');
    let id;
    try { id=JSON.parse(event.dataTransfer.getData(calendarDragType)).task; } catch { return; }
    const task=state().tasks.find(item=>item.id===id);
    if (!task) return;
    const finishUndo=captureTaskChange(task,['date','projectId','sectionId']);
    if (column.dataset.boardDay) {
      const target=parseDay(column.dataset.boardDay);
      if (task.repeat==='weekdays'&&[0,6].includes(target.getDay())) { notify('Choose a weekday for this repeating task.'); return; }
      task.date=column.dataset.boardDay;
    } else {
      task.projectId=selection; task.sectionId=column.dataset.boardSection;
    }
    const undo=finishUndo();
    if (undo) { commit(); notify('Task moved.',undo); }
  });

  document.addEventListener('keydown',event=>{
    if (root.hidden||root.inert||dialog.open||hasPanel()||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,select,[contenteditable]')) return;
    if (event.key.toLowerCase()==='q') {
      if(view==='calendar'&&isActualCalendar())return;
      event.preventDefault();
      if (view==='calendar') $('#planner-heading-actions [data-calendar-new]').click(); else add();
    }
    if (view==='calendar') return;
    if (event.key==='/'&&view!=='search') { event.preventDefault(); setView('search'); }
    if (event.shiftKey&&event.key.toLowerCase()==='v'&&!['filters','reporting','search'].includes(view)) {
      event.preventDefault(); selectLayout({board:'list',list:'calendar',calendar:'3days','3days':'month',month:'board'}[layout]); render();
    }
  });

  function checkReminders(now=new Date()) {
    if (document.hidden) return false;
    const minute=Math.floor(now.getTime()/60000);
    if (minute===reminderMinute) return false;
    reminderMinute=minute;
    const reminders=activeTasks().filter(task=>task.reminderAt&&!task.reminderShown&&task.reminderAt<=now.getTime()&&taskStatus(task,now)!=='done');
    if (!reminders.length) return false;
    reminders.forEach(task=>{task.reminderShown=true;});
    notify(reminders.length===1?`Reminder: ${reminders[0].text}`:`${reminders.length} task reminders are due.`);
    return true;
  }

  return {open,render,calendarTasks,checkReminders,setCalendarLayout,jumpMonth,openProject:id=>setView('project',id),calendarAnchor:()=>date,
    refreshReporting:()=>{if (!root.hidden&&view==='reporting') renderContent();},calendarVisible:()=>!$('#planner-calendar-view').hidden};
}
