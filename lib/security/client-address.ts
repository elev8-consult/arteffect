import { isIP } from "node:net";

const maximumForwardedHeaderLength = 1_024;
const maximumTrustedProxyHops = 10;

/**
 * Returns the address supplied by the first untrusted hop in a proxy chain.
 *
 * Forwarded address headers are ignored unless the deployment has an explicit
 * trust boundary. Railway has one ingress proxy in front of the application;
 * other deployments can opt in with RATE_LIMIT_TRUSTED_PROXY_HOPS. Counting
 * from the right prevents a client-prepended X-Forwarded-For value from being
 * selected as its identity.
 */
export function getTrustedClientAddress(
  headers: Headers,
  trustedProxyHops = configuredTrustedProxyHops()
): string | undefined {
  if (!Number.isInteger(trustedProxyHops) || trustedProxyHops < 1 || trustedProxyHops > maximumTrustedProxyHops) {
    return undefined;
  }

  const forwarded = boundedHeader(headers.get("x-forwarded-for"), maximumForwardedHeaderLength);
  if (forwarded) {
    const addresses = forwarded.split(",").map((address) => address.trim());
    const candidate = addresses.at(-trustedProxyHops);
    return candidate && isIP(candidate) ? candidate : undefined;
  }

  const realAddress = boundedHeader(headers.get("x-real-ip"), 100);
  return realAddress && isIP(realAddress) ? realAddress : undefined;
}

function configuredTrustedProxyHops() {
  const configured = process.env.RATE_LIMIT_TRUSTED_PROXY_HOPS;
  if (configured !== undefined) {
    if (!/^\d+$/.test(configured)) return 0;
    const hops = Number(configured);
    return hops <= maximumTrustedProxyHops ? hops : 0;
  }

  return process.env.RAILWAY_ENVIRONMENT_ID || process.env.RAILWAY_PUBLIC_DOMAIN ? 1 : 0;
}

function boundedHeader(value: string | null, maximum: number) {
  const normalized = value?.trim();
  return normalized && normalized.length <= maximum ? normalized : undefined;
}
