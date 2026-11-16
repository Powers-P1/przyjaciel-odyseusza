// IndexNow keys are intentionally public proof-of-host files, not account credentials.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const HOST = 'przyjacielodyseusza.pl';
const ROOT = `https://${HOST}/`;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export function createSubmission(config) {
  if (config.host !== HOST || !/^[a-f0-9]{32}$/.test(config.key)
    || !Array.isArray(config.urlList) || config.urlList.length !== 1 || config.urlList[0] !== ROOT) {
    throw new Error('IndexNow accepts only the configured canonical production page.');
  }
  return { host: HOST, key: config.key, keyLocation: `${ROOT}${config.key}.txt`, urlList: [...config.urlList] };
}

export async function submitIndexNow(config, { fetcher = fetch, expectedHtml, previous = null, now = new Date() } = {}) {
  const payload = createSubmission(config);
  if (typeof expectedHtml !== 'string' || !expectedHtml) throw new Error('A reviewed production artifact is required.');
  const getOptions = () => ({ redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: { 'User-Agent': 'PrzyjacielOdyseusza-IndexNow/1.0 (+https://przyjacielodyseusza.pl/)' } });
  const keyResponse = await fetcher(payload.keyLocation, getOptions());
  const keyText = await keyResponse.text();
  if (keyResponse.status !== 200 || !/^text\/plain\b/i.test(keyResponse.headers.get('content-type') || '')
    || keyText.trim() !== payload.key) throw new Error('The production IndexNow key file has not been verified.');
  const page = await fetcher(ROOT, getOptions());
  const html = await page.text();
  if (page.status !== 200 || !/^text\/html\b/i.test(page.headers.get('content-type') || '')
    || /noindex/i.test(page.headers.get('x-robots-tag') || '')
    || /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)
    || !html.includes(`<link rel="canonical" href="${ROOT}">`) || html !== expectedHtml) {
    throw new Error('The canonical production page does not match the reviewed indexable artifact.');
  }
  const pageSha256 = sha256(html);
  if (previous?.host === HOST && previous.key === payload.key && previous.pageSha256 === pageSha256
    && [200, 202].includes(previous.status)) {
    return { ...previous, checkedAt: now.toISOString(), unchanged: true, requestSent: false, liveKeyVerified: true, liveArtifactVerified: true };
  }
  // No automatic retry: a network error may follow a successfully received request.
  const response = await fetcher(INDEXNOW_ENDPOINT, { method: 'POST', redirect: 'error',
    signal: AbortSignal.timeout(20000), headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(payload) });
  await response.text();
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow did not accept the notification (HTTP ${response.status}).`);
  return { checkedAt: now.toISOString(), host: HOST, key: payload.key, keyLocation: payload.keyLocation,
    urls: payload.urlList, pageSha256, status: response.status,
    state: response.status === 200 ? 'accepted' : 'accepted_pending_key_validation',
    indexed: false, requestSent: true, liveKeyVerified: true, liveArtifactVerified: true,
    accountCreated: false, emailsSent: 0, additionalCostPln: 0 };
}

async function main() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--submit') continue;
    if (args[i] === '--receipt' && args[i + 1] && !args[i + 1].startsWith('--')) { i++; continue; }
    throw new Error('Usage: node tools/indexnow.mjs [--submit] [--receipt path]');
  }
  const config = JSON.parse(fs.readFileSync('config/indexnow.json', 'utf8'));
  const payload = createSubmission(config);
  if (fs.readFileSync(`public/${config.key}.txt`, 'utf8').trim() !== config.key) throw new Error('Local IndexNow key mismatch.');
  if (!args.includes('--submit')) {
    console.log(JSON.stringify({ mode: 'validate-only', payload, networkRequests: 0 }));
    return;
  }
  const receiptArg = args.indexOf('--receipt');
  if (receiptArg >= 0 && !args[receiptArg + 1]) throw new Error('Missing receipt path.');
  const receiptPath = path.resolve(receiptArg >= 0 ? args[receiptArg + 1] : '.tmp/indexnow-last-success.json');
  const previous = fs.existsSync(receiptPath) ? JSON.parse(fs.readFileSync(receiptPath, 'utf8')) : null;
  const result = await submitIndexNow(config, { expectedHtml: fs.readFileSync('dist-cf/index.html', 'utf8'), previous });
  fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
  fs.writeFileSync(receiptPath, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
