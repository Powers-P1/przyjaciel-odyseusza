/* Przyjaciel Odyseusza – zachowania strony (bez zależności) */
(function () {
  'use strict';

  /* ---------- aliasy kotwic z poprzedniej strony (WordPress one-pager) ---------- */
  var LEGACY_HASHES = { '#dla-ciebie': '#oferta', '#dla-biznesu': '#oferta' };
  function fixLegacyHash() {
    var target = LEGACY_HASHES[window.location.hash];
    if (target) window.location.replace(window.location.pathname + window.location.search + target);
  }
  fixLegacyHash();
  window.addEventListener('hashchange', fixLegacyHash);

  /* ---------- nagłówek i menu mobilne ---------- */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav-glowna');

  function setNavOpen(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('is-open', open);
    var label = toggle.querySelector('.nav-toggle__label');
    if (label) label.textContent = open ? 'Zamknij' : 'Menu';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setNavOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNavOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setNavOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !header.contains(e.target)) setNavOpen(false);
    });
    // Wyjście fokusem poza nagłówek zamyka menu. Bez tego panel zostaje otwarty i zasłania
    // kolejny element w kolejności Tab – przy powiększeniu 200% zakrywa go w całości (WCAG 2.4.11).
    header.addEventListener('focusout', function (e) {
      if (nav.classList.contains('is-open') && !header.contains(e.relatedTarget)) setNavOpen(false);
    });
    var mq = window.matchMedia('(min-width: 48em)');
    if (mq.addEventListener) mq.addEventListener('change', function () { setNavOpen(false); });
  }

  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- podświetlenie aktywnej sekcji w menu ---------- */
  if (nav && 'IntersectionObserver' in window) {
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]:not(.btn)'));
    var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
    if (targets.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = '#' + entry.target.id;
          links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === id); });
        });
      }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
      targets.forEach(function (t) { spy.observe(t); });
    }
  }

  /* ---------- delikatne pojawianie się sekcji ---------- */
  var reveals = document.querySelectorAll('.reveal');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- rok w stopce ---------- */
  var rok = document.getElementById('rok');
  if (rok) rok.textContent = String(new Date().getFullYear());

  /* ---------- zdarzenia analityczne (bez danych osobowych; patrz docs/plan-pomiarowy.md) ---------- */
  function track(name, params) {
    var detail = Object.assign({ event: name }, params || {});
    try { window.dispatchEvent(new CustomEvent('po:event', { detail: detail })); } catch (e) { /* stare przeglądarki */ }
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(detail);
  }
  function sectionOf(el) {
    var s = el.closest('section, header, footer');
    return s ? (s.id || s.className.split(' ')[0] || 'page') : 'page';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href], button');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('tel:') === 0) track('tel_click', { location: sectionOf(a) });
    else if (href.indexOf('mailto:') === 0) track('mailto_click', { location: sectionOf(a) });
    else if (a.classList.contains('btn')) track('cta_click', { label: (a.textContent || '').trim(), location: sectionOf(a) });
  });

  /* ---------- formularz kontaktowy ---------- */
  var form = document.getElementById('formularz');
  if (!form) return;

  var EMAIL = 'bartek@przyjacielodyseusza.pl';
  var PHONE_HREF = 'tel:+48601145360';
  var PHONE_TEXT = '+48 601 145 360';
  var SUCCESS_HTML = '<strong>Dziękuję za wiadomość.</strong> Odezwę się, żeby umówić rozmowę. Wolisz porozmawiać od razu? Zadzwoń: <a href="' + PHONE_HREF + '">' + PHONE_TEXT + '</a>.';

  var status = document.getElementById('form-status');
  var submitBtn = form.querySelector('.form__submit');
  var isDemo = form.getAttribute('data-demo') === 'true';
  var sending = false;
  var REQUEST_TIMEOUT_MS = 25000;
  // Demo ma zablokowany przycisk w HTML, aby nie wysyłało danych również bez JavaScriptu.
  if (isDemo && submitBtn) submitBtn.disabled = false;

  var fields = {
    name: form.elements.namedItem('name'),
    email: form.elements.namedItem('email'),
    message: form.elements.namedItem('message')
  };

  /* Cloudflare Turnstile – ładowany tylko, gdy ustawiono klucz w data-turnstile-sitekey */
  var sitekey = form.getAttribute('data-turnstile-sitekey');
  var turnstileWidget = null;
  var turnstileToken = '';

  function resetTurnstile() {
    turnstileToken = '';
    var tokenField = form.elements.namedItem('cf-turnstile-response');
    if (tokenField) tokenField.value = '';
    if (turnstileWidget !== null && window.turnstile && typeof window.turnstile.reset === 'function') {
      try { window.turnstile.reset(turnstileWidget); } catch (err) { /* pozwól użyć kontaktu bezpośredniego */ }
    }
  }

  if (sitekey && !isDemo) {
    var slot = document.getElementById('turnstile-slot');
    if (slot) slot.className = 'turnstile';
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true; s.defer = true;
    s.addEventListener('load', function () {
      if (!slot || !window.turnstile) return;
      window.turnstile.ready(function () {
        turnstileWidget = window.turnstile.render(slot, {
          sitekey: sitekey, theme: 'dark', language: 'pl', appearance: 'interaction-only',
          callback: function (token) { turnstileToken = token; },
          'expired-callback': resetTurnstile,
          'error-callback': function () { turnstileToken = ''; }
        });
      });
    });
    document.head.appendChild(s);
  }

  function showStatus(type, html) {
    if (!status) return;
    status.className = 'form__status form__status--' + type;
    status.innerHTML = html;
    status.focus({ preventScroll: false });
  }

  function fallbackHtml(error) {
    var subject = encodeURIComponent('Zapytanie ze strony przyjacielodyseusza.pl');
    var body = encodeURIComponent((fields.message && fields.message.value) || '');
    var mailto = 'mailto:' + EMAIL + '?subject=' + subject + '&body=' + body;
    var messages = {
      turnstile: 'Nie udało się zakończyć weryfikacji antyspamowej. Poczekaj na jej odświeżenie i spróbuj ponownie.',
      turnstile_unavailable: 'Weryfikacja antyspamowa jest chwilowo niedostępna. Spróbuj ponownie za chwilę.',
      validation: 'Sprawdź zaznaczone pola i spróbuj ponownie.',
      timeout: 'Nie udało się potwierdzić wysyłki w wyznaczonym czasie. Wiadomość mogła już dotrzeć.',
      mail_timeout: 'Nie udało się potwierdzić wysyłki w wyznaczonym czasie. Wiadomość mogła już dotrzeć.'
    };
    var message = messages[error] || 'Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.';
    return message + ' Wpisane dane pozostały w formularzu. Napisz bezpośrednio na <a href="' + mailto + '">' + EMAIL +
      '</a> lub zadzwoń: <a href="' + PHONE_HREF + '">' + PHONE_TEXT + '</a>.';
  }

  function setError(input, show) {
    if (!input) return;
    var err = document.getElementById(input.id + '-error');
    input.classList.toggle('is-invalid', show);
    input.setAttribute('aria-invalid', show ? 'true' : 'false');
    if (err) {
      err.hidden = !show;
      if (show) input.setAttribute('aria-describedby', err.id);
      else input.removeAttribute('aria-describedby');
    }
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validateField(key) {
    var el = fields[key];
    if (!el) return true;
    var v = el.value.trim();
    var ok = true;
    if (key === 'name') ok = v.length >= 2;
    if (key === 'email') ok = EMAIL_RE.test(v);
    if (key === 'message') ok = v.length >= 10;
    setError(el, !ok);
    return ok;
  }

  function validateAll() {
    var ok = true;
    ['name', 'email', 'message'].forEach(function (k) { if (!validateField(k)) ok = false; });
    return ok;
  }

  Object.keys(fields).forEach(function (k) {
    var el = fields[k];
    if (!el) return;
    el.addEventListener('blur', function () { if (el.value.trim()) validateField(k); });
    el.addEventListener('input', function () { if (el.classList.contains('is-invalid')) validateField(k); });
  });

  var formStarted = false;
  form.addEventListener('focusin', function (e) {
    if (formStarted || !e.target.matches('input, textarea')) return;
    formStarted = true;
    track('form_start');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    if (!validateAll()) {
      var first = form.querySelector('.is-invalid');
      if (first) first.focus();
      return;
    }
    if (isDemo) {
      showStatus('info', 'Wersja demonstracyjna — formularz nie wysyła wiadomości.');
      return;
    }
    if (sitekey && !turnstileToken) {
      showStatus('error', fallbackHtml('turnstile'));
      return;
    }
    if (!window.fetch) { showStatus('error', fallbackHtml('network')); return; }

    var originalLabel = submitBtn ? submitBtn.textContent : '';
    sending = true;
    form.setAttribute('aria-busy', 'true');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wysyłanie…'; }

    var payload = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
      payload[el.name] = el.value;
    });
    if (sitekey) payload['cf-turnstile-response'] = turnstileToken;

    var controller = window.AbortController ? new AbortController() : null;
    var timer;
    var deadline = new Promise(function (resolve, reject) {
      timer = window.setTimeout(function () {
        reject(new Error('timeout'));
        if (controller) controller.abort();
      }, REQUEST_TIMEOUT_MS);
    });
    var request = fetch(form.getAttribute('action'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        return res.json().catch(function () { throw new Error('bad_response'); }).then(function (json) {
          if (json && res.ok && json.ok === true) return;
          if (json && json.error === 'validation' && Array.isArray(json.fields)) {
            json.fields.forEach(function (key) { if (fields[key]) setError(fields[key], true); });
          }
          var knownErrors = ['validation', 'turnstile', 'turnstile_unavailable', 'not_configured', 'mail_failed', 'mail_timeout'];
          throw new Error(json && knownErrors.indexOf(json.error) !== -1 ? json.error : 'bad_response');
        });
      });

    Promise.race([request, deadline])
      .then(function () {
        showStatus('ok', SUCCESS_HTML);
        track('form_submit_success', { subject_for: payload.subject_for || 'brak' });
        formStarted = false;
        form.reset();
      })
      .catch(function (err) {
        var knownErrors = ['validation', 'turnstile', 'turnstile_unavailable', 'not_configured', 'mail_failed', 'mail_timeout', 'timeout', 'bad_response'];
        var error = err && knownErrors.indexOf(err.message) !== -1 ? err.message : 'network';
        showStatus('error', fallbackHtml(error));
        track('form_submit_error', { error: error });
      })
      .then(function () {
        window.clearTimeout(timer);
        // Każda próba może zużyć token, również gdy dostawca poczty odrzucił wiadomość.
        resetTurnstile();
        sending = false;
        form.removeAttribute('aria-busy');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      });
  });
})();
