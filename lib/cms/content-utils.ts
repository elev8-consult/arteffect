import type { ContentImage, SeoContent } from "@/types/content";

export type CmsRecord = Record<string, unknown>;

export function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as CmsRecord : {};
}

export function records(value: unknown): CmsRecord[] {
  return Array.isArray(value) ? value.map(record) : [];
}

export function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function relationshipID(value: unknown, fallback: string): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  const id = record(value).id;
  return typeof id === "string" || typeof id === "number" ? String(id) : fallback;
}

export function richText(value: unknown): CmsRecord {
  return record(value);
}

export function mediaUrl(value: unknown): string | undefined {
  const media = record(value);
  return optionalText(media.url) ?? (optionalText(media.filename) ? `/media/${media.filename}` : undefined);
}

export function documentImage(doc: CmsRecord, fallbackAlt: string): ContentImage | undefined {
  const media = record(doc.image);
  const src = mediaUrl(media) ?? optionalText(doc.externalImageUrl);
  return src ? { alt: text(doc.imageAlt, text(media.alt, fallbackAlt)), src } : undefined;
}

export function seoContent(value: unknown): SeoContent {
  const seo = record(value);
  return {
    metaDescription: optionalText(seo.metaDescription),
    metaTitle: optionalText(seo.metaTitle),
    openGraphImage: mediaUrl(seo.openGraphImage)
  };
}
