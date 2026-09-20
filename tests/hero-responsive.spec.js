import { test, expect, ORIGIN, BASE_PATH } from './_fixtures.js';

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
          byline: rect('.hero__byline'),
          actionGroup: rect('.hero__actions'),
          copy: rect('.hero__copy'),
          portrait: rect('.hero__portrait'),
          proof: rect('.proof'),
          singleColumn: getComputedStyle(document.querySelector('.hero__grid')).gridTemplateColumns.trim().split(/\s+/).length === 1,
          figureBeforeCopy: Boolean(document.querySelector('.hero__figure').compareDocumentPosition(document.querySelector('.hero__copy'))
            & Node.DOCUMENT_POSITION_FOLLOWING),
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
      expect(layout.figureBeforeCopy, 'zdjęcie poprzedza tekst także w DOM').toBe(true);
      expect(layout.title.bottom, 'H1 przed podpisem').toBeLessThanOrEqual(layout.byline.top + 1);
      expect(layout.byline.bottom, 'podpis przed CTA').toBeLessThanOrEqual(layout.actionGroup.top + 1);
      if (layout.singleColumn) {
        expect(layout.portrait.bottom, 'jedna kolumna: zdjęcie przed H1').toBeLessThanOrEqual(layout.title.top + 1);
      } else {
        expect(layout.copy.right, 'dwie kolumny: tekst po lewej, portret po prawej').toBeLessThanOrEqual(layout.portrait.left + 1);
      }

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

  test('mobile bez JavaScriptu zachowuje kolejność zdjęcie, tekst, CTA przy 390×844', async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      await page.goto(ORIGIN + BASE_PATH + '/');
      // Odczytujemy stan bez oczekiwania na Promise w stronie z wyłączonym JS.
      await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded');
      await expect(page.locator('.hero__actions a')).toHaveCount(2);
      await expect(page.locator('.proof__item')).toHaveCount(3);
      await expect.poll(() => page.locator('.hero__portrait').evaluate((image) =>
        image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
      )).toBe(true);
      for (const element of await page.locator('.hero__portrait, .hero h1, .hero__byline, .hero__actions a, .proof__item').all()) {
        await expect(element).toBeVisible();
      }
      const layout = await page.evaluate(() => {
        const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
        return {
          portrait: rect('.hero__portrait'), title: rect('.hero h1'),
          byline: rect('.hero__byline'), actions: rect('.hero__actions'),
          buttons: [...document.querySelectorAll('.hero__actions a')].map(element => element.getBoundingClientRect().toJSON()),
          singleColumn: getComputedStyle(document.querySelector('.hero__grid')).gridTemplateColumns.trim().split(/\s+/).length === 1,
          figureBeforeCopy: Boolean(document.querySelector('.hero__figure').compareDocumentPosition(document.querySelector('.hero__copy'))
            & Node.DOCUMENT_POSITION_FOLLOWING),
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect(layout.singleColumn).toBe(true);
      expect(layout.figureBeforeCopy).toBe(true);
      expect(layout.portrait.bottom, 'zdjęcie przed H1 bez JS').toBeLessThanOrEqual(layout.title.top + 1);
      expect(layout.title.bottom, 'H1 przed podpisem bez JS').toBeLessThanOrEqual(layout.byline.top + 1);
      expect(layout.byline.bottom, 'podpis przed CTA bez JS').toBeLessThanOrEqual(layout.actions.top + 1);
      expect(layout.overflow).toBeLessThanOrEqual(1);
      for (const bounds of [layout.portrait, layout.title, layout.byline, layout.actions]) {
        expect(bounds.width).toBeGreaterThan(0);
        expect(bounds.height).toBeGreaterThan(0);
        expect(bounds.left).toBeGreaterThanOrEqual(-1);
        expect(bounds.right).toBeLessThanOrEqual(391);
      }
      for (const button of layout.buttons) {
        expect(button.width).toBeGreaterThanOrEqual(44);
        expect(button.height).toBeGreaterThanOrEqual(44);
      }
      // Bez JS nawigacja pozostaje rozwinięta, więc nie wymagamy całego hero nad foldem.
      await page.locator('.hero__actions a').last().click();
      await expect(page).toHaveURL(/#oferta$/);
    } finally {
      await context.close();
    }
  });

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
    // Czekamy na natywne przewinięcie do fokusu, bez ręcznego przewijania.
    // Tolerancja 1 CSS px, jak w pozostałych pomiarach: WebKit może zaokrąglić
    // pozycję przewinięcia, zachowując ułamkowy prostokąt linku (np. 320.203125).
    await expect.poll(() => page.evaluate(() => {
      const element = document.activeElement;
      const bounds = element.getBoundingClientRect();
      const hit = document.elementFromPoint((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);
      return {
        target: element.id || element.tagName,
        bounds: { top: bounds.top, right: bounds.right, bottom: bounds.bottom, left: bounds.left },
        isControl: !['BODY', 'HTML'].includes(element.tagName),
        inHiddenMenu: Boolean(element.closest('#nav-glowna')),
        belowHeader: bounds.top >= document.querySelector('.site-header').getBoundingClientRect().bottom - 1,
        onScreen: bounds.top >= -1 && bounds.bottom <= innerHeight + 1 && bounds.left >= -1 && bounds.right <= innerWidth + 1,
        unobscured: Boolean(hit && element.contains(hit)),
      };
    })).toEqual(expect.objectContaining({ isControl: true, inHiddenMenu: false, belowHeader: true, onScreen: true, unobscured: true }));
  });
});
