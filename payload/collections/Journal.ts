import type { CollectionConfig } from "payload";

import { editorOrAdmin as authenticated, publishedOrAuthenticated } from "../access";
import {
  featuredField,
  imageFields,
  publishedField,
  seoFields,
  slugField,
  sortOrderField
} from "../fields";

export const Journal: CollectionConfig = {
  slug: "journal",
  admin: {
    defaultColumns: ["title", "category", "publishedAt", "isPublished", "updatedAt"],
    group: "Content",
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
      name: "category",
      type: "select",
      required: true,
      defaultValue: "studio",
      options: [
        { label: "Studio", value: "studio" },
        { label: "Drop notes", value: "drop-notes" },
        { label: "Artist story", value: "artist-story" },
        { label: "Impact report", value: "impact-report" },
        { label: "Field note", value: "field-note" }
      ]
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
      maxLength: 280
    },
    ...imageFields(),
    {
      name: "content",
      type: "richText",
      required: true
    },
    {
      name: "authorName",
      type: "text",
      required: true,
      defaultValue: "ArtEffect",
      maxLength: 120
    },
    {
      name: "publishedAt",
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
      name: "readTime",
      type: "number",
      min: 1,
      label: "Read time in minutes"
    },
    {
      name: "tags",
      type: "array",
      labels: {
        singular: "Tag",
        plural: "Tags"
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          maxLength: 60
        }
      ]
    },
    {
      name: "relatedDrop",
      type: "relationship",
      relationTo: "drops",
      label: "Related drop or batch"
    },
    {
      name: "relatedArtist",
      type: "relationship",
      relationTo: "artists"
    },
    {
      name: "relatedCause",
      type: "relationship",
      relationTo: "causes",
      label: "Related NGO or cause"
    },
    featuredField,
    ...seoFields(),
    publishedField,
    sortOrderField
  ],
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        if (data?.isPublished === true && !data.publishedAt && !originalDoc?.publishedAt) {
          return { ...data, publishedAt: new Date().toISOString() };
        }
        return data;
      }
    ]
  },
  timestamps: true
};
