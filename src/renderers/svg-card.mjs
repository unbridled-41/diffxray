/**
 * @fileoverview Adaptive Editorial Vector SVG Blast-Radius & Review Card Renderer (v2.0).
 * Inspired by Anthropic / research-journal schematics: warm archival paper (#FAF9F5) in light mode,
 * warm espresso charcoal (#191816) in dark mode, burnt terracotta (#D97757), sage (#4E7A55),
 * slate-blue (#4A729E), and brick (#C04438). Scoped to `.dxr-svg-root` for safe inline HTML embedding.
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
  const height = 476;
  const theme = options.theme || "auto";

  const gradeColor =
    riskReport.grade === "A" || riskReport.grade === "B"
      ? "#4E7A55"
      : riskReport.grade === "C"
      ? "#B57B2E"
      : "#C04438";

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
    y: 182 + i * 50,
  }));
  const positionedCallers = callerNodes.map((n, i) => ({
    ...n,
    x: 635,
    y: 196 + i * 56,
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
        `<path d="M ${x} ${y1} C ${x + 34} ${y1}, ${x + 34} ${y2}, ${x} ${y2}" fill="none" stroke="#9C988E" stroke-width="1.4" stroke-opacity="0.6" />`
      );
    } else {
      const x1 = left.x + 238;
      const y1 = left.y + 18;
      const x2 = right.x;
      const y2 = right.y + 18;
      const cx = (x1 + x2) / 2;
      const stroke = edge.kind === "breaking-caller" ? "#C04438" : "#4A729E";
      const dash = edge.kind.includes("caller") ? 'stroke-dasharray="5 4"' : "";
      curveElements.push(
        `<path d="M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="1.75" ${dash} stroke-opacity="0.88" />`
      );
    }
  }

  const lightVars = `
    --dxr-bg: #FAF9F5;
    --dxr-panel: #F2EFE7;
    --dxr-card: #FFFFFF;
    --dxr-border: #E4E0D4;
    --dxr-fg: #141413;
    --dxr-muted: #6E6B63;
  `;
  const darkVars = `
    --dxr-bg: #191816;
    --dxr-panel: #21201D;
    --dxr-card: #272521;
    --dxr-border: #36342E;
    --dxr-fg: #F4F1EA;
    --dxr-muted: #A6A298;
  `;

  const themeCss =
    theme === "light"
      ? `.dxr-svg-root { ${lightVars} }`
      : theme === "dark"
      ? `.dxr-svg-root { ${darkVars} }`
      : `.dxr-svg-root { ${lightVars} } @media (prefers-color-scheme: dark) { .dxr-svg-root { ${darkVars} } } [data-theme="dark"] .dxr-svg-root { ${darkVars} } [data-theme="light"] .dxr-svg-root { ${lightVars} }`;

  const topFindings = riskReport.findings.slice(0, 4);

  return `<svg xmlns="http://www.w3.org/2000/svg" class="dxr-svg-root" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="DiffXray Architecture &amp; Blast-Radius Summary">
  <style>
    ${themeCss}
    .dxr-svg-root .font-serif { font-family: "Newsreader", "Source Serif 4", Georgia, "Times New Roman", serif; }
    .dxr-svg-root .font-ui { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif; }
    .dxr-svg-root .font-mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
  </style>

  <!-- Outer Archival Frame -->
  <rect width="${width}" height="${height}" rx="16" fill="var(--dxr-bg)" stroke="var(--dxr-border)" stroke-width="1.5" />

  <!-- Top Editorial Header -->
  <rect x="1" y="1" width="${width - 2}" height="72" rx="15" fill="var(--dxr-panel)" />
  <line x1="0" y1="73" x2="${width}" y2="73" stroke="var(--dxr-border)" stroke-width="1" />

  <!-- Terracotta Aperture Mark -->
  <g transform="translate(24, 21)">
    <rect width="30" height="30" rx="8" fill="#D97757" fill-opacity="0.14" stroke="#D97757" stroke-width="1.4" />
    <circle cx="15" cy="15" r="3.8" fill="#D97757" />
    <circle cx="15" cy="15" r="9.5" fill="none" stroke="#D97757" stroke-width="1.2" stroke-dasharray="3 2.2" />
  </g>
  <text x="66" y="35" class="font-serif" font-size="18.5" font-weight="600" fill="var(--dxr-fg)">${escapeHtml(meta.title || "DiffXray Architectural Review")}</text>
  <text x="66" y="55" class="font-mono" font-size="11.5" fill="var(--dxr-muted)">${escapeHtml(meta.sourceLabel)} · ${parsedDiff.stats.totalFiles} files (+${parsedDiff.stats.totalAdditions} / -${parsedDiff.stats.totalDeletions}) · ${moveReport.stats.noiseReductionPercent}% mechanical motion collapsed</text>

  <!-- Grade Pill -->
  <g transform="translate(${width - 190}, 18)">
    <rect width="166" height="36" rx="18" fill="${gradeColor}" fill-opacity="0.12" stroke="${gradeColor}" stroke-width="1.3" />
    <text x="83" y="23" text-anchor="middle" class="font-mono" font-size="12.5" font-weight="700" fill="${gradeColor}">TRUST ${riskReport.trustScore}/100 · ${riskReport.grade}</text>
  </g>

  <!-- Symmetric 4-Box KPI Metric Strip (x=24..896, width=206 each, gap=16) -->
  <g transform="translate(24, 88)">
    <g transform="translate(0, 0)">
      <rect width="206" height="54" rx="10" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
      <text x="14" y="21" class="font-ui" font-size="10" font-weight="600" letter-spacing="0.5" fill="var(--dxr-muted)">FOCUSED REVIEW</text>
      <text x="14" y="42" class="font-serif" font-size="18" font-weight="600" fill="var(--dxr-fg)">~${blastRadius.stats.estimatedReviewMinutes} min</text>
      <text x="192" y="41" text-anchor="end" class="font-mono" font-size="10.5" fill="#4E7A55">${moveReport.stats.effectiveLogicLines} logic loc</text>
    </g>

    <g transform="translate(222, 0)">
      <rect width="206" height="54" rx="10" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
      <text x="14" y="21" class="font-ui" font-size="10" font-weight="600" letter-spacing="0.5" fill="var(--dxr-muted)">CODE MOTION</text>
      <text x="14" y="42" class="font-serif" font-size="18" font-weight="600" fill="#D97757">${moveReport.stats.movePairs} move(s)</text>
      <text x="192" y="41" text-anchor="end" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">${blastRadius.stats.skippedFilesCount} skippable</text>
    </g>

    <g transform="translate(444, 0)">
      <rect width="206" height="54" rx="10" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
      <text x="14" y="21" class="font-ui" font-size="10" font-weight="600" letter-spacing="0.5" fill="var(--dxr-muted)">UNTOUCHED CALLERS</text>
      <text x="14" y="42" class="font-serif" font-size="18" font-weight="600" fill="#4A729E">${blastRadius.stats.untouchedCallerCount} caller(s)</text>
      <text x="192" y="41" text-anchor="end" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">downstream</text>
    </g>

    <g transform="translate(666, 0)">
      <rect width="206" height="54" rx="10" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
      <text x="14" y="21" class="font-ui" font-size="10" font-weight="600" letter-spacing="0.5" fill="var(--dxr-muted)">SILENT HAZARDS</text>
      <text x="14" y="42" class="font-serif" font-size="18" font-weight="600" fill="${riskReport.counts.critical + riskReport.counts.high > 0 ? "#C04438" : "#4E7A55"}">${riskReport.counts.total} flag(s)</text>
      <text x="192" y="41" text-anchor="end" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">${riskReport.counts.critical}c · ${riskReport.counts.high}h · ${riskReport.counts.medium}m</text>
    </g>
  </g>

  <!-- Left Column: Risk Radar / Guided Chapters -->
  <g transform="translate(24, 158)">
    <rect width="252" height="276" rx="12" fill="var(--dxr-panel)" stroke="var(--dxr-border)" />
    <text x="16" y="26" class="font-ui" font-size="10.5" font-weight="700" letter-spacing="0.6" fill="var(--dxr-muted)">${topFindings.length > 0 ? "SILENT HAZARD RADAR" : "GUIDED READING ORDER"}</text>
    ${
      topFindings.length > 0
        ? topFindings
            .map((f, idx) => {
              const fy = 42 + idx * 55;
              const col =
                f.severity === "critical"
                  ? "#C04438"
                  : f.severity === "high"
                  ? "#D97757"
                  : f.severity === "medium"
                  ? "#B57B2E"
                  : "#6E6B63";
              return `<g transform="translate(12, ${fy})">
                <rect width="228" height="46" rx="8" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
                <rect x="0" y="6" width="3.5" height="34" rx="1.75" fill="${col}" />
                <text x="12" y="18" class="font-mono" font-size="10.5" font-weight="700" fill="${col}">${escapeHtml(f.severity.toUpperCase())} · ${escapeHtml(f.ruleId)}</text>
                <text x="12" y="35" class="font-mono" font-size="10.5" fill="var(--dxr-fg)">${escapeHtml(shortPath(f.filePath, 24))}:${f.lineNumber}</text>
              </g>`;
            })
            .join("\n")
        : blastRadius.chapters
            .slice(0, 4)
            .map((ch, idx) => {
              const cy = 42 + idx * 55;
              return `<g transform="translate(12, ${cy})">
                <rect width="228" height="46" rx="8" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
                <text x="12" y="19" class="font-serif" font-size="12.5" font-weight="600" fill="var(--dxr-fg)">${ch.order}. ${escapeHtml(ch.title.slice(0, 25))}</text>
                <text x="12" y="36" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">${ch.files.length} file(s) · ~${ch.estimatedMinutes} min</text>
              </g>`;
            })
            .join("\n")
    }
  </g>

  <!-- Right Canvas: Blast-Radius Graph -->
  <rect x="288" y="158" width="608" height="276" rx="12" fill="var(--dxr-panel)" stroke="var(--dxr-border)" />
  <text x="304" y="175" class="font-ui" font-size="10.5" font-weight="700" letter-spacing="0.5" fill="var(--dxr-muted)">MODIFIED MODULES (TOP IMPACT)</text>
  <text x="635" y="175" class="font-ui" font-size="10.5" font-weight="700" letter-spacing="0.5" fill="#4A729E">UNTOUCHED CALLERS IN BLAST RADIUS</text>

  <!-- Edges -->
  ${curveElements.join("\n  ")}

  <!-- Changed Nodes -->
  ${positionedChanged
    .map((n) => {
      const borderCol =
        n.signatureBreakCount > 0 ? "#C04438" : n.impactScore >= 55 ? "#D97757" : "#4E7A55";
      return `<g transform="translate(${n.x}, ${n.y})">
        <rect width="238" height="38" rx="8" fill="var(--dxr-card)" stroke="${borderCol}" stroke-width="1.35" />
        <text x="12" y="16" class="font-mono" font-size="11" font-weight="600" fill="var(--dxr-fg)">${escapeHtml(shortPath(n.path, 26))}</text>
        <text x="12" y="30" class="font-mono" font-size="10" fill="var(--dxr-muted)">+${n.additions}/-${n.deletions} · ${escapeHtml(n.layer)} · impact ${n.impactScore}</text>
      </g>`;
    })
    .join("\n  ")}

  <!-- Untouched Caller Nodes -->
  ${
    positionedCallers.length > 0
      ? positionedCallers
          .map((n) => {
            const col = n.signatureBreakCount > 0 ? "#C04438" : "#4A729E";
            return `<g transform="translate(${n.x}, ${n.y})">
              <rect width="245" height="38" rx="8" fill="var(--dxr-card)" stroke="${col}" stroke-width="1.35" stroke-dasharray="4 3" />
              <text x="12" y="16" class="font-mono" font-size="11" font-weight="600" fill="var(--dxr-fg)">${escapeHtml(shortPath(n.path, 27))}</text>
              <text x="12" y="30" class="font-mono" font-size="10" fill="${col}">${n.signatureBreakCount > 0 ? "⚠ calls broken signature" : "↳ untouched caller"}</text>
            </g>`;
          })
          .join("\n  ")
      : `<text x="645" y="295" class="font-mono" font-size="11" fill="var(--dxr-muted)">0 untouched external callers hit</text>`
  }

  <!-- Footer Colophon -->
  <text x="24" y="456" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">DiffXray · Zero-dependency local &amp; browser diff intelligence · github.com/unbridled-41/diffxray</text>
</svg>`;
}
