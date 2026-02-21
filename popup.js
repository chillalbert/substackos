/**
 * Popup app with tab-based navigation and module orchestration.
 */
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'notes', label: 'Notes Engine' },
  { id: 'analytics', label: 'Analytics 2.0' },
  { id: 'subscribers', label: 'Subscribers' },
  { id: 'repurpose', label: 'Repurposer' },
  { id: 'headline', label: 'Headline A/B' },
  { id: 'idea', label: 'Idea Validation' },
  { id: 'topic', label: 'Topic Gap' },
  { id: 'momentum', label: 'Momentum' },
  { id: 'insights', label: 'Comments/Persona' }
];

let activeTab = 'overview';

init();

function init() {
  renderTabs();
  renderActiveTab();
}

function renderTabs() {
  const tabNav = document.getElementById('tabNav');
  tabNav.innerHTML = tabs.map(t => `<button class="tab-btn ${t.id === activeTab ? 'active' : ''}" data-id="${t.id}">${t.label}</button>`).join('');
  tabNav.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
    activeTab = btn.dataset.id;
    renderTabs();
    renderActiveTab();
  }));
}

async function renderActiveTab() {
  const root = document.getElementById('tabContent');
  if (activeTab === 'overview') return renderOverview(root);
  if (activeTab === 'notes') return renderNotes(root);
  if (activeTab === 'analytics') return renderAnalytics(root);
  if (activeTab === 'subscribers') return renderSubscribers(root);
  if (activeTab === 'repurpose') return renderRepurposer(root);
  if (activeTab === 'headline') return renderHeadline(root);
  if (activeTab === 'idea') return renderIdea(root);
  if (activeTab === 'topic') return renderTopic(root);
  if (activeTab === 'momentum') return renderMomentum(root);
  if (activeTab === 'insights') return renderInsights(root);
}

function renderOverview(root) {
  root.innerHTML = `
    <section class="card">
      <h2>Growth OS Modules</h2>
      <p>17 production modules included across editor overlays, analytics, and subscriber intelligence.</p>
      <ul>
        <li>Reader Psychology Scanner + Engagement Prediction + Conversion Optimizer</li>
        <li>Notes Growth Engine, Topic Gap Finder, Momentum Tracker</li>
        <li>Analytics 2.0 with CSV import and Chart.js visualizations</li>
        <li>Subscriber clustering, Persona builder, Comment analyzer</li>
      </ul>
    </section>
  `;
}

async function renderNotes(root) {
  const { notesHistory = [] } = await StorageUtil.getLocal(['notesHistory']);
  root.innerHTML = `
    <section class="card">
      <h2>Substack Notes Growth Engine</h2>
      <textarea id="notesDraft" placeholder="Paste a draft or paragraph..."></textarea>
      <div class="row"><button id="btnViral5">Suggest 5 viral Notes</button><button id="btnTenNotes">Turn into 10 Notes</button></div>
      <div class="row"><button id="btnLogPost">Log note post</button><span id="notesStreak"></span></div>
      <div id="notesOutput"></div>
      <canvas id="notesTrend" height="130"></canvas>
    </section>
  `;

  const streak = NotesGrowthEngine.getStreak(notesHistory);
  document.getElementById('notesStreak').textContent = `Posting streak: ${streak} day(s)`;

  document.getElementById('btnViral5').onclick = () => {
    const draft = document.getElementById('notesDraft').value;
    document.getElementById('notesOutput').innerHTML = listHtml(NotesGrowthEngine.suggestViralNotes(draft));
  };

  document.getElementById('btnTenNotes').onclick = () => {
    const draft = document.getElementById('notesDraft').value;
    document.getElementById('notesOutput').innerHTML = listHtml(NotesGrowthEngine.paragraphToNotes(draft));
  };

  document.getElementById('btnLogPost').onclick = async () => {
    notesHistory.push({ date: new Date().toISOString(), engagement: Math.floor(Math.random() * 100) + 1 });
    await StorageUtil.setLocal({ notesHistory });
    renderNotes(root);
  };

  new Chart(document.getElementById('notesTrend'), {
    type: 'line',
    data: {
      labels: notesHistory.map(n => new Date(n.date).toLocaleDateString()),
      datasets: [{ label: 'Engagement', data: notesHistory.map(n => n.engagement), borderColor: '#6366f1' }]
    }
  });
}

function renderAnalytics(root) {
  root.innerHTML = `
    <section class="card">
      <h2>Analytics Dashboard 2.0</h2>
      <input type="file" id="analyticsCsv" accept=".csv" />
      <p id="corrLine"></p>
      <canvas id="subsChart" height="120"></canvas>
      <canvas id="openChart" height="120"></canvas>
      <canvas id="heatChart" height="120"></canvas>
      <canvas id="scatterChart" height="120"></canvas>
    </section>
  `;

  document.getElementById('analyticsCsv').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const rows = AnalyticsDashboardModule.parseCSV(text);
    drawAnalyticsCharts(rows);
  });
}

function drawAnalyticsCharts(rows) {
  const labels = rows.map(r => r.date || r.title || 'Post');
  const subs = rows.map(r => Number(r.subscribers || 0));
  const openRates = rows.map(r => Number(r.open_rate || 0));
  const words = rows.map(r => Number(r.word_count || 0));
  const corr = AnalyticsDashboardModule.correlation(rows);
  document.getElementById('corrLine').textContent = `Word count vs open rate correlation: ${corr}`;

  new Chart(document.getElementById('subsChart'), { type: 'line', data: { labels, datasets: [{ label: 'Subscriber Growth', data: subs }] } });
  new Chart(document.getElementById('openChart'), { type: 'line', data: { labels, datasets: [{ label: 'Open Rate Trend', data: openRates }] } });
  new Chart(document.getElementById('heatChart'), { type: 'bar', data: { labels, datasets: [{ label: 'Subject Line Performance', data: openRates }] } });
  new Chart(document.getElementById('scatterChart'), {
    type: 'scatter',
    data: { datasets: [{ label: 'Word Count vs Open Rate', data: words.map((w, i) => ({ x: w, y: openRates[i] })) }] }
  });
}

function renderSubscribers(root) {
  root.innerHTML = `
    <section class="card">
      <h2>Subscriber Intelligence Tool</h2>
      <input type="file" id="subsCsv" accept=".csv" />
      <div id="subsOutput"></div>
      <canvas id="distChart" height="120"></canvas>
    </section>
  `;
  document.getElementById('subsCsv').addEventListener('change', async (e) => {
    const text = await e.target.files[0].text();
    const rows = AnalyticsDashboardModule.parseCSV(text);
    const groups = SubscriberIntelligenceModule.cluster(rows);
    document.getElementById('subsOutput').innerHTML = `
      <p>Core Fans: ${groups.coreFans.length}</p>
      <p>At Risk: ${groups.atRisk.length}</p>
      <p>Inactive: ${groups.inactive.length}</p>
      <ul>${SubscriberIntelligenceModule.reengagementIdeas().map(x => `<li>${x}</li>`).join('')}</ul>
    `;
    new Chart(document.getElementById('distChart'), {
      type: 'doughnut',
      data: {
        labels: ['Core Fans', 'At Risk', 'Inactive'],
        datasets: [{ data: [groups.coreFans.length, groups.atRisk.length, groups.inactive.length] }]
      }
    });
  });
}

function renderRepurposer(root) {
  root.innerHTML = `
    <section class="card">
      <h2>Content Repurposer</h2>
      <textarea id="repurposeInput" placeholder="Paste post..."></textarea>
      <select id="toneSel"><option>insightful</option><option>bold</option><option>playful</option><option>authoritative</option></select>
      <button id="genRepurpose">Generate</button>
      <div id="repurposeOut"></div>
    </section>
  `;
  document.getElementById('genRepurpose').onclick = () => {
    const result = ContentRepurposerModule.generate(document.getElementById('repurposeInput').value, document.getElementById('toneSel').value);
    document.getElementById('repurposeOut').innerHTML = Object.entries(result).map(([k, v]) => {
      const text = Array.isArray(v) ? v.join('\n') : v;
      return `<article class="card"><h3>${k}</h3><small>${text.length} chars</small><pre>${text}</pre><button class="copy-btn" data-copy="${encodeURIComponent(text)}">Copy</button></article>`;
    }).join('');
    root.querySelectorAll('.copy-btn').forEach(btn => btn.onclick = () => navigator.clipboard.writeText(decodeURIComponent(btn.dataset.copy)));
  };
}

function renderHeadline(root) {
  root.innerHTML = `
    <section class="card">
      <h2>Headline A/B Tester</h2>
      <input id="headlineInput" placeholder="Enter base headline" />
      <button id="genHeadlines">Generate 10 variants</button>
      <table><thead><tr><th>Variant</th><th>Prediction</th></tr></thead><tbody id="headlineTable"></tbody></table>
    </section>
  `;
  document.getElementById('genHeadlines').onclick = () => {
    const variants = HeadlineABTesterModule.generateVariants(document.getElementById('headlineInput').value);
    const scored = variants.map(v => ({ v, score: HeadlineABTesterModule.predictPerformance(v) })).sort((a, b) => b.score - a.score);
    document.getElementById('headlineTable').innerHTML = scored.map((s, i) => `<tr class="${i === 0 ? 'winner-row' : ''}"><td>${s.v}</td><td>${s.score}</td></tr>`).join('');
  };
}

function renderIdea(root) {
  root.innerHTML = `
    <section class="card">
      <h2>Idea Validation Engine</h2>
      <input id="ideaInput" placeholder="Enter topic idea" />
      <button id="validateIdea">Validate</button>
      <div id="ideaOut"></div>
    </section>
  `;
  document.getElementById('validateIdea').onclick = () => {
    const res = IdeaValidationModule.validate(document.getElementById('ideaInput').value);
    document.getElementById('ideaOut').innerHTML = `<p>Viability: <strong>${res.viability}/100</strong></p><p>Saturation: ${res.saturation}</p>${listHtml(res.angles)}${listHtml(res.similarStructures)}`;
  };
}

function renderTopic(root) {
  root.innerHTML = `
    <section class="card">
      <h2>Topic Gap Finder</h2>
      <input type="file" id="topicCsv" accept=".csv" />
      <div id="topicOut"></div>
    </section>
  `;
  document.getElementById('topicCsv').addEventListener('change', async e => {
    const rows = AnalyticsDashboardModule.parseCSV(await e.target.files[0].text());
    const result = TopicGapFinderModule.analyze(rows);
    document.getElementById('topicOut').innerHTML = `
      <p>Overused topics: ${result.overused.map(x => x[0]).join(', ')}</p>
      <p>Underexplored: ${result.underexplored.map(x => x[0]).join(', ')}</p>
      ${listHtml(result.opportunities)}
    `;
  });
}

async function renderMomentum(root) {
  const { draftsHistory = [] } = await StorageUtil.getLocal(['draftsHistory']);
  const stats = WritingMomentumModule.stats(draftsHistory);
  root.innerHTML = `
    <section class="card">
      <h2>Writing Momentum Tracker</h2>
      <p>Publishing streak: <strong>${stats.streak}</strong></p>
      <p>Word velocity: <strong>${stats.velocity}</strong></p>
      <p>Consistency score: <strong>${stats.consistency}/100</strong></p>
      <p>Badges: ${stats.badges.join(', ') || 'No badges yet'}</p>
      <button id="logDraftBtn">Log Draft Session</button>
    </section>
  `;
  document.getElementById('logDraftBtn').onclick = async () => {
    draftsHistory.push({ date: new Date().toISOString(), wordCount: Math.floor(Math.random() * 1200) + 200 });
    await StorageUtil.setLocal({ draftsHistory });
    renderMomentum(root);
  };
}

function renderInsights(root) {
  const sampleComments = [
    { author: 'Ava', text: 'Love this breakdown, can you explain the CTA part?' },
    { author: 'Ben', text: 'This was helpful.' },
    { author: 'Ava', text: 'What should we test first?' },
    { author: 'Chris', text: 'I am confused about the segmentation model.' }
  ];
  const comment = CommentAnalyzerModule.analyze(sampleComments);
  const personas = PersonaBuilderModule.build({});
  root.innerHTML = `
    <section class="card">
      <h2>Comment Analyzer + Persona Builder</h2>
      <p>Sentiment trend: ${comment.sentiment}</p>
      <p>Top readers: ${comment.topReaders.map(x => `${x[0]} (${x[1]})`).join(', ')}</p>
      ${listHtml(comment.recurringQuestions)}
      <h3>Personas</h3>
      <ul>
        <li><strong>${personas.coreFan.label}:</strong> ${personas.coreFan.recommendation}</li>
        <li><strong>${personas.casualReader.label}:</strong> ${personas.casualReader.recommendation}</li>
        <li><strong>${personas.highConversion.label}:</strong> ${personas.highConversion.recommendation}</li>
      </ul>
    </section>
  `;
}

function listHtml(items) {
  return `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
}
