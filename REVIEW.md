# Review wersji 05 „Pełne morze” – UI/UX, copy, user story

Dokument wewnętrzny (agencja). Sekcje 1–4b zachowują historyczny zapis analizy z 16–18.09.2026,
nie stanowią potwierdzenia akceptacji całego obecnego tekstu. Aktualny zakres wariantów i implementacji
opisują sekcje 4c–7, zaktualizowane 19.09.2026. Wyniki dawnych pomiarów nie są wynikami bieżącego kodu.

Aktualizacja wersji B po uwagach accounta z 19.09.2026: cennik usunięto z treści, nawigacji,
danych strukturalnych i `llms.txt`; `#cennik` prowadzi do kontaktu. Historyczne uwagi poniżej
o zachowaniu cennika nie opisują obecnej wersji B. Sekcja „Dla kogo” pozostaje.

Najnowsza instrukcja daje swobodę redakcji i układu w kierunku „Pełne morze”. Narracja ma prowadzić
odbiorcę B2B (około 70% nacisku), zachowując ofertę indywidualną u góry (około 30%). Mentoring i coaching
pozostają równorzędne. Nie ma obowiązku pełnego justowania, minimalnej liczby słów ani publikacji całego CV.

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

## 4c. Trzy warianty do przeglądu klienta (19.09.2026)

Wspólne założenia: B2B prowadzi otwarcie, osoba zgłaszająca się samodzielnie jest uwzględniona od razu,
mentoring i coaching mają równą rangę w pierwszej sekcji po hero. Każdy wariant ma widoczne logo z dopiskiem
„poznaj siebie”, autentyczne fakty o doświadczeniu menedżerskim i wykształceniu psychologicznym oraz kontakt.

| Wariant | Charakter | Docelowa gałąź i podgląd |
| --- | --- | --- |
| A | Szerszy kontekst oferty, odbiorców, współpracy i doświadczenia | `main`, katalog główny |
| B | Zwięzłe przedstawienie tych obszarów | `wersja-b`, `/wersja-b/` |
| C | Krótsza ścieżka: oferta, sytuacje zawodowe, doświadczenie, kontakt | `wersja-c`, `/wersja-c/` |

Spis w `tools/wersje.html` przedstawia warianty neutralnie. Dawne liczby 917/630/313 słów i rekomendacja B
opisywały poprzednie wersje; nie są kryterium wyboru klienta ani obietnicą SEO. Oryginału „pełne morze uwagi”
nie odnaleziono w materiałach review, dlatego szczegółów starej interpretacji C nie przedstawiamy jako
niezależnie potwierdzonych wymagań.

## 4d. Typografia i dostępność (19.09.2026)

Tekst łamie przeglądarka w zwykłych akapitach. `tools/typografia.mjs` dodaje NBSP po polskich wyrazach
jednoliterowych w blokach tekstu, zachowując strukturę inline i granice akapitów. Usunięto skrypt
`src/js/justowanie.js`, ręczne dzielenie akapitów na wiersze, ściskanie liter i `tools/pomiar-skladu.mjs`.
Dawne pomiary odstępów i porównania algorytmów nie opisują bieżącej implementacji.

`tests/typografia.spec.js` sprawdza przepełnienia oraz jednoliterowe wyrazy na końcu realnych wierszy
przy 320, 390, 834, 1280 i 1600 px, także po zwiększeniu odstępów zgodnie z WCAG 1.4.12. Sprawdza też,
czy zmiana szerokości nie zastępuje linku w akapicie i nie odbiera mu focusu. Nie narzuca justowania
ani łączenia wszystkich krótkich słów. Główne przyciski nie mają przycinającego focus `clip-path`;
osobny test kontroluje widoczność obrysu wraz z przycinaniem przez przodków.

Wykrycie JavaScriptu wykonuje mały synchroniczny inicjalizator inline przed CSS. Dzięki temu nawigacja
mobilna nie przechodzi po pierwszym malowaniu z rozwiniętego układu bez JS do zwiniętego menu.
Dokładny hash inicjalizatora trafia do `script-src`, a `tools/csp-hash.mjs` sprawdza osobno oba hashe
inline i kolejność init/CSS na wszystkich stronach. Główny skrypt nadal ma `defer`; bez JS nawigacja
pozostaje widoczna. Regresja przeglądarkowa sprawdza stan menu przy niedostępnym głównym skrypcie.

## 4e. Formularz i publikacja demonstracyjna (19.09.2026)

GitHub Pages nie uruchamia backendu formularza. Podgląd pokazuje informację o tym przed przyciskiem
„Sprawdź formularz”. Tryb `data-demo="true"` sprawdza pola lokalnie, zachowuje wpisane dane,
nie wysyła żądania sieciowego i nie zgłasza sukcesu w analityce. Bez JS przycisk pozostaje wyłączony;
e-mail i telefon są nadal dostępne.

Na Cloudflare formularz ma walidację, honeypot i Turnstile wymagany przy skonfigurowanej wysyłce.
Szybkość pisania/autouzupełniania nie świadczy o spamie. Odpowiedź na POST bez JS jest czytelną stroną HTML;
Turnstile wymaga JS, więc w tej sytuacji podany jest kontakt bezpośredni. Testy automatyczne używają atrap
odpowiedzi dostawców; nie zastępują sprawdzenia rzeczywistego dostarczenia wiadomości przed produkcją.

Workflow najpierw przypina SHA A/B/C, następnie wykonuje build, walidację, testy i Lighthouse każdego wariantu.
Publikuje jeden zestaw z artefaktów tych przebiegów, bez ponownego pobierania gałęzi. Testy po wdrożeniu
pochodzą z tych samych SHA i czekają na stempel commitu w CDN. Cały przebieg Pages jest serializowany.
Gałęzie `codex/*` nie uruchamiają publikacji; pipeline demonstracyjny dopuszcza wyłącznie domenę `github.io`.

## 4f. Podgląd klienta a produkcja (19.09.2026)

Podgląd służy porównaniu treści i układu oraz zebraniu uwag. Sekcja opinii pokazuje jawnie oznaczony przykład
układu, a formularz jasno opisuje brak wysyłki. Taki podgląd nie jest odbiorem produkcyjnym.

Przed produkcją trzeba wybrać wariant, zatwierdzić copy i fotografie, zastąpić przykłady prawdziwymi opiniami
albo ukryć sekcję, zaakceptować politykę prywatności i zakres analityki/zgód, skonfigurować wysyłkę
i sprawdzić wiadomość na właściwej skrzynce. Migrację DNS należy poprzedzić planem zachowania poczty:
historyczny odczyt z 18.09 wskazywał MX na apex; stan trzeba odczytać ponownie przed zmianą.
Uruchomienie strony wymaga zachowania ciągłości poczty oraz sprawdzenia domeny, HTTPS i przekierowań.

Raporty i liczby testów z 16–18.09 są historyczne. Bieżące QA lokalne z 19.09 zakończono:
po 235 testów przeglądarek na A/B/C, build i walidacja, 11 testów backendu na wariant, kontrola wizualna
desktop/mobile oraz Lighthouse (Performance mobile A 99, B 100, C 100; desktop 100).
Pełne liczby, ograniczenie lokalnego WebKit i status bramki publikacyjnej: CHECKLISTA.md, sekcja 15.

---

## 5. Do potwierdzenia z klientem (przed publikacją)

Poniższe decyzje trzeba zamknąć dla wybranego wariantu przed produkcją. Historyczne brzmienia cytatów
w starszych sekcjach tego dokumentu nie oznaczają, że występują w bieżącym copy:

1. **„Zarządzałem i nadal zarządzam sprzedażą i operacjami w największych firmach FMCG w Polsce”** – czy
   aktualne w dniu publikacji (klient jest aktywnym praktykiem).
2. **Poufność wobec firmy zlecającej** – potwierdzić, co jest uzgadniane z firmą, a co pozostaje poufne
   między uczestnikiem i prowadzącym; nie dodawać niepotwierdzonych obietnic.
3. **Krok 04 „Podsumowanie”** – opis procesu („wracamy do celów z kontraktu i razem decydujemy…”) wynika
   z kontraktu i zasady dobrowolności, ale klient nie opisuje takiego spotkania wprost.
4. **Pierwsze spotkanie**: potwierdzić formę (online / telefon / stacjonarnie), ewentualny czas
   i warunki. Nie dopisywać czasu trwania ani gwarantowanego terminu odpowiedzi bez źródła.
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

- **Cennik** – zakres i miejsce ceny zależą od wybranego wariantu oraz potwierdzenia aktualnych warunków;
  nie zakładamy, że sama publikacja ceny pomaga albo szkodzi konwersji.
- **Kalendarz do samodzielnej rezerwacji** (Calendly itp.) – klient nie ma takiego narzędzia; formularz
  i telefon wystarczą przy tej skali. Łatwo dodać później jako link w sekcji kontakt.
- **Blog / artykuły** – poza zakresem LP. Struktura pozwala dodać podstrony bez przebudowy.
- **Analityka** – baza nie ładuje zewnętrznych trackerów. Docelowy pomiar i wymagania dotyczące zgód
  pozostają decyzją przed produkcją; brak banera nie jest sam w sobie potwierdzeniem zgodności.

---

## 7. Warstwa techniczna (skrót)

- **Hosting**: Cloudflare Pages Free; brak builda; `_headers` z CSP, cache i nagłówkami bezpieczeństwa.
- **Wydajność**: fonty self-hosted (woff2, podzbiór znaków potrzebnych stronie, bez preloadu),
  zdjęcia WebP w 3 rozmiarach + `srcset`/`sizes`, `fetchpriority="high"` dla portretu hero, `loading="lazy"`
  poniżej. Zero zewnętrznych zapytań w podstawowej konfiguracji.
- **Dostępność**: landmarki, skip link, kontrasty AA, widoczny focus, etykiety pól, `aria-live` dla statusu
  formularza, `prefers-reduced-motion`, semantyczne listy i nagłówki, tekst alternatywny zdjęć.
- **SEO**: title/description, canonical, OG + Twitter card z dedykowanym obrazem 1200×630, JSON-LD
  (`Organization` + `Service` + `Person`), `sitemap.xml`, `robots.txt`, `lang="pl"`.
- **RODO**: brak cookies i trackerów, fonty lokalnie, informacja przy formularzu + pełna polityka,
  wysyłka przez funkcję (dane nie przechodzą przez zewnętrzny formularz SaaS).
- **Formularz**: walidacja po stronie klienta i serwera, honeypot, Turnstile przy rzeczywistej wysyłce,
  ograniczone czasy oczekiwania, awaryjny e-mail i telefon, czytelna odpowiedź HTML bez JS; osobny tryb demo.
