/**
 * @fileoverview Zero-dependency static site builder for GitHub Pages (`site/dist/`).
 * Copies `site/index.html`, `site/presets.mjs`, and the pure isomorphic ESM engine
 * (`src/version.mjs`, `src/index.mjs`, `src/core/`, `src/analyzers/`, `src/renderers/`),
 * stamping `?v=<VERSION>` onto relative `.mjs` module specifiers inside `site/dist/`
 * so browsers immediately pick up fresh releases without stale CDN sub-module caching.
 */

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { VERSION } from "../src/version.mjs";

const ROOT = process.cwd();
const OUT = join(ROOT, "site", "dist");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "src"), { recursive: true });

cpSync(join(ROOT, "site", "index.html"), join(OUT, "index.html"));
cpSync(join(ROOT, "site", "presets.mjs"), join(OUT, "presets.mjs"));
cpSync(join(ROOT, "llms.txt"), join(OUT, "llms.txt"));
cpSync(join(ROOT, "src", "version.mjs"), join(OUT, "src", "version.mjs"));
cpSync(join(ROOT, "src", "index.mjs"), join(OUT, "src", "index.mjs"));
cpSync(join(ROOT, "src", "core"), join(OUT, "src", "core"), { recursive: true });
cpSync(join(ROOT, "src", "analyzers"), join(OUT, "src", "analyzers"), { recursive: true });
cpSync(join(ROOT, "src", "renderers"), join(OUT, "src", "renderers"), { recursive: true });

function stampModuleVersions(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      stampModuleVersions(full);
    } else if (entry.name.endsWith(".mjs") || entry.name.endsWith(".html")) {
      const content = readFileSync(full, "utf8");
      const stamped = content.replace(
        /(from\s+["'])(\.\.?\/[^"'?]+\.mjs)(["'])/g,
        `$1$2?v=${VERSION}$3`
      );
      if (stamped !== content) writeFileSync(full, stamped, "utf8");
    }
  }
}

stampModuleVersions(OUT);

// Disable Jekyll processing on GitHub Pages so `.mjs` and underscore files serve cleanly
writeFileSync(join(OUT, ".nojekyll"), "", "utf8");

console.log(`Built DiffXray Web Studio v${VERSION} → ${OUT}`);
