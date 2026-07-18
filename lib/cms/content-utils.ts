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
  const fromUrl = normalizeMediaSrc(optionalText(media.url));
  if (fromUrl) return fromUrl;

  const filename = optionalText(media.filename);
  if (filename) return normalizeMediaSrc(`/media/${filename}`);

  return undefined;
}

/**
 * Make Payload/media URLs safe for next/image.
 * Absolute same-origin /media URLs become relative paths; path segments are encoded.
 */
export function normalizeMediaSrc(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;

  let src = value.trim();

  try {
    if (/^https?:\/\//i.test(src)) {
      const parsed = new URL(src);
      const path = parsed.pathname || "/";
      if (
        path === "/media" ||
        path.startsWith("/media/") ||
        path.startsWith("/api/media/")
      ) {
        src = `${path}${parsed.search || ""}`;
      } else {
        return src;
      }
    }
  } catch {
    return undefined;
  }

  if (!src.startsWith("/")) return src;

  const [pathname, query = ""] = src.split("?");
  const encodedPath = pathname
    .split("/")
    .map((segment, index) => {
      if (index === 0) return "";
      if (!segment) return "";
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");

  return query ? `${encodedPath}?${query}` : encodedPath;
}

export function documentImage(doc: CmsRecord, fallbackAlt: string): ContentImage | undefined {
  const media = record(doc.image);
  const src = mediaUrl(media) ?? normalizeMediaSrc(optionalText(doc.externalImageUrl));
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
