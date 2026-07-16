import type { CollectionConfig } from "payload";

import { editorOrAdmin as authenticated, publishedOrAuthenticated } from "../access";
import { featuredField, publishedField, sortOrderField } from "../fields";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  admin: {
    defaultColumns: ["personName", "relationship", "isFeatured", "isPublished", "sortOrder"],
    group: "Content",
    useAsTitle: "personName"
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated
  },
  fields: [
    {
      name: "quote",
      type: "textarea",
      required: true,
      maxLength: 700
    },
    {
      name: "personName",
      type: "text",
      required: true,
      maxLength: 120
    },
    {
      name: "relationship",
      type: "select",
      required: true,
      defaultValue: "collector",
      options: [
        { label: "Collector", value: "collector" },
        { label: "Artist", value: "artist" },
        { label: "NGO partner", value: "ngo-partner" },
        { label: "Press", value: "press" },
        { label: "Community member", value: "community-member" }
      ]
    },
    {
      name: "role",
      type: "text",
      maxLength: 140
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media"
    },
    {
      name: "rating",
      type: "number",
      min: 1,
      max: 5
    },
    {
      name: "source",
      type: "text",
      maxLength: 180,
      admin: {
        description: "Optional source label, e.g. email, press article, or partner report."
      }
    },
    {
      name: "sourceUrl",
      type: "text",
      maxLength: 220
    },
    {
      name: "relatedDrop",
      type: "relationship",
      relationTo: "drops",
      label: "Related drop or batch"
    },
    featuredField,
    publishedField,
    sortOrderField
  ],
  timestamps: true
};
