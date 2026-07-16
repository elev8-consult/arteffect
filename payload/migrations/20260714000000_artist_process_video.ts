import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "process_video_id" integer;
    ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "process_video_url" varchar;
    ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "process_video_poster_id" integer;
    ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "process_video_caption" varchar;

    DO $$ BEGIN
      ALTER TABLE "artists" ADD CONSTRAINT "artists_process_video_id_media_id_fk"
        FOREIGN KEY ("process_video_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "artists" ADD CONSTRAINT "artists_process_video_poster_id_media_id_fk"
        FOREIGN KEY ("process_video_poster_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "artists_process_video_idx" ON "artists" ("process_video_id");
    CREATE INDEX IF NOT EXISTS "artists_process_video_poster_idx" ON "artists" ("process_video_poster_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "artists_process_video_poster_idx";
    DROP INDEX IF EXISTS "artists_process_video_idx";
    ALTER TABLE "artists" DROP CONSTRAINT IF EXISTS "artists_process_video_poster_id_media_id_fk";
    ALTER TABLE "artists" DROP CONSTRAINT IF EXISTS "artists_process_video_id_media_id_fk";
    ALTER TABLE "artists" DROP COLUMN IF EXISTS "process_video_caption";
    ALTER TABLE "artists" DROP COLUMN IF EXISTS "process_video_poster_id";
    ALTER TABLE "artists" DROP COLUMN IF EXISTS "process_video_url";
    ALTER TABLE "artists" DROP COLUMN IF EXISTS "process_video_id";
  `);
}
