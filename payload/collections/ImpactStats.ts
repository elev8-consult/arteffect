import type { CollectionConfig } from "payload";

import { editorOrAdmin as authenticated, publishedOrAuthenticated } from "../access";
import { featuredField, publishedField, sortOrderField } from "../fields";

export const ImpactStats: CollectionConfig = {
  slug: "impact-stats",
  admin: {
    defaultColumns: ["label", "value", "metricType", "isPublished", "sortOrder"],
    group: "Showcase",
    useAsTitle: "label"
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
      maxLength: 120
    },
    {
      name: "value",
      type: "number",
      required: true,
      min: 0
    },
    {
      name: "metricType",
      type: "select",
      required: true,
      defaultValue: "projected",
      options: [
        { label: "Projected", value: "projected" },
        { label: "Committed", value: "committed" },
        { label: "Transferred", value: "transferred" },
        { label: "Verified", value: "verified" }
      ]
    },
    {
      name: "prefix",
      type: "text",
      maxLength: 8
    },
    {
      name: "suffix",
      type: "text",
      maxLength: 12
    },
    {
      name: "detail",
      type: "textarea",
      required: true,
      maxLength: 400
    },
    {
      name: "drop",
      type: "relationship",
      relationTo: "drops",
      label: "Related drop or batch"
    },
    {
      name: "cause",
      type: "relationship",
      relationTo: "causes",
      label: "Related NGO or cause"
    },
    {
      name: "period",
      type: "text",
      maxLength: 80,
      admin: {
        description: "Example: Batch 001 or Q3 2026."
      }
    },
    {
      name: "source",
      type: "text",
      maxLength: 220,
      admin: {
        description: "Public source, report URL, or internal verification note."
      }
    },
    {
      name: "measuredAt",
      type: "date",
      admin: {
        date: {
          displayFormat: "MMMM d, yyyy",
          pickerAppearance: "dayOnly"
        }
      }
    },
    featuredField,
    publishedField,
    sortOrderField
  ],
  timestamps: true
};
