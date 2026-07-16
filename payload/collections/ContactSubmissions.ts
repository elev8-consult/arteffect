import type { CollectionConfig } from "payload";

import { authenticated, noOne } from "../access";

export const ContactSubmissions: CollectionConfig = {
  slug: "contact-submissions",
  admin: {
    defaultColumns: ["name", "email", "topic", "status", "createdAt"],
    group: "Inbox",
    useAsTitle: "email"
  },
  access: {
    create: noOne,
    delete: authenticated,
    read: authenticated,
    update: authenticated
  },
  fields: [
    { name: "name", type: "text", required: true, maxLength: 120 },
    { name: "email", type: "email", required: true, index: true },
    { name: "phone", type: "text", maxLength: 40 },
    { name: "topic", type: "text", required: true, maxLength: 40, index: true },
    { name: "orderNumber", type: "text", maxLength: 40 },
    { name: "message", type: "textarea", required: true, minLength: 10, maxLength: 5000 },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      index: true,
      options: [
        { label: "New", value: "new" },
        { label: "In progress", value: "in-progress" },
        { label: "Resolved", value: "resolved" },
        { label: "Spam", value: "spam" }
      ]
    },
    {
      name: "consentToReply",
      type: "checkbox",
      required: true,
      defaultValue: false,
      label: "Consent to receive a reply"
    },
    {
      name: "requestFingerprint",
      type: "text",
      hidden: true,
      index: true,
      access: { read: () => false, update: () => false }
    },
    { name: "resolvedAt", type: "date" },
    { name: "notes", type: "textarea", maxLength: 2000, admin: { description: "Private staff notes." } }
  ],
  timestamps: true
};
