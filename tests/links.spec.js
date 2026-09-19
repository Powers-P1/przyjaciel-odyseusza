import { test, expect, STAGING, PAGES_404, tekstWidoczny } from './_fixtures.js';

// Cloudflare Pages normalizuje adresy: /strona.html → 308 → /strona, dlatego linki są bez rozszerzenia.
const PAGES = ['/', '/polityka-prywatnosci', ...PAGES_404];

test.describe('Linki i zasoby', () => {
  test('wszystkie linki wewnętrzne działają i nie przechodzą przez przekierowania', async ({ page, request }) => {
    const checked = new Map();
    for (const path of PAGES) {
      await page.goto(path);
      const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      for (const href of hrefs) {
        if (/^(mailto:|tel:|#|https?:\/\/(?!127\.0\.0\.1))/.test(href)) continue;
        const [target, hash] = href.split('#');
        const url = target || path;
        if (!checked.has(url)) {
          const r = await request.get(url, { maxRedirects: 0 });
          checked.set(url, r.status());
        }
        expect(checked.get(url), `${href} na ${path}`).toBe(url === '/nie-istnieje-404' ? 404 : 200);
        if (hash) {
          await page.goto(url);
          await expect(page.locator(`#${hash}`), `brak #${hash} na ${url}`).toHaveCount(1);
          await page.goto(path);
        }
      }
    }
  });

  test('wszystkie obrazy, style, skrypty i fonty ładują się poprawnie', async ({ page }) => {
    const failed = [];
    // dokument strony 404 ma zwracać 404; sprawdzamy tylko zasoby (obrazy, css, js, fonty)
    page.on('response', (r) => { if (r.status() >= 400 && r.request().resourceType() !== 'document') failed.push(`${r.status()} ${r.url()}`); });
    for (const path of PAGES) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        // obrazy lazy poza widokiem WebKit potrafi nigdy nie pobrać (brak load/error): wymuszamy pobranie i ograniczamy czekanie
        for (const i of document.images) i.loading = 'eager';
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 400));
        await Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 5000); })));
      });
      const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src));
      expect(broken, `uszkodzone obrazy na ${path}`).toEqual([]);
    }
    expect(failed).toEqual([]);
  });

  test('w kodzie nie ma adresów stagingu, localhost ani placeholderów', async ({ request }) => {
    for (const path of PAGES) {
      // porównujemy tekst bez twardych spacji i miękkich łączników – inaczej „do uzu&shy;peł&shy;nie&shy;nia”
      // nie pasuje do żadnego wzorca i atrapa przechodzi kontrolę
      const html = tekstWidoczny(await (await request.get(path)).text());
      expect(html, `${path}: adres roboczy`).not.toMatch(/localhost|127\.0\.0\.1|pages\.dev|lorem ipsum|TODO|\{\{/i);
      // github.io to faktycznie używany host testowy; w kodzie stron nie ma prawa się pojawić
      // (na hostingu testowym adresy podmienia tools/staging.mjs, więc tam pomijamy)
      if (!STAGING) expect(html, `${path}: adres hostingu testowego`).not.toMatch(/github\.io/i);
    }
    if (STAGING) return; // hosting testowy nie ma sitemapy
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).not.toMatch(/localhost|pages\.dev/);
  });

  test('widoczna treść strony głównej nie zawiera nieoznaczonych atrap', async ({ page }) => {
    // Sprawdzamy tekst wyrenderowany (innerText pomija elementy ukryte), a nie źródło HTML.
    await page.goto('/');
    const widoczny = tekstWidoczny(await page.locator('body').innerText());
    expect(widoczny, 'atrapa w widocznej treści')
      .not.toMatch(/do uzupełnienia|imię i nazwisko,\s*stanowisko|lorem ipsum/i);
    // Wyłącznie zatwierdzony podgląd slidera może zawierać jawne miejsca na przyszłe opinie.
    // Nadal sprawdzamy te karty powyżej pod kątem pozostałych atrap, a poniżej ich oznaczenia.
    const unmarked = await page.locator('body').evaluate((body) => {
      const matches = (element) => /miejsce na opinię/i.test(
        (element.innerText || '').replace(/\u00a0/g, ' ').replace(/\u00ad/g, ''),
      );
      return [...body.querySelectorAll('*')]
        .filter((element) => element.getClientRects().length && matches(element))
        .filter((element) => ![...element.children].some(matches))
        .filter((element) => !element.closest('#opinie[data-przyklad="tak"] [data-testimonial-slider] .testimonial'))
        .map((element) => element.innerText);
    });
    expect(unmarked, 'miejsce na opinię poza oznaczonym podglądem').toEqual([]);
  });

  test('przykładowe opinie mają widoczne oznaczenie, nie udają rekomendacji', async ({ page }) => {
    await page.goto('/');
    const opinie = page.locator('#opinie');
    if (await opinie.count() === 0) return;
    if (await opinie.getAttribute('data-przyklad') !== null) {
      const label = opinie.locator('.sample-note');
      await expect(label).toBeVisible();
      const text = tekstWidoczny(await label.innerText());
      if (await opinie.locator('[data-testimonial-slider]').count()) {
        expect(text).toMatch(/Sześć przykładów układu/i);
        expect(text).toMatch(/to nie są opinie klientów/i);
        expect(text).toMatch(/Treści i podpisy wymagają zatwierdzenia przed publikacją/i);
        const cards = opinie.locator('.testimonial');
        await expect(cards).toHaveCount(6);
        for (let index = 0; index < 6; index++) {
          expect(tekstWidoczny(await cards.nth(index).locator('cite').innerText()))
            .toBe(`Przykład układu 0${index + 1} / 06`);
        }
      } else {
        expect(text).toMatch(/Przykładowy układ opinii.*treść do zatwierdzenia/i);
      }
    } else {
      expect(tekstWidoczny(await opinie.innerText())).not.toMatch(/przykładowy|imię i nazwisko|do zatwierdzenia/i);
    }
  });
});
