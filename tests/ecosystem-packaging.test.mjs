import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { VERSION } from "../src/version.mjs";

test("Multi-agent skill, Claude/Codex plugins, MCP manifest, and bilingual docs are valid", () => {
  for (const p of [
    "SKILL.md",
    "skills/diffxray/SKILL.md",
    ".claude-plugin/plugin.json",
    ".claude-plugin/marketplace.json",
    ".codex-plugin/plugin.json",
    ".mcp.json",
    "AGENTS.md",
    "CHANGELOG.md",
    "README.md",
    "README.zh-CN.md",
    "docs/GROWTH_PLAYBOOK.md",
    "docs/media/logo-dark.svg",
    "docs/media/logo-light.svg",
    "docs/media/hero-demo.svg",
    "docs/media/sample-card.svg",
  ]) {
    assert.ok(existsSync(new URL(`../${p}`, import.meta.url)), `Missing required launch asset: ${p}`);
  }

  const skillText = readFileSync(new URL("../skills/diffxray/SKILL.md", import.meta.url), "utf8");
  assert.match(skillText, /^---\nname:\s*diffxray\ndescription:\s*.+\n---/);

  const claudePlugin = JSON.parse(
    readFileSync(new URL("../.claude-plugin/plugin.json", import.meta.url), "utf8")
  );
  const codexPlugin = JSON.parse(
    readFileSync(new URL("../.codex-plugin/plugin.json", import.meta.url), "utf8")
  );
  const mcpConfig = JSON.parse(readFileSync(new URL("../.mcp.json", import.meta.url), "utf8"));

  assert.equal(claudePlugin.version, VERSION);
  assert.equal(codexPlugin.version, VERSION);
  assert.ok(mcpConfig.mcpServers?.diffxray);
});
