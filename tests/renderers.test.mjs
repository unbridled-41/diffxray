import test from "node:test";
import assert from "node:assert/strict";
import {
  xrayDiff,
  renderHtmlStudio,
  renderSvgCard,
  renderMarkdownTour,
  renderTerminalReport,
} from "../src/index.mjs";

const XSS_AND_BLAST_DIFF = `diff --git a/src/auth/<img src=x onerror=alert(1)>.ts b/src/auth/<img src=x onerror=alert(1)>.ts
new file mode 100644
--- /dev/null
+++ b/src/auth/<img src=x onerror=alert(1)>.ts
@@ -0,0 +1,4 @@
+export function verifySession(token: string, strict: boolean) {
+  const evil = "</script><script>alert('xss')</script>";
+  return token && strict && evil;
+}
`;

test("renderHtmlStudio neutralizes XSS payloads in paths, titles, and embedded script JSON", () => {
  const report = xrayDiff(XSS_AND_BLAST_DIFF, {
    title: `PR </script><script>evil()</script>`,
    sourceLabel: `branch <svg onload=bad()>`,
  });

  const html = renderHtmlStudio(report);
  assert.ok(html.startsWith("<!DOCTYPE html>"));
  assert.ok(!html.includes("</script><script>alert"), "must never emit raw closing script tag from diff payload");
  assert.ok(!html.includes("</script><script>evil"), "must escape title in HTML and JSON");
  assert.ok(html.includes("\\u003c/script\\u003e"), "embedded JSON payload must unicode-escape angle brackets");
});

test("renderSvgCard generates valid adaptive dark/light vector SVG", () => {
  const report = xrayDiff(XSS_AND_BLAST_DIFF, {
    workspaceFiles: [
      {
        path: "src/routes/login.ts",
        content: `import { verifySession } from "../auth/session";\nverifySession("abc", true);`,
      },
    ],
  });

  const svg = renderSvgCard(report);
  assert.ok(svg.startsWith("<svg "));
  assert.ok(svg.endsWith("</svg>"));
  assert.ok(svg.includes("prefers-color-scheme:"));
  assert.ok(!svg.includes("<img src=x"), "must escape XML entities inside SVG text nodes");
  assert.ok(svg.includes("TRUST "));
});

test("renderMarkdownTour and renderTerminalReport include chapters, risks, and sticky marker", () => {
  const report = xrayDiff(XSS_AND_BLAST_DIFF, {
    prUrl: "https://github.com/acme/webapp/pull/42",
    workspaceFiles: [
      {
        path: "src/routes/dashboard.ts",
        content: `export function handler() { return verifySession("tok", true); }`,
      },
    ],
  });

  const md = renderMarkdownTour(report);
  assert.ok(md.includes("<!-- diffxray-sticky-comment -->"));
  assert.ok(md.includes("Guided Reading Order"));
  assert.ok(md.includes("Untouched Blast Radius"));
  assert.ok(md.includes("?pr=acme%2Fwebapp%2F42"));

  const tuiPlain = renderTerminalReport(report, { color: false });
  assert.ok(tuiPlain.includes("DiffXray"));
  assert.ok(tuiPlain.includes("Trust Score"));
  assert.ok(!tuiPlain.includes("\x1b["), "color:false must omit ANSI escape codes");
});

test("v2.1.0 HTML Studio includes freely draggable Blast-Radius nodes, lane group drag, smart 4-side edge routing, and Reset Layout", () => {
  const report = xrayDiff(XSS_AND_BLAST_DIFF);
  const html = renderHtmlStudio(report);
  assert.ok(html.includes("bindGraphNodeAndLaneDrag"), "must bind pointer drag handlers for nodes and lanes");
  assert.ok(html.includes("computeSmartEdgePath"), "must compute smart 4-side Bézier edge geometry");
  assert.ok(html.includes('id="layout-reset"'), "must include Reset Layout control");
  assert.ok(html.includes('id="toggle-snap"'), "must include Snap-to-Grid toggle");
  assert.ok(html.includes('id="dxr-arrow-danger"'), "must define directional SVG arrow markers");
});
