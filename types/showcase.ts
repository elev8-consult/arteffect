export type Product = {
  id: string;
  defaultVariantId: string;
  name: string;
  form: string;
  price: string;
  edition: string;
  image: string;
  imageAlt: string;
  story: string;
  materials: string[];
};

export type DropMilestone = {
  label: string;
  value: string;
  progress: number;
};

export type Drop = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  batchSize: number;
  reserved: number;
  closesAt: string;
  image: string;
  imageAlt: string;
  milestones: DropMilestone[];
};

export type ArtworkDetail = {
  label: string;
  title: string;
  body: string;
  x: number;
  y: number;
};

export type Artwork = {
  title: string;
  artistLine: string;
  summary: string;
  image: string;
  imageAlt: string;
  details: ArtworkDetail[];
};

export type ArtistFact = {
  label: string;
  value: string;
};

export type Artist = {
  name: string;
  role: string;
  quote: string;
  bio: string;
  image: string;
  imageAlt: string;
  facts: ArtistFact[];
};

export type CauseMetric = {
  label: string;
  value: string;
  progress: number;
};

export type Cause = {
  name: string;
  focus: string;
  summary: string;
  image: string;
  imageAlt: string;
  metrics: CauseMetric[];
};

export type ImpactStat = {
  label: string;
  value: number;
  metricType: "projected" | "committed" | "transferred" | "verified";
  prefix?: string;
  suffix?: string;
  detail: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export type ShowcaseContent = {
  products: Product[];
  drop: Drop;
  artwork: Artwork;
  artist: Artist;
  cause: Cause;
  impactStats: ImpactStat[];
  testimonials: Testimonial[];
};
