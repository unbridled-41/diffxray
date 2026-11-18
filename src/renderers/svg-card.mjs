/**
 * @fileoverview Adaptive Editorial Vector SVG Blast-Radius & Review Card Renderer (v2.2).
 * Matches the DiffXray Claude-inspired Warm Archival Studio UI: warm cream paper (#FAF9F5),
 * dot-matrix graph canvas, swimlane pills, tactile grip marks, directional arrowheads, and
 * scoped `.dxr-svg-root` variables.
 */

import { escapeHtml } from "./escape.mjs";

function shortPath(p, maxLen = 27) {
  const clean = (p || "").replace(/\\/g, "/");
  if (clean.length <= maxLen) return clean;
  const parts = clean.split("/");
  if (parts.length >= 2) {
    const tail = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    if (tail.length <= maxLen) return `…/${tail}`;
  }
  return "…" + clean.slice(-(maxLen - 1));
}

function truncateText(str, maxLen = 54) {
  const s = String(str || "");
  return s.length <= maxLen ? s : s.slice(0, maxLen - 1) + "…";
}

function gripSvg(x, y) {
  return `<g opacity="0.32" fill="var(--dxr-muted)">
    <circle cx="${x}" cy="${y}" r="1.1"/><circle cx="${x + 4}" cy="${y}" r="1.1"/>
    <circle cx="${x}" cy="${y + 4}" r="1.1"/><circle cx="${x + 4}" cy="${y + 4}" r="1.1"/>
    <circle cx="${x}" cy="${y + 8}" r="1.1"/><circle cx="${x + 4}" cy="${y + 8}" r="1.1"/>
  </g>`;
}

/**
 * Render an adaptive vector SVG X-Ray card for a diff analysis report.
 * @param {any} report
 * @param {{ theme?: "auto" | "dark" | "light" }} [options]
 * @returns {string}
 */
export function renderSvgCard(report, options = {}) {
  const { meta, parsedDiff, moveReport, blastRadius, riskReport } = report;
  const width = 940;
  const height = 492;
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
    .slice(0, 4);

  const callerNodes = blastRadius.nodes
    .filter((n) => n.role === "untouched-caller")
    .slice(0, 4);

  const nodeW = 236;
  const nodeH = 44;

  const positionedChanged = changedNodes.map((n, i) => ({
    ...n,
    x: 320,
    y: 206 + i * 56,
  }));
  const positionedCallers = callerNodes.map((n, i) => ({
    ...n,
    x: 656,
    y: 206 + i * 56,
  }));

  const posById = new Map();
  for (const n of positionedChanged) posById.set(n.id, n);
  for (const n of positionedCallers) posById.set(n.id, n);

  const curveElements = [];
  for (const edge of blastRadius.edges) {
    const a = posById.get(edge.from);
    const b = posById.get(edge.to);
    if (!a || !b) continue;
    if (a.x === b.x) {
      // Clean vertical connector between adjacent nodes in the same column
      const upper = a.y < b.y ? a : b;
      const lower = a.y < b.y ? b : a;
      if (lower.y - upper.y <= 64) {
        const cx = upper.x + nodeW / 2;
        curveElements.push(
          `<line x1="${cx}" y1="${upper.y + nodeH}" x2="${cx}" y2="${lower.y - 3}" stroke="var(--dxr-border-strong)" stroke-width="1.3" marker-end="url(#dxr-arr-muted)" />`
        );
      }
    } else {
      const left = a.x < b.x ? a : b;
      const right = a.x < b.x ? b : a;
      const x1 = left.x + nodeW;
      const y1 = left.y + nodeH / 2;
      const x2 = right.x - 4;
      const y2 = right.y + nodeH / 2;
      const cx = (x1 + x2) / 2;
      const isBreak = edge.kind === "breaking-caller";
      const stroke = isBreak ? "#C04438" : "#4A729E";
      const marker = isBreak ? "url(#dxr-arr-danger)" : "url(#dxr-arr-blue)";
      curveElements.push(
        `<path d="M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-dasharray="5 4" marker-end="${marker}" stroke-opacity="0.88" />`
      );
    }
  }

  const lightVars = `
    --dxr-mat: #EDE9DF;
    --dxr-bg: #FAF9F5;
    --dxr-panel: #F3F0E8;
    --dxr-card: #FFFFFF;
    --dxr-border: #E5E1D6;
    --dxr-border-strong: #CEC9BA;
    --dxr-dot: #D8D3C5;
    --dxr-fg: #141413;
    --dxr-muted: #6B6860;
  `;
  const darkVars = `
    --dxr-mat: #141311;
    --dxr-bg: #1B1A18;
    --dxr-panel: #23221F;
    --dxr-card: #282622;
    --dxr-border: #36342E;
    --dxr-border-strong: #4A473F;
    --dxr-dot: #38352F;
    --dxr-fg: #F4F1EA;
    --dxr-muted: #A6A298;
  `;

  const themeCss =
    theme === "light"
      ? `.dxr-svg-root { ${lightVars} }`
      : theme === "dark"
      ? `.dxr-svg-root { ${darkVars} } /* prefers-color-scheme: dark */`
      : `.dxr-svg-root { ${lightVars} } @media (prefers-color-scheme: dark) { .dxr-svg-root { ${darkVars} } } [data-theme="dark"] .dxr-svg-root { ${darkVars} } [data-theme="light"] .dxr-svg-root { ${lightVars} }`;

  const topFindings = riskReport.findings.slice(0, 4);

  return `<svg xmlns="http://www.w3.org/2000/svg" class="dxr-svg-root" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="DiffXray Architecture &amp; Blast-Radius Summary">
  <style>
    ${themeCss}
    .dxr-svg-root .font-serif { font-family: Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif; }
    .dxr-svg-root .font-ui { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif; }
    .dxr-svg-root .font-mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
  </style>
  <defs>
    <pattern id="dxr-dots" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="var(--dxr-dot)" />
    </pattern>
    <marker id="dxr-arr-danger" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#C04438" />
    </marker>
    <marker id="dxr-arr-blue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4A729E" />
    </marker>
    <marker id="dxr-arr-muted" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--dxr-muted)" />
    </marker>
  </defs>

  <!-- Warm Stone Editorial Mat & Archival Sheet -->
  <rect width="${width}" height="${height}" rx="20" fill="var(--dxr-mat)" stroke="var(--dxr-border)" stroke-width="1" />
  <rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="14" fill="var(--dxr-bg)" stroke="var(--dxr-border)" stroke-width="1" />

  <!-- Studio Header Bar -->
  <rect x="15" y="15" width="${width - 30}" height="64" rx="13" fill="var(--dxr-panel)" />
  <line x1="14" y1="79" x2="${width - 14}" y2="79" stroke="var(--dxr-border)" stroke-width="1" />

  <g transform="translate(34, 33)">
    <rect width="28" height="28" rx="8" fill="#D97757" fill-opacity="0.12" stroke="#D97757" stroke-width="1.3" />
    <circle cx="14" cy="14" r="3.2" fill="#D97757" />
    <circle cx="14" cy="14" r="8.8" fill="none" stroke="#D97757" stroke-width="1.15" stroke-dasharray="2.8 2.2" />
  </g>
  <text x="74" y="45" class="font-serif" font-size="17" font-weight="600" fill="var(--dxr-fg)">${escapeHtml(truncateText(meta.title || "DiffXray Architectural Review", 58))}</text>
  <text x="74" y="63" class="font-mono" font-size="11" fill="var(--dxr-muted)">${escapeHtml(shortPath(meta.sourceLabel, 34))} · ${parsedDiff.stats.totalFiles} files (+${parsedDiff.stats.totalAdditions} / -${parsedDiff.stats.totalDeletions}) · ${moveReport.stats.noiseReductionPercent}% motion collapsed</text>

  <!-- Trust Pill -->
  <g transform="translate(${width - 196}, 31)">
    <rect width="162" height="32" rx="16" fill="${gradeColor}" fill-opacity="0.10" stroke="${gradeColor}" stroke-width="1.2" />
    <text x="81" y="20.5" text-anchor="middle" class="font-mono" font-size="11.5" font-weight="600" fill="${gradeColor}">TRUST ${riskReport.trustScore}/100 · Grade ${riskReport.grade}</text>
  </g>

  <!-- Symmetric 4-Card KPI Strip (x=34..906, width=209 each, gap=12) -->
  <g transform="translate(34, 94)">
    <g transform="translate(0, 0)">
      <rect width="209" height="54" rx="10" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
      <text x="14" y="21" class="font-ui" font-size="11" font-weight="500" fill="var(--dxr-muted)">Focused review</text>
      <text x="14" y="42" class="font-serif" font-size="18" font-weight="600" fill="var(--dxr-fg)">~${blastRadius.stats.estimatedReviewMinutes} min</text>
      <text x="195" y="41" text-anchor="end" class="font-mono" font-size="10.5" fill="#4E7A55">${moveReport.stats.effectiveLogicLines} loc</text>
    </g>
    <g transform="translate(221, 0)">
      <rect width="209" height="54" rx="10" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
      <text x="14" y="21" class="font-ui" font-size="11" font-weight="500" fill="var(--dxr-muted)">Motion collapsed</text>
      <text x="14" y="42" class="font-serif" font-size="18" font-weight="600" fill="#D97757">${moveReport.stats.noiseReductionPercent}%</text>
      <text x="195" y="41" text-anchor="end" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">${moveReport.stats.movePairs} move(s)</text>
    </g>
    <g transform="translate(442, 0)">
      <rect width="209" height="54" rx="10" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
      <text x="14" y="21" class="font-ui" font-size="11" font-weight="500" fill="var(--dxr-muted)">Untouched callers</text>
      <text x="14" y="42" class="font-serif" font-size="18" font-weight="600" fill="#4A729E">${blastRadius.stats.untouchedCallerCount}</text>
      <text x="195" y="41" text-anchor="end" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">downstream</text>
    </g>
    <g transform="translate(663, 0)">
      <rect width="209" height="54" rx="10" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
      <text x="14" y="21" class="font-ui" font-size="11" font-weight="500" fill="var(--dxr-muted)">Silent hazards</text>
      <text x="14" y="42" class="font-serif" font-size="18" font-weight="600" fill="${riskReport.counts.critical + riskReport.counts.high > 0 ? "#C04438" : "#4E7A55"}">${riskReport.counts.total}</text>
      <text x="195" y="41" text-anchor="end" class="font-mono" font-size="10.5" fill="var(--dxr-muted)">${riskReport.counts.critical}c · ${riskReport.counts.high}h · ${riskReport.counts.medium}m</text>
    </g>
  </g>

  <!-- Left Column: Audit Summary -->
  <g transform="translate(34, 162)">
    <rect width="260" height="278" rx="12" fill="var(--dxr-panel)" stroke="var(--dxr-border)" />
    <text x="16" y="25" class="font-ui" font-size="11.5" font-weight="600" fill="var(--dxr-fg)">${topFindings.length > 0 ? "Silent Hazard Audit" : "Guided Reading Order"}</text>
    ${
      topFindings.length > 0
        ? topFindings
            .map((f, idx) => {
              const fy = 38 + idx * 57;
              const col =
                f.severity === "critical"
                  ? "#C04438"
                  : f.severity === "high"
                  ? "#D97757"
                  : f.severity === "medium"
                  ? "#B57B2E"
                  : "#6B6860";
              return `<g transform="translate(12, ${fy})">
                <rect width="236" height="48" rx="9" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
                <text x="12" y="19" class="font-mono" font-size="10.5" font-weight="600" fill="${col}">${escapeHtml(f.ruleId)}</text>
                <text x="224" y="19" text-anchor="end" class="font-mono" font-size="9.5" fill="var(--dxr-muted)">${escapeHtml(f.severity)}</text>
                <text x="12" y="36" class="font-mono" font-size="10" fill="var(--dxr-muted)">${escapeHtml(shortPath(f.filePath, 25))}:${f.lineNumber}</text>
              </g>`;
            })
            .join("\n")
        : blastRadius.chapters
            .slice(0, 4)
            .map((c, idx) => {
              const cy = 38 + idx * 57;
              return `<g transform="translate(12, ${cy})">
                <rect width="236" height="48" rx="9" fill="var(--dxr-card)" stroke="var(--dxr-border)" />
                <text x="12" y="19" class="font-ui" font-size="11" font-weight="600" fill="var(--dxr-fg)">${c.order}. ${escapeHtml(truncateText(c.title, 26))}</text>
                <text x="12" y="36" class="font-mono" font-size="10" fill="var(--dxr-muted)">${c.files.length} file(s) · ~${c.estimatedMinutes} min</text>
              </g>`;
            })
            .join("\n")
    }
  </g>

  <!-- Right Dot-Grid Canvas: Blast-Radius Map -->
  <g>
    <rect x="306" y="162" width="600" height="278" rx="12" fill="var(--dxr-bg)" stroke="var(--dxr-border)" />
    <rect x="307" y="163" width="598" height="276" rx="11" fill="url(#dxr-dots)" />

    <!-- Swimlane Header Pills -->
    <g transform="translate(320, 174)">
      <rect width="142" height="22" rx="11" fill="var(--dxr-panel)" stroke="var(--dxr-border-strong)" />
      ${gripSvg(10, 7)}
      <text x="22" y="14.5" class="font-mono" font-size="9.5" font-weight="600" fill="var(--dxr-muted)">MODIFIED IN PR</text>
    </g>
    <g transform="translate(656, 174)">
      <rect width="162" height="22" rx="11" fill="var(--dxr-panel)" stroke="var(--dxr-border-strong)" />
      ${gripSvg(10, 7)}
      <text x="22" y="14.5" class="font-mono" font-size="9.5" font-weight="600" fill="#4A729E">UNTOUCHED CALLERS</text>
    </g>

    <!-- Edges -->
    ${curveElements.join("\n    ")}

    <!-- Changed Nodes -->
    ${positionedChanged
      .map((n) => {
        const stroke =
          n.signatureBreakCount > 0
            ? "#C04438"
            : n.impactScore >= 55
            ? "#D97757"
            : "#4E7A55";
        return `<g transform="translate(${n.x}, ${n.y})">
        <rect width="${nodeW}" height="${nodeH}" rx="10" fill="var(--dxr-card)" stroke="${stroke}" stroke-width="1.35" />
        ${gripSvg(nodeW - 14, 10)}
        <text x="12" y="18" class="font-mono" font-size="10.5" font-weight="600" fill="var(--dxr-fg)">${escapeHtml(shortPath(n.path, 25))}</text>
        <text x="12" y="33" class="font-mono" font-size="9.5" fill="var(--dxr-muted)">+${n.additions}/-${n.deletions} · ${escapeHtml(n.layer)} · impact ${n.impactScore}</text>
      </g>`;
      })
      .join("\n    ")}

    <!-- Untouched Caller Nodes -->
    ${
      positionedCallers.length > 0
        ? positionedCallers
            .map((n) => {
              const stroke = n.signatureBreakCount > 0 ? "#C04438" : "#4A729E";
              const label =
                n.signatureBreakCount > 0
                  ? "calls broken signature"
                  : "untouched caller";
              return `<g transform="translate(${n.x}, ${n.y})">
              <rect width="236" height="${nodeH}" rx="10" fill="var(--dxr-card)" stroke="${stroke}" stroke-width="1.35" stroke-dasharray="4 3" />
              ${gripSvg(222, 10)}
              <text x="12" y="18" class="font-mono" font-size="10.5" font-weight="600" fill="var(--dxr-fg)">${escapeHtml(shortPath(n.path, 25))}</text>
              <text x="12" y="33" class="font-mono" font-size="9.5" fill="${stroke}">${label}</text>
            </g>`;
            })
            .join("\n    ")
        : `<g transform="translate(656, 206)">
            <rect width="236" height="54" rx="10" fill="var(--dxr-card)" stroke="var(--dxr-border)" stroke-dasharray="4 3" />
            <text x="118" y="26" text-anchor="middle" class="font-ui" font-size="11" fill="#4E7A55">0 untouched callers hit</text>
            <text x="118" y="42" text-anchor="middle" class="font-mono" font-size="9.5" fill="var(--dxr-muted)">Contained within diff</text>
          </g>`
    }
  </g>

  <!-- Colophon -->
  <text x="34" y="462" class="font-ui" font-size="11" fill="var(--dxr-muted)">DiffXray · Local &amp; client-side diff intelligence · zero runtime dependencies</text>
  <text x="${width - 34}" y="462" text-anchor="end" class="font-mono" font-size="10.5" fill="#D97757">unbridled-41.github.io/diffxray</text>
</svg>`;
}
