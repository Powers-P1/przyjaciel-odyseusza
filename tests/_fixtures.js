// Wspólne ustawienia testów. Domyślnie testy biegną na lokalnej emulacji Cloudflare Pages (wrangler, katalog główny).
// Z playwright.staging.config.js (PW_STAGING_URL, np. GitHub Pages: https://powers-p1.github.io/przyjaciel-odyseusza/)
// strona leży w podkatalogu, więc `page.goto('/')` i `request.get('/robots.txt')` są automatycznie uzupełniane
// o podścieżkę, a adresy kanoniczne (canonical, OG, JSON-LD) mają wskazywać adres testowy zamiast produkcyjnego.
import { test as base, expect } from '@playwright/test';

export const STAGING_URL = process.env.PW_STAGING_URL || '';
export const STAGING = Boolean(STAGING_URL);
const parsed = STAGING ? new URL(STAGING_URL) : null;
export const ORIGIN = parsed ? parsed.origin : 'http://127.0.0.1:8788';
export const BASE_PATH = parsed ? parsed.pathname.replace(/\/+$/, '') : '';
// adres, który ma stać w canonical/og:url/JSON-LD/llms.txt (bez końcowego ukośnika)
export const SITE = parsed ? ORIGIN + BASE_PATH : 'https://przyjacielodyseusza.pl';
// wariant w podkatalogu drugiego poziomu (np. /repo/wersja-b/) dzieli stronę 404 z wersją główną:
// GitHub Pages serwuje jeden 404.html dla całej witryny, więc jej treści i linków nie testujemy per wariant
export const SHARED_404 = BASE_PATH.split('/').length > 2;
export const PAGES_404 = SHARED_404 ? [] : ['/nie-istnieje-404'];

/**
 * Sprowadza tekst ze strony do postaci porównywalnej z tym, co widzi człowiek:
 * twarde spacje (&nbsp;) na zwykłe, miękkie łączniki (&shy;) usunięte.
 * Oba wstawia tools/typografia.mjs, więc żadna asercja na treści nie może ich zakładać.
 */
export function tekstWidoczny(text) {
  return text.replace(/&nbsp;| /g, ' ').replace(/&shy;|­/g, '');
}

/** Dokleja podścieżkę bazową do adresu względem katalogu głównego; adresy już uzupełnione i absolutne zostawia. */
export function p(url) {
  if (typeof url !== 'string' || !BASE_PATH || !url.startsWith('/') || url.startsWith('//')) return url;
  if (url.startsWith(BASE_PATH) && /^($|[/?#])/.test(url.slice(BASE_PATH.length))) return url; // już z podścieżką
  return BASE_PATH + url;
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = (url, options) => goto(p(url), options);
    await use(page);
  },
  request: async ({ request }, use) => {
    for (const method of ['get', 'post', 'head', 'fetch', 'put', 'patch', 'delete']) {
      const original = request[method].bind(request);
      request[method] = (url, options) => original(p(url), options);
    }
    await use(request);
  },
});

export { expect };
