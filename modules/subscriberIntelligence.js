/**
 * Subscriber Intelligence Tool.
 */
window.SubscriberIntelligenceModule = (() => {
  function cluster(subscribers) {
    const groups = { coreFans: [], atRisk: [], inactive: [] };
    subscribers.forEach(s => {
      const opens = Number(s.opens || 0);
      const clicks = Number(s.clicks || 0);
      const days = Number(s.days_since_last_open || 999);
      if (opens > 8 && clicks > 2 && days < 14) groups.coreFans.push(s);
      else if (days > 45) groups.inactive.push(s);
      else groups.atRisk.push(s);
    });
    return groups;
  }

  function reengagementIdeas() {
    return [
      'Win-back email: “I made this for readers who fell behind.”',
      'Survey email with one-click response buttons.',
      'Best-of digest with 3 high-value links and a personal note.'
    ];
  }

  return { cluster, reengagementIdeas };
})();
