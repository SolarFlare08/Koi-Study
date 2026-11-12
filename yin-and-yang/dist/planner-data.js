import {dayKey, taskOccursOn, taskPriority, taskStatus} from './state.js';
import {shiftDay, timeValue, weekDays} from './calendar.js';

const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

export function plannerDate(value, now = new Date()) {
  const word = value.trim().toLowerCase();
  if (word === 'today') return dayKey(now);
  if (word === 'tomorrow') return dayKey(shiftDay(now,1));
  if (word === 'next week') return dayKey(shiftDay(now,7));
  const weekday = weekdays.indexOf(word);
  if (weekday >= 0) return dayKey(shiftDay(now,(weekday-now.getDay()+7)%7||7));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(word)) return '';
  return dayKey(new Date(`${word}T00:00:00`)) === word ? word : '';
}

export function nextTaskDate(task, start = new Date(), includeDone = false) {
  if (!task.repeat || task.repeat === 'none') return task.date || task.deadline || '';
  if (!task.date) return '';
  const first = new Date(`${task.date}T00:00:00`);
  const from = first > start ? first : start;
  for (let offset = 0; offset <= 366; offset++) {
    const date = shiftDay(from,offset);
    if (taskOccursOn(task,date) && (includeDone || taskStatus(task,date) !== 'done')) return dayKey(date);
  }
  return '';
}

export function quickTask(input, defaults = {}, projects = [], now = new Date()) {
  let date = defaults.date || '', time = '', estimate = null, repeat = 'none', repeatEvery = 2;
  let projectId = defaults.projectId || '', sectionId = defaults.sectionId || '', priorityLevel = 4, deadline = '';
  const labels = [];
  let title = input.trim().replace(/(?:^|\s)([#%@])(?:"([^"]+)"|([^\s]+))/g,(match,kind,quoted,plain)=>{
    const name = quoted || plain;
    if (kind !== '#') { if (name.length <= 40) labels.push(name); return ' '; }
    const project = projects.find(item=>!item.archived && item.name.toLowerCase() === name.toLowerCase());
    if (!project) return match;
    if (projectId !== project.id) sectionId = '';
    projectId = project.id;
    return ' ';
  }).replace(/(?:^|\s)p([1-4])(?=\s|$)/gi,(_,value)=>{priorityLevel=Number(value);return ' ';})
    .replace(/\{([^{}]+)\}/g,(match,value)=>{
      const parsed = plannerDate(value,now);
      if (!parsed) return match;
      deadline = parsed;
      return ' ';
    }).trim();
  const duration = title.match(/\s+for\s+(\d{1,4})\s*(m|min|minutes|h|hours)$/i);
  if (duration) {
    const minutes = Number(duration[1])*(duration[2].toLowerCase().startsWith('h')?60:1);
    if (minutes > 0 && minutes <= 1440) { estimate=minutes; title=title.slice(0,duration.index); }
  }
  const clock = title.match(/\s+at\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?$/i);
  if (clock) {
    const hour = Number(clock[1]), period = clock[3]?.toLowerCase();
    if (period ? hour>=1&&hour<=12 : hour<=23) {
      time=timeValue((period?hour%12+(period==='pm'?12:0):hour)*60+Number(clock[2]||0));
      title=title.slice(0,clock.index);
    }
  }
  const recurring = title.match(/\s+every\s+(day|weekday|week|month|year|\d{1,3} days|sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i);
  if (recurring) {
    const value=recurring[1].toLowerCase();
    const interval=Number.parseInt(value,10);
    if (!Number.isFinite(interval)||interval>=2&&interval<=365) {
      const named={day:'daily',weekday:'weekdays',week:'weekly',month:'monthly',year:'yearly'};
      repeat=named[value]||(interval?'interval':'weekly');
      repeatEvery=interval||2;
      const weekday=weekdays.indexOf(value);
      const offset=weekday<0?0:(weekday-now.getDay()+7)%7;
      date=weekday>=0?dayKey(shiftDay(now,offset)):date||dayKey(now);
      title=title.slice(0,recurring.index);
    }
  } else {
    const schedule=title.match(/\s+(today|tomorrow|next week|\d{4}-\d{2}-\d{2}|sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i);
    const parsed=schedule&&plannerDate(schedule[1],now);
    if (parsed) { date=parsed; title=title.slice(0,schedule.index); }
  }
  if (time&&!date) date=dayKey(now);
  const text=title.trim().replace(/\s{2,}/g,' ').slice(0,160);
  if (!text) return null;
  return {id:crypto.randomUUID(),text,done:false,description:'',date,time,estimate,repeat,repeatEvery,projectId,sectionId,
    priority:priorityLevel!==4,priorityLevel,deadline,labels:[...new Set(labels)],blocks:[]};
}

export function matchesPlannerQuery(task, query, projects, now = new Date()) {
  const today=dayKey(now), date=nextTaskDate(task,now), project=projects.find(item=>item.id===task.projectId);
  const match = token => {
    const value=token.toLowerCase().replace(/"/g,'');
    if (value.startsWith('!')) return !match(value.slice(1));
    if (value.startsWith('#')) return (project?.name||'Inbox').toLowerCase()===value.slice(1);
    if (/^[@%]/.test(value)) return task.labels?.some(label=>label.toLowerCase()===value.slice(1));
    if (/^p[1-4]$/.test(value)) return taskPriority(task)===Number(value[1]);
    if (value==='overdue') return Boolean(date&&date<today&&taskStatus(task,now)!=='done');
    if (value==='completed') return taskStatus(task,now)==='done';
    if (value==='undated') return !date;
    if (value==='recurring') return Boolean(task.repeat&&task.repeat!=='none');
    const estimate=value.match(/^estimate<=(\d+)$/);
    if(estimate)return Number.isInteger(task.estimate)&&task.estimate>0&&task.estimate<=Number(estimate[1]);
    if(value==='due-this-week'){
      const week=weekDays(now),due=task.deadline||date;
      return Boolean(due&&due>=dayKey(week[0])&&due<=dayKey(week.at(-1)));
    }
    const day=plannerDate(value,now);
    if (day) return date===day;
    return `${task.text} ${task.description||''} ${task.labels?.join(' ')||''}`.toLowerCase().includes(value);
  };
  return query.split('|').some(group=>(group.match(/(?:[^\s&"]+|"[^"]*")+/g)||[]).every(match));
}

function readCsv(text) {
  const rows=[];
  let row=[], value='', quoted=false;
  for (let index=0;index<text.length;index++) {
    const char=text[index];
    if (char==='"') {
      if (quoted&&text[index+1]==='"') { value+='"'; index++; }
      else if (quoted||value==='') quoted=!quoted;
      else value+=char;
    } else if (!quoted&&(char===','||char==='\n'||char==='\r')) {
      row.push(value); value='';
      if (char!==',') {
        if (char==='\r'&&text[index+1]==='\n') index++;
        rows.push(row); row=[];
      }
    } else value+=char;
  }
  if (quoted) throw new Error('A quoted field is incomplete.');
  if (row.length||value) rows.push([...row,value]);
  return rows;
}

export function importTodoistProject(csv, name, now=new Date()) {
  const [header=[],...rows]=readCsv(csv.replace(/^\uFEFF/,''));
  const columns=header.map(value=>value.trim().toUpperCase());
  if (!columns.includes('TYPE')||!columns.includes('CONTENT')) throw new Error('Choose a Todoist project CSV with TYPE and CONTENT columns.');
  const project={id:crypto.randomUUID(),name,color:'#d94b49',favorite:false,archived:false,sections:[]};
  const tasks=[];
  let sectionId='', parent=null, unmappedDates=0;
  for (const row of rows) {
    const field=key=>String(row[columns.indexOf(key)]||'').trim();
    const type=field('TYPE'), content=field('CONTENT');
    if (!content) continue;
    if (type==='section') {
      const section={id:crypto.randomUUID(),name:content.slice(0,80)};
      project.sections.push(section); sectionId=section.id; parent=null;
    } else if (type==='note'&&parent) {
      parent.comments.push({id:crypto.randomUUID(),text:content.slice(0,2000),at:now.getTime()});
    } else if (type==='task'&&Number(field('INDENT'))>1&&parent) {
      parent.subtasks.push({id:crypto.randomUUID(),text:content.slice(0,160),done:false});
    } else if (type==='task') {
      const labels=[];
      const text=content.replace(/\s+[@%]([^\s]+)/g,(_,label)=>{labels.push(label.slice(0,40));return '';}).trim().slice(0,160);
      const dateSource=field('DATE');
      const schedule=quickTask(`Schedule ${dateSource.replace(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?$/, '$1 at $2')}`,{},[],now);
      const parsedDeadline=plannerDate(field('DEADLINE'),now);
      const notes=[field('DESCRIPTION')];
      if (dateSource&&!schedule?.date) { notes.push(`Imported schedule: ${dateSource}`); unmappedDates++; }
      if (field('DEADLINE')&&!parsedDeadline) notes.push(`Imported deadline: ${field('DEADLINE')}`);
      const priority=Number(field('PRIORITY')), priorityLevel=[1,2,3,4].includes(priority)?priority:4;
      const minutes=Number(field('DURATION'))*(field('DURATION_UNIT').toLowerCase().startsWith('hour')?60:1);
      parent={id:crypto.randomUUID(),text,done:false,description:notes.filter(Boolean).join('\n\n').slice(0,2000),projectId:project.id,sectionId,
        date:schedule?.date||'',time:schedule?.time||'',repeat:schedule?.repeat||'none',repeatEvery:schedule?.repeatEvery||2,
        priorityLevel,priority:priorityLevel!==4,deadline:parsedDeadline,estimate:Number.isInteger(minutes)&&minutes>0&&minutes<=1440?minutes:null,
        labels:[...new Set(labels)],subtasks:[],comments:[],blocks:[]};
      tasks.push(parent);
    }
  }
  if (!tasks.length) throw new Error('This file contains no tasks.');
  return {project,tasks,unmappedDates};
}
