import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarBlocks,calendarBlockTimeLabel,calendarBufferBands,calendarTaskBlock,layoutBlocks} from '../dist/calendar.js';
import {resizeSummary} from '../dist/calendar-resize.js';
import {parseRubric,rubricSummary} from '../dist/rubric.js';

test('overnight block labels show the same full range on both days',()=>{
  const monday=new Date('2026-11-23T00:00'),tuesday=new Date('2026-11-24T00:00');
  const task={id:'study',text:'Study',date:'2026-11-23',time:'23:45',estimate:30};
  const event={id:'class',start:+new Date('2026-11-23T23:45'),end:+new Date('2026-11-24T00:15')};
  for(const day of [monday,tuesday]){
    assert.deepEqual(calendarBlocks([task],day,[event]).map(block=>calendarBlockTimeLabel(block)),
      ['11:45 PM–12:15 AM Tue','11:45 PM–12:15 AM Tue']);
  }
});

test('resize summaries distinguish the changed edge, direction, and ending weekday',()=>{
  const source={date:'2026-11-23',start:14*60,end:15*60+30};
  assert.equal(resizeSummary(source,{start:source.start,end:15*60+45}),'Ends 15 min later, at 3:45 PM.');
  assert.equal(resizeSummary(source,{start:13*60+50,end:source.end}),'Starts 10 min earlier, at 1:50 PM.');
  assert.equal(resizeSummary({date:source.date,start:1425,end:1455},{start:1425,end:1470}),'Ends 15 min later, at 12:30 AM Tue.');
});

test('timeline buffer bands show recurring occurrences across midnight and omit skipped dates',()=>{
  const date=value=>new Date(value+'T00:00');
  const event={id:'late',manual:true,repeat:'daily',start:+new Date('2026-11-18T23:30'),end:+new Date('2026-11-18T23:55'),
    bufferBefore:10,bufferAfter:20,excludedDays:['2026-11-20']};
  assert.deepEqual(calendarBufferBands([event],date('2026-11-19')),[
    {edge:'after',start:0,end:15},{edge:'before',start:1400,end:1410},{edge:'after',start:1435,end:1440}
  ]);
  assert.deepEqual(calendarBufferBands([event],date('2026-11-20')),[{edge:'after',start:0,end:15}]);
  assert.deepEqual(calendarBufferBands([event],date('2026-11-21')),[
    {edge:'before',start:1400,end:1410},{edge:'after',start:1435,end:1440}
  ]);
});

test('overlap marks both sides of shared time and leaves adjacent blocks unmarked',()=>{
  const blocks=layoutBlocks([{start:21,end:25},{start:8,end:14},{start:2,end:10},{start:14,end:21},{start:18,end:21}]);
  assert.deepEqual(blocks.map(block=>[block.start,block.overlapping,block.lanes]),[
    [2,true,2],[8,true,2],[14,true,2],[18,true,2],[21,false,1]
  ]);
});

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
