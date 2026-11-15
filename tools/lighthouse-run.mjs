// NO_NAVSTART means that Chrome did not record the navigation trace, not a slow page.
// Retry that collector failure once. Valid slow runs and every other error stay failures.
export async function collectLighthouseRun(collect, onAttempt = () => {}) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await collect();
    await onAttempt(result, attempt);
    const report = result?.lhr;
    if (report?.runtimeError?.code === 'NO_NAVSTART' && attempt === 1) continue;
    if (!report) throw new Error('Lighthouse nie zwrócił raportu.');
    const missing = ['total-blocking-time', 'largest-contentful-paint', 'cumulative-layout-shift']
      .filter(id => !Number.isFinite(report.audits?.[id]?.numericValue));
    if (report.runtimeError || missing.length || !Number.isFinite(report.categories?.performance?.score)) {
      throw new Error(`Niepełny pomiar Lighthouse: ${report.runtimeError?.code || missing.join(',') || 'performance'}.`);
    }
    return result;
  }
}
