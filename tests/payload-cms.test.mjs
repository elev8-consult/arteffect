import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

function fromRoot(...segments) {
  return join(rootDir, ...segments);
}

function toModuleUrl(...segments) {
  return pathToFileURL(fromRoot(...segments)).href;
}

async function readText(...segments) {
  return readFile(fromRoot(...segments), "utf8");
}

const showcaseCollections = [
  ["Products", "products"],
  ["Drops", "drops"],
  ["Artworks", "artworks"],
  ["Artists", "artists"],
  ["Causes", "causes"],
  ["ImpactStats", "impact-stats"]
];

const contentCollections = [
  ["Journal", "journal"],
  ["Testimonials", "testimonials"],
  ["FAQs", "faqs"],
  ["HomepageSections", "homepage-sections"]
];

describe("Payload access policies", () => {
  test("allows only authenticated users to mutate protected collections", async () => {
    const { authenticated, anyone, editorOrAdmin } = await import(toModuleUrl("payload/access.ts"));

    assert.equal(authenticated({ req: { user: { id: "admin", role: "admin" } } }), true);
    assert.equal(authenticated({ req: { user: { id: "customer", role: "customer" } } }), false);
    assert.equal(authenticated({ req: { user: null } }), false);
    assert.equal(editorOrAdmin({ req: { user: { id: "editor", role: "editor" } } }), true);
    assert.equal(editorOrAdmin({ req: { user: { id: "customer", role: "customer" } } }), false);
    assert.equal(anyone(), true);
  });

  test("allows bootstrap user creation only before the first user exists", async () => {
    const { firstUserOrAuthenticated } = await import(toModuleUrl("payload/access.ts"));

    assert.equal(
      await firstUserOrAuthenticated({
        req: {
          user: { id: "admin", role: "admin" },
          payload: {
            count: async () => {
              throw new Error("authenticated users should not count users");
            }
          }
        }
      }),
      true
    );

    assert.equal(
      await firstUserOrAuthenticated({
        req: {
          user: null,
          payload: {
            count: async (args) => {
              assert.deepEqual(args, {
                collection: "users"
              });

              return { totalDocs: 0 };
            }
          }
        }
      }),
      true
    );

    assert.equal(
      await firstUserOrAuthenticated({
        req: {
          user: null,
          payload: {
            count: async () => ({ totalDocs: 1 })
          }
        }
      }),
      false
    );
  });
});

describe("Payload collection contracts", () => {
  test("configures Users for Payload Auth and private admin access", async () => {
    const users = await readText("payload/collections/Users.ts");

    assert.match(users, /slug:\s*"users"/);
    assert.match(users, /auth:\s*\{/);
    assert.match(users, /sameSite:\s*"Lax"/);
    assert.match(users, /secure:\s*process\.env\.NODE_ENV === "production"/);
    assert.match(users, /maxLoginAttempts:\s*5/);
    assert.match(users, /value:\s*"editor"/);
    assert.match(users, /useAsTitle:\s*"email"/);
    assert.match(users, /create:\s*firstUserOrAuthenticated/);
    assert.match(users, /read:\s*authenticated/);
    assert.match(users, /update:\s*authenticated/);
    assert.match(users, /delete:\s*authenticated/);
    assert.match(users, /name:\s*"name"[\s\S]*?maxLength:\s*120/);
  });

  test("stores uploaded media locally under public/media with public reads", async () => {
    const media = await readText("payload/collections/Media.ts");

    assert.match(media, /slug:\s*"media"/);
    assert.match(media, /read:\s*anyone/);
    assert.match(media, /create:\s*authenticated/);
    assert.match(media, /update:\s*authenticated/);
    assert.match(media, /delete:\s*authenticated/);
    assert.match(media, /mimeTypes:\s*\["image\/\*",\s*"video\/\*"\]/);
    assert.match(media, /staticDir:\s*path\.resolve\(process\.cwd\(\),\s*"public\/media"\)/);
    assert.match(media, /name:\s*"alt"[\s\S]*?required:\s*true/);
    assert.match(media, /name:\s*"caption"[\s\S]*?maxLength:\s*300/);
  });

  test("uses published reads and authenticated writes for all showcase collections", async () => {
    for (const [fileName, slug] of showcaseCollections) {
      const source = await readText("payload/collections", `${fileName}.ts`);

      assert.match(source, new RegExp(`slug:\\s*"${slug}"`), slug);
      assert.match(source, /group:\s*"Showcase"/, slug);
      assert.match(source, /create:\s*authenticated/, slug);
      assert.match(source, /delete:\s*authenticated/, slug);
      assert.match(source, /read:\s*publishedOrAuthenticated/, slug);
      assert.match(source, /update:\s*authenticated/, slug);
      assert.match(source, /publishedField/, slug);
      assert.match(source, /sortOrderField/, slug);
    }
  });

  test("marks only singleton-style homepage collections as current-selectable", async () => {
    for (const fileName of ["Drops", "Artworks", "Artists", "Causes"]) {
      const source = await readText("payload/collections", `${fileName}.ts`);

      assert.match(source, /currentField/);
      assert.match(source, /defaultColumns:\s*\[[\s\S]*?"isCurrent"/);
    }

    for (const fileName of ["Products", "ImpactStats"]) {
      const source = await readText("payload/collections", `${fileName}.ts`);

      assert.doesNotMatch(source, /currentField/);
      assert.doesNotMatch(source, /"isCurrent"/);
    }
  });

  test("keeps local image fields consistent across visual showcase collections", async () => {
    const fields = await readText("payload/fields.ts");

    assert.match(fields, /name:\s*"image"[\s\S]*?type:\s*"upload"[\s\S]*?relationTo:\s*"media"/);
    assert.match(fields, /name:\s*"externalImageUrl"[\s\S]*?Prefer local media uploads/);
    assert.match(fields, /name:\s*"imageAlt"[\s\S]*?required:\s*true[\s\S]*?maxLength:\s*180/);

    for (const fileName of ["Products", "Drops", "Artworks", "Artists", "Causes"]) {
      const source = await readText("payload/collections", `${fileName}.ts`);

      assert.match(source, /\.\.\.imageFields\(\)/, fileName);
    }
  });

  test("validates structured fields used by the homepage mapper", async () => {
    const { slugField, progressField } = await import(toModuleUrl("payload/fields.ts"));
    const products = await readText("payload/collections/Products.ts");
    const drops = await readText("payload/collections/Drops.ts");
    const artworks = await readText("payload/collections/Artworks.ts");
    const artists = await readText("payload/collections/Artists.ts");
    const causes = await readText("payload/collections/Causes.ts");
    const impactStats = await readText("payload/collections/ImpactStats.ts");

    assert.equal(slugField.validate("valid-slug-1"), true);
    assert.equal(slugField.validate("Invalid Slug"), "Use lowercase letters, numbers, and hyphens.");
    assert.deepEqual(
      {
        min: progressField().min,
        max: progressField().max
      },
      {
        min: 0,
        max: 100
      }
    );

    assert.match(products, /name:\s*"materials"[\s\S]*?minRows:\s*1/);
    assert.match(drops, /name:\s*"milestones"[\s\S]*?progressField\(\)/);
    assert.match(artworks, /name:\s*"details"[\s\S]*?name:\s*"x"[\s\S]*?max:\s*100/);
    assert.match(artworks, /name:\s*"details"[\s\S]*?name:\s*"y"[\s\S]*?min:\s*0/);
    assert.match(artists, /name:\s*"facts"[\s\S]*?name:\s*"value"[\s\S]*?maxLength:\s*160/);
    assert.match(causes, /name:\s*"metrics"[\s\S]*?progressField\(\)/);
    assert.match(impactStats, /name:\s*"value"[\s\S]*?type:\s*"number"[\s\S]*?min:\s*0/);
  });

  test("models commerce variants, inventory, and batch relationships for admins", async () => {
    const products = await readText("payload/collections/Products.ts");
    const drops = await readText("payload/collections/Drops.ts");

    assert.match(products, /name:\s*"variants"[\s\S]*?name:\s*"sku"[\s\S]*?required:\s*true/);
    assert.match(products, /name:\s*"variants"[\s\S]*?name:\s*"inventory"[\s\S]*?min:\s*0/);
    assert.match(products, /name:\s*"totalInventory"[\s\S]*?position:\s*"sidebar"/);
    assert.match(products, /relationTo:\s*"drops"/);
    assert.match(products, /relationTo:\s*"artists"/);
    assert.match(products, /relationTo:\s*"artworks"/);
    assert.match(products, /relationTo:\s*"causes"/);

    assert.match(drops, /name:\s*"status"[\s\S]*?value:\s*"live"/);
    assert.match(drops, /name:\s*"products"[\s\S]*?relationTo:\s*"products"[\s\S]*?hasMany:\s*true/);
    assert.match(drops, /name:\s*"allocation"[\s\S]*?name:\s*"percentage"[\s\S]*?max:\s*100/);
    assert.match(drops, /name:\s*"cta"[\s\S]*?ctaFields\(\)/);
  });

  test("models NGO verification and impact metric provenance", async () => {
    const causes = await readText("payload/collections/Causes.ts");
    const impactStats = await readText("payload/collections/ImpactStats.ts");

    assert.match(causes, /name:\s*"legalName"/);
    assert.match(causes, /name:\s*"contact"[\s\S]*?type:\s*"email"/);
    assert.match(causes, /name:\s*"verification"[\s\S]*?value:\s*"verified"/);
    assert.match(causes, /name:\s*"reports"[\s\S]*?name:\s*"externalUrl"/);

    assert.match(impactStats, /name:\s*"metricType"[\s\S]*?value:\s*"verified"/);
    assert.match(impactStats, /name:\s*"drop"[\s\S]*?relationTo:\s*"drops"/);
    assert.match(impactStats, /name:\s*"cause"[\s\S]*?relationTo:\s*"causes"/);
    assert.match(impactStats, /name:\s*"source"[\s\S]*?maxLength:\s*220/);
  });

  test("registers editorial CMS collections with published reads and admin writes", async () => {
    const payloadConfig = await readText("payload.config.ts");

    for (const [fileName, slug] of contentCollections) {
      const source = await readText("payload/collections", `${fileName}.ts`);

      assert.match(payloadConfig, new RegExp(fileName));
      assert.match(source, new RegExp(`slug:\\s*"${slug}"`), slug);
      assert.match(source, /group:\s*"Content"/, slug);
      assert.match(source, /create:\s*authenticated/, slug);
      assert.match(source, /delete:\s*authenticated/, slug);
      assert.match(source, /read:\s*publishedOrAuthenticated/, slug);
      assert.match(source, /update:\s*authenticated/, slug);
      assert.match(source, /publishedField/, slug);
      assert.match(source, /sortOrderField/, slug);
    }
  });

  test("supports journal, testimonials, FAQs, homepage sections, media, and newsletter admin workflows", async () => {
    const media = await readText("payload/collections/Media.ts");
    const journal = await readText("payload/collections/Journal.ts");
    const testimonials = await readText("payload/collections/Testimonials.ts");
    const faqs = await readText("payload/collections/FAQs.ts");
    const homepageSections = await readText("payload/collections/HomepageSections.ts");
    const newsletter = await readText("payload/collections/Newsletter.ts");

    assert.match(media, /name:\s*"credit"/);
    assert.match(media, /name:\s*"usage"[\s\S]*?value:\s*"product"/);
    assert.match(media, /name:\s*"focalPoint"[\s\S]*?name:\s*"x"[\s\S]*?max:\s*100/);

    assert.match(journal, /name:\s*"content"[\s\S]*?type:\s*"richText"/);
    assert.match(journal, /name:\s*"relatedDrop"[\s\S]*?relationTo:\s*"drops"/);
    assert.match(journal, /seoFields\(\)/);

    assert.match(testimonials, /name:\s*"quote"[\s\S]*?maxLength:\s*700/);
    assert.match(testimonials, /name:\s*"rating"[\s\S]*?max:\s*5/);

    assert.match(faqs, /name:\s*"answer"[\s\S]*?type:\s*"richText"/);
    assert.match(faqs, /name:\s*"category"[\s\S]*?value:\s*"shipping-returns"/);

    assert.match(homepageSections, /value:\s*"products"/);
    assert.match(homepageSections, /value:\s*"drop"/);
    assert.match(homepageSections, /value:\s*"design"/);
    assert.match(homepageSections, /value:\s*"artist"/);
    assert.match(homepageSections, /value:\s*"cause"/);
    assert.match(homepageSections, /value:\s*"impact"/);
    assert.match(homepageSections, /name:\s*"signatureInteraction"/);

    assert.match(newsletter, /slug:\s*"newsletter"/);
    assert.match(newsletter, /create:\s*noOne/);
    assert.match(newsletter, /read:\s*authenticated/);
    assert.match(newsletter, /name:\s*"email"[\s\S]*?unique:\s*true/);
    assert.match(newsletter, /name:\s*"consent"[\s\S]*?acceptedMarketing/);
  });
});

describe("CMS runtime switches", () => {
  test("detects configured Payload database URLs without reading env files", async () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalPostgresUrl = process.env.POSTGRES_URL;

    try {
      delete process.env.DATABASE_URL;
      delete process.env.POSTGRES_URL;

      const { hasPayloadDatabase } = await import(toModuleUrl("lib/cms/env.ts"));

      assert.equal(hasPayloadDatabase(), false);

      process.env.POSTGRES_URL = "postgres://example/postgres";
      assert.equal(hasPayloadDatabase(), true);

      delete process.env.POSTGRES_URL;
      process.env.DATABASE_URL = "postgres://example/database";
      assert.equal(hasPayloadDatabase(), true);
    } finally {
      if (originalDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalDatabaseUrl;
      }

      if (originalPostgresUrl === undefined) {
        delete process.env.POSTGRES_URL;
      } else {
        process.env.POSTGRES_URL = originalPostgresUrl;
      }
    }
  });
});
