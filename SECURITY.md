# Security Policy

## Local-First & Privacy Guarantee

DiffXray is designed from the ground up to be **local-first and zero-telemetry**:

- **CLI & MCP Server**: Executes 100% locally on your machine with **zero third-party `node_modules` dependencies**. It sends zero telemetry, zero analytics, and zero source code over the network (network requests occur only when you explicitly pass `--pr <url|number>` to fetch a GitHub Pull Request).
- **Web Playground (`https://unbridled-41.github.io/diffxray/`)**: Runs 100% client-side in browser memory. Pasted diffs never touch any backend server; public PRs are fetched directly from `https://api.github.com` by your browser.
- **XSS & Untrusted Diff Hardening**: Diffs from untrusted repositories may contain adversarial filenames, HTML/SVG payloads, or script tags. All HTML and SVG renderers strictly escape untrusted strings and serialize embedded JSON safely (`<` -> `\u003c`).

## Supported Versions

| Version | Supported |
| --- | --- |
| `1.x` / `0.x` (`main`) | Yes |

## Reporting a Vulnerability

Please report security vulnerabilities (such as HTML/SVG injection via crafted diffs, command injection in git/CLI argument handling, or path traversal) via **GitHub Security Advisories** (`Report a vulnerability` under the repository's **Security** tab) rather than opening a public issue. We aim to acknowledge reports within 24 hours and ship a tested fix within 72 hours.
