import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_products_availability" AS ENUM ('in-stock', 'low-stock', 'out-of-stock');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "enum_products_variants_color" AS ENUM (
        'black', 'white', 'off-white', 'cream', 'beige', 'tan', 'brown', 'grey',
        'green', 'blue', 'purple', 'pink', 'red', 'orange', 'yellow', 'metallic', 'multicolor'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "enum_products_variants_size" AS ENUM (
        'one-size', 'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "enum_products_colors" AS ENUM (
        'black', 'white', 'off-white', 'cream', 'beige', 'tan', 'brown', 'grey',
        'green', 'blue', 'purple', 'pink', 'red', 'orange', 'yellow', 'metallic', 'multicolor'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "enum_products_sizes" AS ENUM (
        'one-size', 'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "min_price" numeric DEFAULT 0;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "max_price" numeric DEFAULT 0;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "availability" "enum_products_availability" DEFAULT 'out-of-stock' NOT NULL;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "search_keywords" varchar;

    ALTER TABLE "products_variants" ADD COLUMN IF NOT EXISTS "color" "enum_products_variants_color";
    ALTER TABLE "products_variants" ADD COLUMN IF NOT EXISTS "size" "enum_products_variants_size";

    CREATE TABLE IF NOT EXISTS "products_colors" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_products_colors",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "products_sizes" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_products_sizes",
      "id" serial PRIMARY KEY NOT NULL
    );

    -- Repair databases on which the previous version of this migration was partially applied.
    ALTER TABLE "products" ALTER COLUMN "availability" DROP DEFAULT;
    ALTER TABLE "products" ALTER COLUMN "availability" TYPE "enum_products_availability"
      USING "availability"::text::"enum_products_availability";
    ALTER TABLE "products" ALTER COLUMN "availability" SET DEFAULT 'out-of-stock';
    ALTER TABLE "products" ALTER COLUMN "availability" SET NOT NULL;

    ALTER TABLE "products_variants" ALTER COLUMN "color" TYPE "enum_products_variants_color"
      USING "color"::text::"enum_products_variants_color";
    ALTER TABLE "products_variants" ALTER COLUMN "size" TYPE "enum_products_variants_size"
      USING "size"::text::"enum_products_variants_size";

    ALTER TABLE "products_colors" ADD COLUMN IF NOT EXISTS "id" serial;
    ALTER TABLE "products_colors" ALTER COLUMN "value" TYPE "enum_products_colors"
      USING "value"::text::"enum_products_colors";
    ALTER TABLE "products_sizes" ADD COLUMN IF NOT EXISTS "id" serial;
    ALTER TABLE "products_sizes" ALTER COLUMN "value" TYPE "enum_products_sizes"
      USING "value"::text::"enum_products_sizes";

    DO $$ BEGIN
      ALTER TABLE "products_colors" ADD CONSTRAINT "products_colors_pkey" PRIMARY KEY ("id");
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products_sizes" ADD CONSTRAINT "products_sizes_pkey" PRIMARY KEY ("id");
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "users_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer
    );

    DO $$ BEGIN
      ALTER TABLE "products_colors" ADD CONSTRAINT "products_colors_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "products"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products_sizes" ADD CONSTRAINT "products_sizes_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "products"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_products_id_fk"
        FOREIGN KEY ("products_id") REFERENCES "products"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    UPDATE "products_variants" AS variant
    SET "color" = normalized."value"::"enum_products_variants_color"
    FROM (
      SELECT DISTINCT ON (attribute."_parent_id")
        attribute."_parent_id" AS "variant_id",
        CASE lower(trim(attribute."value"))
          WHEN 'black' THEN 'black'
          WHEN 'white' THEN 'white'
          WHEN 'off white' THEN 'off-white'
          WHEN 'off-white' THEN 'off-white'
          WHEN 'cream' THEN 'cream'
          WHEN 'beige' THEN 'beige'
          WHEN 'tan' THEN 'tan'
          WHEN 'brown' THEN 'brown'
          WHEN 'gray' THEN 'grey'
          WHEN 'grey' THEN 'grey'
          WHEN 'green' THEN 'green'
          WHEN 'blue' THEN 'blue'
          WHEN 'purple' THEN 'purple'
          WHEN 'pink' THEN 'pink'
          WHEN 'red' THEN 'red'
          WHEN 'orange' THEN 'orange'
          WHEN 'yellow' THEN 'yellow'
          WHEN 'gold' THEN 'metallic'
          WHEN 'silver' THEN 'metallic'
          WHEN 'metallic' THEN 'metallic'
          WHEN 'multi' THEN 'multicolor'
          WHEN 'multicolor' THEN 'multicolor'
          WHEN 'multi-color' THEN 'multicolor'
        END AS "value"
      FROM "products_variants_attributes" AS attribute
      WHERE lower(trim(attribute."name")) IN ('color', 'colour')
      ORDER BY attribute."_parent_id", attribute."_order"
    ) AS normalized
    WHERE variant."id" = normalized."variant_id"
      AND normalized."value" IS NOT NULL
      AND variant."color" IS NULL;

    UPDATE "products_variants" AS variant
    SET "size" = normalized."value"::"enum_products_variants_size"
    FROM (
      SELECT DISTINCT ON (attribute."_parent_id")
        attribute."_parent_id" AS "variant_id",
        CASE lower(trim(attribute."value"))
          WHEN 'one size' THEN 'one-size'
          WHEN 'one-size' THEN 'one-size'
          WHEN 'os' THEN 'one-size'
          WHEN 'xxs' THEN 'xxs'
          WHEN 'xs' THEN 'xs'
          WHEN 's' THEN 's'
          WHEN 'small' THEN 's'
          WHEN 'm' THEN 'm'
          WHEN 'medium' THEN 'm'
          WHEN 'l' THEN 'l'
          WHEN 'large' THEN 'l'
          WHEN 'xl' THEN 'xl'
          WHEN 'xxl' THEN 'xxl'
          WHEN 'xxxl' THEN 'xxxl'
        END AS "value"
      FROM "products_variants_attributes" AS attribute
      WHERE lower(trim(attribute."name")) = 'size'
      ORDER BY attribute."_parent_id", attribute."_order"
    ) AS normalized
    WHERE variant."id" = normalized."variant_id"
      AND normalized."value" IS NOT NULL
      AND variant."size" IS NULL;

    UPDATE "products" AS product
    SET
      "min_price" = rollup."min_price",
      "max_price" = rollup."max_price",
      "total_inventory" = rollup."sellable_inventory",
      "availability" = CASE
        WHEN rollup."sellable_inventory" <= 0 THEN 'out-of-stock'
        WHEN rollup."has_healthy_stock" THEN 'in-stock'
        ELSE 'low-stock'
      END
    FROM (
      SELECT
        "_parent_id" AS "product_id",
        min("price") AS "min_price",
        max("price") AS "max_price",
        sum(CASE WHEN "is_available" THEN greatest("inventory" - "reserved", 0) ELSE 0 END) AS "sellable_inventory",
        bool_or(
          "is_available" AND greatest("inventory" - "reserved", 0) > coalesce("low_stock_threshold", 0)
        ) AS "has_healthy_stock"
      FROM "products_variants"
      GROUP BY "_parent_id"
    ) AS rollup
    WHERE product."id" = rollup."product_id";

    INSERT INTO "products_colors" ("order", "parent_id", "value")
    SELECT row_number() OVER (PARTITION BY variant."_parent_id" ORDER BY variant."color") - 1,
      variant."_parent_id", variant."color"::text::"enum_products_colors"
    FROM (
      SELECT DISTINCT "_parent_id", "color"
      FROM "products_variants"
      WHERE "color" IS NOT NULL
    ) AS variant;

    INSERT INTO "products_sizes" ("order", "parent_id", "value")
    SELECT row_number() OVER (PARTITION BY variant."_parent_id" ORDER BY variant."size") - 1,
      variant."_parent_id", variant."size"::text::"enum_products_sizes"
    FROM (
      SELECT DISTINCT "_parent_id", "size"
      FROM "products_variants"
      WHERE "size" IS NOT NULL
    ) AS variant;

    CREATE INDEX IF NOT EXISTS "products_min_price_idx" ON "products" ("min_price");
    CREATE INDEX IF NOT EXISTS "products_max_price_idx" ON "products" ("max_price");
    CREATE INDEX IF NOT EXISTS "products_availability_idx" ON "products" ("availability");
    CREATE INDEX IF NOT EXISTS "products_variants_color_idx" ON "products_variants" ("color");
    CREATE INDEX IF NOT EXISTS "products_variants_size_idx" ON "products_variants" ("size");
    CREATE INDEX IF NOT EXISTS "products_colors_order_idx" ON "products_colors" ("order");
    CREATE INDEX IF NOT EXISTS "products_colors_parent_idx" ON "products_colors" ("parent_id");
    CREATE INDEX IF NOT EXISTS "products_colors_value_idx" ON "products_colors" ("value");
    CREATE INDEX IF NOT EXISTS "products_sizes_order_idx" ON "products_sizes" ("order");
    CREATE INDEX IF NOT EXISTS "products_sizes_parent_idx" ON "products_sizes" ("parent_id");
    CREATE INDEX IF NOT EXISTS "products_sizes_value_idx" ON "products_sizes" ("value");
    CREATE INDEX IF NOT EXISTS "users_rels_order_idx" ON "users_rels" ("order");
    CREATE INDEX IF NOT EXISTS "users_rels_parent_idx" ON "users_rels" ("parent_id");
    CREATE INDEX IF NOT EXISTS "users_rels_path_idx" ON "users_rels" ("path");
    CREATE INDEX IF NOT EXISTS "users_rels_products_idx" ON "users_rels" ("products_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "users_rels" CASCADE;
    DROP TABLE IF EXISTS "products_sizes" CASCADE;
    DROP TABLE IF EXISTS "products_colors" CASCADE;
    DROP INDEX IF EXISTS "products_variants_size_idx";
    DROP INDEX IF EXISTS "products_variants_color_idx";
    DROP INDEX IF EXISTS "products_availability_idx";
    DROP INDEX IF EXISTS "products_max_price_idx";
    DROP INDEX IF EXISTS "products_min_price_idx";
    ALTER TABLE "products_variants" DROP COLUMN IF EXISTS "size";
    ALTER TABLE "products_variants" DROP COLUMN IF EXISTS "color";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "search_keywords";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "availability";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "max_price";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "min_price";
    DROP TYPE IF EXISTS "enum_products_sizes";
    DROP TYPE IF EXISTS "enum_products_colors";
    DROP TYPE IF EXISTS "enum_products_variants_size";
    DROP TYPE IF EXISTS "enum_products_variants_color";
    DROP TYPE IF EXISTS "enum_products_availability";
  `);
}
