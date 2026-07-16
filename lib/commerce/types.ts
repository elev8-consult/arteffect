import type { CommerceCurrency } from "./money";

export type RelationshipValue = number | string | { id?: number | string } | null;
export type CommerceRecord = Record<string, unknown> & { id: number | string };

export type CartLine = {
  id?: string;
  product: RelationshipValue;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  shippingProfile: "standard" | "fragile" | "textile" | "digital";
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: CommerceCurrency;
};

export type CartTotals = {
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
};

export type Address = {
  name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone: string;
};

export function relationshipID(value: unknown): number | string | undefined {
  if (typeof value === "number" || typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "number" || typeof id === "string") return id;
  }
  return undefined;
}
