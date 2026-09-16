import { test, expect, STAGING, SITE } from './_fixtures.js';

// adres kanoniczny: produkcja albo (z STAGING_URL) adres hostingu testowego
const PROD = SITE;
// Cloudflare Pages serwuje /strona.html pod /strona (308 z rozszerzenia), więc adresy są bez .html
const PAGES = ['/', '/polityka-prywatnosci'];

test.describe('SEO techniczne', () => {
  test('robots.txt istnieje, nie blokuje strony i wskazuje produkcyjną sitemapę', async ({ request }) => {
    const r = await request.get('/robots.txt');
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/User-agent:\s*\*/i);
    expect(body).not.toMatch(/^Disallow:\s*\/\s*$/m);
    if (STAGING) expect(body, 'hosting testowy nie ogłasza sitemapy').not.toContain('Sitemap:');
    else expect(body).toContain(`Sitemap: ${PROD}/sitemap.xml`);
  });

  test('sitemap.xml zawiera tylko produkcyjne, kanoniczne i istniejące adresy', async ({ request }) => {
    test.skip(STAGING, 'hosting testowy celowo nie ma sitemapy (noindex)');
    const r = await request.get('/sitemap.xml');
    expect(r.status()).toBe(200);
    const xml = await r.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) {
      expect(loc.startsWith(`${PROD}/`)).toBeTruthy();
      const path = loc.slice(PROD.length);
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), `${loc} powinien zwracać 200`).toBe(200);
      const html = await res.text();
      expect(html, `${loc} nie może mieć noindex`).not.toMatch(/<meta[^>]+name="robots"[^>]+noindex/i);
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      expect(canonical, `${loc} canonical`).toBe(loc);
    }
  });

  for (const path of PAGES) {
    test(`meta i struktura: ${path}`, async ({ page }) => {
      await page.goto(path);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(15);
      expect(title.length).toBeLessThanOrEqual(75);
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(desc.length).toBeGreaterThanOrEqual(60);
      expect(desc.length).toBeLessThanOrEqual(170);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical.startsWith(`${PROD}/`)).toBeTruthy();
      expect(await page.locator('html').getAttribute('lang')).toBe('pl');

      // jeden logiczny H1 i hierarchia bez przeskoków (poza ukrytymi blokami)
      const headings = await page.evaluate(() =>
        [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
          .filter((h) => !h.closest('[hidden]'))
          .map((h) => Number(h.tagName[1])));
      expect(headings.filter((l) => l === 1)).toHaveLength(1);
      expect(headings[0]).toBe(1);
      for (let i = 1; i < headings.length; i++) {
        expect(headings[i], `przeskok poziomu nagłówka na pozycji ${i}`).toBeLessThanOrEqual(headings[i - 1] + 1);
      }

      // obrazy mają atrybut alt (pusty = dekoracyjny)
      const missingAlt = await page.locator('img:not([alt])').count();
      expect(missingAlt).toBe(0);

      // nawigacja to prawdziwe linki
      expect(await page.locator('nav a[href]').count()).toBeGreaterThan(0);
      expect(await page.locator('nav [onclick], nav div[role="link"]').count()).toBe(0);
    });
  }

  test('tytuły i opisy stron są unikalne', async ({ request }) => {
    const titles = new Set();
    const descs = new Set();
    for (const path of PAGES) {
      const html = await (await request.get(path)).text();
      titles.add(html.match(/<title>([^<]+)<\/title>/)[1]);
      descs.add(html.match(/<meta name="description" content="([^"]+)"/)[1]);
    }
    expect(titles.size).toBe(PAGES.length);
    expect(descs.size).toBe(PAGES.length);
  });

  test('strona główna nie ma noindex, a polityka ma świadomy noindex', async ({ request }) => {
    const home = await (await request.get('/')).text();
    const policy = await (await request.get('/polityka-prywatnosci')).text();
    if (STAGING) {
      // hosting testowy: wszystko poza indeksem (sprawdzane też w tests/staging.spec.js)
      expect(home).toMatch(/name="robots" content="noindex, nofollow"/);
      expect(policy).toMatch(/name="robots" content="noindex, nofollow"/);
      return;
    }
    expect(home).not.toMatch(/name="robots"[^>]*noindex/i);
    expect(policy).toMatch(/name="robots" content="noindex, follow"/);
  });

  test('Open Graph, Twitter Card i obraz social preview', async ({ page, request }) => {
    await page.goto('/');
    for (const p of ['og:title', 'og:description', 'og:url', 'og:type', 'og:image', 'og:locale', 'og:site_name']) {
      const v = await page.locator(`meta[property="${p}"]`).getAttribute('content');
      expect(v, p).toBeTruthy();
    }
    expect(await page.locator('meta[property="og:url"]').getAttribute('content')).toBe(`${PROD}/`);
    expect(await page.locator('meta[name="twitter:card"]').getAttribute('content')).toBe('summary_large_image');
    const img = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(img.startsWith(`${PROD}/`)).toBeTruthy();
    const local = await request.get(img.slice(PROD.length));
    expect(local.status()).toBe(200);
    expect(local.headers()['content-type']).toMatch(/image\/jpeg/);
  });

  test('favicon, apple-touch-icon i manifest są dostępne', async ({ page, request }) => {
    await page.goto('/');
    for (const sel of ['link[rel="icon"]', 'link[rel="apple-touch-icon"]', 'link[rel="manifest"]']) {
      const href = await page.locator(sel).first().getAttribute('href');
      expect(href, sel).toBeTruthy();
      expect((await request.get(href)).status(), href).toBe(200);
    }
    const manifest = await (await request.get('/site.webmanifest')).json();
    expect(manifest.name).toBe('Przyjaciel Odyseusza');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  test('JSON-LD parsuje się i opisuje to, co widać na stronie', async ({ page }) => {
    await page.goto('/');
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(raw);
    const graph = data['@graph'] || [data];
    const types = graph.map((n) => n['@type']);
    expect(types).toContain('ProfessionalService');
    expect(types).toContain('Person');
    const person = graph.find((n) => n['@type'] === 'Person');
    const text = await page.locator('body').innerText();
    expect(text).toContain(person.name);
    expect(person.telephone.replace(/\s/g, '')).toBe('+48601145360');
    for (const n of graph) {
      for (const key of ['url', 'image', 'logo', '@id']) {
        if (typeof n[key] === 'string') expect(n[key].startsWith(PROD), `${key} produkcyjny`).toBeTruthy();
      }
    }
  });

  test('własna strona 404 zwraca kod 404', async ({ request }) => {
    const r = await request.get('/nie-ma-takiej-strony-' + Math.floor(Math.random() * 1e6), { maxRedirects: 0 });
    expect(r.status()).toBe(404);
    const html = await r.text();
    expect(html).toContain('404');
    expect(html).toContain('Wróć na stronę główną');
  });

  test('llms.txt istnieje i opisuje stronę', async ({ request }) => {
    const r = await request.get('/llms.txt');
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body.startsWith('# Przyjaciel Odyseusza')).toBeTruthy();
    expect(body).toContain(`${PROD}/`);
  });
});
