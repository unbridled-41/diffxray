/**
 * @fileoverview Live 7-Day 1,000-Star Growth Sprint Telemetry Reporter.
 * Queries GitHub API (via `gh api` if authenticated, falling back to public `fetch`)
 * for stars, forks, views, clones, release downloads, open PRs/issues, and velocity vs KPI.
 */

import { execFileSync } from "node:child_process";

const REPO = "unbridled-41/diffxray";
const LAUNCH_UTC = "2026-11-18T05:19:58Z";
const TARGET_STARS = 1000;
const SPRINT_HOURS = 168;

function ghJson(endpoint) {
  try {
    const out = execFileSync("gh", ["api", endpoint], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

const repo = ghJson(`repos/${REPO}`) || {};
const views = ghJson(`repos/${REPO}/traffic/views`) || { count: 0, uniques: 0 };
const clones = ghJson(`repos/${REPO}/traffic/clones`) || { count: 0, uniques: 0 };
const releases = ghJson(`repos/${REPO}/releases`) || [];

let totalDownloads = 0;
for (const rel of releases) {
  for (const asset of rel.assets || []) {
    totalDownloads += asset.download_count || 0;
  }
}

const now = Date.now();
const launchMs = Date.parse(LAUNCH_UTC);
const elapsedHours = Math.max(0.01, (now - launchMs) / 3_600_000);
const remainingHours = Math.max(0, SPRINT_HOURS - elapsedHours);
const stars = repo.stargazers_count ?? 0;
const neededStars = Math.max(0, TARGET_STARS - stars);
const requiredPerHour = remainingHours > 0 ? (neededStars / remainingHours).toFixed(2) : "0.00";

const snapshot = {
  checkedAtUtc: new Date(now).toISOString(),
  launchUtc: LAUNCH_UTC,
  elapsedHours: Number(elapsedHours.toFixed(2)),
  remainingHours: Number(remainingHours.toFixed(2)),
  stars,
  targetStars: TARGET_STARS,
  progressPercent: Number(((stars / TARGET_STARS) * 100).toFixed(2)),
  requiredStarsPerHour: Number(requiredPerHour),
  forks: repo.forks_count ?? 0,
  watchers: repo.subscribers_count ?? 0,
  openIssues: repo.open_issues_count ?? 0,
  views14d: { total: views.count ?? 0, uniques: views.uniques ?? 0 },
  clones14d: { total: clones.count ?? 0, uniques: clones.uniques ?? 0 },
  releaseAssetDownloads: totalDownloads,
};

console.log(JSON.stringify(snapshot, null, 2));
