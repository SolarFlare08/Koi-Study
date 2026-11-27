import {test} from 'node:test';
import assert from 'node:assert/strict';
import {searchHelpResults} from '../dist/help-data.js';

test('button-name searches rank the guide and point to the instruction',()=>{
  for(const [query,id,label] of [
    ['Print summary','weekly-review','Print summary'],
    ['“Skip this date”','skip-calendar-date','Skip this date'],
    ['Skip date','skip-calendar-date','Skip this date'],
    ['Copy version number','versions','Copy version number']
  ]){
    const [result]=searchHelpResults(query);
    assert.equal(result?.topic.id,id,query);
    assert.ok(result.topic.steps[result.step]?.includes(label),query);
  }
});
