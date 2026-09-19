import { test, expect } from './_fixtures.js';

test.describe('O mnie: biografia, portret i czytelne kwalifikacje', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const width of [320, 390, 834, 1024, 1440]) {
    test(`układ i kolejność treści przy ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const section = page.locator('#o-mnie');
      await section.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);

      const about = section.locator('.about');
      const copy = section.locator('.about__copy');
      const figure = section.locator('.about__figure');
      const credentials = section.locator('.about__credentials');
      await expect(section.getByRole('heading', { level: 2 })).toBeVisible();
      await expect(credentials.getByRole('heading', { level: 3 })).toHaveCount(2);
      await expect(copy.locator('dl')).toHaveCount(0);

      const [layout, intro, portrait, qualifications] = await Promise.all(
        [about, copy, figure, credentials].map((element) => element.boundingBox()),
      );
      expect(Math.abs(qualifications.width - layout.width)).toBeLessThanOrEqual(1);
      expect(qualifications.y).toBeGreaterThanOrEqual(
        Math.max(intro.y + intro.height, portrait.y + portrait.height),
      );
      if (width < 896) expect(portrait.y).toBeGreaterThanOrEqual(intro.y + intro.height);

      const groups = credentials.locator(':scope > div');
      const first = await groups.nth(0).boundingBox();
      const second = await groups.nth(1).boundingBox();
      if (width < 768) {
        expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
      } else {
        expect(Math.abs(first.y - second.y)).toBeLessThanOrEqual(1);
        expect(second.x).toBeGreaterThan(first.x + first.width);
      }

      // Nazwa instytucji i opis tworzą jeden pionowy wpis, nie dwie wąskie kolumny.
      for (const row of await credentials.locator('.cv__row').all()) {
        const name = await row.locator('dt').boundingBox();
        const detail = await row.locator('dd').first().boundingBox();
        expect(detail.y).toBeGreaterThanOrEqual(name.y + name.height);
        expect(Math.abs(name.x - detail.x)).toBeLessThanOrEqual(1);
      }
      const image = figure.locator('img');
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      const imageRatio = await image.evaluate((img) => {
        const rect = img.getBoundingClientRect();
        return (rect.width / rect.height) / (img.naturalWidth / img.naturalHeight);
      });
      expect(Math.abs(imageRatio - 1)).toBeLessThan(.01);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    });
  }
});
