import { test, expect, ORIGIN, BASE_PATH, tekstWidoczny } from './_fixtures.js';

const entries = [
  ['Grupa CEDC', ['dyrektor sprzedaży']],
  ['Grupa Eurocash', ['dyrektor operacyjny']],
  ['Premium Cigars', ['dyrektor generalny i prezes zarządu']],
  ['Herbapol Lublin S.A. (Grupa Polpharma)', ['dyrektor kanałów sprzedaży']],
  ['Uniwersytet SWPS', ['magister psychologii (2004)', 'program „Psychologia i Coaching od podstaw”']],
  ['SGH', ['studia podyplomowe z przywództwa']],
];

async function expectAbout(page, width, javaScriptEnabled = true) {
  const section = page.locator('#o-mnie');
  await section.scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded');
  await expect.poll(() => section.locator('.about__figure img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  if (javaScriptEnabled) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  const copy = section.locator('.about__copy');
  const credentials = section.locator('.about__credentials');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Praktyk biznesu i psycholog');
  await expect(credentials.getByRole('heading', { level: 3 })).toHaveText(['Doświadczenie', 'Wykształcenie']);
  await expect(copy.locator('dl')).toHaveCount(0);
  await expect(copy.locator('p').filter({ hasText: /^Od ponad/ })).toHaveCount(1);
  const normalized = value => tekstWidoczny(value).replace(/\s+/g, ' ').trim();
  expect(normalized(await copy.locator('p').last().textContent())).toBe(
    'Od ponad 20 lat pracuję w zarządzaniu. Kierowałem sprzedażą i operacjami w firmach FMCG. Dziś łączę tę praktykę z wykształceniem psychologicznym.',
  );
  const groups = credentials.locator(':scope > div');
  await expect(groups.nth(0).locator('.cv__row')).toHaveCount(4);
  await expect(groups.nth(1).locator('.cv__row')).toHaveCount(2);
  const actual = await credentials.locator('.cv__row').evaluateAll(rows => rows.map(row => [
    row.querySelector('dt').textContent, [...row.querySelectorAll('dd')].map(node => node.textContent),
  ]));
  expect(actual.map(([name, descriptions]) => [normalized(name), descriptions.map(normalized)]),
    'zwarty układ zachowuje pełną treść sześciu wpisów B').toEqual(entries);

  // Spójna migawka po załadowaniu fontów i portretu: bez mieszania różnych klatek.
  const geometry = await section.evaluate(element => {
    const box = node => node.getBoundingClientRect().toJSON();
    const rect = selector => box(element.querySelector(selector));
    const photograph = element.querySelector('.about__figure img');
    const photo = box(photograph);
    return {
      rootSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
      background: getComputedStyle(element).backgroundColor,
      layout: rect('.about'), intro: rect('.about__copy'),
      portrait: rect('.about__figure'), qualifications: rect('.about__credentials'),
      groups: [...element.querySelectorAll('.about__credentials > div')].map(box),
      rows: [...element.querySelectorAll('.cv__row')].map(row => ({
        name: box(row.querySelector('dt')), descriptions: [...row.querySelectorAll('dd')].map(box),
      })),
      content: [...element.querySelectorAll('.about__copy, .about__figure, .about__credentials, .cv__row')].map(box),
      photoRatio: (photo.width / photo.height) / (photograph.naturalWidth / photograph.naturalHeight),
      documentWidth: document.documentElement.scrollWidth,
    };
  });
  const { layout, intro, portrait, qualifications } = geometry;
  expect(geometry.background, 'wersja B zachowuje kremowe tło').toBe('rgb(243, 238, 229)');
  if (width < 896) {
    expect(Math.abs(qualifications.width - layout.width), 'mobile: kwalifikacje na całą kolumnę').toBeLessThanOrEqual(1);
    expect(portrait.top, 'mobile: portret po wprowadzeniu').toBeGreaterThanOrEqual(intro.bottom - 1);
    expect(qualifications.top, 'mobile: kwalifikacje po portrecie').toBeGreaterThanOrEqual(portrait.bottom - 1);
  } else {
    expect(Math.abs(qualifications.left - intro.left), 'desktop: wspólna lewa krawędź biografii i kwalifikacji').toBeLessThanOrEqual(1);
    expect(Math.abs(qualifications.width - intro.width), 'desktop: kwalifikacje w kolumnie tekstowej').toBeLessThanOrEqual(1);
    expect(qualifications.top, 'kwalifikacje po biografii').toBeGreaterThanOrEqual(intro.bottom - 1);
    expect(portrait.left, 'portret po prawej, bez nałożenia na tekst').toBeGreaterThanOrEqual(intro.right + 1);
    expect(portrait.top, 'portret sąsiaduje z kwalifikacjami').toBeLessThan(qualifications.bottom - 1);
    expect(portrait.bottom, 'portret obejmuje także wiersz kwalifikacji').toBeGreaterThan(qualifications.top + 1);
  }
  const [first, second] = geometry.groups;
  if (width < 768) {
    expect(second.top, 'wykształcenie pod doświadczeniem').toBeGreaterThanOrEqual(first.bottom - 1);
  } else {
    expect(Math.abs(first.top - second.top), 'nagłówki kwalifikacji w jednej linii').toBeLessThanOrEqual(1);
    expect(second.left).toBeGreaterThan(first.right);
  }
  for (const row of geometry.rows) {
    let previousBottom = row.name.bottom;
    for (const description of row.descriptions) {
      expect(description.top, 'opis pod nazwą instytucji').toBeGreaterThanOrEqual(previousBottom - 1);
      expect(Math.abs(row.name.left - description.left)).toBeLessThanOrEqual(1);
      previousBottom = description.bottom;
    }
  }
  for (const bounds of geometry.content) {
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
    expect(bounds.left, 'treść wewnątrz sekcji').toBeGreaterThanOrEqual(layout.left - 1);
    expect(bounds.right).toBeLessThanOrEqual(layout.right + 1);
    expect(bounds.top).toBeGreaterThanOrEqual(layout.top - 1);
    expect(bounds.bottom).toBeLessThanOrEqual(layout.bottom + 1);
  }
  expect(portrait.width, 'portret zachowuje limit 26rem').toBeLessThanOrEqual(26 * geometry.rootSize + 1);
  expect(Math.abs(geometry.photoRatio - 1), 'proporcje fotografii').toBeLessThan(.01);
  expect(geometry.documentWidth, 'brak przewijania poziomego').toBeLessThanOrEqual(width + 1);
}

test.describe('O mnie B: kwalifikacje zintegrowane obok portretu', () => {
  test.use({ reducedMotion: 'reduce' });
  for (const [width, height] of [
    [320, 900], [390, 900], [834, 900], [1024, 900],
    [1440, 900], [1920, 1080], [2560, 1440], [3840, 2160],
  ]) {
    test('układ i pełna treść przy ' + width + '×' + height, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await expectAbout(page, width);
    });
  }
  for (const width of [390, 1470]) {
    test('tekst 200% pozostaje czytelny przy ' + width + 'px', async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('html, body, #o-mnie, .about, .about__credentials')]
        .every(element => parseFloat(getComputedStyle(element).fontSize) === 32)), {
        message: 'tekst 200% został przeliczony także w sekcji O mnie',
      }).toBe(true);
      await expectAbout(page, width);
    });
  }
  for (const [width, height] of [[390, 844], [1920, 1080]]) {
    test('układ nie wymaga JavaScriptu przy ' + width + '×' + height, async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false, viewport: { width, height }, reducedMotion: 'reduce',
      });
      try {
        const page = await context.newPage();
        await page.goto(ORIGIN + BASE_PATH + '/');
        await expectAbout(page, width, false);
      } finally {
        await context.close();
      }
    });
  }
});
