// Test jednostkowy narzędzia typograficznego. Sprawdza przypadki, na których łatwo je zepsuć:
// znaczniki i atrybuty mają zostać nietknięte, bloki techniczne pominięte, a wynik ma nie zależeć
// od liczby uruchomień. Uruchamiany w `npm run validate`.
// Użycie: node tools/typografia.test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const przypadki = [
  {
    nazwa: 'dłuższe spójniki nie tworzą nierozrywalnych łańcuchów',
    wejscie: '<p>Rozmowa oraz praca nad decyzją i wyborem kierunku daje przestrzeń.</p>',
    zawiera: ['oraz praca nad decyzją i&nbsp;wyborem'],
    niezawiera: ['oraz&nbsp;', 'nad&nbsp;'],
  },
  {
    nazwa: 'encja w atrybucie zostaje nietknięta',
    wejscie: '<p>Zobacz <a href="/x?a=1&amp;b=2">ofertę</a> oraz opis.</p>',
    zawiera: ['href="/x?a=1&amp;b=2"'],
    niezawiera: ['', '', '', ''],
  },
  {
    nazwa: 'twarda spacja przechodzi przez znacznik inline',
    wejscie: '<p>Rozmawiamy o <a href="/oferta">współpracy</a> także online.</p>',
    zawiera: ['o&nbsp;<a'],
  },
  {
    nazwa: 'treść pola formularza i kodu zostaje bez zmian',
    wejscie: '<textarea>tekst w polu formularza</textarea><pre>kod w bloku</pre>',
    zawiera: ['<textarea>tekst w polu formularza</textarea>', '<pre>kod w bloku</pre>'],
  },
  {
    nazwa: 'deklaracja dokumentu nie jest traktowana jak tekst',
    wejscie: '<!DOCTYPE html>\n<p>Zwykłe zdanie o czymś.</p>',
    zawiera: ['<!DOCTYPE html>'],
  },
  {
    nazwa: 'wyrazów nie dzielimy – żadnych miękkich łączników w wyniku',
    wejscie: '<p>Odpowiedzialność za zespół i przewidywalność decyzji menedżerskich.</p>',
    niezawiera: ['&shy;', '­'],
  },
  {
    nazwa: 'adres e-mail nie jest dzielony ani wiązany w środku',
    wejscie: '<p>Napisz: bartek@przyjacielodyseusza.pl albo zadzwoń.</p>',
    zawiera: ['bartek@przyjacielodyseusza.pl'],
  },
  {
    nazwa: 'ostatni wyraz akapitu nie zostaje sam',
    wejscie: '<p>Małe, świadome kroki, nie gwałtowne zwroty.</p>',
    zawiera: ['gwałtowne&nbsp;zwroty.'],
  },
  {
    nazwa: 'nagłówek nie dostaje wiązania dwóch ostatnich wyrazów',
    wejscie: '<h2>Co mówią osoby, z którymi pracowałem</h2>',
    niezawiera: ['którymi&nbsp;pracowałem'],
  },
];

const katalog = fs.mkdtempSync(path.join(os.tmpdir(), 'typografia-'));
let bledy = 0;

for (const p of przypadki) {
  const plik = path.join(katalog, 'p.html');
  fs.writeFileSync(plik, p.wejscie);
  execFileSync(process.execPath, ['tools/typografia.mjs', plik], { stdio: 'pipe' });
  const raz = fs.readFileSync(plik, 'utf8');
  execFileSync(process.execPath, ['tools/typografia.mjs', plik], { stdio: 'pipe' });
  const dwa = fs.readFileSync(plik, 'utf8');

  const zarzuty = [];
  for (const oczekiwane of p.zawiera || []) if (!raz.includes(oczekiwane)) zarzuty.push(`brak: ${oczekiwane}`);
  for (const zakazane of p.niezawiera || []) if (raz.includes(zakazane)) zarzuty.push(`jest, a nie powinno: ${zakazane}`);
  if (raz !== dwa) zarzuty.push('drugie uruchomienie zmienia wynik (brak idempotentności)');

  if (zarzuty.length) {
    bledy += 1;
    console.error(`✗ ${p.nazwa}`);
    for (const z of zarzuty) console.error(`    ${z}`);
    console.error(`    wynik: ${raz}`);
  }
}

fs.rmSync(katalog, { recursive: true, force: true });
if (bledy) {
  console.error(`tools/typografia.mjs: ${bledy} z ${przypadki.length} przypadków nie przechodzi.`);
  process.exit(1);
}
console.log(`tools/typografia.mjs: ${przypadki.length} przypadków przechodzi.`);
