import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCalendarImport} from '../dist/calendar-import.js';
import {calendarBlocks,allDayEvents} from '../dist/calendar.js';
import {summarizeWeek} from '../dist/weekly-planning.js';
import {freshState,loadState} from '../dist/state.js';
import {loadGardenSchedule,scheduledAppearance} from '../dist/garden-appearance.js';

test('iCalendar import expands weekly classes across DST, skips exclusions, and keeps all-day dates',()=>{
  const file=[
    'BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','UID:class',
    'DTSTART;TZID=America/New_York:20261026T090000','DTEND;TZID=America/New_York:20261026T100000',
    'RRULE:FREQ=WEEKLY;COUNT=4','EXDATE;TZID=America/New_York:20261109T090000',
    'SUMMARY:Materials\\, Lab','END:VEVENT',
    'BEGIN:VEVENT','UID:break','DTSTART;VALUE=DATE:20261109','DTEND;VALUE=DATE:20261111',
    'SUMMARY:Campus closure','END:VEVENT',
    'BEGIN:VEVENT','UID:unsupported','DTSTART:20261109T120000Z','RRULE:FREQ=MONTHLY;BYDAY=2MO',
    'SUMMARY:Unsupported repeat','END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const result=parseCalendarImport(file,new Date(2026,10,9));
  assert.equal(result.skipped,1);
  assert.deepEqual(result.events.filter(event=>event.start).map(event=>[event.title,new Date(event.start).toISOString()]),[
    ['Materials, Lab','2026-10-26T13:00:00.000Z'],['Materials, Lab','2026-11-02T14:00:00.000Z'],['Materials, Lab','2026-11-16T14:00:00.000Z']
  ]);
  assert.equal(allDayEvents(result.events,new Date(2026,10,10)).length,1);
  assert.equal(allDayEvents(result.events,new Date(2026,10,11)).length,0);
});

test('workload adds overlapping study blocks but counts overlapping commitments only once',()=>{
  const day=new Date(2026,10,9);
  const state=freshState();
  state.tasks=[
    {id:'read',text:'Read',repeat:'none',done:false,date:'2026-11-09',time:'09:00',estimate:60},
    {id:'lab',text:'Lab',repeat:'none',done:false,date:'2026-11-09',time:'09:30',estimate:60},
    {id:'earlier',text:'Earlier',repeat:'none',done:false,date:'2026-11-08'},
    {id:'next',text:'Next',repeat:'none',done:false,date:'2026-11-17'}
  ];
  const at=hour=>new Date(2026,10,9,hour).getTime();
  state.calendarEvents=[{id:'one',title:'One',start:at(9),end:at(11)},{id:'two',title:'Two',start:at(10),end:at(12)}];
  const saved=loadState({getItem:()=>JSON.stringify(state)});
  const result=summarizeWeek(saved,saved.tasks,day);
  assert.equal(result.timeline[0].planned,120);
  assert.equal(result.timeline[0].busy,180);
  assert.equal(result.carried[0].id,'earlier');
  assert.equal(result.next[0].task.id,'next');
  assert.equal(calendarBlocks(saved.tasks,day,saved.calendarEvents).filter(block=>block.event).length,2);
});

test('daily Garden presets use the most recent local start time, including the prior night',()=>{
  const base=freshState().appearance;
  const schedule=loadGardenSchedule({enabled:true,presets:[
    {time:'21:30',season:'winter',lighting:'night'},
    {time:'08:00',season:'spring',lighting:'day'}
  ]});
  const overnight=scheduledAppearance(base,schedule,new Date(2026,10,9,5));
  assert.equal(overnight.lighting,'night');
  assert.equal(overnight.weatherSince,new Date(2026,10,8,21,30).getTime());
  assert.equal(scheduledAppearance(base,schedule,new Date(2026,10,9,8)).season,'spring');
  assert.equal(scheduledAppearance(base,{...schedule,enabled:false},new Date(2026,10,9,8)),base);
});
