# Formularz kontaktowy — 14 listopada 2026

Na polecenie Damiana przygotowano uruchomienie formularza w istniejącym układzie strony.
Kontakt telefoniczny i mailowy pozostaje dostępny. Pierwszy wariant bez formularza z 03.11
jest historycznym etapem wdrożenia, opisanym w `deployment-2026-11-03.md`.

## Konfiguracja

- Cloudflare Pages Free: projekt `przyjaciel-odyseusza`, konto klienta `d0fb95ca8a9f9289c4a92685b8c6af28`.
- Endpoint: `/api/contact`, jedyna ścieżka uruchamiająca Pages Function w produkcji.
- SMTP: istniejąca skrzynka `bartek@przyjacielodyseusza.pl`, TLS na `smtp.mail.ovh.net:465`.
- Nadawca i odbiorca są stałe; `Reply-To` wskazuje zweryfikowany składniowo adres osoby piszącej.
- Turnstile Managed: publiczny sitekey jest w HTML; sekret i hasło SMTP są wyłącznie w sekretach Pages.
- Zmienne publiczne są w `wrangler.toml`, aby kolejne publikacje nie kasowały ich w podglądzie.
- Podgląd integracyjny: https://contact-form.przyjaciel-odyseusza.pages.dev/#kontakt.
- GitHub Pages nadal ma demonstrator bez wysyłki; nie dostaje sekretów ani aktywnego widgetu.
- Dodatkowy koszt: 0 PLN. Nie dodano konta Resend ani płatnego planu Cloudflare.
- Migracja poczty i MX pozostają zachowane; formularz używa dotychczasowego OVH SMTP.
- Reguła Cloudflare Free: 10 POST na `/api/contact` na IP w 10 s, blokada na 10 s.

## Weryfikacja

- 15 testów Node: parser SMTP, fragmentowane odpowiedzi, TLS, stały odbiorca, kodowanie UTF-8,
  odrzucenia SMTP, timeout, limity danych, Origin, host/akcja Turnstile i odrzucony token.
- 59 testów Chromium/mobile Chrome: formularz, dostępność axe, klawiatura, zachowanie treści
  po błędzie, blokada podwójnego submit, odświeżenie tokena i układ sekcji (3 pominięte).
- Po poprawce asynchronicznego ładowania Turnstile i obsługi 429: 18 testów formularza, 2 pominięte.
- Build produkcyjny i walidacja HTML/CSS/CSP/typografii poprawne.
- Żywy podgląd ma poprawną walidację 422 oraz odrzuca wysyłkę bez tokena kodem 403.
- Rzeczywisty widget w Edge uzyskał token na dozwolonym hoście.
- Reguła ograniczania prób działa: przy 12 pustych żądaniach odpowiedzi 11 i 12 miały kod 429;
  żadne żądanie nie mogło spowodować wysłania maila.
- Uwierzytelnianie istniejącej skrzynki SMTP przez TLS przeszło lokalny test AUTH/NOOP.
  Nie wysłano wiadomości; nie zastępuje to sprawdzenia wysyłki z Cloudflare.
- Prawdziwa wysyłka testowa i sprawdzenie odbioru: oczekuje na osobne polecenie Damiana.
- Publikacja formularza na domenie produkcyjnej: jeszcze niewykonana.

Po zmianie hasła skrzynki należy uaktualnić sekret `SMTP_PASSWORD` w obu środowiskach Pages
i ponownie opublikować stronę. Backend nie wykonuje automatycznych ponowień wysyłki.
