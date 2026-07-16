import { CommerceError } from "./errors";
import { percentageOf, toMinorUnits, type CommerceCurrency } from "./money";
import { relationshipID, type CartLine, type CartTotals, type CommerceRecord } from "./types";

export type CouponDiscount = {
  productDiscount: number;
  shippingDiscount: number;
};

export function calculateCouponDiscount(
  coupon: CommerceRecord | undefined,
  lines: CartLine[],
  currency: CommerceCurrency,
  subtotal: number,
  shippingTotal: number,
  now = new Date()
): CouponDiscount {
  if (!coupon) return { productDiscount: 0, shippingDiscount: 0 };

  assertCouponIsUsable(coupon, currency, subtotal, now);
  const applicable = relationshipIDs(coupon.applicableProducts);
  const excluded = new Set(relationshipIDs(coupon.excludedProducts).map(String));
  const eligibleSubtotal = lines.reduce((total, line) => {
    const productID = relationshipID(line.product);
    const isIncluded = applicable.length === 0 || (productID !== undefined && applicable.some((id) => String(id) === String(productID)));
    const isExcluded = productID !== undefined && excluded.has(String(productID));
    return isIncluded && !isExcluded ? total + line.lineTotal : total;
  }, 0);

  if (eligibleSubtotal <= 0 && coupon.discountType !== "free-shipping") {
    throw new CommerceError("COUPON_NOT_APPLICABLE", "This coupon does not apply to the products in your cart.", 409);
  }

  let productDiscount = 0;
  if (coupon.discountType === "percentage") {
    productDiscount = percentageOf(eligibleSubtotal, Number(coupon.value || 0));
  } else if (coupon.discountType === "fixed") {
    productDiscount = Math.min(eligibleSubtotal, toMinorUnits(coupon.value, currency));
  }

  if (typeof coupon.maximumDiscount === "number") {
    productDiscount = Math.min(productDiscount, toMinorUnits(coupon.maximumDiscount, currency));
  }

  return {
    productDiscount,
    shippingDiscount: coupon.discountType === "free-shipping" ? shippingTotal : 0
  };
}

export function calculateTotals(
  lines: CartLine[],
  couponDiscount: CouponDiscount,
  quotedShipping: number
): CartTotals {
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  const productDiscount = Math.min(subtotal, Math.max(0, couponDiscount.productDiscount));
  const shippingDiscount = Math.min(quotedShipping, Math.max(0, couponDiscount.shippingDiscount));
  const shippingTotal = quotedShipping - shippingDiscount;
  const discountTotal = productDiscount + shippingDiscount;
  const taxTotal = 0;

  return {
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    subtotal,
    discountTotal,
    shippingTotal,
    taxTotal,
    total: Math.max(0, subtotal - productDiscount + shippingTotal + taxTotal)
  };
}

function assertCouponIsUsable(
  coupon: CommerceRecord,
  currency: CommerceCurrency,
  subtotal: number,
  now: Date
) {
  if (coupon.isActive !== true) throw new CommerceError("COUPON_INACTIVE", "This coupon is not active.", 409);
  if (coupon.startsAt && new Date(String(coupon.startsAt)) > now) {
    throw new CommerceError("COUPON_NOT_STARTED", "This coupon is not active yet.", 409);
  }
  if (coupon.endsAt && new Date(String(coupon.endsAt)) <= now) {
    throw new CommerceError("COUPON_EXPIRED", "This coupon has expired.", 409);
  }
  if (typeof coupon.maximumUses === "number" && Number(coupon.uses || 0) >= coupon.maximumUses) {
    throw new CommerceError("COUPON_LIMIT_REACHED", "This coupon has reached its usage limit.", 409);
  }
  if (coupon.discountType === "fixed" && coupon.currency !== currency) {
    throw new CommerceError("COUPON_CURRENCY_MISMATCH", "This coupon uses a different currency.", 409);
  }
  const minimum = toMinorUnits(coupon.minimumSubtotal || 0, currency);
  if (subtotal < minimum) {
    throw new CommerceError("COUPON_MINIMUM_NOT_MET", "Your cart does not meet this coupon's minimum subtotal.", 409, {
      minimumSubtotal: minimum
    });
  }
}

function relationshipIDs(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(relationshipID).filter((id): id is number | string => id !== undefined);
}
