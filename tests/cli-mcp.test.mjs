import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dispatchMcpRequest } from "../src/mcp/server.mjs";
import { parsePrSpecifier } from "../src/cli/git-runner.mjs";
import { VERSION } from "../src/version.mjs";

const CLI_PATH = fileURLToPath(new URL("../bin/diffxray.mjs", import.meta.url));

test("CLI --version and --help execute cleanly", () => {
  const ver = execFileSync(process.execPath, [CLI_PATH, "--version"], { encoding: "utf8" }).trim();
  assert.equal(ver, VERSION);

  const help = execFileSync(process.execPath, [CLI_PATH, "--help"], { encoding: "utf8" });
  assert.match(help, /DiffXray v/);
  assert.match(help, /--mcp/);
});

test("CLI --file exports HTML, SVG, Markdown, SARIF, JSON and enforces --fail-on gate", () => {
  const dir = mkdtempSync(join(tmpdir(), "diffxray-test-"));
  try {
    const patchPath = join(dir, "sample.diff");
    const htmlPath = join(dir, "out.html");
    const svgPath = join(dir, "out.svg");
    const mdPath = join(dir, "out.md");
    const sarifPath = join(dir, "out.sarif");

    writeFileSync(
      patchPath,
      `diff --git a/src/service.ts b/src/service.ts
new file mode 100644
--- /dev/null
+++ b/src/service.ts
@@ -0,0 +1,6 @@
+export async function syncData(input: any) {
+  try {
+    return await fetch(input);
+  } catch (e) {}
+}
`,
      "utf8"
    );

    const jsonOut = execFileSync(
      process.execPath,
      [
        CLI_PATH,
        "--file", patchPath,
        "--no-workspace",
        "--html", htmlPath,
        "--svg", svgPath,
        "--markdown", mdPath,
        "--sarif", sarifPath,
        "--json",
      ],
      { encoding: "utf8" }
    );

    const parsed = JSON.parse(jsonOut);
    assert.equal(parsed.parsedDiff.stats.totalFiles, 1);
    assert.ok(parsed.riskReport.counts.high >= 1, "silent catch should trigger high risk");
    assert.ok(readFileSync(htmlPath, "utf8").includes("<!DOCTYPE html>"));
    assert.ok(readFileSync(svgPath, "utf8").startsWith("<svg "));
    assert.ok(readFileSync(mdPath, "utf8").includes("DiffXray Review Map"));
    assert.equal(JSON.parse(readFileSync(sarifPath, "utf8")).version, "2.1.0");

    // Verify --fail-on high exits with status 1
    let exitCode = 0;
    try {
      execFileSync(process.execPath, [CLI_PATH, "--file", patchPath, "--no-workspace", "--fail-on", "high"], {
        stdio: "pipe",
      });
    } catch (err) {
      exitCode = err.status;
    }
    assert.equal(exitCode, 1, "expected exit code 1 when high severity finding is present");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("MCP JSON-RPC 2.0 server handles initialize, tools/list, and tools/call", async () => {
  const initRes = await dispatchMcpRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2024-11-05" },
  });
  assert.equal(initRes.result.serverInfo.name, "diffxray");

  const listRes = await dispatchMcpRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
  });
  assert.equal(listRes.result.tools.length, 3);

  const callRes = await dispatchMcpRequest({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "audit_silent_hazards",
      arguments: {
        rawDiff: `diff --git a/src/a.ts b/src/a.ts\n--- /dev/null\n+++ b/src/a.ts\n@@ -0,0 +1,2 @@\n+export function f() { try { work(); } catch {} }\n`,
      },
    },
  });
  const payload = JSON.parse(callRes.result.content[0].text);
  assert.ok(payload.counts.high >= 1);
});

test("parsePrSpecifier parses GitHub URLs and owner/repo#number formats", () => {
  assert.deepEqual(
    parsePrSpecifier("https://github.com/vercel-labs/skills/pull/42/files"),
    { owner: "vercel-labs", repo: "skills", number: 42 }
  );
  assert.deepEqual(
    parsePrSpecifier("unbridled-41/diffxray#12"),
    { owner: "unbridled-41", repo: "diffxray", number: 12 }
  );
});
