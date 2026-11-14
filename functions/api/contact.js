/**
 * Cloudflare Pages Function – obsługa formularza kontaktowego.
 * Ścieżka: POST /api/contact
 *
 * Zmienne środowiskowe (Pages → Settings → Environment variables):
 *   SMTP_USERNAME       – stała skrzynka bartek@przyjacielodyseusza.pl
 *   SMTP_PASSWORD       – sekret istniejącej skrzynki OVH
 *   TURNSTILE_SECRET    – sekret ochrony antyspamowej
 *   TURNSTILE_HOSTNAMES – dokładne hosty frontendu dla danego środowiska
 */
import { MAILBOX, sendSmtpMessage } from '../../src/server/smtp.js';
const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;
const VERIFY_TIMEOUT_MS = 8_000;
const MAX_BODY_BYTES = 32_768;

async function boundedRequest(request) {
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) throw new Error('too_large');
  const reader = request.body?.getReader();
  const chunks = [];
  let size = 0;
  try {
    if (reader) while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new Error('too_large'); }
      chunks.push(value);
    }
  } finally { reader?.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new Request(request.url, { method: 'POST', headers: request.headers, body: bytes });
}

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
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
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
    validation: 'Sprawdź imię i nazwisko, adres e-mail oraz treść wiadomości (co najmniej 10 znaków).',
    turnstile: 'Weryfikacja antyspamowa wymaga JavaScriptu. Włącz go lub skorzystaj z kontaktu poniżej.',
    turnstile_unavailable: 'Weryfikacja antyspamowa jest chwilowo niedostępna. Spróbuj ponownie później.',
    mail_timeout: 'Nie udało się potwierdzić wysyłki w wyznaczonym czasie. Wiadomość mogła już dotrzeć.',
    too_large: 'Wiadomość jest za długa. Skróć ją lub skorzystaj z bezpośredniego adresu e-mail.',
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

export function createContactHandler(sendMail = sendSmtpMessage) {
return async function onRequestPost({ request, env }) {
  const contentType = request.headers.get('content-type') || '';
  const accept = request.headers.get('accept') || '';
  const wantsJson = accept.includes('application/json') || contentType.includes('application/json');
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return respond(403, { ok: false, error: 'origin' }, wantsJson);
  if (!/application\/json|application\/x-www-form-urlencoded|multipart\/form-data/i.test(contentType)) {
    return respond(415, { ok: false, error: 'bad_request' }, wantsJson);
  }

  let data;
  try {
    const bounded = await boundedRequest(request);
    if (contentType.includes('application/json')) {
      data = await bounded.json();
    } else {
      const fd = await bounded.formData();
      data = Object.fromEntries(fd.entries());
    }
  } catch (err) {
    const tooLarge = err.message === 'too_large';
    return respond(tooLarge ? 413 : 400, { ok: false, error: tooLarge ? 'too_large' : 'bad_request' }, wantsJson);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return respond(400, { ok: false, error: 'bad_request' }, wantsJson);
  }

  const name = clean(data.name, 100);
  const email = clean(data.email, 200);
  const phone = clean(data.phone, 40);
  const message = typeof data.message === 'string' ? data.message.trim().slice(0, 4000) : '';
  const subjectFor = clean(data.subject_for, 10);
  const honeypot = clean(data.website, 200);
  // Honeypot jest pułapką na boty. Szybkość pisania/autouzupełniania nie świadczy o spamie.
  if (honeypot) return respond(200, { ok: true }, wantsJson);

  const invalid = [];
  if (typeof data.name !== 'string' || name.length < 2 || data.name.trim().length > 100) invalid.push('name');
  if (typeof data.email !== 'string' || data.email.length > 200 || !EMAIL_RE.test(email) || email.startsWith('.') || email.includes('..')) invalid.push('email');
  if (typeof data.message !== 'string' || message.length < 10 || data.message.trim().length > 4000) invalid.push('message');
  if (data.phone != null && (typeof data.phone !== 'string' || data.phone.length > 40)) invalid.push('phone');
  if ((data.subject_for != null && typeof data.subject_for !== 'string') || !['', 'firma', 'ja'].includes(subjectFor)) invalid.push('subject_for');
  if (invalid.length) return respond(422, { ok: false, error: 'validation', fields: invalid }, wantsJson);

  const expectedHosts = new Set((env.TURNSTILE_HOSTNAMES || '').split(',').map((host) => host.trim()).filter(Boolean));
  if (env.SMTP_USERNAME !== MAILBOX || !env.SMTP_PASSWORD || !env.TURNSTILE_SECRET || !expectedHosts.size) {
    return respond(500, { ok: false, error: 'not_configured' }, wantsJson);
  }

  if (env.TURNSTILE_SECRET) {
    const token = typeof data['cf-turnstile-response'] === 'string' ? data['cf-turnstile-response'] : '';
    if (!token || token.length > 2048) return respond(403, { ok: false, error: 'turnstile' }, wantsJson);
    const ip = request.headers.get('CF-Connecting-IP') || '';
    let verified = false;
    try {
      const vr = await fetchWithTimeout('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
      }, VERIFY_TIMEOUT_MS, true);
      if (!vr.ok) return respond(503, { ok: false, error: 'turnstile_unavailable' }, wantsJson);
      verified = Boolean(vr.body?.success === true && vr.body.action === 'contact'
        && expectedHosts.has(vr.body.hostname) && vr.body.hostname === new URL(request.url).hostname);
    } catch (err) {
      return respond(503, { ok: false, error: 'turnstile_unavailable' }, wantsJson);
    }
    if (!verified) return respond(403, { ok: false, error: 'turnstile' }, wantsJson);
  }

  const forLabel = subjectFor === 'firma' ? 'menedżera w firmie' : subjectFor === 'ja' ? 'siebie' : 'nie wskazano';
  const sentAt = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });

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
    `Wysłano: ${sentAt}`,
  ].join('\n');

  const payload = {
    replyTo: email,
    subject: `Zapytanie ze strony: ${name} (${forLabel})`,
    text,
    messageId: crypto.randomUUID(),
  };

  let sent = false;
  try {
    const result = await sendMail(payload, { username: env.SMTP_USERNAME, password: env.SMTP_PASSWORD });
    sent = result?.accepted === true;
  } catch (err) {
    const timedOut = err && err.message === 'mail_timeout';
    return respond(timedOut ? 504 : 502, { ok: false, error: timedOut ? 'mail_timeout' : 'mail_failed' }, wantsJson);
  }

  if (!sent) return respond(502, { ok: false, error: 'mail_failed' }, wantsJson);
  return respond(200, { ok: true }, wantsJson);
};
}

export const onRequestPost = createContactHandler();

export function onRequest({ request }) {
  if (request.method === 'POST') return undefined;
  return new Response('Method Not Allowed', { status: 405, headers: { ...NAGLOWKI, Allow: 'POST' } });
}
