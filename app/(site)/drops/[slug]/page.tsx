import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DropExperience } from "@/components/drops/drop-experience";
import { DropNotFoundError, getDropShowcase } from "@/lib/cms/drops";
import { siteConfig } from "@/lib/site";

type DropPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: DropPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const drop = await getDropShowcase(slug);
    const title = drop.seo.metaTitle ?? drop.title;
    const description = drop.seo.metaDescription ?? drop.summary;
    const image = drop.seo.openGraphImage ?? drop.image;

    return {
      title,
      description,
      alternates: { canonical: `/drops/${drop.slug}` },
      openGraph: {
        title: `${title} | ArtEffect`,
        description,
        url: `${siteConfig.url}/drops/${drop.slug}`,
        images: [{ url: image ?? siteConfig.socialImage, alt: drop.imageAlt }],
        type: "website"
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | ArtEffect`,
        description,
        images: [{ url: image ?? siteConfig.socialImage, alt: drop.imageAlt }]
      }
    };
  } catch (error) {
    if (error instanceof DropNotFoundError) return { title: "Drop not found" };
    throw error;
  }
}

export default async function DropPage({ params }: DropPageProps) {
  const { slug } = await params;
  let drop;

  try {
    drop = await getDropShowcase(slug);
  } catch (error) {
    if (error instanceof DropNotFoundError) notFound();
    throw error;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: drop.title,
    description: drop.summary,
    url: `${siteConfig.url}/drops/${drop.slug}`,
    image: drop.image,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: drop.products.map((product, position) => ({
        "@type": "ListItem",
        position: position + 1,
        item: {
          "@type": "Product",
          name: product.name,
          image: product.image,
          url: `${siteConfig.url}/shop/${product.slug}`
        }
      }))
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-[var(--ae-parchment)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <DropExperience drop={drop} />
    </main>
  );
}
