import { unstable_noStore as noStore } from "next/cache";

import { staticFAQs } from "@/data/content";
import { richText, text, type CmsRecord } from "@/lib/cms/content-utils";
import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import type { FAQAudience, FAQCategory, FAQItem } from "@/types/content";

const categories = new Set<FAQCategory>(["artists", "drops", "impact", "orders", "products", "shipping-returns"]);
const audiences = new Set<FAQAudience>(["all", "artists", "collectors", "ngo-partners"]);

type FAQPayload = {
  find: (args: {
    collection: "faqs";
    depth?: number;
    limit?: number;
    pagination?: boolean;
    sort?: string[];
    where?: CmsRecord;
  }) => Promise<{ docs: CmsRecord[] }>;
};

export class FAQInputError extends Error {}

export async function getFAQs(input: { audience?: string; category?: string; query?: string } = {}): Promise<FAQItem[]> {
  if (process.env.NODE_ENV !== "production") noStore();
  const category = optionalEnum(input.category, categories, "category");
  const audience = optionalEnum(input.audience, audiences, "audience");
  const query = input.query?.trim();
  if (query && query.length > 100) throw new FAQInputError("query is invalid.");

  if (!hasPayloadDatabase()) {
    return filterStaticFAQs({ audience, category, query });
  }

  try {
    const and: CmsRecord[] = [{ isPublished: { equals: true } }];
    if (category) and.push({ category: { equals: category } });
    if (audience && audience !== "all") and.push({ or: [{ audience: { equals: audience } }, { audience: { equals: "all" } }] });
    if (query) and.push({ question: { contains: query } });
    const payload = (await getPayloadClient()) as unknown as FAQPayload;
    const result = await payload.find({
      collection: "faqs",
      depth: 0,
      limit: 250,
      pagination: false,
      sort: ["category", "sortOrder"],
      where: { and }
    });
    return result.docs.map(mapFAQ);
  } catch (error) {
    console.error("Payload faqs read failed; using static fallback.", error);
    return filterStaticFAQs({ audience, category, query });
  }
}

function filterStaticFAQs(input: {
  audience?: FAQAudience;
  category?: FAQCategory;
  query?: string;
}): FAQItem[] {
  return staticFAQs.filter((faq) =>
    (!input.category || faq.category === input.category) &&
    (!input.audience || faq.audience === input.audience || faq.audience === "all") &&
    (!input.query || faq.question.toLowerCase().includes(input.query.toLowerCase()))
  );
}

function mapFAQ(doc: CmsRecord, index: number): FAQItem {
  const category = categories.has(doc.category as FAQCategory) ? doc.category as FAQCategory : "orders";
  const audience = audiences.has(doc.audience as FAQAudience) ? doc.audience as FAQAudience : "collectors";
  return {
    answer: richText(doc.answer),
    audience,
    category,
    id: typeof doc.id === "string" || typeof doc.id === "number" ? String(doc.id) : `faq-${index + 1}`,
    question: text(doc.question, "Question")
  };
}

function optionalEnum<T extends string>(value: string | undefined, allowed: Set<T>, name: string): T | undefined {
  if (!value) return undefined;
  const normalized = value.trim() as T;
  if (!allowed.has(normalized)) throw new FAQInputError(`${name} is not supported.`);
  return normalized;
}
