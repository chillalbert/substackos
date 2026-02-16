/**
 * Headline A/B testing helpers.
 */
window.HeadlineABTesterModule = (() => {
  function generateVariants(headline) {
    const stems = ['How', 'Why', 'The', 'What', 'A contrarian guide to', 'The hidden'];
    return Array.from({ length: 10 }).map((_, i) => `${stems[i % stems.length]} ${headline}`.replace(/\s+/g, ' ').trim());
  }

  function predictPerformance(variant) {
    const lenScore = 100 - Math.abs(9 - variant.split(/\s+/).length) * 6;
    const curiosity = /(secret|truth|mistake|future|unexpected)/i.test(variant) ? 12 : 0;
    return Math.max(1, Math.min(100, Math.round(lenScore + curiosity)));
  }

  return { generateVariants, predictPerformance };
})();
