import type { Field } from "payload";

export const currencyOptions = [
  { label: "US dollar", value: "USD" },
  { label: "Lebanese pound", value: "LBP" },
  { label: "Euro", value: "EUR" },
  { label: "British pound", value: "GBP" }
];

export function currencyField(name = "currency", required = true): Field {
  return {
    name,
    type: "select",
    required,
    defaultValue: "USD",
    options: currencyOptions
  };
}

export function minorMoneyField(name: string, label: string): Field {
  return {
    name,
    type: "number",
    required: true,
    defaultValue: 0,
    min: 0,
    label,
    admin: {
      description: "Stored in the currency's smallest unit (cents for USD/EUR/GBP)."
    }
  };
}

export const addressFields = (): Field[] => [
  { name: "name", type: "text", required: true, maxLength: 120 },
  { name: "company", type: "text", maxLength: 120 },
  { name: "line1", type: "text", required: true, maxLength: 160 },
  { name: "line2", type: "text", maxLength: 160 },
  { name: "city", type: "text", required: true, maxLength: 100 },
  { name: "state", type: "text", maxLength: 100 },
  { name: "postalCode", type: "text", maxLength: 32 },
  {
    name: "country",
    type: "text",
    required: true,
    minLength: 2,
    maxLength: 2,
    admin: { description: "ISO 3166-1 alpha-2 country code." }
  },
  { name: "phone", type: "text", required: true, maxLength: 32 }
];

export const orderItemFields = (): Field[] => [
  { name: "product", type: "relationship", relationTo: "products", required: true },
  { name: "variantId", type: "text", required: true, maxLength: 100 },
  { name: "sku", type: "text", required: true, maxLength: 80 },
  { name: "productName", type: "text", required: true, maxLength: 120 },
  { name: "variantName", type: "text", required: true, maxLength: 120 },
  {
    name: "shippingProfile",
    type: "select",
    required: true,
    defaultValue: "standard",
    options: [
      { label: "Standard object", value: "standard" },
      { label: "Fragile object", value: "fragile" },
      { label: "Textile", value: "textile" },
      { label: "Digital or certificate", value: "digital" }
    ]
  },
  { name: "quantity", type: "number", required: true, min: 1, max: 25 },
  minorMoneyField("unitPrice", "Unit price"),
  minorMoneyField("lineTotal", "Line total"),
  currencyField()
];
