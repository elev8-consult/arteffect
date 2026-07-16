import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "impact_entries" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL,
      "amount" numeric NOT NULL,
      "currency" varchar DEFAULT 'USD' NOT NULL,
      "metric_type" varchar DEFAULT 'projected' NOT NULL,
      "impact_value" numeric,
      "impact_label" varchar,
      "impact_suffix" varchar,
      "occurred_at" timestamp(3) with time zone NOT NULL,
      "cause_id" integer NOT NULL,
      "drop_id" integer,
      "source" varchar,
      "is_published" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "impact_entries_id" integer;

    DO $$ BEGIN
      ALTER TABLE "impact_entries" ADD CONSTRAINT "impact_entries_cause_id_causes_id_fk"
        FOREIGN KEY ("cause_id") REFERENCES "causes"("id") ON DELETE restrict;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "impact_entries" ADD CONSTRAINT "impact_entries_drop_id_drops_id_fk"
        FOREIGN KEY ("drop_id") REFERENCES "drops"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_impact_entries_id_fk"
        FOREIGN KEY ("impact_entries_id") REFERENCES "impact_entries"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "impact_entries_cause_idx" ON "impact_entries" ("cause_id");
    CREATE INDEX IF NOT EXISTS "impact_entries_drop_idx" ON "impact_entries" ("drop_id");
    CREATE INDEX IF NOT EXISTS "impact_entries_occurred_at_idx" ON "impact_entries" ("occurred_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_impact_entries_idx" ON "payload_locked_documents_rels" ("impact_entries_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_impact_entries_idx";
    DROP INDEX IF EXISTS "impact_entries_occurred_at_idx";
    DROP INDEX IF EXISTS "impact_entries_drop_idx";
    DROP INDEX IF EXISTS "impact_entries_cause_idx";
    DROP TABLE IF EXISTS "impact_entries";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "impact_entries_id";
  `);
}
