# Wykonanie P0 i P1 — 15 listopada 2026

Checkpoint 14:05 CET: **P0 23/32, P1 139/172**. **0 zł nowych opłat, bez utraty poczty.** [Pełna checklista](CHECKLISTA_TECHNICZNA_2026-11-15.md). Otwarte punkty zachowują rzeczywiste zależności; przygotowanie części technicznej nie oznacza zakończenia przekazania klientowi.

## Konta i analityka

Poprawny osobny GA4: **Przyjaciel Odyseusza — BFP**, konto **416367370**, usługa **564407819**, strumień **G-G9DCMYPSKQ**. **Oliwia i klient są Administratorami konta**, dziedziczonymi przez usługę. Oliwia zachowuje Administratora do faktycznego odbioru i sprawdzenia dostępu klienta. Agencja nie ma dostępu do Gmail klienta. Inne konto agencyjne nie ma dostępu do poprawnego zasobu.

Starszy zasób 416332137/564373201 pozostaje klientowi, bez dostępu agencji. Nie został usunięty i nie przeniesiono jego danych. Zmiana identyfikatora strony jest oddzielnym wdrożeniem; ostatni faktyczny commit/deployment i wynik odbioru wskazują prywatne `closeout-release-proof.json`, `closeout-http-proof.json` i `ga4-real-production-proof.json`. PR przechodzi wymagane qa przed publikacją; sam zapis nowego identyfikatora nie jest potwierdzeniem wdrożenia.

Warunki dla Polski, DPA i aktywację filtra QA zaakceptowano za wyraźną zgodą Damiana. Kontakt podstawowy DPA to klient, bez fikcyjnego IOD/przedstawiciela EOG. Warszawa/PLN, retencja użytkowników i zdarzeń po 2 miesiące, reset aktywności OFF. Cztery dodatkowe opcje udostępniania, Signals, UPD, granular location/device i personalizacja reklam (0/307 regionów) OFF. Enhanced Measurement OFF; redakcja e-mail i 15 kluczy URL włączona.

Tag **GTM-K74JRKZ2, wersja 2**, opublikowany przez Oliwię: sześć kategorii automatycznych zdarzeń i UPD wyłączone. Publiczna odpowiedź Google potwierdza ustawienia. Cookie override 2 miesiące od pierwszej wizyty, a globalne ustawienia strony egzekwują dokładnie **5184000 s / 60 dni**, Secure i SameSite=Lax. Globalny `gtag('set', ...)` poprzedza zgodę/js/bibliotekę, co zapobiega automatycznemu page_view i surowym URL inicjowanym przez nowy ujednolicony tag. Cofnięcie commita nie cofa konfiguracji dostawcy Google.

Odbiór nowego strumienia na artefakcie z prawdziwą biblioteką i kolektorem Google przeszedł: brak wyboru i odmowa = zero Google; zgoda = jeden page_view; pięć zdarzeń kontaktu pojedynczo; brak wartości pól, testowego e-maila i jego SHA256; URL bez query/hash, referrer tylko origin. Cookies do 60 dni, identyfikator bez przedłużania; cofnięcie w dwóch kartach zatrzymuje pomiar, usuwa cookies i zachowuje formularz. Zero naruszeń CSP. Turnstile i backend w tej konkretnej przeglądarce QA są atrapami: **zero nowych maili**. Wcześniejszy realny odbiór formularza i obecne testy SMTP opisano osobno. Odbiór po publikacji ma osobny dowód.

`form_submit_success`: kluczowe zdarzenie raz na zdarzenie, bez domyślnej wartości pieniężnej, po odpowiedzi backendu. Filtr **VERTIQ_debug_QA Active**, wyklucza przyszły debug_mode/debug_event. **DebugView nadal 0 urządzeń mimo prawidłowych debug/HTTP 204** — nie potwierdzono jeszcze przetworzenia danych ani wykluczenia w raportach. M08 pozostaje częściowe. [Plan pomiarowy](plan-pomiarowy.md).

## Google, Bing i widoczność AI

Obie domenowe właściwości Search Console zweryfikowano na **Oliwii**, zachowując trzy nowe rekordy weryfikacji Google/Bing. Sześć publicznych kontroli Google/Cloudflare DNS potwierdza poprawną treść i DNSSEC AD=true. Bez zmiany MX, NS i delegacji.

Klient ma delegowanego Właściciela `.pl` i `.com`; Oliwia pozostaje zweryfikowanym Właścicielem obu. Ograniczenie jej do pełnego użytkownika wymaga wcześniej niezależnej weryfikacji klienta: usunięcie jedynego skutecznego tokena agencji mogłoby unieważnić także jego dostęp delegowany. Bez logowania do Gmail klienta dodano role właściciela.

Google sitemap: **Success, 1 URL**. Root już zindeksowany; ostatni crawl 15.11 10:53:51 CET, Google-selected canonical = sprawdzany URL `.pl`. Live **13:01:24 CET**, Googlebot smartphone: pobranie poprawne, crawl/index dozwolone. Widoczny HTML head sprawdzony; zapisano tylko częściowy tekst, ponieważ eksport całego HTML przez schowek zwrócił pusty wynik. Nie deklarujemy pełnego eksportu Google body. Jedna prośba odświeżenia indeksu przyjęta; nie powtarzano jej. Ręczne działania i bezpieczeństwo: **Nie wykryto problemów**. Indeksacja/Crawl Stats: początkowo przetwarzanie lub brak danych; panel robots jeszcze bez raportu, choć plik publiczny i rzeczywiste pobranie potwierdzono.

Bing: Oliwia **Administrator**, root **Indexed**, sitemap **Success / 1 URL**, Live HTTP **200/indexable**, canonical `.pl`. Renderowany aktualny formularz i zaakceptowane zdjęcia. Pięć obrazów ma alt; jedyna sugestia SEO/GEO dotyczy prawidłowego pustego alt dekoracyjnej łodzi. Nie dodano sztucznego opisu dekoracji. Dodanie klienta jako Administratora odrzucone: **najpierw musi zarejestrować się w Bing Webmaster Tools swoim adresem**. To nie wymaga udostępniania Gmail agencji. H10 pozostaje częściowe.

GSC Generatywna AI w wyszukiwarce: **Uwzględnij dla obu domen**, dziedziczenie sprawdzone. Początkowe raporty Google/Bing AI nie mają danych. Nowe [preferencje Bing](https://www.bing.com/webmasters/help/new-ai-preferences-2t1cc16d) ogłoszono 30.10.2026, będą honorowane od **01.02.2027**, domyślnie training/grounding Allow. Tymczasowa opcja od 15.12 dotyczy witryn z noarchive/nocache; projekt ich nie używa. Nie wdrażano przyszłych ograniczeń ani fikcyjnego przełącznika.

Robots i Cloudflare pozwalają na publiczną treść i uzgodniony trening AI; API chronione osobno. Rzeczywiste inspekcje Google/Bing zastępują wcześniejszą niepewność dotyczącą tych dwóch botów. Kontrolowane UA OpenAI/Anthropic/Perplexity zwracają 200, lecz nie dowodzą wizyty z IP dostawcy lub cytowania. llms.txt nie gwarantuje cytowań. Zarządzany BIC Pages nadal odrzuca część domyślnych klientów bibliotek, np. Python-urllib; nie osłabiano WAF w ciemno.

## Poczta, DNS i zabezpieczenia

| Obszar | Potwierdzony wynik |
|---|---|
| Poczta | Świeża kopia tylko do odczytu **13:59 CET**: OVH **58**, home.pl **49**, po 7 folderów. Wszystkie **55 historycznych** i wszystkie aktualne źródłowe zachowane: raw body, daty, flagi, wielokrotność. Zero APPEND/DELETE. `mail-backup-proof.json`. |
| Testy dostarczenia | Wysłano dokładnie dwa zatwierdzone testy: OVH → VERTIQ i odpowiedź VERTIQ → OVH. Oba dotarły. Rzeczywiste nagłówki odbioru: **SPF pass, DKIM pass, DMARC pass**, zgodność domen. Zero dodatkowych niezamówionych wiadomości. `mail-roundtrip-proof.json`, `outbound-authentication-proof.json`. |
| Pojemność/reguły | Zimbra Starter READY, 15 GiB, bezpłatny slot związany z `.pl`. IMAP/SMTP z walidacją TLS. Bez aktywnych reguł przychodzących, forwardu i autorespondera; catch-all niepotwierdzony. |
| SPF/DMARC | Jeden SPF, 4 rekursywne termy DNS; home/OVH zachowane do potwierdzenia aplikacji klienta. `.pl` p=none z rua na skrzynkę Bartka. Zaostrzenie po analizie reprezentatywnych raportów, nie w ciemno. |
| DNSSEC/TLS | Obie domeny podpisane, DS rejestratora zgodne, dwa resolvery AD=true/bez SERVFAIL. TLS 1.2/1.3, cztery poprawne hosty; rzeczywiste HTTP/2 i HTTP/3, br, IPv6. Internet.nl 95%, świadomy wyjątek starszych szyfrów Pages opisany w procedurze. |
| WAF/formularz | Free Managed Ruleset na obu strefach. 429 po 11. pustym POST /api/contact, potwierdzony Ray w Security Events. BIC ON; brak globalnego challenge, bypassu po samym UA i płatnego planu. |
| Preview/produkcja | Preview bez SMTP_PASSWORD, rzeczywista odmowa not_configured; produkcyjne bindingi zachowane. Kontrola po publikacji: 16 przekierowań, 9 plików SHA256, API GET 405/no-store. |
| Stare URL | 23/23 prób: właściwe 301 dla dawnego page_id=2, usunięte treści 404/noindex. UTM/v nadal 200, bez ponownego przypisania domeny do home.pl. |

Abonent `.pl`, ponowny odczyt **14:02 CET**: zadanie SCHEDULED, stary kontakt ACCEPT, nowy Gmail nadal bez zgody; termin **24.11.2026, 15:56:18 CET**. Nie inicjowano nowego transferu, zamówienia ani kolejnego resend. `.com` nie otrzymał Null MX/reject, ponieważ jego użycie pocztowe wymaga potwierdzenia.

## Kod, wydajność, monitoring i odtwarzanie

Chroniony main wymaga PR i qa także dla administratora, aktualnej bazy i rozwiązanych dyskusji, bez force/delete. Akcje przypięte SHA, bez sekretów produkcyjnych i uploadu prywatnych artefaktów. [PR #4](https://github.com/Powers-P1/przyjaciel-odyseusza/pull/4) przeszedł **841 testów / 19 świadomie pominiętych**, 24 backendu/agregatora, npm audit 0, pięć profili przeglądarek. Kolejna podmiana ID musi przejść tę samą bramkę. Jedna ponowna próba Lighthouse dotyczy wyłącznie NO_NAVSTART, nie wolnego wyniku; brak obniżania progów.

Formularz: wartości pól poza URL, telefon/nazwisko opcjonalne, treść zachowana po błędzie, walidacja Turnstile przed SMTP, stałe From/To i kontrolowane Reply-To, brak open relay i niepewnego ponowienia DATA. Main JS SHA pozostaje `590bb96d815b0ac6234212d1d733d95215fcc152b762d2a77ef9d6c430bb7f4d`. Zaakceptowanych zdjęć/kadrów nie zmieniono. HSTS host-only bez preload/includeSubDomains. Widoczny wybór także w forced-colors, kontrast granicy pola 3,97:1, fokusu 7,21:1. Licencje OFL zachowane, podzbiór fontu przemianowany zgodnie z RFN; build normalizuje końce linii licencji.

Najnowszy rzeczywisty pomiar produkcji po dodaniu zgód: 3 przebiegi/profil, mediana **mobile 99 / LCP 1531 ms**, **desktop 100 / 390 ms**, oba CLS .002 i TBT 0. Kategorie funkcjonalne 100. To laboratorium z Polski przed zgodą, nie terenowy INP. Google po zgodzie dodatkowo około **166 kB skompresowanego transferu na kartę**, brak long tasks w lokalnej próbie bez throttlingu. CrUX niepotwierdzony, publiczny PSI miał 429. Budżet własny ≤300 KiB/10 żądań, Performance ≥90, LCP ≤2500 ms, CLS ≤.1, TBT ≤200 ms.

Działają bezpłatne Actions: **22 kontrole WWW około co 30 min**, **12 kontroli RDAP/NS/SPF/DKIM codziennie 06:17 UTC**. Certyfikat alarm <14 dni, domena <45 dni; bez POST/maili/sekretów. Cron bez SLA i może wygasnąć po 60 dniach bez aktywności repo. Odbiór alarmów nadal do potwierdzenia.

Oba tokeny HELA zawężono, sprawdzono i stare szerokie unieważniono. **Cloudflare wygasa 15.12 06:22 CET, OVH 15.12 10:41 CET**. OVH: działające IAM Oliwii, 22 ograniczone reguły; brak zakupów/usuwania poczty. Innych komputerów nie zmieniano. A10/A11 pozostają częściowe z uwagi na pełny audyt dostępu. Rewizja techniczna **11.12.2026**.

Prywatny pakiet `.porecovery` AES-256-GCM zawiera Git bundle, zaakceptowane zdjęcia/artefakt, DNS/reguły, surową pocztę i starą bazę WordPressa. Wersja i liczba plików wynikają z aktualnego manifestu, nie ze stałej liczby. `portable-recovery-proof.json` i `portable-rebuild-proof.json` wskazują ostatni faktycznie zapakowany commit oraz niezależny test odszyfrowania/odbudowy. Finalny pakiet należy odświeżyć po publikacji, ze świeżą kopią 58 wiadomości i poprawnymi ustawieniami Google. Klucz nadal DPAPI; **N08 pozostaje otwarte do odbioru klucza i pakietu poza komputerem**. To nie jest harmonogram backupu ani uzgodnione RPO/RTO.

## Pozostało do faktycznego odbioru

1. **Klient:** zgoda nowego abonenta `.pl`; MFA OVH i skrzynki odzyskiwania, własne kody awaryjne; skoordynowana wymiana ujawnionych haseł z aplikacjami/SMTP; pierwsza rejestracja Bing. Bez proszenia agencji o dostęp do Gmail Bartka.
2. **Przekazanie:** niezależna weryfikacja GSC przed ograniczeniem Oliwii, sprawdzenie logowania klienta do GA4; finansowanie odnowień, odbiorca alarmów, niezależny klucz kopii, retencja i RPO/RTO. Nie odbierać ostatniego działającego dostępu przed zakończeniem odbioru.
3. **Informacje/obserwacja:** legalni nadawcy i użycie poczty `.com`, catch-all, minimum 14 reprezentatywnych dni DMARC, raporty GA4/DebugView, GSC/Bing/AI/CWV. Brak danych nie dowodzi sukcesu ani awarii. Ręczny odbiór czytnika/telefonu, profili społecznych i zakres prawny nie są zastąpione przez Axe/Lighthouse.

**Nowe opłaty: 0 zł.** Cloudflare Free bez zmian. Domeny ważne `.pl` 03.07.2027, `.com` 03.07.2028. Cennik odnowień z 15.11: 72,56 / 76,86 zł brutto rocznie; przyszła faktura zależy od cennika. Dotychczasowe automaty/metody płatności bez zmian; nie kupiono ACM ani innych dodatków.

Dowody poza publicznym Git: `outputs/configuration-2026-11-15`. [Procedury utrzymania](UTRZYMANIE_I_ODTWARZANIE.md). Testowa odszyfrowana kopia pozostaje w prywatnym katalogu, ponieważ automatyczna kontrola zablokowała jej rekurencyjne usunięcie. Niczego nie usuwano w skrzynkach.
