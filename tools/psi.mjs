// PageSpeed Insights (Lighthouse uruchamiany po stronie Google, z prawdziwego internetu) dla publicznego adresu.
// Uzupełnia lokalny Lighthouse: mierzy z infrastruktury Google, więc łapie problemy sieci/hostingu, których emulacja nie widzi.
// Bez klucza API działa z małym limitem zapytań; klucz można podać w PSI_API_KEY.
// Użycie: node tools/psi.mjs [url] [katalog-raportów]   (domyślnie adres testowy GitHub Pages i docs/lighthouse/staging/)
import fs from 'node:fs';
import path from 'node:path';

const url = process.argv[2] || 'https://powers-p1.github.io/przyjaciel-odyseusza/';
const outDir = path.resolve(process.argv[3] || 'docs/lighthouse/staging');
fs.mkdirSync(outDir, { recursive: true });
const THRESHOLDS = { performance: 0.9, accessibility: 0.95, 'best-practices': 0.95, seo: 0.95 };
let failed = false;

for (const strategy of ['mobile', 'desktop']) {
  const api = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  api.searchParams.set('url', url);
  api.searchParams.set('strategy', strategy);
  for (const c of Object.keys(THRESHOLDS)) api.searchParams.append('category', c);
  if (process.env.PSI_API_KEY) api.searchParams.set('key', process.env.PSI_API_KEY);
  const res = await fetch(api);
  if (!res.ok) { console.error(`[${strategy}] PSI ${res.status}: ${(await res.text()).slice(0, 300)}`); failed = true; continue; }
  const data = await res.json();
  fs.writeFileSync(path.join(outDir, `psi-${strategy}.json`), JSON.stringify(data, null, 2));
  const lhr = data.lighthouseResult;
  const a = lhr.audits;
  console.log(`\n[${strategy}] ${url}  (Lighthouse ${lhr.lighthouseVersion}, ${lhr.fetchTime})`);
  for (const [k, min] of Object.entries(THRESHOLDS)) {
    const score = lhr.categories[k]?.score ?? 0;
    const ok = score >= min;
    if (!ok) failed = true;
    console.log(`  ${ok ? 'OK ' : 'FAIL'} ${k}: ${Math.round(score * 100)} (próg ${min * 100})`);
  }
  const num = (id) => a[id]?.numericValue;
  console.log(`  LCP ${Math.round(num('largest-contentful-paint'))} ms, CLS ${num('cumulative-layout-shift')?.toFixed(3)}, TBT ${Math.round(num('total-blocking-time'))} ms, FCP ${Math.round(num('first-contentful-paint'))} ms, Speed Index ${Math.round(num('speed-index'))} ms`);
  const field = data.loadingExperience?.metrics;
  console.log(`  dane terenowe (CrUX): ${field ? Object.keys(field).join(', ') : 'brak (za mało ruchu)'}`);
}
console.log(`\nRaporty: ${outDir}`);
if (failed) { console.error('PSI: progi nie zostały spełnione albo zapytanie się nie powiodło.'); process.exit(1); }
