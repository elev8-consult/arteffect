import type { Artist, Artwork, Cause, DropMilestone } from "@/types/showcase";
import type { ShopProduct } from "@/types/shop";

export type DropStatus = "draft" | "preview" | "live" | "sold-out" | "closed";

export type DropGalleryImage = {
  alt: string;
  caption?: string;
  src: string;
};

export type DropAllocation = {
  description?: string;
  label: string;
  percentage: number;
};

export type DropCta = {
  href: string;
  label: string;
  style: "primary" | "secondary" | "text";
};

export type DropShowcase = {
  allocation: DropAllocation[];
  artist: Artist;
  artwork: Artwork;
  artworks: Artwork[];
  batchSize: number;
  cause: Cause;
  closesAt?: string;
  cta: DropCta;
  eyebrow: string;
  gallery: DropGalleryImage[];
  id: number | string;
  image: string;
  imageAlt: string;
  milestones: DropMilestone[];
  opensAt?: string;
  products: ShopProduct[];
  reserved: number;
  seo: {
    metaDescription?: string;
    metaTitle?: string;
    openGraphImage?: string;
  };
  slug: string;
  status: DropStatus;
  summary: string;
  title: string;
};
