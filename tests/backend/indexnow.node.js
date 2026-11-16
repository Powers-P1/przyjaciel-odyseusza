import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createSubmission, submitIndexNow, INDEXNOW_ENDPOINT } from '../../tools/indexnow.mjs';

const config = JSON.parse(fs.readFileSync(new URL('../../config/indexnow.json', import.meta.url), 'utf8'));
const html = '<html><head><link rel="canonical" href="https://przyjacielodyseusza.pl/"></head><body>Approved text</body></html>';
function mock({ status = 200, key = config.key, liveHtml = html, pageHeaders = {}, failPost = false } = {}) {
  const requests = [];
  const fetcher = async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith('.txt')) return new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    if (url === 'https://przyjacielodyseusza.pl/') return new Response(liveHtml, { headers: { 'Content-Type': 'text/html', ...pageHeaders } });
    assert.equal(url, INDEXNOW_ENDPOINT);
    if (failPost) throw new Error('Unknown transport outcome');
    return new Response('', { status });
  };
  return { requests, fetcher };
}

test('only the single canonical production page can be submitted; the host key is public and matches', () => {
  const payload = createSubmission(config);
  assert.equal(fs.readFileSync(new URL(`../../public/${config.key}.txt`, import.meta.url), 'utf8').trim(), payload.key);
  for (const changed of [
    { ...config, host: 'example.com' },
    { ...config, urlList: ['https://przyjaciel-odyseusza.pages.dev/'] },
    { ...config, urlList: ['https://przyjacielodyseusza.pl/?email=private@example.com'] },
    { ...config, urlList: ['https://przyjacielodyseusza.pl/#kontakt'] },
    { ...config, urlList: ['https://przyjacielodyseusza.pl/api/contact'] },
    { ...config, key: '../private' },
  ]) assert.throws(() => createSubmission(changed));
});

test('200 means accepted and 202 remains pending key validation, neither means indexed', async () => {
  for (const status of [200, 202]) {
    const fixture = mock({ status });
    const result = await submitIndexNow(config, { fetcher: fixture.fetcher, expectedHtml: html });
    assert.equal(result.indexed, false);
    assert.equal(result.state, status === 200 ? 'accepted' : 'accepted_pending_key_validation');
    assert.equal(fixture.requests.length, 3);
    assert.deepEqual(JSON.parse(fixture.requests[2].options.body), createSubmission(config));
    assert.equal(fixture.requests[2].options.headers.Authorization, undefined);
    assert.equal(result.emailsSent, 0);
  }
});

test('key mismatch, stale deployment, noindex and canonical mismatch stop before any POST', async () => {
  for (const scenario of [
    { key: 'different-key' },
    { liveHtml: html.replace('Approved text', 'Previous deployment'), expectedHtml: html },
    { pageHeaders: { 'X-Robots-Tag': 'noindex' } },
    { liveHtml: html.replace('</head>', '<meta name="robots" content="noindex, follow"></head>') },
    { liveHtml: html.replace('href="https://przyjacielodyseusza.pl/"', 'href="https://example.com/"') },
  ]) {
    const fixture = mock(scenario);
    await assert.rejects(submitIndexNow(config, { fetcher: fixture.fetcher, expectedHtml: scenario.expectedHtml || scenario.liveHtml || html }));
    assert.equal(fixture.requests.filter(x => x.options.method === 'POST').length, 0);
  }
});

test('unchanged accepted page is not repeatedly notified and transport failures are not retried', async () => {
  const fixture = mock();
  const first = await submitIndexNow(config, { fetcher: fixture.fetcher, expectedHtml: html });
  const second = await submitIndexNow(config, { fetcher: fixture.fetcher, expectedHtml: html, previous: first });
  assert.equal(second.unchanged, true);
  assert.equal(second.requestSent, false);
  assert.equal(fixture.requests.filter(x => x.options.method === 'POST').length, 1);
  const failure = mock({ failPost: true });
  await assert.rejects(submitIndexNow(config, { fetcher: failure.fetcher, expectedHtml: html }));
  assert.equal(failure.requests.filter(x => x.options.method === 'POST').length, 1);
});
