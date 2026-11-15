# Kompleksowa checklista techniczna strony Przyjaciel Odyseusza

Stan odniesienia: **15 listopada 2026, Europe/Warsaw**. Zakres: informacyjna strona usługowa Bartłomieja Przytuły, formularz kontaktowy, domeny `.pl` i `.com`, Cloudflare Pages Free, autorytatywny DNS Cloudflare oraz domeny i poczta OVH. GitHub jest repozytorium i wcześniejszym demonstratorem. Nie projektujemy VPS, WordPressa, sklepu ani infrastruktury dużego portalu.

Lista służy do wykonania konfiguracji i jej odbioru. Utworzenie listy nie oznacza wykonania nieodznaczonych prac. Podstawą są aktualne dokumentacje, standardy, poradniki producentów, badanie własne Ahrefs oraz doświadczenia użytkowników i transkrypcje materiałów wideo. Wnioski dla tego projektu są zaleceniami projektowymi, o ile przy punkcie nie wskazano konkretnego wymogu standardu lub prawa.

## Jak odhaczamy

- `[x]` — istnieje wskazany dowód, z podaną datą. Nie oznacza automatycznej weryfikacji całego rozdziału.
- `[ ]` — do wykonania albo sprawdzenia; sam pusty checkbox nie przesądza o błędzie.
- **W** — warunek bezpiecznego odbioru tego projektu lub wskazany wymóg techniczny; nie jest to automatycznie obowiązek ustawowy.
- **Z** — zalecane dla tej strony. **O** — opcjonalne, po potwierdzeniu potrzeby. Punkt niedotyczący projektu zamykamy dopiskiem `N/D: powód`, nie pozornym potwierdzeniem wdrożenia.
- **P0** — dostęp, własność, ochrona danych, ciągłość WWW/poczty. **P1** — pełna podstawowa konfiguracja. **P2** — rozwój, dodatkowe zabezpieczenia i optymalizacje po pomiarach. To kolejność prac, nie ocena incydentu.
- Po wykonaniu dopisujemy: `data | wykonawca | dowód | wynik`. Sekrety, kody odzyskiwania i treść zapytań klientów pozostają poza checklistą, Git i publicznymi raportami.

**Koszt:** domyślnie wykorzystujemy obecne usługi i funkcje Free, bez dodatkowego abonamentu. „0 zł dodatkowo” nie znaczy, że domeny, poczta i robocizna są bezpłatne. Odnowienia istniejących usług rozlicza się według umowy i cennika. Pozycje z kosztem lub niepotwierdzoną dostępnością wymagają wyceny i osobnej zgody Damiana; również włączenie automatycznych płatności wymaga takiego uzgodnienia.

## Co wiemy już o obecnym wdrożeniu

| Obszar | Potwierdzony stan | Dalszy krok |
|---|---|---|
| Hosting i WWW | Cloudflare Free; `.pl` zwraca 200; canonical wskazuje właściwą domenę. HTTPS `www`, `.com` i `www.com` przekierowują 301 na `.pl`. | Dokończyć macierz przekierowań ze ścieżkami, parametrami i HTTP. |
| DNS | Obie domeny używają `rita.ns.cloudflare.com` i `tom.ns.cloudflare.com`. | Edycje właściwych rekordów wykonujemy w Cloudflare, nie w nieaktywnej strefie OVH. |
| DNSSEC | Dla `.pl` API pokazuje `disabled`; publicznie brak DS dla obu domen. | B11–B13, z walidacją delegacji i planem wycofania. |
| DMARC `.pl` | Brak poprawnej polityki. `_dmarc` trafia przez wildcard CNAME do `serwer2586394.home.pl`, który zwraca SPF, nie DMARC. | F05–F08; jawny właściwy rekord ma usunąć tę niejednoznaczność. |
| SPF i stara infrastruktura | SPF nadal autoryzuje home.pl oraz OVH; wildcard `*.przyjacielodyseusza.pl` wskazuje home.pl. | Najpierw inwentaryzacja użycia, później porządki. Nie usuwać w ciemno. |
| Poczta | Cztery MX `.pl` kierują do OVH; oba selektory DKIM OVH są DNS-only. | Sprawdzić podpis i alignment w wiadomości odebranej poza OVH. Sam DNS nie dowodzi dostarczalności. |
| `.com` a poczta | Brak MX, SPF i DMARC w publicznym odczycie. | Ustalić, czy domena ma obsługiwać pocztę; nie zakładać, że przekierowanie WWW przekierowuje też e-maile. |
| Formularz | Jeden zatwierdzony test z podglądu dotarł do INBOX OVH 14.11. Produkcję włączono i sprawdzono bez drugiej wysyłki. | Utrzymanie, kontrola konfiguracji i ograniczenie uprawnień podglądów. |
| Nagłówki | Na stronie głównej są CSP, HSTS z `includeSubDomains`, nosniff, ochrona ramek i Referrer-Policy. | Odbiór podstron, błędów i odpowiedzi funkcji osobno; przegląd wpływu HSTS na subdomeny. |
| Podglądy | Bazowy `pages.dev` ma `X-Robots-Tag: noindex, nofollow`; podgląd formularza ma `noindex`; GitHub Pages ma meta noindex. | Noindex nie zapewnia prywatności. Rozważyć przekierowanie bazowego adresu i ochronę podglądów. |
| Indeksowanie | `robots.txt`, sitemap i `llms.txt` odpowiadają 200; nieistniejący URL zwraca 404. | Sprawdzić rzeczywisty odczyt i indeksowanie w Google/Bing, nie tylko dostępność plików. |
| Abonent `.pl` | Ostatni checkpoint z 14.11: stara zgoda ACCEPT, nowa zgoda Gmail oczekiwała; ponowienie wysłano. Termin z checkpointu: 24.11, 15:56:18 CET. | A02: odczytać aktualny status. To odrębne od ukończonego transferu rejestratora. |

Dowody lokalne: [odczyt WWW i DNS z 15.11][e1], [odczyt pocztowych TXT z 15.11][e2], [odbiór testu formularza][e3], [publikacja formularza][e4], [opis wdrożenia formularza](contact-form-2026-11-14.md). Odczyt 15.11 nie zmieniał konfiguracji i nie wysyłał wiadomości.

## Kolejność realizacji

1. **Własność i odzyskiwanie:** A01–A08, A13, potwierdzenie abonenta `.pl`.
2. **Kopia stanu i bezpieczny DNS:** B01–B04, B10–B15; DNSSEC dopiero z poprawnymi danymi rejestratora.
3. **Poczta:** inwentaryzacja nadawców, DKIM i monitoring DMARC; dopiero po analizie zaostrzenie polityki i usunięcie starego SPF.
4. **Bezpieczeństwo WWW i formularza:** C, D, E. Nie blokować wyszukiwarek ani nie otwierać wyjątków do całego API.
5. **Szybkość i dostępność:** G i K; mierzyć wynik przed zmianą i po niej.
6. **Indeksowanie i widoczność AI:** H, I, J; konfiguracja Google/Bing i test rzeczywistego dostępu botów.
7. **Prywatność, analityka i przekazanie:** L–O; uzgodniony pomiar musi działać razem ze zgodami i aktualnym CSP.

## A Własność kont i dostęp administracyjny

Wykonawca: właściciel i agencja. Źródła: [Cloudflare 2FA][cf01], [tokeny API][cf02], [OVH 2FA][ovh01], [zarządzanie sekretami OWASP][sec03], [odnowienia OVH][ovh05].

- [ ] **A01 P0/W** — Potwierdzić, że abonent domen, właściciel usług i główny administrator kont są przypisani do klienta; zachować dowód przekazania.
- [ ] **A02 P0/W** — Sprawdzić aktualny status zmiany abonenta `.pl` oraz pozostałą zgodę. Nie inicjować ponownego transferu ani nowego zamówienia zamiast dokończenia obecnego zadania.
- [ ] **A03 P0/W** — Zweryfikować adresy odzyskiwania i kontaktowe; klient rzeczywiście odbiera powiadomienia o domenach, płatnościach i bezpieczeństwie.
- [ ] **A04 P0/Z** — Zabezpieczyć skrzynkę odzyskiwania MFA; nie uzależniać odzyskania całej infrastruktury wyłącznie od skrzynki w tej samej domenie.
- [ ] **A05 P0/W** — Właściciel aktywuje MFA Cloudflare; preferowany klucz/passkey odporny na phishing albo TOTP, z niezależną metodą zapasową.
- [ ] **A06 P0/W** — Właściciel aktywuje MFA OVH; potwierdzić ponowne logowanie i dostęp do usług.
- [ ] **A07 P0/W** — Wymienić hasła tymczasowe lub ujawnione w rozmowach; skoordynować zmianę hasła skrzynki z klientami poczty i sekretem SMTP formularza.
- [ ] **A08 P0/W** — Kody odzyskiwania przechowuje klient w bezpiecznym miejscu, z kopią awaryjną niezależną od telefonu i obecnego komputera.
- [ ] **A09 P1/Z** — Agencja używa własnego delegowanego dostępu, w zakresie obsługiwanym przez usługę; wspólny główny login nie jest docelowym modelem pracy.
- [ ] **A10 P1/W** — Tokeny Cloudflare i OVH ograniczyć do potrzebnych usług, operacji i czasu; usunąć zbędne uprawnienia, zachowując działające wdrożenia.
- [ ] **A11 P1/Z** — Przejrzeć aktywne sesje, członków, aplikacje OAuth i stare tokeny; odwołać wyłącznie rozpoznane zbędne dostępy.
- [ ] **A12 P1/Z** — Ustalić, kto odbiera alarmy i kto może wykonać rollback, zmianę DNS oraz odzyskanie konta.
- [ ] **A13 P0/W** — Zapisać terminy i pełne koszty odnowień obu domen oraz poczty. Uzgodnić finansowanie, przypomnienia i ewentualny automat płatniczy przed jego aktywacją.
- [ ] **A14 P1/W** — Przekazać klientowi instrukcję dostępu i końcową listę uprawnień; po odbiorze ograniczyć dostęp wykonawców zgodnie z ustaleniami.

## B Domeny i DNS

Wykonawca: agencja; rejestrator OVH i DNS Cloudflare. Źródła: [DNSSEC Cloudflare][cf03], [DNSSEC OVH][ovh02], [domeny Pages][cf04], [rekordy OVH][ovh06], [Null MX][mail04].

- [ ] **B01 P0/W** — Wyeksportować obie aktywne strefy oraz zapisać NS, TTL i dane potrzebne do odtworzenia; kopia poza samym kontem Cloudflare.
- [ ] **B02 P0/W** — Zweryfikować kontakty abonenta, blokadę transferu, status domen i daty ważności w OVH. Dostępne zabezpieczenia zależą od TLD; nie wymuszać statusów typowych dla `.com` na `.pl`.
- [x] **B03 P1/W** — Potwierdzić autorytatywne NS obu domen w Cloudflare. Dowód: 15.11, E1; `rita` i `tom`.
- [x] **B04 P1/W** — Potwierdzić `.pl` na Cloudflare Pages i aktywną stronę pod własną domeną. Dowód: 14–15.11, E1/E4.
- [ ] **B05 P1/W** — Sprawdzić pełną macierz HTTP/HTTPS, www/apex i `.pl`/`.com`; wszystkie obsługiwane warianty mają prowadzić do jednego kanonicznego hosta.
- [ ] **B06 P1/W** — Przekierowania zachowują właściwą ścieżkę i parametry; brak pętli, otwartych przekierowań i niepotrzebnych łańcuchów.
- [ ] **B07 P1/W** — Odtworzyć mapę wartościowych starych URL; zastosować odpowiedniki 301/308, a dla usuniętych treści właściwe 404/410. Nie kierować każdego starego adresu na stronę główną.
- [ ] **B08 P1/W** — Sprawdzić wszystkie hosty poczty, autokonfiguracji i DKIM; rekordy używane do SMTP/IMAP oraz selektory DKIM mają właściwy tryb DNS-only.
- [ ] **B09 P1/W** — Wyjaśnić, czy `.com` ma odbierać/wysyłać pocztę lub mieć aliasy; przekierowanie WWW nie załatwia poczty.
- [ ] **B10 P0/Z** — Zinwentaryzować wildcard i wszystkie odwołania do home.pl. Usuwać zbędne dopiero po sprawdzeniu używanych subdomen i zachowaniu archiwum; nie przywracać przypisania domeny do starego hostingu.
- [ ] **B11 P1/Z** — Włączyć podpisywanie DNSSEC w Cloudflare dla każdej domeny i pobrać dane właściwe dla jej aktywnej strefy.
- [ ] **B12 P1/Z** — Uzupełnić DNSSEC po stronie OVH dla zewnętrznych NS, zgodnie z wymaganym formatem klucza/DS. Nie używać kluczy z nieaktywnej strefy OVH ani mylić digest z kluczem publicznym.
- [ ] **B13 P1/W** — Po DNSSEC potwierdzić pełny łańcuch zaufania i brak SERVFAIL z kilku resolverów; zapisać procedurę usunięcia błędnego DS przy awarii.
- [ ] **B14 P2/Z** — Rozważyć CAA po sprawdzeniu aktualnych CA używanych przez Pages i inne usługi; restrykcja nie może zablokować odnowienia certyfikatów.
- [ ] **B15 P1/W** — Sprawdzić osierocone CNAME, stare tokeny weryfikacyjne, wildcardy i rekordy po odłączonych usługach; usuwać po potwierdzeniu braku zależności.
- [ ] **B16 P2/Z** — Zapisać standard TTL: wartości normalne oraz czasowe obniżenie przed planowaną migracją; nie utrzymywać skrajnie niskich TTL bez potrzeby.
- [ ] **B17 P1/W** — Potwierdzić działanie WWW i rekordów pocztowych po każdej zmianie DNS, z niezależnych resolverów i po IPv6, jeśli jest udostępniane; test internetowy i odczyt panelu muszą być zgodne.
- [ ] **B18 P1/Z** — Jeżeli `.com` nie służy poczcie, zaplanować Null MX, SPF odmawiający wysyłki i DMARC dla tej domeny; wdrożyć dopiero po potwierdzeniu braku legalnej poczty.

## C HTTPS certyfikaty i nagłówki

Wykonawca: agencja, Cloudflare i kod. Źródła: [minimalny TLS][cf05], [HSTS][cf06], [nagłówki Pages][cf07], [OWASP HTTP headers][sec01], [OWASP CSP][sec02].

- [x] **C01 P0/W** — Strona kanoniczna jest dostępna przez HTTPS, HTTP apex przekierowuje na HTTPS. Dowód: 15.11, E1.
- [ ] **C02 P1/W** — Sprawdzić ważność, SAN, łańcuch i automatyczne odnowienie certyfikatów wszystkich hostów, także `.com` i www.
- [ ] **C03 P1/Z** — Minimum TLS 1.2, TLS 1.3 i zgodność klientów; nie kopiować trybu „Flexible” ani ustawień originu VPS do Pages.
- [x] **C04 P1/Z** — Na głównym HTML występuje HSTS `max-age=31536000; includeSubDomains`. Dowód: 15.11, E1. Nie jest to potwierdzenie gotowości do preload.
- [ ] **C05 P0/W** — Przejrzeć wpływ już aktywnego `includeSubDomains` na istniejące hosty. Preload dopiero po osobnej analizie wszystkich subdomen i możliwości długiego utrzymania HTTPS.
- [x] **C06 P1/Z** — Główny HTML ma CSP z ograniczonymi źródłami i bez `unsafe-eval`/`unsafe-inline`. Dowód: 15.11, E1.
- [ ] **C07 P1/W** — Zbadać rzeczywiste naruszenia CSP i poprawne hashe po buildzie; formularz, Turnstile i ewentualny pomiar mają działać bez poszerzania polityki do `*`.
- [x] **C08 P1/Z** — Na stronie głównej są nosniff, Referrer-Policy oraz ochrona przed osadzaniem w ramkach. Dowód: 15.11, E1.
- [ ] **C09 P1/Z** — Zweryfikować Permissions-Policy i COOP na rzeczywistych integracjach; COEP/CORP dodawać tylko przy uzasadnionej potrzebie, bez psucia zasobów.
- [ ] **C10 P1/W** — Sprawdzić nagłówki podstron, 404, przekierowań i odpowiedzi funkcji. `_headers` nie ustawia nagłówków odpowiedzi generowanych przez Pages Functions.
- [ ] **C11 P0/W** — Odpowiedzi formularza i inne wrażliwe odpowiedzi mają `no-store`; nie dopuszczać ich do własnego Cache API ani cache regułą strefową.
- [ ] **C12 P1/W** — Potwierdzić typy MIME, UTF-8 i brak mixed content; zasoby muszą ładować się przy wyłączonej pamięci podręcznej.
- [ ] **C13 P1/W** — Sprawdzić brak zbędnego CORS na API; publiczny odczyt statycznych zasobów i wysyłka formularza to różne polityki.
- [ ] **C14 P2/Z** — Wykonać pasywną kontrolę nagłówków, TLS i nieoczekiwanych certyfikatów w Certificate Transparency; nie włączać przestarzałych HPKP, Expect-CT ani X-XSS-Protection tylko dla punktacji.
- [ ] **C15 P2/Z** — Utrzymywać `/.well-known/security.txt`: właściwy kontakt, aktualna data Expires i działająca obsługa zgłoszeń, bez obietnicy nieuzgodnionego bug bounty. [RFC 9116][sec06]

## D Ochrona Cloudflare przed nadużyciami

Wykonawca: agencja. Źródła: [plany WAF][cf08], [Bot Fight Mode][cf09], [AI Crawl Control][cf10], [weryfikacja botów][cf11].

- [ ] **D01 P1/W** — Sprawdzić rzeczywiście aktywne reguły ochrony obu stref i automatyczną ochronę DDoS; nie zakładać, że komplet płatnych managed rules jest dostępny na Free.
- [ ] **D02 P1/Z** — Dostępne reguły WAF stosować do realnej powierzchni ataku; nie dokładać przypadkowych blokad krajów, ASN i całych klas narzędzi.
- [x] **D03 P0/W** — Ograniczenie POST formularza 10 prób/IP/10 s i blokada na 10 s jest wdrożone. Dowód 14.11: puste żądania 11–12 otrzymały 429, bez wysyłki. [E5][e5]
- [ ] **D04 P1/W** — Sprawdzić, że limit dotyczy wyłącznie potrzebnego hosta, ścieżki i metody; uwzględnić użytkowników za wspólnym NAT oraz IPv6.
- [ ] **D05 P1/W** — Powiązać diagnozę blokady z Security Events/Analytics i Ray ID; ustalić, która warstwa rzeczywiście odpowiada za 403/429.
- [ ] **D06 P1/W** — Osobno sprawdzić Bot Fight Mode, blokadę AI, AI Crawl Control, Browser Integrity Check, reguły WAF i Access; ustawienie „Allow” w jednym miejscu nie znosi pozostałych blokad.
- [ ] **D07 P1/W** — Przy Bot Fight Mode uwzględnić brak możliwości pominięcia go regułą WAF Skip. W razie kolizji z legalnym ruchem dobrać ochronę, zamiast dodawać nieskuteczne wyjątki.
- [ ] **D08 P1/W** — Nie włączać globalnej strony challenge dla publicznych treści, `robots.txt` i sitemap bez rozpoznanej potrzeby; sprawdzić wyszukiwarki, podglądy linków i monitoring.
- [ ] **D09 P1/W** — Wyjątki dla botów zawężać do publicznego odczytu i wiarygodnej identyfikacji; sam User-Agent nie daje prawa do ominięcia zabezpieczeń.
- [ ] **D10 P0/W** — Bot nie może omijać ochrony POST formularza ani uzyskać dostępu do sekretów dzięki regule przeznaczonej dla crawlera.
- [ ] **D11 P2/Z** — „Under Attack” traktować jako rozwiązanie czasowe na incydent, z warunkiem i terminem wyłączenia, nie jako stałą konfigurację SEO.
- [ ] **D12 P1/Z** — Sprawdzić limity reguł Free i wspólne limity Workers na koncie; zachować zapas i procedurę reakcji bez automatycznego zakupu planu.
- [ ] **D13 P1/W** — Po zmianach ochrony sprawdzić zwykłą przeglądarkę, narzędzia wyszukiwarki i legalną automatyzację na własnej domenie, nie wyłącznie na `pages.dev`.

## E Formularz kontaktowy

Wykonawca: agencja. Źródła: [walidacja Turnstile][cf12], [walidacja wejścia OWASP][sec04], [sekrety i środowiska Pages][cf13], [wdrożenie projektu](contact-form-2026-11-14.md).

- [x] **E01 P0/W** — Formularz jest opublikowany na `.pl` i ma skonfigurowany backend. Dowód: 14.11, E4; obecność potwierdzona także 15.11 w E1.
- [x] **E02 P0/W** — Rzeczywisty zatwierdzony test przez Cloudflare dotarł dokładnie raz do INBOX OVH; treść i Reply-To są poprawne. Dowód: 14.11, E3; test wykonano z podglądu.
- [ ] **E03 P1/W** — Przy odbiorze najnowszej wersji ponownie sprawdzić walidację po stronie serwera: typy danych, wymagane pola, długość, format i białe listy.
- [ ] **E04 P0/W** — Potwierdzić stałego odbiorcę i nadawcę, poprawny Reply-To oraz odporność na CRLF i wstrzyknięcie nagłówków/komend SMTP; brak otwartego relay i autorespondera do dowolnych adresów.
- [ ] **E05 P0/W** — Siteverify jest wywoływane na serwerze przed SMTP; weryfikować sukces, właściwy hostname i action, nie samą obecność tokena.
- [ ] **E06 P1/W** — Obsłużyć token wygasły i użyty ponownie, limit 5 minut oraz odświeżenie widgetu. Sam Turnstile nie jest gwarancją idempotencji równoległych operacji.
- [ ] **E07 P1/Z** — Potwierdzić honeypot bez utrudniania autofill, czytników i szybkiego wpisywania; nie odrzucać człowieka jedynie na podstawie czasu wypełnienia.
- [ ] **E08 P1/W** — Limitować rozmiar rzeczywiście czytanego body, nie tylko deklarowany Content-Length; poprawnie odrzucać złe typy i JSON.
- [ ] **E09 P1/W** — Sprawdzić politykę Origin/CORS i żądania z obcego hosta; ochrona przeglądarki nie zastępuje serwerowej walidacji antyspamowej.
- [ ] **E10 P1/W** — Timeouty Siteverify i SMTP są ograniczone; komunikat sukcesu pojawia się dopiero po potwierdzeniu przyjęcia wiadomości przez serwer SMTP.
- [ ] **E11 P1/W** — Przy niepewnym wyniku wysyłki brak automatycznego ponowienia; komunikat ostrzega o możliwym dostarczeniu i pozostawia dane do decyzji użytkownika.
- [ ] **E12 P1/W** — Sprawdzić blokadę podwójnego kliknięcia, zachowanie treści po błędzie, odpowiedź 429 także jako HTML i możliwość ponownej próby.
- [ ] **E13 P1/Z** — Ocenić potrzebę klucza idempotencji dla ponowionych/równoległych POST; ewentualną implementację dobrać do bezpłatnego budżetu i retencji bez treści wiadomości.
- [ ] **E14 P0/W** — Sekret SMTP i Turnstile są wyłącznie po stronie serwera; przegląd HTML, JS, logów i artefaktów nie ujawnia ich wartości.
- [ ] **E15 P1/Z** — Po testach ograniczyć podglądy przez Access lub wyłączyć realną wysyłkę; środowisko testowe nie powinno bez potrzeby korzystać z uprawnień produkcyjnej skrzynki.
- [ ] **E16 P1/W** — Sprawdzić wygodne komunikaty i dostępny kontakt e-mail/telefon przy wyłączonym JS, blokadzie widgetu lub awarii usługi.
- [ ] **E17 P1/W** — Zachować testy regresji i procedurę rotacji hasła: aktualizacja sekretu, publikacja i kontrola; kolejny test do klienta wymaga osobnego polecenia wysłania.

## F Poczta OVH i uwierzytelnianie domen

Wykonawca: agencja i właściciel. DNS edytujemy w Cloudflare; stan usługi i DKIM również w OVH. Źródła: [OVH SPF][ovh03], [OVH DKIM][ovh04], [aktualny DMARC RFC 9989][mail01], [SPF RFC 7208][mail02], [wytyczne Gmail][mail03].

- [x] **F01 P0/W** — MX `.pl` wskazują aktualne serwery OVH, niezależnie od WWW. Dowód: 15.11, E1.
- [ ] **F02 P0/W** — Potwierdzić wariant usługi, aktywność skrzynki, limity i odnowienie oraz zależności poczty od pakietu domeny/hostingu. Nie wyłączać pakietu zawierającego potrzebną pocztę ani nie kupować nowej usługi bez potrzeby.
- [ ] **F03 P1/W** — Spisać wszystkie legalne źródła wysyłki, klientów poczty, przekierowania i aliasy, zanim zmienimy SPF lub DMARC.
- [ ] **F04 P1/W** — Utrzymywać jeden poprawny SPF, z prawidłowym zakresem i limitem 10 mechanizmów/modyfikatorów powodujących odwołania DNS; stare home.pl usunąć dopiero po potwierdzeniu zakończenia jego użycia.
- [ ] **F05 P0/Z** — Opublikować poprawny jawny DMARC `.pl`, który nie wpada do starego wildcarda; rozpocząć od monitorowania legalnych nadawców i raportów, nie od niezweryfikowanego reject.
- [ ] **F06 P1/W** — Zweryfikować alignment domeny From z uwierzytelnionym SPF lub DKIM; samo występowanie rekordów i osobny wynik SPF pass nie wystarczają do DMARC pass.
- [ ] **F07 P1/Z** — Po analizie raportów i testach legalnego ruchu przejść z monitorowania do quarantine/reject; zapisać kryterium przejścia i wycofania.
- [ ] **F08 P1/W** — Stosować aktualny standard: RFC 9989 z maja 2026 wycofał tag `pct`. Nie opierać bezpieczeństwa wdrożenia na poradzie „ustaw pct=10”.
- [x] **F09 P1/W** — Oba CNAME selektorów DKIM OVH istnieją i są DNS-only. Dowód: 15.11, E1. To nie potwierdza jeszcze podpisu na każdej ścieżce wysyłki.
- [ ] **F10 P1/W** — Sprawdzić aktywację DKIM w OVH i podpis w wiadomości odebranej poza OVH; potwierdzić prawidłowe d= i alignment dla webmaila, aplikacji oraz formularza.
- [ ] **F11 P1/Z** — Wybrać odbiorcę agregatów DMARC i sposób ich przeglądu, najlepiej istniejący adres/filtr bez dodatkowej usługi; raporty forensyczne wymagają osobnej oceny prywatności.
- [ ] **F12 P0/W** — Klienci i formularz używają szyfrowanego SMTP oraz IMAP z walidacją certyfikatu; 2FA panelu OVH nie zabezpiecza automatycznie logowania IMAP/SMTP.
- [ ] **F13 P1/W** — Sprawdzić przekierowania, reguły i catch-all pod kątem nadużyć, wycieku i niezamierzonego odbioru; nie włączać catch-all jako uniwersalnej naprawy.
- [ ] **F14 P0/W** — Zachować komplet folderów, dat, załączników i kopię archiwum migracyjnego; porównanie liczby maili uzupełniać kontrolą zawartości/hashów.
- [ ] **F15 P1/Z** — Ustalić cykliczny backup poczty i sprawdzić odtworzenie wybranej wiadomości. Synchronizacja IMAP może propagować usunięcia i nie zastępuje backupu.
- [ ] **F16 P1/W** — Ustalić los starych selektorów i usług po analizie raportów; zachować je tak długo, jak są potrzebne legalnym wiadomościom i ich weryfikacji.
- [ ] **F17 P2/O** — Ocenić MTA-STS i TLS-RPT dla rzeczywistych MX OVH. Najpierw zgodność i tryb testowy; nie publikować enforce lub TLSA dla cudzych serwerów bez potwierdzenia obsługi. [MTA-STS][mail05], [TLS-RPT][mail06]
- [ ] **F18 P1/W** — Kontrola odbioru, wysyłki i odpowiedzi poza OVH, w tym nagłówków Gmail/Outlook; wysyłać wyłącznie po wymaganym upoważnieniu. Jeden test wewnątrz OVH nie zamyka tej kontroli.

## G Szybkość i wydajność

Wykonawca: agencja. Źródła: [Core Web Vitals][web01], [optymalizacja LCP][web02], [INP][web03], [fonty][web04], [obrazy responsywne][web05], [cache Pages][cf14], [Cache-Control MDN][web06].

- [ ] **G01 P1/Z** — Zapisać pomiary początkowe mobile i desktop, z wersją strony, urządzeniem, regionem, warunkami sieci i datą.
- [ ] **G02 P1/Z** — Oceniać terenowe CWV na 75. percentylu: LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1, oddzielnie mobile/desktop.
- [ ] **G03 P1/W** — Brak danych CrUX oznaczać jako brak danych; wyniku Lighthouse lub TBT nie przedstawiać jako potwierdzonego INP użytkowników.
- [ ] **G04 P1/Z** — Ustalić laboratoryjny budżet projektu, np. Lighthouse Performance ≥90 i brak regresji mediany z 3 porównywalnych przebiegów; to cel projektu, nie warunek indeksacji Google.
- [ ] **G05 P1/Z** — Zidentyfikować rzeczywisty element LCP; nie ładować go leniwie i zapewnić odkrywalność w początkowym HTML.
- [ ] **G06 P1/Z** — Nadać wysoki priorytet tylko krytycznemu obrazowi; preloadować wyłącznie faktycznie potrzebne warianty, bez podwójnego pobierania.
- [ ] **G07 P1/Z** — Przygotować właściwe rozmiary obrazów, `srcset`/`sizes` i nowoczesne formaty z zachowaniem jakości zaakceptowanych zdjęć.
- [ ] **G08 P1/Z** — Obrazy poza pierwszym ekranem ładować leniwie; rezerwować rozmiar przez width/height lub aspect-ratio, również dla widgetów.
- [ ] **G09 P1/Z** — Fonty lokalne WOFF2, tylko potrzebne odmiany i znaki polskie; sprawdzić licencję, fallback, `font-display` i przesunięcia układu.
- [ ] **G10 P1/Z** — Ograniczyć blokujące CSS/JS, rozmiar DOM, długie zadania i niepotrzebne animacje; menu i formularz mają reagować podczas ładowania.
- [ ] **G11 P1/Z** — Minifikacja i kompresja transferu działają na rzeczywistych odpowiedziach; nie utożsamiać samego włącznika w panelu z pomiarem.
- [ ] **G12 P1/Z** — Sprawdzić HTTP/2 i HTTP/3 oraz wynik dla odbiorców w Polsce; nie zmieniać infrastruktury na podstawie samego TTFB z jednego regionu.
- [ ] **G13 P1/W** — Zachować cache zoptymalizowany przez Pages; nie nakładać bez potrzeby Cache Everything lub długiego cache HTML w strefie.
- [ ] **G14 P1/W** — Długie `immutable` tylko dla wersjonowanych zasobów. Nowa treść zdjęcia/skryptu/fontu ma nowy adres, a reguły cache nie ignorują istotnego query string.
- [ ] **G15 P1/W** — Po publikacji porównać właściwą domenę z artefaktem, także z ciepłym cache; przeglądarka i CDN mają widzieć tę samą wersję.
- [ ] **G16 P1/Z** — Unikać podwójnego cache, zbędnego service workera i zasobów blokujących starsze lub nowe wdrożenie; purge nie ma zastępować wersjonowania.
- [ ] **G17 P1/Z** — Ustalić budżet transferu i zapytań na podstawie pomiaru obecnej strony; oddzielić ciężar zdjęć, fontów, widgetu i analityki. Nie ma uniwersalnego limitu KB gwarantującego SEO.
- [ ] **G18 P1/Z** — Nowe skrypty zewnętrzne ocenić pod kątem kosztu, prywatności i awarii; filmy/mapy osadzać na żądanie, jeżeli w ogóle są potrzebne.
- [ ] **G19 P2/O** — Rocket Loader, Early Hints i inne automaty optymalizacji testować osobno przed/po; zachować wyłącznie mierzalną korzyść bez błędów CSP/Turnstile.
- [ ] **G20 P1/Z** — Po zgodnym z prywatnością uruchomieniu RUM obserwować rzeczywistych użytkowników; wyniki narzędzi z jednego momentu nie zastępują trendu.
- [ ] **G21 P1/W** — Statyczne strony nie uruchamiają niepotrzebnie Functions; mierzyć osobno opóźnienie wysyłki formularza. Statyczny ruch i Functions mają inny model limitów. [Routing][cf15], [cena i limity][cf16]

## H Crawling indeksowanie i adresy URL

Wykonawca: agencja na kontach klienta. Źródła: [wymagania Google][seo01], [canonical][seo02], [sitemap][seo03], [Bing Webmaster Guidelines][seo04], [IndexNow][seo05], [podglądy Pages][cf17].

- [x] **H01 P1/W** — Publiczna strona kanoniczna zwraca 200 i nie ma HTTP/meta noindex. Dowód: 15.11, E1; nie przesądza to, czy Google już ją zaindeksował.
- [x] **H02 P1/Z** — Główny canonical wskazuje `https://przyjacielodyseusza.pl/`. Dowód: 15.11, E1.
- [x] **H03 P1/Z** — `robots.txt` i `sitemap.xml` są dostępne kodem 200. Dowód: 15.11, E1.
- [ ] **H04 P1/W** — Sprawdzić faktyczną treść robots na CDN: brak przypadkowego Disallow dla treści, zdjęć, CSS i JS; wykluczenie API nie służy ochronie sekretów.
- [ ] **H05 P1/W** — Strony do usunięcia z indeksu mają skuteczny noindex lub 404/410; samo Disallow może uniemożliwić zobaczenie noindex.
- [ ] **H06 P1/Z** — Sitemap zawiera tylko zamierzone canonicale 200, bez fragmentów, podglądów i przekierowań; lastmod odzwierciedla istotną zmianę. `priority` i `changefreq` nie dają przewagi w Google.
- [ ] **H07 P1/W** — Potwierdzić własność usług domenowych `.pl` i `.com` w Search Console, a dostępy agencji nadać oddzielnie; zachować wymagane tokeny DNS.
- [ ] **H08 P1/W** — Zgłosić sitemap i sprawdzić Live URL Inspection oraz renderowany HTML dla Googlebota; zachować wynik dostępu i wybrany canonical.
- [ ] **H09 P1/W** — Przejrzeć indeksację, Crawl Stats, ręczne działania i problemy bezpieczeństwa; zgłoszenie URL nie jest gwarancją indeksacji.
- [ ] **H10 P1/Z** — Skonfigurować Bing Webmaster Tools na koncie klienta, zweryfikować własność, sitemap i inspekcję URL.
- [ ] **H11 P2/Z** — Dla aktualizacji wdrożyć lub uruchamiać IndexNow z weryfikacją własności; zgłaszać rzeczywiste zmiany, nie codziennie całą niezmienioną stronę. Nie zastępuje to Google Search Console.
- [x] **H12 P1/W** — Techniczne adresy Pages i demonstrator GitHub mają noindex. Dowód: konkretne adresy w E1, 15.11; nie potwierdza to wszystkich historycznych podglądów.
- [ ] **H13 P1/Z** — Bazowy `project.pages.dev` przekierować na własną domenę albo świadomie utrzymać jego noindex; uwzględnić poprawny kontakt i nie objąć przypadkiem aktywnych podglądów. [Instrukcja Pages][cf18]
- [ ] **H14 P1/Z** — Ustalić los starego GitHub Pages: wyłączenie lub kontrolowany podgląd, z poprawnym komunikatem i brakiem pozornej wysyłki formularza.
- [ ] **H15 P1/W** — Przejrzeć stare preview, warianty B/C i artefakty; nie mogą stać się indeksowalną alternatywną stroną ani ujawniać danych.
- [x] **H16 P1/W** — Losowy nieistniejący URL zwraca rzeczywiste 404, nie 200 z główną stroną. Dowód: 15.11, E1.
- [ ] **H17 P1/Z** — Sprawdzić parametry UTM, wersje `/index.html`, ukośniki i wielkość liter; nie tworzyć nieograniczonej liczby indeksowanych kopii.
- [ ] **H18 P2/Z** — Przed rozbudową ustalić osobne URL dla rzeczywiście odrębnych usług/treści. Kotwice one-pagera nie zastępują osobnych podstron; nie tworzyć pustych stron dla każdej frazy.

## I Treść semantyka dane strukturalne i podglądy

Wykonawca: agencja, z akceptacją faktów przez klienta. Źródła: [Google structured data][seo06], [Google AI i treści][ai01], [Bing guidelines][seo04], [wizytówka firmy Google][seo07], [Open Graph][seo08].

- [ ] **I01 P1/W** — Ważna treść, oferta i kontakt występują w początkowym HTML jako tekst, również bez wykonywania JS.
- [ ] **I02 P1/Z** — Opisowy title, prawidłowy `lang=pl`, meta description i główny nagłówek; brak upychania fraz i obietnicy, że Google użyje dokładnie naszego opisu.
- [ ] **I03 P1/Z** — Zachować zrozumiałą hierarchię nagłówków i semantyczne main/nav/footer; jeden czytelny H1 jest konwencją projektu, nie magicznym czynnikiem rankingu.
- [ ] **I04 P1/W** — Fakty o Bartku, doświadczeniu, kwalifikacjach i firmie są aktualne i spójne z zaakceptowaną treścią.
- [ ] **I05 P1/Z** — JSON-LD Person, Organization i Service opisuje prawdziwą osobę i usługę; powiązać stabilnymi `@id`, bez fikcyjnych typów, ocen i medycznych deklaracji.
- [ ] **I06 P1/W** — Dane strukturalne zgadzają się z widoczną treścią, ceną i kontaktem. Sprawdzić Schema Validator oraz obsługiwane typy w Rich Results Test; brak rich result nie jest automatycznie błędem.
- [ ] **I07 P1/W** — Nie publikować przykładowych opinii jako prawdziwych ani oznaczeń aggregateRating bez podstawy. Zachować akceptację i prawa do zdjęć.
- [ ] **I08 P1/Z** — Open Graph i karta społecznościowa mają właściwy tytuł, opis, canonical i obraz; sprawdzić pobranie przez LinkedIn i komunikatory.
- [ ] **I09 P1/Z** — Favicon, logo i obrazy mają poprawne formaty, dostępne adresy i opisy; obraz promocyjny działa bez cookies i logowania.
- [ ] **I10 P2/Z** — Krótkie odpowiedzi na rzeczywiste pytania klientów dodać tylko tam, gdzie pomagają odbiorcy; nie obiecywać Google FAQ rich results. Aktualna dokumentacja wycofała tę funkcję. [Zmiany Google][seo09]
- [ ] **I11 P1/Z** — Spójna nazwa, usługa, telefon i domena na stronie oraz rzeczywistych profilach klienta; `sameAs` wyłącznie do autentycznych profili.
- [ ] **I12 P2/O** — Wizytówkę Google/Bing Places zakładać tylko przy spełnieniu zasad danej usługi; nie tworzyć fikcyjnego biura lub nieuprawnionej wizytówki działalności wyłącznie online.
- [ ] **I13 P2/O** — Materiały eksperckie i przypadki z praktyki rozwijać z klientem, z anonimizacją i zgodami; nie dodawać masowo wygenerowanych pozornych publikacji.
- [ ] **I14 P2/O** — Przy dodaniu filmów zapewnić dostępny odtwarzacz, napisy/transkrypcję i adekwatne metadane; nie wdrażać VideoObject do nieistniejącego filmu.

## J Widoczność w LLM i wyszukiwaniu AI

Wykonawca: agencja; decyzje o wykorzystaniu treści zatwierdza właściciel. Źródła: [aktualny przewodnik Google][ai01], [kontrola Google Search generative AI][ai02], [raport Google][ai03], [OpenAI crawlers][ai04], [Anthropic][ai05], [Perplexity][ai06], [Google crawlers][ai07].

- [ ] **J01 P1/W** — Zapisać niezależne cele: indeksacja klasyczna, cytowania/grounding, pobieranie na żądanie użytkownika i trening modeli. Dotychczasowe pozwolenie wszystkim botom nie jest dowodem, że wszystkie mają dostęp.
- [ ] **J02 P1/W** — Zapewnić dostęp Googlebot i Bingbot do publicznej treści; sprawdzać prawdziwe narzędzia inspekcji, a nie tylko podmieniony User-Agent.
- [ ] **J03 P1/Z** — Sprawdzić OAI-SearchBot: robots i warstwy CDN pozwalają na pobranie publicznych stron; GPTBot jest osobną decyzją dotyczącą treningu.
- [ ] **J04 P1/Z** — Sprawdzić Claude-SearchBot oraz Claude-User; decyzję o ClaudeBot zapisać osobno.
- [ ] **J05 P1/Z** — Sprawdzić PerplexityBot i żądania Perplexity-User; respektować udokumentowane różnice między crawlerem a pobraniem zleconym przez użytkownika.
- [ ] **J06 P1/W** — Gdy wyjątek sieciowy jest potrzebny, weryfikować aktualne oficjalne IP/reverse DNS lub rozpoznanie verified bot; nie utrzymywać przypadkowych list skopiowanych z forum.
- [ ] **J07 P1/W** — Uzgodnić robots, Cloudflare AI Crawl Control, Block AI Bots, Access i WAF; wyjątki tylko do publicznego odczytu, zgodnie z D06–D10.
- [ ] **J08 P1/W** — W Search Console sprawdzić Settings → Search generative AI, łącznie z dziedziczeniem właściwości. Dla celu widoczności strona ma pozostać włączona; według aktualnej dokumentacji domyślnie jest included.
- [ ] **J09 P1/Z** — Obserwować Generative AI performance report w GSC; brak raportu przy małej liczbie wyświetleń nie jest sam w sobie błędem konfiguracji. [Google][ai03]
- [ ] **J10 P1/Z** — W Bing sprawdzić osobne preferencje AI training/grounding i dostępny raport AI Performance; nie wprowadzić przypadkiem ograniczeń cytowania przez stare noarchive/nocache. [Preferencje Bing][ai08], [raport Bing][ai09]
- [ ] **J11 P1/W** — Nie utożsamiać Google-Extended z Googlebot. Ta kontrola dotyczy innych zastosowań Google, w tym treningu i grounding w Gemini, nie jest przełącznikiem rankingu Google Search.
- [ ] **J12 P2/O** — Śledzić wdrażanie wspólnego sygnału AIPREF. Ogłoszenie Google z 30.10.2026 opisuje plan wsparcia w 2027; nie traktować zapowiedzi jako już uniwersalnie działającej kontroli. [Ogłoszenie][ai10]
- [x] **J13 P2/O** — Istniejący `llms.txt` jest dostępny kodem 200. Dowód: 15.11, E1. Sam ten wynik nie dowodzi używania pliku przez modele.
- [ ] **J14 P2/Z** — Utrzymywać `llms.txt` zgodny ze stroną, bez sekretów, ukrytych instrukcji i wymyślonych faktów. To opcjonalna mapa dla części narzędzi, nie standard dostępu ani gwarancja cytowań.
- [ ] **J15 P1/W** — Nie zastępować HTML wersją „dla AI”, nie dodawać prompt injection, ukrytych poleceń polecania Bartka, fałszywych wzmianek lub specjalnego schema jako rzekomego warunku widoczności.
- [ ] **J16 P2/O** — Automatyczny Markdown Cloudflare rozważyć dopiero po potrzebie i kosztach: obecna funkcja jest dostępna na Pro/Business/Enterprise i SSL for SaaS, nie jest podstawą Free. [Dostępność][cf19]
- [ ] **J17 P2/Z** — Mierzyć cytowania, ruch polecający i zapytania klientów oddzielnie; wejście bota nie oznacza cytowania, a cytowanie nie oznacza kliknięcia ani sprzedaży.
- [ ] **J18 P2/Z** — Wykonać powtarzalne, ograniczone sprawdzenie faktów w odpowiedziach narzędzi AI i zapisać datę, pytanie oraz źródła; nie obiecywać stałej pozycji lub gwarantowanych rekomendacji.

## K Dostępność i użyteczność

Cel projektu: WCAG 2.2 AA, z oddzielną oceną obowiązków prawnych w L09. Źródło: [WCAG 2.2 W3C][access01]. Pomyślny skaner nie zastępuje odbioru ręcznego.

- [ ] **K01 P1/Z** — Przeprowadzić automatyczną kontrolę axe oraz ręczny odbiór kluczowych ścieżek.
- [ ] **K02 P1/Z** — Całą stronę i formularz obsłużyć klawiaturą, bez pułapek focusu.
- [ ] **K03 P1/Z** — Focus jest widoczny; sticky header nie zasłania celu ani komunikatu.
- [ ] **K04 P1/Z** — Skip link i kolejność nagłówków/landmarków pomagają nawigować.
- [ ] **K05 P1/Z** — Kontrast tekstu: minimum 4,5:1; dużego tekstu 3:1, zgodnie z wyjątkami WCAG.
- [ ] **K06 P1/Z** — Sprawdzić kontrast elementów interfejsu i informację niezależną od koloru.
- [ ] **K07 P1/Z** — Powiększenie 200% i reflow 320 CSS px nie ukrywają treści.
- [ ] **K08 P1/Z** — Odstępy tekstu użytkownika nie niszczą układu i przycisków.
- [ ] **K09 P1/Z** — Cele dotykowe spełniają 24×24 CSS px lub wyjątki/odstępy; preferować wygodniejsze 44×44.
- [ ] **K10 P1/Z** — Obrazy mają adekwatny alt; dekoracje są pomijane przez czytniki.
- [ ] **K11 P1/Z** — Pola mają etykiety, autocomplete, stan wymagania i zrozumiałe błędy.
- [ ] **K12 P1/Z** — Błąd/sukces formularza jest ogłaszany; walidacja nie usuwa wpisanych danych.
- [ ] **K13 P1/Z** — Weryfikacja antyspamowa ma dostępne zachowanie i alternatywny kanał kontaktu.
- [ ] **K14 P1/Z** — Uwzględnić reduced motion; unikać niekontrolowanych animacji i migania.
- [ ] **K15 P1/Z** — Przetestować NVDA lub VoiceOver, menu i formularz, nie tylko stronę główną.
- [ ] **K16 P1/Z** — Odbiór na fizycznym telefonie oraz głównych silnikach przeglądarek; zapisać ograniczenia.

## L Prywatność i obowiązki informacyjne

Wykonawca: agencja technicznie, właściciel jako administrator danych; treści prawne zatwierdza uprawniona osoba. Źródła: [UODO][priv01], [PKE art. 399][priv02], [CNIL o zgodach][priv03], [Google Consent Mode][priv04], [Polski Akt o Dostępności][priv05]. CNIL to uzupełniająca wskazówka regulatora UE, nie zastępstwo polskich przepisów.

- [ ] **L01 P0/W** — Zweryfikować aktualne dane administratora i zakres informacji przy formularzu oraz w polityce prywatności.
- [ ] **L02 P1/W** — Ustalić rzeczywiste cele i podstawy przetwarzania zapytań; nie wymuszać pozornej zgody marketingowej na odpowiedź na zwykły kontakt.
- [ ] **L03 P0/W** — Minimalizować dane: telefon opcjonalny, bez zbędnych pól i zachęty do przesyłania danych zdrowotnych lub poufnych informacji o pracownikach.
- [ ] **L04 P1/W** — Polityka obejmuje faktyczne role i dostawców: OVH, Cloudflare, Turnstile oraz tylko rzeczywiście uruchomioną analitykę.
- [ ] **L05 P1/W** — Zweryfikować właściwe umowy powierzenia, podwykonawców i ewentualne transfery poza EOG; nie zakładać, że CDN lub brak cookies oznaczają brak przetwarzania danych.
- [ ] **L06 P1/W** — Ustalić retencję zapytań, logów i backupów, uprawnienia oraz sposób realizacji żądania dostępu/usunięcia.
- [ ] **L07 P1/W** — Zmierzyć rzeczywiste cookies, localStorage i żądania zewnętrzne na świeżej sesji; ocena dotyczy tego, co faktycznie jest uruchomione.
- [ ] **L08 P1/W** — Jeżeli włączamy GA4 lub inne śledzenie wymagające zgody: blokować je do zgody, zapewnić równie łatwą odmowę i wycofanie. Consent Mode nie zastępuje uzyskania zgody.
- [ ] **L09 P1/W** — Ustalić zastosowanie PAD/EAA do konkretnej działalności i procesu zawierania umów, w tym wyjątek dla usług mikroprzedsiębiorców; nie deklarować obowiązku lub zwolnienia wyłącznie na podstawie wyglądu strony.
- [ ] **L10 P1/W** — Osobno uzgodnić marketing, newsletter i publikację referencji; samo zapytanie przez formularz nie uprawnia do dopisania do kampanii.
- [ ] **L11 P0/W** — Brak treści wiadomości, e-maili i telefonów w URL, analityce, publicznym monitoringu oraz logach błędów.
- [ ] **L12 P1/W** — Ustalić procedurę naruszenia i kontakt z właścicielem; informacje prawne muszą odzwierciedlać stan po wdrożeniu, nie wcześniejszy wariant bez formularza.

## M Pomiar skuteczności

Wykonawca: agencja na koncie klienta. Źródła: [Cloudflare Web Analytics][cf20], [Google Consent Mode][priv04], [raport Google AI][ai03], [raport Bing AI][ai09].

- [ ] **M01 P1/W** — Uporządkować aktualny zakres pomiaru: wcześniejszy plik `plan-pomiarowy.md` wyłączał GA4, a późniejsze ustalenia obejmowały analitykę. Nie uznawać samego istnienia starego dokumentu za zamknięcie obietnicy klientowi.
- [ ] **M02 P1/Z** — Zaplanować pomiar ruchu i wydajności przez bezpłatne narzędzia; ocenić konfigurację i prywatność również przy wariancie bez cookies.
- [ ] **M03 P1/W** — Jeżeli GA4 pozostaje w zakresie: własność klienta, prawidłowy strumień i domena, uprawnienia agencji, minimalna retencja i wyłączenie zbędnych funkcji reklamowych.
- [ ] **M04 P1/W** — Preferować podstawowy model zgód z blokadą tagów do decyzji; wariant advanced wysyła sygnały także przy denied i wymaga odrębnej świadomej oceny.
- [ ] **M05 P1/W** — Sprawdzić scenariusze brak zgody, odmowa, zgoda i wycofanie w sieci przeglądarki; nie polegać jedynie na wyglądzie banera.
- [ ] **M06 P1/Z** — Zdarzenia kontaktu: rozpoczęcie formularza, rzeczywisty sukces, błąd, tel i mailto; sukces liczony po potwierdzeniu backendu, nie po kliknięciu.
- [ ] **M07 P1/W** — Nie wysyłać wartości pól ani treści wiadomości jako parametrów; sprawdzić również automatyczne zbieranie danych i URL/referrery.
- [ ] **M08 P1/Z** — Oddzielić ruch testowy i podglądy; uniknąć podwójnego zliczania zdarzeń oraz liczenia demonstratora jako produkcji.
- [ ] **M09 P2/Z** — Uzgodnić UTM oraz zestaw miesięcznych miar: zapytania, kanał, błędy formularza i wydajność. Kliknięcie telefonu nie dowodzi rozmowy.
- [ ] **M10 P1/W** — Po zmianie analityki zaktualizować CSP i politykę prywatności oraz zmierzyć jej koszt wydajnościowy; narzędzia nie mogą zablokować podstawowego kontaktu.

## N Repozytorium publikacja backup i odtworzenie

Wykonawca: agencja. Źródła: [GitHub Actions security][sec05], [sekrety OWASP][sec03], [rollback Pages][cf21], [środowiska Pages][cf13].

- [ ] **N01 P1/W** — Zachować jednoznaczny związek kodu, commitu, artefaktu i wdrożenia produkcyjnego; repozytorium ma zawierać opublikowane zmiany, nie jedynie stary demonstrator.
- [ ] **N02 P1/Z** — Włączyć adekwatną ochronę gałęzi i review, zależnie od możliwości planu GitHub; publikacja nie pochodzi z nieprzejrzanego PR z sekretami.
- [ ] **N03 P1/W** — Zależności i runtime mają wspierane wersje oraz lockfile; aktualizacje bezpieczeństwa przechodzą właściwe testy zamiast ślepego `audit fix --force`.
- [ ] **N04 P1/Z** — Akcje CI przypinać do zaufanych pełnych SHA, ograniczyć GITHUB_TOKEN i nie uruchamiać niezaufanego kodu z uprawnieniami produkcyjnymi.
- [ ] **N05 P0/W** — Sekrety nie występują w Git, historii, paczce statycznej i logach; wykryty wyciek wymaga rotacji, nie tylko usunięcia bieżącego pliku.
- [ ] **N06 P1/W** — Oddzielić konfiguracje preview/production i zapisać je odtwarzalnie; publikacja nie może przypadkiem wyzerować wymaganych zmiennych ani podmienić hosta Turnstile.
- [ ] **N07 P1/W** — Przed publikacją: build, walidacja, adekwatne testy formularza/dostępności/SEO; po niej sprawdzenie rzeczywistej domeny i artefaktu.
- [ ] **N08 P1/W** — Zachować kopię kodu, zaakceptowanych zdjęć, DNS i reguł poza jednym kontem. Dla kopii DPAPI zapewnić odtwarzalność po utracie profilu Windows/komputera i bezpieczne przechowanie materiału odzyskiwania.
- [ ] **N09 P0/W** — Uzgodnić dopuszczalną utratę danych i czas odtworzenia (RPO/RTO); sprawdzić odtworzenie w świeżym środowisku podglądu, bez zmiany domeny i wysyłki do klienta. Same kopie nie zamykają punktu.
- [ ] **N10 P1/W** — Spisać rollback do poprawnej poprzedniej produkcji; nie jest to pełne odtworzenie DNS ani skrzynki, a zgodność sekretów trzeba sprawdzić osobno.
- [ ] **N11 P1/Z** — Alarm o awarii nie może zależeć wyłącznie od tej samej domeny i skrzynki; zapisać kontakty i podstawowe działania przy awarii Cloudflare/OVH.
- [ ] **N12 P1/W** — Odbiór zamknąć protokołem: aktywne usługi, dostęp, koszty, wykonane punkty, świadome wyjątki i obowiązki utrzymania.

## O Monitoring i utrzymanie

Wykonawca: uzgodniony opiekun techniczny i właściciel. Częstotliwości poniżej są propozycją dla skali projektu, nie ustawowym harmonogramem.

- [ ] **O01 P1/Z** — Bezpłatny monitoring WWW z zewnątrz: kod i rozpoznawalna treść, alarm po uzasadnionej liczbie błędów, bez publicznego ujawniania danych.
- [ ] **O02 P1/Z** — Monitorować błędy i limity formularza/Workers oraz pojemność skrzynki; nie wysyłać cyklicznych testów do klienta bez stałego upoważnienia.
- [ ] **O03 P1/Z** — Monitorować ważność certyfikatów, domen, odnowienia, stan DNSSEC i istotne zmiany DNS.
- [ ] **O04 P1/Z** — W początkowym okresie DMARC regularnie analizować raporty; później przegląd po zmianie nadawcy i według uzgodnionego harmonogramu.
- [ ] **O05 P1/Z** — Po zmianie reguł, DNS, sekretów, zdjęć i JS sprawdzić adekwatne funkcje; nie powtarzać niepotrzebnie całej macierzy bez zmiany lub problemu.
- [ ] **O06 P2/Z** — Miesięcznie przeglądać indeksację, błędy Google/Bing, ruch, zapytania i CWV; zachować porównywalne dane oraz informację o małej próbie.
- [ ] **O07 P1/Z** — Ustalić regularny przegląd dostępu i aktualizacji; częstotliwość zwiększać po incydencie lub istotnej zmianie.
- [ ] **O08 P1/Z** — Okresowo odtwarzać kopię oraz przeglądać terminy ważności tokenów, kluczy odzyskiwania i `security.txt`.
- [ ] **O09 P2/Z** — Co najmniej po istotnych zmianach platform sprawdzić crawlerów, preferencje AI, raporty i zmiany standardów; nie utrzymywać latami przypadkowych wyjątków IP.
- [ ] **O10 P1/W** — Prowadzić rejestr zmian i dowodów, z datą kolejnego przeglądu; wyjątki mają właściciela i termin rewizji.

## Opcje które nie są automatycznie potrzebne

| Opcja | Decyzja dla tej strony |
|---|---|
| Dodatkowy hosting WWW OVH, VPS, płatny WordPress | Brak potrzeby dla obecnej architektury; nie zamawiać jako „zabezpieczenia” strony na Pages. |
| Płatne plany Cloudflare, Bot Management, dodatkowe managed rules | Dopiero wykazana potrzeba i wycena. Podstawy tej checklisty nie wymagają automatycznego upgrade. |
| Cloudflare Markdown for Agents | Obecna dokumentacja wymienia plany płatne; opcja rozwojowa, nie wymóg indeksowania. |
| Argo/Smart Shield, płatna optymalizacja obrazów, pełne logi i monitoring | Nie przyjmować, że są bezpłatne. Najpierw pomiar ograniczenia, potem sprawdzenie oferty. |
| Płatna analiza DMARC, nowa skrzynka raportowa | Zacząć od istniejących możliwości i przeglądu raportów; nie tworzyć abonamentu bez uzgodnienia. |
| BIMI, certyfikat znaku VMC/CMC | Niski priorytet i możliwe koszty; nie zastępuje SPF/DKIM/DMARC ani reputacji nadawcy. |
| HSTS preload, restrykcyjne CAA, MTA-STS enforce | Możliwe po sprawdzeniu zależności; niewłaściwa konfiguracja może odciąć legalny ruch. |
| PWA, service worker, AMP, aplikacja mobilna, chatbot, wektorowa baza | Brak wykazanej potrzeby w tym serwisie. Nie są warunkami szybkości, indeksacji ani cytowania w AI. |
| Search Console, Bing Webmaster Tools, IndexNow | Bezpłatne narzędzia odkrywania i diagnostyki; nie kupuje się nimi gwarancji indeksowania. |
| GA4, CMP, RUM | Zakres według uzgodnień i zgodności z prywatnością; nie są obowiązkowymi trackerami na każdej stronie. |

## Wnioski z poradników dyskusji i filmów

Materiały społecznościowe wykorzystano jako źródło przypadków i pytań kontrolnych, nie jako normę bezpieczeństwa. Rozstrzygnięcia techniczne sprawdzono w dokumentacji producenta lub standardzie.

| Materiał | Co wnosi do checklisty | Ograniczenie |
|---|---|---|
| [Forum Cloudflare: nowa wersja na pages.dev, stara na domenie][forum01] | Kontrola dodatkowego cache i zgodności artefaktu na własnej domenie: G13–G15. | Stary, jednostkowy przypadek. Aktualne zasady cache bierze się z dokumentacji Pages. |
| [Forum Cloudflare: 403 dla crawlerów na własnej domenie][forum02] | Testować domenę klienta, wszystkie warstwy blokad oraz prawdziwe narzędzia inspekcji: D05–D13, J02/J07. | Nie potwierdza uniwersalnego błędu platformy. Rady o .htaccess nie pasują do Pages, a podrobiony UA nie weryfikuje bota. |
| [Forum OVH: rozbieżne informacje o DKIM MX Plan][forum03] | Sprawdzić konkretną usługę i rzeczywisty podpis, zamiast zakładać brak funkcji na podstawie pojedynczej opinii: F02/F10. | Obsługa zależy od platformy; decydują bieżąca dokumentacja i stan usługi. |
| [Badanie Ahrefs o llms.txt][study01] | Niski priorytet kosztowy pliku i odróżnienie pobrania od wykorzystania: J13–J18. | Badanie własnych 137 210 domen i ruchu z maja 2026, nie eksperyment dowodzący wpływu na ranking. W tej próbie 97% opublikowanych plików nie miało pobrań. |
| [Cloudflare TV: Observatory and Experiments][video01] | Pomiar przed/po, różne regiony, powtarzalny eksperyment: G01/G04/G20. | Analiza opublikowanej transkrypcji programu Speed Week 2023; bieżące metryki i plany potwierdzono osobno. |
| [Cloudflare TV: Where we’re going, we need speed][video02] | Dobry TTFB nie dowodzi dobrego LCP; ważne doświadczenie użytkownika i RUM. | Transkrypcja programu z 2023, nie aktualny cennik ani instrukcja panelu. |
| [Cloudflare TV: Security Week 2025][video03] | Widoczność zdarzeń i identyfikowanie rzeczywistej warstwy ochrony, zamiast włączania wszystkich przełączników. | Analiza transkrypcji, materiał producenta; dostępność funkcji sprawdzana w aktualnych dokumentach. |
| [CNIL: film o cookies wraz z transkrypcją][priv03] | Jasna informacja i łatwa odmowa, przed uruchomieniem niekoniecznego śledzenia: L07–L08. | Materiał francuskiego regulatora; dla Polski punktem prawnym jest PKE i RODO. |
| [Google Search News kwiecień 2026][video04] | Dodatkowy kierunek: weryfikacja stron tworzonych z AI, crawling i Search Console. | Przejrzano opis i odsyłacze od autora; nie traktowano samego opisu jako obejrzanego filmu lub pełnej transkrypcji. |

### Ustalenia które szczególnie łatwo przeoczyć

1. Google ma obecnie ustawienie **Search generative AI** i raport AI w Search Console; dokumentacja podaje globalne wdrożenie 31.08.2026. Dostęp do raportu zależy także od liczby wyświetleń. [Ustawienie][ai02], [raport][ai03]
2. W maju 2026 **RFC 9989 zastąpił RFC 7489**; dawna instrukcja stopniowania przez `pct` nie jest aktualnym standardem. Politykę zaostrza się po analizie legalnej poczty. [RFC 9989][mail01]
3. Google Search nie używa `llms.txt` jako czynnika widoczności. Utrzymywanie istniejącego pliku dla innych narzędzi jest dopuszczalne, ale nie zamyka prac nad AI. [Google][ai01]
4. Bezpłatny **Bot Fight Mode nie ma wyjątków WAF Skip**, a „Allow” w AI Crawl Control nie usuwa wcześniejszych blokad. [Bot Fight Mode][cf09], [AI Crawl Control i WAF][cf22]
5. **Noindex nie jest ochroną dostępu**, obecność DKIM w DNS nie dowodzi podpisywania, a **backup nie jest sprawdzony bez odtworzenia**. To odrębne kryteria odbioru, nie zielone znaczniki z jednego skanera.

## Dowody i źródła

Źródła sprawdzano 15.11.2026. Procedury producentów i dostępność planów należy zweryfikować ponownie w dniu wykonania zmiany. Źródła techniczne poniżej są dokumentacją autorów, standardami lub badaniem pierwszej ręki. Opinie i filmy są jawnie oznaczone wyżej. Nie stawiamy znaku równości między deklaracją producenta a gwarancją indeksacji, cytowania lub dostarczalności.

### Dowody projektu

- **E1:** odczyt Cloudflare, HTTP i publicznego DNS z 15.11 — `outputs/technical-research-2026-11-15/read-only-snapshot.json`.
- **E2:** publiczne TXT/SPF/DMARC — `outputs/technical-research-2026-11-15/mail-dns-proof.json`.
- **E3/E4:** `outputs/contact-form-2026-11-14/form-delivery-proof.json` i `production-proof.json`.
- **E5:** `outputs/contact-form-2026-11-14/rate-limit-live-proof.json`.
- **E6:** poprzedni status abonenta — `outputs/migration-ovh-2026-11-14/migration-state.json`; wymaga świeżego odczytu do zamknięcia A02.

### Dokumentacja i standardy

- [Cloudflare 2FA i odzyskiwanie][cf01]; [tokeny API i zakres uprawnień][cf02].
- [DNSSEC Cloudflare][cf03]; [domeny Pages i CAA][cf04]; [minimum TLS][cf05]; [HSTS][cf06].
- [Nagłówki Pages i ograniczenia Functions][cf07]; [plany WAF][cf08]; [Bot Fight Mode][cf09].
- [AI Crawl Control][cf10]; [verified bots][cf11]; [server-side Turnstile][cf12]; [sekrety Pages][cf13].
- [Cache i serving Pages][cf14]; [routing Functions][cf15]; [cena Functions][cf16]; [limity Pages][cf23].
- [Podglądy i Access][cf17]; [przekierowanie pages.dev][cf18]; [Markdown for Agents i dostępność][cf19].
- [Cloudflare Web Analytics][cf20]; [rollback Pages][cf21]; [AI Crawl Control i WAF][cf22].
- [OVH 2FA][ovh01]; [OVH DNSSEC dla zewnętrznych NS][ovh02]; [OVH SPF][ovh03]; [OVH DKIM][ovh04]; [OVH odnowienia][ovh05]; [OVH rekordy DNS][ovh06].
- [DMARC RFC 9989][mail01]; [SPF RFC 7208][mail02]; [Gmail sender guidelines][mail03]; [Null MX RFC 7505][mail04]; [MTA-STS RFC 8461][mail05]; [TLS-RPT RFC 8460][mail06].
- [OWASP HTTP Headers][sec01]; [OWASP CSP][sec02]; [OWASP Secrets Management][sec03]; [OWASP Input Validation][sec04]; [GitHub Actions secure use][sec05]; [security.txt RFC 9116][sec06].
- [Web Vitals][web01]; [LCP][web02]; [INP][web03]; [fonty][web04]; [obrazy responsywne][web05]; [Cache-Control][web06].
- [Google Search technical requirements][seo01]; [canonical][seo02]; [sitemap][seo03]; [Bing guidelines][seo04]; [IndexNow][seo05].
- [Google structured data guidelines][seo06]; [zasady Google Business Profile][seo07]; [Open Graph protocol][seo08]; [zmiany dokumentacji Google][seo09].
- [Google AI optimization guide][ai01]; [GSC Search generative AI control][ai02]; [GSC raport AI][ai03].
- [OpenAI crawlers][ai04]; [Anthropic crawlers][ai05]; [Perplexity crawlers][ai06]; [Google crawlers i Google-Extended][ai07].
- [Bing AI preferences][ai08]; [Bing AI Performance][ai09]; [zapowiedź wspólnego sygnału AI training][ai10].
- [WCAG 2.2 W3C][access01]; [UODO][priv01]; [Prawo komunikacji elektronicznej][priv02]; [CNIL zgody i transkrypcja filmu][priv03]; [Google Consent Mode][priv04]; [PAD i wyjątki][priv05].

[e1]: C:/Projekty/Przyjaciel-Odyseusza/outputs/technical-research-2026-11-15/read-only-snapshot.json
[e2]: C:/Projekty/Przyjaciel-Odyseusza/outputs/technical-research-2026-11-15/mail-dns-proof.json
[e3]: C:/Projekty/Przyjaciel-Odyseusza/outputs/contact-form-2026-11-14/form-delivery-proof.json
[e4]: C:/Projekty/Przyjaciel-Odyseusza/outputs/contact-form-2026-11-14/production-proof.json
[e5]: C:/Projekty/Przyjaciel-Odyseusza/outputs/contact-form-2026-11-14/rate-limit-live-proof.json
[cf01]: https://developers.cloudflare.com/fundamentals/user-profiles/2fa/
[cf02]: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
[cf03]: https://developers.cloudflare.com/dns/dnssec/
[cf04]: https://developers.cloudflare.com/pages/configuration/custom-domains/
[cf05]: https://developers.cloudflare.com/ssl/edge-certificates/additional-options/minimum-tls/
[cf06]: https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/
[cf07]: https://developers.cloudflare.com/pages/configuration/headers/
[cf08]: https://developers.cloudflare.com/waf/managed-rules/
[cf09]: https://developers.cloudflare.com/bots/get-started/bot-fight-mode/
[cf10]: https://developers.cloudflare.com/ai-crawl-control/
[cf11]: https://developers.cloudflare.com/bots/concepts/bot/verified-bots/
[cf12]: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
[cf13]: https://developers.cloudflare.com/pages/functions/bindings/
[cf14]: https://developers.cloudflare.com/pages/configuration/serving-pages/
[cf15]: https://developers.cloudflare.com/pages/functions/routing/
[cf16]: https://developers.cloudflare.com/pages/functions/pricing/
[cf17]: https://developers.cloudflare.com/pages/configuration/preview-deployments/
[cf18]: https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/
[cf19]: https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
[cf20]: https://developers.cloudflare.com/web-analytics/about/
[cf21]: https://developers.cloudflare.com/pages/configuration/rollbacks/
[cf22]: https://developers.cloudflare.com/ai-crawl-control/configuration/ai-crawl-control-with-waf/
[cf23]: https://developers.cloudflare.com/pages/platform/limits/
[ovh01]: https://docs.ovhcloud.com/en/guides/account-and-service-management/account-information/secure-ovhcloud-account-with-2fa
[ovh02]: https://docs.ovhcloud.com/en/guides/web-cloud/domains/dns-dnssec
[ovh03]: https://docs.ovhcloud.com/en/guides/web-cloud/domains/dns-zone-spf
[ovh04]: https://docs.ovhcloud.com/en/guides/web-cloud/domains/dns-zone-dkim
[ovh05]: https://docs.ovhcloud.com/en/guides/web-cloud/domains/autorenew-domain-name
[ovh06]: https://docs.ovhcloud.com/en/guides/web-cloud/domains/dns-zone-records
[mail01]: https://www.rfc-editor.org/rfc/rfc9989.html
[mail02]: https://www.rfc-editor.org/rfc/rfc7208.html
[mail03]: https://support.google.com/mail/answer/81126?hl=en
[mail04]: https://www.rfc-editor.org/rfc/rfc7505.html
[mail05]: https://www.rfc-editor.org/rfc/rfc8461.html
[mail06]: https://www.rfc-editor.org/rfc/rfc8460.html
[sec01]: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
[sec02]: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
[sec03]: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
[sec04]: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
[sec05]: https://docs.github.com/en/actions/reference/security/secure-use
[sec06]: https://www.rfc-editor.org/rfc/rfc9116.html
[web01]: https://web.dev/articles/vitals
[web02]: https://web.dev/articles/optimize-lcp
[web03]: https://web.dev/articles/optimize-inp
[web04]: https://web.dev/articles/font-best-practices
[web05]: https://web.dev/learn/design/responsive-images
[web06]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
[seo01]: https://developers.google.com/search/docs/essentials/technical
[seo02]: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
[seo03]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
[seo04]: https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a
[seo05]: https://www.bing.com/indexnow/getstarted
[seo06]: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
[seo07]: https://support.google.com/business/answer/3038177?hl=en
[seo08]: https://ogp.me/
[seo09]: https://developers.google.com/search/updates
[ai01]: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
[ai02]: https://support.google.com/webmasters/answer/16908024?hl=en
[ai03]: https://support.google.com/webmasters/answer/16984139?hl=en
[ai04]: https://developers.openai.com/api/docs/bots
[ai05]: https://privacy.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
[ai06]: https://docs.perplexity.ai/docs/resources/perplexity-crawlers
[ai07]: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
[ai08]: https://www.bing.com/webmasters/help/new-ai-preferences-2t1cc16d
[ai09]: https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/
[ai10]: https://developers.google.com/search/blog/2026/10/ai-training-control
[access01]: https://www.w3.org/TR/WCAG22/
[priv01]: https://uodo.gov.pl/pl/645/4097
[priv02]: https://cik.uke.gov.pl/gfx/cik/userfiles/_public/ustawa_prawo_komunikacji_elektronicznej_z_12_lipca_2024_r.pdf
[priv03]: https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/quels-changements-pour-les-internautes
[priv04]: https://developers.google.com/tag-platform/security/concepts/consent-mode
[priv05]: https://www.gov.pl/web/dostepnosc-cyfrowa/polski-akt-o-dostepnosci--uslugi-handlu-elektronicznego
[forum01]: https://www.reddit.com/r/CloudFlare/comments/zvb2sr/site_updates_deploying_on_pagedev_site_but_not_on/
[forum02]: https://www.reddit.com/r/CloudFlare/comments/1rpa2fb/cloudflare_pages_custom_domain_returns_403_to_ai/
[forum03]: https://www.reddit.com/r/OVHcloud/comments/1qdywcs/ovh_told_me_that_mx_plan_dont_offer_dkim_even_tho/
[study01]: https://ahrefs.com/blog/llmstxt-study/
[video01]: https://cloudflare.tv/shows/speed-week/speed-week-spotlight-observatory-experiments/0ZJNjo5Z
[video02]: https://cloudflare.tv/this-week-in-net/cloudflare-s-speed-week-where-we-re-going-we-need-speed/DvNRkAvw
[video03]: https://cloudflare.tv/this-week-in-net/all-about-security-week-2025/RglMbk5v
[video04]: https://www.youtube.com/watch?v=hBUuXgR-PSw
