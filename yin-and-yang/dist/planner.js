import {calendarBlocks,calendarDragType,shiftDay,timeLabel,timeMinutes,weekDays} from './calendar.js';
import {completeTask,dayKey,taskPriority,taskStatus} from './state.js';
import {importTodoistProject,matchesPlannerQuery,nextTaskDate,quickTask} from './planner-data.js';

const views={search:'Search',inbox:'Inbox',today:'Today',upcoming:'Upcoming',filters:'Filters & Labels',reporting:'Reporting'};
const paths={
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  inbox:'<path d="M4 13 7 5h10l3 8v6H4zM4 13h5l1 3h4l1-3h5"/>',
  today:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 9h16m-10 5h4"/>',
  upcoming:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 9h16M8 13h1m3 0h1m3 0h1m-9 3h1m3 0h1"/>',
  filters:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  reporting:'<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M7 13h3l2-4 2 6 2-3h2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',project:'<path d="m10 4-4 16m12-16-4 16M5 9h15M3 15h15"/>',
  mark:'<path d="m5 8 3 3 6-6m-9 9 3 3 10-10m-8 12 3 2 6-6"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const parseDay=key=>new Date(`${key}T00:00:00`);
const shortDay=date=>date.toLocaleDateString([], {month:'short',day:'numeric'});
const plainDate=key=>shortDay(parseDay(key));
const scheduledTime=value=>timeLabel(timeMinutes(value));
const blankId=()=>crypto.randomUUID();

export function installPlanner({root,getState,commit,editTask,openBlock,taskMenu,calendarChanged,notify,hasPanel}) {
  const $=selector=>root.querySelector(selector);
  const sidebar=$('#planner-sidebar'), content=$('#planner-content'), dialog=$('#planner-dialog');
  const layoutSelect=$('#planner-layout'), completed=$('#planner-completed'), sort=$('#planner-sort');
  const state=()=>getState();
  let view='upcoming', selection='', layout='board', query='', date=new Date(), quick=null, expanded=new Set(), dialogAnchor=null;
  let reminderMinute=-1;

  function setView(next,value='') {
    view=next; selection=value; query=''; quick=null;
    if (view==='today'||view==='upcoming') date=new Date();
    root.classList.remove('planner-sidebar-open');
    $('#planner-toggle-sidebar').setAttribute('aria-expanded','false');
    content.scrollLeft=0;
    content.scrollTop=0;
    render();
    if (view==='search') $('#planner-search')?.focus();
    else $('#planner-heading').focus({preventScroll:true});
  }

  function projectFor(task) { return state().projects.find(project=>project.id===task.projectId); }
  function activeTasks() { return state().tasks.filter(task=>!projectFor(task)?.archived); }
  function todayDate(task,now) { return nextTaskDate(task,now,true)===dayKey(now)||calendarBlocks([task],now).length>0; }
  function timeLayout() { return layout==='calendar'||layout==='3days'; }

  function matchingTasks(now=new Date()) {
    const tasks=view==='project'?state().tasks.filter(task=>task.projectId===selection):activeTasks();
    switch (view) {
      case 'inbox': return tasks.filter(task=>!projectFor(task));
      case 'today': return tasks.filter(task=>todayDate(task,now)||(task.repeat==='none'&&nextTaskDate(task,now)&&nextTaskDate(task,now)<dayKey(now)));
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
    return `<button type="button" class="planner-nav-item" data-planner-view="${key}" data-value="${escape(value)}" ${current?'aria-current="page"':''}>${mark}<span>${escape(label)}</span>${count!==''?`<small>${count}</small>`:''}</button>`;
  }

  function renderSidebar() {
    const now=new Date(), tasks=activeTasks().filter(task=>taskStatus(task,now)!=='done');
    const projects=state().projects.filter(project=>!project.archived).sort((a,b)=>Number(b.favorite)-Number(a.favorite));
    const primary=Object.entries(views).map(([key,label])=>navItem(key,label,key==='inbox'?tasks.filter(task=>!projectFor(task)).length:key==='today'?tasks.filter(task=>todayDate(task,now)).length:''));
    sidebar.innerHTML=`<div class="planner-brand"><span>${icon('mark')}</span><div><strong>Yin and Yang</strong><small>Personal workspace</small></div></div>
      <button class="planner-add" type="button" data-planner-add>${icon('plus')} Add task <kbd>Q</kbd></button>
      <nav aria-label="Planner views">${primary.join('')}</nav>
      <div class="planner-sidebar-heading"><h3>My projects</h3><button type="button" data-manage="project" aria-label="Add project">${icon('plus')}</button></div>
      <nav aria-label="Projects">${projects.map(project=>navItem('project',project.name,tasks.filter(task=>task.projectId===project.id).length,project.id,`<span class="planner-project-mark" style="color:${escape(project.color)}">${icon('project')}</span>`)).join('')||'<p class="planner-side-empty">Group related tasks in a project.</p>'}</nav>
      ${state().plannerFilters.length?`<div class="planner-sidebar-heading"><h3>Saved filters</h3></div><nav aria-label="Saved filters">${state().plannerFilters.map(filter=>navItem('filter',filter.name,'',filter.id,icon('filters'))).join('')}</nav>`:''}
      <div class="planner-sidebar-foot"><button type="button" data-manage="import">Import Todoist CSV</button><span></span> Stored on this device</div>`;
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
    return `<article class="planner-task${complete?' planner-task-done':''}" data-task="${escape(task.id)}" data-occurrence="${escape(current)}" data-priority="${priority}" draggable="true">
      <button type="button" class="planner-check" data-complete-task aria-pressed="${complete}" aria-label="${complete?'Reopen':'Complete'} ${title}">${complete?'✓':''}</button>
      <div class="planner-task-copy">
        <button type="button" class="planner-task-title" data-edit-task>${title}</button>
        ${task.description?`<p>${escape(task.description)}</p>`:''}
        <div class="planner-task-meta">
          ${dateLabel?`<span class="planner-task-date${dateLabel<dayKey()&&!complete?' is-overdue':''}">${icon('today')} ${task.time&&dateLabel>=dayKey()?scheduledTime(task.time):plainDate(dateLabel)}${recurring?' ↻':''}</span>`:''}
          <span>${project?icon('project'):icon('inbox')} ${escape(project?.name||'Inbox')}</span>
          ${priority<4?`<span class="planner-priority">P${priority}</span>`:''}
          ${task.deadline?`<span class="planner-deadline">Due ${plainDate(task.deadline)}</span>`:''}
          ${task.reminderAt?'<span title="Reminder scheduled">◷</span>':''}
          ${task.comments?.length?`<span>${task.comments.length} ${task.comments.length===1?'comment':'comments'}</span>`:''}
          ${labels}
        </div>
        ${subtasks.length?`<details class="planner-subtasks" ${expanded.has(task.id)?'open':''}><summary>${done}/${subtasks.length} subtasks</summary>${subtasks.map(sub=>`<label><input type="checkbox" data-planner-subtask="${escape(sub.id)}" ${sub.done?'checked':''}> <span>${escape(sub.text)}</span></label>`).join('')}</details>`:''}
      </div>
      <button type="button" class="planner-task-more" data-task-menu aria-label="Actions for ${title}" aria-haspopup="menu">⋯</button>
    </article>`;
  }

  function quickForm(key,defaults) {
    if (quick?.key!==key) return `<button class="planner-column-add" type="button" data-planner-add data-key="${escape(key)}" data-date="${escape(defaults.date)}" data-section="${escape(defaults.sectionId)}">${icon('plus')} Add task</button>`;
    return `<form class="planner-quick-form" data-quick-form><label class="sr-only" for="planner-quick-name">Task name</label><input id="planner-quick-name" name="name" placeholder="Task name" maxlength="300" required value="${escape(quick.draft)}">
      <div class="planner-quick-meta">${escape(state().projects.find(project=>project.id===quick.defaults.projectId)?.name||'Inbox')}${quick.defaults.date?` · ${plainDate(quick.defaults.date)}`:''}</div>
      <small>Try “Read chapter tomorrow at 4pm p1 %reading”</small><div class="planner-quick-actions"><button type="button" data-quick-details>More details</button><button type="button" data-quick-cancel>Cancel</button><button class="planner-primary" type="submit">Add task</button></div></form>`;
  }

  function timeStack(tasks,day) {
    if (!day) return '';
    const blocks=calendarBlocks(tasks,parseDay(day)).filter(block=>completed.checked||taskStatus(block.task,parseDay(block.occurrence))!=='done');
    if (!blocks.length) return '';
    const rows=blocks.map(block=>`<button type="button" class="planner-event" data-open-time data-task="${escape(block.task.id)}" data-block="${escape(block.blockId)}" data-occurrence="${block.occurrence}" data-priority="${taskPriority(block.task)}"><time>${timeLabel(block.start)} – ${timeLabel(block.end)}</time><span>${escape(block.task.text)}</span></button>`);
    return `<div class="planner-event-stack">${rows.slice(0,4).join('')}${rows.length>4?`<details><summary>${rows.length-4} more scheduled</summary>${rows.slice(4).join('')}</details>`:''}</div>`;
  }

  function column({key,title,tasks,day='',sectionId='',overdue=false,allowAdd=true,scheduleTasks=tasks}) {
    const dateForTask=task=>day||nextTaskDate(task,new Date(),true);
    const cards=sortTasks(tasks).map(task=>card(task,dateForTask(task))).join('');
    return `<section class="planner-column" ${day?`data-board-day="${day}"`:view==='project'?`data-board-section="${escape(sectionId)}"`:''}>
      <header><h3>${escape(title)} <small>${tasks.length}</small></h3>${overdue?'<button type="button" data-manage="reschedule">Reschedule</button>':''}${sectionId?`<button type="button" data-manage="section" data-value="${escape(sectionId)}" aria-label="Edit ${escape(title)} section">⋯</button>`:''}</header>
      <div class="planner-column-body">${timeStack(scheduleTasks,day)}${cards}${allowAdd?quickForm(key,{date:day,sectionId}):''}${!cards&&!allowAdd?'<p class="planner-empty">No tasks here.</p>':''}</div>
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
    const labels=[...new Set(activeTasks().flatMap(task=>task.labels||[]))].sort((a,b)=>a.localeCompare(b));
    const row=(name,view,id,manage,mark)=>`<div class="planner-collection-row">${navItem(view,name,'',id,mark)}<button type="button" data-manage="${manage}" data-value="${escape(id)}" aria-label="Edit ${escape(name)}">⋯</button></div>`;
    return `<div class="planner-collection">
      <section><header><h3>Filters</h3><button type="button" data-manage="filter">+ Add filter</button></header>
        ${state().plannerFilters.map(item=>row(item.name,'filter',item.id,'filter',icon('filters'))).join('')||'<p class="planner-empty">Save a search to revisit it anytime.</p>'}</section>
      <section><header><h3>Labels</h3></header>${labels.map(label=>row(label,'label',label,'label','<span>%</span>')).join('')||'<p class="planner-empty">Add a label to a task or type %label in Quick Add.</p>'}</section>
      ${state().projects.some(project=>project.archived)?`<section><header><h3>Archived projects</h3></header>${state().projects.filter(project=>project.archived).map(project=>row(project.name,'project',project.id,'project',icon('project'))).join('')}</section>`:''}</div>`;
  }

  function reportingMarkup() {
    const now=new Date();
    const days=Array.from({length:7},(_,index)=>shiftDay(now,index-6));
    const stats=days.map(date=>{
      const key=dayKey(date);
      const done=state().tasks.filter(task=>task.completedOn===key||task.completions?.includes(key)).length;
      const sessions=state().history.filter(item=>item.day===key&&item.mode==='focus'&&item.outcome==='completed');
      return {date,done,sessions:sessions.length,minutes:Math.round(sessions.reduce((sum,item)=>sum+item.focusMs,0)/60000)};
    });
    const total=key=>stats.reduce((sum,item)=>sum+item[key],0), peak=Math.max(1,...stats.map(item=>item.minutes));
    return `<div class="planner-report"><p class="planner-empty">Last 7 days · ${shortDay(days[0])} – ${shortDay(now)}</p>
      <div class="planner-report-stats"><div><strong>${total('done')}</strong><span>Tasks completed</span></div><div><strong>${total('sessions')}</strong><span>Focus sessions</span></div><div><strong>${total('minutes')}</strong><span>Focus minutes</span></div></div>
      <h3>Daily activity</h3><table><thead><tr><th scope="col">Day</th><th scope="col">Focus minutes</th><th scope="col">Tasks</th></tr></thead><tbody>${stats.map(item=>`<tr><th scope="row">${shortDay(item.date)}</th><td><div class="planner-report-bar"><span style="--bar:${item.minutes/peak*100}%"></span><small>${item.minutes}</small></div></td><td>${item.done}</td></tr>`).join('')}</tbody></table></div>`;
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
        ${allDay.map(task=>`<button type="button" class="planner-month-task" data-month-task data-task="${escape(task.id)}" title="${escape(task.text)}">${escape(task.text)}</button>`).join('')}
        ${timeStack(tasks,key)}</section>`;
    }).join('');
    return `<div class="planner-month-grid">${headings}${cells}</div>`;
  }

  function renderContent() {
    const left=content.scrollLeft, top=content.scrollTop;
    const columns=[...content.querySelectorAll('.planner-column-body')].map(column=>column.scrollTop);
    const tasks=matchingTasks();
    const month=layout==='month'&&!['filters','reporting','search'].includes(view);
    content.className=month?'planner-month':layout==='board'&&view!=='search'&&!['filters','reporting'].includes(view)?'planner-board':'planner-list';
    content.innerHTML=view==='filters'?filtersMarkup():view==='reporting'?reportingMarkup():month?monthMarkup(calendarTasks()):boardMarkup(tasks);
    content.scrollLeft=left;
    content.scrollTop=top;
    content.querySelectorAll('.planner-column-body').forEach((column,index)=>{column.scrollTop=columns[index]||0;});
    $('#planner-search-count').textContent=view==='search'&&query?`${tasks.length} results`:'';
  }

  function render() {
    const project=view==='project'?state().projects.find(item=>item.id===selection):null;
    const filter=view==='filter'?state().plannerFilters.find(item=>item.id===selection):null;
    if (view==='project'&&!project||view==='filter'&&!filter) { view='upcoming'; selection=''; }
    renderSidebar();
    const sectionView=view==='filters'||view==='reporting'||view==='search';
    const calendar=timeLayout()&&!sectionView;
    $('#planner-heading').textContent=project?.name||filter?.name||(view==='label'?`%${selection}`:views[view]);
    $('#planner-breadcrumb').textContent=project?.archived?'Archived project':'Personal planner';
    $('#planner-heading-actions').innerHTML=project?`<button type="button" data-manage="section">+ Section</button><button type="button" data-manage="project" data-value="${escape(project.id)}">Project settings</button>`:filter?`<button type="button" data-manage="filter" data-value="${escape(filter.id)}">Edit filter</button>`:'';
    $('#planner-layout-label').hidden=sectionView;
    $('#planner-display').hidden=view==='reporting'||view==='filters';
    $('#planner-board-tools').hidden=sectionView||calendar||(view!=='upcoming'&&layout!=='month');
    $('#planner-month').textContent=date.toLocaleDateString([],{month:'long',year:'numeric'});
    $('#planner-jump-date').value=dayKey(date);
    $('#planner-search-row').hidden=view!=='search';
    if ($('#planner-search').value!==query) $('#planner-search').value=query;
    $('#planner-calendar-view').hidden=!calendar;
    content.hidden=calendar;
    $('#planner-quick-strip').hidden=quick?.key!=='top';
    $('#planner-quick-strip').innerHTML=quick?.key==='top'?quickForm('top',quick.defaults):'';
    if (calendar) calendarChanged(date,layout==='3days'?3:7);
    else renderContent();
  }

  function open(anchorDate,forceCalendar) {
    date=anchorDate;
    view='upcoming'; selection=''; query=''; quick=null;
    layout=forceCalendar?'calendar':'board';
    layoutSelect.value=layout;
    render();
    content.scrollLeft=0;
  }

  function add(button) {
    const key=timeLayout()||layout==='month'?'top':button?.dataset.key||'top';
    const defaults={date:button?.dataset.date||(view==='today'?dayKey():''),projectId:view==='project'?selection:'',sectionId:button?.dataset.section||''};
    quick={key,defaults,draft:''};
    render();
    $('#planner-quick-name')?.focus();
  }

  function showDialog(type,id,anchor) {
    dialogAnchor=anchor;
    const project=state().projects.find(item=>item.id===id), filter=state().plannerFilters.find(item=>item.id===id);
    const currentProject=state().projects.find(item=>item.id===selection);
    let title, fields, extra='';
    if (type==='project') {
      title=project?'Project settings':'Add project';
      fields=`<label>Project name<input name="name" maxlength="80" required value="${escape(project?.name)}"></label><label>Color<input name="color" type="color" value="${escape(project?.color||'#d94b49')}"></label><label class="planner-check-label"><input type="checkbox" name="favorite" ${project?.favorite?'checked':''}> Add to favorites</label>`;
      if (project) extra=`<button type="submit" value="archive">${project.archived?'Restore project':'Archive project'}</button>`;
    } else if (type==='section') {
      if (!currentProject) return;
      const section=currentProject.sections.find(item=>item.id===id);
      title=section?'Edit section':'Add section';
      fields=`<label>Section name<input name="name" maxlength="80" required value="${escape(section?.name)}"></label>`;
      if (section) extra='<button type="submit" value="remove" formnovalidate>Remove section</button>';
    } else if (type==='filter') {
      title=filter?'Edit filter':'Add filter';
      fields=`<label>Filter name<input name="name" maxlength="80" required value="${escape(filter?.name)}"></label><label>Query<input name="query" maxlength="180" required value="${escape(filter?.query)}" placeholder="today &amp; p1 | %reading"></label><p>Use dates, #projects, %labels, p1–p4, overdue, undated, recurring, or words. Use | for alternatives and ! to exclude.</p>`;
      if (filter) extra='<button type="submit" value="remove" formnovalidate>Remove filter</button>';
    } else if (type==='import') {
      title='Import Todoist project';
      fields='<label>Todoist project CSV<input type="file" name="csv" accept=".csv,text/csv" required></label><label>Project name (optional)<input name="name" maxlength="80" placeholder="Use the filename"></label><p>Imports a new project. Unsupported schedule text is kept in the task description.</p><p role="alert" id="planner-import-error" hidden></p>';
    } else if (type==='label') {
      title='Edit label'; fields=`<label>Label name<input name="name" maxlength="40" required value="${escape(id)}"></label>`;
      extra='<button type="submit" value="remove" formnovalidate>Remove label</button>';
    } else {
      title='Reschedule overdue tasks'; fields=`<label>New date<input name="date" type="date" required min="${dayKey()}" value="${dayKey()}"></label>`;
    }
    dialog.innerHTML=`<form data-manage-form="${type}" data-value="${escape(id)}"><header><h3 id="planner-dialog-title">${title}</h3><button type="button" data-dialog-close aria-label="Close dialog">×</button></header>${fields}<footer>${extra}<button class="planner-primary" type="submit" value="save">${type==='reschedule'?'Reschedule':type==='import'?'Import':'Save'}</button></footer></form>`;
    dialog.setAttribute('aria-labelledby','planner-dialog-title');
    dialog.showModal();
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
      view='project'; selection=result.project.id; layout='board'; layoutSelect.value=layout; quick=null;
      dialog.close(); commit();
      $('#planner-heading').focus({preventScroll:true});
      notify(`Imported ${result.tasks.length} tasks.${result.unmappedDates?` ${result.unmappedDates} schedules were saved as text.`:''}`);
    } catch (cause) {
      error.textContent=cause.message; error.hidden=false;
    } finally { button.disabled=false; }
  }

  function saveDialog(form,action) {
    const type=form.dataset.manageForm,id=form.dataset.value, fields=new FormData(form);
    if (type==='import') return importProject(form,fields);
    const name=String(fields.get('name')||'').trim();
    const projects=state().projects, filters=state().plannerFilters;
    if (action==='save'&&type!=='reschedule'&&!name) {
      const input=form.elements.name;
      input.setCustomValidity('Enter a name.'); input.reportValidity(); return;
    }
    if (type==='project') {
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
          projects.push(created); view='project'; selection=created.id;
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
      else if (existing) Object.assign(existing,{name,query:String(fields.get('query')).trim()});
      else filters.push({id:blankId(),name,query:String(fields.get('query')).trim()});
    } else if (type==='label') {
      for (const task of state().tasks.filter(item=>item.labels?.includes(id))) task.labels=[...new Set(task.labels.flatMap(label=>label===id?(action==='remove'?[]:[name]):[label]))];
      if (view==='label') { view='filters'; selection=''; }
    } else {
      const now=new Date(), today=dayKey(now), target=fields.get('date');
      for (const task of activeTasks()) {
        const scheduled=nextTaskDate(task,now);
        if (task.repeat==='none'&&!task.done&&scheduled&&scheduled<today) task.date=target;
      }
    }
    dialog.close();
    commit();
    $('#planner-heading').focus({preventScroll:true});
  }

  root.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if (!button) return;
    const data=button.dataset;
    if (data.plannerView) return setView(data.plannerView,data.value);
    if (data.plannerStep) {
      if (data.plannerStep==='0') date=new Date();
      else if (layout==='month') date=new Date(date.getFullYear(),date.getMonth()+Math.sign(Number(data.plannerStep)),1);
      else date=shiftDay(date,Number(data.plannerStep));
      quick=null; content.scrollLeft=0; return render();
    }
    if (button.id==='planner-toggle-sidebar') {
      const open=root.classList.toggle('planner-sidebar-open');
      button.setAttribute('aria-expanded',String(open)); return;
    }
    if ('plannerAdd' in data) return add(button);
    if ('quickCancel' in data) { quick=null; return render(); }
    if ('quickDetails' in data) {
      const defaults=quickTask(quick.draft,quick.defaults,state().projects)||{...quick.defaults,text:quick.draft};
      quick=null; render(); return editTask(null,$('#planner-heading'),defaults);
    }
    if (data.manage) return showDialog(data.manage,data.value||'',button);
    if ('dialogClose' in data) return dialog.close();
    if (data.monthDay) {
      date=parseDay(data.monthDay); layout='calendar'; layoutSelect.value=layout; render(); return;
    }
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
      completeTask(task,done,task.repeat==='none'?new Date():day);
      if (done&&state().activeTask===task.id&&taskStatus(task)==='done') state().activeTask=null;
      commit(); notify(done?'Task completed.':'Task reopened.');
      const next=content.querySelector(`[data-task="${CSS.escape(task.id)}"] [data-complete-task]`);
      (next||$('#planner-heading')).focus({preventScroll:true});
    }
  });

  root.addEventListener('submit',event=>{
    const form=event.target;
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
    if (input.id==='planner-quick-name'&&quick) { quick.draft=input.value; input.setCustomValidity(''); }
    if (input.closest('[data-manage-form]')) input.setCustomValidity?.('');
  });
  root.addEventListener('change',event=>{
    const input=event.target;
    if (input===layoutSelect) { layout=input.value; quick=null; content.scrollLeft=0; return render(); }
    if (input===completed||input===sort) return render();
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
    if (column.dataset.boardDay) {
      const target=parseDay(column.dataset.boardDay);
      if (task.repeat==='weekdays'&&[0,6].includes(target.getDay())) { notify('Choose a weekday for this repeating task.'); return; }
      task.date=column.dataset.boardDay;
    } else {
      task.projectId=selection; task.sectionId=column.dataset.boardSection;
    }
    commit(); notify('Task moved.');
  });

  document.addEventListener('keydown',event=>{
    if (root.hidden||root.inert||dialog.open||hasPanel()||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,select,[contenteditable]')) return;
    if (event.key.toLowerCase()==='q') { event.preventDefault(); add(); }
    if (event.key==='/'&&view!=='search') { event.preventDefault(); setView('search'); }
    if (event.shiftKey&&event.key.toLowerCase()==='v'&&!['filters','reporting','search'].includes(view)) {
      event.preventDefault(); layout={board:'list',list:'calendar',calendar:'3days','3days':'month',month:'board'}[layout]; layoutSelect.value=layout; render();
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

  return {open,render,calendarTasks,checkReminders,calendarVisible:()=>!$('#planner-calendar-view').hidden};
}
