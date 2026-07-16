import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const source = (...segments) => readFile(join(rootDir, ...segments), "utf8");

async function loadCommerceHttp() {
  const errorsUrl = pathToFileURL(join(rootDir, "lib", "commerce", "errors.ts")).href;
  const http = (await source("lib", "commerce", "http.ts"))
    .replace('import { CommerceError } from "./errors";', `import { CommerceError } from "${errorsUrl}";`)
    .replace('import { enforceMutationRateLimit } from "../security/rate-limit";', "const enforceMutationRateLimit = () => {};")
    .replaceAll("request: Request", "request")
    .replace(": Promise<Record<string, unknown>>", "")
    .replace(" as Record<string, unknown>", "");

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(http)}`);
}

async function loadRateLimit() {
  const errorsUrl = pathToFileURL(join(rootDir, "lib", "commerce", "errors.ts")).href;
  const clientAddressUrl = pathToFileURL(join(rootDir, "lib", "security", "client-address.ts")).href;
  const limiter = (await source("lib", "security", "rate-limit.ts"))
    .replace('import { CommerceError } from "@/lib/commerce/errors";', `import { CommerceError } from "${errorsUrl}";`)
    .replace('import { getTrustedClientAddress } from "@/lib/security/client-address";', `import { getTrustedClientAddress } from "${clientAddressUrl}";`)
    .replace(/type RateLimitPolicy = \{[\s\S]*?\};\n\n/, "")
    .replace(/type RateLimitBucket = \{[\s\S]*?\};\n\n/, "")
    .replace("const buckets = new Map<string, RateLimitBucket>();", "const buckets = new Map();")
    .replace("const policies: Array<[RegExp, string, RateLimitPolicy]> =", "const policies =")
    .replace("const defaultPolicy: RateLimitPolicy =", "const defaultPolicy =")
    .replace("request: Request, now = Date.now()", "request, now = Date.now()")
    .replace("headers: Headers", "headers")
    .replace("now: number", "now");

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(limiter)}`);
}

describe("SEO and storefront security integration contracts", () => {
  test("covers the full browser-to-mutation CSRF and JSON validation boundary", async () => {
    const { assertSameOrigin, readJsonBody } = await loadCommerceHttp();

    assert.doesNotThrow(() => assertSameOrigin(new Request("https://arteffect.test/api/cart", {
      headers: { origin: "https://arteffect.test" }
    })));
    assert.throws(
      () => assertSameOrigin(new Request("https://arteffect.test/api/cart", {
        headers: { origin: "https://attacker.test" }
      })),
      (error) => error.code === "FORBIDDEN_ORIGIN" && error.status === 403
    );
    assert.throws(
      () => assertSameOrigin(new Request("https://arteffect.test/api/cart", {
        headers: { "sec-fetch-site": "cross-site" }
      })),
      (error) => error.code === "FORBIDDEN_ORIGIN" && error.status === 403
    );

    assert.deepEqual(
      await readJsonBody(new Request("https://arteffect.test/api/cart", {
        body: JSON.stringify({ productId: "edition-1" }),
        headers: { "content-type": "application/json" },
        method: "POST"
      })),
      { productId: "edition-1" }
    );
    await assert.rejects(
      readJsonBody(new Request("https://arteffect.test/api/cart", {
        body: "[]",
        headers: { "content-type": "application/json" },
        method: "POST"
      })),
      (error) => error.code === "INVALID_REQUEST"
    );
    await assert.rejects(
      readJsonBody(new Request("https://arteffect.test/api/cart", {
        body: "plain text",
        method: "POST"
      })),
      (error) => error.code === "UNSUPPORTED_MEDIA_TYPE" && error.status === 415
    );
    await assert.rejects(
      readJsonBody(new Request("https://arteffect.test/api/cart", {
        body: "{}",
        headers: { "content-length": String(64 * 1024 + 1), "content-type": "application/json" },
        method: "POST"
      })),
      (error) => error.code === "REQUEST_TOO_LARGE" && error.status === 413
    );
  });

  test("rate-limits by hashed client address with per-endpoint policy windows and safe reset behavior", async () => {
    const { enforceMutationRateLimit } = await loadRateLimit();
    const request = new Request("https://arteffect.test/api/contact", { method: "POST" });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      assert.doesNotThrow(() => enforceMutationRateLimit(request, 1_000));
    }
    assert.throws(
      () => enforceMutationRateLimit(request, 1_000),
      (error) =>
        error.code === "RATE_LIMITED" &&
        error.status === 429 &&
        error.details?.retryAfter === 600
    );
    assert.doesNotThrow(() => enforceMutationRateLimit(request, 601_000));
  });

  test("keeps private API data out of shared caches while allowing bounded public revalidation", async () => {
    const { noStoreHeaders, publicCacheHeaders } = await loadCommerceHttp();

    assert.deepEqual(noStoreHeaders(), {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    });
    assert.deepEqual(publicCacheHeaders(60), {
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=360",
      "X-Content-Type-Options": "nosniff"
    });
  });

  test("enforces least privilege for editorial, account, and initial administrator access", async () => {
    const [access, users] = await Promise.all([
      source("payload", "access.ts"),
      source("payload", "collections", "Users.ts")
    ]);

    assert.match(access, /export function canManageContent[\s\S]*?isAdmin\(user\) \|\| isEditor\(user\)/);
    assert.match(access, /export const publishedOrAuthenticated[\s\S]*?return \{[\s\S]*?isPublished:[\s\S]*?equals: true/);
    assert.match(access, /export const adminOrSelf[\s\S]*?id:[\s\S]*?equals: user\.id/);
    assert.match(access, /export const adminOrCustomer[\s\S]*?customer:[\s\S]*?equals: user\.id/);
    assert.match(access, /firstUserOrAuthenticated[\s\S]*?totalDocs === 0/);
    assert.match(users, /sameSite: "Lax"/);
    assert.match(users, /secure: process\.env\.NODE_ENV === "production"/);
    assert.match(users, /maxLoginAttempts: 5/);
    assert.match(users, /create: \(\{ req: \{ user \} \}\) => !user \|\| user\.role === "admin"/);
  });
});
