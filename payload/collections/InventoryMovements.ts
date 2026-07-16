import type { CollectionConfig } from "payload";

import { authenticated, noOne } from "../access";

export const InventoryMovements: CollectionConfig = {
  slug: "inventory-movements",
  admin: {
    group: "Commerce",
    useAsTitle: "idempotencyKey",
    defaultColumns: ["sku", "movementType", "quantity", "order", "createdAt"]
  },
  access: {
    create: noOne,
    delete: authenticated,
    read: authenticated,
    update: noOne
  },
  fields: [
    { name: "product", type: "relationship", relationTo: "products", required: true, index: true },
    { name: "variantId", type: "text", required: true, maxLength: 100, index: true },
    { name: "sku", type: "text", required: true, maxLength: 80, index: true },
    { name: "cart", type: "relationship", relationTo: "carts" },
    { name: "order", type: "relationship", relationTo: "orders", index: true },
    {
      name: "movementType",
      type: "select",
      required: true,
      options: [
        { label: "Reserve", value: "reserve" },
        { label: "Release", value: "release" },
        { label: "Sale", value: "sale" },
        { label: "Restock", value: "restock" },
        { label: "Adjustment", value: "adjustment" }
      ]
    },
    {
      name: "quantity",
      type: "number",
      required: true,
      validate: (value: null | number | undefined) => value && Number.isSafeInteger(value) ? true : "Quantity must be a non-zero integer."
    },
    { name: "inventoryAfter", type: "number", required: true, min: 0 },
    { name: "reservedAfter", type: "number", required: true, min: 0 },
    { name: "idempotencyKey", type: "text", required: true, unique: true, index: true, maxLength: 160 },
    { name: "reason", type: "text", maxLength: 300 }
  ],
  timestamps: true
};
