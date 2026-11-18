import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { xrayDiff, renderSvgCard, renderHtmlStudio } from "../src/index.mjs";
import { installPrePushHook } from "../src/cli/hook-installer.mjs";

test("v1.2.0 SVG card scopes CSS custom properties to .dxr-svg-root (preventing host Light Theme leak)", () => {
  const report = xrayDiff(`diff --git a/src/a.ts b/src/a.ts\n--- a/src/a.ts\n+++ b/src/a.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n`);
  const svg = renderSvgCard(report);

  assert.ok(svg.includes('class="dxr-svg-root"'));
  assert.ok(svg.includes("--dxr-bg:"));
  assert.ok(!svg.includes(":root {"), "SVG card must never emit unscoped :root CSS rules that pollute host HTML");

  const html = renderHtmlStudio(report);
  assert.ok(html.includes('html[data-theme="light"]'));
  assert.ok(html.includes("computeFitScale"));
});

test("v1.2.0 installPrePushHook creates .git/hooks/pre-push and protects custom hooks without --force", () => {
  const dir = mkdtempSync(join(tmpdir(), "diffxray-hook-"));
  try {
    execFileSync("git", ["init"], { cwd: dir, stdio: "pipe" });
    const hookPath = installPrePushHook({ cwd: dir });
    const content = readFileSync(hookPath, "utf8");
    assert.ok(content.includes("# diffxray-managed-hook"));
    assert.ok(content.includes("--fail-on high"));

    // Overwrite with custom user hook and verify refusal without force
    writeFileSync(hookPath, "#!/bin/sh\necho custom\n", "utf8");
    assert.throws(() => installPrePushHook({ cwd: dir }), /Existing custom pre-push hook/);

    // Force overwrite succeeds
    installPrePushHook({ cwd: dir, force: true });
    assert.ok(readFileSync(hookPath, "utf8").includes("# diffxray-managed-hook"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
