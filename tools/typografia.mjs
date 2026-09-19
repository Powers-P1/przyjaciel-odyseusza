// Polski skład tekstu w HTML: twarde spacje tam, gdzie polski skład nie pozwala złamać wiersza.
// Łamanie wierszy pozostaje natywne; skrypt nie zmienia DOM w przeglądarce.
//
// Przebieg (zawsze od czystego tekstu, więc wynik nie zależy od tego, ile razy uruchomiono narzędzie):
//   1. usuń twarde spacje i ewentualne miękkie łączniki wstawione wcześniej,
//   2. wstaw twarde spacje,
//   3. zwiąż dwa ostatnie wyrazy akapitu, żeby w ostatnim wierszu nie został jeden wyraz.
//
// Twarde spacje (żaden z tych elementów nie zostaje na końcu wiersza):
//   - pojedyncza litera (a, i, o, u, w, z) z następującym wyrazem,
//   - liczba i jednostka (20 lat, 300 PLN, 15 min) oraz przyimek przed liczbą (od 300),
//   - skrót i inicjał (prof. Jerzy, m.in. Grupa, B. Przytuła),
//   - numer telefonu, półpauza i kreska rozdzielająca (Coach | Psycholog).
//
// Użycie: node tools/typografia.mjs public/index.html public/polityka-prywatnosci.html
import fs from 'node:fs';

// ---------- twarde spacje ----------

const LITERA = '[\\p{L}\\p{N}]';
const OTWARCIE = '[„"\'(]'; // po twardej spacji może stać cudzysłów lub nawias otwierający
// znaczniki inline są dla łamania wiersza przezroczyste: „napisz na <a>adres</a>” ma wiązać „na” z linkiem
const PRZEZROCZYSTE = '(?:\\uE002\\d+\\uE003)*';

const REGULY_NBSP = [
  // Pojedyncza litera + następny wyraz. Dłuższe słowa mogą łamać się naturalnie.
  [new RegExp(`(?<!${LITERA})(\\p{L})\\s+(?=${PRZEZROCZYSTE}(?:${LITERA}|${OTWARCIE}))`, 'giu'), '$1 '],
  // liczba + jednostka lub waluta
  [/(\d)\s+(lat|lata|roku|PLN|zł|min|godz|proc|r\.|s\.|tys|mln)(?![\p{L}])/gu, '$1 $2'],
  // skrót nie zostaje sam na końcu wiersza
  [/(?<![\p{L}])(prof|dr|mgr|inż|np|tj|tzw|m\.in|ul|al|nr|tel|pt)\.\s+(?=\S)/gu, '$1. '],
  // inicjał przy nazwisku
  [/(?<!\p{L})(\p{Lu})\.\s+(?=\p{Lu})/gu, '$1. '],
  // numer telefonu w całości w jednym wierszu
  [/(\+\d{2})\s(\d{3})\s(\d{3})\s(\d{3})/g, '$1 $2 $3 $4'],
  // kreska rozdzielająca i półpauza nie zaczynają wiersza (Mentor biznesowy | Coach | Psycholog)
  [/\s+(?=[|–—]\s)/g, ' '],
];

// ---------- maskowanie HTML ----------

// Elementy, które nie przerywają wiersza. Reszta (akapity, listy, <br>, obrazy) jest granicą wiązania.
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'dfn', 'del', 'em', 'i',
  'ins', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var']);

/**
 * Chowa encje i znaczniki pod symbole zastępcze, żeby reguły widziały sam tekst.
 * Znaczniki inline dostają symbol przezroczysty, pozostałe – nieprzezroczysty, dzięki czemu
 * twarda spacja nigdy nie powstaje w poprzek akapitu ani <br>.
 */
function zamaskuj(html, schowek) {
  const zapisz = (fragment, przezroczysty) => {
    schowek.push(fragment);
    return przezroczysty ? `${schowek.length - 1}` : `${schowek.length - 1}`;
  };
  // Kolejność jest istotna: najpierw znaczniki, dopiero potem encje w samym tekście. Odwrotnie
  // encja stojąca w atrybucie trafiała do schowka już podmieniona na symbol zastępczy, a jedno
  // przejście odmaskowania nie przetwarza wstawionego tekstu ponownie – przez to
  // `href="…?a=1&amp;b=2"` wychodziło jako `…?a=10b=2`, czyli z rozbitym adresem.
  return html
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>|<!--[\s\S]*?-->|<![^>]*>/g, (tag, nazwa) =>
      zapisz(tag, Boolean(nazwa) && INLINE.has(nazwa.toLowerCase())))
    .replace(/&(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);/g, (encja) => zapisz(encja, false));
}

function odmaskuj(html, schowek) {
  return html.replace(/(\d+)|(\d+)/g, (_, a, b) => schowek[Number(a ?? b)]);
}

// ---------- wdowy ----------

// Ostatni wiersz akapitu nie może być pojedynczym wyrazem. Wiążemy dwa ostatnie wyrazy twardą spacją,
// ale tylko gdy razem są krótkie – dłuższa para rozpychałaby wąskie kolumny na telefonie.
const WDOWA_MAKS = 22;
// nagłówków nie ruszamy: mają `text-wrap: balance`, a wiązanie groziłoby ciągiem szerszym niż kolumna
const ZAMYKA_AKAPIT = /^<\/(?:p|li|dt|dd|figcaption)>$/i;
// Szukamy w tekście zamaskowanym: odstęp + ostatni wyraz + ewentualne znaczniki inline + koniec akapitu.
// Dzięki maskowaniu reguła nie widzi znaczników jako tekstu, więc nie może wstawić twardej spacji
// w środek atrybutu – wcześniejsza wersja działała na surowym HTML i psuła `<a href=…>`.
const KONIEC_AKAPITU = /[ \t\n\r]+([^\s-]+)((?:\d+)*)[ \t\n\r]*(?=(\d+))/g;

/** Wiąże dwa ostatnie wyrazy akapitu, żeby w ostatnim wierszu nie został jeden wyraz. */
function bezWdow(zamaskowany, schowek) {
  return zamaskowany.replace(KONIEC_AKAPITU, (calosc, ostatni, inline, indeks, offset) => {
    if (!ZAMYKA_AKAPIT.test(schowek[Number(indeks)])) return calosc;
    const czysty = (t) => t.replace(/[]\d+[]/g, '').replace(/ /g, ' ');
    // liczymy cały nierozrywalny ciąg, a nie sam wyraz: poprzedni wyraz bywa już związany
    // twardą spacją z kolejnym („z którymi”), a wtedy wiązanie robi z nich trójkę szerszą niż kolumna
    const poprzedni = zamaskowany.slice(0, offset).split(/[ \t\n\r]+/).filter(Boolean).pop() || '';
    if (!poprzedni || !/\p{L}/u.test(czysty(ostatni))) return calosc; // pusty akapit albo liczba/adres
    if (`${czysty(poprzedni)} ${czysty(ostatni)}`.length > WDOWA_MAKS) return calosc;
    return ` ${ostatni}${inline}`;
  });
}

// ---------- całość ----------

function typografia(html) {
  // Bloki nietykalne: kod, tytuł dokumentu oraz treść pola formularza i tekstu preformatowanego –
  // tam twarda spacja byłaby widoczna dla użytkownika albo zepsułaby wartość pola.
  return html
    .split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<title\b[\s\S]*?<\/title>|<textarea\b[\s\S]*?<\/textarea>|<pre\b[\s\S]*?<\/pre>|<code\b[\s\S]*?<\/code>)/i)
    .map((blok, i) => {
      if (i % 2 === 1) return blok;
      const schowek = [];
      // 1. czysty tekst: zdejmujemy wszystko, co narzędzie wstawiło wcześniej
      const czysty = blok.replace(/&nbsp;| /g, ' ').replace(/&shy;|­/g, '');
      const zamaskowany = zamaskuj(czysty, schowek);
      // 2. twarde spacje
      const zeSpacjami = REGULY_NBSP.reduce((tekst, [re, na]) => tekst.replace(re, na), zamaskowany);
      // 3. wdowy – jeszcze w tekście zamaskowanym, żeby reguła nie mogła dotknąć znaczników
      const bezWdowy = bezWdow(zeSpacjami, schowek);
      return odmaskuj(bezWdowy, schowek).replace(/ /g, '&nbsp;');
    })
    .join('');
}

for (const plik of process.argv.slice(2)) {
  const przed = fs.readFileSync(plik, 'utf8');
  const po = typografia(przed);
  if (po !== przed) fs.writeFileSync(plik, po);
  console.log(`${plik}: ${(po.match(/&nbsp;/g) || []).length} twardych spacji`);
}
