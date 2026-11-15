import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeRuns } from '../../tools/lighthouse-metrics.mjs';

function report(performance,tbt,lcp=2000,accessibility=1) {
  return {categories:{performance:{score:performance},accessibility:{score:accessibility}},audits:{
    'total-blocking-time':{numericValue:tbt},'largest-contentful-paint':{numericValue:lcp},'cumulative-layout-shift':{numericValue:0.002}}};
}
test('the observed CI outlier does not replace the actual median of TBT',()=>{
  const result=summarizeRuns([report(.96,219,1980),report(.99,0,2002),report(.93,0,3223)]);
  assert.equal(result.scores.performance,.96);
  assert.equal(result.tbt,0);
  assert.equal(result.lcp,2002);
});
test('a real repeated blocking regression fails the unchanged 200 ms budget',()=>{
  assert.ok(summarizeRuns([report(.99,0),report(.96,219),report(.95,300)]).tbt>200);
});
test('functional category failures cannot be hidden by aggregation',()=>{
  assert.equal(summarizeRuns([report(.99,0,2000,.8),report(1,0),report(1,0)]).scores.accessibility,.8);
});
test('missing or nonfinite measurements fail closed',()=>{
  assert.throws(()=>summarizeRuns([]));
  assert.throws(()=>summarizeRuns([report(.99,NaN)]));
});
