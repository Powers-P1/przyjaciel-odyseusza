# Utrzymanie i odtwarzanie

Stan 15.11.2026. Produkcja: Cloudflare Pages Free, `https://przyjacielodyseusza.pl/`; .com/www przekierowują na .pl. DNS Cloudflare, rejestrator i poczta OVH. GitHub jest źródłem i demonstratorem noindex. **Bez nowych kosztów, usuwania poczty i automatycznych wysyłek.**

## Odpowiedzialność i rutyna

Docelowy właściciel kont/danych: klient. Operator wdrożenia: VERTIQ. Odbiorca alarmów, zastępstwo i dalsza obsługa wymagają potwierdzenia przy przekazaniu; konfiguracja nie oznacza stałej dyspozycyjności wykonawcy.

| Częstotliwość / wyzwalacz | Kontrola |
|---|---|
| Około 30 min | monitoring.yml: WWW, przekierowania, API GET/no-store, certyfikaty, robots/sitemap/llms, DNSSEC/MX/DMARC; dwie próby, bez maila. |
| Pierwsze 14 dni DMARC | Przegląd agregatów codziennie roboczo, potem tygodniowo i po zmianie nadawcy. Brak raportu nie dowodzi braku problemu. Harmonogram obsługi do uzgodnienia. |
| Co miesiąc | Odbiór powiadomień GitHub, aktywność cron (może wygasnąć po 60 dniach bezczynności), dostęp/role, Workers i pojemność poczty, odnowienia, zależności, Google/Bing/CWV. |
| Co kwartał i po istotnej zmianie | Odtworzenie preview, daty tokenów, klucze odzyskania, privacy/security.txt, eksport DNS/reguł. |
| Po publikacji | Commit, domena, SHA JS, 200/404, kontakt/nagłówki i adekwatna regresja; bez testowej wysyłki do klienta bez osobnego polecenia. |
| Po incydencie | Data, Ray ID, objaw bez pól/sekretów; zabezpieczenie kopii, zatrzymanie wadliwej zmiany, kontakt z właścicielem. Obowiązki prawne ocenia właściwa osoba dla konkretnego zdarzenia. |

Monitor korzysta wyłącznie ze standardowych runnerów publicznego GitHub; bez płatnego magazynu artefaktów i usług alarmowych. Powiadomienia o nieudanych Actions wymagają włączenia i odbioru przez operatora. Cron nie zapewnia dokładnego czasu ani SLA. Proponowana kolejna rewizja techniczna 15.12.2026; zapis daty nie tworzy automatycznego zlecenia.

## Publikacja i rollback WWW

1. `npm ci`, build produkcyjny, walidacja, backend, adekwatny Playwright i audit. Przejrzany PR przechodzi CI bez sekretów produkcyjnych. Kontrola szczególnie formularza/CSP/analytics/config/lockfile/workflow; B/C nie wracają do paczki.
2. Wczytać lokalne szyfrowane poświadczenie właściwego klienta w tym samym procesie. `npm run deploy` sprawdza konto i buduje dist-cf. Sekretu nie wypisywać i nie umieszczać w GitHub.
3. Zapisać commit/deployment ID i poprzednią poprawną produkcję; porównać rzeczywisty JS z artefaktem. Produkcyjne bindingi SMTP i Turnstile zachować, preview bez SMTP_PASSWORD.
4. Przy awarii ustalić warstwę: kod, DNS, SMTP lub certyfikat. Wybrać poprzednie **sprawdzone produkcyjne** wdrożenie z prywatnego protokołu. W Pages użyć rollback lub odbudować odpowiadający commit w osobnym checkout. Nie cofać do demonstracyjnych opinii i nie kopiować sekretów z logów.
5. Przed przywróceniem sprawdzić zgodność nazw bindingów i hosta Turnstile. Potem canonical 200, API GET 405/no-store, kontakt, rzeczywisty 404 i właściwy SHA. `node tools/monitor.mjs` nie wysyła wiadomości. Rollback kodu nie odtwarza DNS ani poczty.
6. Jeżeli winna jest nowa reguła WAF, wycofać tylko ją/nowy entrypoint według zapisanego dowodu; nie wyłączać całej ochrony/TLS/MFA. Diagnozę 403/429 łączyć z Ray ID i Security Events.

Pusty ga4MeasurementId utrzymuje analitykę wyłączoną. Warunki uruchomienia i własności: [plan pomiarowy](plan-pomiarowy.md). Nie używać strumienia innego klienta/agencji.

## DNS i DNSSEC

Rekordy edytować w aktywnym Cloudflare. Przed zmianą eksport ID/typów/TTL/prio i reguł. Po zmianie dwa niezależne resolvery, NS, WWW i cztery MX OVH. Rekordy poczty/DKIM DNS-only. Nie importować starej strefy jako uniwersalnej naprawy.

**Nigdy nie wyłączać podpisywania Cloudflare przy nadal obecnym DS rodzica.** Najpierw poprawić DS albo usunąć go kontrolowanie w OVH dla zewnętrznych NS (aktualne API: POST /domain/{domain}/dsRecord, keys: []). Zachować podpisywanie do potwierdzenia usunięcia u rodzica i wygaśnięcia poprzedniego TTL — dla .pl zmierzono do 86400 s. Potwierdzić brak SERVFAIL z dwóch resolverów. Dopiero potem rozważyć wyłączenie podpisywania. Snapshot i zadania przed/po znajdują się w prywatnych dowodach.

Nie przypisywać ponownie domeny do home.pl dla dostępu do starej skrzynki; używać serwera technicznego. Zachować stary SPF/DKIM/wildcard do potwierdzenia zależności. Null MX/reject .com dopiero po potwierdzeniu braku legalnej poczty.

## Poczta i kopie

- OVH IMAP 993/TLS i SMTP 465/TLS z walidacją certyfikatów. MFA panelu nie zastępuje ochrony IMAP/SMTP. Rotację uzgodnić z aplikacjami klienta i sekretem formularza.
- Kopia zachowuje raw body, foldery, daty i flagi; odczyt EXAMINE/BODY.PEEK. Nie propagować usunięć i nie traktować lustrzanej skrzynki jako backupu.
- Odtworzenie do prawdziwej skrzynki wymaga kontrolowanego zakresu i deduplikacji. Lokalny test odtworzenia archiwum można wykonać bez APPEND/DELETE i bez dotykania poczty klienta.
- DPAPI wymaga obecnego profilu Windows. Pełne odzyskiwanie po utracie komputera wymaga niezależnego szyfrowanego pakietu i klucza przechowywanego przez właściciela. Kopia samego pliku dpapi na innym dysku tego nie zapewnia.
- Propozycja do odbioru: RPO poczty 24 h, kod/DNS po zmianie; 7 kopii dziennych + 4 tygodniowe i kwartalny test. **To nie jest uruchomiony harmonogram ani uzgodnione SLA.** RTO ustalić po realnym teście i uwzględnić odzyskanie dostępu/dostawcę.

## DMARC i odnowienia

Przed zaostrzeniem DMARC: spis legalnych nadawców, test zewnętrzny/odpowiedź i alignment webmaila/aplikacji/formularza. Co najmniej 14 dni reprezentatywnych raportów bez niewyjaśnionych legalnych błędów; mały ruch może wymagać dłuższego okresu. Ostrożnie quarantine, następnie po kontroli reject. Bez wycofanego pct. Przy błędzie wrócić do poprzedniej polityki, zachowując rua i dowody. Nie usuwać starego nadawcy w ciemno.

Ważność domen: .pl 03.07.2027, .com 03.07.2028; standardowe odnowienia według cennika 15.11: 72,56 i 76,86 zł brutto/rok. Przyszła faktura zależy od cennika. Poczta promocyjna wymaga zachowania powiązania z domeną. Nie zmieniono wcześniejszych automatów odnowień i nie dodano metody płatniczej. Finansowanie, alarmy i niezależny klucz kopii przekazać właścicielowi.

Dowody i otwarte zależności: [protokół wykonania](WYKONANIE_P0_P1_2026-11-15.md).
