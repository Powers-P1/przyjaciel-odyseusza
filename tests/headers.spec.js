import { test, expect, STAGING } from './_fixtures.js';

test.describe('Nagłówki bezpieczeństwa i cache (_headers)', () => {
  test.skip(STAGING, 'hosting testowy (GitHub Pages) nie obsługuje _headers ani funkcji – nagłówki sprawdzamy na emulacji Cloudflare i po publikacji');

  test('strona główna ma komplet nagłówków bezpieczeństwa', async ({ request }) => {
    const h = (await request.get('/')).headers();
    expect(h['strict-transport-security']).toMatch(/max-age=\d+/);
    expect(h['content-security-policy']).toContain("default-src 'self'");
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['content-security-policy']).not.toMatch(/\*/);
    expect(h['content-security-policy']).not.toContain("'unsafe-inline'");
    expect(h['content-security-policy']).toMatch(/script-src [^;]*'sha256-[A-Za-z0-9+/=]+'(?:;| )/);
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['permissions-policy']).toContain('camera=()');
  });

  test('CSP nie blokuje własnych zasobów (brak błędów CSP w konsoli)', async ({ page }) => {
    const cspErrors = [];
    page.on('console', (m) => { if (/Content Security Policy|CSP/i.test(m.text())) cspErrors.push(m.text()); });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('#formularz .form__submit').click();
    expect(cspErrors).toEqual([]);
  });

  test('menu ma układ JS zanim dotrze odroczony skrypt, a CSP dopuszcza init', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/assets/js/main.js*', (route) => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveClass(/\bjs\b/);
    await expect(page.locator('.site-nav')).toBeHidden();
    await expect(page.locator('.nav-toggle')).toBeVisible();
  });

  test('fonty i obrazy mają długi cache, HTML nie jest immutable', async ({ request, page }) => {
    await page.goto('/');
    // fonty są deklarowane w inline CSS (brak preloadu), więc adres bierzemy z treści strony
    const pageHtml = await page.content();
    const font = pageHtml.match(/\/assets\/fonts\/[A-Za-z0-9-]+\.woff2/)?.[0];
    expect(font, 'brak adresu fontu w CSS').toBeTruthy();
    const fontRes = await request.get(font);
    expect(fontRes.status()).toBe(200);
    expect(fontRes.headers()['cache-control']).toContain('immutable');
    const img = await page.locator('.hero__portrait').getAttribute('src');
    expect((await request.get(img)).headers()['cache-control']).toMatch(/max-age=\d+/);
    const html = (await request.get('/')).headers()['cache-control'] || '';
    expect(html).not.toContain('immutable');
  });

  test('security.txt i llms.txt są serwowane jako tekst', async ({ request }) => {
    const s = await request.get('/.well-known/security.txt');
    expect(s.status()).toBe(200);
    expect(s.headers()['content-type']).toMatch(/text\/plain/);
    const body = await s.text();
    expect(body).toMatch(/^Contact: mailto:/m);
    expect(body).toMatch(/^Expires: 20\d\d-/m);
    const expires = new Date(body.match(/^Expires: (.+)$/m)[1]);
    expect(expires.getTime()).toBeGreaterThan(Date.now());
    const l = await request.get('/llms.txt');
    expect(l.status()).toBe(200);
    expect(l.headers()['content-type']).toMatch(/text\/plain/);
  });

  test('endpoint formularza odrzuca GET i nie jest cachowany', async ({ request }) => {
    const r = await request.get('/api/contact');
    expect(r.status()).toBe(405);
    expect(r.headers()['allow']).toBe('POST');
    // nagłówki muszą pochodzić z samej funkcji: Cloudflare nie stosuje _headers do Pages Functions
    expect(r.headers()['cache-control'], 'brak no-store na odpowiedzi funkcji').toMatch(/no-store/);
    expect(r.headers()['x-content-type-options']).toBe('nosniff');
  });
});
