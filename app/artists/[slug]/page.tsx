import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArtistProfile } from "@/components/artists/artist-profile";
import { normalizeExternalUrl, normalizeInstagramUrl } from "@/lib/artist-links";
import { ArtistNotFoundError, getArtistProfile } from "@/lib/cms/artists";
import { siteConfig } from "@/lib/site";

type ArtistPageProps = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const artist = await getArtistProfile(slug);
    const title = artist.seo.metaTitle ?? artist.name;
    const description = artist.seo.metaDescription ?? artist.bio;
    const image = artist.seo.openGraphImage ?? artist.image?.src;
    return {
      title,
      description,
      alternates: { canonical: `/artists/${artist.slug}` },
      openGraph: {
        title: `${title} | ArtEffect`,
        description,
        images: [{ alt: artist.image?.alt ?? `${artist.name} portrait`, url: image ?? siteConfig.socialImage }],
        type: "profile",
        url: `${siteConfig.url}/artists/${artist.slug}`
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | ArtEffect`,
        description,
        images: [{ alt: artist.image?.alt ?? `${artist.name} portrait`, url: image ?? siteConfig.socialImage }]
      }
    };
  } catch (error) {
    if (error instanceof ArtistNotFoundError) return { title: "Artist not found" };
    throw error;
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { slug } = await params;
  let artist;
  try {
    artist = await getArtistProfile(slug);
  } catch (error) {
    if (error instanceof ArtistNotFoundError) notFound();
    throw error;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    description: artist.bio,
    image: artist.image?.src,
    jobTitle: artist.role,
    name: artist.name,
    sameAs: [normalizeExternalUrl(artist.website), normalizeInstagramUrl(artist.instagram)].filter(
      (url): url is string => Boolean(url)
    ),
    url: `${siteConfig.url}/artists/${artist.slug}`
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><ArtistProfile artist={artist} /></>;
}
