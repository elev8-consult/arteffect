"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { heroReveal, sectionReveal } from "@/lib/motion";
import type { CauseDirectoryItem } from "@/types/cause";

type CauseDirectoryProps = { causes: CauseDirectoryItem[] };

export function CauseDirectory({ causes }: CauseDirectoryProps) {
  const [activeSlug, setActiveSlug] = useState<string>();
  const reducedMotion = useReducedMotion();

  return (
    <main id="main-content" className="min-h-screen bg-[var(--ae-parchment)] pt-16">
      <section className="border-b border-white/10 bg-[var(--ae-forest)] text-[var(--ae-white)]">
        <div className="ae-container grid min-h-[min(39rem,calc(100svh-4rem))] content-end py-14 sm:py-20">
          <motion.div initial={reducedMotion ? false : heroReveal.initial} animate={reducedMotion ? undefined : heroReveal.animate} transition={heroReveal.transition} className="max-w-4xl">
            <p className="ae-kicker">The cause partners</p>
            <h1 className="ae-display mt-5 text-[clamp(4.8rem,14vw,9rem)] font-light leading-[.73] tracking-[-.045em]">Care made<br />collectable.</h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">Every ArtEffect drop is built with a specific partner and a visible allocation. Meet the organisations doing the patient work after an object leaves the studio.</p>
          </motion.div>
        </div>
      </section>

      <section aria-labelledby="cause-directory-title" className="ae-section">
        <div className="ae-container">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
            <div><p className="ae-kicker">Verified partnerships</p><h2 id="cause-directory-title" className="ae-display mt-2 text-4xl font-light text-[var(--ae-forest)] sm:text-5xl">The work in the field.</h2></div>
            <p className="text-sm text-[var(--muted-foreground)]">{causes.length} {causes.length === 1 ? "partner" : "partners"} in the programme</p>
          </div>

          {causes.length ? <div className="mt-8 grid gap-px overflow-hidden border border-[var(--border)] bg-[var(--border)] md:grid-cols-2 lg:grid-cols-3">
            {causes.map((cause, index) => {
              const active = activeSlug === cause.slug;
              return <motion.article key={cause.slug} initial={reducedMotion ? false : sectionReveal.initial} whileInView={reducedMotion ? undefined : sectionReveal.whileInView} viewport={sectionReveal.viewport} transition={{ ...sectionReveal.transition, delay: index * 0.06 }} onFocus={() => setActiveSlug(cause.slug)} onMouseEnter={() => setActiveSlug(cause.slug)} onMouseLeave={() => setActiveSlug(undefined)} className="group bg-[var(--ae-fog)]">
                <Link href={`/causes/${cause.slug}`} className="focus-ring block h-full p-4 sm:p-5" aria-label={`View ${cause.name}'s impact profile`}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-[var(--ae-stone)]">
                    {cause.image ? <Image src={cause.image.src} alt={cause.image.alt} fill sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]" /> : <div className="absolute inset-0 bg-[var(--ae-forest-soft)]" />}
                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(0deg,rgba(14,14,14,.45),transparent)]" />
                    <span aria-hidden="true" className={`absolute bottom-4 left-4 h-px w-12 origin-left bg-[var(--ae-gilt)] transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0"}`} />
                  </div>
                  <div className="pt-5"><div className="flex items-start justify-between gap-3"><div><h3 className="ae-display text-4xl font-medium leading-none text-[var(--ae-forest)]">{cause.name}</h3><p className="mt-2 text-xs font-medium uppercase tracking-[.11em] text-[var(--ae-stone)]">{cause.focus}</p></div><ArrowUpRight className={`mt-1 size-5 shrink-0 text-[var(--ae-gilt)] transition-transform duration-300 ${active ? "translate-x-0.5 -translate-y-0.5" : ""}`} aria-hidden="true" /></div><p className="mt-5 text-sm leading-6 text-[var(--muted-foreground)]">{cause.summary}</p>{cause.verificationStatus === "verified" ? <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ae-forest)]"><BadgeCheck className="size-4 text-[var(--ae-gilt)]" aria-hidden="true" />Verified partner</span> : null}</div>
                </Link>
              </motion.article>;
            })}
          </div> : <p className="py-12 text-sm text-[var(--muted-foreground)]">Cause partnerships are being prepared. Please return soon.</p>}
        </div>
      </section>
    </main>
  );
}
