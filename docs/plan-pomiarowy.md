# Plan pomiarowy – przyjacielodyseusza.pl

Cel biznesowy strony: **zapytania o współpracę** (formularz, telefon, e-mail) od dwóch grup: firm szukających mentora dla menedżera oraz menedżerów zgłaszających się samodzielnie.

## Decyzja architektoniczna (privacy-first)

- Strona nie ustawia cookies i nie ładuje trackerów. Dzięki temu nie potrzebuje banera zgód (CMP).
- Rekomendowane narzędzie: **Cloudflare Web Analytics** (bez cookies, bez fingerprintingu, darmowe, nie wymaga zgody). Włączenie: Cloudflare Dashboard → Web Analytics → Add site → wklejenie tokena w `index.html` (jedna linia `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "..."}'>`) oraz dopisanie `https://static.cloudflareinsights.com` do `script-src` i `connect-src` w `public/_headers`.
- GA4 / GTM / Clarity: **świadomie nie wdrażamy**. Wymagałyby CMP i zgody, a skala projektu (one-pager, kilkanaście leadów miesięcznie) tego nie uzasadnia. Decyzję można zmienić, gdy klient zacznie prowadzić kampanie płatne.

## Zdarzenia (wbudowane w `main.js`)

Strona emituje zdarzenia niezależnie od narzędzia: `window.dispatchEvent(new CustomEvent('po:event', {detail}))` oraz `window.dataLayer.push(detail)`, jeśli `dataLayer` istnieje. Każde narzędzie analityczne może je podchwycić bez zmian w kodzie strony.

| Zdarzenie | Kiedy | Parametry | Konwersja |
|-----------|-------|-----------|-----------|
| `cta_click` | kliknięcie przycisku „Porozmawiajmy” / „Kontakt” / „Poznaj ofertę” | `label`, `location` (hero, nav, sytuacje…) | nie |
| `form_start` | pierwsza interakcja z polem formularza | – | nie |
| `form_submit_success` | backend potwierdził wysyłkę (odpowiedź 200 ok:true) | `subject_for` (firma / ja / brak) | **tak** |
| `form_submit_error` | backend zwrócił błąd lub brak połączenia | `error` | nie |
| `tel_click` | kliknięcie linku `tel:` | `location` | **tak** |
| `mailto_click` | kliknięcie linku `mailto:` | `location` | tak (pomocnicza) |

Zasady: sukces formularza liczymy tylko po potwierdzeniu przez backend, nie po kliknięciu „Wyślij”. Zdarzenia nie zawierają danych osobowych (żadnych wartości pól).

## UTM

Jeśli strona będzie promowana (LinkedIn, mailing), stosujemy: `utm_source` (linkedin, newsletter, wizytowka), `utm_medium` (social, email, qr), `utm_campaign` (nazwa-akcji-rrrr-mm). Małe litery, myślniki. Parametry nie są przechowywane po stronie strony; atrybucję robi narzędzie analityczne.

## Ruch testowy

Przed publikacją analityka nie jest włączona, więc testy nie zanieczyszczają danych. Po włączeniu Cloudflare Web Analytics: podgląd `*.pages.dev` nie ma tokena, więc nie raportuje.
