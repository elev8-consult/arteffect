import { ArrowRight, Search } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getJournalPage, JournalInputError } from "@/lib/cms/journal";
import { siteConfig } from "@/lib/site";
import type { JournalCategory, JournalSummary } from "@/types/content";

export const metadata: Metadata = {
  title: "Journal",
  description: "Studio notes, artist stories, drop journals, and accountable impact reports from ArtEffect.",
  alternates: { canonical: "/journal" },
  openGraph: {
    title: "Journal | ArtEffect",
    description: "Stories behind the objects, people, and impact of each ArtEffect edition.",
    type: "website",
    url: `${siteConfig.url}/journal`,
    images: [{ url: siteConfig.socialImage, width: 1200, height: 630, alt: "ArtEffect Journal" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Journal | ArtEffect",
    description: "Stories behind the objects, people, and impact of each ArtEffect edition.",
    images: [{ url: siteConfig.socialImage, alt: "ArtEffect Journal" }]
  }
};

const categoryLabels: Record<JournalCategory, string> = {
  "artist-story": "Artist stories",
  "drop-notes": "Drop notes",
  "field-note": "Field notes",
  "impact-report": "Impact reports",
  studio: "Studio"
};

type SearchParams = Promise<{ category?: string; page?: string; q?: string; tag?: string }>;

export default async function JournalPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const pageNumber = Number(params.page ?? "1");
  let journal;
  try {
    journal = await getJournalPage({ category: params.category, limit: 12, page: Number.isSafeInteger(pageNumber) ? pageNumber : 1, query: params.q, tag: params.tag });
  } catch (error) {
    if (!(error instanceof JournalInputError)) throw error;
    journal = await getJournalPage({ limit: 12, page: 1 });
  }
  const [featured, ...articles] = journal.docs;
  const collectionSchema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "ArtEffect Journal", url: `${siteConfig.url}/journal` };

  return (
    <main id="main-content" className="bg-[var(--ae-parchment)] pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c") }} />
      <header className="border-b border-white/10 bg-[var(--ae-forest)] py-20 text-white sm:py-28">
        <div className="ae-container grid gap-9 lg:grid-cols-[1fr_.55fr] lg:items-end">
          <div><p className="ae-kicker">Notes from the work</p><h1 className="ae-display mt-5 text-[clamp(5rem,13vw,9rem)] font-light leading-[.72] tracking-[-.04em]">The<br />Journal.</h1></div>
          <p className="max-w-md border-l border-[var(--ae-gilt)] pl-5 text-base leading-7 text-white/65">Stories behind the editions: the artists, decisions, cause partnerships, and evidence that give each object its longer life.</p>
        </div>
      </header>

      <section aria-label="Journal controls" className="border-b border-[var(--border)] bg-[var(--ae-fog)] py-5">
        <div className="ae-container flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Journal categories" className="flex gap-2 overflow-x-auto pb-1">
            <CategoryLink href="/journal" active={!params.category}>All stories</CategoryLink>
            {(Object.entries(categoryLabels) as Array<[JournalCategory, string]>).map(([value, label]) => <CategoryLink key={value} href={`/journal?category=${value}`} active={params.category === value}>{label}</CategoryLink>)}
          </nav>
          <form action="/journal" className="relative min-w-64">
            <label htmlFor="journal-search" className="sr-only">Search journal</label>
            <input id="journal-search" name="q" defaultValue={params.q} placeholder="Search the journal" className="focus-ring h-10 w-full rounded-full border border-[var(--border)] bg-[var(--ae-white)] px-4 pr-10 text-sm text-[var(--ae-forest)] placeholder:text-[var(--ae-stone)]" />
            <button className="focus-ring absolute right-1 top-1 grid size-8 place-items-center rounded-full" aria-label="Search"><Search className="size-4" aria-hidden="true" /></button>
          </form>
        </div>
      </section>

      <section aria-labelledby="journal-stories" className="ae-section">
        <div className="ae-container">
          <div className="flex items-end justify-between gap-5"><div><p className="ae-kicker">{params.q ? `Results for “${params.q}”` : params.category ? categoryLabels[params.category as JournalCategory] ?? "Stories" : "Latest stories"}</p><h2 id="journal-stories" className="ae-display mt-3 text-5xl font-light text-[var(--ae-forest)] sm:text-7xl">Ideas worth keeping.</h2></div><p className="hidden text-sm text-[var(--muted-foreground)] sm:block">{journal.totalDocs} {journal.totalDocs === 1 ? "story" : "stories"}</p></div>
          {featured ? <FeaturedArticle article={featured} /> : <div className="mt-12 border-y border-[var(--border)] py-16 text-center"><p className="ae-display text-4xl text-[var(--ae-forest)]">No stories found.</p><p className="mt-3 text-sm text-[var(--muted-foreground)]">Try another category or search phrase.</p></div>}
          {articles.length ? <div className="mt-14 grid gap-x-7 gap-y-14 md:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <ArticleCard key={article.slug} article={article} />)}</div> : null}
          {journal.totalPages > 1 ? <nav aria-label="Journal pagination" className="mt-14 flex items-center justify-between border-t border-[var(--border)] pt-6">{journal.hasPrevPage ? <Link className="focus-ring text-sm font-semibold text-[var(--ae-forest)]" href={pageHref(params, journal.page - 1)}>← Newer stories</Link> : <span />}{journal.hasNextPage ? <Link className="focus-ring text-sm font-semibold text-[var(--ae-forest)]" href={pageHref(params, journal.page + 1)}>Older stories →</Link> : null}</nav> : null}
        </div>
      </section>
    </main>
  );
}

function FeaturedArticle({ article }: { article: JournalSummary }) {
  return <article className="group mt-12 grid overflow-hidden border border-[var(--border)] bg-[var(--ae-white)] lg:grid-cols-[1.15fr_.85fr]">
    <Link href={`/journal/${article.slug}`} className="focus-ring relative min-h-80 overflow-hidden bg-[var(--ae-forest)]">{article.image ? <Image src={article.image.src} alt={article.image.alt} fill className="object-cover opacity-85 transition duration-700 group-hover:scale-[1.025]" sizes="(min-width: 1024px) 58vw, 100vw" /> : <div className="absolute inset-10 rounded-full border border-[var(--ae-gilt)]/35" />}<span className="absolute left-5 top-5 bg-[var(--ae-parchment)] px-3 py-1.5 text-[.65rem] font-semibold uppercase tracking-[.12em] text-[var(--ae-forest)]">Featured</span></Link>
    <div className="flex flex-col justify-between p-7 sm:p-10"><div><ArticleMeta article={article} /><h3 className="ae-display mt-6 text-4xl font-light leading-[.95] text-[var(--ae-forest)] sm:text-5xl"><Link className="focus-ring" href={`/journal/${article.slug}`}>{article.title}</Link></h3><p className="mt-5 text-sm leading-7 text-[var(--muted-foreground)]">{article.excerpt}</p></div><Link href={`/journal/${article.slug}`} className="focus-ring mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ae-forest)]">Read the story <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" /></Link></div>
  </article>;
}

function ArticleCard({ article }: { article: JournalSummary }) {
  return <article className="group"><Link href={`/journal/${article.slug}`} className="focus-ring relative block aspect-[4/3] overflow-hidden bg-[var(--ae-forest)]">{article.image ? <Image src={article.image.src} alt={article.image.alt} fill className="object-cover opacity-90 transition duration-700 group-hover:scale-[1.035]" sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" /> : <div className="absolute inset-[18%] rotate-12 border border-[var(--ae-gilt)]/40" />}</Link><div className="mt-5"><ArticleMeta article={article} /><h3 className="ae-display mt-4 text-3xl leading-none text-[var(--ae-forest)]"><Link className="focus-ring" href={`/journal/${article.slug}`}>{article.title}</Link></h3><p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">{article.excerpt}</p></div></article>;
}

function ArticleMeta({ article }: { article: JournalSummary }) {
  return <p className="flex flex-wrap gap-x-3 text-[.68rem] font-semibold uppercase tracking-[.11em] text-[var(--ae-stone)]"><span className="text-[var(--ae-gilt)]">{categoryLabels[article.category]}</span><time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time><span>{article.readTime} min read</span></p>;
}

function CategoryLink({ active, children, href }: { active: boolean; children: React.ReactNode; href: string }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${active ? "border-[var(--ae-forest)] bg-[var(--ae-forest)] text-white" : "border-[var(--ae-stone)]/40 text-[var(--ae-forest)] hover:border-[var(--ae-gilt)]"}`}>{children}</Link>;
}

function formatDate(value: string) { const date = new Date(value); return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(date) : "Date pending"; }
function pageHref(params: { category?: string; q?: string; tag?: string }, page: number) { const query = new URLSearchParams(); if (params.category) query.set("category", params.category); if (params.q) query.set("q", params.q); if (params.tag) query.set("tag", params.tag); query.set("page", String(page)); return `/journal?${query}`; }
