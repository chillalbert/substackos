/**
 * Substack Notes Growth Engine.
 */
window.NotesGrowthEngine = (() => {
  function suggestViralNotes(draft) {
    const seed = draft.split(/\n+/).filter(Boolean)[0] || 'insight';
    return Array.from({ length: 5 }).map((_, i) => `${i + 1}. ${seed.slice(0, 120)} — but the non-obvious lesson is this...`);
  }

  function paragraphToNotes(paragraph) {
    return Array.from({ length: 10 }).map((_, i) => `${i + 1}) ${paragraph.slice(0, 160)} #${['creator','growth','writing','strategy'][i % 4]}`);
  }

  function getStreak(history = []) {
    if (!history.length) return 0;
    const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let cursor = new Date();
    for (const entry of sorted) {
      const d = new Date(entry.date);
      const sameDay = d.toDateString() === cursor.toDateString();
      const yesterday = d.toDateString() === new Date(cursor.getTime() - 86400000).toDateString();
      if (sameDay || yesterday) {
        streak++;
        cursor = d;
      } else {
        break;
      }
    }
    return streak;
  }

  function suggestPostingTimes(history = []) {
    if (!history.length) return ['08:30', '12:30', '18:00'];
    const buckets = {};
    history.forEach(h => {
      const hour = new Date(h.date).getHours();
      buckets[hour] = (buckets[hour] || 0) + (h.engagement || 1);
    });
    return Object.entries(buckets)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${String(hour).padStart(2, '0')}:00`);
  }

  return { suggestViralNotes, paragraphToNotes, getStreak, suggestPostingTimes };
})();
