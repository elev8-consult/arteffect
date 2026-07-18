"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ExternalLink, Instagram, MapPin, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { normalizeExternalUrl, normalizeInstagramUrl } from "@/lib/artist-links";
import { sectionReveal } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ArtistProfile as ArtistProfileData, ArtistWork } from "@/types/artist";

type ArtistProfileProps = { artist: ArtistProfileData };

// Kept as a local alias for existing profile integrations; the token itself is shared.
const revealMotion = sectionReveal;

export function ArtistProfile({ artist }: ArtistProfileProps) {
  const reducedMotion = useReducedMotion();
  const [selectedWork, setSelectedWork] = useState(0);
  const selected = artist.representativeWorks[selectedWork];
  const processVideo = artist.processVideo;
  const social = socialLinks(artist);
  const reveal = reducedMotion ? { initial: false as const } : revealMotion;

  return (
    <main id="main-content" className="min-h-screen bg-[var(--ae-parchment)] pt-16">
      <section className="bg-[var(--ae-forest)] text-[var(--ae-white)]">
        <div className="ae-container grid min-h-[min(48rem,calc(100svh-4rem))] gap-0 lg:grid-cols-[.8fr_1.2fr]">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: -18 }}
            animate={reducedMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-[28rem] overflow-hidden bg-[var(--ae-forest-soft)] lg:min-h-0"
          >
            {artist.image ? <Image src={artist.image.src} alt={artist.image.alt} fill priority sizes="(max-width: 1023px) 100vw, 42vw" className="object-cover" /> : null}
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,.46),transparent_45%)]" />
            {artist.location ? <p className="absolute bottom-5 left-5 inline-flex items-center gap-2 text-xs uppercase tracking-[.12em] text-white/70"><MapPin className="size-3.5 text-[var(--ae-gilt)]" aria-hidden="true" />{artist.location}</p> : null}
          </motion.div>
          <div className="flex flex-col justify-end px-0 py-12 sm:py-16 lg:px-[clamp(2.5rem,7vw,7rem)]">
            <motion.div initial={reducedMotion ? false : { opacity: 0, y: 22 }} animate={reducedMotion ? undefined : { opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}>
              <p className="ae-kicker">Artist profile</p>
              <h1 className="ae-display mt-5 text-[clamp(5rem,11vw,8.8rem)] font-light leading-[.72] tracking-[-.05em]">{artist.name}</h1>
              <p className="mt-6 text-xs font-medium uppercase tracking-[.14em] text-white/55">{artist.role}</p>
              <blockquote className="ae-display mt-10 max-w-2xl text-3xl leading-[1.02] text-white/90 sm:text-4xl">“{artist.quote}”</blockquote>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-[var(--ae-white)] text-[var(--ae-forest)] hover:bg-[var(--ae-fog)]"><a href="#biography">Read the biography <ArrowRight className="size-4" aria-hidden="true" /></a></Button>
                {artist.drops[0] ? <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:border-[var(--ae-gilt)] hover:bg-transparent hover:text-[var(--ae-gilt)]"><Link href={`/drops/${artist.drops[0].slug}`}>View drops <ArrowUpRight className="size-4" aria-hidden="true" /></Link></Button> : null}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="biography" className="ae-section scroll-mt-16">
        <motion.div {...reveal} className="ae-container grid gap-12 lg:grid-cols-[.88fr_1.12fr] lg:gap-24">
          <div><p className="ae-kicker">Biography</p><h2 className="ae-display mt-4 text-5xl font-light leading-[.86] text-[var(--ae-forest)] sm:text-6xl">A practice rooted in attention.</h2></div>
          <div><p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">{artist.bio}</p><dl className="mt-10 divide-y divide-[var(--border)] border-y border-[var(--border)]">{artist.facts.map((fact, index) => <div key={fact.label} className="grid grid-cols-[7rem_1fr] gap-4 py-4"><dt className={cn("text-xs uppercase tracking-[.12em]", index === 0 ? "text-[var(--ae-gilt)]" : "text-[var(--ae-stone)]")}>{fact.label}</dt><dd className="text-sm text-[var(--ae-forest)]">{fact.value}</dd></div>)}</dl>{social.length ? <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">{social.map(({ href, label, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 border-b border-[var(--ae-gilt)] pb-1 text-sm font-medium text-[var(--ae-forest)] transition hover:text-[var(--ae-gilt)]" aria-label={`Visit ${artist.name}'s ${label}`}><Icon className="size-4" aria-hidden="true" />{label}<ExternalLink className="size-3.5" aria-hidden="true" /></a>)}</div> : null}</div>
        </motion.div>
      </section>

      {processVideo ? <section aria-labelledby="process-title" className="bg-[var(--ae-onyx)] py-[var(--ae-space-section)] text-[var(--ae-white)]"><motion.div {...reveal} className="ae-container grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end"><div><p className="ae-kicker">Studio process</p><h2 id="process-title" className="ae-display mt-4 text-5xl font-light leading-[.86] sm:text-6xl">Before an object, there is a mark.</h2><p className="mt-6 max-w-sm text-sm leading-7 text-white/65">{processVideo.caption ?? "A short look inside the artist's working process."}</p></div><div className="relative overflow-hidden bg-[var(--ae-forest-soft)]"><video className="aspect-video w-full object-cover" controls muted loop playsInline poster={processVideo.poster?.src} aria-describedby="process-video-description"><source src={processVideo.src} />Your browser does not support the process video.</video><p id="process-video-description" className="sr-only">Process video from {artist.name}&apos;s studio.</p><span aria-hidden="true" className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 bg-[rgba(14,14,14,.72)] px-3 py-2 text-xs uppercase tracking-[.12em] text-white/80"><Play className="size-3 fill-current text-[var(--ae-gilt)]" />Process film</span></div></motion.div></section> : null}

      {artist.representativeWorks.length ? <section aria-labelledby="works-title" className="ae-section bg-[var(--ae-fog)]"><motion.div {...reveal} className="ae-container"><div className="max-w-2xl"><p className="ae-kicker">Selected artwork</p><h2 id="works-title" className="ae-display mt-4 text-5xl font-light leading-[.86] text-[var(--ae-forest)] sm:text-6xl">A changing archive of material and place.</h2></div><div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><ArtworkStage work={selected} /><div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">{artist.representativeWorks.map((work, index) => <button key={`${work.title}-${index}`} type="button" onClick={() => setSelectedWork(index)} className="focus-ring group grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-4 text-left" aria-pressed={selectedWork === index}><span className={cn("ae-display text-2xl", selectedWork === index ? "text-[var(--ae-gilt)]" : "text-[var(--ae-stone)]")}>{String(index + 1).padStart(2, "0")}</span><span><span className="block text-base font-medium text-[var(--ae-forest)]">{work.title}</span><span className="mt-1 block text-xs uppercase tracking-[.1em] text-[var(--ae-stone)]">{[work.year, work.medium].filter(Boolean).join(" · ")}</span></span><ArrowUpRight className={cn("size-4 transition", selectedWork === index ? "text-[var(--ae-gilt)]" : "text-transparent group-hover:text-[var(--ae-gilt)]")} aria-hidden="true" /></button>)}</div></div></motion.div></section> : null}

      {artist.drops.length ? <section aria-labelledby="drops-title" className="ae-section"><motion.div {...reveal} className="ae-container"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="ae-kicker">Drops and collections</p><h2 id="drops-title" className="ae-display mt-4 text-5xl font-light leading-[.86] text-[var(--ae-forest)] sm:text-6xl">Objects made with a reason to travel.</h2></div><p className="max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">Every collection maps an artwork to a specific artist royalty and community outcome.</p></div><div className="mt-10 grid gap-6 md:grid-cols-2">{artist.drops.map((drop) => <Link key={drop.slug} href={`/drops/${drop.slug}`} className="focus-ring group grid overflow-hidden border border-[var(--border)] bg-[var(--ae-white)] md:grid-cols-2"><div className="relative aspect-[4/3] overflow-hidden bg-[var(--ae-fog)]">{drop.image ? <Image src={drop.image.src} alt={drop.image.alt} fill sizes="(max-width: 767px) 100vw, 45vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" /> : null}</div><div className="flex flex-col justify-between p-6"><div><p className="ae-kicker">{drop.eyebrow}</p><h3 className="ae-display mt-3 text-3xl font-medium leading-[.94] text-[var(--ae-forest)]">{drop.title}</h3><p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">{drop.summary}</p></div><span className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[var(--ae-forest)]">Explore the drop <ArrowUpRight className="size-4 text-[var(--ae-gilt)]" aria-hidden="true" /></span></div></Link>)}</div></motion.div></section> : null}

      {artist.products.length ? <section aria-labelledby="editions-title" className="bg-[var(--ae-forest)] py-[var(--ae-space-section)] text-[var(--ae-white)]"><motion.div {...reveal} className="ae-container"><p className="ae-kicker">Available editions</p><h2 id="editions-title" className="ae-display mt-4 text-5xl font-light leading-[.86] sm:text-6xl">Collect the work.</h2><div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{artist.products.map((product) => <Link key={product.slug} href={`/shop/${product.slug}`} className="focus-ring group"><div className="relative aspect-[4/5] overflow-hidden bg-[var(--ae-forest-soft)]">{product.image ? <Image src={product.image} alt={product.imageAlt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-700 group-hover:scale-[1.025]" /> : null}</div><div className="mt-4 flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[.12em] text-white/45">{product.form}</p><h3 className="ae-display mt-1 text-3xl font-medium leading-none">{product.name}</h3></div><span className="text-sm text-[var(--ae-gilt)]">{product.displayPrice}</span></div></Link>)}</div></motion.div></section> : null}

      {artist.portraitGallery.length ? <section aria-labelledby="behind-scenes-title" className="ae-section"><motion.div {...reveal} className="ae-container"><div className="max-w-xl"><p className="ae-kicker">Behind the scenes</p><h2 id="behind-scenes-title" className="ae-display mt-4 text-5xl font-light leading-[.86] text-[var(--ae-forest)] sm:text-6xl">The work around the work.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-12">{artist.portraitGallery.map((image, index) => <figure key={`${image.src}-${index}`} className={cn(index === 0 ? "md:col-span-7" : index === 1 ? "md:col-span-5" : "md:col-span-6")}><div className={cn("relative overflow-hidden bg-[var(--ae-fog)]", index === 0 ? "aspect-[4/3]" : "aspect-[3/4]")}><Image src={image.src} alt={image.alt} fill sizes={index === 0 ? "(max-width: 767px) 100vw, 58vw" : "(max-width: 767px) 100vw, 42vw"} className="object-cover" /></div>{image.caption ? <figcaption className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{image.caption}</figcaption> : null}</figure>)}</div></motion.div></section> : null}
    </main>
  );
}

function ArtworkStage({ work }: { work?: ArtistWork }) {
  if (!work) return null;
  return <div className="relative aspect-[4/5] overflow-hidden bg-[var(--ae-stone)]">{work.image ? <Image src={work.image.src} alt={work.image.alt} fill sizes="(max-width: 1023px) 100vw, 62vw" className="object-cover" /> : <div className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-white">Image coming soon</div>}<div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(14,14,14,.62),transparent)] p-6 text-white"><p className="ae-display text-3xl">{work.title}</p>{work.medium ? <p className="mt-2 text-xs uppercase tracking-[.12em] text-white/70">{work.medium}</p> : null}</div></div>;
}

function socialLinks(artist: ArtistProfileData) {
  const links: { href: string; icon: typeof Instagram; label: string }[] = [];
  const website = normalizeExternalUrl(artist.website);
  if (website) links.push({ href: website, icon: ExternalLink, label: "Website" });
  const instagram = normalizeInstagramUrl(artist.instagram);
  if (instagram) links.push({ href: instagram, icon: Instagram, label: "Instagram" });
  return links;
}
