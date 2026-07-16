import type { Metadata } from "next";

import { ArtistDirectory } from "@/components/artists/artist-directory";
import { getArtistDirectory } from "@/lib/cms/artists";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Artists",
  description: "Meet the artists behind ArtEffect's limited editions, studio practices, and cause-led collections.",
  alternates: { canonical: "/artists" },
  openGraph: {
    title: "Artists | ArtEffect",
    description: "Meet the artists behind ArtEffect's limited editions, studio practices, and cause-led collections.",
    url: `${siteConfig.url}/artists`,
    type: "website",
    images: [{ url: siteConfig.socialImage, width: 1200, height: 630, alt: "ArtEffect artists at work" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Artists | ArtEffect",
    description: "Meet the artists behind ArtEffect's limited editions, studio practices, and cause-led collections.",
    images: [{ url: siteConfig.socialImage, alt: "ArtEffect artists at work" }]
  }
};

export default async function ArtistsPage() {
  const artists = await getArtistDirectory();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: artists.map((artist, position) => ({
      "@type": "ListItem",
      position: position + 1,
      item: {
        "@type": "Person",
        image: artist.image?.src,
        jobTitle: artist.role,
        name: artist.name,
        url: `${siteConfig.url}/artists/${artist.slug}`
      }
    }))
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><ArtistDirectory artists={artists} /></>;
}
