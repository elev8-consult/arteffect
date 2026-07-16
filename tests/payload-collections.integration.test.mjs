import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const execFileAsync = promisify(execFile);

function toModuleUrl(...segments) {
  return pathToFileURL(join(rootDir, ...segments)).href;
}

const { authenticated, editorOrAdmin, publishedOrAuthenticated, anyone, noOne } = await import(
  toModuleUrl("payload/access.ts")
);

async function loadCollection(name) {
  const source = await readFile(join(rootDir, "payload/collections", `${name}.ts`), "utf8");
  const transformedSource = source
    .replace(/^import type .*;\n\n/gm, "")
    .replace(new RegExp(`export const ${name}: CollectionConfig =`), `export const ${name} =`)
    .replace(/from "\.\.\/access"/g, `from "${toModuleUrl("payload/access.ts")}"`)
    .replace(/from "\.\.\/fields"/g, `from "${toModuleUrl("payload/fields.ts")}"`);

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`);
}

const collectionModules = await Promise.all(
  [
    "Products",
    "Drops",
    "Artworks",
    "Artists",
    "Causes",
    "ImpactStats",
    "Journal",
    "Testimonials",
    "FAQs",
    "HomepageSections",
    "Media",
    "Newsletter"
  ].map(async (name) => {
    const collectionModule = await loadCollection(name);

    return [name, collectionModule[name]];
  })
);

const collectionsByName = Object.fromEntries(collectionModules);
const collectionsBySlug = Object.fromEntries(
  collectionModules.map(([, collection]) => [collection.slug, collection])
);

function fieldFrom(fields, name) {
  const field = fields.find((candidate) => candidate.name === name);

  assert.ok(field, `Expected field "${name}"`);

  return field;
}

function optionValues(field) {
  return field.options.map((option) => option.value);
}

function assertEditorialCollection(collection, group) {
  assert.equal(collection.admin.group, group);
  assert.equal(collection.access.create, editorOrAdmin);
  assert.equal(collection.access.read, publishedOrAuthenticated);
  assert.equal(collection.access.update, editorOrAdmin);
  assert.equal(collection.access.delete, editorOrAdmin);
  assert.equal(fieldFrom(collection.fields, "isPublished").admin.position, "sidebar");
  assert.equal(fieldFrom(collection.fields, "sortOrder").admin.position, "sidebar");
  assert.equal(collection.timestamps, true);
}

describe("Payload collection integration contracts", () => {
  test(
    "loads the migrated PostgreSQL schema through the Payload Local API",
    { skip: !(process.env.DATABASE_URL || process.env.POSTGRES_URL) },
    async () => {
      const { stdout } = await execFileAsync(
        process.execPath,
        ["--import", "tsx", join(rootDir, "tests/helpers/payload-database-check.ts")],
        { cwd: rootDir, env: process.env }
      );
      const resultLine = stdout.split("\n").find((line) => line.startsWith("PAYLOAD_COUNTS="));
      assert.ok(resultLine, "expected Payload integration result output");
      const counts = JSON.parse(resultLine.slice("PAYLOAD_COUNTS=".length));

      assert.deepEqual(Object.keys(counts).sort(), ["artists", "causes", "drops", "journal", "products"]);
      for (const count of Object.values(counts)) assert.equal(Number.isInteger(count), true);
    }
  );

  test("registers all editable content areas requested for the CMS", () => {
    assert.deepEqual(Object.keys(collectionsBySlug).sort(), [
      "artists",
      "artworks",
      "causes",
      "drops",
      "faqs",
      "homepage-sections",
      "impact-stats",
      "journal",
      "media",
      "newsletter",
      "products",
      "testimonials"
    ]);

    for (const slug of [
      "products",
      "drops",
      "artworks",
      "artists",
      "causes",
      "impact-stats"
    ]) {
      assertEditorialCollection(collectionsBySlug[slug], "Showcase");
    }

    for (const slug of ["journal", "testimonials", "faqs", "homepage-sections"]) {
      assertEditorialCollection(collectionsBySlug[slug], "Content");
    }
  });

  test("models product variants, inventory controls, and showcase relationships", () => {
    const products = collectionsByName.Products;

    assert.equal(products.admin.useAsTitle, "name");
    assert.deepEqual(products.admin.defaultColumns, [
      "name",
      "form",
      "price",
      "totalInventory",
      "isPublished",
      "sortOrder"
    ]);

    const variants = fieldFrom(products.fields, "variants");
    assert.equal(variants.type, "array");
    assert.equal(variants.minRows, 1);

    const variantSku = fieldFrom(variants.fields, "sku");
    assert.equal(variantSku.required, true);
    assert.match(variantSku.admin.description, /fulfillment/i);

    for (const numericInventoryField of ["inventory", "reserved", "lowStockThreshold"]) {
      const field = fieldFrom(variants.fields, numericInventoryField);

      assert.equal(field.type, "number");
      assert.equal(field.min, 0);
    }

    assert.equal(fieldFrom(products.fields, "totalInventory").admin.position, "sidebar");

    for (const [fieldName, relationTo] of [
      ["drop", "drops"],
      ["artist", "artists"],
      ["artwork", "artworks"],
      ["cause", "causes"]
    ]) {
      assert.equal(fieldFrom(products.fields, fieldName).relationTo, relationTo);
    }
  });

  test("models drops as batches with product links, funding allocation, and lifecycle state", () => {
    const drops = collectionsByName.Drops;

    const status = fieldFrom(drops.fields, "status");
    assert.equal(status.defaultValue, "draft");
    assert.deepEqual(optionValues(status), ["draft", "preview", "live", "sold-out", "closed"]);

    const products = fieldFrom(drops.fields, "products");
    assert.equal(products.relationTo, "products");
    assert.equal(products.hasMany, true);

    for (const relationship of ["artist", "artwork", "cause"]) {
      assert.equal(fieldFrom(drops.fields, relationship).required, true);
    }

    const allocation = fieldFrom(drops.fields, "allocation");
    const percentage = fieldFrom(allocation.fields, "percentage");
    assert.equal(percentage.min, 0);
    assert.equal(percentage.max, 100);

    assert.equal(fieldFrom(drops.fields, "batchSize").min, 1);
    assert.equal(fieldFrom(drops.fields, "reserved").min, 0);
    assert.equal(fieldFrom(drops.fields, "isCurrent").admin.position, "sidebar");
  });

  test("keeps artist, artwork, NGO, and impact records ready for storytelling", () => {
    const artists = collectionsByName.Artists;
    const artworks = collectionsByName.Artworks;
    const causes = collectionsByName.Causes;
    const impactStats = collectionsByName.ImpactStats;

    assert.equal(fieldFrom(artists.fields, "portraitGallery").type, "array");
    assert.equal(fieldFrom(artists.fields, "facts").minRows, 1);

    const details = fieldFrom(artworks.fields, "details");
    assert.equal(details.minRows, 1);
    assert.equal(fieldFrom(details.fields, "x").max, 100);
    assert.equal(fieldFrom(details.fields, "y").max, 100);

    assert.equal(fieldFrom(causes.fields, "legalName").label, "Legal NGO name");
    assert.equal(fieldFrom(fieldFrom(causes.fields, "contact").fields, "email").type, "email");
    assert.deepEqual(optionValues(fieldFrom(fieldFrom(causes.fields, "verification").fields, "status")), [
      "pending",
      "verified",
      "needs-review"
    ]);

    assert.deepEqual(optionValues(fieldFrom(impactStats.fields, "metricType")), [
      "projected",
      "committed",
      "transferred",
      "verified"
    ]);
    assert.equal(fieldFrom(impactStats.fields, "drop").relationTo, "drops");
    assert.equal(fieldFrom(impactStats.fields, "cause").relationTo, "causes");
    assert.match(fieldFrom(impactStats.fields, "source").admin.description, /source|verification/i);
  });

  test("supports editorial publishing, testimonials, FAQs, homepage curation, media, and newsletter capture", () => {
    const journal = collectionsByName.Journal;
    const testimonials = collectionsByName.Testimonials;
    const faqs = collectionsByName.FAQs;
    const homepageSections = collectionsByName.HomepageSections;
    const media = collectionsByName.Media;
    const newsletter = collectionsByName.Newsletter;
    const artists = collectionsByName.Artists;

    assert.equal(fieldFrom(journal.fields, "content").type, "richText");
    assert.equal(fieldFrom(journal.fields, "relatedDrop").relationTo, "drops");
    assert.equal(fieldFrom(journal.fields, "relatedCause").relationTo, "causes");

    assert.equal(fieldFrom(testimonials.fields, "quote").maxLength, 700);
    assert.equal(fieldFrom(testimonials.fields, "rating").max, 5);
    assert.equal(fieldFrom(testimonials.fields, "relatedDrop").relationTo, "drops");

    assert.equal(fieldFrom(faqs.fields, "answer").type, "richText");
    assert.ok(optionValues(fieldFrom(faqs.fields, "category")).includes("shipping-returns"));

    assert.deepEqual(optionValues(fieldFrom(homepageSections.fields, "section")), [
      "hero",
      "products",
      "drop",
      "design",
      "artist",
      "cause",
      "impact",
      "journal",
      "testimonials",
      "faq",
      "newsletter"
    ]);
    assert.equal(fieldFrom(homepageSections.fields, "featuredProducts").hasMany, true);
    assert.equal(fieldFrom(homepageSections.fields, "featuredStats").relationTo, "impact-stats");

    assert.equal(media.access.read, anyone);
    assert.equal(media.upload.staticDir, join(rootDir, "public/media"));
    assert.deepEqual(media.upload.mimeTypes, ["image/*", "video/*"]);
    assert.equal(fieldFrom(artists.fields, "processVideo").relationTo, "media");

    assert.equal(newsletter.admin.group, "Marketing");
    assert.equal(newsletter.access.create, noOne);
    assert.equal(newsletter.access.read, authenticated);
    assert.equal(fieldFrom(newsletter.fields, "email").unique, true);
    assert.equal(fieldFrom(fieldFrom(newsletter.fields, "consent").fields, "acceptedMarketing").required, true);
  });
});
