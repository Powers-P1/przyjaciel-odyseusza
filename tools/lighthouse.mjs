// Lighthouse (mobile + desktop) z progami wydania. Raporty trafiają do docs/lighthouse/.
// Użycie: node tools/lighthouse.mjs [url] [katalog-raportów]
//   domyślnie http://127.0.0.1:8788/ (uruchom wcześniej `npm run dev`) i docs/lighthouse/;
//   hosting testowy: npm run lighthouse:staging (raporty w docs/lighthouse/staging/)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { summarizeRuns } from './lighthouse-metrics.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const url = args[0] || process.env.LH_URL || 'http://127.0.0.1:8788/';
const outDir = path.resolve(args[1] || process.env.LH_OUT || 'docs/lighthouse');
// hosting testowy ma celowo noindex: audyt SEO „is-crawlable” obniża wynik kategorii, choć strona jest poprawna
const ALLOW_NOINDEX = process.argv.includes('--allow-noindex');
fs.mkdirSync(outDir, { recursive: true });

const THRESHOLDS = { performance: 0.9, accessibility: 0.95, 'best-practices': 0.95, seo: 0.95 };
const CWV = { lcp: 2500, cls: 0.1, tbt: 200 }; // Budżet laboratoryjny; TBT nie jest pomiarem terenowego INP.
// Współdzielone runnery CI (2 vCPU) dają pojedyncze przebiegi z losowo długimi zadaniami głównego wątku (TBT),
// dlatego w CI liczymy medianę z kilku przebiegów (LH_RUNS=3), jak zaleca zespół Lighthouse.
const RUNS = Math.max(1, Number(process.env.LH_RUNS) || 1);

// Własny profil zapobiega asynchronicznemu EPERM w destroyTmp chrome-launcher na Windows.
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'odyseusz-lighthouse-'));
const chrome = await chromeLauncher.launch({ userDataDir: profileDir, chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] });
let failed = false;
try {
  for (const preset of ['mobile', 'desktop']) {
    const options = { logLevel: 'error', output: ['html', 'json'], port: chrome.port, onlyCategories: Object.keys(THRESHOLDS) };
    const config = preset === 'desktop'
      ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } }
      : { extends: 'lighthouse:default' };
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const r = await lighthouse(url, options, config);
      runs.push(r);
      fs.writeFileSync(path.join(outDir, `lighthouse-${preset}-run-${i+1}.json`), r.report[1]);
      if (RUNS > 1) console.log(`[${preset}] przebieg ${i + 1}/${RUNS}: performance ${Math.round(r.lhr.categories.performance.score * 100)}, TBT ${Math.round(r.lhr.audits['total-blocking-time'].numericValue)} ms, LCP ${Math.round(r.lhr.audits['largest-contentful-paint'].numericValue)} ms`);
    }
    // Representative HTML report; the gate below uses each metric's actual median.
    runs.sort((a, b) => (a.lhr.categories.performance.score - b.lhr.categories.performance.score) || (b.lhr.audits['total-blocking-time'].numericValue - a.lhr.audits['total-blocking-time'].numericValue));
    const result = runs[Math.floor(runs.length / 2)];
    const lhr = result.lhr;
    fs.writeFileSync(path.join(outDir, `lighthouse-${preset}.html`), result.report[0]);
    fs.writeFileSync(path.join(outDir, `lighthouse-${preset}.json`), result.report[1]);

    const { scores, lcp, cls, tbt } = summarizeRuns(runs.map(run => run.lhr));
    fs.writeFileSync(path.join(outDir, `lighthouse-${preset}-summary.json`), JSON.stringify({url,runs:RUNS,scores,lcp,cls,tbt},null,2));
    console.log(`\n[${preset}] ${url} — mediana metryk z ${RUNS} przebiegów`);
    for (const [k, min] of Object.entries(THRESHOLDS)) {
      let ok = scores[k] >= min;
      let note = '';
      if (!ok && k === 'seo' && ALLOW_NOINDEX) {
        const failing = lhr.categories.seo.auditRefs.filter((r) => lhr.audits[r.id].score !== null && lhr.audits[r.id].score < 1).map((r) => r.id);
        if (failing.length === 1 && failing[0] === 'is-crawlable') { ok = true; note = ' – jedyny nieudany audyt to noindex (celowy na hostingu testowym)'; }
      }
      if (!ok) failed = true;
      console.log(`  ${ok ? 'OK ' : 'FAIL'} ${k}: ${Math.round(scores[k] * 100)} (próg ${min * 100})${note}`);
    }
    const cwv = [[`LCP ${Math.round(lcp)} ms`, lcp <= CWV.lcp], [`CLS ${cls.toFixed(3)}`, cls <= CWV.cls], [`TBT ${Math.round(tbt)} ms`, tbt <= CWV.tbt]];
    for (const [label, ok] of cwv) { if (!ok) failed = true; console.log(`  ${ok ? 'OK ' : 'FAIL'} ${label}`); }
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `### Lighthouse ${preset}\n\n${RUNS} runs; median Performance ${Math.round(scores.performance*100)}, LCP ${Math.round(lcp)} ms, CLS ${cls.toFixed(3)}, lab TBT ${Math.round(tbt)} ms. Not field INP.\n\n`);
  }
} finally {
  try { await chrome.kill(); } catch (e) { /* Windows: EPERM przy sprzątaniu profilu tymczasowego, nie wpływa na wynik */ }
  if (path.dirname(profileDir) !== path.resolve(os.tmpdir()) || !path.basename(profileDir).startsWith('odyseusz-lighthouse-')) {
    throw new Error('Odmowa usunięcia profilu poza katalogiem tymczasowym zadania');
  }
  fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
}
console.log(`\nRaporty: ${outDir}`);
if (failed) { console.error('\nLighthouse: progi wydania NIE zostały spełnione.'); process.exit(1); }
