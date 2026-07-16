import type { ProductAvailability, ProductQuery, ProductSort } from "@/types/shop";

export const PRODUCT_COLORS = [
  "black",
  "white",
  "off-white",
  "cream",
  "beige",
  "tan",
  "brown",
  "grey",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
  "orange",
  "yellow",
  "metallic",
  "multicolor"
] as const;

export const PRODUCT_SIZES = [
  "one-size",
  "xxs",
  "xs",
  "s",
  "m",
  "l",
  "xl",
  "xxl",
  "xxxl"
] as const;

export const PRODUCT_AVAILABILITY = ["in-stock", "low-stock", "out-of-stock"] as const;
export const PRODUCT_SORTS = [
  "featured",
  "newest",
  "name-asc",
  "name-desc",
  "price-asc",
  "price-desc"
] as const;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class ProductQueryError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super("Invalid product query.");
    this.name = "ProductQueryError";
    this.issues = issues;
  }
}

export function parseProductQuery(searchParams: URLSearchParams): ProductQuery {
  const issues: string[] = [];
  const page = integerParam(searchParams.get("page"), "page", 1, 10_000, 1, issues);
  const limit = integerParam(searchParams.get("limit"), "limit", 1, 48, 12, issues);
  const minPrice = priceParam(searchParams.get("minPrice") ?? searchParams.get("priceMin"), "minPrice", issues);
  const maxPrice = priceParam(searchParams.get("maxPrice") ?? searchParams.get("priceMax"), "maxPrice", issues);
  const search = cleanSearch(searchParams.get("search") ?? searchParams.get("q"), issues);
  const artist = cleanSlug(searchParams.get("artist"), "artist", issues);
  const cause = cleanSlug(searchParams.get("cause"), "cause", issues);
  const drop = cleanSlug(searchParams.get("drop"), "drop", issues);
  const colors = listParam(searchParams, ["color", "colors"], PRODUCT_COLORS, "color", issues);
  const sizes = listParam(searchParams, ["size", "sizes"], PRODUCT_SIZES, "size", issues);
  const availability = availabilityParam(searchParams, issues);
  const requestedSort = searchParams.get("sort") ?? "featured";
  const sort = PRODUCT_SORTS.includes(requestedSort as ProductSort)
    ? (requestedSort as ProductSort)
    : "featured";

  if (!PRODUCT_SORTS.includes(requestedSort as ProductSort)) {
    issues.push(`sort must be one of: ${PRODUCT_SORTS.join(", ")}.`);
  }

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    issues.push("minPrice cannot be greater than maxPrice.");
  }

  if (issues.length) {
    throw new ProductQueryError(issues);
  }

  return {
    artist,
    availability,
    ...(cause ? { cause } : {}),
    colors,
    drop,
    limit,
    maxPrice,
    minPrice,
    page,
    search,
    sizes,
    sort
  };
}

export function productWhere(query: ProductQuery): Record<string, unknown> {
  const and: Record<string, unknown>[] = [{ isPublished: { equals: true } }];

  if (query.search) {
    and.push({
      or: ["name", "form", "story", "edition", "searchKeywords"].map((field) => ({
        [field]: { contains: query.search }
      }))
    });
  }

  if (query.colors.length) and.push({ colors: { in: query.colors } });
  if (query.sizes.length) and.push({ sizes: { in: query.sizes } });
  if (query.availability.length) and.push({ availability: { in: query.availability } });
  if (query.artist) and.push({ "artist.slug": { equals: query.artist } });
  if (query.cause) and.push({ "cause.slug": { equals: query.cause } });
  if (query.drop) and.push({ "drop.slug": { equals: query.drop } });
  if (query.minPrice !== undefined) and.push({ maxPrice: { greater_than_equal: query.minPrice } });
  if (query.maxPrice !== undefined) and.push({ minPrice: { less_than_equal: query.maxPrice } });

  return { and };
}

export function productSort(sort: ProductSort): string[] {
  switch (sort) {
    case "newest":
      return ["-createdAt"];
    case "name-asc":
      return ["name"];
    case "name-desc":
      return ["-name"];
    case "price-asc":
      return ["minPrice", "sortOrder"];
    case "price-desc":
      return ["-minPrice", "sortOrder"];
    default:
      return ["-isFeatured", "sortOrder", "name"];
  }
}

function availabilityParam(searchParams: URLSearchParams, issues: string[]): ProductAvailability[] {
  const values = rawList(searchParams, ["availability"]);
  const expanded = values.flatMap((value) => {
    if (value === "available") return ["in-stock", "low-stock"];
    if (value === "unavailable") return ["out-of-stock"];
    return [value];
  });
  const invalid = expanded.filter(
    (value) => !PRODUCT_AVAILABILITY.includes(value as ProductAvailability)
  );

  if (invalid.length) {
    issues.push(`availability contains unsupported values: ${[...new Set(invalid)].join(", ")}.`);
  }

  return [...new Set(expanded.filter((value) => PRODUCT_AVAILABILITY.includes(value as ProductAvailability)))] as ProductAvailability[];
}

function cleanSearch(value: string | null, issues: string[]) {
  if (!value) return undefined;

  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return undefined;
  if (cleaned.length > 100) {
    issues.push("search must be 100 characters or fewer.");
    return undefined;
  }

  return cleaned;
}

function cleanSlug(value: string | null, name: string, issues: string[]) {
  if (!value) return undefined;

  const cleaned = value.trim().toLowerCase();
  if (!slugPattern.test(cleaned) || cleaned.length > 100) {
    issues.push(`${name} must be a lowercase slug.`);
    return undefined;
  }

  return cleaned;
}

function integerParam(
  value: string | null,
  name: string,
  min: number,
  max: number,
  fallback: number,
  issues: string[]
) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) {
    issues.push(`${name} must be an integer between ${min} and ${max}.`);
    return fallback;
  }

  const parsed = Number(value);
  if (parsed < min || parsed > max) {
    issues.push(`${name} must be between ${min} and ${max}.`);
    return fallback;
  }

  return parsed;
}

function priceParam(value: string | null, name: string, issues: string[]) {
  if (value === null || value === "") return undefined;
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
    issues.push(`${name} must be a non-negative amount with at most two decimal places.`);
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed > 10_000_000) {
    issues.push(`${name} is outside the supported range.`);
    return undefined;
  }

  return parsed;
}

function listParam<T extends string>(
  searchParams: URLSearchParams,
  names: string[],
  allowed: readonly T[],
  label: string,
  issues: string[]
): T[] {
  const values = rawList(searchParams, names);
  const invalid = values.filter((value) => !allowed.includes(value as T));

  if (invalid.length) {
    issues.push(`${label} contains unsupported values: ${[...new Set(invalid)].join(", ")}.`);
  }

  return [...new Set(values.filter((value) => allowed.includes(value as T)))] as T[];
}

function rawList(searchParams: URLSearchParams, names: string[]) {
  return names
    .flatMap((name) => searchParams.getAll(name))
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}
