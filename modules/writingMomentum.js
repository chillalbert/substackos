/**
 * Writing momentum and gamification.
 */
window.WritingMomentumModule = (() => {
  function stats(drafts = []) {
    const streak = drafts.length ? Math.min(30, drafts.length) : 0;
    const velocity = drafts.length ? Math.round(drafts.reduce((a, d) => a + Number(d.wordCount || 0), 0) / drafts.length) : 0;
    const consistency = Math.min(100, Math.round((streak / 14) * 100));
    const badges = [];
    if (streak >= 7) badges.push('7-Day Streak');
    if (velocity >= 900) badges.push('High Velocity Writer');
    if (consistency >= 80) badges.push('Consistency Pro');
    return { streak, velocity, consistency, badges };
  }

  return { stats };
})();
