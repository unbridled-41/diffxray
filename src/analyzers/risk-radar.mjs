/**
 * @fileoverview "Quietly Wrong" AI-Diff & Regression Risk Radar.
 * 12 deterministic, low-noise detectors catching silent failure modes in AI-generated
 * and high-velocity pull requests, plus Trust Score calculation.
 * Pure ESM (zero node:* imports) — runs identically in CLI, MCP, GitHub Actions, and Browser.
 */

const SECRET_PATTERNS = [
  { name: "AWS Access Key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "GitHub Personal/App Token", re: /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/ },
  { name: "API Secret Key (OpenAI/Anthropic/Stripe)", re: /\bsk-(?:live-|proj-|ant-api\d*-)?[A-Za-z0-9_-]{24,}\b/ },
  { name: "Slack Token", re: /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/ },
  { name: "Private Cryptographic Key", re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { name: "Hardcoded Database URI Password", re: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s/'"]+:[^@\s/'"]{6,}@(?!(?:localhost|127\.0\.0\.1|example\.com))/i },
];

const SECRET_PLACEHOLDER_RE = /(?:EXAMPLE|YOUR_|PLACEHOLDER|DUMMY|FAKE|TEST_KEY|xxxx|000000)/i;

const AUTH_GUARD_RE =
  /\b(?:requireAuth|verifyToken|verifyJwt|authenticate|isAuthenticated|ensureLoggedIn|checkPermission|requireRole|authorize|validateSession|csrfProtection)\b|@(?:login_required|UseGuards|PreAuthorize|RolesAllowed)\b/;

const INJECTION_PATTERNS = [
  {
    name: "Interpolated SQL query",
    re: /`\s*(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|DROP\s+TABLE)\b[^`]*\$\{|\bf"\s*(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|DROP\s+TABLE)\b[^"\n]*\{[A-Za-z_]|\bf'\s*(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|DROP\s+TABLE)\b[^'\n]*\{[A-Za-z_]/i,
  },
  {
    name: "Dynamic code evaluation (eval / new Function)",
    re: /\b(?:eval\s*\(|new\s+Function\s*\()/,
  },
  {
    name: "Shell command execution with shell:true or template interpolation",
    re: /\b(?:exec|execSync)\s*\(\s*`[^`]*\$\{|\bspawn(?:Sync)?\s*\([^)]*shell\s*:\s*true/,
  },
  {
    name: "Unescaped HTML sink (dangerouslySetInnerHTML)",
    re: /\bdangerouslySetInnerHTML\s*=\s*\{\s*\{/,
  },
];

const SEVERITY_WEIGHT = {
  critical: 28,
  high: 14,
  medium: 6,
  low: 2,
};

const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Run all 12 deterministic silent-hazard detectors over a parsed diff, move report,
 * symbol report, and blast-radius graph.
 *
 * @param {{ files: Array<any>, stats: any }} parsedDiff
 * @param {{ moves: Array<any>, stats: any }} moveReport
 * @param {{ modifiedSymbols: Array<any>, signatureChanges: Array<any> }} symbolReport
 * @param {{ untouchedCallers: Array<any>, stats: any }} blastRadius
 */
export function analyzeRisks(parsedDiff, moveReport, symbolReport, blastRadius, policy = {}) {
  const ignoredRuleSet = new Set(policy.ignoreRules || []);
  const ignoredPathPrefixes = (policy.ignorePaths || []).map((p) => p.replace(/\\/g, "/"));
  /** @type {Array<any>} */
  const findings = [];
  let seq = 1;

  const pushFinding = (f) => {
    if (ignoredRuleSet.has(f.ruleId)) return;
    const normPath = (f.filePath || "").replace(/\\/g, "/");
    if (ignoredPathPrefixes.some((pref) => normPath === pref || normPath.startsWith(pref) || normPath.includes(pref))) {
      return;
    }
    findings.push({
      id: `DXR-${String(seq++).padStart(3, "0")}`,
      ...f,
    });
  };

  // Index known async symbols in this diff
  const knownAsyncSymbols = new Set(
    symbolReport.modifiedSymbols
      .filter((s) => s.newSignature && s.changeType !== "deleted" && /\basync\b/.test(String(s.isAsync ? "async" : "")))
      .map((s) => s.name)
  );

  let coreEffectiveLines = 0;
  let testFilesTouched = 0;
  let schemaFilesModified = [];
  let hasMigrationFile = false;
  let manifestDepsModified = [];
  let hasLockfileUpdate = false;

  for (const file of parsedDiff.files) {
    if (file.layer === "test") testFilesTouched++;
    if (file.isGenerated) {
      if (/(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|Cargo\.lock|poetry\.lock|uv\.lock|go\.sum)$/i.test(file.path)) {
        hasLockfileUpdate = true;
      }
      continue;
    }
    if (file.isBinary) continue;

    if (file.layer === "core" || file.layer === "entrypoint" || file.layer === "data") {
      coreEffectiveLines += file.effectiveChanges ?? (file.additions + file.deletions);
    }

    if (/(^|\/)migrations?\//i.test(file.path) || /\.migration\./i.test(file.path)) {
      hasMigrationFile = true;
    } else if (/\.(prisma|sql)$/i.test(file.path) || /(^|\/)(schema|entities|models)\.[a-z]+$/i.test(file.path)) {
      if (file.additions + file.deletions > 0) schemaFilesModified.push(file);
    }

    const isTest = file.layer === "test";
    const isDocs = file.layer === "docs" || /\.svg$/i.test(file.path);
    if (isDocs) continue;

    // Check manifest dependency changes
    if (/(^|\/)(package\.json|Cargo\.toml|pyproject\.toml)$/i.test(file.path)) {
      const touchesDeps = file.hunks.some((h) =>
        h.lines.some(
          (l) =>
            (l.type === "add" || l.type === "del") &&
            /("dependencies"|"devDependencies"|\[dependencies\]|^dependencies\s*=)/.test(h.header + "\n" + l.content)
        ) ||
        h.heading.includes("dependencies")
      );
      if (touchesDeps) manifestDepsModified.push(file);
    }

    for (const hunk of file.hunks) {
      const hLines = hunk.lines;

      // Track hunk-level test weakening & auth guard removal
      let deletedAssertions = 0;
      let addedAssertions = 0;
      let deletedAuthGuards = [];
      let addedAuthGuard = false;

      for (let i = 0; i < hLines.length; i++) {
        const l = hLines[i];
        const raw = l.content;
        const trimmed = raw.trim();

        // Skip pure moved lines (unless modified in flight!) to avoid false positives on code motion
        const isUnchangedMove = Boolean(l.moveId && !l.modifiedInMove);

        if (l.type === "del" && !isUnchangedMove) {
          if (isTest && /\b(?:expect\s*\(|assert(?:\.\w+)?\s*\(|assert_\w+!?\s*\()/.test(trimmed)) {
            deletedAssertions++;
          }
          if (!isTest && AUTH_GUARD_RE.test(trimmed) && !trimmed.startsWith("//") && !trimmed.startsWith("#")) {
            deletedAuthGuards.push({ lineNumber: l.oldNumber || hunk.oldStart, snippet: trimmed });
          }

          // Check dropped `await`: `- ... await foo(...)` followed nearby by `+ ... foo(...)` without await
          const awaitMatch = /\bawait\s+([A-Za-z_$][\w$]*)\s*\(/.exec(trimmed);
          if (awaitMatch && !isTest) {
            const fnName = awaitMatch[1];
            for (let j = i + 1; j < hLines.length; j++) {
              if (hLines[j].type === "add") {
                const addTrim = hLines[j].content.trim();
                const callRe = new RegExp(`\\b${fnName}\\s*\\(`);
                if (
                  callRe.test(addTrim) &&
                  !/\bawait\b/.test(addTrim) &&
                  !/\breturn\b/.test(addTrim) &&
                  !/\.then\s*\(/.test(addTrim) &&
                  !/Promise\.all/.test(addTrim)
                ) {
                  pushFinding({
                    ruleId: "unawaited-async",
                    severity: "high",
                    category: "correctness",
                    title: `Dropped 'await' on async call '${fnName}()'`,
                    filePath: file.path,
                    lineNumber: hLines[j].newNumber || hunk.newStart,
                    snippet: addTrim.slice(0, 140),
                    whyItMatters:
                      "Removing `await` turns a synchronous error/completion guarantee into a fire-and-forget race condition or unhandled rejection.",
                    agentFixPrompt: `Inspect ${file.path}:${hLines[j].newNumber || hunk.newStart} — 'await' was removed before '${fnName}()'. Restore 'await' or explicitly handle the returned Promise.`,
                  });
                  break;
                }
              }
            }
          }
        }

        if (l.type === "add") {
          if (isTest && /\b(?:expect\s*\(|assert(?:\.\w+)?\s*\(|assert_\w+!?\s*\()/.test(trimmed)) {
            addedAssertions++;
          }
          if (!isTest && AUTH_GUARD_RE.test(trimmed) && !trimmed.startsWith("//") && !trimmed.startsWith("#")) {
            addedAuthGuard = true;
          }

          if (isUnchangedMove) continue;

          const lineNo = l.newNumber || hunk.newStart;

          // 1. Secret / Credential Leak
          if (!isTest && !SECRET_PLACEHOLDER_RE.test(trimmed)) {
            for (const sp of SECRET_PATTERNS) {
              if (sp.re.test(raw)) {
                pushFinding({
                  ruleId: "secret-leak",
                  severity: "critical",
                  category: "security",
                  title: `Potential hardcoded ${sp.name}`,
                  filePath: file.path,
                  lineNumber: lineNo,
                  snippet: trimmed.replace(/([A-Za-z0-9_-]{6})[A-Za-z0-9_-]{12,}/g, "$1••••••••"),
                  whyItMatters:
                    "Hardcoded credentials committed to Git history remain recoverable even if deleted in a later commit.",
                  agentFixPrompt: `Remove the hardcoded credential in ${file.path}:${lineNo}, load it from environment variables, and rotate the exposed secret.`,
                });
                break;
              }
            }
          }

          // 2. Injection Risk
          if (!isTest && !trimmed.startsWith("//") && !trimmed.startsWith("#")) {
            for (const ip of INJECTION_PATTERNS) {
              if (ip.re.test(raw)) {
                pushFinding({
                  ruleId: "injection-risk",
                  severity: "critical",
                  category: "security",
                  title: ip.name,
                  filePath: file.path,
                  lineNumber: lineNo,
                  snippet: trimmed.slice(0, 140),
                  whyItMatters:
                    "Dynamic string interpolation in SQL, shell execution, or raw HTML sinks enables injection and RCE vulnerabilities.",
                  agentFixPrompt: `Replace dynamic interpolation in ${file.path}:${lineNo} with parameterized queries, argument arrays (execFile), or escaped DOM rendering.`,
                });
                break;
              }
            }
          }

          // 3. Test Skip / Bypass (`it.skip`, `describe.only`, `@pytest.mark.skip`, `#[ignore]`)
          // Ignore embedded unified-diff fixture lines starting with `+`/`-` inside test strings.
          if (
            isTest &&
            !/^[+-]/.test(trimmed) &&
            (/\b(?:it|test|describe)\.(?:skip|only)\s*\(/.test(trimmed) ||
              /^(?:xit|xtest|xdescribe)\s*\(/.test(trimmed) ||
              /@pytest\.mark\.skip\b/.test(trimmed) ||
              /^#\[ignore\b/.test(trimmed))
          ) {
            pushFinding({
              ruleId: "weakened-test",
              severity: "high",
              category: "testing",
              title: "Test suite skipped or narrowed (.skip / .only)",
              filePath: file.path,
              lineNumber: lineNo,
              snippet: trimmed.slice(0, 140),
              whyItMatters:
                "Coding agents frequently pass CI by skipping failing tests or leaving `.only`, masking real regressions.",
              agentFixPrompt: `Remove .skip/.only in ${file.path}:${lineNo} and fix the underlying behavior so the full test suite passes.`,
            });
          }

          // 4. Silent / Empty Catch Block
          if (!isTest) {
            // Single-line `catch (e) {}` or `catch {}`
            const inlineEmptyCatch = /\bcatch\s*(?:\([^)]*\))?\s*\{\s*(?:\/\/.*|\/\*[\s\S]*?\*\/)?\s*\}/.test(trimmed);
            // Multi-line `catch (...) {` followed immediately by comments/whitespace and `}`
            let multiLineEmptyCatch = false;
            if (!inlineEmptyCatch && /\bcatch\s*(?:\([^)]*\))?\s*\{\s*$/.test(trimmed)) {
              let k = i + 1;
              while (
                k < hLines.length &&
                hLines[k].type !== "del" &&
                (hLines[k].content.trim() === "" ||
                  hLines[k].content.trim().startsWith("//") ||
                  hLines[k].content.trim().startsWith("/*") ||
                  hLines[k].content.trim().startsWith("*"))
              ) {
                k++;
              }
              if (k < hLines.length && hLines[k].type !== "del" && hLines[k].content.trim() === "}") {
                multiLineEmptyCatch = true;
              }
            }
            // Python `except ...: pass`
            const pySilentExcept =
              /^except(?:\s+\w+(?:\s+as\s+\w+)?)?\s*:\s*pass\b/.test(trimmed) ||
              (/^except\b.*:\s*$/.test(trimmed) &&
                i + 1 < hLines.length &&
                hLines[i + 1].type === "add" &&
                hLines[i + 1].content.trim() === "pass");

            if (inlineEmptyCatch || multiLineEmptyCatch || pySilentExcept) {
              pushFinding({
                ruleId: "silent-catch",
                severity: "high",
                category: "correctness",
                title: "Silent catch block swallows errors without recovery or propagation",
                filePath: file.path,
                lineNumber: lineNo,
                snippet: trimmed.slice(0, 140),
                whyItMatters:
                  "Swallowing exceptions turns loud crashes into silent data corruption or misleading 'Quietly Wrong' green exits.",
                agentFixPrompt: `Review the empty catch handler at ${file.path}:${lineNo}. Either propagate a typed error, handle the specific expected error code, or log structured context.`,
              });
            }
          }

          // 5. Type-Safety & Linter Suppression Erosion
          if (
            !isTest &&
            (/:\s*any\b|\bas\s+any\b|<any>/.test(trimmed) ||
              /@ts-(?:ignore|nocheck)\b/.test(trimmed) ||
              /@ts-expect-error\s*$/.test(trimmed) ||
              /#\s*type:\s*ignore\b/.test(trimmed) ||
              /\bunsafe\s*\{/.test(trimmed))
          ) {
            pushFinding({
              ruleId: "type-erosion",
              severity: "medium",
              category: "correctness",
              title: "Type-safety escape hatch introduced (any / @ts-ignore / unsafe)",
              filePath: file.path,
              lineNumber: lineNo,
              snippet: trimmed.slice(0, 140),
              whyItMatters:
                "Suppressing compiler checks hides type mismatches across module boundaries instead of fixing the contract.",
              agentFixPrompt: `Replace the type suppression in ${file.path}:${lineNo} with an explicit interface, type guard, or narrowed generic.`,
            });
          }

          // 6. Leftover Debug Statements (skip CLI/TUI files where console output is intentional)
          const isCliSurface = /(^|\/)(bin|cli|scripts|tui)\b/i.test(file.path);
          if (
            !isTest &&
            !isCliSurface &&
            (/\bdebugger\s*;?$/.test(trimmed) ||
              /\bconsole\.(?:log|debug|trace)\s*\(/.test(trimmed) ||
              /\b(?:pdb\.set_trace|breakpoint)\s*\(\s*\)/.test(trimmed) ||
              /\bdbg!\s*\(/.test(trimmed))
          ) {
            pushFinding({
              ruleId: "debug-leftover",
              severity: "low",
              category: "hygiene",
              title: "Debug statement or console dump left in production module",
              filePath: file.path,
              lineNumber: lineNo,
              snippet: trimmed.slice(0, 140),
              whyItMatters:
                "Leftover debuggers pause execution or leak internal state and PII into production stdout.",
              agentFixPrompt: `Remove the debug statement at ${file.path}:${lineNo} or route through a structured logger.`,
            });
          }
        }
      }

      // Hunk-level check: Deleted assertions without replacement in test file
      if (isTest && deletedAssertions >= 1 && addedAssertions === 0) {
        pushFinding({
          ruleId: "weakened-test",
          severity: "high",
          category: "testing",
          title: `Removed ${deletedAssertions} test assertion(s) without adding replacements`,
          filePath: file.path,
          lineNumber: hunk.newStart || 1,
          snippet: hunk.header,
          whyItMatters:
            "Deleting `expect`/`assert` statements makes tests pass trivially while removing regression protection.",
          agentFixPrompt: `Audit ${file.path}:${hunk.newStart || 1} — ${deletedAssertions} assertion(s) were deleted without replacements. Restore or update assertions to verify actual behavior.`,
        });
      }

      // Hunk-level check: Auth guard removed without replacement
      if (!isTest && deletedAuthGuards.length > 0 && !addedAuthGuard) {
        const g = deletedAuthGuards[0];
        pushFinding({
          ruleId: "auth-guard-removed",
          severity: "critical",
          category: "security",
          title: "Authentication or authorization guard removed from hunk",
          filePath: file.path,
          lineNumber: hunk.newStart || g.lineNumber,
          snippet: `- ${g.snippet.slice(0, 130)}`,
          whyItMatters:
            "Removing middleware or permission decorators exposes protected endpoints or actions to unauthenticated callers.",
          agentFixPrompt: `Verify ${file.path}:${hunk.newStart || 1} — auth guard '${g.snippet}' was removed. Ensure equivalent authorization is enforced upstream or restore the check.`,
        });
      }
    }
  }

  // 7. Breaking Signature Changes + Untouched Callers
  for (const sig of symbolReport.signatureChanges) {
    if (!sig.breakingReason) continue;
    const callers = (blastRadius.untouchedCallers || []).filter((c) =>
      c.affectedChangedFiles.some(
        (af) =>
          af.targetPath === sig.filePath &&
          af.reasons.some((r) => r.includes(sig.name) || r.includes("imports module"))
      )
    );
    const hasUntouchedCallers = callers.length > 0;
    const callerNames = callers.slice(0, 3).map((c) => c.path).join(", ");

    pushFinding({
      ruleId: "breaking-signature",
      severity: hasUntouchedCallers ? "high" : "medium",
      category: "api-contract",
      title: hasUntouchedCallers
        ? `Breaking signature on '${sig.name}' affects ${callers.length} untouched caller(s)`
        : `Breaking contract change on exported ${sig.kind} '${sig.name}'`,
      filePath: sig.filePath,
      lineNumber: sig.lineNumber || 1,
      snippet: hasUntouchedCallers
        ? `${sig.breakingReason} — Untouched: ${callerNames}`
        : sig.breakingReason,
      whyItMatters: hasUntouchedCallers
        ? `Downstream file(s) (${callerNames}) were NOT updated in this diff and may fail at compile or runtime.`
        : "Callers outside this diff relying on the previous parameter/async signature may break.",
      agentFixPrompt: hasUntouchedCallers
        ? `Check untouched caller(s) [${callerNames}] that invoke '${sig.name}' (${sig.breakingReason}) and update them or make the new parameter optional.`
        : `Verify all callers of '${sig.name}' in ${sig.filePath} accommodate: ${sig.breakingReason}.`,
    });
  }

  // 8. Schema Modified Without Migration
  if (schemaFilesModified.length > 0 && !hasMigrationFile) {
    const sf = schemaFilesModified[0];
    pushFinding({
      ruleId: "schema-drift",
      severity: "medium",
      category: "correctness",
      title: `Data schema '${sf.path}' changed without a migration file in diff`,
      filePath: sf.path,
      lineNumber: sf.hunks[0]?.newStart || 1,
      snippet: `${schemaFilesModified.map((f) => f.path).join(", ")}`,
      whyItMatters:
        "Deploying ORM/model changes without a matching database migration causes runtime query failures in staging/production.",
      agentFixPrompt: `Generate and include the database migration corresponding to the schema changes in ${sf.path}.`,
    });
  }

  // 9. Manifest Dependencies Modified Without Lockfile
  if (manifestDepsModified.length > 0 && !hasLockfileUpdate && parsedDiff.files.length > 1) {
    const mf = manifestDepsModified[0];
    pushFinding({
      ruleId: "lockfile-drift",
      severity: "low",
      category: "hygiene",
      title: `Dependency manifest '${mf.path}' changed without lockfile update`,
      filePath: mf.path,
      lineNumber: mf.hunks[0]?.newStart || 1,
      snippet: mf.path,
      whyItMatters:
        "Changing package manifests without updating the lockfile breaks `npm ci` / `--frozen-lockfile` builds in CI.",
      agentFixPrompt: `Sync the lockfile for ${mf.path} or confirm zero-dependency changes were intentional.`,
    });
  }

  // 10. Untested Core Logic
  if (coreEffectiveLines >= 30 && testFilesTouched === 0) {
    const topCore = parsedDiff.files
      .filter((f) => f.layer === "core" || f.layer === "entrypoint" || f.layer === "data")
      .sort((a, b) => (b.effectiveChanges || 0) - (a.effectiveChanges || 0))[0];
    if (topCore) {
      pushFinding({
        ruleId: "untested-core",
        severity: "medium",
        category: "testing",
        title: `${coreEffectiveLines} lines of core/API logic modified with 0 test files updated`,
        filePath: topCore.path,
        lineNumber: topCore.hunks[0]?.newStart || 1,
        snippet: `Highest churn: ${topCore.path} (+${topCore.additions}/-${topCore.deletions})`,
        whyItMatters:
          "Substantial production logic changes without accompanying unit or integration tests increase silent regression risk.",
        agentFixPrompt: `Add focused unit/integration tests covering the updated logic in ${topCore.path} and related core modules.`,
      });
    }
  }

  // Sort findings by severity then file path
  findings.sort((a, b) => {
    const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.filePath.localeCompare(b.filePath);
  });

  // Attach per-file finding counts for graph & chapter badges
  const byFile = new Map();
  for (const fd of findings) {
    if (!byFile.has(fd.filePath)) byFile.set(fd.filePath, []);
    byFile.get(fd.filePath).push(fd);
  }
  for (const f of parsedDiff.files) {
    f.riskFindings = byFile.get(f.path) || [];
  }

  const counts = {
    critical: findings.filter((f) => f.severity === "critical").length,
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
    total: findings.length,
  };

  // Compute Trust Score (0..100)
  let penalty = 0;
  for (const f of findings) {
    penalty += SEVERITY_WEIGHT[f.severity] || 2;
  }
  // Mild complexity pressure for huge diffs (>800 effective lines)
  const effLines = moveReport.stats.effectiveLogicLines || 0;
  if (effLines > 800) {
    penalty += Math.min(12, Math.round((effLines - 800) / 250));
  }

  const trustScore = Math.max(0, Math.min(100, 100 - penalty));
  const grade =
    trustScore >= 90 && counts.critical === 0
      ? "A"
      : trustScore >= 75 && counts.critical === 0
      ? "B"
      : trustScore >= 55
      ? "C"
      : trustScore >= 35
      ? "D"
      : "F";

  const verdict =
    counts.critical > 0
      ? "Action Required — Critical security or guard hazard detected"
      : counts.high > 0
      ? "Careful Review — High-risk silent regression or breaking caller detected"
      : counts.medium > 0
      ? "Moderate Risk — Verify flagged contracts and test coverage"
      : "Clean Signal — No silent hazards detected";

  return {
    findings,
    counts,
    trustScore,
    grade,
    verdict,
  };
}
