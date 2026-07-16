import type { ShopProduct } from "@/types/shop";

export type ArtistImage = {
  alt: string;
  caption?: string;
  src: string;
};

export type ArtistFact = {
  label: string;
  value: string;
};

export type ArtistWork = {
  image?: ArtistImage;
  medium?: string;
  title: string;
  year?: string;
};

export type ArtistDrop = {
  eyebrow: string;
  image?: ArtistImage;
  slug: string;
  summary: string;
  title: string;
};

export type ArtistDirectoryItem = {
  image?: ArtistImage;
  location?: string;
  name: string;
  role: string;
  slug: string;
};

export type ArtistProfile = ArtistDirectoryItem & {
  bio: string;
  drops: ArtistDrop[];
  facts: ArtistFact[];
  instagram?: string;
  portraitGallery: ArtistImage[];
  processVideo?: {
    caption?: string;
    poster?: ArtistImage;
    src: string;
  };
  products: ShopProduct[];
  quote: string;
  representativeWorks: ArtistWork[];
  seo: {
    metaDescription?: string;
    metaTitle?: string;
    openGraphImage?: string;
  };
  website?: string;
};
