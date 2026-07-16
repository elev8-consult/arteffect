import type { Payload } from "payload";

import { calculateCouponDiscount, calculateTotals } from "./calculator";
import { CommerceError } from "./errors";
import { toMinorUnits, type CommerceCurrency } from "./money";
import type { CartLine, CommerceRecord } from "./types";
import { countryCode } from "./validation";

export type ShippingQuote = {
  id: number | string;
  code: string;
  name: string;
  description: string;
  amount: number;
  minimumDeliveryDays: number;
  maximumDeliveryDays: number;
};

export async function shippingQuotes(
  payload: Payload,
  input: {
    country: unknown;
    currency: CommerceCurrency;
    lines: CartLine[];
    subtotal: number;
  }
) {
  const country = countryCode(input.country);
  const result = await payload.find({
    collection: "shipping-methods",
    depth: 0,
    limit: 100,
    pagination: false,
    overrideAccess: true,
    sort: "sortOrder",
    where: {
      and: [{ isActive: { equals: true } }, { currency: { equals: input.currency } }]
    }
  });
  const profiles = new Set(input.lines.map((line) => line.shippingProfile));

  const quotes = (result.docs as CommerceRecord[]).flatMap((method): ShippingQuote[] => {
    const countries = records(method.countries).map((entry) => String(entry.code || "").toUpperCase());
    if (!countries.includes(country) && !countries.includes("ZZ")) return [];
    const allowedProfiles = Array.isArray(method.allowedProfiles) ? method.allowedProfiles.map(String) : [];
    if (allowedProfiles.length && [...profiles].some((profile) => !allowedProfiles.includes(profile))) return [];

    const freeAbove = typeof method.freeAbove === "number" ? toMinorUnits(method.freeAbove, input.currency) : undefined;
    const amount = freeAbove !== undefined && input.subtotal >= freeAbove
      ? 0
      : toMinorUnits(method.rate, input.currency);

    return [{
      id: method.id,
      code: String(method.code),
      name: String(method.name),
      description: typeof method.description === "string" ? method.description : "",
      amount,
      minimumDeliveryDays: Number(method.minimumDeliveryDays || 0),
      maximumDeliveryDays: Number(method.maximumDeliveryDays || 0)
    }];
  });

  if (!quotes.length) {
    throw new CommerceError("SHIPPING_UNAVAILABLE", "No shipping methods are available for this destination.", 409);
  }
  return { country, quotes };
}

export function selectShippingQuote(quotes: ShippingQuote[], requestedCode: unknown) {
  if (requestedCode == null || requestedCode === "") return quotes[0];
  if (typeof requestedCode !== "string") {
    throw new CommerceError("INVALID_SHIPPING_METHOD", "The shipping method is invalid.");
  }
  const quote = quotes.find((candidate) => candidate.code === requestedCode);
  if (!quote) throw new CommerceError("INVALID_SHIPPING_METHOD", "The selected shipping method is unavailable.", 409);
  return quote;
}

export function totalsWithShipping(
  lines: CartLine[],
  currency: CommerceCurrency,
  coupon: CommerceRecord | undefined,
  quote: ShippingQuote
) {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const discount = calculateCouponDiscount(coupon, lines, currency, subtotal, quote.amount);
  return calculateTotals(lines, discount, quote.amount);
}

function records(value: unknown): CommerceRecord[] {
  return Array.isArray(value) ? value.filter((entry): entry is CommerceRecord => Boolean(entry && typeof entry === "object")) : [];
}
