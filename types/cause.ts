import type { ShopProduct } from "@/types/shop";

export type CauseImage = {
  alt: string;
  caption?: string;
  src: string;
};

export type CauseMetric = {
  label: string;
  progress: number;
  value: string;
};

export type CauseProgram = {
  allocation?: string;
  description: string;
  name: string;
};

export type CauseDrop = {
  donationPercentage?: number;
  gallery: CauseImage[];
  image?: CauseImage;
  eyebrow: string;
  slug: string;
  summary: string;
  title: string;
};

export type CauseDirectoryItem = {
  focus: string;
  image?: CauseImage;
  name: string;
  slug: string;
  summary: string;
  verificationStatus?: "pending" | "verified" | "needs-review";
};

export type CauseProfile = CauseDirectoryItem & {
  contact?: {
    email?: string;
    name?: string;
    phone?: string;
  };
  drops: CauseDrop[];
  gallery: CauseImage[];
  legalName?: string;
  metrics: CauseMetric[];
  programs: CauseProgram[];
  products: ShopProduct[];
  registrationNumber?: string;
  reports: {
    externalUrl?: string;
    period: string;
    title: string;
  }[];
  seo: {
    metaDescription?: string;
    metaTitle?: string;
    openGraphImage?: string;
  };
  website?: string;
};
