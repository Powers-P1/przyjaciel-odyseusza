# Przyjaciel Odyseusza – strona (wersja „Pełne morze”)

Statyczny landing page dla Bartłomieja Przytuły (mentoring i coaching dla menedżerów), przygotowany pod
darmowy plan **Cloudflare Pages**. Czysty HTML, CSS i odrobina JavaScriptu, bez frameworków. Formularz
kontaktowy jest przygotowany do działania przez Pages Function (`functions/api/contact.js`) i Resend po konfiguracji kont oraz sprawdzeniu dostarczenia wiadomości.

Stan prac 19.09.2026: trzy warianty przeszły lokalne QA i są przygotowane do przeglądu klienta.
Bieżące wyniki znajdują się w sekcji 15 CHECKLISTA.md. CI testuje cały przypięty zestaw przed publikacją;
aktualny status i opublikowane SHA można sprawdzić w GitHub Actions oraz stemplu build w HTML podglądu.
Podgląd klienta pozwala porównać treść i układ; gotowość do produkcji wymaga osobno zamknięcia listy na końcu tego pliku.

Dokumenty towarzyszące:

- `CHECKLISTA.md` – produkcyjna checklista strony statycznej ze statusami i dowodami (jedno źródło prawdy o gotowości).
- `REVIEW.md` – review UI/UX i copy, user story, lista pytań do klienta.
- `docs/plan-pomiarowy.md` – decyzje dotyczące analityki (privacy-first) i zdarzeń.
- `docs/zrodla/` – tekst obecnej strony klienta (źródło faktów do copy).
- `docs/screens/` – zrzuty ekranu (lokalne i `staging-*` z żywej wersji testowej); `docs/lighthouse/` – raporty Lighthouse (`staging/` z adresu testowego).

## Struktura

```
.
├── public/                         # katalog publikowany (Build output directory)
│   ├── index.html                  # strona główna (całe copy)
│   ├── polityka-prywatnosci.html   # dostępna pod /polityka-prywatnosci (Pages ucina .html)
│   ├── 404.html                    # własna strona 404 (Pages zwraca dla niej kod 404)
│   ├── _headers                    # HSTS, CSP i inne nagłówki bezpieczeństwa, cache
│   ├── robots.txt, sitemap.xml, llms.txt, site.webmanifest, favicon.ico
│   ├── .well-known/security.txt    # kanał zgłaszania podatności
│   └── assets/
│       ├── js/main.js              # ZMINIFIKOWANE (nie edytować ręcznie – patrz src/)
│       ├── fonts/                  # Source Serif 4 + Inter (woff2, latin + latin-ext, self-hosting)
│       ├── img/                    # zdjęcia (webp + jpg), logo, obraz OG
│       └── icons/                  # favicony i ikony
├── src/
│   ├── css/style.css               # źródło stylów (czytelne, z komentarzami)
│   ├── js/init.js                  # mały inicjalizator inline przed CSS, dopuszczony hashem CSP
│   └── js/main.js                  # odroczony skrypt (menu, reveal, formularz, zdarzenia analityczne)
├── functions/api/contact.js        # Cloudflare Pages Function: POST /api/contact
├── tools/build.mjs                 # minifikacja src/ → public/assets/ + twarde spacje w HTML
├── tools/typografia.mjs            # NBSP po jednoliterowych wyrazach w blokach tekstu; naturalne łamanie w CSS
├── tools/lighthouse.mjs            # Lighthouse mobile + desktop z progami wydania (w CI mediana z 3 przebiegów)
├── tools/staging.mjs               # wariant testowy: public/ → dist-gh/ (podścieżka, noindex, adres testowy)
├── tools/psi.mjs                   # PageSpeed Insights dla adresu testowego (wymaga PSI_API_KEY przy limicie)
├── tools/screens.mjs               # zrzuty ekranu (lokalnie albo z opublikowanego adresu)
├── tests/                          # Playwright: smoke, SEO, a11y (axe), nagłówki, formularz, linki, hosting testowy
├── tests/_fixtures.js              # wspólne fixtures (podścieżka bazowa na hostingu testowym)
├── playwright.config.js            # 5 projektów: Chromium, Firefox, WebKit, Pixel 7, iPhone 14 (emulacja Cloudflare)
├── playwright.staging.config.js    # te same testy na opublikowanym adresie testowym (GitHub Pages)
├── .github/workflows/qa.yml        # CI: build, testy, Lighthouse → publikacja testowa na GitHub Pages → smoke na żywo
├── .gitattributes                  # LF wszędzie (build w CI porównuje public/ bajt po bajcie)
├── wrangler.toml                   # konfiguracja Pages (output dir = public)
└── .dev.vars.example               # wzór zmiennych do lokalnego testu funkcji
```

## Wymagania i komendy

Node.js 20+ (do testów i minifikacji; sama strona nie wymaga builda na hostingu).

```bash
npm install                 # zależności deweloperskie
npx playwright install      # przeglądarki do testów (Chromium, Firefox, WebKit)
npm run dev                 # lokalna emulacja Cloudflare Pages: http://127.0.0.1:8788
npm run build               # minifikacja src/ → public/assets/ + &nbsp; w HTML
npm test                    # wszystkie testy we wszystkich przeglądarkach
npm run test:quick          # tylko Chromium + mobile Chrome
npm run lighthouse          # Lighthouse (wymaga działającego `npm run dev`)
npm run build:staging       # wariant testowy do dist-gh/ (GitHub Pages; robi to CI)
npm run test:staging        # testy na https://powers-p1.github.io/przyjaciel-odyseusza/
npm run lighthouse:staging  # Lighthouse na adresie testowym (raporty w docs/lighthouse/staging/)
npm run deploy              # build + wrangler pages deploy (produkcja, Cloudflare)
```

Windows z długą ścieżką projektu: jeśli `wrangler pages dev` kończy się błędem `SQLITE_CANTOPEN`, ustaw
`WRANGLER_PERSIST_TO=C:\Temp\wrangler-state` (Playwright dopisze `--persist-to` automatycznie).
Dla niezależnego serwera QA ustaw `QA_PORT` na wolny port (domyślnie 8788).

## Edycja treści

1. Copy: `public/index.html` (sekcje opisane komentarzami `HERO`, `OFERTA`, `DLA KOGO`, `SYTUACJE`,
   `WSPÓŁPRACA`, `O MNIE`, `OPINIE`, `KONTAKT`). Pisz zwykłe spacje i zwykłe wyrazy – `npm run build`
   doda twarde spacje po jednoliterowych polskich wyrazach w blokach tekstu (`tools/typografia.mjs`).
   Przeglądarka łamie tekst naturalnie; żaden skrypt nie przebudowuje akapitów ani linków przy zmianie szerokości.
2. Po zmianie treści podnieś `<lastmod>` w `public/sitemap.xml`. Nie jest to zautomatyzowane
   świadomie: CI sprawdza, czy `npm run build` niczego nie zmienia w `public/`, a data brana
   z zegara psułaby tę gwarancję przy każdym przebiegu w kolejnym dniu.
3. Style i skrypt: edytuj **`src/`**, następnie `npm run build`. Plik `public/assets/js/main.js` oraz CSS inline w HTML są
   generowane; CI odrzuci commit, w którym `public/` nie zgadza się ze `src/`. Build dodatkowo wstawia
   zminifikowany CSS bezpośrednio do HTML (`<style data-inline="style.css">`, szybsze pierwsze malowanie na
   mobile) i wpisuje jego hash SHA-256 do `Content-Security-Policy` w `public/_headers`. Nie edytuj tego
   bloku ręcznie, build go podmienia.
   Mały synchroniczny `src/js/init.js` jest wstawiany przed CSS, żeby menu mobilne miało docelowy układ
   od pierwszego malowania. Build oblicza jego osobny hash w `script-src`; CSP nie używa `unsafe-inline`.
   Bez JavaScriptu klasa `js` nie powstaje i linki nawigacji pozostają widoczne.
3. Fonty: odchudzone pliki self-hosted zbudowane skryptem `tools/fonts-build.py` (fontTools) z pełnych fontów
   Google (Source Serif 4 jako font zmienny 400–600, Inter 400/500/600), zestaw znaków: łacina + polskie znaki
   + typografia. Bez preloadu, `font-display: swap`. Nowa grubość lub znaki spoza zestawu (np. cyrylica) wymagają
   ponownego uruchomienia skryptu (instrukcja w jego nagłówku).
4. Opinie klientów: sekcja `#opinie` pokazuje układ demonstracyjny z widoczną etykietą przykładu
   i `data-przyklad="tak"`. Przed produkcją wstaw zatwierdzone, prawdziwe opinie i usuń etykietę oraz
   atrybut albo ukryj całą sekcję. Brak opinii nie blokuje przeglądu wariantów.
5. Polityka prywatności: uzupełnij dane administratora w sekcji 1 i usuń ramkę „Do uzupełnienia”.
6. Zdjęcia: zachowaj nazwy plików lub popraw `src`/`srcset`. Zalecane rozmiary: portret hero 960×1403 px
   (wycinek na tle `#12343e`), portret „O mnie” 900×1103 px. WebP (jakość ~80) plus JPG jako zapas.

## Wdrożenie na Cloudflare Pages (plan Free)

### Wariant A – z repozytorium Git (zalecany)

1. Repozytorium (GitHub/GitLab) z zawartością tego folderu.
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Ustawienia: Framework preset **None**, Build command *(puste)*, Build output directory **public**.
4. Deploy. Folder `functions/` jest wykrywany automatycznie. Każdy push do `main` = nowy deploy;
   pull requesty dostają adresy preview `*.pages.dev`.

### Wariant B – bez Gita (Direct Upload)

```bash
npx wrangler login
npx wrangler pages project create przyjaciel-odyseusza --production-branch main
npm run deploy
```

### Migracja DNS – wykonać PRZED podpięciem domeny

> **Uwaga: w tej strefie MX wskazuje na sam adres domeny.** Przepięcie apeksu na Cloudflare Pages
> bez wcześniejszego odtworzenia rekordów pocztowych odcina klientowi pocztę przychodzącą.

Stan strefy odczytany 18.09.2026 (`nslookup -type=NS|A|MX|TXT przyjacielodyseusza.pl 8.8.8.8`):

| Rekord | Wartość | Uwaga |
| --- | --- | --- |
| NS | `dns.home.pl`, `dns2.home.pl`, `dns3.home.pl` | domena obsługiwana przez home.pl |
| A (apex) | `46.242.239.156` | serwer home.pl – to samo IP obsługuje WWW i pocztę |
| MX | `przyjacielodyseusza.pl` (priorytet 10) | **wskazuje na apex, nie na osobny host pocztowy** |
| TXT (SPF) | `v=spf1 a mx ~all` | autoryzuje to, na co wskazują `a` i `mx`, czyli apex |
| `_dmarc` | zwraca rekord TXT zamiast NXDOMAIN | w strefie działa wildcard – DMARC praktycznie nie istnieje |

Kolejność migracji:

1. **Przed zmianą NS** potwierdź z dotychczasowym operatorem nazwę hosta pocztowego i jego rekordy A/AAAA.
   Rekord MX wskazuje hostname, nigdy bezpośrednio adres IP. Zachowaj obecną usługę pocztową klienta.
2. W Cloudflare (strefa dodana, ale NS jeszcze niezmienione) odtwórz `MX` na zweryfikowany host;
   rekordy A/AAAA tego hosta muszą działać jako DNS-only, bez proxy HTTP. Odtwórz również SPF:
   Wartości pobierz z aktualnej konfiguracji operatora poczty i panelu Resend; zachowaj wszystkich uprawnionych nadawców.
3. Dodaj **jawne** rekordy `_dmarc` (`v=DMARC1; p=none; rua=mailto:…` na start) oraz
   `<selektor>._domainkey` z panelu Resend. Wildcard w starej strefie powodował, że błędnie wpisana
   nazwa też się rozwiązywała – jawny rekord wygrywa z wildcardem, więc weryfikacja przestaje kłamać.
4. Dopiero teraz zmień NS na Cloudflare i dodaj domenę w Pages (**Custom domains** poniżej).
5. Po migracji sprawdź: `nslookup -type=MX`, `-type=TXT` i wysyłkę testową na adres klienta,
   oraz `-type=TXT _dmarc` – ma zwrócić Twój rekord, nie wildcard.

Instrukcje dostawców: [Cloudflare – rekordy i hosty pocztowe](https://developers.cloudflare.com/dns/troubleshooting/email-issues/)
oraz [Resend – weryfikacja domeny](https://resend.com/changelog/domain-verification-events).

### Domena i kanoniczny host

1. Pages → projekt → **Custom domains**: dodaj `przyjacielodyseusza.pl` **i** `www.przyjacielodyseusza.pl`.
   Przy DNS w Cloudflare rekordy powstają automatycznie, certyfikat TLS również.
2. Przekierowanie `www` → apex: plik `_redirects` w Pages nie obsługuje reguł per host, więc użyj
   **Rules → Redirect Rules** (darmowe): *When hostname equals `www.przyjacielodyseusza.pl` → Dynamic redirect
   `concat("https://przyjacielodyseusza.pl", http.request.uri.path)`, status 301, preserve query string*.
3. Kanoniczny adres w kodzie to `https://przyjacielodyseusza.pl/` (canonical, OG, sitemap, JSON-LD).
4. Podglądy `*.pages.dev`: w Pages włącz **Access policy** dla preview deployments (Settings → General →
   Enable access policy), żeby staging nie był publiczny ani indeksowany.

### Rollback

Pages → projekt → **Deployments** → wybierz poprzednie wdrożenie → **Rollback to this deployment**. Trwa
kilkanaście sekund i nie wymaga ponownego builda. Przy wariancie Git alternatywą jest `git revert` + push.

## Formularz kontaktowy

Frontend wysyła `POST /api/contact` (JSON); bez JavaScriptu klasyczny POST zwraca samodzielną
stronę HTML z wynikiem i kontaktem bezpośrednim. Turnstile wymaga JavaScriptu, dlatego przy wyłączonym JS
użytkownik otrzymuje jasną informację i może skorzystać z e-maila lub telefonu. Walidacja jest po obu stronach,
a ochrona przed spamem obejmuje honeypot i Turnstile wymagany przy skonfigurowanej wysyłce. Szybkie wypełnienie
lub autouzupełnianie nie są powodem odrzucenia zgłoszenia. Stan sukcesu pokazuje się dopiero po potwierdzeniu przez backend. Endpoint wysyła wyłącznie na
stały adres z konfiguracji, więc nie da się go użyć jako otwartego przekaźnika.

### Wysyłka e-mail (Resend; limity zgodnie z wybranym planem)

1. Konto na <https://resend.com>, dodaj i zweryfikuj domenę `przyjacielodyseusza.pl` (rekordy SPF/DKIM –
   Resend pokaże wartości dla danej domeny; politykę DMARC uzgodnij z administratorem poczty i sprawdź przed zmianą DNS).
2. Klucz API z uprawnieniem *Sending access*.
3. Pages → projekt → **Settings → Environment variables** (Production):

| Zmienna          | Wartość                                                                 |
|------------------|-------------------------------------------------------------------------|
| `RESEND_API_KEY` | klucz z Resend (oznacz jako *Secret*)                                    |
| `CONTACT_TO`     | `bartek@przyjacielodyseusza.pl`                                         |
| `CONTACT_FROM`   | `Formularz – Przyjaciel Odyseusza <formularz@przyjacielodyseusza.pl>`   |

4. Ponowny deploy (zmienne wczytują się przy deployu). Do czasu ustawienia klucza funkcja zwraca błąd,
   a strona pokazuje użytkownikowi bezpośredni e-mail i telefon.

### Turnstile (wymagany przed publikacją, darmowy antyspam bez CAPTCHA)

Bez niego formularz chroniłby tylko honeypot, który nie wystarcza do ochrony publicznej wysyłki. Dlatego funkcja jest **fail-closed**: jeśli `RESEND_API_KEY` jest ustawiony (czyli wdrożenie
działa), a `TURNSTILE_SECRET` nie, `/api/contact` zwraca 500, a strona pokazuje kontakt awaryjny.
Literówka w nazwie zmiennej nie wyłączy captchy po cichu.

1. Cloudflare → Turnstile → Add site (`przyjacielodyseusza.pl`, tryb Managed).
2. `public/index.html`: `data-turnstile-sitekey="0x4AAA..."` na elemencie `<form>`.
3. Zmienna `TURNSTILE_SECRET` (Secret) w Pages. CSP w `_headers` już dopuszcza `challenges.cloudflare.com`.
4. Cloudflare → Security → WAF → Rate limiting: reguła na `/api/contact` (plan Free daje jedną regułę,
   stałe okno 10 s). To jedyne miejsce w tym projekcie, w którym warto ją wydać.

## Analityka

W bazowej konfiguracji strona nie ustawia cookies i nie ładuje trackerów. Docelowy zakres analityki,
mechanizm zgód i informację dla użytkownika trzeba uzgodnić z klientem przed produkcją. Plan
zdarzeń: `docs/plan-pomiarowy.md` (Cloudflare Web Analytics, bez cookies). Skrypt strony emituje zdarzenia
`po:event` i `dataLayer.push`, które dowolne narzędzie może podchwycić bez zmian w kodzie.

## Wersja testowa na GitHub Pages

Repozytorium: <https://github.com/Powers-P1/przyjaciel-odyseusza>. Każdy push do `main` albo gałęzi `wersja-*`
uruchamia workflow (`.github/workflows/qa.yml`). Ręczny `workflow_dispatch` jest również dostępny.
Publikacja jest dozwolona tylko dla `main`, `wersja-b` i `wersja-c`; lokalne gałęzie `codex/*` nie uruchamiają
publikacji. Najpierw workflow przypina cały zestaw A/B/C do SHA, a następnie wykonuje QA każdego z tych commitów.
Dopiero zielona macierz pozwala opublikować wspólny podgląd:

| Wersja | Gałąź      | Adres testowy                                                | Zawartość |
|--------|------------|--------------------------------------------------------------|-----------|
| A      | `main`     | <https://powers-p1.github.io/przyjaciel-odyseusza/>          | szerszy kontekst oferty i współpracy |
| B      | `wersja-b` | <https://powers-p1.github.io/przyjaciel-odyseusza/wersja-b/> | zwięzłe przedstawienie oferty i doświadczenia |
| C      | `wersja-c` | <https://powers-p1.github.io/przyjaciel-odyseusza/wersja-c/> | krótsza ścieżka od oferty i sytuacji zawodowych do kontaktu |
| spis   | `main`     | <https://powers-p1.github.io/przyjaciel-odyseusza/wersje/>   | strona z linkami do wszystkich wersji (`tools/wersje.html`) |

Job `qa` buduje i weryfikuje każdy przypięty commit, a potem zapisuje jego gotowy wariant demonstracyjny
jako artefakt oznaczony SHA. Job `staging` składa te konkretne artefakty w jedną witrynę bez ponownego
pobierania ruchomych gałęzi. Job `staging-smoke` pobiera testy z tych samych SHA. Cały przebieg publikacji
jest serializowany między gałęziami, a adres docelowy musi należeć do `github.io`. Po wyborze wariantu
trzeba świadomie uporządkować gałęzie, workflow i spis wersji.

- `npm run build:staging` (`tools/staging.mjs`) przepisuje gotowe `public/` do `dist-gh/`: podścieżka `/przyjaciel-odyseusza/`
  we wszystkich adresach, adres testowy zamiast produkcyjnego w canonical/OG/JSON-LD/`llms.txt`/`security.txt`,
  `noindex, nofollow` na każdej stronie, `robots.txt` bez sitemapy (roboty mogą wejść i zobaczyć noindex), `.nojekyll`.
- Ograniczenia GitHub Pages: brak `_headers` (nagłówki bezpieczeństwa i CSP działają tylko na Cloudflare), brak funkcji
  `/api/contact`. Formularz ma widoczną informację o trybie demo oraz przycisk „Sprawdź formularz”:
  sprawdza pola lokalnie, zachowuje dane, nie wysyła żądania i nie rejestruje udanej wysyłki. Bez JS przycisk
  jest wyłączony. Noindex ogranicza indeksowanie, ale nie jest kontrolą dostępu. Wszystko, co zależy od nagłówków i backendu, testujemy na emulacji Cloudflare (`npm test`).
  Witryna GitHub Pages ma jeden `404.html` (z wersji A), więc wersje w podkatalogach dzielą z nią stronę błędu;
  testy tych wersji pomijają sprawdzanie treści 404 (`SHARED_404` w `tests/_fixtures.js`).
- `npm run test:staging` uruchamia te same testy na opublikowanym adresie (z podścieżką; testy nagłówków i backendu są
  pomijane, dochodzą sprawdzenia z `tests/staging.spec.js`). `npm run lighthouse:staging` zapisuje raporty do
  `docs/lighthouse/staging/`, a `npm run psi:staging` pobiera pomiar PageSpeed Insights (Lighthouse po stronie Google).
  `node tools/screens.mjs [url] [prefiks]` zapisuje zrzuty (hero na 1440/1920/1366 px, cała strona, iPhone) do `docs/screens/`.
- Każda strona wersji testowej ma w `<head>` komentarz `wersja testowa, build <SHA>`; job `staging-smoke` czeka, aż CDN
  poda właśnie wdrożony commit, i dopiero wtedy testuje. W artefakcie Pages muszą być pliki z kropką
  (`include-hidden-files: true`), inaczej `.well-known/security.txt` znika.
- Po uruchomieniu produkcji wersję testową wyłącz (Settings → Pages → Unpublish) albo zostaw jako podgląd; jest poza indeksem.

## Testy i QA

- `npm test` uruchamia `wrangler pages dev` (prawdziwe nagłówki, przekierowania, funkcja, 404) i sprawdza:
  smoke (nawigacja, CTA, menu mobilne, reflow 320 px, zoom 200 %), SEO (title, description, canonical,
  robots, sitemap, OG, JSON-LD, 404), dostępność (axe-core WCAG 2.2 AA, klawiatura, focus, rozmiar celów
  dotykowych, reduced motion), nagłówki bezpieczeństwa i cache, formularz (walidacja serwera, honeypot,
  wariant bez JS, podwójne kliknięcie, komunikaty), linki i zasoby.
- `npm run lighthouse` – progi: Performance ≥ 90, Accessibility/Best practices/SEO ≥ 95, LCP ≤ 2,5 s,
  CLS ≤ 0,1, TBT ≤ 200 ms. Raporty w `docs/lighthouse/`.
- Typografia: testy mierzą przepełnienia i jednoliterowe wyrazy na końcu wiersza w szerokościach 320–1600 px,
  także z odstępami użytkownika WCAG 1.4.12; sprawdzają utrzymanie focusu podczas zmiany szerokości.
- CI (`.github/workflows/qa.yml`) uruchamia build, testy i Lighthouse dla całej przypiętej macierzy A/B/C;
  błąd dowolnego wariantu zatrzymuje publikację zestawu. Historyczne raporty nie potwierdzają bieżących zmian.

## Operacje (do uzupełnienia przez agencję/klienta)

| Obszar                      | Ustalenie                                                                 |
|-----------------------------|---------------------------------------------------------------------------|
| Właściciel domeny           | *(kto, gdzie zarejestrowana, data odnowienia)*                            |
| DNS                         | Cloudflare (zalecane) – rekordy: apex i `www` → Pages (CNAME), MX/SPF/DKIM/DMARC dla poczty i Resend |
| Hosting i płatności         | Cloudflare Pages Free – konto: *(kto)*                                    |
| Sekrety                     | tylko w Cloudflare Pages → Environment variables; lokalnie `.dev.vars` (w `.gitignore`) |
| Monitoring uptime           | *(np. Cloudflare Health Checks / UptimeRobot – do włączenia po publikacji)* |
| Kopia zapasowa              | repozytorium Git jest źródłem prawdy; strona jest w pełni odtwarzalna z repo |

## Lista kontrolna przed publikacją

Pełna lista ze statusami: `CHECKLISTA.md`. To warunki przed uruchomieniem ruchu produkcyjnego,
a nie powody do wstrzymania przeglądu trzech wariantów przez klienta. Minimum:

- [ ] Plan migracji DNS/MX/SPF potwierdzony z operatorem poczty; zachowana ciągłość wysyłki i odbioru
- [ ] Klucz Resend, Turnstile i zmienne środowiskowe ustawione, testowy formularz dotarł na właściwą skrzynkę
- [ ] Dane administratora w polityce prywatności uzupełnione
- [ ] Fakty do potwierdzenia z klientem i zakres analityki/zgód zatwierdzone (`REVIEW.md`)
- [ ] Finalne zdjęcia wybrane; prawdziwe opinie zatwierdzone albo sekcja ukryta
- [ ] Domena podpięta, Redirect Rule `www` → apex działa, `*.pages.dev` za Access policy
- [ ] Podgląd udostępniania sprawdzony (LinkedIn Post Inspector)
- [ ] Google Search Console: domena dodana, `sitemap.xml` zgłoszona
