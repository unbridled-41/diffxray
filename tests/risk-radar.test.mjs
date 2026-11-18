import test from "node:test";
import assert from "node:assert/strict";
import { xrayDiff, renderSarifReport } from "../src/index.mjs";

const VIBE_CODED_HAZARD_DIFF = `diff --git a/src/api/admin.ts b/src/api/admin.ts
index 1111111..2222222 100644
--- a/src/api/admin.ts
+++ b/src/api/admin.ts
@@ -5,12 +5,17 @@ import { db } from "../db/client";
-export async function deleteOrganization(req, res) {
-  await requireAuth(req, "admin");
-  await auditLog("delete_org", req.params.id);
-  return db.query("DELETE FROM orgs WHERE id = $1", [req.params.id]);
+export async function deleteOrganization(req: any, res: any) {
+  const apiKey = "sk-live-9876543210abcdefghijklmnop";
+  console.log("deleting org", apiKey);
+  try {
+    auditLog("delete_org", req.params.id);
+    return db.query(\`DELETE FROM orgs WHERE id = '\${req.params.id}'\`);
+  } catch (err) {
+    // ignore for now
+  }
 }
diff --git a/prisma/schema.prisma b/prisma/schema.prisma
index 3333333..4444444 100644
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -10,2 +10,3 @@ model Organization {
   id String @id
+  deletedAt DateTime?
 }
diff --git a/tests/admin.test.ts b/tests/admin.test.ts
index 5555555..6666666 100644
--- a/tests/admin.test.ts
+++ b/tests/admin.test.ts
@@ -4,4 +4,2 @@ describe("deleteOrganization", () => {
-  it("rejects unauthenticated callers", async () => {
-    expect(await callDelete()).toBe(401);
-  });
+  it.skip("rejects unauthenticated callers", async () => {});
 });
`;

test("Risk Radar detects silent AI-diff regressions, security hazards, and test weakening", () => {
  const report = xrayDiff(VIBE_CODED_HAZARD_DIFF, {
    title: "Vibe-Coded Admin PR",
  });

  const ruleIds = new Set(report.riskReport.findings.map((f) => f.ruleId));

  assert.ok(ruleIds.has("auth-guard-removed"), "must flag removed requireAuth guard");
  assert.ok(ruleIds.has("secret-leak"), "must flag hardcoded live secret key");
  assert.ok(ruleIds.has("injection-risk"), "must flag SQL template string interpolation");
  assert.ok(ruleIds.has("silent-catch"), "must flag comment-only empty catch block");
  assert.ok(ruleIds.has("unawaited-async"), "must flag dropped await before auditLog()");
  assert.ok(ruleIds.has("type-erosion"), "must flag newly added `: any` params");
  assert.ok(ruleIds.has("weakened-test"), "must flag it.skip and deleted expect() assertion");
  assert.ok(ruleIds.has("schema-drift"), "must flag schema.prisma change without migration");
  assert.ok(ruleIds.has("debug-leftover"), "must flag leftover console.log in API handler");

  // Verify secret redaction in snippet
  const secretFinding = report.riskReport.findings.find((f) => f.ruleId === "secret-leak");
  assert.ok(!secretFinding.snippet.includes("9876543210abcdefghijklmnop"), "secret snippet should be masked");

  assert.ok(report.riskReport.counts.critical >= 3);
  assert.ok(report.riskReport.trustScore < 50);
  assert.ok(["D", "F"].includes(report.riskReport.grade));
});

test("Risk Radar stays quiet on clean, well-tested diffs (Grade A)", () => {
  const cleanDiff = `diff --git a/src/math/clamp.ts b/src/math/clamp.ts
new file mode 100644
--- /dev/null
+++ b/src/math/clamp.ts
@@ -0,0 +1,5 @@
+export function clamp(value: number, min: number, max: number): number {
+  if (value < min) return min;
+  if (value > max) return max;
+  return value;
+}
diff --git a/tests/clamp.test.ts b/tests/clamp.test.ts
new file mode 100644
--- /dev/null
+++ b/tests/clamp.test.ts
@@ -0,0 +1,6 @@
+import { clamp } from "../src/math/clamp";
+test("clamps bounds", () => {
+  expect(clamp(5, 0, 10)).toBe(5);
+  expect(clamp(-2, 0, 10)).toBe(0);
+});
`;
  const report = xrayDiff(cleanDiff);
  assert.equal(report.riskReport.counts.total, 0);
  assert.equal(report.riskReport.trustScore, 100);
  assert.equal(report.riskReport.grade, "A");
});

test("renderSarifReport produces valid OASIS SARIF v2.1.0 schema", () => {
  const report = xrayDiff(VIBE_CODED_HAZARD_DIFF);
  const sarif = renderSarifReport(report.riskReport);

  assert.equal(sarif.version, "2.1.0");
  assert.equal(sarif.runs.length, 1);
  assert.equal(sarif.runs[0].tool.driver.name, "DiffXray");
  assert.ok(sarif.runs[0].results.length >= 8);
  assert.ok(sarif.runs[0].tool.driver.rules.length >= 6);
});
