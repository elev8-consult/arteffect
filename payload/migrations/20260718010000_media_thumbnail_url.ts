import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

/**
 * Payload's drizzle adapter maps thumbnailURL -> thumbnail_u_r_l via to-snake-case.
 * The initial migration incorrectly created thumbnail_url.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'media'
          AND column_name = 'thumbnail_url'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'media'
          AND column_name = 'thumbnail_u_r_l'
      ) THEN
        ALTER TABLE "media" RENAME COLUMN "thumbnail_url" TO "thumbnail_u_r_l";
      END IF;
    END $$;

    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "thumbnail_u_r_l" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'media'
          AND column_name = 'thumbnail_u_r_l'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'media'
          AND column_name = 'thumbnail_url'
      ) THEN
        ALTER TABLE "media" RENAME COLUMN "thumbnail_u_r_l" TO "thumbnail_url";
      END IF;
    END $$;
  `);
}
