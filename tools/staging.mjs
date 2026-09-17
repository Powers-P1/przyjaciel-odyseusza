// Wariant testowy strony dla hostingu statycznego w podkatalogu (GitHub Pages: https://<konto>.github.io/<repo>/).
// Z gotowego public/ (po `npm run build`) tworzy dist-gh/:
//  - każdy adres względem katalogu głównego dostaje podścieżkę bazową (/assets/… → /<repo>/assets/…),
//  - adresy produkcyjne https://przyjacielodyseusza.pl → adres testowy (canonical, OG, JSON-LD, llms.txt, security.txt),
//  - meta robots „noindex, nofollow” na każdej stronie; robots.txt bez sitemapy; sitemap.xml pominięta,
//  - .nojekyll (GitHub Pages nie uruchamia Jekylla i serwuje .well-known/),
//  - bez _headers i _redirects (GitHub Pages ich nie obsługuje: brak nagłówków bezpieczeństwa i funkcji /api/contact).
// Użycie: STAGING_URL=https://powers-p1.github.io/przyjaciel-odyseusza/ node tools/staging.mjs [--out dist-gh]
// Domyślny adres (bez STAGING_URL): https://powers-p1.github.io/przyjaciel-odyseusza/
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
export const DEFAULT_STAGING_URL = 'https://powers-p1.github.io/przyjaciel-odyseusza/';

const url = new URL(opt('--url', process.env.STAGING_URL || DEFAULT_STAGING_URL));
const out = opt('--out', 'dist-gh');
const SRC = 'public';
const base = url.pathname.replace(/\/+$/, ''); // '/przyjaciel-odyseusza' albo '' (hosting w katalogu głównym)
const site = url.origin + base; // bez końcowego ukośnika
const PROD = ['https://www.przyjacielodyseusza.pl', 'https://przyjacielodyseusza.pl'];
const TEXT = /\.(html|css|js|txt|xml|webmanifest|json|svg)$/i;
const SKIP = new Set(['_headers', '_redirects', 'sitemap.xml']);

const ROBOTS_META = '<meta name="robots" content="noindex, nofollow">';
const ROBOTS_TXT = [
  '# Wersja testowa (hosting w podkatalogu). Każda strona ma meta robots „noindex, nofollow”.',
  '# Roboty mogą wejść, żeby zobaczyć noindex; sitemapy celowo nie ma. Produkcyjny robots.txt: public/robots.txt.',
  'User-agent: *',
  'Allow: /',
  '',
].join('\n');

function rewrite(text, name) {
  for (const prod of PROD) text = text.split(prod).join(site);
  if (!base) return text;
  if (/\.html$/i.test(name)) {
    text = text
      .replace(/\b(href|src|action|content|poster)="\/(?!\/)/g, `$1="${base}/`)
      .replace(/\bsrcset="([^"]*)"/g, (m, list) => `srcset="${list.replace(/(^|,\s*)\/(?!\/)/g, `$1${base}/`)}"`)
      .replace(/url\((['"]?)\/(?!\/)/g, `url($1${base}/`);
  } else if (/\.css$/i.test(name)) {
    text = text.replace(/url\((['"]?)\/(?!\/)/g, `url($1${base}/`);
  } else if (/\.(webmanifest|json)$/i.test(name)) {
    text = text.replace(/("(?:src|start_url|scope|id)":\s*")\/(?!\/)/g, `$1${base}/`);
  }
  return text;
}

function robotsMeta(html) {
  if (/<meta name="robots"/.test(html)) html = html.replace(/<meta name="robots" content="[^"]*">/, ROBOTS_META);
  else html = html.replace(/(<meta name="viewport"[^>]*>)/, `$1\n  ${ROBOTS_META}`);
  // stempel wersji (BUILD_ID = SHA commitu w CI): pozwala sprawdzić, czy CDN podaje już właśnie wdrożoną wersję
  return html.replace('</head>', `  <!-- wersja testowa, build ${process.env.BUILD_ID || 'lokalny'} -->\n</head>`);
}

function check(html, file) {
  const problems = [];
  if (base) {
    // po `="/` zostaje podścieżka bez wiodącego ukośnika, np. `przyjaciel-odyseusza/`
    const inner = base.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const m of html.matchAll(new RegExp(`\\b(href|src|action|poster)="/(?!${inner}/)[^"]*"`, 'g'))) problems.push(`${m[0]} (bez podścieżki)`);
    for (const m of html.matchAll(new RegExp(`url\\(['"]?/(?!${inner}/)[^)]*\\)`, 'g'))) problems.push(`${m[0]} (bez podścieżki)`);
    for (const m of html.matchAll(/\bsrcset="([^"]*)"/g)) {
      for (const src of m[1].split(',')) if (src.trim().startsWith('/') && !src.trim().startsWith(base + '/')) problems.push(`srcset ${src.trim()} (bez podścieżki)`);
    }
  }
  for (const prod of PROD) if (html.includes(prod)) problems.push(`został adres produkcyjny ${prod}`);
  if (!html.includes(ROBOTS_META)) problems.push('brak meta robots noindex');
  if (problems.length) throw new Error(`${file}:\n  ${problems.join('\n  ')}`);
}

fs.rmSync(out, { recursive: true, force: true });
let files = 0;
let changed = 0;
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const from = path.join(dir, entry.name);
    const to = path.join(out, path.relative(SRC, from));
    if (entry.isDirectory()) { walk(from); continue; }
    if (SKIP.has(entry.name)) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    files++;
    if (!TEXT.test(entry.name)) { fs.copyFileSync(from, to); continue; }
    const before = fs.readFileSync(from, 'utf8');
    let after;
    if (entry.name === 'robots.txt') after = ROBOTS_TXT;
    else if (entry.name === 'llms.txt') after = rewrite(before, entry.name).replace(/\n## Opcjonalnie\n[\s\S]*?(?=\n## |\s*$)/, '').trimEnd() + '\n'; // sekcja z sitemapą, której na hostingu testowym nie ma
    else {
      after = rewrite(before, entry.name);
      if (/\.html$/i.test(entry.name)) { after = robotsMeta(after); check(after, to); }
    }
    if (after !== before) changed++;
    fs.writeFileSync(to, after);
  }
})(SRC);
fs.writeFileSync(path.join(out, '.nojekyll'), '');

console.log(`${out}/: ${files} plików (${changed} przepisanych), adres testowy ${site}/, podścieżka „${base || '/'}”, noindex na każdej stronie`);
