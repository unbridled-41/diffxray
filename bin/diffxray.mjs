#!/usr/bin/env node

/**
 * @fileoverview DiffXray CLI & MCP Server Entrypoint.
 * Zero runtime dependencies — works directly via `npx github:unbridled-41/diffxray` or `diffxray`.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { execFile } from "node:child_process";
import {
  xrayDiff,
  renderHtmlStudio,
  renderSvgCard,
  renderMarkdownTour,
  renderSarifReport,
  renderTerminalReport,
  VERSION,
} from "../src/index.mjs";
import { acquireLocalGitDiff, fetchGitHubPrDiff, getGitRoot } from "../src/cli/git-runner.mjs";
import { scanWorkspaceFiles } from "../src/cli/workspace-scanner.mjs";
import { startMcpStdioServer } from "../src/mcp/server.mjs";

const HELP_TEXT = `
DiffXray v${VERSION} — X-ray any Git diff or AI-generated PR (zero dependencies)

Usage:
  diffxray [git-ref] [options]
  diffxray --pr <number | owner/repo#number | url> [options]
  diffxray --file <patch.diff> [options]
  git diff | diffxray --stdin [options]
  diffxray --mcp

Examples:
  diffxray                                 X-ray uncommitted changes (or current branch vs main)
  diffxray main...HEAD --html --open       Open interactive Blast-Radius & Diff Studio in browser
  diffxray --pr 42 --markdown pr-tour.md   X-ray GitHub PR #42 and export Markdown review tour
  diffxray --pr vercel-labs/skills#10      X-ray any public GitHub PR directly
  diffxray --staged --fail-on high         Pre-commit / CI gate failing on high or critical risks
  diffxray --mcp                           Start STDIO Model Context Protocol (MCP) server

Options:
  --staged                 Analyze staged git index (--cached)
  --pr <spec>              GitHub PR number, 'owner/repo#num', or full PR URL
  --file <path>            Read unified diff from file
  --stdin                  Read unified diff from standard input
  --title <text>           Custom report title
  --html [path]            Write single-file interactive HTML studio (default: diffxray-report.html)
  --open                   Open generated HTML studio in default system browser
  --svg [path]             Write adaptive dark/light SVG blast-radius card (default: diffxray-card.svg)
  --markdown [path]        Write GitHub PR Markdown review tour (prints to stdout if no path given)
  --sarif [path]           Write SARIF 2.1.0 report (default: diffxray-report.sarif)
  --config <path>          Path to policy file (auto-discovers .diffxray.json if present)
  --json                   Print structured JSON analysis to stdout
  --fail-on <severity>     Exit with code 1 if findings >= severity (critical|high|medium|low)
  --no-workspace           Skip local repository untouched-caller scan
  --no-color               Disable ANSI colors in terminal output
  --mcp                    Run as JSON-RPC 2.0 STDIO MCP server
  -h, --help               Show help
  -v, --version            Show version
`.trim();

function openInBrowser(filePath) {
  const full = resolve(filePath);
  if (process.platform === "win32") {
    execFile("cmd", ["/c", "start", "", full], () => {});
  } else if (process.platform === "darwin") {
    execFile("open", [full], () => {});
  } else {
    execFile("xdg-open", [full], () => {});
  }
}

function parseCliArgs(argv) {
  const opts = {
    ref: "",
    staged: false,
    pr: "",
    file: "",
    config: "",
    stdin: false,
    title: process.env.DIFFXRAY_TITLE || "",
    html: null,
    open: false,
    svg: null,
    markdown: null,
    sarif: null,
    json: false,
    failOn: "",
    workspace: true,
    color: !process.env.NO_COLOR,
    mcp: false,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const peekNextFile = (defaultPath) => {
      const next = argv[i + 1];
      if (next && !next.startsWith("-")) {
        i++;
        return next;
      }
      return defaultPath;
    };

    if (arg === "-h" || arg === "--help") opts.help = true;
    else if (arg === "-v" || arg === "--version") opts.version = true;
    else if (arg === "--mcp") opts.mcp = true;
    else if (arg === "--staged" || arg === "--cached") opts.staged = true;
    else if (arg === "--stdin") opts.stdin = true;
    else if (arg === "--json") opts.json = true;
    else if (arg === "--open") opts.open = true;
    else if (arg === "--no-workspace") opts.workspace = false;
    else if (arg === "--no-color") opts.color = false;
    else if (arg === "--pr") opts.pr = argv[++i] || "";
    else if (arg === "--file") opts.file = argv[++i] || "";
    else if (arg === "--config") opts.config = argv[++i] || "";
    else if (arg === "--title") opts.title = argv[++i] || "";
    else if (arg === "--fail-on") opts.failOn = (argv[++i] || "").toLowerCase();
    else if (arg === "--html") opts.html = peekNextFile("diffxray-report.html");
    else if (arg === "--svg") opts.svg = peekNextFile("diffxray-card.svg");
    else if (arg === "--sarif") opts.sarif = peekNextFile("diffxray-report.sarif");
    else if (arg === "--markdown") opts.markdown = peekNextFile("__STDOUT__");
    else if (!arg.startsWith("-") && !opts.ref) {
      if (/^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/i.test(arg)) {
        opts.pr = arg;
      } else {
        opts.ref = arg;
      }
    }
  }

  if (opts.open && !opts.html) {
    opts.html = "diffxray-report.html";
  }

  return opts;
}

function loadRepoPolicy(explicitPath, cwd) {
  const candidates = explicitPath
    ? [resolve(explicitPath)]
    : [join(cwd, ".diffxray.json"), ...(getGitRoot(cwd) ? [join(getGitRoot(cwd), ".diffxray.json")] : [])];
  for (const cand of candidates) {
    if (existsSync(cand)) {
      return JSON.parse(readFileSync(cand, "utf8"));
    }
  }
  return {};
}

const FAIL_THRESHOLD = {
  critical: ["critical"],
  high: ["critical", "high"],
  medium: ["critical", "high", "medium"],
  low: ["critical", "high", "medium", "low"],
};

async function main() {
  const opts = parseCliArgs(process.argv.slice(2));

  if (opts.help) {
    console.log(HELP_TEXT);
    return;
  }
  if (opts.version) {
    console.log(VERSION);
    return;
  }
  if (opts.mcp) {
    startMcpStdioServer();
    return;
  }

  let rawDiff = "";
  let sourceLabel = "";
  let title = opts.title;
  let prUrl = "";
  let workspaceFiles = [];

  if (opts.stdin) {
    rawDiff = readFileSync(0, "utf8");
    sourceLabel = "stdin";
    title = title || "Stdin Patch Analysis";
  } else if (opts.file) {
    rawDiff = readFileSync(resolve(opts.file), "utf8");
    sourceLabel = opts.file;
    title = title || `Patch: ${opts.file}`;
    if (opts.workspace) {
      const root = getGitRoot(process.cwd());
      if (root) workspaceFiles = scanWorkspaceFiles(root);
    }
  } else if (opts.pr) {
    const prData = await fetchGitHubPrDiff(opts.pr, { cwd: process.cwd() });
    rawDiff = prData.rawDiff;
    sourceLabel = prData.sourceLabel;
    title = title || prData.title;
    prUrl = prData.prUrl;
    if (opts.workspace) {
      const root = getGitRoot(process.cwd());
      if (root) workspaceFiles = scanWorkspaceFiles(root);
    }
  } else {
    const local = acquireLocalGitDiff({
      cwd: process.cwd(),
      staged: opts.staged,
      ref: opts.ref,
    });
    rawDiff = local.rawDiff;
    sourceLabel = local.sourceLabel;
    title = title || local.title;
    if (opts.workspace) {
      const root = getGitRoot(process.cwd()) || process.cwd();
      workspaceFiles = scanWorkspaceFiles(root);
    }
  }

  const policy = loadRepoPolicy(opts.config, process.cwd());
  const effectiveFailOn = (opts.failOn || policy.failOn || "").toLowerCase();

  const report = xrayDiff(rawDiff, {
    title,
    sourceLabel,
    prUrl,
    workspaceFiles,
    minMoveLines: policy.minMoveLines,
    minMoveSimilarity: policy.minMoveSimilarity,
    ignoreRules: policy.ignoreRules,
    ignorePaths: policy.ignorePaths,
  });

  if (opts.html) {
    const htmlOut = resolve(opts.html);
    writeFileSync(htmlOut, renderHtmlStudio(report), "utf8");
    if (!opts.json && opts.markdown !== "__STDOUT__") {
      console.error(`Wrote interactive HTML studio → ${htmlOut}`);
    }
    if (opts.open) openInBrowser(htmlOut);
  }

  if (opts.svg) {
    const svgOut = resolve(opts.svg);
    writeFileSync(svgOut, renderSvgCard(report), "utf8");
    if (!opts.json && opts.markdown !== "__STDOUT__") {
      console.error(`Wrote adaptive SVG card     → ${svgOut}`);
    }
  }

  if (opts.sarif) {
    const sarifOut = resolve(opts.sarif);
    writeFileSync(sarifOut, JSON.stringify(renderSarifReport(report.riskReport), null, 2), "utf8");
    if (!opts.json && opts.markdown !== "__STDOUT__") {
      console.error(`Wrote SARIF 2.1.0 report    → ${sarifOut}`);
    }
  }

  if (opts.markdown) {
    const md = renderMarkdownTour(report);
    if (opts.markdown === "__STDOUT__") {
      process.stdout.write(md + "\n");
    } else {
      const mdOut = resolve(opts.markdown);
      writeFileSync(mdOut, md, "utf8");
      if (!opts.json) {
        console.error(`Wrote Markdown PR tour      → ${mdOut}`);
      }
    }
  }

  if (opts.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else if (opts.markdown !== "__STDOUT__") {
    process.stdout.write(renderTerminalReport(report, { color: opts.color }) + "\n");
  }

  if (effectiveFailOn && FAIL_THRESHOLD[effectiveFailOn]) {
    const triggered = FAIL_THRESHOLD[effectiveFailOn].some(
      (sev) => (report.riskReport.counts[sev] || 0) > 0
    );
    if (triggered) {
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error(`DiffXray error: ${err.message || String(err)}`);
  process.exit(1);
});
