/**
 * @fileoverview OASIS SARIF v2.1.0 Exporter for GitHub Security Code Scanning & CI Pipelines.
 */

import { VERSION, REPO_URL } from "../version.mjs";

const SARIF_LEVEL = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "note",
};

/**
 * Convert DiffXray risk findings into a valid SARIF 2.1.0 JSON object.
 * @param {{ findings: Array<any> }} riskReport
 */
export function renderSarifReport(riskReport) {
  const rulesMap = new Map();
  for (const f of riskReport.findings) {
    if (!rulesMap.has(f.ruleId)) {
      rulesMap.set(f.ruleId, {
        id: f.ruleId,
        name: f.ruleId,
        shortDescription: { text: f.title },
        fullDescription: { text: f.whyItMatters },
        helpUri: `${REPO_URL}#risk-radar`,
        defaultConfiguration: {
          level: SARIF_LEVEL[f.severity] || "warning",
        },
        properties: {
          category: f.category,
          severity: f.severity,
        },
      });
    }
  }

  const results = riskReport.findings.map((f) => ({
    ruleId: f.ruleId,
    level: SARIF_LEVEL[f.severity] || "warning",
    message: {
      text: `${f.title}. ${f.whyItMatters}`,
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: {
            uri: f.filePath.replace(/^\//, ""),
          },
          region: {
            startLine: Math.max(1, f.lineNumber || 1),
            snippet: { text: f.snippet || "" },
          },
        },
      },
    ],
    properties: {
      findingId: f.id,
      severity: f.severity,
      agentFixPrompt: f.agentFixPrompt,
    },
  }));

  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "DiffXray",
            version: VERSION,
            informationUri: REPO_URL,
            rules: Array.from(rulesMap.values()),
          },
        },
        results,
      },
    ],
  };
}
