import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarBlocks,calendarTaskBlock} from '../dist/calendar.js';
import {parseRubric,rubricSummary} from '../dist/rubric.js';

test('a skipped occurrence hides both overnight segments and keeps the next occurrence',()=>{
  const day='2026-11-18',tomorrow='2026-11-19',date=value=>new Date(value+'T00:00:00');
  const event={id:'c',title:'Class',manual:true,repeat:'daily',start:+new Date(day+'T23:30'),end:+new Date(tomorrow+'T00:30'),excludedDays:[day]};
  const task={id:'t',text:'Study',date:day,time:'23:30',repeat:'daily',estimate:60,excludedDays:[day],
    blocks:[{id:'moved',date:tomorrow,taskDay:day,time:'14:00',minutes:30}]};
  assert.deepEqual(calendarBlocks([task],date(day),[event]),[]);
  const next=calendarBlocks([task],date(tomorrow),[event]);
  assert.equal(next.length,2);assert.ok(next.every(block=>block.start===1410));
  assert.equal(calendarTaskBlock(task,'moved',tomorrow),null);
});

test('rubrics retain fractional and zero scores and total only points on unfinished work',()=>{
  const items=parseRubric('1. Analysis | 25\n- Citations (10.5 pts)\n0 points: Formatting\nOptional reflection');
  assert.deepEqual(items.map(item=>item.points),[25,10.5,0,null]);
  items[0].done=true;
  assert.equal(rubricSummary(items),'10.5 of 35.5 rubric points unfinished');
});
