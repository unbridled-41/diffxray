/**
 * @fileoverview Single-File Offline Interactive HTML X-Ray Studio Renderer (v2.0 Editorial Design).
 * Crafted in a warm, tactile Anthropic/Claude research-journal aesthetic:
 * - Warm Archival Cream (#FAF9F5) default light mode + Warm Espresso (#191816) dark mode
 * - Literary serif display headings + clean grotesque UI + refined monospace code
 * - Burnt Terracotta (#D97757), Muted Sage (#4E7A55), Research Slate-Blue (#4A729E), Archival Brick (#C04438)
 * - Synchronized parent/iframe postMessage theme protocol + zero external CDN dependencies
 */

import { escapeHtml, safeJsonForScript } from "./escape.mjs";
import { renderMarkdownTour } from "./markdown-tour.mjs";
import { renderSvgCard } from "./svg-card.mjs";

/**
 * Render a complete, self-contained HTML5 document for an `xrayDiff` report.
 * @param {any} report
 * @param {{ defaultTheme?: "light" | "dark" }} [options]
 * @returns {string}
 */
export function renderHtmlStudio(report, options = {}) {
  const markdownTour = renderMarkdownTour(report);
  const svgCard = renderSvgCard(report);
  const payload = safeJsonForScript({
    report,
    markdownTour,
    svgCard,
  });

  const initialTheme = options.defaultTheme || "light";
  const title = escapeHtml(report.meta?.title || "DiffXray Studio");

  return `<!DOCTYPE html>
<html lang="en" data-theme="${initialTheme}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — DiffXray</title>
<style>
  :root, html[data-theme="light"], [data-theme="light"] {
    --bg: #FAF9F5;
    --bg-elev: #F3F0E8;
    --bg-card: #FFFFFF;
    --bg-hover: #ECE8DC;
    --border: #E5E1D5;
    --border-strong: #CECAC0;
    --fg: #141413;
    --fg-muted: #66635B;
    --fg-dim: #9A968C;
    --accent: #D97757;
    --accent-soft: rgba(217, 119, 87, 0.12);
    --sage: #4E7A55;
    --sage-soft: rgba(78, 122, 85, 0.11);
    --amber: #B57B2E;
    --amber-soft: rgba(181, 123, 46, 0.11);
    --danger: #C04438;
    --danger-soft: rgba(192, 68, 56, 0.10);
    --indigo: #4A729E;
    --indigo-soft: rgba(74, 114, 158, 0.11);
    --diff-add-bg: #F1F7F1;
    --diff-add-intra: #CBE4CE;
    --diff-del-bg: #FDF2F1;
    --diff-del-intra: #F5C8C3;
    --shadow: 0 2px 10px rgba(20, 20, 19, 0.04);
  }
  html[data-theme="dark"], [data-theme="dark"] {
    --bg: #191816;
    --bg-elev: #21201D;
    --bg-card: #262521;
    --bg-hover: #302E29;
    --border: #35332E;
    --border-strong: #4A4740;
    --fg: #F4F1EA;
    --fg-muted: #A6A298;
    --fg-dim: #757168;
    --accent: #D97757;
    --accent-soft: rgba(217, 119, 87, 0.16);
    --sage: #6E9E75;
    --sage-soft: rgba(110, 158, 117, 0.15);
    --amber: #D89B48;
    --amber-soft: rgba(216, 155, 72, 0.15);
    --danger: #DF685C;
    --danger-soft: rgba(223, 104, 92, 0.15);
    --indigo: #78A1CC;
    --indigo-soft: rgba(120, 161, 204, 0.15);
    --diff-add-bg: rgba(110, 158, 117, 0.11);
    --diff-add-intra: rgba(110, 158, 117, 0.32);
    --diff-del-bg: rgba(223, 104, 92, 0.11);
    --diff-del-intra: rgba(223, 104, 92, 0.32);
    --shadow: 0 8px 28px rgba(0, 0, 0, 0.32);
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif;
    font-size: 13.5px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .serif {
    font-family: "Newsreader", "Source Serif 4", "Iowan Old Style", "Palatino Linotype", Georgia, "Songti SC", serif;
    letter-spacing: -0.018em;
  }
  code, pre, .mono {
    font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }

  /* Top Archival Header */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    background: var(--bg-elev);
    border-bottom: 1px solid var(--border);
    padding: 11px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .brand-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .logo-mark {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--accent-soft);
    border: 1px solid var(--accent);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .title-block { min-width: 0; }
  .title-block h1 {
    margin: 0;
    font-size: 16.5px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .subtitle-meta {
    font-size: 11.5px;
    color: var(--fg-muted);
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .top-actions {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 600;
    border: 1px solid var(--border);
    background: var(--bg-card);
  }
  .pill-grade-A, .pill-grade-B { color: var(--sage); border-color: var(--sage); background: var(--sage-soft); }
  .pill-grade-C { color: var(--amber); border-color: var(--amber); background: var(--amber-soft); }
  .pill-grade-D, .pill-grade-F { color: var(--danger); border-color: var(--danger); background: var(--danger-soft); }

  .btn {
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--bg-card);
    color: var(--fg);
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 550;
    transition: background 0.14s, border-color 0.14s, transform 0.1s;
  }
  .btn:hover { background: var(--bg-hover); border-color: var(--border-strong); }
  .btn-primary {
    background: var(--accent);
    border-color: var(--accent);
    color: #FAF9F5;
  }
  .btn-primary:hover {
    background: #C66647;
    border-color: #C66647;
  }
  .btn-soft {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent);
  }

  /* Navigation Tabs */
  .subbar {
    position: sticky;
    top: 53px;
    z-index: 35;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    padding: 0 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .tabs { display: flex; gap: 6px; }
  .tab-btn {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--fg-muted);
    padding: 11px 12px;
    font-size: 13px;
    font-weight: 560;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    transition: color 0.14s;
  }
  .tab-btn:hover { color: var(--fg); }
  .tab-btn.active {
    color: var(--fg);
    border-bottom-color: var(--accent);
  }
  .badge-count {
    font-size: 11px;
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    color: var(--fg-muted);
  }
  .badge-danger { background: var(--danger-soft); color: var(--danger); border-color: var(--danger); }
  .badge-indigo { background: var(--indigo-soft); color: var(--indigo); border-color: var(--indigo); }

  .filter-box {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
  }
  .search-input {
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--fg);
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 12px;
    width: 220px;
  }
  .search-input:focus { outline: none; border-color: var(--accent); }

  /* View Panels */
  .view-panel { display: none; }
  .view-panel.active { display: block; }

  /* Tab 1: Guided Review Layout */
  .tour-grid {
    display: grid;
    grid-template-columns: 290px 1fr;
    min-height: calc(100vh - 108px);
  }
  @media (max-width: 920px) {
    .tour-grid { grid-template-columns: 1fr; }
  }
  .sidebar {
    border-right: 1px solid var(--border);
    background: var(--bg-elev);
    padding: 16px 14px;
    overflow-y: auto;
    max-height: calc(100vh - 108px);
    position: sticky;
    top: 98px;
  }
  .chapter-group { margin-bottom: 18px; }
  .chapter-hdr {
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--fg-muted);
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
  }
  .file-nav-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 9px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    color: var(--fg);
    margin-bottom: 2px;
    transition: background 0.12s;
  }
  .file-nav-item:hover { background: var(--bg-hover); }
  .file-nav-path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .stat-add { color: var(--sage); }
  .stat-del { color: var(--danger); }

  .main-reader { padding: 24px 28px 64px; max-width: 1220px; }
  .verdict-banner {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px 20px;
    margin-bottom: 20px;
    box-shadow: var(--shadow);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .kpi-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 26px;
  }
  @media (max-width: 720px) {
    .kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  .kpi-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 13px 16px;
    box-shadow: var(--shadow);
  }
  .kpi-label { font-size: 10.5px; font-weight: 600; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .kpi-val { font-size: 22px; font-weight: 600; margin-top: 4px; }

  .chapter-section { margin-bottom: 34px; }
  .chapter-banner {
    border-left: 3px solid var(--accent);
    padding-left: 14px;
    margin-bottom: 14px;
  }
  .chapter-banner h2 { margin: 0; font-size: 19px; font-weight: 600; }
  .chapter-banner p { margin: 3px 0 0; font-size: 13px; color: var(--fg-muted); }

  /* File Diff Card */
  .file-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    margin-bottom: 18px;
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  .file-card-hdr {
    padding: 10px 16px;
    background: var(--bg-elev);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .file-tags { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .tag {
    font-size: 11px;
    padding: 1px 8px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg-card);
    color: var(--fg-muted);
  }
  .tag-caller { color: var(--indigo); border-color: var(--indigo); background: var(--indigo-soft); }
  .tag-risk { color: var(--danger); border-color: var(--danger); background: var(--danger-soft); }
  .tag-move { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); }

  .diff-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    line-height: 1.5;
  }
  .hunk-row td {
    background: var(--bg-elev);
    color: var(--fg-muted);
    padding: 4px 14px;
    font-size: 11.5px;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .diff-line td { padding: 1.5px 8px; vertical-align: top; }
  .ln {
    width: 44px;
    text-align: right;
    color: var(--fg-dim);
    user-select: none;
    border-right: 1px solid var(--border);
  }
  .code-cell {
    white-space: pre-wrap;
    word-break: break-word;
    padding-left: 11px !important;
  }
  .line-add { background: var(--diff-add-bg); }
  .line-del { background: var(--diff-del-bg); }
  .intra-add { background: var(--diff-add-intra); border-radius: 2px; padding: 0 1px; }
  .intra-del { background: var(--diff-del-intra); border-radius: 2px; padding: 0 1px; }
  .move-collapse-row td {
    background: var(--accent-soft);
    color: var(--accent);
    padding: 6px 14px;
    font-size: 11.5px;
    font-weight: 550;
    cursor: pointer;
    border-top: 1px dashed var(--border-strong);
    border-bottom: 1px dashed var(--border-strong);
  }
  .inline-risk-box {
    margin: 6px 14px 8px 98px;
    padding: 9px 14px;
    border-radius: 9px;
    border: 1px solid var(--danger);
    border-left-width: 3.5px;
    background: var(--danger-soft);
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  /* Tab 2: Interactive Blast-Radius Graph */
  .graph-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    height: calc(100vh - 104px);
  }
  @media (max-width: 920px) {
    .graph-layout { grid-template-columns: 1fr; height: auto; }
  }
  .graph-stage {
    position: relative;
    overflow: hidden;
    background: radial-gradient(circle at 1px 1px, var(--border-strong) 1px, transparent 0);
    background-size: 24px 24px;
    min-height: 540px;
    cursor: grab;
  }
  .graph-stage:active { cursor: grabbing; }
  .graph-toolbar {
    position: absolute;
    bottom: 14px;
    right: 14px;
    z-index: 10;
    display: flex;
    gap: 6px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    padding: 5px 7px;
    border-radius: 999px;
    box-shadow: var(--shadow);
  }
  .graph-legend {
    position: absolute;
    bottom: 14px;
    left: 14px;
    z-index: 10;
    background: var(--bg-card);
    border: 1px solid var(--border);
    padding: 7px 14px;
    border-radius: 999px;
    font-size: 11.5px;
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    box-shadow: var(--shadow);
  }
  .inspector-pane {
    border-left: 1px solid var(--border);
    background: var(--bg-elev);
    padding: 18px;
    overflow-y: auto;
  }

  /* Tab 3 & 4 */
  .centered-wrap { max-width: 1040px; margin: 0 auto; padding: 28px 22px 64px; }
  .risk-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 18px;
    margin-bottom: 14px;
    box-shadow: var(--shadow);
  }
  .export-textarea {
    width: 100%;
    min-height: 280px;
    background: var(--bg-card);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
    font-size: 12px;
  }
  .toast {
    position: fixed;
    bottom: 22px;
    right: 22px;
    background: var(--fg);
    color: var(--bg);
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 600;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.18s;
    z-index: 99;
  }
  .toast.show { opacity: 1; }
</style>
</head>
<body>

<header class="topbar">
  <div class="brand-row">
    <div class="logo-mark" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.4" fill="currentColor" style="color:var(--accent)"/>
        <circle cx="8" cy="8" r="6.1" stroke="currentColor" stroke-width="1.35" stroke-dasharray="2.6 2" style="color:var(--accent)"/>
      </svg>
    </div>
    <div class="title-block">
      <h1 id="hdr-title" class="serif"></h1>
      <div class="subtitle-meta mono" id="hdr-meta"></div>
    </div>
  </div>
  <div class="top-actions">
    <span id="hdr-grade" class="pill mono"></span>
    <button class="btn" id="btn-diff-mode" title="Toggle Unified vs Side-by-Side Split diff (s)">Diff: Unified</button>
    <button class="btn" id="btn-toggle-moves" title="Toggle pure moved code blocks">Moves: Collapsed</button>
    <button class="btn" id="btn-theme" title="Switch Paper Light / Espresso Dark">Theme</button>
  </div>
</header>

<nav class="subbar">
  <div class="tabs" role="tablist">
    <button class="tab-btn active" data-tab="tour">1. Guided Tour <span class="badge-count" id="cnt-files">0</span></button>
    <button class="tab-btn" data-tab="graph">2. Blast-Radius Map <span class="badge-count badge-indigo" id="cnt-callers">0</span></button>
    <button class="tab-btn" data-tab="risks">3. Silent Risk Radar <span class="badge-count" id="cnt-risks">0</span></button>
    <button class="tab-btn" data-tab="export">4. PR Card &amp; Export</button>
  </div>
  <div class="filter-box">
    <input type="search" id="file-filter" class="search-input mono" placeholder="Filter files or symbols (/)" />
  </div>
</nav>

<main>
  <!-- TAB 1: GUIDED REVIEW TOUR -->
  <section id="panel-tour" class="view-panel active">
    <div class="tour-grid">
      <aside class="sidebar" id="tour-sidebar"></aside>
      <div class="main-reader" id="tour-reader"></div>
    </div>
  </section>

  <!-- TAB 2: INTERACTIVE BLAST-RADIUS GRAPH -->
  <section id="panel-graph" class="view-panel">
    <div class="graph-layout">
      <div class="graph-stage" id="graph-stage">
        <div class="graph-toolbar">
          <button class="btn" id="zoom-in">+</button>
          <button class="btn" id="zoom-out">−</button>
          <button class="btn" id="zoom-reset">Fit View</button>
        </div>
        <div class="graph-legend mono">
          <span><strong style="color:var(--sage)">●</strong> Changed</span>
          <span><strong style="color:var(--accent)">●</strong> High Impact</span>
          <span><strong style="color:var(--indigo)">◌</strong> Untouched Caller</span>
          <span><strong style="color:var(--danger)">●</strong> Signature Break</span>
        </div>
        <svg id="blast-svg" width="100%" height="100%"></svg>
      </div>
      <aside class="inspector-pane" id="node-inspector">
        <div style="color:var(--fg-muted);font-size:13px;line-height:1.6">Select any module node in the Blast-Radius Map to inspect modified symbols, downstream untouched callers, and silent hazard flags.</div>
      </aside>
    </div>
  </section>

  <!-- TAB 3: SILENT RISK RADAR -->
  <section id="panel-risks" class="view-panel">
    <div class="centered-wrap" id="risks-container"></div>
  </section>

  <!-- TAB 4: EXPORT & PR SHARE KIT -->
  <section id="panel-export" class="view-panel">
    <div class="centered-wrap" id="export-container"></div>
  </section>
</main>

<div id="toast" class="toast">Copied to clipboard</div>

<script id="diffxray-data" type="application/json">${payload}</script>
<script>
(() => {
  const rawJson = document.getElementById("diffxray-data").textContent;
  const STATE = JSON.parse(rawJson);
  const { report, markdownTour, svgCard } = STATE;
  let hidePureMoves = true;
  let splitDiffMode = false;
  let filterQuery = "";
  let riskFilter = "all";
  const expandedMoves = new Set();

  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1800);
  }

  function copyText(text, label = "Copied to clipboard") {
    navigator.clipboard?.writeText(text).then(() => toast(label)).catch(() => toast("Copy failed"));
  }

  // Header Binding
  document.getElementById("hdr-title").textContent = report.meta.title || "DiffXray Analysis";
  const metaEl = document.getElementById("hdr-meta");
  metaEl.innerHTML =
    \`<span>\${esc(report.meta.sourceLabel)}</span>\` +
    \`<span>·</span>\` +
    \`<span>\${report.parsedDiff.stats.totalFiles} files (<span class="stat-add">+\${report.parsedDiff.stats.totalAdditions}</span> / <span class="stat-del">-\${report.parsedDiff.stats.totalDeletions}</span>)</span>\` +
    (report.meta.prUrl ? \`<span>·</span><a href="\${esc(report.meta.prUrl)}" target="_blank" rel="noopener">Open PR ↗</a>\` : "");

  const gradeEl = document.getElementById("hdr-grade");
  gradeEl.textContent = \`Trust \${report.riskReport.trustScore}/100 · Grade \${report.riskReport.grade}\`;
  gradeEl.className = \`pill mono pill-grade-\${report.riskReport.grade}\`;

  document.getElementById("cnt-files").textContent = report.parsedDiff.stats.totalFiles;
  document.getElementById("cnt-callers").textContent = report.blastRadius.stats.untouchedCallerCount;
  const cntRisks = document.getElementById("cnt-risks");
  cntRisks.textContent = report.riskReport.counts.total;
  if (report.riskReport.counts.critical + report.riskReport.counts.high > 0) {
    cntRisks.classList.add("badge-danger");
  }

  // Tabs
  function activateTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
    document.querySelectorAll(".view-panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + tabId));
    const filterBox = document.querySelector(".filter-box");
    if (filterBox) filterBox.style.display = tabId === "tour" ? "flex" : "none";
    if (tabId === "graph") renderGraph();
  }
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  // Theme Toggle + Parent Frame Sync
  function setTheme(next) {
    document.documentElement.dataset.theme = next;
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "diffxray-theme", theme: next }, "*");
      }
    } catch (e) {
      if (e && e.name === "SecurityError") return;
    }
  }
  document.getElementById("btn-theme").addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme;
    setTheme(cur === "dark" ? "light" : "dark");
  });
  window.addEventListener("message", (ev) => {
    if (ev.data && ev.data.type === "diffxray-set-theme" && (ev.data.theme === "light" || ev.data.theme === "dark")) {
      document.documentElement.dataset.theme = ev.data.theme;
    }
  });

  // Hide Pure Moves Toggle
  document.getElementById("btn-toggle-moves").addEventListener("click", (e) => {
    hidePureMoves = !hidePureMoves;
    e.currentTarget.textContent = \`Moves: \${hidePureMoves ? "Collapsed" : "Expanded"}\`;
    renderTour();
  });

  // Unified vs Split Diff Mode Toggle
  const diffModeBtn = document.getElementById("btn-diff-mode");
  function toggleSplitMode() {
    splitDiffMode = !splitDiffMode;
    diffModeBtn.textContent = \`Diff: \${splitDiffMode ? "Split" : "Unified"}\`;
    renderTour();
  }
  diffModeBtn.addEventListener("click", toggleSplitMode);

  // Search Filter
  const searchInput = document.getElementById("file-filter");
  searchInput.addEventListener("input", (e) => {
    filterQuery = e.target.value.trim().toLowerCase();
    renderTour();
  });

  // Keyboard Navigation
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      if (e.key === "Escape") e.target.blur();
      return;
    }
    if (e.key === "/") { e.preventDefault(); searchInput.focus(); }
    else if (e.key === "s") toggleSplitMode();
    else if (e.key === "1") activateTab("tour");
    else if (e.key === "2") activateTab("graph");
    else if (e.key === "3") activateTab("risks");
    else if (e.key === "4") activateTab("export");
  });

  function renderCodeWithIntraline(line) {
    const text = line.content || "";
    const prefix = line.type === "add" ? "+" : line.type === "del" ? "-" : " ";
    if (!Array.isArray(line.intraline)) {
      return esc(prefix + text);
    }
    const [s, e] = line.intraline;
    if (s >= e || s < 0 || e > text.length) return esc(prefix + text);
    const cls = line.type === "add" ? "intra-add" : "intra-del";
    return (
      esc(prefix + text.slice(0, s)) +
      \`<span class="\${cls}">\` +
      esc(text.slice(s, e)) +
      \`</span>\` +
      esc(text.slice(e))
    );
  }

  function renderFileCard(file) {
    const findingsByLine = new Map();
    for (const rf of file.riskFindings || []) {
      const k = rf.lineNumber || 1;
      if (!findingsByLine.has(k)) findingsByLine.set(k, []);
      findingsByLine.get(k).push(rf);
    }

    const callersCount = (file.downstreamCallers || []).length;
    let rowsHtml = "";
    const colSpan = splitDiffMode ? 4 : 3;

    for (const hunk of file.hunks || []) {
      rowsHtml += \`<tr class="hunk-row mono"><td colspan="\${colSpan}">\${esc(hunk.header)}</td></tr>\`;
      let idx = 0;
      while (idx < hunk.lines.length) {
        const line = hunk.lines[idx];
        if (hidePureMoves && line.moveId && line.isPureMove && !expandedMoves.has(line.moveId + ":" + file.path)) {
          const moveId = line.moveId;
          let count = 0;
          while (idx < hunk.lines.length && hunk.lines[idx].moveId === moveId && hunk.lines[idx].isPureMove) {
            count++;
            idx++;
          }
          const mvMeta = report.moveReport.moves.find((m) => m.id === moveId);
          const peer = mvMeta
            ? (mvMeta.fromFile === file.path ? \`moved → \${mvMeta.toFile}\` : \`moved ← \${mvMeta.fromFile}\`)
            : "moved block";
          rowsHtml += \`<tr class="move-collapse-row mono" data-move-key="\${esc(moveId + ":" + file.path)}"><td colspan="\${colSpan}">⇄ \${count} moved lines collapsed (\${esc(peer)}) — click to expand</td></tr>\`;
          continue;
        }

        if (splitDiffMode) {
          if (line.type === "context") {
            const cell = esc(" " + (line.content || ""));
            rowsHtml += \`<tr class="diff-line mono"><td class="ln">\${line.oldNumber ?? ""}</td><td class="code-cell" style="width:50%;border-right:1px solid var(--border)">\${cell}</td><td class="ln">\${line.newNumber ?? ""}</td><td class="code-cell" style="width:50%">\${cell}</td></tr>\`;
            idx++;
            continue;
          }
          const dels = [];
          const adds = [];
          while (idx < hunk.lines.length && hunk.lines[idx].type === "del") dels.push(hunk.lines[idx++]);
          while (idx < hunk.lines.length && hunk.lines[idx].type === "add") adds.push(hunk.lines[idx++]);
          const maxLen = Math.max(dels.length, adds.length);
          const pendingRisks = [];
          for (let k = 0; k < maxLen; k++) {
            const dL = dels[k];
            const aL = adds[k];
            const leftTd = dL
              ? \`<td class="ln line-del">\${dL.oldNumber ?? ""}</td><td class="code-cell line-del" style="width:50%;border-right:1px solid var(--border)">\${renderCodeWithIntraline(dL)}</td>\`
              : \`<td class="ln"></td><td class="code-cell" style="width:50%;border-right:1px solid var(--border)"></td>\`;
            const rightTd = aL
              ? \`<td class="ln line-add">\${aL.newNumber ?? ""}</td><td class="code-cell line-add" style="width:50%">\${renderCodeWithIntraline(aL)}</td>\`
              : \`<td class="ln"></td><td class="code-cell" style="width:50%"></td>\`;
            rowsHtml += \`<tr class="diff-line mono">\${leftTd}\${rightTd}</tr>\`;
            if (aL && aL.newNumber && findingsByLine.has(aL.newNumber)) {
              pendingRisks.push(...findingsByLine.get(aL.newNumber));
              findingsByLine.delete(aL.newNumber);
            }
          }
          for (const rf of pendingRisks) {
            rowsHtml += \`<tr><td colspan="4"><div class="inline-risk-box"><div><strong>[\${esc(rf.severity.toUpperCase())} · \${esc(rf.ruleId)}]</strong> \${esc(rf.title)}<div style="color:var(--fg-muted);margin-top:2px">\${esc(rf.whyItMatters)}</div></div><button class="btn copy-fix-btn" data-prompt="\${esc(rf.agentFixPrompt)}">Copy Agent Fix Prompt</button></div></td></tr>\`;
          }
          continue;
        }

        const rowClass = line.type === "add" ? "diff-line line-add" : line.type === "del" ? "diff-line line-del" : "diff-line";
        const oldN = line.oldNumber ?? "";
        const newN = line.newNumber ?? "";
        rowsHtml += \`<tr class="\${rowClass} mono"><td class="ln">\${oldN}</td><td class="ln">\${newN}</td><td class="code-cell">\${renderCodeWithIntraline(line)}</td></tr>\`;

        if (line.type !== "del" && line.newNumber && findingsByLine.has(line.newNumber)) {
          for (const rf of findingsByLine.get(line.newNumber)) {
            rowsHtml += \`<tr><td colspan="3"><div class="inline-risk-box"><div><strong>[\${esc(rf.severity.toUpperCase())} · \${esc(rf.ruleId)}]</strong> \${esc(rf.title)}<div style="color:var(--fg-muted);margin-top:2px">\${esc(rf.whyItMatters)}</div></div><button class="btn copy-fix-btn" data-prompt="\${esc(rf.agentFixPrompt)}">Copy Agent Fix Prompt</button></div></td></tr>\`;
          }
          findingsByLine.delete(line.newNumber);
        }
        idx++;
      }
    }

    let topAlerts = "";
    for (const [, list] of findingsByLine) {
      for (const rf of list) {
        topAlerts += \`<div class="inline-risk-box" style="margin:10px 16px"><div><strong>[\${esc(rf.severity.toUpperCase())} · \${esc(rf.ruleId)}]</strong> \${esc(rf.title)} — \${esc(rf.whyItMatters)}</div><button class="btn copy-fix-btn" data-prompt="\${esc(rf.agentFixPrompt)}">Copy Agent Fix Prompt</button></div>\`;
      }
    }

    const cardId = "file-" + file.path.replace(/[^a-zA-Z0-9_-]/g, "_");
    return \`
      <article class="file-card" id="\${cardId}">
        <div class="file-card-hdr">
          <div class="mono" style="font-weight:600;font-size:12.5px">\${esc(file.path)}</div>
          <div class="file-tags mono">
            <span class="tag">\${esc(file.layer)}</span>
            <span class="tag">impact \${file.impactScore ?? 0}</span>
            \${file.movedLineRatio > 0 ? \`<span class="tag tag-move">\${file.movedLineRatio}% moved</span>\` : ""}
            \${callersCount > 0 ? \`<span class="tag tag-caller">\${callersCount} untouched caller(s)</span>\` : ""}
            \${(file.riskFindings || []).length > 0 ? \`<span class="tag tag-risk">\${file.riskFindings.length} hazard(s)</span>\` : ""}
            <span><span class="stat-add">+\${file.additions}</span> / <span class="stat-del">-\${file.deletions}</span></span>
          </div>
        </div>
        \${topAlerts}
        <div style="overflow-x:auto">
          <table class="diff-table">\${rowsHtml}</table>
        </div>
      </article>
    \`;
  }

  function matchesFilter(file) {
    if (!filterQuery) return true;
    if (file.path.toLowerCase().includes(filterQuery)) return true;
    return (file.symbols || []).some((s) => s.name.toLowerCase().includes(filterQuery));
  }

  function renderTour() {
    const sidebar = document.getElementById("tour-sidebar");
    const reader = document.getElementById("tour-reader");

    let sbHtml = "";
    let readerHtml = \`
      <div class="verdict-banner">
        <div>
          <div class="serif" style="font-weight:600;font-size:17px">\${esc(report.riskReport.verdict)}</div>
          <div style="color:var(--fg-muted);font-size:13px;margin-top:2px">
            Chapters are ordered from public contracts and high-blast-radius modules inward, collapsing pure code motion and lockfiles.
          </div>
        </div>
        <button class="btn btn-primary" id="btn-copy-pr-md">Copy PR Review Tour</button>
      </div>
      <div class="kpi-row">
        <div class="kpi-card"><div class="kpi-label">Focused Review</div><div class="kpi-val serif">~\${report.blastRadius.stats.estimatedReviewMinutes} min</div></div>
        <div class="kpi-card"><div class="kpi-label">Motion Collapsed</div><div class="kpi-val serif" style="color:var(--accent)">\${report.moveReport.stats.noiseReductionPercent}%</div></div>
        <div class="kpi-card"><div class="kpi-label">Untouched Callers</div><div class="kpi-val serif" style="color:var(--indigo)">\${report.blastRadius.stats.untouchedCallerCount}</div></div>
        <div class="kpi-card"><div class="kpi-label">Silent Hazards</div><div class="kpi-val serif" style="color:\${report.riskReport.counts.total > 0 ? "var(--danger)" : "var(--sage)"}">\${report.riskReport.counts.total}</div></div>
      </div>
    \`;

    for (const ch of report.blastRadius.chapters) {
      const visibleFiles = ch.files.filter(matchesFilter);
      if (visibleFiles.length === 0) continue;

      sbHtml += \`<div class="chapter-group"><div class="chapter-hdr"><span>\${ch.order}. \${esc(ch.title)}</span><span>~\${ch.estimatedMinutes}m</span></div>\`;
      for (const f of visibleFiles) {
        const targetId = "file-" + f.path.replace(/[^a-zA-Z0-9_-]/g, "_");
        sbHtml += \`<div class="file-nav-item mono" data-scroll="\${targetId}"><span class="file-nav-path" title="\${esc(f.path)}">\${esc(f.path.split("/").slice(-2).join("/"))}</span><span><span class="stat-add">+\${f.additions}</span></span></div>\`;
      }
      sbHtml += \`</div>\`;

      readerHtml += \`
        <section class="chapter-section">
          <div class="chapter-banner">
            <h2 class="serif">Chapter \${ch.order}: \${esc(ch.title)} <span class="mono" style="font-weight:400;color:var(--fg-muted);font-size:12px">(~\${ch.estimatedMinutes} min)</span></h2>
            <p>\${esc(ch.rationale)}</p>
          </div>
          \${visibleFiles.map(renderFileCard).join("")}
        </section>
      \`;
    }

    if (report.blastRadius.skippedMechanical.length > 0 && !filterQuery) {
      readerHtml += \`
        <details style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:13px 18px">
          <summary style="cursor:pointer;font-weight:600;color:var(--fg-muted)">Skipped Mechanical / Moved / Generated Files (\${report.blastRadius.skippedMechanical.length})</summary>
          <ul class="mono" style="margin:10px 0 0;padding-left:20px;font-size:12px;color:var(--fg-muted)">
            \${report.blastRadius.skippedMechanical.map((s) => \`<li><strong>\${esc(s.path)}</strong> — \${esc(s.reason)} (+\${s.additions}/-\${s.deletions})</li>\`).join("")}
          </ul>
        </details>
      \`;
    }

    sidebar.innerHTML = sbHtml || \`<div style="color:var(--fg-muted);font-size:12px">No matching files.</div>\`;
    reader.innerHTML = readerHtml;

    sidebar.querySelectorAll("[data-scroll]").forEach((el) => {
      el.addEventListener("click", () => {
        document.getElementById(el.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    reader.querySelectorAll(".move-collapse-row").forEach((row) => {
      row.addEventListener("click", () => {
        expandedMoves.add(row.dataset.moveKey);
        renderTour();
      });
    });

    reader.querySelectorAll(".copy-fix-btn").forEach((btn) => {
      btn.addEventListener("click", () => copyText(btn.dataset.prompt, "Copied Agent Fix Prompt"));
    });

    document.getElementById("btn-copy-pr-md")?.addEventListener("click", () =>
      copyText(markdownTour, "Copied Markdown PR Review Tour")
    );
  }

  // TAB 2: Interactive SVG Blast-Radius Map
  let panX = 28, panY = 26, scale = 1, graphAutoFitted = false;
  function computeFitScale(laneCount) {
    const stageEl = document.getElementById("graph-stage");
    const availW = (stageEl?.clientWidth || 1000) - 56;
    const neededW = Math.max(285, laneCount * 285);
    return Math.max(0.55, Math.min(1, Number((availW / neededW).toFixed(2))));
  }
  function renderGraph() {
    const svg = document.getElementById("blast-svg");
    const nodes = report.blastRadius.nodes.filter((n) => !n.isGenerated);
    const lanes = [
      { key: "caller", label: "UNTOUCHED CALLERS", filter: (n) => n.role === "untouched-caller" },
      { key: "entry", label: "ENTRYPOINTS & API", filter: (n) => n.role === "changed" && n.layer === "entrypoint" },
      { key: "core", label: "CORE LOGIC", filter: (n) => n.role === "changed" && (n.layer === "core" || n.layer === "ui") },
      { key: "data", label: "DATA, CONFIG & TESTS", filter: (n) => n.role === "changed" && !["entrypoint", "core", "ui"].includes(n.layer) },
    ].filter((l) => nodes.some(l.filter));

    if (!graphAutoFitted && lanes.length > 0) {
      scale = computeFitScale(lanes.length);
      graphAutoFitted = true;
    }

    const pos = new Map();
    const laneW = 285;
    const nodeW = 232;
    const nodeH = 50;

    let laneHeaders = "";
    lanes.forEach((lane, lIdx) => {
      const lx = 24 + lIdx * laneW;
      laneHeaders += \`<text x="\${lx}" y="22" fill="var(--fg-muted)" font-size="10.5" font-weight="700" letter-spacing="0.5" class="mono">\${lane.label}</text>\`;
      const laneNodes = nodes.filter(lane.filter).slice(0, 14);
      laneNodes.forEach((n, nIdx) => {
        pos.set(n.id, { x: lx, y: 42 + nIdx * 66, node: n });
      });
    });

    let edgesSvg = "";
    for (const edge of report.blastRadius.edges) {
      const a = pos.get(edge.from);
      const b = pos.get(edge.to);
      if (!a || !b) continue;
      const x1 = a.x < b.x ? a.x + nodeW : a.x;
      const y1 = a.y + nodeH / 2;
      const x2 = a.x < b.x ? b.x : b.x + nodeW;
      const y2 = b.y + nodeH / 2;
      const cx = (x1 + x2) / 2;
      const stroke = edge.kind === "breaking-caller" ? "var(--danger)" : edge.kind.includes("caller") ? "var(--indigo)" : "var(--fg-dim)";
      const dash = edge.kind.includes("caller") ? 'stroke-dasharray="5 4"' : "";
      edgesSvg += \`<path d="M \${x1} \${y1} C \${cx} \${y1}, \${cx} \${y2}, \${x2} \${y2}" fill="none" stroke="\${stroke}" stroke-width="1.75" \${dash} opacity="0.86" />\`;
    }

    let nodesSvg = "";
    for (const [id, p] of pos) {
      const n = p.node;
      const stroke =
        n.signatureBreakCount > 0 ? "var(--danger)" :
        n.role === "untouched-caller" ? "var(--indigo)" :
        n.impactScore >= 55 ? "var(--accent)" : "var(--sage)";
      const dash = n.role === "untouched-caller" ? 'stroke-dasharray="4 3"' : "";
      const shortName = n.path.length > 27 ? "…" + n.path.slice(-26) : n.path;
      const sub = n.role === "untouched-caller"
        ? (n.signatureBreakCount > 0 ? "⚠ calls broken signature" : "untouched downstream caller")
        : \`+\${n.additions}/-\${n.deletions} · impact \${n.impactScore}\`;

      nodesSvg += \`
        <g class="g-node" data-node-id="\${esc(id)}" transform="translate(\${p.x}, \${p.y})" style="cursor:pointer">
          <rect width="\${nodeW}" height="\${nodeH}" rx="10" fill="var(--bg-card)" stroke="\${stroke}" stroke-width="1.5" \${dash} />
          <text x="12" y="20" fill="var(--fg)" font-size="11.5" font-weight="600" class="mono">\${esc(shortName)}</text>
          <text x="12" y="37" fill="var(--fg-muted)" font-size="10.5" class="mono">\${esc(sub)}</text>
        </g>
      \`;
    }

    svg.innerHTML = \`<g id="viewport" transform="translate(\${panX},\${panY}) scale(\${scale})">\${laneHeaders}\${edgesSvg}\${nodesSvg}</g>\`;

    svg.querySelectorAll(".g-node").forEach((el) => {
      el.addEventListener("click", () => inspectNode(el.dataset.nodeId));
    });
  }

  function inspectNode(nodeId) {
    const n = report.blastRadius.nodes.find((x) => x.id === nodeId);
    const pane = document.getElementById("node-inspector");
    if (!n) return;
    const fileObj = report.parsedDiff.files.find((f) => f.path === n.path);
    pane.innerHTML = \`
      <div class="mono" style="font-weight:700;font-size:13px;word-break:break-all">\${esc(n.path)}</div>
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
        <span class="tag mono">\${esc(n.role)}</span>
        <span class="tag mono">\${esc(n.layer)}</span>
        <span class="tag mono">impact \${n.impactScore}</span>
      </div>
      \${
        n.modifiedSymbols?.length
          ? \`<h4 style="margin:18px 0 6px;font-size:11px;letter-spacing:0.05em;color:var(--fg-muted)">MODIFIED SYMBOLS</h4>
             <ul class="mono" style="margin:0;padding-left:18px;font-size:12px">\${n.modifiedSymbols.map((s) => \`<li>\${esc(s)}</li>\`).join("")}</ul>\`
          : ""
      }
      \${
        n.downstreamCallers?.length
          ? \`<h4 style="margin:18px 0 6px;font-size:11px;letter-spacing:0.05em;color:var(--indigo)">UNTOUCHED CALLERS (\${n.downstreamCallers.length})</h4>
             <ul class="mono" style="margin:0;padding-left:18px;font-size:11.5px">\${n.downstreamCallers.map((c) => \`<li><strong>\${esc(c.callerPath)}</strong><br><span style="color:var(--fg-muted)">\${esc(c.reasons.join(", "))}</span></li>\`).join("")}</ul>\`
          : ""
      }
      \${
        fileObj?.riskFindings?.length
          ? \`<h4 style="margin:18px 0 6px;font-size:11px;letter-spacing:0.05em;color:var(--danger)">SILENT HAZARDS (\${fileObj.riskFindings.length})</h4>
             \${fileObj.riskFindings.map((r) => \`<div style="font-size:12px;margin-bottom:8px"><strong>[\${esc(r.severity)}]</strong> \${esc(r.title)}</div>\`).join("")}\`
          : ""
      }
      \${
        n.role === "changed"
          ? \`<button class="btn btn-primary" style="margin-top:18px;width:100%" id="jump-diff-btn">Open in Guided Diff →</button>\`
          : ""
      }
    \`;
    document.getElementById("jump-diff-btn")?.addEventListener("click", () => {
      activateTab("tour");
      const targetId = "file-" + n.path.replace(/[^a-zA-Z0-9_-]/g, "_");
      setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" }), 50);
    });
  }

  // Pan & Zoom handlers
  const stage = document.getElementById("graph-stage");
  let dragging = false, startX = 0, startY = 0;
  stage.addEventListener("mousedown", (e) => {
    if (e.target.closest(".g-node") || e.target.closest(".graph-toolbar")) return;
    dragging = true; startX = e.clientX - panX; startY = e.clientY - panY;
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    panX = e.clientX - startX; panY = e.clientY - startY;
    document.getElementById("viewport")?.setAttribute("transform", \`translate(\${panX},\${panY}) scale(\${scale})\`);
  });
  window.addEventListener("mouseup", () => { dragging = false; });
  document.getElementById("zoom-in").addEventListener("click", () => { scale = Math.min(2.4, scale + 0.2); renderGraph(); });
  document.getElementById("zoom-out").addEventListener("click", () => { scale = Math.max(0.4, scale - 0.2); renderGraph(); });
  document.getElementById("zoom-reset").addEventListener("click", () => { panX = 28; panY = 26; graphAutoFitted = false; renderGraph(); });

  // TAB 3: Risk Radar
  function renderRisks() {
    const container = document.getElementById("risks-container");
    const findings = report.riskReport.findings.filter((f) => riskFilter === "all" || f.severity === riskFilter);
    const allPrompts = report.riskReport.findings.map((f, i) => \`\${i + 1}. \${f.agentFixPrompt}\`).join("\\n");

    container.innerHTML = \`
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          \${["all", "critical", "high", "medium", "low"].map((sev) => \`<button class="btn \${riskFilter === sev ? "btn-primary" : ""}" data-sev="\${sev}">\${sev.toUpperCase()}</button>\`).join("")}
        </div>
        \${report.riskReport.findings.length > 0 ? \`<button class="btn btn-soft" id="copy-all-prompts">Copy All Fix Prompts for Claude Code / Codex</button>\` : ""}
      </div>
      \${
        findings.length === 0
          ? \`<div class="risk-card serif" style="text-align:center;padding:42px;font-size:16px;color:var(--fg-muted)">No silent hazards flagged for this filter.</div>\`
          : findings.map((f) => \`
              <div class="risk-card">
                <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
                  <div><span class="tag tag-risk mono">\${esc(f.severity.toUpperCase())}</span> <strong class="serif" style="margin-left:8px;font-size:15.5px">\${esc(f.title)}</strong></div>
                  <code style="color:var(--fg-muted)">\${esc(f.filePath)}:\${f.lineNumber}</code>
                </div>
                <pre class="mono" style="background:var(--bg-elev);padding:10px 12px;border-radius:8px;border:1px solid var(--border);margin:12px 0;overflow-x:auto;font-size:12px">\${esc(f.snippet)}</pre>
                <div style="color:var(--fg-muted);font-size:13px;margin-bottom:12px">\${esc(f.whyItMatters)}</div>
                <button class="btn copy-one-prompt" data-prompt="\${esc(f.agentFixPrompt)}">Copy Agent Fix Prompt</button>
              </div>
            \`).join("")
      }
    \`;

    container.querySelectorAll("[data-sev]").forEach((b) => {
      b.addEventListener("click", () => { riskFilter = b.dataset.sev; renderRisks(); });
    });
    document.getElementById("copy-all-prompts")?.addEventListener("click", () => copyText(allPrompts, "Copied all agent fix prompts"));
    container.querySelectorAll(".copy-one-prompt").forEach((b) => {
      b.addEventListener("click", () => copyText(b.dataset.prompt, "Copied Agent Fix Prompt"));
    });
  }

  // TAB 4: Export & PR Card
  function renderExport() {
    const container = document.getElementById("export-container");
    container.innerHTML = \`
      <h2 class="serif" style="margin-top:0;font-size:22px">Adaptive SVG Blast-Radius Card</h2>
      <p style="color:var(--fg-muted)">Embed this archival vector summary card inside Pull Request descriptions, RFCs, or team threads.</p>
      <div style="overflow-x:auto;margin-bottom:14px">\${svgCard}</div>
      <div style="display:flex;gap:8px;margin-bottom:32px;flex-wrap:wrap">
        <button class="btn btn-primary" id="dl-svg-btn">Download .svg Card</button>
        <button class="btn" id="copy-svg-btn">Copy Raw SVG</button>
      </div>
      <h2 class="serif" style="font-size:22px">GitHub Pull Request Review Tour (Markdown)</h2>
      <p style="color:var(--fg-muted)">Paste directly into your GitHub PR comment or description.</p>
      <textarea class="export-textarea mono" readonly id="md-box"></textarea>
      <div style="margin-top:12px">
        <button class="btn btn-primary" id="copy-md-box">Copy Markdown to Clipboard</button>
      </div>
    \`;
    document.getElementById("md-box").value = markdownTour;
    document.getElementById("copy-md-box").addEventListener("click", () => copyText(markdownTour, "Copied PR Markdown"));
    document.getElementById("copy-svg-btn").addEventListener("click", () => copyText(svgCard, "Copied raw SVG"));
    document.getElementById("dl-svg-btn").addEventListener("click", () => {
      const blob = new Blob([svgCard], { type: "image/svg+xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "diffxray-card.svg";
      a.click();
    });
  }

  renderTour();
  renderRisks();
  renderExport();
})();
</script>
</body>
</html>`;
}
