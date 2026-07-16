import type { CollectionConfig } from "payload";

import { editorOrAdmin as authenticated, publishedOrAuthenticated } from "../access";
import {
  currentField,
  featuredField,
  imageFields,
  publishedField,
  seoFields,
  slugField,
  sortOrderField
} from "../fields";

export const Artists: CollectionConfig = {
  slug: "artists",
  admin: {
    defaultColumns: ["name", "role", "isCurrent", "isPublished", "updatedAt"],
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
      name: "role",
      type: "text",
      required: true,
      maxLength: 140
    },
    {
      name: "quote",
      type: "textarea",
      required: true,
      maxLength: 500
    },
    {
      name: "bio",
      type: "textarea",
      required: true,
      maxLength: 900
    },
    {
      name: "location",
      type: "text",
      maxLength: 120
    },
    {
      name: "website",
      type: "text",
      maxLength: 220
    },
    {
      name: "instagram",
      type: "text",
      maxLength: 120,
      admin: {
        description: "Handle or profile URL."
      }
    },
    ...imageFields(),
    {
      name: "processVideo",
      type: "upload",
      relationTo: "media",
      label: "Process video",
      admin: {
        description: "A short, silent studio or making-of film. Upload MP4/WebM to local media."
      }
    },
    {
      name: "processVideoUrl",
      type: "text",
      maxLength: 500,
      label: "External process video URL",
      admin: {
        description: "Optional hosted-video fallback. A local process video takes precedence."
      }
    },
    {
      name: "processVideoPoster",
      type: "upload",
      relationTo: "media",
      label: "Process video poster image"
    },
    {
      name: "processVideoCaption",
      type: "textarea",
      maxLength: 300,
      label: "Process video caption"
    },
    {
      name: "portraitGallery",
      type: "array",
      labels: {
        singular: "Portrait or studio image",
        plural: "Portrait and studio images"
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
      name: "facts",
      type: "array",
      required: true,
      minRows: 1,
      labels: {
        singular: "Fact",
        plural: "Facts"
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          maxLength: 80
        },
        {
          name: "value",
          type: "text",
          required: true,
          maxLength: 160
        }
      ]
    },
    {
      name: "representativeWorks",
      type: "array",
      labels: {
        singular: "Representative work",
        plural: "Representative works"
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          maxLength: 140
        },
        {
          name: "year",
          type: "text",
          maxLength: 20
        },
        {
          name: "medium",
          type: "text",
          maxLength: 120
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media"
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
