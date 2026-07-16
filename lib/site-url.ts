/**
 * Normalize the public site origin used by Payload (serverURL/cors/csrf)
 * and Next.js metadata. Railway users often paste the hostname without a
 * scheme; Payload then receives an invalid serverURL and admin returns 500.
 */
export function resolveSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : undefined);

  const fallback = process.env.NODE_ENV === "production"
    ? "https://arteffect.com"
    : "http://localhost:3000";

  return normalizeSiteUrl(configured || fallback);
}

export function normalizeSiteUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "http://localhost:3000";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
