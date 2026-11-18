import test from "node:test";
import assert from "node:assert/strict";
import {
  parseUnifiedDiff,
  detectMovedBlocks,
  analyzeDiffSymbols,
  buildBlastRadius,
  detectLanguage,
  classifyLayer,
} from "../src/core/index.mjs";

const SAMPLE_REFACTOR_DIFF = `diff --git a/src/legacy/billing.ts b/src/legacy/billing.ts
index 1111111..2222222 100644
--- a/src/legacy/billing.ts
+++ b/src/legacy/billing.ts
@@ -10,12 +10,2 @@ export class LegacyBilling {
-export async function calculateInvoiceTotal(items: LineItem[], taxRate: number) {
-  let subtotal = 0;
-  for (const item of items) {
-    subtotal += item.unitPrice * item.quantity;
-  }
-  const discount = subtotal > 1000 ? subtotal * 0.05 : 0;
-  const taxable = Math.max(0, subtotal - discount);
-  const tax = Math.round(taxable * taxRate);
-  return { subtotal, discount, tax, total: taxable + tax };
-}
 export const LEGACY_VERSION = 1;
diff --git a/src/services/invoice.ts b/src/services/invoice.ts
new file mode 100644
index 0000000..3333333
--- /dev/null
+++ b/src/services/invoice.ts
@@ -0,0 +1,16 @@
+import { verifyCustomer } from "../auth/verify";
+
+export async function calculateInvoiceTotal(items: LineItem[], taxRate: number) {
+  let subtotal = 0;
+  for (const item of items) {
+    subtotal += item.unitPrice * item.quantity;
+  }
+  const discount = subtotal > 1000 ? subtotal * 0.10 : 0;
+  const taxable = Math.max(0, subtotal - discount);
+  const tax = Math.round(taxable * taxRate);
+  return { subtotal, discount, tax, total: taxable + tax };
+}
+
+export function formatReceiptId(seq: number): string {
+  return \`INV-\${String(seq).padStart(6, "0")}\`;
+}
diff --git a/src/auth/verify.ts b/src/auth/verify.ts
index 4444444..5555555 100644
--- a/src/auth/verify.ts
+++ b/src/auth/verify.ts
@@ -1,5 +1,5 @@
-export function verifyCustomer(token: string) {
-  return token.startsWith("tok_");
+export function verifyCustomer(token: string, tenantId: string) {
+  return token.startsWith("tok_") && tenantId.length > 0;
 }
diff --git a/package-lock.json b/package-lock.json
index 6666666..7777777 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -1,3 +1,5 @@
 {
-  "lockfileVersion": 2
+  "lockfileVersion": 3,
+  "requires": true,
+  "packages": {}
 }
`;

test("parseUnifiedDiff extracts files, hunks, intraline ranges, languages, and layers", () => {
  const parsed = parseUnifiedDiff(SAMPLE_REFACTOR_DIFF);
  assert.equal(parsed.files.length, 4);
  assert.equal(parsed.stats.generatedFiles, 1);

  const invoice = parsed.files.find((f) => f.path === "src/services/invoice.ts");
  assert.ok(invoice);
  assert.equal(invoice.status, "added");
  assert.equal(invoice.language, "typescript");
  assert.equal(invoice.layer, "core");
  assert.equal(invoice.additions, 16);

  const verify = parsed.files.find((f) => f.path === "src/auth/verify.ts");
  assert.ok(verify);
  const delLine = verify.hunks[0].lines.find((l) => l.type === "del");
  const addLine = verify.hunks[0].lines.find((l) => l.type === "add");
  assert.ok(Array.isArray(delLine.intraline), "expected intraline highlight on modified signature");
  assert.ok(Array.isArray(addLine.intraline));
});

test("detectMovedBlocks pairs cross-file function moves and pinpoints in-flight edits", () => {
  const parsed = parseUnifiedDiff(SAMPLE_REFACTOR_DIFF);
  const moveReport = detectMovedBlocks(parsed);

  assert.equal(moveReport.moves.length, 1);
  const mv = moveReport.moves[0];
  assert.equal(mv.fromFile, "src/legacy/billing.ts");
  assert.equal(mv.toFile, "src/services/invoice.ts");
  assert.ok(mv.similarity >= 75, `Expected high similarity, got ${mv.similarity}%`);
  assert.equal(mv.isPureMove, false, "discount changed from 0.05 to 0.10 during move");
  assert.ok(mv.modifiedInMoveCount >= 1);
  assert.ok(moveReport.stats.noiseReductionPercent > 35);
});

test("analyzeDiffSymbols detects breaking signature changes across languages", () => {
  const parsed = parseUnifiedDiff(SAMPLE_REFACTOR_DIFF);
  detectMovedBlocks(parsed);
  const symReport = analyzeDiffSymbols(parsed);

  const verifyBreak = symReport.signatureChanges.find((s) => s.name === "verifyCustomer");
  assert.ok(verifyBreak, "Expected verifyCustomer signature break to be flagged");
  assert.equal(verifyBreak.changeType, "signature-changed");
  assert.match(verifyBreak.breakingReason, /Required params increased \(1 → 2\)/);

  // Test Python, Go, Rust extraction
  const multiLangDiff = `diff --git a/app/worker.py b/app/worker.py
--- a/app/worker.py
+++ b/app/worker.py
@@ -1,2 +1,2 @@
-def process_order(order_id):
+async def process_order(order_id, priority):
     pass
diff --git a/pkg/engine.rs b/pkg/engine.rs
--- a/pkg/engine.rs
+++ b/pkg/engine.rs
@@ -1,2 +1,2 @@
-pub fn compute_hash(input: &str) -> u64 {
+pub fn compute_hash(input: &str, seed: u64) -> u64 {
     0
 }
`;
  const mlParsed = parseUnifiedDiff(multiLangDiff);
  const mlSymbols = analyzeDiffSymbols(mlParsed);
  assert.equal(mlSymbols.signatureChanges.length, 2);
});

test("buildBlastRadius finds untouched workspace callers and builds guided reading chapters", () => {
  const parsed = parseUnifiedDiff(SAMPLE_REFACTOR_DIFF);
  const moveReport = detectMovedBlocks(parsed);
  const symReport = analyzeDiffSymbols(parsed);

  const workspaceFiles = [
    {
      path: "src/api/checkout-route.ts",
      content: `import { verifyCustomer } from "../auth/verify";\nexport async function POST(req) { return verifyCustomer(req.token); }`,
    },
    {
      path: "src/jobs/nightly-audit.ts",
      content: `import { verifyCustomer } from "../auth/verify";\nverifyCustomer("tok_abc");`,
    },
    {
      path: "src/unrelated/health.ts",
      content: `export function health() { return "ok"; }`,
    },
  ];

  const blast = buildBlastRadius(parsed, moveReport, symReport, workspaceFiles);

  assert.equal(blast.untouchedCallers.length, 2);
  assert.ok(blast.untouchedCallers.every((c) => c.touchesBreakingSymbol));
  assert.equal(
    blast.skippedMechanical.length,
    2,
    "package-lock.json (generated) and src/legacy/billing.ts (100% moved source) should be auto-collapsed"
  );
  const skippedPaths = blast.skippedMechanical.map((s) => s.path);
  assert.ok(skippedPaths.includes("package-lock.json"));
  assert.ok(skippedPaths.includes("src/legacy/billing.ts"));
  assert.ok(blast.chapters.length >= 1);
  assert.ok(blast.stats.estimatedReviewMinutes >= 1);

  assert.equal(detectLanguage("schema.prisma"), "sql");
  assert.equal(classifyLayer("tests/unit/foo.test.ts"), "test");
  assert.equal(classifyLayer("src/api/routes.ts"), "entrypoint");
});
