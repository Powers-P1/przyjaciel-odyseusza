import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequest } from '../../functions/api/contact.js';

const VALID = {
  name: 'Test Testowy', email: 'test@example.com', phone: '', subject_for: 'firma',
  message: 'Wiadomość testowa bez prawdziwej wysyłki.', website: '',
  'cf-turnstile-response': 'test-token',
};
const ENV = { RESEND_API_KEY: 'unit-test-only', TURNSTILE_SECRET: 'unit-test-only' };
function call(data = VALID, env = ENV) {
  return onRequestPost({ request: new Request('https://example.test/api/contact', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  }), env });
}
function rejectNetwork(t) {
  return t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network request in test'); });
}

test('null, tablice i prymitywy JSON dają kontrolowane 400 bez połączeń zewnętrznych', async (t) => {
  const fetchMock = rejectNetwork(t);
  for (const data of [null, [], [VALID], '', 'text', 0, 1, true, false]) {
    const response = await call(data);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'bad_request');
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('niepoprawny JSON i brak wymaganych pól nie uruchamiają wysyłki', async (t) => {
  const fetchMock = rejectNetwork(t);
  const malformed = new Request('https://example.test/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' });
  assert.equal((await onRequestPost({ request: malformed, env: ENV })).status, 400);
  const response = await call({});
  assert.equal(response.status, 422);
  assert.deepEqual((await response.json()).fields, ['name', 'email', 'message']);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('honeypot nie kontaktuje się z dostawcami', async (t) => {
  const fetchMock = rejectNetwork(t);
  const response = await call({ ...VALID, website: 'spam.example' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('szybkie zgłoszenia przechodzą weryfikację i wysyłkę do stałego odbiorcy', async (t) => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return Response.json(url.includes('siteverify') ? { success: true } : { id: 'test-only' });
  });
  for (const elapsed_ms of ['0', '400', '2499', '3000', '-5000', '']) {
    const response = await call({ ...VALID, elapsed_ms, to: 'ignored@example.test', subject: 'ignored' });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
  }
  assert.equal(requests.filter(({ url }) => url.includes('siteverify')).length, 6);
  const mail = requests.filter(({ url }) => url.includes('resend.com'));
  assert.equal(mail.length, 6);
  assert.deepEqual(mail[0].body.to, ['bartek@przyjacielodyseusza.pl']);
  assert.notEqual(mail[0].body.subject, 'ignored');
});

test('brak konfiguracji lub tokena jest błędem', async (t) => {
  const fetchMock = rejectNetwork(t);
  t.mock.method(console, 'error', () => {});
  assert.equal((await call(VALID, {})).status, 500);
  assert.equal((await call(VALID, { RESEND_API_KEY: 'unit-test-only' })).status, 500);
  assert.equal((await call({ ...VALID, 'cf-turnstile-response': '' })).status, 403);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('odrzucony token i awaria weryfikacji nie wywołują poczty', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => Response.json({ success: false }));
  assert.equal((await call()).status, 403);
  fetchMock.mock.mockImplementation(async () => new Response('unavailable', { status: 503 }));
  const unavailable = await call();
  assert.equal(unavailable.status, 503);
  assert.equal((await unavailable.json()).error, 'turnstile_unavailable');
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('awaria poczty zwraca jawny błąd', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => url.includes('siteverify')
    ? Response.json({ success: true }) : new Response('unavailable', { status: 503 }));
  const response = await call();
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error, 'mail_failed');
});

test('weryfikacja ma limit 8 sekund i przerywa żądanie', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let signal;
  t.mock.method(globalThis, 'fetch', (_url, options) => {
    signal = options.signal;
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
  });
  const pending = call();
  while (!signal) await Promise.resolve();
  t.mock.timers.tick(8000);
  const response = await pending;
  assert.equal(signal.aborted, true);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'turnstile_unavailable');
});

test('wysyłka ma limit 10 sekund i nie potwierdza niepewnego dostarczenia', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let signal;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.includes('siteverify')) return Response.json({ success: true });
    signal = options.signal;
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
  });
  const pending = call();
  while (!signal) await Promise.resolve();
  t.mock.timers.tick(10000);
  const response = await pending;
  assert.equal(signal.aborted, true);
  assert.equal(response.status, 504);
  assert.equal((await response.json()).error, 'mail_timeout');
});

test('odpowiedź bez JavaScriptu zawiera wynik i kontakt', async (t) => {
  const fetchMock = rejectNetwork(t);
  const response = await onRequestPost({
    request: new Request('https://example.test/api/contact', { method: 'POST', body: new URLSearchParams({ name: '' }) }), env: ENV,
  });
  assert.equal(response.status, 422);
  assert.match(response.headers.get('Content-Type'), /text\/html/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const html = await response.text();
  assert.match(html, /Nie udało się wysłać wiadomości/);
  assert.match(html, /mailto:bartek@przyjacielodyseusza.pl/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('inne metody niż POST pozostają zabronione', () => {
  const response = onRequest({ request: new Request('https://example.test/api/contact') });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'POST');
});
