/**
 * Free on-device "AI-style" rewrite helpers (heuristic, no paid APIs).
 */
window.AIRewriteAssistantModule = (() => {
  /**
   * Generates lightweight rewrites and angle variants from input text.
   * @param {string} text
   * @returns {{rewrites: string[], hooks: string[]}}
   */
  function generate(text = '') {
    const clean = text.trim().replace(/\s+/g, ' ');
    if (!clean) {
      return { rewrites: [], hooks: [] };
    }

    const rewrites = [
      tighten(clean),
      makeContrarian(clean),
      makeActionable(clean)
    ].filter(Boolean);

    const hooks = [
      `What if the real reason creators struggle is simpler than we think?`,
      `I tested this the hard way—here's what actually changed my results.`,
      `Most advice about this is outdated. Use this instead.`
    ];

    return { rewrites, hooks };
  }

  function tighten(input) {
    return input
      .replace(/\bvery\b/gi, '')
      .replace(/\breally\b/gi, '')
      .replace(/\bin order to\b/gi, 'to')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function makeContrarian(input) {
    return `Most people think ${input.charAt(0).toLowerCase() + input.slice(1)}. Here's why that misses the real leverage.`;
  }

  function makeActionable(input) {
    return `Try this today: ${input}. Then measure replies, restacks, and profile clicks for 7 days.`;
  }

  return { generate };
})();
