/**
 * Built-in Research Assistant helpers.
 */
window.ResearchAssistantModule = (() => {
  /**
   * Builds quick local suggestions if background request is unavailable.
   * @param {string} selected
   */
  function fallbackSuggestions(selected) {
    return [
      { type: 'stat', text: `Add one specific metric tied to “${selected.slice(0, 50)}”.` },
      { type: 'quote', text: 'Include a quote from an operator with first-hand experience.' },
      { type: 'angle', text: 'Contrast short-term outcome vs long-term outcome.' },
      { type: 'citation', text: 'Citation style: [Claim] — [Source], [Year], [URL]' }
    ];
  }

  return { fallbackSuggestions };
})();
