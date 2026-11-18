# DiffXray Pre-Launch Growth Strategy & 7-Day 1,000-Star Playbook

> **Core KPI**: Achieve `>= 1,000 organic GitHub Stars` within `168 hours` (`7×24h`) of formal `v1.0.0` public release.  
> **Ethical Mandate**: Zero fake stars, zero bot accounts, zero spam, strict adherence to every community's self-promotion and formatting guidelines.

---

## 1. Target Audience & Sharp Positioning

### Primary ICPs (Ideal Stargazer Profiles)
1. **AI-Assisted Full-Stack & Systems Engineers (`Claude Code`, `Codex`, `Cursor`, `Antigravity` users)**: Daily pain of reviewing 20–50 file agent diffs and getting burned by silent `exit 0` bugs.
2. **Tech Leads, Staff Engineers & OSS Maintainers**: Drowning in PR review queues; immediately value topological reading order, collapsed code moves, and sticky GitHub Action PR maps.
3. **Security-Conscious & Minimalist HN Engineers**: Attracted to **zero runtime `node_modules` dependencies**, deterministic static/graph analysis (no cloud LLM wrapper!), SARIF 2.1.0 output, and instant client-side browser execution.

### The 5-Second Hook
> *"GitHub diffs list changed files alphabetically. DiffXray shows what actually broke downstream — mapping untouched callers in the blast radius, collapsing cross-file moves, and catching 12 'Quietly Wrong' AI regressions in <1.5s with zero dependencies."*

---

## 2. Viral Mechanics Engineered Into the Product

1. **Deep-Link Browser URL Magic (`?pr=owner/repo/123`)**:
   - Anyone can paste *any* public GitHub PR into `https://unbridled-41.github.io/diffxray/?pr=owner/repo/123` and share that exact X-Ray link in Slack, X, Discord, or GitHub discussions.
2. **Sticky GitHub Action & Markdown PR Tour Footer**:
   - Every exported PR review tour and GitHub Action comment includes a clean attribution link (`X-rayed with DiffXray · Open Interactive Blast-Radius Studio →`), turning public PR reviews into organic discovery impressions.
3. **5-Surface Ecosystem Indexing**:
   - `skills.sh` (`npx skills add unbridled-41/diffxray`)
   - Claude Code Plugin Marketplace (`/plugin install diffxray --marketplace unbridled-41/diffxray`)
   - Codex Plugin (`.codex-plugin/plugin.json`)
   - MCP Directories (`npx -y github:unbridled-41/diffxray --mcp`)
   - GitHub Actions (`uses: unbridled-41/diffxray@v1`)

---

## 3. Community Distribution Channels, Rules & Launch Copy

### Channel A: Curated Open-Source Ecosystem Lists (GitHub PRs — Autonomous via `gh`)
Submit clean, single-entry, strictly formatted Pull Requests to active community directories that welcome open-source submissions:
- **Agent Skills Directories**: `VoltAgent/awesome-agent-skills`, `hesreallyhim/awesome-claude-code` (or active Nov 2026 equivalents verified via `gh api` before submitting — always read each repo's `CONTRIBUTING.md` line-by-line first!).
- **MCP Directories**: `punkpeye/awesome-mcp-servers`, `appcypher/awesome-mcp-servers`.
- **Code Review / CLI Lists**: Curated CLI & developer tool lists accepting zero-dependency MIT tools.

### Channel B: Hacker News (`Show HN`)
- **Rule Check**: Plain-English title starting with `Show HN:`, zero marketing buzzwords ("revolutionary", "ultimate"), direct link to GitHub repo (where Live Web Studio is 1 click away without login), authentic technical builder comment explaining the shingle move algorithm, untouched caller resolution, and our own PR #13 self-dogfood catch.
- **Ready Submission**:
  - **Title**: `Show HN: DiffXray – Zero-dependency blast-radius map and silent-bug radar for Git diffs`
  - **URL**: `https://github.com/unbridled-41/diffxray`
  - **First Comment (Builder Story)**:
    > Hi HN! Over the past few months using terminal coding agents, our bottleneck shifted completely from writing code to verifying 30-file diffs that compile cleanly and pass `exit 0` tests while quietly breaking untouched callers or swallowing errors.
    >
    > GitHub's diff view lists files alphabetically and only shows changed files—so if an exported function's required arity changes from 1 to 2, you don't see the three untouched workers that still call it with 1 argument. And if a 100-line function moves to a new file with one tweaked constant, it reads like 200 lines of churn.
    >
    > So we built **DiffXray** (MIT, Node >= 20, zero runtime `node_modules` dependencies). The same pure ESM core runs both locally (`npx github:unbridled-41/diffxray`) and 100% client-side in the browser (`https://unbridled-41.github.io/diffxray/` — you can paste any public GitHub PR URL to test it without installing anything).
    >
    > Under the hood:
    > 1. **Move & in-flight delta pairing**: Splits added/deleted hunks at top-level declaration boundaries and pairs blocks via multiset Jaccard similarity (`>= 0.72`), collapsing pure motion while highlighting lines edited during the move.
    > 2. **Untouched Blast-Radius scan**: Resolves imports & symbol call sites across unchanged workspace files (TS/JS, Python, Go, Rust, Java/Kotlin, SQL) to flag downstream callers outside the diff.
    > 3. **12 deterministic "Quietly Wrong" checks**: Empty `catch {}` blocks, dropped `await`, deleted `requireAuth` guards, `.skip` / deleted assertions in tests, secret leaks, and SQL template interpolation. Funny dogfood moment: running `diffxray --staged` on our own PR #13 caught a real JSON-RPC `-32700` parse-error swallowing bug in our MCP server.
    >
    > Would love feedback on false positives, missing language edge cases, or risk rules you wish existed!

### Channel C: Targeted Subreddits (`r/ClaudeAI`, `r/programming`, `r/opensource`, `r/commandline`, `r/vibecoding`)
- **Rule Check**: Lead with the engineering problem & native demo visual (`docs/media/hero-demo.svg` / studio screen recording), disclose authorship transparently, engage constructively with critiques.
- **Angle for `r/ClaudeAI` & `r/vibecoding`**:
  - **Title**: `I built an open-source X-ray for 30-file Claude Code / Codex diffs that catches "quietly wrong" exit-0 bugs and maps untouched callers (0 dependencies, MIT)`

### Channel D: Bilingual Chinese Tech Communities (`Linux.do`, `V2EX /go/create`, `Jike`, `X/Twitter ZH`)
- **Title**: `开源了 DiffXray：1.5 秒透视巨型 Git Diff 与 AI PR 的真实「爆炸半径」与隐蔽 Bug（零依赖 CLI + 纯前端在线体验 + Agent Skill）`

---

## 4. 7-Day Sprint Iteration Cadence

- **Day 1 (Launch + Velocity Ignition)**: Tag `v1.0.0`, verify live GitHub Pages URL & `npx` commands, polish GitHub Profile README pin, submit compliant ecosystem PRs, launch Show HN + Reddit + Bilingual channels.
- **Days 2–3 (Feature Velocity & Feedback Loop)**: Ship `v1.1.0` (e.g., GitLab/Bitbucket diff URL support, custom `.diffxray.json` rule config, side-by-side split diff toggle in Studio) based on early user issues/comments.
- **Days 4–5 (Ecosystem Integrations)**: Ship `v1.2.0` (VS Code / Cursor task recipe, pre-push husky/lefthook one-liner, benchmark showcase on famous real OSS PRs like React/Next/FastAPI).
- **Days 6–7 (Audit & Long-Term Roadmap)**: Record exact 168-hour star curve, fork count, PR adoption, conversion bottlenecks, and `v1.3+` roadmap in `docs/GROWTH_LOG.md`.
