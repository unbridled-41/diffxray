---
name: diffxray
description: X-ray any Git diff, branch, or Pull Request before committing or merging. Maps untouched downstream callers in the blast radius, collapses moved/refactored code blocks, audits 12 "Quietly Wrong" silent regressions, and generates an interactive HTML studio or GitHub PR review tour.
---

# DiffXray

See [`skills/diffxray/SKILL.md`](skills/diffxray/SKILL.md) for the complete cross-agent verification workflow.

## Quick Commands

```bash
# Analyze uncommitted local git changes + repository blast radius
npx -y github:unbridled-41/diffxray

# Generate offline interactive HTML X-Ray Studio
npx -y github:unbridled-41/diffxray --html diffxray-report.html --open

# Analyze any GitHub Pull Request
npx -y github:unbridled-41/diffxray --pr owner/repo#123 --markdown
```
