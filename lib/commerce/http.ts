import { CommerceError } from "./errors";
import { enforceMutationRateLimit } from "../security/rate-limit";

const maximumBodyBytes = 64 * 1024;

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw new CommerceError("FORBIDDEN_ORIGIN", "Cross-origin commerce changes are not allowed.", 403);
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    throw new CommerceError("FORBIDDEN_ORIGIN", "Cross-origin commerce changes are not allowed.", 403);
  }

  enforceMutationRateLimit(request);
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maximumBodyBytes) {
    throw new CommerceError("REQUEST_TOO_LARGE", "The request body is too large.", 413);
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new CommerceError("UNSUPPORTED_MEDIA_TYPE", "Use an application/json request body.", 415);
  }

  const body = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new CommerceError("INVALID_REQUEST", "The request body must be a JSON object.");
  }

  return body as Record<string, unknown>;
}

export function noStoreHeaders() {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff"
  };
}

export function publicCacheHeaders(maxAge = 300) {
  return {
    "Cache-Control": `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 6}`,
    "X-Content-Type-Options": "nosniff"
  };
}
