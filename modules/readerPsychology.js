/**
 * Reader Psychology Scanner: structural narrative analysis for draft text.
 */
window.ReaderPsychologyModule = (() => {
  const ISSUE_LABELS = {
    dropOff: 'Drop off risk here',
    hookLate: 'Hook too late',
    abstract: 'Too abstract',
    noTension: 'No tension',
    energyDip: 'Energy dip',
    overlongParagraph: 'Overlong paragraph',
    monotone: 'Monotone sentence rhythm'
  };

  /**
   * Analyze prose for narrative structure signals.
   * @param {string} text
   * @returns {{score:number, issues:Array, metrics:Object}}
   */
  function analyzeText(text = '') {
    const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const words = text.split(/\s+/).filter(Boolean);

    const avgSentenceLength = sentences.length
      ? sentences.reduce((acc, s) => acc + s.split(/\s+/).filter(Boolean).length, 0) / sentences.length
      : 0;

    const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
    const variance = sentenceLengths.length
      ? sentenceLengths.reduce((a, len) => a + Math.pow(len - avgSentenceLength, 2), 0) / sentenceLengths.length
      : 0;

    const issueList = [];

    const first120Words = words.slice(0, 120).join(' ').toLowerCase();
    const hasHookSignal = /(imagine|what if|secret|mistake|truth|story|confession|unexpected)/.test(first120Words);
    if (!hasHookSignal) issueList.push({ type: 'hookLate', message: ISSUE_LABELS.hookLate });

    paragraphs.forEach((p, idx) => {
      const paragraphWords = p.split(/\s+/).filter(Boolean).length;
      if (paragraphWords > 120) {
        issueList.push({
          type: 'overlongParagraph',
          message: `${ISSUE_LABELS.overlongParagraph} (paragraph ${idx + 1})`
        });
      }

      if (/(thing|stuff|many|various|some people|often)/i.test(p) && paragraphWords > 30) {
        issueList.push({ type: 'abstract', message: `${ISSUE_LABELS.abstract} (paragraph ${idx + 1})` });
      }
    });

    if (variance < 12 && sentences.length > 5) {
      issueList.push({ type: 'monotone', message: ISSUE_LABELS.monotone });
    }

    const emotionalMarkers = (text.match(/!|\?|love|fear|risk|hope|urgent|crisis|breakthrough/gi) || []).length;
    if (emotionalMarkers < Math.max(2, Math.floor(sentences.length * 0.12))) {
      issueList.push({ type: 'energyDip', message: ISSUE_LABELS.energyDip });
      issueList.push({ type: 'noTension', message: ISSUE_LABELS.noTension });
    }

    if (paragraphs.length > 4 && issueList.length > 4) {
      issueList.push({ type: 'dropOff', message: ISSUE_LABELS.dropOff });
    }

    const rawScore = 100 - issueList.length * 9 - Math.max(0, avgSentenceLength - 22);
    const score = Math.max(1, Math.min(100, Math.round(rawScore)));

    return {
      score,
      issues: issueList,
      metrics: {
        paragraphs: paragraphs.length,
        sentences: sentences.length,
        avgSentenceLength: Number(avgSentenceLength.toFixed(1)),
        sentenceVariance: Number(variance.toFixed(1))
      }
    };
  }

  return { analyzeText };
})();
