# Changelog

All notable changes to **DiffXray** are documented in this file.

## [1.0.0] - 2026-11-18

### Added
- **Isomorphic Core Engine (`src/core/`)**:
  - Unified Git diff & standalone patch parser with intraline character-level highlights, generated/lockfile detection, and architectural layer classification (`entrypoint`, `core`, `data`, `ui`, `config`, `test`, `docs`).
  - Logical sub-block cross-file **Move Detector** (`>= 72%` multiset Jaccard similarity) collapsing mechanical code motion while isolating exact **in-flight modified lines**.
  - Multi-language **Symbol & Signature Break Extractor** (`TypeScript/JavaScript`, `Python`, `Go`, `Rust`, `Java/Kotlin/C#`, `SQL`).
  - Workspace **Blast-Radius Graph** identifying untouched downstream callers and building topological **Guided Reading Chapters**.
- **"Quietly Wrong" Silent Risk Radar (`src/analyzers/risk-radar.mjs`)**:
  - 12 deterministic detectors (`secret-leak`, `injection-risk`, `auth-guard-removed`, `breaking-signature`, `weakened-test`, `silent-catch`, `unawaited-async`, `type-erosion`, `schema-drift`, `lockfile-drift`, `untested-core`, `debug-leftover`), Trust Score (`0–100`), and OASIS **SARIF v2.1.0** exporter.
- **Visual Studio & Renderers (`src/renderers/`)**:
  - Single-file offline **Interactive HTML5 X-Ray Studio** with pan/zoom SVG Blast-Radius Map, collapsible moves, intraline diffs, 1-click Agent Fix Prompts, dark/light themes, and keyboard navigation.
  - Adaptive `prefers-color-scheme` **SVG Blast-Radius Cards** and **GitHub PR Markdown Review Tours**.
- **CLI, MCP Server & GitHub Action**:
  - Zero-dependency `diffxray` CLI (`--staged`, `--pr`, `--file`, `--stdin`, `--html`, `--svg`, `--markdown`, `--sarif`, `--json`, `--fail-on`).
  - Standards-compliant JSON-RPC 2.0 STDIO **MCP Server** (`diffxray --mcp`).
  - Composite **GitHub Action** (`action.yml`) with sticky PR Review Map comments.
- **Zero-Install Live Web Studio (`https://unbridled-41.github.io/diffxray/`)**:
  - Client-side GitHub Pull Request X-Ray (`?pr=owner/repo/123`), showcase presets, and local `.diff` paste/drop.
- **Universal Multi-Agent Ecosystem**:
  - `SKILL.md` / `skills/diffxray/SKILL.md` (`npx skills add unbridled-41/diffxray`), `.claude-plugin`, `.codex-plugin`, and `.mcp.json`.
