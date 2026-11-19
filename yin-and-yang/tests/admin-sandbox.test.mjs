import test from 'node:test';
import assert from 'node:assert/strict';
import {adminSandboxStorage,adminSandboxUrl,isAdminSandbox,workspaceStorageEvent} from '../dist/admin-sandbox.js';
import {readCaptures,saveCapture} from '../dist/capture.js';

test('sandbox storage separates writes, removals, enumeration and cross-tab events',()=>{
  const data=new Map(),live={get length(){return data.size;},key:i=>[...data.keys()][i]??null,
    getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
  const sandbox=adminSandboxStorage(live);
  live.setItem('state','regular');sandbox.setItem('state','sample');
  saveCapture(live,'Regular thought');saveCapture(sandbox,'Sandbox thought');
  assert.equal(sandbox.length,2);
  assert.equal(readCaptures(sandbox)[0].text,'Sandbox thought');
  assert.deepEqual(readCaptures(live).map(n=>n.text),['Regular thought']);
  assert.equal(workspaceStorageEvent('state',true),undefined);
  const key=[...data.keys()].find(key=>key.endsWith(':state'));
  assert.equal(workspaceStorageEvent(key,false),undefined);
  assert.equal(workspaceStorageEvent(key,true),'state');
  sandbox.removeItem('state');assert.equal(live.getItem('state'),'regular');
});
test('entering and leaving admin preserves the other URL parameters',()=>{
  const url='https://yin-and-yang.local/index.html?test=one#garden';
  const inside=adminSandboxUrl(true,url);
  assert.equal(isAdminSandbox(inside),true);
  assert.equal(adminSandboxUrl(false,inside),url);
});
