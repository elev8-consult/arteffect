import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductExperience } from "@/components/shop/product-experience";
import {
  getRelatedShopProducts,
  getShopProduct,
  ProductNotFoundError
} from "@/lib/cms/products";
import { getProductReviews } from "@/lib/cms/reviews";
import { siteConfig } from "@/lib/site";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getShopProduct(slug);
    return {
      title: product.name,
      description: product.story,
      alternates: { canonical: `/shop/${product.slug}` },
      openGraph: {
        title: `${product.name} | ArtEffect`,
        description: product.story,
        url: `${siteConfig.url}/shop/${product.slug}`,
        images: [{ url: product.image ?? siteConfig.socialImage, alt: product.imageAlt }],
        type: "website"
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} | ArtEffect`,
        description: product.story,
        images: [{ url: product.image ?? siteConfig.socialImage, alt: product.imageAlt }]
      }
    };
  } catch (error) {
    if (error instanceof ProductNotFoundError) return { title: "Edition not found" };
    throw error;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product;

  try {
    product = await getShopProduct(slug);
  } catch (error) {
    if (error instanceof ProductNotFoundError) notFound();
    throw error;
  }

  const [related, reviews] = await Promise.all([
    getRelatedShopProducts(product, 3),
    getProductReviews(product, 2)
  ]);
  const catalog = { docs: related };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.gallery.map((image) => image.src),
    description: product.story,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "ArtEffect" },
    material: product.materials.join(", "),
    offers: {
      "@type": "AggregateOffer",
      availability: product.availability === "out-of-stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      highPrice: product.maxPrice,
      lowPrice: product.minPrice,
      offerCount: product.variants.length,
      priceCurrency: product.currency,
      url: `${siteConfig.url}/shop/${product.slug}`
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-[var(--ae-parchment)] pb-14 pt-16 md:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <ProductExperience product={product} products={catalog.docs} related={related} reviews={reviews} />
    </main>
  );
}
