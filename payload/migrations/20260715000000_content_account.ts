import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "about" (
      "id" serial PRIMARY KEY NOT NULL,
      "hero_eyebrow" varchar,
      "hero_title" varchar,
      "hero_introduction" varchar,
      "hero_image_id" integer,
      "hero_external_image_url" varchar,
      "hero_image_alt" varchar,
      "story_heading" varchar,
      "story_body" jsonb,
      "story_image_id" integer,
      "story_external_image_url" varchar,
      "story_image_alt" varchar,
      "mission_eyebrow" varchar,
      "mission_heading" varchar,
      "mission_body" jsonb,
      "mission_cta_label" varchar,
      "mission_cta_href" varchar,
      "mission_cta_style" varchar DEFAULT 'primary',
      "founder_name" varchar,
      "founder_role" varchar,
      "founder_quote" varchar,
      "founder_story" jsonb,
      "founder_image_id" integer,
      "founder_external_image_url" varchar,
      "founder_image_alt" varchar,
      "seo_meta_title" varchar,
      "seo_meta_description" varchar,
      "seo_open_graph_image_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "about_values" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "about_milestones" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "year" varchar NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "contact" (
      "id" serial PRIMARY KEY NOT NULL,
      "eyebrow" varchar,
      "title" varchar,
      "introduction" varchar,
      "details_email" varchar,
      "details_phone" varchar,
      "details_address" varchar,
      "details_hours" varchar,
      "response_note" varchar,
      "seo_meta_title" varchar,
      "seo_meta_description" varchar,
      "seo_open_graph_image_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "contact_topics" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "value" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "contact_submissions" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "email" varchar NOT NULL,
      "phone" varchar,
      "topic" varchar NOT NULL,
      "order_number" varchar,
      "message" varchar NOT NULL,
      "status" varchar DEFAULT 'new' NOT NULL,
      "consent_to_reply" boolean DEFAULT false NOT NULL,
      "request_fingerprint" varchar,
      "resolved_at" timestamp(3) with time zone,
      "notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "users_addresses" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "is_default" boolean DEFAULT false,
      "name" varchar NOT NULL,
      "company" varchar,
      "line1" varchar NOT NULL,
      "line2" varchar,
      "city" varchar NOT NULL,
      "state" varchar,
      "postal_code" varchar,
      "country" varchar NOT NULL,
      "phone" varchar NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "contact_submissions_id" integer;

    DO $$ BEGIN ALTER TABLE "about" ADD CONSTRAINT "about_hero_image_fk" FOREIGN KEY ("hero_image_id") REFERENCES "media"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "about" ADD CONSTRAINT "about_story_image_fk" FOREIGN KEY ("story_image_id") REFERENCES "media"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "about" ADD CONSTRAINT "about_founder_image_fk" FOREIGN KEY ("founder_image_id") REFERENCES "media"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "about" ADD CONSTRAINT "about_seo_image_fk" FOREIGN KEY ("seo_open_graph_image_id") REFERENCES "media"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "about_values" ADD CONSTRAINT "about_values_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "about"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "about_milestones" ADD CONSTRAINT "about_milestones_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "about"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "contact" ADD CONSTRAINT "contact_seo_image_fk" FOREIGN KEY ("seo_open_graph_image_id") REFERENCES "media"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "contact_topics" ADD CONSTRAINT "contact_topics_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "contact"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "users_addresses" ADD CONSTRAINT "users_addresses_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "users"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_submissions_fk" FOREIGN KEY ("contact_submissions_id") REFERENCES "contact_submissions"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "about_hero_image_idx" ON "about" ("hero_image_id");
    CREATE INDEX IF NOT EXISTS "about_story_image_idx" ON "about" ("story_image_id");
    CREATE INDEX IF NOT EXISTS "about_founder_image_idx" ON "about" ("founder_image_id");
    CREATE INDEX IF NOT EXISTS "about_seo_image_idx" ON "about" ("seo_open_graph_image_id");
    CREATE INDEX IF NOT EXISTS "about_values_order_idx" ON "about_values" ("_order");
    CREATE INDEX IF NOT EXISTS "about_values_parent_idx" ON "about_values" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "about_milestones_order_idx" ON "about_milestones" ("_order");
    CREATE INDEX IF NOT EXISTS "about_milestones_parent_idx" ON "about_milestones" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "contact_seo_image_idx" ON "contact" ("seo_open_graph_image_id");
    CREATE INDEX IF NOT EXISTS "contact_topics_order_idx" ON "contact_topics" ("_order");
    CREATE INDEX IF NOT EXISTS "contact_topics_parent_idx" ON "contact_topics" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "contact_submissions_email_idx" ON "contact_submissions" ("email");
    CREATE INDEX IF NOT EXISTS "contact_submissions_topic_idx" ON "contact_submissions" ("topic");
    CREATE INDEX IF NOT EXISTS "contact_submissions_status_idx" ON "contact_submissions" ("status");
    CREATE INDEX IF NOT EXISTS "contact_submissions_fingerprint_idx" ON "contact_submissions" ("request_fingerprint");
    CREATE INDEX IF NOT EXISTS "users_addresses_order_idx" ON "users_addresses" ("_order");
    CREATE INDEX IF NOT EXISTS "users_addresses_parent_idx" ON "users_addresses" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_contact_submissions_idx" ON "payload_locked_documents_rels" ("contact_submissions_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_contact_submissions_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_contact_submissions_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "contact_submissions_id";
    DROP TABLE IF EXISTS "users_addresses" CASCADE;
    DROP TABLE IF EXISTS "contact_submissions" CASCADE;
    DROP TABLE IF EXISTS "contact_topics" CASCADE;
    DROP TABLE IF EXISTS "contact" CASCADE;
    DROP TABLE IF EXISTS "about_milestones" CASCADE;
    DROP TABLE IF EXISTS "about_values" CASCADE;
    DROP TABLE IF EXISTS "about" CASCADE;
  `);
}
