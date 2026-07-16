import { createHash } from "node:crypto";

import { CommerceError } from "@/lib/commerce/errors";
import { getTrustedClientAddress } from "@/lib/security/client-address";

type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();
const tenMinutes = 10 * 60 * 1000;

const policies: Array<[RegExp, string, RateLimitPolicy]> = [
  [/^\/api\/checkout(?:\/|$)/, "checkout", { limit: 10, windowMs: tenMinutes }],
  [/^\/api\/contact(?:\/|$)/, "contact", { limit: 5, windowMs: tenMinutes }],
  [/^\/api\/newsletter(?:\/|$)/, "newsletter", { limit: 5, windowMs: tenMinutes }],
  [/^\/api\/(?:account|wishlist)(?:\/|$)/, "account", { limit: 30, windowMs: tenMinutes }],
  [/^\/api\/cart(?:\/|$)/, "cart", { limit: 120, windowMs: tenMinutes }]
];

const defaultPolicy: RateLimitPolicy = { limit: 60, windowMs: tenMinutes };

/**
 * A bounded, per-process limiter for storefront mutations. Railway should run one
 * instance until a shared Redis-backed adapter replaces this implementation.
 */
export function enforceMutationRateLimit(request: Request, now = Date.now()) {
  const url = new URL(request.url);
  const match = policies.find(([pattern]) => pattern.test(url.pathname));
  const scope = match?.[1] ?? url.pathname.split("/").slice(0, 3).join("/");
  const policy = match?.[2] ?? defaultPolicy;
  const key = `${scope}:${requestFingerprint(request.headers)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + policy.windowMs });
    pruneExpiredBuckets(now);
    return;
  }

  if (current.count >= policy.limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    throw new CommerceError(
      "RATE_LIMITED",
      "Too many requests. Please try again later.",
      429,
      { retryAfter }
    );
  }

  current.count += 1;
}

function requestFingerprint(headers: Headers) {
  const address = getTrustedClientAddress(headers) ?? "unknown";
  return createHash("sha256").update(address).digest("hex");
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size <= 10_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
