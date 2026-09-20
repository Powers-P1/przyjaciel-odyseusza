import { test, expect } from './_fixtures.js';

test.describe('Zasady: odstępy zgodne z krokami współpracy', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const width of [390, 1440]) {
    test(`ikona, nagłówek i opis mają ten sam rytm przy ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      await page.locator('.principles').scrollIntoViewIfNeeded();

      const spacing = await page.evaluate(() => {
        const measure = (item, markerSelector, titleSelector) => {
          const marker = item.querySelector(markerSelector).getBoundingClientRect();
          const title = item.querySelector(titleSelector).getBoundingClientRect();
          const description = item.querySelector('p').getBoundingClientRect();
          return { beforeTitle: title.top - marker.bottom, beforeDescription: description.top - title.bottom };
        };
        return {
          steps: [...document.querySelectorAll('.step')].map((item) => measure(item, '.step__num', '.step__title')),
          principles: [...document.querySelectorAll('.principle')].map((item) => measure(item, '.principle__icon svg', '.principle__title')),
        };
      });

      expect(spacing.steps.length).toBeGreaterThan(0);
      expect(spacing.principles.length).toBeGreaterThan(0);
      const reference = spacing.steps[0];
      expect(reference.beforeTitle).toBeGreaterThan(0);
      expect(reference.beforeDescription).toBeGreaterThan(0);
      for (const [index, item] of [...spacing.steps, ...spacing.principles].entries()) {
        expect(Math.abs(item.beforeTitle - reference.beforeTitle), `odstęp nad nagłówkiem elementu ${index}`).toBeLessThan(.75);
        expect(Math.abs(item.beforeDescription - reference.beforeDescription), `odstęp nad opisem elementu ${index}`).toBeLessThan(.75);
      }
    });
  }
});
