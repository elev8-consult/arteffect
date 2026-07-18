import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

/**
 * Drops now support multiple artworks via drops_rels (hasMany).
 * Migrate the legacy drops.artwork_id FK into relationship rows.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "drops_rels" ADD COLUMN IF NOT EXISTS "artworks_id" integer;

    DO $$ BEGIN
      ALTER TABLE "drops_rels" ADD CONSTRAINT "drops_rels_artworks_fk"
        FOREIGN KEY ("artworks_id") REFERENCES "artworks"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "drops_rels_artworks_idx" ON "drops_rels" ("artworks_id");

    INSERT INTO "drops_rels" ("order", "parent_id", "path", "artworks_id")
    SELECT 0, drop_row."id", 'artwork', drop_row."artwork_id"
    FROM "drops" AS drop_row
    WHERE drop_row."artwork_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM "drops_rels" existing
        WHERE existing."parent_id" = drop_row."id"
          AND existing."path" = 'artwork'
          AND existing."artworks_id" = drop_row."artwork_id"
      );
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "drops_rels" WHERE "path" = 'artwork' AND "artworks_id" IS NOT NULL;
    DROP INDEX IF EXISTS "drops_rels_artworks_idx";
    ALTER TABLE "drops_rels" DROP CONSTRAINT IF EXISTS "drops_rels_artworks_fk";
    ALTER TABLE "drops_rels" DROP COLUMN IF EXISTS "artworks_id";
  `);
}
