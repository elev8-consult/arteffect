export type RichTextContent = Record<string, unknown>;

export type ContentImage = {
  alt: string;
  src: string;
};

export type SeoContent = {
  metaDescription?: string;
  metaTitle?: string;
  openGraphImage?: string;
};

export type AboutContent = {
  hero: {
    eyebrow: string;
    image?: ContentImage;
    introduction: string;
    title: string;
  };
  story: { body: RichTextContent; heading: string; image?: ContentImage };
  mission: {
    body: RichTextContent;
    cta?: { href?: string; label?: string; style?: "primary" | "secondary" | "text" };
    eyebrow?: string;
    heading: string;
  };
  values: Array<{ description: string; id: string; title: string }>;
  founder: {
    image?: ContentImage;
    name: string;
    quote?: string;
    role: string;
    story: RichTextContent;
  };
  milestones: Array<{ description: string; id: string; title: string; year: string }>;
  seo: SeoContent;
};

export type ContactContent = {
  details: { address?: string; email: string; hours?: string; phone?: string };
  eyebrow: string;
  introduction: string;
  responseNote?: string;
  seo: SeoContent;
  title: string;
  topics: Array<{ label: string; value: string }>;
};

export type JournalCategory = "artist-story" | "drop-notes" | "field-note" | "impact-report" | "studio";

export type JournalSummary = {
  authorName: string;
  category: JournalCategory;
  excerpt: string;
  image?: ContentImage;
  isFeatured: boolean;
  publishedAt: string;
  readTime: number;
  slug: string;
  tags: string[];
  title: string;
};

export type JournalArticle = JournalSummary & {
  content: RichTextContent;
  relatedArtist?: { name: string; slug: string };
  relatedCause?: { name: string; slug: string };
  relatedDrop?: { slug: string; title: string };
  seo: SeoContent;
};

export type JournalPage = {
  docs: JournalSummary[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  page: number;
  totalDocs: number;
  totalPages: number;
};

export type FAQAudience = "all" | "artists" | "collectors" | "ngo-partners";
export type FAQCategory = "artists" | "drops" | "impact" | "orders" | "products" | "shipping-returns";

export type FAQItem = {
  answer: RichTextContent;
  audience: FAQAudience;
  category: FAQCategory;
  id: string;
  question: string;
};
