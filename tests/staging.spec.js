import { test, expect, STAGING, ORIGIN, BASE_PATH, SITE } from './_fixtures.js';

// Sprawdzenia specyficzne dla hostingu testowego w podkatalogu (GitHub Pages). Na emulacji Cloudflare są pomijane.
test.describe('Hosting testowy (podkatalog, noindex)', () => {
  test.skip(!STAGING, 'tylko z STAGING_URL');

  test('każda strona ma noindex, a robots.txt nie blokuje robotów (żeby noindex był widoczny)', async ({ request }) => {
    for (const path of ['/', '/polityka-prywatnosci', '/nie-ma-takiej-strony-staging']) {
      const html = await (await request.get(path)).text();
      expect(html, path).toMatch(/<meta name="robots" content="noindex, nofollow">/);
    }
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toMatch(/User-agent:\s*\*/);
    expect(robots).not.toMatch(/^Disallow:\s*\/\s*$/m);
    expect(robots).not.toContain('Sitemap:');
    expect((await request.get('/sitemap.xml')).status()).toBe(404);
  });

  test('w HTML nie ma adresów bez podścieżki ani adresów produkcyjnych', async ({ request }) => {
    // po `="/` zostaje podścieżka bez wiodącego ukośnika, np. `przyjaciel-odyseusza/`
    const inner = BASE_PATH.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const path of ['/', '/polityka-prywatnosci', '/nie-ma-takiej-strony-staging']) {
      const html = await (await request.get(path)).text();
      expect(html, `${path}: adres produkcyjny`).not.toContain('https://przyjacielodyseusza.pl');
      expect(html, `${path}: adres produkcyjny www`).not.toContain('https://www.przyjacielodyseusza.pl');
      if (!BASE_PATH) continue; // hosting w katalogu głównym: adresy względem katalogu głównego są poprawne
      const leaks = [
        ...html.matchAll(new RegExp(`\\b(href|src|action)="/(?!${inner}/)[^"]*"`, 'g')),
        ...html.matchAll(new RegExp(`url\\(['"]?/(?!${inner}/)[^)]*\\)`, 'g')),
      ].map((m) => m[0]);
      expect(leaks, `${path}: adresy bez podścieżki`).toEqual([]);
      for (const src of html.matchAll(/\bsrcset="([^"]*)"/g)) {
        for (const item of src[1].split(',')) expect(item.trim().startsWith(`${BASE_PATH}/`), `${path}: srcset ${item.trim()}`).toBeTruthy();
      }
    }
  });

  test('canonical i og:url wskazują adres testowy', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(`${SITE}/`);
    expect(await page.locator('meta[property="og:url"]').getAttribute('content')).toBe(`${SITE}/`);
  });

  test('adres bazowy bez ukośnika przekierowuje na wersję z ukośnikiem', async ({ request }) => {
    test.skip(!BASE_PATH, 'hosting w katalogu głównym');
    const r = await request.get(BASE_PATH, { maxRedirects: 0 });
    expect([301, 302, 308]).toContain(r.status());
    expect(r.headers()['location']).toMatch(new RegExp(`${BASE_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/$`));
  });

  test('adresy bez rozszerzenia działają, a plik .html też jest dostępny', async ({ request }) => {
    expect((await request.get('/polityka-prywatnosci', { maxRedirects: 0 })).status()).toBe(200);
    expect((await request.get('/polityka-prywatnosci.html', { maxRedirects: 0 })).status()).toBe(200);
  });

  test('.well-known/security.txt jest serwowany (katalog z kropką trafił do artefaktu Pages)', async ({ request }) => {
    // upload-pages-artifact od v4 pomija pliki z kropką bez `include-hidden-files: true` – ten test to wykrywa
    const r = await request.get('/.well-known/security.txt');
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toMatch(/text\/plain/);
    expect(await r.text()).toContain(`Canonical: ${SITE}/.well-known/security.txt`);
  });

  test('HTTP przekierowuje na HTTPS', async ({ request }) => {
    test.skip(!ORIGIN.startsWith('https://'), 'emulacja lokalna bez TLS');
    const r = await request.get(`${ORIGIN.replace('https://', 'http://')}${BASE_PATH}/`, { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(r.status());
    expect(r.headers()['location']).toMatch(/^https:\/\//);
  });

  test('zasoby mają Cache-Control, a formularz bez backendu kończy się błędem HTTP (interfejs pokazuje kontakt awaryjny)', async ({ request }) => {
    const css = await request.get('/assets/js/main.js');
    expect(css.status()).toBe(200);
    expect(css.headers()['cache-control']).toMatch(/max-age=\d+/);
    const post = await request.post('/api/contact', { form: { name: 'x' }, maxRedirects: 0 });
    expect(post.status()).toBeGreaterThanOrEqual(400);
  });
});
