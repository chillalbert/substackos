/**
 * Idea Validation Engine.
 */
window.IdeaValidationModule = (() => {
  function validate(topic) {
    const saturation = /(ai|newsletter|productivity|crypto)/i.test(topic) ? 'High' : 'Moderate';
    const viability = saturation === 'High' ? 68 : 82;
    return {
      viability,
      saturation,
      angles: [
        `Niche down ${topic} for a specific audience segment.`,
        `Create contrarian stance around ${topic}.`,
        `Use case-study-first structure for ${topic}.`
      ],
      similarStructures: ['How I...', 'Why most creators...', 'The playbook for...']
    };
  }

  return { validate };
})();
