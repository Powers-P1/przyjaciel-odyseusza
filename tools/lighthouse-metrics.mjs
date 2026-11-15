export function summarizeRuns(reports) {
  if (!reports.length) throw new Error('Brak raportów Lighthouse.');
  const median = values => {
    if (values.some(value => !Number.isFinite(value))) throw new Error('Niepełny pomiar Lighthouse.');
    const sorted = [...values].sort((a,b) => a-b);
    const middle = Math.floor(sorted.length/2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle-1]+sorted[middle])/2;
  };
  const metric = id => median(reports.map(report => report.audits[id]?.numericValue));
  return {
    // Functional categories must pass every run; performance is a repeated lab measurement.
    scores:Object.fromEntries(Object.keys(reports[0].categories).map(key => [key,
      key === 'performance' ? median(reports.map(report => report.categories[key]?.score))
        : Math.min(...reports.map(report => report.categories[key]?.score ?? 0))])),
    lcp:metric('largest-contentful-paint'),
    cls:metric('cumulative-layout-shift'),
    tbt:metric('total-blocking-time'),
  };
}
