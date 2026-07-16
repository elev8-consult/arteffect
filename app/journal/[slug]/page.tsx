import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RichText } from "@/components/content/rich-text";
import { getJournalArticle, JournalNotFoundError } from "@/lib/cms/journal";
import { siteConfig } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  try {
    const article = await getJournalArticle((await params).slug);
    const title = article.seo.metaTitle ?? article.title;
    const description = article.seo.metaDescription ?? article.excerpt;
    const image = article.seo.openGraphImage ?? article.image?.src ?? siteConfig.socialImage;
    return { title, description, alternates: { canonical: `/journal/${article.slug}` }, openGraph: { title, description, type: "article", url: `${siteConfig.url}/journal/${article.slug}`, publishedTime: article.publishedAt, images: [image] }, twitter: { card: "summary_large_image", title, description, images: [image] } };
  } catch (error) { if (error instanceof JournalNotFoundError) return {}; throw error; }
}

export default async function JournalArticlePage({ params }: { params: Params }) {
  let article;
  try { article = await getJournalArticle((await params).slug); } catch (error) { if (error instanceof JournalNotFoundError) notFound(); throw error; }
  const articleSchema = { "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.excerpt, datePublished: article.publishedAt, author: { "@type": "Organization", name: article.authorName }, image: article.image?.src, mainEntityOfPage: `${siteConfig.url}/journal/${article.slug}`, publisher: { "@type": "Organization", name: siteConfig.name } };
  const related = [article.relatedArtist ? { href: `/artists/${article.relatedArtist.slug}`, label: article.relatedArtist.name, type: "Artist" } : null, article.relatedCause ? { href: `/causes/${article.relatedCause.slug}`, label: article.relatedCause.name, type: "Cause" } : null, article.relatedDrop ? { href: `/drops/${article.relatedDrop.slug}`, label: article.relatedDrop.title, type: "Drop" } : null].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return <main id="main-content" className="bg-[var(--ae-parchment)] pt-16">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} />
    <article>
      <header className="bg-[var(--ae-forest)] py-16 text-white sm:py-24"><div className="ae-container"><Link href="/journal" className="focus-ring inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-white/65 hover:text-white"><ArrowLeft className="size-4" aria-hidden="true" /> Journal</Link><div className="mt-14 grid gap-10 lg:grid-cols-[1fr_.35fr] lg:items-end"><div><p className="ae-kicker">{article.category.replaceAll("-", " ")}</p><h1 className="ae-display mt-5 max-w-5xl text-[clamp(3.8rem,9vw,7.5rem)] font-light leading-[.8] tracking-[-.035em]">{article.title}</h1></div><div className="border-l border-[var(--ae-gilt)] pl-5 text-sm leading-6 text-white/65"><p>{article.excerpt}</p><p className="mt-5 text-xs font-semibold uppercase tracking-[.1em] text-white/45">By {article.authorName} · <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time> · {article.readTime} min</p></div></div></div></header>
      {article.image ? <div className="ae-container -mt-px"><div className="relative aspect-[16/8] overflow-hidden bg-[var(--ae-fog)]"><Image src={article.image.src} alt={article.image.alt} fill priority className="object-cover" sizes="1180px" /></div></div> : null}
      <div className="ae-container grid gap-10 py-[var(--ae-space-section)] lg:grid-cols-[12rem_minmax(0,42rem)] lg:justify-center lg:gap-16">
        <aside><p className="ae-kicker">Filed under</p><div className="mt-4 flex flex-wrap gap-2 lg:grid">{article.tags.map((tag) => <Link key={tag} href={`/journal?tag=${encodeURIComponent(tag)}`} className="focus-ring text-xs font-semibold text-[var(--ae-forest)] underline decoration-[var(--ae-gilt)] underline-offset-4">{tag}</Link>)}</div></aside>
        <RichText content={article.content} className="text-[1.06rem]" />
      </div>
      {related.length ? <section aria-labelledby="related-title" className="border-t border-[var(--border)] bg-[var(--ae-fog)] py-16"><div className="ae-container"><p className="ae-kicker">Continue the story</p><h2 id="related-title" className="ae-display mt-3 text-5xl text-[var(--ae-forest)]">Connected to this note.</h2><div className="mt-9 grid gap-px bg-[var(--border)] md:grid-cols-3">{related.map((item) => <Link key={item.href} href={item.href} className="focus-ring group flex min-h-40 flex-col justify-between bg-[var(--ae-white)] p-6"><span className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--ae-gilt)]">{item.type}</span><span className="flex items-end justify-between gap-4"><span className="ae-display text-3xl leading-none text-[var(--ae-forest)]">{item.label}</span><ArrowUpRight className="size-5 transition group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true" /></span></Link>)}</div></div></section> : null}
    </article>
  </main>;
}

function formatDate(value: string) { const date = new Date(value); return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric" }).format(date) : "Date pending"; }
