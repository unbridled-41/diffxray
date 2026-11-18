/**
 * @fileoverview Zero-dependency, isomorphic Unified Git Diff Parser with
 * intraline token diffing, language classification, and architectural layer tagging.
 * Works identically in Node.js >=20 and modern browsers.
 */

const GENERATED_PATTERNS = [
  /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|Cargo\.lock|poetry\.lock|Pipfile\.lock|uv\.lock|go\.sum|composer\.lock|Gemfile\.lock)$/i,
  /\.(min\.js|min\.css|bundle\.js|map|snap|lock)$/i,
  /(^|\/)(dist|build|out|\.next|coverage|vendor|__snapshots__)\//i,
  /\.(pb\.go|pb\.ts|generated\.\w+|g\.dart)$/i,
];

const TEST_PATTERNS = [
  /(^|\/)(__tests__|tests?|spec|e2e|cypress|playwright|fixtures?)\//i,
  /\.(test|spec|e2e|fixture)\.[a-z0-9]+$/i,
  /(^|\/)presets\.[a-z0-9]+$/i,
  /(_test\.go|_test\.py|^test_.*\.py)$/i,
];

const DOC_PATTERNS = [
  /\.(md|mdx|rst|txt|adoc)$/i,
  /(^|\/)(docs?|examples?)\/.*\.(md|mdx|txt)$/i,
  /(^|\/)(LICENSE|CHANGELOG|CONTRIBUTING|CODE_OF_CONDUCT|SECURITY)(\.\w+)?$/i,
];

const CONFIG_PATTERNS = [
  /(^|\/)(\.github|\.circleci|\.husky|\.vscode|\.claude-plugin|\.codex-plugin)\//i,
  /(^|\/)(Dockerfile|Makefile|docker-compose[\w.-]*|action\.ya?ml|tsconfig[\w.-]*\.json|package\.json|Cargo\.toml|pyproject\.toml|go\.mod|\.eslintrc[\w.-]*|vite\.config\.\w+|next\.config\.\w+)$/i,
  /\.(ya?ml|toml|ini|env\.example)$/i,
];

const DATA_PATTERNS = [
  /(^|\/)(migrations?|prisma|drizzle|schema|models?|entities|repositories|db|database|sql)\//i,
  /\.(sql|prisma|graphql|gql|proto)$/i,
];

const ENTRYPOINT_PATTERNS = [
  /(^|\/)(bin|cli|cmd|routes?|controllers?|api|handlers?|pages|app\/api|mcp|server)\//i,
  /(^|\/)(index|main|server|app|cli|mod|lib)\.[a-z0-9]+$/i,
];

const UI_PATTERNS = [
  /(^|\/)(components?|views?|screens?|ui|widgets?|styles?|layouts?|public|site)\//i,
  /\.(tsx|jsx|vue|svelte|css|scss|less|html)$/i,
];

/**
 * Detect programming language from file path.
 * @param {string} filePath
 * @returns {string}
 */
export function detectLanguage(filePath) {
  const lower = (filePath || "").toLowerCase();
  if (/\.(tsx|ts|mts|cts)$/.test(lower)) return "typescript";
  if (/\.(jsx|js|mjs|cjs)$/.test(lower)) return "javascript";
  if (/\.(py|pyi)$/.test(lower)) return "python";
  if (/\.go$/.test(lower)) return "go";
  if (/\.rs$/.test(lower)) return "rust";
  if (/\.java$/.test(lower)) return "java";
  if (/\.(kt|kts)$/.test(lower)) return "kotlin";
  if (/\.cs$/.test(lower)) return "csharp";
  if (/\.(c|h|cpp|hpp|cc|cxx)$/.test(lower)) return "cpp";
  if (/\.rb$/.test(lower)) return "ruby";
  if (/\.php$/.test(lower)) return "php";
  if (/\.swift$/.test(lower)) return "swift";
  if (/\.(sql|prisma)$/.test(lower)) return "sql";
  if (/\.(sh|bash|zsh|ps1)$/.test(lower)) return "shell";
  if (/\.jsonc?$/.test(lower)) return "json";
  if (/\.(ya?ml)$/.test(lower)) return "yaml";
  if (/\.(md|mdx)$/.test(lower)) return "markdown";
  if (/\.(html|htm|vue|svelte)$/.test(lower)) return "html";
  if (/\.(css|scss|less)$/.test(lower)) return "css";
  return "other";
}

/**
 * Classify file into architectural review layer.
 * @param {string} filePath
 * @returns {"generated"|"docs"|"test"|"config"|"data"|"entrypoint"|"ui"|"core"}
 */
export function classifyLayer(filePath) {
  const p = (filePath || "").replace(/\\/g, "/");
  if (GENERATED_PATTERNS.some((re) => re.test(p))) return "generated";
  if (TEST_PATTERNS.some((re) => re.test(p))) return "test";
  if (DOC_PATTERNS.some((re) => re.test(p))) return "docs";
  if (DATA_PATTERNS.some((re) => re.test(p))) return "data";
  if (CONFIG_PATTERNS.some((re) => re.test(p))) return "config";
  if (UI_PATTERNS.some((re) => re.test(p))) return "ui";
  if (ENTRYPOINT_PATTERNS.some((re) => re.test(p))) return "entrypoint";
  return "core";
}

/**
 * Clean git diff `a/...` or `b/...` prefix and optional quotes.
 * @param {string} raw
 * @returns {string}
 */
function cleanDiffPath(raw) {
  let s = (raw || "").trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  s = s.replace(/\t.*$/, "");
  if (s === "/dev/null") return "/dev/null";
  if (s.startsWith("a/") || s.startsWith("b/")) return s.slice(2);
  return s;
}

/**
 * Compute character/token-aligned intraline change range between two strings.
 * Returns `[changeStart, changeEnd]` in each string so UIs can highlight exact edits.
 * @param {string} oldText
 * @param {string} newText
 */
export function computeIntralineChange(oldText, newText) {
  if (oldText === newText) {
    return { oldRange: null, newRange: null };
  }
  const minLen = Math.min(oldText.length, newText.length);
  let prefix = 0;
  while (prefix < minLen && oldText.charCodeAt(prefix) === newText.charCodeAt(prefix)) {
    prefix++;
  }
  let oldSuffix = oldText.length;
  let newSuffix = newText.length;
  while (
    oldSuffix > prefix &&
    newSuffix > prefix &&
    oldText.charCodeAt(oldSuffix - 1) === newText.charCodeAt(newSuffix - 1)
  ) {
    oldSuffix--;
    newSuffix--;
  }
  return {
    oldRange: [prefix, oldSuffix],
    newRange: [prefix, newSuffix],
  };
}

/**
 * Pair adjacent deletion & addition runs inside a hunk to attach intraline spans.
 * @param {Array<object>} lines
 */
function enrichIntralineHighlights(lines) {
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type !== "del") {
      i++;
      continue;
    }
    const delStart = i;
    while (i < lines.length && lines[i].type === "del") i++;
    const delEnd = i;
    const addStart = i;
    while (i < lines.length && lines[i].type === "add") i++;
    const addEnd = i;

    const delCount = delEnd - delStart;
    const addCount = addEnd - addStart;
    if (delCount > 0 && delCount === addCount && delCount <= 12) {
      for (let k = 0; k < delCount; k++) {
        const delLine = lines[delStart + k];
        const addLine = lines[addStart + k];
        const { oldRange, newRange } = computeIntralineChange(delLine.content, addLine.content);
        if (oldRange) delLine.intraline = oldRange;
        if (newRange) addLine.intraline = newRange;
      }
    }
  }
}

/**
 * Parse a Unified Diff string into structured file, hunk, and line records.
 * @param {string} rawDiff
 */
export function parseUnifiedDiff(rawDiff) {
  const normalized = (rawDiff || "").replace(/\r\n/g, "\n");
  const rawLines = normalized.split("\n");

  /** @type {Array<any>} */
  const files = [];
  let currentFile = null;
  let currentHunk = null;
  let oldLineNo = 0;
  let newLineNo = 0;

  const finalizeFile = () => {
    if (!currentFile) return;
    for (const h of currentFile.hunks) {
      enrichIntralineHighlights(h.lines);
    }
    const finalPath =
      currentFile.newPath && currentFile.newPath !== "/dev/null"
        ? currentFile.newPath
        : currentFile.oldPath || "unknown";
    currentFile.path = finalPath;
    if (!currentFile.status) {
      if (currentFile.isBinary) currentFile.status = "binary";
      else if (currentFile.oldPath === "/dev/null") currentFile.status = "added";
      else if (currentFile.newPath === "/dev/null") currentFile.status = "deleted";
      else if (
        currentFile.oldPath &&
        currentFile.newPath &&
        currentFile.oldPath !== currentFile.newPath
      ) {
        currentFile.status = "renamed";
      } else {
        currentFile.status = "modified";
      }
    }
    currentFile.language = detectLanguage(finalPath);
    currentFile.layer = classifyLayer(finalPath);
    currentFile.isGenerated = currentFile.layer === "generated";
    files.push(currentFile);
    currentFile = null;
    currentHunk = null;
  };

  const makeEmptyFile = (oldPath = "", newPath = "") => ({
    path: newPath || oldPath,
    oldPath,
    newPath,
    status: "",
    isBinary: false,
    similarity: null,
    language: "other",
    layer: "core",
    isGenerated: false,
    additions: 0,
    deletions: 0,
    hunks: [],
  });

  for (let idx = 0; idx < rawLines.length; idx++) {
    const line = rawLines[idx];

    if (line.startsWith("diff --git ")) {
      finalizeFile();
      const m = /^diff --git\s+("?a\/.*?"?)\s+("?b\/.*?"?)$/.exec(line);
      const oldP = m ? cleanDiffPath(m[1]) : "";
      const newP = m ? cleanDiffPath(m[2]) : "";
      currentFile = makeEmptyFile(oldP, newP);
      continue;
    }

    // Support raw unified patches without `diff --git`
    if (!currentFile && line.startsWith("--- ") && idx + 1 < rawLines.length && rawLines[idx + 1].startsWith("+++ ")) {
      const oldP = cleanDiffPath(line.slice(4));
      const newP = cleanDiffPath(rawLines[idx + 1].slice(4));
      currentFile = makeEmptyFile(oldP, newP);
      idx++;
      continue;
    }

    if (!currentFile) continue;

    if (!currentHunk || (line.startsWith("--- ") && idx + 1 < rawLines.length && rawLines[idx + 1].startsWith("+++ "))) {
      if (line.startsWith("new file mode ")) {
        currentFile.status = "added";
        continue;
      }
      if (line.startsWith("deleted file mode ")) {
        currentFile.status = "deleted";
        continue;
      }
      if (line.startsWith("similarity index ")) {
        const sim = parseInt(line.slice("similarity index ".length), 10);
        if (!Number.isNaN(sim)) currentFile.similarity = sim;
        continue;
      }
      if (line.startsWith("rename from ")) {
        currentFile.oldPath = cleanDiffPath(line.slice("rename from ".length));
        currentFile.status = "renamed";
        continue;
      }
      if (line.startsWith("rename to ")) {
        currentFile.newPath = cleanDiffPath(line.slice("rename to ".length));
        currentFile.status = "renamed";
        continue;
      }
      if (line.startsWith("Binary files ") || line.startsWith("GIT binary patch")) {
        currentFile.isBinary = true;
        currentFile.status = currentFile.status || "binary";
        continue;
      }
      if (line.startsWith("--- ")) {
        currentFile.oldPath = cleanDiffPath(line.slice(4));
        continue;
      }
      if (line.startsWith("+++ ")) {
        currentFile.newPath = cleanDiffPath(line.slice(4));
        continue;
      }
    }

    if (line.startsWith("@@ ")) {
      const m = /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@(.*)$/.exec(line);
      if (m) {
        oldLineNo = parseInt(m[1], 10);
        const oldCount = m[2] !== undefined ? parseInt(m[2], 10) : 1;
        newLineNo = parseInt(m[3], 10);
        const newCount = m[4] !== undefined ? parseInt(m[4], 10) : 1;
        const heading = (m[5] || "").trim();
        currentHunk = {
          header: line,
          heading,
          oldStart: oldLineNo,
          oldLines: oldCount,
          newStart: newLineNo,
          newLines: newCount,
          lines: [],
        };
        currentFile.hunks.push(currentHunk);
        continue;
      }
    }

    if (!currentHunk) continue;

    if (line.startsWith("+")) {
      currentHunk.lines.push({
        type: "add",
        oldNumber: null,
        newNumber: newLineNo++,
        content: line.slice(1),
      });
      currentFile.additions++;
    } else if (line.startsWith("-")) {
      currentHunk.lines.push({
        type: "del",
        oldNumber: oldLineNo++,
        newNumber: null,
        content: line.slice(1),
      });
      currentFile.deletions++;
    } else if (line.startsWith(" ")) {
      currentHunk.lines.push({
        type: "context",
        oldNumber: oldLineNo++,
        newNumber: newLineNo++,
        content: line.slice(1),
      });
    } else if (line.startsWith("\\ No newline at end of file")) {
      // Ignore marker
    } else if (line === "" && idx === rawLines.length - 1) {
      // Trailing newline at EOF
    }
  }

  finalizeFile();

  const totalAdditions = files.reduce((acc, f) => acc + f.additions, 0);
  const totalDeletions = files.reduce((acc, f) => acc + f.deletions, 0);

  return {
    files,
    stats: {
      totalFiles: files.length,
      totalAdditions,
      totalDeletions,
      totalChangedLines: totalAdditions + totalDeletions,
      generatedFiles: files.filter((f) => f.isGenerated).length,
    },
  };
}
