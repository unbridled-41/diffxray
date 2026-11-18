/**
 * @fileoverview Adaptive Dark/Light Vector SVG Blast-Radius & Review Card Renderer.
 * Scopes all CSS custom properties to `.dxr-svg-root` so inline `<svg>` embedding inside
 * HTML documents never leaks variables onto `:root`.
 */

import { escapeHtml } from "./escape.mjs";

function shortPath(p, maxLen = 28) {
  const clean = (p || "").replace(/\\/g, "/");
  if (clean.length <= maxLen) return clean;
  const parts = clean.split("/");
  if (parts.length >= 2) {
    const tail = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    if (tail.length <= maxLen) return `…/${tail}`;
  }
  return "…" + clean.slice(-(maxLen - 1));
}

/**
 * Render an adaptive vector SVG X-Ray card for a diff analysis report.
 * @param {any} report
 * @param {{ theme?: "auto" | "dark" | "light" }} [options]
 * @returns {string}
 */
export function renderSvgCard(report, options = {}) {
  const { meta, parsedDiff, moveReport, blastRadius, riskReport } = report;
  const width = 920;
  const height = 470;
  const theme = options.theme || "auto";

  const gradeColor =
    riskReport.grade === "A"
      ? "#10b981"
      : riskReport.grade === "B"
      ? "#22c55e"
      : riskReport.grade === "C"
      ? "#f59e0b"
      : "#ef4444";

  const changedNodes = blastRadius.nodes
    .filter((n) => n.role === "changed" && !n.isGenerated)
    .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
    .slice(0, 5);

  const callerNodes = blastRadius.nodes
    .filter((n) => n.role === "untouched-caller")
    .slice(0, 4);

  const positionedChanged = changedNodes.map((n, i) => ({
    ...n,
    x: 300,
    y: 178 + i * 50,
  }));
  const positionedCallers = callerNodes.map((n, i) => ({
    ...n,
    x: 635,
    y: 192 + i * 56,
  }));

  const posById = new Map();
  for (const n of positionedChanged) posById.set(n.id, n);
  for (const n of positionedCallers) posById.set(n.id, n);

  const curveElements = [];
  for (const edge of blastRadius.edges) {
    const a = posById.get(edge.from);
    const b = posById.get(edge.to);
    if (!a || !b) continue;
    const left = a.x <= b.x ? a : b;
    const right = a.x <= b.x ? b : a;
    if (left.x === right.x) {
      const x = left.x + 220;
      const y1 = left.y + 18;
      const y2 = right.y + 18;
      curveElements.push(
        `<path d="M ${x} ${y1} C ${x + 36} ${y1}, ${x + 36} ${y2}, ${x} ${y2}" fill="none" stroke="#64748b" stroke-width="1.5" stroke-opacity="0.55" />`
      );
    } else {
      const x1 = left.x + 238;
      const y1 = left.y + 18;
      const x2 = right.x;
      const y2 = right.y + 18;
      const cx = (x1 + x2) / 2;
      const stroke = edge.kind === "breaking-caller" ? "#ef4444" : "#6366f1";
      const dash = edge.kind.includes("caller") ? 'stroke-dasharray="5 4"' : "";
      curveElements.push(
        `<path d="M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="1.8" ${dash} stroke-opacity="0.85" />`
      );
    }
  }

  const lightVars = `
    --dxr-bg: #ffffff;
    --dxr-panel: #f8fafc;
    --dxr-card: #ffffff;
    --dxr-border: #e2e8f0;
    --dxr-fg: #0f172a;
    --dxr-muted: #64748b;
  `;
  const darkVars = `
    --dxr-bg: #0b0d12;
    --dxr-panel: #12161f;
    --dxr-card: #161b26;
    --dxr-border: #232a38;
    --dxr-fg: #f1f5f9;
    --dxr-muted: #94a3b8;
  `;

  const themeCss =
    theme === "light"
      ? `.dxr-svg-root { ${lightVars} }`
      : theme === "dark"
      ? `.dxr-svg-root { ${darkVars} }`
      : `.dxr-svg-root { ${darkVars} } @media (prefers-color-scheme: light) { .dxr-svg-root { ${lightVars} } } [data-theme="light"] .dxr-svg-root { ${lightVars} }`;

  const topFindings = riskReport.findings.slice(0, 4);

  return `<svg xmlns="http://www.w3.org/2000/svg" class="dxr-svg-root" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="DiffXray Architecture &amp; Blast-Radius Summary">
  <style>
    ${themeCss}
    .dxr-svg-root .font-ui { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif; }
    .dxr-svg-root .font-mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
  </style>

  <!-- Outer Frame -->
  <rect width="${width}" height="${height}" rx="14" fill="var(--dxr-bg)" stroke="var(--dxr-border)" stroke-width="1.5" />

  <!-- Top Header Strip -->
  <rect x="1" y="1" width="${width - 2}" height="68" rx="13" fill="var(--dxr-panel)" />
  <line x1="0" y1="69" x2="${width}" y2="69" stroke="var(--dxr-border)" stroke-width="1" />

  <!-- Brand Mark -->
  <g transform="translate(24, 19)">
    <rect width="30" height="30" rx="7" fill="#10b981" fill-opacity="0.14" stroke="#10b981" stroke-width="1.4" />
    <circle cx="15" cy="15" r="4" fill="#10b981" />
    <circle cx="15" cy="15" r="9.5" fill="none" stroke="#10b981" stroke-width="1.2" stroke-dasharray="3 2" />
  </g>
  <text x="66" y="33" class="font-ui" font-size="16" font-weight="700" fill="var(--dxr-fg)">${escapeHtml(meta.title || "DiffXray Report")}</text>
  <text x="66" y="52" class="font-mono" font-size="11.5" fill="var(--dxr-muted)">${escapeHtml(meta.sourceLabel)} · ${parsedDiff.stats.totalFiles} files (+${parsedDiff.stats.totalAdditions} / -${parsedDiff.stats.totalDeletions}) · ${moveReport.stats.noiseReductionPercent}% mechanical noise collapsed</text>

  <!-- Grade Badge -->
  <g transform="translate(${width - 188}, 16)">
    <rect width="164" height="36" rx="8" fill="${gradeColor}" fill-opacity="0.13" stroke="${gradeColor}" stroke-width="1.3" />
    <text x="82" y="23" text-anchor="middle" class="font-mono" font-size="13" font-weight="700" fill="${gradeColor}">TRUST ${riskReport.trustScore}/100 · ${riskReport.grade}</text>
  </g>

  <!-- Symmetric 4-Box KPI Metric Strip (x=24..896, width=206 each, gap=16) -->
  <g transform="translate(24, 84)">
    <g transform="translate(0, 0)">
      <rect width="206" height="54" rx="9" fill="var(--dxr-panel)" stroke="var(--dxr-border)" />
      <text x="14" y="21" class="font-ui" font-size="10.5" font-weight="600" fill="var(--dxr-muted)">FOCUSED REVIEW TIME</text>
      <text x="14" y="42" class="font-mono" font-size="16" font-weight="700" fill="var(--dxr-fg)">~${blastRadius.stats.estimatedReviewMinutes} min</text>
      <text x="192" y="41" text-anchor="end" class="font-mono" font-size="10.5" fill="#10b981">${moveReport.stats.effectiveLogicLines} logic loc</text>
    </g>

    <g transform="translate(222, 0)">
      <rect width="206" height="54" rx="9" fill="var(--dxr-panel)" stroke="var(--dxr-border)" />
      <text x="14" y="21" class="font-ui" font-size="10.5" font-weight="600" fill="var(--dxr-muted)">CODE MOTION DETECTED</text>
      <text x="14" y="42" class="font-mono" font-size="16" font-weight="700" fill="#f59e0b">${moveReport.stats.movePairs} move(s)</text>
      <text x="192" y="41" text-anchor="end" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">${blastRadius.stats.skippedFilesCount} skippable</text>
    </g>

    <g transform="translate(444, 0)">
      <rect width="206" height="54" rx="9" fill="var(--dxr-panel)" stroke="var(--dxr-border)" />
      <text x="14" y="21" class="font-ui" font-size="10.5" font-weight="600" fill="var(--dxr-muted)">UNTOUCHED BLAST RADIUS</text>
      <text x="14" y="42" class="font-mono" font-size="16" font-weight="700" fill="#6366f1">${blastRadius.stats.untouchedCallerCount} caller(s)</text>
      <text x="192" y="41" text-anchor="end" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">downstream</text>
    </g>

    <g transform="translate(666, 0)">
      <rect width="206" height="54" rx="9" fill="var(--dxr-panel)" stroke="var(--dxr-border)" />
      <text x="14" y="21" class="font-ui" font-size="10.5" font-weight="600" fill="var(--dxr-muted)">SILENT RISK RADAR</text>
      <text x="14" y="42" class="font-mono" font-size="16" font-weight="700" fill="${riskReport.counts.critical + riskReport.counts.high > 0 ? "#ef4444" : "#10b981"}">${riskReport.counts.total} flag(s)</text>
      <text x="192" y="41" text-anchor="end" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">${riskReport.counts.critical}c · ${riskReport.counts.high}h · ${riskReport.counts.medium}m</text>
    </g>
  </g>

  <!-- Left Column: Risk Radar / Guided Chapters -->
  <g transform="translate(24, 154)">
    <rect width="252" height="274" rx="10" fill="var(--dxr-panel)" stroke="var(--dxr-border)" />
    <text x="16" y="26" class="font-ui" font-size="11.5" font-weight="700" letter-spacing="0.4" fill="var(--dxr-muted)">${topFindings.length > 0 ? "SILENT HAZARD RADAR" : "GUIDED READING PLAN"}</text>
    ${
      topFindings.length > 0
        ? topFindings
            .map((f, idx) => {
              const fy = 44 + idx * 54;
              const col =
                f.severity === "critical"
                  ? "#ef4444"
                  : f.severity === "high"
                  ? "#f97316"
                  : f.severity === "medium"
                  ? "#f59e0b"
                  : "#64748b";
              return `<g transform="translate(12, ${fy})">
                <rect width="228" height="46" rx="7" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
                <rect x="0" y="0" width="4" height="46" rx="2" fill="${col}" />
                <text x="12" y="18" class="font-mono" font-size="10.5" font-weight="700" fill="${col}">${escapeHtml(f.severity.toUpperCase())} · ${escapeHtml(f.ruleId)}</text>
                <text x="12" y="35" class="font-mono" font-size="10.5" fill="var(--dxr-fg)">${escapeHtml(shortPath(f.filePath, 24))}:${f.lineNumber}</text>
              </g>`;
            })
            .join("\n")
        : blastRadius.chapters
            .slice(0, 4)
            .map((ch, idx) => {
              const cy = 44 + idx * 54;
              return `<g transform="translate(12, ${cy})">
                <rect width="228" height="46" rx="7" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
                <text x="12" y="19" class="font-ui" font-size="11.5" font-weight="600" fill="var(--dxr-fg)">${ch.order}. ${escapeHtml(ch.title.slice(0, 26))}</text>
                <text x="12" y="36" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">${ch.files.length} file(s) · ~${ch.estimatedMinutes} min</text>
              </g>`;
            })
            .join("\n")
    }
  </g>

  <!-- Right Canvas: Blast-Radius Graph -->
  <rect x="288" y="154" width="608" height="274" rx="10" fill="var(--dxr-panel)" stroke="var(--dxr-border)" />
  <text x="304" y="172" class="font-ui" font-size="11" font-weight="700" fill="var(--dxr-muted)">MODIFIED MODULES (TOP IMPACT)</text>
  <text x="635" y="172" class="font-ui" font-size="11" font-weight="700" fill="#6366f1">UNTOUCHED CALLERS IN BLAST RADIUS</text>

  <!-- Edges -->
  ${curveElements.join("\n  ")}

  <!-- Changed Nodes -->
  ${positionedChanged
    .map((n) => {
      const borderCol =
        n.signatureBreakCount > 0 ? "#ef4444" : n.impactScore >= 55 ? "#f59e0b" : "#10b981";
      return `<g transform="translate(${n.x}, ${n.y})">
        <rect width="238" height="38" rx="7" fill="var(--dxr-card)" stroke="${borderCol}" stroke-width="1.3" />
        <text x="11" y="16" class="font-mono" font-size="11" font-weight="600" fill="var(--dxr-fg)">${escapeHtml(shortPath(n.path, 26))}</text>
        <text x="11" y="30" class="font-mono" font-size="10" fill="var(--dxr-muted)">+${n.additions}/-${n.deletions} · ${escapeHtml(n.layer)} · impact ${n.impactScore}</text>
      </g>`;
    })
    .join("\n  ")}

  <!-- Untouched Caller Nodes -->
  ${
    positionedCallers.length > 0
      ? positionedCallers
          .map((n) => {
            const col = n.signatureBreakCount > 0 ? "#ef4444" : "#6366f1";
            return `<g transform="translate(${n.x}, ${n.y})">
              <rect width="245" height="38" rx="7" fill="var(--dxr-card)" stroke="${col}" stroke-width="1.3" stroke-dasharray="4 3" />
              <text x="11" y="16" class="font-mono" font-size="11" font-weight="600" fill="var(--dxr-fg)">${escapeHtml(shortPath(n.path, 27))}</text>
              <text x="11" y="30" class="font-mono" font-size="10" fill="${col}">${n.signatureBreakCount > 0 ? "⚠ calls broken signature" : "↳ untouched caller"}</text>
            </g>`;
          })
          .join("\n  ")
      : `<text x="645" y="290" class="font-mono" font-size="11" fill="var(--dxr-muted)">0 untouched external callers hit</text>`
  }

  <!-- Footer -->
  <text x="24" y="451" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">Generated by DiffXray · Zero-dependency local &amp; browser diff intelligence · github.com/unbridled-41/diffxray</text>
</svg>`;
}
