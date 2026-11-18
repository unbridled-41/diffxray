export {
  parseUnifiedDiff,
  detectLanguage,
  classifyLayer,
  computeIntralineChange,
} from "./diff-parser.mjs";

export {
  detectMovedBlocks,
  normalizeCodeLine,
} from "./move-detector.mjs";

export {
  analyzeDiffSymbols,
  extractSymbolFromLine,
  extractImportsFromContent,
  parseParamSignature,
} from "./symbol-graph.mjs";

export {
  buildBlastRadius,
  resolveModulePath,
} from "./blast-radius.mjs";
