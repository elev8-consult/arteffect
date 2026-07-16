import { CommerceError } from "./errors";

export const supportedCurrencies = ["USD", "LBP", "EUR", "GBP"] as const;
export type CommerceCurrency = (typeof supportedCurrencies)[number];

const currencyExponent: Record<CommerceCurrency, number> = {
  USD: 2,
  LBP: 0,
  EUR: 2,
  GBP: 2
};

export function asCurrency(value: unknown): CommerceCurrency {
  if (typeof value === "string" && supportedCurrencies.includes(value as CommerceCurrency)) {
    return value as CommerceCurrency;
  }
  throw new CommerceError("UNSUPPORTED_CURRENCY", "The product currency is not supported.", 409);
}

export function toMinorUnits(value: unknown, currency: CommerceCurrency) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new CommerceError("INVALID_PRICE", "A product has an invalid price.", 409);
  }
  const scale = 10 ** currencyExponent[currency];
  const minor = Math.round((amount + Number.EPSILON) * scale);
  if (!Number.isSafeInteger(minor)) {
    throw new CommerceError("INVALID_PRICE", "A product price is outside the supported range.", 409);
  }
  return minor;
}

export function percentageOf(amount: number, percentage: number) {
  return Math.round((amount * Math.min(100, Math.max(0, percentage))) / 100);
}
