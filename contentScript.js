/**
 * Main content script orchestrating in-page overlays and editor tools.
 * All widgets are route-aware to avoid blocking Substack native UX.
 */
(() => {
  let currentPath = '';

  initRouteAwareBoot();

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'SHOW_RESEARCH_SUGGESTIONS') {
      showResearchSuggestions(message.payload?.suggestions || [], message.payload?.selectedText || '');
    }
  });

  /**
   * Handles Substack SPA navigation and ensures features survive route changes/reloads.
   */
  function initRouteAwareBoot() {
    bootForCurrentRoute();

    const observer = new MutationObserver(() => {
      if (location.pathname !== currentPath) {
        bootForCurrentRoute();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('popstate', bootForCurrentRoute);
    window.addEventListener('hashchange', bootForCurrentRoute);
    setInterval(() => {
      if (location.pathname !== currentPath) bootForCurrentRoute();
    }, 800);
  }

  function bootForCurrentRoute() {
    currentPath = location.pathname;
    const route = detectRoute();

    cleanupRouteUi(route);

    if (route.isEditor) {
      initEditorOverlay();
      initFrameworkButtons();
    }

    if (route.isNotesOrDashboard) {
      initNotesSchedulerButton();
    }

    if (route.isPublicPublication && looksLikePublicationPage()) {
      injectCompetitiveOverlay();
    }
  }

  function detectRoute() {
    const pathname = location.pathname || '';
    const hasEditorDom = !!document.querySelector('[contenteditable="true"], .ProseMirror');

    const isEditor = /\/publish|\/editor|\/write|\/post\//.test(pathname) || hasEditorDom;
    const isNotesPage = /\/notes/.test(pathname);
    const isDashboard = /\/dashboard|\/home|\/activity|\/stats|\/insights|\/subscribers|\/publish\/home/.test(pathname);

    return {
      isEditor,
      isNotesOrDashboard: isNotesPage || isDashboard,
      isPublicPublication: !isEditor && !isNotesPage && !isDashboard
    };
  }

  function cleanupRouteUi(route) {
    if (!route.isEditor) {
      document.querySelector('.sgos-overlay-panel')?.remove();
      document.querySelector('.sgos-framework-toolbar')?.remove();
    }

    if (!route.isNotesOrDashboard) {
      document.querySelector('.sgos-notes-fab')?.remove();
      document.querySelector('.sgos-notes-scheduler')?.remove();
    }

    if (!route.isPublicPublication) {
      document.querySelector('.sgos-competitive-overlay')?.remove();
    }
  }

  /** Creates scanner panel and runs analysis on input changes. */
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

  function applyIssueHighlights(editor, issues) {
    editor.classList.toggle('sgos-risk-highlight', issues.length >= 4);
  }

  function findEditorNode() {
    return document.querySelector('[contenteditable="true"], .ProseMirror, textarea');
  }

  /** Injects quick framework insertion toolbar. */
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

  /** Adds compact side button for Notes tools. */
  function initNotesSchedulerButton() {
    if (document.querySelector('.sgos-notes-fab')) return;

    const fab = document.createElement('button');
    fab.className = 'sgos-notes-fab';
    fab.title = 'Open Notes AI Scheduler';
    fab.textContent = 'N';
    document.body.appendChild(fab);

    fab.addEventListener('click', async () => {
      const existing = document.querySelector('.sgos-notes-scheduler');
      if (existing) {
        await StorageUtil.setLocal({ sgosNotesPanelOpen: false });
        return existing.remove();
      }
      await openNotesSchedulerPanel();
    });

    restoreNotesPanelIfOpen();
  }

  async function restoreNotesPanelIfOpen() {
    const { sgosNotesPanelOpen = false } = await StorageUtil.getLocal(['sgosNotesPanelOpen']);
    if (sgosNotesPanelOpen && !document.querySelector('.sgos-notes-scheduler')) {
      await openNotesSchedulerPanel();
    }
  }

  async function openNotesSchedulerPanel() {
    await StorageUtil.setLocal({ sgosNotesPanelOpen: true });

    const panel = document.createElement('aside');
    panel.className = 'sgos-notes-scheduler';
    panel.innerHTML = `
      <h4>Notes AI Analyzer + Scheduler</h4>
      <p class="sgos-muted">Free local AI-style rewrites (no paid API), plus persistent scheduling.</p>
      <textarea id="sgos-notes-input" rows="5" placeholder="Paste your note draft..."></textarea>
      <div id="sgos-notes-analysis" class="sgos-muted">No analysis yet.</div>
      <div id="sgos-rewrites" class="sgos-rewrites"></div>
      <input id="sgos-note-time" type="datetime-local" />
      <div class="sgos-inline-row">
        <button id="sgos-analyze-notes">Analyze + Rewrite</button>
        <button id="sgos-save-note">Schedule</button>
        <button id="sgos-close-note">Close</button>
      </div>
      <div id="sgos-next-note" class="sgos-muted"></div>
      <div id="sgos-gcs" class="sgos-muted"></div>
      <button id="sgos-gcs-btn">Create Substack GCS</button>
    `;
    document.body.appendChild(panel);

    const { scheduledNotes = [] } = await StorageUtil.getLocal(['scheduledNotes']);
    renderNextScheduled(panel, scheduledNotes);

    panel.querySelector('#sgos-analyze-notes').addEventListener('click', () => {
      const text = panel.querySelector('#sgos-notes-input').value.trim();
      if (!text) return;
      const result = ReaderPsychologyModule.analyzeText(text);
      const rewrites = AIRewriteAssistantModule.generate(text);
      const topIssues = result.issues.slice(0, 3).map(i => i.message).join(' • ') || 'Strong structure';
      panel.querySelector('#sgos-notes-analysis').textContent = `Score ${result.score}/100 — ${topIssues}`;
      panel.querySelector('#sgos-rewrites').innerHTML = renderRewriteCards(rewrites);

      panel.querySelectorAll('.sgos-insert-rewrite').forEach(btn => {
        btn.addEventListener('click', () => {
          const rewrite = decodeURIComponent(btn.dataset.rewrite || '');
          panel.querySelector('#sgos-notes-input').value = rewrite;
        });
      });
    });

    panel.querySelector('#sgos-save-note').addEventListener('click', async () => {
      const text = panel.querySelector('#sgos-notes-input').value.trim();
      const scheduledAt = panel.querySelector('#sgos-note-time').value;
      if (!text || !scheduledAt) return;

      const entry = { id: crypto.randomUUID(), text, scheduledAt, createdAt: new Date().toISOString() };
      scheduledNotes.push(entry);
      await StorageUtil.setLocal({ scheduledNotes });
      renderNextScheduled(panel, scheduledNotes);
      panel.querySelector('#sgos-notes-input').value = '';
    });

    panel.querySelector('#sgos-gcs-btn').addEventListener('click', () => {
      const draft = panel.querySelector('#sgos-notes-input').value.trim();
      panel.querySelector('#sgos-gcs').innerHTML = buildGcsTemplate(draft);
    });

    panel.querySelector('#sgos-close-note').addEventListener('click', async () => {
      await StorageUtil.setLocal({ sgosNotesPanelOpen: false });
      panel.remove();
    });
  }

  function renderRewriteCards(rewrites) {
    const blocks = rewrites.rewrites.map((rewrite, idx) => `
      <article class="sgos-rewrite-card">
        <div class="sgos-muted">Rewrite ${idx + 1}</div>
        <p>${escapeHtml(rewrite)}</p>
        <button class="sgos-insert-rewrite" data-rewrite="${encodeURIComponent(rewrite)}">Use Rewrite</button>
      </article>
    `).join('');

    const hooks = rewrites.hooks.map(h => `<li>${escapeHtml(h)}</li>`).join('');
    return `${blocks}<div class="sgos-muted">Hook ideas:</div><ul>${hooks}</ul>`;
  }

  function buildGcsTemplate(topic) {
    const seed = topic || 'your core topic';
    return `
      <strong>Substack GCS Blueprint</strong><br>
      1) Weekly pillar: Deep-dive on ${escapeHtml(seed)}.<br>
      2) Notes sequence: Hook → insight → CTA over 3 posts.<br>
      3) Conversion loop: Notes poll → long-form post → paid teaser.<br>
      4) KPI cadence: track replies, restacks, paid clicks each week.
    `;
  }

  function renderNextScheduled(panel, notes) {
    const sorted = [...notes].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    const next = sorted.find(n => new Date(n.scheduledAt).getTime() > Date.now());
    const count = sorted.length;

    panel.querySelector('#sgos-next-note').textContent = next
      ? `Next scheduled note: ${new Date(next.scheduledAt).toLocaleString()} · total queued: ${count}`
      : `No upcoming scheduled notes. Total queued: ${count}`;
  }

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
