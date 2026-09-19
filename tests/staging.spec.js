import { test, expect, STAGING, ORIGIN, BASE_PATH, SITE, SHARED_404 } from './_fixtures.js';
import AxeBuilder from '@axe-core/playwright';

// Sprawdzenia specyficzne dla hostingu testowego w podkatalogu (GitHub Pages). Na emulacji Cloudflare są pomijane.
test.describe('Hosting testowy (podkatalog, noindex)', () => {
  test.skip(!STAGING, 'tylko z STAGING_URL');

  test('wybór wariantu jest dostępny i prowadzi do trzech właściwych adresów', async ({ page }) => {
    test.skip(SHARED_404, 'wspólny spis jest sprawdzany z wariantu A');
    await page.goto('/wersje/');
    await expect(page.locator('main h1')).toHaveText('Przyjaciel Odyseusza – wersje testowe strony');
    const links = page.locator('main ol a');
    await expect(links).toHaveCount(3);
    const urls = await links.evaluateAll(elements => elements.map(element => element.href));
    expect(urls).toEqual([`${SITE}/`, `${SITE}/wersja-b/`, `${SITE}/wersja-c/`]);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  });

  test('każda strona ma noindex, a robots.txt nie blokuje robotów (żeby noindex był widoczny)', async ({ request }) => {
    for (const path of ['/', '/polityka-prywatnosci', ...(SHARED_404 ? [] : ['/nie-ma-takiej-strony-staging'])]) {
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
    for (const path of ['/', '/polityka-prywatnosci', ...(SHARED_404 ? [] : ['/nie-ma-takiej-strony-staging'])]) {
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

  test('zasoby mają Cache-Control', async ({ request }) => {
    const script = await request.get('/assets/js/main.js');
    expect(script.status()).toBe(200);
    expect(script.headers()['cache-control']).toMatch(/max-age=\d+/);
  });

  test('formularz ujawnia tryb demo przed użyciem, zachowuje dane i nie wysyła żądania', async ({ page }) => {
    const posts = [];
    page.on('request', (request) => { if (request.method() === 'POST') posts.push(request.url()); });
    await page.addInitScript(() => {
      window.formEvents = [];
      window.addEventListener('po:event', (event) => window.formEvents.push(event.detail.event));
    });
    await page.goto('/');
    const form = page.locator('#formularz');
    const note = page.locator('#form-demo-note');
    await expect(form).toHaveAttribute('data-demo', 'true');
    await expect(form).toHaveAttribute('aria-describedby', /\bform-demo-note\b/);
    await expect(note).toBeVisible();
    await expect(note).toContainText('wiadomość nie zostanie wysłana');
    expect(await note.evaluate((element) => Boolean(element.compareDocumentPosition(document.querySelector('.form__submit')) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    await page.fill('#f-name', 'Jan Testowy');
    await page.fill('#f-email', 'jan@example.com');
    await page.fill('#f-message', 'Chcę sprawdzić formularz demonstracyjny.');
    await page.check('#f-privacy');
    const submit = form.locator('.form__submit');
    await expect(submit).toHaveText('Wyślij formularz');
    await submit.click();
    await expect(page.locator('#form-status')).toContainText('formularz nie wysyła wiadomości');
    await expect(page.locator('#f-name')).toHaveValue('Jan Testowy');
    await expect(page.locator('#f-email')).toHaveValue('jan@example.com');
    await expect(page.locator('#f-message')).toHaveValue('Chcę sprawdzić formularz demonstracyjny.');
    await expect(page.locator('#f-privacy')).toBeChecked();
    expect(posts).toEqual([]);
    expect(await page.evaluate(() => window.formEvents)).not.toContain('form_submit_success');
    await expect(page.locator('script[src*="challenges.cloudflare.com"]')).toHaveCount(0);
  });

  test('formularz demonstracyjny bez JavaScriptu nadal informuje o ograniczeniu i nie pozwala wysłać danych', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto(`${SITE}/`);
      await expect(page.locator('#form-demo-note')).toBeVisible();
      await expect(page.locator('#formularz .form__submit')).toBeDisabled();
    } finally {
      await context.close();
    }
  });
});
