import type { CollectionConfig } from "payload";

import { authenticated, noOne } from "../access";

export const Newsletter: CollectionConfig = {
  slug: "newsletter",
  admin: {
    defaultColumns: ["email", "status", "source", "createdAt"],
    group: "Marketing",
    useAsTitle: "email"
  },
  access: {
    create: noOne,
    delete: authenticated,
    read: authenticated,
    update: authenticated
  },
  fields: [
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
      index: true
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "subscribed",
      options: [
        { label: "Subscribed", value: "subscribed" },
        { label: "Unsubscribed", value: "unsubscribed" },
        { label: "Pending confirmation", value: "pending" },
        { label: "Bounced", value: "bounced" }
      ]
    },
    {
      name: "firstName",
      type: "text",
      maxLength: 80
    },
    {
      name: "source",
      type: "select",
      defaultValue: "homepage",
      options: [
        { label: "Homepage", value: "homepage" },
        { label: "Product page", value: "product-page" },
        { label: "Drop page", value: "drop-page" },
        { label: "Journal", value: "journal" },
        { label: "Admin import", value: "admin-import" },
        { label: "Other", value: "other" }
      ]
    },
    {
      name: "interests",
      type: "array",
      labels: {
        singular: "Interest",
        plural: "Interests"
      },
      fields: [
        {
          name: "topic",
          type: "select",
          required: true,
          options: [
            { label: "Drops", value: "drops" },
            { label: "Artists", value: "artists" },
            { label: "Impact updates", value: "impact" },
            { label: "Journal", value: "journal" }
          ]
        }
      ]
    },
    {
      name: "consent",
      type: "group",
      fields: [
        {
          name: "acceptedMarketing",
          type: "checkbox",
          required: true,
          defaultValue: false,
          label: "Accepted marketing emails"
        },
        {
          name: "acceptedAt",
          type: "date",
          admin: {
            date: {
              displayFormat: "MMMM d, yyyy",
              pickerAppearance: "dayAndTime"
            }
          }
        },
        {
          name: "ipAddress",
          type: "text",
          maxLength: 80,
          admin: {
            readOnly: true
          }
        }
      ]
    },
    {
      name: "notes",
      type: "textarea",
      maxLength: 500,
      admin: {
        description: "Private admin notes."
      }
    }
  ],
  timestamps: true
};
