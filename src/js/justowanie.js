/* Justowanie tekstu z łamaniem wierszy jak w TeX-u (algorytm Knutha–Plassa).
 *
 * Dlaczego w ogóle: przeglądarka łamie wiersze zachłannie – bierze tyle wyrazów, ile wejdzie,
 * i dopiero potem rozciąga odstępy, żeby dobić do prawego marginesu. Przy polskich wyrazach daje to
 * pojedyncze wiersze rozstrzelone kilkakrotnie ponad normę (zmierzone na tej stronie: mediana 2,4
 * zwykłej spacji, skrajny wiersz 9,0) i widoczne „rzeki” bieli. `text-wrap: pretty` i `balance`
 * tego nie naprawiają – optymalizują chorągiewkę, więc przy justowaniu wypadają jeszcze gorzej
 * (zmierzone: 2,8 i 4,4 mediany).
 *
 * Co robimy: liczymy podział na wiersze dla całego akapitu naraz, minimalizując sumę kar za źle
 * wypełnione wiersze – tak jak TeX i InDesign. Luzu w akapicie nie da się zmniejszyć (to suma
 * długości wyrazów wobec szerokości kolumny), ale da się go rozłożyć równo. Znikają skrajne wiersze,
 * a tekst czyta się jako równy. Wyrazów nie dzielimy.
 *
 * Jak renderujemy: każdy wiersz to osobny blok z `text-align-last: justify`, więc ostateczne
 * rozciągnięcie odstępów robi przeglądarka – co do piksela. My decydujemy wyłącznie o tym,
 * GDZIE złamać wiersz, i stąd bierze się cała poprawa.
 *
 * Bez JavaScriptu tekst zostaje wyrównany do lewej (chorągiewka) – zachłanne justowanie wygląda
 * gorzej niż chorągiewka, więc nie włączamy go w CSS.
 */
(function () {
  'use strict';

  // Tekst ciągły: akapity i pozycje list, w których wiersz jest na tyle długi, że justowanie
  // ma sens. Nagłówki, etykiety, przyciski i podpisy zostają wyrównane do lewej.
  // Tylko akapity tekstu ciągłego. Pozycji list nie justujemy: są krótkie, więc zostaje w nich
  // za mało odstępów, żeby rozłożyć luz – tak samo robi się w składzie książkowym.
  var BLOKI = [
    '.hero__lead', '.section-intro', '.situation__desc', '.about__private',
    '.mode p', '.card p', '.step p', '.principle p', '.origin p', '.contact__copy p',
    '.about__copy > p', '.prose p'
  ].join(',');
  // Kolejne przebiegi z coraz luźniejszym kryterium – tak samo działa TeX. Bierzemy pierwszy
  // podział, który się uda: im wcześniejszy przebieg, tym ciaśniejsze odstępy. Gdy nawet ostatni
  // próg nie daje sensownego wyniku, akapit zostaje chorągiewką – lepiej to niż wiersz rozstrzelony
  // kilkakrotnie ponad normę. Próg 3 odpowiada odstępowi ok. 2,8 zwykłej spacji.
  var PROGI = [1.2, 1.8, 2.4, 3.2, 4.5, 6, 8, 12, 20];
  var ROZCIAGLIWOSC = 0.6; // przy współczynniku 1 odstęp rośnie o 60% – tak jak domyślnie w TeX-u
  var MARGINES = 0.5;      // px zapasu, żeby przeglądarka nie złamała wiersza, który u nas „wchodzi”

  var bloki = Array.prototype.slice.call(document.querySelectorAll(BLOKI));
  if (!bloki.length) return;

  /* ---------- pomiar ---------- */

  /** Zbiera wyrazy akapitu razem z łańcuchem elementów, w których siedzą (linki, wyróżnienia). */
  function zbierzWyrazy(blok) {
    var wyrazy = [];
    var walker = document.createTreeWalker(blok, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var tekst = node.nodeValue;
      if (!tekst.trim()) continue;
      var przodkowie = [];
      for (var el = node.parentNode; el && el !== blok; el = el.parentNode) przodkowie.unshift(el);
      var re = /[^ \t\n\r]+/g;
      var m;
      while ((m = re.exec(tekst))) {
        wyrazy.push({ tekst: m[0], node: node, od: m.index, do: m.index + m[0].length, przodkowie: przodkowie });
      }
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
    // Bierzemy ją z realnego układu, więc uwzględnia krój, stopień i letter-spacing.
    var odstepy = [];
    for (var i = 0; i < prostokaty.length - 1; i++) {
      var a = prostokaty[i];
      var b = prostokaty[i + 1];
      if (Math.abs(a.top - b.top) < 3 && b.left > a.right) odstepy.push(b.left - a.right);
    }
    odstepy.sort(function (x, y) { return x - y; });
    return { szerokosci: szerokosci, spacja: odstepy.length ? odstepy[Math.floor(odstepy.length / 2)] : 0 };
  }

  /* ---------- łamanie ---------- */

  /**
   * Knuth–Plass: dla każdego możliwego końca wiersza szukamy najtańszego początku.
   * Kara rośnie z trzecią potęgą rozciągnięcia, więc jeden bardzo zły wiersz kosztuje więcej
   * niż kilka lekko gorszych – i dlatego wynik jest równy, a nie tylko „jakoś dobity”.
   */
  function podzielNaWiersze(szerokosci, spacja, szerokoscKolumny, tolerancja) {
    var n = szerokosci.length;
    var suma = [0];
    for (var i = 0; i < n; i++) suma.push(suma[i] + szerokosci[i]);
    var NIESKONCZONOSC = Infinity;
    var koszt = new Array(n + 1);
    var skad = new Array(n + 1);
    for (var k = 0; k <= n; k++) { koszt[k] = NIESKONCZONOSC; skad[k] = -1; }
    koszt[0] = 0;

    for (var j = 1; j <= n; j++) {
      for (var p = j - 1; p >= 0; p--) {
        if (koszt[p] === NIESKONCZONOSC) continue;
        var luki = j - p - 1;
        var naturalna = suma[j] - suma[p] + luki * spacja;
        if (naturalna > szerokoscKolumny - MARGINES) break; // krótszy początek już się nie zmieści
        var kara;
        if (j === n) {
          // Ostatni wiersz nie jest rozciągany, ale nie może zostać w nim jeden wyraz (wdowa).
          // Kara, nie zakaz: przy krótkim akapicie innego podziału może po prostu nie być.
          kara = (j - p) < 2 ? 1e13 : 0; // musi przebić nawet najluźniejszy dopuszczalny wiersz
        } else if (luki < 1) {
          continue; // wiersz z jednym wyrazem nie ma czego rozciągać
        } else {
          var wspolczynnik = (szerokoscKolumny - naturalna) / (luki * spacja * ROZCIAGLIWOSC);
          if (wspolczynnik > tolerancja) continue;
          kara = Math.pow(10 + 100 * Math.pow(wspolczynnik, 3), 2);
        }
        if (koszt[p] + kara < koszt[j]) { koszt[j] = koszt[p] + kara; skad[j] = p; }
      }
    }
    if (koszt[n] === NIESKONCZONOSC) return null; // nie znaleźliśmy podziału – zostawiamy przeglądarce

    var wiersze = [];
    var koniec = n;
    while (koniec > 0) {
      wiersze.unshift([skad[koniec], koniec]);
      koniec = skad[koniec];
    }
    return wiersze;
  }

  /* ---------- rendering ---------- */

  /** Buduje jeden wiersz, odtwarzając elementy, w których siedzą wyrazy (linki, wyróżnienia). */
  function zbudujWiersz(wyrazy, od, doIdx, ostatni) {
    var wiersz = document.createElement('span');
    wiersz.className = 'wiersz' + (ostatni ? ' wiersz--ostatni' : '');
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
      if (i > od) cel.appendChild(document.createTextNode(' '));
      cel.appendChild(document.createTextNode(w.tekst));
    }
    return wiersz;
  }

  /* ---------- przebieg ---------- */

  function zloz(blok) {
    if (!blok.dataset.oryginal) blok.dataset.oryginal = blok.innerHTML;
    else blok.innerHTML = blok.dataset.oryginal;
    blok.classList.remove('jest-justowany');

    var wyrazy = zbierzWyrazy(blok);
    if (wyrazy.length < 4) return;

    var pomiar = zmierz(wyrazy);
    if (!pomiar.spacja) return; // jeden wiersz – nie ma czego justować

    var szerokosc = blok.getBoundingClientRect().width;
    // Bierzemy pierwszy podział bez wdowy (jednego wyrazu w ostatnim wierszu). Gdy żaden przebieg
    // takiego nie daje, wracamy do pierwszego, jaki się udał – lepszy podział z wdową niż brak.
    var wiersze = null;
    var zapasowy = null;
    for (var t = 0; t < PROGI.length && !wiersze; t++) {
      var kandydat = podzielNaWiersze(pomiar.szerokosci, pomiar.spacja, szerokosc, PROGI[t]);
      if (!kandydat) continue;
      if (!zapasowy) zapasowy = kandydat;
      var ostatniWiersz = kandydat[kandydat.length - 1];
      if (ostatniWiersz[1] - ostatniWiersz[0] >= 2) wiersze = kandydat;
    }
    if (!wiersze) wiersze = zapasowy;
    if (!wiersze || wiersze.length < 2) return;

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < wiersze.length; i++) {
      fragment.appendChild(zbudujWiersz(wyrazy, wiersze[i][0], wiersze[i][1], i === wiersze.length - 1));
    }
    blok.textContent = '';
    blok.appendChild(fragment);
    blok.classList.add('jest-justowany');
  }

  function zlozWszystkie() {
    for (var i = 0; i < bloki.length; i++) {
      try {
        zloz(bloki[i]);
      } catch (err) {
        // pojedynczy akapit nie może położyć strony – zostaje chorągiewka
        if (bloki[i].dataset.oryginal) bloki[i].innerHTML = bloki[i].dataset.oryginal;
        bloki[i].classList.remove('jest-justowany');
      }
    }
  }

  var zaplanowane;
  function przelicz() {
    // odraczamy o jedną turę pętli zdarzeń, żeby zebrać kilka wywołań w jedno przeliczenie
    clearTimeout(zaplanowane);
    zaplanowane = setTimeout(zlozWszystkie, 0);
  }

  // Fonty zmieniają szerokości wyrazów, więc czekamy na nie, zanim cokolwiek policzymy.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(przelicz);
  else przelicz();

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
