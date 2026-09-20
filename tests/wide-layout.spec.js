import { test, expect } from './_fixtures.js';

const viewports = [
  [1470, 820], [1599, 900], [1600, 900], [1920, 1080],
  [2560, 1440], [2694, 1346], [3840, 2160], [5120, 1440],
];
const containers = [
  '.site-header__inner', '.hero__grid', '#oferta > .container',
  '#o-mnie > .container', '#kontakt > .container', '.site-footer__inner',
];

async function expectScaledIcons(page) {
  const icons = await page.evaluate(() => {
    const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return [
      ['.principle__icon svg', 1.75], ['.situation__icon svg', 2],
      ['.mode__icon', 3], ['.testimonial-slider__button svg', 1.5],
    ].flatMap(([selector, scale]) => [...document.querySelectorAll(selector)].map(element => {
      const rect = element.getBoundingClientRect();
      return { selector, width: rect.width, height: rect.height, expected: scale * rootSize };
    })).filter(icon => icon.width > 0 && icon.height > 0);
  });
  expect(icons.length, 'sprawdzane ikony widoczne w danym wariancie').toBeGreaterThanOrEqual(3);
  for (const icon of icons) {
    expect(Math.abs(icon.width - icon.expected), icon.selector + ': szerokość skaluje się z tekstem').toBeLessThanOrEqual(1);
    expect(Math.abs(icon.height - icon.expected), icon.selector + ': wysokość skaluje się z tekstem').toBeLessThanOrEqual(1);
  }
}

test.describe('Szeroki desktop: skala całej strony i miara tekstu', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const [width, height] of viewports) {
    test(`wspólna szerokość sekcji i czytelny tekst przy ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const expectedFontSize = width < 1600 ? 16 : Math.min(32, Math.max(16, Math.min(width / 120, height / 60)));
      // Gecko kwantyzuje użyty rozmiar kroju (np. 21.3333 → 21.3125 px).
      // Tolerancja 0.05 px obejmuje tę różnicę, nie zmianę skali projektu.
      await expect.poll(() => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize)), {
        message: 'skala tekstu rośnie płynnie do 200%, z ograniczeniem dla niskich ekranów ultrawide',
      }).toBeCloseTo(expectedFontSize, 1);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });

      const layout = await page.evaluate(selectors => {
        const paragraphs = document.querySelectorAll([
          '#oferta .mode p', '#o-mnie .about__copy > p:not(.about__name, .eyebrow)',
          '#kontakt .contact__copy > p:not(.eyebrow)',
        ].join(', '));
        return {
          availableWidth: document.documentElement.clientWidth,
          documentWidth: document.documentElement.scrollWidth,
          rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
          measure: getComputedStyle(document.documentElement).getPropertyValue('--miara').trim(),
          containers: selectors.map(selector => {
            const { left, right, width: elementWidth } = document.querySelector(selector).getBoundingClientRect();
            return { selector, left, right, width: elementWidth };
          }),
          paragraphs: [...paragraphs].map(element => {
            const style = getComputedStyle(element);
            // Mierzymy natywne CSS ch w dziedziczonym kroju: metryki Canvas
            // nie muszą być identyczne z silnikiem składu tekstu (np. w Gecko).
            const measure = document.createElement('span');
            Object.assign(measure.style, { position: 'absolute', display: 'block', width: '58ch', height: '0' });
            element.append(measure);
            const readableWidth = measure.getBoundingClientRect().width;
            measure.remove();
            return {
              label: element.textContent.trim().slice(0, 55),
              width: element.getBoundingClientRect().width,
              fontSize: parseFloat(style.fontSize),
              maxWidth: parseFloat(style.maxWidth),
              readableWidth,
            };
          }),
        };
      }, containers);

      // Rozmiar rem bierze zweryfikowaną, używaną przez dany silnik wartość.
      // Błąd kwantyzacji kroju pomnożony przez 168 nie jest błędem kontenera.
      const expectedWidth = Math.min(168 * layout.rootFontSize, Math.max(74 * layout.rootFontSize, 0.88 * width));
      expect(layout.documentWidth, 'szersza kompozycja nie powoduje poziomego przewijania').toBeLessThanOrEqual(width + 1);
      for (const container of layout.containers) {
        expect(Math.abs(container.width - expectedWidth), container.selector + ': nowa wspólna szerokość').toBeLessThanOrEqual(1);
        expect(Math.abs(container.left - (layout.availableWidth - expectedWidth) / 2), container.selector + ': wyśrodkowanie').toBeLessThanOrEqual(1);
        expect(container.left, container.selector + ': lewa krawędź').toBeGreaterThanOrEqual(-1);
        expect(container.right, container.selector + ': prawa krawędź').toBeLessThanOrEqual(width + 1);
      }
      expect(layout.measure, 'szerokość kontenera nie wydłuża miary akapitów').toBe('58ch');
      expect(layout.paragraphs.length, 'sprawdzane akapity oferty, biografii i kontaktu').toBeGreaterThanOrEqual(5);
      for (const paragraph of layout.paragraphs) {
        expect(paragraph.fontSize, paragraph.label + ': tekst nie zostaje drobny na większym ekranie').toBeGreaterThanOrEqual(expectedFontSize * 0.9 - 0.05);
        expect(Number.isFinite(paragraph.maxWidth), paragraph.label + ': jawny limit długości wiersza').toBe(true);
        expect(paragraph.maxWidth, paragraph.label + ': limit najwyżej 58ch').toBeLessThanOrEqual(paragraph.readableWidth + 1);
        expect(paragraph.width, paragraph.label + ': rzeczywista szerokość akapitu najwyżej 58ch').toBeLessThanOrEqual(paragraph.readableWidth + 1);
      }
      await expectScaledIcons(page);
      if (width === 3840 && await page.locator('.principles__list').count()) {
        const columns = await page.locator('.principles__list').evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length);
        expect(columns, 'sześć zasad zachowuje czytelny układ 3×2 na 4K').toBe(3);
      }
    });
  }

  test('ikony i zasady reagują na tekst 200% przy 1470×820', async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 820 });
    await page.goto('/');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('html, body, .band')]
      .every(element => parseFloat(getComputedStyle(element).fontSize) === 32)), {
      message: 'tekst 200% został przeliczony w dokumencie',
    }).toBe(true);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    if (await page.locator('.principles__list').count()) {
      const columns = await page.locator('.principles__list').evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length);
      expect([1, 2], 'większy tekst przechodzi do jednej lub dwóch kolumn, zamiast być ściskany').toContain(columns);
    }
    await expectScaledIcons(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), 'brak przewijania poziomego przy większym tekście').toBeLessThanOrEqual(1471);
  });
});
