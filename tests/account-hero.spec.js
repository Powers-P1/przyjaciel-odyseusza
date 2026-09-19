import { test, expect } from './_fixtures.js';

test.describe('Hero po uwagach accounta', () => {
  for (const width of [320, 390, 834, 1366, 1440, 1920]) {
    test(`czytelna hierarchia, portret i oferta przy ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('.hero h1')).toHaveText('Rozwój menadżerów zaczyna się od rozmowy');
      await expect(page.locator('.hero__actions a')).toHaveCount(2);
      await expect(page.locator('.proof__item')).toHaveCount(3);
      await expect(page.locator('.hero__lead, .hero__note, .hero__individual, .hero .eyebrow')).toHaveCount(0);
      await expect(page.locator('#oferta .section-sub').first()).toContainText(/firm, HR i\s+zarządów/);
      await expect(page.locator('#oferta .section-sub').first()).toContainText(/Także\s+prywatnie/);
      const layout = await page.evaluate(() => {
        const name = document.querySelector('.hero__name').getBoundingClientRect();
        const role = document.querySelector('.hero__role').getBoundingClientRect();
        const portrait = document.querySelector('.hero__portrait');
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          nameBottom: name.bottom,
          roleTop: role.top,
          imageLoaded: portrait.complete && portrait.naturalWidth > 0,
          imageFit: getComputedStyle(portrait).objectFit,
        };
      });
      expect(layout.overflow).toBeLessThanOrEqual(0);
      expect(layout.roleTop).toBeGreaterThanOrEqual(layout.nameBottom);
      expect(layout.imageLoaded).toBe(true);
      expect(layout.imageFit).toBe(width < 768 ? 'contain' : 'cover');
    });
  }
});
