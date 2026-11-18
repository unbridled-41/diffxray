# Contributing to DiffXray

Thank you for your interest in making code review and diff verification clearer, faster, and safer for everyone.

## Core Engineering Principles

1. **Zero Runtime Dependencies**: DiffXray runs via `npx` and in browsers with zero external `node_modules`. Every parser, analyzer, and renderer in `src/` uses standard ECMAScript modules (`src/**/*.mjs`) compatible with both Node.js `>= 20` and modern browsers (except `src/cli/` and `src/mcp/`, which use built-in `node:*` modules).
2. **Deterministic Signal Over Noise**: Every heuristic in `src/analyzers/risk-radar.mjs` must have clear reproduction fixtures, low false-positive rates, and actionable remediation guidance.
3. **Isomorphic Core**: Keep `src/core/` and `src/analyzers/` free of `node:fs` or `node:child_process` imports so the exact same analysis engine powers both the local CLI and the client-side Web Studio (`site/`).
4. **PR-Driven Workflow**:
   - Open or claim an Issue describing the bug, detector, language grammar, or UI improvement.
   - Create a focused branch (`feat/...`, `fix/...`, `docs/...`).
   - Add automated tests in `tests/*.test.mjs` using Node's built-in `node:test` and `node:assert/strict`.
   - Run `npm test` and `npm run check` locally before opening a Pull Request.

## Running Locally

```bash
git clone https://github.com/unbridled-41/diffxray.git
cd diffxray
npm test
npm run check
node ./bin/diffxray.mjs --help
```

## Adding a New Risk Detector or Language Support

- **Language symbol/import support**: Extend language patterns in `src/core/symbol-graph.mjs` and add fixture diffs in `tests/symbol-graph.test.mjs`.
- **Silent-hazard rule**: Add a rule descriptor and matcher in `src/analyzers/risk-radar.mjs` with both positive (must-flag) and negative (must-not-flag) test cases in `tests/risk-radar.test.mjs`.

## License

By contributing to DiffXray, you agree that your contributions will be licensed under the [MIT License](LICENSE).
