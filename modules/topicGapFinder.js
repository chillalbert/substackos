/**
 * Topic Gap Finder.
 */
window.TopicGapFinderModule = (() => {
  function analyze(rows) {
    const topicCount = {};
    rows.forEach(r => {
      const topic = (r.topic || 'unknown').toLowerCase();
      topicCount[topic] = (topicCount[topic] || 0) + 1;
    });
    const sorted = Object.entries(topicCount).sort((a, b) => b[1] - a[1]);
    return {
      overused: sorted.slice(0, 3),
      underexplored: sorted.slice(-3),
      opportunities: ['Revive high-open topic from last quarter', 'Create seasonal version of best-converting theme']
    };
  }

  return { analyze };
})();
