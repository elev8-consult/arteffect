import type { Metadata } from "next";

import { ShopExperience } from "@/components/shop/shop-experience";
import { getShopProducts } from "@/lib/cms/products";
import {
  PRODUCT_AVAILABILITY,
  PRODUCT_COLORS,
  PRODUCT_SIZES,
  ProductQueryError,
  parseProductQuery
} from "@/lib/shop/query";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop limited art objects",
  description:
    "Explore numbered art editions by color, size, availability, and price. Every object supports an artist and a verified cause.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop limited art objects | ArtEffect",
    description:
      "Collectable objects carrying original artwork, artist royalties, and measurable impact.",
    url: `${siteConfig.url}/shop`,
    type: "website",
    images: [{ url: siteConfig.socialImage, width: 1200, height: 630, alt: "ArtEffect limited edition art object" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop limited art objects | ArtEffect",
    description: "Collectable objects carrying original artwork, artist royalties, and measurable impact.",
    images: [{ url: siteConfig.socialImage, alt: "ArtEffect limited edition art object" }]
  }
};

type ShopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const rawParams = await searchParams;
  const urlParams = toURLSearchParams(rawParams);
  let query;
  let queryNotice: string | undefined;

  try {
    query = parseProductQuery(urlParams);
  } catch (error) {
    if (!(error instanceof ProductQueryError)) throw error;
    query = parseProductQuery(new URLSearchParams());
    queryNotice = "Some filters were not recognized, so the full collection is shown.";
  }

  const products = await getShopProducts(query);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.docs.map((product, index) => ({
      "@type": "ListItem",
      position: (products.pagination.page - 1) * products.pagination.limit + index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        image: product.image,
        description: product.story,
        sku: product.variants[0]?.sku,
        offers: {
          "@type": "AggregateOffer",
          lowPrice: product.minPrice,
          highPrice: product.maxPrice,
          priceCurrency: product.currency,
          offerCount: product.variants.length
        }
      }
    }))
  };

  return (
    <main id="main-content" className="min-h-screen bg-[var(--ae-parchment)] pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <ShopExperience
        facets={{
          availability: [...PRODUCT_AVAILABILITY],
          colors: [...PRODUCT_COLORS],
          sizes: [...PRODUCT_SIZES]
        }}
        notice={queryNotice}
        query={query}
        result={products}
      />
    </main>
  );
}

function toURLSearchParams(params: Record<string, string | string[] | undefined>) {
  const result = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => result.append(key, entry));
    } else if (value !== undefined) {
      result.set(key, value);
    }
  }

  return result;
}
