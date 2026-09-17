// Zrzuty ekranu opublikowanej wersji testowej (desktop hero, cała strona, mobile) do docs/screens/.
// Użycie: node tools/screens-staging.mjs [url]   (wymaga lokalnego Chrome: Playwright channel "chrome")
import { chromium, devices } from '@playwright/test';

const URL = process.argv[2] || 'https://powers-p1.github.io/przyjaciel-odyseusza/';
const OUT = 'docs/screens/';
const browser = await chromium.launch({ channel: 'chrome' });
for (const [name, ctxOpts, full] of [
  ['staging-desktop-hero', { viewport: { width: 1440, height: 900 } }, false],
  ['staging-desktop-cala-strona', { viewport: { width: 1440, height: 900 } }, true],
  ['staging-mobile-hero', { ...devices['iPhone 14'] }, false],
]) {
  const ctx = await browser.newContext({ ...ctxOpts, locale: 'pl-PL', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  if (full) {
    // przewinięcie strony, żeby obrazy lazy zdążyły się załadować
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage: full });
  console.log(`${OUT}${name}.png`);
  await ctx.close();
}
await browser.close();
