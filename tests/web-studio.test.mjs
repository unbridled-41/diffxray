import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { xrayDiff } from "../src/index.mjs";
import { PRESETS } from "../site/presets.mjs";

const BUILD_SCRIPT = fileURLToPath(new URL("../scripts/build-site.mjs", import.meta.url));

test("Web Studio presets analyze accurately and static site builder outputs complete bundle", () => {
  const vibe = xrayDiff(PRESETS["vibe-auth"].rawDiff, {
    title: PRESETS["vibe-auth"].title,
    sourceLabel: PRESETS["vibe-auth"].sourceLabel,
    workspaceFiles: PRESETS["vibe-auth"].workspaceFiles,
  });
  assert.ok(vibe.riskReport.counts.critical >= 2, "vibe-auth preset must showcase critical hazards");
  assert.ok(vibe.blastRadius.untouchedCallers.length >= 2, "vibe-auth preset must showcase untouched callers");
  assert.ok(vibe.moveReport.moves.length >= 1, "vibe-auth preset must showcase cross-file move");

  const clean = xrayDiff(PRESETS["clean-refactor"].rawDiff, {
    title: PRESETS["clean-refactor"].title,
    sourceLabel: PRESETS["clean-refactor"].sourceLabel,
    workspaceFiles: PRESETS["clean-refactor"].workspaceFiles,
  });
  assert.equal(clean.riskReport.grade, "A");
  assert.ok(clean.moveReport.stats.noiseReductionPercent >= 50);

  execFileSync(process.execPath, [BUILD_SCRIPT], { stdio: "pipe" });
  assert.ok(existsSync(new URL("../site/dist/index.html", import.meta.url)));
  assert.ok(existsSync(new URL("../site/dist/.nojekyll", import.meta.url)));
  assert.ok(existsSync(new URL("../site/dist/src/index.mjs", import.meta.url)));
  assert.ok(
    readFileSync(new URL("../site/dist/index.html", import.meta.url), "utf8").includes("DiffXray Interactive Studio")
  );
});
