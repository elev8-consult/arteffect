import { getPayloadClient } from "@/lib/cms/payload";
import { hasPayloadDatabase } from "@/lib/cms/env";
import { isAdmin } from "@/payload/access";

import { CommerceError } from "./errors";
import { releaseOrderInventory } from "./inventory";
import { accessTokenMatches, requireCartToken } from "./tokens";
import { asCommerceRecord, relationshipID, type CommerceRecord } from "./types";

export async function getOrder(headers: Headers, orderReference: unknown) {
  const { order } = await authorizedOrder(headers, orderReference);
  return publicOrder(order);
}

export async function cancelOrder(headers: Headers, orderReference: unknown) {
  const { payload, order } = await authorizedOrder(headers, orderReference);
  if (order.status !== "pending-payment" || order.paymentStatus === "paid") {
    throw new CommerceError("ORDER_CANNOT_BE_CANCELLED", "Only unpaid, pending orders can be cancelled.", 409);
  }
  const reservations = await releaseOrderInventory(payload, order, "cancelled");
  if (!reservations.length) throw new CommerceError("ORDER_CANNOT_BE_CANCELLED", "This order is no longer reserving inventory.", 409);
  const updated = await payload.findByID({
    collection: "orders",
    id: order.id,
    depth: 2,
    overrideAccess: true
  }) as unknown as CommerceRecord;
  return publicOrder(updated);
}

async function authorizedOrder(headers: Headers, orderReference: unknown) {
  if (!hasPayloadDatabase()) throw new CommerceError("COMMERCE_UNAVAILABLE", "Commerce requires the configured database.", 503);
  if (typeof orderReference !== "string" || !/^AE-\d{8}-[A-F0-9]{10}$/.test(orderReference)) {
    throw new CommerceError("INVALID_ORDER_NUMBER", "The order number is invalid.");
  }
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "orders",
    depth: 2,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    showHiddenFields: true,
    where: { orderNumber: { equals: orderReference } }
  });
  const order = result.docs[0] ? asCommerceRecord(result.docs[0]) : undefined;
  if (!order) throw new CommerceError("ORDER_NOT_FOUND", "The order was not found.", 404);
  const { user } = await payload.auth({ headers }).catch(() => ({ user: null }));
  const customerID = relationshipID(order.customer);
  const isOwner = Boolean(user?.id && customerID !== undefined && String(user.id) === String(customerID));
  if (!isAdmin(user) && !isOwner) {
    const cartID = relationshipID(order.cart);
    if (cartID === undefined) throw new CommerceError("ORDER_ACCESS_DENIED", "Order access was denied.", 403);
    const token = requireCartToken(headers, cartID);
    if (typeof order.guestTokenHash !== "string" || !accessTokenMatches(token, order.guestTokenHash)) {
      throw new CommerceError("ORDER_ACCESS_DENIED", "Order access was denied.", 403);
    }
  }
  return { payload, order };
}

export function publicOrder(order: CommerceRecord | undefined) {
  if (!order) throw new CommerceError("ORDER_NOT_FOUND", "The order was not found.", 404);
  const result = { ...order };
  delete result.guestTokenHash;
  result.cart = relationshipID(result.cart);
  result.customer = relationshipID(result.customer);
  result.coupon = relationshipID(result.coupon);
  result.shippingMethod = relationshipID(result.shippingMethod);
  if (Array.isArray(result.items)) {
    result.items = result.items.map((item) => {
      if (!item || typeof item !== "object") return item;
      const line = { ...item as Record<string, unknown> };
      line.product = relationshipID(line.product);
      return line;
    });
  }
  return result;
}
