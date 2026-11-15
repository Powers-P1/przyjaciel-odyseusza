# Wykonanie P0 i P1 — 15 listopada 2026

Checkpoint dokumentacji 08:30 CET: **P0 23/32, P1 124/172**. **0 zł nowych opłat, bez utraty poczty.** [Pełna checklista](CHECKLISTA_TECHNICZNA_2026-11-15.md). Otwarte punkty nie są uznawane za wykonane tylko dlatego, że przygotowano ich część techniczną.

## Potwierdzone na usługach

| Obszar | Wynik i dowód poza Git |
|---|---|
| Kopie przed zmianami | Obie strefy, reguły, NS/TTL i stan dostawców zaszyfrowane DPAPI; odszyfrowanie i hash poprawne. provider-backup-proof.json. |
| Poczta | OVH **57**, home.pl **49** wiadomości, po 7 folderów. Wszystkie **55 archiwalnych** i wszystkie aktualne źródłowe zachowane: raw body, daty, flagi i wielokrotność. Świeża kontrola 06:55 CET. **Zero APPEND/DELETE/SEND.** mail-backup-proof.json. |
| Pojemność/reguły | Zimbra Starter READY, 15 GiB, billing OK, bezpłatny slot związany z .pl. IMAP QUOTA o 08:05: OVH 293 KiB/15 GiB; home.pl 247 KiB/4 GiB i 49 wiadomości. Nie utożsamiamy agregatu usługi home.pl ze stanem skrzynki. Aliasy/przekierowania 0/0; SOAP: brak aktywnych reguł przychodzących, forwardu i autorespondera; odbiór lokalny aktywny. Catch-all nadal niepotwierdzony. mail-quota-proof.json, zimbra-rules-proof.json. |
| SPF/DMARC | Jeden SPF, rekursywnie **4 termy DNS**, poniżej 10. Jawny DMARC .pl: `v=DMARC1; p=none; rua=mailto:bartek@przyjacielodyseusza.pl; adkim=r; aspf=r`. Dwa resolvery potwierdzają DNS. Home.pl i OVH zachowane; nie zaostrzano polityki bez raportów/alignment. spf-proof.json, dmarc-public-proof.json. |
| DNSSEC | Obie domeny podpisane, oba NS i parent DS sprawdzone; zadania OVH done. Google i Cloudflare DNS: **AD=true, Status=0**, brak SERVFAIL. dnssec-chain-proof.json. |
| TLS/protokoły | Minimum TLS 1.2, aktywne 1.3; cztery hosty mają poprawny SAN/łańcuch/ważność, 1.0/1.1 odrzucane. IMAP/SMTP z walidacją certyfikatu. Rzeczywiste **HTTP/2.0 i HTTP/3.0**, 200 z WAW; kompresja br zmierzona. Konfiguracja wszystkich aplikacji klienta nieznana. tls-proof.json, http-protocol-proof.json, compression-proof.json. |
| IPv6 | [Internet.nl](https://internet.nl/site/przyjacielodyseusza.pl/4413041/) potwierdził NS/WWW po IPv6, zgodność strony IPv4/IPv6, DNSSEC i RPKI. **95%**, wyjątek szyfrów opisano niżej. Lokalnego braku routingu IPv6 nie naprawiano zmianą sieci komputera. |
| WAF | Free Managed Ruleset na obu strefach. **429 po 11. pustym POST**, ten sam Ray ID w Security Events: ratelimit i właściwa reguła `/api/contact`. Bez maila. BIC aktywny, BFM i blokady AI wyłączone. Bez globalnego challenge i bypassów na sam User-Agent. security-events-proof.json. |
| Preview | SMTP_PASSWORD usunięty wyłącznie z podglądów; nowy preview rzeczywiście odmawia wysyłki `not_configured`. Produkcyjne bindingi zachowane. preview-http-proof.json. |
| Produkcja | Sprawdzony checkpoint **08:11 CET**, commit `0a5c11c72f6db21d741d234c3f76233274006885`, deployment `3ca84dac-92e2-4165-9e34-4cbf329b5aac`. **16 adresów i 7 plików zgodnych SHA256** z artefaktem; API GET 405/no-store. Kod na origin/main. Każda kolejna publikacja ma osobny aktualny zapis `closeout-release-proof.json`. |
| Stare URL | Mapa z bazy WordPressa i indeksu Yoast. `?page_id=2` → 301 do obecnej strony; wycofana wersja angielska, kategorie i demonstracyjne portfolio → rzeczywiste 404/noindex. UTM/v nadal 200. **23/23 kontroli**, bez nowych Functions i zmiany DNS. legacy-routing-http-proof.json. |
| Interfejs | Widoczna kropka zaznaczenia, również forced-colors. Kontrast granicy pola **3,97:1**, fokusu/zaznaczenia **7,21:1**. Odbiór 390/1280 px i 37 lokalnych testów formularza/dostępności, 3 świadomie pominięte. interface-contrast-proof.json. |

Stare wiadomości, usługi home.pl, selektory i wildcard zachowano. Nie przypisywano domeny ponownie do home.pl. Null MX/reject .com wymaga potwierdzenia braku legalnej poczty.

## Kod i kontrola jakości

Formularz nie umieszcza wiadomości w mailto URL; nazwisko/telefon opcjonalne, wskazówka unikania danych zdrowotnych i poufnych informacji osób trzecich. Błąd zachowuje pola i opis pomocniczy. Własne nagłówki Function, walidacja i Siteverify/hostname/action przed SMTP, stałe From/To, kontrolowane Reply-To, brak open relay i automatycznej ponownej wysyłki po niepewnym DATA. HSTS roczny **host-only**, bez includeSubDomains/preload ze względu na stary wildcard; poprzednia polityka może trwać w cache odwiedzającego.

[PR #1](https://github.com/Powers-P1/przyjaciel-odyseusza/pull/1) i [PR #2](https://github.com/Powers-P1/przyjaciel-odyseusza/pull/2) przeszły wymagane CI. Ostatni zakończony [checkpoint CI](https://github.com/Powers-P1/przyjaciel-odyseusza/actions/runs/43687666415): **836 poprawnych / 19 świadomie pominiętych**, pięć profili Chromium/Firefox/WebKit/mobile Chrome/mobile Safari; **19 testów backendu/agregatora**, audit **0**. Nowe zmiany również muszą przejść qa przed merge.

Lighthouse liczy osobne mediany Performance/LCP/CLS/TBT, kategorie funkcjonalne przechodzą w każdym przebiegu; cztery testy agregatora, bez obniżania progów. Main wymaga aktualnego PR, qa z GitHub Actions i rozwiązania dyskusji, także dla administratorów; brak force-push/usuwania. Jednoosobowy właściciel: 0 wymaganych cudzych akceptacji, przegląd kodu nadal wykonany. Akcje na pełnych SHA, token CI tylko do odczytu, bez sekretów produkcyjnych i automatycznych uploadów/cache artefaktów. Zależności zaktualizowane bez force, Node >=22.

Licencje OFL i autorstwo dołączone. Podzbiór Source Serif 4 przemianowano na Odyseusz Serif zgodnie z Reserved Font Name; kontury, metryki i kształtowanie identyczne. Odtworzenie z pakietu ujawniło jedynie CRLF/LF w licencji: 38/39 plików identycznych, tekst licencji taki sam. Build normalizuje teraz ten plik; ponowny wynik zapisujemy w portable-rebuild-proof.json, zachowując pierwszy osobno.

## Wydajność, prywatność i roboty

Turnstile ładuje się przy zbliżeniu do kontaktu, focus/pointer lub #kontakt; brak tokena nadal blokuje POST. Akceptowane zdjęcia i kadry zachowane, fonty lokalne. Bez Google Fonts, Rocket Loader i płatnych optymalizacji.

Pomiar produkcji po głównych optymalizacjach (3 przebiegi/profil, źródłowy commit w raportach): mobile mediana **100**, LCP **1520 ms**; desktop **100**, LCP **411 ms**; oba CLS **0.002**, TBT **0 ms**. To laboratorium z Polski, nie terenowy INP ani wszystkie regiony. CrUX niepotwierdzony, publiczny PSI zwrócił 429.

Pierwszy widok: mobile **8 żądań / 218 104 B**, desktop **8 / 187 579 B**, własna domena. Przed odroczeniem widgetu 21 żądań i około 2,24 MB. Budżet własny: **≤300 KiB / ≤10 żądań**, Performance ≥90, LCP ≤2500 ms, CLS ≤0.1, TBT ≤200 ms. Widget przy kontakcie i przyszłe GA4 mierzymy osobno. Świeża rzeczywista sesja: **0 cookies/localStorage/sessionStorage/Google**; Turnstile dopiero przy kontakcie, bez POST i CAPTCHA. transfer-proof.json, privacy-network-proof.json.

GA4 w zakresie, identyfikator pusty do utworzenia osobnych zasobów klienta. Brak tagu, banera i wyjątków Google w CSP przy pustym ID. Basic Consent Mode: równa odmowa, tag po zgodzie, wycofanie bez utraty formularza, również w drugiej karcie. **6 scenariuszy / 12 lokalnych przebiegów** z atrapą Google poprawnych; nie jest to odbiór prawdziwego strumienia. Białe listy parametrów, bez pól/query/pełnego referrera. [Plan pomiarowy](plan-pomiarowy.md).

Schema Validator: 0 błędów/ostrzeżeń. [Ponowny test Google](https://search.google.com/test/rich-results/result?id=isJj9RALNL3EOkaUJQj6FA) po WAF pobrał domenę **07:44 CET**: dwa poprawne elementy, niekrytyczna sugestia adresu. Nie dodano fikcyjnego biura. To nie dowód własności GSC ani indeksacji.

Robots/Cloudflare pozwalają na publiczną treść; API chronione oddzielnie. Rozdzielono Google/Bing, wyszukiwanie AI, pobrania na żądanie i trening, który obecna decyzja projektu dopuszcza. Kontrolowane UA OpenAI/Anthropic/Perplexity/LinkedIn/Facebook: 200 bez challenge. **Podmiana UA nie dowodzi wizyty z IP dostawcy, indeksacji, podglądu społecznościowego ani cytowania.** GSC/Bing i rzeczywiste raporty pozostają otwarte; llms.txt nie gwarantuje cytowań.

## Monitoring, kopie i uprawnienia

[Aktywny workflow](https://github.com/Powers-P1/przyjaciel-odyseusza/actions/runs/43688831519): **22 kontrole WWW co około 30 min** oraz **12 codziennych kontroli RDAP/NS/SPF/DKIM**, oba zadania sukces. Certyfikat: alarm <14 dni, domena <45 dni; dwie próby. Bez POST/IMAP/maili/sekretów. GitHub może opóźnić cron i wyłącza go po 60 dniach braku aktywności repo. Odbiór alarmu nadal wymaga potwierdzenia operatora.

Lokalna paczka **AES-256-GCM, około 16,4 MB**: Git bundle, zdjęcia, artefakt, DNS/reguły, surowa poczta i archiwalna baza WordPressa. Odszyfrowanie .NET i niezależnie Node, 45 plików + manifest odtworzone z poprawnymi hashami. Bez uploadu poczty do GitHub. Nie dodano sekretów usług, lecz poczta/baza zawierają dane poufne i historyczne hashe kont. **Klucz nadal DPAPI — N08 pozostaje otwarte do odebrania klucza i pakietu poza komputerem.** portable-recovery-proof.json, portable-restore-proof.json.

Token Cloudflare HELA: tylko konto projektu i dwie strefy, bez Billing Write/IAM/tworzenia tokenów; wygasa **15.12.2026, 06:22 CET**. Nowym sprawdzono publikację i odczyty, stary szeroki unieważniony; inne komputery bez zmian. Wygaśnięcie zatrzyma publikacje, nie WWW/pocztę. OVH: ograniczony zamiennik przygotowany, autoryzacja właściciela na 30 dni nadal potrzebna; dopiero po sprawdzeniu nowego unieważnimy stary HELA. A10 częściowe.

## Pozostałe zależności

1. **Własność/odzyskiwanie:** jedna zgoda nowego abonenta .pl w Gmail klienta, stara ACCEPT; termin **24.11, 15:56:18 CET**. Bez nowego transferu/zamówienia/resend. MFA OVH/Gmail, niezależne kody, role agencji i skoordynowana rotacja ujawnionych haseł z aplikacjami poczty/SMTP. Nowe poświadczenia w UI wymagają udziału użytkownika.
2. **Google/Bing:** własność klienta, osobne zasoby, właściwe uprawnienia/warunki; potem sitemap, inspekcje, raporty i preferencje AI. Sesja Google nie ma zasobów projektu, GSC .pl odmawia jej dostępu. Nie użyto konta innej firmy. GA4 OFF do odbioru prawdziwego strumienia/sieci zgód.
3. **Poczta:** aplikacje/legalni nadawcy, zastosowanie .com, zewnętrzny alignment/DKIM i odpowiedź. Nowa wysyłka wymaga odrębnego upoważnienia; testy z 14.11 nie upoważniają do kolejnych. Catch-all niepotwierdzony; port 25 timeout przed MAIL/RCPT/DATA. Bez zmiany filtrów i odbiorców.
4. **Przekazanie:** alarmy, finansowanie istniejących odnowień, retencja, cykliczny backup/RPO/RTO i niezależny klucz. OVH DPA zaakceptowane; zakres umów agencji, podwykonawców i transferów nadal do sprawdzenia. CDN/brak cookies nie zamyka RODO/PAD/EAA. Telefon/czytnik i rzeczywiste profile/podglądy społeczne wymagają odbioru.
5. **Czas:** co najmniej 14 reprezentatywnych dni raportów DMARC, CWV/RUM i raporty wyszukiwarek. Brak danych nie dowodzi sukcesu ani awarii. Nie wszystkie 48 otwartych P1 wymagają kliknięcia Damiana; część zależy od uprawnień/decyzji, część od obserwacji. Udział użytkownika dopiero od 10:00.

## Koszty i wyjątki

**Nowe opłaty/zakupy: 0 zł.** Cloudflare Free bez zmiany, wcześniejsze automaty odnowień OVH bez zmian. Domeny ważne .pl **03.07.2027**, .com **03.07.2028**, także według RDAP. Standardowy cennik odnowień na 15.11: **72,56 zł brutto/rok .pl**, **76,86 zł brutto/rok .com**; przyszła faktura zależy od cennika. Zimbra bezpłatna w promocji domenowej; finansowanie nadal A13.

Internet.nl zgłasza starsze domyślne szyfry TLS 1.2 Cloudflare. [Własne szyfry wymagają ACM](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/cipher-suites/), a [ACM nie obejmuje hostów Pages](https://developers.cloudflare.com/ssl/edge-certificates/advanced-certificate-manager/). Nie kupiono planu ani nie wymuszono TLS 1.3 kosztem zgodności firmowych przeglądarek. Właściciel techniczny wyjątku VERTIQ, rewizja **11.12.2026**, przed terminem tokena.

Axe/Lighthouse i pięć profili nie są deklaracją pełnej zgodności prawnej/WCAG. DPAPI nie jest samodzielnym disaster recovery. Testowy odtworzony pakiet pozostał w prywatnym katalogu — automatyczny przegląd odmówił rekurencyjnego usunięcia. Niczego nie usuwano w skrzynkach.

Dowody: `outputs/configuration-2026-11-15` poza publicznym repo. Sekrety/poczta/pakiety w chronionym katalogu. [Procedury utrzymania](UTRZYMANIE_I_ODTWARZANIE.md).
