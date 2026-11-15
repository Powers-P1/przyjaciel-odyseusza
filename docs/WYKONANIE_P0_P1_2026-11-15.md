# Wykonanie konfiguracji P0 i P1 — 15 listopada 2026

Zlecenie: realizacja checklisty, najpierw P0, następnie P1; **0 zł dodatkowych kosztów i zachowanie całej poczty**. Damian dostępny od 10:00 CET. Prace trwają; niezamknięte punkty nie są odbiorem końcowym.

## Wykonane i potwierdzone

| Punkty | Wynik i dowód |
|---|---|
| A02 | Odczyt OVH 04:28 CET: obecne zadanie DomainTrade nadal SCHEDULED. Zgoda starego kontaktu ACCEPT; zgoda Gmail nadal oczekuje. Termin 24.11, 15:56:18 CET. Bez nowego transferu, zamówienia, ponowienia maila ani akceptacji w imieniu abonenta. |
| A05 | API członków Cloudflare: właściciel konto Gmail klienta, accepted, Super Administrator, MFA włączone. Przechowania kodów odzyskiwania nie potwierdzono — A08 pozostaje otwarte. |
| B01 | Zapisano pełne rekordy obu stref (19 + 2 przed zmianami), NS, TTL, priorytety i stan reguł poza kontem Cloudflare. Pełny snapshot dostawców zaszyfrowany DPAPI; odszyfrowanie i hash sprawdzone. |
| B10 | Inwentaryzacja home.pl: wildcard CNAME do serwera technicznego, mechanizm SPF oraz dawny selektor DKIM zachowane. Brak dowodu pozwalającego już usunąć zależności; nie przypisano domeny do starego hostingu. |
| E04, E05 | Przegląd całego transportu i handlera oraz 15 testów backendu: stałe From/To, poprawne Reply-To, brak relay/CRLF/SMTP injection; Siteverify przed SMTP, hostname i action sprawdzane. Testy nie wysyłają wiadomości. |
| E14, N05 | Sprawdzono osiem kategorii rzeczywistych zapisanych sekretów w 728 blobach Git i artefaktach statycznych: brak trafień. Kod nie loguje danych formularza ani poświadczeń. Nie jest to audyt historii czatów ani gwarancja wszystkich historycznych logów usług. |
| F05, F08, F11 | Jawny TXT `_dmarc`: `v=DMARC1; p=none; rua=mailto:bartek@przyjacielodyseusza.pl; adkim=r; aspf=r`. Odczyt potwierdzony przez Google i Cloudflare DNS. Agregaty trafiają do istniejącej skrzynki klienta; bez `ruf`, `pct` i płatnej usługi. Zaostrzenie dopiero po analizie legalnej wysyłki. |
| F14 | Nowe zaszyfrowane kopie obu skrzynek: home.pl 49 wiadomości, OVH 57, po 7 folderów. Wszystkie 55 wiadomości z sumy dziewięciu wcześniejszych archiwów oraz wszystkie aktualne wiadomości źródłowe są w OVH; porównano surową zawartość, daty i flagi. Zero operacji APPEND/DELETE/SEND. |
| C03 — ustawienie | Na obu strefach podniesiono minimum TLS z 1.0 do 1.2; TLS 1.3 pozostaje włączony. Bez zmiany planu. Testy protokołów i certyfikatów są osobnym dowodem odbioru. |
| E15 — konfiguracja | Usunięto `SMTP_PASSWORD` wyłącznie z konfiguracji przyszłych podglądów. Konfiguracja produkcyjna porównana przed/po: niezmieniona. Do zamknięcia: publikacja nowego podglądu i sprawdzenie aliasu. |

Surowe dowody i odwracalne skrypty: `outputs/configuration-2026-11-15` w katalogu projektu. Sekrety, pełne dane kont i kopie wiadomości są poza repozytorium, w zabezpieczonym katalogu sekretów. Kopie DPAPI wymagają tego profilu Windows; niezależne odzyskiwanie N08 pozostaje otwarte.

## Przygotowane zmiany kodu — przed publikacją

- Treść formularza pozostaje w polach po błędzie; nie trafia do URL linku mailto.
- Nazwisko opcjonalne, telefon nadal opcjonalny; wskazówka ograniczająca przesyłanie danych wrażliwych.
- Opis pomocniczy textarea zachowany również po pokazaniu/ukryciu błędu.
- Funkcja ustawia własne nagłówki no-store, nosniff, noindex, ochronę ramek i Referrer-Policy.
- HSTS ograniczone do hosta, bez `includeSubDomains` i preload, ponieważ wildcard nadal obejmuje starą infrastrukturę. Po inwentaryzacji wszystkich używanych subdomen można wrócić do szerszej polityki.
- Build, walidacja HTML/CSP/typografii i 15 testów backendu poprawne. Przegląd Chromium/mobile: 315 testów poprawnych w pełnym przebiegu; cztery przestarzałe oczekiwania testów poprawiono i sprawdzono ponownie (4/4), pięć scenariuszy celowo pominiętych.

## Wymagające właściciela lub Damiana — od 10:00

1. Dokończenie zgody nowego abonenta `.pl` w Gmail klienta (mail ponowiony 14.11). Nie ma drugiej zaległej zgody starego abonenta.
2. Potwierdzenie MFA i kodów odzyskiwania OVH/Gmail oraz niezależnego przechowania kodów Cloudflare. Zabezpieczenie i docelowe role kont agencji wymagają osobnego odbioru dostępu. Szczegółowy audyt jest poza repozytorium.
3. Uzgodniona rotacja haseł tymczasowych/ujawnionych i przekazanie docelowego dostępu; bez odcinania programów pocztowych i formularza. Zmiana hasła przez interfejs przeglądarki wymaga samodzielnego wpisania i zatwierdzenia przez użytkownika zgodnie z polityką Computer Use.
4. Właścicielskie sesje Google/OVH, jeśli potrzebne do Search Console, Bing, GA4 i ustawień odzyskiwania. Sesja panelu OVH w Edge jest obecnie wylogowana; prace API pozostają dostępne.
5. Finansowanie i odpowiedzialność za istniejące odnowienia, retencja i przekazanie klucza kopii, RPO/RTO oraz akceptacja danych prawnych. Nie włączano automatycznych płatności; automatyczne odnowienia były aktywne już w stanie wejściowym.

Do czasu tych działań wykonuję niezależne kontrole i konfigurację P1. Nie wysyłam nowych wiadomości do klienta ani testów poczty bez osobnego, konkretnego polecenia wysłania.

