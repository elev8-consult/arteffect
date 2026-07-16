import type { CollectionConfig } from "payload";

import { editorOrAdmin as authenticated, publishedOrAuthenticated } from "../access";
import {
  featuredField,
  imageFields,
  nonNegativeNumber,
  publishedField,
  requireProductImageSource,
  seoFields,
  slugField,
  sortOrderField,
  validateProductVariants
} from "../fields";

export const productColorOptions = [
  { label: "Black", value: "black" },
  { label: "White", value: "white" },
  { label: "Off-white", value: "off-white" },
  { label: "Cream", value: "cream" },
  { label: "Beige", value: "beige" },
  { label: "Tan", value: "tan" },
  { label: "Brown", value: "brown" },
  { label: "Grey", value: "grey" },
  { label: "Green", value: "green" },
  { label: "Blue", value: "blue" },
  { label: "Purple", value: "purple" },
  { label: "Pink", value: "pink" },
  { label: "Red", value: "red" },
  { label: "Orange", value: "orange" },
  { label: "Yellow", value: "yellow" },
  { label: "Metallic", value: "metallic" },
  { label: "Multicolor", value: "multicolor" }
];

export const productSizeOptions = [
  { label: "One size", value: "one-size" },
  { label: "XXS", value: "xxs" },
  { label: "XS", value: "xs" },
  { label: "S", value: "s" },
  { label: "M", value: "m" },
  { label: "L", value: "l" },
  { label: "XL", value: "xl" },
  { label: "XXL", value: "xxl" },
  { label: "XXXL", value: "xxxl" }
];

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    defaultColumns: ["name", "form", "price", "totalInventory", "isPublished", "sortOrder"],
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
      maxLength: 120
    },
    {
      name: "form",
      type: "text",
      required: true,
      maxLength: 80
    },
    {
      name: "price",
      type: "text",
      required: true,
      maxLength: 40,
      admin: {
        description: "Display price, e.g. $120 or From $95."
      }
    },
    {
      name: "currency",
      type: "select",
      defaultValue: "USD",
      options: [
        { label: "USD", value: "USD" },
        { label: "LBP", value: "LBP" },
        { label: "EUR", value: "EUR" },
        { label: "GBP", value: "GBP" }
      ]
    },
    {
      name: "minPrice",
      type: "number",
      defaultValue: 0,
      min: 0,
      index: true,
      label: "Lowest variant price",
      admin: {
        description: "Calculated from variants and used by Shop filters and sorting.",
        position: "sidebar",
        readOnly: true
      }
    },
    {
      name: "maxPrice",
      type: "number",
      defaultValue: 0,
      min: 0,
      index: true,
      label: "Highest variant price",
      admin: {
        description: "Calculated from variants and used by Shop filters.",
        position: "sidebar",
        readOnly: true
      }
    },
    {
      name: "edition",
      type: "text",
      required: true,
      maxLength: 120
    },
    ...imageFields(),
    {
      name: "gallery",
      type: "array",
      label: "Product gallery",
      labels: {
        singular: "Gallery image",
        plural: "Gallery images"
      },
      admin: {
        description: "Optional detail and lifestyle images for the product page. The main image is shown first."
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          label: "Local image"
        },
        {
          name: "externalImageUrl",
          type: "text",
          label: "External image URL"
        },
        {
          name: "alt",
          type: "text",
          required: true,
          maxLength: 180,
          label: "Image alt text"
        }
      ]
    },
    {
      name: "story",
      type: "textarea",
      required: true,
      maxLength: 700
    },
    {
      name: "dimensions",
      type: "text",
      maxLength: 160,
      admin: {
        description: "Object dimensions or garment measurements shown on the product page."
      }
    },
    {
      name: "careInstructions",
      type: "textarea",
      maxLength: 700,
      label: "Care instructions"
    },
    {
      name: "shippingReturns",
      type: "textarea",
      maxLength: 700,
      label: "Shipping and returns"
    },
    {
      name: "drop",
      type: "relationship",
      relationTo: "drops",
      label: "Drop or batch",
      admin: {
        description: "Optional link to the batch this product belongs to."
      }
    },
    {
      name: "artist",
      type: "relationship",
      relationTo: "artists"
    },
    {
      name: "artwork",
      type: "relationship",
      relationTo: "artworks",
      label: "Design or artwork"
    },
    {
      name: "cause",
      type: "relationship",
      relationTo: "causes",
      label: "NGO or cause"
    },
    {
      name: "materials",
      type: "array",
      required: true,
      minRows: 1,
      labels: {
        singular: "Material",
        plural: "Materials"
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          maxLength: 80
        }
      ]
    },
    {
      name: "variants",
      type: "array",
      required: true,
      minRows: 1,
      labels: {
        singular: "Variant",
        plural: "Variants"
      },
      admin: {
        description: "Use variants for size, color, object type, or limited edition options."
      },
      validate: validateProductVariants,
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          maxLength: 120
        },
        {
          name: "sku",
          type: "text",
          required: true,
          maxLength: 80,
          admin: {
            description: "Unique stock keeping unit used by fulfillment."
          }
        },
        {
          name: "price",
          type: "number",
          required: true,
          min: 0,
          label: "Price amount"
        },
        {
          name: "compareAtPrice",
          type: "number",
          min: 0,
          label: "Compare-at price"
        },
        {
          name: "color",
          type: "select",
          index: true,
          label: "Color",
          options: productColorOptions
        },
        {
          name: "size",
          type: "select",
          index: true,
          label: "Size",
          options: productSizeOptions
        },
        {
          name: "inventory",
          type: "number",
          required: true,
          defaultValue: 0,
          min: 0,
          label: "Inventory on hand"
        },
        {
          name: "reserved",
          type: "number",
          required: true,
          defaultValue: 0,
          min: 0,
          label: "Reserved inventory"
        },
        {
          name: "lowStockThreshold",
          type: "number",
          defaultValue: 5,
          min: 0
        },
        {
          name: "attributes",
          type: "array",
          labels: {
            singular: "Attribute",
            plural: "Attributes"
          },
          fields: [
            {
              name: "name",
              type: "text",
              required: true,
              maxLength: 60
            },
            {
              name: "value",
              type: "text",
              required: true,
              maxLength: 100
            }
          ]
        },
        {
          name: "isAvailable",
          type: "checkbox",
          defaultValue: true,
          label: "Available to sell"
        }
      ]
    },
    {
      name: "colors",
      type: "select",
      hasMany: true,
      index: true,
      label: "Available colors",
      options: productColorOptions,
      admin: {
        description: "Calculated from variants and used by Shop filters.",
        readOnly: true
      }
    },
    {
      name: "sizes",
      type: "select",
      hasMany: true,
      index: true,
      label: "Available sizes",
      options: productSizeOptions,
      admin: {
        description: "Calculated from variants and used by Shop filters.",
        readOnly: true
      }
    },
    {
      name: "availability",
      type: "select",
      required: true,
      defaultValue: "out-of-stock",
      index: true,
      label: "Storefront availability",
      options: [
        { label: "In stock", value: "in-stock" },
        { label: "Low stock", value: "low-stock" },
        { label: "Out of stock", value: "out-of-stock" }
      ],
      admin: {
        description: "Calculated from sellable variant inventory.",
        position: "sidebar",
        readOnly: true
      }
    },
    {
      name: "searchKeywords",
      type: "text",
      maxLength: 500,
      label: "Shop search keywords",
      admin: {
        description: "Optional synonyms or terms shoppers may use. Do not repeat the product name."
      }
    },
    {
      name: "totalInventory",
      type: "number",
      defaultValue: 0,
      min: 0,
      admin: {
        description: "Admin-facing rollup for quick filtering until inventory sync is automated.",
        position: "sidebar"
      }
    },
    {
      name: "shippingProfile",
      type: "select",
      defaultValue: "standard",
      options: [
        { label: "Standard object", value: "standard" },
        { label: "Fragile object", value: "fragile" },
        { label: "Textile", value: "textile" },
        { label: "Digital or certificate only", value: "digital" }
      ],
      admin: {
        position: "sidebar"
      }
    },
    {
      name: "upsells",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      maxRows: 6,
      label: "Cart upsells",
      admin: {
        description: "Optional complementary products shown in the cart. Unavailable products are filtered at request time."
      }
    },
    featuredField,
    ...seoFields(),
    publishedField,
    sortOrderField
  ],
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => requireProductImageSource(data, originalDoc)
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        const variants = Array.isArray(data.variants)
          ? data.variants
          : Array.isArray(originalDoc?.variants)
            ? originalDoc.variants
            : [];

        if (!variants.length) {
          return data;
        }

        const prices = [];
        const colorValues = new Set();
        const sizeValues = new Set();
        let inventory = 0;
        let hasHealthyStock = false;

        for (const variant of variants) {
          const price = Number(variant?.price);
          if (Number.isFinite(price) && price >= 0) prices.push(price);
          if (typeof variant?.color === "string" && variant.color) colorValues.add(variant.color);
          if (typeof variant?.size === "string" && variant.size) sizeValues.add(variant.size);
          if (variant?.isAvailable === false) continue;

          const sellable = Math.max(
            0,
            nonNegativeNumber(variant?.inventory) - nonNegativeNumber(variant?.reserved)
          );
          inventory += sellable;
          if (sellable > nonNegativeNumber(variant?.lowStockThreshold)) hasHealthyStock = true;
        }

        return {
          ...data,
          availability: inventory === 0 ? "out-of-stock" : hasHealthyStock ? "in-stock" : "low-stock",
          colors: [...colorValues],
          maxPrice: prices.length ? Math.max(...prices) : 0,
          minPrice: prices.length ? Math.min(...prices) : 0,
          sizes: [...sizeValues],
          totalInventory: inventory
        };
      }
    ]
  },
  timestamps: true
};
