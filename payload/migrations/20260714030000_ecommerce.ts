import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN CREATE TYPE "enum_users_role" AS ENUM ('admin', 'customer', 'editor'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_coupons_discount_type" AS ENUM ('percentage', 'fixed', 'free-shipping'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_coupons_currency" AS ENUM ('USD', 'LBP', 'EUR', 'GBP'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_shipping_methods_currency" AS ENUM ('USD', 'LBP', 'EUR', 'GBP'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_shipping_methods_allowed_profiles" AS ENUM ('standard', 'fragile', 'textile', 'digital'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_carts_status" AS ENUM ('active', 'converted', 'abandoned', 'expired'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_carts_currency" AS ENUM ('USD', 'LBP', 'EUR', 'GBP'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_carts_items_shipping_profile" AS ENUM ('standard', 'fragile', 'textile', 'digital'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_carts_items_currency" AS ENUM ('USD', 'LBP', 'EUR', 'GBP'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_orders_status" AS ENUM ('pending-payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'expired', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_orders_payment_status" AS ENUM ('not-started', 'pending', 'authorized', 'paid', 'failed', 'partially-refunded', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_orders_inventory_status" AS ENUM ('reserved', 'committed', 'released'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_orders_currency" AS ENUM ('USD', 'LBP', 'EUR', 'GBP'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_orders_items_shipping_profile" AS ENUM ('standard', 'fragile', 'textile', 'digital'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_orders_items_currency" AS ENUM ('USD', 'LBP', 'EUR', 'GBP'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_transactions_type" AS ENUM ('authorization', 'capture', 'sale', 'refund', 'void'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_transactions_status" AS ENUM ('pending', 'succeeded', 'failed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_transactions_currency" AS ENUM ('USD', 'LBP', 'EUR', 'GBP'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE "enum_inventory_movements_movement_type" AS ENUM ('reserve', 'release', 'sale', 'restock', 'adjustment'); EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "enum_users_role" DEFAULT 'customer' NOT NULL;
    DO $$ BEGIN
      ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'editor';
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
    UPDATE "users" SET "role" = 'admin';

    CREATE TABLE IF NOT EXISTS "coupons" (
      "id" serial PRIMARY KEY NOT NULL,
      "code" varchar NOT NULL,
      "discount_type" "enum_coupons_discount_type" NOT NULL,
      "value" numeric NOT NULL,
      "currency" "enum_coupons_currency" DEFAULT 'USD',
      "minimum_subtotal" numeric DEFAULT 0,
      "maximum_discount" numeric,
      "maximum_uses" numeric,
      "uses" numeric DEFAULT 0 NOT NULL,
      "starts_at" timestamp(3) with time zone,
      "ends_at" timestamp(3) with time zone,
      "is_active" boolean DEFAULT true NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "coupons_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer
    );

    CREATE TABLE IF NOT EXISTS "shipping_methods" (
      "id" serial PRIMARY KEY NOT NULL,
      "code" varchar NOT NULL,
      "name" varchar NOT NULL,
      "description" varchar,
      "rate" numeric NOT NULL,
      "free_above" numeric,
      "currency" "enum_shipping_methods_currency" DEFAULT 'USD' NOT NULL,
      "minimum_delivery_days" numeric NOT NULL,
      "maximum_delivery_days" numeric NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "sort_order" numeric DEFAULT 0 NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "shipping_methods_countries" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "code" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "shipping_methods_allowed_profiles" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_shipping_methods_allowed_profiles",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "carts" (
      "id" serial PRIMARY KEY NOT NULL,
      "customer_id" integer,
      "email" varchar,
      "guest_token_hash" varchar NOT NULL,
      "status" "enum_carts_status" DEFAULT 'active' NOT NULL,
      "coupon_id" integer,
      "coupon_code" varchar,
      "shipping_method_id" integer,
      "shipping_estimate_country" varchar,
      "shipping_estimate_postal_code" varchar,
      "shipping_estimate_method_code" varchar,
      "shipping_estimate_method_name" varchar,
      "shipping_estimate_minimum_delivery_days" numeric,
      "shipping_estimate_maximum_delivery_days" numeric,
      "item_count" numeric DEFAULT 0 NOT NULL,
      "subtotal" numeric DEFAULT 0 NOT NULL,
      "discount_total" numeric DEFAULT 0 NOT NULL,
      "shipping_total" numeric DEFAULT 0 NOT NULL,
      "tax_total" numeric DEFAULT 0 NOT NULL,
      "total" numeric DEFAULT 0 NOT NULL,
      "currency" "enum_carts_currency" DEFAULT 'USD' NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "carts_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "variant_id" varchar NOT NULL,
      "sku" varchar NOT NULL,
      "product_name" varchar NOT NULL,
      "variant_name" varchar NOT NULL,
      "shipping_profile" "enum_carts_items_shipping_profile" DEFAULT 'standard' NOT NULL,
      "quantity" numeric NOT NULL,
      "unit_price" numeric DEFAULT 0 NOT NULL,
      "line_total" numeric DEFAULT 0 NOT NULL,
      "currency" "enum_carts_items_currency" DEFAULT 'USD' NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "orders" (
      "id" serial PRIMARY KEY NOT NULL,
      "order_number" varchar NOT NULL,
      "cart_id" integer NOT NULL,
      "customer_id" integer,
      "customer_email" varchar NOT NULL,
      "guest_token_hash" varchar NOT NULL,
      "status" "enum_orders_status" DEFAULT 'pending-payment' NOT NULL,
      "payment_status" "enum_orders_payment_status" DEFAULT 'not-started' NOT NULL,
      "inventory_status" "enum_orders_inventory_status" DEFAULT 'reserved' NOT NULL,
      "shipping_address_name" varchar,
      "shipping_address_company" varchar,
      "shipping_address_line1" varchar,
      "shipping_address_line2" varchar,
      "shipping_address_city" varchar,
      "shipping_address_state" varchar,
      "shipping_address_postal_code" varchar,
      "shipping_address_country" varchar,
      "shipping_address_phone" varchar,
      "billing_address_name" varchar,
      "billing_address_company" varchar,
      "billing_address_line1" varchar,
      "billing_address_line2" varchar,
      "billing_address_city" varchar,
      "billing_address_state" varchar,
      "billing_address_postal_code" varchar,
      "billing_address_country" varchar,
      "billing_address_phone" varchar,
      "coupon_id" integer,
      "coupon_code" varchar,
      "shipping_method_id" integer NOT NULL,
      "shipping_method_code" varchar NOT NULL,
      "shipping_method_name" varchar NOT NULL,
      "item_count" numeric NOT NULL,
      "subtotal" numeric DEFAULT 0 NOT NULL,
      "discount_total" numeric DEFAULT 0 NOT NULL,
      "shipping_total" numeric DEFAULT 0 NOT NULL,
      "tax_total" numeric DEFAULT 0 NOT NULL,
      "total" numeric DEFAULT 0 NOT NULL,
      "currency" "enum_orders_currency" DEFAULT 'USD' NOT NULL,
      "reservation_expires_at" timestamp(3) with time zone NOT NULL,
      "paid_at" timestamp(3) with time zone,
      "cancelled_at" timestamp(3) with time zone,
      "notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "orders_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "variant_id" varchar NOT NULL,
      "sku" varchar NOT NULL,
      "product_name" varchar NOT NULL,
      "variant_name" varchar NOT NULL,
      "shipping_profile" "enum_orders_items_shipping_profile" DEFAULT 'standard' NOT NULL,
      "quantity" numeric NOT NULL,
      "unit_price" numeric DEFAULT 0 NOT NULL,
      "line_total" numeric DEFAULT 0 NOT NULL,
      "currency" "enum_orders_items_currency" DEFAULT 'USD' NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "transactions" (
      "id" serial PRIMARY KEY NOT NULL,
      "order_id" integer NOT NULL,
      "provider" varchar NOT NULL,
      "type" "enum_transactions_type" NOT NULL,
      "status" "enum_transactions_status" NOT NULL,
      "amount" numeric DEFAULT 0 NOT NULL,
      "currency" "enum_transactions_currency" DEFAULT 'USD' NOT NULL,
      "idempotency_key" varchar NOT NULL,
      "external_id" varchar,
      "provider_data" jsonb,
      "failure_code" varchar,
      "failure_message" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "inventory_movements" (
      "id" serial PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "variant_id" varchar NOT NULL,
      "sku" varchar NOT NULL,
      "cart_id" integer,
      "order_id" integer,
      "movement_type" "enum_inventory_movements_movement_type" NOT NULL,
      "quantity" numeric NOT NULL,
      "inventory_after" numeric NOT NULL,
      "reserved_after" numeric NOT NULL,
      "idempotency_key" varchar NOT NULL,
      "reason" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "products_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer
    );

    DO $$ BEGIN ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "coupons"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "products"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "shipping_methods_countries" ADD CONSTRAINT "shipping_methods_countries_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "shipping_methods"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "shipping_methods_allowed_profiles" ADD CONSTRAINT "shipping_methods_profiles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "shipping_methods"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_fk" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "carts" ADD CONSTRAINT "carts_coupon_fk" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "carts" ADD CONSTRAINT "carts_shipping_method_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "shipping_methods"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "carts"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_product_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE restrict; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "orders" ADD CONSTRAINT "orders_cart_fk" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE restrict; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_fk" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_fk" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_method_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "shipping_methods"("id") ON DELETE restrict; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "orders"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE restrict; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE restrict; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_cart_fk" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_order_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE set null; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "products"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "products"("id") ON DELETE cascade; EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons" ("code");
    CREATE INDEX IF NOT EXISTS "coupons_active_idx" ON "coupons" ("is_active");
    CREATE INDEX IF NOT EXISTS "coupons_rels_parent_idx" ON "coupons_rels" ("parent_id");
    CREATE INDEX IF NOT EXISTS "coupons_rels_path_idx" ON "coupons_rels" ("path");
    CREATE UNIQUE INDEX IF NOT EXISTS "shipping_methods_code_idx" ON "shipping_methods" ("code");
    CREATE INDEX IF NOT EXISTS "shipping_methods_active_idx" ON "shipping_methods" ("is_active");
    CREATE INDEX IF NOT EXISTS "shipping_methods_countries_parent_idx" ON "shipping_methods_countries" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "shipping_methods_profiles_parent_idx" ON "shipping_methods_allowed_profiles" ("parent_id");
    CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");
    CREATE UNIQUE INDEX IF NOT EXISTS "carts_guest_token_hash_idx" ON "carts" ("guest_token_hash");
    CREATE INDEX IF NOT EXISTS "carts_customer_idx" ON "carts" ("customer_id");
    CREATE INDEX IF NOT EXISTS "carts_status_idx" ON "carts" ("status");
    CREATE INDEX IF NOT EXISTS "carts_expires_at_idx" ON "carts" ("expires_at");
    CREATE INDEX IF NOT EXISTS "carts_items_parent_idx" ON "carts_items" ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_number_idx" ON "orders" ("order_number");
    CREATE UNIQUE INDEX IF NOT EXISTS "orders_cart_idx" ON "orders" ("cart_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "orders_guest_token_hash_idx" ON "orders" ("guest_token_hash");
    CREATE INDEX IF NOT EXISTS "orders_customer_idx" ON "orders" ("customer_id");
    CREATE INDEX IF NOT EXISTS "orders_email_idx" ON "orders" ("customer_email");
    CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");
    CREATE INDEX IF NOT EXISTS "orders_payment_status_idx" ON "orders" ("payment_status");
    CREATE INDEX IF NOT EXISTS "orders_reservation_expires_idx" ON "orders" ("reservation_expires_at");
    CREATE INDEX IF NOT EXISTS "orders_items_parent_idx" ON "orders_items" ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "transactions_idempotency_idx" ON "transactions" ("idempotency_key");
    CREATE INDEX IF NOT EXISTS "transactions_order_idx" ON "transactions" ("order_id");
    CREATE INDEX IF NOT EXISTS "transactions_provider_idx" ON "transactions" ("provider");
    CREATE UNIQUE INDEX IF NOT EXISTS "inventory_movements_idempotency_idx" ON "inventory_movements" ("idempotency_key");
    CREATE INDEX IF NOT EXISTS "inventory_movements_product_idx" ON "inventory_movements" ("product_id");
    CREATE INDEX IF NOT EXISTS "inventory_movements_variant_idx" ON "inventory_movements" ("variant_id");
    CREATE INDEX IF NOT EXISTS "inventory_movements_order_idx" ON "inventory_movements" ("order_id");
    CREATE INDEX IF NOT EXISTS "products_rels_parent_idx" ON "products_rels" ("parent_id");
    CREATE INDEX IF NOT EXISTS "products_rels_path_idx" ON "products_rels" ("path");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "products_rels" CASCADE;
    DROP TABLE IF EXISTS "inventory_movements" CASCADE;
    DROP TABLE IF EXISTS "transactions" CASCADE;
    DROP TABLE IF EXISTS "orders_items" CASCADE;
    DROP TABLE IF EXISTS "orders" CASCADE;
    DROP TABLE IF EXISTS "carts_items" CASCADE;
    DROP TABLE IF EXISTS "carts" CASCADE;
    DROP TABLE IF EXISTS "shipping_methods_allowed_profiles" CASCADE;
    DROP TABLE IF EXISTS "shipping_methods_countries" CASCADE;
    DROP TABLE IF EXISTS "shipping_methods" CASCADE;
    DROP TABLE IF EXISTS "coupons_rels" CASCADE;
    DROP TABLE IF EXISTS "coupons" CASCADE;
    ALTER TABLE "users" DROP COLUMN IF EXISTS "role";
    DROP TYPE IF EXISTS "enum_inventory_movements_movement_type";
    DROP TYPE IF EXISTS "enum_transactions_currency";
    DROP TYPE IF EXISTS "enum_transactions_status";
    DROP TYPE IF EXISTS "enum_transactions_type";
    DROP TYPE IF EXISTS "enum_orders_items_currency";
    DROP TYPE IF EXISTS "enum_orders_items_shipping_profile";
    DROP TYPE IF EXISTS "enum_orders_currency";
    DROP TYPE IF EXISTS "enum_orders_inventory_status";
    DROP TYPE IF EXISTS "enum_orders_payment_status";
    DROP TYPE IF EXISTS "enum_orders_status";
    DROP TYPE IF EXISTS "enum_carts_items_currency";
    DROP TYPE IF EXISTS "enum_carts_items_shipping_profile";
    DROP TYPE IF EXISTS "enum_carts_currency";
    DROP TYPE IF EXISTS "enum_carts_status";
    DROP TYPE IF EXISTS "enum_shipping_methods_allowed_profiles";
    DROP TYPE IF EXISTS "enum_shipping_methods_currency";
    DROP TYPE IF EXISTS "enum_coupons_currency";
    DROP TYPE IF EXISTS "enum_coupons_discount_type";
    DROP TYPE IF EXISTS "enum_users_role";
  `);
}
