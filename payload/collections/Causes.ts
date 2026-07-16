import type { CollectionConfig } from "payload";

import { editorOrAdmin as authenticated, publishedOrAuthenticated } from "../access";
import {
  currentField,
  featuredField,
  imageFields,
  progressField,
  publishedField,
  seoFields,
  slugField,
  sortOrderField
} from "../fields";

export const Causes: CollectionConfig = {
  slug: "causes",
  admin: {
    defaultColumns: ["name", "focus", "isCurrent", "isPublished", "updatedAt"],
    group: "Showcase",
    useAsTitle: "name"
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
      name: "name",
      type: "text",
      required: true,
      maxLength: 140
    },
    {
      name: "focus",
      type: "text",
      required: true,
      maxLength: 180
    },
    {
      name: "legalName",
      type: "text",
      maxLength: 180,
      label: "Legal NGO name"
    },
    {
      name: "registrationNumber",
      type: "text",
      maxLength: 100
    },
    {
      name: "website",
      type: "text",
      maxLength: 220
    },
    {
      name: "summary",
      type: "textarea",
      required: true,
      maxLength: 900
    },
    {
      name: "contact",
      type: "group",
      fields: [
        {
          name: "name",
          type: "text",
          maxLength: 120
        },
        {
          name: "email",
          type: "email"
        },
        {
          name: "phone",
          type: "text",
          maxLength: 60
        }
      ]
    },
    ...imageFields(),
    {
      name: "gallery",
      type: "array",
      labels: {
        singular: "Field image",
        plural: "Field images"
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
      name: "metrics",
      type: "array",
      required: true,
      minRows: 1,
      labels: {
        singular: "Metric",
        plural: "Metrics"
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          maxLength: 100
        },
        {
          name: "value",
          type: "text",
          required: true,
          maxLength: 120
        },
        progressField()
      ]
    },
    {
      name: "programs",
      type: "array",
      labels: {
        singular: "Program",
        plural: "Programs"
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          maxLength: 140
        },
        {
          name: "description",
          type: "textarea",
          required: true,
          maxLength: 500
        },
        {
          name: "allocation",
          type: "text",
          maxLength: 120,
          admin: {
            description: "Example: $18 per object or 25% of proceeds."
          }
        }
      ]
    },
    {
      name: "verification",
      type: "group",
      fields: [
        {
          name: "status",
          type: "select",
          defaultValue: "pending",
          options: [
            { label: "Pending", value: "pending" },
            { label: "Verified", value: "verified" },
            { label: "Needs review", value: "needs-review" }
          ]
        },
        {
          name: "verifiedAt",
          type: "date",
          admin: {
            date: {
              displayFormat: "MMMM d, yyyy",
              pickerAppearance: "dayOnly"
            }
          }
        },
        {
          name: "notes",
          type: "textarea",
          maxLength: 500
        }
      ]
    },
    {
      name: "reports",
      type: "array",
      labels: {
        singular: "Impact report",
        plural: "Impact reports"
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          maxLength: 160
        },
        {
          name: "period",
          type: "text",
          required: true,
          maxLength: 80
        },
        {
          name: "externalUrl",
          type: "text",
          maxLength: 220
        }
      ]
    },
    featuredField,
    ...seoFields(),
    currentField,
    publishedField,
    sortOrderField
  ],
  timestamps: true
};
