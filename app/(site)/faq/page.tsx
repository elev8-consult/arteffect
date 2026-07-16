import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { FAQExperience } from "@/components/content/faq-experience";
import { getFAQs } from "@/lib/cms/faqs";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers about ArtEffect editions, drops, shipping, artist collaborations, orders, and impact reporting.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Frequently asked questions | ArtEffect",
    description: "Clear answers about ArtEffect objects, editions, collaborations, delivery, and impact.",
    type: "website",
    url: `${siteConfig.url}/faq`,
    images: [{ url: siteConfig.socialImage, width: 1200, height: 630, alt: "ArtEffect frequently asked questions" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently asked questions | ArtEffect",
    description: "Clear answers about ArtEffect objects, editions, collaborations, delivery, and impact.",
    images: [{ url: siteConfig.socialImage, alt: "ArtEffect frequently asked questions" }]
  }
};

export default async function FAQPage() {
  const faqs = await getFAQs();
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: plainText(faq.answer) } })) };
  return <main id="main-content" className="bg-[var(--ae-parchment)] pt-16"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} /><header className="bg-[var(--ae-forest)] py-20 text-white sm:py-28"><div className="ae-container grid gap-10 lg:grid-cols-[1fr_.55fr] lg:items-end"><div><p className="ae-kicker">Useful detail</p><h1 className="ae-display mt-5 text-[clamp(4.5rem,11vw,8.5rem)] font-light leading-[.76] tracking-[-.04em]">The thoughtful<br />answer.</h1></div><div><p className="border-l border-[var(--ae-gilt)] pl-5 text-base leading-7 text-white/65">From edition sizes to shipping and the impact ledger, the details should be as clear as the intent.</p><Link href="/contact" className="focus-ring mt-7 inline-flex items-center gap-2 border-b border-[var(--ae-gilt)] pb-2 text-sm font-semibold">Ask something else <ArrowRight className="size-4" aria-hidden="true" /></Link></div></div></header><FAQExperience faqs={faqs} /></main>;
}

function plainText(value: unknown): string { if (typeof value === "string") return value; if (Array.isArray(value)) return value.map(plainText).filter(Boolean).join(" "); if (value && typeof value === "object") return Object.values(value).map(plainText).filter(Boolean).join(" "); return ""; }
