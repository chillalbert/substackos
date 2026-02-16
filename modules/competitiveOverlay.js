/**
 * Competitive Intelligence Overlay module.
 */
window.CompetitiveOverlayModule = (() => {
  /**
   * Derives competitor signals from public Substack DOM.
   * @returns {{growthVelocity:string, postingFrequency:string, avgHeadlineLength:number, topicClusters:string[], hookPatterns:string[]}}
   */
  function analyzePublicationPage() {
    const headlines = [...document.querySelectorAll('h1, h2, .post-preview-title')]
      .map(el => el.textContent.trim())
      .filter(Boolean)
      .slice(0, 20);

    const avgHeadlineLength = headlines.length
      ? Math.round(headlines.reduce((sum, h) => sum + h.split(/\s+/).length, 0) / headlines.length)
      : 0;

    const topicTokenMap = new Map();
    headlines.forEach(line => {
      line.toLowerCase().split(/\W+/).forEach(token => {
        if (token.length < 5) return;
        topicTokenMap.set(token, (topicTokenMap.get(token) || 0) + 1);
      });
    });

    const topicClusters = [...topicTokenMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([token]) => token);

    const hookPatterns = [];
    if (headlines.some(h => /how|why|what/i.test(h))) hookPatterns.push('Question-led hooks');
    if (headlines.some(h => /mistake|truth|secret|lie/i.test(h))) hookPatterns.push('Contrarian hooks');
    if (headlines.some(h => /story|confession|learned/i.test(h))) hookPatterns.push('Story hooks');

    const postingFrequency = headlines.length > 12 ? 'High (3+/week)' : headlines.length > 6 ? 'Medium (1-2/week)' : 'Low';
    const growthVelocity = headlines.length > 10 ? 'Accelerating' : 'Stable';

    return {
      growthVelocity,
      postingFrequency,
      avgHeadlineLength,
      topicClusters,
      hookPatterns: hookPatterns.length ? hookPatterns : ['Neutral hooks']
    };
  }

  return { analyzePublicationPage };
})();
