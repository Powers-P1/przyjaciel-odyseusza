import test from 'node:test';
import assert from 'node:assert/strict';
import {collectLighthouseRun} from '../../tools/lighthouse-run.mjs';
const valid=(performance=1,tbt=0)=>({lhr:{categories:{performance:{score:performance}},audits:{'largest-contentful-paint':{numericValue:2000},'cumulative-layout-shift':{numericValue:.002},'total-blocking-time':{numericValue:tbt}}}});
test('the observed NO_NAVSTART collector error gets one fresh attempt',async()=>{
 let calls=0;const attempts=[];
 const result=await collectLighthouseRun(async()=>++calls===1?{lhr:{runtimeError:{code:'NO_NAVSTART'}}}:valid(),(_,attempt)=>attempts.push(attempt));
 assert.equal(calls,2);assert.deepEqual(attempts,[1,2]);assert.equal(result.lhr.categories.performance.score,1);
});
test('a valid slow or below-budget page is retained without retries',async()=>{
 let calls=0;const result=await collectLighthouseRun(async()=>{calls++;return valid(.7,500);});
 assert.equal(calls,1);assert.equal(result.lhr.categories.performance.score,.7);assert.equal(result.lhr.audits['total-blocking-time'].numericValue,500);
});
test('repeated trace failure fails after exactly two attempts',async()=>{
 let calls=0;await assert.rejects(collectLighthouseRun(async()=>{calls++;return{lhr:{runtimeError:{code:'NO_NAVSTART'}}};}),/NO_NAVSTART/);assert.equal(calls,2);
});
test('a page with no paint or other runtime failure is not retried',async()=>{
 let calls=0;await assert.rejects(collectLighthouseRun(async()=>{calls++;return{lhr:{runtimeError:{code:'NO_FCP'}}};}),/NO_FCP/);assert.equal(calls,1);
});
test('unexplained missing metrics fail closed without a retry',async()=>{
 let calls=0;await assert.rejects(collectLighthouseRun(async()=>{calls++;return valid(1,NaN);}),/total-blocking-time/);assert.equal(calls,1);
});
