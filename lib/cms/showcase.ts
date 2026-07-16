import { unstable_noStore as noStore } from "next/cache";

import { staticShowcaseContent } from "@/data/showcase";
import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import type {
  Artist,
  ArtistFact,
  Artwork,
  ArtworkDetail,
  Cause,
  CauseMetric,
  Drop,
  DropMilestone,
  ImpactStat,
  Product,
  ShowcaseContent,
  Testimonial
} from "@/types/showcase";

type CmsRecord = Record<string, unknown>;

type CmsPayload = {
  find: (args: {
    collection: string;
    depth?: number;
    limit?: number;
    pagination?: boolean;
    sort?: string;
    where?: CmsRecord;
  }) => Promise<{ docs: CmsRecord[] }>;
};

const publishedWhere = {
  isPublished: {
    equals: true
  }
};

const currentWhere = {
  and: [
    publishedWhere,
    {
      isCurrent: {
        equals: true
      }
    }
  ]
};

export async function getShowcaseContent(): Promise<ShowcaseContent> {
  if (process.env.NODE_ENV !== "production") noStore();

  if (!hasPayloadDatabase()) {
    return staticShowcaseContent;
  }

  try {
    const payload = (await getPayloadClient()) as unknown as CmsPayload;
    const [
      productDocs,
      dropDoc,
      artworkDoc,
      artistDoc,
      causeDoc,
      impactDocs,
      testimonialDocs
    ] =
      await Promise.all([
        findMany(payload, "products", 12),
        findCurrent(payload, "drops"),
        findCurrent(payload, "artworks"),
        findCurrent(payload, "artists"),
        findCurrent(payload, "causes"),
        findMany(payload, "impact-stats", 6),
        findMany(payload, "testimonials", 3)
      ]);

    return {
      products: productDocs.length
        ? productDocs.map((doc, index) =>
            mapProduct(
              doc,
              staticShowcaseContent.products[index] ?? staticShowcaseContent.products[0]
            )
          )
        : staticShowcaseContent.products,
      drop: dropDoc
        ? mapDrop(dropDoc, staticShowcaseContent.drop)
        : staticShowcaseContent.drop,
      artwork: artworkDoc
        ? mapArtwork(artworkDoc, staticShowcaseContent.artwork)
        : staticShowcaseContent.artwork,
      artist: artistDoc
        ? mapArtist(artistDoc, staticShowcaseContent.artist)
        : staticShowcaseContent.artist,
      cause: causeDoc
        ? mapCause(causeDoc, staticShowcaseContent.cause)
        : staticShowcaseContent.cause,
      impactStats: impactDocs.length
        ? impactDocs.map((doc, index) =>
            mapImpactStat(
              doc,
              staticShowcaseContent.impactStats[index] ?? staticShowcaseContent.impactStats[0]
            )
          )
        : staticShowcaseContent.impactStats,
      testimonials: testimonialDocs.length
        ? testimonialDocs.map((doc, index) =>
            mapTestimonial(
              doc,
              staticShowcaseContent.testimonials[index] ??
                staticShowcaseContent.testimonials[0]
            )
          )
        : staticShowcaseContent.testimonials
    };
  } catch (error) {
    console.error("Payload showcase read failed; using static fallback.", error);

    return staticShowcaseContent;
  }
}

async function findMany(payload: CmsPayload, collection: string, limit: number) {
  const result = await payload.find({
    collection,
    depth: 1,
    limit,
    pagination: false,
    sort: "sortOrder",
    where: publishedWhere
  });

  return result.docs;
}

async function findCurrent(payload: CmsPayload, collection: string) {
  const current = await payload.find({
    collection,
    depth: 1,
    limit: 1,
    pagination: false,
    sort: "sortOrder",
    where: currentWhere
  });

  if (current.docs[0]) {
    return current.docs[0];
  }

  const fallback = await payload.find({
    collection,
    depth: 1,
    limit: 1,
    pagination: false,
    sort: "sortOrder",
    where: publishedWhere
  });

  return fallback.docs[0];
}

function mapProduct(doc: CmsRecord, fallback: Product): Product {
  const materials = array(doc.materials, fallback.materials)
    .map((item) => (typeof item === "string" ? item : text(item.label, "")))
    .filter(Boolean);
  const defaultVariant = array(doc.variants, [])
    .find((variant) => variant && typeof variant === "object" && (variant as CmsRecord).isAvailable !== false) as CmsRecord | undefined;

  return {
    id: text(doc.slug, fallback.id),
    defaultVariantId: text(defaultVariant?.id, fallback.defaultVariantId),
    name: text(doc.name, fallback.name),
    form: text(doc.form, fallback.form),
    price: text(doc.price, fallback.price),
    edition: text(doc.edition, fallback.edition),
    image: imageUrl(doc, fallback.image),
    imageAlt: text(doc.imageAlt, fallback.imageAlt),
    story: text(doc.story, fallback.story),
    materials
  };
}

function mapDrop(doc: CmsRecord, fallback: Drop): Drop {
  return {
    slug: text(doc.slug, fallback.slug),
    title: text(doc.title, fallback.title),
    eyebrow: text(doc.eyebrow, fallback.eyebrow),
    summary: text(doc.summary, fallback.summary),
    batchSize: number(doc.batchSize, fallback.batchSize),
    reserved: number(doc.reserved, fallback.reserved),
    closesAt: dateText(doc.closesAt, fallback.closesAt),
    image: imageUrl(doc, fallback.image),
    imageAlt: text(doc.imageAlt, fallback.imageAlt),
    milestones: array(doc.milestones, fallback.milestones).map((item, index) =>
      mapMilestone(item, fallback.milestones[index] ?? fallback.milestones[0])
    )
  };
}

function mapArtwork(doc: CmsRecord, fallback: Artwork): Artwork {
  return {
    title: text(doc.title, fallback.title),
    artistLine: text(doc.artistLine, fallback.artistLine),
    summary: text(doc.summary, fallback.summary),
    image: imageUrl(doc, fallback.image),
    imageAlt: text(doc.imageAlt, fallback.imageAlt),
    details: array(doc.details, fallback.details).map((item, index) =>
      mapArtworkDetail(item, fallback.details[index] ?? fallback.details[0])
    )
  };
}

function mapArtist(doc: CmsRecord, fallback: Artist): Artist {
  return {
    name: text(doc.name, fallback.name),
    role: text(doc.role, fallback.role),
    quote: text(doc.quote, fallback.quote),
    bio: text(doc.bio, fallback.bio),
    image: imageUrl(doc, fallback.image),
    imageAlt: text(doc.imageAlt, fallback.imageAlt),
    facts: array(doc.facts, fallback.facts).map((item, index) =>
      mapFact(item, fallback.facts[index] ?? fallback.facts[0])
    )
  };
}

function mapCause(doc: CmsRecord, fallback: Cause): Cause {
  return {
    name: text(doc.name, fallback.name),
    focus: text(doc.focus, fallback.focus),
    summary: text(doc.summary, fallback.summary),
    image: imageUrl(doc, fallback.image),
    imageAlt: text(doc.imageAlt, fallback.imageAlt),
    metrics: array(doc.metrics, fallback.metrics).map((item, index) =>
      mapCauseMetric(item, fallback.metrics[index] ?? fallback.metrics[0])
    )
  };
}

function mapImpactStat(doc: CmsRecord, fallback: ImpactStat): ImpactStat {
  return {
    label: text(doc.label, fallback.label),
    value: number(doc.value, fallback.value),
    metricType: impactMetricType(doc.metricType, fallback.metricType),
    prefix: optionalText(doc.prefix, fallback.prefix),
    suffix: optionalText(doc.suffix, fallback.suffix),
    detail: text(doc.detail, fallback.detail)
  };
}

function mapTestimonial(doc: CmsRecord, fallback: Testimonial): Testimonial {
  return {
    quote: text(doc.quote, fallback.quote),
    name: text(doc.personName, fallback.name),
    role: text(doc.role, testimonialRelationship(doc.relationship, fallback.role))
  };
}

function impactMetricType(
  value: unknown,
  fallback: ImpactStat["metricType"]
): ImpactStat["metricType"] {
  if (
    value === "projected" ||
    value === "committed" ||
    value === "transferred" ||
    value === "verified"
  ) {
    return value;
  }

  return fallback;
}

function testimonialRelationship(value: unknown, fallback: string) {
  const labels: Record<string, string> = {
    artist: "Artist",
    collector: "Collector",
    "community-member": "Community member",
    "ngo-partner": "NGO partner",
    press: "Press"
  };

  return typeof value === "string" ? labels[value] ?? fallback : fallback;
}

function mapMilestone(value: unknown, fallback: DropMilestone): DropMilestone {
  const item = record(value);

  return {
    label: text(item.label, fallback.label),
    value: text(item.value, fallback.value),
    progress: boundedPercent(item.progress, fallback.progress)
  };
}

function mapArtworkDetail(value: unknown, fallback: ArtworkDetail): ArtworkDetail {
  const item = record(value);

  return {
    label: text(item.label, fallback.label),
    title: text(item.title, fallback.title),
    body: text(item.body, fallback.body),
    x: boundedPercent(item.x, fallback.x),
    y: boundedPercent(item.y, fallback.y)
  };
}

function mapFact(value: unknown, fallback: ArtistFact): ArtistFact {
  const item = record(value);

  return {
    label: text(item.label, fallback.label),
    value: text(item.value, fallback.value)
  };
}

function mapCauseMetric(value: unknown, fallback: CauseMetric): CauseMetric {
  const item = record(value);

  return {
    label: text(item.label, fallback.label),
    value: text(item.value, fallback.value),
    progress: boundedPercent(item.progress, fallback.progress)
  };
}

function imageUrl(doc: CmsRecord, fallback: string) {
  const image = record(doc.image);
  const url = text(image.url, "");

  if (url) {
    return url;
  }

  const filename = text(image.filename, "");

  if (filename) {
    return `/media/${filename}`;
  }

  return text(doc.externalImageUrl, fallback);
}

function array<T>(value: unknown, fallback: T[]): Array<CmsRecord | string> {
  if (!Array.isArray(value)) {
    return fallback as Array<CmsRecord | string>;
  }

  return value.map((item) => (typeof item === "string" ? item : record(item)));
}

function record(value: unknown): CmsRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as CmsRecord;
  }

  return {};
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function optionalText(value: unknown, fallback?: string) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return fallback;
}

function number(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function boundedPercent(value: unknown, fallback: number) {
  return Math.min(100, Math.max(0, number(value, fallback)));
}

function dateText(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}
