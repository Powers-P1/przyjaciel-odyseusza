// Konfiguracja testów automatycznych (checklista, sekcja 15).
// Serwer testowy: `wrangler pages dev` – lokalna emulacja Cloudflare Pages
// (nagłówki z _headers, przekierowania z _redirects, funkcja /api/contact, strona 404 ze statusem 404).
import { defineConfig, devices } from '@playwright/test';

const PORT = 8788;
export const BASE_URL = `http://127.0.0.1:${PORT}`;
// Windows: przy długiej ścieżce projektu workerd nie otwiera bazy stanu (SQLITE_CANTOPEN).
// Ustaw WRANGLER_PERSIST_TO na krótką ścieżkę, np. C:\Temp\wrangler-state.
const PERSIST = process.env.WRANGLER_PERSIST_TO ? ` --persist-to "${process.env.WRANGLER_PERSIST_TO}"` : '';

export default defineConfig({
  testDir: './tests',
  // sprawdzenia hostingu testowego w podkatalogu biegną tylko z playwright.staging.config.js
  testIgnore: ['**/staging.spec.js'],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 1, // pojedyncza powtórka łapie sporadyczne błędy zamykania kontekstu w Firefox/WebKit (nie dotyczą strony)
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
  },
  webServer: {
    command: `npx wrangler pages dev --port ${PORT} --ip 127.0.0.1 --log-level warn${PERSIST}`,
    url: `${BASE_URL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
