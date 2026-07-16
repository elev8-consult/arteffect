import type { CollectionConfig } from "payload";

import { adminOrCustomer, authenticated, noOne } from "../access";
import { currencyField, minorMoneyField, orderItemFields } from "../commerceFields";

export const Carts: CollectionConfig = {
  slug: "carts",
  admin: {
    group: "Commerce",
    useAsTitle: "id",
    defaultColumns: ["id", "email", "status", "itemCount", "total", "currency", "updatedAt"]
  },
  access: {
    create: noOne,
    delete: authenticated,
    read: adminOrCustomer,
    update: noOne
  },
  fields: [
    { name: "customer", type: "relationship", relationTo: "users", index: true },
    { name: "email", type: "email" },
    {
      name: "guestTokenHash",
      type: "text",
      required: true,
      unique: true,
      index: true,
      hidden: true,
      access: { read: () => false, update: () => false }
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "active",
      index: true,
      options: [
        { label: "Active", value: "active" },
        { label: "Converted", value: "converted" },
        { label: "Abandoned", value: "abandoned" },
        { label: "Expired", value: "expired" }
      ]
    },
    { name: "items", type: "array", maxRows: 50, fields: orderItemFields() },
    { name: "coupon", type: "relationship", relationTo: "coupons" },
    { name: "couponCode", type: "text", maxLength: 40 },
    { name: "shippingMethod", type: "relationship", relationTo: "shipping-methods" },
    {
      name: "shippingEstimate",
      type: "group",
      fields: [
        { name: "country", type: "text", minLength: 2, maxLength: 2 },
        { name: "postalCode", type: "text", maxLength: 32 },
        { name: "methodCode", type: "text", maxLength: 60 },
        { name: "methodName", type: "text", maxLength: 100 },
        { name: "minimumDeliveryDays", type: "number", min: 0 },
        { name: "maximumDeliveryDays", type: "number", min: 0 }
      ]
    },
    { name: "itemCount", type: "number", required: true, defaultValue: 0, min: 0 },
    minorMoneyField("subtotal", "Subtotal"),
    minorMoneyField("discountTotal", "Discount"),
    minorMoneyField("shippingTotal", "Shipping"),
    minorMoneyField("taxTotal", "Tax"),
    minorMoneyField("total", "Total"),
    currencyField(),
    { name: "expiresAt", type: "date", required: true, index: true }
  ],
  timestamps: true
};
