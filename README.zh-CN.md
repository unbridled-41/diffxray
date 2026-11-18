<p align="left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/media/logo-dark.svg">
    <img src="docs/media/logo-light.svg" alt="DiffXray" height="42">
  </picture>
</p>

# 阅读架构脉络，而非按字母堆砌的 Diff。

DiffXray 将本地 `git diff` 与大型 Pull Request 转化为**可自由拖拽的爆炸半径图（Blast-Radius Map）**、**跨文件代码搬运折叠导览**与 **12 项确定性静默故障审计**。支持 Node.js 20+ 本地运行或纯浏览器前端运行，零运行时第三方依赖，无需任何大模型 API Key。

**[在线体验 Web Studio](https://unbridled-41.github.io/diffxray/)** · **[快速开始](#快速开始)** · **[12 项检测规则](#确定性静默故障规则)** · **[MCP 与 Agent Skill](#agent-skillmcp-服务与-github-action)** · **[架构说明](docs/ARCHITECTURE.md)** · **[English](README.md)**

<p>
  <a href="https://unbridled-41.github.io/diffxray/">
    <img src="docs/media/showcase-overview.png" width="100%" alt="DiffXray 温润典籍风展示官网与内嵌交互审查工作台">
  </a>
</p>

---

## 为什么做 DiffXray

当编码智能体几分钟生成横跨二三十个文件、单测全绿（`exit 0`）的大型 PR 时，传统按文件名字母排序的 Diff 视图往往隐藏了三类关键风险：

1. **未被修改却受波及的下游调用方**：当导出函数 `verifySessionToken(token)` 新增必填参数 `orgId` 时，GitHub 只展示 `session.ts`，不会提示仓库中还有未出现在 Diff 里的路由或后台任务仍在传单参数。
2. **机械搬运掩盖真实逻辑改动**：将 120 行计费函数抽离到新文件并顺手改了 1 行折扣系数，在普通 Diff 中会呈现为 240 行红绿增删。DiffXray 基于归一化 Shingle Jaccard 配对跨文件搬运块，自动折叠纯移动代码，仅高亮搬运途中的细微修改。
3. **静默回归（Quietly Wrong `exit 0`）**：智能体常通过添加 `.skip`、删除 `expect()` 断言、写空 `catch {}` 吞掉异常、漏写 `await` 或误删 `requireAuth` 鉴权中间件让测试变绿。

> 在本项目 [PR #13](https://github.com/unbridled-41/diffxray/pull/13) 提交前的首次自检中，`silent-catch` 规则当场拦截了我们自身 MCP 服务里吞掉 JSON-RPC `-32700` 解析错误的缺陷。

---

## 可自由拖拽的爆炸半径交互画布

每次审查均可导出为单文件离线 HTML 工作台，或直接在 **[unbridled-41.github.io/diffxray](https://unbridled-41.github.io/diffxray/)** 纯前端打开。画布中的所有模块卡片与泳道标题均可自由拖动，上下游贝塞尔连线与方向箭头实时四向跟随：

<p>
  <a href="https://unbridled-41.github.io/diffxray/">
    <img src="docs/media/showcase-blast-radius.png" width="100%" alt="DiffXray 爆炸半径自由拖拽画布与右侧符号检查器">
  </a>
</p>

- **章节式阅读导览（Guided Tour）**：按架构边界从外向内排序（入口契约 → 核心业务 → 数据与配置 → UI 视图 → 测试文档），支持 Unified 与 Split 左右分栏对比（快捷键 `s`）。
- **自由拖拽爆炸半径图（Blast-Radius Map）**：支持单卡片与整列泳道拖拽、鼠标中心滚轮缩放、`12px` 网格吸附，以及不破坏自定义排布的 `Fit View` 与一键归位 `Reset Layout`。
- **免安装 PR 直链透视**：在官网输入公开 GitHub PR / Commit 链接或访问 `?pr=owner/repo/123` 即可在浏览器本地完成解析。

---

## 快速开始

仅需 **Node.js 20+**，零第三方 `node_modules`，源码不会上传至任何外部服务器：

```bash
# 在终端直接透视当前未提交改动或分支差异
npx github:unbridled-41/diffxray

# 生成并自动在浏览器打开单文件交互式 HTML Studio
npx github:unbridled-41/diffxray main...HEAD --html --open

# 直接透视任意公开 GitHub PR
npx github:unbridled-41/diffxray --pr vercel-labs/skills#10 --html --open

# CI 或提交前门禁：发现高危或严重静默风险时返回非零退出码
npx github:unbridled-41/diffxray --staged --fail-on high

# 一键安装零依赖 .git/hooks/pre-push 本地推送门禁
npx github:unbridled-41/diffxray --install-hook
```

---

## Agent Skill、MCP 服务与 GitHub Action

### 1. 安装为 Agent Skill（支持 `Claude Code` · `Codex` · `Cursor` · `Antigravity` 等）

让编码智能体在提交代码前主动自查下游爆炸半径与静默缺陷：

```bash
npx skills add unbridled-41/diffxray
```

或作为 Claude Code 插件安装：

```bash
claude plugin install diffxray --marketplace unbridled-41/diffxray
```

### 2. 接入标准 STDIO MCP Server

内置零依赖 JSON-RPC 2.0 MCP 服务，提供 `xray_git_diff`、`xray_patch_text` 与 `xray_github_pr` 三个工具：

```json
{
  "mcpServers": {
    "diffxray": {
      "command": "npx",
      "args": ["-y", "github:unbridled-41/diffxray", "--mcp"]
    }
  }
}
```

### 3. GitHub Action 自动 PR 导览评论与 SARIF 报告

新建 `.github/workflows/diffxray.yml`，每次更新 PR 时自动生成并原地刷新架构导览评论：

```yaml
name: DiffXray PR Review
on: [pull_request]
permissions:
  contents: read
  pull-requests: write
jobs:
  xray:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: unbridled-41/diffxray@main
```

---

## 可导出的矢量架构摘要卡

运行 `npx github:unbridled-41/diffxray --svg diffxray-card.svg`（或在工作台切换至 **Tab 4: PR Card & Export**）即可导出用于嵌入 PR 描述或技术方案文档的 SVG 卡片：

<p>
  <img src="docs/media/sample-card.svg" width="100%" alt="DiffXray 温润典籍风矢量 PR 摘要卡">
</p>

---

## 确定性静默故障规则

全部 12 条规则均采用确定性静态与符号图分析（毫秒级执行、无大模型随机幻觉、支持 `--sarif` 导出 OASIS **SARIF v2.1.0** 及 `.diffxray.json` 团队配置）：

| 规则 ID | 严重级别 | 检测内容 |
| --- | --- | --- |
| `secret-leak` | Critical | 新增 AWS、GitHub、OpenAI/Anthropic/Stripe 密钥、Slack Token、私钥或数据库连接串密码（报告自动脱敏）。 |
| `injection-risk` | Critical | 字符串拼接 SQL 注入、`eval` / `new Function`、`shell: true` 命令执行与未转义 HTML 注入点。 |
| `auth-guard-removed` | Critical | 删除 `requireAuth`、`verifyToken`、`@UseGuards`、`@login_required` 等鉴权守卫且无替代实现。 |
| `breaking-signature` | High | 导出函数必填参数增加、参数减少或 `async` 契约变更，且存在未同步更新的工作区下游调用方。 |
| `weakened-test` | High | 新增 `.skip` / `.only` / `@pytest.mark.skip`，或删除测试断言且未补充新断言。 |
| `silent-catch` | High | 新增空的或仅含注释的 `catch {}` / `except: pass` 块静默吞掉运行时异常。 |
| `unawaited-async` | High | 在修改块内删掉了异步调用前的 `await`，引发竞态或未捕获拒绝。 |
| `type-erosion` | Medium | 生产代码中新增 `: any`、`as any`、`@ts-ignore`、`# type: ignore` 或 `unsafe {}`。 |
| `schema-drift` | Medium | 修改了 Prisma / SQL / ORM 模型定义，但本次 Diff 未包含对应的数据库迁移文件。 |
| `untested-core` | Medium | 核心业务、入口契约或数据层有效改动达 `>= 30` 行，但未更新任何测试文件。 |
| `lockfile-drift` | Low | 修改了包管理清单依赖项，但未同步更新锁文件。 |
| `debug-leftover` | Low | 非 CLI 生产模块中遗留 `debugger`、`console.log`、`pdb.set_trace()`、`breakpoint()` 或 `dbg!()`。 |

---

## 多语言支持与零依赖同构架构

- **支持语言**：TypeScript / JavaScript（`.ts`, `.tsx`, `.mts`, `.js`, `.jsx`, `.mjs`, `.cjs`）、Python（`.py`）、Go（`.go`）、Rust（`.rs`）、Java / Kotlin / C#（`.java`, `.kt`, `.cs`）、SQL 与 Prisma（`.sql`, `.prisma`）。
- **零外部依赖同构内核**：`src/core/`、`src/analyzers/` 与 `src/renderers/` 不引入任何 `node:*` 模块或第三方 npm 包，同一套标准 ES 模块同时驱动 CLI、GitHub Action、MCP 服务与浏览器工作台，每次提交均经 Linux、macOS、Windows 六矩阵自动验证。

## 开源协议

[MIT](LICENSE) · 欢迎提交 Issue 与 PR，详见 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。
