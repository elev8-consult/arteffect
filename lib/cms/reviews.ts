import { unstable_noStore as noStore } from "next/cache";

import { testimonials as staticTestimonials } from "@/data/showcase";
import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import type { ShopProduct, ShopReview } from "@/types/shop";

type CmsRecord = Record<string, unknown>;

type ReviewPayload = {
  find: (args: {
    collection: "testimonials";
    depth: number;
    limit: number;
    pagination: false;
    sort: string[];
    where: Record<string, unknown>;
  }) => Promise<{ docs: CmsRecord[] }>;
};

export async function getProductReviews(product: ShopProduct, limit = 2): Promise<ShopReview[]> {
  if (process.env.NODE_ENV !== "production") noStore();

  if (!hasPayloadDatabase()) {
    return staticTestimonials
      .filter((review) => review.role.toLocaleLowerCase().includes("collector"))
      .slice(0, limit)
      .map((review, index) => ({
        id: `static-review-${index}`,
        name: review.name,
        quote: review.quote,
        role: review.role
      }));
  }

  if (!product.drop) return [];

  const payload = (await getPayloadClient()) as unknown as ReviewPayload;
  const result = await payload.find({
    collection: "testimonials",
    depth: 0,
    limit,
    pagination: false,
    sort: ["sortOrder", "-createdAt"],
    where: {
      and: [
        { isPublished: { equals: true } },
        { relationship: { equals: "collector" } },
        { relatedDrop: { equals: product.drop.id } }
      ]
    }
  });

  return result.docs
    .map((review, index) => ({
      id: typeof review.id === "number" || typeof review.id === "string"
        ? review.id
        : `review-${index}`,
      name: text(review.personName, "Collector"),
      quote: text(review.quote, ""),
      rating: rating(review.rating),
      role: optionalText(review.role)
    }))
    .filter((review) => Boolean(review.quote));
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function rating(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 5
    ? value
    : undefined;
}
