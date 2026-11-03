// Wariant uruchomieniowy zatwierdzony przez Damiana 03.11.2026:
// kontakt e-mail/telefon, bez formularza i demonstracyjnych opinii.
import fs from 'node:fs';
import path from 'node:path';

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
const direct = html.match(/<ul class="contact__direct">[\s\S]*?<\/ul>/)?.[0];
if (!direct) throw new Error('Brak kontaktu bezpośredniego');
replaceOnce(/<ul class="contact__direct">[\s\S]*?<\/ul>/, '', 'kontakt bezpośredni');
replaceOnce(/<form[^>]*id="formularz"[\s\S]*?<\/form>/,
  `<div class="contact__copy reveal">${direct}</div>`, 'formularz');
html = html.replace('Chcesz wesprzeć menedżera w&nbsp;swojej firmie? Opisz krótko sytuację.',
  'Chcesz wesprzeć menedżera w&nbsp;swojej firmie? Napisz e-mail lub zadzwoń i&nbsp;opisz krótko sytuację.');
if (/<form\b|data-przyklad=|Wersja robocza|\[adres\]|\[numer\]/.test(html)) {
  throw new Error('W produkcji pozostał formularz lub treść demonstracyjna');
}
fs.writeFileSync(indexPath, html);
// Publiczny adres techniczny nie powinien konkurować z domeną produkcyjną.
fs.appendFileSync(`${output}/_headers`, '\nhttps://przyjaciel-odyseusza.pages.dev/*\n  X-Robots-Tag: noindex, nofollow\n');
// W tym wariancie nie ma formularza ani żądań do backendu.
fs.writeFileSync(`${output}/_routes.json`, JSON.stringify({version: 1, include: ['/*'], exclude: ['/*']}, null, 2) + '\n');
console.log('dist-cf: kontakt e-mail/telefon, bez formularza i przykładowych opinii.');
