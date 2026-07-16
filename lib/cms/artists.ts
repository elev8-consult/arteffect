import { unstable_noStore as noStore } from "next/cache";

import { staticArtistProfiles } from "@/data/artists";
import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import { getShopProducts } from "@/lib/cms/products";
import type { ArtistDirectoryItem, ArtistDrop, ArtistImage, ArtistProfile, ArtistWork } from "@/types/artist";
import type { ShopProduct } from "@/types/shop";

type CmsRecord = Record<string, unknown>;

type PayloadClient = {
  find: (args: {
    collection: "artists" | "drops";
    depth?: number;
    limit?: number;
    pagination?: boolean;
    sort?: string[];
    where?: CmsRecord;
  }) => Promise<{ docs: CmsRecord[] }>;
};

export class ArtistNotFoundError extends Error {
  constructor() {
    super("Artist not found.");
    this.name = "ArtistNotFoundError";
  }
}

export async function getArtistDirectory(): Promise<ArtistDirectoryItem[]> {
  if (process.env.NODE_ENV !== "production") noStore();

  if (!hasPayloadDatabase()) return staticArtistProfiles.map(toDirectoryItem);

  const payload = (await getPayloadClient()) as unknown as PayloadClient;
  const result = await payload.find({
    collection: "artists",
    depth: 1,
    limit: 100,
    pagination: false,
    sort: ["sortOrder", "name"],
    where: { isPublished: { equals: true } }
  });

  return result.docs.map(mapArtistDirectory);
}

export async function getArtistProfile(slug: string): Promise<ArtistProfile> {
  if (process.env.NODE_ENV !== "production") noStore();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    throw new ArtistNotFoundError();
  }

  if (!hasPayloadDatabase()) {
    const artist = staticArtistProfiles.find((candidate) => candidate.slug === slug);
    if (!artist) throw new ArtistNotFoundError();
    const products = (await getShopProducts({
      artist: slug,
      availability: [],
      colors: [],
      limit: 12,
      page: 1,
      sizes: [],
      sort: "featured"
    })).docs;
    return { ...artist, products };
  }

  const payload = (await getPayloadClient()) as unknown as PayloadClient;
  const result = await payload.find({
    collection: "artists",
    depth: 2,
    limit: 1,
    pagination: false,
    where: { and: [{ slug: { equals: slug } }, { isPublished: { equals: true } }] }
  });
  const artist = result.docs[0];
  if (!artist) throw new ArtistNotFoundError();

  const [drops, products] = await Promise.all([
    getArtistDrops(payload, slug),
    getShopProducts({
      artist: slug,
      availability: [],
      colors: [],
      limit: 12,
      page: 1,
      sizes: [],
      sort: "featured"
    }).then((result) => result.docs)
  ]);

  return mapArtistProfile(artist, drops, products);
}

export async function getPublishedArtistSlugs(): Promise<string[]> {
  if (process.env.NODE_ENV !== "production") noStore();
  if (!hasPayloadDatabase()) return staticArtistProfiles.map((artist) => artist.slug);

  const payload = (await getPayloadClient()) as unknown as PayloadClient;
  const result = await payload.find({
    collection: "artists",
    depth: 0,
    limit: 100,
    pagination: false,
    where: { isPublished: { equals: true } }
  });
  return result.docs.map((artist) => optionalText(artist.slug)).filter((slug): slug is string => Boolean(slug));
}

async function getArtistDrops(payload: PayloadClient, slug: string): Promise<ArtistDrop[]> {
  const result = await payload.find({
    collection: "drops",
    depth: 1,
    limit: 12,
    pagination: false,
    sort: ["-opensAt", "sortOrder"],
    where: {
      and: [{ "artist.slug": { equals: slug } }, { isPublished: { equals: true } }]
    }
  });
  return result.docs.map(mapArtistDrop);
}

function mapArtistProfile(doc: CmsRecord, drops: ArtistDrop[], products: ShopProduct[]): ArtistProfile {
  const directory = mapArtistDirectory(doc);
  const seo = record(doc.seo);
  const processPoster = mediaImage(record(doc.processVideoPoster), "Process video still");
  const uploadedProcessVideo = mediaUrl(record(doc.processVideo));
  const processVideoUrl = uploadedProcessVideo ?? optionalText(doc.processVideoUrl);

  return {
    ...directory,
    bio: text(doc.bio, ""),
    drops,
    facts: records(doc.facts).map(mapFact).filter((fact) => fact.value),
    instagram: optionalText(doc.instagram),
    portraitGallery: records(doc.portraitGallery).map(mapPortraitImage).filter((image) => image.src),
    processVideo: processVideoUrl
      ? { caption: optionalText(doc.processVideoCaption), poster: processPoster.src ? processPoster : undefined, src: processVideoUrl }
      : undefined,
    products,
    quote: text(doc.quote, ""),
    representativeWorks: records(doc.representativeWorks).map(mapRepresentativeWork),
    seo: {
      metaDescription: optionalText(seo.metaDescription),
      metaTitle: optionalText(seo.metaTitle),
      openGraphImage: mediaUrl(record(seo.openGraphImage))
    },
    website: optionalText(doc.website)
  };
}

function mapArtistDirectory(doc: CmsRecord): ArtistDirectoryItem {
  const image = documentImage(doc, text(doc.name, "Artist portrait"));
  return {
    image: image.src ? image : undefined,
    location: optionalText(doc.location),
    name: text(doc.name, "Unnamed artist"),
    role: text(doc.role, "Artist"),
    slug: text(doc.slug, String(doc.id ?? "artist"))
  };
}

function mapArtistDrop(doc: CmsRecord): ArtistDrop {
  const image = documentImage(doc, text(doc.title, "Artist drop"));
  return {
    eyebrow: text(doc.eyebrow, "ArtEffect drop"),
    image: image.src ? image : undefined,
    slug: text(doc.slug, String(doc.id ?? "drop")),
    summary: text(doc.summary, ""),
    title: text(doc.title, "Untitled drop")
  };
}

function mapPortraitImage(doc: CmsRecord): ArtistImage {
  const media = record(doc.image);
  return {
    alt: text(media.alt, text(doc.caption, "Artist studio image")),
    caption: optionalText(doc.caption),
    src: mediaUrl(media) ?? ""
  };
}

function mapRepresentativeWork(doc: CmsRecord): ArtistWork {
  const image = mediaImage(record(doc.image), text(doc.title, "Artwork"));
  return {
    image: image.src ? image : undefined,
    medium: optionalText(doc.medium),
    title: text(doc.title, "Untitled work"),
    year: optionalText(doc.year)
  };
}

function mapFact(doc: CmsRecord) {
  return { label: text(doc.label, "Detail"), value: text(doc.value, "") };
}

function toDirectoryItem(profile: ArtistProfile): ArtistDirectoryItem {
  const { image, location, name, role, slug } = profile;
  return { image, location, name, role, slug };
}

function documentImage(doc: CmsRecord, fallbackAlt: string): ArtistImage {
  const media = record(doc.image);
  return { alt: text(doc.imageAlt, text(media.alt, fallbackAlt)), src: mediaUrl(media) || text(doc.externalImageUrl, "") };
}

function mediaImage(media: CmsRecord, fallbackAlt: string): ArtistImage {
  return { alt: text(media.alt, fallbackAlt), src: mediaUrl(media) ?? "" };
}

function mediaUrl(media: CmsRecord) {
  return optionalText(media.url) ?? (optionalText(media.filename) ? `/media/${media.filename}` : undefined);
}

function records(value: unknown): CmsRecord[] { return Array.isArray(value) ? value.map(record) : []; }
function record(value: unknown): CmsRecord { return value && typeof value === "object" && !Array.isArray(value) ? value as CmsRecord : {}; }
function text(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function optionalText(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
