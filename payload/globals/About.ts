import type { GlobalConfig } from "payload";

import { anyone, editorOrAdmin as authenticated } from "../access";
import { ctaFields, imageFields, seoFields } from "../fields";

export const About: GlobalConfig = {
  slug: "about",
  admin: {
    group: "Content",
    description: "The public brand story, mission, values, and founder narrative."
  },
  access: {
    read: anyone,
    update: authenticated
  },
  fields: [
    {
      name: "hero",
      type: "group",
      fields: [
        { name: "eyebrow", type: "text", required: true, maxLength: 80 },
        { name: "title", type: "text", required: true, maxLength: 180 },
        { name: "introduction", type: "textarea", required: true, maxLength: 600 },
        ...imageFields()
      ]
    },
    {
      name: "story",
      type: "group",
      fields: [
        { name: "heading", type: "text", required: true, maxLength: 160 },
        { name: "body", type: "richText", required: true },
        ...imageFields()
      ]
    },
    {
      name: "mission",
      type: "group",
      fields: [
        { name: "eyebrow", type: "text", maxLength: 80 },
        { name: "heading", type: "text", required: true, maxLength: 160 },
        { name: "body", type: "richText", required: true },
        {
          name: "cta",
          type: "group",
          fields: ctaFields()
        }
      ]
    },
    {
      name: "values",
      type: "array",
      required: true,
      minRows: 3,
      maxRows: 8,
      fields: [
        { name: "title", type: "text", required: true, maxLength: 100 },
        { name: "description", type: "textarea", required: true, maxLength: 500 }
      ]
    },
    {
      name: "founder",
      type: "group",
      fields: [
        { name: "name", type: "text", required: true, maxLength: 120 },
        { name: "role", type: "text", required: true, maxLength: 120 },
        { name: "quote", type: "textarea", maxLength: 500 },
        { name: "story", type: "richText", required: true },
        ...imageFields()
      ]
    },
    {
      name: "milestones",
      type: "array",
      maxRows: 12,
      fields: [
        { name: "year", type: "text", required: true, maxLength: 20 },
        { name: "title", type: "text", required: true, maxLength: 120 },
        { name: "description", type: "textarea", required: true, maxLength: 360 }
      ]
    },
    ...seoFields()
  ]
};
