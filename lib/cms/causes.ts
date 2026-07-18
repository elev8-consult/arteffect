import { unstable_noStore as noStore } from "next/cache";

import { staticCauseProfiles } from "@/data/causes";
import { normalizeExternalUrl } from "@/lib/artist-links";
import { mediaUrl as resolveSharedMediaUrl, normalizeMediaSrc } from "@/lib/cms/content-utils";
import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import { getShopProducts } from "@/lib/cms/products";
import type { CauseDirectoryItem, CauseDrop, CauseImage, CauseProfile } from "@/types/cause";
import type { ShopProduct } from "@/types/shop";

type CmsRecord = Record<string, unknown>;

type PayloadClient = {
  find: (args: {
    collection: "causes" | "drops";
    depth?: number;
    limit?: number;
    pagination?: boolean;
    sort?: string[];
    where?: CmsRecord;
  }) => Promise<{ docs: CmsRecord[] }>;
};

export class CauseNotFoundError extends Error {
  constructor() {
    super("Cause not found.");
    this.name = "CauseNotFoundError";
  }
}

export async function getCauseDirectory(): Promise<CauseDirectoryItem[]> {
  if (process.env.NODE_ENV !== "production") noStore();
  if (!hasPayloadDatabase()) return staticCauseDirectory();

  try {
    const payload = (await getPayloadClient()) as unknown as PayloadClient;
    const result = await payload.find({
      collection: "causes",
      depth: 1,
      limit: 100,
      pagination: false,
      sort: ["sortOrder", "name"],
      where: { isPublished: { equals: true } }
    });
    return result.docs.map(mapCauseDirectory);
  } catch (error) {
    console.error("Payload causes directory read failed; using static fallback.", error);
    return staticCauseDirectory();
  }
}

export async function getCauseProfile(slug: string): Promise<CauseProfile> {
  if (process.env.NODE_ENV !== "production") noStore();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    throw new CauseNotFoundError();
  }
  if (!hasPayloadDatabase()) return staticCauseProfile(slug);

  try {
    const payload = (await getPayloadClient()) as unknown as PayloadClient;
    const result = await payload.find({
      collection: "causes",
      depth: 2,
      limit: 1,
      pagination: false,
      where: { and: [{ slug: { equals: slug } }, { isPublished: { equals: true } }] }
    });
    const cause = result.docs[0];
    if (!cause) throw new CauseNotFoundError();

    const [drops, products] = await Promise.all([
      getCauseDrops(payload, slug),
      getShopProducts(productQuery(slug)).then((result) => result.docs)
    ]);
    return mapCauseProfile(cause, drops, products);
  } catch (error) {
    if (error instanceof CauseNotFoundError) throw error;
    console.error("Payload cause profile read failed; using static fallback.", error);
    return staticCauseProfile(slug);
  }
}

export async function getPublishedCauseSlugs(): Promise<string[]> {
  if (process.env.NODE_ENV !== "production") noStore();
  if (!hasPayloadDatabase()) return staticCauseProfiles.map((cause) => cause.slug);

  try {
    const payload = (await getPayloadClient()) as unknown as PayloadClient;
    const result = await payload.find({
      collection: "causes",
      depth: 0,
      limit: 100,
      pagination: false,
      where: { isPublished: { equals: true } }
    });
    return result.docs.map((cause) => optionalText(cause.slug)).filter((slug): slug is string => Boolean(slug));
  } catch (error) {
    console.error("Payload cause slugs read failed; using static fallback.", error);
    return staticCauseProfiles.map((cause) => cause.slug);
  }
}

function staticCauseDirectory(): CauseDirectoryItem[] {
  return staticCauseProfiles.map(toDirectoryItem);
}

async function staticCauseProfile(slug: string): Promise<CauseProfile> {
  const cause = staticCauseProfiles.find((candidate) => candidate.slug === slug);
  if (!cause) throw new CauseNotFoundError();
  const products = (await getShopProducts(productQuery(slug))).docs;
  return { ...cause, products };
}

function productQuery(cause: string) {
  return { availability: [], cause, colors: [], limit: 12, page: 1, sizes: [], sort: "featured" as const };
}

async function getCauseDrops(payload: PayloadClient, slug: string): Promise<CauseDrop[]> {
  const result = await payload.find({
    collection: "drops",
    depth: 2,
    limit: 12,
    pagination: false,
    sort: ["-opensAt", "sortOrder"],
    where: {
      and: [{ "cause.slug": { equals: slug } }, { isPublished: { equals: true } }]
    }
  });
  return result.docs.map(mapCauseDrop);
}

function mapCauseProfile(doc: CmsRecord, drops: CauseDrop[], products: ShopProduct[]): CauseProfile {
  const directory = mapCauseDirectory(doc);
  const seo = record(doc.seo);
  const gallery = records(doc.gallery).map(mapGalleryImage).filter((image) => image.src);
  const dropPhotos = drops.flatMap((drop) => drop.gallery);
  const contact = record(doc.contact);
  const contactData = {
    email: optionalText(contact.email),
    name: optionalText(contact.name),
    phone: optionalText(contact.phone)
  };

  return {
    ...directory,
    contact: Object.values(contactData).some(Boolean) ? contactData : undefined,
    drops,
    gallery: gallery.length ? gallery : uniqueImages(dropPhotos),
    legalName: optionalText(doc.legalName),
    metrics: records(doc.metrics).map(mapMetric).filter((metric) => metric.value),
    programs: records(doc.programs).map(mapProgram),
    products,
    registrationNumber: optionalText(doc.registrationNumber),
    reports: records(doc.reports).map((item) => ({ externalUrl: normalizeExternalUrl(optionalText(item.externalUrl)), period: text(item.period, "Reporting period"), title: text(item.title, "Impact report") })),
    seo: {
      metaDescription: optionalText(seo.metaDescription),
      metaTitle: optionalText(seo.metaTitle),
      openGraphImage: mediaUrl(record(seo.openGraphImage))
    },
    website: normalizeExternalUrl(optionalText(doc.website))
  };
}

function mapCauseDirectory(doc: CmsRecord): CauseDirectoryItem {
  const image = documentImage(doc, text(doc.name, "Cause partner"));
  return {
    focus: text(doc.focus, "Community impact"),
    image: image.src ? image : undefined,
    name: text(doc.name, "Unnamed cause"),
    slug: text(doc.slug, String(doc.id ?? "cause")),
    summary: text(doc.summary, ""),
    verificationStatus: verificationStatus(record(doc.verification).status)
  };
}

function mapCauseDrop(doc: CmsRecord): CauseDrop {
  const image = documentImage(doc, text(doc.title, "Cause-supported drop"));
  const gallery = records(doc.gallery).map(mapGalleryImage).filter((item) => item.src);
  return {
    donationPercentage: percentage(doc.donationPercentage),
    eyebrow: text(doc.eyebrow, "ArtEffect drop"),
    gallery,
    image: image.src ? image : undefined,
    slug: text(doc.slug, String(doc.id ?? "drop")),
    summary: text(doc.summary, ""),
    title: text(doc.title, "Untitled drop")
  };
}

function mapGalleryImage(doc: CmsRecord): CauseImage {
  const media = record(doc.image);
  return {
    alt: text(media.alt, text(doc.caption, "Field image")),
    caption: optionalText(doc.caption),
    src: mediaUrl(media) ?? ""
  };
}

function mapMetric(doc: CmsRecord) {
  return { label: text(doc.label, "Impact"), progress: Math.min(100, nonNegativeNumber(doc.progress, 0)), value: text(doc.value, "") };
}

function mapProgram(doc: CmsRecord) {
  return { allocation: optionalText(doc.allocation), description: text(doc.description, ""), name: text(doc.name, "Programme") };
}

function toDirectoryItem(profile: CauseProfile): CauseDirectoryItem {
  const { focus, image, name, slug, summary, verificationStatus } = profile;
  return { focus, image, name, slug, summary, verificationStatus };
}

function uniqueImages(images: CauseImage[]) {
  return images.filter((image, index) => image.src && images.findIndex((candidate) => candidate.src === image.src) === index);
}

function documentImage(doc: CmsRecord, fallbackAlt: string): CauseImage {
  const media = record(doc.image);
  return {
    alt: text(doc.imageAlt, text(media.alt, fallbackAlt)),
    src: mediaUrl(media) || normalizeMediaSrc(text(doc.externalImageUrl, "")) || ""
  };
}

function mediaUrl(media: CmsRecord) {
  return resolveSharedMediaUrl(media);
}

function verificationStatus(value: unknown): CauseDirectoryItem["verificationStatus"] {
  return value === "pending" || value === "verified" || value === "needs-review" ? value : undefined;
}

function percentage(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.min(100, value) : undefined;
}

function records(value: unknown): CmsRecord[] { return Array.isArray(value) ? value.map(record) : []; }
function record(value: unknown): CmsRecord { return value && typeof value === "object" && !Array.isArray(value) ? value as CmsRecord : {}; }
function text(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function optionalText(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
function nonNegativeNumber(value: unknown, fallback: number) { return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback; }
