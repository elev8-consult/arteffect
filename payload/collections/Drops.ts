import type { CollectionConfig } from "payload";

import { editorOrAdmin as authenticated, publishedOrAuthenticated } from "../access";
import {
  ctaFields,
  currentField,
  imageFields,
  progressField,
  publishedField,
  seoFields,
  slugField,
  sortOrderField
} from "../fields";

export const Drops: CollectionConfig = {
  slug: "drops",
  admin: {
    defaultColumns: ["title", "eyebrow", "isCurrent", "isPublished", "updatedAt"],
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
    slugField,
    {
      name: "eyebrow",
      type: "text",
      required: true,
      maxLength: 80
    },
    {
      name: "title",
      type: "text",
      required: true,
      maxLength: 160
    },
    {
      name: "summary",
      type: "textarea",
      required: true,
      maxLength: 900
    },
    {
      name: "batchSize",
      type: "number",
      required: true,
      min: 1
    },
    {
      name: "reserved",
      type: "number",
      required: true,
      min: 0
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Preview", value: "preview" },
        { label: "Live", value: "live" },
        { label: "Sold out", value: "sold-out" },
        { label: "Closed", value: "closed" }
      ],
      admin: {
        position: "sidebar"
      }
    },
    {
      name: "opensAt",
      type: "date",
      admin: {
        date: {
          displayFormat: "MMMM d, yyyy",
          pickerAppearance: "dayAndTime"
        },
        position: "sidebar"
      }
    },
    {
      name: "closesAt",
      type: "date",
      required: true,
      admin: {
        date: {
          displayFormat: "MMMM d, yyyy",
          pickerAppearance: "dayOnly"
        }
      }
    },
    {
      name: "products",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      label: "Products in this batch"
    },
    {
      name: "artist",
      type: "relationship",
      relationTo: "artists",
      required: true
    },
    {
      name: "artwork",
      type: "relationship",
      relationTo: "artworks",
      hasMany: true,
      required: true,
      label: "Designs or artworks",
      admin: {
        description: "Select one or more artworks for this batch. The first artwork is featured in the main artwork section."
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
      name: "donationPercentage",
      type: "number",
      min: 0,
      max: 100,
      label: "NGO donation percentage",
      admin: {
        description: "The percentage of this batch's proceeds allocated directly to the NGO partner."
      }
    },
    ...imageFields(),
    {
      name: "gallery",
      type: "array",
      labels: {
        singular: "Gallery image",
        plural: "Gallery images"
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true
        },
        {
          name: "caption",
          type: "text",
          maxLength: 180
        }
      ]
    },
    {
      name: "milestones",
      type: "array",
      required: true,
      minRows: 1,
      labels: {
        singular: "Milestone",
        plural: "Milestones"
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          maxLength: 90
        },
        {
          name: "value",
          type: "text",
          required: true,
          maxLength: 90
        },
        progressField()
      ]
    },
    {
      name: "allocation",
      type: "array",
      labels: {
        singular: "Fund allocation",
        plural: "Fund allocations"
      },
      admin: {
        description: "Explain how proceeds from this batch are divided."
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          maxLength: 100
        },
        {
          name: "percentage",
          type: "number",
          required: true,
          min: 0,
          max: 100
        },
        {
          name: "description",
          type: "textarea",
          maxLength: 300
        }
      ]
    },
    {
      name: "cta",
      type: "group",
      label: "Call to action",
      fields: ctaFields()
    },
    ...seoFields(),
    currentField,
    publishedField,
    sortOrderField
  ],
  timestamps: true
};
