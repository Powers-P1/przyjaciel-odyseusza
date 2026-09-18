# Review wersji 05 „Pełne morze” – UI/UX, copy, user story

Dokument wewnętrzny (agencja). Podsumowuje analizę korespondencji z klientem, ocenę zaakceptowanej
makiety z fazy 01 oraz zmiany naniesione w kodzie. Wszystkie poprawki są już wdrożone w `index.html`.

---

## 1. Co wynika z korespondencji z klientem

**Decyzje klienta (chronologicznie)**

| Data | Ustalenie |
|------|-----------|
| 1 IX | Odrzucone koncepcje 1, 2, 7, 8, 9, 10. Na spotkaniu najbardziej podobały się 3, 5, 6. |
| 4 IX | W grze tylko 3 i 5: „minimalistyczny, profesjonalny, lecz ciepły”. Z 6 chce **duże, czytelne logo z dopiskiem „poznaj siebie”**. Z 3 i 11 lubi **zdjęcia**, ale zauważył koszulkę long sleeve (to zdjęcie poglądowe z PDF-a, nie z sesji). Wersja 12 „ma coś w sobie” (ciemna elegancja). |
| 4 IX | Wymagania merytoryczne: **coaching jako równorzędny element oferty**; oferta widoczna od razu; obok B2B **zasygnalizować ofertę indywidualną** na górze strony. |
| 16 IX | **Wybór: „Pełne morze” (05)**. |

**Wnioski dla projektu**

- Ciemna, granatowo-zielona wersja ze złotem odpowiada temu, co klienta „ciągnęło” w 12, a jednocześnie zachowuje ciepło i czytelność, których szukał w 3.
- Klient myśli o dwóch odbiorcach jednocześnie (firma zlecająca i menedżer zgłaszający się sam). Strona musi obsłużyć oba wejścia bez rozbijania jednej narracji.
- Klient jest wrażliwy na szczegóły wizualne (koszulka, wielkość logo). Warto przewidzieć, że będzie miał uwagi do kadrów, dlatego podmiana zdjęć jest opisana w README.

---

## 2. User story landing page’a

To one-pager, więc „user story” sprowadza się do dwóch ścieżek decyzji i jednej pobocznej.

**Persona A – HR Business Partner / członek zarządu / właściciel firmy**
Szuka zewnętrznego mentora dla świeżo awansowanego dyrektora lub menedżera w trudnym momencie.
Pytania w głowie: *Czy ta osoba zna realia zarządzania, czy tylko coaching z książki? Jak wygląda
proces i poufność wobec firmy? Jak zacząć?*
Ścieżka: hero (kto, dla kogo) → pasek dowodów (20 lat, firmy, psychologia) → „Dla firm” →
„Jak to wygląda w praktyce” (rozmowa trójstronna, poufność) → O mnie (CV) → formularz z opcją
„Menedżera w mojej firmie”.

**Persona B – menedżer szukający wsparcia dla siebie**
Zarządza ludźmi, czuje presję, nie ma z kim szczerze porozmawiać o decyzjach.
Pytania: *Czy on rozumie moją sytuację? Czy to bezpieczne i dyskretne? Co mnie to kosztuje na start?*
Ścieżka: hero (nagłówek mówi wprost do niego) → „Kiedy warto porozmawiać” (rozpoznaje siebie) →
„Indywidualnie” (dyskrecja, bez pośrednictwa firmy) → bezpłatna rozmowa → formularz „Swojej”.

**Ścieżka poboczna – osoba, która dostała link/wizytówkę i sprawdza wiarygodność**
Skanuje: zdjęcie, firmy, SWPS, zasady. Potrzebuje 30 sekund i jednego kliknięcia do kontaktu.

Każda ścieżka kończy się tym samym niskoprogowym krokiem: **bezpłatna rozmowa wstępna**.
W makiecie ta obietnica była schowana dopiero w sekcji kontaktu. Teraz pojawia się już w hero
(mikro-tekst pod przyciskami), w karcie „Indywidualnie” i jako krok 01 procesu.

---

## 3. Review makiety 05 (faza 01) – co działa i co poprawiono

**Co działa i zostało zachowane**

- Paleta (#12343e / #f3eee5 / #d4bd89), rytm ciemne–jasne–ciemne–jasne, serif w nagłówkach.
- Nagłówek hero „Zarządzasz ludźmi i wynikami. Zadbaj też o wsparcie dla siebie.” Mówi do
  odbiorcy w 2. osobie, nazywa jego sytuację i daje „przyzwolenie”. Zostawiony bez zmian.
- Lead pod nagłówkiem i cała sekcja „Mentoring i coaching” (dwie kolumny). Klient je widział
  i zaakceptował, więc zmiany są tylko uzupełnieniami.
- Lista „Kiedy warto porozmawiać” z ikonami liniowymi.
- Formularz z 3 polami i bezpośrednie dane kontaktowe obok.

**Problemy i naniesione poprawki**

| # | Element | Problem w makiecie | Poprawka w kodzie |
|---|---------|--------------------|-------------------|
| 1 | Eyebrow w hero | „Mentoring dla menedżerów i liderów” – zniknął coaching, o który klient wyraźnie prosił. | „Mentoring **i coaching** dla menedżerów i liderów”. |
| 2 | Sygnał B2B + indywidualnie | E-mail agencji obiecywał sygnał oferty indywidualnej „wprost w nagłówku”, ale hero mówi tylko do menedżera. Firma (HR/zarząd) nie znajduje siebie do sekcji kontakt. | Dodane zdanie w hero: „Pracuję z firmami, które chcą wesprzeć swoich menedżerów, oraz z osobami, które zgłaszają się same.” Plus nowa sekcja **„Dla firm i dla Ciebie”** z dwiema kartami. |
| 3 | Pasek dowodów pod hero | Tylko 2 pozycje, trzecia kolumna pusta – układ wygląda na niedokończony. Coaching znów nieobecny. | 3 kolumny jak w koncepcie z PDF: 20 lat (z nazwami firm), psychologia (SWPS), **mentoring i coaching**. Firmy pojawiają się jako social proof już na górze. |
| 4 | Imię i nazwisko w hero | Samo nazwisko złotym serifem, bez roli. | Dopisek roli: „mentor i coach · ponad 20 lat w zarządzaniu”. |
| 5 | CTA | „Porozmawiajmy” bez informacji, że rozmowa jest bezpłatna; obietnica dopiero na dole. | Mikro-tekst pod przyciskami: „Pierwsza rozmowa jest bezpłatna i niezobowiązująca.” |
| 6 | Nawigacja | 3 linki tekstowe, brak sticky, brak wyróżnionego CTA. | Sticky header z blur, 4 linki + przycisk „Kontakt” w złotym obrysie, podświetlenie aktywnej sekcji, menu mobilne. |
| 7 | Mobile hero | Portret w całości pod paskiem dowodów – użytkownik scrolluje przez wysokie zdjęcie, zanim dotrze do oferty. | Portret ograniczony do ~82 vw / 22 rem, pasek dowodów pod nim, jedna kolumna. |
| 8 | Brak procesu | Odbiorca B2B nie wie, jak wygląda współpraca (kontraktowanie z firmą, poufność, forma spotkań). To największa luka konwersyjna. | Nowa sekcja **„Jak to wygląda w praktyce”** (4 kroki) + **„Zasady, na których pracuję”** (poufność, partnerstwo, konkret). |
| 9 | „Kiedy warto porozmawiać” | 3 sytuacje; koncept z PDF miał 4, w tym „w trudnym momencie”, który najlepiej otwiera na coaching. | Dodana 4. sytuacja: „Jesteś pod presją”. Numeracja 01–04 obok ikon (nawiązanie do PDF-a). |
| 10 | Nagłówek „O mnie” | „Za moim wsparciem stoi praktyka zarządzania.” – składnia niezręczna, słabe zdanie. | Linia z koncepcji 05 w PDF: **„Ponad 20 lat po stronie biznesu, zanim usiadłem po stronie mentora.”** |
| 11 | Zdjęcie w „O mnie” | W wersji 05 brak drugiego zdjęcia, mimo że klient chwalił zdjęcia (w tym „siedzące”). | Dodane zdjęcie siedzące z sesji w ramce ze złotym obrysem i ściętym narożnikiem. |
| 12 | Nazwa marki | Nikt nie tłumaczy, dlaczego „Przyjaciel Odyseusza” i „poznaj siebie”. Odbiorca B2B może uznać nazwę za dziwną. | Krótki blok „Dlaczego Przyjaciel Odyseusza?” (Mentor jako przyjaciel Odyseusza, źródło słowa „mentoring”; maksyma delficka). Buduje głębię marki w 3 zdaniach. |
| 13 | Sekcja „Opinie” | Placeholder „miejsce na opinie” na produkcji = sygnał „nie ma klientów”. | Sekcja zbudowana, ale **ukryta** (`hidden`) do czasu otrzymania rekomendacji. Włączenie = usunięcie jednego atrybutu. |
| 14 | Formularz | Brak kwalifikacji leada (firma vs osoba), brak telefonu, brak stanów błędu/sukcesu, brak ochrony antyspamowej, link „Informacja o prywatności” prowadził donikąd. | Pola: imię, e-mail, telefon (opcjonalny), wybór „W czyjej sprawie piszesz?”, wiadomość. Walidacja inline, komunikat sukcesu/błędu z awaryjnym mailto, honeypot + czas, opcjonalny Turnstile. Strona polityki prywatności napisana. |
| 15 | Stopka | Tylko nazwa. | Logo, tagline, e-mail, telefon, polityka prywatności, rok. |
| 16 | Kontrast | Złoty tekst (#bdad87) na kremie (#f3eee5) ma kontrast ~1.9:1 – nieczytelny. | Na kremie złoto przyciemnione do #7a6538 (≥ 4.8:1, AA). Na teal złoto #d4bd89 (~7:1). |
| 17 | Detal marki | Makieta zgubiła motyw „kursu” z PDF-a (złote linie, ścięte narożniki). | Ścięte narożniki na przycisku głównym, kartach i ramce zdjęcia; złote „romby” na osi procesu. Subtelnie, bez przesady. |

---

## 4. Review copy – zmiany i uzasadnienie

**Zasady, które przyjąłem**

- Zachować głos z makiety: 2. osoba liczby pojedynczej, krótkie zdania, bez żargonu coachingowego
  („transformacja”, „potencjał”, „podróż”).
- Nie obiecywać rzeczy, których klient nie potwierdził (certyfikaty, liczba sesji, ceny).
- Każda sekcja kończy się odpowiedzią na pytanie „i co dalej?”.

**Najważniejsze zmiany zdań**

| Było (makieta) | Jest | Dlaczego |
|----------------|------|----------|
| Mentoring dla menedżerów i liderów | Mentoring i coaching dla menedżerów i liderów | Wymóg klienta. |
| – | Pracuję z firmami, które chcą wesprzeć swoich menedżerów, oraz z osobami, które zgłaszają się same. | Jedno zdanie obsługuje oba wejścia (B2B / indywidualne) już w hero. |
| Ponad 20 lat doświadczenia menedżerskiego | + „stanowiska dyrektorskie w CEDC, Eurocash i Herbapolu” | Nazwy firm to najsilniejszy dowód dla odbiorcy B2B; w makiecie były dopiero w 4. ekranie. |
| Odpowiednią formę wsparcia ustalamy na podstawie Twojej sytuacji i potrzeb. | + „Często łączymy obie.” | Uprzedza pytanie „mentoring czy coaching?” i zdejmuje presję wyboru. |
| (opisy Mentoring / Coaching) | + listy „Sprawdza się, gdy:” (3 punkty każda) | Abstrakcyjne definicje zamienione w rozpoznawalne sytuacje. |
| Za moim wsparciem stoi praktyka zarządzania. | Ponad 20 lat po stronie biznesu, zanim usiadłem po stronie mentora. | Mocniejsze, obrazowe, z PDF-a, który klient widział. |
| Znam odpowiedzialność za ludzi, wyniki i decyzje z własnego doświadczenia. | + „…, nie z podręcznika.” | Kontrast wobec „coacha z książki” – obawa persony A. |
| Szukasz wsparcia dla menedżera w firmie lub dla siebie? Napisz kilka zdań o potrzebie. | Szukasz wsparcia dla menedżera w swojej firmie lub dla siebie? Napisz kilka zdań o sytuacji. Odpowiadam osobiście, zwykle w ciągu dwóch dni roboczych. | „Sytuacja” brzmi naturalniej niż „potrzeba”; obietnica czasu odpowiedzi obniża próg. **Termin do potwierdzenia.** |
| Miejsce na opinie klientów – treści do uzupełnienia | (sekcja ukryta) | Placeholder szkodzi wiarygodności. |

**Nowe teksty (nie było ich w makiecie)**: sekcja „Dla firm i dla Ciebie”, „Jak to wygląda w praktyce”,
„Zasady, na których pracuję”, „Dlaczego Przyjaciel Odyseusza?”, 4. sytuacja „Jesteś pod presją”,
komunikaty formularza, polityka prywatności, strona 404, meta title/description, tekst alternatywny zdjęć.

---

## 4a. Ugruntowanie copy w obecnej stronie klienta (16.09.2026)

Po pierwszej wersji copy przeanalizowaliśmy obecną stronę <https://przyjacielodyseusza.pl/> (WordPress,
one-pager; pełny tekst w `docs/zrodla/obecna-strona-www-2026-09-16.txt`). To jedyne źródło faktów o CV,
wykształceniu, zasadach i cenniku. Z tekstu wyekstrahowano 206 faktów, każdą sekcję przeaudytowano,
a każdą proponowaną zmianę zweryfikowano w trzech soczewkach (pokrycie w źródle, brief i głos, język).
Przeszły 42 zmiany, 35 odrzucono (głównie za długość lub brak pokrycia w źródle).

**Co się zmieniło względem pierwszej wersji**

- Fakty, które wcześniej były moim założeniem, a nie miały pokrycia, zostały usunięte: „około 30 minut”,
  rozmowa trójstronna z HR, raportowanie do firmy zlecającej, „dwa dni robocze” na odpowiedź, „konflikt w zespole”.
- Dodane fakty ze źródła: Premium Cigars (Vistula Retail Group) jako dyrektor generalny i prezes zarządu,
  Herbapol w Grupie Polpharma, „największe firmy FMCG w Polsce”, budżety, przejęcia, restrukturyzacje,
  współtworzenie programów mentoringowych, magisterium z psychologii (SWPS 2004, prof. Bralczyk), program
  „Psychologia i Coaching od podstaw” (SWPS), studia podyplomowe SGH, Kellogg, Lisbon School of Business
  and Economics, dwa wine bary i doradztwo.
- Klient publikuje cennik i sześć zasad współpracy, więc nowa strona też to robi: blok „Cennik”
  (pierwsze spotkanie bezpłatne, stawka od 300 PLN, warunki indywidualne) i sześć zasad w jego brzmieniu.
  Moja wcześniejsza decyzja o pominięciu cennika była błędna.
- Głos: tagline klienta „Mentor biznesowy | Coach | Psycholog” w byline i stopce, jego CTA „Umów bezpłatną
  rozmowę wstępną”, sygnatura „pytam, podpowiadam i słucham, ale nie oceniam”, filozofia małych kroków
  („kamienie calowe zamiast milowych”), „bez zrywów, bez pośpiechu, w Twoim tempie”.
- Zwięzłość: twarde budżety słów na każdy slot (lead ≤ 45, intro ≤ 30, opis karty ≤ 30, opis kroku ≤ 28,
  zasada ≤ 16 słów). Jedna informacja ma jedno miejsce kanoniczne (cennik, formy spotkań, kontrakt).
- SEO: title 58 znaków z marką na końcu, description 147 znaków z CTA, frazy „mentoring dla menedżerów”,
  „coaching dla liderów”, „mentor biznesowy”, „mentoring biznesowy”, „psycholog” w title, H2, alt i JSON-LD;
  w JSON-LD `jobTitle`, `hasCredential`, `alumniOf`, `priceRange` zgodne z widoczną treścią.

## 4b. Audyt copy wersji A pod SEO i czytelność (17.09.2026)

Cztery niezależne przeglądy (frazy i intencje wyszukiwania z researchu rynku, struktura i semantyka strony,
jakość polszczyzny, zgodność faktów ze źródłem), każda propozycja zweryfikowana przez dwóch recenzentów.
Z 34 propozycji potwierdzono 25, wdrożono 22. Frazy główne (tak nazywają usługę strony konkurencji i tak
szukają klienci): „mentoring dla menedżerów”, „coaching dla menedżerów”, „mentoring biznesowy”;
uzupełniające: „coaching dla liderów”, „mentoring biznesowy online”.

Wdrożone zmiany:

- meta description: „Mentoring biznesowy i coaching dla menedżerów i liderów. Bartłomiej Przytuła: psycholog, ponad 20 lat
  w zarządzaniu. Pierwsza rozmowa bezpłatna.” (144 znaki, fraza kategorii i „liderów” jak w H1);
- nagłówek karty „Dla firm”: „Mentoring dla menedżerów w Twojej organizacji” (fraza o intencji zakupowej, wcześniej nieobecna);
- krok 03: „Indywidualne spotkania online lub stacjonarne” (forma spotkań widoczna wcześniej niż w zasadach; „w ustalonej
  formie i rytmie” powtarzało krok 02); to samo w opisie JSON-LD;
- H2 sekcji współpracy: „Jak wygląda praca ze mną: kroki, zasady i cennik” (bez wiszącego „to”);
- link po cenniku: „Umów rozmowę wstępną” zamiast „Przejdź do kontaktu”;
- fakty: „Zapraszam do współpracy firmy…” zamiast „Pracuję z firmami…” (źródło nie potwierdza bieżących klientów B2B),
  „w firmach, w których pracowałem” bez „FMCG” (źródło nie precyzuje branży programów mentoringowych),
  „nie ma głębszego sensu” (zastrzeżenie klienta z jego strony);
- polszczyzna: karta „Indywidualnie” zaczyna się od pytania („Zarządzasz ludźmi i chcesz mieć kogoś…?”), zdanie o łączeniu
  myślenia lidera z wrażliwością psychologa podzielone na dwa, „zastanawiasz się, jakim liderem chcesz być” (bez podwójnego
  „chcesz”), wstęp do współpracy bez trzeciego „zasady”, „szyta na miarę potrzeb osoby lub firmy oraz etapu życia i kariery”,
  „Od 300 PLN.” jak sąsiednie pola cennika, „przyjacielowi Mentorowi” bez przecinka, formy neutralne płciowo w 404
  („Ten adres nie istnieje”) i w polityce („gdy mi je przekażesz”);
- spójność: „Mentor biznesowy | Coach | Psycholog” także w stopce, nagłówek „Zacznijmy od rozmowy” bez kropki,
  alt portretów bez opisu ubrania (zdjęcia do podmiany) i z „coach” w obu.

Odrzucone świadomie (3): przeredagowanie leadu hero („uporządkować priorytety i zaplanować kolejne kroki”), zdania
o mentoringu („Dzielę się tym, czego nauczyła mnie praktyka zarządzania”) i sytuacji 02 („Chcesz je spokojnie
przeanalizować”) – to zdania, które klient sam przepisał w uwagach jako docelowe, więc zostają w jego brzmieniu.
Do rozważenia przez klienta przy wyborze wersji.

## 4c. Trzy wersje do wyboru przez klienta (17.09.2026)

Każda wersja ma osobny adres testowy (spis: <https://powers-p1.github.io/przyjaciel-odyseusza/wersje/>) i osobną
gałąź w repozytorium. Wspólne dla wszystkich: hero wypełnia pierwszy ekran, typografia bez sierot, ta sama
warstwa techniczna, testy i CI.

**Wersja A – pełna** (`main`): copy z sekcji 4/4a/4b. Dla klienta, który chce, żeby strona odpowiadała na wszystkie
pytania bez kontaktu: oferta, dla kogo, sytuacje, przebieg, zasady, cennik, pełne CV, historia nazwy.

**Wersja B – lekka** (`wersja-b`): ten sam układ, tekst skrócony na podstawie badań czytelnictwa
(założenia i źródła: `docs/wersja-b-zalozenia.md`). Dla czytelnika, który skanuje: nagłówki niosą ofertę same,
akapit najwyżej trzy zdania, jedno wezwanie do działania w jednym brzmieniu („Umów bezpłatną rozmowę”).
Hero ma jeden akapit opisu zamiast dwóch. Zachowane wbrew skrótowi: podpis w hero, tytuły kart w „Dla kogo”
i tabele CV – to najbardziej skanowalne elementy i dowody kompetencji, a ich wycięcie osłabiłoby wiarygodność
(wariant bez nich to wersja C).

Objętość tekstu w sekcji `main`, bez nawigacji, stopki, formularza i ukrytych opinii:

| Wersja | Słowa | Udział wobec A |
| --- | --- | --- |
| A – pełna | 917 | 100% |
| B – lekka | 630 | 69% |
| C – według uwag | 313 | 34% |

Sama proza wersji B (bez tabel CV, które są danymi do skanowania, nie do czytania) to ok. 555 słów, czyli
w budżecie 450–550 z założeń. Treść powstała z trzech niezależnych szkiców ocenionych przez panel
(skanowalność, SEO, polszczyzna) i przeszła korektę faktograficzną: usunięto cztery sformułowania bez pokrycia
w wersji A („nawyki” zamiast „sposoby działania”, „budujesz zespół” zamiast „budujesz strukturę i procesy”,
„talenty przed awansem” zamiast „talenty wskazane do awansu”, skrócone nazwy grup kapitałowych) oraz rodzajową
formę „Zgłoś się sam”. Listy zostawiono w konwencji wersji A (małą literą, z przecinkami), żeby porównanie
dotyczyło treści, a nie interpunkcji.

**Wersja C – według uwag** (`wersja-c`): układ i treść z pliku „pełne morze uwagi” (uwagi klienta do kierunku
technicznego, przeniesione na styl „Pełne morze”). Decyzje, które wymagały interpretacji:

- Struktura jak w recenzowanej makiecie: hero → mentoring i coaching → kiedy warto porozmawiać (3 sytuacje z ikonami)
  → doświadczenie → opinie → kontakt. Sekcji „Dla kogo”, przebiegu współpracy, zasad, cennika i historii nazwy
  w makiecie nie było, więc ich nie ma; jeśli klient chce cennik lub zasady, przenosimy je z wersji A.
- Hero: nadtytuł „Mentoring dla menedżerów i liderów”, jeden akapit opisu w brzmieniu klienta, przyciski jak
  w makiecie („Porozmawiajmy”, „Poznaj ofertę”), bez tekstu pod przyciskami. Portret sięga linii paska faktów
  (uwaga „nogi ucina za wcześnie”). Pasek faktów jak w makiecie: doświadczenie i wykształcenie.
- Wprowadzenie do oferty w wersji klienta było gramatycznie niedomknięte („…dobierając odpowiednią formę wsparcia
  ustalamy na podstawie…”); poprawione na: „Nie podejmuję decyzji za Ciebie. Pomagam Ci je przemyśleć, dobierając
  odpowiednią formę wsparcia. Ustalamy ją na podstawie Twojej sytuacji i potrzeb.” – do akceptacji.
- „O mnie”: nagłówek, opis i lista stanowisk dokładnie z uwag (CEDC, Eurocash, Herbapol, magister psychologii SWPS),
  bez zdania „W moim doświadczeniu zawodowym:”. Pozostałe fakty z CV (Premium Cigars, SGH, Kellogg) są w wersjach A i B.
- Sekcja „Opinie” dodana między doświadczeniem a formularzem jako widoczne miejsce na dwie rekomendacje
  (treść do uzupełnienia przez klienta).
- Uwaga o „zgięciu” linii dotyczyła motywu graficznego kierunku technicznego; w „Pełnym morzu” takiej linii nie ma.
- Uwaga o zdjęciu: portret w hero jest wycinkiem z makiety; przed publikacją do podmiany na oryginał z sesji
  (dotyczy wszystkich wersji).

## 4d. Hero na jeden ekran i polski skład tekstu (18.09.2026)

Dwie uwagi z przeglądu strony testowej: hero nie wypełniało całego widoku i w tekście zostawały
„sieroty”. Obie dotyczyły wszystkich trzech wersji, więc naprawa siedzi we wspólnej warstwie.

**Hero jako scena.** Sekcja miała `min-height: 100svh`, ale jej treść była wyższa od okna: przy
1440×900 hero mierzyło 1115 px przy 815 px dostępnych, czyli pasek faktów wypadał poniżej krawędzi.
Wariant kompaktowy włączał się dopiero poniżej 896 px wysokości okna, więc typowe laptopy trafiały
w lukę. Zamiast kolejnego progu wysokość okna weszła na stałe do skali pionu: `--hero-rytm`,
`--hero-pad` i `--hero-title` liczone są przez `min()` z miary szerokości i wysokości, a wszystkie
odstępy hero i paska faktów są ich wielokrotnościami. Przy okazji `--header-h` oznacza teraz pełną
wysokość przyklejonego nagłówka razem z kreską pod nim – bez tego hero wystawało o 1 px.
Pilnuje tego test smoke na pięciu rozdzielczościach (1366×768 … 2560×1440).

**Sieroty.** Narzędzie `tools/nbsp.mjs` wiązało tylko wyrazy jednoliterowe, więc „Na”, „do”, „za”
nadal kończyły wiersze. Teraz wiąże wszystkie wyrazy jedno- i dwuliterowe oraz przyimki i spójniki
z listy (bez, dla, nad, pod, oraz, przy, przed, według…), liczby z jednostkami, skróty, inicjały,
numer telefonu i półpauzę. Encje i znaczniki są maskowane, dzięki czemu wiązanie przechodzi przez
elementy inline („napisz na&nbsp;<a>adres</a>”), ale nigdy przez granicę akapitu ani `<br>`.
Na stronie głównej dało to 247 twardych spacji zamiast 138.

**Kontrola zamiast deklaracji.** `tests/typografia.spec.js` nie sprawdza źródła HTML, tylko mierzy
w przeglądarce, gdzie faktycznie kończy się każdy wiersz, przy czterech szerokościach okna
(390, 834, 1280, 1600 px) i na obu podstronach.

> Uzupełnienie z 18.09.2026: w tej sekcji stało wcześniej, że tekstu nie justujemy. Klient
> zdecydował inaczej i tekst jest dziś justowany – bez dzielenia wyrazów. Jak to zrobiono
> i co kosztowało: sekcja 4e.

---

## 4e. Justowanie, mikrotypografia i szerokość kolumn (18.09.2026)

Decyzja klienta: tekst ma być justowany na całej stronie i ma być równy, ale bez dzielenia wyrazów.
To trudniejszy wariant niż jedno i drugie osobno, bo dzielenie wyrazów jest w składzie głównym
narzędziem do wyrównywania odstępów. Poniżej: co zbudowano zamiast niego i ile to kosztuje.

**Dlaczego samo `text-align: justify` nie wystarcza.** Przeglądarka łamie wiersze zachłannie: bierze
tyle wyrazów, ile wejdzie, a dopiero potem rozciąga odstępy do prawego marginesu. Przy polskich
wyrazach (długich i odmienionych) daje to pojedyncze wiersze rozstrzelone kilkakrotnie ponad normę
i widoczne „rzeki” bieli. `text-wrap: pretty` i `balance` tego nie naprawiają – optymalizują
chorągiewkę, nie wypełnienie wiersza, więc przy justowaniu wypadają jeszcze gorzej (zmierzone
mediany 2,8 i 4,4 wobec 2,4 dla zwykłego justowania).

**Cztery warstwy rozwiązania** (`src/js/justowanie.js`, `src/css/style.css`):

1. **Łamanie całego akapitu naraz** – algorytm Knutha–Plassa, ten sam co w TeX-u i InDesignie.
   Kara za wiersz rośnie z trzecią potęgą rozciągnięcia, więc jeden fatalny wiersz kosztuje więcej
   niż kilka lekko gorszych. Rozciąganie odstępów zostaje po stronie przeglądarki (każdy wiersz to
   osobny blok z `text-align-last: justify`), my decydujemy wyłącznie o tym, gdzie złamać.
2. **Drabinka progów** – kolejne przebiegi z coraz luźniejszym dopuszczalnym rozciągnięciem; bierzemy
   pierwszy, który się uda. To daje podział o najmniejszym możliwym *najgorszym* wierszu, a nie
   tylko o dobrej sumie. Ostatni przebieg idzie z progiem swobody, żeby kary (wdowa, krótki wyraz
   na końcu wiersza) miały czym zapłacić.
3. **Mikrotypografia** – resztkę luzu chowamy w świetle między literami zamiast oddawać ją odstępom,
   a wiersz, któremu do następnego wyrazu zabrakło kilku pikseli, wolno odrobinę ścisnąć. Budżet to
   ±2,5% stopnia pisma w krokach po 0,0025 em (klasy `trak-*` i `zwez-*`). 2,5% trackingu jest dla
   oka niewidoczne, odstęp rozciągnięty o 200% – aż nadto. Na tym samym stoi program `hz` Hermanna
   Zapfa i skalowanie glifów w InDesignie. Skąd akurat 2,5%: przy 2% jeden akapit na telefonie
   rozbijał się o 3 px i wychodził z wierszem 5,5 zwykłej spacji; przy 2,5% schodzi do 3,0,
   a dalsze poszerzanie budżetu niczego już nie zmienia (sprawdzone do 4%).
4. **Szerokość kolumn** – justowanie potrzebuje miary. Kolumna poniżej ok. 52 znaków nie ma w wierszu
   dość odstępów, żeby rozłożyć luz. Siatki (oferta, dla kogo, współpraca, zasady) schodzą więc do
   jednej kolumny poniżej `--min-kolumna` (26 rem) zamiast na sztywnych progach okna, a na telefonie
   opis sytuacji idzie na pełną szerokość zamiast w kolumnie obok ikony (302 → 358 px).

**Twarde spacje są materiałem, nie wyrokiem.** `tools/typografia.mjs` wstawia je jak dawniej (to
działa też bez JavaScriptu), ale algorytm łamania traktuje je różnie. Wyrazu jednoliterowego, skrótu,
liczby z jednostką i kreski rozdzielającej nie rozerwie nigdy. Pozostałe wiązania wolno mu złamać za
cenę, która mówi wprost, ile jest dla nas warte uniknięcie danej wady – kary są w tej samej skali,
co kara za rozciągnięty wiersz:

| Wada | Kara | Odpowiada wierszowi o odstępie |
| --- | --- | --- |
| wdowa (ostatni wiersz krótszy niż 20% kolumny) | 6·10⁷ | ok. 3,5 zwykłej spacji |
| wyraz dwuliterowy na końcu wiersza | 3·10⁵ | ok. 2,1 zwykłej spacji |
| dłuższy przyimek na końcu wiersza | 3·10⁴ | ok. 1,8 zwykłej spacji |

Kolejność zgadza się z polską normą składu: jednoliterowy spójnik na końcu wiersza to błąd, dłuższy
przyimek – zalecenie. Wcześniej wszystkie wiązania były nierozerwalne i to właśnie one wymuszały
najgorsze wiersze: akapit „Proces możesz zakończyć…” miał wiersz rozstrzelony 9,8 raza, bo ciąg
„i bez zobowiązań.” był dla algorytmu jednym wyrazem.

**Wynik.** Odstępy między wyrazami w krotnościach zwykłej spacji, mierzone na realnie złożonej
stronie (`npm run pomiar:sklad`, Chromium):

| Wariant | 390 px | 834 px | 1280 px | 2560 px | wypełnienie wiersza |
| --- | --- | --- | --- | --- | --- |
| chorągiewka (bez JavaScriptu) | 1,00 | 1,00 | 1,00 | 1,00 | 86–90% |
| zachłanne justowanie przeglądarki | 2,95 | 2,02 | 2,56 | 2,27 | 100% |
| **wdrożone** | **1,25** | **1,17** | **1,14** | **1,13** | **100%** |

Wiersze skrajne (maksimum na całej stronie): zachłanne justowanie 9,8–14,5 zwykłej spacji,
wdrożone 3,5–5,4. Norma składu (InDesign, ustawienia domyślne) dopuszcza 1,33 – wdrożona mediana
mieści się w niej na każdej szerokości, czego zachłanne justowanie nie osiąga nigdzie.

**Czego nie da się osiągnąć i dlaczego.** Luzu w akapicie nie da się zmniejszyć łamaniem: to różnica
między sumą długości wyrazów a szerokością kolumny. Można go rozłożyć równo (warstwa 1 i 2) i w części
schować (warstwa 3) – i tyle. Bez dzielenia wyrazów zostają trzy ustępstwa, wszystkie świadome:

- **Telefon.** Przy kolumnie ok. 40 znaków pojedyncze wiersze wciąż dochodzą do 5,4 zwykłej spacji,
  a ostatni wiersz akapitu bywa krótszy niż piąta część kolumny. Alternatywą jest rozstrzelenie
  wiersza wcześniejszego – gorsze. Test sprawdza regułę ostatniego wiersza od szerokości laptopa.
- **Krótkie wyrazy na końcu wiersza.** W akapitach justowanych algorytm zostawia ich 5–8 na stronę,
  gdy ratuje to wiersz przed rozjazdem. Poza akapitami justowanymi nie ma ich wcale, a wyrazu
  jednoliterowego nie ma nigdzie – i tego pilnuje test przy czterech szerokościach.
- **WCAG 2.2, kryterium 1.4.8 (poziom AAA)** zaleca tekst niejustowany właśnie z powodu „rzek”.
  Strona celuje w poziom AA (AAA nie jest tu deklarowany), a wdrożony skład zbija medianę odstępu
  do 1,13–1,25 zwykłej spacji, czyli najbliżej chorągiewki, jak justowanie pozwala. To decyzja
  klienta, podjęta świadomie i z policzonym kosztem.

**Błędy złapane po drodze.** Każdy z nich dawał efekt odwrotny do zamierzonego, a widać je było
dopiero z pomiaru:

| Problem | Skutek | Test, który go dziś nie przepuści |
| --- | --- | --- |
| Wiersz dopychany trackingiem dokładnie do krawędzi kolumny | Przeglądarka łamała go po raz drugi i na końcu lądował wyraz jednoliterowy, wbrew regułom polskiego składu | „wierszy złożonych przez skrypt przeglądarka nie łamie po raz drugi” |
| Szerokość liczona z ramki, nie z pola tekstu | To samo w akapicie z paddingiem (ramka „note” w polityce prywatności) | jw. |
| Zapas dobrany pod jeden silnik | WebKit zaokrągla inaczej i rozbijał 6 wierszy na telefonie; dziś skrypt sprawdza wynik w układzie i powtarza z większym zapasem | jw., uruchamiany w 5 przeglądarkach |
| Wiersze sklejane bez odstępu | Kopiowany tekst dawał „zrozumieszsiebie.” | – (naprawione znakiem nowego wiersza między blokami) |

**Szerokość treści na dużych monitorach.** Ograniczenie szerokości to decyzja, nie błąd: wiersz
dłuższy niż ok. 75 znaków gubi początek następnego. Na monitorze 2560 px kontener zajmował jednak
tylko 46% ekranu, co wyglądało na ściśnięte. Od 1800 px kontener rośnie z 74rem do 86rem (54% ekranu),
a o długość wiersza dba osobny token `--miara` (58ch) nałożony na wszystkie bloki tekstu ciągłego.
Zmierzone po zmianie: najdłuższy wiersz na stronie 79 znaków, typowy 62–75.

---

## 4f. Audyt końcowy i rekomendacja wersji (18.09.2026)

Przegląd siedmiu obszarów (checklista w dwóch ujęciach, kod, dostępność, SEO, bezpieczeństwo,
treść) z adversarialną weryfikacją każdego ustalenia. Poniżej to, co przetrwało próbę obalenia.

### Naprawione w trakcie audytu

| Waga | Problem | Skutek |
| --- | --- | --- |
| blokująca | Pułapka antybotowa porównywała zegar serwera ze znacznikiem czasu z przeglądarki | Telefon ze spieszącym się zegarem dostawał „Dziękuję za wiadomość”, a zgłoszenie przepadało. Jedyna ścieżka konwersji strony. |
| istotna | Menu mobilne nie zamykało się przy wyjściu fokusem | Przy powiększeniu 200% otwarty panel zakrywał sfokusowany przycisk w całości (WCAG 2.4.11) |
| istotna | Wersja C publikowała widoczne atrapy opinii z pozycją w menu | Pusta sekcja opinii na stronie usług czyta się jako brak klientów |
| istotna | Narzędzie typograficzne psuło encje w atrybutach | `href="…?a=1&amp;b=2"` wychodziło jako `…?a=10b=2`. Dziś bez skutku, ale pierwszy link z UTM rozbiłby adres po cichu |
| drobna | Adres e-mail wychodził poza ekran przy powiększeniu samego tekstu do 200% | WCAG 1.4.4 |
| drobna | Miękkie łączniki trafiały do nagłówków, przycisków i etykiet | 341 z 809 łączników w miejscach, gdzie CSS i tak zabrania dzielenia; 34 nazwy dostępne z łącznikiem |
| drobna | Martwy kod: klasa `.no-js`, zmienne `--teal-soft` i `--ink-mute`, powtórzona reguła `.about__figure` | – |
| drobna | Martwe pliki w katalogu publikowanym (121 kB) i martwa reguła `/api/*` w `_headers` | Cloudflare nie stosuje `_headers` do Pages Functions – nagłówki ustawia teraz sama funkcja |
| drobna | `security.txt` wskazywał politykę prywatności w polu `Policy` | RFC 9116 przewiduje tam zasady zgłaszania podatności |
| drobna | Polityka prywatności nie wymieniała kraju z adresu IP dokładanego do treści maila | – |

Każda poprawka ma test, który nie przepuści jej z powrotem: regresja rozjechanego zegara,
zamykanie menu fokusem, atrapy w widocznej treści, zgodność hasha CSP, zgodność list dzielenia
wyrazów, osiem przypadków jednostkowych narzędzia typograficznego, martwe zmienne CSS.

### Nowy bloker publikacji: migracja DNS

Odczyt strefy 18.09.2026: NS `dns*.home.pl`, apex `46.242.239.156`, **MX wskazuje na sam apex**.
Przepięcie apeksu na Cloudflare Pages zabiera klientowi pocztę przychodzącą. Kolejność migracji
zapisana w `CHECKLISTA.md` (bloker nr 5).

### Rekomendacja: wersja B

Trzy niezależne rekomendacje – przez konwersję, przez wiarygodność marki i z perspektywy uwag
klienta – wskazały wersję B.

**Dlaczego nie A.** A nie zawiera niczego, czego nie ma B, poza doprecyzowaniami w CV i historią
nazwy. Nadwyżka 287 słów to proza perswazyjna, nie dowody („Benefit rozwojowy, nie jednorazowa
interwencja”, „Nie kolejne szkolenie ani gotowy schemat”). Menedżer, który sam zarządza ludźmi,
nie potrzebuje zapewnień, że to nie szkolenie. A rozmywa też wezwanie do działania trzema różnymi
etykietami przycisków; B ma jedno brzmienie w czterech miejscach, z ceną wejścia w etykiecie.

**Dlaczego nie C, mimo że najwierniej oddaje uwagi klienta.** C usuwa dokładnie te informacje,
na których zapada decyzja o kontakcie: cennik, przebieg współpracy, zasady z poufnością i podział
„dla firm / dla Ciebie”. Formularz nadal pyta „Dla menedżera w mojej firmie”, a `llms.txt`
deklaruje współpracę z firmami – strona obiecuje ścieżkę B2B, której nie obsługuje. Skrót nie
przełożył się przy tym na łatwość czytania: udział wyrazów czterosylabowych i dłuższych to w C
22,2% wobec 15,7% w B, bo to zdania z wersji A, tylko w mniejszej liczbie.

**Kluczowe rozróżnienie.** Uwagi klienta dotyczyły układu i kadru: hero na jeden ekran, portret
ucinany za wysoko, jeden akapit zamiast dwóch, własne brzmienie zdań. Nie dotyczyły usunięcia
cennika, zasad i przebiegu – tych sekcji po prostu nie było w recenzowanej makiecie (sekcja 4c
odnotowuje to wprost). Właściwy ruch to wzięcie z C układu, a nie cięć.

**Co dołożyć do B przed wysłaniem klientowi:**

1. Zdanie w drugiej osobie z wersji A jako pierwsze zdanie leadu: „Zarządzasz ludźmi i wynikami.
   Zadbaj też o wsparcie dla siebie.” H1 zostaje z B – to jedyna wersja, w której fraza kategorii
   stoi w nagłówku, a nie w nadtytule bez wagi semantycznej.
2. Rozbicie łańcucha „dla menedżerów –” w H1: przy 320 px jest szerszy od kolumny (298 px / 288 px).
3. Doprecyzowania z CV, które są realnym dowodem skali: „Premium Cigars (Vistula Retail Group)”,
   „Herbapol Lublin S.A. (Grupa Polpharma)”, „promotor prof. Jerzy Bralczyk”.
4. Sprostowanie zapisu o wykształceniu: B ma „absolwent coachingu na Uniwersytecie SWPS”, a źródłem
   jest program „Psychologia i Coaching od podstaw” (tak jak w A i w JSON-LD `hasCredential`).
5. Opis meta wersji B zgubił nazwisko z kwalifikacjami i frazę „mentoring biznesowy”.
6. Z wersji C: kadr portretu sięgający linii paska faktów oraz brzmienie wstępu do oferty
   i sekcji „O mnie” w wersji klienta.

**Czego nie zamknie ani kod, ani redakcja:** dwie prawdziwe rekomendacje od klienta. Sekcja
„Opinie” jest ukryta we wszystkich trzech wersjach – słusznie, bo atrapa szkodzi – ale zostawia
stronę usług profesjonalnych bez dowodu społecznego. To największa pojedyncza luka konwersyjna.

---

## 5. Do potwierdzenia z klientem (przed publikacją)

Strona nie zawiera już twierdzeń bez pokrycia w źródle. Poniższe punkty to decyzje, a nie luki faktograficzne:

1. **„Zarządzałem i nadal zarządzam sprzedażą i operacjami w największych firmach FMCG w Polsce”** – czy
   aktualne w dniu publikacji (klient jest aktywnym praktykiem).
2. **Poufność wobec firmy zlecającej** – na stronie stoi pełna poufność bez wyjątków (jak u klienta). Jeśli
   przekazuje sponsorowi cokolwiek (frekwencja, cele), trzeba to dopisać.
3. **Krok 04 „Podsumowanie”** – opis procesu („wracamy do celów z kontraktu i razem decydujemy…”) wynika
   z kontraktu i zasady dobrowolności, ale klient nie opisuje takiego spotkania wprost.
4. **Pierwsze spotkanie**: forma (online / telefon / stacjonarnie) i orientacyjny czas. Strona mówi tylko
   „trwa tyle, ile potrzeba”.
5. **Miejsce spotkań stacjonarnych** (Warszawa?) – źródło nie podaje, więc strona też nie.
6. **Cennik**: „300 PLN” czy „300 zł”, netto czy brutto, czy takie same warunki dla firm i osób prywatnych.
7. **Lata programów** (Kellogg, Lisbon, SGH, program coachingowy SWPS) – nazwy zostawione dokładnie jak u klienta.
8. **Akapit prywatny**: „ojciec trójki dzieci, klasyczna literatura, gravel, rozmowy przy kawie” bez imion.
   Świadomie pominięte: pies, wina, platforma 35mm, Bismarck High School, inauguracja cygara.
9. **Wykłady na Uniwersytecie Wrocławskim i UAM** – pominięte dla zwięzłości; jeden wiersz do dodania, jeśli klient chce.
10. **Nawigacja z pozycją „Cennik”** (6 pozycji, jak u klienta) albo 5 pozycji dla minimalizmu.
11. **Dane administratora** do polityki prywatności (forma działalności, adres, NIP) i potwierdzenie
    dostawcy poczty (w polityce wpisany Resend).
12. **LinkedIn** – brak na obecnej stronie; jeśli klient ma profil, dopisać w kontakcie i stopce.
13. **Zdjęcia** – wycinki z makiet; przed publikacją podmienić na oryginały z sesji (instrukcja w README).
14. **Adres do zgłaszania podatności** w `security.txt` to skrzynka klienta; wymaga jego zgody.

---

## 6. Co celowo pominięto

- **Cennik** – w mentoringu executive cena jest ustalana w rozmowie; publikacja obniżyłaby pozycjonowanie
  i odcięła część leadów B2B.
- **Kalendarz do samodzielnej rezerwacji** (Calendly itp.) – klient nie ma takiego narzędzia; formularz
  i telefon wystarczą przy tej skali. Łatwo dodać później jako link w sekcji kontakt.
- **Blog / artykuły** – poza zakresem LP. Struktura pozwala dodać podstrony bez przebudowy.
- **Analityka** – nie dodano, żeby strona nie wymagała banera cookies. Jeśli klient chce statystyk:
  Cloudflare Web Analytics (bez cookies, darmowe, bez zgody) – jedna linijka skryptu + wpis w CSP.

---

## 7. Warstwa techniczna (skrót)

- **Hosting**: Cloudflare Pages Free; brak builda; `_headers` z CSP, cache i nagłówkami bezpieczeństwa.
- **Wydajność**: fonty self-hosted (woff2, tylko latin + latin-ext, preload dla kroju nagłówkowego),
  zdjęcia WebP w 3 rozmiarach + `srcset`/`sizes`, `fetchpriority="high"` dla portretu hero, `loading="lazy"`
  poniżej. Zero zewnętrznych zapytań w podstawowej konfiguracji.
- **Dostępność**: landmarki, skip link, kontrasty AA, widoczny focus, etykiety pól, `aria-live` dla statusu
  formularza, `prefers-reduced-motion`, semantyczne listy i nagłówki, tekst alternatywny zdjęć.
- **SEO**: title/description, canonical, OG + Twitter card z dedykowanym obrazem 1200×630, JSON-LD
  (`Organization` + `Service` + `Person`), `sitemap.xml`, `robots.txt`, `lang="pl"`.
- **RODO**: brak cookies i trackerów, fonty lokalnie, informacja przy formularzu + pełna polityka,
  wysyłka przez funkcję (dane nie przechodzą przez zewnętrzny formularz SaaS).
- **Formularz**: walidacja po stronie klienta i serwera, honeypot, minimalny czas wypełnienia,
  opcjonalny Turnstile, awaryjny `mailto:` przy błędzie, działanie bez JS.
