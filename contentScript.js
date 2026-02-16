/**
 * Main content script orchestrating in-page overlays and editor tools.
 */
(() => {
  const isEditor = /\/publish|\/editor|\/p\//.test(location.pathname) || !!document.querySelector('[contenteditable="true"]');
  const isNotes = /\/notes/.test(location.pathname);

  if (isEditor) {
    initEditorOverlay();
    initFrameworkButtons();
  }

  if (!isEditor && !isNotes) {
    injectCompetitiveOverlay();
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'SHOW_RESEARCH_SUGGESTIONS') {
      showResearchSuggestions(message.payload?.suggestions || [], message.payload?.selectedText || '');
    }
  });

  /**
   * Creates scanner panel and runs analysis on input changes.
   */
  function initEditorOverlay() {
    const editor = findEditorNode();
    if (!editor) return;

    const panel = document.createElement('aside');
    panel.className = 'sgos-overlay-panel';
    panel.innerHTML = `
      <h3>Structural Scanner</h3>
      <div id="sgos-score">Score: --</div>
      <ul id="sgos-issues"></ul>
      <div id="sgos-engagement"></div>
      <div id="sgos-conversion"></div>
    `;
    document.body.appendChild(panel);

    const run = () => {
      const content = editor.innerText || editor.textContent || '';
      const result = ReaderPsychologyModule.analyzeText(content);
      const engagement = EngagementPredictionModule.score(content);
      const conversion = ConversionOptimizerModule.analyze(content);
      panel.querySelector('#sgos-score').textContent = `Structural Strength Score: ${result.score}/100`;
      panel.querySelector('#sgos-issues').innerHTML = result.issues.map(i => `<li>${i.message}</li>`).join('') || '<li>No major structural issues detected.</li>';
      panel.querySelector('#sgos-engagement').textContent = `Engagement Potential: ${engagement.overall}/100`;
      panel.querySelector('#sgos-conversion').textContent = `Conversion Strength: ${conversion.strength}/100`;
      applyIssueHighlights(editor, result.issues);
    };

    editor.addEventListener('input', run);
    run();
  }

  /**
   * Adds lightweight visual warning treatment on editor when risk count is high.
   */
  function applyIssueHighlights(editor, issues) {
    editor.classList.toggle('sgos-risk-highlight', issues.length >= 4);
  }

  function findEditorNode() {
    return document.querySelector('[contenteditable="true"], .ProseMirror, textarea');
  }

  /**
   * Injects quick framework insertion toolbar.
   */
  function initFrameworkButtons() {
    const editor = findEditorNode();
    if (!editor || document.querySelector('.sgos-framework-toolbar')) return;

    const wrap = document.createElement('div');
    wrap.className = 'sgos-framework-toolbar';
    Object.entries(FrameworkLibraryModule.templates).forEach(([key, template]) => {
      const btn = document.createElement('button');
      btn.textContent = key;
      btn.addEventListener('click', () => insertTextAtCursor(editor, `\n\n${template}\n\n`));
      wrap.appendChild(btn);
    });
    document.body.appendChild(wrap);
  }

  /**
   * Displays context-menu generated research suggestion modal.
   */
  function showResearchSuggestions(suggestions, selectedText) {
    const existing = document.querySelector('.sgos-research-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'sgos-research-modal';
    modal.innerHTML = `
      <h4>Add Data for: "${selectedText.slice(0, 80)}"</h4>
      <ul>${suggestions.map(s => `<li data-text="${escapeHtml(s.text)}"><strong>${s.type}:</strong> ${s.text}</li>`).join('')}</ul>
      <button id="sgos-close-research">Close</button>
    `;

    modal.querySelectorAll('li').forEach(item => {
      item.addEventListener('click', () => {
        const text = item.getAttribute('data-text') || '';
        const editor = findEditorNode();
        if (editor) insertTextAtCursor(editor, `\n${text}\n`);
      });
    });

    modal.querySelector('#sgos-close-research').addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
  }

  /**
   * Injects competitive intel panel on public publication pages.
   */
  function injectCompetitiveOverlay() {
    const intel = CompetitiveOverlayModule.analyzePublicationPage();
    const panel = document.createElement('aside');
    panel.className = 'sgos-competitive-overlay';
    panel.innerHTML = `
      <h3>Competitive Intel</h3>
      <p><strong>Growth velocity:</strong> ${intel.growthVelocity}</p>
      <p><strong>Posting frequency:</strong> ${intel.postingFrequency}</p>
      <p><strong>Avg headline length:</strong> ${intel.avgHeadlineLength} words</p>
      <p><strong>Topic clusters:</strong> ${intel.topicClusters.join(', ') || 'N/A'}</p>
      <p><strong>Hook patterns:</strong> ${intel.hookPatterns.join(', ')}</p>
    `;
    document.body.appendChild(panel);
  }

  /**
   * Inserts text into input/editor target.
   */
  function insertTextAtCursor(target, text) {
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? start;
      target.value = `${target.value.slice(0, start)}${text}${target.value.slice(end)}`;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    document.execCommand('insertText', false, text);
  }

  function escapeHtml(text) {
    return text.replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c]));
  }
})();
