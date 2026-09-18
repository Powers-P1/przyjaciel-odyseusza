// Minifikacja CSS i JS: src/ → public/assets/. Uruchom po każdej zmianie w src/: `npm run build`.
// Publikowany jest folder public/ (zminifikowane pliki są commitowane, Cloudflare Pages nie potrzebuje builda).
import fs from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';

const jobs = [
  // Arkusz trafia wyłącznie do <style> w HTML, więc plik pośredni nie ma czego szukać w public/.
  { from: 'src/css/style.css', to: '.build/style.css', loader: 'css' },
  { from: 'src/js/main.js', to: 'public/assets/js/main.js', loader: 'js' },
];

for (const job of jobs) {
  const source = fs.readFileSync(job.from, 'utf8');
  const result = await esbuild.transform(source, {
    loader: job.loader,
    minify: true,
    target: ['es2017', 'chrome90', 'firefox90', 'safari14'],
    charset: 'utf8',
    legalComments: 'none',
  });
  fs.mkdirSync(path.dirname(job.to), { recursive: true });
  fs.writeFileSync(job.to, result.code);
  console.log(`${job.from} → ${job.to}  ${source.length} → ${result.code.length} B`);
}

// Krytyczny CSS inline: one-pager, więc cały (zminifikowany) arkusz trafia do <style> w HTML.
// Usuwa blokujące renderowanie żądanie CSS (na wolnym 4G to ok. 1 RTT + transfer przed pierwszym malowaniem).
// CSP pozostaje ścisłe: do style-src dopisujemy hash SHA-256 wstawionego bloku (bez 'unsafe-inline').
const { createHash } = await import('node:crypto');
const css = fs.readFileSync('.build/style.css', 'utf8');
const cspHash = `'sha256-${createHash('sha256').update(css, 'utf8').digest('base64')}'`;
const styleTag = `<style data-inline="style.css">${css}</style>`;
const PAGES = ['public/index.html', 'public/polityka-prywatnosci.html', 'public/404.html'];
for (const page of PAGES) {
  let html = fs.readFileSync(page, 'utf8');
  const link = '<link rel="stylesheet" href="/assets/css/style.css">';
  if (html.includes(link)) html = html.replace(link, styleTag);
  else html = html.replace(/<style data-inline="style\.css">[\s\S]*?<\/style>/, () => styleTag);
  fs.writeFileSync(page, html);
}
let headers = fs.readFileSync('public/_headers', 'utf8');
headers = headers.replace(/style-src 'self'(?: 'sha256-[^']+')?;/, `style-src 'self' ${cspHash};`);
fs.writeFileSync('public/_headers', headers);
console.log(`CSS inline w ${PAGES.length} stronach, CSP style-src ${cspHash.slice(0, 24)}…`);

// Polski skład tekstu: twarde spacje i miękkie łączniki (tools/typografia.mjs).
// Narzędzie zawsze zaczyna od czystego tekstu, więc wynik nie zależy od liczby uruchomień.
const { execFileSync } = await import('node:child_process');
execFileSync(process.execPath, ['tools/typografia.mjs', ...PAGES], { stdio: 'inherit' });
