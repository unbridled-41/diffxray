/**
 * @fileoverview Built-in interactive showcase presets for the DiffXray Live Web Studio.
 */

const DEMO_FAKE_KEY = "sk-" + "live-4910293847561029384756abcd";

export const PRESETS = {
  "vibe-auth": {
    id: "vibe-auth",
    label: "1. Vibe-Coded Auth & Billing PR (5 Hidden Bugs)",
    title: "PR #418: Migrate checkout & organization auth to v2 service",
    sourceLabel: "acme/cloud-billing#418",
    workspaceFiles: [
      {
        path: "src/routes/enterprise-sso.ts",
        content: `import { verifySessionToken } from "../auth/session";\nexport async function handleSsoCallback(req) {\n  return verifySessionToken(req.headers.authorization);\n}\n`,
      },
      {
        path: "src/workers/subscription-renewal.ts",
        content: `import { verifySessionToken } from "../auth/session";\nimport { calculateInvoiceTotal } from "../services/invoice";\nexport async function renewAll(token) {\n  verifySessionToken(token);\n  return calculateInvoiceTotal([], 0.08);\n}\n`,
      },
      {
        path: "src/webhooks/stripe-hook.ts",
        content: `import { recordAuditEvent } from "../audit/logger";\nexport async function onStripeEvent(evt) {\n  return recordAuditEvent("stripe", evt.id);\n}\n`,
      },
    ],
    rawDiff: `diff --git a/src/legacy/billing-calc.ts b/src/legacy/billing-calc.ts
deleted file mode 100644
index 1111111..0000000
--- a/src/legacy/billing-calc.ts
+++ /dev/null
@@ -1,14 +0,0 @@
-export function calculateInvoiceTotal(items: Array<{ price: number; qty: number }>, taxRate: number) {
-  let subtotal = 0;
-  for (const item of items) {
-    subtotal += item.price * item.qty;
-  }
-  const tierDiscount = subtotal >= 5000 ? Math.round(subtotal * 0.08) : 0;
-  const netAmount = Math.max(0, subtotal - tierDiscount);
-  const taxAmount = Math.round(netAmount * taxRate);
-  return {
-    subtotal,
-    tierDiscount,
-    taxAmount,
-    grandTotal: netAmount + taxAmount,
-  };
-}
diff --git a/src/services/invoice.ts b/src/services/invoice.ts
new file mode 100644
index 0000000..2222222
--- /dev/null
+++ b/src/services/invoice.ts
@@ -0,0 +1,22 @@
+import { verifySessionToken } from "../auth/session";
+
+export function calculateInvoiceTotal(items: Array<{ price: number; qty: number }>, taxRate: number) {
+  let subtotal = 0;
+  for (const item of items) {
+    subtotal += item.price * item.qty;
+  }
+  const tierDiscount = subtotal >= 5000 ? Math.round(subtotal * 0.12) : 0;
+  const netAmount = Math.max(0, subtotal - tierDiscount);
+  const taxAmount = Math.round(netAmount * taxRate);
+  return {
+    subtotal,
+    tierDiscount,
+    taxAmount,
+    grandTotal: netAmount + taxAmount,
+  };
+}
+
+export async function purgeStaleInvoices(tenantId: any) {
+  const fallbackKey = "${DEMO_FAKE_KEY}";
+  return db.execute(\`DELETE FROM invoices WHERE tenant_id = '\${tenantId}'\`);
+}
diff --git a/src/auth/session.ts b/src/auth/session.ts
index 3333333..4444444 100644
--- a/src/auth/session.ts
+++ b/src/auth/session.ts
@@ -1,8 +1,11 @@
-export function verifySessionToken(bearer: string) {
-  if (!bearer || !bearer.startsWith("Bearer ")) {
-    throw new Error("Unauthorized");
+export function verifySessionToken(bearer: string, requiredOrgId: string) {
+  try {
+    if (!bearer || !bearer.startsWith("Bearer ")) {
+      throw new Error("Unauthorized");
+    }
+    return { ok: true, orgId: requiredOrgId };
+  } catch (err) {
+    // swallow transient decode error
   }
-  return { ok: true };
 }
diff --git a/src/api/checkout-controller.ts b/src/api/checkout-controller.ts
index 5555555..6666666 100644
--- a/src/api/checkout-controller.ts
+++ b/src/api/checkout-controller.ts
@@ -8,7 +8,6 @@ import { calculateInvoiceTotal } from "../services/invoice";
 export async function postCheckout(req: Request, res: Response) {
-  await requireAuth(req);
-  await recordAuditEvent("checkout.started", req.user.id);
+  recordAuditEvent("checkout.started", req.user?.id);
   const summary = calculateInvoiceTotal(req.body.items, 0.0825);
   return res.json(summary);
 }
diff --git a/prisma/schema.prisma b/prisma/schema.prisma
index 7777777..8888888 100644
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -12,3 +12,5 @@ model Invoice {
   id        String   @id @default(cuid())
   total     Int
+  orgId     String
+  settledAt DateTime?
 }
diff --git a/tests/checkout.test.ts b/tests/checkout.test.ts
index 9999999..aaaaaaa 100644
--- a/tests/checkout.test.ts
+++ b/tests/checkout.test.ts
@@ -3,6 +3,4 @@ describe("POST /checkout", () => {
-  it("blocks unauthenticated checkout requests", async () => {
-    const res = await request(app).post("/checkout");
-    expect(res.status).toBe(401);
-  });
+  it.skip("blocks unauthenticated checkout requests", async () => {});
 });
diff --git a/package-lock.json b/package-lock.json
index bbbbbbb..ccccccc 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -1,4 +1,18 @@
 {
   "name": "cloud-billing",
-  "lockfileVersion": 2
+  "lockfileVersion": 3,
+  "packages": {
+    "": { "version": "2.4.0" },
+    "node_modules/stripe": { "version": "16.9.0" },
+    "node_modules/zod": { "version": "3.24.1" },
+    "node_modules/hono": { "version": "4.6.8" },
+    "node_modules/jose": { "version": "5.9.6" }
+  }
 }
`,
  },

  "clean-refactor": {
    id: "clean-refactor",
    label: "2. Clean Architecture Extraction (Grade A · 76% Noise Collapsed)",
    title: "PR #209: Extract rate-limiter token bucket into dedicated core module",
    sourceLabel: "velo/edge-gateway#209",
    workspaceFiles: [
      {
        path: "src/middleware/public-api.ts",
        content: `import { consumeTokenBucket } from "../ratelimit/token-bucket";\nexport function guardPublicApi(ip: string) {\n  return consumeTokenBucket(ip, 60);\n}\n`,
      },
    ],
    rawDiff: `diff --git a/src/server/gateway.ts b/src/server/gateway.ts
index 1111111..2222222 100644
--- a/src/server/gateway.ts
+++ b/src/server/gateway.ts
@@ -1,18 +1,5 @@
+import { consumeTokenBucket } from "../ratelimit/token-bucket";
+
-export function consumeTokenBucket(key: string, rpmLimit: number): boolean {
-  const now = Date.now();
-  const bucket = buckets.get(key) ?? { tokens: rpmLimit, updatedAt: now };
-  const elapsedSec = Math.max(0, (now - bucket.updatedAt) / 1000);
-  const replenished = Math.min(rpmLimit, bucket.tokens + elapsedSec * (rpmLimit / 60));
-  if (replenished < 1) {
-    buckets.set(key, { tokens: replenished, updatedAt: now });
-    return false;
-  }
-  buckets.set(key, { tokens: replenished - 1, updatedAt: now });
-  return true;
-}
-
 export function handleGatewayRequest(ip: string) {
   return consumeTokenBucket(ip, 120);
 }
diff --git a/src/ratelimit/token-bucket.ts b/src/ratelimit/token-bucket.ts
new file mode 100644
index 0000000..3333333
--- /dev/null
+++ b/src/ratelimit/token-bucket.ts
@@ -0,0 +1,15 @@
+const buckets = new Map<string, { tokens: number; updatedAt: number }>();
+
+export function consumeTokenBucket(key: string, rpmLimit: number): boolean {
+  const now = Date.now();
+  const bucket = buckets.get(key) ?? { tokens: rpmLimit, updatedAt: now };
+  const elapsedSec = Math.max(0, (now - bucket.updatedAt) / 1000);
+  const replenished = Math.min(rpmLimit, bucket.tokens + elapsedSec * (rpmLimit / 60));
+  if (replenished < 1) {
+    buckets.set(key, { tokens: replenished, updatedAt: now });
+    return false;
+  }
+  buckets.set(key, { tokens: replenished - 1, updatedAt: now });
+  return true;
+}
diff --git a/tests/token-bucket.test.ts b/tests/token-bucket.test.ts
new file mode 100644
index 0000000..4444444
--- /dev/null
+++ b/tests/token-bucket.test.ts
@@ -0,0 +1,8 @@
+import { consumeTokenBucket } from "../src/ratelimit/token-bucket";
+
+test("allows burst within limit and rejects overflow", () => {
+  expect(consumeTokenBucket("ip-1", 2)).toBe(true);
+  expect(consumeTokenBucket("ip-1", 2)).toBe(true);
+  expect(consumeTokenBucket("ip-1", 2)).toBe(false);
+});
`,
  },
};
