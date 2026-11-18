import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();

function collectFiles(dir, ext = ".mjs") {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git" || entry === ".tmp" || entry === "dist") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...collectFiles(full, ext));
    } else if (entry.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

// 1. Enforce zero runtime dependencies
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const deps = Object.keys(pkg.dependencies || {});
if (deps.length > 0) {
  console.error(`FAIL: Expected zero runtime dependencies, found: ${deps.join(", ")}`);
  process.exit(1);
}

// 2. Syntax check all .mjs files
const mjsFiles = collectFiles(ROOT, ".mjs");
for (const file of mjsFiles) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

// 3. Enforce browser isomorphism in src/core, src/analyzers, and src/renderers
for (const isoDir of ["src/core", "src/analyzers", "src/renderers"]) {
  const fullIso = join(ROOT, isoDir);
  try {
    const files = collectFiles(fullIso, ".mjs");
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      if (/from\s+["']node:/.test(content) || /import\(["']node:/.test(content)) {
        console.error(`FAIL: Isomorphic module ${relative(ROOT, file)} must not import node:* builtins.`);
        process.exit(1);
      }
    }
  } catch {
    // Directory may not exist yet in PR #1
  }
}

console.log(`OK: Verified ${mjsFiles.length} ESM modules (0 runtime dependencies, isomorphic boundary intact).`);
