import { onCLS, onINP, onLCP } from 'web-vitals';

// Only technical scalar values leave this module. Never serialize metric.entries,
// attribution, navigationURL or DOM elements from the browser's performance API.
export function createVitalsTelemetry(send, isAllowed, registrations = [onCLS, onINP, onLCP]) {
  let started = false;
  let revoked = false;
  const reported = new Set();
  function report(metric) {
    if (revoked || !isAllowed() || !metric) return;
    if (!['LCP', 'INP', 'CLS'].includes(metric.name) || !Number.isFinite(metric.value) || metric.value < 0) return;
    if (!['good', 'needs-improvement', 'poor'].includes(metric.rating)) return;
    const scale = metric.name === 'CLS' ? 10000 : 1;
    const value = Math.round(metric.value * scale) / scale;
    if (!Number.isFinite(value)) return;
    const key = metric.name + ':' + String(metric.id || 'current-navigation');
    if (reported.has(key)) return;
    reported.add(key);
    send('web_vital', {
      vital_name: metric.name,
      vital_value: value,
      vital_rating: metric.rating,
      vital_unit: metric.name === 'CLS' ? 'ratio' : 'ms',
    });
  }
  return {
    start() {
      if (started || revoked || !isAllowed()) return;
      started = true;
      for (const register of registrations) {
        // Unsupported APIs or a measurement failure must not affect the form.
        try { register(report); } catch (_) { /* leave that metric unavailable */ }
      }
    },
    revoke() {
      // Pending reports remain suppressed for this page even after re-consent.
      // A fresh page starts a fresh performance sample, without replaying history.
      if (started) revoked = true;
    },
  };
}
