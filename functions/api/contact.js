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

function clean(value, max) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function respond(status, body, wantsJson) {
  if (wantsJson) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  // wariant bez JavaScriptu: przekierowanie z powrotem do sekcji kontakt
  const target = body.ok ? '/?wyslano=1#kontakt' : '/?blad=1#kontakt';
  return new Response(null, { status: 303, headers: { Location: target, 'Cache-Control': 'no-store' } });
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

  const name = clean(data.name, 100);
  const email = clean(data.email, 200);
  const phone = clean(data.phone, 40);
  const message = String(data.message == null ? '' : data.message).trim().slice(0, 4000);
  const subjectFor = clean(data.subject_for, 10);
  const honeypot = clean(data.website, 200);
  // czas wypełniania mierzony przez przeglądarkę (performance.now od wczytania strony).
  // Nie wolno tu porównywać zegara serwera ze znacznikiem czasu z urządzenia: zegar telefonu
  // potrafi spieszyć się o minuty, a wtedy różnica wychodzi ujemna i prawdziwe zgłoszenie
  // ląduje w pułapce na boty – użytkownik widzi potwierdzenie, a wiadomość przepada.
  // Puste pole znaczy „brak pomiaru” (formularz wysłany bez JavaScriptu), a nie „zero milisekund”.
  const surowyCzas = data.elapsed_ms == null ? '' : String(data.elapsed_ms).trim();
  const elapsed = surowyCzas === '' ? null : Number(surowyCzas);

  // pułapki na boty: udajemy sukces, żeby nie zdradzać mechanizmu
  if (honeypot) return respond(200, { ok: true }, wantsJson);
  if (elapsed !== null && Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 2500) {
    return respond(200, { ok: true }, wantsJson);
  }

  const invalid = [];
  if (name.length < 2) invalid.push('name');
  if (!EMAIL_RE.test(email)) invalid.push('email');
  if (message.length < 10) invalid.push('message');
  if (invalid.length) return respond(422, { ok: false, error: 'validation', fields: invalid }, wantsJson);

  if (env.TURNSTILE_SECRET) {
    const token = clean(data['cf-turnstile-response'], 4096);
    const ip = request.headers.get('CF-Connecting-IP') || '';
    let verified = false;
    try {
      const vr = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
      });
      const vj = await vr.json();
      verified = Boolean(vj && vj.success);
    } catch (err) {
      verified = false;
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
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    sent = r.ok;
  } catch (err) {
    sent = false;
  }

  if (!sent) return respond(502, { ok: false, error: 'mail_failed' }, wantsJson);
  return respond(200, { ok: true }, wantsJson);
}

export function onRequest({ request }) {
  if (request.method === 'POST') return undefined;
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
