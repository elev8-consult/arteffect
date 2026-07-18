import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

/**
 * Ecommerce collections were added without updating Payload's document-lock
 * relationship table. Admin queries every collection FK on login.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "carts_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "orders_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "coupons_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "shipping_methods_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "transactions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "inventory_movements_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_carts_id_fk"
        FOREIGN KEY ("carts_id") REFERENCES "carts"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_id_fk"
        FOREIGN KEY ("orders_id") REFERENCES "orders"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coupons_id_fk"
        FOREIGN KEY ("coupons_id") REFERENCES "coupons"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shipping_methods_id_fk"
        FOREIGN KEY ("shipping_methods_id") REFERENCES "shipping_methods"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_transactions_id_fk"
        FOREIGN KEY ("transactions_id") REFERENCES "transactions"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inventory_movements_id_fk"
        FOREIGN KEY ("inventory_movements_id") REFERENCES "inventory_movements"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_carts_idx" ON "payload_locked_documents_rels" ("carts_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_orders_idx" ON "payload_locked_documents_rels" ("orders_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_coupons_idx" ON "payload_locked_documents_rels" ("coupons_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_shipping_methods_idx" ON "payload_locked_documents_rels" ("shipping_methods_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_transactions_idx" ON "payload_locked_documents_rels" ("transactions_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_inventory_movements_idx" ON "payload_locked_documents_rels" ("inventory_movements_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_inventory_movements_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_transactions_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_shipping_methods_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_coupons_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_orders_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_carts_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_inventory_movements_id_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_transactions_id_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_shipping_methods_id_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_coupons_id_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_orders_id_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_carts_id_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "inventory_movements_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "transactions_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "shipping_methods_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "coupons_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "orders_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "carts_id";
  `);
}
