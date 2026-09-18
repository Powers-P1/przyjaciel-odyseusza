// Polska typografia w węzłach tekstowych HTML (omija <script>/<style>/<title> i atrybuty). Idempotentne.
// Wstawia twardą spację (&nbsp;) tam, gdzie polski skład nie pozwala na złamanie wiersza:
//  - wyraz jedno- i dwuliterowy nie zostaje na końcu wiersza (a, i, o, u, w, z, na, do, za, ze, we, po, od, to, że…),
//  - to samo dotyczy dłuższych przyimków i spójników (bez, dla, nad, pod, oraz, przy, przed, według…),
//  - liczba nie odrywa się od jednostki (20 lat, 300 PLN, 15 min) ani od przyimka przed nią (od 300),
//  - skrót i inicjał nie zostają same (prof. Jerzy, m.in. Grupa, B. Przytuła),
//  - numer telefonu i półpauza nie rozpadają się na dwa wiersze.
// Kontrolę wyniku robi tests/typografia.spec.js, który mierzy realne wiersze w przeglądarce.
// Użycie: node tools/nbsp.mjs public/index.html public/polityka-prywatnosci.html
import fs from 'node:fs';

// Przyimki i spójniki dłuższe niż dwie litery; krótsze wiążemy bez listy, bo w polskim składzie
// żaden wyraz jedno- ani dwuliterowy nie powinien kończyć wiersza.
const SPOJNIKI = [
  'bez', 'dla', 'nad', 'pod', 'ani', 'lub', 'czy', 'gdy', 'aby', 'niż', 'zza',
  'przy', 'poza', 'oraz', 'albo', 'lecz', 'więc', 'żeby', 'obok',
  'przed', 'wśród', 'wobec', 'ponad', 'około', 'spośród', 'według', 'poprzez', 'między', 'pomiędzy',
];

const LITERA = '[\\p{L}\\p{N}]';
const OTWARCIE = '[„"\'(]'; // po twardej spacji może stać cudzysłów lub nawias otwierający
// znaczniki inline są dla łamania wiersza przezroczyste: „napisz na <a>adres</a>” ma wiązać „na” z linkiem
const PRZEZROCZYSTE = '(?:\\uE002\\d+\\uE003)*';

const RULES = [
  // wyraz krótki (1–2 litery) albo przyimek/spójnik z listy + następny wyraz
  [new RegExp(`(?<!${LITERA})((?:${SPOJNIKI.join('|')})|\\p{L}\\p{L}?)\\s+(?=${PRZEZROCZYSTE}(?:${LITERA}|${OTWARCIE}))`, 'giu'), '$1 '],
  // liczba + jednostka lub waluta
  [/(\d)\s+(lat|lata|roku|PLN|zł|min|godz|proc|r\.|s\.|tys|mln)(?![\p{L}])/gu, '$1 $2'],
  // skrót nie zostaje sam na końcu wiersza
  [/(?<![\p{L}])(prof|dr|mgr|inż|np|tj|tzw|m\.in|ul|al|nr|tel|pt)\.\s+(?=\S)/gu, '$1. '],
  // inicjał przy nazwisku
  [/(?<!\p{L})(\p{Lu})\.\s+(?=\p{Lu})/gu, '$1. '],
  // numer telefonu w całości w jednym wierszu
  [/(\+\d{2})\s(\d{3})\s(\d{3})\s(\d{3})/g, '$1 $2 $3 $4'],
  // półpauza nie zaczyna wiersza
  [/\s+(?=[–—]\s)/g, ' '],
];

// Elementy, które nie przerywają wiersza. Reszta (akapity, listy, <br>, obrazy) jest granicą wiązania.
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'dfn', 'del', 'em', 'i',
  'ins', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var']);

/**
 * Chowa encje i znaczniki pod symbole zastępcze, żeby reguły widziały sam tekst.
 * Znaczniki inline dostają symbol przezroczysty (…), pozostałe – nieprzezroczysty,
 * dzięki czemu twarda spacja nigdy nie powstaje w poprzek akapitu ani <br>.
 */
function mask(html, store) {
  const zapisz = (fragment, przezroczysty) => {
    store.push(fragment);
    return przezroczysty ? `${store.length - 1}` : `${store.length - 1}`;
  };
  return html
    .replace(/&(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);/g, (entity) => zapisz(entity, false))
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>|<!--[\s\S]*?-->/g, (tag, nazwa) =>
      zapisz(tag, Boolean(nazwa) && INLINE.has(nazwa.toLowerCase())));
}

function unmask(html, store) {
  return html.replace(/(\d+)|(\d+)/g, (_, a, b) => store[Number(a ?? b)]);
}

function nbsp(html) {
  // <script>, <style> i <title> zostawiamy nietknięte – twarda spacja byłaby tam błędem.
  return html
    .split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<title\b[\s\S]*?<\/title>)/i)
    .map((block, i) => {
      if (i % 2 === 1) return block;
      const store = [];
      const masked = RULES.reduce((text, [re, to]) => text.replace(re, to), mask(block, store));
      return unmask(masked.replace(/ /g, '&nbsp;'), store);
    })
    .join('');
}

for (const file of process.argv.slice(2)) {
  const before = fs.readFileSync(file, 'utf8');
  const after = nbsp(before);
  if (after !== before) fs.writeFileSync(file, after);
  const added = (after.match(/&nbsp;/g) || []).length - (before.match(/&nbsp;/g) || []).length;
  console.log(`${file}: ${added >= 0 ? '+' : ''}${added} &nbsp; (razem ${(after.match(/&nbsp;/g) || []).length})`);
}
