import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "dimensions" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "care_instructions" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shipping_returns" varchar;

    DO $$ BEGIN
      ALTER TABLE "products" ADD CONSTRAINT "products_image_source_check"
        CHECK ("image_id" IS NOT NULL OR NULLIF(BTRIM("external_image_url"), '') IS NOT NULL) NOT VALID;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "products_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer,
      "external_image_url" varchar,
      "alt" varchar NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "products"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "products_gallery_order_idx" ON "products_gallery" ("_order");
    CREATE INDEX IF NOT EXISTS "products_gallery_parent_id_idx" ON "products_gallery" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "products_gallery_image_idx" ON "products_gallery" ("image_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "products_gallery" CASCADE;
    ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_image_source_check";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "shipping_returns";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "care_instructions";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "dimensions";
  `);
}
