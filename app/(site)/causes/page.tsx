import type { Metadata } from "next";

import { CauseDirectory } from "@/components/causes/cause-directory";
import { getCauseDirectory } from "@/lib/cms/causes";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cause partners",
  description: "Meet the NGO partners behind ArtEffect drops, their projects, and the progress each collection helps make possible.",
  alternates: { canonical: "/causes" },
  openGraph: {
    title: "Cause partners | ArtEffect",
    description: "The NGO partners, field projects, and public progress behind every ArtEffect collection.",
    type: "website",
    url: `${siteConfig.url}/causes`,
    images: [{ url: siteConfig.socialImage, width: 1200, height: 630, alt: "ArtEffect cause partners" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Cause partners | ArtEffect",
    description: "The NGO partners, field projects, and public progress behind every ArtEffect collection.",
    images: [{ url: siteConfig.socialImage, alt: "ArtEffect cause partners" }]
  }
};

export default async function CausesPage() {
  const causes = await getCauseDirectory();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: causes.map((cause, position) => ({
      "@type": "ListItem",
      position: position + 1,
      item: {
        "@type": "Organization",
        description: cause.summary,
        image: cause.image?.src,
        name: cause.name,
        url: `${siteConfig.url}/causes/${cause.slug}`
      }
    }))
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><CauseDirectory causes={causes} /></>;
}
