import { createHash } from "node:crypto";
import { unstable_noStore as noStore } from "next/cache";

import { staticContactContent } from "@/data/content";
import { optionalText, record, records, seoContent, text, type CmsRecord } from "@/lib/cms/content-utils";
import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import { getTrustedClientAddress } from "@/lib/security/client-address";
import type { ContactContent } from "@/types/content";

type ContactPayload = {
  create: (args: { collection: "contact-submissions"; data: CmsRecord; overrideAccess?: boolean }) => Promise<CmsRecord>;
  findGlobal: (args: { depth?: number; slug: "contact" }) => Promise<CmsRecord>;
};

export class ContactInputError extends Error {}
export class ContactUnavailableError extends Error {}

export async function getContactContent(): Promise<ContactContent> {
  if (process.env.NODE_ENV !== "production") noStore();
  if (!hasPayloadDatabase()) return staticContactContent;
  try {
    const payload = (await getPayloadClient()) as unknown as ContactPayload;
    return mapContact(await payload.findGlobal({ slug: "contact", depth: 1 }));
  } catch (error) {
    console.error("Payload contact read failed; using static fallback.", error);
    return staticContactContent;
  }
}

export async function submitContact(headers: Headers, input: Record<string, unknown>) {
  if (!hasPayloadDatabase()) throw new ContactUnavailableError("Contact submissions require the configured database.");
  const content = await getContactContent();
  const data = validateSubmission(input, new Set(content.topics.map(({ value }) => value)));
  const fingerprint = requestFingerprint(headers);

  const payload = (await getPayloadClient()) as unknown as ContactPayload;
  const submission = await payload.create({
    collection: "contact-submissions",
    data: { ...data, requestFingerprint: fingerprint, status: "new" },
    overrideAccess: true
  });
  return { id: submission.id, message: "Thank you. Your message has been received." };
}

function mapContact(doc: CmsRecord): ContactContent {
  const details = record(doc.details);
  const topics = records(doc.topics)
    .map((topic) => ({ label: text(topic.label), value: text(topic.value) }))
    .filter((topic) => topic.label && topic.value);
  return {
    details: {
      address: optionalText(details.address),
      email: text(details.email, staticContactContent.details.email),
      hours: optionalText(details.hours),
      phone: optionalText(details.phone)
    },
    eyebrow: text(doc.eyebrow, staticContactContent.eyebrow),
    introduction: text(doc.introduction, staticContactContent.introduction),
    responseNote: optionalText(doc.responseNote),
    seo: seoContent(doc.seo),
    title: text(doc.title, staticContactContent.title),
    topics: topics.length ? topics : staticContactContent.topics
  };
}

function validateSubmission(input: Record<string, unknown>, topics: Set<string>) {
  if (typeof input.website === "string" && input.website.trim()) throw new ContactInputError("The submission is invalid.");
  const name = boundedText(input.name, "name", 2, 120);
  const email = boundedText(input.email, "email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ContactInputError("email is invalid.");
  const topic = boundedText(input.topic, "topic", 1, 40);
  if (!topics.has(topic)) throw new ContactInputError("topic is not supported.");
  const message = boundedText(input.message, "message", 10, 5000);
  const phone = optionalBoundedText(input.phone, "phone", 40);
  const orderNumber = optionalBoundedText(input.orderNumber, "orderNumber", 40);
  if (orderNumber && !/^AE-\d{8}-[A-F0-9]{10}$/.test(orderNumber)) throw new ContactInputError("orderNumber is invalid.");
  if (input.consentToReply !== true) throw new ContactInputError("consentToReply must be accepted.");
  return { consentToReply: true, email, message, name, orderNumber, phone, topic };
}

function boundedText(value: unknown, name: string, minimum: number, maximum: number) {
  if (typeof value !== "string") throw new ContactInputError(`${name} is required.`);
  const normalized = value.trim();
  if (normalized.length < minimum || normalized.length > maximum) throw new ContactInputError(`${name} is invalid.`);
  return normalized;
}

function optionalBoundedText(value: unknown, name: string, maximum: number) {
  if (value === undefined || value === null || value === "") return undefined;
  return boundedText(value, name, 1, maximum);
}

function requestFingerprint(headers: Headers) {
  const address = getTrustedClientAddress(headers) ?? "unknown";
  const agent = headers.get("user-agent") || "unknown";
  return createHash("sha256").update(`${address}\u0000${agent}`).digest("hex");
}
