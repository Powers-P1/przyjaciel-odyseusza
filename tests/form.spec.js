import { test, expect, STAGING } from './_fixtures.js';

const VALID = {
  name: 'Test Testowy',
  email: 'test@example.com',
  phone: '',
  subject_for: 'firma',
  message: 'To jest testowa wiadomość z automatycznego testu formularza.',
  website: '',
  ts: String(Date.now() - 60_000),
};

test.describe('Formularz kontaktowy: walidacja po stronie serwera (/api/contact)', () => {
  test.skip(STAGING, 'hosting testowy (GitHub Pages) nie ma funkcji /api/contact – backend testujemy na emulacji Cloudflare');

  test('puste dane → 422 z listą pól', async ({ request }) => {
    const r = await request.post('/api/contact', { headers: { Accept: 'application/json' }, data: { ...VALID, name: '', email: 'zly', message: 'krótko' } });
    expect(r.status()).toBe(422);
    const j = await r.json();
    expect(j.ok).toBe(false);
    expect(j.error).toBe('validation');
    expect(j.fields.sort()).toEqual(['email', 'message', 'name']);
  });

  test('honeypot wypełniony → udawany sukces bez wysyłki', async ({ request }) => {
    const r = await request.post('/api/contact', { headers: { Accept: 'application/json' }, data: { ...VALID, website: 'http://spam.example' } });
    expect(r.status()).toBe(200);
    expect((await r.json()).ok).toBe(true);
  });

  test('zbyt szybkie wysłanie (bot) → udawany sukces', async ({ request }) => {
    const r = await request.post('/api/contact', { headers: { Accept: 'application/json' }, data: { ...VALID, elapsed_ms: '400' } });
    expect(r.status()).toBe(200);
    expect((await r.json()).ok).toBe(true);
  });

  // Regresja: pułapka czasowa liczy czas zmierzony przez przeglądarkę, a nie różnicę zegarów.
  // Wcześniej serwer robił `Date.now() - ts`, więc telefon ze spieszącym się zegarem dostawał
  // potwierdzenie wysyłki, a wiadomość przepadała bez śladu.
  test('rozjechany zegar urządzenia nie wrzuca zgłoszenia do pułapki na boty', async ({ request }) => {
    for (const elapsed of ['3000', '86400000', '-5000', '']) {
      const r = await request.post('/api/contact', { headers: { Accept: 'application/json' }, data: { ...VALID, elapsed_ms: elapsed } });
      // zgłoszenie ma przejść dalej: albo do wysyłki (200 z kluczem API), albo do błędu konfiguracji
      expect([200, 500], `elapsed_ms=${elapsed || 'brak'}`).toContain(r.status());
      if (r.status() === 200) expect((await r.json()).ok, `elapsed_ms=${elapsed || 'brak'}`).not.toBe(true);
    }
  });

  test('poprawne dane bez klucza API → 500 not_configured (lokalnie) albo 200 (z kluczem)', async ({ request }) => {
    const r = await request.post('/api/contact', { headers: { Accept: 'application/json' }, data: VALID });
    expect([200, 500]).toContain(r.status());
    const j = await r.json();
    if (r.status() === 500) expect(j.error).toBe('not_configured');
    else expect(j.ok).toBe(true);
  });

  test('wariant bez JavaScriptu (form-urlencoded) kończy się przekierowaniem 303 do sekcji kontakt', async ({ request }) => {
    const r = await request.post('/api/contact', { form: { ...VALID, name: '' }, maxRedirects: 0 });
    expect(r.status()).toBe(303);
    expect(r.headers()['location']).toBe('/?blad=1#kontakt');
  });

  test('nieprawidłowy JSON → 400', async ({ request }) => {
    const r = await request.post('/api/contact', { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, data: Buffer.from('{nie json') });
    expect(r.status()).toBe(400);
  });

  test('endpoint nie jest otwartym relayem: brak pól "to"/"subject" w interfejsie', async ({ request }) => {
    const r = await request.post('/api/contact', { headers: { Accept: 'application/json' }, data: { ...VALID, to: 'ofiara@example.com', subject: 'SPAM' } });
    // pola są ignorowane; odpowiedź zależy tylko od konfiguracji klucza
    expect([200, 500]).toContain(r.status());
  });
});

test.describe('Formularz kontaktowy: interfejs', () => {
  test('walidacja po stronie klienta daje natychmiastowy, konkretny feedback', async ({ page }) => {
    await page.goto('/');
    await page.locator('#formularz .form__submit').click();
    await expect(page.locator('#f-name-error')).toHaveText('Podaj imię i nazwisko.');
    await expect(page.locator('#f-email-error')).toContainText('poprawny adres e-mail');
    await expect(page.locator('#f-message-error')).toBeVisible();
    await page.fill('#f-name', 'Jan Kowalski');
    await expect(page.locator('#f-name-error')).toBeHidden();
    await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'false');
  });

  test('błąd backendu pokazuje zrozumiały komunikat z kontaktem awaryjnym; przycisk wraca do stanu wyjściowego', async ({ page }) => {
    await page.goto('/');
    // pole wypełnia skrypt strony przy wysyłce; tu tylko upewniamy się, że formularz nie trafi w pułapkę czasową
    await page.waitForTimeout(2600);
    await page.fill('#f-name', 'Jan Kowalski');
    await page.fill('#f-email', 'jan@example.com');
    await page.check('input[name="subject_for"][value="ja"]');
    await page.fill('#f-message', 'Testowa wiadomość o odpowiedniej długości.');
    const submit = page.locator('#formularz .form__submit');
    const originalLabel = (await submit.textContent()).trim();
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/contact')),
      submit.click(),
    ]);
    const status = page.locator('#form-status');
    await expect(status).toBeVisible();
    if (response.status() === 200) {
      await expect(status).toContainText('Dziękuję');
    } else {
      await expect(status).toContainText('Nie udało się');
      await expect(status.locator('a[href^="mailto:"]')).toHaveCount(1);
      await expect(status.locator('a[href^="tel:"]')).toHaveCount(1);
    }
    await expect(submit).toBeEnabled();
    await expect(submit).toHaveText(originalLabel);
  });

  test('podwójne kliknięcie nie wysyła dwóch żądań', async ({ page }) => {
    await page.goto('/');
    // pole wypełnia skrypt strony przy wysyłce; tu tylko upewniamy się, że formularz nie trafi w pułapkę czasową
    await page.waitForTimeout(2600);
    await page.fill('#f-name', 'Jan Kowalski');
    await page.fill('#f-email', 'jan@example.com');
    await page.fill('#f-message', 'Testowa wiadomość o odpowiedniej długości.');
    let posts = 0;
    page.on('request', (r) => { if (r.url().includes('/api/contact') && r.method() === 'POST') posts++; });
    const submit = page.locator('#formularz .form__submit');
    await submit.dblclick();
    await expect(page.locator('#form-status')).toBeVisible();
    expect(posts).toBe(1);
  });

  test('komunikat po przekierowaniu (?wyslano / ?blad) jest widoczny', async ({ page }) => {
    await page.goto('/?wyslano=1#kontakt');
    await expect(page.locator('#form-status')).toContainText('Dziękuję');
    await page.goto('/?blad=1#kontakt');
    await expect(page.locator('#form-status')).toContainText('Nie udało się');
  });
});
