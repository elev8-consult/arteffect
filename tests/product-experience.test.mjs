import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

async function source(...segments) {
  return readFile(join(rootDir, ...segments), "utf8");
}

describe("Product detail experience", () => {
  test("provides product metadata and safe Product schema markup", async () => {
    const page = await source("app", "shop", "[slug]", "page.tsx");

    assert.match(page, /export async function generateMetadata/);
    assert.match(page, /alternates: \{ canonical: `\/shop\/\$\{product\.slug\}` \}/);
    assert.match(page, /openGraph:/);
    assert.match(page, /"@type": "Product"/);
    assert.match(page, /"@type": "AggregateOffer"/);
    assert.match(page, /JSON\.stringify\(structuredData\)\.replace\(\/</);
    assert.match(page, /<ProductExperience product=\{product\} products=\{catalog\.docs\} related=\{related\}/);
  });

  test("ships an accessible lifestyle gallery with thumbnails and an escape-close zoom dialog", async () => {
    const experience = await source("components", "shop", "product-experience.tsx");

    assert.match(experience, /function ProductGallery/);
    assert.match(experience, /aria-label="Zoom product image"/);
    assert.match(experience, /aria-label=\{`Show image \$\{index \+ 1\}`\}/);
    assert.match(experience, /aria-pressed=\{activeImage === index\}/);
    assert.match(experience, /function GalleryDialog/);
    assert.match(experience, /role="dialog"/);
    assert.match(experience, /aria-modal="true"/);
    assert.match(experience, /event\.key === "Escape"/);
    assert.match(experience, /previousFocus\?\.isConnected/);
    assert.match(experience, /useReducedMotion/);
  });

  test("keeps variant choice, bag actions, wishlist, and recently viewed state resilient", async () => {
    const experience = await source("components", "shop", "product-experience.tsx");

    assert.match(experience, /const availableVariants = useMemo/);
    assert.match(experience, /function chooseOption\(option: "color" \| "size"/);
    assert.match(experience, /aria-label=\{`Choose \$\{titleCase\(color\)\}`\}/);
    assert.match(experience, /function addToBag\(\)/);
    assert.match(experience, /addItem\(\{/);
    assert.match(experience, /arteffect-wishlist/);
    assert.match(experience, /arteffect-recently-viewed/);
    assert.match(experience, /try \{/);
    assert.match(experience, /Wishlist remains available for the current visit/);
    assert.match(experience, /Edition unavailable/);
    assert.match(experience, /Add to bag/);
  });

  test("connects the object to its story and supplies collector aftercare content", async () => {
    const experience = await source("components", "shop", "product-experience.tsx");

    assert.match(experience, /<StoryLink label="Artist"/);
    assert.match(experience, /<StoryLink label="Current drop"/);
    assert.match(experience, /<StoryLink label="Original artwork"/);
    assert.match(experience, /<StoryLink label="Cause partner"/);
    assert.match(experience, /<DetailRow title="Materials">/);
    assert.match(experience, /<DetailRow title="Care">/);
    assert.match(experience, /<DetailRow title="Shipping & returns">/);
    assert.match(experience, /aria-labelledby="reviews-title"/);
    assert.match(experience, /title="More from the archive" products=\{related\}/);
    assert.match(experience, /title="Recently viewed" products=\{recent\}/);
    assert.match(experience, /fixed inset-x-0 bottom-0/);
  });
});
