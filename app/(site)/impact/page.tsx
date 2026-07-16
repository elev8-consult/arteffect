import type { Metadata } from "next";

import { ImpactDashboard } from "@/components/impact/impact-dashboard";
import { getImpactDashboard } from "@/lib/cms/impact";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Impact ledger",
  description: "Follow ArtEffect allocations from each limited edition through NGO commitments, transfers, and field updates.",
  alternates: { canonical: "/impact" },
  openGraph: {
    title: "Impact ledger | ArtEffect",
    description: "A public record of ArtEffect allocations, NGO partners, and field updates.",
    type: "website",
    url: `${siteConfig.url}/impact`,
    images: [{ url: siteConfig.socialImage, width: 1200, height: 630, alt: "ArtEffect impact ledger" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Impact ledger | ArtEffect",
    description: "A public record of ArtEffect allocations, NGO partners, and field updates.",
    images: [{ url: siteConfig.socialImage, alt: "ArtEffect impact ledger" }]
  }
};

export default async function ImpactPage() {
  const dashboard = await getImpactDashboard();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    description: metadata.description,
    name: "ArtEffect impact ledger",
    temporalCoverage: dashboard.lastUpdated,
    url: `${siteConfig.url}/impact`
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><ImpactDashboard dashboard={dashboard} /></>;
}
