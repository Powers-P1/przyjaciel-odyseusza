import { test, expect, p } from './_fixtures.js';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function runAxe(page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  const report = results.violations.map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.length}) -> ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`).join('\n');
  return { results, serious, report };
}

test.describe('Dostępność WCAG 2.2 AA (axe-core)', () => {
  test.describe.configure({ mode: 'serial' });
  // reduced motion: sekcje .reveal są od razu w stanie docelowym (bez półprzezroczystości w trakcie animacji),
  // dzięki czemu axe mierzy rzeczywiste kolory, a nie klatkę przejścia
  test.use({ reducedMotion: 'reduce' });

  test('strona główna: brak naruszeń axe', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')));
    await page.waitForTimeout(200);
    const { results, report } = await runAxe(page);
    expect(results.violations, report).toEqual([]);
  });

  test('polityka prywatności: brak naruszeń axe', async ({ page }) => {
    await page.goto('/polityka-prywatnosci.html', { waitUntil: 'networkidle' });
    const { results, report } = await runAxe(page);
    expect(results.violations, report).toEqual([]);
  });

  test('formularz ze stanem błędu: brak naruszeń axe', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('#formularz .form__submit').click();
    await expect(page.locator('#f-name-error')).toBeVisible();
    const { results, report } = await runAxe(page);
    expect(results.violations, report).toEqual([]);
  });

  test('otwarte menu mobilne: brak naruszeń axe', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'tylko projekty mobilne');
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.nav-toggle').tap();
    const { results, report } = await runAxe(page);
    expect(results.violations, report).toEqual([]);
  });
});

test.describe('Klawiatura i focus', () => {
  test('focus głównego przycisku jest widoczny poza jego obrysem i nie zostaje przycięty', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'webkit' || testInfo.project.name === 'mobile-safari', 'WebKit domyślnie nie fokusuje linków Tabem');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const primary = page.locator('main .btn--primary').first();
    for (let i = 0; i < 30 && !(await primary.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(primary).toBeFocused();
    const indicator = await primary.evaluate((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const width = parseFloat(style.outlineWidth);
      const outset = width + parseFloat(style.outlineOffset);
      const bounds = { left: rect.left - outset, right: rect.right + outset, top: rect.top - outset, bottom: rect.bottom + outset };
      const clipping = [];
      for (let ancestor = el; ancestor; ancestor = ancestor.parentElement) {
        const css = getComputedStyle(ancestor);
        if (css.clipPath !== 'none' || css.visibility !== 'visible' || Number(css.opacity) === 0) clipping.push(ancestor.className || ancestor.tagName);
        if (ancestor === el) continue;
        const box = ancestor.getBoundingClientRect();
        if (['hidden', 'clip', 'auto', 'scroll'].includes(css.overflowX) && (bounds.left < box.left - 1 || bounds.right > box.right + 1)) clipping.push(ancestor.className || ancestor.tagName);
        if (['hidden', 'clip', 'auto', 'scroll'].includes(css.overflowY) && (bounds.top < box.top - 1 || bounds.bottom > box.bottom + 1)) clipping.push(ancestor.className || ancestor.tagName);
      }
      return { width, outset, style: style.outlineStyle, color: style.outlineColor, clipping, inViewport: bounds.top >= 0 && bounds.bottom <= innerHeight && bounds.left >= 0 && bounds.right <= innerWidth };
    });
    expect(indicator.width).toBeGreaterThanOrEqual(2);
    expect(indicator.outset).toBeGreaterThan(0);
    expect(indicator.style).not.toBe('none');
    expect(indicator.color).not.toMatch(/transparent|rgba\([^)]*,\s*0\)/);
    expect(indicator.clipping, 'element albo przodek przycina rzeczywisty obrys focusu').toEqual([]);
    expect(indicator.inViewport, 'obrys focusu mieści się w widoku').toBe(true);
  });

  test('skip link jest pierwszym elementem w kolejności focusu i działa', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'webkit' || testInfo.project.name === 'mobile-safari', 'WebKit domyślnie nie fokusuje linków Tabem');
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#tresc$/);
  });

  test('focus jest zawsze widoczny i nie ma pułapki klawiaturowej', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'webkit' || testInfo.project.name === 'mobile-safari', 'WebKit domyślnie nie fokusuje linków Tabem');
    await page.goto('/');
    const seen = [];
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName, id: el.id,
          // tekst porównywalny z widzianym: bez miękkich łączników i twardych spacji (tools/typografia.mjs)
          text: (el.textContent || '').replace(/­/g, '').replace(/ /g, ' ').trim().slice(0, 30),
          outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
          visible: r.width > 0 && r.height > 0,
          hiddenAncestor: Boolean(el.closest('[hidden], [aria-hidden="true"]')),
        };
      });
      if (!info) continue;
      seen.push(info);
      expect(info.hiddenAncestor, `ukryty element otrzymał focus: ${info.tag}#${info.id} ${info.text}`).toBeFalsy();
      expect(info.visible, `niewidoczny element z focusem: ${info.tag}#${info.id} ${info.text}`).toBeTruthy();
      expect(info.outline, `brak widocznego focusu: ${info.tag}#${info.id} ${info.text}`).toBeTruthy();
    }
    // dotarliśmy do stopki → brak pułapki
    expect(seen.some((s) => s.text.includes('Polityka prywatności'))).toBeTruthy();
    // pole honeypot nigdy nie dostaje focusu
    expect(seen.some((s) => s.id === 'f-website')).toBeFalsy();
  });

  test('formularz: wymagane pola, błędy powiązane programowo, status aria-live', async ({ page }) => {
    await page.goto('/');
    for (const id of ['f-name', 'f-email', 'f-message']) {
      const input = page.locator(`#${id}`);
      await expect(input).toHaveAttribute('required', '');
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
    await page.locator('#formularz .form__submit').click();
    for (const id of ['f-name', 'f-email', 'f-message']) {
      const input = page.locator(`#${id}`);
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toHaveAttribute('aria-describedby', `${id}-error`);
      await expect(page.locator(`#${id}-error`)).toBeVisible();
    }
    await expect(page.locator('#f-name')).toBeFocused();
    await expect(page.locator('#form-status')).toHaveAttribute('aria-live', 'polite');
  });

  test('obszary dotykowe mają co najmniej 24×24 px (WCAG 2.5.8)', async ({ page }) => {
    await page.goto('/');
    // WCAG 2.5.8 wyłącza linki w zdaniach (inline) oraz kontrolki, których cel wizualny to etykieta
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a, button, input:not([type="hidden"]), textarea, [role="button"]')]
        .filter((el) => !el.closest('[hidden], .hp') && el.getBoundingClientRect().width > 0)
        .filter((el) => {
          const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length + 5;
          return !inline;
        })
        .map((el) => (el.type === 'radio' || el.type === 'checkbox') && el.labels && el.labels[0] ? el.labels[0] : el)
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width < 24 || r.height < 24; })
        .map((el) => `${el.tagName} ${el.className} "${(el.textContent || '').trim().slice(0, 20)}"`));
    expect(small, small.join('\n')).toEqual([]);
  });

  test('prefers-reduced-motion wyłącza animacje pojawiania', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(p('/')); // strona spoza fixture: podścieżkę dokładamy ręcznie
    const opaque = await page.evaluate(() => [...document.querySelectorAll('.reveal')].every((el) => getComputedStyle(el).opacity === '1'));
    expect(opaque).toBeTruthy();
    await ctx.close();
  });
});
