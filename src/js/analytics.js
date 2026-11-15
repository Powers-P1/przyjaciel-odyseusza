// Basic Consent Mode: no Google script or analytics queue before an affirmative choice.
(function () {
  'use strict';
  var script = document.currentScript;
  var id = script && script.getAttribute('data-ga4-id');
  if (!/^G-[A-Z0-9]{6,20}$/.test(id || '') || location.hostname !== 'przyjacielodyseusza.pl') return;
  var KEY = 'po:analytics-consent:v1';
  var LIFETIME = 180 * 24 * 60 * 60 * 1000;
  var allowed = false;
  var loaded = false;
  var previousFocus;
  var stored;
  try { stored = JSON.parse(localStorage.getItem(KEY)); } catch (_) { /* choice stays necessary */ }
  var choice = stored && stored.version === 1 && stored.expires > Date.now()
    && ['granted', 'denied'].includes(stored.choice) ? stored.choice : '';

  function save(value) {
    choice = value;
    try { localStorage.setItem(KEY, JSON.stringify({ version: 1, choice: value, expires: Date.now() + LIFETIME })); }
    catch (_) { /* a blocked preference store must not prevent contact or a current-tab choice */ }
  }

  function pagePath() {
    if (/^\/polityka-prywatnosci(?:\.html)?\/?$/.test(location.pathname)) return '/polityka-prywatnosci';
    return location.pathname === '/' || location.pathname === '/index.html' ? '/' : '/404';
  }

  function pageInfo() {
    var referrer = '';
    try { referrer = document.referrer ? new URL(document.referrer).origin + '/' : ''; } catch (_) { /* no raw referrer */ }
    return { page_location: 'https://przyjacielodyseusza.pl' + pagePath(), page_referrer: referrer, page_title: document.title };
  }

  function start() {
    if (allowed) return;
    allowed = true;
    window['ga-disable-' + id] = false;
    if (!loaded) {
      // Do not send any events queued by an earlier pre-consent integration.
      window.dataLayer = [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      window.gtag('js', new Date());
      window.gtag('config', id, Object.assign({ send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_expires: 60 * 24 * 60 * 60, cookie_update: false }, pageInfo()));
      var tag = document.createElement('script');
      tag.async = true;
      tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
      document.head.appendChild(tag);
      loaded = true;
    } else {
      window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    }
    window.gtag('event', 'page_view', pageInfo());
  }

  function stop() {
    allowed = false;
    // The official opt-out flag blocks collection in an already-loaded Google tag.
    // Do not send a denied consent ping or reload a visitor's unfinished form.
    window['ga-disable-' + id] = true;
    document.cookie.split(';').forEach(function (part) {
      var name = part.split('=')[0].trim();
      if (!/^_ga(?:_[A-Za-z0-9]+)?$/.test(name)) return;
      ['', location.hostname, '.' + location.hostname].forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax; Secure' + (domain ? '; Domain=' + domain : '');
      });
    });
  }

  var dialog = document.createElement('dialog');
  dialog.className = 'consent-dialog';
  dialog.setAttribute('aria-labelledby', 'consent-title');
  dialog.setAttribute('aria-describedby', 'consent-description');
  dialog.innerHTML = '<h2 id="consent-title">Statystyki odwiedzin</h2>' +
    '<p id="consent-description">Za Twoją zgodą użyję Google Analytics, aby mierzyć odwiedziny i korzystanie z kontaktu. Ze strony i formularza możesz korzystać także bez zgody.</p>' +
    '<p><a href="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer">Polityka prywatności (nowa karta)</a></p>' +
    '<div class="consent-actions"><button class="btn btn--outline" type="button" data-consent="denied" autofocus>Odrzucam</button>' +
    '<button class="btn btn--outline" type="button" data-consent="granted">Zgadzam się</button></div>';
  if (typeof dialog.showModal !== 'function') { stop(); return; }
  document.body.appendChild(dialog);
  var settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'consent-settings';
  settings.textContent = 'Ustawienia prywatności';
  var footer = document.querySelector('.site-footer__meta');
  if (!footer) return; // fail closed if the expected integration is absent
  footer.appendChild(settings);

  function open() {
    previousFocus = document.activeElement;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    // Older browsers still have direct contact; measurement remains off without a choice.
  }
  function close() {
    if (dialog.open) dialog.close();
    if (previousFocus && previousFocus !== document.body && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
  }
  settings.addEventListener('click', open);
  dialog.addEventListener('click', function (event) {
    var target = event.target.closest('[data-consent]');
    if (!target) return;
    save(target.getAttribute('data-consent'));
    if (choice === 'granted') start(); else stop();
    close();
  });
  dialog.addEventListener('cancel', function () { save('denied'); stop(); });

  var EVENTS = ['cta_click', 'form_start', 'form_submit_success', 'form_submit_error', 'tel_click', 'mailto_click'];
  var LOCATIONS = ['gora', 'oferta', 'dla-kogo', 'wspolpraca', 'cennik', 'o-mnie', 'kontakt', 'sytuacje', 'site-header', 'site-footer', 'page'];
  var ERRORS = ['validation', 'turnstile', 'turnstile_unavailable', 'too_large', 'rate_limited', 'timeout', 'mail_timeout', 'mail_failed', 'network', 'unknown'];
  window.addEventListener('po:event', function (event) {
    var detail = event.detail || {};
    if (!allowed || !EVENTS.includes(detail.event)) return;
    var params = pageInfo();
    if (LOCATIONS.includes(detail.location)) params.location = detail.location;
    if (['firma', 'ja', 'brak'].includes(detail.subject_for)) params.subject_for = detail.subject_for;
    if (detail.event === 'form_submit_error') params.error = ERRORS.includes(detail.error) ? detail.error : 'unknown';
    window.gtag('event', detail.event, params);
  });

  if (choice === 'granted') start();
  else if (!choice && pagePath() !== '/polityka-prywatnosci') open();
})();
