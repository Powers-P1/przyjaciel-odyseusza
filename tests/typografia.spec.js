import { test, expect } from './_fixtures.js';

const WIDTHS = [320, 390, 834, 1280, 1600];
const PAGES = ['/', '/polityka-prywatnosci'];
const BLOCKS = 'main p, main li, main dt, main dd, main h1, main h2, main h3, main h4, footer p, .testimonial footer';

// Mierzymy zwykłe słowa także po obu stronach NBSP. Sama obecność twardej spacji
// w HTML nie dowodzi, że użytkownik widzi prawidłowo złamany, nieprzepełniony tekst.
function inspectText(selector) {
  const orphans = [];
  const overflow = [];
  for (const element of document.querySelectorAll(selector)) {
    if (element.querySelector('p, li, ul, ol, dl, div, h1, h2, h3, h4')) continue;
    if (element.closest('nav, .btn, [hidden], [aria-hidden="true"]')) continue;
    if (!element.getBoundingClientRect().height) continue;
    let bounds = { left: 0, right: document.documentElement.clientWidth };
    const track = element.closest('.testimonials--slider');
    const card = track && element.closest('.testimonial');
    if (card) {
      // Karty poza widokiem są celowo w poziomym obszarze przewijania.
      // Każde słowo nadal musi mieścić się w swojej karcie i w treści tracka.
      const cardRect = card.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      const style = getComputedStyle(card);
      const contentLeft = trackRect.left + track.clientLeft - track.scrollLeft;
      bounds = {
        left: Math.max(contentLeft, cardRect.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft)),
        right: Math.min(contentLeft + track.scrollWidth, cardRect.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight)),
      };
    }
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const lines = [];
    let node;
    while ((node = walker.nextNode())) {
      for (const match of node.nodeValue.matchAll(/\S+/g)) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        for (const rect of range.getClientRects()) {
          if (!rect.width || !rect.height) continue;
          if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1) {
            overflow.push(`${element.tagName}.${element.className}: ${match[0]}`);
          }
          const previous = lines.at(-1);
          if (previous && Math.abs(rect.top - previous.top) < 5) previous.words.push(match[0]);
          else lines.push({ top: rect.top, words: [match[0]] });
        }
      }
    }
    for (const line of lines.slice(0, -1)) {
      const last = line.words.at(-1).replace(/^[„“"'(«]+|[.,;:!?”"')»]+$/gu, '');
      if (/^[aiouwz]$/iu.test(last)) {
        orphans.push(`${element.tagName}.${element.className}: ${line.words.join(' ')}`);
      }
    }
  }
  return { orphans, overflow, pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
}

test.describe('Czytelny skład i swobodne przełamywanie tekstu', () => {
  // Arkusz odstępów odpowiada nadpisaniu przez użytkownika; nie jest kodem witryny.
  test.use({ reducedMotion: 'reduce', bypassCSP: true });

  for (const url of PAGES) {
    for (const width of WIDTHS) {
      for (const spacing of [false, true]) {
        test(`${url}, ${width}px${spacing ? ', odstępy użytkownika WCAG 1.4.12' : ''}: tekst mieści się i nie zostawia jednoliterowych wyrazów`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(url);
          await page.evaluate(() => document.fonts.ready);
          if (spacing) {
            await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
          }
          const result = await page.evaluate(inspectText, BLOCKS);
          expect(result.pageOverflow, 'poziome przewijanie strony').toBeLessThanOrEqual(1);
          expect(result.overflow, 'tekst wychodzący poza ekran lub kartę slidera').toEqual([]);
          expect(result.orphans, 'jednoliterowy wyraz na końcu wiersza').toEqual([]);
        });
      }
    }
  }

  test('zmiana szerokości nie odbiera focusu ani nie wymienia linku w akapicie', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('.form__privacy a').first();
    await link.focus();
    const original = await link.elementHandle();
    for (const width of [390, 1280, 320, 834]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(link).toBeFocused();
      expect(await original.evaluate((element) => element.isConnected && element === document.activeElement)).toBe(true);
    }
    await original.dispose();
  });
});
