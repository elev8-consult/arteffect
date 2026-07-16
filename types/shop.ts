export type ProductAvailability = "in-stock" | "low-stock" | "out-of-stock";

export type ProductSort =
  | "featured"
  | "newest"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc";

export type ShopRelationship = {
  id: number | string;
  name: string;
  slug: string;
};

export type ShopVariant = {
  availableInventory: number;
  color?: string;
  compareAtPrice?: number;
  id: string;
  isAvailable: boolean;
  name: string;
  price: number;
  size?: string;
  sku: string;
};

export type ShopProductImage = {
  alt: string;
  src: string;
};

export type ShopReview = {
  id: number | string;
  name: string;
  quote: string;
  rating?: number;
  role?: string;
};

export type ShopProduct = {
  artist?: ShopRelationship;
  artwork?: ShopRelationship;
  availability: ProductAvailability;
  cause?: ShopRelationship;
  colors: string[];
  careInstructions: string;
  currency: string;
  dimensions: string;
  displayPrice: string;
  drop?: ShopRelationship;
  edition: string;
  form: string;
  gallery: ShopProductImage[];
  id: number | string;
  image: string;
  imageAlt: string;
  isFeatured: boolean;
  materials: string[];
  maxPrice: number;
  minPrice: number;
  name: string;
  sizes: string[];
  slug: string;
  story: string;
  shippingReturns: string;
  variants: ShopVariant[];
};

export type ProductQuery = {
  artist?: string;
  availability: ProductAvailability[];
  cause?: string;
  colors: string[];
  drop?: string;
  limit: number;
  maxPrice?: number;
  minPrice?: number;
  page: number;
  search?: string;
  sizes: string[];
  sort: ProductSort;
};

export type ShopPagination = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type ProductListResult = {
  docs: ShopProduct[];
  pagination: ShopPagination;
};
