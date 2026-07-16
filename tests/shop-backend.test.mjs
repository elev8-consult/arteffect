import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

function toModuleUrl(...segments) {
  return pathToFileURL(join(rootDir, ...segments)).href;
}

async function readText(...segments) {
  return readFile(join(rootDir, ...segments), "utf8");
}

async function loadProductsCollection() {
  const source = await readText("payload/collections/Products.ts");
  const transformed = source
    .replace(/^import type .*;\n\n/gm, "")
    .replace(/export const Products: CollectionConfig =/, "export const Products =")
    .replace(/from "\.\.\/access"/g, `from "${toModuleUrl("payload/access.ts")}"`)
    .replace(/from "\.\.\/fields"/g, `from "${toModuleUrl("payload/fields.ts")}"`);

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(transformed)}`);
}

async function loadStaticProducts() {
  const source = await readText("lib/cms/products.ts");
  const typescript = await import("typescript");
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022
    }
  }).outputText;
  const transformed = javascript
    .replace(
      'import { unstable_noStore as noStore } from "next/cache";',
      "const noStore = () => undefined;"
    )
    .replace(
      'import { products as showcaseProducts } from "@/data/showcase";',
      `import { products as showcaseProducts } from "${toModuleUrl("data/showcase.ts")}";`
    )
    .replace(
      'import { hasPayloadDatabase } from "@/lib/cms/env";',
      "const hasPayloadDatabase = () => false;"
    )
    .replace(
      'import { getPayloadClient } from "@/lib/cms/payload";',
      "const getPayloadClient = async () => { throw new Error(\"Payload must not be used in static tests.\"); };"
    )
    .replace(
      'import { productSort, productWhere } from "@/lib/shop/query";',
      `import { productSort, productWhere } from "${toModuleUrl("lib/shop/query.ts")}";`
    );

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(transformed)}`);
}

describe("Shop backend", () => {
  test("validates and normalizes product filters without accepting unbounded input", async () => {
    const { ProductQueryError, parseProductQuery } = await import(toModuleUrl("lib/shop/query.ts"));
    const query = parseProductQuery(
      new URLSearchParams(
        "q=  silk   scarf &color=green,multicolor&size=m&availability=available&artist=maya-raad&drop=batch-001&minPrice=45.50&maxPrice=150&page=2&limit=24&sort=price-asc"
      )
    );

    assert.deepEqual(query, {
      artist: "maya-raad",
      availability: ["in-stock", "low-stock"],
      colors: ["green", "multicolor"],
      drop: "batch-001",
      limit: 24,
      maxPrice: 150,
      minPrice: 45.5,
      page: 2,
      search: "silk scarf",
      sizes: ["m"],
      sort: "price-asc"
    });

    assert.throws(
      () => parseProductQuery(new URLSearchParams("limit=500&color=chartreuse&minPrice=100&maxPrice=20")),
      (error) => error instanceof ProductQueryError && error.issues.length === 3
    );
  });

  test("builds published-only Payload queries for every filter dimension", async () => {
    const { parseProductQuery, productSort, productWhere } = await import(toModuleUrl("lib/shop/query.ts"));
    const query = parseProductQuery(
      new URLSearchParams("search=plate&colors=off-white&sizes=one-size&availability=low-stock&artist=maya-raad&drop=batch-001&minPrice=50&maxPrice=120&sort=price-desc")
    );
    const where = productWhere(query);

    assert.deepEqual(where.and[0], { isPublished: { equals: true } });
    assert.ok(where.and.some((clause) => clause.colors?.in?.includes("off-white")));
    assert.ok(where.and.some((clause) => clause.sizes?.in?.includes("one-size")));
    assert.ok(where.and.some((clause) => clause["artist.slug"]?.equals === "maya-raad"));
    assert.ok(where.and.some((clause) => clause["drop.slug"]?.equals === "batch-001"));
    assert.deepEqual(productSort(query.sort), ["-minPrice", "sortOrder"]);
  });

  test("returns the static catalog with combined filtering, deterministic sorting, and pagination", async () => {
    const [{ getShopProducts }, { parseProductQuery }] = await Promise.all([
      loadStaticProducts(),
      import(toModuleUrl("lib/shop/query.ts"))
    ]);

    const filtered = await getShopProducts(
      parseProductQuery(
        new URLSearchParams(
          "search=object&color=off-white&size=one-size&availability=available&artist=maya-raad&drop=batch-001&minPrice=90&maxPrice=100&sort=price-asc"
        )
      )
    );

    assert.deepEqual(filtered.docs.map((product) => product.slug), ["ceramic-plate"]);
    assert.deepEqual(filtered.pagination, {
      hasNextPage: false,
      hasPreviousPage: false,
      limit: 12,
      page: 1,
      total: 1,
      totalPages: 1
    });

    const paged = await getShopProducts(
      parseProductQuery(new URLSearchParams("sort=price-desc&limit=1&page=2"))
    );

    assert.deepEqual(paged.docs.map((product) => product.slug), ["ceramic-plate"]);
    assert.deepEqual(paged.pagination, {
      hasNextPage: true,
      hasPreviousPage: true,
      limit: 1,
      page: 2,
      total: 3,
      totalPages: 3
    });
  });

  test("maps CMS products safely for quick-view and quick-add consumers", async () => {
    const { mapShopProduct } = await loadStaticProducts();
    const product = mapShopProduct({
      artist: { id: 4, name: "Maya Raad", slug: "maya-raad" },
      currency: "USD",
      externalImageUrl: "https://cdn.example/product.jpg",
      id: 8,
      name: "Edition object",
      slug: "edition-object",
      variants: [
        { color: "green", id: "small", inventory: 4, name: "Small", price: 80, reserved: 1, size: "s", sku: "AE-S" },
        { color: "green", id: "medium", inventory: 1, name: "Medium", price: 95, reserved: 1, size: "m", sku: "AE-M" }
      ]
    });

    assert.deepEqual(
      {
        availability: product.availability,
        colors: product.colors,
        displayPrice: product.displayPrice,
        image: product.image,
        maxPrice: product.maxPrice,
        minPrice: product.minPrice,
        sizes: product.sizes,
        variants: product.variants.map(({ availableInventory, id, isAvailable }) => ({ availableInventory, id, isAvailable }))
      },
      {
        availability: "in-stock",
        colors: ["green"],
        displayPrice: "$80.00–$95.00",
        image: "https://cdn.example/product.jpg",
        maxPrice: 95,
        minPrice: 80,
        sizes: ["s", "m"],
        variants: [
          { availableInventory: 3, id: "small", isAvailable: true },
          { availableInventory: 0, id: "medium", isAvailable: false }
        ]
      }
    );
  });

  test("prevents reservations when a linked drop is not sellable", async () => {
    const { mapShopProduct } = await loadStaticProducts();
    const product = mapShopProduct({
      availability: "in-stock",
      drop: { id: 2, slug: "closed-batch", status: "sold-out", title: "Closed batch" },
      id: 9,
      name: "Reserved edition",
      slug: "reserved-edition",
      variants: [
        { id: "edition", inventory: 5, name: "Edition", price: 100, reserved: 0, sku: "AE-CLOSED" }
      ]
    });

    assert.equal(product.availability, "out-of-stock");
    assert.equal(product.variants[0].isAvailable, false);
  });

  test("derives indexed price, option, availability, and inventory rollups from variants", async () => {
    const { Products } = await loadProductsCollection();
    const variants = Products.fields.find((field) => field.name === "variants");
    const hook = Products.hooks.beforeChange[0];
    const input = {
      variants: [
        { color: "green", inventory: 10, isAvailable: true, lowStockThreshold: 3, name: "S", price: 80, reserved: 2, size: "s", sku: "AE-S" },
        { color: "green", inventory: 2, isAvailable: true, lowStockThreshold: 3, name: "M", price: 95, reserved: 1, size: "m", sku: "AE-M" }
      ]
    };
    const result = hook({ data: input, originalDoc: {} });

    assert.equal(variants.required, true);
    assert.equal(variants.validate(input.variants), true);
    assert.match(variants.validate([{ inventory: 1, name: "Bad", price: 10, reserved: 2, sku: "BAD" }]), /cannot exceed/i);
    assert.deepEqual(
      {
        availability: result.availability,
        colors: result.colors,
        maxPrice: result.maxPrice,
        minPrice: result.minPrice,
        sizes: result.sizes,
        totalInventory: result.totalInventory
      },
      {
        availability: "in-stock",
        colors: ["green"],
        maxPrice: 95,
        minPrice: 80,
        sizes: ["s", "m"],
        totalInventory: 9
      }
    );
  });

  test("ships product, quick-view, authenticated wishlist routes, and a production migration", async () => {
    const [listRoute, detailRoute, wishlistRoute, userCollection, migration] = await Promise.all([
      readText("app/api/products/route.ts"),
      readText("app/api/products/[slug]/route.ts"),
      readText("app/api/wishlist/route.ts"),
      readText("payload/collections/Users.ts"),
      readText("payload/migrations/20260713000000_shop.ts")
    ]);

    assert.match(listRoute, /parseProductQuery/);
    assert.match(listRoute, /INVALID_QUERY/);
    assert.match(listRoute, /filters:[\s\S]*?availability:[\s\S]*?colors:[\s\S]*?sizes:/);
    assert.match(listRoute, /sorts: PRODUCT_SORTS/);
    assert.match(detailRoute, /getShopProduct/);
    assert.match(detailRoute, /INVALID_PRODUCT_SLUG/);
    assert.match(detailRoute, /PRODUCT_NOT_FOUND/);
    assert.match(wishlistRoute, /WishlistAuthenticationError/);
    assert.match(userCollection, /name:\s*"wishlist"[\s\S]*?relationTo:\s*"products"[\s\S]*?hasMany:\s*true/);
    assert.match(migration, /ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "min_price"/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS "users_rels"/);
    assert.match(migration, /CREATE TYPE "enum_products_colors" AS ENUM/);
    assert.match(migration, /CREATE TYPE "enum_products_sizes" AS ENUM/);
    assert.match(migration, /"value" "enum_products_colors"/);
    assert.match(migration, /"value" "enum_products_sizes"/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS "products_colors"[\s\S]*?"id" serial PRIMARY KEY NOT NULL/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS "products_sizes"[\s\S]*?"id" serial PRIMARY KEY NOT NULL/);
  });
});
