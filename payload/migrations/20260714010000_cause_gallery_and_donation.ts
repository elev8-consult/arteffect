import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "drops" ADD COLUMN IF NOT EXISTS "donation_percentage" numeric;

    CREATE TABLE IF NOT EXISTS "causes_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer NOT NULL,
      "caption" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "causes_gallery" ADD CONSTRAINT "causes_gallery_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "causes_gallery" ADD CONSTRAINT "causes_gallery_parent_id_causes_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "causes"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "causes_gallery_order_idx" ON "causes_gallery" ("_order");
    CREATE INDEX IF NOT EXISTS "causes_gallery_parent_id_idx" ON "causes_gallery" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "causes_gallery_image_idx" ON "causes_gallery" ("image_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "causes_gallery_image_idx";
    DROP INDEX IF EXISTS "causes_gallery_parent_id_idx";
    DROP INDEX IF EXISTS "causes_gallery_order_idx";
    DROP TABLE IF EXISTS "causes_gallery";
    ALTER TABLE "drops" DROP COLUMN IF EXISTS "donation_percentage";
  `);
}
