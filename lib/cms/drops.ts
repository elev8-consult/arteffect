import { unstable_noStore as noStore } from "next/cache";

import { staticShowcaseContent } from "@/data/showcase";
import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import { getShopProducts, mapShopProduct } from "@/lib/cms/products";
import type {
  DropAllocation,
  DropCta,
  DropGalleryImage,
  DropShowcase,
  DropStatus
} from "@/types/drop";
import type { Artist, Artwork, Cause, DropMilestone } from "@/types/showcase";
import type { ShopProduct } from "@/types/shop";

type CmsRecord = Record<string, unknown>;

type PayloadClient = {
  find: (args: {
    collection: "drops";
    depth?: number;
    limit?: number;
    pagination?: boolean;
    where?: CmsRecord;
  }) => Promise<{ docs: CmsRecord[] }>;
};

export class DropNotFoundError extends Error {
  constructor() {
    super("Drop not found.");
    this.name = "DropNotFoundError";
  }
}

export async function getDropShowcase(slug: string): Promise<DropShowcase> {
  if (process.env.NODE_ENV !== "production") noStore();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    throw new DropNotFoundError();
  }

  if (!hasPayloadDatabase()) {
    if (slug !== "batch-001") throw new DropNotFoundError();
    return staticDropShowcase();
  }

  const payload = (await getPayloadClient()) as unknown as PayloadClient;
  const result = await payload.find({
    collection: "drops",
    depth: 2,
    limit: 1,
    pagination: false,
    where: {
      and: [{ slug: { equals: slug } }, { isPublished: { equals: true } }]
    }
  });
  const doc = result.docs[0];
  if (!doc) throw new DropNotFoundError();

  const linkedProducts = records(doc.products)
    .filter((product) => typeof product.name === "string")
    .map(mapShopProduct);
  const products = linkedProducts.length
    ? linkedProducts
    : (await getShopProducts({
        availability: [],
        colors: [],
        drop: slug,
        limit: 48,
        page: 1,
        sizes: [],
        sort: "featured"
      })).docs;

  return mapDropShowcase(doc, products);
}

export async function getPublishedDropSlugs(): Promise<string[]> {
  if (process.env.NODE_ENV !== "production") noStore();

  if (!hasPayloadDatabase()) return ["batch-001"];

  const payload = (await getPayloadClient()) as unknown as PayloadClient;
  const result = await payload.find({
    collection: "drops",
    depth: 0,
    limit: 100,
    pagination: false,
    where: { isPublished: { equals: true } }
  });

  return result.docs
    .map((doc) => optionalText(doc.slug))
    .filter((slug): slug is string => Boolean(slug));
}

function staticDropShowcase(): DropShowcase {
  const { artist, artwork, cause, drop } = staticShowcaseContent;
  return {
    allocation: [
      { label: "Native planting", percentage: 45, description: "Seedlings and local planting crews." },
      { label: "Three-year care", percentage: 30, description: "Irrigation, maintenance, and survival checks." },
      { label: "Artist royalty", percentage: 12, description: "Paid on every object sold." },
      { label: "Production & reporting", percentage: 13, description: "Edition making and public field updates." }
    ],
    artist,
    artwork,
    batchSize: drop.batchSize,
    cause,
    closesAt: "2026-08-31T23:59:59.000Z",
    cta: { href: "#editions", label: "Explore the editions", style: "primary" },
    eyebrow: drop.eyebrow,
    gallery: [{ alt: drop.imageAlt, src: drop.image }],
    id: "batch-001",
    image: drop.image,
    imageAlt: drop.imageAlt,
    milestones: drop.milestones,
    opensAt: "2026-07-01T09:00:00.000Z",
    products: staticProducts(),
    reserved: drop.reserved,
    seo: {},
    slug: "batch-001",
    status: "live",
    summary: drop.summary,
    title: drop.title
  };
}

function staticProducts(): ShopProduct[] {
  return staticShowcaseContent.products.map((product, index) => ({
    artist: { id: "maya-raad", name: "Maya Raad", slug: "maya-raad" },
    artwork: { id: "topography-of-return", name: "A topography of return", slug: "topography-of-return" },
    availability: "in-stock",
    cause: { id: "green-cedar-collective", name: "Green Cedar Collective", slug: "green-cedar-collective" },
    colors: index === 0 ? ["green"] : ["off-white"],
    careInstructions: "Handle with care and keep away from direct sunlight.",
    currency: "USD",
    dimensions: "See edition details",
    displayPrice: product.price,
    drop: { id: "batch-001", name: "Batch 001", slug: "batch-001" },
    edition: product.edition,
    form: product.form,
    gallery: [{ alt: product.imageAlt, src: product.image }],
    id: product.id,
    image: product.image,
    imageAlt: product.imageAlt,
    isFeatured: index === 0,
    materials: product.materials,
    maxPrice: priceNumber(product.price),
    minPrice: priceNumber(product.price),
    name: product.name,
    sizes: ["one-size"],
    slug: product.id,
    story: product.story,
    shippingReturns: "Dispatched with an edition card.",
    variants: [{
      availableInventory: 1,
      id: `${product.id}-edition`,
      isAvailable: true,
      name: "Numbered edition",
      price: priceNumber(product.price),
      size: "one-size",
      sku: `AE-${String(index + 1).padStart(3, "0")}`
    }]
  }));
}

function mapDropShowcase(doc: CmsRecord, products: ShopProduct[]): DropShowcase {
  const fallback = staticShowcaseContent;
  const batchSize = positiveNumber(doc.batchSize, fallback.drop.batchSize);
  const reserved = Math.min(batchSize, nonNegativeNumber(doc.reserved, fallback.drop.reserved));
  const seo = record(doc.seo);
  const cta = record(doc.cta);
  const artist = requiredRelationship(doc.artist, "name");
  const artwork = requiredRelationship(doc.artwork, "title");
  const cause = requiredRelationship(doc.cause, "name");

  return {
    allocation: records(doc.allocation).map(mapAllocation),
    artist: mapArtist(artist),
    artwork: mapArtwork(artwork),
    batchSize,
    cause: mapCause(cause),
    closesAt: validDate(doc.closesAt),
    cta: mapCta(cta),
    eyebrow: text(doc.eyebrow, fallback.drop.eyebrow),
    gallery: records(doc.gallery).map(mapGalleryImage).filter((image) => image.src),
    id: id(doc.id, text(doc.slug, "drop")),
    image: imageUrl(doc, fallback.drop.image),
    imageAlt: text(doc.imageAlt, fallback.drop.imageAlt),
    milestones: records(doc.milestones).map((item, index) =>
      mapMilestone(item, fallback.drop.milestones[index] ?? fallback.drop.milestones[0])
    ),
    opensAt: validDate(doc.opensAt),
    products,
    reserved,
    seo: {
      metaDescription: optionalText(seo.metaDescription),
      metaTitle: optionalText(seo.metaTitle),
      openGraphImage: imageUrl(record(seo.openGraphImage), "") || undefined
    },
    slug: text(doc.slug, "drop"),
    status: status(doc.status),
    summary: text(doc.summary, fallback.drop.summary),
    title: text(doc.title, fallback.drop.title)
  };
}

function mapArtist(doc: CmsRecord): Artist {
  const facts = records(doc.facts)
    .map((item) => ({ label: text(item.label, "Detail"), value: text(item.value, "") }))
    .filter((item) => item.value);

  return {
    name: text(doc.name, "Unnamed artist"), role: text(doc.role, ""), quote: text(doc.quote, ""),
    bio: text(doc.bio, ""), image: imageUrl(doc, ""), imageAlt: text(doc.imageAlt, text(doc.name, "Artist portrait")),
    facts
  };
}

function mapArtwork(doc: CmsRecord): Artwork {
  const details = records(doc.details).map((item) => ({ label: text(item.label, ""), title: text(item.title, ""), body: text(item.body, ""), x: nonNegativeNumber(item.x, 50), y: nonNegativeNumber(item.y, 50) }));

  return {
    title: text(doc.title, "Untitled artwork"), artistLine: text(doc.artistLine, ""),
    summary: text(doc.summary, ""), image: imageUrl(doc, ""), imageAlt: text(doc.imageAlt, text(doc.title, "Artwork")),
    details
  };
}

function mapCause(doc: CmsRecord): Cause {
  const metrics = records(doc.metrics).map((item) => ({ label: text(item.label, "Impact"), value: text(item.value, ""), progress: Math.min(100, nonNegativeNumber(item.progress, 0)) }));

  return {
    name: text(doc.name, "Unnamed cause"), focus: text(doc.focus, ""), summary: text(doc.summary, ""),
    image: imageUrl(doc, ""), imageAlt: text(doc.imageAlt, text(doc.name, "Cause partner")),
    metrics
  };
}

function mapMilestone(item: CmsRecord, fallback: DropMilestone): DropMilestone {
  return { label: text(item.label, fallback.label), value: text(item.value, fallback.value), progress: Math.min(100, nonNegativeNumber(item.progress, fallback.progress)) };
}

function mapAllocation(item: CmsRecord): DropAllocation {
  return { label: text(item.label, "Allocation"), percentage: Math.min(100, nonNegativeNumber(item.percentage, 0)), description: optionalText(item.description) };
}

function mapCta(item: CmsRecord): DropCta {
  const style = item.style === "secondary" || item.style === "text" ? item.style : "primary";
  return { href: text(item.href, "#editions"), label: text(item.label, "Explore the editions"), style };
}

function mapGalleryImage(item: CmsRecord): DropGalleryImage {
  const media = record(item.image);
  const source = imageUrl(media, imageUrl(item, ""));
  return { src: source, alt: text(item.alt, text(media.alt, text(item.caption, "Drop gallery image"))), caption: optionalText(item.caption) };
}

function requiredRelationship(value: unknown, titleField: "name" | "title") {
  const item = record(value);
  if (!optionalText(item.slug) || !optionalText(item[titleField])) throw new DropNotFoundError();
  return item;
}

function imageUrl(doc: CmsRecord, fallback: string) {
  const image = record(doc.image);
  const url = optionalText(image.url);
  if (url) return url;
  const filename = optionalText(image.filename);
  if (filename) return `/media/${filename}`;
  return text(doc.externalImageUrl, fallback);
}

function records(value: unknown): CmsRecord[] { return Array.isArray(value) ? value.map(record) : []; }
function record(value: unknown): CmsRecord { return value && typeof value === "object" && !Array.isArray(value) ? value as CmsRecord : {}; }
function text(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value : fallback; }
function optionalText(value: unknown) { return typeof value === "string" && value.trim() ? value : undefined; }
function nonNegativeNumber(value: unknown, fallback: number) { return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback; }
function positiveNumber(value: unknown, fallback: number) { return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback; }
function id(value: unknown, fallback: string) { return typeof value === "number" || typeof value === "string" ? value : fallback; }
function validDate(value: unknown) { return typeof value === "string" && !Number.isNaN(new Date(value).getTime()) ? value : undefined; }
function status(value: unknown): DropStatus { return value === "draft" || value === "preview" || value === "live" || value === "sold-out" || value === "closed" ? value : "draft"; }
function priceNumber(value: string) { return Number(value.replace(/[^0-9.]/g, "")) || 0; }
