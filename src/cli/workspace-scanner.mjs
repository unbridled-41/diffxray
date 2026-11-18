/**
 * @fileoverview Fast, bounded local repository source scanner for Blast-Radius analysis.
 * Skips ignored/vendor/build directories and binary files.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, extname } from "node:path";

const SKIP_DIRS = new Set([
  ".git", "node_modules", "dist", "build", "out", ".next", ".nuxt",
  "coverage", "vendor", "target", "__pycache__", ".venv", "venv",
  ".tox", ".cache", ".turbo", ".tmp", "bower_components",
]);

const CODE_EXTS = new Set([
  ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".go", ".rs", ".java", ".kt", ".cs", ".rb", ".php", ".swift",
  ".c", ".h", ".cpp", ".hpp", ".sql", ".prisma",
]);

/**
 * Parse basic directory/glob prefixes from `.gitignore` if present.
 * @param {string} rootDir
 */
function loadGitignorePrefixes(rootDir) {
  const giPath = join(rootDir, ".gitignore");
  if (!existsSync(giPath)) return [];
  const raw = existsSync(giPath) ? readFileSync(giPath, "utf8") : "";
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("!"))
    .map((l) => l.replace(/^\//, "").replace(/\/$/, ""));
}

/**
 * Scan workspace code files up to `maxFiles` for downstream caller detection.
 * @param {string} rootDir
 * @param {{ maxFiles?: number, maxFileBytes?: number }} [options]
 * @returns {Array<{ path: string, content: string }>}
 */
export function scanWorkspaceFiles(rootDir, options = {}) {
  const maxFiles = options.maxFiles ?? 1200;
  const maxFileBytes = options.maxFileBytes ?? 220_000;
  const ignorePrefixes = loadGitignorePrefixes(rootDir);
  /** @type {Array<{ path: string, content: string }>} */
  const files = [];

  function walk(currentDir) {
    if (files.length >= maxFiles) return;
    let entries;
    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) return;
      if (SKIP_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith(".") && entry.name !== ".github") continue;

      const full = join(currentDir, entry.name);
      const rel = relative(rootDir, full).replace(/\\/g, "/");
      if (ignorePrefixes.some((p) => rel === p || rel.startsWith(p + "/"))) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (!CODE_EXTS.has(ext)) continue;
        try {
          const st = statSync(full);
          if (st.size > maxFileBytes || st.size === 0) continue;
          const content = readFileSync(full, "utf8");
          if (content.includes("\0")) continue;
          files.push({ path: rel, content });
        } catch (err) {
          if (err && err.code === "EMFILE") throw err;
        }
      }
    }
  }

  walk(rootDir);
  return files;
}
