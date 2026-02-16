/**
 * Analytics Dashboard computations.
 */
window.AnalyticsDashboardModule = (() => {
  function parseCSV(text) {
    const [header, ...rows] = text.trim().split(/\r?\n/);
    const keys = header.split(',').map(k => k.trim());
    return rows.map(row => {
      const cols = row.split(',');
      const obj = {};
      keys.forEach((k, i) => (obj[k] = cols[i]?.trim() ?? ''));
      return obj;
    });
  }

  function correlation(points) {
    const x = points.map(p => Number(p.word_count || 0));
    const y = points.map(p => Number(p.open_rate || 0));
    if (!x.length) return 0;
    const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const mx = mean(x); const my = mean(y);
    let num = 0; let dx = 0; let dy = 0;
    for (let i = 0; i < x.length; i++) {
      num += (x[i] - mx) * (y[i] - my);
      dx += (x[i] - mx) ** 2;
      dy += (y[i] - my) ** 2;
    }
    return dx && dy ? Number((num / Math.sqrt(dx * dy)).toFixed(2)) : 0;
  }

  return { parseCSV, correlation };
})();
