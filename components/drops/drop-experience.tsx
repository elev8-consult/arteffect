"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, Check, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { MOTION_EASE, sectionReveal } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { DropShowcase } from "@/types/drop";

type DropExperienceProps = { drop: DropShowcase };

export function DropExperience({ drop }: DropExperienceProps) {
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const reveal = reducedMotion ? { initial: false as const } : sectionReveal;
  const inventorySoldOut = drop.products.length > 0 && drop.products.every(productIsSoldOut);
  const soldOut = drop.status === "sold-out" || drop.reserved >= drop.batchSize || inventorySoldOut;
  const closed = soldOut || drop.status === "closed";
  const remaining = Math.max(0, drop.batchSize - drop.reserved);
  const allocationTotal = drop.allocation.reduce((sum, item) => sum + item.percentage, 0);

  return (
    <>
      <section ref={heroRef} className="relative isolate min-h-[46rem] overflow-hidden bg-[var(--ae-forest)] pt-16 text-[var(--ae-white)] sm:min-h-[52rem]">
        <motion.div aria-hidden="true" className="absolute -inset-y-[5%] inset-x-0" style={reducedMotion ? undefined : { y: heroY }}>
          {drop.image ? <Image src={drop.image} alt="" fill priority sizes="100vw" className="object-cover opacity-55" /> : null}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.96),rgba(0,0,0,.68)_50%,rgba(0,0,0,.34))]" />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(0deg,rgba(0,0,0,.95),transparent)]" />
        </motion.div>
        <div className="ae-container relative flex min-h-[calc(46rem-4rem)] flex-col justify-end pb-9 pt-20 sm:min-h-[calc(52rem-4rem)] md:pb-12">
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 28 }} animate={reducedMotion ? undefined : { opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--ae-gilt)]">{drop.eyebrow}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <StatusBadge status={soldOut ? "sold-out" : drop.status} />
              <span className="text-xs font-medium uppercase tracking-[.12em] text-white/60">Limited batch · {drop.batchSize} objects</span>
            </div>
            <h1 className="ae-display mt-5 max-w-5xl text-[clamp(4.25rem,12vw,7.5rem)] font-light leading-[.78] tracking-[-.035em] text-[var(--ae-white)]">
              {drop.title}
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">{drop.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {!closed ? <Button asChild size="lg" variant={drop.cta.style === "primary" ? "default" : drop.cta.style === "secondary" ? "outline" : "link"} className={cn(drop.cta.style === "primary" && "bg-[var(--ae-white)] text-[var(--ae-forest)] hover:bg-[var(--ae-fog)]", drop.cta.style === "secondary" && "border-white/35 text-white hover:border-[var(--ae-gilt)] hover:bg-transparent hover:text-[var(--ae-gilt)]", drop.cta.style === "text" && "text-white hover:text-[var(--ae-gilt)]")}><a href={safeHref(drop.cta.href)}>{drop.cta.label}<ArrowDown className="size-4" aria-hidden="true" /></a></Button> : <Button asChild size="lg" className="bg-[var(--ae-white)] text-[var(--ae-forest)] hover:bg-[var(--ae-fog)]"><Link href="/shop">Explore other editions<ArrowUpRight className="size-4" aria-hidden="true" /></Link></Button>}
              <Button asChild size="lg" variant="outline" className="border-white/35 text-white hover:border-[var(--ae-gilt)] hover:text-[var(--ae-gilt)]"><a href="#impact">See where it goes</a></Button>
            </div>
          </motion.div>
          <div className="mt-10 grid gap-3 border-t border-white/20 pt-5 sm:grid-cols-3">
            <div><p className="text-xs uppercase tracking-[.13em] text-white/50">Edition status</p><p className="mt-1 font-medium">{soldOut ? "All objects reserved" : `${remaining} objects remaining`}</p></div>
            <div><p className="text-xs uppercase tracking-[.13em] text-white/50">Artist</p><p className="mt-1 font-medium">{drop.artist.name}</p></div>
            <div><p className="text-xs uppercase tracking-[.13em] text-white/50">Partner</p><p className="mt-1 font-medium">{drop.cause.name}</p></div>
          </div>
        </div>
      </section>

      <section aria-label="Batch availability" className="border-b border-[var(--border)] bg-[var(--ae-white)]">
        <div className="ae-container grid gap-7 py-7 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center justify-between gap-5 text-sm"><span className="font-medium text-[var(--ae-forest)]">{soldOut ? "This batch is fully reserved" : `${drop.reserved} of ${drop.batchSize} objects reserved`}</span><span className="shrink-0 tabular-nums text-[var(--ae-stone)]">{Math.round((drop.reserved / drop.batchSize) * 100)}%</span></div>
            <div className="mt-3 h-1.5 overflow-hidden bg-[var(--ae-fog)]"><motion.div initial={reducedMotion ? false : { width: 0 }} whileInView={reducedMotion ? undefined : { width: `${Math.min(100, (drop.reserved / drop.batchSize) * 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.85, ease: MOTION_EASE }} className="h-full bg-[var(--ae-gilt)]" style={reducedMotion ? { width: `${Math.min(100, (drop.reserved / drop.batchSize) * 100)}%` } : undefined} /></div>
          </div>
          <DropCountdown opensAt={drop.opensAt} closesAt={drop.closesAt} isClosed={closed} />
        </div>
      </section>

      <section id="editions" className="ae-section bg-[var(--ae-parchment)] scroll-mt-16">
        <motion.div {...reveal} className="ae-container">
          <SectionHeading eyebrow="01 / The objects" title="An artwork made to move through daily life." body="Every piece carries the commissioned work intact, numbered as part of this batch and paired with a direct route to the field." />
          {drop.products.length ? <div className="mt-12 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{drop.products.map((product) => <ProductCard key={product.slug} product={product} dropUnavailable={closed} />)}</div> : <p className="mt-10 border-y border-[var(--border)] py-8 text-sm text-[var(--muted-foreground)]">The editions for this batch are being prepared. Please return soon.</p>}
        </motion.div>
      </section>

      <section id="design" className="bg-[var(--ae-fog)] py-[var(--ae-space-section)] scroll-mt-16">
        <motion.div {...reveal} className="ae-container grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--ae-stone)]">{drop.artwork.image ? <Image src={drop.artwork.image} alt={drop.artwork.imageAlt} fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /> : null}</div>
          <div className="lg:pl-8"><SectionHeading eyebrow="02 / The artwork" title={drop.artwork.title} body={drop.artwork.summary} /><p className="mt-6 text-sm font-medium text-[var(--ae-forest)]">{drop.artwork.artistLine}</p><div className="mt-9 divide-y divide-[var(--border)] border-y border-[var(--border)]">{drop.artwork.details.map((detail, index) => <div key={`${detail.label}-${detail.title}`} className="grid grid-cols-[2rem_1fr] gap-4 py-4"><span className="text-xs font-semibold text-[var(--ae-gilt)]">{detail.label || String(index + 1).padStart(2, "0")}</span><div><h3 className="font-medium text-[var(--ae-forest)]">{detail.title}</h3><p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{detail.body}</p></div></div>)}</div></div>
        </motion.div>
        {drop.artworks.length > 1 ? (
          <motion.div {...reveal} className="ae-container mt-12">
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[var(--ae-gilt)]">More from this batch</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {drop.artworks.slice(1).map((item) => (
                <article key={item.title} className="overflow-hidden border border-[var(--border)] bg-[var(--ae-white)]">
                  <div className="relative aspect-[4/5] bg-[var(--ae-fog)]">
                    {item.image ? (
                      <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="p-5">
                    <h3 className="ae-display text-3xl font-medium leading-none text-[var(--ae-forest)]">{item.title}</h3>
                    <p className="mt-3 text-sm text-[var(--muted-foreground)]">{item.artistLine}</p>
                    <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">{item.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </motion.div>
        ) : null}
      </section>

      <section id="artist" className="bg-[var(--ae-forest)] py-[var(--ae-space-section)] text-[var(--ae-white)] scroll-mt-16">
        <motion.div {...reveal} className="ae-container grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end"><div className="relative aspect-[4/5] overflow-hidden bg-[var(--ae-forest-soft)]">{drop.artist.image ? <Image src={drop.artist.image} alt={drop.artist.imageAlt} fill sizes="(max-width: 1024px) 100vw, 38vw" className="object-cover" /> : null}</div><div className="lg:pb-4"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[var(--ae-gilt)]">03 / The artist</p><h2 className="ae-display mt-4 text-6xl font-light leading-[.86] sm:text-7xl">{drop.artist.name}</h2><p className="mt-4 text-sm uppercase tracking-[.12em] text-white/55">{drop.artist.role}</p><blockquote className="ae-display mt-10 max-w-2xl text-3xl leading-[1.04] text-white/90 sm:text-4xl">“{drop.artist.quote}”</blockquote><p className="mt-7 max-w-xl text-base leading-7 text-white/70">{drop.artist.bio}</p><dl className="mt-10 grid gap-5 border-t border-white/20 pt-6 sm:grid-cols-3">{drop.artist.facts.map((fact) => <div key={fact.label}><dt className="text-xs uppercase tracking-[.12em] text-white/45">{fact.label}</dt><dd className="mt-2 text-sm text-white/90">{fact.value}</dd></div>)}</dl></div></motion.div>
      </section>

      {drop.gallery.length ? <section aria-labelledby="drop-gallery-title" className="bg-[var(--ae-white)] py-[var(--ae-space-section)]"><motion.div {...reveal} className="ae-container"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[var(--ae-gilt)]">Field notes</p><h2 id="drop-gallery-title" className="ae-display mt-4 max-w-2xl text-5xl font-light leading-[.88] text-[var(--ae-forest)] sm:text-6xl">Inside the making of this batch.</h2><div className="mt-10 grid gap-5 md:grid-cols-2">{drop.gallery.map((image, index) => <figure key={`${image.src}-${index}`} className={cn("group", index % 3 === 0 && "md:col-span-2")}><div className={cn("relative overflow-hidden bg-[var(--ae-fog)]", index % 3 === 0 ? "aspect-[16/9]" : "aspect-[4/5]")}><Image src={image.src} alt={image.alt} fill sizes={index % 3 === 0 ? "(max-width: 768px) 100vw, 90vw" : "(max-width: 768px) 100vw, 45vw"} className="object-cover transition duration-700 group-hover:scale-[1.02]" /></div>{image.caption ? <figcaption className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">{image.caption}</figcaption> : null}</figure>)}</div></motion.div></section> : null}

      <section id="cause" className="bg-[var(--ae-parchment)] py-[var(--ae-space-section)] scroll-mt-16"><motion.div {...reveal} className="ae-container grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[var(--ae-gilt)]">04 / The cause</p><h2 className="ae-display mt-4 max-w-lg text-6xl font-light leading-[.86] text-[var(--ae-forest)]">{drop.cause.name}</h2><p className="mt-5 text-sm font-medium uppercase tracking-[.1em] text-[var(--ae-stone)]">{drop.cause.focus}</p><p className="mt-7 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">{drop.cause.summary}</p><div className="mt-10 grid gap-5">{drop.cause.metrics.map((metric) => <MetricProgress key={metric.label} {...metric} reducedMotion={reducedMotion} />)}</div></div><div className="relative aspect-[5/4] overflow-hidden bg-[var(--ae-fog)]">{drop.cause.image ? <Image src={drop.cause.image} alt={drop.cause.imageAlt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /> : null}</div></motion.div></section>

      <section id="impact" className="bg-[var(--ae-onyx)] py-[var(--ae-space-section)] text-[var(--ae-white)] scroll-mt-16"><motion.div {...reveal} className="ae-container"><div className="grid gap-7 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[var(--ae-gilt)]">05 / The impact</p><h2 className="ae-display mt-4 text-6xl font-light leading-[.86]">A batch with a public ledger.</h2><p className="mt-7 max-w-md leading-7 text-white/65">The allocation is set before the editions leave the studio. As the batch closes, the field updates make the route from object to outcome visible.</p></div><div className="border-y border-white/15">{drop.allocation.map((item) => <div key={item.label} className="grid grid-cols-[3.25rem_1fr] gap-4 border-b border-white/15 py-5 last:border-0"><span className="ae-display text-4xl text-[var(--ae-gilt)]">{item.percentage}%</span><div><h3 className="font-medium">{item.label}</h3>{item.description ? <p className="mt-1 text-sm leading-6 text-white/60">{item.description}</p> : null}</div></div>)}</div></div>{allocationTotal > 0 && allocationTotal !== 100 ? <p className="mt-5 text-xs text-white/45">Allocation shown: {allocationTotal}%.</p> : null}<div className="mt-12 grid gap-px border border-white/15 bg-white/15 sm:grid-cols-3">{drop.milestones.map((milestone) => <div key={milestone.label} className="bg-[var(--ae-onyx)] p-6"><Check className="size-4 text-[var(--ae-gilt)]" aria-hidden="true" /><p className="mt-7 text-xs uppercase tracking-[.12em] text-white/45">{milestone.label}</p><p className="mt-2 text-lg">{milestone.value}</p><div className="mt-5 h-px bg-white/15"><div className="h-full bg-[var(--ae-gilt)]" style={{ width: `${milestone.progress}%` }} /></div></div>)}</div></motion.div></section>
    </>
  );
}

function ProductCard({ product, dropUnavailable }: { product: DropShowcase["products"][number]; dropUnavailable: boolean }) {
  const soldOut = dropUnavailable || productIsSoldOut(product);
  return <article className="group"><Link href={`/shop/${product.slug}`} aria-label={soldOut ? `${product.name} — sold out` : product.name} className="focus-ring block rounded-sm"><div className="relative aspect-[4/5] overflow-hidden bg-[var(--ae-fog)]">{product.image ? <Image src={product.image} alt={product.imageAlt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className={cn("object-cover transition duration-700 group-hover:scale-[1.025]", soldOut && "opacity-50 grayscale-[.2]")} /> : null}{soldOut ? <div className="absolute inset-0 grid place-items-center bg-[rgba(230,225,217,.65)]"><span className="border border-[var(--ae-forest)] bg-[var(--ae-parchment)] px-3 py-2 text-xs font-semibold uppercase tracking-[.13em] text-[var(--ae-forest)]">Sold out</span></div> : null}</div><div className="mt-4 flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[.12em] text-[var(--ae-stone)]">{product.form}</p><h3 className="ae-display mt-1 text-3xl font-medium leading-none text-[var(--ae-forest)]">{product.name}</h3><p className="mt-2 text-sm text-[var(--muted-foreground)]">{product.edition}</p></div><span className="shrink-0 text-sm font-medium text-[var(--ae-forest)]">{product.displayPrice}</span></div></Link></article>;
}

function productIsSoldOut(product: DropShowcase["products"][number]) {
  return product.availability === "out-of-stock" || !product.variants.some((variant) => variant.isAvailable);
}

function DropCountdown({ opensAt, closesAt, isClosed }: { opensAt?: string; closesAt?: string; isClosed: boolean }) {
  const opens = useMemo(() => opensAt ? new Date(opensAt).getTime() : 0, [opensAt]);
  const closes = useMemo(() => closesAt ? new Date(closesAt).getTime() : 0, [closesAt]);
  const [now, setNow] = useState(() => Date.now());
  const upcoming = Boolean(opens && opens > now);
  const target = upcoming ? opens : closes;
  useEffect(() => {
    if (!target || isClosed || target <= Date.now()) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= target) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isClosed, target]);
  if (isClosed || Boolean(closes && closes <= now)) return <div className="flex items-center gap-2 text-sm font-medium text-[var(--ae-forest)]"><Check className="size-4 text-[var(--ae-gilt)]" aria-hidden="true" />Batch closed</div>;
  if (!target) return <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]"><Clock3 className="size-4 text-[var(--ae-gilt)]" aria-hidden="true" />Limited batch</div>;
  const parts = durationParts(Math.max(0, target - now));
  if (!parts) return <div className="flex items-center gap-2 text-sm font-medium text-[var(--ae-forest)]"><Check className="size-4 text-[var(--ae-gilt)]" aria-hidden="true" />Batch closed</div>;
  return <div aria-live="polite" aria-label={`${upcoming ? "Opens" : "Closes"} in ${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes, and ${parts.seconds} seconds`} className="flex items-center gap-3"><Clock3 className="size-4 text-[var(--ae-gilt)]" aria-hidden="true" /><span className="text-xs font-medium uppercase tracking-[.1em] text-[var(--ae-stone)]">{upcoming ? "Opens in" : "Closes in"}</span><div aria-hidden="true" className="flex gap-3 tabular-nums text-[var(--ae-onyx)]">{([['D', parts.days], ['H', parts.hours], ['M', parts.minutes], ['S', parts.seconds]] as const).map(([label, value]) => <span key={label} className="text-center"><span className="block text-lg font-semibold leading-none">{String(value).padStart(2, "0")}</span><span className="mt-1 block text-[.6rem] font-semibold tracking-[.12em] text-[var(--ae-stone)]">{label}</span></span>)}</div></div>;
}

function durationParts(milliseconds: number) { if (milliseconds <= 0) return null; const seconds = Math.floor(milliseconds / 1000); return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 }; }
function StatusBadge({ status }: { status: DropShowcase["status"] }) { const labels = { draft: "In preparation", preview: "Preview", live: "Live now", "sold-out": "Sold out", closed: "Closed" }; return <span className="border border-[var(--ae-gilt)] px-2.5 py-1 text-[.65rem] font-semibold uppercase tracking-[.14em] text-[var(--ae-gilt)]">{labels[status]}</span>; }
function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) { return <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[var(--ae-gilt)]">{eyebrow}</p><h2 className="ae-display mt-4 text-5xl font-light leading-[.88] text-[var(--ae-forest)] sm:text-6xl">{title}</h2><p className="mt-6 text-base leading-7 text-[var(--muted-foreground)]">{body}</p></div>; }
function MetricProgress({ label, progress, reducedMotion, value }: { label: string; progress: number; reducedMotion: boolean | null; value: string }) { return <div><div className="flex justify-between gap-4 text-sm"><span className="text-[var(--ae-forest)]">{label}</span><span className="text-[var(--ae-stone)]">{value}</span></div><div className="mt-3 h-px bg-[var(--border)]"><motion.div initial={reducedMotion ? false : { width: 0 }} whileInView={reducedMotion ? undefined : { width: `${progress}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: MOTION_EASE }} className="h-full bg-[var(--ae-gilt)]" style={reducedMotion ? { width: `${progress}%` } : undefined} /></div></div>; }
function safeHref(href: string) { return href.startsWith("#") || (href.startsWith("/") && !href.startsWith("//")) ? href : "#editions"; }
