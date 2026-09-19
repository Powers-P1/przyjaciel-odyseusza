// Hashe CSP muszą odpowiadać dokładnym bajtom CSS i inicjalizatora JS inline.
// Rozdzielamy dyrektywy: pierwszy hash w nagłówku nie musi już należeć do CSS.
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const PAGES = ['public/index.html', 'public/polityka-prywatnosci.html', 'public/404.html'];
const BLOCKS = [
  { name: 'style.css', directive: 'style-src', pattern: /<style data-inline="style\.css">([\s\S]*?)<\/style>/g },
  { name: 'init.js', directive: 'script-src', pattern: /<script data-inline="init\.js">([\s\S]*?)<\/script>/g },
];
const headers = fs.readFileSync('public/_headers', 'utf8');
const policy = headers.match(/^\s*Content-Security-Policy:\s*(.+)$/m)?.[1];
if (!policy) throw new Error('public/_headers: brak Content-Security-Policy.');

const errors = [];
for (const page of PAGES) {
  const html = fs.readFileSync(page, 'utf8');
  const positions = {};
  for (const block of BLOCKS) {
    const directive = policy.split(';').map(value => value.trim()).find(value => value.startsWith(block.directive + ' '));
    const hashes = [...(directive || '').matchAll(/'(sha256-[A-Za-z0-9+/=]+)'/g)].map(match => match[1]);
    const matches = [...html.matchAll(block.pattern)];
    if (hashes.length !== 1) errors.push(`${block.directive}: oczekiwano dokładnie jednego hasha.`);
    if (directive?.includes("'unsafe-inline'")) errors.push(`${block.directive}: niedozwolone unsafe-inline.`);
    if (matches.length !== 1) {
      errors.push(`${page}: oczekiwano jednego bloku ${block.name}, znaleziono ${matches.length}.`);
      continue;
    }
    positions[block.name] = matches[0].index;
    const hash = 'sha256-' + createHash('sha256').update(matches[0][1], 'utf8').digest('base64');
    if (hash !== hashes[0]) errors.push(`${page}: hash ${block.name} nie odpowiada ${block.directive}.`);
  }
  if (!(positions['init.js'] < positions['style.css'])) errors.push(`${page}: init musi poprzedzać CSS.`);
}
if (errors.length) {
  console.error('Niezgodność CSP/HTML — uruchom npm run build:\n' + errors.map(error => '  ' + error).join('\n'));
  process.exit(1);
}
console.log(`CSP: dokładne hashe CSS i JS zgodne w ${PAGES.length} stronach; init przed CSS.`);
