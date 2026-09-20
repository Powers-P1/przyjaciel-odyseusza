import { test, expect } from './_fixtures.js';

const viewports = [
  [320, 568], [360, 640], [390, 844], [430, 932], [640, 800],
  [568, 320], [667, 375], [844, 390], [767, 900], [768, 1024],
  [834, 1194], [1024, 768], [1280, 650], [1366, 668], [1440, 780],
  [1440, 900], [1920, 1080], [1920, 1200], [2560, 1440], [2560, 1600],
  [3440, 1440], [3840, 2160], [1080, 1920], [5120, 1440],
];
const scrollExceptions = new Set(['320x568', '568x320']);

test.describe('Hero: macierz proporcji i wysokości okna', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const [width, height] of viewports) {
    test('hero pozostaje czytelne przy ' + width + '×' + height, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('.hero__actions a')).toHaveCount(2);
      await expect(page.locator('.proof__item')).toHaveCount(3);
      await expect.poll(() => page.locator('.hero__portrait').evaluate((image) =>
        image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
      )).toBe(true);

      const layout = await page.evaluate(() => {
        const box = (element) => {
          const { top, right, bottom, left, width, height } = element.getBoundingClientRect();
          return { top, right, bottom, left, width, height };
        };
        const rect = (selector) => box(document.querySelector(selector));
        const clipping = (element) => {
          const bounds = box(element);
          const problems = [];
          for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor);
            if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0) {
              problems.push('ukryty element lub przodek');
            }
            if (ancestor === element) continue;
            const parent = box(ancestor);
            if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX)
              && (bounds.left < parent.left - 1 || bounds.right > parent.right + 1)) {
              problems.push('przycięcie poziome przez ' + ancestor.className);
            }
            if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY)
              && (bounds.top < parent.top - 1 || bounds.bottom > parent.bottom + 1)) {
              problems.push('przycięcie pionowe przez ' + ancestor.className);
            }
          }
          return problems;
        };
        const selectors = '.hero h1, .hero__name, .hero__role, .hero__actions a, .hero__portrait, .proof__item';
        return {
          viewport: { width: innerWidth, height: innerHeight },
          overflow: document.documentElement.scrollWidth - innerWidth,
          header: rect('.site-header'),
          hero: rect('.hero'),
          title: rect('.hero h1'),
          copy: rect('.hero__copy'),
          portrait: rect('.hero__portrait'),
          proof: rect('.proof'),
          titleSize: parseFloat(getComputedStyle(document.querySelector('.hero h1')).fontSize),
          roleSize: parseFloat(getComputedStyle(document.querySelector('.hero__role')).fontSize),
          imageFit: getComputedStyle(document.querySelector('.hero__portrait')).objectFit,
          content: [...document.querySelectorAll(selectors)].map((element) => ({
            label: element.className || element.tagName, bounds: box(element), clipping: clipping(element),
          })),
          actions: [...document.querySelectorAll('.hero__actions a')].map((element) => {
            const bounds = box(element);
            const hit = document.elementFromPoint((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);
            return { ...bounds, receivesPointer: Boolean(hit && element.contains(hit)) };
          }),
        };
      });

      expect(layout.overflow, 'poziomy scroll strony').toBeLessThanOrEqual(1);
      expect(layout.titleSize, 'minimalny rozmiar H1').toBeGreaterThanOrEqual(32);
      expect(layout.roleSize, 'minimalny rozmiar funkcji zawodowych').toBeGreaterThanOrEqual(15);
      expect(['contain', 'cover']).toContain(layout.imageFit);
      expect(layout.hero.top).toBeGreaterThanOrEqual(layout.header.bottom - 1);
      expect(layout.title.bottom, 'H1 widoczne bez przewijania').toBeLessThanOrEqual(layout.viewport.height + 1);

      for (const item of layout.content) {
        expect(item.bounds.width, item.label + ': szerokość').toBeGreaterThan(0);
        expect(item.bounds.height, item.label + ': wysokość').toBeGreaterThan(0);
        expect(item.clipping, item.label + ': brak ukrycia/przycięcia').toEqual([]);
        expect(item.bounds.left, item.label + ': lewa krawędź').toBeGreaterThanOrEqual(-1);
        expect(item.bounds.right, item.label + ': prawa krawędź').toBeLessThanOrEqual(layout.viewport.width + 1);
        expect(item.bounds.top, item.label + ': początek wewnątrz hero').toBeGreaterThanOrEqual(layout.hero.top - 1);
        expect(item.bounds.bottom, item.label + ': koniec wewnątrz hero').toBeLessThanOrEqual(layout.hero.bottom + 1);
      }
      for (const action of layout.actions) {
        expect(action.height, 'obszar przycisku: wysokość').toBeGreaterThanOrEqual(44);
        expect(action.width, 'obszar przycisku: szerokość').toBeGreaterThanOrEqual(44);
        expect(action.bottom, 'CTA widoczne bez przewijania').toBeLessThanOrEqual(layout.viewport.height + 1);
        expect(action.receivesPointer, 'CTA nie zasłania inny element').toBe(true);
      }
      const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
        && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
      expect(overlaps(layout.portrait, layout.copy), 'portret nie nakłada się na tekst').toBe(false);
      expect(overlaps(layout.portrait, layout.proof), 'portret nie nakłada się na fakty').toBe(false);

      if (!scrollExceptions.has(width + 'x' + height)) {
        expect(layout.hero.bottom, 'całe hero mieści się w pierwszym ekranie').toBeLessThanOrEqual(layout.viewport.height + 1);
        expect(layout.proof.bottom, 'wszystkie fakty mieszczą się w pierwszym ekranie').toBeLessThanOrEqual(layout.viewport.height + 1);
      }
    });
  }

  test('menu w niskim oknie 568×320 udostępnia Kontakt i nie zasłania fokusu', async ({ page }) => {
    await page.setViewportSize({ width: 568, height: 320 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const toggle = page.locator('.nav-toggle');
    const navigation = page.locator('#nav-glowna');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(navigation).toBeVisible();
    const contact = navigation.getByRole('link', { name: 'Kontakt', exact: true });
    await navigation.locator('a').last().scrollIntoViewIfNeeded();
    await expect(contact).toBeInViewport({ ratio: 1 });
    const menu = await navigation.boundingBox();
    expect(menu.y + menu.height, 'menu mieści się w wysokości okna').toBeLessThanOrEqual(321);
    await contact.click();
    await expect(page).toHaveURL(/#kontakt$/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(navigation).toBeHidden();
    await expect(page.locator('#kontakt h2')).toBeInViewport({ ratio: 1 });

    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      const bounds = element.getBoundingClientRect();
      const hit = document.elementFromPoint((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);
      return {
        isControl: !['BODY', 'HTML'].includes(element.tagName),
        inHiddenMenu: Boolean(element.closest('#nav-glowna')),
        belowHeader: bounds.top >= document.querySelector('.site-header').getBoundingClientRect().bottom - 1,
        onScreen: bounds.top >= 0 && bounds.bottom <= innerHeight && bounds.left >= 0 && bounds.right <= innerWidth,
        unobscured: Boolean(hit && element.contains(hit)),
      };
    });
    expect(focus).toEqual({ isControl: true, inHiddenMenu: false, belowHeader: true, onScreen: true, unobscured: true });
  });
});

