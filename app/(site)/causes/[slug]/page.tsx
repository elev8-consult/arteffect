import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CauseProfile } from "@/components/causes/cause-profile";
import { CauseNotFoundError, getCauseProfile } from "@/lib/cms/causes";
import { siteConfig } from "@/lib/site";

type CausePageProps = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: CausePageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const cause = await getCauseProfile(slug);
    const title = cause.seo.metaTitle ?? cause.name;
    const description = cause.seo.metaDescription ?? cause.summary;
    const image = cause.seo.openGraphImage ?? cause.image?.src;
    return {
      title,
      description,
      alternates: { canonical: `/causes/${cause.slug}` },
      openGraph: {
        title: `${title} | ArtEffect`,
        description,
        images: [{ alt: cause.image?.alt ?? `${cause.name} field work`, url: image ?? siteConfig.socialImage }],
        type: "website",
        url: `${siteConfig.url}/causes/${cause.slug}`
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | ArtEffect`,
        description,
        images: [{ alt: cause.image?.alt ?? `${cause.name} field work`, url: image ?? siteConfig.socialImage }]
      }
    };
  } catch (error) {
    if (error instanceof CauseNotFoundError) return { title: "Cause not found" };
    throw error;
  }
}

export default async function CausePage({ params }: CausePageProps) {
  const { slug } = await params;
  let cause;
  try {
    cause = await getCauseProfile(slug);
  } catch (error) {
    if (error instanceof CauseNotFoundError) notFound();
    throw error;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    description: cause.summary,
    email: cause.contact?.email,
    identifier: cause.registrationNumber,
    image: cause.image?.src,
    legalName: cause.legalName,
    name: cause.name,
    sameAs: cause.website ? [cause.website] : [],
    url: `${siteConfig.url}/causes/${cause.slug}`
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><CauseProfile cause={cause} /></>;
}
