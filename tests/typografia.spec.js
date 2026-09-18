import { test, expect } from './_fixtures.js';

// Kontrola polskiego składu na realnie złamanych wierszach: zamiast sprawdzać źródło HTML,
// mierzymy w przeglądarce, gdzie faktycznie kończy się każdy wiersz przy danej szerokości okna.
// Wykrywa „sierotę”, czyli krótki wyraz (spójnik, przyimek) zostawiony na końcu wiersza,
// oraz „wdowę”, czyli ostatni wiersz akapitu złożony z jednego wyrazu.
// Naprawia to tools/nbsp.mjs (twarde spacje) i CSS `text-wrap: pretty`.

const SZEROKOSCI = [
  { name: 'telefon', width: 390, height: 844 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1600, height: 900 },
];

const STRONY = ['/', '/polityka-prywatnosci'];

// Selektor bloków tekstu ciągłego. Pomijamy nawigację i przyciski – tam wiersze są krótkie z założenia.
const BLOKI = 'main p, main li, main dt, main dd, main h1, main h2, main h3, main h4, footer p';

/** Zwraca wiersze każdego bloku tekstu tak, jak złamała je przeglądarka: [{ tag, klasa, wiersze: [[wyraz]] }]. */
const zmierzWiersze = (selektor) => {
  const bloki = [];
  for (const el of document.querySelectorAll(selektor)) {
    if (el.querySelector('p, li, ul, ol, dl, div, h1, h2, h3, h4')) continue; // tylko liście drzewa
    if (el.closest('nav, .btn, .site-nav')) continue;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const wiersze = [];
    let node;
    while ((node = walker.nextNode())) {
      const tekst = node.nodeValue;
      if (!tekst.trim()) continue;
      // wyraz = ciąg bez zwykłej spacji; twarda spacja ( ) celowo NIE dzieli wyrazów
      for (const m of tekst.matchAll(/[^ \t\n\r]+/g)) {
        const range = document.createRange();
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        const rect = range.getBoundingClientRect();
        if (!rect.width && !rect.height) continue;
        const ostatni = wiersze[wiersze.length - 1];
        if (ostatni && Math.abs(rect.top - ostatni.top) < 3) ostatni.wyrazy.push(m[0]);
        else wiersze.push({ top: rect.top, wyrazy: [m[0]] });
      }
    }
    if (wiersze.length) bloki.push({ tag: el.tagName.toLowerCase(), klasa: el.className, wiersze: wiersze.map((w) => w.wyrazy) });
  }
  return bloki;
};

// Wyrazy, które nie mogą kończyć wiersza – zgodne z listą w tools/nbsp.mjs.
const SPOJNIKI = new Set([
  'bez', 'dla', 'nad', 'pod', 'ani', 'lub', 'czy', 'gdy', 'aby', 'niż', 'zza',
  'przy', 'poza', 'oraz', 'albo', 'lecz', 'więc', 'żeby', 'obok',
  'przed', 'wśród', 'wobec', 'ponad', 'około', 'spośród', 'według', 'poprzez', 'między', 'pomiędzy',
]);

/** Czy wyraz zostawiony na końcu wiersza jest sierotą. Interpunkcję na końcu ignorujemy. */
function jestSierota(wyraz) {
  const goly = wyraz.replace(/[.,:;!?…)"”»]+$/u, '').replace(/^[("„«]+/u, '');
  if (!goly || / /.test(goly)) return false; // twarda spacja znaczy, że wyraz jest związany z następnym
  if (!/^\p{L}+$/u.test(goly)) return false; // liczby, adresy, symbole zostawiamy
  return goly.length <= 2 || SPOJNIKI.has(goly.toLowerCase());
}

test.describe('Polski skład tekstu', () => {
  for (const okno of SZEROKOSCI) {
    test(`bez sierot na końcach wierszy (${okno.name}, ${okno.width} px)`, async ({ page }) => {
      await page.setViewportSize({ width: okno.width, height: okno.height });
      const znalezione = [];
      for (const sciezka of STRONY) {
        await page.goto(sciezka);
        const bloki = await page.evaluate(zmierzWiersze, BLOKI);
        for (const blok of bloki) {
          // ostatni wiersz bloku nie ma czego „zostawiać”, więc go nie sprawdzamy
          for (const wiersz of blok.wiersze.slice(0, -1)) {
            const ostatni = wiersz[wiersz.length - 1];
            if (jestSierota(ostatni)) {
              znalezione.push(`${sciezka} ${blok.tag}.${blok.klasa || '–'}: …${wiersz.slice(-4).join(' ')} ⏎`);
            }
          }
        }
      }
      expect(znalezione, 'sieroty na końcach wierszy').toEqual([]);
    });
  }

  test('akapity nie kończą się wdową (jeden wyraz w ostatnim wierszu)', async ({ page, browserName }) => {
    // `text-wrap: pretty` działa dziś w silnikach Chromium; w pozostałych to kwestia długości tekstu,
    // więc twardo egzekwujemy tam, gdzie przeglądarka daje narzędzie.
    test.skip(browserName !== 'chromium', 'text-wrap: pretty tylko w Chromium');
    await page.setViewportSize({ width: 1280, height: 800 });
    const wdowy = [];
    for (const sciezka of STRONY) {
      await page.goto(sciezka);
      const bloki = await page.evaluate(zmierzWiersze, 'main p, main li');
      for (const blok of bloki) {
        if (blok.wiersze.length < 2) continue;
        const ostatni = blok.wiersze[blok.wiersze.length - 1];
        // adresu e-mail ani numeru telefonu nie da się skrócić redakcyjnie, więc nie są wdową
        if (ostatni.length === 1 && /^\p{L}[\p{L} -]*[.,;:!?…]?$/u.test(ostatni[0])) {
          wdowy.push(`${sciezka} ${blok.tag}.${blok.klasa || '–'}: ostatni wiersz „${ostatni[0]}”`);
        }
      }
    }
    expect(wdowy, 'akapity z jednym wyrazem w ostatnim wierszu').toEqual([]);
  });
});
