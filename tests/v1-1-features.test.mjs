import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { xrayDiff, renderHtmlStudio } from "../src/index.mjs";
import { VERSION } from "../src/version.mjs";

const CLI_PATH = fileURLToPath(new URL("../bin/diffxray.mjs", import.meta.url));

test("v1.1.0 policy filtering (ignoreRules & ignorePaths) works in xrayDiff and .diffxray.json CLI", () => {
  const sampleDiff = `diff --git a/src/legacy/old.ts b/src/legacy/old.ts
--- /dev/null
+++ b/src/legacy/old.ts
@@ -0,0 +1,2 @@
+export function oldFn(x: any) { console.log(x); }
diff --git a/src/core/service.ts b/src/core/service.ts
--- /dev/null
+++ b/src/core/service.ts
@@ -0,0 +1,2 @@
+export function run(x: any) { return x; }
`;

  const unfiltered = xrayDiff(sampleDiff);
  assert.ok(unfiltered.riskReport.counts.total >= 3);

  const filtered = xrayDiff(sampleDiff, {
    ignorePaths: ["src/legacy/"],
    ignoreRules: ["type-erosion"],
  });
  assert.equal(filtered.riskReport.counts.total, 0);
  assert.equal(filtered.riskReport.grade, "A");

  // Test .diffxray.json auto-discovery via CLI
  const dir = mkdtempSync(join(tmpdir(), "diffxray-cfg-"));
  try {
    const patchPath = join(dir, "test.diff");
    const cfgPath = join(dir, ".diffxray.json");
    writeFileSync(patchPath, sampleDiff, "utf8");
    writeFileSync(
      cfgPath,
      JSON.stringify({
        ignorePaths: ["src/legacy/"],
        ignoreRules: ["type-erosion"],
        failOn: "medium",
      }),
      "utf8"
    );

    const out = execFileSync(
      process.execPath,
      [CLI_PATH, "--file", patchPath, "--config", cfgPath, "--no-workspace", "--json"],
      { encoding: "utf8" }
    );
    const parsed = JSON.parse(out);
    assert.equal(parsed.riskReport.counts.total, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("v1.1.0 HTML Studio includes Split Diff toggle and MCP Registry / Glama / llms.txt manifests exist", () => {
  const report = xrayDiff(`diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n-const a = 1;\n+const a = 2;\n`);
  const html = renderHtmlStudio(report);
  assert.ok(html.includes('id="btn-diff-mode"'), "HTML studio must include Unified/Split toggle button");
  assert.ok(html.includes("splitDiffMode"), "HTML studio must include side-by-side split renderer");

  for (const f of ["glama.json", "server.json", "Dockerfile", "llms.txt", "docs/GROWTH_LOG.md"]) {
    assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `Expected ${f} to exist`);
  }
  const serverManifest = JSON.parse(readFileSync(new URL("../server.json", import.meta.url), "utf8"));
  assert.equal(serverManifest.version, VERSION);
  assert.equal(serverManifest.name, "io.github.unbridled-41/diffxray");
});
