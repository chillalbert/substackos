/**
 * Comment Analyzer.
 */
window.CommentAnalyzerModule = (() => {
  function analyze(comments) {
    const questions = comments.filter(c => /\?/.test(c.text || ''));
    const positive = comments.filter(c => /(love|great|helpful|amazing)/i.test(c.text || '')).length;
    const negative = comments.filter(c => /(confused|bad|unclear|wrong)/i.test(c.text || '')).length;
    const sentiment = positive >= negative ? 'Positive-leaning' : 'Mixed/negative';
    const topReaders = [...comments]
      .reduce((acc, c) => ((acc[c.author] = (acc[c.author] || 0) + 1), acc), {});
    return {
      recurringQuestions: questions.slice(0, 5).map(q => q.text),
      sentiment,
      topReaders: Object.entries(topReaders).sort((a, b) => b[1] - a[1]).slice(0, 5),
      ideaSeeds: ['Answer FAQ in one canonical post', 'Create myth-vs-reality response article']
    };
  }

  return { analyze };
})();
