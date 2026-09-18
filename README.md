# Przyjaciel Odyseusza – strona (wersja „Pełne morze”)

Statyczny landing page dla Bartłomieja Przytuły (mentoring i coaching dla menedżerów), przygotowany pod
darmowy plan **Cloudflare Pages**. Czysty HTML, CSS i odrobina JavaScriptu, bez frameworków. Formularz
kontaktowy działa przez darmową funkcję Pages (`functions/api/contact.js`) i wysyła e-mail przez Resend.

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
│       ├── css/style.css           # ZMINIFIKOWANE (nie edytować ręcznie – patrz src/)
│       ├── js/main.js              # ZMINIFIKOWANE (nie edytować ręcznie – patrz src/)
│       ├── fonts/                  # Source Serif 4 + Inter (woff2, latin + latin-ext, self-hosting)
│       ├── img/                    # zdjęcia (webp + jpg), logo, obraz OG
│       └── icons/                  # favicony i ikony
├── src/
│   ├── css/style.css               # źródło stylów (czytelne, z komentarzami)
│   └── js/main.js                  # źródło skryptu (menu, reveal, formularz, zdarzenia analityczne)
├── functions/api/contact.js        # Cloudflare Pages Function: POST /api/contact
├── tools/build.mjs                 # minifikacja src/ → public/assets/ + twarde spacje w HTML
├── tools/typografia.mjs            # polski skład: twarde spacje, dzielenie wyrazów, wdowy
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

## Edycja treści

1. Copy: `public/index.html` (sekcje opisane komentarzami `HERO`, `OFERTA`, `DLA KOGO`, `SYTUACJE`,
   `WSPÓŁPRACA`, `O MNIE`, `OPINIE`, `KONTAKT`). Pisz zwykłe spacje, `npm run build` doda twarde spacje.
2. Style i skrypt: edytuj **`src/`**, następnie `npm run build`. Pliki w `public/assets/css` i `js` są
   generowane; CI odrzuci commit, w którym `public/` nie zgadza się ze `src/`. Build dodatkowo wstawia
   zminifikowany CSS bezpośrednio do HTML (`<style data-inline="style.css">`, szybsze pierwsze malowanie na
   mobile) i wpisuje jego hash SHA-256 do `Content-Security-Policy` w `public/_headers`. Nie edytuj tego
   bloku ręcznie, build go podmienia.
3. Fonty: odchudzone pliki self-hosted zbudowane skryptem `tools/fonts-build.py` (fontTools) z pełnych fontów
   Google (Source Serif 4 jako font zmienny 400–600, Inter 400/500/600), zestaw znaków: łacina + polskie znaki
   + typografia. Bez preloadu, `font-display: swap`. Nowa grubość lub znaki spoza zestawu (np. cyrylica) wymagają
   ponownego uruchomienia skryptu (instrukcja w jego nagłówku).
4. Opinie klientów: sekcja `#opinie` jest gotowa, ale ukryta atrybutem `hidden`. Po otrzymaniu rekomendacji
   uzupełnij cytaty i usuń `hidden` z `<section id="opinie">`.
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

Frontend wysyła `POST /api/contact` (JSON); bez JavaScriptu działa klasyczny POST z przekierowaniem
i komunikatem. Walidacja jest po obu stronach, antyspam: honeypot + minimalny czas wypełnienia (+ opcjonalnie
Turnstile). Stan sukcesu pokazuje się dopiero po potwierdzeniu przez backend. Endpoint wysyła wyłącznie na
stały adres z konfiguracji, więc nie da się go użyć jako otwartego przekaźnika.

### Wysyłka e-mail (Resend, plan darmowy – 3000 wiadomości/mies.)

1. Konto na <https://resend.com>, dodaj i zweryfikuj domenę `przyjacielodyseusza.pl` (rekordy SPF/DKIM –
   Resend pokaże gotowe wartości; DMARC dodaj ręcznie: `v=DMARC1; p=quarantine; rua=mailto:bartek@przyjacielodyseusza.pl`).
2. Klucz API z uprawnieniem *Sending access*.
3. Pages → projekt → **Settings → Environment variables** (Production):

| Zmienna          | Wartość                                                                 |
|------------------|-------------------------------------------------------------------------|
| `RESEND_API_KEY` | klucz z Resend (oznacz jako *Secret*)                                    |
| `CONTACT_TO`     | `bartek@przyjacielodyseusza.pl`                                         |
| `CONTACT_FROM`   | `Formularz – Przyjaciel Odyseusza <formularz@przyjacielodyseusza.pl>`   |

4. Ponowny deploy (zmienne wczytują się przy deployu). Do czasu ustawienia klucza funkcja zwraca błąd,
   a strona pokazuje użytkownikowi bezpośredni e-mail i telefon.

### Turnstile (opcjonalnie, darmowy antyspam bez CAPTCHA)

1. Cloudflare → Turnstile → Add site (`przyjacielodyseusza.pl`, tryb Managed).
2. `public/index.html`: `data-turnstile-sitekey="0x4AAA..."` na elemencie `<form>`.
3. Zmienna `TURNSTILE_SECRET` (Secret) w Pages. CSP w `_headers` już dopuszcza `challenges.cloudflare.com`.

## Analityka

Strona nie ustawia cookies i nie ładuje trackerów, dlatego nie potrzebuje banera zgód. Rekomendacja i plan
zdarzeń: `docs/plan-pomiarowy.md` (Cloudflare Web Analytics, bez cookies). Skrypt strony emituje zdarzenia
`po:event` i `dataLayer.push`, które dowolne narzędzie może podchwycić bez zmian w kodzie.

## Wersja testowa na GitHub Pages

Repozytorium: <https://github.com/Powers-P1/przyjaciel-odyseusza>. Każdy push do `main` albo gałęzi `wersja-*`
przechodzi przez QA (`.github/workflows/qa.yml`), a po zielonym QA workflow publikuje razem trzy warianty strony
do porównania przez klienta i uruchamia na każdym smoke testy z jego gałęzi:

| Wersja | Gałąź      | Adres testowy                                                | Zawartość |
|--------|------------|--------------------------------------------------------------|-----------|
| A      | `main`     | <https://powers-p1.github.io/przyjaciel-odyseusza/>          | pełne copy zoptymalizowane pod SEO – 917 słów |
| B      | `wersja-b` | <https://powers-p1.github.io/przyjaciel-odyseusza/wersja-b/> | ten sam układ, tekst odchudzony na podstawie badań czytelnictwa (`docs/wersja-b-zalozenia.md`) – 630 słów |
| C      | `wersja-c` | <https://powers-p1.github.io/przyjaciel-odyseusza/wersja-c/> | układ i treść według uwag klienta z pliku „pełne morze uwagi” – 313 słów |
| spis   | `main`     | <https://powers-p1.github.io/przyjaciel-odyseusza/wersje/>   | strona z linkami do wszystkich wersji (`tools/wersje.html`) |

Job `staging` buduje każdą wersję z jej gałęzi (`tools/staging.mjs --out …`) w jeden artefakt Pages, więc adresy są
zawsze spójne; po wyborze wersji przez klienta wystarczy scalić wybraną gałąź do `main` i usunąć pozostałe wpisy
z workflow oraz z `tools/wersje.html`.

- `npm run build:staging` (`tools/staging.mjs`) przepisuje gotowe `public/` do `dist-gh/`: podścieżka `/przyjaciel-odyseusza/`
  we wszystkich adresach, adres testowy zamiast produkcyjnego w canonical/OG/JSON-LD/`llms.txt`/`security.txt`,
  `noindex, nofollow` na każdej stronie, `robots.txt` bez sitemapy (roboty mogą wejść i zobaczyć noindex), `.nojekyll`.
- Ograniczenia GitHub Pages: brak `_headers` (nagłówki bezpieczeństwa i CSP działają tylko na Cloudflare), brak funkcji
  `/api/contact` (formularz kończy się błędem HTTP, interfejs pokazuje kontakt awaryjny: e-mail i telefon), brak
  autoryzacji dostępu (stąd noindex). Wszystko, co zależy od nagłówków i backendu, testujemy na emulacji Cloudflare (`npm test`).
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
- CI (`.github/workflows/qa.yml`) uruchamia build, testy i Lighthouse; błąd zatrzymuje pipeline.

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

Pełna lista ze statusami: `CHECKLISTA.md`. Minimum:

- [ ] Klucz Resend i zmienne środowiskowe ustawione, testowy formularz dotarł na skrzynkę
- [ ] Dane administratora w polityce prywatności uzupełnione
- [ ] Fakty do potwierdzenia z klientem zatwierdzone (`REVIEW.md`, sekcja „Do potwierdzenia”)
- [ ] Domena podpięta, Redirect Rule `www` → apex działa, `*.pages.dev` za Access policy
- [ ] Podgląd udostępniania sprawdzony (LinkedIn Post Inspector)
- [ ] Google Search Console: domena dodana, `sitemap.xml` zgłoszona
