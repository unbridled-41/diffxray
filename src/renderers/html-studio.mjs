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
    user-select: none;
    touch-action: none;
  }
  .graph-stage.panning { cursor: grabbing; }
  .g-node, .g-lane {
    cursor: grab;
    user-select: none;
    touch-action: none;
  }
  .g-node:hover .node-box, .g-lane:hover .lane-pill {
    stroke-width: 2px;
    filter: drop-shadow(0 6px 14px rgba(20, 20, 19, 0.11));
  }
  .g-node:hover .drag-grip, .g-lane:hover .drag-grip { opacity: 0.85; }
  .g-node.dragging, .g-lane.dragging { cursor: grabbing; }
  .g-node.dragging .node-box {
    stroke-width: 2.2px;
    filter: drop-shadow(0 14px 26px rgba(20, 20, 19, 0.2));
  }
  .g-node .node-ring { opacity: 0; pointer-events: none; transition: opacity 0.14s; }
  .g-node.selected .node-ring { opacity: 1; }
  .g-edge {
    transition: opacity 0.14s, stroke-width 0.14s;
    pointer-events: none;
  }
  .graph-hint {
    position: absolute;
    top: 14px;
    left: 14px;
    z-index: 10;
    background: var(--bg-card);
    border: 1px solid var(--border);
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 11px;
    color: var(--fg-muted);
    box-shadow: var(--shadow);
    pointer-events: none;
  }
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
        <div class="graph-hint mono">✥ Drag any node card or lane header freely · Scroll wheel to zoom</div>
        <div class="graph-toolbar">
          <button class="btn" id="zoom-in" title="Zoom in">+</button>
          <button class="btn" id="zoom-out" title="Zoom out">−</button>
          <button class="btn" id="toggle-snap" title="Snap dragged nodes to 12px grid (or hold Shift)">Snap: Off</button>
          <button class="btn" id="zoom-reset" title="Fit camera to current node layout">Fit View</button>
          <button class="btn" id="layout-reset" title="Restore initial swimlane arrangement">Reset Layout</button>
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
        <div style="color:var(--fg-muted);font-size:13px;line-height:1.6">Click any module node to inspect modified symbols, downstream untouched callers, and silent hazard flags. Drag any node card or lane pill to rearrange the architecture map freely.</div>
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

  // TAB 2: Interactive Draggable SVG Blast-Radius Map
  const NODE_W = 244;
  const NODE_H = 54;
  const LANE_W = 296;
  let panX = 28, panY = 48, scale = 1;
  let snapToGrid = false;
  let selectedNodeId = null;
  let hoveredNodeId = null;
  let graphInitialized = false;
  const nodePositions = new Map();
  const lanePositions = new Map();

  function getActiveLanes(nodes) {
    return [
      { key: "caller", label: "UNTOUCHED CALLERS", filter: (n) => n.role === "untouched-caller" },
      { key: "entry", label: "ENTRYPOINTS & API", filter: (n) => n.role === "changed" && n.layer === "entrypoint" },
      { key: "core", label: "CORE LOGIC", filter: (n) => n.role === "changed" && (n.layer === "core" || n.layer === "ui") },
      { key: "data", label: "DATA, CONFIG & TESTS", filter: (n) => n.role === "changed" && !["entrypoint", "core", "ui"].includes(n.layer) },
    ].filter((l) => nodes.some(l.filter));
  }

  function computeDefaultGraphLayout() {
    nodePositions.clear();
    lanePositions.clear();
    const nodes = report.blastRadius.nodes.filter((n) => !n.isGenerated);
    const lanes = getActiveLanes(nodes);
    lanes.forEach((lane, lIdx) => {
      const lx = 24 + lIdx * LANE_W;
      const laneNodes = nodes.filter(lane.filter).slice(0, 16);
      lanePositions.set(lane.key, {
        x: lx,
        y: 12,
        label: lane.label,
        nodeIds: laneNodes.map((n) => n.id),
      });
      laneNodes.forEach((n, nIdx) => {
        nodePositions.set(n.id, {
          x: lx,
          y: 50 + nIdx * 72,
          laneKey: lane.key,
          node: n,
        });
      });
    });
  }

  function fitGraphViewport() {
    const stageEl = document.getElementById("graph-stage");
    const availW = Math.max(320, (stageEl?.clientWidth || 1000) - 56);
    const availH = Math.max(300, (stageEl?.clientHeight || 540) - 110);
    if (nodePositions.size === 0) {
      panX = 28;
      panY = 48;
      scale = 1;
      applyViewportTransform();
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of lanePositions.values()) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + 210);
      maxY = Math.max(maxY, p.y + 28);
    }
    for (const p of nodePositions.values()) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + NODE_W);
      maxY = Math.max(maxY, p.y + NODE_H);
    }
    const contentW = Math.max(260, maxX - minX);
    const contentH = Math.max(180, maxY - minY);
    scale = Math.max(0.45, Math.min(1, Number(Math.min(availW / contentW, availH / contentH).toFixed(2))));
    panX = Math.round(28 - minX * scale);
    panY = Math.round(46 - minY * scale);
    applyViewportTransform();
  }

  function applyViewportTransform() {
    document.getElementById("viewport")?.setAttribute("transform", \`translate(\${panX},\${panY}) scale(\${scale})\`);
  }

  function computeSmartEdgePath(a, b) {
    const acx = a.x + NODE_W / 2;
    const acy = a.y + NODE_H / 2;
    const bcx = b.x + NODE_W / 2;
    const bcy = b.y + NODE_H / 2;
    const dx = bcx - acx;
    const dy = bcy - acy;

    if (Math.abs(dx) > NODE_W * 0.72) {
      if (dx > 0) {
        const x1 = a.x + NODE_W;
        const y1 = acy;
        const x2 = b.x - 4;
        const y2 = bcy;
        const span = Math.max(44, Math.min(160, Math.abs(x2 - x1) * 0.5));
        return \`M \${x1} \${y1} C \${x1 + span} \${y1}, \${x2 - span} \${y2}, \${x2} \${y2}\`;
      }
      const x1 = a.x;
      const y1 = acy;
      const x2 = b.x + NODE_W + 4;
      const y2 = bcy;
      const span = Math.max(44, Math.min(160, Math.abs(x2 - x1) * 0.5));
      return \`M \${x1} \${y1} C \${x1 - span} \${y1}, \${x2 + span} \${y2}, \${x2} \${y2}\`;
    }

    if (dy >= 0) {
      const x1 = acx;
      const y1 = a.y + NODE_H;
      const x2 = bcx;
      const y2 = b.y - 4;
      const vSpan = Math.max(26, Math.min(110, Math.abs(y2 - y1) * 0.5));
      return \`M \${x1} \${y1} C \${x1} \${y1 + vSpan}, \${x2} \${y2 - vSpan}, \${x2} \${y2}\`;
    }
    const x1 = acx;
    const y1 = a.y;
    const x2 = bcx;
    const y2 = b.y + NODE_H + 4;
    const vSpan = Math.max(26, Math.min(110, Math.abs(y2 - y1) * 0.5));
    return \`M \${x1} \${y1} C \${x1} \${y1 - vSpan}, \${x2} \${y2 + vSpan}, \${x2} \${y2}\`;
  }

  function updateGraphEdgesAndSelection() {
    const svg = document.getElementById("blast-svg");
    if (!svg) return;
    const focusId = hoveredNodeId || selectedNodeId;
    svg.querySelectorAll(".g-edge").forEach((pathEl) => {
      const fromId = pathEl.dataset.from;
      const toId = pathEl.dataset.to;
      const a = nodePositions.get(fromId);
      const b = nodePositions.get(toId);
      if (!a || !b) return;
      pathEl.setAttribute("d", computeSmartEdgePath(a, b));
      if (!focusId) {
        pathEl.setAttribute("opacity", "0.86");
        pathEl.setAttribute("stroke-width", "1.75");
      } else if (fromId === focusId || toId === focusId) {
        pathEl.setAttribute("opacity", "1");
        pathEl.setAttribute("stroke-width", "2.5");
      } else {
        pathEl.setAttribute("opacity", "0.22");
        pathEl.setAttribute("stroke-width", "1.5");
      }
    });
    svg.querySelectorAll(".g-node").forEach((nodeEl) => {
      nodeEl.classList.toggle("selected", nodeEl.dataset.nodeId === selectedNodeId);
    });
  }

  function renderGripDots(x, y) {
    return \`<g class="drag-grip" opacity="0.36" fill="var(--fg-muted)">
      <circle cx="\${x}" cy="\${y}" r="1.25"/><circle cx="\${x + 4.5}" cy="\${y}" r="1.25"/>
      <circle cx="\${x}" cy="\${y + 4.5}" r="1.25"/><circle cx="\${x + 4.5}" cy="\${y + 4.5}" r="1.25"/>
      <circle cx="\${x}" cy="\${y + 9}" r="1.25"/><circle cx="\${x + 4.5}" cy="\${y + 9}" r="1.25"/>
    </g>\`;
  }

  function renderGraph() {
    const svg = document.getElementById("blast-svg");
    if (!graphInitialized) {
      computeDefaultGraphLayout();
      graphInitialized = true;
      fitGraphViewport();
    }

    let lanesSvg = "";
    for (const [laneKey, lp] of lanePositions) {
      const pillW = Math.max(138, lp.label.length * 7.4 + 34);
      lanesSvg += \`
        <g class="g-lane" data-lane-key="\${esc(laneKey)}" transform="translate(\${lp.x}, \${lp.y})">
          <title>Drag to move entire \${esc(lp.label)} column</title>
          <rect class="lane-pill" width="\${pillW}" height="24" rx="12" fill="var(--bg-elev)" stroke="var(--border-strong)" stroke-width="1" />
          \${renderGripDots(11, 7.5)}
          <text x="23" y="15.5" fill="var(--fg-muted)" font-size="10" font-weight="700" letter-spacing="0.5" class="mono">\${esc(lp.label)}</text>
        </g>
      \`;
    }

    let edgesSvg = "";
    report.blastRadius.edges.forEach((edge, idx) => {
      const a = nodePositions.get(edge.from);
      const b = nodePositions.get(edge.to);
      if (!a || !b) return;
      const isBreaking = edge.kind === "breaking-caller";
      const isCaller = edge.kind.includes("caller");
      const stroke = isBreaking ? "var(--danger)" : isCaller ? "var(--indigo)" : "var(--fg-dim)";
      const marker = isBreaking ? "url(#dxr-arrow-danger)" : isCaller ? "url(#dxr-arrow-indigo)" : "url(#dxr-arrow-dim)";
      const dash = isCaller ? 'stroke-dasharray="5 4"' : "";
      edgesSvg += \`<path class="g-edge" data-edge-idx="\${idx}" data-from="\${esc(edge.from)}" data-to="\${esc(edge.to)}" d="\${computeSmartEdgePath(a, b)}" fill="none" stroke="\${stroke}" stroke-width="1.75" \${dash} marker-end="\${marker}" opacity="0.86" />\`;
    });

    let nodesSvg = "";
    for (const [id, p] of nodePositions) {
      const n = p.node;
      const stroke =
        n.signatureBreakCount > 0 ? "var(--danger)" :
        n.role === "untouched-caller" ? "var(--indigo)" :
        n.impactScore >= 55 ? "var(--accent)" : "var(--sage)";
      const dash = n.role === "untouched-caller" ? 'stroke-dasharray="4 3"' : "";
      const shortName = n.path.length > 26 ? "…" + n.path.slice(-25) : n.path;
      const sub = n.role === "untouched-caller"
        ? (n.signatureBreakCount > 0 ? "⚠ calls broken signature" : "untouched downstream caller")
        : \`+\${n.additions}/-\${n.deletions} · impact \${n.impactScore}\`;

      nodesSvg += \`
        <g class="g-node\${selectedNodeId === id ? " selected" : ""}" data-node-id="\${esc(id)}" transform="translate(\${p.x}, \${p.y})">
          <title>\${esc(n.path)} — Drag freely to reposition · Click to inspect</title>
          <rect class="node-ring" x="-3.5" y="-3.5" width="\${NODE_W + 7}" height="\${NODE_H + 7}" rx="14" fill="none" stroke="var(--accent)" stroke-opacity="0.5" stroke-width="2.2" />
          <rect class="node-box" width="\${NODE_W}" height="\${NODE_H}" rx="11" fill="var(--bg-card)" stroke="\${stroke}" stroke-width="1.5" \${dash} />
          \${renderGripDots(NODE_W - 16, 12)}
          <text x="13" y="22" fill="var(--fg)" font-size="11.5" font-weight="600" class="mono">\${esc(shortName)}</text>
          <text x="13" y="39" fill="var(--fg-muted)" font-size="10.5" class="mono">\${esc(sub)}</text>
        </g>
      \`;
    }

    svg.innerHTML = \`
      <defs>
        <marker id="dxr-arrow-danger" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--danger)" />
        </marker>
        <marker id="dxr-arrow-indigo" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--indigo)" />
        </marker>
        <marker id="dxr-arrow-dim" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--fg-dim)" />
        </marker>
      </defs>
      <g id="viewport" transform="translate(\${panX},\${panY}) scale(\${scale})">
        <g id="lanes-layer">\${lanesSvg}</g>
        <g id="edges-layer">\${edgesSvg}</g>
        <g id="nodes-layer">\${nodesSvg}</g>
      </g>
    \`;

    bindGraphNodeAndLaneDrag(svg);
    updateGraphEdgesAndSelection();
  }

  function snapCoord(v, forceSnap) {
    return (snapToGrid || forceSnap) ? Math.round(v / 12) * 12 : Math.round(v * 10) / 10;
  }

  function bindGraphNodeAndLaneDrag(svg) {
    const nodesLayer = svg.querySelector("#nodes-layer");
    const nodeDomMap = new Map();
    svg.querySelectorAll(".g-node").forEach((el) => nodeDomMap.set(el.dataset.nodeId, el));
    svg.querySelectorAll(".g-node").forEach((el) => {
      const nodeId = el.dataset.nodeId;
      el.addEventListener("pointerenter", () => {
        hoveredNodeId = nodeId;
        updateGraphEdgesAndSelection();
      });
      el.addEventListener("pointerleave", () => {
        if (hoveredNodeId === nodeId) {
          hoveredNodeId = null;
          updateGraphEdgesAndSelection();
        }
      });
      el.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        const pos = nodePositions.get(nodeId);
        if (!pos) return;
        nodesLayer?.appendChild(el);
        el.setPointerCapture(e.pointerId);
        el.classList.add("dragging");
        const originClientX = e.clientX;
        const originClientY = e.clientY;
        const originX = pos.x;
        const originY = pos.y;
        let moved = false;

        const onMove = (ev) => {
          const dxScreen = ev.clientX - originClientX;
          const dyScreen = ev.clientY - originClientY;
          if (!moved && Math.hypot(dxScreen, dyScreen) >= 4) moved = true;
          if (!moved) return;
          pos.x = snapCoord(originX + dxScreen / scale, ev.shiftKey);
          pos.y = snapCoord(originY + dyScreen / scale, ev.shiftKey);
          el.setAttribute("transform", \`translate(\${pos.x}, \${pos.y})\`);
          updateGraphEdgesAndSelection();
        };

        const onUp = (ev) => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerup", onUp);
          el.removeEventListener("pointercancel", onUp);
          el.classList.remove("dragging");
          if (el.hasPointerCapture?.(ev.pointerId)) el.releasePointerCapture(ev.pointerId);
          if (!moved) {
            selectedNodeId = nodeId;
            inspectNode(nodeId);
            updateGraphEdgesAndSelection();
          }
        };

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onUp);
        el.addEventListener("pointercancel", onUp);
      });
    });

    svg.querySelectorAll(".g-lane").forEach((laneEl) => {
      const laneKey = laneEl.dataset.laneKey;
      laneEl.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        const lp = lanePositions.get(laneKey);
        if (!lp) return;
        laneEl.setPointerCapture(e.pointerId);
        laneEl.classList.add("dragging");
        const originClientX = e.clientX;
        const originClientY = e.clientY;
        const startLaneX = lp.x;
        const startLaneY = lp.y;
        const memberStarts = lp.nodeIds
          .map((id) => ({ id, pos: nodePositions.get(id), dom: nodeDomMap.get(id) }))
          .filter((m) => m.pos)
          .map((m) => ({ ...m, startX: m.pos.x, startY: m.pos.y }));

        const onMove = (ev) => {
          const dx = (ev.clientX - originClientX) / scale;
          const dy = (ev.clientY - originClientY) / scale;
          lp.x = snapCoord(startLaneX + dx, ev.shiftKey);
          lp.y = snapCoord(startLaneY + dy, ev.shiftKey);
          laneEl.setAttribute("transform", \`translate(\${lp.x}, \${lp.y})\`);
          for (const m of memberStarts) {
            m.pos.x = snapCoord(m.startX + dx, ev.shiftKey);
            m.pos.y = snapCoord(m.startY + dy, ev.shiftKey);
            m.dom?.setAttribute("transform", \`translate(\${m.pos.x}, \${m.pos.y})\`);
          }
          updateGraphEdgesAndSelection();
        };

        const onUp = (ev) => {
          laneEl.removeEventListener("pointermove", onMove);
          laneEl.removeEventListener("pointerup", onUp);
          laneEl.removeEventListener("pointercancel", onUp);
          laneEl.classList.remove("dragging");
          if (laneEl.hasPointerCapture?.(ev.pointerId)) laneEl.releasePointerCapture(ev.pointerId);
        };

        laneEl.addEventListener("pointermove", onMove);
        laneEl.addEventListener("pointerup", onUp);
        laneEl.addEventListener("pointercancel", onUp);
      });
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

  // Canvas Pan, Wheel Zoom & Toolbar Controls
  const stage = document.getElementById("graph-stage");
  let panning = false, panStartX = 0, panStartY = 0;
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (e.target.closest(".g-node") || e.target.closest(".g-lane") || e.target.closest(".graph-toolbar")) return;
    panning = true;
    stage.classList.add("panning");
    stage.setPointerCapture?.(e.pointerId);
    panStartX = e.clientX - panX;
    panStartY = e.clientY - panY;
  });
  stage.addEventListener("pointermove", (e) => {
    if (!panning) return;
    panX = e.clientX - panStartX;
    panY = e.clientY - panStartY;
    applyViewportTransform();
  });
  const endPan = (e) => {
    if (!panning) return;
    panning = false;
    stage.classList.remove("panning");
    if (stage.hasPointerCapture?.(e.pointerId)) stage.releasePointerCapture(e.pointerId);
  };
  stage.addEventListener("pointerup", endPan);
  stage.addEventListener("pointercancel", endPan);

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = stage.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const nextScale = Math.max(0.35, Math.min(2.5, Number((scale * factor).toFixed(3))));
    panX = mx - ((mx - panX) / scale) * nextScale;
    panY = my - ((my - panY) / scale) * nextScale;
    scale = nextScale;
    applyViewportTransform();
  }, { passive: false });

  document.getElementById("zoom-in").addEventListener("click", () => {
    scale = Math.min(2.5, Number((scale + 0.18).toFixed(2)));
    applyViewportTransform();
  });
  document.getElementById("zoom-out").addEventListener("click", () => {
    scale = Math.max(0.35, Number((scale - 0.18).toFixed(2)));
    applyViewportTransform();
  });
  document.getElementById("toggle-snap").addEventListener("click", (e) => {
    snapToGrid = !snapToGrid;
    e.currentTarget.textContent = \`Snap: \${snapToGrid ? "12px" : "Off"}\`;
    e.currentTarget.classList.toggle("btn-soft", snapToGrid);
  });
  document.getElementById("zoom-reset").addEventListener("click", () => {
    fitGraphViewport();
  });
  document.getElementById("layout-reset").addEventListener("click", () => {
    computeDefaultGraphLayout();
    renderGraph();
    fitGraphViewport();
    toast("Layout reset to default swimlanes");
  });

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
