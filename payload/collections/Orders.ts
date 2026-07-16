import type { CollectionConfig } from "payload";

import { addressFields, currencyField, minorMoneyField, orderItemFields } from "../commerceFields";
import { adminOrCustomer, authenticated, noOne } from "../access";

export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    group: "Commerce",
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "customerEmail", "status", "paymentStatus", "total", "currency", "createdAt"]
  },
  access: {
    create: noOne,
    delete: authenticated,
    read: adminOrCustomer,
    update: authenticated
  },
  fields: [
    { name: "orderNumber", type: "text", required: true, unique: true, index: true, maxLength: 40 },
    { name: "cart", type: "relationship", relationTo: "carts", required: true, unique: true },
    { name: "customer", type: "relationship", relationTo: "users", index: true },
    { name: "customerEmail", type: "email", required: true, index: true },
    {
      name: "guestTokenHash",
      type: "text",
      required: true,
      unique: true,
      hidden: true,
      access: { read: () => false, update: () => false }
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending-payment",
      index: true,
      options: [
        { label: "Pending payment", value: "pending-payment" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Processing", value: "processing" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Expired", value: "expired" },
        { label: "Refunded", value: "refunded" }
      ]
    },
    {
      name: "paymentStatus",
      type: "select",
      required: true,
      defaultValue: "not-started",
      index: true,
      options: [
        { label: "Not started", value: "not-started" },
        { label: "Pending", value: "pending" },
        { label: "Authorized", value: "authorized" },
        { label: "Paid", value: "paid" },
        { label: "Failed", value: "failed" },
        { label: "Partially refunded", value: "partially-refunded" },
        { label: "Refunded", value: "refunded" }
      ]
    },
    {
      name: "inventoryStatus",
      type: "select",
      required: true,
      defaultValue: "reserved",
      options: [
        { label: "Reserved", value: "reserved" },
        { label: "Committed", value: "committed" },
        { label: "Released", value: "released" }
      ]
    },
    { name: "items", type: "array", required: true, minRows: 1, maxRows: 50, fields: orderItemFields() },
    { name: "shippingAddress", type: "group", fields: addressFields() },
    { name: "billingAddress", type: "group", fields: addressFields() },
    { name: "coupon", type: "relationship", relationTo: "coupons" },
    { name: "couponCode", type: "text", maxLength: 40 },
    { name: "shippingMethod", type: "relationship", relationTo: "shipping-methods", required: true },
    { name: "shippingMethodCode", type: "text", required: true, maxLength: 60 },
    { name: "shippingMethodName", type: "text", required: true, maxLength: 100 },
    { name: "itemCount", type: "number", required: true, min: 1 },
    minorMoneyField("subtotal", "Subtotal"),
    minorMoneyField("discountTotal", "Discount"),
    minorMoneyField("shippingTotal", "Shipping"),
    minorMoneyField("taxTotal", "Tax"),
    minorMoneyField("total", "Total"),
    currencyField(),
    { name: "reservationExpiresAt", type: "date", required: true, index: true },
    { name: "paidAt", type: "date" },
    { name: "cancelledAt", type: "date" },
    { name: "notes", type: "textarea", maxLength: 1000 }
  ],
  timestamps: true
};
