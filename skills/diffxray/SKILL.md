---
name: diffxray
description: X-ray any Git diff, branch, or Pull Request before committing or merging. Maps untouched downstream callers in the blast radius, collapses moved/refactored code blocks, audits 12 "Quietly Wrong" silent regressions (dropped await, empty catch, removed auth guards, weakened tests, broken signatures, secret leaks, SQL/shell injection), and generates an interactive HTML studio or GitHub PR review tour. Use when reviewing code changes, verifying your own multi-file edits before finishing a task, auditing a PR, or investigating regressions.
---

# DiffXray — Agent Diff Verification & Blast-Radius Skill

When finishing a multi-file implementation, refactoring modules, or reviewing a branch/PR, do **not** rely solely on `exit 0` unit tests or alphabetical `git diff` output. Run **DiffXray** to inspect the downstream **Blast Radius** and catch **"Quietly Wrong"** regressions before handing work back to the user.

## 1. Quick Execution (Zero Dependencies, Node >= 20)

Run directly via `npx` from GitHub (or locally if installed):

```bash
# X-ray uncommitted workspace changes (plus local untouched caller scan)
npx -y github:unbridled-41/diffxray --no-color

# X-ray current feature branch against main and generate interactive HTML studio
npx -y github:unbridled-41/diffxray main...HEAD --html diffxray-report.html

# X-ray any GitHub Pull Request and print a Markdown review tour
npx -y github:unbridled-41/diffxray --pr owner/repo#123 --markdown

# Structured JSON output for programmatic agent reasoning
npx -y github:unbridled-41/diffxray --json
```

## 2. Mandatory Pre-PR / Pre-Completion Verification Loop

Whenever you modify `>= 3` files or change exported function signatures, schemas, or auth/API routes:

1. **Run DiffXray**: Execute `npx -y github:unbridled-41/diffxray --no-color` (or call the `xray_git_diff` / `audit_silent_hazards` MCP tool if connected).
2. **Check Untouched Downstream Callers (`Blast Radius`)**:
   - Inspect every file listed under `Untouched Downstream Callers`, especially any marked `[BREAKING SIGNATURE]`.
   - Open those untouched files and verify their call sites still match the new parameter count, types, and `async`/`Promise` return contract.
3. **Eliminate Every `CRITICAL` and `HIGH` Silent Risk Finding**:
   - `auth-guard-removed`: Confirm authentication/permission middleware was not accidentally dropped.
   - `unawaited-async`: Restore `await` or handle returned Promises explicitly.
   - `silent-catch`: Never swallow exceptions in empty or comment-only `catch {}` / `except: pass` blocks.
   - `weakened-test`: Never pass CI by adding `.skip`/`.only` or deleting assertions without adding stronger replacements.
   - `secret-leak` / `injection-risk`: Replace hardcoded secrets with env vars and use parameterized queries / `execFile`.
4. **Attach Review Tour to PRs**:
   - When opening or updating a Pull Request, run `npx -y github:unbridled-41/diffxray main...HEAD --markdown` and include the Guided Reading Order & Blast-Radius summary in the PR description so human reviewers can verify the change in minutes instead of hours.
