import { test, expect, STAGING } from './_fixtures.js';

const MESSAGE = 'Testowa wiadomość o odpowiedniej długości.';
async function fillValid(page) {
  await page.fill('#f-name', 'Jan Kowalski');
  await page.fill('#f-email', 'jan@example.com');
  await page.fill('#f-message', MESSAGE);
  await page.check('#f-privacy');
}

test.describe('Formularz kontaktowy: bezpieczna walidacja serwera', () => {
  test.skip(STAGING, 'Statyczny demonstrator nie ma endpointu Cloudflare.');

  test('puste dane → 422 z listą pól', async ({ request }) => {
    const response = await request.post('/api/contact', { data: {} });
    expect(response.status()).toBe(422);
    expect((await response.json()).fields.sort()).toEqual(['email', 'message', 'name', 'privacy_acknowledged']);
  });

  test('nieprawidłowe kształty JSON → 400', async ({ request }) => {
    for (const body of ['null', '[]', '1', 'true', '"tekst"', '{broken']) {
      const response = await request.post('/api/contact', {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, data: Buffer.from(body),
      });
      expect(response.status()).toBe(400);
    }
  });

  test('wariant bez JavaScriptu zwraca czytelny HTML z błędem', async ({ request }) => {
    const response = await request.post('/api/contact', { form: { name: '' } });
    expect(response.status()).toBe(422);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(await response.text()).toContain('Nie udało się wysłać wiadomości.');
  });
});

test.describe('Formularz kontaktowy: interfejs bez prawdziwej wysyłki', () => {
  test.beforeEach(async ({ page }) => {
    // Każde żądanie formularza jest przechwycone — także na wdrożeniu z prawdziwymi sekretami.
    await page.route('**/api/contact', (route) => route.fulfill({ status: 502, json: { ok: false, error: 'mail_failed' } }));
  });

  test('walidacja po stronie klienta daje konkretny feedback', async ({ page }) => {
    await page.goto('/');
    await page.locator('#formularz .form__submit').click();
    await expect(page.locator('#f-name-error')).toHaveText('Podaj imię i nazwisko.');
    await expect(page.locator('#f-email-error')).toContainText('poprawny adres e-mail');
    await expect(page.locator('#f-message-error')).toBeVisible();
    await expect(page.locator('#f-privacy-error')).toBeVisible();
    await page.fill('#f-name', 'Jan Kowalski');
    await expect(page.locator('#f-name-error')).toBeHidden();
    await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'false');
  });

  test('brak potwierdzenia informacji o danych blokuje wysyłkę i kieruje fokus na checkbox', async ({ page }) => {
    let posts = 0;
    page.on('request', (request) => { if (request.method() === 'POST') posts++; });
    await page.goto('/');
    await fillValid(page);
    const acknowledgment = page.getByRole('checkbox', { name: /Dane z formularza wykorzystam/ });
    await acknowledgment.uncheck();
    await page.getByRole('button', { name: 'Wyślij formularz', exact: true }).click();
    await expect(acknowledgment).toBeFocused();
    await expect(acknowledgment).toHaveAttribute('aria-invalid', 'true');
    await expect(acknowledgment).toHaveAttribute('aria-describedby', 'f-privacy-error');
    await expect(page.locator('#f-privacy-error')).toContainText('Potwierdź zapoznanie się');
    await expect(page.locator('#form-status')).toBeEmpty();
    expect(posts).toBe(0);
    await acknowledgment.press('Space');
    await expect(acknowledgment).toBeChecked();
    await expect(acknowledgment).toHaveAttribute('aria-invalid', 'false');
    await expect(page.locator('#f-privacy-error')).toBeHidden();
    await expect(page.locator('#f-message')).toHaveValue(MESSAGE);
  });

  test('demo informuje o braku wysyłki i zachowuje dane', async ({ page }) => {
    test.skip(!STAGING, 'Tryb demo dodaje build:staging.');
    let posts = 0;
    page.on('request', (request) => { if (request.method() === 'POST') posts++; });
    await page.addInitScript(() => { window.dataLayer = []; });
    await page.goto('/');
    await fillValid(page);
    await page.locator('#formularz .form__submit').click();
    await expect(page.locator('#form-status')).toContainText('Wersja demonstracyjna — formularz nie wysyła wiadomości.');
    await expect(page.locator('#f-message')).toHaveValue(MESSAGE);
    expect(posts).toBe(0);
    await expect(page.locator('#f-privacy')).toBeChecked();
    expect(await page.evaluate(() => window.dataLayer.some((event) => event.event === 'form_submit_success'))).toBe(false);
  });

  test('błąd backendu zachowuje wiadomość i przywraca przycisk', async ({ page }) => {
    test.skip(STAGING, 'Demo nie wywołuje backendu.');
    await page.goto('/');
    await fillValid(page);
    const submit = page.locator('#formularz .form__submit');
    const label = await submit.textContent();
    await submit.click();
    await expect(page.locator('#form-status')).toContainText('Nie udało się wysłać wiadomości.');
    await expect(page.locator('#form-status a[href^="mailto:"]')).toHaveCount(1);
    await expect(page.locator('#form-status a[href^="tel:"]')).toHaveCount(1);
    await expect(page.locator('#f-message')).toHaveValue(MESSAGE);
    await expect(submit).toBeEnabled();
    await expect(submit).toHaveText(label);
  });

  test('szybkie ponowne zdarzenie submit wysyła jedno żądanie', async ({ page }) => {
    test.skip(STAGING, 'Demo nie wywołuje backendu.');
    let posts = 0;
    await page.route('**/api/contact', async (route) => {
      posts++;
      expect(route.request().postDataJSON().privacy_acknowledged).toBe('yes');
      await route.fulfill({ json: { ok: true } });
    });
    await page.goto('/');
    await fillValid(page);
    await page.locator('#formularz').evaluate((form) => { form.requestSubmit(); form.requestSubmit(); });
    await expect(page.locator('#form-status')).toContainText('Dziękuję');
    expect(posts).toBe(1);
    await expect(page.locator('#f-message')).toHaveValue('');
    await expect(page.locator('#f-privacy')).not.toBeChecked();
  });

  test('brak odpowiedzi kończy oczekiwanie i zachowuje dane', async ({ page }) => {
    test.skip(STAGING, 'Demo nie wywołuje backendu.');
    await page.addInitScript(() => {
      window.fetch = (_url, options) => new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    });
    await page.clock.install();
    await page.goto('/');
    await fillValid(page);
    await page.locator('#formularz .form__submit').click();
    await page.clock.fastForward(25001);
    await expect(page.locator('#form-status')).toContainText('Nie udało się potwierdzić wysyłki');
    await expect(page.locator('#form-status')).toContainText('Wiadomość mogła już dotrzeć');
    await expect(page.locator('#f-message')).toHaveValue(MESSAGE);
    await expect(page.locator('#formularz .form__submit')).toBeEnabled();
  });

  test('po nieudanej wysyłce Turnstile daje nowy token do ponownej próby', async ({ page }) => {
    test.skip(STAGING, 'Demo nie ładuje Turnstile.');
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() !== 'document') return route.fallback();
      const response = await route.fetch();
      const body = (await response.text()).replace(/data-turnstile-sitekey="[^"]*"/, 'data-turnstile-sitekey="test-public-key"');
      await route.fulfill({ response, body });
    });
    await page.route('**/turnstile/v0/api.js*', (route) => route.fulfill({ contentType: 'application/javascript', body: `
      window.turnstile = {
        ready(callback) { callback(); },
        render(slot, options) { this.options = options; this.count = 1; options.callback('token-1'); return 'widget-test'; },
        reset(widget) { if (widget !== 'widget-test') throw new Error('wrong widget'); this.options.callback('token-' + ++this.count); }
      };
    ` }));
    const tokens = [];
    await page.route('**/api/contact', (route) => {
      tokens.push(route.request().postDataJSON()['cf-turnstile-response']);
      return route.fulfill(tokens.length === 1 ? { status: 502, json: { ok: false, error: 'mail_failed' } } : { json: { ok: true } });
    });
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => window.turnstile && window.turnstile.count)).toBe(1);
    await fillValid(page);
    await page.locator('#formularz .form__submit').click();
    await expect(page.locator('#form-status')).toContainText('Nie udało się');
    await expect(page.locator('#f-message')).toHaveValue(MESSAGE);
    await page.locator('#formularz .form__submit').click();
    await expect(page.locator('#form-status')).toContainText('Dziękuję');
    expect(tokens).toEqual(['token-1', 'token-2']);
  });
});
