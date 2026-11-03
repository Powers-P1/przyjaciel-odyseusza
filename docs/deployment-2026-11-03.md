# Uruchomienie na Cloudflare Free — 3 listopada 2026

Damian zlecił publikację bieżącej wersji A i zachowanie skrzynki w home.pl.
Potwierdził DNS w Cloudflare oraz późniejszą zmianę rejestratora na OVH po uzyskaniu AuthInfo.
Wybrał kontakt przez e-mail i telefon na start, bez integracji Resend.

## Konfiguracja

- Właściciel Cloudflare: `bart.przytula@gmail.com`; konto `d0fb95ca8a9f9289c4a92685b8c6af28`.
- Pages: `przyjaciel-odyseusza`, gałąź produkcyjna `main`, publikowany katalog `dist-cf/`.
- Strefa: `przyjacielodyseusza.pl`, plan `Free Website`, ID `4f1b87af011297d708ccadc466c5fd76`.
- NS: `rita.ns.cloudflare.com`, `tom.ns.cloudflare.com`.
- Skrzynka: `bartek@przyjacielodyseusza.pl`, obecna usługa `serwer2586394.home.pl`, IP `46.242.239.156`.
- Rejestracja domeny i usługa pocztowa pozostają w home.pl. Transfer do OVH jest osobnym etapem.
- Domena `.com` nie jest objęta tą zmianą.

## Wariant strony

`npm run build:production` wykonuje zwykły build, następnie `tools/production.mjs`:

1. Kopiuje pliki do ignorowanego `dist-cf/`.
2. Usuwa sekcję z przykładowymi opiniami oraz formularz.
3. Eksponuje istniejący e-mail i telefon obok tekstu kontaktowego.
4. Wyłącza wywoływanie Pages Functions przez `_routes.json`.
5. Dodaje `noindex` dla technicznego adresu `przyjaciel-odyseusza.pages.dev`.

Polityka prywatności uwzględnia aktualny kontakt bez formularza, Cloudflare i home.pl.
Dane firmy pochodzą z konta OVH Bartłomieja: BFP Bartłomiej Przytuła,
ul. Jana Nowaka Jeziorańskiego 48/117, 03-982 Warszawa, NIP 1180821614.
Pierwsze zdjęcie jest zachowane; drugie to opublikowana 31 października otwarta poza.

## Poczta i kolejność migracji

Stara strefa miała MX na sam apex i SPF `v=spf1 a mx ~all`.
Najpierw w home.pl rozdzielono pocztę od WWW:

- MX 10 → `serwer2586394.home.pl`.
- SPF → `v=spf1 a:serwer2586394.home.pl mx ~all`.

Cloudflare otrzymał również identyczny oryginalny DKIM oraz sześć rekordów SRV,
których cel zmieniono z apeksu na ten sam serwer home.pl.
Wildcard prowadzi DNS-only do serwera home.pl, aby zachować stare hosty poczty/FTP.
Rekordy WWW są jawne: apex i `www` mają CNAME na `przyjaciel-odyseusza.pages.dev`, z proxy Cloudflare.
Przekierowanie 301 wymusza HTTPS i host bez `www`, zachowując ścieżkę oraz query string.
Wyłączono obfuskację e-mail Cloudflare, aby zachować własny skrypt i ścisłe CSP.

## Weryfikacja 03.11.2026

- Produkcyjne wdrożenie Pages: `d7c68e28-ce95-49aa-963f-fb1ed74e2dc1`, kod `be4f7f6`, status `success`.
- Wszystkie 33 pliki z artefaktu porównano bajt po bajcie z odpowiedziami Pages: zgodne,
  także własna strona 404 z poprawnym statusem 404.
- Adres techniczny ma `X-Robots-Tag: noindex, nofollow`; preview ma `noindex`.
- Brak aktywnego formularza, pustych danych firmy i przykładowych opinii w wariancie produkcyjnym.
- Zdjęcia ładują się; sprawdzono kontakt na pulpicie i brak poziomego przepełnienia.
- SMTP 465 i IMAP 993: poprawne certyfikaty i TLS 1.3. Nie logowano się do skrzynki
  i nie wysyłano wiadomości testowej do klienta.
- Zapis NS przez Damiana: 12:44 czasu Warszawy; potwierdzenie home.pl odczytane w panelu.
- Stan o 12:50: serwery rejestru `.pl` nadal zwracają NS home.pl; Cloudflare `pending`;
  adres produkcyjny nadal odpowiada starym WordPressem. Aktywacja własnych domen i HTTPS
  oczekuje na zewnętrzną propagację. Konfiguracja została zapisana po obu stronach.
- Transfer rejestracji do OVH nie został rozpoczęty; potrzebne AuthInfo w kolejnym etapie.

W programach pocztowych serwerem IMAP/SMTP jest `serwer2586394.home.pl`;
IMAPS 993 i SMTPS 465. Sam adres domeny po przełączeniu będzie hostem strony WWW.

## Powtarzanie wdrożenia i powrót

Po wczytaniu lokalnego tokenu w tym samym procesie: `npm run deploy`.
Tokeny są poza repozytorium w katalogu `.codex/secrets/przyjaciel-odyseusza` profilu użytkownika.
Nie zapisuj tokenów w skryptach, argumentach CLI, raportach ani konfiguracji Git.

W razie problemu z treścią użyj poprzedniego wdrożenia Pages.
Przy awaryjnym powrocie WWW odtwórz DNS-only A apeksu `46.242.239.156`
i skieruj `www` na apex; zachowaj nowe niezależne rekordy poczty.
Nie cofaj MX do domeny głównej i nie usuwaj hostingu home.pl, który nadal utrzymuje skrzynkę.

Dowody operacyjne i pełna kopia pierwotnych 11 rekordów są poza repozytorium:
`outputs/deployment-2026-11-03/` w katalogu projektu.
