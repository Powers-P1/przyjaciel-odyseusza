import { test, expect } from './_fixtures.js';

const WIDTHS = [768, 959, 960, 1024, 1280];
const SPACING_WIDTHS = [768, 960, 1024];
const USER_SPACING = '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }';

async function loadHeader(page, width, spacing = false) {
  await page.setViewportSize({ width, height: 1024 });
  await page.goto('/');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await document.querySelector('.brand__logo').decode();
  });
  if (spacing) await page.addStyleTag({ content: USER_SPACING });
}

async function expectHeaderGeometry(page) {
  const geometry = await page.evaluate(() => {
    const header = document.querySelector('.site-header');
    const logo = header.querySelector('.brand__logo');
    const logoBox = logo.getBoundingClientRect();
    const controls = [...header.querySelectorAll('.brand, .nav-toggle, .site-nav a')]
      .map((element) => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          label: element.getAttribute('aria-label') || element.textContent.trim() || element.className,
          left: box.left, right: box.right, top: box.top, bottom: box.bottom,
          width: box.width, height: box.height,
          visible: box.width > 0 && box.height > 0 && style.visibility !== 'hidden',
        };
      })
      .filter((control) => control.visible);
    const collisions = [];
    for (let first = 0; first < controls.length; first += 1) {
      for (let second = first + 1; second < controls.length; second += 1) {
        const a = controls[first];
        const b = controls[second];
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapX > 1 && overlapY > 1) collisions.push(a.label + ' / ' + b.label);
      }
    }
    return {
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      logoLoaded: logo.complete && logo.naturalWidth > 0,
      logoWidth: logoBox.width,
      logoHeight: logoBox.height,
      expectedLogoWidth: logoBox.height * logo.naturalWidth / logo.naturalHeight,
      outsideViewport: controls.filter((control) => control.left < -1 || control.right > document.documentElement.clientWidth + 1).map((control) => control.label),
      collisions,
    };
  });

  expect(geometry.pageOverflow, 'poziome przewijanie strony').toBeLessThanOrEqual(1);
  expect(geometry.logoLoaded, 'logo musi być załadowane').toBe(true);
  expect(geometry.logoWidth, 'logo nie może zniknąć').toBeGreaterThan(0);
  expect(geometry.logoHeight, 'logo nie może zniknąć').toBeGreaterThan(0);
  expect(Math.abs(geometry.logoWidth - geometry.expectedLogoWidth), 'flex nie może deformować naturalnych proporcji logo').toBeLessThanOrEqual(0.5);
  expect(geometry.outsideViewport, 'kontrolki nagłówka poza poziomą krawędzią ekranu').toEqual([]);
  expect(geometry.collisions, 'logo, menu i linki nie mogą na siebie nachodzić').toEqual([]);
}

async function activate(locator, testInfo) {
  if (testInfo.project.use.hasTouch) await locator.tap();
  else await locator.click();
}

test.describe('Responsywny nagłówek: proporcje, czytelność i granica menu', () => {
  // Nadpisanie odstępów symuluje ustawienia użytkownika, nie style witryny.
  test.use({ reducedMotion: 'reduce', bypassCSP: true });

  for (const [width, spacing] of [
    ...WIDTHS.map((width) => [width, false]),
    ...SPACING_WIDTHS.map((width) => [width, true]),
  ]) {
    test(`nagłówek przy ${width}px${spacing ? ' z odstępami użytkownika WCAG 1.4.12' : ''}`, async ({ page }, testInfo) => {
      await loadHeader(page, width, spacing);
      await expectHeaderGeometry(page);
      const toggle = page.locator('.nav-toggle');
      const nav = page.locator('#nav-glowna');

      if (width < 960) {
        await expect(toggle).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(nav).toBeHidden();
        const target = await toggle.boundingBox();
        expect(target.width, 'cel dotykowy menu: szerokość co najmniej 44 px').toBeGreaterThanOrEqual(44);
        expect(target.height, 'cel dotykowy menu: wysokość co najmniej 44 px').toBeGreaterThanOrEqual(44);
        await activate(toggle, testInfo);
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(nav).toBeVisible();
        await expectHeaderGeometry(page);
        await activate(nav.locator('a[href="#oferta"]'), testInfo);
        await expect(page).toHaveURL(/#oferta$/);
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(nav).toBeHidden();
      } else {
        await expect(toggle).toBeHidden();
        await expect(nav).toBeVisible();
      }
    });
  }

  test('otwarte menu resetuje się po przejściu 834 → 1024 → 834 px', async ({ page }, testInfo) => {
    await loadHeader(page, 834);
    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#nav-glowna');
    await activate(toggle, testInfo);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toHaveClass(/\bis-open\b/);

    await page.setViewportSize({ width: 1024, height: 1024 });
    await expect(toggle).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).not.toHaveClass(/\bis-open\b/);
    await expect(nav).toBeVisible();
    await expectHeaderGeometry(page);

    await page.setViewportSize({ width: 834, height: 1024 });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
    await activate(toggle, testInfo);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await expectHeaderGeometry(page);
    await activate(toggle, testInfo);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
  });
});

