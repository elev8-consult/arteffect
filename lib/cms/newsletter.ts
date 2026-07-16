import { createHash } from "node:crypto";

import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import { getTrustedClientAddress } from "@/lib/security/client-address";

type CmsRecord = Record<string, unknown>;

type NewsletterPayload = {
  create: (args: {
    collection: "newsletter";
    data: CmsRecord;
    overrideAccess: boolean;
  }) => Promise<CmsRecord>;
  find: (args: {
    collection: "newsletter";
    limit: number;
    overrideAccess: boolean;
    pagination: false;
    where: CmsRecord;
  }) => Promise<{ docs: CmsRecord[] }>;
  update: (args: {
    collection: "newsletter";
    data: CmsRecord;
    id: number | string;
    overrideAccess: boolean;
  }) => Promise<CmsRecord>;
};

const signupSources = new Set(["homepage", "product-page", "drop-page", "journal"]);

export class NewsletterInputError extends Error {}
export class NewsletterUnavailableError extends Error {}

export async function subscribeToNewsletter(headers: Headers, input: Record<string, unknown>) {
  if (!hasPayloadDatabase()) {
    throw new NewsletterUnavailableError("Newsletter signup is temporarily unavailable.");
  }

  if (typeof input.website === "string" && input.website.trim()) {
    throw new NewsletterInputError("The signup is invalid.");
  }

  const email = normalizedEmail(input.email);
  const consent = input.consent && typeof input.consent === "object"
    ? input.consent as Record<string, unknown>
    : {};
  if (consent.acceptedMarketing !== true) {
    throw new NewsletterInputError("Marketing consent is required.");
  }

  const source = typeof input.source === "string" && signupSources.has(input.source)
    ? input.source
    : "homepage";
  const payload = (await getPayloadClient()) as unknown as NewsletterPayload;
  const existing = await payload.find({
    collection: "newsletter",
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { email: { equals: email } }
  });
  const data = {
    consent: {
      acceptedAt: new Date().toISOString(),
      acceptedMarketing: true,
      ipAddress: requestFingerprint(headers)
    },
    email,
    source,
    status: "subscribed"
  };

  const id = existing.docs[0]?.id;
  if (typeof id === "number" || typeof id === "string") {
    await payload.update({ collection: "newsletter", data, id, overrideAccess: true });
  } else {
    await payload.create({ collection: "newsletter", data, overrideAccess: true });
  }

  return { message: "Thank you. Your subscription is confirmed." };
}

function normalizedEmail(value: unknown) {
  if (typeof value !== "string") throw new NewsletterInputError("A valid email is required.");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new NewsletterInputError("A valid email is required.");
  }
  return email;
}

function requestFingerprint(headers: Headers) {
  const address = getTrustedClientAddress(headers) ?? "unknown";
  return createHash("sha256").update(address).digest("hex");
}
