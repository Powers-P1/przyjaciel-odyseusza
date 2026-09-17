// Polska typografia w węzłach tekstowych HTML (omija <script>/<style>/<title> i atrybuty). Idempotentne.
//  - twarda spacja po jednoliterowych spójnikach i przyimkach (a, i, o, u, w, z): bez „sierot” na końcu linii,
//  - liczba nie odrywa się od jednostki (20 lat, 300 PLN, 15 min) ani od krótkiego przyimka przed nią (od 300),
//  - skrót nie zostaje sam na końcu linii (prof. Jerzy, m.in. Grupa, np. online).
// Użycie: node tools/nbsp.mjs public/index.html public/polityka-prywatnosci.html
import fs from 'node:fs';

const RULES = [
  [/(?<![\p{L}\p{N}&;])([aiouwzAIOUWZ])\s+(?=\S)/gu, '$1&nbsp;'],
  [/(\d)\s+(lat|lata|PLN|zł|min|godz|proc|r\.)(?![\p{L}])/gu, '$1&nbsp;$2'],
  [/(?<![\p{L}])(od|do|ok\.|ponad|około)\s+(?=\d)/gu, '$1&nbsp;'],
  [/(?<![\p{L}])(prof|dr|mgr|inż|np|tj|m\.in)\.\s+(?=\S)/gu, '$1.&nbsp;'],
];

function nbsp(html) {
  const parts = html.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<title\b[\s\S]*?<\/title>)/i);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // blok chroniony
      return part
        .split(/(<[^>]+>)/)
        .map((seg, j) => (j % 2 === 0 && seg.trim() ? RULES.reduce((text, [re, to]) => text.replace(re, to), seg) : seg))
        .join('');
    })
    .join('');
}

for (const file of process.argv.slice(2)) {
  const before = fs.readFileSync(file, 'utf8');
  const after = nbsp(before);
  fs.writeFileSync(file, after);
  const added = (after.match(/&nbsp;/g) || []).length - (before.match(/&nbsp;/g) || []).length;
  console.log(`${file}: +${added} &nbsp;`);
}
