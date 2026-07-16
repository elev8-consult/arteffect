import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const source = (...segments) => readFile(join(rootDir, ...segments), "utf8");

describe("SEO, caching, and security backend", () => {
  test("publishes canonical social metadata, structured data, sitemap, and private crawler rules", async () => {
    const [layout, sitemap, robots, product, artist, cause, drop, journal] = await Promise.all([
      source("app", "(site)", "layout.tsx"),
      source("app", "sitemap.ts"),
      source("app", "robots.ts"),
      source("app", "(site)", "shop", "[slug]", "page.tsx"),
      source("app", "(site)", "artists", "[slug]", "page.tsx"),
      source("app", "(site)", "causes", "[slug]", "page.tsx"),
      source("app", "(site)", "drops", "[slug]", "page.tsx"),
      source("app", "(site)", "journal", "[slug]", "page.tsx")
    ]);

    assert.match(layout, /alternates:\s*\{[\s\S]*?canonical:\s*"\/"/);
    assert.match(layout, /"@type": "WebSite"/);
    assert.match(layout, /"@type": "Organization"/);
    for (const detailPage of [product, artist, cause, drop, journal]) {
      assert.match(detailPage, /alternates:\s*\{ canonical:/);
      assert.match(detailPage, /openGraph:/);
      assert.match(detailPage, /twitter:/);
    }
    assert.match(sitemap, /export const revalidate = 3600/);
    assert.doesNotMatch(sitemap, /lastModified:\s*new Date\(\)/);
    assert.match(robots, /"\/admin\/"/);
    assert.match(robots, /"\/api\/"/);
  });

  test("sets defensive response headers, optimized media caching, and bounded mutation limits", async () => {
    const [nextConfig, http, limiter, newsletterRoute, newsletterCollection, tokens] = await Promise.all([
      source("next.config.mjs"),
      source("lib", "commerce", "http.ts"),
      source("lib", "security", "rate-limit.ts"),
      source("app", "api", "newsletter", "route.ts"),
      source("payload", "collections", "Newsletter.ts"),
      source("lib", "commerce", "tokens.ts")
    ]);

    for (const header of [
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "Permissions-Policy",
      "Referrer-Policy",
      "X-Content-Type-Options"
    ]) {
      assert.match(nextConfig, new RegExp(header));
    }
    assert.match(nextConfig, /minimumCacheTTL:\s*86400/);
    assert.match(http, /enforceMutationRateLimit\(request\)/);
    assert.match(limiter, /"RATE_LIMITED"/);
    assert.match(limiter, /"newsletter", \{ limit: 5/);
    assert.match(newsletterRoute, /assertSameOrigin\(request\)/);
    assert.match(newsletterRoute, /readJsonBody\(request\)/);
    assert.match(newsletterCollection, /create:\s*noOne/);
    assert.match(tokens, /HttpOnly; SameSite=Lax/);
    assert.match(tokens, /Priority=High/);
  });

  test("keeps editor content access separate from administrator-only commerce access", async () => {
    const [users, access, products, orders] = await Promise.all([
      source("payload", "collections", "Users.ts"),
      source("payload", "access.ts"),
      source("payload", "collections", "Products.ts"),
      source("payload", "collections", "Orders.ts")
    ]);

    assert.match(users, /value:\s*"editor"/);
    assert.match(users, /maxLoginAttempts:\s*5/);
    assert.match(access, /canManageContent/);
    assert.match(products, /editorOrAdmin as authenticated/);
    assert.doesNotMatch(orders, /editorOrAdmin/);
  });
});
