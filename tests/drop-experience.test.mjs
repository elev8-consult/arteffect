import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

async function source(...segments) {
  return readFile(join(rootDir, ...segments), "utf8");
}

describe("Drop editorial showcase", () => {
  test("renders a dedicated, indexed drop route with resilient metadata and collection schema", async () => {
    const page = await source("app", "(site)", "drops", "[slug]", "page.tsx");

    assert.match(page, /export async function generateMetadata/);
    assert.match(page, /alternates: \{ canonical: `\/drops\/\$\{drop\.slug\}` \}/);
    assert.match(page, /openGraph:/);
    assert.match(page, /DropNotFoundError/);
    assert.match(page, /notFound\(\)/);
    assert.match(page, /"@type": "CollectionPage"/);
    assert.match(page, /"@type": "ItemList"/);
    assert.match(page, /"@type": "Product"/);
    assert.match(page, /JSON\.stringify\(structuredData\)\.replace\(\/<\/g, "\\\\u003c"\)/);
    assert.match(page, /<DropExperience drop=\{drop\} \/>/);
  });

  test("tells the complete batch story through products, artwork, artist, cause, and impact", async () => {
    const experience = await source("components", "drops", "drop-experience.tsx");

    assert.match(experience, /01 \/ The objects/);
    assert.match(experience, /02 \/ The artwork/);
    assert.match(experience, /03 \/ The artist/);
    assert.match(experience, /04 \/ The cause/);
    assert.match(experience, /05 \/ The impact/);
    assert.match(experience, /id="editions"/);
    assert.match(experience, /id="design"/);
    assert.match(experience, /id="artist"/);
    assert.match(experience, /id="cause"/);
    assert.match(experience, /id="impact"/);
    assert.match(experience, /drop\.products\.map\(\(product\) => <ProductCard/);
    assert.match(experience, /drop\.artwork\.details\.map/);
    assert.match(experience, /drop\.artist\.facts\.map/);
    assert.match(experience, /drop\.cause\.metrics\.map/);
    assert.match(experience, /drop\.allocation\.map/);
    assert.match(experience, /drop\.milestones\.map/);
    assert.match(experience, /drop\.gallery\.map\(\(image, index\) =>/);
    assert.match(experience, /image\.caption \? <figcaption/);
  });

  test("communicates availability, countdown timing, and sold-out recovery accessibly", async () => {
    const experience = await source("components", "drops", "drop-experience.tsx");

    assert.match(experience, /drop\.products\.every\(productIsSoldOut\)/);
    assert.match(experience, /product\.availability === "out-of-stock" \|\| !product\.variants\.some/);
    assert.match(experience, /All objects reserved/);
    assert.match(experience, /This batch is fully reserved/);
    assert.match(experience, /Sold out/);
    assert.match(experience, /Explore other editions/);
    assert.match(experience, /function DropCountdown/);
    assert.match(experience, /<DropCountdown opensAt=\{drop\.opensAt\} closesAt=\{drop\.closesAt\}/);
    assert.match(experience, /if \(current >= target\) window\.clearInterval\(timer\)/);
    assert.match(experience, /Opens in/);
    assert.match(experience, /aria-live="polite"/);
    assert.match(experience, /Batch closed/);
    assert.match(experience, /useReducedMotion/);
    assert.match(experience, /function safeHref\(href: string\)/);
    assert.match(experience, /href\.startsWith\("#"\) \|\| \(href\.startsWith\("\/"\) && !href\.startsWith\("\/\/"\)\)/);
  });

  test("keeps drop content editable and maps only published CMS records to a safe showcase model", async () => {
    const [collection, drops] = await Promise.all([
      source("payload", "collections", "Drops.ts"),
      source("lib", "cms", "drops.ts")
    ]);

    assert.match(collection, /name: "batchSize"[\s\S]*?min: 1/);
    assert.match(collection, /name: "reserved"[\s\S]*?min: 0/);
    assert.match(collection, /value: "sold-out"/);
    assert.match(collection, /name: "closesAt"[\s\S]*?required: true/);
    assert.match(collection, /name: "products"[\s\S]*?relationTo: "products"[\s\S]*?hasMany: true/);
    assert.match(collection, /relationTo: "artists"[\s\S]*?required: true/);
    assert.match(collection, /relationTo: "artworks"[\s\S]*?required: true/);
    assert.match(collection, /relationTo: "causes"[\s\S]*?required: true/);
    assert.match(collection, /name: "milestones"[\s\S]*?minRows: 1/);
    assert.match(collection, /name: "allocation"[\s\S]*?percentage[\s\S]*?max: 100/);
    assert.match(collection, /name: "cta"[\s\S]*?ctaFields\(\)/);

    assert.match(drops, /collection: "drops"/);
    assert.match(drops, /slug: \{ equals: slug \}/);
    assert.match(drops, /isPublished: \{ equals: true \}/);
    assert.match(drops, /reserved = Math\.min\(batchSize, nonNegativeNumber/);
    assert.match(drops, /batchSize = positiveNumber\(doc\.batchSize/);
    assert.match(drops, /validDate\(doc\.closesAt\)/);
    assert.match(drops, /opensAt: validDate\(doc\.opensAt\)/);
    assert.match(drops, /requiredRelationship\(doc\.artist, "name"\)/);
    assert.doesNotMatch(drops, /mapArtist\(record\(doc\.artist\), fallback\.artist\)/);
    assert.match(drops, /function status\(value: unknown\): DropStatus/);
    assert.match(drops, /\? value : "draft"/);
    assert.match(drops, /throw new DropNotFoundError\(\)/);
  });
});
