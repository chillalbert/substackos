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

  function initRouteAwareBoot() {
    bootForCurrentRoute();

    const observer = new MutationObserver(() => {
      if (location.pathname !== currentPath) bootForCurrentRoute();
      ensureNotesFabVisible();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('popstate', bootForCurrentRoute);
    window.addEventListener('hashchange', bootForCurrentRoute);

    setInterval(() => {
      if (location.pathname !== currentPath) bootForCurrentRoute();
      ensureNotesFabVisible();
    }, 1000);
  }

  function bootForCurrentRoute() {
    if (!document.body) return;

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
    const host = location.hostname || '';
    const hasEditorDom = !!document.querySelector('[contenteditable="true"], .ProseMirror');

    const isEditor = /\/publish|\/editor|\/write|\/post\//.test(pathname) || hasEditorDom;
    const isNotesPage = /\/notes/.test(pathname);
    const isDashboardPath = /\/dashboard|\/home|\/activity|\/stats|\/insights|\/subscribers|\/publish\/home/.test(pathname);
    const isDashboardHost = host === 'substack.com' || host === 'www.substack.com';

    const isDashboard = isDashboardPath || isDashboardHost;

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
      editor.classList.toggle('sgos-risk-highlight', result.issues.length >= 4);
    };

    editor.addEventListener('input', run);
    run();
  }

  function findEditorNode() {
    return document.querySelector('[contenteditable="true"], .ProseMirror, textarea');
  }

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
        existing.remove();
        return;
      }
      await openNotesSchedulerPanel();
    });

    restoreNotesPanelIfOpen();
  }

  function ensureNotesFabVisible() {
    const route = detectRoute();
    if (route.isNotesOrDashboard && !document.querySelector('.sgos-notes-fab') && document.body) {
      initNotesSchedulerButton();
    }
  }

  async function restoreNotesPanelIfOpen() {
    const { sgosNotesPanelOpen = false } = await StorageUtil.getLocal(['sgosNotesPanelOpen']);
    if (sgosNotesPanelOpen && !document.querySelector('.sgos-notes-scheduler')) {
      await openNotesSchedulerPanel();
    }
  }

  async function openNotesSchedulerPanel() {
    if (document.querySelector('.sgos-notes-scheduler')) return;

    await StorageUtil.setLocal({ sgosNotesPanelOpen: true });
    const panel = document.createElement('aside');
    panel.className = 'sgos-notes-scheduler';
    panel.innerHTML = `
      <div class="sgos-panel-head">
        <h4>Notes AI Analyzer + Scheduler</h4>
        <button id="sgos-close-note">Close</button>
      </div>
      <span class="sgos-panel-chip">Free local AI only · no paid API</span>
      <textarea id="sgos-notes-input" rows="4" placeholder="Paste your note draft..."></textarea>
      <div id="sgos-notes-analysis" class="sgos-muted">No analysis yet.</div>
      <div class="sgos-inline-row">
        <button id="sgos-analyze-notes">Analyze + Rewrite</button>
        <button id="sgos-save-note">Schedule</button>
      </div>
      <input id="sgos-note-time" type="datetime-local" />
      <div id="sgos-next-note" class="sgos-muted"></div>
      <div id="sgos-status"></div>

      <details class="sgos-section" id="sgos-rewrite-section" open>
        <summary>Rewrite Suggestions</summary>
        <div id="sgos-rewrites" class="sgos-rewrites"></div>
      </details>

      <details class="sgos-section" id="sgos-gcs-section">
        <summary>Substack GCS Builder</summary>
        <button id="sgos-gcs-btn">Generate GCS Blueprint</button>
        <div id="sgos-gcs" class="sgos-muted"></div>
      </details>

      <details class="sgos-section" id="sgos-queue-section" open>
        <summary>Scheduled Queue</summary>
        <div id="sgos-queue-list" class="sgos-muted">No scheduled notes.</div>
      </details>
    `;
    document.body.appendChild(panel);

    const defaultDate = new Date(Date.now() + 3600 * 1000);
    panel.querySelector('#sgos-note-time').value = toDatetimeLocal(defaultDate);

    const { scheduledNotes = [] } = await StorageUtil.getLocal(['scheduledNotes']);
    renderQueue(panel, scheduledNotes);
    renderNextScheduled(panel, scheduledNotes);

    panel.querySelector('#sgos-analyze-notes').addEventListener('click', () => {
      const text = panel.querySelector('#sgos-notes-input').value.trim();
      if (!text) {
        setStatus(panel, 'Add text first to analyze.', true);
        return;
      }

      const result = ReaderPsychologyModule.analyzeText(text);
      const rewrites = AIRewriteAssistantModule.generate(text);
      const topIssues = result.issues.slice(0, 3).map(i => i.message).join(' • ') || 'Strong structure';
      panel.querySelector('#sgos-notes-analysis').textContent = `Score ${result.score}/100 — ${topIssues}`;
      panel.querySelector('#sgos-rewrites').innerHTML = renderRewriteCards(rewrites);

      panel.querySelectorAll('.sgos-insert-rewrite').forEach(btn => {
        btn.addEventListener('click', () => {
          const rewrite = decodeURIComponent(btn.dataset.rewrite || '');
          panel.querySelector('#sgos-notes-input').value = rewrite;
          setStatus(panel, 'Rewrite inserted into draft.', false);
        });
      });
    });

    panel.querySelector('#sgos-save-note').addEventListener('click', async () => {
      const text = panel.querySelector('#sgos-notes-input').value.trim();
      const scheduledAt = panel.querySelector('#sgos-note-time').value;

      if (!text) return setStatus(panel, 'Cannot schedule empty note.', true);
      if (!scheduledAt) return setStatus(panel, 'Select date/time first.', true);

      const list = (await StorageUtil.getLocal(['scheduledNotes'])).scheduledNotes || [];
      const entry = {
        id: (globalThis.crypto?.randomUUID?.() || `note_${Date.now()}`),
        text,
        scheduledAt,
        createdAt: new Date().toISOString()
      };
      list.push(entry);
      await StorageUtil.setLocal({ scheduledNotes: list });

      renderQueue(panel, list);
      renderNextScheduled(panel, list);
      panel.querySelector('#sgos-notes-input').value = '';
      setStatus(panel, `Scheduled for ${new Date(scheduledAt).toLocaleString()}.`, false);
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

  function renderQueue(panel, notes) {
    const root = panel.querySelector('#sgos-queue-list');
    if (!notes.length) {
      root.textContent = 'No scheduled notes.';
      return;
    }

    const sorted = [...notes].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    root.innerHTML = sorted.slice(0, 8).map(n => `
      <article class="sgos-queue-item">
        <p><strong>${new Date(n.scheduledAt).toLocaleString()}</strong></p>
        <p>${escapeHtml(n.text.slice(0, 120))}${n.text.length > 120 ? '…' : ''}</p>
        <button data-delete-id="${n.id}">Delete</button>
      </article>
    `).join('');

    root.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-delete-id');
        const list = (await StorageUtil.getLocal(['scheduledNotes'])).scheduledNotes || [];
        const next = list.filter(item => item.id !== id);
        await StorageUtil.setLocal({ scheduledNotes: next });
        renderQueue(panel, next);
        renderNextScheduled(panel, next);
      });
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

  function setStatus(panel, text, isError) {
    const el = panel.querySelector('#sgos-status');
    el.textContent = text;
    el.style.color = isError ? '#b91c1c' : '#065f46';
  }

  function toDatetimeLocal(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
    panel.querySelector('#sgos-next-note').textContent = next
      ? `Next scheduled: ${new Date(next.scheduledAt).toLocaleString()} · queued: ${sorted.length}`
      : `No upcoming scheduled notes. Queued: ${sorted.length}`;
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
