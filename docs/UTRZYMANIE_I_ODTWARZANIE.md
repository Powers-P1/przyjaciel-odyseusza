# Utrzymanie i odtwarzanie

Stan 15.11.2026. Produkcja: Cloudflare Pages Free, `https://przyjacielodyseusza.pl/`; .com/www przekierowują na .pl. DNS Cloudflare, rejestrator i poczta OVH. GitHub jest źródłem i demonstratorem noindex. **Bez nowych kosztów, usuwania poczty i automatycznych wysyłek.**

## Odpowiedzialność i rutyna

Docelowy właściciel kont/danych: klient. Operator wdrożenia: VERTIQ. Odbiorca alarmów, zastępstwo i dalsza obsługa wymagają potwierdzenia przy przekazaniu; konfiguracja nie oznacza stałej dyspozycyjności wykonawcy.

| Częstotliwość / wyzwalacz | Kontrola |
|---|---|
| Około 30 min | monitoring.yml: WWW, przekierowania, API GET/no-store, certyfikaty, robots/sitemap/llms, DNSSEC/MX/DMARC; dwie próby, bez maila. |
| Codziennie 06:17 UTC | domain-monitor.mjs: terminy rejestrów RDAP i NS/SPF/DKIM przez dwa resolvery. Alarm domeny <45 dni; certyfikaty w kontroli WWW <14 dni. Brak odnowień/płatności. Po świadomej zmianie DNS zaktualizować config/dns-monitor.json w PR. |
| Pierwsze 14 dni DMARC | Przegląd agregatów codziennie roboczo, potem tygodniowo i po zmianie nadawcy. Brak raportu nie dowodzi braku problemu. Harmonogram obsługi do uzgodnienia. |
| Co miesiąc | Odbiór powiadomień GitHub, aktywność cron (może wygasnąć po 60 dniach bezczynności), dostęp/role, Workers i pojemność poczty, odnowienia, zależności, Google/Bing/CWV. |
| Co kwartał i po istotnej zmianie | Odtworzenie preview, daty tokenów, klucze odzyskania, privacy/security.txt, eksport DNS/reguł. |
| Po publikacji | Commit, domena, SHA JS, 200/404, kontakt/nagłówki i adekwatna regresja; bez testowej wysyłki do klienta bez osobnego polecenia. |
| Po incydencie | Data, Ray ID, objaw bez pól/sekretów; zabezpieczenie kopii, zatrzymanie wadliwej zmiany, kontakt z właścicielem. Obowiązki prawne ocenia właściwa osoba dla konkretnego zdarzenia. |

Monitor korzysta wyłącznie ze standardowych runnerów publicznego GitHub; bez płatnego magazynu artefaktów i usług alarmowych. Powiadomienia o nieudanych Actions wymagają włączenia i odbioru przez operatora. Cron nie zapewnia dokładnego czasu ani SLA. Następna rewizja techniczna **11.12.2026**, przed wygaśnięciem tokenów HELA **15.12: Cloudflare 06:22, OVH 10:41 CET**. Oba zawężone zamienniki sprawdzono i stare szerokie klucze HELA unieważniono; dostępów innych komputerów nie zmieniano. Zapis daty nie tworzy automatycznego zlecenia ani umowy stałej obsługi.

## Publikacja i rollback WWW

1. `npm ci`, build produkcyjny, walidacja, backend, adekwatny Playwright i audit. Przejrzany PR przechodzi CI bez sekretów produkcyjnych. Kontrola szczególnie formularza/CSP/analytics/config/lockfile/workflow; B/C nie wracają do paczki.
2. Wczytać lokalne szyfrowane poświadczenie właściwego klienta w tym samym procesie. `npm run deploy` sprawdza konto i buduje dist-cf. Sekretu nie wypisywać i nie umieszczać w GitHub.
3. Zapisać commit/deployment ID i poprzednią poprawną produkcję; porównać rzeczywisty JS z artefaktem. Produkcyjne bindingi SMTP i Turnstile zachować, preview bez SMTP_PASSWORD.
4. Przy awarii ustalić warstwę: kod, DNS, SMTP lub certyfikat. Wybrać poprzednie **sprawdzone produkcyjne** wdrożenie z prywatnego protokołu. W Pages użyć rollback lub odbudować odpowiadający commit w osobnym checkout. Nie cofać do demonstracyjnych opinii i nie kopiować sekretów z logów.
5. Przed przywróceniem sprawdzić zgodność nazw bindingów i hosta Turnstile. Potem canonical 200, API GET 405/no-store, kontakt, rzeczywisty 404 i właściwy SHA. `node tools/monitor.mjs` nie wysyła wiadomości. Rollback kodu nie odtwarza DNS ani poczty.
6. Jeżeli winna jest nowa reguła WAF, wycofać tylko ją/nowy entrypoint według zapisanego dowodu; nie wyłączać całej ochrony/TLS/MFA. Diagnozę 403/429 łączyć z Ray ID i Security Events.

Reguły starych URL: page_id=2 ma 301 do odpowiadającej strony głównej; usunięte wersje/kategorie/portfolio zwracają rzeczywiste 404 przez URL Rewrite Rule, bez uruchamiania Functions dla całego WWW. Nie kierować wszystkich dawnych treści na homepage. Przy rollbacku usuwać tylko nowe rule ID z legacy-routing-created.json, zachowując pierwotny canonical redirect. Obecny token CLI nie edytuje Transform Rules — użyć uwierzytelnionego panelu właściwej strefy; nie poszerzać tokena do całego konta jako obejścia błędu uprawnień.

Pusty ga4MeasurementId utrzymuje analitykę wyłączoną. Warunki uruchomienia i własności: [plan pomiarowy](plan-pomiarowy.md). Nie używać strumienia innego klienta/agencji.

Przy odtwarzaniu GA4 zachować również ustawienia dostawcy: klient Administrator, agencja Edytor, retencja 2 miesiące bez resetu, funkcje reklamowe/UPD/automatyczne zdarzenia wyłączone i aktywny filtr QA. Bieżący tag Google to GTM-W7ZDCLPJ, wersja 2. Cofnięcie commita strony nie cofa wersji kontenera Google. Po zmianie sprawdzić rzeczywistą bibliotekę, cookies i żądania w czterech stanach zgody; testy formularza z atrapą backendu nie wysyłają maili.

## DNS i DNSSEC

Rekordy edytować w aktywnym Cloudflare. Przed zmianą eksport ID/typów/TTL/prio i reguł. Po zmianie dwa niezależne resolvery, NS, WWW i cztery MX OVH. Rekordy poczty/DKIM DNS-only. Nie importować starej strefy jako uniwersalnej naprawy.

**Nigdy nie wyłączać podpisywania Cloudflare przy nadal obecnym DS rodzica.** Najpierw poprawić DS albo usunąć go kontrolowanie w OVH dla zewnętrznych NS (aktualne API: POST /domain/{domain}/dsRecord, keys: []). Zachować podpisywanie do potwierdzenia usunięcia u rodzica i wygaśnięcia poprzedniego TTL — dla .pl zmierzono do 86400 s. Potwierdzić brak SERVFAIL z dwóch resolverów. Dopiero potem rozważyć wyłączenie podpisywania. Snapshot i zadania przed/po znajdują się w prywatnych dowodach.

Nie przypisywać ponownie domeny do home.pl dla dostępu do starej skrzynki; używać serwera technicznego. Zachować stary SPF/DKIM/wildcard do potwierdzenia zależności. Null MX/reject .com dopiero po potwierdzeniu braku legalnej poczty.

## Poczta i kopie

- OVH IMAP 993/TLS i SMTP 465/TLS z walidacją certyfikatów. MFA panelu nie zastępuje ochrony IMAP/SMTP. Rotację uzgodnić z aplikacjami klienta i sekretem formularza.
- Kopia zachowuje raw body, foldery, daty i flagi; odczyt EXAMINE/BODY.PEEK. Nie propagować usunięć i nie traktować lustrzanej skrzynki jako backupu.
- Odtworzenie do prawdziwej skrzynki wymaga kontrolowanego zakresu i deduplikacji. Lokalny test odtworzenia archiwum można wykonać bez APPEND/DELETE i bez dotykania poczty klienta.
- DPAPI wymaga obecnego profilu Windows. Pełne odzyskiwanie po utracie komputera wymaga niezależnego szyfrowanego pakietu i klucza przechowywanego przez właściciela. Kopia samego pliku dpapi na innym dysku tego nie zapewnia.
- Pakiet .porecovery: AES-256-GCM; narzędzie Restore-PortableRecovery.ps1 (PowerShell 7+) jest obok pakietu w prywatnym katalogu. Format: magic POREC001 (8 B), nonce (12 B), tag (16 B), ciphertext ZIP; magic jest AAD. Klucz 32 B w base64 przekazać osobno do bezpiecznego magazynu właściciela. Nie wpisywać go do argumentów komendy, Git, maila razem z pakietem ani publicznych logów. Odtwarzanie pyta o klucz bez wyświetlania, sprawdza wszystkie hashe/ścieżki przed zapisaniem i wymaga nowego pustego miejsca. Nie wykonuje sieci ani zapisów do IMAP.
- Weryfikacja paczki obejmuje niezależne .NET/Node, odszyfrowanie i lokalne odtworzenie plików; nie oznacza jeszcze odzyskania kont lub uzgodnienia RTO. Klucz jest obecnie w DPAPI, więc przekazanie poza komputer pozostaje niezamknięte. Testowa kopia pozostała w prywatnym katalogu, ponieważ automatyczny przegląd zablokował rekurencyjne usunięcie.
- Propozycja do odbioru: RPO poczty 24 h, kod/DNS po zmianie; 7 kopii dziennych + 4 tygodniowe i kwartalny test. **To nie jest uruchomiony harmonogram ani uzgodnione SLA.** RTO ustalić po realnym teście i uwzględnić odzyskanie dostępu/dostawcę.

Alarmy/odzyskiwanie muszą mieć ścieżkę poza domeną klienta: konto GitHub operatora, jego skrzynka w odrębnej domenie i kontakt odzyskiwania właściciela. Konkretne prywatne adresy są w protokole przekazania poza Git, odbiór alarmów wymaga potwierdzenia. Przy awarii sprawdzić niezależne [Cloudflare Status](https://www.cloudflarestatus.com/), [OVHcloud Status](https://www.status-ovhcloud.com/) i [GitHub Status](https://www.githubstatus.com/); nie zmieniać NS/MX tylko na podstawie niedostępności panelu.

## DMARC i odnowienia

Przed zaostrzeniem DMARC: spis legalnych nadawców, test zewnętrzny/odpowiedź i alignment webmaila/aplikacji/formularza. Co najmniej 14 dni reprezentatywnych raportów bez niewyjaśnionych legalnych błędów; mały ruch może wymagać dłuższego okresu. Ostrożnie quarantine, następnie po kontroli reject. Bez wycofanego pct. Przy błędzie wrócić do poprzedniej polityki, zachowując rua i dowody. Nie usuwać starego nadawcy w ciemno.

Ważność domen: .pl 03.07.2027, .com 03.07.2028; standardowe odnowienia według cennika 15.11: 72,56 i 76,86 zł brutto/rok. Przyszła faktura zależy od cennika. Poczta promocyjna wymaga zachowania powiązania z domeną. Nie zmieniono wcześniejszych automatów odnowień i nie dodano metody płatniczej. Finansowanie, alarmy i niezależny klucz kopii przekazać właścicielowi.

Dowody i otwarte zależności: [protokół wykonania](WYKONANIE_P0_P1_2026-11-15.md).

## Budżet wydajności i Free

Pierwszy widok: własne zasoby ≤300 KiB i ≤10 żądań, Performance ≥90, LCP ≤2500 ms, CLS ≤0.1, TBT ≤200 ms. Pomiar mobile po głównych optymalizacjach: 218104 B/8 żądań (HTML 16734 B, zdjęcia 99119 B, JS 4560 B, fonty 97691 B). Turnstile dopiero przy kontakcie, przyszłe GA4 dopiero po zgodzie; ich koszt liczyć osobno. TBT nie jest INP, mediany laboratoryjne nie zastępują terenowego p75.

Pages Functions i pozostałe Workers dzielą na Free limit **100000 wywołań/dobę**, reset o północy UTC; [statyczne żądania są bezpłatne i nielimitowane](https://developers.cloudflare.com/pages/functions/pricing/). `_routes.json` uruchamia Function wyłącznie dla /api/contact. Pomiar Pages 15.11: 37 wywołań/0 błędów od północy UTC; pusty osobny dataset Workers nie dowodzi zerowego użycia konta. Limit reguł odczytany w panelu: 10 Transform Rules, wykorzystana 1; Single Redirects .pl 2, .com 1; rate limit .pl 1; bez płatnych managed rules.

Przy wzroście ruchu najpierw odróżnić atak, błąd konfiguracji tras i legalne użycie. Zachować statyczny kontakt e-mail/telefon, ograniczyć nadużycie właściwej ścieżki, sprawdzić błędy/limity i odbiór poczty. Nie przełączać automatycznie na płatny plan ani nie usuwać walidacji/Turnstile. Każdy wydatek wymaga osobnej zgody.

Domyślne starsze szyfry TLS 1.2 w Pages pozostają świadomym wyjątkiem: własne cipher suites wymagają ACM, który nie obejmuje Pages. Bez płatnego zakupu i wymuszenia TLS 1.3 kosztem firmowych przeglądarek. Właściciel techniczny VERTIQ; przegląd 11.12.2026 wraz z kosztami, dostępami i tokenem.

Pages ma również niezależną zarządzaną warstwę BIC, której nie wyłącza przełącznik/skip we własnej strefie. [Dokumentacja ograniczenia](https://developers.cloudflare.com/pages/platform/known-issues/#browser-integrity-check-on-pages). Potwierdzono na domenie i pages.dev: domyślny Python-urllib dostaje 403/1010, opisowy UA monitora i OAI-SearchBot — 200. Własne automaty wysyłają opisowy UA. Nie gwarantować dostępu każdego nieznanego klienta ani osłabiać WAF w ciemno; przy udokumentowanej blokadzie legalnego klienta rozważyć osobno Workers Static Assets. Przyczyny błędu narzędzia zewnętrznego nie przypisywać BIC bez kodu odpowiedzi i dowodów. Minimalny TLS, szyfry i Early Hints Pages również są zarządzane niezależnie od części ustawień strefy.
