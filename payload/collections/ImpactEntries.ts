import type { CollectionConfig } from "payload";

import { editorOrAdmin as authenticated, publishedOrAuthenticated } from "../access";
import { publishedField, sortOrderField } from "../fields";

export const ImpactEntries: CollectionConfig = {
  slug: "impact-entries",
  admin: {
    defaultColumns: ["title", "amount", "currency", "metricType", "occurredAt", "isPublished"],
    group: "Showcase",
    useAsTitle: "title"
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      maxLength: 160
    },
    {
      name: "description",
      type: "textarea",
      required: true,
      maxLength: 500
    },
    {
      name: "amount",
      type: "number",
      required: true,
      min: 0,
      admin: {
        description: "An additive allocation. Do not record the same funds again when their verification state changes."
      }
    },
    {
      name: "currency",
      type: "select",
      required: true,
      defaultValue: "USD",
      options: [{ label: "USD", value: "USD" }]
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
      ],
      admin: {
        description: "The evidence state for this distinct allocation."
      }
    },
    {
      name: "impactValue",
      type: "number",
      min: 0,
      label: "Optional outcome value"
    },
    {
      name: "impactLabel",
      type: "text",
      maxLength: 100,
      label: "Optional outcome label"
    },
    {
      name: "impactSuffix",
      type: "text",
      maxLength: 20,
      label: "Optional outcome suffix"
    },
    {
      name: "occurredAt",
      type: "date",
      required: true,
      admin: {
        date: { displayFormat: "MMMM d, yyyy", pickerAppearance: "dayOnly" }
      }
    },
    {
      name: "cause",
      type: "relationship",
      relationTo: "causes",
      required: true,
      label: "NGO or cause"
    },
    {
      name: "drop",
      type: "relationship",
      relationTo: "drops",
      label: "Related drop or batch"
    },
    {
      name: "source",
      type: "text",
      maxLength: 220,
      admin: { description: "Public report, transfer reference, or field update title." }
    },
    publishedField,
    sortOrderField
  ],
  timestamps: true
};
