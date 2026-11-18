/**
 * @fileoverview Crisp ANSI Terminal User Interface (TUI) Report Renderer.
 * Respects `NO_COLOR` / `--no-color` automatically.
 */

export function renderTerminalReport(report, options = {}) {
  const useColor = options.color !== false;
  const c = {
    reset: useColor ? "\x1b[0m" : "",
    bold: useColor ? "\x1b[1m" : "",
    dim: useColor ? "\x1b[2m" : "",
    green: useColor ? "\x1b[32m" : "",
    yellow: useColor ? "\x1b[33m" : "",
    red: useColor ? "\x1b[31m" : "",
    magenta: useColor ? "\x1b[35m" : "",
    cyan: useColor ? "\x1b[36m" : "",
  };

  const { meta, parsedDiff, moveReport, blastRadius, riskReport } = report;
  const gradeColor =
    riskReport.grade === "A" || riskReport.grade === "B"
      ? c.green
      : riskReport.grade === "C"
      ? c.yellow
      : c.red;

  const out = [];
  out.push("");
  out.push(
    `${c.bold}${c.cyan}◉ DiffXray${c.reset} ${c.dim}v${meta.version}${c.reset}  ${c.bold}${meta.title}${c.reset} ${c.dim}(${meta.sourceLabel})${c.reset}`
  );
  out.push(`${c.dim}${"─".repeat(74)}${c.reset}`);
  out.push(
    `  Trust Score : ${gradeColor}${c.bold}${riskReport.trustScore}/100 (Grade ${riskReport.grade})${c.reset} — ${riskReport.verdict}`
  );
  out.push(
    `  Review Time : ${c.bold}~${blastRadius.stats.estimatedReviewMinutes} min${c.reset} (${parsedDiff.stats.totalFiles} files, ${c.green}+${parsedDiff.stats.totalAdditions}${c.reset}/${c.red}-${parsedDiff.stats.totalDeletions}${c.reset}, ${c.yellow}${moveReport.stats.noiseReductionPercent}% mechanical noise collapsed${c.reset})`
  );
  out.push(
    `  Blast Radius: ${c.magenta}${c.bold}${blastRadius.stats.untouchedCallerCount} untouched downstream caller(s)${c.reset} · ${moveReport.stats.movePairs} cross-file move(s)`
  );
  out.push("");

  if (riskReport.findings.length > 0) {
    out.push(
      `${c.bold}Silent Risk Radar (${riskReport.counts.critical} critical · ${riskReport.counts.high} high · ${riskReport.counts.medium} medium · ${riskReport.counts.low} low)${c.reset}`
    );
    for (const f of riskReport.findings.slice(0, 10)) {
      const sevCol =
        f.severity === "critical" || f.severity === "high" ? c.red : f.severity === "medium" ? c.yellow : c.dim;
      out.push(
        `  ${sevCol}${c.bold}[${f.severity.toUpperCase()}]${c.reset} ${c.bold}${f.ruleId}${c.reset}  ${c.cyan}${f.filePath}:${f.lineNumber}${c.reset}`
      );
      out.push(`    ${f.title}`);
    }
    if (riskReport.findings.length > 10) {
      out.push(`  ${c.dim}... +${riskReport.findings.length - 10} additional finding(s)${c.reset}`);
    }
    out.push("");
  }

  if (blastRadius.untouchedCallers.length > 0) {
    out.push(`${c.bold}Untouched Downstream Callers (Blast Radius)${c.reset}`);
    for (const caller of blastRadius.untouchedCallers.slice(0, 6)) {
      const warn = caller.touchesBreakingSymbol ? ` ${c.red}${c.bold}[BREAKING SIGNATURE]${c.reset}` : "";
      const targets = caller.affectedChangedFiles.map((t) => t.targetPath).join(", ");
      out.push(`  ${c.magenta}↳${c.reset} ${caller.path}${warn} ${c.dim}→ ${targets}${c.reset}`);
    }
    out.push("");
  }

  if (blastRadius.chapters.length > 0) {
    out.push(`${c.bold}Guided Reading Order${c.reset}`);
    for (const ch of blastRadius.chapters) {
      out.push(`  ${c.bold}${ch.order}. ${ch.title}${c.reset} ${c.dim}(~${ch.estimatedMinutes} min)${c.reset}`);
      for (const f of ch.files.slice(0, 5)) {
        const mv = f.movedLineRatio > 0 ? ` ${c.yellow}[${f.movedLineRatio}% moved]${c.reset}` : "";
        const rk = f.riskFindings?.length ? ` ${c.red}[${f.riskFindings.length} risk]${c.reset}` : "";
        out.push(
          `     • ${f.path} ${c.dim}(+${f.additions}/-${f.deletions}, impact ${f.impactScore})${c.reset}${mv}${rk}`
        );
      }
      if (ch.files.length > 5) {
        out.push(`     ${c.dim}... +${ch.files.length - 5} more file(s)${c.reset}`);
      }
    }
    out.push("");
  }

  if (blastRadius.skippedMechanical.length > 0) {
    out.push(
      `${c.dim}Collapsed ${blastRadius.skippedMechanical.length} skippable mechanical/generated file(s): ${blastRadius.skippedMechanical
        .slice(0, 4)
        .map((s) => s.path)
        .join(", ")}${blastRadius.skippedMechanical.length > 4 ? "…" : ""}${c.reset}`
    );
    out.push("");
  }

  return out.join("\n");
}
