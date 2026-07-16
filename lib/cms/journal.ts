import { unstable_noStore as noStore } from "next/cache";

import { staticJournalArticles } from "@/data/content";
import { documentImage, optionalText, record, records, richText, seoContent, text, type CmsRecord } from "@/lib/cms/content-utils";
import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import type { JournalArticle, JournalCategory, JournalPage, JournalSummary } from "@/types/content";

const categories = new Set<JournalCategory>(["artist-story", "drop-notes", "field-note", "impact-report", "studio"]);

type JournalPayload = {
  find: (args: {
    collection: "journal";
    depth?: number;
    limit?: number;
    page?: number;
    pagination?: boolean;
    sort?: string[];
    where?: CmsRecord;
  }) => Promise<{ docs: CmsRecord[]; hasNextPage?: boolean; hasPrevPage?: boolean; limit?: number; page?: number; totalDocs?: number; totalPages?: number }>;
};

export class JournalInputError extends Error {}
export class JournalNotFoundError extends Error {}

export type JournalQuery = {
  category?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
  query?: string;
  tag?: string;
};

export async function getJournalPage(input: JournalQuery = {}): Promise<JournalPage> {
  if (process.env.NODE_ENV !== "production") noStore();
  const query = validateQuery(input);

  if (!hasPayloadDatabase()) {
    const filtered = staticJournalArticles.filter((article) =>
      (!query.category || article.category === query.category) &&
      (!query.featured || article.isFeatured) &&
      (!query.tag || article.tags.some((tag) => tag.toLowerCase() === query.tag?.toLowerCase())) &&
      (!query.query || `${article.title} ${article.excerpt}`.toLowerCase().includes(query.query.toLowerCase()))
    );
    return paginate(filtered, query.page, query.limit);
  }

  const payload = (await getPayloadClient()) as unknown as JournalPayload;
  const result = await payload.find({
    collection: "journal",
    depth: 1,
    limit: query.limit,
    page: query.page,
    sort: ["-publishedAt", "sortOrder"],
    where: journalWhere(query)
  });

  return {
    docs: result.docs.map(mapSummary),
    hasNextPage: Boolean(result.hasNextPage),
    hasPrevPage: Boolean(result.hasPrevPage),
    limit: result.limit ?? query.limit,
    page: result.page ?? query.page,
    totalDocs: result.totalDocs ?? result.docs.length,
    totalPages: result.totalPages ?? 1
  };
}

export async function getJournalArticle(slug: string): Promise<JournalArticle> {
  if (process.env.NODE_ENV !== "production") noStore();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) throw new JournalNotFoundError();

  if (!hasPayloadDatabase()) {
    const article = staticJournalArticles.find((candidate) => candidate.slug === slug);
    if (!article) throw new JournalNotFoundError();
    return article;
  }

  const payload = (await getPayloadClient()) as unknown as JournalPayload;
  const result = await payload.find({
    collection: "journal",
    depth: 2,
    limit: 1,
    pagination: false,
    where: { and: [...publishedClauses(), { slug: { equals: slug } }] }
  });
  if (!result.docs[0]) throw new JournalNotFoundError();
  return mapArticle(result.docs[0]);
}

export async function getPublishedJournalSlugs(): Promise<Array<{ slug: string; updatedAt?: string }>> {
  if (process.env.NODE_ENV !== "production") noStore();
  if (!hasPayloadDatabase()) return staticJournalArticles.map(({ slug, publishedAt }) => ({ slug, updatedAt: publishedAt }));
  const payload = (await getPayloadClient()) as unknown as JournalPayload;
  const result = await payload.find({ collection: "journal", depth: 0, limit: 500, pagination: false, where: { and: publishedClauses() } });
  return result.docs.map((doc) => ({ slug: text(doc.slug), updatedAt: optionalText(doc.updatedAt) })).filter((item) => item.slug);
}

function journalWhere(query: Required<Pick<JournalQuery, "limit" | "page">> & JournalQuery): CmsRecord {
  const and: CmsRecord[] = publishedClauses();
  if (query.category) and.push({ category: { equals: query.category } });
  if (query.featured) and.push({ isFeatured: { equals: true } });
  if (query.tag) and.push({ "tags.label": { equals: query.tag } });
  if (query.query) and.push({ or: [{ title: { contains: query.query } }, { excerpt: { contains: query.query } }] });
  return { and };
}

function publishedClauses(): CmsRecord[] {
  return [{ isPublished: { equals: true } }, { publishedAt: { less_than_equal: new Date().toISOString() } }];
}

function validateQuery(input: JournalQuery) {
  const category = input.category?.trim();
  if (category && !categories.has(category as JournalCategory)) throw new JournalInputError("category is not supported.");
  const page = positiveInteger(input.page, 1, 10_000, "page");
  const limit = positiveInteger(input.limit, 12, 50, "limit");
  const query = optionalBounded(input.query, 100, "query");
  const tag = optionalBounded(input.tag, 60, "tag");
  return { category: category as JournalCategory | undefined, featured: Boolean(input.featured), limit, page, query, tag };
}

function positiveInteger(value: unknown, fallback: number, maximum: number, name: string) {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > maximum) throw new JournalInputError(`${name} is invalid.`);
  return Number(value);
}

function optionalBounded(value: unknown, maximum: number, name: string) {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" || value.trim().length > maximum) throw new JournalInputError(`${name} is invalid.`);
  return value.trim();
}

function mapSummary(doc: CmsRecord): JournalSummary {
  const tags = records(doc.tags).map((tag) => text(tag.label)).filter(Boolean);
  return {
    authorName: text(doc.authorName, "ArtEffect"),
    category: categories.has(doc.category as JournalCategory) ? doc.category as JournalCategory : "studio",
    excerpt: text(doc.excerpt),
    image: documentImage(doc, text(doc.title, "Journal article")),
    isFeatured: doc.isFeatured === true,
    publishedAt: optionalText(doc.publishedAt) ?? new Date(0).toISOString(),
    readTime: typeof doc.readTime === "number" && doc.readTime > 0 ? Math.round(doc.readTime) : 1,
    slug: text(doc.slug),
    tags,
    title: text(doc.title, "Untitled journal article")
  };
}

function mapArticle(doc: CmsRecord): JournalArticle {
  // Payload's Local API can expand relationships beyond collection access rules.
  // Never serialize a linked draft into the public article response.
  const relatedArtist = publishedRelationship(doc.relatedArtist);
  const relatedCause = publishedRelationship(doc.relatedCause);
  const relatedDrop = publishedRelationship(doc.relatedDrop);
  return {
    ...mapSummary(doc),
    content: richText(doc.content),
    relatedArtist: optionalText(relatedArtist.slug) ? { name: text(relatedArtist.name, "Artist"), slug: text(relatedArtist.slug) } : undefined,
    relatedCause: optionalText(relatedCause.slug) ? { name: text(relatedCause.name, "Cause"), slug: text(relatedCause.slug) } : undefined,
    relatedDrop: optionalText(relatedDrop.slug) ? { slug: text(relatedDrop.slug), title: text(relatedDrop.title, "Drop") } : undefined,
    seo: seoContent(doc.seo)
  };
}

function publishedRelationship(value: unknown): CmsRecord {
  const relationship = record(value);
  return relationship.isPublished === true ? relationship : {};
}

function paginate(articles: JournalArticle[], page: number, limit: number): JournalPage {
  const totalDocs = articles.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
  const docs = articles.slice((page - 1) * limit, page * limit).map((article) => ({
    authorName: article.authorName,
    category: article.category,
    excerpt: article.excerpt,
    image: article.image,
    isFeatured: article.isFeatured,
    publishedAt: article.publishedAt,
    readTime: article.readTime,
    slug: article.slug,
    tags: article.tags,
    title: article.title
  }));
  return { docs, hasNextPage: page < totalPages, hasPrevPage: page > 1, limit, page, totalDocs, totalPages };
}
