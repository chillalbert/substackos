/**
 * Subscriber conversion analysis module.
 */
window.ConversionOptimizerModule = (() => {
  /**
   * Analyzes CTA/paywall placement and returns optimization suggestions.
   * @param {string} text
   */
  function analyze(text = '') {
    const lower = text.toLowerCase();
    const words = text.split(/\s+/).filter(Boolean);
    const firstCtaIndex = words.findIndex(w => /(subscribe|join|upgrade|become\s+paid)/i.test(w));
    const paywallMentions = (lower.match(/paywall|paid subscriber|members only/g) || []).length;

    const suggestions = [];
    if (firstCtaIndex === -1 || firstCtaIndex > 220) {
      suggestions.push('Introduce your first CTA before word 220 to capture motivated readers early.');
    }
    if (paywallMentions === 0) {
      suggestions.push('Add a paywall teaser with a concrete benefit before the midpoint.');
    }
    if (!/(benefit|outcome|result|because)/i.test(text)) {
      suggestions.push('Connect each paid prompt to an explicit reader outcome.');
    }

    const strength = Math.max(1, Math.min(100, 88 - suggestions.length * 18));
    return { strength, suggestions };
  }

  return { analyze };
})();
