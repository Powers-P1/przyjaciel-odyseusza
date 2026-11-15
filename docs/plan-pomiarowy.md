# Plan pomiarowy — Przyjaciel Odyseusza

Aktualizacja 15.11.2026. Późniejsze ustalenia z klientem obejmują GA4; wcześniejsze wyłączenie GA4 w tym dokumencie nie zamyka tego zobowiązania.

## Stan i uruchomienie

Obecnie identyfikator w `config/analytics.json` jest pusty: **brak tagu Google, banera i żądań analitycznych**. Gotowy moduł jest włączany tylko przez niepusty identyfikator rzeczywistego strumienia GA4 w produkcyjnym buildzie. Sam plik JS nie inicjuje pomiaru na podglądach, GitHub Pages lub obcych hostach.

Przed wpisaniem identyfikatora trzeba utworzyć/skonfigurować usługę na koncie klienta. Agencja ma własny delegowany dostęp; własność klienta nie może zależeć od wspólnego hasła.

- Domena strumienia: `https://przyjacielodyseusza.pl`; strefa czasu Warszawa, waluta PLN.
- Retencja zdarzeń i użytkowników: 2 miesiące. To nie określa retencji raportów zbiorczych.
- Google Signals, zbieranie danych przekazanych przez użytkowników, funkcje reklamowe, łączenie z Ads i zbędne udostępnianie danych wyłączone.
- Enhanced Measurement wyłączone, w szczególności automatyczne zdarzenia formularzy i historii. Mierzymy własne zdarzenia po faktycznym wyniku backendu.
- Sprawdzić warunki i aneks przetwarzania danych na koncie właściciela, redakcję adresów e-mail i parametrów URL oraz uprawnienia.
- Po ustawieniu identyfikatora build dodaje jednocześnie interfejs zgody, odpowiednią informację w polityce prywatności i wąskie wyjątki CSP dla GA4 bez reklam.
- Odbiór na prawdziwym strumieniu: sieć przed wyborem, po odmowie, po zgodzie, po wycofaniu i po odświeżeniu; DebugView/Realtime i brak podwójnych zdarzeń. Test z atrapą biblioteki Google nie zastępuje tego odbioru.

## Zgoda i prywatność

Basic Consent Mode: biblioteka Google i kolejka jej zdarzeń powstają dopiero po zgodzie. Brak wyboru i odmowa nie przekazują Google nawet sygnału odmowy. Odrzucenie i zgoda są równie dostępne, także z klawiatury. Escape nie włącza pomiaru. Politykę prywatności można przeczytać bez podejmowania decyzji.

„Ustawienia prywatności” w stopce pozwalają wycofać zgodę. Oficjalna flaga `ga-disable` zatrzymuje wysyłanie i zapis cookies; usuwamy wyłącznie cookies `_ga`/`_ga_*`. Formularz zachowuje wpisaną treść, strona nie przeładowuje się. Preferencja trwa 180 dni, cookies GA maksymalnie 60 dni bez automatycznego przedłużania. W przeglądarce bez obsługi interfejsu zgody pomiar pozostaje wyłączony.

Zmiana preferencji jest synchronizowana z innymi otwartymi kartami tej domeny. Cofnięcie lub usunięcie zapisanej preferencji zatrzymuje tam pomiar bez utraty wiadomości i dodatkowego sygnału denied. Test dwóch otwartych kart jednej sesji używa atrapy biblioteki Google; przed uruchomieniem nadal wymagany jest odbiór prawdziwego strumienia i ruchu sieciowego.

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

Źródła: [Basic Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode), [flaga wyłączenia GA](https://developers.google.com/tag-platform/security/guides/privacy), [cookies](https://developers.google.com/tag-platform/security/guides/customize-cookies), [CSP bez reklam](https://developers.google.com/tag-platform/security/guides/csp).
