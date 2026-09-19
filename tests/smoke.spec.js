import { test, expect, ORIGIN, BASE_PATH } from './_fixtures.js';

test.describe('Smoke: nawigacja i kluczowe ścieżki', () => {
  test('bez JavaScriptu mobilna nawigacja i kontakt pozostają dostępne', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 390, height: 844 } });
    try {
      const page = await context.newPage();
      await page.goto(`${ORIGIN}${BASE_PATH}/`);
      await expect(page.locator('.nav-toggle')).toBeHidden();
      await expect(page.locator('.site-nav')).toBeVisible();
      await page.locator('.site-nav a[href="#oferta"]').click();
      await expect(page).toHaveURL(/#oferta$/);
      await expect(page.locator('.form__noscript')).toBeVisible();
      await expect(page.locator('.form__noscript a[href^="mailto:"]')).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('strona główna ładuje się bez błędów w konsoli', async ({ page }) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('każda kotwica w nawigacji i przyciskach prowadzi do istniejącej sekcji', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('a[href^="#"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
    expect(hrefs.length).toBeGreaterThan(3);
    for (const h of hrefs) {
      await expect(page.locator(h), `brak celu dla ${h}`).toHaveCount(1);
    }
  });

  test('główne CTA „Porozmawiajmy” prowadzi do formularza', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hero .btn--primary').click();
    await expect(page).toHaveURL(/#kontakt$/);
    // na wąskich ekranach sekcja jest jednokolumnowa: w widoku ląduje nagłówek sekcji, formularz jest niżej
    await expect(page.locator('#kontakt')).toBeInViewport({ ratio: 0.2 });
  });

  test('linki telefon i e-mail używają tel: i mailto:', async ({ page }) => {
    await page.goto('/');
    const tel = page.locator('a[href^="tel:"]');
    const mail = page.locator('a[href^="mailto:"]');
    expect(await tel.count()).toBeGreaterThanOrEqual(2);
    expect(await mail.count()).toBeGreaterThanOrEqual(2);
    for (const href of await tel.evaluateAll((as) => as.map((a) => a.href))) expect(href).toBe('tel:+48601145360');
    for (const href of await mail.evaluateAll((as) => as.map((a) => a.href))) expect(href.startsWith('mailto:bartek@przyjacielodyseusza.pl')).toBeTruthy();
  });

  test('strona nie ustawia cookies ani localStorage (brak trackerów, brak potrzeby CMP)', async ({ page, context }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.locator('#formularz .form__submit').click();
    await page.waitForTimeout(300);
    expect(await context.cookies()).toEqual([]);
    const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
    expect(storage.local).toEqual([]);
    expect(storage.session).toEqual([]);
    const thirdParty = [];
    page.on('request', (r) => { if (!r.url().startsWith(ORIGIN)) thirdParty.push(r.url()); });
    await page.reload({ waitUntil: 'networkidle' });
    expect(thirdParty).toEqual([]);
  });

  test('stare kotwice z poprzedniej strony trafiają do istniejących sekcji', async ({ page }) => {
    for (const legacy of ['#dla-biznesu', '#dla-ciebie', '#cennik']) {
      await page.goto(`/${legacy}`);
      await expect(page).not.toHaveURL(new RegExp(`${legacy}$`));
      const hash = new URL(page.url()).hash;
      expect(hash, `${legacy} powinno przekierować na sekcję`).toMatch(/^#[a-z-]+$/);
      await expect(page.locator(hash), `cel ${hash} nie istnieje`).toHaveCount(1);
    }
  });

  test('żaden link nie otwiera nowej karty bez powodu', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('a[target="_blank"]').count()).toBe(0);
  });

  test('menu mobilne: otwieranie, zamykanie linkiem i klawiszem Escape', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'tylko projekty mobilne');
    await page.goto('/');
    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#nav-glowna');
    await expect(toggle).toBeVisible();
    await expect(nav).toBeHidden();
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await nav.getByRole('link', { name: 'Oferta' }).tap();
    await expect(nav).toBeHidden();
    await expect(page).toHaveURL(/#oferta$/);
    await toggle.tap();
    await expect(nav).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test('menu mobilne zamyka się, gdy fokus wychodzi poza nagłówek', async ({ page }) => {
    // Otwarty panel jest przyklejony do góry widoku, więc kolejny element w kolejności Tab
    // lądował pod nim – przy powiększeniu 200% zakrywał go w całości (WCAG 2.4.11).
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('.nav-toggle').click();
    await expect(page.locator('#nav-glowna')).toBeVisible();
    const ostatni = page.locator('#nav-glowna a').last();
    await ostatni.focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#nav-glowna')).toBeHidden();
  });

  test('na desktopie menu jest widoczne bez przycisku', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile'), 'tylko desktop');
    await page.goto('/');
    await expect(page.locator('.nav-toggle')).toBeHidden();
    await expect(page.locator('#nav-glowna')).toBeVisible();
  });

  test('brak poziomego scrolla na wąskim ekranie (reflow 320 px)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('strona pozostaje używalna przy zoomie 200% (viewport 640 px)', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.hero .btn--primary')).toBeVisible();
  });

  // Hero jest sceną na jeden ekran: razem z paskiem faktów ma się mieścić nad krawędzią okna,
  // od niskich laptopów po duże monitory. Pion skaluje się wysokością okna (--hero-rytm w CSS).
  for (const [width, height] of [[1366, 768], [1440, 900], [1536, 864], [1920, 1080], [2560, 1440]]) {
    test(`hero mieści się w pierwszym ekranie (${width}×${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const { dol, okno } = await page.evaluate(() => ({
        dol: document.querySelector('.hero').getBoundingClientRect().bottom,
        okno: window.innerHeight,
      }));
      expect(dol, 'dolna krawędź hero względem dołu okna').toBeLessThanOrEqual(okno);
      await expect(page.locator('.proof__item').first()).toBeInViewport();
    });
  }

  test('bardzo szeroki ekran nie psuje układu', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1200 });
    await page.goto('/');
    // treść ma się rozciągnąć na dużym monitorze (--container rośnie do 86rem), ale nie w nieskończoność:
    // o czytelność wiersza dba osobno --miara na blokach tekstu
    const box = await page.locator('.hero .container').first().boundingBox();
    expect(box.width, 'szerokość kontenera').toBeLessThanOrEqual(1376);
    expect(box.width, 'kontener nie urósł wraz z ekranem').toBeGreaterThanOrEqual(1300);
    expect(box.x).toBeGreaterThan(500);
  });
});
