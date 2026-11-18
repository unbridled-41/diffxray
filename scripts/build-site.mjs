/**
 * @fileoverview Zero-dependency static site builder for GitHub Pages (`site/dist/`).
 * Copies `site/index.html`, `site/presets.mjs`, and the pure isomorphic ESM engine
 * (`src/version.mjs`, `src/index.mjs`, `src/core/`, `src/analyzers/`, `src/renderers/`)
 * so browsers load native ES modules with zero bundler bloat.
 */

import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "site", "dist");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "src"), { recursive: true });

cpSync(join(ROOT, "site", "index.html"), join(OUT, "index.html"));
cpSync(join(ROOT, "site", "presets.mjs"), join(OUT, "presets.mjs"));
cpSync(join(ROOT, "src", "version.mjs"), join(OUT, "src", "version.mjs"));
cpSync(join(ROOT, "src", "index.mjs"), join(OUT, "src", "index.mjs"));
cpSync(join(ROOT, "src", "core"), join(OUT, "src", "core"), { recursive: true });
cpSync(join(ROOT, "src", "analyzers"), join(OUT, "src", "analyzers"), { recursive: true });
cpSync(join(ROOT, "src", "renderers"), join(OUT, "src", "renderers"), { recursive: true });

// Disable Jekyll processing on GitHub Pages so `.mjs` and underscore files serve cleanly
writeFileSync(join(OUT, ".nojekyll"), "", "utf8");

console.log(`Built DiffXray Web Studio → ${OUT}`);
