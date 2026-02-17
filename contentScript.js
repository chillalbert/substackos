/**
 * Main content script orchestrating in-page overlays and editor tools.
 * All UI widgets are opt-in per page type to avoid blocking native Substack features.
 */
(() => {
  const pathname = location.pathname || '';
  const isEditor = /\/publish|\/editor/.test(pathname) || !!document.querySelector('[contenteditable="true"], .ProseMirror');
  const isNotesPage = /\/notes/.test(pathname);
  const isDashboard = /\/dashboard|\/home|\/activity|\/stats/.test(pathname);
  const isPublicPublication = !isEditor && !isNotesPage && !isDashboard;

  if (isEditor) {
    initEditorOverlay();
    initFrameworkButtons();
  }

  if (isNotesPage || isDashboard) {
    initNotesSchedulerButton();
  }

  // Restrict competitive overlay to publication-like pages only.
  if (isPublicPublication && looksLikePublicationPage()) {
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
    if (!editor || document.querySelector('.sgos-overlay-panel')) return;

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
      const content = editor.innerText || editor.textContent || editor.value || '';
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
   * Adds a compact side button that opens notes analyzer + scheduler.
   */
  function initNotesSchedulerButton() {
    if (document.querySelector('.sgos-notes-fab')) return;

    const fab = document.createElement('button');
    fab.className = 'sgos-notes-fab';
    fab.title = 'Open Notes Scheduler';
    fab.textContent = 'N';
    document.body.appendChild(fab);

    fab.addEventListener('click', () => {
      const existing = document.querySelector('.sgos-notes-scheduler');
      if (existing) return existing.remove();
      openNotesSchedulerPanel();
    });
  }

  async function openNotesSchedulerPanel() {
    const panel = document.createElement('aside');
    panel.className = 'sgos-notes-scheduler';
    panel.innerHTML = `
      <h4>Notes Analyzer + Scheduler</h4>
      <p class="sgos-muted">Paste a draft and schedule your next Notes without blocking the page.</p>
      <textarea id="sgos-notes-input" rows="5" placeholder="Paste your draft paragraph..."></textarea>
      <div id="sgos-notes-analysis" class="sgos-muted">No analysis yet.</div>
      <input id="sgos-note-time" type="datetime-local" />
      <div class="sgos-inline-row">
        <button id="sgos-analyze-notes">Analyze</button>
        <button id="sgos-save-note">Schedule</button>
        <button id="sgos-close-note">Close</button>
      </div>
      <div id="sgos-next-note" class="sgos-muted"></div>
    `;
    document.body.appendChild(panel);

    const { scheduledNotes = [] } = await StorageUtil.getLocal(['scheduledNotes']);
    renderNextScheduled(panel, scheduledNotes);

    panel.querySelector('#sgos-analyze-notes').addEventListener('click', () => {
      const text = panel.querySelector('#sgos-notes-input').value.trim();
      const result = ReaderPsychologyModule.analyzeText(text);
      const topIssues = result.issues.slice(0, 3).map(i => i.message).join(' • ') || 'Strong structure';
      panel.querySelector('#sgos-notes-analysis').textContent = `Score ${result.score}/100 — ${topIssues}`;
    });

    panel.querySelector('#sgos-save-note').addEventListener('click', async () => {
      const text = panel.querySelector('#sgos-notes-input').value.trim();
      const scheduledAt = panel.querySelector('#sgos-note-time').value;
      if (!text || !scheduledAt) return;
      scheduledNotes.push({ text, scheduledAt, createdAt: new Date().toISOString() });
      await StorageUtil.setLocal({ scheduledNotes });
      renderNextScheduled(panel, scheduledNotes);
      panel.querySelector('#sgos-notes-input').value = '';
    });

    panel.querySelector('#sgos-close-note').addEventListener('click', () => panel.remove());
  }

  function renderNextScheduled(panel, notes) {
    const next = [...notes]
      .filter(n => new Date(n.scheduledAt).getTime() > Date.now())
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];
    panel.querySelector('#sgos-next-note').textContent = next
      ? `Next scheduled note: ${new Date(next.scheduledAt).toLocaleString()}`
      : 'No upcoming scheduled notes.';
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
    if (document.querySelector('.sgos-competitive-overlay')) return;
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

  function looksLikePublicationPage() {
    const hasPostCards = document.querySelectorAll('article, .post-preview, .post-preview-title, h2').length > 3;
    const likelyAppChrome = document.querySelector('[data-testid="dashboard"], .dashboard-container, [aria-label="Stats"]');
    return hasPostCards && !likelyAppChrome;
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
    return text.replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
})();
