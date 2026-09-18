import { test, expect } from './_fixtures.js';

// Kontrola polskiego składu na realnie złamanych wierszach: zamiast sprawdzać źródło HTML,
// mierzymy w przeglądarce, gdzie faktycznie kończy się każdy wiersz przy danej szerokości okna.
//
// Skład powstaje w dwóch krokach. tools/typografia.mjs wstawia twarde spacje (to działa też bez
// JavaScriptu), a src/js/justowanie.js łamie akapity algorytmem Knutha–Plassa i justuje je,
// traktując twarde spacje jak materiał: obowiązkowych nie rusza, miękkie wolno mu złamać, gdy
// inaczej wyszedłby wiersz z „rzeką”. Stąd podział kontroli:
//   - sierota bezwzględna (wyraz jednoliterowy na końcu wiersza) – nigdy, na żadnej szerokości,
//   - sierota miękka (wyraz dwuliterowy albo dłuższy przyimek z listy) – poza akapitami justowanymi
//     nigdy (tam nikt twardej spacji nie łamie), w justowanych tylko wyjątkowo,
//   - strzępek (ostatni wiersz akapitu krótszy niż piąta część kolumny) – nigdy przy szerokościach,
//     przy których kolumna ma sensowną miarę,
//   - żaden wiersz złożony przez skrypt nie może zostać złamany po raz drugi przez przeglądarkę.
// Wyrazów nie dzielimy.

const SZEROKOSCI = [
  { name: 'telefon', width: 390, height: 844 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1600, height: 900 },
];

const STRONY = ['/', '/polityka-prywatnosci'];

// Selektor bloków tekstu ciągłego. Pomijamy nawigację i przyciski – tam wiersze są krótkie z założenia.
const BLOKI = 'main p, main li, main dt, main dd, main h1, main h2, main h3, main h4, footer p';

/** Zwraca wiersze każdego bloku tekstu tak, jak złamała je przeglądarka. */
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
      // wyraz = ciąg bez zwykłej spacji; twarda spacja ( ) celowo NIE dzieli wyrazów
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
    if (wiersze.length) {
      bloki.push({
        tag: el.tagName.toLowerCase(),
        klasa: el.className,
        justowany: el.classList.contains('jest-justowany'),
        wiersze: wiersze.map((w) => w.wyrazy),
      });
    }
  }
  return bloki;
};

// Przyimki i spójniki trzy- i więcejliterowe wiązane przez tools/typografia.mjs.
const SPOJNIKI = new Set([
  'bez', 'dla', 'nad', 'pod', 'ani', 'lub', 'czy', 'gdy', 'aby', 'niż', 'zza',
  'przy', 'poza', 'oraz', 'albo', 'lecz', 'więc', 'żeby', 'obok',
  'przed', 'wśród', 'wobec', 'ponad', 'około', 'spośród', 'według', 'poprzez', 'między', 'pomiędzy',
]);

/** Zdejmuje interpunkcję; zwraca '' dla wszystkiego, co nie jest wyrazem (liczby, adresy, symbole). */
function golyWyraz(wyraz) {
  if (/\u00a0/.test(wyraz)) return ''; // twarda spacja znaczy, że wyraz jest związany z następnym
  const goly = wyraz.replace(/[.,:;!?…)"”»]+$/u, '').replace(/^[("„«]+/u, '');
  return /^\p{L}+$/u.test(goly) ? goly : '';
}

// Ile miękkich sierot wolno algorytmowi zostawić na stronę i szerokość. To bariera przed regresją,
// nie cel: zmierzone 5–8 przy czterech szerokościach, a gdyby wiązanie przestało działać w ogóle,
// liczba skacze do kilkudziesięciu.
const BUDZET_MIEKKICH = 15;

test.describe('Polski skład tekstu', () => {
  for (const okno of SZEROKOSCI) {
    test(`bez sierot na końcach wierszy (${okno.name}, ${okno.width} px)`, async ({ page }) => {
      await page.setViewportSize({ width: okno.width, height: okno.height });
      const bezwzgledne = [];
      const miekkiePoza = [];
      let miekkieWJustowanych = 0;
      for (const sciezka of STRONY) {
        await page.goto(sciezka);
        const bloki = await page.evaluate(zmierzWiersze, BLOKI);
        for (const blok of bloki) {
          // ostatni wiersz bloku nie ma czego „zostawiać”, więc go nie sprawdzamy
          for (const wiersz of blok.wiersze.slice(0, -1)) {
            const goly = golyWyraz(wiersz[wiersz.length - 1]);
            if (!goly) continue;
            const opis = `${sciezka} ${blok.tag}.${blok.klasa || '–'}: …${wiersz.slice(-4).join(' ')} ⏎`;
            if (goly.length === 1) bezwzgledne.push(opis);
            else if (goly.length === 2 || SPOJNIKI.has(goly.toLowerCase())) {
              if (blok.justowany) miekkieWJustowanych += 1;
              else miekkiePoza.push(opis);
            }
          }
        }
      }
      expect(bezwzgledne, 'wyraz jednoliterowy na końcu wiersza').toEqual([]);
      expect(miekkiePoza, 'krótki wyraz na końcu wiersza poza akapitem justowanym').toEqual([]);
      expect(miekkieWJustowanych, 'ustępstwa algorytmu łamania').toBeLessThanOrEqual(BUDZET_MIEKKICH);
    });
  }

  test('wierszy złożonych przez skrypt przeglądarka nie łamie po raz drugi', async ({ page }) => {
    // Każdy wiersz jest osobnym blokiem, więc gdy wyjdzie szerszy od kolumny, przeglądarka łamie go
    // jeszcze raz – i wtedy przestają obowiązywać wszystkie reguły powyżej (na końcu takiego wiersza
    // ląduje wyraz, którego twarda spacja miała tam nie wpuścić). Zdarzało się to, gdy skrypt liczył
    // szerokość ramki zamiast pola tekstu albo dopychał wiersz trackingiem dokładnie do krawędzi.
    for (const okno of SZEROKOSCI) {
      await page.setViewportSize({ width: okno.width, height: okno.height });
      for (const sciezka of STRONY) {
        await page.goto(sciezka);
        await page.waitForFunction(() => document.querySelectorAll('.jest-justowany').length > 0, null, { timeout: 5000 });
        const przelamane = await page.evaluate(() => {
          const zle = [];
          for (const wiersz of document.querySelectorAll('.wiersz')) {
            const wysokoscWiersza = parseFloat(getComputedStyle(wiersz).lineHeight);
            if (!wysokoscWiersza) continue;
            if (wiersz.getBoundingClientRect().height > wysokoscWiersza * 1.4) {
              zle.push(wiersz.textContent.replace(/\s+/g, ' ').slice(0, 60));
            }
          }
          return zle;
        });
        expect(przelamane, `${sciezka} @ ${okno.width} px: wiersze złamane po raz drugi`).toEqual([]);
      }
    }
  });

  // Granice odstępu zależą od miary kolumny, bo od niej zależy, ile luzu w ogóle da się rozłożyć.
  // Zmierzone na trzech wersjach strony i w trzech silnikach: mediana 1,13–1,42, wiersz skrajny
  // 4,4–6,7 na telefonie i 1,6–3,5 na laptopie (krótsza treść wersji B i C ma wyższą medianę, bo
  // ma mniej długich akapitów, w których łamanie ma co optymalizować). Na telefonie kolumna liczy
  // ok. 44 znaki i jeden długi wyraz („odpowiedzialność”) zostawia w wierszu 120 px luzu – bez
  // dzielenia wyrazów nic lepszego tam nie istnieje. Progi są barierą przed regresją, nie celem;
  // zachłanne justowanie przeglądarki daje w tych samych miejscach 2,0–3,0 i 9,8–14,5.
  const JUSTOWANIE = [
    { okno: SZEROKOSCI[0], mediana: 1.9, max: 7.5 },
    { okno: SZEROKOSCI[2], mediana: 1.7, max: 4.5 },
  ];
  for (const { okno, mediana: granicaMediany, max: granicaMaksimum } of JUSTOWANIE) {
    test(`tekst ciągły jest justowany, a odstępy pozostają równe (${okno.name})`, async ({ page }) => {
      // src/js/justowanie.js łamie wiersze algorytmem Knutha–Plassa i opakowuje każdy w blok.
      // Sprawdzamy trzy rzeczy: że justowanie objęło wszystkie akapity wielowierszowe, że typowy
      // odstęp jest bliski naturalnemu i że żaden wiersz nie rozjeżdża się ponad przyjętą granicę.
      await page.setViewportSize({ width: okno.width, height: okno.height });
      await page.goto('/');
      await page.waitForFunction(() => document.querySelectorAll('.jest-justowany').length > 0, null, { timeout: 5000 });
      const wynik = await page.evaluate(() => {
        const spacjaKroju = (el) => {
          const cs = getComputedStyle(el);
          const s = document.createElement('span');
          s.setAttribute('style', `position:absolute;visibility:hidden;white-space:pre;word-spacing:normal;font:${cs.font}`);
          document.body.appendChild(s);
          s.textContent = 'aaaaa aaaaa';
          const a = s.getBoundingClientRect().width;
          s.textContent = 'aaaaaaaaaa';
          const b = s.getBoundingClientRect().width;
          s.remove();
          return a - b;
        };
        const odstepy = [];
        for (const blok of document.querySelectorAll('.jest-justowany')) {
          const sp = spacjaKroju(blok);
          if (sp <= 0) continue;
          for (const wiersz of blok.querySelectorAll('.wiersz:not(.wiersz--ostatni)')) {
            const walker = document.createTreeWalker(wiersz, NodeFilter.SHOW_TEXT);
            const rects = [];
            let node;
            while ((node = walker.nextNode())) {
              const t = node.nodeValue;
              if (!t.trim()) continue;
              for (const m of t.matchAll(/\S+/g)) {
                const r = document.createRange();
                r.setStart(node, m.index);
                r.setEnd(node, m.index + m[0].length);
                const b = r.getBoundingClientRect();
                if (b.width > 0.5) rects.push(b);
              }
            }
            for (let i = 0; i < rects.length - 1; i++) {
              const d = rects[i + 1].left - rects[i].right;
              if (d > 0.5 && d < 200) odstepy.push(d / sp);
            }
          }
        }
        // akapity wielowierszowe, których justowanie nie objęło
        const kandydaci = document.querySelectorAll('.hero__lead, .section-intro, .situation__desc, .mode p, .card p, .step p, .principle p, .origin p, .contact__copy p');
        let pominiete = 0;
        for (const el of kandydaci) {
          if (el.querySelector('.wiersz')) continue;
          if (el.getBoundingClientRect().height > parseFloat(getComputedStyle(el).lineHeight) * 1.4) pominiete += 1;
        }
        odstepy.sort((a, b) => a - b);
        return {
          pominiete,
          wierszy: odstepy.length,
          mediana: odstepy.length ? odstepy[Math.floor(odstepy.length / 2)] : 0,
          max: odstepy.length ? odstepy[odstepy.length - 1] : 0,
        };
      });
      expect(wynik.wierszy, 'justowanie nie objęło żadnego wiersza').toBeGreaterThan(10);
      expect(wynik.pominiete, 'akapity wielowierszowe bez justowania').toBe(0);
      // Dla porównania: zachłanne justowanie przeglądarki dawało tu medianę 2,0–3,0
      // i wiersze skrajne 9,8–14,5 (tools/pomiar-skladu.mjs).
      expect(wynik.mediana, 'typowy odstęp między wyrazami').toBeLessThan(granicaMediany);
      expect(wynik.max, 'skrajnie rozstrzelony odstęp między wyrazami').toBeLessThan(granicaMaksimum);
    });
  }

  test('ostatni wiersz akapitu nie jest strzępkiem', async ({ page, browserName }) => {
    // Kryterium jest szerokościowe, nie „liczba wyrazów”: ostatni wiersz ma zajmować co najmniej
    // piątą część kolumny. Tak samo liczy to src/js/justowanie.js (OSTATNI_MIN), więc test sprawdza
    // tę samą regułę, którą optymalizuje algorytm. Jeden długi wyraz na końcu („marketingowych.”)
    // wypełnia ponad 20% wiersza i czyta się dobrze; strzępek w rodzaju „etapie.” – nie.
    // W akapitach justowanych pilnuje tego kara za wdowę, w pozostałych `text-wrap: pretty`,
    // które działa dziś w silnikach Chromium – stąd pominięcie reszty.
    test.skip(browserName !== 'chromium', 'text-wrap: pretty tylko w Chromium');
    const UDZIAL_MIN = 0.2;
    // Bez telefonu: przy kolumnie ok. 40 znaków wyrzucenie wyrazu do ostatniego wiersza rozstrzeliwuje
    // wiersz wcześniejszy bardziej, niż zyskuje ostatni – algorytm liczy ten bilans (KARA_WDOWY
    // w src/js/justowanie.js) i czasem wybiera krótki koniec. To świadomy wybór, nie regresja.
    for (const okno of [SZEROKOSCI[2], SZEROKOSCI[3]]) {
      await page.setViewportSize({ width: okno.width, height: okno.height });
      const strzepki = [];
      for (const sciezka of STRONY) {
        await page.goto(sciezka);
        await page.waitForFunction(() => document.querySelectorAll('.jest-justowany').length > 0, null, { timeout: 5000 });
        const znalezione = await page.evaluate((udzial) => {
          const zle = [];
          for (const el of document.querySelectorAll('main p, main li')) {
            if (el.querySelector('p, li, ul, ol, dl, div')) continue;
            if (el.closest('nav, .btn, .site-nav')) continue;
            const styl = getComputedStyle(el);
            const kolumna = el.getBoundingClientRect().width
              - parseFloat(styl.paddingLeft) - parseFloat(styl.paddingRight);
            const wysokoscWiersza = parseFloat(styl.lineHeight);
            if (!wysokoscWiersza || el.getBoundingClientRect().height < wysokoscWiersza * 1.4) continue;
            // ostatni wiersz: wyrazy o największym `top`
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let node;
            const wyrazy = [];
            while ((node = walker.nextNode())) {
              const t = node.nodeValue;
              if (!t.trim()) continue;
              for (const m of t.matchAll(/\S+/g)) {
                const r = document.createRange();
                r.setStart(node, m.index);
                r.setEnd(node, m.index + m[0].length);
                const b = r.getBoundingClientRect();
                if (b.width > 0.5) wyrazy.push(b);
              }
            }
            if (!wyrazy.length) continue;
            const dol = Math.max(...wyrazy.map((b) => b.top));
            const ostatni = wyrazy.filter((b) => Math.abs(b.top - dol) < 3);
            const szerokoscOstatniego = ostatni[ostatni.length - 1].right - ostatni[0].left;
            if (szerokoscOstatniego < udzial * kolumna) {
              zle.push(`${el.tagName.toLowerCase()}.${el.className || '–'}: „${el.textContent.trim().slice(-40)}” `
                + `(${Math.round(szerokoscOstatniego)} z ${Math.round(kolumna)} px)`);
            }
          }
          return zle;
        }, UDZIAL_MIN);
        strzepki.push(...znalezione.map((x) => `${sciezka} ${x}`));
      }
      expect(strzepki, `strzępki w ostatnich wierszach (${okno.name})`).toEqual([]);
    }
  });
});
