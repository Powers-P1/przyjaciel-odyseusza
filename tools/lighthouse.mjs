// Lighthouse (mobile + desktop) z progami wydania. Raporty trafiają do docs/lighthouse/.
// Użycie: node tools/lighthouse.mjs [url] [katalog-raportów]
//   domyślnie http://127.0.0.1:8788/ (uruchom wcześniej `npm run dev`) i docs/lighthouse/;
//   hosting testowy: npm run lighthouse:staging (raporty w docs/lighthouse/staging/)
import fs from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const url = process.argv[2] || process.env.LH_URL || 'http://127.0.0.1:8788/';
const outDir = path.resolve(process.argv[3] || process.env.LH_OUT || 'docs/lighthouse');
fs.mkdirSync(outDir, { recursive: true });

const THRESHOLDS = { performance: 0.9, accessibility: 0.95, 'best-practices': 0.95, seo: 0.95 };
const CWV = { lcp: 2500, cls: 0.1, tbt: 200 }; // lab: TBT jako proxy INP

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
let failed = false;
try {
  for (const preset of ['mobile', 'desktop']) {
    const options = { logLevel: 'error', output: ['html', 'json'], port: chrome.port, onlyCategories: Object.keys(THRESHOLDS) };
    const config = preset === 'desktop'
      ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } }
      : { extends: 'lighthouse:default' };
    const result = await lighthouse(url, options, config);
    const lhr = result.lhr;
    fs.writeFileSync(path.join(outDir, `lighthouse-${preset}.html`), result.report[0]);
    fs.writeFileSync(path.join(outDir, `lighthouse-${preset}.json`), result.report[1]);

    const scores = Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, v.score]));
    const lcp = lhr.audits['largest-contentful-paint'].numericValue;
    const cls = lhr.audits['cumulative-layout-shift'].numericValue;
    const tbt = lhr.audits['total-blocking-time'].numericValue;
    console.log(`\n[${preset}] ${url}`);
    for (const [k, min] of Object.entries(THRESHOLDS)) {
      const ok = scores[k] >= min;
      if (!ok) failed = true;
      console.log(`  ${ok ? 'OK ' : 'FAIL'} ${k}: ${Math.round(scores[k] * 100)} (próg ${min * 100})`);
    }
    const cwv = [[`LCP ${Math.round(lcp)} ms`, lcp <= CWV.lcp], [`CLS ${cls.toFixed(3)}`, cls <= CWV.cls], [`TBT ${Math.round(tbt)} ms`, tbt <= CWV.tbt]];
    for (const [label, ok] of cwv) { if (!ok) failed = true; console.log(`  ${ok ? 'OK ' : 'FAIL'} ${label}`); }
  }
} finally {
  try { await chrome.kill(); } catch (e) { /* Windows: EPERM przy sprzątaniu profilu tymczasowego, nie wpływa na wynik */ }
}
console.log(`\nRaporty: ${outDir}`);
if (failed) { console.error('\nLighthouse: progi wydania NIE zostały spełnione.'); process.exit(1); }
