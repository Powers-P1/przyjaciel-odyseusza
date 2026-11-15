# Wykonanie konfiguracji P0 i P1 — 15 listopada 2026

Zlecenie: najpierw P0, potem P1; **0 zł dodatkowych kosztów i zachowanie całej poczty**. Prace trwają. Stan o 06:15 CET: **P0 23/32, P1 90/172**; kolejne dopiski mają pierwszeństwo. [Pełna checklista](CHECKLISTA_TECHNICZNA_2026-11-15.md).

## Zmiany działające na usługach

| Obszar | Wynik i dowód poza Git |
|---|---|
| Kopie przed zmianami | Obie strefy, reguły, NS/TTL i stan dostawców zaszyfrowane DPAPI; odszyfrowanie i hash poprawne. provider-backup-proof.json. |
| Poczta | OVH 57, home.pl 49 wiadomości, po 7 folderów. Wszystkie 55 archiwalnych oraz wszystkie aktualne źródłowe zachowane; porównano surową zawartość, daty i flagi. Nowe kopie obu skrzynek. **Bez APPEND/DELETE/SEND.** mail-backup-proof.json. |
| OVH | Zimbra Starter READY, 15 GiB, billing OK, bezpłatny slot promocyjny powiązany z .pl. Bez anulowania lub zakupu usług. Aliasy/przekierowania: 0/0; reguły webmaila wymagają osobnej kontroli. |
| DMARC .pl | Jawny TXT: `v=DMARC1; p=none; rua=mailto:bartek@przyjacielodyseusza.pl; adkim=r; aspf=r`. Google/Cloudflare DNS potwierdzają rekord. Bez ruf/pct i zewnętrznej usługi raportowej. MX/SPF/DKIM niezmienione. dmarc-proof.json, dmarc-public-proof.json. |
| DNSSEC | Obie domeny aktywne, podpisy sprawdzone na obu NS. Właściwe klucze OVH i parent DS; oba zadania done. Google i Cloudflare DNS: AD=true, Status=0, brak SERVFAIL. dnssec-authoritative/registrar/chain-proof.json. |
| TLS | Minimum 1.2 i aktywne 1.3; cztery hosty mają poprawny SAN/łańcuch/ważność, 1.0/1.1 odrzucane przez serwer. IMAP/SMTP OVH i IMAP home.pl z walidacją certyfikatu. Konfiguracji wszystkich aplikacji klienta nie znamy. tls-proof.json. |
| WAF | Brakujący Free Managed Ruleset włączony na obu strefach. Bez płatnych rulesetów, blokad krajów/ASN i globalnego challenge. Odczyt po zmianie poprawny; monitor 19/19 przechodzi. waf-enabled-proof.json. |
| Preview | Usunięto SMTP_PASSWORD wyłącznie z podglądów. Nowy preview rzeczywiście odmawia wysyłki not_configured. Produkcyjne bindingi niezmienione. cloudflare-hardening-proof.json, preview-http-proof.json. |
| Produkcja | Opublikowano minimalizację danych i poprawki prywatności. Macierz 16 adresów HTTP/HTTPS, apex/www, .pl/.com: canonical, ścieżki/query i brak pętli poprawne. JS zgodny z artefaktem. Kontrole API bez tokena nie wysyłają poczty. deployment-proof.json, production-http-proof.json. |

Stare wiadomości i usługa home.pl, SPF/DKIM oraz wildcard pozostają zachowane do potwierdzenia zależności. Nie przypisywano domeny ponownie do home.pl. Nie wdrażano Null MX/reject dla .com bez potwierdzenia jej zastosowania.

## Kod i kontrola jakości

Treść formularza usunięto z mailto URL; po błędzie pozostaje w polach. Nazwisko i telefon opcjonalne, wskazówka unikania danych zdrowotnych i poufnych informacji osób trzecich. Opis pomocniczy textarea zachowany po błędzie. Function ustawia własne no-store/nosniff/noindex i ochronę ramek; nie polega na `_headers`.

HSTS roczny tylko dla hosta; includeSubDomains/preload usunięto ze względu na stary wildcard. Dawna polityka może pozostawać w cache odwiedzających do aktualizacji lub wygaśnięcia — zmiana nie usuwa natychmiast cudzych pamięci przeglądarki.

15 testów backendu obejmuje walidację/streaming body, Siteverify/hostname/action, replay tokena, SMTP injection i niepewny timeout po DATA. Bez rzeczywistej wysyłki. Regresja przeglądarkowa obejmuje focus, aria, zachowanie treści, 429, podwójny submit i odnowienie tokena. Aktualizacja zależności w zgodnych zakresach semver, bez force; Node >=22 i lockfile. **npm audit: 0** znanych podatności po aktualizacji.

Osiem kategorii rzeczywistych zapisanych sekretów sprawdzono w historii Git i statycznych artefaktach: brak trafień. Nie jest to audyt historii czatów ani wszystkich historycznych logów usług. CI przygotowano z minimalnym GITHUB_TOKEN, pełnymi SHA akcji i bez sekretów produkcyjnych. Standardowe publiczne runnery, bez automatycznych uploadów/cache artefaktów. Stary workflow demonstratora wyłącznie ręczny.

## Wydajność i indeksowanie

Baza z rzeczywistej domeny, po 3 porównywalne przebiegi: mobile Performance 95/99/100 (mediana **99**, LCP **2273 ms**); desktop 98/100/100 (mediana **100**, LCP **662 ms**). CLS obu profili **0.002**, TBT **0 ms**; Accessibility/Best Practices/SEO **100**. Raporty Lighthouse poza Git. Nie znamy jeszcze terenowego INP/CWV; PSI zwróciło 429, a TBT nie jest INP. Wynik z jednego regionu nie opisuje wszystkich odbiorców.

LCP to jawny w HTML `img.hero__portrait`, bez lazy, fetchpriority high i z responsywnymi kadrami. Różne kadry mobile/desktop są zaakceptowaną art direction; zdjęcia zachowane. Fonty lokalne, izolowany pomiar nie pobiera Google Fonts. Nie dodano Rocket Loader i płatnych optymalizacji.

Schema Validator: 0 błędów i 0 ostrzeżeń. Rzeczywisty [Rich Results Test](https://search.google.com/test/rich-results/result?id=kgroaFheFAQZavytslOlzw) pobrał stronę 15.11 o 05:06 CET: dwa poprawne elementy, opcjonalna sugestia adresu Organization. Nie dodano fikcyjnego biura. Potwierdza to fetch narzędzia Google, nie rejestrację Search Console ani zaindeksowanie strony.

Osobne cele robotów: indeksacja Google/Bing, cytowania/grounding, pobranie na żądanie i trening. Obecna decyzja projektu pozwala na te zastosowania publicznej treści. API chronione niezależnie; brak bypassów WAF na User-Agent. `llms.txt` nie gwarantuje cytowania. Faktyczne raporty Google/Bing i kolejne warstwy Cloudflare mają osobne otwarte punkty.

## GA4 i monitoring — przygotowanie

GA4 należy do zakresu. Integracja i **10/10 testów zgód** gotowe; pusty identyfikator utrzymuje pomiar wyłączony. Przy pustym ID brak tagu Google, banera i wyjątków Google w CSP. Podstawowy model: tag dopiero po zgodzie, równorzędna odmowa, wycofanie bez przeładowania i utraty wiadomości. Parametry ograniczone białą listą, bez pól/query/pełnego referrera. [Plan pomiarowy](plan-pomiarowy.md).

Dostępna sesja Google nie zawiera zasobów projektu. Nie wykorzystano konta innej firmy. Search Console odmawia dostępu do właściwości domenowej .pl. Utworzenie/udostępnienie osobnych zasobów klienta wymaga potwierdzenia warunków i właściwej własności.

Monitor WWW/certyfikatów/DNSSEC/MX/DMARC: 19/19 odczytowych kontroli przechodzi. Harmonogram GitHub co około 30 minut aktywuje się po publikacji na main. Bez POST, IMAP i wysyłki maili, bez sekretów produkcyjnych. Opóźnienia GitHub i wyłączenie cron po 60 dniach bezczynności wymagają kontroli. Odbioru alarmów przez operatora jeszcze nie potwierdzono.

## Potrzebne od 10:00

1. **.pl:** zgoda nowego kontaktu z maila OVH w Gmail klienta; stary kontakt zaakceptował. Brakuje jednej zgody, termin **24.11, 15:56:18 CET**. Bez nowego transferu/zamówienia i kolejnego ponowienia maila.
2. **MFA/odzyskiwanie:** Cloudflare właściciela ma MFA, niezależne kody niepotwierdzone. OVH API wykazuje brak TOTP/U2F/SMS. Potrzebna kontrola Gmail, MFA OVH, kody i docelowe role agencji; szczegóły kont poza publicznym Git.
3. **Hasła/API:** skoordynowana rotacja ujawnionych haseł bez odcinania programów pocztowych. Polityka Computer Use wymaga samodzielnego wpisania i zatwierdzenia nowego hasła przez użytkownika w UI. OVH nie pozwala zawęzić istniejącego credential; zamiennik wymaga autoryzacji właściciela. Token Cloudflare jest przedmiotem oddzielnego zawężenia w tej pracy.
4. **Google/Bing:** osobne zasoby klienta; potwierdzenie warunków GA4 i nowych dostępów administracyjnych przy ich nadaniu. Gotowy kod pozostaje wyłączony do tego czasu.
5. **Utrzymanie:** użycie starego SMTP i poczty .com, finansowanie istniejących odnowień, odbiorca alarmów, retencja, RPO/RTO i niezależny klucz kopii. DPAPI zależy od profilu Windows — nie wystarczy po utracie komputera.
6. **Dostarczalność:** pełna wysyłka/odpowiedź i alignment poza OVH wymagają konkretnego upoważnienia do wysłania. Testy z 14.11 nie upoważniają do kolejnych maili.

## Koszt i ograniczenia

**Nowe zakupy/opłaty: 0 zł.** Plan Cloudflare Free bez zmiany. Automatyczne odnowienia OVH istniały już wcześniej; nie dodawano automatów ani płatności. Bieżący standardowy cennik odnowienia: .pl **72,56 zł brutto/rok**, .com **76,86 zł brutto/rok**; przyszła faktura zależy od cennika. Ważność: .pl 03.07.2027, .com 03.07.2028. Zimbra pozostaje bezpłatna w promocji związanej z domeną, nie wolno odłączać jej bez kontroli skutków. Finansowanie i przypomnienia wymagają przekazania właścicielowi.

Fizyczny telefon/czytnik, pełne raporty wyszukiwarek, rzeczywiste GA4 i niezależne odzyskanie kopii pozostają otwarte. Wynik axe/Lighthouse nie jest pełną deklaracją zgodności prawnej/WCAG. Dowody/skrypty: `outputs/configuration-2026-11-15` poza repo; sekrety, dane kont i wiadomości w zabezpieczonym katalogu sekretów. [Procedury utrzymania](UTRZYMANIE_I_ODTWARZANIE.md).

## Dalsze potwierdzenia — 06:35 CET

- Świeże odtworzenie z archiwum commitu `f5e2162`: npm ci/build/walidacja/backend w 10,8 s w istniejącym środowisku Windows, następnie osobny preview bez SMTP. 37 plików identycznych, 5/5 kontroli HTTP poprawnych. To nie jest RTO po utracie konta/komputera ani test odzyskania DPAPI na innej maszynie. Dowody: restore-build-proof.json i restore-preview-proof.json.
- Odtworzono lokalnie jedną raw EML z zaszyfrowanej kopii OVH: hash identyczny, data i flagi zachowane, MIME czytelny z istniejącymi w źródle defektami. Kopia jawna usunięta po kontroli; zero zapisów do IMAP i wysyłek. Harmonogram i niezależny klucz nadal wymagają odbioru, F15/N08/N09 nie zamykamy samym testem.
- Token Cloudflare HELA wymieniono na ograniczony do tego konta i dwóch stref, z terminem 30 dni. Nowym wykonano rzeczywistą publikację preview i odczyty usług, następnie stary nadmiernie uprzywilejowany token unieważniono. Bez Billing Write, IAM i tworzenia kolejnych tokenów; inne tokeny/komputery bez zmian. Credential OVH nadal wymaga zamiany z autoryzacją właściciela, więc A10 pozostaje częściowe.
- CI wykonało **816 testów poprawnie, 19 świadomie pominiętych** w pięciu profilach. Osobny błąd agregacji Lighthouse: skrypt wybierał TBT z raportu o medianowym Performance. Naprawiono medianę każdej metryki; progi bez zmian, a kategorie funkcjonalne muszą przejść w każdym przebiegu. Cztery testy agregatora i 15 testów backendu: 19/19 poprawnych. Nowy przebieg CI wymagany przed merge.
- Kontrola fontów: licencje OFL i autorstwo dołączone. Podzbiór Source Serif 4 przemianowano na Odyseusz Serif, respektując Reserved Font Name; zmienione wyłącznie tablice name/head. Hashy konturów, metryk i kształtowania nie zmieniono. Nowy adres pliku zapobiega konfliktowi rocznego cache. Dowód: font-rename-proof.json.
- Przygotowano ograniczenie kosztu zewnętrznego Turnstile: widget ładuje się przy zbliżeniu do formularza, focus/pointer lub wejściu #kontakt, zamiast podczas samego oglądania hero. Brak tokena nadal blokuje POST; brak IntersectionObserver ma bezpieczny fallback. Awaria zachowuje wiadomość. Zmiana i fonty: 84 testy poprawne / 4 pominięte w Chromium i mobile. Wymagane końcowe CI i odbiór produkcji.
- Warianty index.html, rozszerzenie polityki i ukośnik zwracają 308 do właściwego URL; wielkość liter i odrzucone B/C — 404/noindex. UTM/v pozostają z canonical głównej domeny; próba ścieżki z obcym hostem nie daje open redirect. Dowód: url-variants-proof.json.

Aktualny odczyt Bot Management obu stref: fight_mode=false, blokady AI/crawlerów disabled, managed robots=false. BIC pozostaje włączony. HTTP/2 i HTTP/3 włączone; Rocket Loader/Early Hints wyłączone. Sam przełącznik HTTP/3 nie dowodzi jeszcze realnego transferu QUIC. GraphQL Workers zwrócił pusty dataset, dlatego nie uznajemy go za dowód zerowego użycia konta. Dodatkowa kontrola limitu 12 równoległymi pustymi POST nie odtworzyła 429 — reguła nadal istnieje, ale wynik wymaga doprecyzowania z Security Events, bez zwiększania ruchu w nieskończoność.
