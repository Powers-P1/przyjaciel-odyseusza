import test from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandler, onRequest } from '../../functions/api/contact.js';

const VALID = { name: 'Test Testowy', email: 'test@example.com', phone: '', subject_for: 'firma',
  message: 'Wiadomość testowa bez prawdziwej wysyłki.', website: '', 'cf-turnstile-response': 'test-token' };
const ENV = { SMTP_USERNAME: 'bartek@przyjacielodyseusza.pl', SMTP_PASSWORD: 'unit-test-only',
  TURNSTILE_SECRET: 'unit-test-only', TURNSTILE_HOSTNAMES: 'example.test' };
const VERIFIED = { success: true, action: 'contact', hostname: 'example.test' };
function call(data = VALID, env = ENV, sendMail = async () => ({ accepted: true }), headers = {}) {
  return createContactHandler(sendMail)({ request: new Request('https://example.test/api/contact', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(data),
  }), env });
}

test('invalid input, field types and limits do not reach either upstream', async (t) => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  const sendMail = t.mock.fn(async () => ({ accepted: true }));
  for (const data of [null, [], 0, true, 'text']) assert.equal((await call(data, ENV, sendMail)).status, 400);
  for (const data of [
    {}, { ...VALID, name: ['name'] }, { ...VALID, email: ['valid@example.com'] },
    { ...VALID, name: { toString: null, valueOf: null } },
    { ...VALID, message: { toString: null, valueOf: null } },
    { ...VALID, email: 'valid@example.com\r\nBcc: other@example.com' },
    { ...VALID, name: 'a'.repeat(101) }, { ...VALID, message: 'a'.repeat(4001) },
    { ...VALID, phone: '1'.repeat(41) }, { ...VALID, subject_for: ['firma'] },
  ]) assert.equal((await call(data, ENV, sendMail)).status, 422);
  assert.equal((await call({ ...VALID, message: 'x'.repeat(40000) }, ENV, sendMail)).status, 413);
  assert.equal(network.mock.callCount(), 0);
  assert.equal(sendMail.mock.callCount(), 0);
});

test('cross-origin requests and the honeypot never send mail', async (t) => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  const sendMail = t.mock.fn();
  assert.equal((await call(VALID, ENV, sendMail, { Origin: 'https://other.test' })).status, 403);
  assert.equal((await call({ ...VALID, website: 'spam.test' }, ENV, sendMail)).status, 200);
  assert.equal(network.mock.callCount(), 0);
  assert.equal(sendMail.mock.callCount(), 0);
});

test('missing production configuration and token fail closed', async (t) => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  for (const key of Object.keys(ENV)) {
    const env = { ...ENV }; delete env[key];
    assert.equal((await call(VALID, env)).status, 500);
  }
  assert.equal((await call({ ...VALID, 'cf-turnstile-response': '' })).status, 403);
  assert.equal((await call({ ...VALID, 'cf-turnstile-response': 'x'.repeat(2049) })).status, 403);
  assert.equal(network.mock.callCount(), 0);
});

test('wrong hostname, wrong action and consumed token cannot send mail', async (t) => {
  const verify = t.mock.method(globalThis, 'fetch', async () => Response.json(VERIFIED));
  const sendMail = t.mock.fn(async () => ({ accepted: true }));
  for (const result of [
    { ...VERIFIED, hostname: 'localhost' }, { ...VERIFIED, action: 'login' },
    { ...VERIFIED, success: false, 'error-codes': ['timeout-or-duplicate'] }, { success: true },
  ]) {
    verify.mock.mockImplementation(async () => Response.json(result));
    assert.equal((await call(VALID, ENV, sendMail)).status, 403);
  }
  assert.equal(sendMail.mock.callCount(), 0);
});

test('fast valid submissions use the fixed account and Reply-To, ignoring client routing fields', async (t) => {
  const verify = t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(new URLSearchParams(options.body).get('response'), 'test-token');
    return Response.json(VERIFIED);
  });
  const sent = [];
  const sendMail = async (mail, credentials) => { sent.push({ mail, credentials }); return { accepted: true }; };
  for (const elapsed_ms of ['0', '400', '-5000']) {
    assert.equal((await call({ ...VALID, elapsed_ms, to: 'other@example.test', subject: 'ignored', from: 'spoof@example.test' }, ENV, sendMail)).status, 200);
  }
  assert.equal(sent.length, 3);
  assert.equal(verify.mock.callCount(), 3);
  assert.equal(sent[0].credentials.username, ENV.SMTP_USERNAME);
  assert.equal(sent[0].mail.replyTo, VALID.email);
  assert.match(sent[0].mail.text, /Wiadomość testowa/);
  assert.equal(sent[0].mail.to, undefined);
  assert.notEqual(sent[0].mail.subject, 'ignored');
});

test('verification outages and non-JSON responses do not send mail', async (t) => {
  const verify = t.mock.method(globalThis, 'fetch', async () => new Response('unavailable', { status: 503 }));
  const sendMail = t.mock.fn();
  assert.equal((await call(VALID, ENV, sendMail)).status, 503);
  verify.mock.mockImplementation(async () => new Response('invalid json'));
  assert.equal((await call(VALID, ENV, sendMail)).status, 503);
  assert.equal(sendMail.mock.callCount(), 0);
});

test('relay rejection and uncertain timeout return errors, never success or automatic retries', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json(VERIFIED));
  for (const [error, status] of [['mail_failed', 502], ['mail_timeout', 504]]) {
    const sendMail = t.mock.fn(async () => { throw new Error(error); });
    const response = await call(VALID, ENV, sendMail);
    assert.equal(response.status, status);
    assert.equal((await response.json()).error, error);
    assert.equal(sendMail.mock.callCount(), 1);
  }
});

test('verification is bounded to 8 seconds', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let signal;
  t.mock.method(globalThis, 'fetch', (_url, options) => {
    signal = options.signal;
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
  });
  const pending = call();
  while (!signal) await Promise.resolve();
  t.mock.timers.tick(8000);
  assert.equal((await pending).status, 503);
});

test('body size is enforced even when Content-Length is absent', async () => {
  const request = new Request('https://example.test/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: 'x'.repeat(32769) });
  assert.equal((await createContactHandler()({ request, env: ENV })).status, 413);
});

test('no-JS failure includes a readable result and direct contact; GET is 405', async () => {
  const request = new Request('https://example.test/api/contact', { method: 'POST', body: new URLSearchParams({ name: '' }) });
  const response = await createContactHandler()({ request, env: ENV });
  assert.equal(response.status, 422);
  assert.match(response.headers.get('Content-Type'), /text\/html/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match(await response.text(), /mailto:bartek@przyjacielodyseusza.pl/);
  assert.equal(onRequest({ request: new Request('https://example.test/api/contact') }).status, 405);
});
