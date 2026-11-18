/**
 * @fileoverview Public Isomorphic API for DiffXray.
 * Runs the full pipeline: Unified Diff Parse -> Cross-File Move Detection ->
 * Multi-Language Symbol & Signature Analysis -> Blast-Radius Graph -> Risk Radar.
 */

import {
  parseUnifiedDiff,
  detectMovedBlocks,
  analyzeDiffSymbols,
  buildBlastRadius,
} from "./core/index.mjs";
import { analyzeRisks } from "./analyzers/risk-radar.mjs";
import { renderSarifReport } from "./renderers/sarif.mjs";
import { VERSION, REPO_URL, STUDIO_URL } from "./version.mjs";

/**
 * Run a complete DiffXray analysis on a raw unified diff string.
 *
 * @param {string} rawDiff
 * @param {{
 *   title?: string,
 *   subtitle?: string,
 *   sourceLabel?: string,
 *   prUrl?: string,
 *   workspaceFiles?: Array<{ path: string, content: string }>,
 *   minMoveLines?: number,
 *   minMoveSimilarity?: number,
 * }} [options]
 */
export function xrayDiff(rawDiff, options = {}) {
  const startedAt = Date.now();
  const parsedDiff = parseUnifiedDiff(rawDiff || "");
  const moveReport = detectMovedBlocks(parsedDiff, {
    minLines: options.minMoveLines ?? 4,
    minSimilarity: options.minMoveSimilarity ?? 0.72,
  });
  const symbolReport = analyzeDiffSymbols(parsedDiff);
  const blastRadius = buildBlastRadius(
    parsedDiff,
    moveReport,
    symbolReport,
    options.workspaceFiles || []
  );
  const riskReport = analyzeRisks(parsedDiff, moveReport, symbolReport, blastRadius);

  return {
    meta: {
      title: options.title || "DiffXray Analysis",
      subtitle: options.subtitle || "",
      sourceLabel: options.sourceLabel || "local git diff",
      prUrl: options.prUrl || "",
      version: VERSION,
      repoUrl: REPO_URL,
      studioUrl: STUDIO_URL,
      generatedAt: new Date().toISOString(),
      durationMs: Math.max(1, Date.now() - startedAt),
    },
    parsedDiff,
    moveReport,
    symbolReport,
    blastRadius,
    riskReport,
  };
}

export {
  parseUnifiedDiff,
  detectMovedBlocks,
  analyzeDiffSymbols,
  buildBlastRadius,
  analyzeRisks,
  renderSarifReport,
  VERSION,
  REPO_URL,
  STUDIO_URL,
};
