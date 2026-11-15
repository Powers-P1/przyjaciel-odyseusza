// Produkcja: formularz z Turnstile i SMTP OVH, kontakt bezpośredni i brak opinii demonstracyjnych.
import fs from 'node:fs';
import path from 'node:path';
import { configureAnalytics } from './analytics-config.mjs';

const output = path.resolve('dist-cf');
if (path.dirname(output) !== process.cwd() || path.basename(output) !== 'dist-cf') {
  throw new Error('Nieprawidłowy katalog artefaktu produkcyjnego');
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
fs.cpSync('public', output, { recursive: true });
const indexPath = `${output}/index.html`;
let html = fs.readFileSync(indexPath, 'utf8');
function replaceOnce(pattern, replacement, label) {
  if ([...html.matchAll(new RegExp(pattern.source, 'g'))].length !== 1) {
    throw new Error(`Produkcja: oczekiwano dokładnie jednego elementu ${label}`);
  }
  html = html.replace(pattern, replacement);
}
replaceOnce(/<section[^>]*id="opinie"[\s\S]*?<\/section>/, '', 'opinie demonstracyjne');
html = html.replace(/<!--[\s\S]*?-->/g, '');
if (!/<form\b[^>]*id="formularz"[^>]*data-turnstile-sitekey="0x4[A-Za-z0-9_-]+"/.test(html)
  || !html.includes('action="/api/contact"') || !html.includes('class="contact__direct"')) {
  throw new Error('Produkcja wymaga formularza z rzeczywistym sitekey, właściwym endpointem i kontaktem bezpośrednim.');
}
if (/data-przyklad=|data-demo="true"|Wersja robocza|\[adres\]|\[numer\]/.test(html)) {
  throw new Error('W produkcji pozostała treść demonstracyjna');
}
fs.writeFileSync(indexPath, html);
// No measurement ID means no banner, Google tag or Google CSP exceptions.
const ga4Id = JSON.parse(fs.readFileSync('config/analytics.json', 'utf8')).ga4MeasurementId;
if (ga4Id) {
  let headers = fs.readFileSync(`${output}/_headers`, 'utf8');
  const initialHeaders = headers;
  for (const filename of ['index.html', 'polityka-prywatnosci.html', '404.html']) {
    const file = path.join(output, filename);
    const configured = configureAnalytics(fs.readFileSync(file, 'utf8'), initialHeaders, ga4Id);
    fs.writeFileSync(file, configured.html);
    headers = configured.csp;
  }
  fs.writeFileSync(`${output}/_headers`, headers);
}
// Publiczny adres techniczny nie powinien konkurować z domeną produkcyjną.
fs.appendFileSync(`${output}/_headers`, '\nhttps://przyjaciel-odyseusza.pages.dev/*\n  X-Robots-Tag: noindex, nofollow\n');
// Tylko endpoint formularza uruchamia Function. Pozostałe pliki pozostają statyczne.
fs.writeFileSync(`${output}/_routes.json`, JSON.stringify({version: 1, include: ['/api/contact'], exclude: []}, null, 2) + '\n');
console.log('dist-cf: aktywny formularz, kontakt e-mail/telefon, bez przykładowych opinii.');
