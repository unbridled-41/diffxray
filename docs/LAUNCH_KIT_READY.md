# DiffXray Ready-to-Publish External Channel Kit

> **Why this file exists**: Autonomous agents have full GitHub API (`gh`) authority—which we used to ship `v1.0.0` → `v1.2.0`, deploy `https://unbridled-41.github.io/diffxray/`, verify `npx skills add unbridled-41/diffxray`, and open [`punkpeye/awesome-mcp-servers#19907`](https://github.com/punkpeye/awesome-mcp-servers/pull/19907).  
> External developer communities (Hacker News, Reddit, X, Glama OAuth, npm registry, Linux.do, V2EX) require **authenticated personal sessions / CAPTCHA clearance**. Below are the exact, zero-hype, rule-compliant actions to ignite external traffic immediately.

---

## Step 1 (2 Minutes — Unlocks Fast-Track Merge on 97,830⭐ `awesome-mcp-servers`!)

Our PR **[punkpeye/awesome-mcp-servers#19907](https://github.com/punkpeye/awesome-mcp-servers/pull/19907)** passed `check-submission` CI and is opted into the fast-track merge lane (`🤖🤖🤖`). To light up the Glama score badge requested by their bot:

1. Open **https://glama.ai/mcp/servers** and sign in with **GitHub OAuth** (`unbridled-41`).
2. Click **Add Server** → submit `https://github.com/unbridled-41/diffxray` (`glama.json`, `server.json`, and `Dockerfile` are already in `main`!).
3. Once Glama finishes building the Docker image (~30s), append the badge to PR #19907 (or ask the agent to push the 1-line badge update).

---

## Step 2 (1 Minute — Optional Global `npx diffxray` Short Name on npm)

We verified `diffxray` is **100% available (`404`)** on `npmjs.com`! Right now `npx github:unbridled-41/diffxray` already works worldwide; publishing to npm lets users type `npx diffxray`:

```bash
npm login
npm publish --access public
```

---

## Step 3 — Hacker News (`Show HN`) Submission (Best Window: Tue–Thu 08:30–10:00 EST / 21:30–23:00 CST)

- **Submit URL**: https://news.ycombinator.com/submit
- **Title**:
  ```text
  Show HN: DiffXray – Zero-dependency blast-radius map and silent-bug radar for Git diffs
  ```
- **URL**:
  ```text
  https://github.com/unbridled-41/diffxray
  ```
- **Immediate First Comment by Author**:
  ```text
  Hi HN! Over the past few months using terminal coding agents (Claude Code, Codex, etc.), my bottleneck shifted from writing code to reviewing 30-file diffs that compile cleanly and pass `exit 0` tests while quietly breaking untouched callers or swallowing errors.

  Standard diff views list changed files alphabetically—so if an exported function's required parameters change from 1 to 2, GitHub shows the changed file but never shows the 3 untouched routes/workers that still call it with 1 argument. And moving a 100-line function into a new module while changing one constant looks like 200 lines of red/green churn.

  So I built DiffXray (MIT, Node >= 20, zero runtime node_modules dependencies). The exact same pure ESM engine runs locally (`npx github:unbridled-41/diffxray`) and 100% client-side in the browser:

  Live browser studio (no install, paste any public GitHub PR URL): https://unbridled-41.github.io/diffxray/

  How it works under the hood:
  1. Cross-file move & in-flight delta pairing: Splits added/deleted hunks along top-level symbol boundaries and pairs blocks via multiset Jaccard similarity (>= 0.72), collapsing pure code motion while highlighting lines edited during the move.
  2. Untouched Blast-Radius scan: Parses imports and symbol call sites across unchanged workspace files (TS/JS, Python, Go, Rust, Java/Kotlin, SQL) to surface downstream callers outside the diff.
  3. 12 deterministic "Quietly Wrong" checks: Empty `catch {}` blocks, dropped `await`, deleted `requireAuth` guards, `.skip` or deleted assertions in tests, secret leaks, and SQL template interpolation. Funny dogfood moment: running `diffxray --staged` on our own PR #13 caught a real JSON-RPC `-32700` parse-error swallowing bug in our MCP server.

  Also ships as an MCP server (`--mcp`), a 5-line GitHub Action, and an agent skill (`npx skills add unbridled-41/diffxray`). Would love technical feedback on false positives or edge cases!
  ```

---

## Step 4 — Targeted Reddit Posts (Native Visual + Problem-First Framing)

### 1. `r/ClaudeAI` & `r/vibecoding`
- **Title**:
  ```text
  I built an open-source X-ray for huge Claude Code / Codex diffs — maps untouched callers in the blast radius & catches "quietly wrong" exit-0 bugs (0 dependencies, MIT)
  ```
- **Body**:
  ```markdown
  Anyone else spending 5 minutes prompting an agent and 45 minutes trying to verify a 28-file diff where all tests pass (`exit 0`), only to find out later the agent wrapped an error in an empty `catch {}`, dropped an `await`, or broke an untouched caller?

  I open-sourced **DiffXray** to fix this both for humans reviewing PRs and for agents self-verifying their own work:

  - **Zero-install browser studio** (paste any public GitHub PR URL): https://unbridled-41.github.io/diffxray/
  - **GitHub repo (MIT, 0 dependencies)**: https://github.com/unbridled-41/diffxray
  - **Install as a Claude Code / Codex / Cursor skill**: `npx skills add unbridled-41/diffxray`
  - **Run locally on uncommitted changes**: `npx github:unbridled-41/diffxray --html --open`

  It collapses cross-file moved functions (highlighting only lines tweaked during the move), scans your repo for **untouched downstream callers** whose imports/signatures were affected, and checks 12 deterministic silent-hazard patterns (no LLM API keys or cloud uploads). Happy to add rules for silent failure modes that have burned you!
  ```

### 2. `r/programming` & `r/opensource`
- **Title**:
  ```text
  DiffXray: Open-source, zero-dependency Git diff & PR analyzer that maps downstream blast radius and collapses cross-file moved code (CLI + 100% client-side Web Studio)
  ```

---

## Step 5 — 中文开发者社区（`Linux.do` / `V2EX 分享创造` / `X 中文圈` / `即刻`）

- **标题**：
  ```text
  [开源] DiffXray：1.5 秒透视巨型 Git Diff 与 AI PR 的隐藏「爆炸半径」与静默 Bug（零依赖 CLI + 纯前端在线体验 + Agent Skill）
  ```
- **正文**：
  ```markdown
  最近高频用 Claude Code / Codex 写代码，最大的痛点不再是写不出代码，而是 Agent 几分钟改 30 个文件、单测全绿（`exit 0`），人工看按字母排序的 GitHub Diff 根本看不出：
  1. 改了一个导出函数的参数签名，仓库里哪几个**没出现在 Diff 里**的路由或定时任务会被炸崩？
  2. 几百行代码跨文件抽离重构时，到底哪两行在搬运途中被顺手改了逻辑？
  3. 有没有偷偷加 `.skip`、删 `expect` 断言、空 `catch {}` 吞报错、漏写 `await` 或误删 `requireAuth`？

  于是做了一个零运行时依赖、MIT 开源的透视工具 **DiffXray**（CLI 与浏览器共用同一套纯 ESM 确定性引擎，无需任何 API Key，代码 100% 本地处理）：

  - **GitHub 仓库**：https://github.com/unbridled-41/diffxray
  - **免安装纯前端在线体验**（可直接粘贴任意公开 GitHub PR 链接）：https://unbridled-41.github.io/diffxray/
  - **本地一行命令体验**：`npx github:unbridled-41/diffxray --html --open`
  - **安装为 Claude Code / Codex / Cursor Skill**：`npx skills add unbridled-41/diffxray`

  做 PR #13 时用它自检，当场抓出了我自己 MCP Server 里吞掉 JSON-RPC `-32700` 解析异常的空 `catch` 漏洞 😂 欢迎大家拿手头最头疼的 PR 试试，提 Issue 拍砖！
  ```
