// Testy na opublikowanym adresie testowym (GitHub Pages, podkatalog) – te same specyfikacje co `npm test`,
// z podścieżką bazową i bez testów zależnych od Cloudflare (nagłówki _headers, funkcja /api/contact).
//   npm run test:staging                                       → https://powers-p1.github.io/przyjaciel-odyseusza/
//   STAGING_URL=https://inny.adres/podkatalog/ npm run test:staging → inny hosting testowy
import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

const url = process.env.STAGING_URL || 'https://powers-p1.github.io/przyjaciel-odyseusza/';
process.env.STAGING_URL = url; // widoczne w testach (tests/_fixtures.js)

export default defineConfig({
  ...base,
  testIgnore: [], // bazowa konfiguracja jest importowana przed ustawieniem STAGING_URL, więc odblokowujemy staging.spec.js jawnie
  use: { ...base.use, baseURL: new URL(url).origin },
  webServer: undefined,
});
