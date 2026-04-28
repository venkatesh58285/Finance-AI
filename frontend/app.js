/* ════════════════════════════════════════════════════════════
   FinanceNarrate AI — Frontend Logic
   ════════════════════════════════════════════════════════════ */

'use strict';

// ── State ──────────────────────────────────────────────────────────
let globalData = null;
let currentPage = 'dashboard';

// ── DOM refs ───────────────────────────────────────────────────────
const homePage       = document.getElementById('home-page');
const appShell       = document.getElementById('app-shell');
const loadingOverlay = document.getElementById('loading');
const fileInput      = document.getElementById('file-input');
const dropZone       = document.getElementById('drop-zone');
const hamburgerBtn   = document.getElementById('hamburger-btn');
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// ── Sidebar toggle (mobile) ────────────────────────────────────────
hamburgerBtn.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

function toggleSidebar() {
  const open = sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('hidden', !open);
}
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.add('hidden');
}

// ── Scroll helper ─────────────────────────────────────────────────
function scrollToUpload() {
  document.getElementById('upload').scrollIntoView({ behavior: 'smooth' });
}

// ── Sample Data ───────────────────────────────────────────────────
function loadSampleData() {
  const csv = `month,revenue,expenses
Jan,1000000,700000
Feb,1200000,800000
Mar,900000,850000
Apr,700000,900000
May,1500000,800000
Jun,1600000,900000
Jul,1650000,1500000
Aug,1700000,900000
Sep,1800000,950000
Oct,2500000,1000000
Nov,1900000,1000000
Dec,2000000,1050000`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const file = new File([blob], 'sample_financial_data.csv', { type: 'text/csv' });
  processFile(file);
}

// ── File input / Drag-and-drop ────────────────────────────────────
fileInput.addEventListener('change', function () {
  if (this.files.length) processFile(this.files[0]);
});

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev =>
  dropZone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); })
);
['dragenter', 'dragover'].forEach(ev =>
  dropZone.addEventListener(ev, () => dropZone.classList.add('dragover'))
);
['dragleave', 'drop'].forEach(ev =>
  dropZone.addEventListener(ev, () => dropZone.classList.remove('dragover'))
);
dropZone.addEventListener('drop', e => {
  const files = e.dataTransfer.files;
  if (files.length) processFile(files[0]);
});
dropZone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') fileInput.click();
});

// ── Core: send file to API ────────────────────────────────────────
function processFile(file) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showToast('Please upload a valid .csv file.', 'error');
    return;
  }

  showLoading(true);

  const fd = new FormData();
  fd.append('file', file);

  fetch('/generate-report-csv', { method: 'POST', body: fd })
    .then(r => {
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      return r.json();
    })
    .then(data => {
      globalData = data;
      showLoading(false);
      renderApp(data);
    })
    .catch(err => {
      showLoading(false);
      showToast('Error: ' + err.message + ' — Is the FastAPI server running?', 'error');
      console.error(err);
    });
}

function showLoading(show) {
  loadingOverlay.classList.toggle('hidden', !show);
}

// ── Render full dashboard ─────────────────────────────────────────
function renderApp(data) {
  homePage.classList.add('hidden');
  appShell.classList.remove('hidden');

  renderKPIs(data);
  renderSummary(data.summary);
  renderFlags(data.insights);
  renderMainChart(data.data);
  showPage('dashboard');
}

// ── KPI Cards ─────────────────────────────────────────────────────
function renderKPIs(data) {
  const rows = data.data;
  const totalRevenue  = rows.reduce((s, r) => s + (r.revenue  || 0), 0);
  const totalExpenses = rows.reduce((s, r) => s + (r.expenses || 0), 0);
  const totalProfit   = rows.reduce((s, r) => s + (r.profit   || 0), 0);
  const margin        = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;
  const anomalyCount  = rows.filter(r => r.revenue_anomaly || r.expense_anomaly).length;

  setText('kpi-revenue',   fmt(totalRevenue));
  setText('kpi-profit',    fmt(totalProfit));
  setText('kpi-margin',    margin.toFixed(1) + '%');
  setText('kpi-anomalies', anomalyCount.toString());
  setText('kpi-periods',   rows.length.toString());
}

// ── Summary (render as HTML, fixing the tags-showing bug) ─────────
function renderSummary(summary) {
  const el = document.getElementById('summary-content');
  // The LLM returns HTML — we inject it directly so <mark>, <ul>, <li> render properly
  el.innerHTML = summary || '<p style="color:var(--muted)">No summary available.</p>';
}

// ── Performance Flags ─────────────────────────────────────────────
function renderFlags(insights) {
  setText('flag-trends',    insights.trends    || 'No significant trends detected.');
  setText('flag-anomalies', insights.anomalies || 'No anomalies detected.');
  setText('flag-profit',    insights.profit_analysis || 'N/A');
}

// ── Main Chart ────────────────────────────────────────────────────
function renderMainChart(rows) {
  const months   = rows.map(r => r.month || '');
  const revenue  = rows.map(r => r.revenue  || 0);
  const expenses = rows.map(r => r.expenses || 0);
  const profit   = rows.map(r => r.profit   || 0);

  const revAnoX = [], revAnoY = [], expAnoX = [], expAnoY = [];
  rows.forEach(r => {
    if (r.revenue_anomaly)  { revAnoX.push(r.month); revAnoY.push(r.revenue); }
    if (r.expense_anomaly)  { expAnoX.push(r.month); expAnoY.push(r.expenses); }
  });

  const traces = [
    {
      x: months, y: profit, type: 'bar', name: 'Profit',
      marker: {
        color: profit.map(p => p >= 0 ? 'rgba(16,185,129,.35)' : 'rgba(244,63,94,.35)'),
        line:  { color: profit.map(p => p >= 0 ? '#10b981' : '#f43f5e'), width: 1 }
      }
    },
    {
      x: months, y: revenue, type: 'scatter', mode: 'lines+markers', name: 'Revenue',
      line: { color: '#6366f1', width: 3, shape: 'spline' }, marker: { size: 7 }
    },
    {
      x: months, y: expenses, type: 'scatter', mode: 'lines+markers', name: 'Expenses',
      line: { color: '#f43f5e', width: 3, shape: 'spline' }, marker: { size: 7 }
    }
  ];

  if (revAnoX.length) traces.push({
    x: revAnoX, y: revAnoY, type: 'scatter', mode: 'markers', name: 'Rev. Anomaly',
    marker: { symbol: 'x-open', size: 14, color: '#f59e0b', line: { width: 2.5 } }
  });
  if (expAnoX.length) traces.push({
    x: expAnoX, y: expAnoY, type: 'scatter', mode: 'markers', name: 'Exp. Anomaly',
    marker: { symbol: 'x-open', size: 14, color: '#f43f5e', line: { width: 2.5 } }
  });

  Plotly.newPlot('main-chart', traces, plotLayout(), { responsive: true, displayModeBar: false });
}

// ── Analytics Charts ──────────────────────────────────────────────
function renderAnalyticsCharts(rows) {
  const months   = rows.map(r => r.month || '');
  const revenue  = rows.map(r => r.revenue  || 0);
  const expenses = rows.map(r => r.expenses || 0);
  const profit   = rows.map(r => r.profit   || 0);

  // Profit Margin %
  const margins = rows.map(r => r.revenue > 0 ? (r.profit / r.revenue * 100) : 0);
  Plotly.newPlot('margin-chart', [{
    x: months, y: margins, type: 'scatter', mode: 'lines+markers', name: 'Profit Margin %',
    fill: 'tozeroy', fillcolor: 'rgba(16,185,129,.1)',
    line: { color: '#10b981', width: 3, shape: 'spline' }, marker: { size: 7 },
    hovertemplate: '%{y:.1f}%<extra></extra>'
  }], { ...plotLayout(), yaxis: { ...plotLayout().yaxis, ticksuffix: '%' } },
  { responsive: true, displayModeBar: false });

  // Financial Breakdown (pie)
  const totRev = revenue.reduce((a, b) => a + b, 0);
  const totExp = expenses.reduce((a, b) => a + b, 0);
  const totPro = profit.reduce((a, b) => a + b, 0);
  Plotly.newPlot('breakdown-chart', [{
    labels: ['Revenue', 'Expenses', 'Profit'],
    values: [totRev, totExp, Math.max(totPro, 0)],
    type: 'pie', hole: 0.45,
    marker: { colors: ['#6366f1', '#f43f5e', '#10b981'] },
    textfont: { color: '#f0f4ff' },
    hovertemplate: '<b>%{label}</b><br>$%{value:,.0f}<extra></extra>'
  }], {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#7b8aaa', family: 'Inter,sans-serif' },
    margin: { t: 10, b: 10, l: 10, r: 10 }, showlegend: true,
    legend: { orientation: 'h', y: -0.15 }
  }, { responsive: true, displayModeBar: false });

  // MoM Growth % — revenue
  const revGrowth = rows.map(r => r.revenue_growth_pct || 0);
  const expGrowth = rows.map(r => r.expense_growth_pct || 0);
  Plotly.newPlot('growth-chart', [
    {
      x: months, y: revGrowth, type: 'bar', name: 'Revenue Growth %',
      marker: { color: revGrowth.map(v => v >= 0 ? 'rgba(99,102,241,.7)' : 'rgba(244,63,94,.7)') },
      hovertemplate: '%{y:.1f}%<extra>Rev Growth</extra>'
    },
    {
      x: months, y: expGrowth, type: 'bar', name: 'Expense Growth %',
      marker: { color: expGrowth.map(v => v >= 0 ? 'rgba(245,158,11,.7)' : 'rgba(16,185,129,.7)') },
      hovertemplate: '%{y:.1f}%<extra>Exp Growth</extra>'
    }
  ], { ...plotLayout(), barmode: 'group', yaxis: { ...plotLayout().yaxis, ticksuffix: '%' } },
  { responsive: true, displayModeBar: false });
}

// ── Reports Table ─────────────────────────────────────────────────
function renderReportsTable(rows) {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    const anomaly = (label, val) =>
      `<span class="td-anomaly"><span class="anomaly-dot ${val ? 'yes' : 'no'}"></span>${val ? 'Yes' : 'No'}</span>`;

    tr.innerHTML = `
      <td><strong>${r.month || '—'}</strong></td>
      <td>${fmt(r.revenue)}</td>
      <td>${fmt(r.expenses)}</td>
      <td style="color:${(r.profit || 0) >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(r.profit)}</td>
      <td style="color:${(r.revenue_growth_pct || 0) >= 0 ? 'var(--green)' : 'var(--red)'}">${(r.revenue_growth_pct || 0).toFixed(1)}%</td>
      <td style="color:${(r.expense_growth_pct || 0) <= 0 ? 'var(--green)' : 'var(--yellow)'}">${(r.expense_growth_pct || 0).toFixed(1)}%</td>
      <td><span class="badge ${r.rule_flags === 'Normal' ? 'badge-green' : 'badge-red'}">${r.rule_flags || 'Normal'}</span></td>
      <td>${anomaly('Rev', r.revenue_anomaly)}</td>
      <td>${anomaly('Exp', r.expense_anomaly)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Page Navigation ───────────────────────────────────────────────
function showPage(page) {
  currentPage = page;
  closeSidebar();

  // Hide all pages
  ['dashboard', 'analytics', 'reports'].forEach(p => {
    document.getElementById('page-' + p).classList.add('hidden');
    document.getElementById('nav-' + p).classList.remove('active');
  });

  // Show target
  document.getElementById('page-' + page).classList.remove('hidden');
  document.getElementById('nav-' + page).classList.add('active');

  // Update topbar title
  const titles = { dashboard: 'Dashboard', analytics: 'Analytics', reports: 'Data Report' };
  setText('topbar-title', titles[page] || page);

  // Lazy-render analytics/reports charts when first visited
  if (page === 'analytics' && globalData) renderAnalyticsCharts(globalData.data);
  if (page === 'reports'   && globalData) renderReportsTable(globalData.data);
}

// ── Go Home ───────────────────────────────────────────────────────
function goHome() {
  appShell.classList.add('hidden');
  homePage.classList.remove('hidden');
  fileInput.value = '';
  globalData = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Shared Plotly Layout ──────────────────────────────────────────
function plotLayout() {
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    font: { color: '#7b8aaa', family: 'Inter,sans-serif', size: 12 },
    margin: { t: 20, l: 60, r: 20, b: 60 },
    xaxis: { gridcolor: 'rgba(255,255,255,.05)', zerolinecolor: 'rgba(255,255,255,.1)' },
    yaxis: { gridcolor: 'rgba(255,255,255,.05)', zerolinecolor: 'rgba(255,255,255,.1)' },
    legend: { orientation: 'h', y: -0.25, x: 0 },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: 'rgba(13,18,35,.95)', bordercolor: 'rgba(99,102,241,.4)',
      font: { color: '#f0f4ff', family: 'Inter,sans-serif' }
    }
  };
}

// ── Helpers ───────────────────────────────────────────────────────
function fmt(n) {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n < 0 ? '-' : '') + '$' + (abs / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000)     return (n < 0 ? '-' : '') + '$' + (abs / 1_000).toFixed(1) + 'K';
  return (n < 0 ? '-$' : '$') + abs.toFixed(0);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ── Toast Notification ────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed;bottom:2rem;right:2rem;z-index:9999;
    background:${type === 'error' ? 'rgba(244,63,94,.15)' : 'rgba(99,102,241,.15)'};
    border:1px solid ${type === 'error' ? 'rgba(244,63,94,.4)' : 'rgba(99,102,241,.4)'};
    color:#f0f4ff;padding:1rem 1.5rem;border-radius:12px;
    backdrop-filter:blur(12px);max-width:380px;font-size:.9rem;
    box-shadow:0 8px 32px rgba(0,0,0,.4);
    animation:fu .3s ease;
  `;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 5000);
}
