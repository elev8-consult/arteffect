import type { CollectionConfig } from "payload";

import { editorOrAdmin as authenticated, publishedOrAuthenticated } from "../access";
import { ctaFields, currentField, imageFields, publishedField, sortOrderField } from "../fields";

export const HomepageSections: CollectionConfig = {
  slug: "homepage-sections",
  admin: {
    defaultColumns: ["title", "section", "isCurrent", "isPublished", "sortOrder"],
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
    {
      name: "section",
      type: "select",
      required: true,
      options: [
        { label: "Hero", value: "hero" },
        { label: "Products", value: "products" },
        { label: "Current drop or batch", value: "drop" },
        { label: "Design or artwork", value: "design" },
        { label: "Artist", value: "artist" },
        { label: "NGO or cause", value: "cause" },
        { label: "Impact", value: "impact" },
        { label: "Journal", value: "journal" },
        { label: "Testimonials", value: "testimonials" },
        { label: "FAQ", value: "faq" },
        { label: "Newsletter", value: "newsletter" }
      ]
    },
    {
      name: "layout",
      type: "select",
      required: true,
      defaultValue: "editorial",
      options: [
        { label: "Editorial", value: "editorial" },
        { label: "Immersive image", value: "immersive-image" },
        { label: "Split story", value: "split-story" },
        { label: "Metric band", value: "metric-band" },
        { label: "Product rail", value: "product-rail" },
        { label: "Question list", value: "question-list" }
      ]
    },
    {
      name: "title",
      type: "text",
      required: true,
      maxLength: 160
    },
    {
      name: "eyebrow",
      type: "text",
      maxLength: 80
    },
    {
      name: "summary",
      type: "textarea",
      maxLength: 900
    },
    ...imageFields(),
    {
      name: "signatureInteraction",
      type: "select",
      defaultValue: "image-reveal",
      options: [
        { label: "Image reveal", value: "image-reveal" },
        { label: "Parallax frame", value: "parallax-frame" },
        { label: "Hotspots", value: "hotspots" },
        { label: "Animated counter", value: "animated-counter" },
        { label: "Horizontal rail", value: "horizontal-rail" },
        { label: "Accordion", value: "accordion" },
        { label: "None", value: "none" }
      ]
    },
    {
      name: "cta",
      type: "group",
      label: "Call to action",
      fields: ctaFields()
    },
    {
      name: "featuredProducts",
      type: "relationship",
      relationTo: "products",
      hasMany: true
    },
    {
      name: "featuredDrop",
      type: "relationship",
      relationTo: "drops",
      label: "Featured drop or batch"
    },
    {
      name: "featuredArtist",
      type: "relationship",
      relationTo: "artists"
    },
    {
      name: "featuredArtwork",
      type: "relationship",
      relationTo: "artworks",
      label: "Featured design or artwork"
    },
    {
      name: "featuredCause",
      type: "relationship",
      relationTo: "causes",
      label: "Featured NGO or cause"
    },
    {
      name: "featuredStats",
      type: "relationship",
      relationTo: "impact-stats",
      hasMany: true
    },
    {
      name: "supportingItems",
      type: "array",
      labels: {
        singular: "Supporting item",
        plural: "Supporting items"
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          maxLength: 100
        },
        {
          name: "value",
          type: "text",
          maxLength: 160
        },
        {
          name: "description",
          type: "textarea",
          maxLength: 400
        }
      ]
    },
    currentField,
    publishedField,
    sortOrderField
  ],
  timestamps: true
};
