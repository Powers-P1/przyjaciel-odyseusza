# Wykonanie P0 i P1 — 15 listopada 2026

Checkpoint uzupełnienia 15.11: **P0 23/32, P1 144/172**. **0 zł nowych opłat, bez utraty poczty.** [Pełna checklista](CHECKLISTA_TECHNICZNA_2026-11-15.md). Otwarte punkty zachowują rzeczywiste zależności; przygotowanie części technicznej nie oznacza zakończenia przekazania klientowi.

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

## Dokończone w uzupełnieniu

- Audyt 25 rekordów DNS: wszystkie przypisane do konkretnych usług, stare zależności home zachowane do decyzji.
- Codzienny backup obu skrzynek 08:47 i monitor limitów/błędów 09:17 na HELI. Zadania mają RunLevel Limited, nie zapisują nowego hasła Windows, nie wysyłają maili i nie używają LLM. StartWhenAvailable, wymagany zalogowany właściciel. Termin końcowy 11.12.2026; utrzymanie po odbiorze wymaga wskazania operatora. Samego komputera nie traktujemy jako kopii poza siedzibą.
- Dzienny odczyt agregatów DMARC z szyfrowanego snapshotu, bez zmiany DNS i bez purge. Początkowo 0 raportów. Zliczenia nie zastępują oceny, czy źródło jest legalne; brak raportów nie jest wynikiem pass.
- W tym uzupełnieniu dodano własny RUM LCP/INP/CLS do istniejącego GA4. Obserwatory dopiero po zgodzie; stare odmowy zachowane, stare zgody wymagają odnowienia po rozszerzeniu celu. Bez DOM, atrybucji, metric.id, pól i nowych odbiorców. Standardowa biblioteka Google web-vitals 6.2.3, licencja Apache dołączona. Wycofanie tłumi oczekujące próbki i nie odtwarza ich po ponownej zgodzie w tej samej stronie. Dane są próbką wizyt ze zgodą; średnia nie stanowi p75/CrUX. Artefakt z prawdziwym Google otrzymał poprawne LCP/INP/CLS; odbiór publikacji ma osobny aktualny dowód. Nie zmieniono backendu ani sekretów SMTP.


## Otwarte P0 i P1 — kto i co robi dalej

Każdy otwarty punkt ma poniżej odpowiedzialnego, konkretną akcję i warunek zamknięcia. Czynności agencji po odpowiedzi człowieka nie wymagają przekazania jej hasła Gmail.

| Punkt | Kto | Konkretna akcja | Kiedy uznamy za zakończone |
|---|---|---|---|
| **A01 P0** | Bartek | Potwierdzić zmianę abonenta .pl w mailu OVH na swoim Gmailu do 24.11, 15:56:18 CET; po przekazaniu sprawdzić własne logowanie do kont. | Agencja odczytuje zakończone DomainTrade i dane BFP; nie inicjuje nowego transferu. |
| **A03 P0** | Bartek | Potwierdzić dostęp do wskazanego Gmaila i poprawność kontaktów/odzyskiwania OVH oraz Cloudflare. | Właściciel potwierdza odbiór i kontrolę nad metodami odzyskania. |
| **A04 P0** | Bartek | Włączyć lub potwierdzić MFA własnego Gmaila, który odzyskuje infrastrukturę. | Własna niezależna metoda awaryjna i ponowne logowanie; agencja nie otrzymuje hasła Gmail. |
| **A06 P0** | Bartek | Włączyć MFA konta OVH i sprawdzić ponowne logowanie. Cloudflare MFA jest już włączone. | Potwierdzony dostęp właściciela po aktywacji. |
| **A07 P0** | Damian + Bartek | Ustalić wspólny termin wymiany haseł tymczasowych/ujawnionych. Bartek zmienia własne hasła, agencja aktualizuje SMTP formularza, Bartek aplikacje poczty. | Odbiór i wysyłka oraz formularz sprawdzone po skoordynowanej zmianie; stare hasło odwołane. |
| **A08 P0** | Bartek | Zapisać własne kody odzyskiwania poza telefonem i bieżącym komputerem, w kontrolowanym magazynie. | Właściciel potwierdza niezależną kopię; kody nie trafiają do chatu, publicznego Git ani agencji. |
| **A10 P1** | Damian | Udostępnić kontrolowany dostęp do drugiego komputera WAW albo zrotować tam pozostały szeroki klucz. Klucze HELA są już zawężone i stare unieważnione. | Nowy ograniczony klucz działa na właściwym komputerze, dopiero potem wycofany stary; brak zmian w ciemno. |
| **A11 P1** | Damian + Bartek | Damian przegląda sesje/OAuth własnego konta Oliwii i GitHub; Bartek własne Gmail/OVH/Cloudflare. Wskazać nieznane lub zbędne sesje. | Odwołane wyłącznie rozpoznane zbędne dostępy; inne projekty i aktywny WAW zachowane. |
| **A12 P1** | Damian | Wskazać operatora po odbiorze i zastępstwo, kanał alarmów poza domeną klienta oraz potwierdzić odbiór próbnego alarmu GitHub. | Odbiorca faktycznie otrzymuje alarm i wie, kto wykonuje rollback/odzyskanie. |
| **A13 P0** | Damian + Bartek | Damian przedstawia terminy i koszty: .pl 03.07.2027 / 72,56 zł, .com 03.07.2028 / 76,86 zł brutto rocznie według cennika 15.11; Bartek potwierdza finansowanie i sposób przypomnienia. | Akceptacja konkretnych odnowień przed płatnością. Zimbra Starter obecnie bezpłatna przy domenie; bez aktywowania nowego autopay. |
| **A14 P1** | Damian + Bartek | Przekazać instrukcję i listę dostępów, zebrać potwierdzenie logowań; po niezależnej weryfikacji klienta ograniczyć role agencji. | Oliwia zachowuje Administratora do sprawdzonego przekazania; nigdy nie usuwamy ostatniego działającego dostępu. |
| **B09 P1** | Bartek | Potwierdzić jednym zdaniem, czy .com służył lub ma służyć poczcie/aliasom, a jeśli tak podać adresy. | Znany zakres poczty .com; przekierowanie WWW nie oznacza przekierowania maila. |
| **B18 P1** | Bartek, potem agencja | Po potwierdzeniu braku poczty .com agencja wdraża Null MX, SPF -all i odpowiedni DMARC. | Odmowa poczty nie dotyka legalnego adresu ani aliasu. |
| **F03 P1** | Bartek | Podać używane programy/telefony oraz Gmail Send-as, CRM, newslettery i inne źródła wysyłki. Znane źródła: OVH i formularz; home pozostaje do wyjaśnienia. | Kompletny spis legalnych nadawców przed usuwaniem starego SPF. |
| **F07 P1** | Czas + dane Bartka | Zebrać co najmniej 14 reprezentatywnych dni raportów DMARC i potwierdzić wszystkie legalne źródła; pierwszy przegląd zaostrzenia najwcześniej 29.11. | Brak niewyjaśnionych błędów legalnych wiadomości; wtedy agencja wdraża stopniowo quarantine/reject z rollbackiem. |
| **F10 P1** | Bartek, potem agencja | Wysłać techniczny mail do Damiana z faktycznie używanego webmaila i każdej aplikacji, po potwierdzeniu ich ustawień. SMTP OVH już ma zewnętrzny SPF/DKIM/DMARC pass. | Agencja sprawdza rzeczywiste nagłówki każdego używanego sposobu wysyłki. |
| **F12 P0** | Bartek | Potwierdzić profile urządzeń: IMAP imap.mail.ovh.net:993 TLS; SMTP smtp.mail.ovh.net:465 TLS lub 587 z wymaganym STARTTLS; login pełny adres. | Brak profilu starego home/plaintext i brak akceptowania błędnych certyfikatów. Formularz ma już TLS i walidację. |
| **F16 P1** | Dane Bartka + obserwacja | Po F03/F07 potwierdzić brak zależności od home, a następnie usunąć zbędną autoryzację/stare usługi tylko w uzgodnionym zakresie. | Zachowane historyczne maile i potrzebne klucze; inne usługi home pozostają poza zmianą. |
| **G02 P1** | Czas + rzeczywisty ruch | Zebrać dostateczną próbę CWV oddzielnie mobile/desktop; sprawdzić p75 w CrUX/GSC, gdy dane będą dostępne. | Mały ruch może nie udostępnić CrUX. Średnia RUM i TBT nie są terenowym INP ani p75. |
| **G20 P1** | Czas + rzeczywisty ruch | Po publikacji RUM obserwować techniczne LCP/INP/CLS z wizyt ze zgodą; porównać trend po 2–4 tygodniach. | Udokumentowana próba i ograniczenia doboru; nie uznajemy kilku sesji QA za dane użytkowników. |
| **H10 P1** | Bartek, potem agencja | Zalogować/zarejestrować własne konto Bing Webmaster Tools adresem wskazanym do kont klienta. | Po pierwszej rejestracji agencja dodaje Administratora. Weryfikacja domeny, sitemap i inspekcja już działają na Oliwii. |
| **I08 P1** | Damian + Bartek | Damian loguje istniejące konto w otwartym LinkedIn Post Inspector; agencja wykonuje odczyt. Na telefonie wkleić URL do niewysłanego szkicu komunikatora i sprawdzić kartę. | Prawidłowa karta z tytułem/opisem/obrazem; test nie wymaga publikacji posta ani wiadomości klientowi. |
| **I11 P1** | Bartek | Podać autentyczne adresy profili firmowych i potwierdzić nazwę, telefon oraz domenę w ich opisach. | Agencja dodaje sameAs wyłącznie do potwierdzonych profili; Bartek aktualizuje profile, do których ma własny dostęp. |
| **J09 P1** | Czas + widoczność w wyszukiwarce | Sprawdzić raporty Google/Bing AI po pojawieniu się wyświetleń; pierwszy przegląd zwykłych raportów 16–17.11. | Brak raportu AI przy małym ruchu nie dowodzi błędu. Włączenie AI obu domen jest już potwierdzone. |
| **K15 P1** | Damian | Wykonać rzeczywistą sesję NVDA/VoiceOver: menu, etykiety pól, wybór odbiorcy, błędy pustego formularza i dialog zgód. | Zapisany ręczny odbiór; test pustego formularza nie wysyła maila. AX/Axe nie zastępuje czytnika. |
| **K16 P1** | Bartek lub Damian na fizycznym telefonie | Sprawdzić menu i kontakt w pionie/poziomie, klawiatury pól, błędy, politykę oraz tel/mailto bez wysyłania. | Fizyczne urządzenie i wersja przeglądarki zapisane. Pięć profili silników ma już testy automatyczne. |
| **L05 P1** | Damian + Bartek | Potwierdzić odrębną umowę powierzenia agencji i używane narzędzia/podwykonawców. W sprawdzonym 14-stronicowym pliku głównym nie znaleziono takiej klauzuli. DPA dostawców zinwentaryzowane. | Wskazany właściwy dokument i zatwierdzone role/przetwarzanie; nie zastępujemy braku dokumentu ogólną wzmianką o RODO. |
| **L06 P1** | Damian + Bartek | Zatwierdzić propozycję: nowe niesfinalizowane zapytania 12 miesięcy; backupy 7 dziennych + 4 tygodniowe; umowy/podatki osobno. Historycznych maili nie usuwać automatycznie. | Zgoda administratora na retencję, dostęp i realizację żądań. GA4 2 miesiące już ustawione; codzienny backup obecnie bez purge. |
| **L09 P1** | Bartek, potem Damian | Potwierdzić status mikroprzedsiębiorcy i czy usługi są oferowane/zawierane online z konsumentami. | Na podstawie faktów i źródeł rządowych ustalić zakres PAD/EAA. Sam NIP ani brak koszyka nie przesądza kwalifikacji. |
| **L12 P1** | Damian + Bartek | Zatwierdzić przygotowaną procedurę incydentu i kontakty eskalacyjne. Agencja zabezpiecza dowody i informuje właściciela; właściciel ocenia obowiązki prawne. | Właściwy kontakt i odpowiedzialność przyjęte; zgłoszenia do organu nie są automatycznie wysyłane przez agenta. |
| **M08 P1** | Agencja po napływie danych | Kontrola ponownie 16–17.11 oraz po rzeczywistych wizytach ze zgodą. Filtr QA Active i transport/znaczniki zweryfikowane, ale DebugView/raportów nadal nie potwierdzono. | Potwierdzony odbiór i wykluczenie w raportach. Jeśli brak się utrzyma, dalsza diagnostyka agencji; Bartek nie udostępnia Gmail. |
| **N08 P1** | Damian + Bartek | Damian wskazuje bezpieczne miejsce poza HELĄ i osobny magazyn klucza; agencja kopiuje zaszyfrowaną paczkę, Bartek odbiera materiał odzyskania. | Realna kopia i klucz poza profilem Windows; nie publikujemy ich w GitHub ani w jednym mailu. |
| **N09 P0** | Damian + Bartek | Zatwierdzić cel RPO 24 h i proponowany RTO 1 dzień roboczy po odzyskaniu dostępu, wraz z ograniczeniem lokalnej HELI lub wybrać inny wariant. | Techniczne odtworzenie już sprawdzone, ale nie stanowi uzgodnionego SLA ani gwarancji odzyskania kont. |
| **N11 P1** | Damian | Wybrać i potwierdzić zewnętrzny kanał alarmowy oraz zastępstwo, jak w A12. | Powiadomienie trafia poza domenę klienta; instrukcje awarii i rollbacku są zapisane. |
| **N12 P1** | Damian + Bartek | Zatwierdzić protokół techniczny z listą usług, dostępów, kosztów i otwartych wyjątków oraz zebrać końcowy odbiór klienta. | Dokument przyjęty przez właściciela; przygotowany protokół nie jest podpisanym odbiorem. |
| **O07 P1** | Damian | Potwierdzić kto wykonuje miesięczny przegląd dostępów, aktualizacji i usług po przekazaniu oraz kiedy kończy się opieka agencji. | Jest wskazany operator i zakres; harmonogram runbooka nie tworzy sam z siebie bezpłatnej stałej obsługi. |
| **O08 P1** | Damian | Potwierdzić kwartalne odtwarzanie i przegląd kluczy/tokenów; najbliższa rewizja 11.12 przed wygaśnięciem 15.12. | Operator przyjmuje rutynę i posiada klucz. Pierwszy pełny test pakietu wykonano już teraz. |

## Gotowe propozycje do zatwierdzenia

1. Operator do końca prac: agencja; po odbiorze Bartek albo osobno uzgodniona obsługa. Wyznaczyć osobę zastępującą i potwierdzić alarm poza domeną klienta. Miesięczny przegląd usług i dostępów, kwartalny test odtworzenia, rewizja 11.12 przed wygaśnięciem tokenów 15.12.
2. Cel kopii: RPO 24 h dla poczty, kod/DNS po każdej zmianie; docelowa retencja 7 dziennych i 4 tygodniowe. RTO do uzgodnienia: 1 dzień roboczy po uzyskaniu dostępu. Lokalna HELA wymaga działania i logowania; docelową niezależną kopię/key odbiera właściciel. To propozycja, nie automatycznie zawarte SLA.
3. Retencja: nowe niesfinalizowane zapytania 12 miesięcy od końca korespondencji; dokumenty umowne i podatkowe według ich właściwego celu/terminu. Historyczne maile migracji zachowane. Zmiana retencji nie uruchamia automatycznego usuwania skrzynek lub dotychczasowych archiwów.
4. Incydent: zapisać czas wykrycia/zakres/Ray ID bez treści formularza; zabezpieczyć kopię; odizolować konkretną przyczynę i sprawdzić rollback; poinformować administratora danych bez zbędnej zwłoki. Administrator ocenia ryzyko i obowiązek zgłoszenia do organu w terminie wynikającym z art. 33 RODO oraz ewentualnego powiadomienia osób z art. 34. Agent nie wysyła samodzielnie zawiadomień. Kontakt i zastępstwo należy przyjąć przy odbiorze. [RODO, art. 28/33/34](https://eur-lex.europa.eu/eli/reg/2016/679/oj/).
5. Kwalifikacja PAD: potrzebne potwierdzenie statusu mikroprzedsiębiorcy oraz sposobu oferowania/zawierania umów z konsumentami online. [Wytyczne MC](https://www.gov.pl/web/dostepnosc-cyfrowa/polski-akt-o-dostepnosci--uslugi-handlu-elektronicznego). Nie wnioskujemy o obowiązku ani zwolnieniu z samego wyglądu strony.

Ręczny test czytnika: skip-link i nagłówki, menu Tab/Enter/Escape, etykiety i wybór odbiorcy, walidacja pustego formularza, dialog zgód i powrót fokusu. Ręczny test telefonu: pion/poziom, menu, dojście do kontaktu, klawiatury pól, błędy oraz tel/mailto bez wykonywania połączenia i wysyłki. Kartę komunikatora sprawdzić w niewysłanym szkicu.

Raporty: pierwszy ponowny przegląd Google 16–17.11; RUM/CWV po 2–4 tygodniach i dostatecznej próbie. Przy małym ruchu CrUX lub raport AI mogą nadal nie być dostępne. DMARC: pierwsza ocena zaostrzenia najwcześniej 29.11, po reprezentatywnych raportach oraz potwierdzeniu nadawców.
