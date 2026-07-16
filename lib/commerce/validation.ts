import { CommerceError } from "./errors";
import type { Address } from "./types";

export function positiveInteger(value: unknown, name: string, maximum = 25) {
  if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > maximum) {
    throw new CommerceError("INVALID_CART_ITEM", `${name} must be an integer between 1 and ${maximum}.`);
  }
  return Number(value);
}

export function documentID(value: unknown, name: string) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value)) return value;
  throw new CommerceError("INVALID_REFERENCE", `${name} is invalid.`);
}

export function couponCode(value: unknown) {
  if (typeof value !== "string") throw new CommerceError("INVALID_COUPON", "Enter a coupon code.");
  const code = value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code)) {
    throw new CommerceError("INVALID_COUPON", "The coupon code format is invalid.");
  }
  return code;
}

export function emailAddress(value: unknown) {
  if (typeof value !== "string") throw new CommerceError("INVALID_EMAIL", "Enter an email address.");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CommerceError("INVALID_EMAIL", "Enter a valid email address.");
  }
  return email;
}

export function countryCode(value: unknown) {
  if (typeof value !== "string" || !/^[A-Za-z]{2}$/.test(value.trim())) {
    throw new CommerceError("INVALID_ADDRESS", "Country must be a two-letter ISO code.");
  }
  return value.trim().toUpperCase();
}

export function checkoutAddress(value: unknown, name: string): Address {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CommerceError("INVALID_ADDRESS", `${name} is required.`);
  }
  const input = value as Record<string, unknown>;
  const required = (field: string, maximum: number) => {
    const result = cleanText(input[field], `${name}.${field}`, maximum, true);
    if (!result) throw new CommerceError("INVALID_ADDRESS", `${name}.${field} is required.`);
    return result;
  };
  const optional = (field: string, maximum: number) => cleanText(input[field], `${name}.${field}`, maximum, false);

  return {
    name: required("name", 120),
    ...(optional("company", 120) ? { company: optional("company", 120) } : {}),
    line1: required("line1", 160),
    ...(optional("line2", 160) ? { line2: optional("line2", 160) } : {}),
    city: required("city", 100),
    ...(optional("state", 100) ? { state: optional("state", 100) } : {}),
    ...(optional("postalCode", 32) ? { postalCode: optional("postalCode", 32) } : {}),
    country: countryCode(input.country),
    phone: required("phone", 32)
  };
}

function cleanText(value: unknown, name: string, maximum: number, required: boolean) {
  if (value == null || value === "") {
    if (required) throw new CommerceError("INVALID_ADDRESS", `${name} is required.`);
    return undefined;
  }
  if (typeof value !== "string") throw new CommerceError("INVALID_ADDRESS", `${name} must be text.`);
  const cleaned = value.trim().replace(/\s+/g, " ");
  if ((!cleaned && required) || cleaned.length > maximum || /[\u0000-\u001F\u007F]/.test(cleaned)) {
    throw new CommerceError("INVALID_ADDRESS", `${name} is invalid.`);
  }
  return cleaned || undefined;
}
