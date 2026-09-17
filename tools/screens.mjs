// Zrzuty ekranu strony (lokalnie albo z opublikowanego adresu) do docs/screens/: hero na typowych
// rozdzielczościach desktopu, cała strona i widok iPhone'a. Wymaga lokalnego Chrome (Playwright channel "chrome").
// Użycie: node tools/screens.mjs [url] [prefiks]
//   node tools/screens.mjs                                              → http://127.0.0.1:8788/, prefiks "local"
//   node tools/screens.mjs https://powers-p1.github.io/przyjaciel-odyseusza/ staging
import { chromium, devices } from '@playwright/test';

const url = process.argv[2] || 'http://127.0.0.1:8788/';
const prefix = process.argv[3] || 'local';
const OUT = 'docs/screens/';
const SHOTS = [
  ['desktop-1440-hero', { viewport: { width: 1440, height: 900 } }, false],
  ['desktop-1920-hero', { viewport: { width: 1920, height: 1080 } }, false],
  ['laptop-1366-hero', { viewport: { width: 1366, height: 768 } }, false],
  ['desktop-cala-strona', { viewport: { width: 1440, height: 900 } }, true],
  ['mobile-hero', { ...devices['iPhone 14'] }, false],
];

const browser = await chromium.launch({ channel: 'chrome' });
for (const [name, contextOptions, fullPage] of SHOTS) {
  const context = await browser.newContext({ ...contextOptions, locale: 'pl-PL', reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  if (fullPage) {
    // przewinięcie strony, żeby obrazy lazy zdążyły się załadować
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);
  }
  const path = `${OUT}${prefix}-${name}.png`;
  await page.screenshot({ path, fullPage });
  console.log(path);
  await context.close();
}
await browser.close();
