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
      await expect(page.locator('.hero__summary')).toHaveCount(0);
      await expect(page.locator('.hero .proof__title').filter({ hasText: /^Ponad 20\s+lat w\s+zarządzaniu$/ })).toHaveCount(1);
      const heroText = await page.locator('.hero').textContent();
      expect(heroText.match(/Ponad 20\s+lat w\s+zarządzaniu/g) ?? [], 'bez powtórzenia doświadczenia pod CTA').toHaveLength(1);
      await expect(page.locator('.hero__picture source')).toHaveCount(1);
      await expect(page.locator('.hero__lead, .hero__note, .hero__individual, .hero .eyebrow')).toHaveCount(0);
      await expect(page.locator('#oferta .section-sub').first()).toContainText(/firm, HR i\s+zarządów/);
      await expect(page.locator('#oferta .section-sub').first()).toContainText(/Także\s+prywatnie/);
      const layout = await page.evaluate(() => {
        const name = document.querySelector('.hero__name').getBoundingClientRect();
        const role = document.querySelector('.hero__role').getBoundingClientRect();
        const portrait = document.querySelector('.hero__portrait');
        const firstAction = document.querySelector('.hero__actions a');
        const secondAction = document.querySelectorAll('.hero__actions a')[1];
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          nameBottom: name.bottom,
          roleTop: role.top,
          imageLoaded: portrait.complete && portrait.naturalWidth > 0,
          imageFit: getComputedStyle(portrait).objectFit,
          imageSource: portrait.currentSrc,
          firstActionText: firstAction.innerText.replace(/\s+/g, ' ').trim(),
          primaryBackground: getComputedStyle(firstAction).backgroundColor,
          secondaryUnderline: getComputedStyle(secondAction).textDecorationLine,
          secondaryBorderWidth: parseFloat(getComputedStyle(secondAction).borderTopWidth),
        };
      });
      expect(layout.overflow).toBeLessThanOrEqual(0);
      expect(layout.roleTop).toBeGreaterThanOrEqual(layout.nameBottom);
      expect(layout.imageLoaded).toBe(true);
      // Kadr zależy także od proporcji okna, nie wyłącznie szerokości.
      expect(['contain', 'cover']).toContain(layout.imageFit);
      if (width < 768) {
        await expect(page.locator('.hero__details .proof__item')).toHaveCount(3);
        expect(layout.imageSource).toMatch(/-rozmowa-\d+\.webp(?:\?.*)?$/);
        expect(layout.firstActionText).toBe('Umów bezpłatną rozmowę');
        expect(layout.primaryBackground, 'główne CTA zachowuje kolor złoty').toBe('rgb(212, 189, 137)');
        expect(layout.secondaryUnderline, 'oferta jako podkreślony link').toContain('underline');
        expect(layout.secondaryBorderWidth, 'oferta bez obramowania przycisku').toBe(0);
      } else {
        expect(layout.imageSource).not.toMatch(/-rozmowa-/);
      }
    });
  }
});
