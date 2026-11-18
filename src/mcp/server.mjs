/**
 * @fileoverview Zero-dependency Model Context Protocol (MCP) JSON-RPC 2.0 STDIO Server.
 * Exposes DiffXray's deterministic blast-radius, move-detection, and silent-bug radar tools
 * to Claude Code, OpenAI Codex, Cursor, Claude Desktop, Windsurf, and Antigravity.
 */

import { xrayDiff, renderMarkdownTour } from "../index.mjs";
import { VERSION } from "../version.mjs";
import { acquireLocalGitDiff, fetchGitHubPrDiff, getGitRoot } from "../cli/git-runner.mjs";
import { scanWorkspaceFiles } from "../cli/workspace-scanner.mjs";

const TOOLS = [
  {
    name: "xray_git_diff",
    description:
      "X-ray a local Git diff (working tree, staged, or git ref like main...HEAD): detects cross-file moved blocks, maps untouched downstream callers in the blast radius, flags 12 'Quietly Wrong' silent hazards, and returns a guided reading order.",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string", description: "Optional repository directory path (defaults to process cwd)." },
        ref: { type: "string", description: "Optional git diff ref/range (e.g. 'main...HEAD' or 'HEAD~1..HEAD')." },
        staged: { type: "boolean", description: "Analyze staged changes (--cached) only." },
      },
    },
  },
  {
    name: "xray_github_pr",
    description:
      "Fetch and X-ray any public or accessible GitHub Pull Request ('owner/repo#123' or full URL), returning its Trust Score, Guided Reading Tour, and Silent Risk Radar.",
    inputSchema: {
      type: "object",
      properties: {
        pr: { type: "string", description: "Pull Request URL or 'owner/repo#number' specifier." },
      },
      required: ["pr"],
    },
  },
  {
    name: "audit_silent_hazards",
    description:
      "Run DiffXray's 12 deterministic 'Quietly Wrong' AI-diff regression & security detectors on a raw unified diff or local workspace changes, returning findings and actionable fix instructions.",
    inputSchema: {
      type: "object",
      properties: {
        rawDiff: { type: "string", description: "Optional raw unified diff text. If omitted, inspects local git changes." },
        cwd: { type: "string", description: "Optional repository path when rawDiff is omitted." },
      },
    },
  },
];

async function handleToolCall(name, args = {}) {
  if (name === "xray_git_diff") {
    const cwd = args.cwd || process.cwd();
    const { rawDiff, sourceLabel, title } = acquireLocalGitDiff({
      cwd,
      ref: args.ref,
      staged: Boolean(args.staged),
    });
    const gitRoot = getGitRoot(cwd) || cwd;
    const workspaceFiles = scanWorkspaceFiles(gitRoot);
    const report = xrayDiff(rawDiff, { title, sourceLabel, workspaceFiles });
    const markdown = renderMarkdownTour(report);
    return {
      content: [
        {
          type: "text",
          text: markdown,
        },
      ],
    };
  }

  if (name === "xray_github_pr") {
    const prData = await fetchGitHubPrDiff(args.pr);
    const report = xrayDiff(prData.rawDiff, {
      title: prData.title,
      sourceLabel: prData.sourceLabel,
      prUrl: prData.prUrl,
    });
    return {
      content: [{ type: "text", text: renderMarkdownTour(report) }],
    };
  }

  if (name === "audit_silent_hazards") {
    let rawDiff = args.rawDiff;
    let workspaceFiles = [];
    if (!rawDiff) {
      const cwd = args.cwd || process.cwd();
      rawDiff = acquireLocalGitDiff({ cwd }).rawDiff;
      const gitRoot = getGitRoot(cwd) || cwd;
      workspaceFiles = scanWorkspaceFiles(gitRoot);
    }
    const report = xrayDiff(rawDiff, { workspaceFiles });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              trustScore: report.riskReport.trustScore,
              grade: report.riskReport.grade,
              verdict: report.riskReport.verdict,
              counts: report.riskReport.counts,
              untouchedCallers: report.blastRadius.untouchedCallers.slice(0, 15),
              findings: report.riskReport.findings,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  throw new Error(`Unknown MCP tool: ${name}`);
}

/**
 * Process a single JSON-RPC 2.0 request object and return the response object (or `null` for notifications).
 * Exported directly so unit tests can verify protocol conformance deterministically.
 * @param {any} msg
 */
export async function dispatchMcpRequest(msg) {
  if (!msg || typeof msg !== "object") return null;

  // Notifications carry no `id`
  if (msg.id === undefined || msg.id === null) {
    return null;
  }

  try {
    if (msg.method === "initialize") {
      return {
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          protocolVersion: msg.params?.protocolVersion || "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "diffxray", version: VERSION },
        },
      };
    }

    if (msg.method === "ping") {
      return { jsonrpc: "2.0", id: msg.id, result: {} };
    }

    if (msg.method === "tools/list") {
      return { jsonrpc: "2.0", id: msg.id, result: { tools: TOOLS } };
    }

    if (msg.method === "tools/call") {
      const toolResult = await handleToolCall(msg.params?.name, msg.params?.arguments || {});
      return { jsonrpc: "2.0", id: msg.id, result: toolResult };
    }

    return {
      jsonrpc: "2.0",
      id: msg.id,
      error: { code: -32601, message: `Method not found: ${msg.method}` },
    };
  } catch (err) {
    return {
      jsonrpc: "2.0",
      id: msg.id,
      result: {
        isError: true,
        content: [{ type: "text", text: `DiffXray error: ${err.message || String(err)}` }],
      },
    };
  }
}

/**
 * Start listening on `process.stdin` / `process.stdout` for newline-delimited JSON-RPC 2.0 messages.
 */
export function startMcpStdioServer() {
  let buffer = "";
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", async (chunk) => {
    buffer += chunk;
    let newlineIdx;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);
      if (!line || line.startsWith("Content-Length:")) continue;
      try {
        const msg = JSON.parse(line);
        const reply = await dispatchMcpRequest(msg);
        if (reply) {
          process.stdout.write(JSON.stringify(reply) + "\n");
        }
      } catch (err) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: `Parse error: ${err.message || "invalid JSON"}` },
          }) + "\n"
        );
      }
    }
  });
}
