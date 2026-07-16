import type { CollectionConfig } from "payload";

import { authenticated } from "../access";
import { currencyField } from "../commerceFields";

export const Coupons: CollectionConfig = {
  slug: "coupons",
  admin: {
    group: "Commerce",
    useAsTitle: "code",
    defaultColumns: ["code", "discountType", "value", "isActive", "uses", "endsAt"]
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
      maxLength: 40,
      validate: (value: null | string | string[] | undefined) =>
        typeof value === "string" && /^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(value)
          ? true
          : "Use 2–40 uppercase letters, numbers, underscores, or hyphens."
    },
    {
      name: "discountType",
      type: "select",
      required: true,
      options: [
        { label: "Percentage", value: "percentage" },
        { label: "Fixed amount", value: "fixed" },
        { label: "Free shipping", value: "free-shipping" }
      ]
    },
    {
      name: "value",
      type: "number",
      required: true,
      min: 0,
      admin: { description: "Percentage points, or a major-unit amount for fixed discounts." }
    },
    currencyField("currency", false),
    { name: "minimumSubtotal", type: "number", defaultValue: 0, min: 0 },
    { name: "maximumDiscount", type: "number", min: 0 },
    { name: "maximumUses", type: "number", min: 1 },
    { name: "uses", type: "number", required: true, defaultValue: 0, min: 0, admin: { readOnly: true } },
    { name: "startsAt", type: "date" },
    { name: "endsAt", type: "date" },
    { name: "applicableProducts", type: "relationship", relationTo: "products", hasMany: true },
    { name: "excludedProducts", type: "relationship", relationTo: "products", hasMany: true },
    { name: "isActive", type: "checkbox", required: true, defaultValue: true, index: true }
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => ({
        ...data,
        code: typeof data?.code === "string" ? data.code.trim().toUpperCase() : data?.code
      })
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        const type = data.discountType ?? originalDoc?.discountType;
        const value = Number(data.value ?? originalDoc?.value ?? 0);
        if (type === "percentage" && value > 100) {
          throw new Error("Percentage coupons cannot exceed 100%.");
        }
        if (type === "free-shipping") data.value = 0;

        const startsAt = data.startsAt ?? originalDoc?.startsAt;
        const endsAt = data.endsAt ?? originalDoc?.endsAt;
        if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
          throw new Error("Coupon end time must be after its start time.");
        }
        return data;
      }
    ]
  },
  timestamps: true
};
