import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

async function source(...segments) {
  return readFile(join(rootDir, ...segments), "utf8");
}

function moduleUrl(...segments) {
  return pathToFileURL(join(rootDir, ...segments)).href;
}

async function loadStaticCauses() {
  const typescript = await import("typescript");
  const causeSource = await source("lib", "cms", "causes.ts");
  const product = {
    displayPrice: "$80.00",
    form: "Edition",
    image: "https://example.test/edition.jpg",
    imageAlt: "Edition object",
    name: "Cedar edition",
    slug: "cedar-edition"
  };
  const javascript = typescript.transpileModule(
    causeSource
      .replace('import { unstable_noStore as noStore } from "next/cache";', "const noStore = () => undefined;")
      .replace('import { staticCauseProfiles } from "@/data/causes";', `import { staticCauseProfiles } from "${moduleUrl("data", "causes.ts")}";`)
      .replace('import { normalizeExternalUrl } from "@/lib/artist-links";', `import { normalizeExternalUrl } from "${moduleUrl("lib", "artist-links.ts")}";`)
      .replace('import { hasPayloadDatabase } from "@/lib/cms/env";', "const hasPayloadDatabase = () => false;")
      .replace('import { getPayloadClient } from "@/lib/cms/payload";', "const getPayloadClient = async () => { throw new Error(\"Payload must not be used in static tests.\"); };")
      .replace('import { getShopProducts } from "@/lib/cms/products";', `const getShopProducts = async () => ({ docs: [${JSON.stringify(product)}] });`),
    { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }
  ).outputText;

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(javascript)}`);
}

describe("Cause and NGO showcase", () => {
  test("ships an indexed NGO directory and a resilient, structured profile route", async () => {
    const [directory, profile, sitemap] = await Promise.all([
      source("app", "(site)", "causes", "page.tsx"),
      source("app", "(site)", "causes", "[slug]", "page.tsx"),
      source("app", "sitemap.ts")
    ]);

    assert.match(directory, /await getCauseDirectory\(\)/);
    assert.match(directory, /"@type": "ItemList"/);
    assert.match(directory, /<CauseDirectory causes=\{causes\}/);
    assert.match(profile, /export async function generateMetadata/);
    assert.match(profile, /CauseNotFoundError/);
    assert.match(profile, /notFound\(\)/);
    assert.match(profile, /"@type": "Organization"/);
    assert.match(profile, /sameAs: cause\.website \? \[cause\.website\] : \[\]/);
    assert.match(profile, /<CauseProfile cause=\{cause\}/);
    assert.match(sitemap, /getPublishedCauseSlugs/);
    assert.match(sitemap, /\/causes\/\$\{slug\}/);
  });

  test("tells each NGO story through mission, projects, photos, funding share, and progress", async () => {
    const [directory, profile] = await Promise.all([
      source("components", "causes", "cause-directory.tsx"),
      source("components", "causes", "cause-profile.tsx")
    ]);

    assert.match(directory, /View \$\{cause\.name\}'s impact profile/);
    assert.match(directory, /Verified partner/);
    assert.match(profile, /id="mission"/);
    assert.match(profile, /Projects in focus/);
    assert.match(profile, /cause\.programs\.map/);
    assert.match(profile, /Supported by ArtEffect/);
    assert.match(profile, /cause\.drops\.map/);
    assert.match(profile, /drop\.donationPercentage/);
    assert.match(profile, /aria-pressed=\{selectedDrop === index\}/);
    assert.match(profile, /Progress ledger/);
    assert.match(profile, /cause\.metrics\.map/);
    assert.match(profile, /Field notes/);
    assert.match(profile, /cause\.gallery\.map/);
    assert.match(profile, /Read the updates/);
    assert.match(profile, /cause\.reports\.map/);
    assert.match(profile, /useReducedMotion/);
  });

  test("loads only published CMS causes and supporting drops, with safe gallery and funding data", async () => {
    const [causes, profile, migration] = await Promise.all([
      source("lib", "cms", "causes.ts"),
      source("components", "causes", "cause-profile.tsx"),
      source("payload", "migrations", "20260714010000_cause_gallery_and_donation.ts")
    ]);

    assert.match(causes, /collection: "causes"/);
    assert.match(causes, /isPublished: \{ equals: true \}/);
    assert.match(causes, /slug: \{ equals: slug \}/);
    assert.match(causes, /collection: "drops"/);
    assert.match(causes, /"cause\.slug": \{ equals: slug \}/);
    assert.match(causes, /donationPercentage: percentage\(doc\.donationPercentage\)/);
    assert.doesNotMatch(causes, /derivedDonationPercentage|records\(doc\.allocation\)/);
    assert.match(causes, /gallery: gallery\.length \? gallery : uniqueImages\(dropPhotos\)/);
    assert.match(causes, /normalizeExternalUrl\(optionalText\(doc\.website\)\)/);
    assert.doesNotMatch(causes, /function safeExternalUrl/);
    assert.doesNotMatch(profile, /normalizeExternalUrl/);
    assert.match(causes, /Math\.min\(100, nonNegativeNumber\(doc\.progress, 0\)\)/);
    assert.match(migration, /"causes_gallery_order_idx"[\s\S]*?\("_order"\)/);
    assert.match(migration, /"causes_gallery_parent_id_idx"[\s\S]*?\("_parent_id"\)/);
  });

  test("returns complete fallback NGO data without Payload and rejects unknown slugs", async () => {
    const { CauseNotFoundError, getCauseDirectory, getCauseProfile, getPublishedCauseSlugs } = await loadStaticCauses();
    const [directory, profile, slugs] = await Promise.all([
      getCauseDirectory(),
      getCauseProfile("green-cedar-collective"),
      getPublishedCauseSlugs()
    ]);

    assert.deepEqual(directory, [{
      focus: "Native reforestation and three-year sapling care",
      image: profile.image,
      name: "Green Cedar Collective",
      slug: "green-cedar-collective",
      summary: profile.summary,
      verificationStatus: "verified"
    }]);
    assert.deepEqual(slugs, ["green-cedar-collective"]);
    assert.equal(profile.drops[0].donationPercentage, 75);
    assert.equal(profile.programs.length, 2);
    assert.equal(profile.gallery.length, 3);
    assert.deepEqual(profile.products.map((product) => product.slug), ["cedar-edition"]);

    await assert.rejects(() => getCauseProfile("unknown-cause"), CauseNotFoundError);
  });
});
