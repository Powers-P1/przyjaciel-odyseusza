# Checklista produkcyjna strony statycznej

> Cel: ten plik jest jednym źródłem prawdy dotyczącym gotowości technicznej strony do publikacji.
>
> Agenci mają aktualizować ten plik w trakcie prac. Nie wolno oznaczać punktu jako wykonanego tylko dlatego, że "powinien działać". Punkt można odznaczyć dopiero po wdrożeniu i weryfikacji.

## Zasady oznaczania statusu

Stosuj następujące oznaczenia:

- `[ ]` - do zrobienia / nieweryfikowane
- `[x]` - wykonane i sprawdzone
- `[x] ... **N/D: powód**` - punkt celowo nie dotyczy projektu; podanie powodu jest obowiązkowe
- Jeśli coś wdrożono częściowo, pozostaw checkbox pusty i dodaj `**CZĘŚCIOWO:**` wraz z krótkim opisem.
- Tam, gdzie to możliwe, dodaj `Dowód:` i wskaż konkretny plik, konfigurację, trasę, test, polecenie, dashboard albo notatkę wdrożeniową.
- Nigdy nie usuwaj po cichu punktów z checklisty.
- Nie oznaczaj wymagań prawnych, prywatności, dostępności lub bezpieczeństwa jako spełnionych wyłącznie dlatego, że zainstalowano bibliotekę lub wtyczkę. Sprawdź faktyczne działanie.

> **Aktualizacja 19.09.2026:** bieżące zmiany dotyczą trzech wariantów do przeglądu klienta.
> Jawny tryb demo formularza i oznaczone przykłady opinii są dopuszczalnymi elementami podglądu.
> Gotowość do produkcji wymaga osobnego zamknięcia DNS/MX, dostarczania poczty, dokumentów prawnych,
> wyboru finalnych materiałów i kontroli wdrożenia. Brak dostępu do kont nie przesuwa tych warunków na czas po starcie.
>
> Datowane dowody z 16–18.09 są historyczne. Bieżące wyniki lokalne z 19.09 oraz zakres ponownej
> weryfikacji znajdują się w sekcji 15. Publikację konkretnego zestawu SHA potwierdza GitHub Actions;
> nie należy utożsamiać poprawnego podglądu z odbiorem produkcyjnym.

## Dane projektu

- Nazwa projektu: przyjacielodyseusza.pl, landing page „Pełne morze” (wersja 05)
- Domena produkcyjna: https://przyjacielodyseusza.pl (kanoniczna, bez `www`)
- Domena testowa: https://powers-p1.github.io/przyjaciel-odyseusza/ (GitHub Pages, podkatalog, `noindex`; publikowana automatycznie po zielonym QA na `main`); docelowo także podglądy Cloudflare Pages `*.pages.dev` (do objęcia Access policy po utworzeniu projektu)
- Repozytorium: https://github.com/Powers-P1/przyjaciel-odyseusza (publiczne – plan GitHub Free nie udostępnia Pages dla repozytoriów prywatnych; lokalnie `C:\Projekty\przyjaciel-odyseusza`)
- Hosting: Cloudflare Pages (plan Free) + Pages Functions (formularz)
- Framework / SSG: brak; czysty HTML/CSS/JS, `esbuild` tylko do minifikacji (`npm run build`)
- Główny język: polski (`<html lang="pl">`)
- Dodatkowe języki: brak
- ID analityki produkcyjnej: brak (privacy-first; rekomendacja Cloudflare Web Analytics, patrz `docs/plan-pomiarowy.md`)
- CMP / system zgód: brak (strona nie ustawia cookies i nie ładuje trackerów, potwierdzone testem)
- Data bieżącego QA lokalnego: 2026-09-19 (zakres, wyniki i ograniczenia w sekcji 15)
- Audyt wykonał: Claude (agent) dla OK Agency / Damian Karolewski Technology Solutions

---

# 1. Podstawy wdrożenia i publikacji

- [x] Build produkcyjny kończy się bez błędów.
  - Warunek zaliczenia: polecenie budujące wersję produkcyjną kończy się sukcesem i generuje oczekiwane pliki do wdrożenia.
  - Dowód: `npm run build` (`tools/build.mjs`): `src/css/style.css → .build/style.css` (wstawiany do `<style>` w HTML, nie publikowany jako plik), `src/js/main.js → public/assets/js/main.js` (minifikacja esbuild) + `tools/typografia.mjs` na HTML; kończy się kodem 0. Hosting nie potrzebuje builda, `public/` jest publikowane bezpośrednio.

- [x] Podczas buildu produkcyjnego nie występują krytyczne ostrzeżenia.
  - Dotyczy m.in. brakujących assetów, błędnych importów, problemów z hydracją, błędnej konfiguracji.
  - Dowód: build bez ostrzeżeń; `wrangler pages dev` startuje bez ostrzeżeń po usunięciu nieobsługiwanej reguły `_redirects` (wrangler: „Only relative URLs are allowed”). Test `tests/links.spec.js` „wszystkie obrazy, style, skrypty i fonty ładują się poprawnie” (brak odpowiedzi ≥ 400 dla zasobów).

- [ ] Produkcja działa wyłącznie po HTTPS.
  - HTTP ma przekierowywać na HTTPS, a wszystkie zasoby mają ładować się bez mixed content.
  - **CZĘŚCIOWO:** w kodzie brak zasobów `http://` (wszystko względne / same-origin), HSTS w `public/_headers`, canonical/OG/sitemap na `https://`. Przekierowanie HTTP→HTTPS zapewnia Cloudflare (Always Use HTTPS) – **PRZED URUCHOMIENIEM PRODUKCJI** sprawdzić `curl -I http://przyjacielodyseusza.pl`.
  - Dowód: `tests/headers.spec.js` (nagłówek `strict-transport-security`), `grep -r "http://" public/*.html` zwraca tylko namespace w sitemapie.
  - Domena testowa (17.09.2026): `http://powers-p1.github.io/przyjaciel-odyseusza/` → 301 na `https://`, odpowiedź z `Strict-Transport-Security: max-age=31556952`; brak mixed content (test `tests/smoke.spec.js` „bez błędów w konsoli” na żywym adresie). Test `tests/staging.spec.js` „HTTP przekierowuje na HTTPS”.

- [ ] Wymuszona jest jedna kanoniczna wersja domeny.
  - Przykład: `https://example.com` ALBO `https://www.example.com`.
  - Wszystkie inne warianty hosta i protokołu mają przekierowywać do wersji kanonicznej.
  - **CZĘŚCIOWO:** kanoniczna to apex `https://przyjacielodyseusza.pl/` (canonical, og:url, sitemap, JSON-LD, `llms.txt`, `security.txt`). Plik `_redirects` w Pages nie obsługuje reguł per host, więc przekierowanie `www` → apex trzeba ustawić jako Redirect Rule w dashboardzie Cloudflare – instrukcja w `README.md` („Domena i kanoniczny host”). **PRZED URUCHOMIENIEM PRODUKCJI.**
  - Dowód: `tests/seo.spec.js` (canonical == adres w sitemapie), `README.md`.

- [x] Środowiska staging / preview nie mogą być indeksowane.
  - Najlepiej zabezpieczyć je autoryzacją lub ograniczeniem dostępu.
  - Sam `robots.txt` nie jest zabezpieczeniem prywatności.
  - Domena testowa GitHub Pages (`tools/staging.mjs`): każda strona ma `<meta name="robots" content="noindex, nofollow">`, `robots.txt` bez `Disallow` (żeby robot zobaczył noindex) i bez sitemapy, `sitemap.xml` nie jest publikowana, canonical/OG/JSON-LD wskazują adres testowy (brak sygnału „to produkcja”). GitHub Pages nie oferuje autoryzacji dostępu – świadomy wyjątek (sekcja 19).
  - Dowód: `tests/staging.spec.js` „każda strona ma noindex…” na żywym adresie; `curl -s https://powers-p1.github.io/przyjaciel-odyseusza/ | grep robots`.
  - **PRZED URUCHOMIENIEM PRODUKCJI:** włączyć Access policy dla preview deployments w Cloudflare Pages (Settings → General). Instrukcja w `README.md`.

- [x] Istnieje własna strona 404 i naprawdę zwraca kod HTTP 404.
  - Nie może to być "ładna strona błędu" zwracająca kod 200.
  - Dowód: `public/404.html`; `tests/seo.spec.js` „własna strona 404 zwraca kod 404” (żądanie losowego adresu → status 404 + treść); `curl -o /dev/null -w "%{http_code}" http://127.0.0.1:8788/nie-ma → 404` na `wrangler pages dev`. Na żywo (GitHub Pages, 17.09.2026): `https://powers-p1.github.io/przyjaciel-odyseusza/nie-ma-takiej-strony` → 404 z własną stroną.

- [x] Przekierowania ze starych lub zmienionych adresów URL są skonfigurowane.
  - Dla zasobów przeniesionych na stałe używaj przekierowań stałych.
  - Unikaj łańcuchów przekierowań.
  - Dowód: poprzednia strona to one-pager z kotwicami (`/#o-mnie`, `/#dla-ciebie`, `/#dla-biznesu`, `/#cennik`, `/#kontakt`). W B `#o-mnie` i `#kontakt` pozostają, `#dla-ciebie` i `#dla-biznesu` prowadzą do `#dla-kogo`, a usunięty `#cennik` do `#kontakt` przez `LEGACY_HASHES` w `src/js/main.js`. Test istniejących kotwic rozszerzono o `#cennik`; ponowne uruchomienie po zmianie pozostaje częścią QA. Innych adresów stara strona nie miała (jedna strona WordPress).

- [x] Linki wewnętrzne nie prowadzą niepotrzebnie przez przekierowania.
  - Jeśli znany jest docelowy URL, link powinien prowadzić bezpośrednio do niego.
  - Dowód: Pages przekierowuje `/strona.html` → `/strona` (308), dlatego wszystkie linki wskazują `/polityka-prywatnosci` bez rozszerzenia. `tests/links.spec.js` sprawdza każdy link wewnętrzny z `maxRedirects: 0` i oczekuje 200.

- [x] Na stronie nie ma uszkodzonych linków wewnętrznych.
  - Dowód: `tests/links.spec.js` (wszystkie `a[href]` na `/`, `/polityka-prywatnosci` i stronie 404; kotwice `#id` muszą istnieć).

- [x] Repozytorium zawiera całą konfigurację potrzebną do odtworzenia wdrożenia.
  - Sekrety nie mogą być zapisane w repozytorium.
  - Dowód: `wrangler.toml`, `public/_headers`, `functions/api/contact.js`, `package.json`, `playwright.config.js`, `.github/workflows/qa.yml`. Sekrety wyłącznie jako zmienne środowiskowe Pages; lokalnie `.dev.vars` w `.gitignore`, wzór `.dev.vars.example`. Skan `grep -rniE "re_[a-z0-9]{10,}|api[_-]?key|secret" public functions src` – brak wartości sekretów.

---

# 2. SEO techniczne

## 2.1 Indeksowanie i dostępność dla crawlerów

- [x] `robots.txt` istnieje pod `/robots.txt`.
  - Musi być dostępny na produkcji.
  - Nie może przypadkowo blokować całej strony produkcyjnej.
  - Dowód: `public/robots.txt` (`Allow: /`, blokada tylko `/api/`); `tests/seo.spec.js` „robots.txt istnieje…”.

- [x] `robots.txt` wskazuje produkcyjną mapę strony.
  - Przykład: `Sitemap: https://example.com/sitemap.xml`
  - Dowód: linia `Sitemap: https://przyjacielodyseusza.pl/sitemap.xml`; sprawdzana testem.

- [x] `sitemap.xml` istnieje i jest generowana z produkcyjnych adresów URL.
  - Dowód: `public/sitemap.xml` (jeden adres: `https://przyjacielodyseusza.pl/`); `tests/seo.spec.js` „sitemap.xml zawiera tylko produkcyjne…”.

- [x] Sitemap zawiera wyłącznie kanoniczne i indeksowalne adresy URL zwracające poprawną odpowiedź HTTP.
  - Nie dodawaj tam przekierowań, 404, stagingu, duplikatów ani stron oznaczonych `noindex`.
  - Dowód: test odpytuje każdy `<loc>` lokalnie (200, brak `noindex`, canonical == loc). Polityka prywatności ma `noindex` i celowo nie jest w sitemapie.

- [x] Każda indeksowalna strona ma poprawny canonical wskazujący samą siebie.
  - Dowód: `<link rel="canonical" href="https://przyjacielodyseusza.pl/">` w `index.html`; `tests/seo.spec.js`.

- [x] Canonicale używają produkcyjnego protokołu i właściwej domeny.
  - Dowód: `https://przyjacielodyseusza.pl/…` w obu stronach; test „meta i struktura”.

- [x] Nie istnieją przypadkowe `noindex`, `nofollow` ani reguły blokujące crawl.
  - Dowód: `tests/seo.spec.js` „strona główna nie ma noindex, a polityka ma świadomy noindex” (`noindex, follow` tylko na polityce prywatności).

- [x] Paginacja, filtry, parametry URL i warianty duplikujące treść są obsłużone świadomie, jeśli występują. **N/D: one-pager bez paginacji i filtrów; parametry `?wyslano=1` / `?blad=1` pochodzą z wariantu formularza bez JS i prowadzą do tej samej treści z canonicalem na `/`.**
  - Dowód: `functions/api/contact.js` (przekierowania 303), canonical w `index.html`.

## 2.2 Meta dane i struktura stron

- [x] Każda indeksowalna strona posiada unikalny `<title>`.
  - Tytuł ma opisywać zawartość strony i nie może być bezsensownym boilerplate'em.
  - Dowód: „Mentoring i coaching dla menedżerów | Przyjaciel Odyseusza” (58 znaków) i „Polityka prywatności – Przyjaciel Odyseusza”; `tests/seo.spec.js` „tytuły i opisy stron są unikalne”.

- [x] Każda ważna indeksowalna strona posiada sensowny meta description.
  - Unikaj identycznych opisów na całej stronie.
  - Dowód: description 147 znaków z frazami kluczowymi i zachętą; test sprawdza długość 60–170 i unikalność.

- [x] Każda standardowa strona treści posiada jeden logiczny nagłówek H1.
  - Dowód: `tests/seo.spec.js` (dokładnie jeden H1 poza blokami `[hidden]`), także w polityce i 404.

- [x] Hierarchia H1-H6 jest logiczna.
  - Nie wybieraj poziomu nagłówka tylko dlatego, że ma odpowiedni rozmiar fontu.
  - Dowód: test „brak przeskoków poziomu nagłówka”; struktura H1 → H2 (sekcje) → H3 (karty, kroki) → H4 (zasady).

- [x] Ważna treść znajduje się w HTML dostępnym dla crawlera.
  - Dowód: strona w pełni statyczna; JS tylko dla menu, animacji i formularza; test `tests/seo.spec.js` „JSON-LD parsuje się…” czyta treść z DOM bez interakcji.

- [x] Nawigacja używa prawdziwych linków `<a href>`.
  - Nie stosuj klikalnych `div` jako zamiennika linku.
  - Dowód: `nav a[href]` w testach; brak `onclick`/`role="link"` na `div`.

- [x] Obrazy niosące znaczenie posiadają sensowny tekst `alt`.
  - Obrazy dekoracyjne powinny mieć pusty alt tam, gdzie jest to właściwe.
  - Dowód: portrety i logo z opisowym `alt`, znak łodzi w bloku o nazwie z `alt=""`; test „obrazy mają atrybut alt”; axe (`image-alt`) bez naruszeń.

- [x] Struktura URL jest czytelna, stabilna i przemyślana.
  - Unikaj zbędnych identyfikatorów, parametrów i przypadkowych duplikatów ścieżek.
  - Dowód: `/`, `/polityka-prywatnosci`, kotwice sekcji (`#oferta`, `#dla-kogo`, `#wspolpraca`, `#o-mnie`, `#kontakt`). Cennik usunięto z wersji B po uwagach z 19.09.2026.

## 2.3 Narzędzia dla wyszukiwarek

- [ ] Domena produkcyjna jest skonfigurowana w Google Search Console.
  - **PRZED URUCHOMIENIEM PRODUKCJI** (wymaga dostępu do konta Google i domeny). Domeny testowej celowo nie zgłaszamy: jest poza indeksem (`noindex`), a GSC nie da nic poza raportem „wykluczone przez noindex”.
  - Dowód:

- [ ] Produkcyjna sitemap została zgłoszona w Google Search Console.
  - **PRZED URUCHOMIENIEM PRODUKCJI.**
  - Dowód:

- [ ] Bing Webmaster Tools jest skonfigurowany.
  - Zalecane, ale niekonieczne w każdym projekcie.
  - **PRZED URUCHOMIENIEM PRODUKCJI** (import z GSC zajmuje kilka minut).
  - Dowód:

- [ ] Po publikacji sprawdzono najważniejsze błędy indeksowania.
  - **PRZED URUCHOMIENIEM PRODUKCJI.**
  - Dowód:

---

# 3. Social media i identyfikacja strony w przeglądarce

- [x] Open Graph jest wdrożony dla ważnych stron.
  - Sprawdź minimum: `og:title`, `og:description`, `og:url`, `og:type` i sensowny `og:image`.
  - Dowód: `index.html` (og:type, locale, site_name, title, description, url, image + width/height/alt); `tests/seo.spec.js` „Open Graph, Twitter Card i obraz social preview”.

- [x] Obraz social preview jest przygotowany świadomie.
  - Nie może nim być przypadkowy obraz znaleziony przez platformę na stronie.
  - Dowód: dedykowany `public/assets/img/og-image.jpg` 1200×630 (logo, hasło, portret); test sprawdza, że plik istnieje i jest JPEG. Podgląd: `docs/og-image-podglad.jpg`. Podgląd na żywym adresie testowym (opengraph.xyz, 17.09.2026): obraz ładuje się (74 KB, 1200×630, `summary_large_image`, `og:site_name`); dwa ostrzeżenia o długości poprawione: `og:title` skrócony do 58 znaków (jak `<title>`), `og:description` do 121 znaków (podglądy ucinają ok. 125). **PRZED URUCHOMIENIEM PRODUKCJI:** LinkedIn Post Inspector na adresie produkcyjnym (wymaga zalogowania).

- [x] Metadata X/Twitter Card są wdrożone, jeśli mają sens w projekcie.
  - Dowód: `<meta name="twitter:card" content="summary_large_image">`; test.

- [x] Favicon jest skonfigurowany.
  - Dowód: `public/favicon.ico` (16/32/48) + `assets/icons/icon-192.png`; test „favicon, apple-touch-icon i manifest są dostępne”.

- [x] Apple Touch Icon jest skonfigurowany.
  - Dowód: `assets/icons/icon-180.png`, `<link rel="apple-touch-icon">`; test.

- [x] Nazwa serwisu/aplikacji jest spójna we wszystkich obsługiwanych metadanych.
  - Dowód: „Przyjaciel Odyseusza” w `<title>`, `og:site_name`, `site.webmanifest` (`name`, `short_name`), JSON-LD `name`, `llms.txt`; test manifestu.

- [x] Web App Manifest istnieje, jeśli projekt korzysta z funkcji instalacji/PWA lub jawnej konfiguracji browser metadata.
  - Dowód: `public/site.webmanifest` (name, short_name, description, lang, ikony 192/512 + maskable, kolory); test parsuje manifest.

---

# 4. Dane strukturalne - Schema.org / JSON-LD

- [x] Wybrano typy Schema.org faktycznie pasujące do strony.
  - Przykłady: `Organization`, `LocalBusiness`, `ProfessionalService`, `WebSite`, `BreadcrumbList`, `Article`, `Product`.
  - Nie dodawaj typów tylko po to, aby "coś było".
  - Dowód: `Organization` (firma) + `Service` (mentoring i coaching, bez ceny w wersji B) + `Person` (Bartłomiej Przytuła) w `@graph`; bez `LocalBusiness` (brak publicznego adresu), bez `FAQ`/ocen.

- [x] Dane strukturalne odpowiadają treści faktycznie widocznej na stronie.
  - Nie publikuj fałszywych ocen, cen, adresów, FAQ ani innych danych tylko dla wyszukiwarki.
  - Dowód: po usunięciu cennika w B usunięto także `Service.offers` z `minPrice`; `jobTitle`, `hasCredential`, `alumniOf` odpowiadają sekcji „O mnie”; test sprawdza obecność nazwiska i telefonu w treści. Weryfikacja faktów ze źródłem (obecna strona klienta) w `REVIEW.md` sekcja 4a.

- [x] Dane strukturalne używają produkcyjnych kanonicznych URL-i.
  - Dowód: `@id`, `url`, `image`, `logo` zaczynają się od `https://przyjacielodyseusza.pl/`; test „JSON-LD…” to weryfikuje.

- [x] Dane firmy są spójne.
  - Sprawdź nazwę, logo, adres URL, dane kontaktowe i profile społecznościowe.
  - Dowód: e-mail i telefon identyczne w JSON-LD, sekcji kontakt i stopce (`tests/smoke.spec.js` „linki telefon i e-mail…”); brak profili społecznościowych (klient ich nie publikuje, `sameAs` celowo pominięte).

- [x] Dane strukturalne przechodzą walidację bez błędów krytycznych.
  - Dowód: Schema Markup Validator (validator.schema.org) na żywym adresie testowym, 17.09.2026: `Organization` + `Service` + `Person`, **0 błędów**; jedyne ostrzeżenie (`availableLanguage` nie jest właściwością `ProfessionalService`) usunięte – zamienione na `knowsLanguage`. Google Rich Results Test nie ma typu wyniku rozszerzonego dla `ProfessionalService`/`Person` (celowo bez FAQ/ocen), więc nie wnosi nic ponad walidator. Test `tests/seo.spec.js` „JSON-LD parsuje się i opisuje to, co widać na stronie”.

---

# 5. AI / LLM / widoczność dla modeli

> `llms.txt` traktujemy jako dodatkową warstwę ułatwiającą maszynom zrozumienie strony. Nie zastępuje HTML, sitemap, robots.txt ani danych strukturalnych.

- [x] `/llms.txt` istnieje.
  - Dowód: `public/llms.txt`; `tests/seo.spec.js` „llms.txt istnieje i opisuje stronę”; `_headers` ustawia `text/plain; charset=utf-8`.

- [x] `llms.txt` opisuje stronę i wskazuje najważniejsze zasoby.
  - Nie wrzucaj tam bezmyślnie listy wszystkich URL-i.
  - Dowód: opis oferty, odbiorców, zasad i kontaktu + 2 strony i sitemap. B nie publikuje cennika.

- [x] Najważniejsze treści publiczne są zrozumiałe z wygenerowanego HTML.
  - Dowód: statyczny HTML, semantyczne nagłówki i listy; `docs/zrodla/` zawiera źródło faktów.

- [x] Polityka dotycząca crawlerów AI została świadomie ustalona.
  - Nie blokuj ani nie dopuszczaj crawlerów przypadkowo.
  - Dowód: decyzja „nie blokujemy” (strona informacyjna, chcemy widoczności) opisana w komentarzu w `public/robots.txt`.

- [x] `robots.txt` odzwierciedla przyjętą politykę tam, gdzie technicznie ma to zastosowanie.
  - Dowód: `User-agent: *` / `Allow: /` bez wyjątków dla botów AI.

- [x] Dla stron z dużą ilością dokumentacji rozważono dodatkowe wersje Markdown lub endpointy przyjazne maszynom. **N/D: strona marketingowa z jedną podstroną.**
  - Dowód:

---

# 6. Dostępność - standard WCAG 2.2 AA

> Domyślnym celem produkcyjnym jest WCAG 2.2 na poziomie AA, chyba że projekt wymaga wyższego poziomu.

## 6.1 Struktura dokumentu

- [x] `<html lang>` jest ustawione poprawnie.
  - Dowód: `lang="pl"` na wszystkich stronach; test „meta i struktura”; axe `html-has-lang`.

- [x] Zmiany języka wewnątrz treści są oznaczone, jeśli występują. **N/D: strona w jednym języku; angielskie nazwy uczelni to nazwy własne.**
  - Dowód:

- [x] Semantyczne landmarki są używane poprawnie.
  - Typowe elementy: `header`, `nav`, `main`, `footer`, `aside`.
  - Dowód: `header.site-header`, `nav[aria-label]`, `main#tresc`, `aside.origin`, `footer`; axe `landmark-*` bez naruszeń (`tests/a11y.spec.js`).

- [x] Istnieje jednoznacznie określony główny obszar treści.
  - Dowód: jeden `<main id="tresc">`.

- [x] Istnieje link "Przejdź do treści" / skip link, jeśli strona zawiera powtarzalną nawigację.
  - Dowód: `a.skip-link` widoczny po fokusie; test „skip link jest pierwszym elementem w kolejności focusu i działa”.

- [x] Struktura nagłówków odpowiada hierarchii informacji.
  - Dowód: jak w 2.2 (test hierarchii) + axe `heading-order`.

## 6.2 Klawiatura i focus

- [x] Wszystkie funkcje interaktywne można obsłużyć klawiaturą.
  - Dowód: linki, przyciski, formularz i menu mobilne to natywne elementy; Escape zamyka menu (`tests/smoke.spec.js` „menu mobilne…”); test przejścia Tabem przez 80 elementów.

- [x] Focus klawiatury jest zawsze widoczny.
  - Dowód: `:focus-visible { outline: 2px solid var(--gold) }` (na kremie `--gold-ink`); test „focus jest zawsze widoczny…” sprawdza `outline-style` każdego sfokusowanego elementu.

- [x] Kolejność focusu jest logiczna.
  - Dowód: kolejność DOM = kolejność wizualna (brak `tabindex` > 0); test dochodzi do stopki po kolei.

- [x] Nie istnieje pułapka klawiaturowa.
  - Użytkownik może wejść i wyjść z każdego elementu interaktywnego przy użyciu klawiatury.
  - Dowód: test 80 × Tab dociera do „Polityka prywatności” w stopce.

- [x] Modale, dialogi i menu poprawnie zarządzają focusem.
  - Dowód: menu mobilne: `aria-expanded`, `aria-controls`, Escape zamyka i zwraca focus na przycisk (test), klik poza menu zamyka.

- [x] Ukryte elementy interfejsu nie otrzymują focusu przypadkowo.
  - Dowód: honeypot `tabindex="-1"` + `aria-hidden`; sekcja opinii `hidden`; test sprawdza, że `#f-website` nigdy nie dostaje focusu i że żaden sfokusowany element nie leży w `[hidden]`/`[aria-hidden]`.

## 6.3 Dostępność wizualna

- [x] Kontrast tekstu spełnia wymagania WCAG AA.
  - Dowód: axe `color-contrast` bez naruszeń w 4 scenariuszach (`tests/a11y.spec.js`); poprawione w toku: złoto na kremie `#7a6538` → `#6f5b31` (etykiety kart 4,43:1 → 5,2:1).

- [x] Ikony, kontrolki i ważne elementy graficzne mają odpowiedni kontrast nietekstowy.
  - Dowód: ikony złote na teal (~7:1); obramowania pól i pigułek wyboru podniesione do `rgba(221,229,227,.5)` (≈3,7:1 na `#12343e`, wymóg 3:1); ikony mają towarzyszący tekst.

- [x] Informacja nie jest przekazywana wyłącznie kolorem.
  - Dowód: błędy formularza = kolor + tekst + `aria-invalid`; aktywna pozycja menu = kolor + podkreślenie; pola wymagane = atrybut `required`.

- [x] Tekst można powiększyć bez utraty treści lub funkcjonalności.
  - Dowód: rozmiary w `rem`/`clamp()`; test „strona pozostaje używalna przy zoomie 200% (viewport 640 px)”.

- [x] Strona poprawnie reflowuje się na wąskich viewportach.
  - Nie powinno być niepotrzebnego poziomego scrollowania.
  - Dowód: test „brak poziomego scrolla na wąskim ekranie (reflow 320 px)” (`scrollWidth <= clientWidth`).

- [x] Obszary klikane są wystarczająco duże i odpowiednio oddzielone.
  - Dowód: test „obszary dotykowe mają co najmniej 24×24 px (WCAG 2.5.8)” (linki inline w zdaniach wyłączone zgodnie z kryterium); przyciski min. 3,1 rem; linki stopki z paddingiem.

- [x] Strona pozostaje używalna przy zoomie 200%.
  - Dowód: jak wyżej (viewport 640 px = 200 % przy 1280 px).

- [x] Sprawdzono również większe powiększenia i warunki reflow istotne dla WCAG.
  - Dowód: test 320 px (= 400 % przy 1280 px, kryterium 1.4.10 Reflow).

## 6.4 Obrazy, ikony i multimedia

- [x] Obrazy informacyjne posiadają odpowiedni tekst alternatywny.
  - Dowód: `alt` portretów opisuje osobę i rolę; logo „Logo Przyjaciel Odyseusza z hasłem „poznaj siebie””.

- [x] Obrazy dekoracyjne nie generują niepotrzebnego "hałasu" dla czytników ekranowych.
  - Dowód: znak łodzi `alt=""`, ikony SVG w `span[aria-hidden="true"]`.

- [x] Przyciski składające się wyłącznie z ikony mają dostępną nazwę.
  - Dowód: przycisk menu ma widoczną etykietę „Menu”/„Zamknij”; brak przycisków wyłącznie ikonowych; axe `button-name`.

- [x] Materiały wideo mają napisy tam, gdzie są wymagane. **N/D: brak wideo.**
  - Dowód:

- [x] Audio/wideo nie uruchamia się niespodziewanie z dźwiękiem. **N/D: brak multimediów.**
  - Dowód:

## 6.5 Formularze

- [x] Każde pole formularza ma dostępną etykietę/nazwę.
  - Dowód: `label[for]` dla każdego pola, `fieldset/legend` dla wyboru; test „formularz: wymagane pola…”; axe `label`.

- [x] Placeholder nie jest jedyną etykietą pola.
  - Dowód: pola nie używają `placeholder` w ogóle.

- [x] Pola wymagane są komunikowane programowo, a nie tylko np. czerwonym kolorem.
  - Dowód: atrybut `required` na imieniu, e-mailu i wiadomości; pole opcjonalne oznaczone „(opcjonalnie)”; test.

- [x] Komunikaty walidacyjne wskazują konkretne pole i wyjaśniają problem.
  - Dowód: `#f-name-error` „Podaj imię i nazwisko.”, `#f-email-error` „Podaj poprawny adres e-mail.”, `#f-message-error` z minimalną długością; `tests/form.spec.js` „walidacja po stronie klienta…”.

- [x] Błędy są dostępne dla technologii asystujących.
  - Dowód: `aria-invalid="true"` + `aria-describedby` na błędne pole, focus na pierwsze błędne pole; test „formularz: wymagane pola, błędy powiązane programowo…”.

- [x] Instrukcje dotyczące formatu danych są podane przed wymagającym ich polem.
  - Dowód: etykiety „E-mail”, „Telefon (opcjonalnie)”, pytanie „Dla kogo szukasz wsparcia?”; jedyny wymóg formatu (min. 10 znaków wiadomości) jest komunikowany w błędzie i przez `minlength`.

- [x] Komunikat sukcesu lub błędu po wysłaniu formularza jest dostępny.
  - Dowód: `#form-status[role="status"][aria-live="polite"]`, po wysłaniu otrzymuje focus; testy „błąd backendu pokazuje zrozumiały komunikat…”, „komunikat po przekierowaniu (?wyslano / ?blad)”.

## 6.6 Animacje i interakcje

- [x] `prefers-reduced-motion` jest respektowane dla nieistotnych animacji.
  - Dowód: CSS wyłącza `scroll-behavior: smooth`, przejścia i animację `.reveal`; JS pomija IntersectionObserver; test „prefers-reduced-motion wyłącza animacje pojawiania”.

- [x] Strona nie zawiera migających treści mogących naruszać wymagania bezpieczeństwa dostępności.
  - Dowód: jedyne animacje to jednorazowe pojawienie sekcji (0,7 s) i przejścia hover.

- [x] Interakcje wymagające przeciągania mają alternatywę niewymagającą dragowania, jeśli takie interakcje występują. **N/D: brak interakcji drag.**
  - Dowód:

## 6.7 Weryfikacja dostępności

- [x] Wykonano automatyczny audyt dostępności.
  - Zalecane narzędzia: axe-core, Lighthouse.
  - Dowód: axe-core 4.13 (`@axe-core/playwright`, tagi wcag2a/aa, wcag21a/aa, wcag22aa, best-practice) na stronie głównej, polityce, formularzu w stanie błędu i otwartym menu mobilnym; Lighthouse Accessibility (sekcja 9.5).

- [x] Nie pozostały krytyczne ani poważne błędy dostępności.
  - Dowód: `tests/a11y.spec.js` oczekuje pustej listy naruszeń (dowolny poziom), przechodzi w Chromium, Firefox, WebKit i projektach mobilnych.

- [ ] Wykonano ręczny test obsługi wyłącznie klawiaturą.
  - **CZĘŚCIOWO:** przebieg klawiaturowy zautomatyzowany (Tab × 80, Escape, Enter na skip linku) w Chromium i Firefox; ręczny test na fizycznej klawiaturze i w Safari (Tab po linkach wymaga ustawienia systemowego) do wykonania przez agencję przed publikacją.
  - Dowód: `tests/a11y.spec.js` (Klawiatura i focus).

- [ ] Dla kluczowych ścieżek wykonano podstawowy test z czytnikiem ekranowym, jeśli jest to zasadne.
  - Nie wykonano (brak czytnika w środowisku agenta). Zalecenie: NVDA + Firefox, ścieżka hero → formularz → komunikat statusu.
  - Dowód:

---

# 7. Prywatność, cookies i warstwa prawna

> Konkretne obowiązki prawne zależą od jurysdykcji, rodzaju działalności i faktycznego przetwarzania danych. Agent nie może sam wymyślać treści prawnych ani deklarować zgodności prawnej bez zatwierdzonych treści i konfiguracji.

## 7.1 Dokumenty i obowiązki informacyjne

- [ ] Polityka prywatności istnieje, jeśli strona przetwarza dane osobowe.
  - **CZĘŚCIOWO:** `public/polityka-prywatnosci.html` napisana (administrator, cele, podstawy z art. 6 RODO, retencja, odbiorcy, prawa, cookies). Do uzupełnienia dane administratora (forma prawna, adres, NIP) i akceptacja przez klienta – ramka „Do uzupełnienia przed publikacją” w treści.
  - Dowód: plik + `tests/a11y.spec.js`/`seo.spec.js` (strona dostępna pod `/polityka-prywatnosci`, `noindex, follow`).

- [x] Polityka prywatności odpowiada faktycznie używanym narzędziom i podmiotom przetwarzającym.
  - Nie zostawiaj informacji o usuniętych integracjach.
  - Dowód: wymienione tylko Cloudflare (hosting, funkcja), Resend (wysyłka e-mail) i warunkowo Turnstile; brak analityki i cookies zgodnie ze stanem faktycznym (test braku cookies). Jeśli agencja wybierze innego dostawcę poczty niż Resend, zaktualizować sekcję 5 polityki.

- [x] Formularze kontaktowe zawierają wymagane informacje dotyczące prywatności lub odsyłają do nich.
  - Dowód: `p.form__privacy` pod formularzem (cel, administrator, link „Polityka prywatności”).

- [ ] Dane podmiotu prowadzącego stronę są podane tam, gdzie wymagają tego przepisy lub charakter usługi.
  - **CZĘŚCIOWO:** imię i nazwisko, e-mail, telefon są na stronie; forma prawna, adres i NIP – placeholdery w polityce do uzupełnienia przez klienta.
  - Dowód: `polityka-prywatnosci.html` sekcja 1.

- [x] Regulamin istnieje tam, gdzie wymaga tego model usługi lub sprzedaży. **N/D: brak sprzedaży online; warunki ustalane w pisemnym kontrakcie z klientem (informacja w sekcji „Współpraca”).**
  - Dowód:

- [ ] Informacja / deklaracja dostępności istnieje tam, gdzie jest wymagana prawnie lub kontraktowo.
  - **PRZED PRODUKCJĄ:** klient powinien potwierdzić zakres obowiązków, w tym ewentualne zastosowanie EAA, dla rzeczywistej usługi i sposobu jej oferowania. Sam prywatny charakter podmiotu nie jest dowodem wyłączenia; przegląd techniczny nie stanowi oceny prawnej.

## 7.2 Cookies i zgody

- [x] Wykonano inwentaryzację cookies, localStorage i trackerów.
  - Należy wiedzieć, co uruchamia się przed zgodą i po zgodzie.
  - Dowód: wynik: 0 cookies, 0 kluczy localStorage/sessionStorage, 0 żądań do hostów zewnętrznych (fonty self-hosted). Test `tests/smoke.spec.js` „strona nie ustawia cookies ani localStorage…”. Wyjątek warunkowy: Turnstile (jeśli włączony) ustawia techniczne cookies – opisane w polityce.

- [x] Niekonieczne trackery nie uruchamiają się przed uzyskaniem wymaganej zgody. **N/D: brak trackerów.**
  - Dowód: test jak wyżej.

- [x] CMP / mechanizm zgód jest skonfigurowany, jeśli strona używa niekoniecznego śledzenia. **N/D: brak niekoniecznego śledzenia, świadoma decyzja (docs/plan-pomiarowy.md).**
  - Dowód:

- [x] Opcja odrzucenia niekoniecznych zgód jest faktycznie dostępna tam, gdzie jest wymagana. **N/D: brak zgód.**
  - Dowód:

- [x] Użytkownik może ponownie otworzyć ustawienia prywatności i zmienić decyzję. **N/D: brak zgód.**
  - Dowód:

- [x] Kategorie zgód odpowiadają faktycznie ładowanym skryptom. **N/D: brak zgód i skryptów zewnętrznych.**
  - Dowód:

- [x] Polityka cookies lub odpowiednia sekcja polityki prywatności odpowiada aktualnemu wdrożeniu.
  - Dowód: sekcja 6 polityki („Pliki cookies i analityka”) opisuje brak cookies i warunkowy Turnstile.

- [x] Zachowanie zgód przetestowano w świeżej sesji przeglądarki.
  - Dowód: każdy test Playwright działa w nowym kontekście przeglądarki; test cookies potwierdza brak zapisu.

- [x] Zachowanie zgód przetestowano po zmianie i cofnięciu zgody. **N/D: brak mechanizmu zgód.**
  - Dowód:

---

# 8. Analityka, pomiar i heatmapy

## 8.1 Architektura analityki

- [x] Istnieje plan pomiarowy.
  - Powinien odpowiadać na pytanie "co biznesowo chcemy mierzyć", a nie tylko "ile było odsłon".
  - Dowód: `docs/plan-pomiarowy.md` (cel: zapytania o współpracę; zdarzenia; konwersje; decyzja privacy-first).

- [x] GTM lub inny świadomie wybrany tag manager jest skonfigurowany, jeśli jest potrzebny. **N/D: świadomie bez tag managera (privacy-first, brak CMP).**
  - Dowód: `docs/plan-pomiarowy.md`.

- [x] GA4 jest skonfigurowane, jeśli zostało wybrane dla projektu. **N/D: GA4 nie wybrano; docelowe narzędzie pomiaru i jego konfigurację uzgodnić przed produkcją.**
  - Dowód: `docs/plan-pomiarowy.md`.

- [x] Analityka jest połączona z systemem zgód tam, gdzie jest to wymagane. **N/D: analityka nieaktywna; wymogi ocenić po wybraniu narzędzia i jego konfiguracji.**
  - Dowód:

- [x] Google Consent Mode jest poprawnie skonfigurowany, jeśli używane są tagi Google i projekt go wymaga. **N/D: brak tagów Google.**
  - Dowód:

- [x] Ruch ze stagingu/testów nie zanieczyszcza statystyk produkcyjnych tam, gdzie można tego uniknąć.
  - Dowód: analityka nieaktywna; po włączeniu token Cloudflare Web Analytics działa tylko dla domeny produkcyjnej (`*.pages.dev` bez tokena) – opisane w planie.

## 8.2 Eventy i konwersje

- [ ] Główne CTA są mierzone, jeśli mają znaczenie biznesowe.
  - **CZĘŚCIOWO:** strona emituje `cta_click` (label, location) przez `po:event` i `dataLayer.push` (`src/js/main.js`); odbiorca zdarzeń do podpięcia po włączeniu narzędzia analitycznego.
  - Dowód: `src/js/main.js` (funkcja `track`), `docs/plan-pomiarowy.md`.

- [ ] `form_start` lub jego odpowiednik jest mierzony, jeśli jest potrzebny.
  - **CZĘŚCIOWO:** `form_start` emitowany przy pierwszym fokusie w polu; odbiorca do podpięcia.
  - Dowód: `src/js/main.js`.

- [ ] Udane wysłanie formularza jest mierzone.
  - Mierz faktyczny sukces, nie samo kliknięcie przycisku "Wyślij".
  - **CZĘŚCIOWO:** `form_submit_success` emitowany wyłącznie po odpowiedzi 200 `ok:true` z backendu (`form_submit_error` przy błędzie); odbiorca do podpięcia.
  - Dowód: `src/js/main.js`.

- [ ] Kliknięcia w numer telefonu są mierzone, jeśli kontakt telefoniczny jest ważny.
  - **CZĘŚCIOWO:** `tel_click` emitowany; odbiorca do podpięcia.
  - Dowód: `src/js/main.js`.

- [ ] Kliknięcia w adres e-mail są mierzone, jeśli mają znaczenie.
  - **CZĘŚCIOWO:** `mailto_click` emitowany; odbiorca do podpięcia.
  - Dowód: `src/js/main.js`.

- [x] Ważne pobrania plików są mierzone. **N/D: brak plików do pobrania.**
  - Dowód:

- [x] Ważne kliknięcia wychodzące są mierzone tam, gdzie ma to sens. **N/D: strona nie ma linków wychodzących.**
  - Dowód: `tests/smoke.spec.js` „żaden link nie otwiera nowej karty”; brak `href="http`.

- [ ] Najważniejsze biznesowo eventy są oznaczone jako konwersje / key events.
  - **PRZED URUCHOMIENIEM PRODUKCJI** (po włączeniu narzędzia): `form_submit_success`, `tel_click`.
  - Dowód: definicja w `docs/plan-pomiarowy.md`.

- [x] Sprawdzono, czy eventy nie naliczają się podwójnie.
  - Dowód: `form_start` z blokadą `formStarted`; przycisk wysyłki blokowany w trakcie żądania; test `tests/form.spec.js` „podwójne kliknięcie nie wysyła dwóch żądań”.

## 8.3 Heatmapy i nagrania sesji

- [x] Microsoft Clarity lub inne zatwierdzone narzędzie behavioral analytics jest skonfigurowane, jeśli projekt je wykorzystuje. **N/D: świadomie nie wdrażamy (wymagałoby zgody; skala projektu tego nie uzasadnia).**
  - Dowód: `docs/plan-pomiarowy.md`.

- [x] Heatmapy i nagrania respektują decyzję użytkownika dotyczącą zgody, jeśli jest to wymagane. **N/D.**
  - Dowód:

- [x] Wrażliwe pola i dane osobowe są maskowane albo wyłączone z nagrań. **N/D: brak nagrań.**
  - Dowód:

- [x] Sprawdzono nagrania testowe pod kątem wycieku danych z formularzy, haseł, płatności lub innych danych wrażliwych. **N/D: brak nagrań.**
  - Dowód:

## 8.4 Atrybucja kampanii

- [x] Istnieje standard nazewnictwa UTM, jeśli strona będzie używana w kampaniach.
  - Dowód: sekcja „UTM” w `docs/plan-pomiarowy.md`.

- [x] Landing page zachowuje potrzebne dane atrybucyjne tam, gdzie jest to wymagane. **N/D: atrybucję robi narzędzie analityczne; strona nie przechowuje parametrów (brak cookies).**
  - Dowód:

---

# 9. Wydajność i Core Web Vitals

## 9.1 Obrazy i multimedia

- [x] Obrazy są dostarczane w nowoczesnych, efektywnych formatach tam, gdzie to ma sens.
  - Preferuj AVIF/WebP i odpowiedni fallback.
  - Dowód: portrety w WebP (3 rozmiary) + JPG (używany w OG/JSON-LD i jako zapas); logo jako PNG z paletą 64 kolorów (8 KB dla 600 px, 7,5 KB dla 300 px; WebP z alfą wypadał gorzej dla jednobarwnego znaku).

- [x] Obrazy responsywne używają `srcset`/`sizes` lub odpowiednika frameworka.
  - Dowód: `srcset` 480/720/960 w (hero) i 448/672/896 w (O mnie) z `sizes` dopasowanymi do breakpointów.

- [x] Obrazy posiadają określone wymiary lub zarezerwowany aspect ratio.
  - Ma to zapobiegać CLS.
  - Dowód: `width`/`height` na każdym `<img>`; CLS w Lighthouse (sekcja 9.5).

- [x] Obrazy poniżej pierwszego ekranu korzystają z lazy loadingu tam, gdzie jest to właściwe.
  - Dowód: `loading="lazy"` na portrecie „O mnie”, znaku łodzi i logo w stopce.

- [x] Obraz LCP / hero nie jest przypadkowo lazy-loadowany.
  - Dowód: portret hero bez `loading="lazy"`, z `fetchpriority="high"`.

- [x] Preload / fetch priority dla krytycznego obrazu jest używany tylko wtedy, gdy faktycznie poprawia critical path.
  - Dowód: `fetchpriority="high"` tylko na portrecie hero; ani jednego `<link rel="preload">` – fontów i obrazów nie preloadujemy (pomiar: LCP 5,2 s z preloadem wobec 3,4 s bez, patrz punkt o preloadzie fontów niżej).

- [x] Duże materiały wideo i tła wideo zostały zoptymalizowane. **N/D: brak wideo.**
  - Dowód:

## 9.2 Fonty

- [x] Liczba rodzin i grubości fontów jest ograniczona do faktycznie używanych.
  - Dowód: 2 rodziny, 4 pliki woff2 zbudowane lokalnie z pełnych fontów Google (`tools/fonts-build.py`, fontTools): Source Serif 4 jako font zmienny wght 400–600 (37 KB), Inter 400/500/600 jako instancje statyczne (19 KB każda); nieużywana kursywa usunięta. Wcześniejsze 12 plików z Google Fonts to były zduplikowane pliki variable (potwierdzone `md5sum`).

- [x] Fonty są dostarczane w WOFF2 lub innym odpowiednim nowoczesnym formacie.
  - Dowód: `public/assets/fonts/*.woff2` (self-hosting, brak połączeń z Google Fonts).

- [x] Fonty są subsetowane tam, gdzie daje to sensowną korzyść.
  - Dowód: własny subset (ASCII, Latin-1, Latin Extended-A z polskimi znakami, cudzysłowy, myślniki, €, strzałki) i tylko potrzebne funkcje OpenType; 421–428 glifów na plik, łącznie 94 KB zamiast 356 KB (`tools/fonts-build.py`).

- [x] `font-display` jest świadomie ustawione.
  - Dowód: `font-display: swap` w każdym `@font-face` (`src/css/style.css`).

- [x] Preload fontów jest używany tylko dla naprawdę krytycznych fontów. **N/D: świadomie bez preloadu.**
  - Dowód: pomiar Lighthouse mobile (slow 4G): z preloadem 3 fontów FCP 2,8 s / LCP 5,2 s, bez preloadu LCP 3,4 s; `font-display: swap` maluje tekst od razu, fonty są odkrywane z inline CSS. CLS po zmianie 0,016.

## 9.3 CSS i JavaScript

- [x] CSS produkcyjny jest minifikowany.
  - Dowód implementacji: `npm run build` (esbuild), źródło w `src/css/style.css`, CSS inline w HTML. Rozmiary z dawnych buildów nie opisują bieżącego kodu.

- [x] JavaScript produkcyjny jest minifikowany.
  - Dowód implementacji: `npm run build`, źródło wyłącznie w `src/js/main.js`; usunięto runtime justowania. Aktualny rozmiar podaje build.

- [x] Ilość zbędnego JS po stronie klienta jest zminimalizowana.
  - Strona statyczna nie powinna wysyłać użytkownikowi wielkiej aplikacji JS bez powodu.
  - Dowód: jeden plik 6 KB bez zależności (menu, reveal, formularz, zdarzenia); strona działa bez JS (formularz przez POST + przekierowanie).

- [x] Hydracja po stronie klienta jest ograniczona wyłącznie do komponentów, które jej wymagają. **N/D: brak frameworka.**
  - Dowód:

- [x] Skrypty zewnętrzne zostały ocenione pod kątem kosztu wydajnościowego.
  - Dowód: brak skryptów zewnętrznych w domyślnej konfiguracji; Turnstile (opcjonalny) ładowany `async defer` tylko po ustawieniu klucza.

- [x] Zasoby blokujące renderowanie są ograniczone.
  - Dowód implementacji: CSS jest inline, główny skrypt ma `defer`, fonty `swap`. Mały synchroniczny init inline ustala klasę `js` przed CSS, aby menu nie zmieniało układu po pierwszym malowaniu; nie wymaga żądania sieciowego i ma dokładny hash CSP. Wpływ na CLS wymaga aktualnego pomiaru Lighthouse.

## 9.4 Cache i dostarczanie zasobów

- [ ] Assety z fingerprintem/hashami mają długi cache tam, gdzie hosting to wspiera.
  - **CZĘŚCIOWO:** build dodaje hash treści `?v=` do adresu JS; CSS jest inline, a ustawienia cache dla fontów, obrazów i JS są w `public/_headers`. Działanie nagłówków należy potwierdzić na docelowym hostingu.
  - Dowód: `public/_headers`; `tests/headers.spec.js` „fonty i obrazy mają długi cache…”.

- [x] Strategia cache dla HTML jest odpowiednia dla platformy hostingowej.
  - Dowód: HTML bez `immutable` (domyślne zachowanie Pages, walidacja ETag); test sprawdza, że HTML nie ma `immutable`.

- [ ] Brotli/Gzip jest aktywne tam, gdzie platforma to wspiera.
  - **PRZED URUCHOMIENIEM PRODUKCJI:** Cloudflare kompresuje automatycznie (Brotli); sprawdzić `content-encoding` w odpowiedzi produkcyjnej.
  - Dowód: domena testowa (GitHub Pages, 17.09.2026): `content-encoding: gzip`, HTML strony głównej 14,0 KB po kompresji (`curl -H "Accept-Encoding: br, gzip"`).

- [ ] CDN/edge jest wykorzystywany, jeśli hosting zapewnia taką możliwość.
  - **PRZED URUCHOMIENIEM PRODUKCJI:** Cloudflare Pages serwuje z edge; potwierdzić nagłówek `cf-cache-status` / `server: cloudflare`.
  - Dowód: domena testowa: GitHub Pages serwuje przez CDN Fastly (`x-served-by: cache-ber…`, `x-cache: HIT`, `cache-control: max-age=600`).

## 9.5 Weryfikacja wydajności

- [x] Wykonano Lighthouse Performance na buildzie produkcyjnym lub możliwie zbliżonym do produkcji.
  - Dowód: `npm run lighthouse` (`tools/lighthouse.mjs`, Lighthouse 13.4, mobile + desktop, na `wrangler pages dev`). Wynik 16.09.2026: **mobile Performance 98, Accessibility 100, Best practices 100, SEO 100; desktop 100 / 100 / 100 / 100**. Raporty: `docs/lighthouse/lighthouse-{mobile,desktop}.{html,json}`. Historia optymalizacji mobile: 75 (3 fonty w preloadzie, duplikaty variable) → 86 (bez preloadu, dedup, logo 8 KB) → 85 z inline CSS i pełnymi fontami → **98** po odchudzeniu fontów (`tools/fonts-build.py`: 356 KB → 94 KB na pierwszy widok).

- [x] LCP mieści się w ustalonym celu projektu.
  - Zalecenie: celuj w "good" wg Core Web Vitals.
  - Dowód: lab: mobile LCP 2,0 s (slow 4G, CPU 4×), desktop 0,5 s; próg ≤ 2,5 s w `tools/lighthouse.mjs`. Element LCP: tekst leadu w hero (mobile) / H1 (desktop). Dane terenowe **PO PUBLIKACJI**.

- [ ] INP mieści się w ustalonym celu projektu.
  - **CZĘŚCIOWO:** w labie TBT 0 ms (proxy INP); INP z danych terenowych **PO PUBLIKACJI** (CrUX / Search Console).
  - Dowód: `docs/lighthouse/lighthouse-mobile.json` (`total-blocking-time`).

- [x] CLS mieści się w ustalonym celu projektu.
  - Dowód: lab CLS 0,000 (mobile i desktop); próg ≤ 0,1. Wymiary obrazów zadeklarowane, fonty `swap` bez zauważalnego przesunięcia.

- [x] Wydajność mobilną sprawdzono niezależnie od desktopu.
  - Dowód: Lighthouse osobno w profilu mobile (Moto G Power, slow 4G, CPU 4×) i desktop; oba raporty w `docs/lighthouse/`.

- [x] Wydajność zmierzono na prawdziwym hostingu przez internet (domena testowa).
  - Dowód: `npm run lighthouse:staging` na https://powers-p1.github.io/przyjaciel-odyseusza/ (GitHub Pages, CDN Fastly, gzip), 17.09.2026: **mobile Performance 100, Accessibility 100, Best practices 100, LCP 1,58 s, CLS 0,011, TBT 0 ms; desktop Performance 100, LCP 0,42 s**. Kategoria SEO 66 wyłącznie przez celowy `noindex` na domenie testowej (jedyny nieudany audyt `is-crawlable`; na emulacji produkcji SEO 100). Raporty: `docs/lighthouse/staging/`. W CI (`ubuntu-latest`) mediana z 3 przebiegów: mobile 98 (LCP 2,0 s, TBT 0 ms), desktop 100. PageSpeed Insights (`npm run psi:staging`, Lighthouse po stronie Google) 17.09.2026 zwrócił HTTP 429 – anonimowy dzienny limit API wyczerpany; do powtórzenia z kluczem `PSI_API_KEY` albo ręcznie na pagespeed.web.dev. Dane terenowe (CrUX) pojawią się dopiero na produkcji przy realnym ruchu.

---

# 10. Bezpieczeństwo

## 10.1 Nagłówki bezpieczeństwa

- [x] `Strict-Transport-Security` jest skonfigurowany tam, gdzie jest to właściwe.
  - Nie włączaj agresywnych ustawień HSTS preload bez zrozumienia wpływu na domenę i subdomeny.
  - Dowód: `max-age=31536000; includeSubDomains` bez `preload` w `public/_headers`; `tests/headers.spec.js`.

- [x] `Content-Security-Policy` jest skonfigurowane.
  - Preferuj rzeczywiście egzekwowaną politykę, a nie bezwartościowe wildcardy.
  - Dowód implementacji: `default-src 'self'`, skrypty z `'self'` i `challenges.cloudflare.com` oraz dokładny hash małego init inline; CSS inline ma osobny hash w `style-src`. `tools/csp-hash.mjs` sprawdza obie dyrektywy i kolejność init/CSS. Bez `unsafe-inline` i wildcardów; zachowane `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. Testy sprawdzają egzekwowanie CSP i stan menu przed dotarciem głównego skryptu.

- [x] Ochrona przed clickjackingiem jest skonfigurowana.
  - Preferuj CSP `frame-ancestors`; starsze nagłówki można zachować, jeśli są potrzebne.
  - Dowód: `frame-ancestors 'none'` + `X-Frame-Options: DENY`; test.

- [x] `X-Content-Type-Options: nosniff` jest skonfigurowany.
  - Dowód: `_headers`; test.

- [x] `Referrer-Policy` jest jawnie skonfigurowane.
  - Dowód: `strict-origin-when-cross-origin`; test.

- [x] `Permissions-Policy` jest skonfigurowane tam, gdzie jest to użyteczne.
  - Dowód: `camera=(), microphone=(), geolocation=(), interest-cohort=()`; test.

## 10.2 Aplikacja i zależności

- [x] Żadne API key, prywatne tokeny ani sekrety nie znajdują się w kodzie wykonywanym w przeglądarce.
  - Dowód: klucz Resend i sekret Turnstile tylko w funkcji serwerowej przez `env`; skan `grep` w `public/` bez trafień; Turnstile site key (publiczny z definicji) pusty.

- [x] Sekrety nie znajdują się w repozytorium.
  - Dowód: `.gitignore` (`.dev.vars`, `.wrangler`), `.dev.vars.example` z wartościami przykładowymi.

- [x] Przejrzano audit zależności.
  - Dowód: `npm audit` → „found 0 vulnerabilities” (16.09.2026). Zależności wyłącznie deweloperskie (strona nie ma runtime dependencies).

- [x] Usunięto nieużywane zależności.
  - Dowód: `package.json` zawiera tylko używane: `@playwright/test`, `@axe-core/playwright`, `wrangler`, `esbuild`, `lighthouse`, `html-validate`, `wait-on` (CI). Wszystkie w `devDependencies` – do przeglądarki nie trafia żadna zależność.

- [x] Skrypty zewnętrzne pochodzą wyłącznie ze świadomie zatwierdzonych źródeł.
  - Dowód: brak skryptów zewnętrznych; jedyne dopuszczone przez CSP źródło to `challenges.cloudflare.com` (opcjonalny Turnstile).

- [x] Dla zewnętrznych assetów zastosowano mechanizmy integralności tam, gdzie jest to praktyczne i zasadne. **N/D: brak zewnętrznych assetów statycznych; Turnstile jest ładowany dynamicznie przez Cloudflare i nie wspiera SRI.**
  - Dowód:

## 10.3 Kontakt bezpieczeństwa

- [x] `/.well-known/security.txt` istnieje w projektach, w których chcemy publikować kanał zgłaszania podatności.
  - Dowód: `public/.well-known/security.txt` (Contact, Expires 2027-09-16, Preferred-Languages, Canonical, Policy); `tests/headers.spec.js` „security.txt i llms.txt są serwowane jako tekst” (sprawdza też, że `Expires` jest w przyszłości). Na domenie testowej: 200 `text/plain` (17.09.2026) po dodaniu `include-hidden-files: true` do artefaktu Pages – pierwsze wdrożenie gubiło katalog z kropką, co wykrył `staging-smoke`.

- [ ] Adres/URL podany w `security.txt` jest rzeczywiście monitorowany.
  - **DO POTWIERDZENIA Z KLIENTEM:** wskazany `bartek@przyjacielodyseusza.pl` (skrzynka klienta). Pozycja 14 na liście pytań w `REVIEW.md`.
  - Dowód:

---

# 11. Formularze, antyspam i dostarczanie wiadomości

- [x] Każdy formularz przetwarzany przez backend posiada walidację po stronie serwera.
  - Walidacja tylko w przeglądarce nie wystarcza.
  - Dowód: `functions/api/contact.js` (długości, regex e-mail, limit 4000 znaków); `tests/form.spec.js` „puste dane → 422 z listą pól”, „nieprawidłowy JSON → 400”.

- [x] Walidacja po stronie klienta daje użytkownikowi szybki i zrozumiały feedback.
  - Dowód: walidacja przy wysyłce i przy `blur`/`input`, komunikaty pod polami; test „walidacja po stronie klienta daje natychmiastowy, konkretny feedback”.

- [x] Dane wejściowe są bezpiecznie obsługiwane po stronie odbiorcy.
  - Dowód: e-mail w formacie tekstowym (bez HTML), pola przycinane i ograniczone długością, białe znaki w nagłówkach normalizowane; stały odbiorca; brak zapisu danych.

- [x] Publiczne formularze posiadają ochronę antyspamową.
  - Zalecane rozwiązania: Cloudflare Turnstile i honeypot.
  - Dowód implementacji: honeypot `website` i Turnstile wymagany przy skonfigurowanej wysyłce. Usunięto arbitralny próg czasu wypełniania; szybkie pisanie lub autouzupełnianie nie powoduje pozornego sukcesu. Konfigurację dostawcy potwierdzić przed produkcją.

- [x] Antyspam nie powoduje problemów z dostępnością.
  - Dowód: honeypot `aria-hidden`, `tabindex="-1"`, poza ekranem; test klawiaturowy potwierdza, że nie dostaje focusu; Turnstile w trybie `interaction-only` (bez CAPTCHA dla ludzi).

- [x] Stan sukcesu pojawia się dopiero po potwierdzeniu sukcesu przez backend.
  - Dowód implementacji: `res.ok && json.ok` w rzeczywistej ścieżce wysyłki; demo nie emituje `form_submit_success`. Odpowiedź HTML na POST bez JS pokazuje wynik bez zależności od skryptu. Honeypot zachowuje celową odpowiedź pozornego sukcesu dla botów.

- [x] Błąd backendu pokazuje użytkownikowi zrozumiały komunikat.
  - Dowód: „Nie udało się wysłać wiadomości. Napisz bezpośrednio na … lub zadzwoń …” z linkami `mailto:`/`tel:`; test.

- [x] Wielokrotne szybkie wysłanie formularza jest bezpiecznie obsłużone.
  - Dowód: przycisk `disabled` w trakcie żądania; test „podwójne kliknięcie nie wysyła dwóch żądań”. Brak limitu na serwerze (KV wymaga konta) – Turnstile jako docelowa ochrona przed floodem.

- [x] Endpoint formularza nie może być banalnie wykorzystany jako otwarty relay lub do nieprzewidzianych żądań.
  - Dowód: odbiorca wyłącznie z `env.CONTACT_TO` (pola `to`/`subject` z żądania są ignorowane), tylko `POST`, `GET` → 405; testy „endpoint nie jest otwartym relayem”, „endpoint formularza odrzuca GET”.

- [ ] Wiadomości/formularze trafiają do właściwego odbiorcy.
  - **PRZED PRODUKCJĄ:** skonfigurować dostawców i zweryfikowaną domenę; wysłać test end-to-end i potwierdzić wiadomość u właściwego odbiorcy. Domyślny adres: `bartek@przyjacielodyseusza.pl`.
  - Dowód: lokalnie bez klucza funkcja zwraca `500 not_configured`, a UI pokazuje kontakt awaryjny (test).

- [ ] `From`, `Reply-To` i nadawca techniczny są skonfigurowane poprawnie.
  - **CZĘŚCIOWO:** kod ustawia `from = CONTACT_FROM` (domena klienta), `reply_to = e-mail nadawcy formularza`; wartości produkcyjne po konfiguracji Resend.
  - Dowód: `functions/api/contact.js`, README (tabela zmiennych).

- [ ] SPF jest skonfigurowany dla domeny/usługi wysyłającej, jeśli dotyczy.
  - **PRZED URUCHOMIENIEM PRODUKCJI** (rekordy z panelu Resend, instrukcja w README).
  - Dowód:

- [ ] DKIM jest skonfigurowany, jeśli dotyczy.
  - **PRZED URUCHOMIENIEM PRODUKCJI.**
  - Dowód:

- [ ] DMARC został skonfigurowany albo świadomie przeanalizowany.
  - **PRZED PRODUKCJĄ:** uzgodnić politykę DMARC z administratorem poczty i sprawdzić SPF/DKIM dla wszystkich uprawnionych nadawców; nie kopiować arbitralnej polityki z przykładu.
  - Dowód:

- [ ] Dostarczanie formularza przetestowano end-to-end na produkcji.
  - **PRZED URUCHOMIENIEM PRODUKCJI.**
  - Dowód:

---

# 12. UX i jakość treści

- [x] Strona jest używalna na reprezentatywnych szerokościach telefonu.
  - Dowód: projekty Playwright Pixel 7 i iPhone 14, testy 320 px i 390 px; zrzuty `docs/screens/mobile-*.png`.

- [x] Strona jest używalna na reprezentatywnych szerokościach tabletu.
  - Dowód: zrzut 1024×768 (`docs/screens/tablet-hero.png`), breakpointy 48 em / 64 em.

- [x] Strona jest używalna na typowych rozdzielczościach desktopowych.
  - Dowód: testy i zrzuty 1280 i 1440 px (`docs/screens/desktop-*.png`).

- [x] Bardzo szerokie ekrany nie powodują ewidentnie popsutego layoutu.
  - Dowód: test „bardzo szeroki ekran nie psuje układu” (2560 px, kontener max 74 rem wyśrodkowany).

- [x] Nawigacja działa poprawnie myszką, klawiaturą i dotykiem.
  - Dowód: testy klikania (desktop), `tap` w projektach mobilnych, Escape/Tab w `tests/a11y.spec.js`.

- [x] Stany hover, focus, active i disabled są świadomie zaprojektowane.
  - Dowód: `src/css/style.css`: `.btn:hover`, `.btn:active`, `.btn[disabled]`, `:focus-visible`, `.site-nav__list a:hover/.is-active`, `.field__input:hover/:focus-visible/.is-invalid`.

- [x] Przyciski i CTA jasno mówią, co się wydarzy po kliknięciu.
  - Unikaj ogólników typu "Kliknij tutaj", jeśli można użyć konkretniejszego tekstu.
  - Dowód: „Umów bezpłatną rozmowę wstępną”, „Poznaj ofertę”, „Zobacz, jak wygląda współpraca”, „Przejdź do kontaktu”, „Umów bezpłatną rozmowę” (przycisk formularza).

- [x] Numery telefonu wykorzystują `tel:` tam, gdzie kliknięcie powinno rozpocząć połączenie.
  - Dowód: `tel:+48601145360` w kontakcie i stopce; test.

- [x] Adresy e-mail wykorzystują `mailto:` tam, gdzie ma to sens.
  - Dowód: `mailto:bartek@przyjacielodyseusza.pl`; test.

- [x] Linki otwierające nową kartę robią to świadomie.
  - Nie wymuszaj nowej karty bez powodu.
  - Dowód: brak `target="_blank"`; test.

- [ ] Nie pozostał żaden placeholder ani Lorem Ipsum.
  - **CZĘŚCIOWO:** w podglądzie sekcja opinii pokazuje widocznie oznaczony przykład układu; dane administratora pozostają do uzupełnienia. Przed produkcją zastąpić przykłady prawdziwymi opiniami albo ukryć sekcję oraz zatwierdzić politykę prywatności.
  - Dowód: `tests/links.spec.js` „w kodzie nie ma adresów stagingu, localhost ani placeholderów”.

- [x] Nie pozostały żadne TODO, debugowe teksty ani komunikaty developerskie widoczne dla użytkownika.
  - Dowód: test regex `TODO|\{\{|lorem` na serwowanym HTML; brak `console.log` w `main.js`.

- [x] Rok copyright i dane firmy są aktualne.
  - Dowód: `© <span id="rok">2026</span>` aktualizowany przez JS; nazwa i imię w stopce.

- [x] Dane kontaktowe są spójne w całym serwisie.
  - Dowód: jeden e-mail i jeden telefon w sekcji kontakt, stopce, polityce, JSON-LD, `security.txt`, `llms.txt`; test.

- [x] Ważne dokumenty do pobrania otwierają/pobierają się poprawnie. **N/D: brak dokumentów do pobrania.**
  - Dowód:

- [x] Konsola przeglądarki nie pokazuje błędów produkcyjnych podczas normalnych ścieżek użytkownika.
  - Dowód: `tests/smoke.spec.js` „strona główna ładuje się bez błędów w konsoli” (console.error, pageerror, requestfailed) we wszystkich projektach.

---

# 13. Kompatybilność z przeglądarkami i urządzeniami

- [x] Przetestowano aktualną przeglądarkę Chromium.
  - Dowód: projekt `chromium` (Playwright Chromium 1.63) – pełny zestaw testów.

- [x] Przetestowano aktualne Safari/WebKit albo zapewniono test automatyczny.
  - Dowód: projekt `webkit` (Playwright WebKit) – pełny zestaw testów po usunięciu `upgrade-insecure-requests` z CSP (WebKit upgradeował `http://127.0.0.1` do `https`).

- [x] Przetestowano aktualnego Firefoxa albo zapewniono test automatyczny.
  - Dowód: projekt `firefox` (Playwright Firefox 155).

- [ ] Kluczowe ścieżki sprawdzono w Mobile Safari.
  - **CZĘŚCIOWO:** emulacja iPhone 14 (WebKit, touch, UA) w projekcie `mobile-safari`; test na fizycznym iPhonie zalecany przed publikacją.
  - Dowód: `playwright.config.js`, wyniki `npm test`.

- [ ] Kluczowe ścieżki sprawdzono w Chrome na Androidzie.
  - **CZĘŚCIOWO:** emulacja Pixel 7 (Chromium, touch, UA) w projekcie `mobile-chrome`; test na fizycznym Androidzie zalecany.
  - Dowód: `playwright.config.js`.

- [x] Formularze i menu działają z ekranem dotykowym.
  - Dowód: testy `tap()` menu mobilnego i formularza w projektach `hasTouch: true`.

---

# 14. Gotowość operacyjna

- [x] Pipeline CI/CD jest skonfigurowany.
  - Dowód implementacji (19.09): `.github/workflows/qa.yml` przypina SHA A/B/C, wykonuje pełne QA każdego wariantu, a `staging` pobiera konkretne artefakty tych przebiegów. Smoke używa tych samych SHA. Publikacja jest serializowana i ograniczona do github.io; wdrożenie tej zmiany w CI nie zostało jeszcze potwierdzone.

- [x] Deploy z głównej gałęzi produkcyjnej jest powtarzalny i deterministyczny.
  - Dowód: brak builda na hostingu, publikowany jest katalog `public/` 1:1; `public/assets` generowane z `src/` i weryfikowane w CI (`git diff --exit-code`).

- [x] Preview/staging działa, jeśli wymaga tego workflow projektu.
  - Dowód: wersja testowa https://powers-p1.github.io/przyjaciel-odyseusza/ publikowana automatycznie z `main` po zielonym QA (GitHub Pages; podkatalog, `noindex`, bez nagłówków `_headers` i bez funkcji formularza – ograniczenia opisane w `README.md`). **PRZED URUCHOMIENIEM PRODUKCJI:** podglądy Cloudflare Pages `*.pages.dev` dla gałęzi/PR, do objęcia Access policy.

- [x] Znana i udokumentowana jest procedura rollbacku.
  - Dowód: `README.md` sekcja „Rollback” (Deployments → Rollback to this deployment; alternatywnie `git revert`).

- [ ] Konfiguracja DNS jest udokumentowana.
  - **CZĘŚCIOWO:** wymagane rekordy opisane w `README.md` (apex i `www` → Pages, MX/SPF/DKIM/DMARC); konkretne wartości po podpięciu domeny.
  - Dowód: `README.md` „Domena i kanoniczny host”, „Operacje”.

- [ ] Wiadomo, kto odpowiada za własność i odnawianie domeny.
  - Do uzupełnienia w tabeli „Operacje” w `README.md` (klient / agencja).
  - Dowód:

- [ ] Wiadomo, kto odpowiada za hosting i jego płatności.
  - Do uzupełnienia (plan Free, ale konto Cloudflare musi mieć właściciela).
  - Dowód:

- [x] Zmienne środowiskowe są udokumentowane bez ujawniania sekretów.
  - Dowód: `README.md` (tabela `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`, `TURNSTILE_SECRET`), `.dev.vars.example`, nagłówek `functions/api/contact.js`.

- [ ] Sekrety produkcyjne są przechowywane w systemie sekretów hostingu/providerów.
  - **PRZED URUCHOMIENIEM PRODUKCJI:** Pages → Environment variables (Secret). W kodzie tylko `env.*`.
  - Dowód: `functions/api/contact.js`.

- [ ] Monitoring uptime jest skonfigurowany.
  - Zalecane dla stron istotnych biznesowo.
  - **PRZED URUCHOMIENIEM PRODUKCJI** (np. UptimeRobot free lub Cloudflare Health Checks).
  - Dowód:

- [ ] Istnieje monitoring krytycznych formularzy/endpointów tam, gdzie utrata leadów byłaby kosztowna.
  - **PRZED URUCHOMIENIEM PRODUKCJI:** zalecenie: cotygodniowy testowy formularz + alert Resend o błędach dostarczania; Turnstile analytics.
  - Dowód:

- [x] Monitoring błędów jest wdrożony, jeśli serwis zawiera istotną logikę aplikacyjną. **N/D: prosta strona statyczna; jedyna logika (formularz) ma awaryjną ścieżkę `mailto:`/`tel:`.**
  - Dowód:

- [x] Strategia backupu / source of truth jest jasna.
  - Dowód: repozytorium = pełne źródło prawdy (strona w 100 % odtwarzalna z `public/` + `functions/`); brak bazy danych.

---

# 15. Automatyczny QA i blokady przed releasem

> To, co da się wiarygodnie sprawdzić automatycznie, nie powinno zależeć od pamięci developera lub agenta.

**Uwagi accounta — 19.09.2026, kolejna iteracja:**

- A/B/C: powiększony portret i H1, osobne wiersze nazwiska i roli, dwa CTA i trzy fakty.
  Usunięto wskazane dopiski hero; informacja B2B-first z możliwością współpracy prywatnej jest na początku oferty.
- B/C: symbole mentoringu i coachingu, szersze wprowadzenie oferty, ręczny slider sześciu jawnie oznaczonych
  przykładów (bez autoplay, z klawiaturą, natywnym przewijaniem i pełną treścią bez JS).
- B: usunięty cennik, odpowiadające mu linki i dane ceny; mniejszy odstęp po sekcji „O mnie”.
  C: krótszy układ „O mnie”, osobne akapity rozpoczynające się od „Łączę” i „Odpowiem”.
- B/C: wymagane potwierdzenie informacji o danych, zatwierdzone przez zlecającego, oraz przycisk
  „Wyślij formularz”. Walidacja HTML/JS i backendu; to potwierdzenie informacji, nie zgoda marketingowa.
  Wymagalność pola nie oznacza zatwierdzenia całej dokumentacji prawnej.
- Podgląd pozostaje demonstratorem: widoczny komunikat przed przyciskiem, brak POST, zachowane pola;
  nie uruchamiano rzeczywistej wysyłki ani zmian DNS.
- Porównanie z uwagami i zrzutami: sprawdzono copy, hierarchię, kadr portretu, kolory, ikony, odstępy
  i układy 390/834/1440 px; hero dodatkowo 320/1366/1920/2560 px. Treści nie są wymuszane w jednym
  wierszu na małych ekranach. Browser plugin niedostępny; użyto repozytoryjnego Playwright.
- Wyniki poniższego starszego przeglądu dotyczą poprzedniej iteracji. Nową publikację zatwierdza pełny CI
  przypięty do SHA, łącznie z WebKit i kontrolą podglądu po wdrożeniu.
- Zweryfikowane lokalnie po tych zmianach: A 268, B 292, C 292 testy przeszły; po 8 pominięć
  wynikających z warunków testów, bez błędów i niestabilnych powtórek w końcowym przebiegu.
  Chromium, Firefox i Pixel 7; build, HTML/CSS/CSP i typografia poprawne.
  Backend: A 11/11, B i C po 13/13. Dodatkowa kontrola wygenerowanego demo B/C:
  wymagany checkbox, brak POST i brak czyszczenia danych po kliknięciu przycisku.
- Końcowy przegląd klawiatury: naprawiono utratę fokusu na krańcach slidera przez użycie
  aria-disabled i guardów aktywacji. Po poprawce 118 testów slidera/dostępności/typografii przeszło
  w każdym z B/C (2 pominięcia warunkowe; Chromium, Firefox, Pixel 7).

- [x] Build produkcyjny uruchamia się w CI.
  - Dowód: krok `npm run build` + `git diff --exit-code -- public` w `.github/workflows/qa.yml` przechodzi na `ubuntu-latest` (17.09.2026) – build jest powtarzalny między Windows a Linuksem (LF wymuszone w `.gitattributes`, esbuild z lockfile).

- [x] Istnieje automatyczny test broken links.
  - Dowód: `tests/links.spec.js` (linki wewnętrzne, kotwice, zasoby, brak adresów stagingu).

- [x] Istnieją automatyczne testy dostępności.
  - Zalecane: axe-core.
  - Dowód: `tests/a11y.spec.js` (axe-core WCAG 2.2 AA w 4 stanach + klawiatura, focus, cele dotykowe, reduced motion).

- [x] Istnieje test Lighthouse / Lighthouse CI.
  - Dowód: `tools/lighthouse.mjs` z progami wydania (exit 1 przy niespełnieniu), krok w CI.

- [x] Walidacja HTML/markup jest wykonywana tam, gdzie daje wartość.
  - Dowód: `npm run validate` (`html-validate` 11, preset recommended + reguły WCAG) – 3 strony bez błędów (16.09.2026); krok w CI.

- [x] Automatyczne smoke testy pokrywają krytyczną nawigację.
  - Zalecane: Playwright.
  - Dowód: `tests/smoke.spec.js` (kotwice, CTA → formularz, menu mobilne, tel/mailto, reflow, zoom, ultra-wide, konsola, cookies, stare kotwice).

- [x] Krytyczny formularz posiada automatyczny albo powtarzalny udokumentowany test.
  - Dowód implementacji: `tests/form.spec.js`, `tests/backend/contact-handler.node.js` i `tests/staging.spec.js`. Testy dostawców używają atrap, nie wysyłają maili. Weryfikacja end-to-end skrzynki pozostaje osobnym warunkiem produkcji.

- [x] Dostępność sitemap jest testowana.
  - Dowód: `tests/seo.spec.js`.

- [x] Dostępność `robots.txt` jest testowana.
  - Dowód: `tests/seo.spec.js`.

- [x] Canonicale są testowane dla reprezentatywnych stron.
  - Dowód: `tests/seo.spec.js` (obie strony + zgodność z sitemapą).

- [x] Dane strukturalne są częścią procesu QA.
  - Dowód: `tests/seo.spec.js` „JSON-LD parsuje się i opisuje to, co widać na stronie”.

- [x] Nagłówki bezpieczeństwa są sprawdzane automatycznie albo przy każdym audycie wydania.
  - Dowód: `tests/headers.spec.js` na `wrangler pages dev` (czyta realne `_headers`).

- [x] CI zatrzymuje release przy poważnej regresji dostępności.
  - Dowód implementacji: `staging` zależy od `snapshots` i całej macierzy `qa`; błąd dowolnego wariantu zatrzymuje publikację. Nowe przebiegi trzeba potwierdzić po włączeniu workflow; historyczne wyniki z 16–18.09 nie weryfikują nowej konfiguracji.

- [x] CI zatrzymuje release przy błędzie buildu lub krytycznych smoke testach.
  - Dowód: jak wyżej (`git diff --exit-code`, `npm run validate`, `npm test`, Lighthouse – każdy błąd zatrzymuje pipeline przed jobem `staging`).

- [x] Dla projektów, gdzie wydajność ma znaczenie biznesowe, określono performance budget / próg wydania.
  - Dowód: `tools/lighthouse.mjs`: Performance ≥ 90, Accessibility/Best practices/SEO ≥ 95, LCP ≤ 2,5 s, CLS ≤ 0,1, TBT ≤ 200 ms.

**Bieżące QA lokalne — 19.09.2026 (Codex):** A, B i C: po 235 testów przeszło, 8 pominięć zgodnych
z warunkami testów, 0 błędów i 0 niestabilnych powtórek. Przeglądarki: Chromium, Firefox, profil Pixel 7
(`npm test -- --project=chromium --project=firefox --project=mobile-chrome --workers=2`).
Dodatkowo w każdym wariancie: build, walidacja HTML/CSS/CSP, 9 przypadków typografii i 11 testów backendu.
Wspólny demonstrator: 4 testy formularza (brak POST i zachowanie danych, także bez JS) oraz 2 testy
dostępności spisu wariantów. `npm audit`: 0 zgłoszonych podatności.
Wizualnie sprawdzono A/B/C przy 1440×900, 390×844 i 320×844; testy składu obejmują też 834/1280/1600 px
i odstępy użytkownika WCAG 1.4.12. Naprawiono inicjalizację menu powodującą przesunięcie treści.

Lighthouse, mediana z 3 przebiegów lokalnych dla każdego profilu:

| Wariant | Performance mobile / desktop | Accessibility / Best practices / SEO | LCP mobile | CLS mobile |
| --- | --- | --- | --- | --- |
| A | 99 / 100 | 100 / 100 / 100 | 786 ms | 0,013 |
| B | 100 / 100 | 100 / 100 / 100 | 919 ms | 0,000 |
| C | 100 / 100 | 100 / 100 / 100 | 1893 ms | 0,000 |

Są to pomiary laboratoryjne, nie dane rzeczywistych użytkowników. Lokalny WebKit blokuje polityka
Windows Code Integrity; nie zmieniano zabezpieczeń systemu. Pełny zestaw 5 projektów, w tym WebKit
i profil iPhone, pozostaje obowiązkową bramką CI na Ubuntu przed publikacją. Wynik wdrożenia
i smoke testów dla konkretnych SHA: [GitHub Actions](https://github.com/Powers-P1/przyjaciel-odyseusza/actions).
Produkcyjna wysyłka i domena nie były zmieniane ani testowane prawdziwymi wiadomościami.

**Historyczny wynik przebiegu `npm test` (sprzed zmian 19.09; nie potwierdza obecnego kodu) (5 projektów: Chromium, Firefox, WebKit, Pixel 7, iPhone 14; 18.09.2026):** 309 testów przeszło, 0 nieudanych, 1 niestabilny (przeszedł po powtórce). Lighthouse (mediana z 3 przebiegów, na żywo z adresów testowych, 18.09.2026): wydajność / dostępność / dobre praktyki 100-100-100 na mobile i desktopie we wszystkich trzech wersjach; LCP 1149-1176 ms mobile i 341-401 ms desktop, CLS ≤ 0,001, TBT 0-21 ms, transfer 145-169 kB. SEO 66 wyłącznie z powodu celowego `noindex` na hostingu testowym.

Przebiegi pośrednie wyłapały realne błędy przed finałem: nieobsługiwaną regułę `_redirects`, zbyt długą ścieżkę stanu wranglera na Windows, `upgrade-insecure-requests` łamiące WebKit na HTTP, kontrast etykiet 4,43:1, brak `&nbsp;` w numerze telefonu, 404 fontów po wstrzyknięciu CSS (ścieżki względne), oraz kilka wad samych testów.

---

# 16. Ostateczna checklista przed publikacją

> Kontrole wydania: konfigurację kont, DNS, poczty i treści zamknąć przed uruchomieniem produkcji.
> Kontrole działającej domeny wykonać podczas wdrożenia, przed skierowaniem ruchu; potem powtarzać je w monitoringu.
> Zaznaczenia i datowane dowody z poprzednich przebiegów nie zastępują ponownego sprawdzenia zmienionego kodu.

- [ ] Domena produkcyjna rozwiązuje się poprawnie.
  - Dowód:

- [ ] Certyfikat HTTPS jest ważny.
  - Dowód:

- [ ] Przekierowanie na kanoniczną wersję domeny działa.
  - Dowód:

- [x] Produkcyjny `robots.txt` jest poprawny.
  - Dowód: treść finalna w `public/robots.txt`, test lokalny; **przy wdrożeniu, przed skierowaniem ruchu** potwierdzić pod produkcyjnym adresem.

- [x] Produkcyjna sitemap zawiera wyłącznie produkcyjne URL-e.
  - Dowód: `public/sitemap.xml`; test `links.spec.js` (brak `localhost`/`pages.dev`).

- [x] Adresy staging nie występują w kodzie strony, sitemapie ani metadanych.
  - Dowód: test `links.spec.js` „w kodzie nie ma adresów stagingu, localhost ani placeholderów”.

- [ ] Analityka odbiera eventy z produkcji.
  - Dowód:

- [x] Niekonieczne trackery są blokowane przed zgodą tam, gdzie jest to wymagane. **N/D: brak trackerów.**
  - Dowód:

- [x] Zmiana i cofnięcie zgody działa. **N/D: brak mechanizmu zgód.**
  - Dowód:

- [ ] Główne CTA działa.
  - Dowód: lokalnie `tests/smoke.spec.js` „główne CTA prowadzi do formularza”; na domenie testowej (17.09.2026, `npm run test:staging`, 5 przeglądarek) test przechodzi na żywym adresie; **przy wdrożeniu, przed skierowaniem ruchu** powtórzyć na produkcji.

- [ ] Każdy produkcyjny formularz został skutecznie wysłany przynajmniej raz.
  - Dowód:

- [ ] Odbiorca wiadomości z formularza został zweryfikowany.
  - Dowód:

- [ ] Social preview używa produkcyjnych adresów i assetów.
  - Dowód: w kodzie tak (test); **przy wdrożeniu, przed skierowaniem ruchu** LinkedIn Post Inspector.

- [x] Schema.org używa produkcyjnych URL-i.
  - Dowód: `tests/seo.spec.js`.

- [x] Nie pozostały testowe numery telefonów, adresy e-mail ani adresy fizyczne.
  - Dowód: jedyne dane to dane klienta (`+48 601 145 360`, `bartek@przyjacielodyseusza.pl`); test spójności.

- [x] Nie pozostały testowe ID analityki/tagów.
  - Dowód: brak jakichkolwiek ID analityki w kodzie (`grep -ri "G-\|GTM-\|clarity" public` bez trafień).

- [ ] Sprawdzono konsolę przeglądarki na produkcji.
  - Dowód historyczny: sprawdzono wersję testową 17.09.2026. Bieżący kod wymaga nowego przebiegu lokalnego i kontroli na docelowej domenie podczas wdrożenia. Konfiguracja `test:staging` jest dla noindex/demo i nie jest testem produkcyjnym.

- [ ] Wykonano produkcyjny smoke test na urządzeniu mobilnym.
  - Dowód: domena testowa: `npm run test:staging` 17.09.2026 (wynik historyczny, sprzed bieżących zmian) – **218 testów przeszło, 0 nieudanych, 77 pominiętych celowo** (testy nagłówków `_headers` i backendu formularza, których GitHub Pages nie ma, plus testy tylko-desktop/tylko-mobile i Tab w WebKicie), 54 s; profile Pixel 7 i iPhone 14 (menu mobilne, reflow 320 px, formularz, dostępność axe). Job `staging-smoke` w CI powtarza to po każdym wdrożeniu (Chromium desktop + Pixel 7). **PRZED URUCHOMIENIEM PRODUKCJI:** ręcznie na fizycznym telefonie.

- [ ] Wykonano produkcyjny smoke test na desktopie.
  - Dowód: jak wyżej (Chromium, Firefox, WebKit na żywym adresie testowym). **PRZED URUCHOMIENIEM PRODUKCJI** na produkcji.

---

# 17. Kontrola po publikacji

> Cała sekcja **PO PUBLIKACJI**.

- [ ] Search Console została potwierdzona, a sitemap zgłoszona.
  - Dowód:

- [ ] Po publikacji sprawdzono status crawlowania i indeksowania.
  - Dowód:

- [ ] Po pojawieniu się prawdziwego ruchu sprawdzono dane analityczne.
  - Dowód:

- [ ] Sprawdzono konwersje/key events pod kątem braków i duplikowania.
  - Dowód:

- [ ] Jeśli Clarity/heatmapy są aktywne, sprawdzono je na realnym ruchu.
  - Ponownie zweryfikuj maskowanie danych i działanie zgód.
  - Dowód: N/D, dopóki heatmapy nie są używane.

- [ ] Core Web Vitals sprawdzono ponownie, gdy pojawiła się wystarczająca ilość danych terenowych.
  - Dowód:

- [ ] Potwierdzono, że monitoring uptime działa.
  - Dowód:

- [ ] Potwierdzono dostarczanie formularzy po publikacji.
  - Dowód:

- [ ] Przejrzano nieoczekiwane 404 i problemy z przekierowaniami.
  - Dowód:

---

# 18. Moduły opcjonalne zależne od projektu

Odznaczaj tylko wtedy, gdy dany moduł dotyczy projektu.

> Punkty w czterech sekcjach poniżej dotyczą typów stron, którymi ten projekt nie jest.
> Uzasadnienie **N/D** stoi przy nagłówku sekcji i obejmuje wszystkie jej punkty.

## E-commerce

**N/D: strona nie sprzedaje online (warunki ustalane indywidualnie w kontrakcie).**

- [x] Dane strukturalne produktów są wdrożone poprawnie.
- [x] Koszyk i checkout zostały przetestowane.
- [x] Przetestowano sukces, błąd i anulowanie płatności.
- [x] Analityka transakcyjna działa i nie przesyła danych płatniczych lub wrażliwych.
- [x] Regulamin, zwroty, dostawa i wymagane informacje konsumenckie są dostępne.
- [x] Sposób prezentacji cen i podatków został zweryfikowany.
- [x] Przetestowano e-mail z potwierdzeniem zamówienia.

## Strona wielojęzyczna

**N/D: jeden język (polski).**

- [x] Każdy język ma zdefiniowaną strategię URL.
- [x] `hreflang` jest poprawnie wdrożony.
- [x] Przełącznik języka prowadzi do odpowiednich wersji tej samej treści tam, gdzie to możliwe.
- [x] Canonicale i sitemap uwzględniają wersje językowe.
- [x] Metadata zostały faktycznie przetłumaczone, a nie tylko skopiowane.
- [x] Dane strukturalne odpowiadają właściwej wersji językowej.
- [x] Nie pozostały placeholdery lub przypadkowe tłumaczenia automatyczne.

## Firma lokalna

**N/D: usługa bez publicznego adresu i godzin otwarcia (spotkania online / stacjonarnie po umówieniu); brak Google Business Profile w zakresie projektu. Jeśli klient założy GBP, dodać `LocalBusiness` z adresem i spójnym NAP.**

- [x] Nazwa firmy, adres i telefon są spójne.
- [x] LocalBusiness lub właściwy podtyp Schema.org jest wdrożony tam, gdzie ma zastosowanie.
- [x] Linki do mapy/nawigacji wskazują prawidłową lokalizację.
- [x] Godziny otwarcia są poprawne tam, gdzie są wyświetlane.
- [x] Dane są spójne z Google Business Profile tam, gdzie jest to istotne.

## Portal / blog / serwis contentowy

**N/D: landing page bez bloga.**

- [x] Metadata artykułów są poprawnie wdrożone.
- [x] Article schema jest wdrożona tam, gdzie ma zastosowanie.
- [x] Autor i data publikacji są poprawne.
- [x] Data aktualizacji zmienia się wyłącznie przy realnej zmianie redakcyjnej.
- [x] Rozważono lub wdrożono RSS/Atom tam, gdzie ma to sens.
- [x] Paginacja, archiwa i kategorie mają świadomie określone zasady indeksowania.

---

# 19. Decyzja o publikacji

## Problemy blokujące publikację

Wpisz wszystko, co uniemożliwia release:

1. Formularz nie wysyła e-maili do czasu konfiguracji Resend (`RESEND_API_KEY`, zweryfikowana domena, `CONTACT_FROM`) w Cloudflare Pages i testu end-to-end.
2. Polityka prywatności bez danych administratora (forma prawna, adres, NIP) i bez akceptacji klienta.
3. Fakty i decyzje z listy „Do potwierdzenia” w `REVIEW.md` (sekcja 5) nie zostały potwierdzone przez klienta (m.in. aktualność „nadal zarządzam”, cennik netto/brutto, forma pierwszego spotkania).
4. Zdjęcia to wycinki z makiet PNG; przed publikacją podmienić na oryginały z sesji.
5. **Migracja DNS grozi utratą poczty przychodzącej klienta.** Stan strefy odczytany 18.09.2026
   (`nslookup ... 8.8.8.8`): NS to `dns.home.pl`, `dns2.home.pl`, `dns3.home.pl`; rekord A apeksu
   wskazuje `46.242.239.156` (home.pl); **rekord MX wskazuje na sam apex** (`przyjacielodyseusza.pl`,
   priorytet 10), a nie na osobny host pocztowy. Przepięcie apeksu na Cloudflare Pages sprawia, że
   MX rozwiąże się na adres Cloudflare i poczta przychodząca przestaje docierać. Zapytanie o
   `_dmarc.przyjacielodyseusza.pl` zwraca rekord TXT zamiast NXDOMAIN, co wskazuje na wildcard
   w strefie – przez to weryfikacja DKIM w Resend może „przejść” także przy błędnej nazwie rekordu.
   Kolejność migracji: (1) potwierdzić z dotychczasowym operatorem poczty właściwą nazwę serwera
   i skierować MX na ten hostname (nigdy bezpośrednio na IP), z poprawnymi rekordami A/AAAA;
   host pocztowy ma działać w trybie DNS-only. Zachować usługę i wszystkich uprawnionych nadawców klienta.
   (2) SPF/DKIM pobrać z aktualnych paneli operatora i Resend; politykę DMARC uzgodnić z administratorem.
   (3) Sprawdzić rekordy, dopiero potem zmieniać NS; po zmianie ponownie potwierdzić odbiór i wysyłkę.
   Źródła: [Cloudflare – problemy z pocztą](https://developers.cloudflare.com/dns/troubleshooting/email-issues/),
   [Resend – weryfikacja domeny](https://resend.com/changelog/domain-verification-events).
   Właściciel: agencja; do wykonania razem z klientem, przed podpięciem domeny.
6. **Opinie są widocznym przykładem układu w podglądzie**, z etykietą „Przykładowy układ opinii — treść do zatwierdzenia” oraz `data-przyklad="tak"`. Przed produkcją wstawić zatwierdzone prawdziwe rekomendacje i usunąć oznaczenia albo ukryć sekcję. Brak opinii nie blokuje przeglądu wariantów. Właściciel: klient (treść), agencja (wdrożenie).

## Świadomie zaakceptowane wyjątki

Każdy wyjątek musi mieć powód i właściciela/decyzję.

1. Brak analityki i CMP na start (privacy-first, brak banera cookies) – właściciel: agencja; rewizja po decyzji klienta o kampaniach (`docs/plan-pomiarowy.md`).
2. Przekierowanie `www` → apex realizowane regułą w dashboardzie Cloudflare, nie w kodzie (ograniczenie `_redirects` w Pages) – właściciel: agencja przy podpinaniu domeny.
3. Test czytnikiem ekranu i na fizycznych urządzeniach mobilnych do wykonania ręcznie przed publikacją – właściciel: agencja.
4. W podglądzie sekcja „Opinie” pokazuje jawnie oznaczony przykład układu. To wyjątek dla demonstratora; przed produkcją prawdziwe opinie albo ukrycie sekcji – właściciel: klient i agencja.
5. Wersja testowa na GitHub Pages jest publicznie dostępna bez autoryzacji (GitHub Pages jej nie oferuje) i leży w publicznym repozytorium (plan GitHub Free nie daje Pages dla repozytoriów prywatnych). Ochrona przed indeksowaniem: `noindex, nofollow` na każdej stronie, bez sitemapy. W repozytorium nie ma sekretów ani danych innych niż te, które klient publikuje na swojej obecnej stronie. Po starcie produkcji wersję testową wyłączyć (Settings → Pages → Unpublish) – właściciel: agencja.
6. GitHub Pages nie obsługuje `_headers` ani funkcji `/api/contact`. Podgląd ma jawny tryb demo: informacja przed przyciskiem, lokalne sprawdzenie pól, zachowanie danych, bez żądania i bez sukcesu analitycznego; bez JS przycisk jest wyłączony. Nagłówki i backend wymagają sprawdzenia na Cloudflare przed produkcją – właściciel: agencja.

## Status końcowy

- [x] ŚRODOWISKO TESTOWE DOSTĘPNE: https://powers-p1.github.io/przyjaciel-odyseusza/ (`noindex`; aktualny commit wskazują stempel build w HTML i GitHub Actions)
- [ ] GOTOWE DO PRODUKCJI (po zamknięciu 6 blokerów powyżej)
- [ ] OPUBLIKOWANE NA PRODUKCJI
- [ ] KONTROLA PO PUBLIKACJI ZAKOŃCZONA

Data bieżącej weryfikacji lokalnej i aktualizacji dokumentacji: 2026-09-19. Wyniki: sekcja 15.

Historyczny audyt z 18.09: Claude. Bieżące poprawki i QA z 19.09: Codex na zlecenie OK Agency / Damian Karolewski Technology Solutions.

Uwagi: trzy warianty przeszły lokalne QA i są przygotowane do przeglądu klienta; przed publikacją zestawu CI powtarza pełne testy. Ten etap nie wymaga produkcyjnej wysyłki z formularza demonstracyjnego ani finalnych opinii, gdy ograniczenia są widoczne. Przed produkcją trzeba zamknąć konfigurację poczty i DNS/MX, potwierdzić dostarczenie wiadomości, zaakceptować dokumenty i materiały oraz wykonać kontrolę wdrożenia. Kontrole indeksacji, danych terenowych i rzeczywistego ruchu należą do okresu po uruchomieniu.
