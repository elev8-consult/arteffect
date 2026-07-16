import type { CollectionConfig } from "payload";

import { editorOrAdmin as authenticated, publishedOrAuthenticated } from "../access";
import { publishedField, sortOrderField } from "../fields";

export const FAQs: CollectionConfig = {
  slug: "faqs",
  admin: {
    defaultColumns: ["question", "category", "isPublished", "sortOrder"],
    group: "Content",
    useAsTitle: "question"
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated
  },
  fields: [
    {
      name: "question",
      type: "text",
      required: true,
      maxLength: 180
    },
    {
      name: "answer",
      type: "richText",
      required: true
    },
    {
      name: "category",
      type: "select",
      required: true,
      defaultValue: "orders",
      options: [
        { label: "Orders", value: "orders" },
        { label: "Products", value: "products" },
        { label: "Drops and editions", value: "drops" },
        { label: "Artists", value: "artists" },
        { label: "Impact", value: "impact" },
        { label: "Shipping and returns", value: "shipping-returns" }
      ]
    },
    {
      name: "audience",
      type: "select",
      defaultValue: "collectors",
      options: [
        { label: "Collectors", value: "collectors" },
        { label: "Artists", value: "artists" },
        { label: "NGO partners", value: "ngo-partners" },
        { label: "All audiences", value: "all" }
      ]
    },
    publishedField,
    sortOrderField
  ],
  timestamps: true
};
