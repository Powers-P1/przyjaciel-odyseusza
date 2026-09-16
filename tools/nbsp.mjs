// Polska typografia: twarda spacja po jednoliterowych spójnikach i przyimkach (a, i, o, u, w, z),
// żeby nie zostawały „sieroty” na końcu linii. Działa na węzłach tekstowych HTML, omija <script>/<style>/<title>.
// Idempotentne. Użycie: node tools/nbsp.mjs public/index.html public/polityka-prywatnosci.html
import fs from 'node:fs';

function nbsp(html) {
  const parts = html.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<title\b[\s\S]*?<\/title>)/i);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // blok chroniony
      return part
        .split(/(<[^>]+>)/)
        .map((seg, j) => (j % 2 === 0 && seg.trim() ? seg.replace(/(?<![\p{L}\p{N}&;])([aiouwzAIOUWZ])\s+(?=\S)/gu, '$1&nbsp;') : seg))
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
