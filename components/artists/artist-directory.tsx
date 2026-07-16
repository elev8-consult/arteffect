"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { heroReveal, sectionReveal } from "@/lib/motion";
import type { ArtistDirectoryItem } from "@/types/artist";

type ArtistDirectoryProps = { artists: ArtistDirectoryItem[] };

export function ArtistDirectory({ artists }: ArtistDirectoryProps) {
  const [activeSlug, setActiveSlug] = useState<string>();
  const reducedMotion = useReducedMotion();

  return (
    <main id="main-content" className="min-h-screen bg-[var(--ae-parchment)] pt-16">
      <section className="border-b border-[var(--border)] bg-[var(--ae-forest)] text-[var(--ae-white)]">
        <div className="ae-container grid min-h-[min(39rem,calc(100svh-4rem))] content-end py-14 sm:py-20">
          <motion.div
            initial={reducedMotion ? false : heroReveal.initial}
            animate={reducedMotion ? undefined : heroReveal.animate}
            transition={heroReveal.transition}
            className="max-w-4xl"
          >
            <p className="ae-kicker">The artists</p>
            <h1 className="ae-display mt-5 text-[clamp(4.8rem,14vw,9rem)] font-light leading-[.73] tracking-[-.045em]">
              Work with a<br />
              point of view.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
              ArtEffect commissions artists whose practice makes a living connection between the object, the place, and the people it can support.
            </p>
          </motion.div>
        </div>
      </section>

      <section aria-labelledby="artist-directory-title" className="ae-section">
        <div className="ae-container">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
            <div>
              <p className="ae-kicker">Current and forthcoming</p>
              <h2 id="artist-directory-title" className="ae-display mt-2 text-4xl font-light text-[var(--ae-forest)] sm:text-5xl">Meet the studio.</h2>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{artists.length} artists in the programme</p>
          </div>

          {artists.length ? (
            <div className="mt-8 grid gap-px overflow-hidden border border-[var(--border)] bg-[var(--border)] md:grid-cols-2 lg:grid-cols-3">
              {artists.map((artist, index) => {
                const active = activeSlug === artist.slug;
                return (
                  <motion.article
                    key={artist.slug}
                    initial={reducedMotion ? false : sectionReveal.initial}
                    whileInView={reducedMotion ? undefined : sectionReveal.whileInView}
                    viewport={sectionReveal.viewport}
                    transition={{ ...sectionReveal.transition, delay: index * 0.06 }}
                    onFocus={() => setActiveSlug(artist.slug)}
                    onMouseEnter={() => setActiveSlug(artist.slug)}
                    onMouseLeave={() => setActiveSlug(undefined)}
                    className="group bg-[var(--ae-fog)]"
                  >
                    <Link href={`/artists/${artist.slug}`} className="focus-ring block h-full p-4 sm:p-5" aria-label={`View ${artist.name}'s profile`}>
                      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--ae-stone)]">
                        {artist.image ? <Image src={artist.image.src} alt={artist.image.alt} fill sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-cover grayscale-[.18] transition duration-700 ease-out group-hover:scale-[1.035] group-hover:grayscale-0" /> : null}
                        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(0deg,rgba(14,14,14,.45),transparent)]" />
                        <span className={`absolute bottom-4 left-4 h-px w-12 origin-left bg-[var(--ae-gilt)] transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0"}`} />
                      </div>
                      <div className="flex items-start justify-between gap-3 pt-5">
                        <div>
                          <h3 className="ae-display text-4xl font-medium leading-none text-[var(--ae-forest)]">{artist.name}</h3>
                          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{artist.role}</p>
                          {artist.location ? <p className="mt-1 text-xs uppercase tracking-[.11em] text-[var(--ae-stone)]">{artist.location}</p> : null}
                        </div>
                        <ArrowUpRight className={`mt-1 size-5 shrink-0 text-[var(--ae-gilt)] transition-transform duration-300 ${active ? "translate-x-0.5 -translate-y-0.5" : ""}`} aria-hidden="true" />
                      </div>
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          ) : <p className="py-12 text-sm text-[var(--muted-foreground)]">Artist profiles are being prepared. Please return soon.</p>}
        </div>
      </section>
    </main>
  );
}
