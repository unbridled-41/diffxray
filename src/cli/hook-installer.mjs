/**
 * @fileoverview Zero-Husky Git pre-push hook installer (`diffxray --install-hook`).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { getGitRoot } from "./git-runner.mjs";

const HOOK_MARKER = "# diffxray-managed-hook";

const HOOK_SCRIPT = `#!/bin/sh
${HOOK_MARKER}
# Runs DiffXray silent-hazard gate before git push (bypass anytime with git push --no-verify)
if command -v npx >/dev/null 2>&1; then
  npx -y github:unbridled-41/diffxray --fail-on high
fi
`;

/**
 * Install or update `.git/hooks/pre-push` in the target git repository.
 * Refuses to overwrite an unrelated custom pre-push hook unless `--force` is passed.
 * @param {{ cwd?: string, force?: boolean }} [opts]
 */
export function installPrePushHook(opts = {}) {
  const root = getGitRoot(opts.cwd || process.cwd());
  if (!root) {
    throw new Error("Not inside a Git repository — cannot install .git/hooks/pre-push.");
  }
  const hooksDir = join(root, ".git", "hooks");
  mkdirSync(hooksDir, { recursive: true });
  const hookPath = join(hooksDir, "pre-push");

  if (existsSync(hookPath) && !opts.force) {
    const existing = readFileSync(hookPath, "utf8");
    if (!existing.includes(HOOK_MARKER)) {
      throw new Error(
        `Existing custom pre-push hook found at ${hookPath}. Append 'diffxray --fail-on high' manually or re-run with --force.`
      );
    }
  }

  writeFileSync(hookPath, HOOK_SCRIPT, { encoding: "utf8", mode: 0o755 });
  if (process.platform !== "win32") {
    chmodSync(hookPath, 0o755);
  }
  return hookPath;
}
