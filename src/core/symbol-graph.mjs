/**
 * @fileoverview Multi-Language Structural Symbol, Signature & Import Extractor.
 * Supports TypeScript/JavaScript (ESM/CJS/JSX/TSX), Python, Go, Rust, Java/Kotlin/C#, Ruby, and SQL.
 */

const KEYWORDS = new Set([
  "if", "else", "for", "while", "switch", "case", "catch", "try", "finally",
  "return", "throw", "new", "typeof", "instanceof", "delete", "void", "await",
  "import", "export", "from", "require", "super", "this", "function", "class",
  "def", "fn", "func", "match", "loop", "where", "select", "insert", "update",
]);

/**
 * Count required vs optional parameters from a raw parameter list string.
 * @param {string} rawParams
 * @param {string} language
 */
export function parseParamSignature(rawParams, language = "javascript") {
  const cleaned = (rawParams || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
  if (!cleaned) {
    return { raw: "", totalParams: 0, requiredParams: 0, names: [] };
  }

  // Split top-level commas ignoring nested generics/tuples/objects
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === "(" || ch === "[" || ch === "{" || ch === "<") depth++;
    else if (ch === ")" || ch === "]" || ch === "}" || ch === ">") depth = Math.max(0, depth - 1);
    else if (ch === "," && depth === 0) {
      parts.push(cleaned.slice(start, i).trim());
      start = i + 1;
    }
  }
  const tail = cleaned.slice(start).trim();
  if (tail) parts.push(tail);

  // Filter Python `self`/`cls` and Rust `&self`/`&mut self`
  const filtered = parts.filter((p) => {
    if (!p) return false;
    if (language === "python" && (p === "self" || p === "cls" || p === "*")) return false;
    if (language === "rust" && /^&?(mut\s+)?self$/.test(p)) return false;
    if (p === "this" || p.startsWith("this:")) return false;
    return true;
  });

  let requiredParams = 0;
  const names = [];
  for (const p of filtered) {
    const isOptional =
      p.includes("=") ||
      p.includes("?") ||
      p.startsWith("...") ||
      p.startsWith("*") ||
      /\bOption</.test(p);
    if (!isOptional) requiredParams++;
    const nameMatch = /^([A-Za-z_$][\w$]*)/.exec(p.replace(/^(\.\.\.|\*\*?|(?:pub|mut|readonly|private|public|protected)\s+)/, ""));
    names.push(nameMatch ? nameMatch[1] : p.slice(0, 24));
  }

  return {
    raw: cleaned,
    totalParams: filtered.length,
    requiredParams,
    names,
  };
}

/**
 * Extract symbol declaration from a single source line if present.
 * @param {string} line
 * @param {string} language
 */
export function extractSymbolFromLine(line, language) {
  const trimmed = (line || "").trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) {
    return null;
  }

  if (language === "typescript" || language === "javascript") {
    // 1. Function declaration: [export] [default] [async] function Name(...)
    let m = /^(export\s+)?(default\s+)?(async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*\(([^)]*)\)/.exec(trimmed);
    if (m && !KEYWORDS.has(m[4])) {
      return {
        name: m[4],
        kind: "function",
        exported: Boolean(m[1]),
        isAsync: Boolean(m[3]),
        signature: parseParamSignature(m[5], language),
      };
    }
    // 2. Arrow / const function: [export] const/let Name = [async] (...) =>
    m = /^(export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(async\s+)?(?:<[^>]*>\s*)?\(([^)]*)\)\s*(?::[^=]+)?=>/.exec(trimmed);
    if (m && !KEYWORDS.has(m[2])) {
      return {
        name: m[2],
        kind: "function",
        exported: Boolean(m[1]),
        isAsync: Boolean(m[3]),
        signature: parseParamSignature(m[4], language),
      };
    }
    // 3. Class / Interface / Type
    m = /^(export\s+)?(default\s+)?(?:abstract\s+)?(class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/.exec(trimmed);
    if (m) {
      return {
        name: m[4],
        kind: m[3],
        exported: Boolean(m[1]),
        isAsync: false,
        signature: { raw: "", totalParams: 0, requiredParams: 0, names: [] },
      };
    }
    // 4. Class method (excluding control-flow keywords)
    m = /^(?:(?:public|private|protected|static|readonly|override|async)\s+)*([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*\(([^)]*)\)\s*(?::\s*[^{;]+)?\{/.exec(trimmed);
    if (m && !KEYWORDS.has(m[1]) && m[1] !== "constructor") {
      return {
        name: m[1],
        kind: "method",
        exported: true,
        isAsync: /\basync\b/.test(trimmed),
        signature: parseParamSignature(m[2], language),
      };
    }
  } else if (language === "python") {
    let m = /^(async\s+)?def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/.exec(trimmed);
    if (m) {
      return {
        name: m[2],
        kind: "function",
        exported: !m[2].startsWith("_"),
        isAsync: Boolean(m[1]),
        signature: parseParamSignature(m[3], "python"),
      };
    }
    m = /^class\s+([A-Za-z_]\w*)/.exec(trimmed);
    if (m) {
      return {
        name: m[1],
        kind: "class",
        exported: !m[1].startsWith("_"),
        isAsync: false,
        signature: { raw: "", totalParams: 0, requiredParams: 0, names: [] },
      };
    }
  } else if (language === "go") {
    let m = /^func\s+(?:\([^)]+\)\s*)?([A-Za-z_]\w*)\s*\(([^)]*)\)/.exec(trimmed);
    if (m) {
      const name = m[1];
      return {
        name,
        kind: "function",
        exported: /^[A-Z]/.test(name),
        isAsync: false,
        signature: parseParamSignature(m[2], "go"),
      };
    }
    m = /^type\s+([A-Za-z_]\w*)\s+(struct|interface)/.exec(trimmed);
    if (m) {
      return {
        name: m[1],
        kind: m[2],
        exported: /^[A-Z]/.test(m[1]),
        isAsync: false,
        signature: { raw: "", totalParams: 0, requiredParams: 0, names: [] },
      };
    }
  } else if (language === "rust") {
    let m = /^(pub(?:\([^)]+\))?\s+)?(async\s+)?fn\s+([A-Za-z_]\w*)\s*(?:<[^>]*>)?\s*\(([^)]*)\)/.exec(trimmed);
    if (m) {
      return {
        name: m[3],
        kind: "function",
        exported: Boolean(m[1]),
        isAsync: Boolean(m[2]),
        signature: parseParamSignature(m[4], "rust"),
      };
    }
    m = /^(pub(?:\([^)]+\))?\s+)?(struct|enum|trait)\s+([A-Za-z_]\w*)/.exec(trimmed);
    if (m) {
      return {
        name: m[3],
        kind: m[2],
        exported: Boolean(m[1]),
        isAsync: false,
        signature: { raw: "", totalParams: 0, requiredParams: 0, names: [] },
      };
    }
  } else if (language === "java" || language === "kotlin" || language === "csharp") {
    let m = /^(?:(?:public|protected|private|internal|static|final|override|suspend|async|virtual)\s+)+(?:[\w<>[\],.?]+\s+)?([A-Za-z_]\w*)\s*\(([^)]*)\)/.exec(trimmed);
    if (m && !KEYWORDS.has(m[1])) {
      return {
        name: m[1],
        kind: "method",
        exported: !/\bprivate\b/.test(trimmed),
        isAsync: /\b(async|suspend)\b/.test(trimmed),
        signature: parseParamSignature(m[2], language),
      };
    }
  } else if (language === "sql") {
    const m = /^(?:CREATE|ALTER)\s+(?:OR\s+REPLACE\s+)?(TABLE|VIEW|FUNCTION|INDEX)\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([A-Za-z_][\w.]*)["`]?/i.exec(trimmed);
    if (m) {
      return {
        name: m[2],
        kind: m[1].toLowerCase(),
        exported: true,
        isAsync: false,
        signature: { raw: "", totalParams: 0, requiredParams: 0, names: [] },
      };
    }
  }

  return null;
}

/**
 * Extract module import specifiers and imported symbol names from source text.
 * @param {string} content
 * @param {string} language
 */
export function extractImportsFromContent(content, language) {
  const imports = [];
  const text = content || "";

  if (language === "typescript" || language === "javascript") {
    // ESM static imports: import { a, b as c } from './foo' or import x from './foo'
    const esmRe = /import\s+(?:type\s+)?(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([^}]*)\}|\*\s+as\s+([A-Za-z_$][\w$]*))?\s*from\s*["']([^"']+)["']/g;
    let m;
    while ((m = esmRe.exec(text)) !== null) {
      const symbols = [];
      if (m[1]) symbols.push(m[1]);
      if (m[3]) symbols.push(m[3]);
      if (m[2]) {
        for (const part of m[2].split(",")) {
          const clean = part.replace(/\btype\s+/, "").trim().split(/\s+as\s+/)[0].trim();
          if (clean) symbols.push(clean);
        }
      }
      imports.push({ specifier: m[4], symbols });
    }
    // Re-exports: export { a } from './foo'
    const reExportRe = /export\s+(?:\*|\{([^}]*)\})\s+from\s*["']([^"']+)["']/g;
    while ((m = reExportRe.exec(text)) !== null) {
      const symbols = m[1]
        ? m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean)
        : [];
      imports.push({ specifier: m[2], symbols });
    }
    // CommonJS require('...')
    const cjsRe = /(?:const|let|var)\s+(?:\{([^}]*)\}|([A-Za-z_$][\w$]*))\s*=\s*require\(\s*["']([^"']+)["']\s*\)/g;
    while ((m = cjsRe.exec(text)) !== null) {
      const symbols = m[1]
        ? m[1].split(",").map((s) => s.trim().split(":")[0].trim()).filter(Boolean)
        : m[2]
        ? [m[2]]
        : [];
      imports.push({ specifier: m[3], symbols });
    }
  } else if (language === "python") {
    const fromRe = /^\s*from\s+([.\w]+)\s+import\s+([^\n#]+)/gm;
    let m;
    while ((m = fromRe.exec(text)) !== null) {
      const symbols = m[2]
        .replace(/[()]/g, "")
        .split(",")
        .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
        .filter(Boolean);
      imports.push({ specifier: m[1], symbols });
    }
    const impRe = /^\s*import\s+([A-Za-z_][\w.]*)/gm;
    while ((m = impRe.exec(text)) !== null) {
      imports.push({ specifier: m[1], symbols: [] });
    }
  } else if (language === "go") {
    const singleRe = /import\s+(?:[A-Za-z_]\w*\s+)?"([^"]+)"/g;
    let m;
    while ((m = singleRe.exec(text)) !== null) {
      imports.push({ specifier: m[1], symbols: [] });
    }
    const blockRe = /import\s*\(([\s\S]*?)\)/g;
    while ((m = blockRe.exec(text)) !== null) {
      const strRe = /"([^"]+)"/g;
      let sm;
      while ((sm = strRe.exec(m[1])) !== null) {
        imports.push({ specifier: sm[1], symbols: [] });
      }
    }
  } else if (language === "rust") {
    const useRe = /^\s*(?:pub\s+)?use\s+([^;]+);/gm;
    let m;
    while ((m = useRe.exec(text)) !== null) {
      imports.push({ specifier: m[1].trim(), symbols: [] });
    }
  }

  return imports;
}

/**
 * Analyze symbols added, modified, deleted, or signature-changed across all files in a parsed diff.
 * @param {{ files: Array<any> }} parsedDiff
 */
export function analyzeDiffSymbols(parsedDiff) {
  const fileSummaries = new Map();
  const allModifiedSymbols = [];

  for (const file of parsedDiff.files) {
    if (file.isGenerated || file.isBinary) continue;

    const deletedDefs = new Map();
    const addedDefs = new Map();
    const touchedContextSymbols = new Set();
    const visibleLinesContent = [];

    for (const hunk of file.hunks) {
      // Check git `@@ ... @@ function context` heading!
      if (hunk.heading) {
        const headingSym = extractSymbolFromLine(hunk.heading, file.language);
        if (headingSym) {
          touchedContextSymbols.add(headingSym.name);
        } else {
          const fallbackFn = /([A-Za-z_$][\w$]*)\s*\(/.exec(hunk.heading);
          if (fallbackFn && !KEYWORDS.has(fallbackFn[1])) {
            touchedContextSymbols.add(fallbackFn[1]);
          }
        }
      }

      for (const line of hunk.lines) {
        if (line.type !== "del") visibleLinesContent.push(line.content);
        if (line.type === "context") continue;
        // Ignore pure moves when flagging breaking logic/signature changes
        const sym = extractSymbolFromLine(line.content, file.language);
        if (!sym) continue;
        if (line.type === "del") {
          deletedDefs.set(sym.name, { ...sym, lineNumber: line.oldNumber, moved: Boolean(line.moveId) });
        } else if (line.type === "add") {
          addedDefs.set(sym.name, { ...sym, lineNumber: line.newNumber, moved: Boolean(line.moveId) });
        }
      }
    }

    const symbols = [];

    for (const [name, addSym] of addedDefs) {
      const delSym = deletedDefs.get(name);
      if (delSym) {
        const sigChanged =
          delSym.signature.requiredParams !== addSym.signature.requiredParams ||
          delSym.signature.totalParams !== addSym.signature.totalParams ||
          delSym.isAsync !== addSym.isAsync;
        const breakingReason =
          addSym.signature.requiredParams > delSym.signature.requiredParams
            ? `Required params increased (${delSym.signature.requiredParams} → ${addSym.signature.requiredParams})`
            : delSym.signature.totalParams > addSym.signature.totalParams
            ? `Param count shrunk (${delSym.signature.totalParams} → ${addSym.signature.totalParams})`
            : delSym.isAsync !== addSym.isAsync
            ? `Async contract flipped (${delSym.isAsync ? "async → sync" : "sync → async"})`
            : null;

        const entry = {
          name,
          kind: addSym.kind,
          filePath: file.path,
          changeType: sigChanged ? "signature-changed" : "modified",
          exported: addSym.exported || delSym.exported,
          lineNumber: addSym.lineNumber,
          oldSignature: delSym.signature,
          newSignature: addSym.signature,
          breakingReason,
        };
        symbols.push(entry);
        allModifiedSymbols.push(entry);
        deletedDefs.delete(name);
      } else if (!addSym.moved) {
        const entry = {
          name,
          kind: addSym.kind,
          filePath: file.path,
          changeType: "added",
          exported: addSym.exported,
          lineNumber: addSym.lineNumber,
          oldSignature: null,
          newSignature: addSym.signature,
          breakingReason: null,
        };
        symbols.push(entry);
        allModifiedSymbols.push(entry);
      }
    }

    for (const [name, delSym] of deletedDefs) {
      if (delSym.moved) continue;
      const entry = {
        name,
        kind: delSym.kind,
        filePath: file.path,
        changeType: "deleted",
        exported: delSym.exported,
        lineNumber: delSym.lineNumber,
        oldSignature: delSym.signature,
        newSignature: null,
        breakingReason: delSym.exported ? `Exported ${delSym.kind} '${name}' was removed` : null,
      };
      symbols.push(entry);
      allModifiedSymbols.push(entry);
    }

    // Include functions whose body was modified (from @@ hunk context header)
    for (const ctxName of touchedContextSymbols) {
      if (!symbols.some((s) => s.name === ctxName)) {
        const entry = {
          name: ctxName,
          kind: "function",
          filePath: file.path,
          changeType: "body-modified",
          exported: true,
          lineNumber: file.hunks[0]?.newStart || 1,
          oldSignature: null,
          newSignature: null,
          breakingReason: null,
        };
        symbols.push(entry);
        allModifiedSymbols.push(entry);
      }
    }

    const imports = extractImportsFromContent(visibleLinesContent.join("\n"), file.language);
    file.symbols = symbols;
    file.imports = imports;
    fileSummaries.set(file.path, { symbols, imports });
  }

  return {
    fileSummaries,
    modifiedSymbols: allModifiedSymbols,
    signatureChanges: allModifiedSymbols.filter(
      (s) => s.changeType === "signature-changed" || (s.changeType === "deleted" && s.exported)
    ),
  };
}
