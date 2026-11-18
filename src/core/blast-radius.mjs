/**
 * @fileoverview Blast-Radius Graph Builder & Guided Reading Chapter Planner.
 * Resolves cross-file dependencies inside the diff AND scans untouched workspace files
 * to surface downstream callers affected by changed modules/symbols.
 */

import { detectLanguage, classifyLayer } from "./diff-parser.mjs";
import { extractImportsFromContent } from "./symbol-graph.mjs";

const RESOLVE_EXTENSIONS = [
  "", ".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".go", ".rs", ".java", ".kt",
  "/index.ts", "/index.tsx", "/index.js", "/index.mjs", "/__init__.py", "/mod.rs",
];

/**
 * Normalize POSIX path segments (`a/b/../c` -> `a/c`).
 * @param {string} p
 */
function normalizePosix(p) {
  const parts = (p || "").replace(/\\/g, "/").split("/");
  const stack = [];
  for (const seg of parts) {
    if (!seg || seg === ".") continue;
    if (seg === "..") stack.pop();
    else stack.push(seg);
  }
  return stack.join("/");
}

/**
 * Get parent directory of a POSIX path.
 * @param {string} filePath
 */
function dirnamePosix(filePath) {
  const norm = normalizePosix(filePath);
  const idx = norm.lastIndexOf("/");
  return idx === -1 ? "" : norm.slice(0, idx);
}

/**
 * Resolve an import specifier from `importerPath` against a known set of repository file paths.
 * @param {string} importerPath
 * @param {string} specifier
 * @param {Set<string>} knownPaths
 * @returns {string|null}
 */
export function resolveModulePath(importerPath, specifier, knownPaths) {
  if (!specifier) return null;

  // 1. Relative JS/TS/Python paths (`./foo`, `../bar`, `.utils`)
  if (specifier.startsWith(".")) {
    let rel = specifier;
    // Python leading dot relative import (`.auth` -> `./auth`)
    if (/^\.[A-Za-z_]/.test(rel)) {
      rel = "./" + rel.slice(1).replace(/\./g, "/");
    }
    // Strip `.js` -> `.ts`/`.mjs` TypeScript ESM alias
    const baseDir = dirnamePosix(importerPath);
    const candidateBase = normalizePosix(baseDir ? `${baseDir}/${rel}` : rel);
    const stripped = candidateBase.replace(/\.(js|mjs|cjs|jsx)$/, "");

    for (const root of [candidateBase, stripped]) {
      for (const ext of RESOLVE_EXTENSIONS) {
        const attempt = root + ext;
        if (knownPaths.has(attempt)) return attempt;
      }
    }
  }

  // 2. Alias imports (`@/lib/auth`, `~/utils/db`, `src/core/parser`, Python `app.services.auth`, Rust `crate::core::parser`)
  const normalizedSpec = specifier
    .replace(/^(@\/|~\/)/, "src/")
    .replace(/^crate::/, "src/")
    .replace(/::/g, "/");

  const candidates = [normalizedSpec];
  if (!specifier.includes("/") && specifier.includes(".")) {
    candidates.push(specifier.replace(/\./g, "/"));
  }

  for (const cand of candidates) {
    for (const ext of RESOLVE_EXTENSIONS) {
      if (knownPaths.has(cand + ext)) return cand + ext;
      if (knownPaths.has("src/" + cand + ext)) return "src/" + cand + ext;
    }
    // Suffix match for Go packages / monorepo subpaths (`github.com/org/repo/internal/auth`)
    const segs = cand.split("/").filter(Boolean);
    if (segs.length >= 2) {
      const tail2 = segs.slice(-2).join("/");
      for (const kp of knownPaths) {
        if (kp.startsWith(tail2 + "/") || kp === tail2 || kp.endsWith("/" + tail2 + ".ts") || kp.endsWith("/" + tail2 + ".mjs") || kp.endsWith("/" + tail2 + ".py")) {
          return kp;
        }
      }
    }
  }

  return null;
}

const CHAPTER_META = [
  {
    id: "entrypoints",
    order: 1,
    title: "Entrypoints, APIs & Public Contracts",
    rationale: "Read outer boundaries, routes, CLI flags, and public schemas first to anchor intent.",
    layers: new Set(["entrypoint"]),
  },
  {
    id: "core",
    order: 2,
    title: "Core Domain & Business Logic",
    rationale: "Inspect high-impact state transitions, algorithms, and cross-module invariants.",
    layers: new Set(["core"]),
  },
  {
    id: "data",
    order: 3,
    title: "Data Models, Schemas & Configuration",
    rationale: "Verify persistence migrations, environment keys, and build/runtime configs.",
    layers: new Set(["data", "config"]),
  },
  {
    id: "ui",
    order: 4,
    title: "UI Surfaces & Interactive Views",
    rationale: "Review visual components, client state wiring, and user-facing flows.",
    layers: new Set(["ui"]),
  },
  {
    id: "verification",
    order: 5,
    title: "Tests, Specs & Documentation",
    rationale: "Confirm assertions cover new edge cases and docs match behavior.",
    layers: new Set(["test", "docs"]),
  },
];

/**
 * Build the complete Blast-Radius Graph & Guided Reading Plan.
 *
 * @param {{ files: Array<any>, stats: any }} parsedDiff
 * @param {{ moves: Array<any>, stats: any }} moveReport
 * @param {{ modifiedSymbols: Array<any>, signatureChanges: Array<any> }} symbolReport
 * @param {Array<{ path: string, content: string }>} [workspaceFiles]
 */
export function buildBlastRadius(parsedDiff, moveReport, symbolReport, workspaceFiles = []) {
  const changedPaths = new Set(parsedDiff.files.map((f) => normalizePosix(f.path)));
  const allKnownPaths = new Set(changedPaths);
  for (const wf of workspaceFiles) {
    allKnownPaths.add(normalizePosix(wf.path));
  }

  // Index modified symbol names -> defining changed file(s)
  const symbolToChangedFile = new Map();
  for (const sym of symbolReport.modifiedSymbols) {
    if (sym.name.length < 3) continue; // Avoid noisy 1-2 char symbols
    if (!symbolToChangedFile.has(sym.name)) {
      symbolToChangedFile.set(sym.name, []);
    }
    symbolToChangedFile.get(sym.name).push(sym);
  }

  /** @type {Map<string, any>} */
  const nodesMap = new Map();
  /** @type {Array<any>} */
  const edges = [];
  const edgeDedup = new Set();

  const addEdge = (from, to, kind, detail = "") => {
    if (!from || !to || from === to) return;
    const key = `${from}::${to}::${kind}`;
    if (edgeDedup.has(key)) return;
    edgeDedup.add(key);
    edges.push({ from, to, kind, detail });
  };

  // 1. Add changed file nodes
  for (const f of parsedDiff.files) {
    const normPath = normalizePosix(f.path);
    nodesMap.set(normPath, {
      id: normPath,
      path: normPath,
      role: "changed",
      status: f.status,
      layer: f.layer,
      language: f.language,
      isGenerated: f.isGenerated,
      additions: f.additions,
      deletions: f.deletions,
      effectiveChanges: f.effectiveChanges ?? f.additions + f.deletions,
      movedLineRatio: f.movedLineRatio ?? 0,
      modifiedSymbols: (f.symbols || []).map((s) => s.name),
      signatureBreakCount: (f.symbols || []).filter((s) => Boolean(s.breakingReason)).length,
      downstreamCallers: [],
      impactScore: 0,
    });
  }

  // 2. Add edges between changed files (imports + moves)
  for (const f of parsedDiff.files) {
    const fromPath = normalizePosix(f.path);
    for (const imp of f.imports || []) {
      const target = resolveModulePath(fromPath, imp.specifier, allKnownPaths);
      if (target && changedPaths.has(target)) {
        addEdge(fromPath, target, "diff-import", imp.symbols.join(", "));
      }
    }
  }

  for (const mv of moveReport.moves) {
    const fromP = normalizePosix(mv.fromFile);
    const toP = normalizePosix(mv.toFile);
    if (fromP !== toP && nodesMap.has(fromP) && nodesMap.has(toP)) {
      addEdge(fromP, toP, "moved-code", `${mv.lineCount} lines (${mv.similarity}%)`);
    }
  }

  // 3. Scan UNTOUCHED workspace files to discover hidden Blast Radius!
  const untouchedCallers = [];

  for (const wf of workspaceFiles) {
    const wfPath = normalizePosix(wf.path);
    if (changedPaths.has(wfPath)) continue;
    const lang = detectLanguage(wfPath);
    const layer = classifyLayer(wfPath);
    if (layer === "generated" || layer === "docs") continue;

    const wfImports = extractImportsFromContent(wf.content, lang);
    const matchedTargets = new Map(); // changedFilePath -> Set<reason>

    // Check explicit imports pointing to changed files
    for (const imp of wfImports) {
      const resolved = resolveModulePath(wfPath, imp.specifier, allKnownPaths);
      if (resolved && changedPaths.has(resolved)) {
        if (!matchedTargets.has(resolved)) matchedTargets.set(resolved, new Set());
        if (imp.symbols.length > 0) {
          matchedTargets.get(resolved).add(`imports { ${imp.symbols.slice(0, 3).join(", ")} }`);
        } else {
          matchedTargets.get(resolved).add("imports module");
        }
      }
    }

    // Check callsites of modified/signature-changed symbols
    for (const [symName, defs] of symbolToChangedFile) {
      if (symName.length < 4) continue;
      const callRe = new RegExp(`\\b${symName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(`);
      if (callRe.test(wf.content)) {
        for (const def of defs) {
          const targetPath = normalizePosix(def.filePath);
          // Connect if already imported OR exported unique symbol
          if (matchedTargets.has(targetPath) || def.exported) {
            if (!matchedTargets.has(targetPath)) matchedTargets.set(targetPath, new Set());
            matchedTargets.get(targetPath).add(
              def.breakingReason
                ? `calls ${symName}() [SIGNATURE CHANGED]`
                : `calls ${symName}()`
            );
          }
        }
      }
    }

    if (matchedTargets.size > 0) {
      const affectedChangedFiles = [];
      let touchesBreakingSymbol = false;

      for (const [targetPath, reasonsSet] of matchedTargets) {
        const reasons = Array.from(reasonsSet);
        if (reasons.some((r) => r.includes("SIGNATURE CHANGED"))) {
          touchesBreakingSymbol = true;
        }
        affectedChangedFiles.push({ targetPath, reasons });
        const targetNode = nodesMap.get(targetPath);
        if (targetNode) {
          targetNode.downstreamCallers.push({
            callerPath: wfPath,
            layer,
            reasons,
          });
        }
      }

      const callerRecord = {
        id: wfPath,
        path: wfPath,
        role: "untouched-caller",
        layer,
        language: lang,
        touchesBreakingSymbol,
        affectedChangedFiles,
      };
      untouchedCallers.push(callerRecord);
    }
  }

  // Keep top 25 highest-signal untouched callers in the visual graph so large monorepos stay crisp
  untouchedCallers.sort((a, b) => {
    if (a.touchesBreakingSymbol !== b.touchesBreakingSymbol) {
      return a.touchesBreakingSymbol ? -1 : 1;
    }
    if (a.layer !== "test" && b.layer === "test") return -1;
    if (a.layer === "test" && b.layer !== "test") return 1;
    return b.affectedChangedFiles.length - a.affectedChangedFiles.length;
  });

  for (const caller of untouchedCallers.slice(0, 25)) {
    nodesMap.set(caller.path, {
      id: caller.path,
      path: caller.path,
      role: "untouched-caller",
      status: "untouched",
      layer: caller.layer,
      language: caller.language,
      isGenerated: false,
      additions: 0,
      deletions: 0,
      effectiveChanges: 0,
      movedLineRatio: 0,
      modifiedSymbols: [],
      signatureBreakCount: caller.touchesBreakingSymbol ? 1 : 0,
      downstreamCallers: [],
      impactScore: caller.touchesBreakingSymbol ? 75 : 35,
    });
    for (const link of caller.affectedChangedFiles) {
      addEdge(
        caller.path,
        link.targetPath,
        caller.touchesBreakingSymbol ? "breaking-caller" : "untouched-caller",
        link.reasons.join("; ")
      );
    }
  }

  // 4. Compute Impact Score (0-100) for each changed file
  for (const f of parsedDiff.files) {
    const normPath = normalizePosix(f.path);
    const node = nodesMap.get(normPath);
    if (!node) continue;
    if (f.isGenerated) {
      node.impactScore = 2;
      f.impactScore = 2;
      continue;
    }
    const layerWeight =
      f.layer === "entrypoint" ? 24 :
      f.layer === "core" ? 22 :
      f.layer === "data" ? 20 :
      f.layer === "config" ? 14 :
      f.layer === "ui" ? 12 :
      f.layer === "test" ? 6 : 4;

    const churnScore = Math.min(35, Math.round(Math.log2(1 + (node.effectiveChanges || 0)) * 5.5));
    const callerScore = Math.min(28, node.downstreamCallers.length * 8);
    const sigScore = Math.min(20, node.signatureBreakCount * 15);

    const score = Math.min(100, layerWeight + churnScore + callerScore + sigScore);
    node.impactScore = score;
    f.impactScore = score;
    f.downstreamCallers = node.downstreamCallers;
  }

  // 5. Build Guided Reading Chapters + Skippable Mechanical Drawer
  const chapters = CHAPTER_META.map((c) => ({
    id: c.id,
    order: c.order,
    title: c.title,
    rationale: c.rationale,
    files: [],
    estimatedMinutes: 0,
  }));

  const skippedMechanical = [];

  for (const f of parsedDiff.files) {
    const isPureMechanical =
      f.isGenerated ||
      f.isBinary ||
      ((f.effectiveChanges || 0) === 0 && (f.movedLineRatio >= 95 || f.status === "renamed"));

    if (isPureMechanical) {
      skippedMechanical.push({
        path: f.path,
        reason: f.isGenerated
          ? "Generated / lockfile"
          : f.isBinary
          ? "Binary asset"
          : "100% pure move / rename",
        additions: f.additions,
        deletions: f.deletions,
      });
      continue;
    }

    const chapter =
      chapters.find((c) => CHAPTER_META.find((m) => m.id === c.id)?.layers.has(f.layer)) ||
      chapters[1];
    chapter.files.push(f);
  }

  for (const ch of chapters) {
    ch.files.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));
    const effLines = ch.files.reduce((s, f) => s + (f.effectiveChanges ?? f.additions + f.deletions), 0);
    // ~32 effective lines of focused code review per minute (tests/docs read ~2x faster)
    const rate = ch.id === "verification" ? 65 : 30;
    ch.estimatedMinutes = ch.files.length > 0 ? Math.max(1, Math.ceil(effLines / rate)) : 0;
  }

  const activeChapters = chapters.filter((c) => c.files.length > 0);
  const totalEstimatedMinutes = activeChapters.reduce((s, c) => s + c.estimatedMinutes, 0);

  return {
    nodes: Array.from(nodesMap.values()),
    edges,
    untouchedCallers,
    chapters: activeChapters,
    skippedMechanical,
    stats: {
      changedNodes: parsedDiff.files.length,
      untouchedCallerCount: untouchedCallers.length,
      productionUntouchedCallers: untouchedCallers.filter((c) => c.layer !== "test").length,
      edgeCount: edges.length,
      estimatedReviewMinutes: totalEstimatedMinutes,
      skippedFilesCount: skippedMechanical.length,
    },
  };
}
