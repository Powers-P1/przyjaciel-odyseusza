# Plan pomiarowy — Przyjaciel Odyseusza

Aktualizacja 15.11.2026. Późniejsze ustalenia z klientem obejmują GA4; wcześniejsze wyłączenie GA4 w tym dokumencie nie zamyka tego zobowiązania.

## Stan i uruchomienie

Produkcyjny build używa strumienia **G-G9DCMYPSKQ**, usługa **564407819**, osobne konto **416367370** klienta BFP. Moduł działa wyłącznie na kanonicznym hoście produkcyjnym. Podglądy, GitHub Pages i obce hosty nie uruchamiają pomiaru. Pusty identyfikator w `config/analytics.json` pozostaje wyłącznikiem awaryjnym na następny build.

Klient i konto agencyjne Oliwii mają Administratora konta, dziedziczonego przez usługę. Oliwia zachowuje Administratora do faktycznego przekazania i sprawdzenia dostępu klienta. Agencja nie ma dostępu do Gmail klienta. Po odbiorze należy ograniczyć jej rolę, zapewniwszy wcześniej możliwość zarządzania klientowi. Nie korzystamy ze wspólnego hasła Google. Warunki dla Polski i aneks przetwarzania danych zaakceptowano za wyraźną zgodą Damiana 15.11.2026. Wcześniejszy zasób 416332137/564373201 pozostaje klientowi: nie jest usunięty, nie przeniesiono z niego historii i nie stanowi aktywnej konfiguracji tej strony. Inne konto agencyjne nie ma roli w poprawnym koncie.

- Domena strumienia: `https://przyjacielodyseusza.pl`; strefa czasu Warszawa, waluta PLN.
- Retencja zdarzeń i użytkowników: 2 miesiące; reset retencji po aktywności wyłączony. To nie określa retencji raportów zbiorczych.
- Google Signals, zbieranie danych przekazanych przez użytkowników, funkcje reklamowe, łączenie z Ads i zbędne udostępnianie danych wyłączone.
- Enhanced Measurement wyłączone, w szczególności automatyczne zdarzenia formularzy i historii. Mierzymy własne zdarzenia po faktycznym wyniku backendu.
- Redakcja adresów e-mail i 15 kluczy URL włączona jako dodatkowa ochrona. Szczegółowe dane lokalizacji/urządzenia i wszystkie cztery dodatkowe opcje udostępniania konta wyłączone.
- Po ustawieniu identyfikatora build dodaje jednocześnie interfejs zgody, odpowiednią informację w polityce prywatności i wąskie wyjątki CSP dla GA4 bez reklam.
- Filtr **VERTIQ_debug_QA** aktywny za wyraźną zgodą: wyklucza przyszłe zdarzenia oznaczone `debug_mode`/`debug_event`. Normalni odwiedzający nie otrzymują tego znacznika. Filtr nie zmienia historycznych raportów.
- Odbiór prawdziwej biblioteki Google i endpointów kolekcji: brak wyboru, odmowa, zgoda, wycofanie w dwóch kartach oraz odświeżenie. Dowody dla artefaktu i po publikacji przechowywane oddzielnie. Odpowiedź HTTP 204 nie zastępuje sprawdzenia raportu/DebugView; stan tego odbioru zapisujemy w protokole wykonania.

Nowy ujednolicony tag Google inicjuje cel przed powtórzonym `config`. Ustawienia prywatności są więc przekazywane globalnym `gtag('set', ...)` **przed** aktualizacją zgody, `js` i pobraniem biblioteki: brak automatycznego page_view, bezpieczny URL/referrer, brak reklam/Signals i ograniczenia cookies. Utrzymany `config` zawiera te same wartości. Samodzielne ustawienie ich wyłącznie w `config` nie wystarczało w rzeczywistym teście.

W automatycznie utworzonym kontenerze Google **GTM-K74JRKZ2**, wersja **2**, wyłączono sześć automatycznych kategorii zdarzeń i zbieranie danych przekazanych przez użytkownika. Zmiana ustawień Google może zmienić zachowanie bez nowego commita strony, dlatego podlega osobnej kontroli i ponownemu testowi prywatności.

## Zgoda i prywatność

Basic Consent Mode: biblioteka Google i kolejka jej zdarzeń powstają dopiero po zgodzie. Brak wyboru i odmowa nie przekazują Google nawet sygnału odmowy. Odrzucenie i zgoda są równie dostępne, także z klawiatury. Escape nie włącza pomiaru. Politykę prywatności można przeczytać bez podejmowania decyzji.

„Ustawienia prywatności” w stopce pozwalają wycofać zgodę. Oficjalna flaga `ga-disable` zatrzymuje wysyłanie i zapis cookies; usuwamy wyłącznie cookies `_ga`/`_ga_*`. Formularz zachowuje wpisaną treść, strona nie przeładowuje się. Preferencja trwa 180 dni. Cookies GA mają `Secure`, `SameSite=Lax` i ważność do 60 dni od utworzenia/aktualizacji. Termin identyfikatora `_ga` nie jest przedłużany przy kolejnej wizycie; `_ga_*` przechowuje aktualizowany stan sesji, więc jego termin może się zmieniać. W przeglądarce bez obsługi interfejsu zgody pomiar pozostaje wyłączony.

Zmiana preferencji jest synchronizowana z innymi otwartymi kartami tej domeny. Cofnięcie lub usunięcie zapisanej preferencji zatrzymuje tam pomiar bez utraty wiadomości i dodatkowego sygnału denied. Oprócz testów z atrapą biblioteki sprawdzono dwie karty z prawdziwą biblioteką Google: cookies usunięte, brak kolejnych żądań i zachowana treść formularza.

Adres strony przekazywany do GA zawiera tylko znaną ścieżkę, bez query i hash; nieznane ścieżki mają stałą etykietę `/404`. Referrer ograniczamy do originu. Parametry zdarzeń mają białe listy. Nie przekazujemy nazwisk, e-maili, telefonów, treści wiadomości ani etykiet z dowolnego wejścia użytkownika. Nie ma dopisywania do marketingu na podstawie zapytania.

## Zdarzenia biznesowe

`main.js` emituje lokalne `po:event`; moduł pomiarowy odbiera je dopiero po zgodzie. Wcześniejsze zdarzenia nie są odtwarzane do Google po późniejszej zgodzie.

| Zdarzenie | Wyzwalacz | Dozwolone parametry | Znaczenie |
|---|---|---|---|
| `page_view` | Po zgodzie i wejściu na stronę | bezpieczny URL/referrer/title | odwiedziny |
| `cta_click` | Zwykły przycisk wezwania do kontaktu | stałe miejsce sekcji | interakcja, bez przycisków zgody |
| `form_start` | Pierwsza interakcja z formularzem | bez wartości pól | rozpoczęcie |
| `form_submit_success` | Backend potwierdził przyjęcie maila | firma/ja/brak | główne zdarzenie kontaktu |
| `form_submit_error` | Potwierdzony błąd/timeout | znany kod kategorii | diagnostyka |
| `tel_click` / `mailto_click` | Kliknięcie linku kontaktowego | stałe miejsce sekcji | pomocniczy sygnał; nie dowodzi rozmowy/wysłania |

Nie ma automatycznego `form_submit` liczonego po kliknięciu. Podglądy nie ładują pomiaru Google. Obecny brak danych CrUX lub niedostępność publicznego PSI nie dowodzi dobrych albo złych wyników użytkowników; wyniki Lighthouse opisujemy osobno jako laboratoryjne.

W testach analityki prawdziwa biblioteka i kolektor Google są aktywne, ale Turnstile i odpowiedzi formularza są atrapami wyłącznie we własnej przeglądarce QA: **zero nowych maili do klienta**. Rzeczywiste dostarczenie formularza sprawdzono wcześniej odrębnym autoryzowanym testem. Weryfikujemy także brak pól formularza, testowego e-maila i jego SHA256 w żądaniach Google.

Źródła: [Basic Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode), [flaga wyłączenia GA](https://developers.google.com/tag-platform/security/guides/privacy), [cookies](https://developers.google.com/tag-platform/security/guides/customize-cookies), [CSP bez reklam](https://developers.google.com/tag-platform/security/guides/csp).
