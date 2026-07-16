import type { Payload } from "payload";

import { CommerceError } from "./errors";
import type { CommerceRecord } from "./types";

type QueryResult = { rowCount: number | null };

/**
 * Claims a coupon redemption with a single conditional update. Keeping the
 * limit check in SQL prevents two simultaneous checkouts from both consuming
 * the final available use.
 */
export async function claimCouponUse(payload: Payload, coupon: CommerceRecord | undefined) {
  if (!coupon) return false;

  const result = await payload.db.pool.query(
    `UPDATE coupons
        SET uses = uses + 1,
            updated_at = now()
      WHERE id = $1
        AND is_active = true
        AND (starts_at IS NULL OR starts_at <= now())
        AND (ends_at IS NULL OR ends_at > now())
        AND (maximum_uses IS NULL OR uses < maximum_uses)
      RETURNING id`,
    [coupon.id]
  ) as QueryResult;

  if (result.rowCount !== 1) {
    throw new CommerceError("COUPON_LIMIT_REACHED", "This coupon has reached its usage limit.", 409);
  }
  return true;
}

/** Reverses a claim when checkout fails before an order is established. */
export async function releaseCouponUse(payload: Payload, coupon: CommerceRecord | undefined) {
  if (!coupon) return;
  await payload.db.pool.query(
    `UPDATE coupons
        SET uses = GREATEST(0, uses - 1),
            updated_at = now()
      WHERE id = $1`,
    [coupon.id]
  );
}
