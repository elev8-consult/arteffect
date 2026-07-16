import { mapShopProduct } from "@/lib/cms/products";

import { authorizedCart } from "./cart";
import { relationshipID, type CommerceRecord } from "./types";

export async function getCartUpsells(headers: Headers, cartReference: unknown) {
  const { payload, cart } = await authorizedCart(headers, cartReference);
  const productIDs = Array.isArray(cart.items)
    ? cart.items.map((item) => item && typeof item === "object" ? relationshipID((item as Record<string, unknown>).product) : undefined)
        .filter((id): id is number | string => id !== undefined)
    : [];
  if (!productIDs.length) return [];

  const sources = await payload.find({
    collection: "products",
    depth: 1,
    limit: Math.min(productIDs.length, 50),
    pagination: false,
    overrideAccess: true,
    where: { id: { in: productIDs } }
  });
  const explicitIDs = (sources.docs as CommerceRecord[]).flatMap((product) =>
    Array.isArray(product.upsells)
      ? product.upsells.map(relationshipID).filter((id): id is number | string => id !== undefined)
      : []
  );
  const excluded = new Set(productIDs.map(String));
  const result = await payload.find({
    collection: "products",
    depth: 2,
    limit: 12,
    pagination: false,
    overrideAccess: true,
    sort: ["-isFeatured", "sortOrder", "name"],
    where: {
      and: [
        { isPublished: { equals: true } },
        { availability: { not_equals: "out-of-stock" } },
        { id: { not_in: productIDs } }
      ]
    }
  });
  return (result.docs as CommerceRecord[])
    .filter((product) => !excluded.has(String(product.id)))
    .sort((left, right) => Number(explicitIDs.some((id) => String(id) === String(right.id))) - Number(explicitIDs.some((id) => String(id) === String(left.id))))
    .slice(0, 4)
    .map(mapShopProduct);
}
