# AGENTS.md — DiffXray Repository Guide for Coding Agents

## Architecture & Invariants

1. **Zero Runtime Dependencies (`package.json` -> `"dependencies": {}`)**: Never add runtime npm dependencies. CLI and MCP modules use Node.js `>= 20` built-ins; core analysis and rendering modules use pure standard ECMAScript.
2. **Strict Browser + Node Isomorphism**: `src/core/`, `src/analyzers/`, and `src/renderers/` MUST NOT import `node:*` built-in modules. They run identically in Node.js and directly in browser `<script type="module">` (`site/`). `npm run check` enforces this invariant automatically.
3. **XSS & Injection Safety**:
   - All Git invocations in `src/cli/git-runner.mjs` MUST use `execFileSync("git", args)` (never `execSync` or `shell: true`).
   - All HTML/SVG renderers MUST escape untrusted diff text via `escapeHtml()` and `safeJsonForScript()`.
4. **Self-Dogfooding**: Before committing or opening a PR, always run:
   ```bash
   npm run check
   npm test
   node ./bin/diffxray.mjs --staged --no-color
   ```
   Ensure your changes achieve **Grade A** with zero `critical` or `high` silent-hazard flags.
