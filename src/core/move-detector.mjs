/**
 * @fileoverview Cross-File & Intra-File Code Move Detector.
 * Splits large added/deleted runs along top-level declaration/blank-line boundaries and uses
 * multiset Jaccard + windowed containment matching so functions extracted into brand-new files
 * (alongside new imports/helpers) are accurately paired with in-flight delta tracking.
 */

const TRIVIAL_LINE_RE = /^[\s{}()[\];,]*$/;
const TOP_LEVEL_BOUNDARY_RE =
  /^(?:export\s+(?:default\s+)?)?(?:async\s+)?(?:function\b|class\b|interface\b|type\b|def\b|pub\s+(?:async\s+)?fn\b|fn\b|func\b)/;

/**
 * Normalize a source code line so indentation, quote style, or trailing semicolons
 * don't mask moved functions/blocks.
 * @param {string} line
 * @returns {string}
 */
export function normalizeCodeLine(line) {
  return (line || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/['"`]/g, "'")
    .replace(/;$/, "");
}

/**
 * Check if a normalized line carries meaningful code signal.
 * @param {string} norm
 */
function isMeaningfulLine(norm) {
  if (!norm || norm.length < 3) return false;
  if (TRIVIAL_LINE_RE.test(norm)) return false;
  if (/^(\/\/|#|\/\*|\*)/.test(norm) && norm.length < 12) return false;
  return true;
}

/**
 * Split a contiguous run of `add` or `del` lines into logical sub-blocks at top-level
 * symbol boundaries when preceded by a blank line or closing brace.
 * @param {Array<any>} runLines
 */
function splitIntoLogicalChunks(runLines) {
  if (runLines.length <= 10) return [runLines];
  const chunks = [];
  let current = [];

  for (let i = 0; i < runLines.length; i++) {
    const raw = runLines[i].content;
    const trimmed = raw.trim();
    const prevTrimmed = i > 0 ? runLines[i - 1].content.trim() : "";

    if (
      current.length >= 4 &&
      TOP_LEVEL_BOUNDARY_RE.test(trimmed) &&
      (prevTrimmed === "" || prevTrimmed === "}" || prevTrimmed === "};")
    ) {
      chunks.push(current);
      current = [runLines[i]];
    } else if (
      current.length >= 1 &&
      trimmed === "" &&
      current.every((l) => /^(import\b|from\b|const\s+.*require\()/.test(l.content.trim()) || l.content.trim() === "")
    ) {
      // Separate leading import preamble in new files from body declarations
      chunks.push(current);
      current = [];
    } else {
      current.push(runLines[i]);
    }
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

/**
 * Build a candidate block record if it contains `>= minLines` meaningful lines.
 */
function makeBlock(filePath, hunkIndex, runType, lines, minLines) {
  // Trim leading/trailing blank lines from chunk
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].content.trim() === "") start++;
  while (end > start && lines[end - 1].content.trim() === "") end--;
  const slice = lines.slice(start, end);
  if (slice.length === 0) return null;

  const normalizedLines = slice.map((l) => normalizeCodeLine(l.content));
  const meaningful = normalizedLines.filter(isMeaningfulLine);
  if (meaningful.length < minLines) return null;

  const freq = new Map();
  for (const m of meaningful) {
    freq.set(m, (freq.get(m) || 0) + 1);
  }

  return {
    filePath,
    hunkIndex,
    type: runType,
    startLine: runType === "del" ? slice[0].oldNumber : slice[0].newNumber,
    endLine:
      runType === "del"
        ? slice[slice.length - 1].oldNumber
        : slice[slice.length - 1].newNumber,
    rawCount: slice.length,
    meaningfulCount: meaningful.length,
    lines: slice,
    normalizedLines,
    freq,
  };
}

/**
 * Extract contiguous deleted and added candidate blocks across all non-generated files.
 * @param {Array<any>} files
 * @param {number} minLines
 */
function extractCandidateBlocks(files, minLines = 4) {
  const deletedBlocks = [];
  const addedBlocks = [];

  for (const file of files) {
    if (file.isGenerated || file.isBinary) continue;

    for (let hIdx = 0; hIdx < file.hunks.length; hIdx++) {
      const hunk = file.hunks[hIdx];
      let runType = null;
      let runLines = [];

      const flushRun = () => {
        if (!runType || runLines.length === 0) return;
        const chunks = splitIntoLogicalChunks(runLines);
        for (const ch of chunks) {
          const block = makeBlock(file.path, hIdx, runType, ch, minLines);
          if (block) {
            if (runType === "del") deletedBlocks.push(block);
            else addedBlocks.push(block);
          }
        }
        runType = null;
        runLines = [];
      };

      for (const line of hunk.lines) {
        if (line.type === "del" || line.type === "add") {
          if (runType === line.type) {
            runLines.push(line);
          } else {
            flushRun();
            runType = line.type;
            runLines = [line];
          }
        } else {
          flushRun();
        }
      }
      flushRun();
    }
  }

  return { deletedBlocks, addedBlocks };
}

/**
 * Multiset Jaccard similarity between two frequency maps of normalized meaningful lines.
 * @param {Map<string, number>} freqA
 * @param {Map<string, number>} freqB
 */
function computeMultisetSimilarity(freqA, freqB) {
  let intersection = 0;
  let totalA = 0;
  let totalB = 0;
  for (const [, count] of freqA) totalA += count;
  for (const [, count] of freqB) totalB += count;
  if (totalA === 0 || totalB === 0) return 0;

  const ratio = Math.min(totalA, totalB) / Math.max(totalA, totalB);
  if (ratio < 0.45) return 0;

  for (const [key, countA] of freqA) {
    const countB = freqB.get(key) || 0;
    if (countB > 0) intersection += Math.min(countA, countB);
  }
  const union = totalA + totalB - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Detect moved code blocks across files (and across hunks within the same file),
 * annotating hunk lines and returning summary telemetry.
 *
 * @param {{ files: Array<any>, stats: any }} parsedDiff
 * @param {{ minLines?: number, minSimilarity?: number }} [options]
 */
export function detectMovedBlocks(parsedDiff, options = {}) {
  const minLines = options.minLines ?? 4;
  const minSimilarity = options.minSimilarity ?? 0.72;

  const { deletedBlocks, addedBlocks } = extractCandidateBlocks(parsedDiff.files, minLines);

  /** @type {Array<{ delIdx: number, addIdx: number, similarity: number }>} */
  const candidates = [];

  for (let d = 0; d < deletedBlocks.length; d++) {
    const delB = deletedBlocks[d];
    for (let a = 0; a < addedBlocks.length; a++) {
      const addB = addedBlocks[a];
      if (delB.filePath === addB.filePath && delB.hunkIndex === addB.hunkIndex) {
        continue;
      }
      const sim = computeMultisetSimilarity(delB.freq, addB.freq);
      if (sim >= minSimilarity) {
        candidates.push({ delIdx: d, addIdx: a, similarity: sim });
      }
    }
  }

  const matchedDel = new Set();
  const matchedAdd = new Set();
  candidates.sort((x, y) => y.similarity - x.similarity);

  const moves = [];
  let movedAdditions = 0;
  let movedDeletions = 0;
  let inFlightModifiedLines = 0;

  for (const cand of candidates) {
    if (matchedDel.has(cand.delIdx) || matchedAdd.has(cand.addIdx)) continue;
    matchedDel.add(cand.delIdx);
    matchedAdd.add(cand.addIdx);

    const delB = deletedBlocks[cand.delIdx];
    const addB = addedBlocks[cand.addIdx];
    const moveId = `move-${moves.length + 1}`;
    const isPureMove = cand.similarity >= 0.97;

    const remainingDelFreq = new Map(delB.freq);
    const modifiedNewLineNumbers = [];

    for (const line of delB.lines) {
      line.moveId = moveId;
      line.moveRole = "source";
      line.isPureMove = isPureMove;
    }

    for (let i = 0; i < addB.lines.length; i++) {
      const line = addB.lines[i];
      const norm = addB.normalizedLines[i];
      line.moveId = moveId;
      line.moveRole = "destination";
      if (!isMeaningfulLine(norm)) {
        line.isPureMove = true;
        continue;
      }
      const avail = remainingDelFreq.get(norm) || 0;
      if (avail > 0) {
        remainingDelFreq.set(norm, avail - 1);
        line.isPureMove = true;
      } else {
        line.isPureMove = false;
        line.modifiedInMove = true;
        if (line.newNumber !== null) modifiedNewLineNumbers.push(line.newNumber);
      }
    }

    movedDeletions += delB.rawCount;
    movedAdditions += addB.rawCount;
    inFlightModifiedLines += modifiedNewLineNumbers.length;

    moves.push({
      id: moveId,
      fromFile: delB.filePath,
      fromStart: delB.startLine,
      fromEnd: delB.endLine,
      toFile: addB.filePath,
      toStart: addB.startLine,
      toEnd: addB.endLine,
      lineCount: addB.rawCount,
      similarity: Math.round(cand.similarity * 100),
      isPureMove,
      modifiedInMoveCount: modifiedNewLineNumbers.length,
      modifiedNewLineNumbers,
    });
  }

  for (const f of parsedDiff.files) {
    if (f.status === "renamed" && f.hunks.length === 0 && f.oldPath !== f.newPath) {
      moves.push({
        id: `move-${moves.length + 1}`,
        fromFile: f.oldPath,
        fromStart: 1,
        fromEnd: 1,
        toFile: f.newPath,
        toStart: 1,
        toEnd: 1,
        lineCount: 0,
        similarity: f.similarity ?? 100,
        isPureMove: true,
        modifiedInMoveCount: 0,
        modifiedNewLineNumbers: [],
      });
    }
  }

  let generatedChangedLines = 0;
  for (const f of parsedDiff.files) {
    if (f.isGenerated) {
      generatedChangedLines += f.additions + f.deletions;
      f.effectiveChanges = 0;
      f.movedLineRatio = 0;
      continue;
    }
    let fileMovedLines = 0;
    const fileTotalChanged = f.additions + f.deletions;
    for (const h of f.hunks) {
      for (const l of h.lines) {
        if ((l.type === "add" || l.type === "del") && l.moveId && !l.modifiedInMove) {
          fileMovedLines++;
        }
      }
    }
    f.effectiveChanges = Math.max(0, fileTotalChanged - fileMovedLines);
    f.movedLineRatio =
      fileTotalChanged > 0 ? Math.round((fileMovedLines / fileTotalChanged) * 100) : 0;
  }

  const nonGenTotal = Math.max(
    0,
    parsedDiff.stats.totalChangedLines - generatedChangedLines
  );
  const effectiveLogicLines = parsedDiff.files.reduce(
    (sum, f) => sum + (f.effectiveChanges || 0),
    0
  );
  const noiseReductionPercent =
    parsedDiff.stats.totalChangedLines > 0
      ? Math.round(
          ((parsedDiff.stats.totalChangedLines - effectiveLogicLines) /
            parsedDiff.stats.totalChangedLines) *
            100
        )
      : 0;

  return {
    moves,
    stats: {
      movePairs: moves.length,
      movedAdditions,
      movedDeletions,
      inFlightModifiedLines,
      generatedChangedLines,
      nonGeneratedLines: nonGenTotal,
      effectiveLogicLines,
      noiseReductionPercent,
    },
  };
}
