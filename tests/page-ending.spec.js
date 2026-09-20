import { test, expect, ORIGIN, BASE_PATH } from './_fixtures.js';

const viewports = [
  [390, 844], [1280, 800], [1470, 820], [1920, 1080],
  [2560, 1440], [3840, 2160], [1080, 1920], [2138, 3715],
];

async function waitForLayout(page, expectedRootSize) {
  await expect.poll(() => page.evaluate(expected => {
    const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return (expected === undefined || rootSize === expected)
      && [...document.querySelectorAll('body, main, #o-mnie, #opinie, #kontakt')]
        .every(element => parseFloat(getComputedStyle(element).fontSize) === rootSize);
  }, expectedRootSize), { message: 'powiększenie tekstu zostało przeliczone także w sekcjach poniżej pierwszego ekranu' }).toBe(true);
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Zmiana rozmiaru tekstu i fontów może przebudować układ po resolve fonts.ready.
    // Mierzymy dopiero po dwóch klatkach, bez stałego opóźnienia czasowego.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function expectSectionRhythm(page) {
  const rhythm = await page.evaluate(() => {
    const about = document.querySelector('#o-mnie');
    const opinions = document.querySelector('#opinie');
    return {
      adjacent: about.nextElementSibling === opinions,
      sharedCream: about.classList.contains('band--cream') && opinions.classList.contains('band--cream'),
      gap: opinions.querySelector('.section-head').getBoundingClientRect().top
        - about.querySelector('.about').getBoundingClientRect().bottom,
      rootSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
      aboutBackground: getComputedStyle(about).backgroundColor,
      opinionsBackground: getComputedStyle(opinions).backgroundColor,
    };
  });
  expect(rhythm.adjacent, 'O mnie i Opinie pozostają sąsiednimi sekcjami').toBe(true);
  if (rhythm.sharedCream) {
    expect(rhythm.gap, 'czytelny oddech między treściami').toBeGreaterThanOrEqual(2 * rhythm.rootSize - 1);
    expect(rhythm.gap, 'sąsiednie jasne sekcje bez podwójnego dużego odstępu').toBeLessThanOrEqual(6 * rhythm.rootSize + 1);
    expect(rhythm.aboutBackground).toBe(rhythm.opinionsBackground);
  } else {
    // Wersja C oddziela te sekcje zmianą koloru; nie sklejamy różnych pasów.
    expect(rhythm.aboutBackground).not.toBe(rhythm.opinionsBackground);
    expect(rhythm.gap, 'różne pasy zachowują odstęp sekcyjny').toBeGreaterThanOrEqual(4 * rhythm.rootSize - 1);
  }
}

async function expectFullEnding(page, width) {
  let layout;
  await expect.poll(async () => {
    // Przewinięcie i całą geometrię odczytujemy razem. Późne przeliczenie układu
    // nie może rozdzielić potwierdzenia końca dokumentu od pomiaru sekcji.
    layout = await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      const box = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
      const header = box('.site-header');
      const y = Math.min(innerHeight - 1, header.bottom + 2);
      return {
        viewportHeight: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        remainingScroll: Math.abs(document.documentElement.scrollHeight - innerHeight - scrollY),
        header,
        contact: box('#kontakt'),
        opinions: box('#opinie'),
        footer: box('.site-footer'),
        footerInsideMain: Boolean(document.querySelector('main .site-footer')),
        belowHeaderIsEnding: [0.05, 0.5, 0.95].map(fraction => {
          const hit = document.elementFromPoint(innerWidth * fraction, y);
          return Boolean(hit && hit.closest('#kontakt, .site-footer'));
        }),
      };
    });
    return {
      atDocumentEnd: layout.remainingScroll <= 1,
      contactCoversTop: layout.contact.top <= layout.header.bottom + 1,
      noOpinionsBelowHeader: layout.opinions.bottom <= layout.header.bottom + 1,
      fullWidthEnding: layout.belowHeaderIsEnding.every(Boolean),
      continuousSections: Math.abs(layout.contact.bottom - layout.footer.top) <= 1,
      footerAtViewportBottom: Math.abs(layout.footer.bottom - layout.viewportHeight) <= 1,
    };
  }, { message: 'spójny pomiar pełnego zakończenia przy rzeczywistym końcu dokumentu' }).toEqual({
    atDocumentEnd: true,
    contactCoversTop: true,
    noOpinionsBelowHeader: true,
    fullWidthEnding: true,
    continuousSections: true,
    footerAtViewportBottom: true,
  });
  expect(layout.documentWidth, 'bez przewijania poziomego').toBeLessThanOrEqual(width + 1);
  expect(layout.contact.top, 'kontakt zaczyna się nad lub bezpośrednio pod sticky headerem').toBeLessThanOrEqual(layout.header.bottom + 1);
  expect(layout.opinions.bottom, 'jasne Opinie nie wystają spod nagłówka na ostatnim ekranie').toBeLessThanOrEqual(layout.header.bottom + 1);
  expect(layout.belowHeaderIsEnding, 'cała szerokość pod nagłówkiem należy do kontaktu lub stopki').toEqual([true, true, true]);
  expect(Math.abs(layout.contact.bottom - layout.footer.top), 'kontakt i stopka łączą się bez pustego pasa').toBeLessThanOrEqual(1);
  expect(Math.abs(layout.footer.bottom - layout.viewportHeight), 'stopka dochodzi do dolnej krawędzi okna').toBeLessThanOrEqual(1);
  expect(layout.footerInsideMain, 'stopka witryny pozostaje poza landmarkiem main').toBe(false);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);

  // Wysokość minimalna nie może zamienić się w przycinający kontener:
  // formularz i stopka zachowują całą treść także przy dłuższym układzie mobile.
  for (const selector of ['.contact__copy', '#formularz', '#formularz .field__input', '.form__submit', '.site-footer__inner > *']) {
    for (const element of await page.locator(selector).all()) {
      await expect(element).toBeVisible();
      const geometry = await element.evaluate(node => {
        const bounds = node.getBoundingClientRect();
        const owner = node.closest('#kontakt, .site-footer').getBoundingClientRect();
        return {
          left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom,
          ownerTop: owner.top, ownerBottom: owner.bottom,
        };
      });
      expect(geometry.left, selector + ': lewa krawędź').toBeGreaterThanOrEqual(-1);
      expect(geometry.right, selector + ': prawa krawędź').toBeLessThanOrEqual(width + 1);
      expect(geometry.top, selector + ': początek wewnątrz sekcji').toBeGreaterThanOrEqual(geometry.ownerTop - 1);
      expect(geometry.bottom, selector + ': koniec wewnątrz sekcji').toBeLessThanOrEqual(geometry.ownerBottom + 1);
    }
  }
}

test.describe('Rytm sekcji i pełne zakończenie strony', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const [width, height] of viewports) {
    test(`Opinie i Kontakt bez nadmiarowych luk przy ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await waitForLayout(page);
      await expectSectionRhythm(page);
      await expectFullEnding(page, width);
    });
  }

  for (const [width, height] of [[390, 844], [1470, 820]]) {
    test(`zakończenie zachowuje treść przy tekście 200% i ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const initialRootSize = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      await waitForLayout(page, initialRootSize * 2);
      await expectSectionRhythm(page);
      await expectFullEnding(page, width);
    });
  }

  for (const [width, height] of [[390, 844], [1920, 1080]]) {
    test(`zakończenie działa bez JavaScriptu przy ${width}×${height}`, async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false, viewport: { width, height }, reducedMotion: 'reduce',
      });
      try {
        const page = await context.newPage();
        await page.goto(ORIGIN + BASE_PATH + '/');
        await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded');
        await expectSectionRhythm(page);
        await expectFullEnding(page, width);
      } finally {
        await context.close();
      }
    });
  }
});
