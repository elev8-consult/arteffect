import type { CollectionConfig } from "payload";

import { editorOrAdmin as authenticated, publishedOrAuthenticated } from "../access";
import {
  currentField,
  imageFields,
  publishedField,
  slugField,
  sortOrderField
} from "../fields";

export const Artworks: CollectionConfig = {
  slug: "artworks",
  admin: {
    defaultColumns: ["title", "artistLine", "isCurrent", "isPublished", "updatedAt"],
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
      name: "title",
      type: "text",
      required: true,
      maxLength: 160
    },
    {
      name: "artistLine",
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
    ...imageFields(),
    {
      name: "details",
      type: "array",
      required: true,
      minRows: 1,
      labels: {
        singular: "Detail hotspot",
        plural: "Detail hotspots"
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          maxLength: 8
        },
        {
          name: "title",
          type: "text",
          required: true,
          maxLength: 120
        },
        {
          name: "body",
          type: "textarea",
          required: true,
          maxLength: 500
        },
        {
          name: "x",
          type: "number",
          required: true,
          min: 0,
          max: 100,
          label: "Horizontal position (%)"
        },
        {
          name: "y",
          type: "number",
          required: true,
          min: 0,
          max: 100,
          label: "Vertical position (%)"
        }
      ]
    },
    currentField,
    publishedField,
    sortOrderField
  ],
  timestamps: true
};
