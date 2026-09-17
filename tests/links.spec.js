import { test, expect, STAGING } from './_fixtures.js';

// Cloudflare Pages normalizuje adresy: /strona.html → 308 → /strona, dlatego linki są bez rozszerzenia.
const PAGES = ['/', '/polityka-prywatnosci', '/nie-istnieje-404'];

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
      const html = await (await request.get(path)).text();
      expect(html).not.toMatch(/localhost|127\.0\.0\.1|pages\.dev|lorem ipsum|TODO|\{\{/i);
    }
    if (STAGING) return; // hosting testowy nie ma sitemapy
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).not.toMatch(/localhost|pages\.dev/);
  });
});
