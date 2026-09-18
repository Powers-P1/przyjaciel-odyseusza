// Mierzy skład tekstu na działającej stronie: odstępy między wyrazami (w krotnościach zwykłej
// spacji tego kroju) i wypełnienie wierszy. Liczby z tego narzędzia stoją w REVIEW.md, sekcja 4e.
//
// Porównuje trzy warianty tej samej strony:
//   - chorągiewka        – tak wygląda strona bez JavaScriptu,
//   - zachłanne justowanie – samo `text-align: justify`, czyli to, co potrafi przeglądarka,
//   - wdrożone            – łamanie Knutha–Plassa z mikrotypografią (src/js/justowanie.js).
//
// Użycie: uruchom serwer (`npm run dev`) i `node tools/pomiar-skladu.mjs [adres]`.
import { chromium } from '@playwright/test';

const adres = process.argv[2] || 'http://127.0.0.1:8788/';
const SZEROKOSCI = [390, 834, 1280, 1600, 2560];
// te same bloki, które justuje src/js/justowanie.js
const BLOKI = '.hero__lead, .section-intro, .situation__desc, .about__private, .mode p, .card p,'
  + ' .step p, .principle p, .origin p, .contact__copy p, .about__copy > p, .prose p';

/** Mierzy w przeglądarce: odstępy między wyrazami i wypełnienie wierszy rozciąganych. */
const zmierz = (SEL) => {
  // naturalna szerokość spacji w kroju bloku – punkt odniesienia dla wszystkich odstępów
  const spacjaKroju = (el) => {
    const cs = getComputedStyle(el);
    const s = document.createElement('span');
    s.setAttribute('style', `position:absolute;visibility:hidden;white-space:pre;word-spacing:normal;font:${cs.font}`);
    document.body.appendChild(s);
    s.textContent = 'aaaaa aaaaa';
    const zeSpacja = s.getBoundingClientRect().width;
    s.textContent = 'aaaaaaaaaa';
    const bezSpacji = s.getBoundingClientRect().width;
    s.remove();
    return zeSpacja - bezSpacji;
  };

  const odstepy = [];
  const wypelnienia = [];
  for (const blok of document.querySelectorAll(SEL)) {
    const spacja = spacjaKroju(blok);
    if (spacja <= 0) continue;
    const styl = getComputedStyle(blok);
    const kolumna = blok.getBoundingClientRect().width
      - parseFloat(styl.paddingLeft) - parseFloat(styl.paddingRight);

    const walker = document.createTreeWalker(blok, NodeFilter.SHOW_TEXT);
    const prostokaty = [];
    let node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim()) continue;
      for (const m of node.nodeValue.matchAll(/\S+/g)) {
        const zakres = document.createRange();
        zakres.setStart(node, m.index);
        zakres.setEnd(node, m.index + m[0].length);
        const r = zakres.getBoundingClientRect();
        if (r.width > 0.5) prostokaty.push(r);
      }
    }
    // grupujemy po wierszach realnie złamanych przez przeglądarkę
    const wiersze = [];
    for (const r of prostokaty) {
      const ostatni = wiersze[wiersze.length - 1];
      if (ostatni && Math.abs(r.top - ostatni[0].top) < 3) ostatni.push(r);
      else wiersze.push([r]);
    }
    wiersze.forEach((wiersz, i) => {
      if (i === wiersze.length - 1) return; // ostatniego wiersza akapitu nikt nie rozciąga
      wypelnienia.push((wiersz[wiersz.length - 1].right - wiersz[0].left) / kolumna);
      for (let k = 0; k < wiersz.length - 1; k++) {
        const d = wiersz[k + 1].left - wiersz[k].right;
        if (d > 0.5 && d < 200) odstepy.push(d / spacja);
      }
    });
  }
  const kwantyl = (tab, q) => (tab.length
    ? tab.slice().sort((a, b) => a - b)[Math.min(tab.length - 1, Math.floor(q * tab.length))]
    : 0);
  return {
    mediana: kwantyl(odstepy, 0.5),
    p95: kwantyl(odstepy, 0.95),
    max: kwantyl(odstepy, 1),
    wypelnienie: wypelnienia.reduce((a, b) => a + b, 0) / (wypelnienia.length || 1),
  };
};

const WARIANTY = [
  { nazwa: 'chorągiewka (bez JavaScriptu)', js: false },
  { nazwa: 'zachłanne justowanie przeglądarki', js: true, zachlanne: true },
  { nazwa: 'wdrożone (Knuth–Plass + mikrotypografia)', js: true },
];

const liczba = (x) => x.toFixed(2).replace('.', ',');
const browser = await chromium.launch();
try {
  for (const wariant of WARIANTY) {
    console.log(`\n### ${wariant.nazwa}`);
    console.log('| szerokość okna | mediana | 95. percentyl | maksimum | wypełnienie wiersza |');
    console.log('| --- | --- | --- | --- | --- |');
    for (const szerokosc of SZEROKOSCI) {
      const kontekst = await browser.newContext({
        viewport: { width: szerokosc, height: 900 },
        javaScriptEnabled: wariant.js,
      });
      const strona = await kontekst.newPage();
      // wariant zachłanny: skrypt blokujemy żądaniem, a nie wyłączeniem JS – addStyleTag potrzebuje JS
      if (wariant.zachlanne) await strona.route('**/assets/js/main.js*', (r) => r.abort());
      await strona.goto(adres, { waitUntil: 'networkidle' });
      if (wariant.zachlanne) await strona.addStyleTag({ content: `${BLOKI} { text-align: justify }` });
      else if (wariant.js) {
        await strona.waitForFunction(() => document.querySelectorAll('.jest-justowany').length > 0, null, { timeout: 10_000 });
      }
      await strona.waitForTimeout(300);
      const w = await strona.evaluate(zmierz, BLOKI);
      console.log(`| ${szerokosc} px | ${liczba(w.mediana)} | ${liczba(w.p95)} | ${liczba(w.max)} `
        + `| ${(w.wypelnienie * 100).toFixed(1).replace('.', ',')}% |`);
      await kontekst.close();
    }
  }
} finally {
  await browser.close();
}
