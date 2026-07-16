import type { CollectionConfig } from "payload";

import { authenticated, noOne } from "../access";
import { currencyField, minorMoneyField } from "../commerceFields";

export const Transactions: CollectionConfig = {
  slug: "transactions",
  admin: {
    group: "Commerce",
    useAsTitle: "idempotencyKey",
    defaultColumns: ["order", "provider", "type", "status", "amount", "currency", "createdAt"]
  },
  access: {
    create: noOne,
    delete: authenticated,
    read: authenticated,
    update: noOne
  },
  fields: [
    { name: "order", type: "relationship", relationTo: "orders", required: true, index: true },
    { name: "provider", type: "text", required: true, maxLength: 60, index: true },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Authorization", value: "authorization" },
        { label: "Capture", value: "capture" },
        { label: "Sale", value: "sale" },
        { label: "Refund", value: "refund" },
        { label: "Void", value: "void" }
      ]
    },
    {
      name: "status",
      type: "select",
      required: true,
      index: true,
      options: [
        { label: "Pending", value: "pending" },
        { label: "Succeeded", value: "succeeded" },
        { label: "Failed", value: "failed" },
        { label: "Cancelled", value: "cancelled" }
      ]
    },
    minorMoneyField("amount", "Amount"),
    currencyField(),
    { name: "idempotencyKey", type: "text", required: true, unique: true, index: true, maxLength: 120 },
    { name: "externalId", type: "text", index: true, maxLength: 160 },
    { name: "providerData", type: "json", admin: { description: "Non-secret provider references and status metadata only." } },
    { name: "failureCode", type: "text", maxLength: 100 },
    { name: "failureMessage", type: "text", maxLength: 500 }
  ],
  timestamps: true
};
