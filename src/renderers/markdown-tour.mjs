/**
 * @fileoverview GitHub-Flavored Markdown PR Tour Renderer.
 * Produces a concise, high-signal Pull Request walkthrough for PR descriptions & GitHub Action comments.
 */

import { STUDIO_URL, REPO_URL } from "../version.mjs";

const SEV_BADGE = {
  critical: "[CRITICAL]",
  high: "[HIGH]",
  medium: "[MEDIUM]",
  low: "[LOW]",
};

/**
 * Render a GitHub-Flavored Markdown review guide from an `xrayDiff` report.
 * @param {any} report
 * @param {{ prSlug?: string }} [options]
 * @returns {string}
 */
export function renderMarkdownTour(report, options = {}) {
  const { meta, parsedDiff, moveReport, blastRadius, riskReport } = report;
  const lines = [];

  const prSlug =
    options.prSlug ||
    (meta.prUrl
      ? meta.prUrl.replace(/^https?:\/\/github\.com\//, "").replace(/\/pull\//, "/")
      : "");
  const liveLink = prSlug ? `${STUDIO_URL}?pr=${encodeURIComponent(prSlug)}` : STUDIO_URL;

  lines.push(`<!-- diffxray-sticky-comment -->`);
  lines.push(`## DiffXray Review Map — Grade **${riskReport.grade}** (${riskReport.trustScore}/100)`);
  lines.push(``);
  lines.push(
    `> **${riskReport.verdict}**  `
  );
  lines.push(
    `> Focused review: **~${blastRadius.stats.estimatedReviewMinutes} min** · ` +
      `**${parsedDiff.stats.totalFiles}** files (\`+${parsedDiff.stats.totalAdditions} / -${parsedDiff.stats.totalDeletions}\`) · ` +
      `**${moveReport.stats.noiseReductionPercent}%** mechanical/moved noise collapsed · ` +
      `**${blastRadius.stats.untouchedCallerCount}** untouched downstream caller(s)`
  );
  lines.push(``);

  // 1. Risk Radar Findings (if any)
  if (riskReport.findings.length > 0) {
    lines.push(
      `### Risk Radar (${riskReport.counts.critical} critical · ${riskReport.counts.high} high · ${riskReport.counts.medium} medium · ${riskReport.counts.low} low)`
    );
    lines.push(``);
    lines.push(`| Severity | Rule | Location | Finding |`);
    lines.push(`| --- | --- | --- | --- |`);
    for (const f of riskReport.findings.slice(0, 12)) {
      const safeTitle = f.title.replace(/\|/g, "\\|");
      lines.push(
        `| **${SEV_BADGE[f.severity]}** | \`${f.ruleId}\` | \`${f.filePath}:${f.lineNumber}\` | ${safeTitle} |`
      );
    }
    if (riskReport.findings.length > 12) {
      lines.push(`| ... | ... | ... | *+${riskReport.findings.length - 12} more findings in full X-Ray Studio* |`);
    }
    lines.push(``);
  }

  // 2. Untouched Downstream Callers (Blast Radius)
  if (blastRadius.untouchedCallers.length > 0) {
    lines.push(`### Untouched Blast Radius (${blastRadius.untouchedCallers.length} downstream file(s) not in diff)`);
    lines.push(``);
    for (const caller of blastRadius.untouchedCallers.slice(0, 8)) {
      const targets = caller.affectedChangedFiles
        .map((t) => `\`${t.targetPath}\` (${t.reasons.join(", ")})`)
        .join("; ");
      const warn = caller.touchesBreakingSymbol ? " **[BREAKING SIGNATURE]**" : "";
      lines.push(`- \`${caller.path}\`${warn} → ${targets}`);
    }
    lines.push(``);
  }

  // 3. Guided Reading Order
  if (blastRadius.chapters.length > 0) {
    lines.push(`### Guided Reading Order`);
    lines.push(``);
    for (const ch of blastRadius.chapters) {
      lines.push(
        `**${ch.order}. ${ch.title}** *(~${ch.estimatedMinutes} min)* — ${ch.rationale}`
      );
      for (const f of ch.files.slice(0, 8)) {
        const moveNote =
          f.movedLineRatio > 0 ? ` · ${f.movedLineRatio}% moved` : "";
        const riskNote =
          f.riskFindings && f.riskFindings.length > 0
            ? ` · ${f.riskFindings.length} risk flag(s)`
            : "";
        lines.push(
          `- \`${f.path}\` (\`+${f.additions}/-${f.deletions}\`, impact \`${f.impactScore}\`${moveNote}${riskNote})`
        );
      }
      if (ch.files.length > 8) {
        lines.push(`- *+${ch.files.length - 8} more file(s) in this chapter*`);
      }
      lines.push(``);
    }
  }

  // 4. Collapsed Mechanical & Moved Files
  if (blastRadius.skippedMechanical.length > 0 || moveReport.moves.length > 0) {
    lines.push(`<details>`);
    lines.push(
      `<summary>Skipped mechanical / moved files (${blastRadius.skippedMechanical.length} skipped · ${moveReport.moves.length} cross-file move(s))</summary>`
    );
    lines.push(``);
    for (const mv of moveReport.moves) {
      const delta =
        mv.modifiedInMoveCount > 0
          ? `${mv.modifiedInMoveCount} line(s) modified in flight`
          : "pure move";
      lines.push(
        `- **Moved**: \`${mv.fromFile}:${mv.fromStart}-${mv.fromEnd}\` → \`${mv.toFile}:${mv.toStart}-${mv.toEnd}\` (${mv.similarity}% match, ${delta})`
      );
    }
    for (const sk of blastRadius.skippedMechanical) {
      lines.push(`- **Skip**: \`${sk.path}\` — ${sk.reason} (\`+${sk.additions}/-${sk.deletions}\`)`);
    }
    lines.push(`</details>`);
    lines.push(``);
  }

  lines.push(
    `---`
  );
  lines.push(
    `<sub>X-rayed with <a href="${REPO_URL}">DiffXray</a> · <a href="${liveLink}">Open Interactive Blast-Radius Studio →</a></sub>`
  );

  return lines.join("\n");
}
