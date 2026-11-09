import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importTodoistProject,matchesPlannerQuery,nextTaskDate,quickTask} from '../dist/planner-data.js';
import {calendarBlocks} from '../dist/calendar.js';
import {completeTask,freshState,loadState,taskStatus} from '../dist/state.js';

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
