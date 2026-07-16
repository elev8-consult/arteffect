import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "email" varchar NOT NULL,
      "reset_password_token" varchar,
      "reset_password_expiration" timestamp(3) with time zone,
      "salt" varchar,
      "hash" varchar,
      "login_attempts" numeric DEFAULT 0,
      "lock_until" timestamp(3) with time zone
    );

    CREATE TABLE IF NOT EXISTS "users_sessions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "created_at" timestamp(3) with time zone,
      "expires_at" timestamp(3) with time zone NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "media" (
      "id" serial PRIMARY KEY NOT NULL,
      "alt" varchar NOT NULL,
      "caption" varchar,
      "credit" varchar,
      "usage" varchar DEFAULT 'editorial',
      "focal_point_x" numeric DEFAULT 50,
      "focal_point_y" numeric DEFAULT 50,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "url" varchar,
      "thumbnail_url" varchar,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric
    );

    CREATE TABLE IF NOT EXISTS "products" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL,
      "name" varchar NOT NULL,
      "form" varchar NOT NULL,
      "price" varchar NOT NULL,
      "currency" varchar DEFAULT 'USD',
      "edition" varchar NOT NULL,
      "image_id" integer,
      "external_image_url" varchar,
      "image_alt" varchar NOT NULL,
      "story" varchar NOT NULL,
      "drop_id" integer,
      "artist_id" integer,
      "artwork_id" integer,
      "cause_id" integer,
      "total_inventory" numeric DEFAULT 0,
      "shipping_profile" varchar DEFAULT 'standard',
      "is_featured" boolean DEFAULT false,
      "seo_meta_title" varchar,
      "seo_meta_description" varchar,
      "seo_open_graph_image_id" integer,
      "is_published" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "products_materials" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "products_variants" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "sku" varchar NOT NULL,
      "price" numeric NOT NULL,
      "compare_at_price" numeric,
      "inventory" numeric DEFAULT 0 NOT NULL,
      "reserved" numeric DEFAULT 0 NOT NULL,
      "low_stock_threshold" numeric DEFAULT 5,
      "is_available" boolean DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS "products_variants_attributes" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "value" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "drops" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL,
      "eyebrow" varchar NOT NULL,
      "title" varchar NOT NULL,
      "summary" varchar NOT NULL,
      "batch_size" numeric NOT NULL,
      "reserved" numeric NOT NULL,
      "status" varchar DEFAULT 'draft' NOT NULL,
      "opens_at" timestamp(3) with time zone,
      "closes_at" timestamp(3) with time zone NOT NULL,
      "artist_id" integer,
      "artwork_id" integer,
      "cause_id" integer,
      "image_id" integer,
      "external_image_url" varchar,
      "image_alt" varchar NOT NULL,
      "cta_label" varchar,
      "cta_href" varchar,
      "cta_style" varchar DEFAULT 'primary',
      "seo_meta_title" varchar,
      "seo_meta_description" varchar,
      "seo_open_graph_image_id" integer,
      "is_current" boolean DEFAULT false,
      "is_published" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "drops_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer
    );

    CREATE TABLE IF NOT EXISTS "drops_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer NOT NULL,
      "caption" varchar
    );

    CREATE TABLE IF NOT EXISTS "drops_milestones" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "value" varchar NOT NULL,
      "progress" numeric NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "drops_allocation" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "percentage" numeric NOT NULL,
      "description" varchar
    );

    CREATE TABLE IF NOT EXISTS "artworks" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL,
      "title" varchar NOT NULL,
      "artist_line" varchar NOT NULL,
      "summary" varchar NOT NULL,
      "image_id" integer,
      "external_image_url" varchar,
      "image_alt" varchar NOT NULL,
      "is_current" boolean DEFAULT false,
      "is_published" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "artworks_details" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "title" varchar NOT NULL,
      "body" varchar NOT NULL,
      "x" numeric NOT NULL,
      "y" numeric NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "artists" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL,
      "name" varchar NOT NULL,
      "role" varchar NOT NULL,
      "quote" varchar NOT NULL,
      "bio" varchar NOT NULL,
      "location" varchar,
      "website" varchar,
      "instagram" varchar,
      "image_id" integer,
      "external_image_url" varchar,
      "image_alt" varchar NOT NULL,
      "is_featured" boolean DEFAULT false,
      "seo_meta_title" varchar,
      "seo_meta_description" varchar,
      "seo_open_graph_image_id" integer,
      "is_current" boolean DEFAULT false,
      "is_published" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "artists_portrait_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer NOT NULL,
      "caption" varchar
    );

    CREATE TABLE IF NOT EXISTS "artists_facts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "value" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "artists_representative_works" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "year" varchar,
      "medium" varchar,
      "image_id" integer
    );

    CREATE TABLE IF NOT EXISTS "causes" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL,
      "name" varchar NOT NULL,
      "focus" varchar NOT NULL,
      "legal_name" varchar,
      "registration_number" varchar,
      "website" varchar,
      "summary" varchar NOT NULL,
      "contact_name" varchar,
      "contact_email" varchar,
      "contact_phone" varchar,
      "image_id" integer,
      "external_image_url" varchar,
      "image_alt" varchar NOT NULL,
      "verification_status" varchar DEFAULT 'pending',
      "verification_verified_at" timestamp(3) with time zone,
      "verification_notes" varchar,
      "is_featured" boolean DEFAULT false,
      "seo_meta_title" varchar,
      "seo_meta_description" varchar,
      "seo_open_graph_image_id" integer,
      "is_current" boolean DEFAULT false,
      "is_published" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "causes_metrics" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "value" varchar NOT NULL,
      "progress" numeric NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "causes_programs" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "description" varchar NOT NULL,
      "allocation" varchar
    );

    CREATE TABLE IF NOT EXISTS "causes_reports" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "period" varchar NOT NULL,
      "external_url" varchar
    );

    CREATE TABLE IF NOT EXISTS "impact_stats" (
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "value" numeric NOT NULL,
      "metric_type" varchar DEFAULT 'projected' NOT NULL,
      "prefix" varchar,
      "suffix" varchar,
      "detail" varchar NOT NULL,
      "drop_id" integer,
      "cause_id" integer,
      "period" varchar,
      "source" varchar,
      "measured_at" timestamp(3) with time zone,
      "is_featured" boolean DEFAULT false,
      "is_published" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "journal" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL,
      "title" varchar NOT NULL,
      "category" varchar DEFAULT 'studio' NOT NULL,
      "excerpt" varchar NOT NULL,
      "image_id" integer,
      "external_image_url" varchar,
      "image_alt" varchar NOT NULL,
      "content" jsonb NOT NULL,
      "author_name" varchar DEFAULT 'ArtEffect' NOT NULL,
      "published_at" timestamp(3) with time zone,
      "read_time" numeric,
      "related_drop_id" integer,
      "related_artist_id" integer,
      "related_cause_id" integer,
      "is_featured" boolean DEFAULT false,
      "seo_meta_title" varchar,
      "seo_meta_description" varchar,
      "seo_open_graph_image_id" integer,
      "is_published" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "journal_tags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "testimonials" (
      "id" serial PRIMARY KEY NOT NULL,
      "quote" varchar NOT NULL,
      "person_name" varchar NOT NULL,
      "relationship" varchar DEFAULT 'collector' NOT NULL,
      "role" varchar,
      "avatar_id" integer,
      "rating" numeric,
      "source" varchar,
      "source_url" varchar,
      "related_drop_id" integer,
      "is_featured" boolean DEFAULT false,
      "is_published" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "faqs" (
      "id" serial PRIMARY KEY NOT NULL,
      "question" varchar NOT NULL,
      "answer" jsonb NOT NULL,
      "category" varchar DEFAULT 'orders' NOT NULL,
      "audience" varchar DEFAULT 'collectors',
      "is_published" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "homepage_sections" (
      "id" serial PRIMARY KEY NOT NULL,
      "section" varchar NOT NULL,
      "layout" varchar DEFAULT 'editorial' NOT NULL,
      "title" varchar NOT NULL,
      "eyebrow" varchar,
      "summary" varchar,
      "image_id" integer,
      "external_image_url" varchar,
      "image_alt" varchar NOT NULL,
      "signature_interaction" varchar DEFAULT 'image-reveal',
      "cta_label" varchar,
      "cta_href" varchar,
      "cta_style" varchar DEFAULT 'primary',
      "featured_drop_id" integer,
      "featured_artist_id" integer,
      "featured_artwork_id" integer,
      "featured_cause_id" integer,
      "is_current" boolean DEFAULT false,
      "is_published" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "homepage_sections_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer,
      "impact_stats_id" integer
    );

    CREATE TABLE IF NOT EXISTS "homepage_sections_supporting_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "value" varchar,
      "description" varchar
    );

    CREATE TABLE IF NOT EXISTS "newsletter" (
      "id" serial PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL,
      "status" varchar DEFAULT 'subscribed' NOT NULL,
      "first_name" varchar,
      "source" varchar DEFAULT 'homepage',
      "consent_accepted_marketing" boolean DEFAULT false NOT NULL,
      "consent_accepted_at" timestamp(3) with time zone,
      "consent_ip_address" varchar,
      "notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "newsletter_interests" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "topic" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
      "id" serial PRIMARY KEY NOT NULL,
      "global_slug" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "users_id" integer,
      "media_id" integer,
      "products_id" integer,
      "drops_id" integer,
      "artworks_id" integer,
      "artists_id" integer,
      "causes_id" integer,
      "impact_stats_id" integer,
      "journal_id" integer,
      "testimonials_id" integer,
      "faqs_id" integer,
      "homepage_sections_id" integer,
      "newsletter_id" integer
    );

    CREATE TABLE IF NOT EXISTS "payload_preferences" (
      "id" serial PRIMARY KEY NOT NULL,
      "key" varchar,
      "value" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "users_id" integer
    );

    DO $$ BEGIN
      ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "users"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products" ADD CONSTRAINT "products_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products" ADD CONSTRAINT "products_drop_id_drops_id_fk"
        FOREIGN KEY ("drop_id") REFERENCES "drops"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products" ADD CONSTRAINT "products_artist_id_artists_id_fk"
        FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products" ADD CONSTRAINT "products_artwork_id_artworks_id_fk"
        FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products" ADD CONSTRAINT "products_cause_id_causes_id_fk"
        FOREIGN KEY ("cause_id") REFERENCES "causes"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products" ADD CONSTRAINT "products_seo_open_graph_image_id_media_id_fk"
        FOREIGN KEY ("seo_open_graph_image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products_materials" ADD CONSTRAINT "products_materials_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "products"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "products"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products_variants_attributes" ADD CONSTRAINT "products_variants_attributes_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "products_variants"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "drops" ADD CONSTRAINT "drops_artist_id_artists_id_fk"
        FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "drops" ADD CONSTRAINT "drops_artwork_id_artworks_id_fk"
        FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "drops" ADD CONSTRAINT "drops_cause_id_causes_id_fk"
        FOREIGN KEY ("cause_id") REFERENCES "causes"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "drops" ADD CONSTRAINT "drops_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "drops" ADD CONSTRAINT "drops_seo_open_graph_image_id_media_id_fk"
        FOREIGN KEY ("seo_open_graph_image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "drops_rels" ADD CONSTRAINT "drops_rels_parent_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "drops"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "drops_rels" ADD CONSTRAINT "drops_rels_products_id_fk"
        FOREIGN KEY ("products_id") REFERENCES "products"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "drops_gallery" ADD CONSTRAINT "drops_gallery_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "drops"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "drops_gallery" ADD CONSTRAINT "drops_gallery_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "drops_milestones" ADD CONSTRAINT "drops_milestones_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "drops"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "drops_allocation" ADD CONSTRAINT "drops_allocation_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "drops"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "artworks" ADD CONSTRAINT "artworks_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "artworks_details" ADD CONSTRAINT "artworks_details_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "artworks"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "artists" ADD CONSTRAINT "artists_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "artists" ADD CONSTRAINT "artists_seo_open_graph_image_id_media_id_fk"
        FOREIGN KEY ("seo_open_graph_image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "artists_portrait_gallery" ADD CONSTRAINT "artists_portrait_gallery_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "artists"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "artists_portrait_gallery" ADD CONSTRAINT "artists_portrait_gallery_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "artists_facts" ADD CONSTRAINT "artists_facts_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "artists"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "artists_representative_works" ADD CONSTRAINT "artists_representative_works_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "artists"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "artists_representative_works" ADD CONSTRAINT "artists_representative_works_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "causes" ADD CONSTRAINT "causes_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "causes" ADD CONSTRAINT "causes_seo_open_graph_image_id_media_id_fk"
        FOREIGN KEY ("seo_open_graph_image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "causes_metrics" ADD CONSTRAINT "causes_metrics_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "causes"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "causes_programs" ADD CONSTRAINT "causes_programs_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "causes"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "causes_reports" ADD CONSTRAINT "causes_reports_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "causes"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "impact_stats" ADD CONSTRAINT "impact_stats_drop_id_drops_id_fk"
        FOREIGN KEY ("drop_id") REFERENCES "drops"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "impact_stats" ADD CONSTRAINT "impact_stats_cause_id_causes_id_fk"
        FOREIGN KEY ("cause_id") REFERENCES "causes"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "journal" ADD CONSTRAINT "journal_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "journal" ADD CONSTRAINT "journal_related_drop_id_drops_id_fk"
        FOREIGN KEY ("related_drop_id") REFERENCES "drops"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "journal" ADD CONSTRAINT "journal_related_artist_id_artists_id_fk"
        FOREIGN KEY ("related_artist_id") REFERENCES "artists"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "journal" ADD CONSTRAINT "journal_related_cause_id_causes_id_fk"
        FOREIGN KEY ("related_cause_id") REFERENCES "causes"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "journal" ADD CONSTRAINT "journal_seo_open_graph_image_id_media_id_fk"
        FOREIGN KEY ("seo_open_graph_image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "journal_tags" ADD CONSTRAINT "journal_tags_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "journal"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_avatar_id_media_id_fk"
        FOREIGN KEY ("avatar_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_related_drop_id_drops_id_fk"
        FOREIGN KEY ("related_drop_id") REFERENCES "drops"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_featured_drop_id_drops_id_fk"
        FOREIGN KEY ("featured_drop_id") REFERENCES "drops"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_featured_artist_id_artists_id_fk"
        FOREIGN KEY ("featured_artist_id") REFERENCES "artists"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_featured_artwork_id_artworks_id_fk"
        FOREIGN KEY ("featured_artwork_id") REFERENCES "artworks"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_featured_cause_id_causes_id_fk"
        FOREIGN KEY ("featured_cause_id") REFERENCES "causes"("id") ON DELETE set null;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "homepage_sections_rels" ADD CONSTRAINT "homepage_sections_rels_parent_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "homepage_sections"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "homepage_sections_rels" ADD CONSTRAINT "homepage_sections_rels_products_id_fk"
        FOREIGN KEY ("products_id") REFERENCES "products"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "homepage_sections_rels" ADD CONSTRAINT "homepage_sections_rels_impact_stats_id_fk"
        FOREIGN KEY ("impact_stats_id") REFERENCES "impact_stats"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "homepage_sections_supporting_items" ADD CONSTRAINT "homepage_sections_supporting_items_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "homepage_sections"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "newsletter_interests" ADD CONSTRAINT "newsletter_interests_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "newsletter"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "payload_locked_documents"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_id_fk"
        FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_id_fk"
        FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_id_fk"
        FOREIGN KEY ("products_id") REFERENCES "products"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_drops_id_fk"
        FOREIGN KEY ("drops_id") REFERENCES "drops"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artworks_id_fk"
        FOREIGN KEY ("artworks_id") REFERENCES "artworks"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artists_id_fk"
        FOREIGN KEY ("artists_id") REFERENCES "artists"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_causes_id_fk"
        FOREIGN KEY ("causes_id") REFERENCES "causes"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_impact_stats_id_fk"
        FOREIGN KEY ("impact_stats_id") REFERENCES "impact_stats"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_journal_id_fk"
        FOREIGN KEY ("journal_id") REFERENCES "journal"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_id_fk"
        FOREIGN KEY ("testimonials_id") REFERENCES "testimonials"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_id_fk"
        FOREIGN KEY ("faqs_id") REFERENCES "faqs"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_homepage_sections_id_fk"
        FOREIGN KEY ("homepage_sections_id") REFERENCES "homepage_sections"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_id_fk"
        FOREIGN KEY ("newsletter_id") REFERENCES "newsletter"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_id_fk"
        FOREIGN KEY ("parent_id") REFERENCES "payload_preferences"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_id_fk"
        FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
    CREATE INDEX IF NOT EXISTS "users_sessions_order_idx" ON "users_sessions" ("_order");
    CREATE INDEX IF NOT EXISTS "users_sessions_parent_id_idx" ON "users_sessions" ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_idx" ON "products" ("slug");
    CREATE INDEX IF NOT EXISTS "products_image_idx" ON "products" ("image_id");
    CREATE INDEX IF NOT EXISTS "products_drop_idx" ON "products" ("drop_id");
    CREATE INDEX IF NOT EXISTS "products_artist_idx" ON "products" ("artist_id");
    CREATE INDEX IF NOT EXISTS "products_artwork_idx" ON "products" ("artwork_id");
    CREATE INDEX IF NOT EXISTS "products_cause_idx" ON "products" ("cause_id");
    CREATE INDEX IF NOT EXISTS "products_seo_open_graph_image_idx" ON "products" ("seo_open_graph_image_id");
    CREATE INDEX IF NOT EXISTS "products_materials_order_idx" ON "products_materials" ("_order");
    CREATE INDEX IF NOT EXISTS "products_materials_parent_id_idx" ON "products_materials" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "products_variants_order_idx" ON "products_variants" ("_order");
    CREATE INDEX IF NOT EXISTS "products_variants_parent_id_idx" ON "products_variants" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "products_variants_attributes_order_idx" ON "products_variants_attributes" ("_order");
    CREATE INDEX IF NOT EXISTS "products_variants_attributes_parent_id_idx" ON "products_variants_attributes" ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "drops_slug_idx" ON "drops" ("slug");
    CREATE INDEX IF NOT EXISTS "drops_artist_idx" ON "drops" ("artist_id");
    CREATE INDEX IF NOT EXISTS "drops_artwork_idx" ON "drops" ("artwork_id");
    CREATE INDEX IF NOT EXISTS "drops_cause_idx" ON "drops" ("cause_id");
    CREATE INDEX IF NOT EXISTS "drops_image_idx" ON "drops" ("image_id");
    CREATE INDEX IF NOT EXISTS "drops_seo_open_graph_image_idx" ON "drops" ("seo_open_graph_image_id");
    CREATE INDEX IF NOT EXISTS "drops_rels_order_idx" ON "drops_rels" ("order");
    CREATE INDEX IF NOT EXISTS "drops_rels_parent_idx" ON "drops_rels" ("parent_id");
    CREATE INDEX IF NOT EXISTS "drops_rels_path_idx" ON "drops_rels" ("path");
    CREATE INDEX IF NOT EXISTS "drops_rels_products_idx" ON "drops_rels" ("products_id");
    CREATE INDEX IF NOT EXISTS "drops_gallery_order_idx" ON "drops_gallery" ("_order");
    CREATE INDEX IF NOT EXISTS "drops_gallery_parent_id_idx" ON "drops_gallery" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "drops_gallery_image_idx" ON "drops_gallery" ("image_id");
    CREATE INDEX IF NOT EXISTS "drops_milestones_order_idx" ON "drops_milestones" ("_order");
    CREATE INDEX IF NOT EXISTS "drops_milestones_parent_id_idx" ON "drops_milestones" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "drops_allocation_order_idx" ON "drops_allocation" ("_order");
    CREATE INDEX IF NOT EXISTS "drops_allocation_parent_id_idx" ON "drops_allocation" ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "artworks_slug_idx" ON "artworks" ("slug");
    CREATE INDEX IF NOT EXISTS "artworks_image_idx" ON "artworks" ("image_id");
    CREATE INDEX IF NOT EXISTS "artworks_details_order_idx" ON "artworks_details" ("_order");
    CREATE INDEX IF NOT EXISTS "artworks_details_parent_id_idx" ON "artworks_details" ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "artists_slug_idx" ON "artists" ("slug");
    CREATE INDEX IF NOT EXISTS "artists_image_idx" ON "artists" ("image_id");
    CREATE INDEX IF NOT EXISTS "artists_seo_open_graph_image_idx" ON "artists" ("seo_open_graph_image_id");
    CREATE INDEX IF NOT EXISTS "artists_portrait_gallery_order_idx" ON "artists_portrait_gallery" ("_order");
    CREATE INDEX IF NOT EXISTS "artists_portrait_gallery_parent_id_idx" ON "artists_portrait_gallery" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "artists_portrait_gallery_image_idx" ON "artists_portrait_gallery" ("image_id");
    CREATE INDEX IF NOT EXISTS "artists_facts_order_idx" ON "artists_facts" ("_order");
    CREATE INDEX IF NOT EXISTS "artists_facts_parent_id_idx" ON "artists_facts" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "artists_representative_works_order_idx" ON "artists_representative_works" ("_order");
    CREATE INDEX IF NOT EXISTS "artists_representative_works_parent_id_idx" ON "artists_representative_works" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "artists_representative_works_image_idx" ON "artists_representative_works" ("image_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "causes_slug_idx" ON "causes" ("slug");
    CREATE INDEX IF NOT EXISTS "causes_image_idx" ON "causes" ("image_id");
    CREATE INDEX IF NOT EXISTS "causes_seo_open_graph_image_idx" ON "causes" ("seo_open_graph_image_id");
    CREATE INDEX IF NOT EXISTS "causes_metrics_order_idx" ON "causes_metrics" ("_order");
    CREATE INDEX IF NOT EXISTS "causes_metrics_parent_id_idx" ON "causes_metrics" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "causes_programs_order_idx" ON "causes_programs" ("_order");
    CREATE INDEX IF NOT EXISTS "causes_programs_parent_id_idx" ON "causes_programs" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "causes_reports_order_idx" ON "causes_reports" ("_order");
    CREATE INDEX IF NOT EXISTS "causes_reports_parent_id_idx" ON "causes_reports" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "impact_stats_drop_idx" ON "impact_stats" ("drop_id");
    CREATE INDEX IF NOT EXISTS "impact_stats_cause_idx" ON "impact_stats" ("cause_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "journal_slug_idx" ON "journal" ("slug");
    CREATE INDEX IF NOT EXISTS "journal_image_idx" ON "journal" ("image_id");
    CREATE INDEX IF NOT EXISTS "journal_related_drop_idx" ON "journal" ("related_drop_id");
    CREATE INDEX IF NOT EXISTS "journal_related_artist_idx" ON "journal" ("related_artist_id");
    CREATE INDEX IF NOT EXISTS "journal_related_cause_idx" ON "journal" ("related_cause_id");
    CREATE INDEX IF NOT EXISTS "journal_seo_open_graph_image_idx" ON "journal" ("seo_open_graph_image_id");
    CREATE INDEX IF NOT EXISTS "journal_tags_order_idx" ON "journal_tags" ("_order");
    CREATE INDEX IF NOT EXISTS "journal_tags_parent_id_idx" ON "journal_tags" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "testimonials_avatar_idx" ON "testimonials" ("avatar_id");
    CREATE INDEX IF NOT EXISTS "testimonials_related_drop_idx" ON "testimonials" ("related_drop_id");
    CREATE INDEX IF NOT EXISTS "homepage_sections_image_idx" ON "homepage_sections" ("image_id");
    CREATE INDEX IF NOT EXISTS "homepage_sections_featured_drop_idx" ON "homepage_sections" ("featured_drop_id");
    CREATE INDEX IF NOT EXISTS "homepage_sections_featured_artist_idx" ON "homepage_sections" ("featured_artist_id");
    CREATE INDEX IF NOT EXISTS "homepage_sections_featured_artwork_idx" ON "homepage_sections" ("featured_artwork_id");
    CREATE INDEX IF NOT EXISTS "homepage_sections_featured_cause_idx" ON "homepage_sections" ("featured_cause_id");
    CREATE INDEX IF NOT EXISTS "homepage_sections_rels_order_idx" ON "homepage_sections_rels" ("order");
    CREATE INDEX IF NOT EXISTS "homepage_sections_rels_parent_idx" ON "homepage_sections_rels" ("parent_id");
    CREATE INDEX IF NOT EXISTS "homepage_sections_rels_path_idx" ON "homepage_sections_rels" ("path");
    CREATE INDEX IF NOT EXISTS "homepage_sections_rels_products_idx" ON "homepage_sections_rels" ("products_id");
    CREATE INDEX IF NOT EXISTS "homepage_sections_rels_impact_stats_idx" ON "homepage_sections_rels" ("impact_stats_id");
    CREATE INDEX IF NOT EXISTS "homepage_sections_supporting_items_order_idx" ON "homepage_sections_supporting_items" ("_order");
    CREATE INDEX IF NOT EXISTS "homepage_sections_supporting_items_parent_id_idx" ON "homepage_sections_supporting_items" ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_email_idx" ON "newsletter" ("email");
    CREATE INDEX IF NOT EXISTS "newsletter_interests_order_idx" ON "newsletter_interests" ("_order");
    CREATE INDEX IF NOT EXISTS "newsletter_interests_parent_id_idx" ON "newsletter_interests" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" ("parent_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_idx" ON "payload_locked_documents_rels" ("users_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_idx" ON "payload_locked_documents_rels" ("media_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_products_idx" ON "payload_locked_documents_rels" ("products_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_drops_idx" ON "payload_locked_documents_rels" ("drops_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_artworks_idx" ON "payload_locked_documents_rels" ("artworks_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_artists_idx" ON "payload_locked_documents_rels" ("artists_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_causes_idx" ON "payload_locked_documents_rels" ("causes_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_impact_stats_idx" ON "payload_locked_documents_rels" ("impact_stats_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_journal_idx" ON "payload_locked_documents_rels" ("journal_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_testimonials_idx" ON "payload_locked_documents_rels" ("testimonials_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_faqs_idx" ON "payload_locked_documents_rels" ("faqs_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_homepage_sections_idx" ON "payload_locked_documents_rels" ("homepage_sections_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_newsletter_idx" ON "payload_locked_documents_rels" ("newsletter_id");
    CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" ("key");
    CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" ("parent_id");
    CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_idx" ON "payload_preferences_rels" ("users_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "payload_preferences_rels" CASCADE;
    DROP TABLE IF EXISTS "payload_preferences" CASCADE;
    DROP TABLE IF EXISTS "payload_locked_documents_rels" CASCADE;
    DROP TABLE IF EXISTS "payload_locked_documents" CASCADE;
    DROP TABLE IF EXISTS "newsletter_interests" CASCADE;
    DROP TABLE IF EXISTS "newsletter" CASCADE;
    DROP TABLE IF EXISTS "homepage_sections_supporting_items" CASCADE;
    DROP TABLE IF EXISTS "homepage_sections_rels" CASCADE;
    DROP TABLE IF EXISTS "homepage_sections" CASCADE;
    DROP TABLE IF EXISTS "faqs" CASCADE;
    DROP TABLE IF EXISTS "testimonials" CASCADE;
    DROP TABLE IF EXISTS "journal_tags" CASCADE;
    DROP TABLE IF EXISTS "journal" CASCADE;
    DROP TABLE IF EXISTS "impact_stats" CASCADE;
    DROP TABLE IF EXISTS "causes_reports" CASCADE;
    DROP TABLE IF EXISTS "causes_programs" CASCADE;
    DROP TABLE IF EXISTS "causes_metrics" CASCADE;
    DROP TABLE IF EXISTS "causes" CASCADE;
    DROP TABLE IF EXISTS "artists_representative_works" CASCADE;
    DROP TABLE IF EXISTS "artists_facts" CASCADE;
    DROP TABLE IF EXISTS "artists_portrait_gallery" CASCADE;
    DROP TABLE IF EXISTS "artists" CASCADE;
    DROP TABLE IF EXISTS "artworks_details" CASCADE;
    DROP TABLE IF EXISTS "artworks" CASCADE;
    DROP TABLE IF EXISTS "drops_allocation" CASCADE;
    DROP TABLE IF EXISTS "drops_milestones" CASCADE;
    DROP TABLE IF EXISTS "drops_gallery" CASCADE;
    DROP TABLE IF EXISTS "drops_rels" CASCADE;
    DROP TABLE IF EXISTS "drops" CASCADE;
    DROP TABLE IF EXISTS "products_variants_attributes" CASCADE;
    DROP TABLE IF EXISTS "products_variants" CASCADE;
    DROP TABLE IF EXISTS "products_materials" CASCADE;
    DROP TABLE IF EXISTS "products" CASCADE;
    DROP TABLE IF EXISTS "media" CASCADE;
    DROP TABLE IF EXISTS "users_sessions" CASCADE;
    DROP TABLE IF EXISTS "users" CASCADE;
  `);
}
