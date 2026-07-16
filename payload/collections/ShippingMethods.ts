import type { CollectionConfig } from "payload";

import { authenticated } from "../access";
import { currencyField } from "../commerceFields";

export const ShippingMethods: CollectionConfig = {
  slug: "shipping-methods",
  admin: {
    group: "Commerce",
    useAsTitle: "name",
    defaultColumns: ["name", "code", "rate", "currency", "isActive", "sortOrder"]
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated
  },
  fields: [
    {
      name: "code",
      type: "text",
      required: true,
      unique: true,
      index: true,
      maxLength: 60,
      validate: (value: null | string | string[] | undefined) =>
        typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
          ? true
          : "Use a lowercase slug."
    },
    { name: "name", type: "text", required: true, maxLength: 100 },
    { name: "description", type: "textarea", maxLength: 300 },
    { name: "rate", type: "number", required: true, min: 0, admin: { description: "Major-unit shipping price." } },
    { name: "freeAbove", type: "number", min: 0, admin: { description: "Optional major-unit subtotal threshold." } },
    currencyField(),
    {
      name: "countries",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        {
          name: "code",
          type: "text",
          required: true,
          minLength: 2,
          maxLength: 2,
          admin: { description: "ISO 3166-1 alpha-2 code, or ZZ as a worldwide fallback." }
        }
      ]
    },
    {
      name: "allowedProfiles",
      type: "select",
      hasMany: true,
      options: [
        { label: "Standard object", value: "standard" },
        { label: "Fragile object", value: "fragile" },
        { label: "Textile", value: "textile" },
        { label: "Digital or certificate", value: "digital" }
      ]
    },
    { name: "minimumDeliveryDays", type: "number", required: true, min: 0, max: 365 },
    { name: "maximumDeliveryDays", type: "number", required: true, min: 0, max: 365 },
    { name: "isActive", type: "checkbox", required: true, defaultValue: true, index: true },
    { name: "sortOrder", type: "number", required: true, defaultValue: 0 }
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const minimum = Number(data.minimumDeliveryDays ?? originalDoc?.minimumDeliveryDays ?? 0);
        const maximum = Number(data.maximumDeliveryDays ?? originalDoc?.maximumDeliveryDays ?? 0);
        if (maximum < minimum) throw new Error("Maximum delivery days cannot be less than minimum delivery days.");
        if (Array.isArray(data.countries)) {
          data.countries = data.countries.map((country) => ({
            ...country,
            code: typeof country?.code === "string" ? country.code.trim().toUpperCase() : country?.code
          }));
        }
        return data;
      }
    ]
  },
  timestamps: true
};
