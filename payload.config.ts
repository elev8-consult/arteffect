import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import sharp from "sharp";

import { resolveSiteUrl } from "./lib/site-url";
import { Artists } from "./payload/collections/Artists";
import { Artworks } from "./payload/collections/Artworks";
import { Causes } from "./payload/collections/Causes";
import { ContactSubmissions } from "./payload/collections/ContactSubmissions";
import { Carts } from "./payload/collections/Carts";
import { Coupons } from "./payload/collections/Coupons";
import { Drops } from "./payload/collections/Drops";
import { FAQs } from "./payload/collections/FAQs";
import { HomepageSections } from "./payload/collections/HomepageSections";
import { ImpactStats } from "./payload/collections/ImpactStats";
import { InventoryMovements } from "./payload/collections/InventoryMovements";
import { ImpactEntries } from "./payload/collections/ImpactEntries";
import { Journal } from "./payload/collections/Journal";
import { Media } from "./payload/collections/Media";
import { Newsletter } from "./payload/collections/Newsletter";
import { Orders } from "./payload/collections/Orders";
import { Products } from "./payload/collections/Products";
import { ShippingMethods } from "./payload/collections/ShippingMethods";
import { Testimonials } from "./payload/collections/Testimonials";
import { Transactions } from "./payload/collections/Transactions";
import { Users } from "./payload/collections/Users";
import { About } from "./payload/globals/About";
import { Contact } from "./payload/globals/Contact";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
const isProductionBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build";
const payloadSecret =
  process.env.PAYLOAD_SECRET ??
  (process.env.NODE_ENV !== "production" || isProductionBuild
    ? randomBytes(32).toString("base64url")
    : "");
const siteUrl = resolveSiteUrl();

if (!payloadSecret) {
  throw new Error("PAYLOAD_SECRET must be set before starting Payload in production.");
}

if (process.env.NODE_ENV === "production" && !isProductionBuild && !databaseUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL must be set before starting Payload in production.");
}

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname)
    },
    meta: {
      titleSuffix: " | ArtEffect CMS"
    },
    user: Users.slug
  },
  collections: [
    Users,
    Media,
    Products,
    Drops,
    Artworks,
    Artists,
    Causes,
    ImpactStats,
    ImpactEntries,
    Journal,
    Testimonials,
    FAQs,
    HomepageSections,
    Newsletter,
    Carts,
    Orders,
    Coupons,
    ShippingMethods,
    Transactions,
    InventoryMovements,
    ContactSubmissions
  ],
  globals: [About, Contact],
  cors: [siteUrl],
  csrf: [siteUrl],
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, "payload/migrations"),
    pool: {
      connectionString: databaseUrl
    },
    push: process.env.NODE_ENV === "development"
  }),
  editor: lexicalEditor(),
  graphQL: {
    schemaOutputFile: path.resolve(dirname, "payload-schema.graphql")
  },
  secret: payloadSecret,
  serverURL: siteUrl,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts")
  }
});
