import type { GlobalConfig } from "payload";

import { anyone, editorOrAdmin as authenticated } from "../access";
import { seoFields } from "../fields";

export const Contact: GlobalConfig = {
  slug: "contact",
  admin: {
    group: "Content",
    description: "Contact page copy, public details, and enquiry routing options."
  },
  access: {
    read: anyone,
    update: authenticated
  },
  fields: [
    { name: "eyebrow", type: "text", required: true, maxLength: 80 },
    { name: "title", type: "text", required: true, maxLength: 180 },
    { name: "introduction", type: "textarea", required: true, maxLength: 600 },
    {
      name: "details",
      type: "group",
      fields: [
        { name: "email", type: "email", required: true },
        { name: "phone", type: "text", maxLength: 40 },
        { name: "address", type: "textarea", maxLength: 300 },
        { name: "hours", type: "textarea", maxLength: 300 }
      ]
    },
    {
      name: "topics",
      type: "array",
      maxRows: 12,
      fields: [
        { name: "label", type: "text", required: true, maxLength: 80 },
        {
          name: "value",
          type: "text",
          required: true,
          maxLength: 40,
          validate: (value: null | string | string[] | undefined) =>
            typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
              ? true
              : "Use lowercase letters, numbers, and hyphens."
        }
      ]
    },
    {
      name: "responseNote",
      type: "textarea",
      maxLength: 300,
      admin: { description: "Shown beside the enquiry form." }
    },
    ...seoFields()
  ]
};
