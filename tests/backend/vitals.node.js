import test from 'node:test';
import assert from 'node:assert/strict';
import { createVitalsTelemetry } from '../../src/js/vitals.mjs';

function harness(registrations) {
  const sent = [];
  let allowed = false;
  let listener;
  let subscriptions = 0;
  const telemetry = createVitalsTelemetry((...args) => sent.push(args), () => allowed,
    registrations || [callback => { subscriptions++; listener = callback; }]);
  return { telemetry, sent, allow(value) { allowed = value; }, emit(metric) { listener(metric); }, subscriptions() { return subscriptions; } };
}

test('performance observers start after consent and exclude DOM, URL and arbitrary fields', () => {
  const h = harness();
  h.telemetry.start();
  assert.equal(h.subscriptions(), 0);
  h.allow(true); h.telemetry.start(); h.telemetry.start();
  assert.equal(h.subscriptions(), 1);
  h.emit({name:'LCP',value:1234.56,rating:'good',id:'private-value',entries:[{element:'private message'}],navigationURL:'https://example.invalid/?email=private@example.invalid'});
  assert.deepEqual(h.sent, [['web_vital',{vital_name:'LCP',vital_value:1235,vital_rating:'good',vital_unit:'ms'}]]);
  assert.doesNotMatch(JSON.stringify(h.sent), /private|example|entries|navigationURL/);
});

test('withdrawal suppresses pending metrics and re-consent does not replay the old page sample', () => {
  const h = harness(); h.allow(true); h.telemetry.start();
  h.allow(false); h.telemetry.revoke();
  h.emit({name:'INP',value:210,rating:'needs-improvement'});
  h.allow(true); h.telemetry.start();
  h.emit({name:'LCP',value:2000,rating:'good'});
  assert.deepEqual(h.sent, []);
  assert.equal(h.subscriptions(), 1);
});

test('malformed metrics and duplicate samples are ignored; BFCache can start a fresh sample', () => {
  const h = harness(); h.allow(true); h.telemetry.start();
  for (const value of [NaN, Infinity, -1, '100']) h.emit({name:'LCP',value,rating:'good'});
  h.emit({name:'CLS',value:Number.MAX_VALUE,rating:'good'});
  h.emit({name:'private-field',value:12,rating:'good'});
  h.emit({name:'LCP',value:12,rating:'private message'});
  assert.equal(h.sent.length, 0);
  h.emit({name:'CLS',value:0.0123456,rating:'good',id:'initial'});
  h.emit({name:'CLS',value:0.018,rating:'good',id:'initial'});
  h.emit({name:'CLS',value:0.025,rating:'good',id:'bfcache'});
  assert.equal(h.sent.length, 2);
  assert.equal(h.sent[0][1].vital_value, 0.0123);
  assert.equal(h.sent[1][1].vital_unit, 'ratio');
});

test('an unsupported or failing performance API cannot break analytics registration or contact', () => {
  const sent = []; let allowed = true;
  const t = createVitalsTelemetry((...args) => sent.push(args), () => allowed, [() => { throw new Error('Unsupported'); }, callback => callback({name:'INP',value:100,rating:'good'})]);
  assert.doesNotThrow(() => t.start());
  assert.equal(sent.length, 1);
  allowed = false;
});
