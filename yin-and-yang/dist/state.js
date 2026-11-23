import {spotifyPath} from './spotify-embed.js';
import {youtubeContent} from './youtube-embed.js';
import {loadGardenDesign,loadGardenLayouts,loadGardenActivityLayouts,loadGardenArrangements} from './garden-layout.js';
import {loadPostcardViewpoints} from './postcard-viewpoints.js';
import {taskReference} from './focus-reference.js';
import {loadAppearance,loadGardenLooks} from './garden-appearance.js';
import {loadSoundSettings} from './garden-audio.js';
import {captureTaskChange} from './task-undo.js';
import {loadGardenSchedule} from './garden-appearance.js';
import {loadDailyRituals,loadRitualSchedules} from './daily-rituals.js';
import {loadFinishedBooks,loadReadingNotes,loadLibraryBooks,loadShelfRows,loadBookends} from './reading-shelf.js';
import {loadReadingCollections} from './reading-progress.js';
import {loadAvailability} from './availability.js';
import {loadStickyNotes} from './sticky-notes.js';
import {projectDecision,projectMilestone,taskTemplate,loadProjectResources} from './project-planning.js';
import {loadGardenGrowth} from './garden-growth.js';
import {addReplayEvent,loadReplay} from './focus-replay.js';
import {loadExamPlans} from './exam-plans.js';
import {loadDayTemplates} from './calendar-day-templates.js';
import {calendarColor,customCalendarColor,customColorStyle,loadCalendars,loadHiddenCalendars,calendarTheme} from './calendar-layers.js';
import {handoffLink,sessionHandoff} from './session-handoff.js';
import {loadMistakes} from './mistake-notebook.js';
import {loadTaskBundles} from './task-bundles.js';
import {blockFlexibility,waitingForRecord} from './task-readiness.js';
import {loadWeeklyReflections} from './journal-patterns.js';

export const STORAGE_KEY = 'yin-and-yang.v1';
import {loadQuestions} from './office-hours.js';
export const taskEnergyLevels={light:'Light',moderate:'Moderate',demanding:'Demanding'};
export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const taskFrequencies = { none:'Does not repeat', daily:'Every day', weekdays:'Weekdays', weekly:'Every week', monthly:'Every month', yearly:'Every year', interval:'Every N days' };
const isDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isTime = value => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const dateNumber = date => Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000;
export function repeatSettings(repeat,every){
  return {repeat:Object.hasOwn(taskFrequencies,repeat)?repeat:'none',
    repeatEvery:Number.isInteger(Number(every))&&Number(every)>=2&&Number(every)<=365?Number(every):2};
}
const loadCalendarEvents=value=>Array.isArray(value)?value.filter(item=>typeof item?.id==='string'&&typeof item.title==='string'&&
  (isDay(item.day)&&isDay(item.endDay)&&item.endDay>item.day||Number.isFinite(item.start)&&Number.isFinite(item.end)&&item.end>=item.start))
  .map(item=>({...item,
    ...(Object.hasOwn(item,'excludedDays')?{excludedDays:Array.isArray(item.excludedDays)?item.excludedDays.filter(isDay):[]}:{}),
    ...(item.manual&&Object.hasOwn(item,'color')?{color:calendarColor(item.color)}:{}),
    ...(item.manual&&Object.hasOwn(item,'repeat')?repeatSettings(item.repeat,item.repeatEvery):{}),
    ...(item.flexibility?{flexibility:blockFlexibility(item.flexibility)}:{})})):[];

export function taskOccursOn(task, date) {
  const day = dayKey(date);
  if (!task.date || task.date > day || task.repeat&&task.repeat!=='none'&&task.excludedDays?.includes(day)) return false;
  if (task.repeat === 'daily') return true;
  if (task.repeat === 'weekdays') return date.getDay() !== 0 && date.getDay() !== 6;
  const first = new Date(`${task.date}T00:00:00`);
  if (task.repeat === 'weekly') return first.getDay() === date.getDay();
  if (task.repeat === 'interval') return (dateNumber(date)-dateNumber(first))%(task.repeatEvery||2) === 0;
  if (task.repeat === 'monthly' || task.repeat === 'yearly') {
    const last = new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
    return date.getDate() === Math.min(first.getDate(),last) && (task.repeat === 'monthly' || date.getMonth() === first.getMonth());
  }
  return task.date === day;
}

export function taskStatus(task, date = new Date()) {
  const today = dayKey(date);
  if (task.repeat === 'none' || !task.repeat) {
    if (task.done) return 'done';
    return task.date > today ? 'upcoming' : 'todo';
  }
  if (!taskOccursOn(task, date)) return 'upcoming';
  return task.completedOn === today || task.completions?.includes(today) ? 'done' : 'todo';
}

export function completeTask(task, checked, date = new Date()) {
  const day = dayKey(date);
  if (!task.repeat || task.repeat === 'none') {
    task.done = checked;
    task.completedOn = checked ? day : '';
  } else {
    const completions = new Set(task.completions||[]);
    if (task.completedOn) completions.add(task.completedOn);
    if (checked) completions.add(day);
    else completions.delete(day);
    task.completions = [...completions].sort();
    task.completedOn = task.completions.at(-1)||'';
  }
}

export function taskCompletionId(task, occurrence) {
  return `${task.id}:${task.repeat && task.repeat !== 'none' ? dayKey(occurrence) : 'once'}`;
}

export function recordTaskCompletion(state, task, checked, occurrence = new Date(), now = Date.now()) {
  const recurring = task.repeat && task.repeat !== 'none';
  const id = taskCompletionId(task,occurrence);
  const finishUndo=captureTaskChange(task,['done','completedOn','completions']);
  const prior=state.taskActivity.find(event=>event.id===id);
  completeTask(task, checked, recurring ? occurrence : new Date(now));
  state.taskActivity = state.taskActivity.filter(event => event.id !== id);
  if (checked) state.taskActivity.push({id, taskId:task.id, text:task.text, projectId:task.projectId||'', labels:[...(task.labels||[])], estimate:task.estimate||null, at:now});
  const undo=finishUndo();
  return latest=>{
    if ((latest.taskActivity.find(event=>event.id===id)?.at??null)!==(checked?now:null)) return false;
    if (!undo?.(latest)) return false;
    latest.taskActivity=latest.taskActivity.filter(event=>event.id!==id);
    if (prior) latest.taskActivity.push(prior);
    return true;
  };
}

export const taskCalendarColors={jade:'Jade',lake:'Lake blue',plum:'Plum',rose:'Rose',amber:'Amber',clay:'Terracotta'};
export const taskCalendarColor=value=>Object.hasOwn(taskCalendarColors,value)?value:customCalendarColor(value);
export function taskColorAttributes(value,style=''){
  const color=taskCalendarColor(value);
  const rules=customColorStyle('--task-color',color)+style;
  return `data-task-color="${color}"${rules?` style="${rules}"`:''}`;
}
export function taskPriority(task) { return task.priorityLevel || (task.priority ? 1 : 4); }

export function unfinishedPrerequisites(task, tasksById) {
  return (task.prerequisiteIds || []).flatMap(id => {
    const prerequisite = tasksById.get(id);
    if (!prerequisite || prerequisite.done) return [];
    const recurring = prerequisite.repeat && prerequisite.repeat !== 'none';
    if (recurring && (prerequisite.completedOn || prerequisite.completions?.length)) return [];
    return [prerequisite];
  });
}

export function createsDependencyCycle(taskId, prerequisiteIds, tasksById) {
  const pending = [...prerequisiteIds];
  const visited = new Set();
  while (pending.length) {
    const id = pending.pop();
    if (id === taskId) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    pending.push(...(tasksById.get(id)?.prerequisiteIds || []));
  }
  return false;
}

function loadTask(task) {
  const repeat = Object.hasOwn(taskFrequencies,task.repeat) ? task.repeat : 'none';
  return {
    id:task.id, text:task.text, done:task.done,
    description:typeof task.description === 'string' ? task.description : '',
    resumeNote:typeof task.resumeNote==='string'?task.resumeNote.slice(0,500):'',
    resumeLocation:typeof task.resumeLocation==='string'?task.resumeLocation.trim().slice(0,240):'',
    resumeResource:handoffLink(task.resumeResource),
    ...(task.reference?{reference:taskReference(task.reference)}:{}),
    date:/^\d{4}-\d{2}-\d{2}$/.test(task.date) ? task.date : repeat === 'none' ? '' : dayKey(),
    time:isTime(task.time) ? task.time : '',
    occurrenceTimes:Object.fromEntries(Object.entries(task.occurrenceTimes||{}).filter(([day,time])=>isDay(day)&&(time===''||isTime(time)))),
    occurrenceMinutes:Object.fromEntries(Object.entries(task.occurrenceMinutes||{}).filter(([day,minutes])=>isDay(day)&&Number.isInteger(minutes)&&minutes>0&&minutes<=1440)),
    ...(Array.isArray(task.excludedDays)?{excludedDays:task.excludedDays.filter(isDay)}:{}),
    estimate:Number.isInteger(task.estimate) && task.estimate > 0 && task.estimate <= 1440 ? task.estimate : null,
    minimumUsefulMinutes:Number.isInteger(task.minimumUsefulMinutes)&&task.minimumUsefulMinutes>=1&&task.minimumUsefulMinutes<=1440?task.minimumUsefulMinutes:null,
    energy:Object.hasOwn(taskEnergyLevels,task.energy)?task.energy:'',
    repeat,
    priority:task.priority === true,
    calendarColor:taskCalendarColor(task.calendarColor),
    priorityLevel:[1,2,3,4].includes(task.priorityLevel)?task.priorityLevel:undefined,
    projectId:typeof task.projectId==='string'?task.projectId:'',
    sectionId:typeof task.sectionId==='string'?task.sectionId:'',
    labels:Array.isArray(task.labels)?task.labels.filter(label=>typeof label==='string'&&label.length<=40):[],
    deadline:isDay(task.deadline)?task.deadline:'',
    snoozedUntil:isDay(task.snoozedUntil)?task.snoozedUntil:'',
    ...(task.waitingFor?{waitingFor:waitingForRecord(task.waitingFor)}:{}),
    ...(task.flexibility?{flexibility:blockFlexibility(task.flexibility)}:{}),
    prerequisiteIds:Array.isArray(task.prerequisiteIds)
      ? [...new Set(task.prerequisiteIds.filter(id=>typeof id==='string'&&id!==task.id))]
      : [],
    reminderAt:Number.isFinite(task.reminderAt)?task.reminderAt:null,
    reminderShown:task.reminderShown===true,
    repeatEvery:Number.isInteger(task.repeatEvery)&&task.repeatEvery>=2&&task.repeatEvery<=365?task.repeatEvery:2,
    subtasks:Array.isArray(task.subtasks)?task.subtasks.filter(item=>item&&typeof item.id==='string'&&typeof item.text==='string'&&typeof item.done==='boolean'):[],
    comments:Array.isArray(task.comments)?task.comments.filter(item=>item&&typeof item.id==='string'&&typeof item.text==='string'&&Number.isFinite(item.at)):[],
    completions:Array.isArray(task.completions)?task.completions.filter(isDay):[],
    blocks:Array.isArray(task.blocks) ? task.blocks.filter(block=>block && typeof block.id==='string' && /^\d{4}-\d{2}-\d{2}$/.test(block.date) && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(block.time) && Number.isInteger(block.minutes) && block.minutes>0 && block.minutes<=1440)
      .map(block=>block.flexibility?{...block,flexibility:blockFlexibility(block.flexibility)}:block) : [],
    completedOn:/^\d{4}-\d{2}-\d{2}$/.test(task.completedOn) ? task.completedOn : ''
  };
}
export const duration = (state, mode = state.timer.mode) => Math.round(state.settings[mode] * 60) * 1000;
export function formatTypedDuration(text) {
  const digits=text.replace(/\D/g,'').replace(/^0+(?=\d)/,'').slice(0,5).padStart(4,'0');
  return `${digits.slice(0,-2)}:${digits.slice(-2)}`;
}
export function parseDuration(text) {
  const value=text.trim();
  const match = /^(\d{1,3}):(\d{1,2})$/.exec(/^\d{1,5}$/.test(value)?formatTypedDuration(value):value);
  if (!match) return null;
  const seconds = Number(match[1]) * 60 + Number(match[2] || 0);
  return seconds >= 1 && seconds <= 10800 ? seconds * 1000 : null;
}
export function formatDuration(ms) {
  const seconds = Math.ceil(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
export const breakIdeaMinutes=[2,5,10];
export function breakIdeasThatFit(ideas,ms){
  const choices=ideas.filter(idea=>idea.minutes*60000<=ms);
  const best=Math.max(...choices.map(idea=>idea.minutes));
  return choices.filter(idea=>idea.minutes===best);
}
export function loadSoundtracks(value){
  const records=new Map();
  for(const item of Array.isArray(value)?value:[]){
    if(typeof item?.id!=='string'||!item.id||typeof item.name!=='string'||!item.name.trim()||typeof item.link!=='string')continue;
    const valid=item.source==='spotify'?spotifyPath(item.link):item.source==='youtube'?youtubeContent(item.link):null;
    if(valid)records.set(item.id,{id:item.id,name:item.name.trim().slice(0,80),source:item.source,link:item.link});
  }
  return [...records.values()];
}
export function freshState() {
  return { settings: { focus:25, break:5, savesInlineDuration:true, taskBoardCollapsed:false }, appearance:loadAppearance(), gardenSchedule:loadGardenSchedule(), calendarEvents:[], calendars:loadCalendars(), hiddenCalendars:[], calendarTheme:'day', calendarDayTemplates:[], dailyRituals:{}, ritualSchedules:loadRitualSchedules(), studyCapacity:240, processedCaptures:[], sounds:loadSoundSettings(), notifications:false, routines:[], intention:'', tasks:[], taskTemplates:[], projects:[], plannerFilters:[], plannerLabels:[], taskActivity:[], gardenClearedDone:{}, activeTask:null, focusPins:null, notes:'', stickyNotes:[], history:[], spotify:'', youtube:'', mediaSource:'spotify', soundtracks:[], focusOvertime:false, focusMode:false,
    replanCutoff:'21:00', planningCooldown:5, tomorrowPlan:null, activeTaskDay:null, readingNotes:[], libraryBooks:[], readingShelfRows:loadShelfRows(), readingBookends:[], finishedBooks:[], availability:[], journalTemplates:[], gardenGrowth:[], scheduleMoves:[], captureArchive:[],
    shutdownSteps:[{id:'notes',text:'Clear the note inbox'},{id:'tomorrow',text:'Choose tomorrow’s first task'}],shutdownProgress:null,readingCollections:[],mistakes:[],studyQuestions:[],
    taskBundles:[],activeBundle:null,weeklyReflections:[],gardenLooks:[],gardenDesign:loadGardenDesign(),gardenLayouts:[],gardenArrangements:[],gardenActivityLayouts:{},postcardViewpoints:[],breakIdeas:[],
    timer:{ mode:'focus', status:'idle', remaining:25*60000, endAt:null, total:25*60000, startedAt:null, id:null } };
}
export function routinePhases(value) {
  if(!Array.isArray(value)||value.length<2||value.length>12)return null;
  if(!value.every(phase=>typeof phase?.name==='string'&&phase.name.trim()&&
    ['focus','break'].includes(phase.mode)&&Number.isInteger(phase.ms)&&phase.ms>=1000&&phase.ms<=10800000))return null;
  return value.map(({name,mode,ms})=>({name:name.trim().slice(0,40),mode,ms}));
}
export function loadRoutinePhase(state,sequence,index=0){
  const phase=sequence.phases[index];
  reset(state,phase.mode);
  Object.assign(state.timer,{remaining:phase.ms,total:phase.ms,sequence:{...sequence,index}});
}

export function loadState(storage) {
  const base = freshState();
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!raw || typeof raw !== 'object') return base;
    base.appearance=loadAppearance(raw.appearance);
    base.gardenLooks=loadGardenLooks(raw.gardenLooks);
    base.gardenDesign=loadGardenDesign(raw.gardenDesign);
    base.gardenLayouts=loadGardenLayouts(raw.gardenLayouts);
    base.gardenArrangements=loadGardenArrangements(raw.gardenArrangements);
    base.postcardViewpoints=loadPostcardViewpoints(raw.postcardViewpoints);
    base.gardenActivityLayouts=loadGardenActivityLayouts(raw.gardenActivityLayouts,base.gardenLayouts);
    base.gardenSchedule=loadGardenSchedule(raw.gardenSchedule);
    base.calendarEvents=loadCalendarEvents(raw.calendarEvents);
    base.calendars=loadCalendars(raw.calendars);
    base.hiddenCalendars=loadHiddenCalendars(raw.hiddenCalendars);
    base.calendarTheme=calendarTheme(raw.calendarTheme);
    base.calendarDayTemplates=loadDayTemplates(raw.calendarDayTemplates);
    if(isTime(raw.replanCutoff))base.replanCutoff=raw.replanCutoff;
    if(Number.isInteger(raw.planningCooldown)&&raw.planningCooldown>=0&&raw.planningCooldown<=30)base.planningCooldown=raw.planningCooldown;
    base.dailyRituals=loadDailyRituals(raw.dailyRituals);
    base.ritualSchedules=loadRitualSchedules(raw.ritualSchedules);
    base.readingNotes=loadReadingNotes(raw.readingNotes);
    base.readingCollections=loadReadingCollections(raw.readingCollections);
    base.libraryBooks=loadLibraryBooks(raw.libraryBooks);
    base.readingShelfRows=loadShelfRows(raw.readingShelfRows);
    base.readingBookends=loadBookends(raw.readingBookends);
    base.availability=loadAvailability(raw.availability);
    base.mistakes=loadMistakes(raw.mistakes);
    base.studyQuestions=loadQuestions(raw.studyQuestions);
    if(Array.isArray(raw.breakIdeas))base.breakIdeas=[...new Map(raw.breakIdeas.flatMap(idea=>
      typeof idea?.id==='string'&&breakIdeaMinutes.includes(idea.minutes)&&typeof idea.text==='string'&&idea.text.trim()
        ?[[idea.id,{id:idea.id,minutes:idea.minutes,text:idea.text.trim().slice(0,160)}]]:[])).values()];
    base.taskBundles=loadTaskBundles(raw.taskBundles);
    base.weeklyReflections=loadWeeklyReflections(raw.weeklyReflections);
    if(isDay(raw.activeBundle?.startedOn)&&base.taskBundles.some(bundle=>bundle.id===raw.activeBundle.id)){
      base.activeBundle={id:raw.activeBundle.id,startedOn:raw.activeBundle.startedOn,paused:raw.activeBundle.paused===true};
    }
    if(Array.isArray(raw.journalTemplates))base.journalTemplates=raw.journalTemplates.filter(item=>
      typeof item?.id==='string'&&typeof item.name==='string'&&item.name.trim()&&typeof item.body==='string'&&item.body.trim())
      .map(({id,name,body})=>({id,name:name.slice(0,80),body:body.slice(0,6000)}));
    if(isDay(raw.focusPins?.day)&&Array.isArray(raw.focusPins.ids)){
      base.focusPins={day:raw.focusPins.day,ids:[...new Set(raw.focusPins.ids.filter(id=>typeof id==='string'))]};
    }
    if(raw.gardenClearedDone&&typeof raw.gardenClearedDone==='object'&&!Array.isArray(raw.gardenClearedDone)){
      base.gardenClearedDone=Object.fromEntries(Object.entries(raw.gardenClearedDone).filter(([,key])=>typeof key==='string'));
    }
    if(Number.isInteger(raw.studyCapacity)&&raw.studyCapacity>=15&&raw.studyCapacity<=1440)base.studyCapacity=raw.studyCapacity;
    if(Array.isArray(raw.processedCaptures))base.processedCaptures=raw.processedCaptures.filter(key=>typeof key==='string');
    if(Array.isArray(raw.captureArchive))base.captureArchive=raw.captureArchive.filter(item=>typeof item?.key==='string'&&
      typeof item.text==='string'&&Number.isFinite(item.createdAt)&&Number.isFinite(item.archivedAt));
    if(Array.isArray(raw.shutdownSteps))base.shutdownSteps=[...new Map(raw.shutdownSteps.filter(item=>typeof item?.id==='string'&&
      typeof item.text==='string'&&item.text.trim()).slice(0,20).map(item=>[item.id,{id:item.id,text:item.text.trim().slice(0,100)}])).values()];
    if(isDay(raw.shutdownProgress?.day)&&Array.isArray(raw.shutdownProgress.ids)){
      const valid=new Set(base.shutdownSteps.map(item=>item.id));
      base.shutdownProgress={day:raw.shutdownProgress.day,ids:[...new Set(raw.shutdownProgress.ids.filter(id=>valid.has(id)))]};
    }
    if(Array.isArray(raw.scheduleMoves))base.scheduleMoves=raw.scheduleMoves.filter(item=>typeof item?.id==='string'&&isDay(item.day)&&
      typeof item.title==='string'&&[item.from,item.to].every(place=>place&&typeof place.date==='string'&&typeof place.time==='string'));
    base.sounds=loadSoundSettings(raw.sounds);
    base.notifications=raw.notifications===true;
    if (Array.isArray(raw.routines)) base.routines=raw.routines.flatMap(routine=>{
      if(typeof routine?.id!=='string'||typeof routine.name!=='string')return [];
      const phases=routinePhases(routine.phases);
      if(phases)return [{id:routine.id,name:routine.name,phases}];
      return ['focus','rest'].every(key=>Number.isInteger(routine[key])&&routine[key]>=1000&&routine[key]<=10800000)?[routine]:[];
    });
    for (const key of ['intention','notes','spotify','youtube']) if (typeof raw[key] === 'string') base[key] = raw[key];
    base.mediaSource=raw.mediaSource==='youtube'?'youtube':'spotify';
    base.soundtracks=loadSoundtracks(raw.soundtracks);
    base.focusOvertime=raw.focusOvertime===true;
    base.stickyNotes=loadStickyNotes(raw.stickyNotes,base.notes);
    base.gardenGrowth=loadGardenGrowth(raw.gardenGrowth);
    base.finishedBooks=loadFinishedBooks(raw.finishedBooks,base.gardenGrowth,base.dailyRituals,base.readingNotes);
    base.settings.taskBoardCollapsed=raw.settings?.taskBoardCollapsed===true;
    base.settings.wrapMinutes=wrapUpMinutes(raw.settings?.wrapMinutes);
    if(Number.isInteger(raw.settings?.classBuffer)&&raw.settings.classBuffer>=0&&raw.settings.classBuffer<=180)base.settings.classBuffer=raw.settings.classBuffer;
    if(Number.isInteger(raw.settings?.dailyFocusGoal)&&raw.settings.dailyFocusGoal>=5&&raw.settings.dailyFocusGoal<=720)base.settings.dailyFocusGoal=raw.settings.dailyFocusGoal;
    for (const mode of ['focus','break']) if (Number.isFinite(raw.settings?.[mode]) && raw.settings[mode]>=1/60 && raw.settings[mode]<=180) base.settings[mode]=raw.settings[mode];
    if (Array.isArray(raw.tasks)) base.tasks=raw.tasks.filter(t=>t && typeof t.id==='string' && typeof t.text==='string' && typeof t.done==='boolean').map(loadTask);
    base.taskTemplates=Array.isArray(raw.taskTemplates)?raw.taskTemplates.map(taskTemplate).filter(Boolean):[];
    if (Array.isArray(raw.projects)) base.projects=raw.projects.filter(project=>project&&typeof project.id==='string'&&typeof project.name==='string').map(project=>({
      id:project.id,name:project.name,color:/^#[\da-f]{6}$/i.test(project.color)?project.color:'#d94b49',favorite:project.favorite===true,archived:project.archived===true,
      sections:Array.isArray(project.sections)?project.sections.filter(section=>section&&typeof section.id==='string'&&typeof section.name==='string'):[],
      milestones:Array.isArray(project.milestones)?project.milestones.map(projectMilestone).filter(Boolean):[],
      ...loadProjectResources(project),
      decisions:Array.isArray(project.decisions)?project.decisions.map(projectDecision).filter(Boolean):[],
      exams:loadExamPlans(project.exams),
      weeklyGoals:Object.fromEntries(['focusMinutes','chapters'].filter(key=>
        Number.isInteger(project.weeklyGoals?.[key])&&project.weeklyGoals[key]>0&&project.weeklyGoals[key]<=(key==='focusMinutes'?10080:1000))
        .map(key=>[key,project.weeklyGoals[key]])),
      thoughts:Array.isArray(project.thoughts)?project.thoughts.filter(note=>typeof note?.key==='string'&&typeof note.text==='string'&&Number.isFinite(note.createdAt)):[]
    }));
    if (Array.isArray(raw.plannerFilters)) base.plannerFilters=raw.plannerFilters.filter(filter=>filter&&typeof filter.id==='string'&&typeof filter.name==='string'&&typeof filter.query==='string')
      .map(filter=>({...filter,pinned:filter.pinned===true}));
    if (Array.isArray(raw.plannerLabels)) base.plannerLabels=raw.plannerLabels.filter(label=>typeof label==='string'&&label.length>0&&label.length<=40);
    if (Array.isArray(raw.taskActivity)) base.taskActivity=raw.taskActivity.filter(event=>event&&typeof event.id==='string'&&typeof event.taskId==='string'&&typeof event.text==='string'&&Number.isFinite(event.at));
    base.activeTask=base.tasks.some(t=>t.id===raw.activeTask&&!t.done)?raw.activeTask:null;
    if(base.activeTask&&isDay(raw.activeTaskDay))base.activeTaskDay=raw.activeTaskDay;
    const plan=raw.tomorrowPlan;
    const pin=raw.tomorrowPin;
    if(isDay(pin?.day)&&base.tasks.some(task=>task.id===pin.taskId))base.tomorrowPin={day:pin.day,taskId:pin.taskId};
    if(isDay(plan?.day)&&base.tasks.some(task=>task.id===plan.taskId)&&
        (plan.blockId===null||typeof plan.blockId==='string')){
      base.tomorrowPlan={day:plan.day,taskId:plan.taskId,blockId:plan.blockId,ownsBlock:plan.ownsBlock===true&&Boolean(plan.blockId)};
    }
    if (Array.isArray(raw.history)) base.history=raw.history.filter(h=>h && typeof h.id==='string' && ['completed','skipped'].includes(h.outcome) && ['focus','break'].includes(h.mode) && Number.isFinite(h.finishedAt) && Number.isFinite(h.focusMs))
      .map(h=>Array.isArray(h.replay)?{...h,replay:loadReplay(h.replay)}:h);
    base.focusMode=raw.focusMode===true;
    const t=raw.timer;
    const taskPlan=loadTaskTiming(t?.taskPlan,base.tasks);
    const maxTimer=taskPlan||t?.taskBreak===true?86400000:10800000;
    if (t && ['focus','break'].includes(t.mode) && ['idle','running','paused','overtime'].includes(t.status) && Number.isFinite(t.remaining) && t.remaining>=0 && t.remaining<=maxTimer && Number.isFinite(t.total) && t.total>0 && t.total<=maxTimer && (!['running','overtime'].includes(t.status) || (Number.isFinite(t.endAt) && typeof t.id==='string' && Number.isFinite(t.startedAt)))) {
      base.timer={...t};
      const pacing=t.pacing;
      if(!pacing||!Number.isFinite(pacing.left)||pacing.left<=0||pacing.left>t.total||
          !Number.isFinite(pacing.progress)||pacing.progress<0||pacing.progress>=1)delete base.timer.pacing;
      if(t.taskBreak!==true||!Number.isInteger(t.baseTotal)||t.baseTotal<1000||t.baseTotal>maxTimer)delete base.timer.baseTotal;
      if(taskPlan)base.timer.taskPlan=taskPlan;else delete base.timer.taskPlan;
      if(t.mode!=='focus'||!base.mistakes.some(item=>item.id===t.mistakeId))delete base.timer.mistakeId;
      base.timer.startHandoff=sessionHandoff(t.startHandoff);
      if(Array.isArray(t.replay))base.timer.replay=loadReplay(t.replay);
      else delete base.timer.replay;
      const sequence=t.sequence, phases=routinePhases(sequence?.phases);
      if(phases&&typeof sequence.name==='string'&&Number.isInteger(sequence.index)&&phases[sequence.index]?.mode===t.mode){
        base.timer.sequence={name:sequence.name,phases,index:sequence.index};
      }else delete base.timer.sequence;
      if(typeof t.goal==='string')base.timer.goal=t.goal.slice(0,160);
      else delete base.timer.goal;
      const block=t.block;
      if (t.status==='idle' || typeof block?.taskId!=='string' || !Number.isFinite(block.left) || block.left<0 || block.left>25*3600000) delete base.timer.block;
      else if (base.tasks.some(task=>task.id===block.taskId)) base.activeTask=block.taskId;
      // Older versions saved inline edits only in the active timer.
      if (!raw.settings?.savesInlineDuration && t.total >= 1000) {
        base.settings[t.mode] = t.total / 60000;
      }
    }
    else base.timer.remaining=base.timer.total=duration(base);
    return base;
  } catch { return base; }
}
export function remaining(state, now=Date.now()) { return state.timer.status==='overtime'?0:state.timer.status==='running' ? Math.max(0,state.timer.endAt-now) : state.timer.remaining; }
export function timerProgress(state,now=Date.now()){
  const {pacing,total}=state.timer,left=remaining(state,now);
  const progress=pacing?1-left/pacing.left*(1-pacing.progress):1-left/total;
  return Math.max(0,Math.min(1,progress));
}

export function canExtendTimer(state,ms,now=Date.now()){
  const t=state.timer,limit=t.taskPlan||t.taskBreak?86400000:10800000;
  return Number.isInteger(ms)&&ms>0&&t.total+ms<=limit&&
    ['running','paused'].includes(t.status)&&remaining(state,now)>0&&!t.block&&!t.sequence&&!t.mistakeId;
}

export function extendTimer(state,ms,now=Date.now()){
  if(!canExtendTimer(state,ms,now))return false;
  const t=state.timer,left=remaining(state,now)+ms,pacing={left,progress:timerProgress(state,now)};
  state.timer={...t,total:t.total+ms,remaining:left,pacing,endAt:t.status==='running'?t.endAt+ms:null};
  if(t.taskBreak)state.timer.baseTotal=t.baseTotal||t.total;
  return true;
}

export function canExtendCalendarTimer(state,ms,now=Date.now()){
  const {timer:t}=state;
  return Boolean(t.block&&t.status==='running'&&remaining(state,now)>0&&Number.isInteger(ms)&&ms>0&&
    t.total+t.block.left+ms<=86400000);
}

export function extendCalendarTimer(state,ms,now=Date.now()){
  if(!canExtendCalendarTimer(state,ms,now))return false;
  const t=state.timer;
  if(t.mode==='break'||t.block.left>0){
    state.timer={...t,block:{...t.block,left:t.block.left+ms}};
  }else{
    const left=remaining(state,now)+ms;
    state.timer={...t,total:t.total+ms,remaining:left,endAt:t.endAt+ms,pacing:{left,progress:timerProgress(state,now)}};
  }
  return true;
}

export function quickTimerLengths(mode){return mode==='break'?[2,5,10,15]:[15,25,45,60];}

export function applyQuickTimerLength(state,minutes){
  const t=state.timer;
  if(t.status!=='idle'||t.block||t.sequence||t.mistakeId||!quickTimerLengths(t.mode).includes(minutes))return false;
  if(t.taskPlan||t.taskBreak){
    state.timer={...t,total:minutes*60000,remaining:minutes*60000};
    if(t.taskBreak)state.timer.baseTotal=t.baseTotal||t.total;
  }else{
    state.settings={...state.settings,[t.mode]:minutes};
    reset(state,t.mode);
    if(t.goal)state.timer.goal=t.goal;
  }
  return true;
}
export function consumeTimerWarning(state,now=Date.now()) {
  const timer=state.timer;
  if (timer.status!=='running'||timer.warningSent) return null;
  const limit=timer.mode==='focus'?5*60000:150000;
  const left=remaining(state,now);
  if (timer.total<limit||left>limit||left===0) return null;
  timer.warningSent=true;
  return {id:timer.id,mode:timer.mode,left};
}
export function wrapUpMinutes(value){
  return Number.isInteger(value)&&value>=0&&value<=15?value:3;
}
export function focusWrapUp(state,now=Date.now()){
  const {timer}=state,left=remaining(state,now);
  const reserved=Math.min(wrapUpMinutes(state.settings.wrapMinutes)*60000,timer.total-60000);
  return Boolean(timer.mode==='focus'&&timer.id&&['running','paused'].includes(timer.status)&&left>0&&left<=reserved);
}
export function startPause(state, now=Date.now(), taskId=state.activeTask) {
  const t=state.timer;
  if(t.status==='running') {
    addReplayEvent(t,'pause',Math.min(now,t.endAt));
    t.remaining=remaining(state,now);t.endAt=null;t.status='paused';
  }
  else {
    const fresh=!t.id;
    if (fresh) {
      t.id=globalThis.crypto.randomUUID();
      t.startedAt=now;
      const task=state.tasks.find(item=>item.id===(t.block?.taskId||taskId));
      if (task) {
        t.taskSnapshot={id:task.id,text:task.text,projectId:task.projectId||''};
        if(t.mode==='focus')t.startHandoff=sessionHandoff(task);
      }
    }
    addReplayEvent(t,fresh?'start':'resume',now);
    t.endAt=now+t.remaining;
    t.status='running';
  }
}
export function reset(state, mode=state.timer.mode) {
  state.timer={mode,status:'idle',remaining:duration(state,mode),total:duration(state,mode),endAt:null,startedAt:null,id:null};
}
const taskStages=['first','interval','second','final'];
function loadTaskTiming(plan,tasks){
  return tasks.some(task=>task.id===plan?.taskId)&&taskStages.includes(plan.stage)&&
    Number.isInteger(plan.totalMs)&&plan.totalMs>=60000&&plan.totalMs<=86400000
    ?{taskId:plan.taskId,totalMs:plan.totalMs,stage:plan.stage}:null;
}
export function resetTaskTiming(state,plan){
  const {totalMs,stage}=plan,first=Math.ceil(totalMs/2000)*1000;
  const rest=stage==='interval'||stage==='final';
  const length=stage==='first'?(totalMs>3600000?first:totalMs):stage==='second'?totalMs-first:
    Math.round((stage==='interval'?first:totalMs)/5000)*1000;
  reset(state,rest?'break':'focus');
  Object.assign(state.timer,{remaining:length,total:length,taskPlan:{...plan}});
}
export function startTaskTiming(state,taskId,minutes){
  if(!Number.isFinite(minutes)||minutes<=0||minutes>1440)return false;
  resetTaskTiming(state,{taskId,totalMs:Math.round(minutes*60000),stage:'first'});
  return true;
}
export function taskFinishBreak(state,minutes){
  reset(state,'break');
  if(Number.isFinite(minutes)&&minutes>0&&minutes<=1440){
    const ms=Math.max(1000,Math.round(minutes*12)*1000);
    Object.assign(state.timer,{total:ms,remaining:ms,taskBreak:true});
  }
}
export const overtimeElapsed=(timer,now=Date.now())=>timer.status==='overtime'?Math.max(0,now-timer.endAt):0;
export function finishOvertime(state,now=Date.now()){
  if(state.timer.status!=='overtime')return null;
  const session=record(state,'completed',now,{early:true});
  advanceTimer(state,now);
  return session;
}
const blockPhaseLength={focus:50*60000,break:10*60000};

function startBlockPhase(state, mode, taskId, available, split, now, calendarBlock) {
  const total=split ? Math.min(available,blockPhaseLength[mode]) : available;
  reset(state,mode);
  Object.assign(state.timer,{remaining:total,total,block:{taskId,left:available-total,...calendarBlock}});
  startPause(state,now);
}

export function startBlockFocus(state, taskId, available, split, now=Date.now(), occurrence, blockId=null, taskDay=occurrence) {
  state.activeTask=taskId;
  state.activeTaskDay=dayKey(new Date(now));
  startBlockPhase(state,'focus',taskId,available,split,now,{occurrence,blockId,taskDay});
}

function advanceTimer(state, now) {
  const {mode,block,sequence,taskPlan}=state.timer;
  const next=mode==='focus'?'break':'focus';
  if(taskPlan){
    const task=state.tasks.find(item=>item.id===taskPlan.taskId);
    const ready=task&&!task.waitingFor&&taskStatus(task,new Date(now))==='todo';
    const stage=taskPlan.stage==='first'?(taskPlan.totalMs>3600000&&ready?'interval':'final'):
      taskPlan.stage==='interval'?(ready?'second':''):taskPlan.stage==='second'?'final':'';
    if(stage)resetTaskTiming(state,{...taskPlan,stage});else reset(state,'focus');
  }else if(sequence){
    if(sequence.index+1<sequence.phases.length)loadRoutinePhase(state,sequence,sequence.index+1);
    else reset(state,'focus');
  }else if (block?.left>0) {
    const {occurrence,blockId,taskDay}=block;
    startBlockPhase(state,next,block.taskId,block.left,true,now,{occurrence,blockId,taskDay});
  }
  else reset(state,block?'focus':next);
}

export function skipPhase(state, now=Date.now()) {
  const h=record(state,'skipped',now);
  advanceTimer(state,now);
  return h;
}
export function record(state, outcome, now=Date.now(), {early=false}={}) {
  const t=state.timer;
  if(!t.id || state.history.some(h=>h.id===t.id)) return null;
  const overtime=t.status==='overtime',overtimeMs=overtimeElapsed(t,now);
  if(overtime)outcome='completed';
  const finish=outcome==='completed' && t.endAt && !early&&!overtime ? t.endAt : now;
  const task=t.taskSnapshot||state.tasks.find(task=>task.id===t.block?.taskId);
  const examId=t.mistakeId&&state.mistakes.find(item=>item.id===t.mistakeId)?.examId;
  const examProject=examId&&state.projects.find(project=>project.exams?.some(exam=>exam.id===examId));
  const intention=t.block?(task?.text||state.intention):(state.intention||task?.text||'');
  const h={id:t.id,mode:t.mode,outcome,finishedAt:finish,day:dayKey(new Date(finish)),focusMs:t.mode==='focus'?Math.max(0,t.total-remaining(state,now))+overtimeMs:0,intention,taskTitle:task?.text||'',taskId:task?.id||'',projectId:task?task.projectId||'':examProject?.id||null};
  if(overtime)h.overtimeMs=overtimeMs;
  if(t.replay?.length){
    // Record the closing event on the snapshot so a failed save can restore the running timer.
    const snapshot={...t};
    addReplayEvent(snapshot,outcome==='skipped'?'skip':early&&!overtime?'early':'finish',finish);
    h.replay=snapshot.replay;
  }
  if(t.mode==='focus'){
    if(t.goal)h.goal=t.goal;
    if(t.mistakeId)h.mistakeId=t.mistakeId;
    if(t.startHandoff)h.startHandoff=t.startHandoff;
    const nextHandoff=sessionHandoff(t.nextHandoff);
    if(nextHandoff){h.nextHandoff=nextHandoff;h.handoffTaskId=t.handoffTaskId||h.taskId;}
  }
  const block=t.block||t.calendarBlock;
  if(t.mode==='focus'&&isDay(block?.occurrence)&&Object.hasOwn(block,'blockId')){
    h.calendarBlock={occurrence:block.occurrence,blockId:block.blockId||null};
    if(isDay(block.taskDay)&&block.taskDay!==block.occurrence)h.calendarBlock.taskDay=block.taskDay;
  }
  state.history.push(h); return h;
}
export function settle(state, now=Date.now()) {
  if(state.timer.status!=='running' || remaining(state,now)>0) return null;
  const timer=state.timer;
  if(state.focusOvertime&&timer.mode==='focus'&&!timer.block&&!timer.sequence&&!timer.mistakeId){
    addReplayEvent(timer,'overtime',timer.endAt);
    timer.status='overtime';timer.remaining=0;
    return null;
  }
  const h=record(state,'completed',now);
  advanceTimer(state,state.timer.endAt);
  return h;
}
export function todayProgress(state, date=new Date()) {
  const items=state.history.filter(h=>h.day===dayKey(date) && h.mode==='focus');
  return {items,completed:items.filter(h=>h.outcome==='completed').length,skipped:items.filter(h=>h.outcome==='skipped').length,minutes:Math.floor(items.filter(h=>h.outcome==='completed').reduce((s,h)=>s+h.focusMs,0)/60000)};
}
