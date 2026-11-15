import fs from 'node:fs';
import { createHash } from 'node:crypto';

const digest = (path) => createHash('sha256').update(fs.readFileSync(path)).digest('hex').slice(0, 8);
export function configureAnalytics(html, csp, id) {
  if (!id) return { html, csp, enabled: false };
  if (!/^G-[A-Z0-9]{6,20}$/.test(id)) throw new Error('Nieprawidłowy identyfikator strumienia GA4.');
  if (!html.includes('</head>') || !html.includes('</body>')) throw new Error('Brak wymaganej struktury dokumentu.');
  const css = `<link rel="stylesheet" href="/assets/css/analytics.css?v=${digest('public/assets/css/analytics.css')}">`;
  const script = `<script src="/assets/js/analytics.js?v=${digest('public/assets/js/analytics.js')}" data-ga4-id="${id}" defer></script>`;
  html = html.replace('</head>', `${css}\n</head>`).replace('</body>', `${script}\n</body>`);
  csp = csp.replace(/script-src ([^;]+);/, "script-src $1 https://www.googletagmanager.com;")
    .replace(/img-src ([^;]+);/, 'img-src $1 https://www.googletagmanager.com https://*.google-analytics.com;')
    .replace(/connect-src ([^;]+);/, 'connect-src $1 https://*.google-analytics.com https://*.google.com https://www.googletagmanager.com;');
  if (html.includes('<h2>6. Pliki cookies i&nbsp;analityka</h2>')) {
    html = html.replace(/<h2>6\. Pliki cookies i&nbsp;analityka<\/h2>\s*<p>[\s\S]*?<\/p>/,
      '<h2>6. Pliki cookies i&nbsp;analityka</h2>\n' +
      '<p>Formularz korzysta z&nbsp;Cloudflare Turnstile w&nbsp;celu ochrony przed spamem. Fonty strony są utrzymywane na tej samej domenie.</p>\n' +
      '<p>Wyłącznie po Twojej zgodzie uruchamiam Google Analytics 4, dostarczane przez Google Ireland Limited, w&nbsp;celu analizy odwiedzin i&nbsp;korzystania z&nbsp;kontaktu (art.&nbsp;6 ust.&nbsp;1 lit.&nbsp;a RODO). Dane obejmują informacje o&nbsp;przeglądarce i&nbsp;urządzeniu, stronach oraz zdarzeniach kontaktu, bez treści wiadomości i&nbsp;wartości pól. Adresy stron są pozbawione parametrów i&nbsp;fragmentów. Narzędzie może używać plików cookies _ga oraz _ga_*. Dane zdarzeń i&nbsp;użytkowników w&nbsp;GA4 przechowuję przez 2&nbsp;miesiące; raporty zbiorcze mogą mieć inny okres przechowywania. Funkcje reklamowe i&nbsp;Google Signals są wyłączone.</p>\n' +
      '<p>Brak zgody nie ogranicza działania strony i&nbsp;formularza. Wyboru można dokonać ponownie lub wycofać zgodę przyciskiem „Ustawienia prywatności” w&nbsp;stopce. Preferencja jest zapisywana lokalnie na 180&nbsp;dni, a&nbsp;cookies analityczne maksymalnie na 60&nbsp;dni, bez odnawiania terminu przy kolejnych wizytach. Google może przetwarzać dane poza EOG na podstawie stosowanych przez ten podmiot mechanizmów ochrony, w&nbsp;tym standardowych klauzul umownych lub Data Privacy Framework. <a href="https://policies.google.com/privacy" rel="noopener noreferrer">Polityka prywatności Google</a>.</p>');
    html = html.replace(/(<h2>5\. Odbiorcy danych<\/h2>[\s\S]*?)(<\/ul>)/,
      '$1<li><strong>Google Ireland Limited</strong>&nbsp;– statystyki Google Analytics wyłącznie po udzieleniu zgody, na zasadach opisanych w&nbsp;punkcie&nbsp;6.</li>$2');
  }
  return { html, csp, enabled: true };
}
