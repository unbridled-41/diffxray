# Changelog

All notable changes to **DiffXray** are documented in this file.

## [2.0.1] - 2026-11-18

### Fixed & Polished (Live v2.0 QA)
- **Symmetric 4-Column Studio KPI Row**: Fixed `.kpi-row` inside `renderHtmlStudio()` to stay in a balanced 4-column desktop row inside embedded workbench widths (`1058px`) instead of wrapping `3 + 1`.
- **Sticky Topbar Anchor Offset**: Added smooth scrolling and `scroll-margin-top: 84px` to anchored showcase sections so section headers never tuck beneath the frosted navigation bar.
- **Complete Workbench Localization**: Added `EN / 中文` localization for `#pr-input` placeholder and fullscreen toggle states (`⤢ 全屏展开` / `✕ 退出全屏`).

## [2.0.0] - 2026-11-18

### Editorial Design System & Full Showcase Website
- **Claude / Anthropic-Inspired Editorial Visual Identity**: Warm archival cream paper (`#FAF9F5`) default light mode + warm espresso (`#191816`) dark mode, literary serif headings (`Newsreader` / `Georgia`), burnt terracotta (`#D97757`), muted sage (`#4E7A55`), slate-blue (`#4A729E`), and archival brick (`#C04438`).
- **Flagship Showcase Website (`site/index.html`)**: Full editorial storytelling experience featuring live `EN / 中文` bilingual switching, 5-tab quick-install command card, framed expandable Interactive Workbench with synchronized `postMessage` theme switching, 3-column architectural bento essay, interactive 12-rule filterable catalog, and comparison matrix.
- **Upgraded Studio & Vector Assets**: Redesigned `html-studio.mjs` (with locked Split-Diff row alignment), `svg-card.mjs`, `hero-demo.svg`, `sample-card.svg`, and `logo-*.svg`.

## [1.2.0] - 2026-11-18

### Fixed & Improved (Live Browser QA Driven)
- **Light Theme Contrast Fix**: Scoped inline SVG custom properties to `.dxr-svg-root` (`--dxr-*`) so embedded SVG cards never override host HTML `:root` variables in Light Mode.
- **Symmetric SVG Card Geometry**: Eliminated multi-digit flag count overlap and right-border clipping in `renderSvgCard()`.
- **Blast-Radius Graph Auto-Fit**: Anchored zoom toolbar top-right and auto-scaled initial canvas zoom so all 4 swimlanes fit cleanly on 1280px–1440px viewports.
- **Sticky Navigation & Preset State**: Kept the 4-tab bar sticky during scroll and cleared active preset state when loading custom `?pr=` or commit URLs.

### Added
- **GitHub Commit URL X-Ray**: Paste any `https://github.com/owner/repo/commit/<sha>` or `owner/repo@<sha>` directly into the Live Browser Studio.
- **Zero-Husky Pre-Push Hook Installer**: Run `diffxray --install-hook` to install a fast `.git/hooks/pre-push` silent-hazard gate.

## [1.1.0] - 2026-11-18

### Added
- **Side-by-Side Split Diff View (`Diff: Unified` ↔ `Diff: Split`, hotkey `s`)** in the Interactive HTML X-Ray Studio with dual-pane intraline highlights.
- **`.diffxray.json` Team Policy Configuration** (`--config <path>` or auto-discovered in repo root) supporting `ignoreRules`, `ignorePaths`, `minMoveLines`, `minMoveSimilarity`, and `failOn`.
- **MCP Registry, Glama & AI Discovery Manifests**: Added `glama.json`, `server.json` (`io.github.unbridled-41/diffxray`), zero-dependency `Dockerfile` (`node:22-alpine`), and `llms.txt` (also published at `/diffxray/llms.txt`).
- **Growth Sprint Telemetry CLI (`npm run telemetry`)** and `docs/GROWTH_LOG.md`.

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
