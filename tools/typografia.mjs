// Polski skład tekstu w HTML: twarde spacje (gdzie nie wolno łamać) i miękkie łączniki
// (gdzie wolno przenieść wyraz). Jedno narzędzie, bo obie warstwy muszą widzieć ten sam tekst:
// gdy działały osobno, miękki łącznik odcinał końcówkę wyrazu („prak|tykę”), a reguła twardych
// spacji brała ją za osobny krótki wyraz i wiązała z następnym – powstawały łańcuchy w rodzaju
// „praktykę praktykę biznesową z wiedzą”, nierozrywalne i szersze niż kolumna na telefonie.
//
// Przebieg (zawsze od czystego tekstu, więc wynik nie zależy od tego, ile razy uruchomiono narzędzie):
//   1. usuń wszystkie twarde spacje i miękkie łączniki wstawione wcześniej,
//   2. wstaw twarde spacje,
//   3. wstaw miękkie łączniki.
//
// Twarde spacje (żaden z tych elementów nie zostaje na końcu wiersza):
//   - wyraz jedno- i dwuliterowy (a, i, o, u, w, z, na, do, za, ze, we, po, od, to, że…),
//   - przyimki i spójniki z listy (bez, dla, nad, pod, oraz, przy, przed, według…),
//   - liczba i jednostka (20 lat, 300 PLN, 15 min) oraz przyimek przed liczbą (od 300),
//   - skrót i inicjał (prof. Jerzy, m.in. Grupa, B. Przytuła),
//   - numer telefonu, półpauza i kreska rozdzielająca (Coach | Psycholog).
//
// Miękkie łączniki: algorytm Franklina M. Lianga (ten sam co w TeX-u), wzorce polskie z CTAN
// (pakiet `hyphen`). Polskie minima przenoszenia: 2 znaki zostają w wierszu, 3 przechodzą.
// Nie dzielimy wyrazów zaczynających się wielką literą (nazwiska, nazwy firm) ani tokenów
// z cyfrą, kropką w środku, ukośnikiem czy małpą (adresy, e-maile).
// O tym, gdzie z tych podziałów wolno skorzystać, decyduje CSS (`hyphens`) – patrz src/css/style.css.
//
// Użycie: node tools/typografia.mjs public/index.html public/polityka-prywatnosci.html
import fs from 'node:fs';
import pl from 'hyphen/pl/index.js';

const { hyphenateSync } = pl;

// ---------- twarde spacje ----------

const SPOJNIKI = [
  'bez', 'dla', 'nad', 'pod', 'ani', 'lub', 'czy', 'gdy', 'aby', 'niż', 'zza',
  'przy', 'poza', 'oraz', 'albo', 'lecz', 'więc', 'żeby', 'obok',
  'przed', 'wśród', 'wobec', 'ponad', 'około', 'spośród', 'według', 'poprzez', 'między', 'pomiędzy',
];

const LITERA = '[\\p{L}\\p{N}]';
const OTWARCIE = '[„"\'(]'; // po twardej spacji może stać cudzysłów lub nawias otwierający
// znaczniki inline są dla łamania wiersza przezroczyste: „napisz na <a>adres</a>” ma wiązać „na” z linkiem
const PRZEZROCZYSTE = '(?:\\uE002\\d+\\uE003)*';

const REGULY_NBSP = [
  // wyraz krótki (1–2 litery) albo przyimek/spójnik z listy + następny wyraz
  [new RegExp(`(?<!${LITERA})((?:${SPOJNIKI.join('|')})|\\p{L}\\p{L}?)\\s+(?=${PRZEZROCZYSTE}(?:${LITERA}|${OTWARCIE}))`, 'giu'), '$1\u00A0'],
  // liczba + jednostka lub waluta
  [/(\d)\s+(lat|lata|roku|PLN|zł|min|godz|proc|r\.|s\.|tys|mln)(?![\p{L}])/gu, '$1\u00A0$2'],
  // skrót nie zostaje sam na końcu wiersza
  [/(?<![\p{L}])(prof|dr|mgr|inż|np|tj|tzw|m\.in|ul|al|nr|tel|pt)\.\s+(?=\S)/gu, '$1.\u00A0'],
  // inicjał przy nazwisku
  [/(?<!\p{L})(\p{Lu})\.\s+(?=\p{Lu})/gu, '$1.\u00A0'],
  // numer telefonu w całości w jednym wierszu
  [/(\+\d{2})\s(\d{3})\s(\d{3})\s(\d{3})/g, '$1\u00A0$2\u00A0$3\u00A0$4'],
  // kreska rozdzielająca i półpauza nie zaczynają wiersza (Mentor biznesowy | Coach | Psycholog)
  [/\s+(?=[|–—]\s)/g, '\u00A0'],
  [/(?<=[|–—])\s+(?=\S)/g, '\u00A0'],
];

// ---------- miękkie łączniki ----------

// Polska konfiguracja TeX-a (hyph-pl): co najmniej 2 znaki zostają w wierszu, co najmniej 3 przechodzą.
const MIN_PRZED = 2;
const MIN_PO = 3;
const MIN_DLUGOSC = 6; // krótszych wyrazów dzielić nie ma po co
const ZNACZNIK = '\u0001'; // tymczasowy separator podziałów, nie występuje w treści
const SHY = '\u00AD';
// Token, w którym nie ruszamy nic: adres, e-mail, nazwa pliku, cokolwiek z cyfrą.
const TECHNICZNY = /[@/\\\d]|\.\p{L}/u;

/** Dzieli pojedynczy wyraz, odrzucając podziały zbyt blisko brzegów. */
function podzielWyraz(wyraz) {
  const czesci = hyphenateSync(wyraz, { hyphenChar: ZNACZNIK, minWordLength: MIN_DLUGOSC }).split(ZNACZNIK);
  if (czesci.length < 2) return wyraz;
  let wynik = czesci[0];
  let przed = czesci[0].length;
  for (let i = 1; i < czesci.length; i += 1) {
    if (przed >= MIN_PRZED && wyraz.length - przed >= MIN_PO) wynik += SHY;
    wynik += czesci[i];
    przed += czesci[i].length;
  }
  return wynik;
}

/** Dzieli wyrazy wewnątrz jednego tokenu (token = ciąg bez spacji, razem z interpunkcją). */
function podzielToken(token) {
  if (TECHNICZNY.test(token)) return token;
  // wielka litera na początku wyrazu = nazwa własna (nazwisko, firma, program) – nie dzielimy
  return token.replace(/\p{L}+/gu, (wyraz) =>
    (wyraz.length >= MIN_DLUGOSC && /^\p{Ll}/u.test(wyraz) ? podzielWyraz(wyraz) : wyraz));
}

// ---------- wspólna obsługa HTML ----------

// Elementy, które nie przerywają wiersza. Reszta (akapity, listy, <br>, obrazy) jest granicą wiązania.
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'dfn', 'del', 'em', 'i',
  'ins', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var']);

/**
 * Chowa encje i znaczniki pod symbole zastępcze, żeby reguły widziały sam tekst.
 * Znaczniki inline dostają symbol przezroczysty (\uE002…\uE003), pozostałe – nieprzezroczysty,
 * dzięki czemu twarda spacja nigdy nie powstaje w poprzek akapitu ani <br>.
 */
function zamaskuj(html, schowek) {
  const zapisz = (fragment, przezroczysty) => {
    schowek.push(fragment);
    return przezroczysty ? `\uE002${schowek.length - 1}\uE003` : `\uE000${schowek.length - 1}\uE001`;
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
  return html.replace(/\uE000(\d+)\uE001|\uE002(\d+)\uE003/g, (_, a, b) => schowek[Number(a ?? b)]);
}

// ---------- wdowy ----------

// Ostatni wiersz akapitu nie może być pojedynczym wyrazem. Wiążemy dwa ostatnie wyrazy twardą spacją,
// ale tylko gdy razem są krótkie – dłuższa para rozpychałaby wąskie kolumny na telefonie.
const WDOWA_MAKS = 22;
// nagłówków nie ruszamy: mają `text-wrap: balance`, a wiązanie groziłoby ciągiem szerszym niż kolumna
const ZAMYKA_AKAPIT = /^<\/(?:p|li|dd|figcaption)>$/i;
// Szukamy w tekście zamaskowanym: odstęp + ostatni wyraz + ewentualne znaczniki inline + koniec akapitu.
// Dzięki maskowaniu reguła nie widzi znaczników jako tekstu, więc nie może wstawić twardej spacji
// w środek atrybutu – wcześniejsza wersja działała na surowym HTML i psuła `<a href=…>`.
const KONIEC_AKAPITU = /[ \t\n\r]+([^\s\uE000-\uE003]+)((?:\uE002\d+\uE003)*)[ \t\n\r]*(?=\uE000(\d+)\uE001)/g;

/** Wiąże dwa ostatnie wyrazy akapitu, żeby w ostatnim wierszu nie został jeden wyraz. */
function bezWdow(zamaskowany, schowek) {
  return zamaskowany.replace(KONIEC_AKAPITU, (calosc, ostatni, inline, indeks, offset) => {
    if (!ZAMYKA_AKAPIT.test(schowek[Number(indeks)])) return calosc;
    const czysty = (t) => t.replace(/\u00A0/g, ' ').replace(/\u00AD/g, '');
    // liczymy cały nierozrywalny ciąg, a nie sam wyraz: poprzedni wyraz bywa już związany
    // twardą spacją z kolejnym („z którymi”), a wtedy wiązanie robi z nich trójkę szerszą niż kolumna
    const poprzedni = zamaskowany.slice(0, offset).split(/[ \t\n\r]+/).filter(Boolean).pop() || '';
    if (!poprzedni || !/\p{L}/u.test(czysty(ostatni))) return calosc; // pusty akapit albo liczba/adres
    if (`${czysty(poprzedni)} ${czysty(ostatni)}`.length > WDOWA_MAKS) return calosc;
    return `\u00A0${ostatni}${inline}`;
  });
}

function typografia(html) {
  // Bloki nietykalne: kod, tytuł dokumentu oraz treść pola formularza i tekstu preformatowanego –
  // tam twarda spacja i miękki łącznik byłyby widoczne dla użytkownika albo zepsułyby wartość pola.
  return html
    .split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<title\b[\s\S]*?<\/title>|<textarea\b[\s\S]*?<\/textarea>|<pre\b[\s\S]*?<\/pre>|<code\b[\s\S]*?<\/code>)/i)
    .map((blok, i) => {
      if (i % 2 === 1) return blok;
      const schowek = [];
      // 1. czysty tekst: zdejmujemy wszystko, co narzędzie wstawiło wcześniej
      const czysty = blok.replace(/&nbsp;|\u00A0/g, ' ').replace(/&shy;|\u00AD/g, '');
      const zamaskowany = zamaskuj(czysty, schowek);
      // 2. twarde spacje
      const zeSpacjami = REGULY_NBSP.reduce((tekst, [re, na]) => tekst.replace(re, na), zamaskowany);
      // 3. miękkie łączniki
      // token = ciąg bez odstępów; twarda spacja i symbole zastępcze dzielą tokeny, więc wyrazy
      // związane twardą spacją dzielimy osobno, a symboli zastępczych nie tykamy
      const podzielony = zeSpacjami.replace(/[^\s\u00A0\uE000-\uE003]+/g, podzielToken);
      // 4. wdowy – jeszcze w tekście zamaskowanym, żeby reguła nie mogła dotknąć znaczników
      const bezWdowy = bezWdow(podzielony, schowek);
      return odmaskuj(bezWdowy, schowek)
        .replace(/\u00A0/g, '&nbsp;')
        .replace(/\u00AD/g, '&shy;');
    })
    .join('');
}

for (const plik of process.argv.slice(2)) {
  const przed = fs.readFileSync(plik, 'utf8');
  const po = typografia(przed);
  if (po !== przed) fs.writeFileSync(plik, po);
  const twarde = (po.match(/&nbsp;/g) || []).length;
  const lacznik = (po.match(/&shy;/g) || []).length;
  console.log(`${plik}: ${twarde} twardych spacji, ${lacznik} miejsc podziału wyrazów`);
}
