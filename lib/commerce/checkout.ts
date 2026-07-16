import { randomBytes } from "node:crypto";

import type { Payload } from "payload";

import { authorizedCart, publicCart, repriceLines } from "./cart";
import { claimCouponUse, releaseCouponUse } from "./coupons";
import { CommerceError } from "./errors";
import { expireStaleOrders, recordInventoryMovements, releaseInventory, reserveInventory, type InventoryReservation } from "./inventory";
import { listPaymentProviders } from "./payments/registry";
import { publicOrder } from "./orders";
import { shippingQuotes, selectShippingQuote, totalsWithShipping } from "./shipping";
import { asCommerceRecord, numericRelationshipID, payloadCartLine, relationshipID, type CommerceRecord } from "./types";
import { checkoutAddress, emailAddress } from "./validation";

const reservationLifetimeMilliseconds = 30 * 60 * 1000;

export async function checkout(headers: Headers, input: Record<string, unknown>) {
  const { payload, cart, user } = await authorizedCart(headers, input.cartId);
  if (cart.status === "converted") return existingOrder(payload, cart.id);
  if (cart.status !== "active") throw new CommerceError("CART_NOT_ACTIVE", "This cart cannot be checked out.", 409);
  if (new Date(String(cart.expiresAt)).getTime() <= Date.now()) {
    throw new CommerceError("CART_EXPIRED", "This cart has expired.", 409);
  }
  if (input.paymentProvider) {
    throw new CommerceError("PAYMENT_PROVIDER_UNAVAILABLE", "No payment provider is configured yet.", 503, {
      availableProviders: listPaymentProviders()
    });
  }

  await expireStaleOrders(payload);

  const lines = await repriceLines(payload, cartLines(cart.items));
  if (!lines.length) throw new CommerceError("EMPTY_CART", "Add at least one item before checkout.", 409);
  const customerEmail = emailAddress(input.email ?? cart.email ?? user?.email);
  const shippingAddress = checkoutAddress(input.shippingAddress, "shippingAddress");
  const billingAddress = input.billingAddress
    ? checkoutAddress(input.billingAddress, "billingAddress")
    : shippingAddress;
  const currency = lines[0].currency;
  const coupon = await cartCoupon(payload, cart);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const { quotes } = await shippingQuotes(payload, {
    country: shippingAddress.country,
    currency,
    lines,
    subtotal
  });
  const estimate = cart.shippingEstimate && typeof cart.shippingEstimate === "object"
    ? cart.shippingEstimate as Record<string, unknown>
    : undefined;
  const shipping = selectShippingQuote(quotes, input.shippingMethodCode ?? estimate?.methodCode);
  const totals = totalsWithShipping(lines, currency, coupon, shipping);
  const orderNumber = createOrderNumber();
  const reservationExpiresAt = new Date(Date.now() + reservationLifetimeMilliseconds).toISOString();
  let reservations: InventoryReservation[] = [];
  let order: CommerceRecord | undefined;
  let couponClaimed = false;
  let updatedCart: CommerceRecord | undefined;

  try {
    reservations = await reserveInventory(payload, lines);
    couponClaimed = await claimCouponUse(payload, coupon);
    order = await payload.create({
      collection: "orders",
      depth: 1,
      overrideAccess: true,
      showHiddenFields: true,
      data: {
        orderNumber,
        cart: numericRelationshipID(cart.id),
        customer: numericRelationshipID(user?.id) ?? numericRelationshipID(cart.customer),
        customerEmail,
        guestTokenHash: String(cart.guestTokenHash),
        status: "pending-payment",
        paymentStatus: "not-started",
        inventoryStatus: "reserved",
        items: lines.map(payloadCartLine),
        shippingAddress,
        billingAddress,
        coupon: numericRelationshipID(coupon?.id),
        couponCode: coupon ? String(coupon.code) : undefined,
        shippingMethod: shipping.id,
        shippingMethodCode: shipping.code,
        shippingMethodName: shipping.name,
        ...totals,
        currency,
        reservationExpiresAt
      }
    } as Parameters<Payload["create"]>[0]) as unknown as CommerceRecord;
    await recordInventoryMovements(payload, reservations, {
      cartID: numericRelationshipID(cart.id) ?? 0,
      orderID: numericRelationshipID(order.id) ?? 0,
      orderNumber,
      movementType: "reserve"
    });
    updatedCart = await payload.update({
      collection: "carts",
      id: cart.id,
      depth: 0,
      overrideAccess: true,
      data: {
        email: customerEmail,
        status: "converted",
        items: lines.map(payloadCartLine),
        coupon: numericRelationshipID(coupon?.id) ?? null,
        couponCode: coupon ? String(coupon.code) : null,
        shippingMethod: shipping.id,
        shippingEstimate: {
          country: shippingAddress.country,
          postalCode: shippingAddress.postalCode,
          methodCode: shipping.code,
          methodName: shipping.name,
          minimumDeliveryDays: shipping.minimumDeliveryDays,
          maximumDeliveryDays: shipping.maximumDeliveryDays
        },
        ...totals,
        currency
      }
    }) as unknown as CommerceRecord;
  } catch (error) {
    if (reservations.length) await releaseInventory(payload, reservations).catch((releaseError) => {
      console.error("Failed to compensate an inventory reservation.", releaseError);
    });
    if (order) await payload.delete({ collection: "orders", id: order.id, overrideAccess: true }).catch(() => undefined);
    if (couponClaimed) await releaseCouponUse(payload, coupon).catch((releaseError) => {
      console.error("Failed to compensate a coupon redemption.", releaseError);
    });
    throw error;
  }

  return {
    order: publicOrder(order),
    cart: publicCart(updatedCart ?? { ...cart, status: "converted" }),
    paymentProviders: listPaymentProviders(),
    requiresPayment: true,
    reservationExpiresAt
  };
}

async function existingOrder(payload: Payload, cartID: number | string) {
  const result = await payload.find({
    collection: "orders",
    depth: 1,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    where: { cart: { equals: cartID } }
  });
  const order = result.docs[0] ? asCommerceRecord(result.docs[0]) : undefined;
  if (!order) throw new CommerceError("ORDER_NOT_FOUND", "The converted cart has no order.", 409);
  return {
    order: publicOrder(order),
    paymentProviders: listPaymentProviders(),
    requiresPayment: order.paymentStatus !== "paid",
    reservationExpiresAt: order.reservationExpiresAt
  };
}

async function cartCoupon(payload: Payload, cart: CommerceRecord) {
  const couponID = numericRelationshipID(cart.coupon);
  if (couponID === undefined) return undefined;
  return await payload.findByID({
    collection: "coupons",
    id: couponID,
    depth: 0,
    overrideAccess: true,
    disableErrors: true
  }) as unknown as CommerceRecord | null || undefined;
}

function createOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `AE-${date}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

function cartLines(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is import("./types").CartLine => Boolean(item && typeof item === "object")) : [];
}
