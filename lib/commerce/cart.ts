import type { Payload, Where } from "payload";

import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import { isAdmin } from "@/payload/access";

import { calculateCouponDiscount, calculateTotals } from "./calculator";
import { CommerceError } from "./errors";
import { asCurrency, toMinorUnits, type CommerceCurrency } from "./money";
import { shippingQuotes, selectShippingQuote, totalsWithShipping } from "./shipping";
import {
  accessTokenMatches,
  createAccessToken,
  hashAccessToken,
  requireCartToken
} from "./tokens";
import { relationshipID, type CartLine, type CommerceRecord } from "./types";
import { couponCode, documentID, positiveInteger } from "./validation";

const cartLifetimeMilliseconds = 30 * 24 * 60 * 60 * 1000;

export async function createCart(headers: Headers) {
  const payload = await commercePayload();
  const user = await authenticatedUser(payload, headers);
  const token = createAccessToken();
  const cart = await payload.create({
    collection: "carts",
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
    data: {
      customer: user?.id,
      guestTokenHash: hashAccessToken(token),
      status: "active",
      items: [],
      itemCount: 0,
      subtotal: 0,
      discountTotal: 0,
      shippingTotal: 0,
      taxTotal: 0,
      total: 0,
      currency: "USD",
      expiresAt: new Date(Date.now() + cartLifetimeMilliseconds).toISOString()
    }
  });

  return { cart: publicCart(cart as CommerceRecord), token };
}

export async function getCart(headers: Headers, cartReference: unknown) {
  const { cart } = await authorizedCart(headers, cartReference);
  return publicCart(cart);
}

export async function addCartItem(headers: Headers, cartReference: unknown, input: Record<string, unknown>) {
  const { payload, cart } = await authorizedActiveCart(headers, cartReference);
  const productReference = documentID(input.productId ?? input.product, "productId");
  const variantReference = documentID(input.variantId ?? input.variant, "variantId");
  const quantity = positiveInteger(input.quantity ?? 1, "quantity");
  const product = await resolveProduct(payload, productReference);
  const variant = resolveVariant(product, variantReference);
  const productID = product.id;
  const existing = cartLines(cart.items);
  const matching = existing.find((line) =>
    String(relationshipID(line.product)) === String(productID) && line.variantId === String(variant.id)
  );
  const requestedQuantity = (matching?.quantity || 0) + quantity;
  assertSellable(product, variant, requestedQuantity);

  const next = matching
    ? existing.map((line) => line === matching ? { ...line, quantity: requestedQuantity } : line)
    : [...existing, lineFromProduct(product, variant, quantity)];
  if (next.length > 50) throw new CommerceError("CART_ITEM_LIMIT", "A cart can contain at most 50 different items.", 409);

  return updateRepricedCart(payload, cart, next);
}

export async function updateCartItem(
  headers: Headers,
  cartReference: unknown,
  itemReference: unknown,
  input: Record<string, unknown>
) {
  const { payload, cart } = await authorizedActiveCart(headers, cartReference);
  const itemID = documentID(itemReference, "itemId");
  const quantity = positiveInteger(input.quantity, "quantity");
  const lines = cartLines(cart.items);
  if (!lines.some((line) => line.id === String(itemID))) {
    throw new CommerceError("CART_ITEM_NOT_FOUND", "The cart item was not found.", 404);
  }
  return updateRepricedCart(
    payload,
    cart,
    lines.map((line) => line.id === String(itemID) ? { ...line, quantity } : line)
  );
}

export async function removeCartItem(headers: Headers, cartReference: unknown, itemReference: unknown) {
  const { payload, cart } = await authorizedActiveCart(headers, cartReference);
  const itemID = documentID(itemReference, "itemId");
  const lines = cartLines(cart.items);
  const next = lines.filter((line) => line.id !== String(itemID));
  if (next.length === lines.length) throw new CommerceError("CART_ITEM_NOT_FOUND", "The cart item was not found.", 404);
  return updateRepricedCart(payload, cart, next);
}

export async function applyCartCoupon(headers: Headers, cartReference: unknown, rawCode: unknown) {
  const { payload, cart } = await authorizedActiveCart(headers, cartReference);
  const code = couponCode(rawCode);
  const result = await payload.find({
    collection: "coupons",
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    where: { code: { equals: code } }
  });
  const coupon = result.docs[0] as CommerceRecord | undefined;
  if (!coupon) throw new CommerceError("COUPON_NOT_FOUND", "That coupon code was not found.", 404);
  return updateRepricedCart(payload, { ...cart, coupon: coupon.id, couponCode: code }, cartLines(cart.items), coupon);
}

export async function removeCartCoupon(headers: Headers, cartReference: unknown) {
  const { payload, cart } = await authorizedActiveCart(headers, cartReference);
  return updateRepricedCart(payload, { ...cart, coupon: null, couponCode: null }, cartLines(cart.items), null);
}

export async function estimateCartShipping(
  headers: Headers,
  cartReference: unknown,
  input: Record<string, unknown>
) {
  const { payload, cart } = await authorizedActiveCart(headers, cartReference);
  const lines = await repriceLines(payload, cartLines(cart.items));
  if (!lines.length) throw new CommerceError("EMPTY_CART", "Add an item before estimating shipping.", 409);
  const currency = lines[0].currency;
  const coupon = await couponForCart(payload, cart);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const { country, quotes } = await shippingQuotes(payload, { country: input.country, currency, lines, subtotal });
  const selected = selectShippingQuote(quotes, input.methodCode);
  const totals = totalsWithShipping(lines, currency, coupon, selected);
  const postalCode = typeof input.postalCode === "string" ? input.postalCode.trim().slice(0, 32) : undefined;
  const updated = await payload.update({
    collection: "carts",
    id: cart.id,
    depth: 1,
    overrideAccess: true,
    data: {
      items: lines,
      shippingMethod: selected.id,
      shippingEstimate: {
        country,
        postalCode,
        methodCode: selected.code,
        methodName: selected.name,
        minimumDeliveryDays: selected.minimumDeliveryDays,
        maximumDeliveryDays: selected.maximumDeliveryDays
      },
      ...totals,
      currency,
      expiresAt: new Date(Date.now() + cartLifetimeMilliseconds).toISOString()
    }
  });

  return { cart: publicCart(updated as CommerceRecord), quotes };
}

export async function authorizedCart(headers: Headers, cartReference: unknown) {
  const payload = await commercePayload();
  const id = documentID(cartReference, "cartId");
  let cart: CommerceRecord | null;
  try {
    cart = await payload.findByID({
      collection: "carts",
      id,
      depth: 1,
      overrideAccess: true,
      showHiddenFields: true,
      disableErrors: true
    }) as CommerceRecord | null;
  } catch {
    cart = null;
  }
  if (!cart) throw new CommerceError("CART_NOT_FOUND", "The cart was not found.", 404);

  const user = await authenticatedUser(payload, headers);
  const ownerID = relationshipID(cart.customer);
  const ownedByUser = Boolean(user?.id && ownerID !== undefined && String(user.id) === String(ownerID));
  if (!isAdmin(user) && !ownedByUser) {
    const token = requireCartToken(headers, cart.id);
    if (typeof cart.guestTokenHash !== "string" || !accessTokenMatches(token, cart.guestTokenHash)) {
      throw new CommerceError("CART_ACCESS_DENIED", "The cart access token is invalid.", 403);
    }
  }
  return { payload, cart, user };
}

export async function repriceLines(payload: Payload, lines: CartLine[]) {
  if (!lines.length) return [];
  const productIDs = [...new Set(lines.map((line) => relationshipID(line.product)).filter((id): id is number | string => id !== undefined))];
  const result = await payload.find({
    collection: "products",
    depth: 1,
    limit: Math.min(productIDs.length, 100),
    pagination: false,
    overrideAccess: true,
    where: { and: [{ id: { in: productIDs } }, { isPublished: { equals: true } }] }
  });
  const products = new Map((result.docs as CommerceRecord[]).map((product) => [String(product.id), product]));
  let currency: CommerceCurrency | undefined;

  return lines.map((line) => {
    const productID = relationshipID(line.product);
    const product = productID === undefined ? undefined : products.get(String(productID));
    if (!product) throw new CommerceError("PRODUCT_UNAVAILABLE", `${line.productName} is no longer available.`, 409);
    const variant = resolveVariant(product, line.variantId);
    assertSellable(product, variant, line.quantity);
    const repriced = lineFromProduct(product, variant, line.quantity, line.id);
    currency ??= repriced.currency;
    if (currency !== repriced.currency) {
      throw new CommerceError("MIXED_CART_CURRENCIES", "Products with different currencies cannot share a cart.", 409);
    }
    return repriced;
  });
}

export function publicCart(value: CommerceRecord) {
  const cart = { ...value };
  delete cart.guestTokenHash;
  return {
    ...cart,
    customer: relationshipID(cart.customer),
    coupon: relationshipID(cart.coupon),
    shippingMethod: relationshipID(cart.shippingMethod),
    items: cartLines(cart.items).map((line) => ({ ...line, product: relationshipID(line.product) }))
  };
}

async function authorizedActiveCart(headers: Headers, cartReference: unknown) {
  const authorized = await authorizedCart(headers, cartReference);
  if (authorized.cart.status !== "active") throw new CommerceError("CART_NOT_ACTIVE", "This cart can no longer be changed.", 409);
  if (new Date(String(authorized.cart.expiresAt)).getTime() <= Date.now()) {
    await authorized.payload.update({ collection: "carts", id: authorized.cart.id, overrideAccess: true, data: { status: "expired" } });
    throw new CommerceError("CART_EXPIRED", "This cart has expired.", 409);
  }
  return authorized;
}

async function updateRepricedCart(
  payload: Payload,
  cart: CommerceRecord,
  requestedLines: CartLine[],
  couponOverride?: CommerceRecord | null
) {
  const lines = await repriceLines(payload, requestedLines);
  const currency = lines[0]?.currency ?? asCurrency(cart.currency || "USD");
  const coupon = couponOverride === null ? undefined : couponOverride ?? await couponForCart(payload, cart);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const estimate = cart.shippingEstimate && typeof cart.shippingEstimate === "object"
    ? cart.shippingEstimate as Record<string, unknown>
    : undefined;
  let shippingEstimate: Record<string, unknown> | null = estimate ?? null;
  let shippingMethod: number | string | null = relationshipID(cart.shippingMethod) ?? null;
  let totals;
  if (lines.length && estimate?.country) {
    try {
      const { quotes } = await shippingQuotes(payload, { country: estimate.country, currency, lines, subtotal });
      const selected = selectShippingQuote(quotes, estimate.methodCode);
      shippingMethod = selected.id;
      totals = totalsWithShipping(lines, currency, coupon, selected);
    } catch (error) {
      if (!(error instanceof CommerceError) || !["SHIPPING_UNAVAILABLE", "INVALID_SHIPPING_METHOD"].includes(error.code)) {
        throw error;
      }
      // A cart edit may change its shipping profiles or free-shipping threshold.
      // Preserve the item mutation and ask for a fresh estimate instead of
      // leaving the cart stuck behind an obsolete method.
      shippingMethod = null;
      shippingEstimate = null;
      const discount = calculateCouponDiscount(coupon, lines, currency, subtotal, 0);
      totals = calculateTotals(lines, discount, 0);
    }
  } else {
    shippingMethod = null;
    shippingEstimate = null;
    const discount = calculateCouponDiscount(coupon, lines, currency, subtotal, 0);
    totals = calculateTotals(lines, discount, 0);
  }
  const updated = await payload.update({
    collection: "carts",
    id: cart.id,
    depth: 1,
    overrideAccess: true,
    data: {
      items: lines,
      coupon: coupon?.id ?? null,
      couponCode: coupon ? String(coupon.code) : null,
      shippingMethod,
      shippingEstimate,
      ...totals,
      currency,
      expiresAt: new Date(Date.now() + cartLifetimeMilliseconds).toISOString()
    }
  });
  return publicCart(updated as CommerceRecord);
}

async function couponForCart(payload: Payload, cart: CommerceRecord) {
  const id = relationshipID(cart.coupon);
  if (id === undefined) return undefined;
  return await payload.findByID({
    collection: "coupons",
    id,
    depth: 0,
    overrideAccess: true,
    disableErrors: true
  }) as CommerceRecord | null || undefined;
}

async function resolveProduct(payload: Payload, reference: number | string) {
  const clauses: Where[] = [{ slug: { equals: String(reference) } }];
  if (typeof reference === "number" || /^\d+$/.test(reference)) clauses.push({ id: { equals: Number(reference) } });
  const result = await payload.find({
    collection: "products",
    depth: 1,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    where: { and: [{ isPublished: { equals: true } }, { or: clauses }] }
  });
  const product = result.docs[0] as CommerceRecord | undefined;
  if (!product) throw new CommerceError("PRODUCT_NOT_FOUND", "The product was not found.", 404);
  return product;
}

function resolveVariant(product: CommerceRecord, reference: number | string) {
  const variant = records(product.variants).find((candidate) =>
    String(candidate.id) === String(reference) || String(candidate.sku) === String(reference)
  );
  if (!variant) throw new CommerceError("VARIANT_NOT_FOUND", "The product variant was not found.", 404);
  return variant;
}

function assertSellable(product: CommerceRecord, variant: CommerceRecord, quantity: number) {
  if (variant.isAvailable === false || Number(variant.inventory || 0) - Number(variant.reserved || 0) < quantity) {
    throw new CommerceError("INSUFFICIENT_INVENTORY", "The requested quantity is not available.", 409, {
      available: Math.max(0, Number(variant.inventory || 0) - Number(variant.reserved || 0))
    });
  }
  const drop = product.drop;
  if (drop && typeof drop === "object") {
    const record = drop as CommerceRecord;
    if (["draft", "preview", "sold-out", "closed"].includes(String(record.status))) {
      throw new CommerceError("DROP_UNAVAILABLE", "This product's drop is not open for orders.", 409);
    }
    const now = Date.now();
    if (record.opensAt && new Date(String(record.opensAt)).getTime() > now) throw new CommerceError("DROP_UNAVAILABLE", "This drop has not opened yet.", 409);
    if (record.closesAt && new Date(String(record.closesAt)).getTime() <= now) throw new CommerceError("DROP_UNAVAILABLE", "This drop has closed.", 409);
  }
}

function lineFromProduct(product: CommerceRecord, variant: CommerceRecord, quantity: number, id?: string): CartLine {
  const currency = asCurrency(product.currency || "USD");
  const unitPrice = toMinorUnits(variant.price, currency);
  return {
    ...(id ? { id } : {}),
    product: product.id,
    variantId: String(variant.id),
    sku: String(variant.sku),
    productName: String(product.name),
    variantName: String(variant.name),
    shippingProfile: String(product.shippingProfile || "standard") as CartLine["shippingProfile"],
    quantity,
    unitPrice,
    lineTotal: unitPrice * quantity,
    currency
  };
}

function cartLines(value: unknown): CartLine[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is CartLine => Boolean(entry && typeof entry === "object")).map((entry) => ({
        ...entry,
        id: typeof entry.id === "string" ? entry.id : undefined,
        quantity: Number(entry.quantity),
        unitPrice: Number(entry.unitPrice),
        lineTotal: Number(entry.lineTotal)
      }))
    : [];
}

function records(value: unknown): CommerceRecord[] {
  return Array.isArray(value) ? value.filter((entry): entry is CommerceRecord => Boolean(entry && typeof entry === "object")) : [];
}

async function commercePayload() {
  if (!hasPayloadDatabase()) throw new CommerceError("COMMERCE_UNAVAILABLE", "Commerce requires the configured database.", 503);
  return getPayloadClient();
}

async function authenticatedUser(payload: Payload, headers: Headers) {
  try {
    const { user } = await payload.auth({ headers });
    return user as CommerceRecord | null | undefined;
  } catch {
    return undefined;
  }
}
