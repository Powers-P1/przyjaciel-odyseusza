import { test, expect, ORIGIN, BASE_PATH } from './_fixtures.js';

async function openSlider(page) {
  await page.goto('/');
  const slider = page.locator('[data-testimonial-slider]');
  test.skip(await slider.count() === 0, 'Wersja bez przewijanych przykładów opinii');
  await slider.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  return slider;
}

test.describe('Opinie: dostępne, ręczne przewijanie przykładów układu', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const width of [320, 390, 1024, 1440]) {
    test(`sześć oznaczonych przykładów i przyciski przy ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const slider = await openSlider(page);
      const track = slider.locator('.testimonials');
      const cards = slider.locator('.testimonial');
      const previous = slider.getByRole('button', { name: 'Poprzednie przykłady opinii' });
      const next = slider.getByRole('button', { name: 'Następne przykłady opinii' });
      const counter = slider.getByRole('status');
      const perPage = width < 768 ? 1 : 2;

      await expect(cards).toHaveCount(6);
      await expect(page.locator('#opinie .sample-note')).toContainText(/nie są opinie klientów/);
      for (const card of await cards.all()) {
        await expect(card.locator('cite')).toContainText('Przykład układu');
        await expect(card).not.toHaveAttribute('aria-hidden', 'true');
      }
      const visibleCount = await track.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return [...element.children].filter((card) => {
          const rect = card.getBoundingClientRect();
          return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1;
        }).length;
      });
      expect(visibleCount).toBe(perPage);
      await expect(previous).toBeDisabled();
      await expect(next).toBeEnabled();
      await expect(counter).toHaveText(perPage === 1 ? 'Przykład 1 z 6' : 'Przykłady 1–2 z 6');

      await next.click();
      await expect(counter).toHaveText(perPage === 1 ? 'Przykład 2 z 6' : 'Przykłady 3–4 z 6');
      await expect(previous).toBeEnabled();
      await previous.click();
      await expect(previous).toBeDisabled();
      await expect(counter).toHaveText(perPage === 1 ? 'Przykład 1 z 6' : 'Przykłady 1–2 z 6');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    });
  }

  test('klawiatura dociera do ostatniej karty i wraca bez przenoszenia fokusu', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    const slider = await openSlider(page);
    const track = slider.locator('.testimonials');
    const counter = slider.getByRole('status');
    const previous = slider.getByRole('button', { name: 'Poprzednie przykłady opinii' });
    const next = slider.getByRole('button', { name: 'Następne przykłady opinii' });

    await track.focus();
    await page.keyboard.press('End');
    await expect(counter).toHaveText('Przykłady 5–6 z 6');
    await expect(next).toBeDisabled();
    await expect(track).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(counter).toHaveText('Przykłady 3–4 z 6');
    await page.keyboard.press('ArrowRight');
    await expect(counter).toHaveText('Przykłady 5–6 z 6');
    await page.keyboard.press('Home');
    await expect(previous).toBeDisabled();
    await expect(counter).toHaveText('Przykłady 1–2 z 6');
    await expect(track).toBeFocused();
    expect(await track.evaluate((element) => getComputedStyle(element).scrollBehavior)).toBe('auto');
  });

  for (const width of [390, 1024]) {
    test(`przyciski zachowują fokus na krańcach i blokują dalszą aktywację przy ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const slider = await openSlider(page);
      const track = slider.locator('.testimonials');
      const counter = slider.getByRole('status');
      const previous = slider.getByRole('button', { name: 'Poprzednie przykłady opinii' });
      const next = slider.getByRole('button', { name: 'Następne przykłady opinii' });
      const perPage = width < 768 ? 1 : 2;
      const label = (first) => perPage === 1
        ? `Przykład ${first + 1} z 6`
        : `Przykłady ${first + 1}–${first + perPage} z 6`;

      await next.focus();
      for (let first = perPage; first <= 6 - perPage; first += perPage) {
        await page.keyboard.press('Enter');
        await expect(counter).toHaveText(label(first));
        await expect(next).toBeFocused();
      }
      await expect(next).toBeDisabled();
      await expect(next).toHaveJSProperty('disabled', false);
      const end = await track.evaluate((element) => element.scrollLeft);
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
      await expect(next).toBeFocused();
      await next.click({ force: true });
      await expect(counter).toHaveText(label(6 - perPage));
      await expect(track).toHaveJSProperty('scrollLeft', end);

      await previous.focus();
      for (let first = 6 - 2 * perPage; first >= 0; first -= perPage) {
        await page.keyboard.press('Enter');
        await expect(counter).toHaveText(label(first));
        await expect(previous).toBeFocused();
      }
      await expect(previous).toBeDisabled();
      await expect(previous).toHaveJSProperty('disabled', false);
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
      await expect(previous).toBeFocused();
      await previous.click({ force: true });
      await expect(counter).toHaveText(label(0));
      await expect(track).toHaveJSProperty('scrollLeft', 0);
    });
  }

  test('natywne przewinięcie i zmiana szerokości aktualizują licznik i przyciski', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const slider = await openSlider(page);
    const track = slider.locator('.testimonials');
    const counter = slider.getByRole('status');
    const next = slider.getByRole('button', { name: 'Następne przykłady opinii' });

    // Weryfikuje zdarzenie natywnego przewijania, niezależne od obsługi przycisków.
    await track.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    await expect(counter).toHaveText('Przykład 6 z 6');
    await expect(next).toBeDisabled();
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(counter).toHaveText('Przykłady 5–6 z 6');
    await expect(next).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });

  test('bez JavaScriptu wszystkie przykłady są dostępne w pionowym układzie', async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    try {
      const page = await context.newPage();
      await page.goto(`${ORIGIN}${BASE_PATH}/`);
      const slider = page.locator('[data-testimonial-slider]');
      test.skip(await slider.count() === 0, 'Wersja bez przewijanych przykładów opinii');
      const cards = slider.locator('.testimonial');
      await expect(cards).toHaveCount(6);
      await expect(slider.locator('.testimonial-slider__controls')).toBeHidden();
      for (const card of await cards.all()) {
        await card.scrollIntoViewIfNeeded();
        await expect(card).toBeInViewport();
      }
      const first = await cards.first().boundingBox();
      const last = await cards.last().boundingBox();
      expect(last.y).toBeGreaterThan(first.y + first.height);
      expect(Math.abs(last.x - first.x)).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    } finally {
      await context.close();
    }
  });
});
