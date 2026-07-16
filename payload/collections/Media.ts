import path from "node:path";

import type { CollectionConfig } from "payload";

import { anyone, editorOrAdmin as authenticated } from "../access";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    defaultColumns: ["filename", "alt", "updatedAt"],
    group: "Admin",
    useAsTitle: "alt"
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      maxLength: 180
    },
    {
      name: "caption",
      type: "textarea",
      maxLength: 300
    },
    {
      name: "credit",
      type: "text",
      maxLength: 140,
      admin: {
        description: "Photographer, artist, or rights holder credit."
      }
    },
    {
      name: "usage",
      type: "select",
      defaultValue: "editorial",
      options: [
        { label: "Editorial", value: "editorial" },
        { label: "Product", value: "product" },
        { label: "Artwork", value: "artwork" },
        { label: "Portrait", value: "portrait" },
        { label: "Process video", value: "process-video" },
        { label: "Impact", value: "impact" },
        { label: "Social sharing", value: "social" }
      ]
    },
    {
      name: "focalPoint",
      type: "group",
      admin: {
        description: "Optional image focal point for responsive crops."
      },
      fields: [
        {
          name: "x",
          type: "number",
          defaultValue: 50,
          min: 0,
          max: 100,
          label: "Horizontal position (%)"
        },
        {
          name: "y",
          type: "number",
          defaultValue: 50,
          min: 0,
          max: 100,
          label: "Vertical position (%)"
        }
      ]
    }
  ],
  upload: {
    mimeTypes: ["image/*", "video/*"],
    staticDir: path.resolve(process.cwd(), "public/media")
  }
};
