import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { RichText } from "@/components/content/rich-text";
import { getAboutContent } from "@/lib/cms/about";
import { siteConfig } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getAboutContent();
  const title = seo.metaTitle ?? "About ArtEffect";
  const description = seo.metaDescription ?? siteConfig.description;
  const image = seo.openGraphImage ?? siteConfig.socialImage;
  return {
    title,
    description,
    alternates: { canonical: "/about" },
    openGraph: { title, description, type: "website", url: `${siteConfig.url}/about`, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] }
  };
}

export default async function AboutPage() {
  const content = await getAboutContent();
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    description: content.seo.metaDescription ?? siteConfig.description,
    url: siteConfig.url
  };

  return (
    <main id="main-content" className="overflow-hidden bg-[var(--ae-parchment)] pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} />
      <section className="relative min-h-[calc(100svh-4rem)] bg-[var(--ae-forest)] text-[var(--ae-white)]">
        {content.hero.image ? <Image src={content.hero.image.src} alt={content.hero.image.alt} fill priority className="object-cover opacity-50" sizes="100vw" /> : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.94)_0%,rgba(0,0,0,.68)_52%,rgba(0,0,0,.28)_100%)]" />
        <div className="ae-container relative flex min-h-[calc(100svh-4rem)] items-end py-16 sm:py-24">
          <div className="max-w-4xl">
            <p className="ae-kicker">{content.hero.eyebrow}</p>
            <h1 className="ae-display mt-6 text-[clamp(4rem,11vw,8.5rem)] font-light leading-[.78] tracking-[-.04em]">{content.hero.title}</h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">{content.hero.introduction}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-story" className="ae-section">
        <div className="ae-container grid gap-10 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:gap-20">
          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--ae-fog)]">
            {content.story.image ? <Image src={content.story.image.src} alt={content.story.image.alt} fill className="object-cover transition duration-700 hover:scale-[1.025]" sizes="(min-width: 1024px) 46vw, 100vw" /> : <div className="absolute inset-8 border border-[var(--ae-gilt)]/35" />}
          </div>
          <div>
            <p className="ae-kicker">Our beginning</p>
            <h2 id="about-story" className="ae-display mt-4 text-5xl font-light leading-[.9] text-[var(--ae-forest)] sm:text-7xl">{content.story.heading}</h2>
            <RichText content={content.story.body} className="mt-8 max-w-xl" />
          </div>
        </div>
      </section>

      <section aria-labelledby="mission-title" className="ae-section bg-[var(--ae-forest)] text-white">
        <div className="ae-container grid gap-12 lg:grid-cols-[.45fr_1fr] lg:gap-20">
          <p className="ae-kicker">{content.mission.eyebrow ?? "Our mission"}</p>
          <div>
            <h2 id="mission-title" className="ae-display text-5xl font-light leading-[.9] sm:text-7xl">{content.mission.heading}</h2>
            <RichText content={content.mission.body} className="mt-8 max-w-2xl [&_*]:!text-white/70" />
            {content.mission.cta?.href && content.mission.cta.label ? <Link href={content.mission.cta.href} className="focus-ring mt-8 inline-flex items-center gap-3 border-b border-[var(--ae-gilt)] pb-2 text-sm font-semibold transition hover:text-[var(--ae-gilt)]">{content.mission.cta.label}<ArrowRight className="size-4" aria-hidden="true" /></Link> : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="values-title" className="ae-section bg-[var(--ae-fog)]">
        <div className="ae-container">
          <p className="ae-kicker">What guides us</p>
          <h2 id="values-title" className="ae-display mt-4 max-w-2xl text-5xl font-light leading-none text-[var(--ae-forest)] sm:text-7xl">Values made visible in the work.</h2>
          <ol className="mt-12 grid border-t border-[var(--border)] md:grid-cols-3">
            {content.values.map((value, index) => <li key={value.id} className="group border-b border-[var(--border)] py-8 md:border-r md:px-7 md:last:border-r-0"><span className="text-xs font-semibold tracking-[.14em] text-[var(--ae-gilt)]">0{index + 1}</span><h3 className="ae-display mt-10 text-4xl text-[var(--ae-forest)] transition group-hover:translate-x-1">{value.title}</h3><p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">{value.description}</p></li>)}
          </ol>
        </div>
      </section>

      <section aria-labelledby="founder-title" className="ae-section">
        <div className="ae-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-20">
          <div className="relative aspect-[3/4] overflow-hidden bg-[var(--ae-fog)]">{content.founder.image ? <Image src={content.founder.image.src} alt={content.founder.image.alt} fill className="object-cover" sizes="(min-width: 1024px) 40vw, 100vw" /> : null}</div>
          <div>
            <p className="ae-kicker">Founder&apos;s note</p>
            {content.founder.quote ? <blockquote className="ae-display mt-5 max-w-3xl text-4xl font-light leading-[1.04] text-[var(--ae-forest)] sm:text-6xl">“{content.founder.quote}”</blockquote> : null}
            <RichText content={content.founder.story} className="mt-8 max-w-xl" />
            <p id="founder-title" className="mt-8 text-sm font-semibold text-[var(--ae-forest)]">{content.founder.name}<span className="mt-1 block font-normal text-[var(--muted-foreground)]">{content.founder.role}</span></p>
          </div>
        </div>
      </section>

      {content.milestones.length ? <section aria-labelledby="milestones-title" className="ae-section border-t border-[var(--border)]"><div className="ae-container"><p className="ae-kicker">Along the way</p><h2 id="milestones-title" className="ae-display mt-4 text-5xl text-[var(--ae-forest)]">A growing record</h2><ol className="mt-10 grid gap-px bg-[var(--border)] md:grid-cols-3">{content.milestones.map((item) => <li key={item.id} className="bg-[var(--ae-white)] p-7"><p className="ae-display text-4xl text-[var(--ae-gilt)]">{item.year}</p><h3 className="mt-8 font-semibold text-[var(--ae-forest)]">{item.title}</h3><p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{item.description}</p></li>)}</ol></div></section> : null}
    </main>
  );
}
