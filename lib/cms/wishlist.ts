import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import { mapShopProduct } from "@/lib/cms/products";
import type { ShopProduct } from "@/types/shop";

type CmsRecord = Record<string, unknown>;

type WishlistPayload = {
  auth: (args: { headers: Headers }) => Promise<{ user?: CmsRecord | null }>;
  find: (args: {
    collection: "products";
    depth?: number;
    limit?: number;
    pagination?: boolean;
    where: Record<string, unknown>;
  }) => Promise<{ docs: CmsRecord[] }>;
  findByID: (args: {
    collection: "users";
    depth?: number;
    id: number | string;
    overrideAccess?: boolean;
  }) => Promise<CmsRecord>;
  update: (args: {
    collection: "users";
    data: { wishlist: Array<number | string> };
    depth?: number;
    id: number | string;
    overrideAccess?: boolean;
  }) => Promise<CmsRecord>;
};

export class WishlistAuthenticationError extends Error {}
export class WishlistInputError extends Error {}
export class WishlistUnavailableError extends Error {}

export async function getWishlist(headers: Headers): Promise<ShopProduct[]> {
  const { payload, user } = await authenticatedUser(headers);
  const account = await payload.findByID({
    collection: "users",
    depth: 0,
    id: user.id as number | string,
    overrideAccess: true
  });

  return wishlistProducts(payload, relationshipIDs(account.wishlist));
}

export async function addWishlistProduct(headers: Headers, productReference: unknown) {
  const reference = validReference(productReference);
  const { payload, user } = await authenticatedUser(headers);
  const product = await resolvePublishedProduct(payload, reference);
  if (!product) throw new WishlistInputError("The requested product does not exist.");

  const account = await payload.findByID({
    collection: "users",
    depth: 0,
    id: user.id as number | string,
    overrideAccess: true
  });
  const productID = product.id as number | string;
  const current = relationshipIDs(account.wishlist);
  if (!current.some((id) => String(id) === String(productID)) && current.length >= 100) {
    throw new WishlistInputError("A wishlist can contain at most 100 products.");
  }
  const wishlist = [...new Set([...current, productID])];

  await payload.update({
    collection: "users",
    data: { wishlist },
    depth: 0,
    id: user.id as number | string,
    overrideAccess: true
  });

  return wishlistProducts(payload, wishlist);
}

export async function removeWishlistProduct(headers: Headers, productReference: unknown) {
  const reference = validReference(productReference);
  const { payload, user } = await authenticatedUser(headers);
  const account = await payload.findByID({
    collection: "users",
    depth: 0,
    id: user.id as number | string,
    overrideAccess: true
  });
  const current = relationshipIDs(account.wishlist);
  const product = await resolvePublishedProduct(payload, reference);
  const removeID = product?.id ?? reference;
  const wishlist = current.filter((id) => String(id) !== String(removeID));

  if (wishlist.length !== current.length) {
    await payload.update({
      collection: "users",
      data: { wishlist },
      depth: 0,
      id: user.id as number | string,
      overrideAccess: true
    });
  }

  return wishlistProducts(payload, wishlist);
}

async function authenticatedUser(headers: Headers) {
  if (!hasPayloadDatabase()) {
    throw new WishlistUnavailableError("Wishlist persistence requires the configured database.");
  }

  const payload = (await getPayloadClient()) as unknown as WishlistPayload;
  const { user } = await payload.auth({ headers });

  if (!user || (typeof user.id !== "number" && typeof user.id !== "string")) {
    throw new WishlistAuthenticationError("Sign in to use a persistent wishlist.");
  }

  return { payload, user };
}

async function resolvePublishedProduct(payload: WishlistPayload, reference: number | string) {
  const clauses: Record<string, unknown>[] = [{ slug: { equals: String(reference) } }];
  if (typeof reference === "number" || /^\d+$/.test(reference)) {
    clauses.push({ id: { equals: Number(reference) } });
  }

  const result = await payload.find({
    collection: "products",
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      and: [{ isPublished: { equals: true } }, { or: clauses }]
    }
  });

  return result.docs[0];
}

async function wishlistProducts(payload: WishlistPayload, ids: Array<number | string>) {
  if (!ids.length) return [];

  const result = await payload.find({
    collection: "products",
    depth: 2,
    limit: Math.min(ids.length, 100),
    pagination: false,
    where: {
      and: [{ id: { in: ids } }, { isPublished: { equals: true } }]
    }
  });
  const byID = new Map(result.docs.map((doc) => [String(doc.id), mapShopProduct(doc)]));

  return ids.map((id) => byID.get(String(id))).filter((product): product is ShopProduct => Boolean(product));
}

function relationshipIDs(value: unknown): Array<number | string> {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (typeof entry === "number" || typeof entry === "string") return entry;
      if (entry && typeof entry === "object" && "id" in entry) {
        const id = (entry as CmsRecord).id;
        if (typeof id === "number" || typeof id === "string") return id;
      }
      return undefined;
    })
    .filter((id): id is number | string => id !== undefined)
    .slice(0, 100);
}

function validReference(value: unknown): number | string {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 100) {
    return value;
  }

  throw new WishlistInputError("productId must be a numeric ID or lowercase product slug.");
}
