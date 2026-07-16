import { unstable_noStore as noStore } from "next/cache";

import { products as showcaseProducts } from "@/data/showcase";
import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import { productSort, productWhere } from "@/lib/shop/query";
import type {
  ProductAvailability,
  ProductListResult,
  ProductQuery,
  ShopPagination,
  ShopProduct,
  ShopProductImage,
  ShopRelationship,
  ShopVariant
} from "@/types/shop";

type CmsRecord = Record<string, unknown>;

type ProductFindResult = {
  docs: CmsRecord[];
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  page?: number;
  totalDocs: number;
  totalPages: number;
};

type ProductPayload = {
  find: (args: {
    collection: "products";
    depth?: number;
    limit?: number;
    page?: number;
    pagination?: boolean;
    sort?: string[];
    where?: Record<string, unknown>;
  }) => Promise<ProductFindResult>;
};

export class ProductNotFoundError extends Error {
  constructor() {
    super("Product not found.");
    this.name = "ProductNotFoundError";
  }
}

export async function getShopProducts(query: ProductQuery): Promise<ProductListResult> {
  if (process.env.NODE_ENV !== "production") noStore();

  if (!hasPayloadDatabase()) {
    return findStaticProducts(query);
  }

  const payload = (await getPayloadClient()) as unknown as ProductPayload;
  const result = await payload.find({
    collection: "products",
    depth: 2,
    limit: query.limit,
    page: query.page,
    sort: productSort(query.sort),
    where: productWhere(query)
  });

  return {
    docs: result.docs.map(mapShopProduct),
    pagination: {
      hasNextPage: result.hasNextPage ?? query.page < result.totalPages,
      hasPreviousPage: result.hasPrevPage ?? query.page > 1,
      limit: query.limit,
      page: result.page ?? query.page,
      total: result.totalDocs,
      totalPages: result.totalPages
    }
  };
}

export async function getShopProduct(slug: string): Promise<ShopProduct> {
  if (process.env.NODE_ENV !== "production") noStore();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    throw new ProductNotFoundError();
  }

  if (!hasPayloadDatabase()) {
    const product = staticShopProducts().find((candidate) => candidate.slug === slug);
    if (!product) throw new ProductNotFoundError();
    return product;
  }

  const payload = (await getPayloadClient()) as unknown as ProductPayload;
  const result = await payload.find({
    collection: "products",
    depth: 2,
    limit: 1,
    pagination: false,
    where: {
      and: [{ slug: { equals: slug } }, { isPublished: { equals: true } }]
    }
  });

  if (!result.docs[0]) throw new ProductNotFoundError();

  return mapShopProduct(result.docs[0]);
}

export async function getRelatedShopProducts(product: ShopProduct, limit = 3): Promise<ShopProduct[]> {
  if (process.env.NODE_ENV !== "production") noStore();

  if (!hasPayloadDatabase()) {
    return rankRelatedProducts(staticShopProducts(), product).slice(0, limit);
  }

  const payload = (await getPayloadClient()) as unknown as ProductPayload;
  const relationshipFilters = [
    product.artist ? { artist: { equals: product.artist.id } } : undefined,
    product.artwork ? { artwork: { equals: product.artwork.id } } : undefined,
    product.cause ? { cause: { equals: product.cause.id } } : undefined,
    product.drop ? { drop: { equals: product.drop.id } } : undefined
  ].filter(Boolean) as Record<string, unknown>[];
  const where = {
    and: [
      { isPublished: { equals: true } },
      { id: { not_equals: product.id } },
      ...(relationshipFilters.length ? [{ or: relationshipFilters }] : [])
    ]
  };
  const result = await payload.find({
    collection: "products",
    depth: 2,
    limit: Math.max(limit * 4, 12),
    pagination: false,
    sort: ["-isFeatured", "sortOrder", "name"],
    where
  });
  let candidates = result.docs.map(mapShopProduct);

  if (candidates.length < limit && relationshipFilters.length) {
    const fallback = await payload.find({
      collection: "products",
      depth: 2,
      limit: 48,
      pagination: false,
      sort: ["-isFeatured", "sortOrder", "name"],
      where: {
        and: [
          { isPublished: { equals: true } },
          { id: { not_equals: product.id } }
        ]
      }
    });
    const seen = new Set(candidates.map((candidate) => candidate.slug));
    candidates = [
      ...candidates,
      ...fallback.docs.map(mapShopProduct).filter((candidate) => !seen.has(candidate.slug))
    ];
  }

  return rankRelatedProducts(candidates, product).slice(0, limit);
}

export function mapShopProduct(doc: CmsRecord): ShopProduct {
  const dropUnavailable = linkedDropIsUnavailable(doc.drop);
  const variants = records(doc.variants).map(mapVariant).map((variant) =>
    dropUnavailable ? { ...variant, isAvailable: false } : variant
  );
  const variantPrices = variants.map((variant) => variant.price);
  const minPrice = nonNegativeNumber(doc.minPrice, variantPrices.length ? Math.min(...variantPrices) : 0);
  const maxPrice = nonNegativeNumber(doc.maxPrice, variantPrices.length ? Math.max(...variantPrices) : minPrice);
  const colors = stringArray(doc.colors, variants.map((variant) => variant.color));
  const sizes = stringArray(doc.sizes, variants.map((variant) => variant.size));
  const slug = text(doc.slug, String(doc.id ?? "product"));
  const gallery = productGallery(doc);
  const image = imageUrl(doc) || gallery[0]?.src || "";

  return {
    artist: mapRelationship(doc.artist, "name"),
    artwork: mapRelationship(doc.artwork, "title"),
    availability: dropUnavailable ? "out-of-stock" : availability(doc.availability, variants),
    cause: mapRelationship(doc.cause, "name"),
    colors,
    careInstructions: text(doc.careInstructions, defaultCare(doc.form)),
    currency: text(doc.currency, "USD"),
    dimensions: text(doc.dimensions, defaultDimensions(doc.form)),
    displayPrice: text(doc.price, formatDisplayPrice(minPrice, maxPrice, text(doc.currency, "USD"))),
    drop: mapRelationship(doc.drop, "title"),
    edition: text(doc.edition, "Limited edition"),
    form: text(doc.form, "Art object"),
    gallery,
    id: typeof doc.id === "number" || typeof doc.id === "string" ? doc.id : slug,
    image,
    imageAlt: text(doc.imageAlt, text(doc.name, "ArtEffect product")),
    isFeatured: doc.isFeatured === true,
    materials: records(doc.materials).map((item) => text(item.label, "")).filter(Boolean),
    maxPrice,
    minPrice,
    name: text(doc.name, "Untitled product"),
    sizes,
    slug,
    story: text(doc.story, ""),
    shippingReturns: text(doc.shippingReturns, defaultShipping(doc.shippingProfile)),
    variants
  };
}

function findStaticProducts(query: ProductQuery): ProductListResult {
  const normalizedSearch = query.search?.toLocaleLowerCase();
  const filtered = staticShopProducts().filter((product) => {
    if (
      normalizedSearch &&
      ![product.name, product.form, product.story, product.edition, ...product.materials]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedSearch)
    ) {
      return false;
    }
    if (query.colors.length && !query.colors.some((color) => product.colors.includes(color))) return false;
    if (query.sizes.length && !query.sizes.some((size) => product.sizes.includes(size))) return false;
    if (query.availability.length && !query.availability.includes(product.availability)) return false;
    if (query.artist && product.artist?.slug !== query.artist) return false;
    if (query.cause && product.cause?.slug !== query.cause) return false;
    if (query.drop && product.drop?.slug !== query.drop) return false;
    if (query.minPrice !== undefined && product.maxPrice < query.minPrice) return false;
    if (query.maxPrice !== undefined && product.minPrice > query.maxPrice) return false;
    return true;
  });

  filtered.sort(staticComparator(query));

  const total = filtered.length;
  const totalPages = Math.ceil(total / query.limit);
  const start = (query.page - 1) * query.limit;
  const docs = filtered.slice(start, start + query.limit);

  return {
    docs,
    pagination: pagination(query, total, totalPages)
  };
}

function staticShopProducts(): ShopProduct[] {
  const artist: ShopRelationship = { id: "maya-raad", name: "Maya Raad", slug: "maya-raad" };
  const artwork: ShopRelationship = { id: "topography-of-return", name: "A topography of return", slug: "topography-of-return" };
  const cause: ShopRelationship = { id: "green-cedar-collective", name: "Green Cedar Collective", slug: "green-cedar-collective" };
  const drop: ShopRelationship = { id: "batch-001", name: "Batch 001", slug: "batch-001" };

  return showcaseProducts.map((product, index) => {
    const amount = numericDisplayPrice(product.price);
    const colors = index === 0 ? ["multicolor", "green"] : index === 1 ? ["off-white"] : ["beige", "black"];
    const sizes = index === 0 ? ["s", "m", "l"] : ["one-size"];
    const variants: ShopVariant[] = colors.flatMap((color, colorIndex) =>
      sizes.map((size, sizeIndex) => ({
        availableInventory: 20,
        color,
        id: `${product.id}-${color}-${size}`,
        isAvailable: true,
        name: `${color} / ${size}`,
        price: amount,
        size,
        sku: `AE-${String(index + 1).padStart(3, "0")}-${colorIndex + 1}${sizeIndex + 1}`
      }))
    );

    return {
      artist,
      artwork,
      availability: "in-stock",
      cause,
      colors,
      careInstructions: index === 0
        ? "Dry clean only. Store flat or loosely rolled away from direct sunlight."
        : index === 1
          ? "Hand wash gently with mild soap. Avoid sudden temperature changes and abrasive scouring."
          : "Spot clean with a damp cloth. Do not bleach; allow the canvas to air dry naturally.",
      currency: "USD",
      dimensions: index === 0 ? "90 × 90 cm" : index === 1 ? "Ø 26 cm" : "38 × 42 × 12 cm",
      displayPrice: product.price,
      drop,
      edition: product.edition,
      form: product.form,
      gallery: staticGallery(product, index),
      id: product.id,
      image: product.image,
      imageAlt: product.imageAlt,
      isFeatured: index === 0,
      materials: product.materials,
      maxPrice: amount,
      minPrice: amount,
      name: product.name,
      sizes,
      slug: product.id,
      story: product.story,
      shippingReturns: "Dispatched within 3–5 business days. Returns are accepted within 14 days in original, unused condition.",
      variants
    };
  });
}

function productGallery(doc: CmsRecord): ShopProductImage[] {
  const primary = {
    alt: text(doc.imageAlt, text(doc.name, "ArtEffect product")),
    src: imageUrl(doc)
  };
  const gallery = records(doc.gallery)
    .map((item) => ({
      alt: text(item.alt, primary.alt),
      src: imageUrl(item)
    }))
    .filter((image) => Boolean(image.src));

  return primary.src ? [primary, ...gallery] : gallery;
}

function staticGallery(product: (typeof showcaseProducts)[number], index: number): ShopProductImage[] {
  const images = [
    { alt: product.imageAlt, src: product.image },
    ...(index === 0
      ? [
          { alt: "Silk scarf folded to reveal its printed artwork", src: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1400&q=85" },
          { alt: "Silk textile photographed in soft natural light", src: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1400&q=85" }
        ]
      : index === 1
        ? [
            { alt: "Ceramic object shown in a quiet dining setting", src: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=85" },
            { alt: "Glazed ceramic detail in daylight", src: "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=1400&q=85" }
          ]
        : [
            { alt: "Canvas tote carried through the city", src: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=85" },
            { alt: "Natural canvas texture and printed detail", src: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1400&q=85" }
          ])
  ];
  return images;
}

function rankRelatedProducts(products: ShopProduct[], current: ShopProduct) {
  const score = (candidate: ShopProduct) =>
    Number(Boolean(current.artist && candidate.artist?.id === current.artist.id)) * 4 +
    Number(Boolean(current.artwork && candidate.artwork?.id === current.artwork.id)) * 3 +
    Number(Boolean(current.drop && candidate.drop?.id === current.drop.id)) * 2 +
    Number(Boolean(current.cause && candidate.cause?.id === current.cause.id)) +
    Number(candidate.isFeatured);

  return products
    .filter((candidate) => candidate.slug !== current.slug)
    .sort((left, right) => score(right) - score(left) || left.name.localeCompare(right.name));
}

function defaultCare(form: unknown) {
  return String(form).toLocaleLowerCase().includes("wear")
    ? "Handle with care and store away from direct sunlight."
    : "Wipe gently with a soft, dry cloth and avoid abrasive cleaners.";
}

function defaultDimensions(form: unknown) {
  return String(form).toLocaleLowerCase().includes("wear") ? "See size selector for fit" : "Dimensions vary by selected edition";
}

function defaultShipping(profile: unknown) {
  return profile === "fragile"
    ? "Fragile objects are packed with protective materials and dispatched within 5–7 business days."
    : "Dispatched within 3–5 business days. Returns are accepted within 14 days in original condition.";
}

function mapVariant(value: CmsRecord): ShopVariant {
  const inventory = nonNegativeNumber(value.inventory, 0);
  const reserved = nonNegativeNumber(value.reserved, 0);
  const sku = text(value.sku, text(value.id, "variant"));

  return {
    availableInventory: Math.max(0, inventory - reserved),
    color: optionalText(value.color),
    compareAtPrice: optionalNumber(value.compareAtPrice),
    id: text(value.id, sku),
    isAvailable: value.isAvailable !== false && inventory > reserved,
    name: text(value.name, "Default variant"),
    price: nonNegativeNumber(value.price, 0),
    size: optionalText(value.size),
    sku
  };
}

function mapRelationship(value: unknown, labelField: "name" | "title") {
  const item = record(value);
  if (!item.id || typeof item.slug !== "string") return undefined;

  return {
    id: item.id as number | string,
    name: text(item[labelField], item.slug),
    slug: item.slug
  };
}

function linkedDropIsUnavailable(value: unknown) {
  if (typeof value === "number" || typeof value === "string") return true;
  const drop = record(value);
  if (!Object.keys(drop).length) return false;
  if (drop.status === "draft" || drop.status === "preview" || drop.status === "sold-out" || drop.status === "closed") return true;

  const batchSize = positiveNumber(drop.batchSize);
  const reserved = nonNegativeNumber(drop.reserved, 0);
  if (batchSize !== undefined && reserved >= batchSize) return true;

  const opensAt = timestamp(drop.opensAt);
  const closesAt = timestamp(drop.closesAt);
  const now = Date.now();
  return Boolean((opensAt && opensAt > now) || (closesAt && closesAt <= now));
}

function availability(value: unknown, variants: ShopVariant[]): ProductAvailability {
  if (value === "in-stock" || value === "low-stock" || value === "out-of-stock") return value;

  return variants.some((variant) => variant.isAvailable) ? "in-stock" : "out-of-stock";
}

function positiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function timestamp(value: unknown) {
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? undefined : parsed;
}

function imageUrl(doc: CmsRecord) {
  const image = record(doc.image);
  const url = text(image.url, "");
  if (url) return url;

  const filename = text(image.filename, "");
  if (filename) return `/media/${filename}`;

  return text(doc.externalImageUrl, "");
}

function formatDisplayPrice(min: number, max: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-US", { currency, style: "currency" });
  return min === max ? formatter.format(min) : `${formatter.format(min)}–${formatter.format(max)}`;
}

function numericDisplayPrice(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function staticComparator(query: ProductQuery) {
  return (left: ShopProduct, right: ShopProduct) => {
    switch (query.sort) {
      case "name-asc":
        return left.name.localeCompare(right.name);
      case "name-desc":
        return right.name.localeCompare(left.name);
      case "price-asc":
        return left.minPrice - right.minPrice;
      case "price-desc":
        return right.minPrice - left.minPrice;
      case "newest":
        return String(right.id).localeCompare(String(left.id));
      default:
        return Number(right.isFeatured) - Number(left.isFeatured);
    }
  };
}

function pagination(query: ProductQuery, total: number, totalPages: number): ShopPagination {
  return {
    hasNextPage: query.page < totalPages,
    hasPreviousPage: query.page > 1 && totalPages > 0,
    limit: query.limit,
    page: query.page,
    total,
    totalPages
  };
}

function stringArray(value: unknown, fallback: Array<string | undefined>) {
  const values = Array.isArray(value) ? value : fallback;
  return [...new Set(values.filter((item): item is string => typeof item === "string" && item.length > 0))];
}

function records(value: unknown): CmsRecord[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as CmsRecord) : {};
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function nonNegativeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}
