/**
 * Cloudflare Pages Function – obsługa formularza kontaktowego.
 * Ścieżka: POST /api/contact
 *
 * Zmienne środowiskowe (Pages → Settings → Environment variables):
 *   RESEND_API_KEY    – klucz API z https://resend.com (wymagany)
 *   CONTACT_TO        – adres odbiorcy (domyślnie bartek@przyjacielodyseusza.pl)
 *   CONTACT_FROM      – nadawca w zweryfikowanej domenie, np.
 *                       "Formularz – Przyjaciel Odyseusza <formularz@przyjacielodyseusza.pl>"
 *   TURNSTILE_SECRET  – (opcjonalnie) sekret Cloudflare Turnstile; gdy ustawiony,
 *                       token z formularza jest weryfikowany
 */

const DEFAULT_TO = 'bartek@przyjacielodyseusza.pl';
const DEFAULT_FROM = 'Formularz – Przyjaciel Odyseusza <formularz@przyjacielodyseusza.pl>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VERIFY_TIMEOUT_MS = 8_000;
const MAIL_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url, options, timeoutMs, readJson = false) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return readJson ? { ok: response.ok, body: await response.json() } : response;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('upstream_timeout');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function clean(value, max) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

// Nagłówki ustawiamy w samej funkcji: Cloudflare nie stosuje reguł z pliku _headers do odpowiedzi
// generowanych przez Pages Functions, więc wpis /api/* nigdy by tu nie dotarł.
const NAGLOWKI = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

function respond(status, body, wantsJson) {
  if (wantsJson) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...NAGLOWKI, 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
  // Wynik musi być czytelny także bez JS — parametr w URL sam nie pokaże komunikatu.
  const title = body.ok ? 'Dziękuję za wiadomość.' : 'Nie udało się wysłać wiadomości.';
  const descriptions = {
    validation: 'Sprawdź imię i nazwisko, adres e-mail oraz treść wiadomości (co najmniej 10 znaków). Potwierdź też zapoznanie się z informacją o wykorzystaniu danych.',
    turnstile: 'Weryfikacja antyspamowa wymaga JavaScriptu. Włącz go lub skorzystaj z kontaktu poniżej.',
    turnstile_unavailable: 'Weryfikacja antyspamowa jest chwilowo niedostępna. Spróbuj ponownie później.',
    mail_timeout: 'Nie udało się potwierdzić wysyłki w wyznaczonym czasie. Wiadomość mogła już dotrzeć.',
  };
  const description = body.ok
    ? 'Odezwę się, żeby umówić rozmowę.'
    : descriptions[body.error] || 'Formularz jest chwilowo niedostępny. Skorzystaj z bezpośredniego kontaktu.';
  const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title} | Przyjaciel Odyseusza</title></head><body><main><h1>${title}</h1><p>${description}</p><p>Napisz na <a href="mailto:bartek@przyjacielodyseusza.pl">bartek@przyjacielodyseusza.pl</a> lub zadzwoń: <a href="tel:+48601145360">+48 601 145 360</a>.</p>${body.ok ? '' : '<p>Użyj przycisku Wstecz w przeglądarce, aby wrócić do wypełnionego formularza.</p>'}<p><a href="/#kontakt">Wróć do strony kontaktowej</a></p></main></body></html>`;
  return new Response(html, {
    status,
    headers: { ...NAGLOWKI, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'" },
  });
}

export async function onRequestPost({ request, env }) {
  const contentType = request.headers.get('content-type') || '';
  const accept = request.headers.get('accept') || '';
  const wantsJson = accept.includes('application/json') || contentType.includes('application/json');

  let data;
  try {
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const fd = await request.formData();
      data = Object.fromEntries(fd.entries());
    }
  } catch (err) {
    return respond(400, { ok: false, error: 'bad_request' }, wantsJson);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return respond(400, { ok: false, error: 'bad_request' }, wantsJson);
  }

  const name = clean(data.name, 100);
  const email = clean(data.email, 200);
  const phone = clean(data.phone, 40);
  const message = String(data.message == null ? '' : data.message).trim().slice(0, 4000);
  const subjectFor = clean(data.subject_for, 10);
  const honeypot = clean(data.website, 200);
  // Honeypot jest pułapką na boty. Szybkość pisania/autouzupełniania nie świadczy o spamie.
  if (honeypot) return respond(200, { ok: true }, wantsJson);

  const invalid = [];
  if (name.length < 2) invalid.push('name');
  if (!EMAIL_RE.test(email)) invalid.push('email');
  if (message.length < 10) invalid.push('message');
  if (data.privacy_acknowledged !== 'yes') invalid.push('privacy_acknowledged');
  if (invalid.length) return respond(422, { ok: false, error: 'validation', fields: invalid }, wantsJson);

  // Fail-closed. Weryfikacja Turnstile jest warunkowa, żeby formularz działał na emulacji lokalnej
  // (tam nie ma sekretów). Na działającym wdrożeniu – poznajemy je po kluczu do wysyłki maili –
  // brak sekretu Turnstile oznaczałby formularz bez ochrony antyspamowej, więc zatrzymujemy go
  // głośno. Literówka w nazwie zmiennej w panelu Pages nie może po cichu wyłączyć captchy.
  if (env.RESEND_API_KEY && !env.TURNSTILE_SECRET) {
    console.error('Brak TURNSTILE_SECRET przy skonfigurowanej wysyłce – formularz zatrzymany.');
    return respond(500, { ok: false, error: 'not_configured' }, wantsJson);
  }

  if (env.TURNSTILE_SECRET) {
    const token = clean(data['cf-turnstile-response'], 4096);
    if (!token) return respond(403, { ok: false, error: 'turnstile' }, wantsJson);
    const ip = request.headers.get('CF-Connecting-IP') || '';
    let verified = false;
    try {
      const vr = await fetchWithTimeout('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
      }, VERIFY_TIMEOUT_MS, true);
      if (!vr.ok) return respond(503, { ok: false, error: 'turnstile_unavailable' }, wantsJson);
      verified = Boolean(vr.body && vr.body.success === true);
    } catch (err) {
      return respond(503, { ok: false, error: 'turnstile_unavailable' }, wantsJson);
    }
    if (!verified) return respond(403, { ok: false, error: 'turnstile' }, wantsJson);
  }

  if (!env.RESEND_API_KEY) {
    return respond(500, { ok: false, error: 'not_configured' }, wantsJson);
  }

  const forLabel = subjectFor === 'firma' ? 'menedżera w firmie' : subjectFor === 'ja' ? 'siebie' : 'nie wskazano';
  const sentAt = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });
  const country = request.headers.get('CF-IPCountry') || '';

  const text = [
    'Nowe zapytanie ze strony przyjacielodyseusza.pl',
    '',
    `Imię i nazwisko: ${name}`,
    `E-mail: ${email}`,
    `Telefon: ${phone || '—'}`,
    `W czyjej sprawie: ${forLabel}`,
    '',
    'Wiadomość:',
    message,
    '',
    '—',
    `Wysłano: ${sentAt}${country ? ` · kraj: ${country}` : ''}`,
  ].join('\n');

  const payload = {
    from: env.CONTACT_FROM || DEFAULT_FROM,
    to: [env.CONTACT_TO || DEFAULT_TO],
    reply_to: email,
    subject: `Zapytanie ze strony: ${name} (${forLabel})`,
    text,
  };

  let sent = false;
  try {
    const r = await fetchWithTimeout('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, MAIL_TIMEOUT_MS);
    sent = r.ok;
  } catch (err) {
    const timedOut = err && err.message === 'upstream_timeout';
    return respond(timedOut ? 504 : 502, { ok: false, error: timedOut ? 'mail_timeout' : 'mail_failed' }, wantsJson);
  }

  if (!sent) return respond(502, { ok: false, error: 'mail_failed' }, wantsJson);
  return respond(200, { ok: true }, wantsJson);
}

export function onRequest({ request }) {
  if (request.method === 'POST') return undefined;
  return new Response('Method Not Allowed', { status: 405, headers: { ...NAGLOWKI, Allow: 'POST' } });
}
