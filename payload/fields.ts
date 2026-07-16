import type { Field, TextFieldSingleValidation } from "payload";

export function nonNegativeNumber(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function validateProductVariants(value: unknown): true | string {
  if (!Array.isArray(value) || value.length === 0) return "Add at least one product variant.";

  const skus = new Set<string>();
  for (const item of value) {
    const variant = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const rawSku = typeof variant.sku === "string" ? variant.sku.trim() : "";
    const sku = rawSku.toLocaleLowerCase();
    if (!sku) continue;
    if (skus.has(sku)) return `Variant SKU "${rawSku}" is duplicated.`;
    skus.add(sku);

    const label = String(variant.name || rawSku);
    const inventory = nonNegativeNumber(variant.inventory);
    const reserved = nonNegativeNumber(variant.reserved);
    if (reserved > inventory) return `Reserved inventory cannot exceed inventory for ${label}.`;

    const price = nonNegativeNumber(variant.price);
    if (typeof variant.compareAtPrice === "number" && variant.compareAtPrice < price) {
      return `Compare-at price cannot be lower than price for ${label}.`;
    }
  }

  return true;
}

export const validateImageSource: TextFieldSingleValidation = (value, { siblingData }) => {
  const localImage = (siblingData as { image?: unknown } | undefined)?.image;
  return Boolean(localImage || (typeof value === "string" && value.trim())) ||
    "Add a local image or an external image URL.";
};

export function requireProductImageSource(
  data: Record<string, unknown> | undefined,
  originalDoc: Record<string, unknown> | undefined
) {
  const image = data && "image" in data ? data.image : originalDoc?.image;
  const externalImageUrl = data && "externalImageUrl" in data
    ? data.externalImageUrl
    : originalDoc?.externalImageUrl;

  if (image || (typeof externalImageUrl === "string" && externalImageUrl.trim())) return data;
  throw new Error("Add a local image or an external image URL before saving a product.");
}

export const publishedField: Field = {
  name: "isPublished",
  type: "checkbox",
  defaultValue: true,
  label: "Published",
  admin: {
    position: "sidebar"
  }
};

export const currentField: Field = {
  name: "isCurrent",
  type: "checkbox",
  defaultValue: false,
  label: "Use on homepage",
  admin: {
    description: "The homepage reads the first published record marked current.",
    position: "sidebar"
  }
};

export const sortOrderField: Field = {
  name: "sortOrder",
  type: "number",
  defaultValue: 0,
  label: "Sort order",
  admin: {
    description: "Lower numbers appear first.",
    position: "sidebar"
  }
};

export const featuredField: Field = {
  name: "isFeatured",
  type: "checkbox",
  defaultValue: false,
  label: "Featured",
  admin: {
    description: "Promote this entry in curated modules.",
    position: "sidebar"
  }
};

export const slugField: Field = {
  name: "slug",
  type: "text",
  required: true,
  unique: true,
  index: true,
  maxLength: 120,
  label: "Slug",
  admin: {
    description: "Lowercase letters, numbers, and hyphens only."
  },
  hooks: {
    beforeValidate: [
      ({ siblingData, value }) => {
        const source = typeof value === "string" && value.trim()
          ? value
          : String(siblingData?.name ?? siblingData?.title ?? "");
        return slugify(source);
      }
    ]
  },
  validate: (value: null | string | string[] | undefined) => {
    if (
      typeof value !== "string" ||
      value.length > 120 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    ) {
      return "Use lowercase letters, numbers, and hyphens.";
    }

    return true;
  }
};

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export const imageFields = ({ requireSource = false }: { requireSource?: boolean } = {}): Field[] => [
  {
    name: "image",
    type: "upload",
    relationTo: "media",
    label: "Local image"
  },
  {
    name: "externalImageUrl",
    type: "text",
    label: "External image URL",
    validate: requireSource ? validateImageSource : undefined,
    admin: {
      description:
        requireSource
          ? "Required when no local image is uploaded. Prefer local media uploads for production content."
          : "Optional fallback for migrated fixture images. Prefer local media uploads for production content."
    }
  },
  {
    name: "imageAlt",
    type: "text",
    required: true,
    maxLength: 180,
    label: "Image alt text"
  }
];

export const progressField = (name = "progress"): Field => ({
  name,
  type: "number",
  required: true,
  min: 0,
  max: 100
});

export const ctaFields = (): Field[] => [
  {
    name: "label",
    type: "text",
    maxLength: 80
  },
  {
    name: "href",
    type: "text",
    maxLength: 220
  },
  {
    name: "style",
    type: "select",
    defaultValue: "primary",
    options: [
      { label: "Primary", value: "primary" },
      { label: "Secondary", value: "secondary" },
      { label: "Text link", value: "text" }
    ]
  }
];

export const seoFields = (): Field[] => [
  {
    name: "seo",
    type: "group",
    label: "SEO and sharing",
    fields: [
      {
        name: "metaTitle",
        type: "text",
        maxLength: 70,
        admin: {
          description: "Optional override for browser and search result titles."
        }
      },
      {
        name: "metaDescription",
        type: "textarea",
        maxLength: 180,
        admin: {
          description: "Optional search description. Keep it concise."
        }
      },
      {
        name: "openGraphImage",
        type: "upload",
        relationTo: "media",
        label: "OpenGraph image"
      }
    ]
  }
];
