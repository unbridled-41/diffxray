/**
 * @fileoverview Safe Git subprocess runner (execFileSync only, zero shell interpolation)
 * and GitHub Pull Request REST API fetcher.
 */

import { execFileSync } from "node:child_process";

const MAX_BUFFER = 32 * 1024 * 1024; // 32 MB diff buffer

/**
 * Execute `git` safely with argument array (never invokes a shell).
 * @param {string[]} args
 * @param {string} cwd
 * @returns {string}
 */
export function runGit(args, cwd = process.cwd()) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: MAX_BUFFER,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * Try running `git` and return `null` on non-zero exit.
 * @param {string[]} args
 * @param {string} cwd
 * @returns {string|null}
 */
function tryGit(args, cwd = process.cwd()) {
  try {
    return runGit(args, cwd);
  } catch {
    return null;
  }
}

/**
 * Resolve repository root directory via `git rev-parse --show-toplevel`.
 * @param {string} cwd
 * @returns {string|null}
 */
export function getGitRoot(cwd = process.cwd()) {
  const out = tryGit(["rev-parse", "--show-toplevel"], cwd);
  return out ? out.trim() : null;
}

/**
 * Infer `owner/repo` slug from `git remote get-url origin`.
 * @param {string} cwd
 * @returns {string|null}
 */
export function inferGitHubRepoSlug(cwd = process.cwd()) {
  const url = tryGit(["remote", "get-url", "origin"], cwd);
  if (!url) return null;
  const m = /github\.com[:/]([^/\s]+\/[^/\s]+?)(?:\.git)?$/i.exec(url.trim());
  return m ? m[1] : null;
}

/**
 * Smartly acquire a local unified diff based on user flags or workspace git state.
 * @param {{ cwd?: string, staged?: boolean, ref?: string }} [opts]
 */
export function acquireLocalGitDiff(opts = {}) {
  const cwd = opts.cwd || process.cwd();

  if (opts.staged) {
    const diff = runGit(["diff", "--cached", "--find-renames"], cwd);
    return { rawDiff: diff, sourceLabel: "git diff --staged", title: "Staged Changes" };
  }

  if (opts.ref) {
    const diff = runGit(["diff", "--find-renames", opts.ref], cwd);
    return { rawDiff: diff, sourceLabel: `git diff ${opts.ref}`, title: `Diff ${opts.ref}` };
  }

  // 1. Uncommitted working-tree + staged changes vs HEAD
  const headDiff = tryGit(["diff", "HEAD", "--find-renames"], cwd);
  if (headDiff && headDiff.trim().length > 0) {
    return {
      rawDiff: headDiff,
      sourceLabel: "working tree (HEAD)",
      title: "Uncommitted Workspace Changes",
    };
  }

  // 2. Staged changes when repo has no HEAD commit yet
  const cachedDiff = tryGit(["diff", "--cached", "--find-renames"], cwd);
  if (cachedDiff && cachedDiff.trim().length > 0) {
    return {
      rawDiff: cachedDiff,
      sourceLabel: "staged index",
      title: "Staged Index Changes",
    };
  }

  // 3. Current feature branch vs main/master
  const branch = (tryGit(["rev-parse", "--abbrev-ref", "HEAD"], cwd) || "").trim();
  if (branch && branch !== "main" && branch !== "master" && branch !== "HEAD") {
    for (const baseCandidate of ["origin/main", "main", "origin/master", "master"]) {
      const mergeBase = tryGit(["merge-base", baseCandidate, "HEAD"], cwd);
      if (mergeBase && mergeBase.trim()) {
        const branchDiff = tryGit(
          ["diff", "--find-renames", `${mergeBase.trim()}..HEAD`],
          cwd
        );
        if (branchDiff && branchDiff.trim().length > 0) {
          return {
            rawDiff: branchDiff,
            sourceLabel: `${baseCandidate}...${branch}`,
            title: `Branch ${branch}`,
          };
        }
      }
    }
  }

  // 4. Fallback: latest commit on current branch
  const lastCommit = tryGit(["show", "--format=", "--find-renames", "HEAD"], cwd);
  const subject = (tryGit(["log", "-1", "--pretty=%s"], cwd) || "Latest Commit").trim();
  return {
    rawDiff: lastCommit || "",
    sourceLabel: "latest commit (HEAD)",
    title: subject,
  };
}

/**
 * Parse a PR specifier (`123`, `owner/repo#123`, `owner/repo/123`, or full GitHub PR URL).
 * @param {string} input
 * @param {string} [cwd]
 */
export function parsePrSpecifier(input, cwd = process.cwd()) {
  const s = (input || "").trim();
  let m = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i.exec(s);
  if (m) return { owner: m[1], repo: m[2], number: Number(m[3]) };

  m = /^([^/#\s]+)\/([^/#\s]+)(?:#|\/pull\/|\/)(\d+)$/.exec(s);
  if (m) return { owner: m[1], repo: m[2], number: Number(m[3]) };

  if (/^\d+$/.test(s)) {
    const slug = inferGitHubRepoSlug(cwd);
    if (!slug) {
      throw new Error(
        `Cannot resolve PR #${s} without a GitHub 'origin' remote. Pass 'owner/repo#${s}' or the full PR URL.`
      );
    }
    const [owner, repo] = slug.split("/");
    return { owner, repo, number: Number(s) };
  }

  throw new Error(
    `Invalid PR specifier '${s}'. Expected a PR number, 'owner/repo#123', or 'https://github.com/owner/repo/pull/123'.`
  );
}

/**
 * Fetch unified diff and metadata for a GitHub Pull Request via REST API.
 * @param {string} prSpec
 * @param {{ cwd?: string, token?: string }} [opts]
 */
export async function fetchGitHubPrDiff(prSpec, opts = {}) {
  const { owner, repo, number } = parsePrSpecifier(prSpec, opts.cwd);
  const token = opts.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

  const baseHeaders = {
    "User-Agent": "DiffXray-CLI",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;

  const [metaRes, diffRes] = await Promise.all([
    fetch(apiUrl, { headers: { ...baseHeaders, Accept: "application/vnd.github+json" } }),
    fetch(apiUrl, { headers: { ...baseHeaders, Accept: "application/vnd.github.v3.diff" } }),
  ]);

  if (!metaRes.ok) {
    throw new Error(`GitHub API returned ${metaRes.status} for ${owner}/${repo}#${number}`);
  }
  if (!diffRes.ok) {
    throw new Error(`Failed to fetch unified diff (${diffRes.status}) for ${owner}/${repo}#${number}`);
  }

  const meta = await metaRes.json();
  const rawDiff = await diffRes.text();

  return {
    rawDiff,
    title: `PR #${number}: ${meta.title || ""}`.trim(),
    sourceLabel: `${owner}/${repo}#${number}`,
    prUrl: meta.html_url || `https://github.com/${owner}/${repo}/pull/${number}`,
  };
}
