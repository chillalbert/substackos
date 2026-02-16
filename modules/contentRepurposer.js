/**
 * Content repurposing output generator.
 */
window.ContentRepurposerModule = (() => {
  function generate(baseText, tone = 'insightful') {
    const source = baseText.slice(0, 280);
    return {
      twitter: `Twitter Thread (${tone})\n1/ ${source}\n2/ Why it matters now...\n3/ Action step...`,
      linkedin: `LinkedIn Post (${tone})\n${source}\n\nMy biggest takeaway: ...`,
      instagram: `Instagram Carousel Script (${tone})\nSlide 1: Hook\nSlide 2: Problem\nSlide 3: Insight\nSlide 4: CTA`,
      youtube: `YouTube Script (${tone})\nHook (0:00)\nCore lesson (0:30)\nExamples (2:00)\nCTA (4:00)`,
      notes: Array.from({ length: 10 }).map((_, i) => `Note ${i + 1}: ${source.slice(0, 100)}...`)
    };
  }

  return { generate };
})();
