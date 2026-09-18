// Kontrola spójności CSP: hash w public/_headers musi odpowiadać blokowi <style> wstawionemu
// w każdej stronie. Rozjazd jest groźny, bo nie widać go lokalnie (emulacja i GitHub Pages nie
// stosują _headers), a na produkcji przeglądarka zablokuje arkusz i strona pokaże się bez stylów.
// Zdarza się, gdy ktoś zmieni src/css/style.css i zapomni uruchomić `npm run build`.
// Użycie: node tools/csp-hash.mjs
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const STRONY = ['public/index.html', 'public/polityka-prywatnosci.html', 'public/404.html'];
const BLOK = /<style data-inline="style\.css">([\s\S]*?)<\/style>/;

const naglowki = fs.readFileSync('public/_headers', 'utf8');
const wNaglowkach = naglowki.match(/'(sha256-[A-Za-z0-9+/=]+)'/);
if (!wNaglowkach) {
  console.error('public/_headers: brak hasha sha256 w dyrektywie style-src.');
  process.exit(1);
}

const bledy = [];
for (const strona of STRONY) {
  const dopasowanie = fs.readFileSync(strona, 'utf8').match(BLOK);
  if (!dopasowanie) {
    bledy.push(`${strona}: brak bloku <style data-inline="style.css">`);
    continue;
  }
  const hash = `sha256-${createHash('sha256').update(dopasowanie[1], 'utf8').digest('base64')}`;
  if (hash !== wNaglowkach[1]) bledy.push(`${strona}: ${hash} ≠ ${wNaglowkach[1]} z _headers`);
}

if (bledy.length) {
  console.error('Hash CSP nie zgadza się ze wstawionym arkuszem — uruchom `npm run build`:');
  for (const blad of bledy) console.error(`  ${blad}`);
  process.exit(1);
}
console.log(`CSP: hash ${wNaglowkach[1].slice(0, 24)}… zgodny w ${STRONY.length} stronach.`);
