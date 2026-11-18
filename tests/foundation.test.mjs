import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { VERSION, REPO_URL, STUDIO_URL } from "../src/version.mjs";

test("package metadata and governance files are consistent", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.name, "diffxray");
  assert.equal(pkg.version, VERSION);
  assert.equal(pkg.license, "MIT");
  assert.equal(Object.keys(pkg.dependencies || {}).length, 0, "must have zero runtime dependencies");
  assert.match(REPO_URL, /^https:\/\/github\.com\/unbridled-41\/diffxray$/);
  assert.match(STUDIO_URL, /^https:\/\/unbridled-41\.github\.io\/diffxray\/$/);

  for (const requiredFile of [
    "LICENSE",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    "docs/MARKET_RESEARCH.md",
    "docs/ARCHITECTURE.md",
    "docs/PROJECT_STATE.md",
  ]) {
    assert.ok(
      existsSync(new URL(`../${requiredFile}`, import.meta.url)),
      `Expected governance/persistence file ${requiredFile} to exist`
    );
  }
});
