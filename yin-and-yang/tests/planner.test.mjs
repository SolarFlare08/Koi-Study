import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importTodoistProject,matchesPlannerQuery,nextTaskDate,quickTask} from '../dist/planner-data.js';
import {calendarBlocks} from '../dist/calendar.js';
import {completeTask,freshState,loadState,recordTaskCompletion,settle,skipPhase,startPause,taskStatus} from '../dist/state.js';
import {estimateAccuracy,estimateReportDays,courseEstimateAccuracy,courseEstimateCsv,reportCsv,reportEvents,reportExportFilename,reportMetrics} from '../dist/planner-report.js';
import {captureTaskChange,restoreDeletedTask} from '../dist/task-undo.js';

test('Quick Add creates a timed project task that shows in the shared calendar and saved filters',()=>{
  const now=new Date(2026,10,8), tomorrow=new Date(2026,10,9);
  const projects=[{id:'studio',name:'Studio work'}];
  const task=quickTask('Review drawings tomorrow at 4pm for 45m p2 %review #"Studio work" {2026-11-10}',{},projects,now);
  assert.equal(task.text,'Review drawings');
  assert.equal(task.deadline,'2026-11-10');
  assert.deepEqual(calendarBlocks([task],tomorrow).map(block=>[block.start,block.end]),[[960,1005]]);
  assert.equal(matchesPlannerQuery(task,'tomorrow & #"Studio work" & p2 & %review',projects,now),true);
  assert.equal(matchesPlannerQuery(task,'p1 | !%review',projects,now),false);
});

test('completing one recurrence preserves older completions and exposes the next occurrence after reload',()=>{
  const jan31=new Date(2026,0,31), feb28=new Date(2026,1,28);
  const task=quickTask('Review budget every month',{},[],jan31);
  completeTask(task,true,jan31);
  assert.equal(nextTaskDate(task,jan31),'2026-02-28');
  completeTask(task,true,feb28);
  const state=freshState(); state.tasks.push(task);
  const [saved]=loadState({getItem:()=>JSON.stringify(state)}).tasks;
  assert.equal(taskStatus(saved,jan31),'done');
  assert.equal(taskStatus(saved,feb28),'done');
  assert.equal(nextTaskDate(saved,feb28),'2026-03-31');
  completeTask(saved,false,jan31);
  assert.equal(taskStatus(saved,jan31),'todo');
  assert.equal(taskStatus(saved,feb28),'done');
});

test('Todoist CSV import preserves quoted content and keeps unrecognized schedules in task descriptions',()=>{
  const csv='TYPE,CONTENT,DESCRIPTION,PRIORITY,INDENT,DATE,DURATION\r\nsection,Reading,,,,,\r\ntask,"Read, review",Notes,1,1,2026-11-09 16:00,45\r\ntask,Chapter 1,,,2,,\r\nnote,"Bring the ""old"" copy",,,,,\r\ntask,Visit library,,,1,every last working day,';
  const {project,tasks,unmappedDates}=importTodoistProject(csv,'Course',new Date(2026,10,8));
  assert.equal(tasks[0].sectionId,project.sections[0].id);
  assert.equal(tasks[0].text,'Read, review');
  assert.equal(tasks[0].estimate,45);
  assert.equal(tasks[0].subtasks[0].text,'Chapter 1');
  assert.equal(tasks[0].comments[0].text,'Bring the "old" copy');
  assert.equal(tasks[0].time,'16:00');
  assert.match(tasks[1].description,/every last working day/);
  assert.equal(unmappedDates,1);
  assert.throws(()=>importTodoistProject('random,file\nA,B','Course'),/TYPE and CONTENT/);
});

test('reporting records a recurring completion on the actual completion day and can reopen it',()=>{
  const occurrence=new Date(2026,10,7);
  const now=new Date(2026,10,8,10);
  const state=freshState();
  const repeating=quickTask('Review budget every day',{projectId:'studio'},[],occurrence);
  const legacy=quickTask('Read notes',{},[],occurrence);
  completeTask(legacy,true,occurrence);
  state.tasks.push(repeating,legacy);
  recordTaskCompletion(state,repeating,true,occurrence,now.getTime());
  repeating.projectId='';
  const saved=loadState({getItem:()=>JSON.stringify(state)});
  const events=reportEvents(saved,{period:'1',project:'studio'},now);
  assert.deepEqual(events.map(event=>[event.day,event.text,event.at]),[['2026-11-08','Review budget',now.getTime()]]);
  assert.equal(reportEvents(saved).length,2);
  assert.equal(reportEvents(saved,{project:'inbox'})[0].at,null);
  recordTaskCompletion(saved,saved.tasks[0],false,occurrence,now.getTime());
  assert.equal(reportEvents(saved).length,1);
});

test('focus metrics keep project attribution after reload and exclude skips from focus minutes',()=>{
  const now=new Date(2026,10,8,10);
  const state=freshState();
  const task=quickTask('Review drawings',{projectId:'studio'},[],now);
  state.tasks.push(task);
  state.activeTask=task.id;
  startPause(state,now.getTime());
  task.projectId='';
  const saved=loadState({getItem:()=>JSON.stringify(state)});
  settle(saved,now.getTime()+25*60000);
  startPause(saved,now.getTime()+25*60000);
  settle(saved,now.getTime()+30*60000);
  saved.tasks[0].projectId='studio';
  startPause(saved,now.getTime()+30*60000);
  skipPhase(saved,now.getTime()+31*60000);
  const events=reportEvents(saved,{project:'studio',period:'1'},now);
  assert.deepEqual(events.map(event=>[event.type,event.text]),[['skipped','Review drawings'],['focus','Review drawings']]);
  assert.deepEqual(reportMetrics(events).total,{task:0,focus:1,skipped:1,ms:25*60000,days:1,average:25*60000,rate:0.5});
  assert.match(reportCsv(events,()=> 'Studio, "Design"'),/"Review drawings","Studio, ""Design""","25"/);
});
test('estimate accuracy assigns completed focus to separate occurrences and flags repeated overruns',()=>{
  const state=freshState();
  const task=quickTask('Review notes every day',{projectId:'study'},[],new Date(2026,10,8));
  task.estimate=20;
  state.tasks.push(task);
  for(let day=8;day<=10;day++){
    const date=new Date(2026,10,day,10);
    state.history.push({id:`focus-${day}`,mode:'focus',outcome:'completed',taskId:task.id,projectId:'study',finishedAt:date.getTime(),focusMs:(day===10?15:30)*60000});
    state.history.push({id:`skip-${day}`,mode:'focus',outcome:'skipped',taskId:task.id,finishedAt:date.getTime(),focusMs:25*60000});
    recordTaskCompletion(state,task,true,date,date.getTime()+1);
  }
  task.estimate=90;
  const [row]=estimateAccuracy(state,{project:'study'},new Date(2026,10,10));
  assert.equal(row.estimatedMs,60*60000);
  assert.equal(row.actualMs,75*60000);
  assert.equal(row.over,2);
  assert.equal(row.samples,3);
  assert.equal(row.consistent,true);
  task.projectId='different';
  const [course]=courseEstimateAccuracy(state,{project:'study',period:'1'},new Date(2026,10,10));
  assert.deepEqual(course,{projectId:'study',samples:1,estimatedMs:20*60000,actualMs:15*60000,
    differenceMs:-5*60000,averageDifferenceMs:-5*60000});
  assert.match(courseEstimateCsv([course],()=> 'Calculus'),/"Calculus","1","20","15","-5","-5"/);
  assert.deepEqual(estimateReportDays(state,{project:'study',period:'1'},new Date(2026,10,10)),['2026-11-10']);
});

test('report CSV filenames use inclusive dates or the actual span of all dated rows',()=>{
  const now=new Date(2027,0,3,14),days=['2026-10-10','','2027-01-01','2026-09-20'];
  assert.equal(reportExportFilename('activity','7',days,now),'yin-and-yang-activity-2026-12-28-to-2027-01-03.csv');
  assert.equal(reportExportFilename('estimates','1',[],now),'yin-and-yang-estimates-2027-01-03.csv');
  assert.equal(reportExportFilename('course-estimates','all',days,now),'yin-and-yang-course-estimates-2026-09-20-to-2027-01-01.csv');
  assert.equal(reportExportFilename('activity','all',[''],now),'yin-and-yang-activity-all-dates.csv');
});

test('course estimates rank total and per-task overruns separately',()=>{
  const state=freshState(),now=new Date(2026,10,23,14),minute=60000;
  const complete=(projectId,estimate,actual)=>{
    const taskId='task-'+state.taskActivity.length;
    state.taskActivity.push({id:taskId+':once',taskId,text:taskId,projectId,at:+now,estimate});
    state.history.push({id:taskId,taskId,mode:'focus',outcome:'completed',finishedAt:+now-1,focusMs:actual*minute});
  };
  for(let index=0;index<8;index++)complete('calculus',20,index===0?30:20);
  complete('physics',20,28);
  complete('biology',200,195);
  const totals=courseEstimateAccuracy(state,{},now);
  const average=courseEstimateAccuracy(state,{courseSort:'average'},now);
  assert.deepEqual(totals.map(row=>row.projectId),['calculus','physics','biology']);
  assert.deepEqual(average.map(row=>row.projectId),['physics','calculus','biology']);
  assert.equal(totals[0].samples,8);
  assert.equal(totals[0].differenceMs,10*minute);
  assert.equal(totals[0].averageDifferenceMs,1.25*minute);
  const csv=courseEstimateCsv(totals,id=>id);
  assert.match(csv,/"Average difference per completed task \(min\)"/);
  assert.match(csv,/"calculus","8","160","170","10","1.3"/);
});

test('undo restores a task completion, a move, or a deleted task without replacing unrelated edits',()=>{
  const state=freshState();
  const date=new Date(2026,10,8);
  const task=quickTask('Review notes',{},[],date);
  state.tasks.push(task);
  const undoComplete=recordTaskCompletion(state,task,true,date,date.getTime());
  assert.equal(undoComplete(state),true);
  assert.equal(state.taskActivity.length,0);
  assert.equal(task.done,false);
  const finishMove=captureTaskChange(task,['date','projectId']);
  task.date='2026-11-09';
  const undoMove=finishMove();
  task.text='Revised title';
  assert.equal(undoMove(state),true);
  assert.equal(task.date,'');
  assert.equal(task.text,'Revised title');
  const undoDelete=restoreDeletedTask(state.tasks.pop(),0);
  assert.equal(undoDelete(state),true);
  assert.equal(state.tasks[0].text,'Revised title');
  assert.equal(undoDelete(state),false);
});
