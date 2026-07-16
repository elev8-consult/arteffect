import type { CollectionConfig } from "payload";

import { addressFields } from "../commerceFields";
import { authenticated, editorOrAdmin, firstUserOrAuthenticated } from "../access";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    cookies: {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production"
    },
    lockTime: 15 * 60 * 1000,
    maxLoginAttempts: 5,
    tokenExpiration: 2 * 60 * 60
  },
  admin: {
    defaultColumns: ["email", "name", "updatedAt"],
    group: "Admin",
    useAsTitle: "email"
  },
  access: {
    admin: editorOrAdmin,
    create: firstUserOrAuthenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated
  },
  fields: [
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "customer",
      index: true,
      options: [
        { label: "Administrator", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Customer", value: "customer" }
      ],
      access: {
        create: ({ req: { user } }) => !user || user.role === "admin",
        read: ({ req: { user } }) => user?.role === "admin",
        update: ({ req: { user } }) => user?.role === "admin"
      },
      admin: {
        position: "sidebar"
      }
    },
    {
      name: "name",
      type: "text",
      maxLength: 120
    },
    {
      name: "wishlist",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      label: "Wishlist",
      admin: {
        description: "Products saved by this account. Storefront APIs only expose the signed-in user's list."
      }
    },
    {
      name: "addresses",
      type: "array",
      maxRows: 10,
      labels: {
        singular: "Saved address",
        plural: "Saved addresses"
      },
      admin: {
        description: "Shipping and billing addresses saved by this account."
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          maxLength: 40
        },
        {
          name: "isDefault",
          type: "checkbox",
          defaultValue: false,
          label: "Default address"
        },
        ...addressFields()
      ]
    }
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== "create" || req.user) return data;

        const { totalDocs } = await req.payload.count({ collection: "users" });
        return totalDocs === 0 ? { ...data, role: "admin" } : data;
      }
    ]
  },
  timestamps: true
};
