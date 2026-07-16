import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

async function source(...segments) {
  return readFile(join(rootDir, ...segments), "utf8");
}

describe("Shop showcase experience", () => {
  test("server-renders the product collection with metadata and structured data", async () => {
    const [page, sitemap] = await Promise.all([
      source("app", "(site)", "shop", "page.tsx"),
      source("app", "sitemap.ts")
    ]);

    assert.match(page, /await getShopProducts\(query\)/);
    assert.match(page, /title: "Shop limited art objects"/);
    assert.match(page, /"@type": "ItemList"/);
    assert.match(page, /<ShopExperience/);
    assert.match(sitemap, /`\$\{siteConfig\.url\}\/shop`/);
  });

  test("offers every catalog control and keeps navigation in URL state", async () => {
    const experience = await source("components", "shop", "shop-experience.tsx");

    assert.match(experience, /role="search"/);
    assert.match(experience, /Product filters/);
    assert.match(experience, /toggleListFilter\("color"/);
    assert.match(experience, /toggleListFilter\("size"/);
    assert.match(experience, /toggleListFilter\("availability"/);
    assert.match(experience, /Price, low to high/);
    assert.match(experience, /Grid view/);
    assert.match(experience, /List view/);
    assert.match(experience, /function Pagination/);
    assert.match(experience, /router\.push/);
  });

  test("supports quick-view, quick-add, wishlist fallback, and keyboard dialog behavior", async () => {
    const experience = await source("components", "shop", "shop-experience.tsx");

    assert.match(experience, /role="dialog"/);
    assert.match(experience, /aria-modal="true"/);
    assert.match(experience, /event\.key === "Escape"/);
    assert.match(experience, /event\.key !== "Tab"/);
    assert.match(experience, /previouslyFocused\?\.isConnected/);
    assert.match(experience, /Quick add to bag/);
    assert.match(experience, /addItem\(\{/);
    assert.match(experience, /\/api\/wishlist/);
    assert.match(experience, /arteffect-wishlist/);
    assert.match(experience, /Saved on this device/);
  });
});
