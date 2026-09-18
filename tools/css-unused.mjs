// Wykrywa martwe elementy arkusza src/css/style.css: klasy, których nie używa żadna strona w public/
// ani skrypt src/js/main.js, oraz zmienne z :root, do których nigdy nie sięga var().
// Utrzymuje arkusz bez martwych reguł (każda wersja strony ma inne sekcje). Kończy się błędem, gdy coś znajdzie.
// Użycie: node tools/css-unused.mjs
import fs from 'node:fs';

const css = fs.readFileSync('src/css/style.css', 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{[^{}]*\}/g, '{}'); // zostają same selektory
const classes = new Set([...css.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map((m) => m[1]));

const sources = ['public/index.html', 'public/polityka-prywatnosci.html', 'public/404.html', 'src/js/main.js', 'src/js/justowanie.js']
  .map((f) => fs.readFileSync(f, 'utf8').replace(/<style[\s\S]*?<\/style>/g, ''))
  .join('\n');

// klasa jest używana, gdy występuje w całości albo gdy skrypt składa ją z prefiksu (np. 'form__status--' + typ)
const used = (c) => new RegExp(`(?<![\\w-])${c}(?![\\w-])`).test(sources)
  || (c.includes('--') && sources.includes(`${c.slice(0, c.indexOf('--') + 2)}'`));
const unused = [...classes].filter((c) => !used(c)).sort();

// Zmienne własne: deklaracja bez ani jednego var() to martwy token. Kontrola klas tego nie łapie,
// bo zmienne nie są selektorami – a właśnie tak przeżyły w arkuszu --teal-soft i --ink-mute.
const arkusz = fs.readFileSync('src/css/style.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// deklaracja zaczyna się po `{` albo po `;` – inaczej wpadłby tu `.btn--outline:hover` z selektora
const zadeklarowane = new Set([...arkusz.matchAll(/[;{]\s*(--[\w-]+)\s*:/g)].map((m) => m[1]));
const uzyteZmienne = new Set([...arkusz.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
const martweZmienne = [...zadeklarowane].filter((v) => !uzyteZmienne.has(v)).sort();

const bledy = [];
if (unused.length) bledy.push(`Nieużywane klasy (${unused.length}):\n  ${unused.join('\n  ')}`);
if (martweZmienne.length) bledy.push(`Zmienne bez użycia var() (${martweZmienne.length}):\n  ${martweZmienne.join('\n  ')}`);
if (bledy.length) {
  console.error(`Martwe elementy w src/css/style.css:\n${bledy.join('\n')}`);
  process.exit(1);
}
console.log(`src/css/style.css: ${classes.size} klas i ${zadeklarowane.size} zmiennych, wszystkie użyte.`);
