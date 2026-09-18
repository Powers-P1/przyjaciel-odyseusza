/* Justowanie tekstu z łamaniem wierszy jak w TeX-u (algorytm Knutha–Plassa) i mikrotypografią.
 *
 * Dlaczego w ogóle: przeglądarka łamie wiersze zachłannie – bierze tyle wyrazów, ile wejdzie,
 * i dopiero potem rozciąga odstępy, żeby dobić do prawego marginesu. Przy polskich wyrazach daje to
 * pojedyncze wiersze rozstrzelone kilkakrotnie ponad normę i widoczne „rzeki” bieli.
 * `text-wrap: pretty` i `balance` tego nie naprawiają – optymalizują chorągiewkę, więc przy
 * justowaniu wypadają jeszcze gorzej (zmierzone: mediana 2,8 i 4,4 zwykłej spacji wobec 2,4).
 *
 * Luzu w akapicie nie da się zmniejszyć samym łamaniem – to różnica między sumą długości wyrazów
 * a szerokością kolumny. Da się go za to rozłożyć i częściowo schować, i na tym stoją trzy warstwy
 * (czwarta, szerokość kolumn, jest w arkuszu – patrz `--min-kolumna`):
 *
 *   1. Łamanie całego akapitu naraz. Kara za wiersz rośnie z trzecią potęgą rozciągnięcia, więc
 *      jeden fatalny wiersz kosztuje więcej niż kilka lekko gorszych.
 *   2. Kolejne przebiegi z coraz luźniejszym progiem. Bierzemy pierwszy, który się uda – to daje
 *      podział o najmniejszym możliwym NAJGORSZYM wierszu, a nie tylko dobrą sumę.
 *   3. Mikrotypografia: resztkę luzu chowamy w świetle między literami, a wiersz, któremu do
 *      następnego wyrazu zabrakło kilku pikseli, wolno odrobinę ścisnąć (do +2,5% i do -3% stopnia
 *      pisma, w krokach po 0,0025 em, klasami `trak-*` i `zwez-*`). Tyle trackingu jest dla oka
 *      niewidoczne, odstęp rozciągnięty o 200% – aż nadto. Tak robi się w składzie od czasów
 *      programu `hz` Hermanna Zapfa; InDesign nazywa to skalowaniem odstępów międzyliterowych.
 *
 * Twarde spacje z tools/typografia.mjs są dla tego kroku materiałem, nie wyrokiem. Wyrazu
 * jednoliterowego, skrótu, liczby z jednostką i kreski rozdzielającej nie oderwie od sąsiada nigdy.
 * Pozostałe wiązania wolno mu złamać za cenę, która mówi, ile warte jest uniknięcie danej wady
 * (skala kar niżej) – dzieje się to tylko wtedy, gdy ratuje wiersz przed rozjazdem.
 * Bez JavaScriptu wszystkie zostają twarde i tekst jest chorągiewką – zachłanne justowanie wygląda
 * gorzej niż chorągiewka, więc nie włączamy go w CSS.
 *
 * Wyrazów nie dzielimy.
 *
 * Jak renderujemy: każdy wiersz to osobny blok z `text-align-last: justify`, więc ostateczne
 * rozciągnięcie odstępów robi przeglądarka – co do piksela. My decydujemy o tym, GDZIE złamać
 * wiersz i ile luzu zabrać trackingiem.
 */
(function () {
  'use strict';

  // Tekst ciągły: akapity, w których wiersz jest na tyle długi, że justowanie ma sens.
  // Nagłówki, etykiety, przyciski i podpisy zostają wyrównane do lewej. Pozycji list nie justujemy:
  // są krótkie, więc zostaje w nich za mało odstępów, żeby rozłożyć luz – tak samo robi się
  // w składzie książkowym.
  var BLOKI = [
    '.hero__lead', '.section-intro', '.situation__desc', '.about__private',
    '.mode p', '.card p', '.step p', '.principle p', '.origin p', '.contact__copy p',
    '.about__copy > p', '.prose p'
  ].join(',');

  // Dopuszczalne rozciągnięcie odstępu, w jednostkach ROZCIAGLIWOSC (próg 1 = odstęp szerszy o 60%).
  // Bierzemy pierwszy próg, przy którym istnieje podział – czyli najciaśniejszy możliwy najgorszy
  // wiersz. Ostatni próg jest bez ograniczenia: w wąskiej kolumnie na telefonie bywa, że żaden
  // rozsądny podział nie istnieje, a jeden rozstrzelony wiersz i tak czyta się lepiej niż akapit
  // wyrównany do lewej pośród justowanych. O kształt takiego wiersza dba wtedy sama kara sześcienna.
  var PROGI = [0.4, 0.7, 1, 1.3, 1.7, 2.2, 2.8, 3.6, 5, 8, 12, 18, 27, 40, 60, 90, Infinity];
  // Próg swobody. Sam próg minimaksowy mówi tylko, jak ciasny może być NAJGORSZY wiersz – a podział
  // bez wdowy bywa o szczebel dalej, więc przy najciaśniejszym progu algorytm nie ma go z czego
  // kupić. Dlatego ostatni przebieg idzie z progiem nie niższym niż ten: wyżej i tak nie sięgnie,
  // bo wiersz rozciągnięty ponad 4,2 kosztuje więcej niż wszystko, co miałby tym rozciągnięciem
  // załatwić (skala kar niżej). Rozstrzyga wtedy suma kar, a nie arbitralny próg.
  var PROG_SWOBODY = 4.2;
  var ROZCIAGLIWOSC = 0.6; // przy progu 1 odstęp rośnie o 60% – tak jak domyślnie w TeX-u
  // Zapas kolumny. Wiersz składamy do `szerokość - zapas`, nigdy do samej krawędzi: zmiana trackingu
  // wyłącza ligatury i przesuwa kerning, a każdy silnik zaokrągla to inaczej, więc szerokość
  // zmierzona bez trackingu nie przewiduje wyniku co do piksela. Wiersz dopchnięty dokładnie do
  // krawędzi przeglądarka łamie po raz drugi – i wtedy na jego końcu ląduje wyraz, którego twarda
  // spacja miała tam nie wpuścić. Zamiast zgadywać zapas dla każdego silnika, zaczynamy od
  // najmniejszego i sprawdzamy wynik w układzie (patrz zlozWszystkie): akapitom, które się nie
  // zmieściły, dajemy kolejno większy. Resztę zapasu rozdziela justowanie – 2 px na kilkanaście
  // odstępów to ułamek piksela na odstęp.
  var ZAPASY = [2, 6, 12];

  // Tracking w krokach po 0,0025 em: do +2,5% w górę (10 stopni) i do -3% w dół (12 stopni).
  // W górę chowamy luz, którego inaczej musiałyby wziąć odstępy. W dół ściskamy wiersz, żeby
  // ściągnąć wyraz, któremu zabrakło kilku pikseli – taki wiersz ma odstępy naturalne, więc jest
  // najrówniejszy ze wszystkich. Na tym samym stoi program hz Hermanna Zapfa i skalowanie glifów
  // w InDesignie.
  // Skąd te liczby: każdy stopień w dół dokładany po kolei zbijał najgorszy wiersz na telefonie
  // (2% → 5,5 zwykłej spacji, 2,5% → 5,4, 3% → 4,4), bo akapity rozbijały się kolejno o 3 i o pół
  // piksela; powyżej 3% nic już się nie zmienia. W górę zatrzymujemy się na 2,5%, bo rozstrzelone
  // światło między literami widać wcześniej niż ściśnięte – i tak jest to ostatnia deska ratunku,
  // a nie sposób na wypełnienie wiersza.
  // Klasy wypisane wprost, bo arkusz i skrypt muszą trzymać te same nazwy (tools/css-unused.mjs).
  var TRAKI = ['trak-1', 'trak-2', 'trak-3', 'trak-4', 'trak-5',
    'trak-6', 'trak-7', 'trak-8', 'trak-9', 'trak-10'];
  var ZWEZENIA = ['zwez-1', 'zwez-2', 'zwez-3', 'zwez-4', 'zwez-5', 'zwez-6',
    'zwez-7', 'zwez-8', 'zwez-9', 'zwez-10', 'zwez-11', 'zwez-12'];
  var TRAK_KROK = 0.0025; // em na stopień

  // Kary w skali kar za wiersz, czyli (10 + 100·rozciągnięcie³)². Każda z nich jest kursem wymiany:
  // mówi, jak rozciągnięty wiersz algorytm może kupić, żeby uniknąć danej wady. Stąd wartości:
  //   wdowa            6·10⁷  = wiersz o rozciągnięciu 4,2 (odstęp ok. 3,5 zwykłej spacji),
  //   wyraz dwuliterowy 3·10⁵ = wiersz o rozciągnięciu 1,75,
  //   dłuższy przyimek  3·10⁴ = wiersz o rozciągnięciu 1,3.
  // Kolejność zgadza się z tym, co widać w składzie: wdowa rzuca się w oczy najbardziej, a krótki
  // przyimek na końcu wiersza to w polskiej typografii zalecenie, nie błąd.
  var KARA_WDOWY = 6e7;       // ostatni wiersz z jednego wyrazu albo krótszy niż piąta część kolumny
  var KARA_DWULITEROWA = 3e5; // wyraz dwuliterowy zostawiony na końcu wiersza
  var KARA_MIEKKA = 3e4;      // dłuższy przyimek albo wiązanie ostatniej pary wyrazów
  var KARA_ZWEZENIA = 150;    // za każdy stopień ściśnięcia – tyle, żeby ściskać tylko z potrzeby
  var OSTATNI_MIN = 0.2;      // ostatni wiersz krótszy niż tyle kolumny czyta się jak wdowa

  var bloki = Array.prototype.slice.call(document.querySelectorAll(BLOKI));
  if (!bloki.length) return;

  /* ---------- wyrazy i odstępy ---------- */

  /**
   * Ile kosztuje złamanie wiersza na twardej spacji; -1 znaczy „nie wolno”.
   * Polski skład wymaga bezwzględnie tylko tego, żeby wiersza nie kończył wyraz jednoliterowy –
   * i tak samo traktujemy skrót, liczbę z jednostką i kreskę rozdzielającą, bo rozdzielenie ich
   * zmienia sens. Wyraz dwuliterowy jest zaleceniem, nie regułą, więc wolno go zostawić na końcu
   * wiersza, ale drogo: schodzimy do tego dopiero, gdy alternatywą jest wiersz z „rzeką”
   * (zmierzone na telefonie: bez tego ustępstwa jeden akapit hero miał wiersz 8,4 zwykłej spacji).
   */
  function karaZlamania(przed, po) {
    if (/^\p{L}$/u.test(przed)) return -1;                 // wyraz jednoliterowy: reguła bezwzględna
    if (/\.$/.test(przed)) return -1;                      // skrót albo inicjał: „prof. Jerzy”
    if (/\d/.test(przed) || /^\d/.test(po)) return -1;     // liczba z jednostką, numer telefonu
    if (/^[|–—]/.test(po)) return -1;                     // kreska rozdzielająca nie zaczyna wiersza
    if (/^\p{L}{2}$/u.test(przed)) return KARA_DWULITEROWA;
    return KARA_MIEKKA;
  }

  /**
   * Zbiera wyrazy akapitu razem z łańcuchem elementów, w których siedzą (linki, wyróżnienia),
   * i z rodzajem odstępu przed każdym z nich. Rozdzielamy też na twardych spacjach – to one niosą
   * informację, gdzie łamać nie wypada, a nie gdzie nie wolno.
   *   ''   – wyrazy stykają się bez odstępu (np. `<strong>Coach</strong>ing`): ani odstępu, ani łamania,
   *   ' '  – zwykła spacja: łamiemy za darmo,
   *   '\u00a0' – twarda spacja: łamiemy z karą albo wcale (patrz sklejone()).
   */
  function zbierzWyrazy(blok) {
    var wyrazy = [];
    var walker = document.createTreeWalker(blok, NodeFilter.SHOW_TEXT);
    var przerwa = '';
    var node;
    while ((node = walker.nextNode())) {
      var tekst = node.nodeValue;
      var przodkowie = null;
      var re = /\S+/g;
      var koniec = 0;
      var m;
      while ((m = re.exec(tekst))) {
        if (!przodkowie) {
          przodkowie = [];
          for (var el = node.parentNode; el && el !== blok; el = el.parentNode) przodkowie.unshift(el);
        }
        przerwa += tekst.slice(koniec, m.index);
        wyrazy.push({
          tekst: m[0], node: node, od: m.index, do: m.index + m[0].length, przodkowie: przodkowie,
          odstep: przerwa === '' ? '' : (przerwa.indexOf('\u00a0') >= 0 ? '\u00a0' : ' ')
        });
        przerwa = '';
        koniec = m.index + m[0].length;
      }
      przerwa += tekst.slice(koniec);
    }
    return wyrazy;
  }

  /**
   * Mierzy szerokości wyrazów i naturalną szerokość spacji. Wszystkie odczyty idą po jednym
   * przeliczeniu układu, więc nie szarpiemy przeglądarki na przemian zapisem i odczytem.
   */
  function zmierz(wyrazy) {
    var prostokaty = wyrazy.map(function (w) {
      var r = document.createRange();
      r.setStart(w.node, w.od);
      r.setEnd(w.node, w.do);
      return r.getBoundingClientRect();
    });
    var szerokosci = prostokaty.map(function (r) { return r.width; });
    // Naturalna spacja: mediana odstępów między sąsiednimi wyrazami w tym samym wierszu.
    // Bierzemy ją z realnego układu, więc uwzględnia krój, stopień i ewentualny word-spacing.
    var odstepy = [];
    for (var i = 1; i < prostokaty.length; i++) {
      if (!wyrazy[i].odstep) continue;
      var a = prostokaty[i - 1];
      var b = prostokaty[i];
      if (Math.abs(a.top - b.top) < 3 && b.left > a.right) odstepy.push(b.left - a.right);
    }
    odstepy.sort(function (x, y) { return x - y; });
    return { szerokosci: szerokosci, spacja: odstepy.length ? odstepy[Math.floor(odstepy.length / 2)] : 0 };
  }

  /** Przygotowuje sumy narastające, dzięki którym koszt wiersza liczy się w stałym czasie. */
  function przygotuj(wyrazy, pomiar, szerokosc, trakKrok, zapas) {
    var n = wyrazy.length;
    var sumaW = [0];
    var sumaZnakow = [0];
    var sumaOdstepow = [0]; // ile odstępów przed wyrazami 1..i
    var lamanie = [];       // kara za złamanie przed wyrazem i; -1 = nie wolno
    for (var i = 0; i < n; i++) {
      sumaW.push(sumaW[i] + pomiar.szerokosci[i]);
      sumaZnakow.push(sumaZnakow[i] + wyrazy[i].tekst.length);
      var odstep = i === 0 ? '' : wyrazy[i].odstep;
      sumaOdstepow.push(sumaOdstepow[i] + (odstep ? 1 : 0));
      if (i === 0) lamanie.push(0);
      else if (odstep === ' ') lamanie.push(0);
      else if (odstep === '\u00a0') lamanie.push(karaZlamania(wyrazy[i - 1].tekst, wyrazy[i].tekst));
      else lamanie.push(-1);
    }
    return {
      n: n, spacja: pomiar.spacja, szerokosc: szerokosc, trakKrok: trakKrok, zapas: zapas, lamanie: lamanie,
      /** Wiersz z wyrazów [p, j): ile odstępów, jaka szerokość naturalna, ile znaków. */
      wiersz: function (p, j) {
        var odstepy = sumaOdstepow[j] - sumaOdstepow[p + 1];
        var naturalna = sumaW[j] - sumaW[p] + odstepy * pomiar.spacja;
        return { odstepy: odstepy, naturalna: naturalna, znaki: sumaZnakow[j] - sumaZnakow[p] + odstepy };
      }
    };
  }

  /**
   * Ocenia wiersz z wyrazów [p, j): czy się mieści, ile kosztuje i jaką dostaje klasę trackingu.
   * Jedno miejsce dla algorytmu i dla renderingu, więc nie mogą się rozjechać. Zwraca:
   *   null   – nie zmieści się nawet ściśnięty, a przy krótszym początku będzie tylko gorzej,
   *   false  – wiersz niedopuszczalny (nie ma czego rozciągać),
   *   obiekt – { wspolczynnik, kara, klasa }.
   */
  function ocenWiersz(akapit, p, j, ostatni) {
    var w = akapit.wiersz(p, j);
    var limit = akapit.szerokosc - akapit.zapas;
    var krok = w.znaki * akapit.trakKrok; // ile px daje jeden stopień trackingu w tym wierszu
    if (w.naturalna > limit + krok * ZWEZENIA.length) return null;
    if (ostatni) {
      // Ostatniego wiersza nie rozciągamy – wolno go tylko ścisnąć, jeśli inaczej by się nie zmieścił.
      // Nie może za to zostać w nim jeden wyraz ani strzępek; to kara, nie zakaz, bo przy krótkim
      // akapicie innego podziału może po prostu nie być.
      var wdowa = (j - p < 2) || w.naturalna < OSTATNI_MIN * akapit.szerokosc;
      var kara = wdowa ? KARA_WDOWY : 0;
      if (w.naturalna <= limit) return { wspolczynnik: 0, kara: kara, klasa: '' };
      var stopniOstatni = Math.ceil((w.naturalna - limit) / krok);
      return { wspolczynnik: 0, kara: kara + stopniOstatni * KARA_ZWEZENIA, klasa: ZWEZENIA[stopniOstatni - 1] };
    }
    if (w.odstepy < 1) return false; // wiersz bez odstępów nie ma czego rozciągać
    if (w.naturalna > limit) {
      // Zabrakło kilku pikseli: ściskamy wiersz i zostawiamy odstępy naturalne. Stopień zaokrąglamy
      // w górę, więc wiersz wychodzi odrobinę węższy od kolumny, nigdy szerszy.
      var stopni = Math.ceil((w.naturalna - limit) / krok);
      return { wspolczynnik: 0, kara: 100 + stopni * KARA_ZWEZENIA, klasa: ZWEZENIA[stopni - 1] };
    }
    // Luz chowamy najpierw w świetle liter (zaokrąglenie w dół, żeby nie rozepchnęło wiersza),
    // resztę oddajemy odstępom między wyrazami.
    var luz = limit - w.naturalna;
    var trak = krok ? Math.min(TRAKI.length, Math.floor(luz / krok)) : 0;
    var wspolczynnik = (luz - trak * krok) / (w.odstepy * akapit.spacja * ROZCIAGLIWOSC);
    return {
      wspolczynnik: wspolczynnik,
      kara: Math.pow(10 + 100 * Math.pow(Math.max(0, wspolczynnik), 3), 2),
      klasa: trak ? TRAKI[trak - 1] : ''
    };
  }

  /* ---------- łamanie ---------- */

  /**
   * Knuth–Plass: dla każdego możliwego końca wiersza szukamy najtańszego początku.
   * `tolerancja` ogranicza rozciągnięcie POJEDYNCZEGO wiersza, więc kary za wdowę i za złamanie
   * miękkiej twardej spacji nigdy nie kupią sobie wiersza luźniejszego, niż na to pozwoliliśmy.
   */
  function podzielNaWiersze(akapit, tolerancja) {
    var n = akapit.n;
    var koszt = new Array(n + 1);
    var skad = new Array(n + 1);
    for (var k = 0; k <= n; k++) { koszt[k] = Infinity; skad[k] = -1; }
    koszt[0] = 0;

    for (var j = 1; j <= n; j++) {
      if (j < n && akapit.lamanie[j] < 0) continue; // tu nie wolno złamać
      for (var p = j - 1; p >= 0; p--) {
        var ocena = ocenWiersz(akapit, p, j, j === n);
        if (ocena === null) break; // krótszy początek już się nie zmieści
        if (!ocena || ocena.wspolczynnik > tolerancja) continue;
        if (koszt[p] === Infinity || akapit.lamanie[p] < 0) continue;
        var razem = koszt[p] + ocena.kara + akapit.lamanie[p];
        if (razem < koszt[j]) { koszt[j] = razem; skad[j] = p; }
      }
    }
    if (koszt[n] === Infinity) return null; // nie znaleźliśmy podziału – zostawiamy przeglądarce

    var wiersze = [];
    var koniec = n;
    while (koniec > 0) {
      wiersze.unshift([skad[koniec], koniec]);
      koniec = skad[koniec];
    }
    return wiersze;
  }

  /* ---------- rendering ---------- */

  /**
   * Buduje jeden wiersz, odtwarzając elementy, w których siedzą wyrazy (linki, wyróżnienia).
   * Twarde spacje zamieniamy wewnątrz wiersza na zwykłe: wiersz jest już złamany, więc niczego
   * nie wiążą, a każda przeglądarka rozciąga zwykłą spację tak samo (i tekst kopiuje się czysto).
   */
  function zbudujWiersz(wyrazy, od, doIdx, ostatni, klasa) {
    var wiersz = document.createElement('span');
    wiersz.className = 'wiersz' + (ostatni ? ' wiersz--ostatni' : '') + (klasa ? ' ' + klasa : '');
    var stosZrodel = [];
    var stosKopii = [];
    var cel = wiersz;

    for (var i = od; i < doIdx; i++) {
      var w = wyrazy[i];
      // domykamy elementy, z których wyszliśmy
      var wspolne = 0;
      while (wspolne < stosZrodel.length && wspolne < w.przodkowie.length
        && stosZrodel[wspolne] === w.przodkowie[wspolne]) wspolne++;
      stosZrodel.length = wspolne;
      stosKopii.length = wspolne;
      cel = wspolne ? stosKopii[wspolne - 1] : wiersz;
      // otwieramy nowe
      for (var j = wspolne; j < w.przodkowie.length; j++) {
        var kopia = w.przodkowie[j].cloneNode(false);
        cel.appendChild(kopia);
        stosZrodel.push(w.przodkowie[j]);
        stosKopii.push(kopia);
        cel = kopia;
      }
      if (i > od && w.odstep) cel.appendChild(document.createTextNode(' '));
      cel.appendChild(document.createTextNode(w.tekst));
    }
    return wiersz;
  }

  /* ---------- przebieg ---------- */

  function zloz(blok, zapas) {
    if (!blok.dataset.oryginal) blok.dataset.oryginal = blok.innerHTML;
    else blok.innerHTML = blok.dataset.oryginal;
    blok.classList.remove('jest-justowany');
    // Akapit z własnym łamaniem albo z zagnieżdżonym blokiem zostawiamy przeglądarce.
    if (blok.querySelector('br, p, div, ul, ol, li, table')) return;

    var wyrazy = zbierzWyrazy(blok);
    if (wyrazy.length < 4) return;

    var pomiar = zmierz(wyrazy);
    if (!pomiar.spacja) return; // jeden wiersz – nie ma czego justować

    var styl = getComputedStyle(blok);
    // Tracking dokładamy tylko tam, gdzie krój nie ma własnego – inaczej klasa `trak-*` nadpisałaby
    // wartość z arkusza zamiast się do niej dodać. Na razie żaden justowany akapit takiej nie ma.
    var wlasnyTracking = parseFloat(styl.letterSpacing) || 0;
    var trakKrok = wlasnyTracking ? 0 : TRAK_KROK * (parseFloat(styl.fontSize) || 16);

    // Szerokość POLA TEKSTU, nie ramki: akapit bywa w pudełku z paddingiem (np. ramka „note”
    // w polityce prywatności), a wtedy ramka jest o ten padding szersza niż wiersz, który się w niej
    // mieści – wiersze złożone do ramki przeglądarka łamała po raz drugi.
    var szerokosc = blok.getBoundingClientRect().width
      - parseFloat(styl.paddingLeft) - parseFloat(styl.paddingRight)
      - parseFloat(styl.borderLeftWidth) - parseFloat(styl.borderRightWidth);
    var akapit = przygotuj(wyrazy, pomiar, szerokosc, trakKrok, zapas);
    // Pierwszy próg, przy którym podział w ogóle istnieje, daje najciaśniejszy możliwy najgorszy
    // wiersz. Potem jeszcze jeden przebieg z zapasem: kary (wdowa, miękka twarda spacja) mają wtedy
    // czym zapłacić, a rozjazd i tak zostaje ograniczony.
    var wiersze = null;
    var prog = 0;
    for (var t = 0; t < PROGI.length && !wiersze; t++) {
      prog = PROGI[t];
      wiersze = podzielNaWiersze(akapit, prog);
    }
    if (wiersze && prog < PROG_SWOBODY) {
      var zeSwoboda = podzielNaWiersze(akapit, PROG_SWOBODY);
      if (zeSwoboda) wiersze = zeSwoboda;
    }
    if (!wiersze) return;
    if (wiersze.length < 2) {
      // Cały akapit w jednym wierszu składamy tylko wtedy, gdy mieści się dopiero po ściśnięciu –
      // wtedy jedna linijka z naturalnymi odstępami wygrywa z dwiema, z których pierwsza byłaby
      // rozstrzelona (zmierzone na telefonie: 7,3 zwykłej spacji wobec ściśnięcia o 0,75%).
      // Akapit, który mieści się sam z siebie, zostawiamy przeglądarce – nie ma czego justować.
      var pojedynczy = ocenWiersz(akapit, wiersze[0][0], wiersze[0][1], true);
      if (!pojedynczy || !pojedynczy.klasa) return;
    }

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < wiersze.length; i++) {
      var ostatni = i === wiersze.length - 1;
      var ocena = ocenWiersz(akapit, wiersze[i][0], wiersze[i][1], ostatni);
      // Znak nowego wiersza między blokami: dla układu jest niewidoczny (biały znak między blokami
      // znika), ale bez niego skopiowany tekst i odczyt maszynowy sklejają wyraz z końca wiersza
      // z wyrazem z początku następnego („zrozumieszsiebie”).
      if (i > 0) fragment.appendChild(document.createTextNode('\n'));
      fragment.appendChild(zbudujWiersz(wyrazy, wiersze[i][0], wiersze[i][1], ostatni, ocena ? ocena.klasa : ''));
    }
    blok.textContent = '';
    blok.appendChild(fragment);
    blok.classList.add('jest-justowany');
  }

  /** Przywraca akapit do postaci sprzed justowania (chorągiewka). */
  function przywroc(blok) {
    if (blok.dataset.oryginal) blok.innerHTML = blok.dataset.oryginal;
    blok.classList.remove('jest-justowany');
  }

  /** Czy któryś wiersz akapitu przeglądarka złamała po raz drugi (jest wyższy niż jeden wiersz). */
  function zlamanyPonownie(blok) {
    var wysokosc = parseFloat(getComputedStyle(blok).lineHeight);
    if (!wysokosc) return false;
    var wiersze = blok.querySelectorAll('.wiersz');
    for (var i = 0; i < wiersze.length; i++) {
      if (wiersze[i].getBoundingClientRect().height > wysokosc * 1.4) return true;
    }
    return false;
  }

  function zlozWszystkie() {
    var doPoprawki = bloki.slice();
    for (var tura = 0; tura < ZAPASY.length && doPoprawki.length; tura++) {
      for (var i = 0; i < doPoprawki.length; i++) {
        try {
          zloz(doPoprawki[i], ZAPASY[tura]);
        } catch (err) {
          przywroc(doPoprawki[i]); // pojedynczy akapit nie może położyć strony
        }
      }
      // Sprawdzenie idzie po całej turze, więc układ przeliczany jest raz, a nie po każdym akapicie.
      var zostaly = [];
      for (var j = 0; j < doPoprawki.length; j++) {
        if (zlamanyPonownie(doPoprawki[j])) zostaly.push(doPoprawki[j]);
      }
      doPoprawki = zostaly;
    }
    // Czego nie udało się złożyć nawet z największym zapasem, zostaje chorągiewką – lepiej to
    // niż wiersze porozbijane przez przeglądarkę wbrew regułom polskiego składu.
    for (var k = 0; k < doPoprawki.length; k++) przywroc(doPoprawki[k]);
  }

  var zaplanowane;
  function przelicz() {
    // odraczamy o jedną turę pętli zdarzeń, żeby zebrać kilka wywołań w jedno przeliczenie
    clearTimeout(zaplanowane);
    zaplanowane = setTimeout(zlozWszystkie, 0);
  }

  // Fonty zmieniają szerokości wyrazów, więc czekamy na nie, zanim cokolwiek policzymy – i liczymy
  // ponownie, gdy dojdzie kolejny (odmiana wywołana dopiero przez element niżej na stronie).
  // Bez tego wiersze policzone krojem zastępczym zostałyby po podmianie za szerokie albo za wąskie.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(przelicz);
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', przelicz);
  } else {
    przelicz();
  }

  var szerokoscOkna = window.innerWidth;
  var licznik;
  window.addEventListener('resize', function () {
    // pionowa zmiana rozmiaru (pasek adresu na telefonie) nie zmienia szerokości kolumn
    if (window.innerWidth === szerokoscOkna) return;
    szerokoscOkna = window.innerWidth;
    clearTimeout(licznik);
    licznik = setTimeout(przelicz, 150);
  });
})();
