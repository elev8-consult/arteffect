import assert from "node:assert/strict";
import { readdir, stat, readFile } from "node:fs/promises";
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

async function readJson(...segments) {
  return JSON.parse(await readFile(fromRoot(...segments), "utf8"));
}

async function readText(...segments) {
  return readFile(fromRoot(...segments), "utf8");
}

describe("Next.js scaffold contract", () => {
  test("pins the requested stack and exposes verification scripts", async () => {
    const packageJson = await readJson("package.json");
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    assert.equal(packageJson.scripts.dev, "next dev");
    assert.equal(packageJson.scripts.build, "next build --webpack");
    assert.equal(packageJson.scripts.lint, "eslint . --max-warnings=0");
    assert.equal(packageJson.scripts.payload, "payload");
    assert.equal(packageJson.scripts["payload:generate-types"], "payload generate:types");
    assert.equal(packageJson.scripts["payload:generate-schema"], "payload generate:db-schema");
    assert.equal(packageJson.scripts["payload:migrate"], "payload migrate");
    assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
    assert.match(packageJson.scripts.test, /node .*--test tests\/\*\.test\.mjs/);

    assert.equal(dependencies["@payloadcms/db-postgres"], "^3.0.0");
    assert.equal(dependencies["@payloadcms/next"], "^3.0.0");
    assert.equal(dependencies["@payloadcms/richtext-lexical"], "^3.0.0");
    assert.equal(dependencies.next, "16.2.10");
    assert.equal(dependencies.tailwindcss, "4.3.2");
    assert.equal(dependencies.typescript, "6.0.3");
    assert.equal(dependencies.eslint, "10.6.0");
    assert.equal(dependencies["framer-motion"], "^12.23.12");
    assert.equal(dependencies["drizzle-orm"], "0.45.2");
    assert.equal(dependencies.graphql, "^16.11.0");
    assert.equal(dependencies.payload, "^3.0.0");
    assert.equal(dependencies.sharp, "^0.34.0");

    for (const packageName of [
      "quick-view",
      "quick-add",
      "add-to-cart",
      "payment-provider",
      "micro-interactions"
    ]) {
      assert.equal(dependencies[packageName], undefined);
    }
  });

  test("contains the expected App Router, UI, and configuration files", async () => {
    const requiredFiles = [
      "app/layout.tsx",
      "app/page.tsx",
      "app/api/health/route.ts",
      "app/sitemap.ts",
      "app/robots.ts",
      "app/globals.css",
      "components/layout/site-header.tsx",
      "components/layout/site-footer.tsx",
      "components/sections/home-experience.tsx",
      "components/ui/badge.tsx",
      "components/ui/button.tsx",
      "components.json",
      "next.config.mjs",
      "payload.config.ts",
      "payload/collections/Users.ts",
      "payload/collections/Media.ts",
      "payload/collections/Products.ts",
      "payload/collections/Drops.ts",
      "payload/collections/Artworks.ts",
      "payload/collections/Artists.ts",
      "payload/collections/Causes.ts",
      "payload/collections/ImpactStats.ts",
      "app/(payload)/layout.tsx",
      "app/(payload)/admin/[[...segments]]/page.tsx",
      "app/(payload)/api/[...slug]/route.ts",
      "app/(payload)/api/graphql/route.ts",
      "app/(payload)/api/graphql-playground/route.ts",
      "app/api/showcase/route.ts",
      "tsconfig.json"
    ];

    await Promise.all(
      requiredFiles.map(async (filePath) => {
        assert.equal((await stat(fromRoot(filePath))).isFile(), true, filePath);
      })
    );

    const tsconfig = await readJson("tsconfig.json");
    assert.equal(tsconfig.compilerOptions.strict, true);
    assert.equal(tsconfig.compilerOptions.moduleResolution, "bundler");
    assert.deepEqual(tsconfig.compilerOptions.paths, {
      "@/*": ["./*"],
      "@payload-config": ["./payload.config.ts"]
    });

    const shadcnConfig = await readJson("components.json");
    assert.equal(shadcnConfig.style, "new-york");
    assert.equal(shadcnConfig.rsc, true);
    assert.equal(shadcnConfig.tsx, true);
    assert.equal(shadcnConfig.tailwind.css, "app/globals.css");
    assert.equal(shadcnConfig.aliases.ui, "@/components/ui");
    assert.equal(shadcnConfig.iconLibrary, "lucide");

    const nextConfig = await readText("next.config.mjs");
    assert.match(nextConfig, /withPayload\(nextConfig\)/);
    assert.match(nextConfig, /hostname:\s*"images\.unsplash\.com"/);
    assert.match(nextConfig, /optimizePackageImports:\s*\["lucide-react",\s*"framer-motion"\]/);
  });

  test("configures Payload CMS with auth, local media, Postgres, and showcase collections", async () => {
    const payloadConfig = await readText("payload.config.ts");
    const showcaseService = await readText("lib/cms/showcase.ts");
    const mediaCollection = await readText("payload/collections/Media.ts");
    const usersCollection = await readText("payload/collections/Users.ts");

    assert.match(payloadConfig, /postgresAdapter/);
    assert.match(payloadConfig, /connectionString:\s*databaseUrl/);
    assert.match(payloadConfig, /NODE_ENV\s*===\s*"production"[\s\S]*!databaseUrl/);
    assert.match(payloadConfig, /DATABASE_URL or POSTGRES_URL must be set/);
    assert.match(payloadConfig, /user:\s*Users\.slug/);
    assert.match(payloadConfig, /Products,\s*Drops,\s*Artworks,\s*Artists,\s*Causes,\s*ImpactStats/s);
    assert.match(mediaCollection, /staticDir:\s*path\.resolve\(process\.cwd\(\),\s*"public\/media"\)/);
    assert.match(usersCollection, /auth:\s*\{/);
    assert.match(usersCollection, /sameSite:\s*"Lax"/);
    assert.match(usersCollection, /value:\s*"editor"/);
    assert.match(usersCollection, /firstUserOrAuthenticated/);
    assert.match(showcaseService, /publishedWhere/);
    assert.match(await readText("payload/access.ts"), /publishedOrAuthenticated/);
    assert.match(showcaseService, /getPayloadClient/);
    assert.match(showcaseService, /staticShowcaseContent/);
  });

  test("ships an initial Payload migration for production database setup", async () => {
    const migrationFiles = (await readdir(fromRoot("payload/migrations"))).filter((fileName) =>
      fileName.endsWith(".ts")
    );

    assert.ok(migrationFiles.length > 0, "expected at least one Payload migration");

    const initialMigration = await readText("payload/migrations", migrationFiles[0]);

    for (const tableName of [
      "users",
      "media",
      "products",
      "drops",
      "artworks",
      "artists",
      "causes",
      "impact_stats",
      "payload_preferences"
    ]) {
      assert.match(initialMigration, new RegExp(`CREATE TABLE IF NOT EXISTS "${tableName}"`));
    }

    assert.match(initialMigration, /export async function up/);
    assert.match(initialMigration, /export async function down/);
  });

  test("limits anonymous showcase reads to published records", async () => {
    const { publishedOrAuthenticated } = await import(toModuleUrl("payload/access.ts"));

    assert.equal(publishedOrAuthenticated({ req: { user: { id: "admin", role: "admin" } } }), true);
    assert.deepEqual(publishedOrAuthenticated({ req: { user: null } }), {
      isPublished: {
        equals: true
      }
    });
  });

  test("implements a health route with stable service metadata", async () => {
    const { GET } = await import(toModuleUrl("app/api/health/route.ts"));

    const response = GET();
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.service, "arteffect");
    assert.equal(Number.isNaN(Date.parse(body.timestamp)), false);
  });
});

describe("ArtEffect showcase experience", () => {
  test("defines the six required editorial showcase sections", async () => {
    const { siteConfig } = await import(toModuleUrl("lib/site.ts"));
    const homeExperience = await readText("components/sections/home-experience.tsx");
    const expectedSections = ["Products", "Drop", "Design", "Artist", "Cause", "Impact"];

    assert.deepEqual(
      siteConfig.nav.map((item) => item.label),
      expectedSections
    );
    assert.deepEqual(
      siteConfig.nav.map((item) => item.href),
      expectedSections.map((section) => `#${section.toLowerCase()}`)
    );

    for (const section of expectedSections) {
      assert.match(homeExperience, new RegExp(`id="${section.toLowerCase()}"`));
    }

    assert.match(homeExperience, /"use client";/);
    assert.match(homeExperience, /useScroll/);
    assert.match(homeExperience, /useReducedMotion/);
    assert.match(homeExperience, /AnimatePresence/);
    assert.match(homeExperience, /aria-pressed={isSelected}/);
    assert.match(homeExperience, /aria-label={`View artwork detail \$\{detail\.label\}`}/);
  });

  test("ships complete showcase data for products, drop, artwork, artist, cause, and impact", async () => {
    const {
      artist,
      artwork,
      cause,
      drop,
      impactStats,
      products
    } = await import(toModuleUrl("data/showcase.ts"));

    assert.equal(products.length, 3);
    for (const product of products) {
      assert.match(product.id, /^[a-z0-9-]+$/);
      assert.ok(product.name.length > 0);
      assert.ok(product.form.length > 0);
      assert.match(product.price, /^\$/);
      assert.ok(product.story.length > 40);
      assert.ok(product.image.startsWith("https://images.unsplash.com/"));
      assert.ok(product.imageAlt.length > 20);
      assert.ok(product.materials.length >= 3);
    }

    assert.ok(drop.reserved > 0);
    assert.ok(drop.reserved <= drop.batchSize);
    assert.ok(drop.summary.length > 80);
    assert.ok(drop.imageAlt.length > 20);
    assert.equal(drop.milestones.length, 3);
    for (const milestone of drop.milestones) {
      assert.ok(milestone.progress >= 0 && milestone.progress <= 100);
    }

    assert.equal(artwork.details.length, 3);
    assert.ok(artwork.summary.length > 80);
    for (const detail of artwork.details) {
      assert.match(detail.label, /^\d{2}$/);
      assert.ok(detail.x >= 0 && detail.x <= 100);
      assert.ok(detail.y >= 0 && detail.y <= 100);
      assert.ok(detail.body.length > 40);
    }

    assert.ok(artist.bio.length > 80);
    assert.ok(artist.quote.length > 40);
    assert.ok(artist.facts.length >= 3);

    assert.ok(cause.summary.length > 80);
    assert.equal(cause.metrics.length, 3);
    for (const metric of cause.metrics) {
      assert.ok(metric.progress >= 0 && metric.progress <= 100);
    }

    assert.equal(impactStats.length, 3);
    assert.deepEqual(
      impactStats.map((stat) => stat.label),
      ["Projected saplings", "Artist royalty", "NGO allocation"]
    );
    for (const stat of impactStats) {
      assert.ok(stat.value > 0);
      assert.ok(stat.detail.length > 20);
    }
  });
});
