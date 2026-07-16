import type { Metadata } from "next";

import { HomeExperience } from "@/components/sections/home-experience";
import { getShowcaseContent } from "@/lib/cms/showcase";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    type: "website",
    url: siteConfig.url,
    images: [{ url: siteConfig.socialImage, width: 1200, height: 630, alt: "ArtEffect limited edition art object" }]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: siteConfig.socialImage, alt: "ArtEffect limited edition art object" }]
  }
};

export default async function Home() {
  const { artist, artwork, cause, drop, impactStats, products, testimonials } =
    await getShowcaseContent();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteConfig.url}/#webpage`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    isPartOf: { "@id": `${siteConfig.url}/#website` },
    about: ["Limited art editions", "Artist royalties", "Measurable NGO impact"]
  };

  return <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
    />
    <HomeExperience
      artist={artist}
      artwork={artwork}
      cause={cause}
      drop={drop}
      impactStats={impactStats}
      products={products}
      testimonials={testimonials}
    />
  </>;
}
