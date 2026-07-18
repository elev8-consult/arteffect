"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform
} from "framer-motion";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  HandHeart,
  Instagram,
  Layers3,
  Leaf,
  Palette,
  Send,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { sectionReveal as sectionMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type {
  Artist,
  Artwork,
  Cause,
  Drop,
  ImpactStat,
  Product,
  Testimonial
} from "@/types/showcase";

type HomeExperienceProps = {
  products: Product[];
  drop: Drop;
  artwork: Artwork;
  artist: Artist;
  cause: Cause;
  impactStats: ImpactStat[];
  testimonials: Testimonial[];
};

const instagramPosts = [
  {
    image:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=85",
    alt: "Artist supplies arranged on a sunlit studio table",
    label: "In the studio"
  },
  {
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=85",
    alt: "Mountain landscape viewed through native trees",
    label: "Field notes"
  },
  {
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=85",
    alt: "A hand writing beside an ink drawing",
    label: "The first mark"
  },
  {
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85",
    alt: "Hikers walking along a quiet green ridge",
    label: "Where it returns"
  }
] as const;

export function HomeExperience({
  products,
  drop,
  artwork,
  artist,
  cause,
  impactStats,
  testimonials
}: HomeExperienceProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id);
  const [selectedDetailIndex, setSelectedDetailIndex] = useState(0);
  const [newsletterState, setNewsletterState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const shouldReduceMotion = useReducedMotion();
  const { addItem } = useCart();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ?? products[0];
  const selectedDetail = artwork.details[selectedDetailIndex] ?? artwork.details[0];

  async function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");

    if (typeof email !== "string" || !email) {
      return;
    }

    setNewsletterState("submitting");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "homepage",
          consent: { acceptedMarketing: true, acceptedAt: new Date().toISOString() }
        })
      });

      if (!response.ok) {
        throw new Error("Newsletter signup failed");
      }

      form.reset();
      setNewsletterState("success");
    } catch {
      setNewsletterState("error");
    }
  }

  return (
    <main id="main-content">
      <section
        ref={heroRef}
        className="relative min-h-[92svh] overflow-hidden bg-[var(--ae-forest)] pt-16 text-[var(--ae-white)]"
      >
        <motion.div
          aria-hidden="true"
          className="absolute -inset-y-[12%] inset-x-0"
          style={shouldReduceMotion ? undefined : { y: heroY }}
        >
          <Image
            src={drop.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-[0.62]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.95),rgba(0,0,0,0.55),rgba(0,0,0,0.2))]" />
        </motion.div>
        <div className="ae-container relative flex min-h-[calc(92svh-4rem)] items-end pb-10 pt-28">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 26 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <p className="ae-kicker text-[var(--ae-gilt)]">Limited art objects</p>
            <h1 className="ae-display mt-5 max-w-4xl text-6xl font-semibold leading-[0.9] md:text-8xl lg:text-9xl">
              Art Meets Impact
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/[0.76] md:text-xl">
              Limited editions that turn commissioned artwork into collectable
              objects, artist royalties, and visible NGO impact.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[var(--ae-white)] text-[var(--ae-forest)] hover:bg-[var(--ae-fog)]">
                <a href="#products">
                  Explore objects
                  <ChevronRight aria-hidden="true" size={18} />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/[0.35] text-white hover:border-[var(--ae-gilt)] hover:text-[var(--ae-gilt)]"
              >
                <a href="#impact">
                  See impact
                  <ArrowUpRight aria-hidden="true" size={18} />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
        <div className="ae-container relative grid gap-3 pb-6 md:grid-cols-3">
          {[
            ["Drop", drop.eyebrow],
            ["Reserved", `${drop.reserved} of ${drop.batchSize}`],
            ["Cause", cause.name]
          ].map(([label, value]) => (
            <div
              key={label}
              className="border-t border-white/[0.18] py-4 text-sm text-white/[0.68]"
            >
              <span className="block text-xs uppercase text-white/[0.45]">
                {label}
              </span>
              <span className="mt-1 block text-base font-semibold text-white">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section id="products" className="ae-section bg-[var(--ae-parchment)]">
        <div className="ae-container">
          <SectionIntro
            eyebrow="01 Products"
            title="Objects that carry the artwork without losing the work."
            body="Each product is treated as an edition surface: tactile, numbered, and ready for commerce without feeling like a generic catalog tile."
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="grid gap-3">
              {products.map((product) => {
                const isSelected = product.id === selectedProduct.id;

                return (
                  <button
                    key={product.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedProductId(product.id)}
                    className={cn(
                      "focus-ring group grid grid-cols-[5.5rem_1fr_auto] items-center gap-4 rounded-md border bg-transparent p-3 text-left transition",
                      isSelected
                        ? "border-[var(--ae-gilt)] bg-white/50"
                        : "border-[var(--border)] hover:border-[var(--ae-stone)]"
                    )}
                  >
                    <span className="relative block aspect-[4/5] overflow-hidden rounded-md bg-[var(--ae-fog)]">
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="88px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[var(--ae-forest)]">
                        {product.name}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--muted-foreground)]">
                        {product.form}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-[var(--ae-gilt)]">
                      {product.price}
                    </span>
                  </button>
                );
              })}
            </div>
            <AnimatePresence mode="wait">
              <motion.article
                key={selectedProduct.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -18 }}
                transition={{ duration: 0.38 }}
                className="grid gap-6 md:grid-cols-[0.95fr_1fr] md:items-end"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-[var(--ae-fog)]">
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 48vw"
                    className="object-cover"
                  />
                </div>
                <div className="pb-2">
                  <Badge>{selectedProduct.edition}</Badge>
                  <h2 className="ae-display mt-5 text-5xl font-semibold leading-none text-[var(--ae-forest)] md:text-6xl">
                    {selectedProduct.name}
                  </h2>
                  <p className="mt-5 text-base leading-7 text-[var(--muted-foreground)]">
                    {selectedProduct.story}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-2">
                    {selectedProduct.materials.map((material) => (
                      <span
                        key={material}
                        className="rounded-md bg-[var(--ae-fog)] px-3 py-2 text-sm text-[var(--ae-forest)]"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                  <Button
                    className="mt-8"
                    type="button"
                    onClick={() => addItem({
                      id: selectedProduct.id,
                      productId: selectedProduct.id,
                      variantId: selectedProduct.defaultVariantId,
                      image: selectedProduct.image,
                      imageAlt: selectedProduct.imageAlt,
                      name: selectedProduct.name,
                      price: selectedProduct.price
                    })}
                  >
                    <ShoppingBag aria-hidden="true" size={18} />
                    Reserve edition
                  </Button>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <motion.section
        id="drop"
        className="ae-section bg-[var(--ae-forest)] text-[var(--ae-white)]"
        {...sectionMotion}
      >
        <div className="ae-container grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="ae-kicker">{drop.eyebrow}</p>
            <h2 className="ae-display mt-4 text-5xl font-semibold leading-none md:text-7xl">
              {drop.title}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/70">
              {drop.summary}
            </p>
            <dl className="mt-9 grid grid-cols-3 gap-3 border-y border-white/[0.16] py-5">
              <Metric label="Batch" value={String(drop.batchSize)} />
              <Metric label="Reserved" value={String(drop.reserved)} />
              <Metric label="Closes" value={drop.closesAt} />
            </dl>
            <Link href={`/drops/${drop.slug}`} className="focus-ring mt-7 inline-flex items-center gap-2 border-b border-[var(--ae-gilt)] pb-1 text-sm font-medium text-[var(--ae-white)] transition hover:text-[var(--ae-gilt)]">
              Enter the batch story
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="relative">
            <div className="relative aspect-[5/4] overflow-hidden rounded-md">
              <Image
                src={drop.image}
                alt={drop.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="mt-6 grid gap-4">
              {drop.milestones.map((milestone) => (
                <div key={milestone.label}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">{milestone.label}</span>
                    <span className="text-white/[0.58]">{milestone.value}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.14]">
                    <motion.div
                      initial={shouldReduceMotion ? false : { width: 0 }}
                      whileInView={shouldReduceMotion ? undefined : { width: `${milestone.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full bg-[var(--ae-gilt)]"
                      style={shouldReduceMotion ? { width: `${milestone.progress}%` } : undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <section id="design" className="ae-section bg-[var(--ae-white)]">
        <div className="ae-container">
          <SectionIntro
            eyebrow="03 Design"
            title={artwork.title}
            body={`${artwork.artistLine}. ${artwork.summary}`}
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="relative aspect-[6/5] overflow-hidden rounded-md bg-[var(--ae-fog)]">
              <Image
                src={artwork.image}
                alt={artwork.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
              {artwork.details.map((detail, index) => (
                <button
                  key={detail.label}
                  type="button"
                  aria-label={`View artwork detail ${detail.label}`}
                  aria-pressed={index === selectedDetailIndex}
                  onClick={() => setSelectedDetailIndex(index)}
                  className={cn(
                    "focus-ring absolute grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-sm font-bold transition",
                    index === selectedDetailIndex
                      ? "border-[var(--ae-gilt)] bg-[var(--ae-gilt)] text-[var(--ae-onyx)]"
                      : "border-white/70 bg-[rgba(0,0,0,0.58)] text-white hover:bg-[var(--ae-forest)]"
                  )}
                  style={{ left: `${detail.x}%`, top: `${detail.y}%` }}
                >
                  {detail.label}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDetail.label}
                initial={shouldReduceMotion ? false : { opacity: 0, x: 16 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, x: -16 }}
                transition={{ duration: 0.34 }}
                className="border-l border-[var(--border)] pl-6"
              >
                <Palette aria-hidden="true" className="text-[var(--ae-gilt)]" />
                <p className="ae-kicker mt-6">Artwork detail {selectedDetail.label}</p>
                <h3 className="ae-display mt-3 text-5xl font-semibold text-[var(--ae-forest)]">
                  {selectedDetail.title}
                </h3>
                <p className="mt-5 text-base leading-7 text-[var(--muted-foreground)]">
                  {selectedDetail.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <motion.section
        id="artist"
        className="ae-section bg-[var(--ae-parchment)]"
        {...sectionMotion}
      >
        <div className="ae-container grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-[var(--ae-fog)]">
            <Image
              src={artist.image}
              alt={artist.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="ae-kicker">04 Artist</p>
            <h2 className="ae-display mt-4 text-6xl font-semibold leading-none text-[var(--ae-forest)] md:text-8xl">
              {artist.name}
            </h2>
            <p className="mt-3 text-sm font-semibold uppercase text-[var(--ae-gilt)]">
              {artist.role}
            </p>
            <blockquote className="ae-display mt-8 max-w-3xl text-4xl font-medium leading-[1.05] text-[var(--ae-onyx)] md:text-5xl">
              "{artist.quote}"
            </blockquote>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              {artist.bio}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {artist.facts.map((fact) => (
                <div key={fact.label} className="border-t border-[var(--border)] pt-4">
                  <span className="block text-xs uppercase text-[var(--ae-stone)]">
                    {fact.label}
                  </span>
                  <span className="mt-2 block text-sm font-semibold text-[var(--ae-forest)]">
                    {fact.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <section id="cause" className="ae-section bg-[var(--ae-white)]">
        <div className="ae-container grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Badge className="bg-[var(--ae-parchment)]">05 NGO / Cause</Badge>
            <h2 className="ae-display mt-5 text-5xl font-semibold leading-none text-[var(--ae-forest)] md:text-7xl">
              {cause.name}
            </h2>
            <p className="mt-4 text-sm font-semibold uppercase text-[var(--ae-gilt)]">
              {cause.focus}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              {cause.summary}
            </p>
            <div className="mt-9 grid gap-5">
              {cause.metrics.map((metric) => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold text-[var(--ae-forest)]">
                      {metric.label}
                    </span>
                    <span className="text-[var(--muted-foreground)]">{metric.value}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--ae-fog)]">
                    <motion.div
                      initial={shouldReduceMotion ? false : { width: 0 }}
                      whileInView={shouldReduceMotion ? undefined : { width: `${metric.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-[var(--ae-forest)]"
                      style={shouldReduceMotion ? { width: `${metric.progress}%` } : undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-md bg-[var(--ae-fog)]">
            <Image
              src={cause.image}
              alt={cause.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section id="impact" className="ae-section overflow-hidden bg-[var(--ae-forest)] text-[var(--ae-white)]">
        <div className="ae-container">
          <SectionIntro
            eyebrow="06 Impact"
            title="The sale is only useful when the outcome is visible."
            body="Every drop is designed to publish a ledger of artist royalties, partner transfers, and field updates after the objects leave the studio."
            inverted
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-md border border-white/[0.12] bg-white/[0.12] md:grid-cols-3">
            {impactStats.map((stat) => (
              <div key={stat.label} className="bg-[var(--ae-forest)] p-6 md:p-8">
                <div className="flex items-center gap-3 text-[var(--ae-gilt)]">
                  {stat.metricType === "projected" ? (
                    <Leaf aria-hidden="true" size={20} />
                  ) : stat.metricType === "committed" ? (
                    <Sparkles aria-hidden="true" size={20} />
                  ) : stat.metricType === "verified" ? (
                    <Check aria-hidden="true" size={20} />
                  ) : (
                    <HandHeart aria-hidden="true" size={20} />
                  )}
                  <span className="text-xs font-bold uppercase">
                    {stat.label}
                  </span>
                </div>
                <p className="ae-display mt-8 text-6xl font-semibold leading-none md:text-7xl">
                  <AnimatedNumber
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </p>
                <p className="mt-5 text-sm leading-6 text-white/[0.62]">{stat.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-4 border-t border-white/[0.14] pt-7 md:grid-cols-[auto_1fr] md:items-center">
            <Layers3 aria-hidden="true" className="text-[var(--ae-gilt)]" />
            <p className="max-w-3xl text-sm leading-6 text-white/[0.64]">
              The impact story continues after checkout with batch reports,
              partner updates, and survival-rate notes tied back to the exact
              edition that funded them.
            </p>
          </div>
        </div>
      </section>

      <section id="voices" className="ae-section bg-[var(--ae-parchment)]">
        <div className="ae-container">
          <SectionIntro
            eyebrow="07 In their words"
            title="Made to be kept. Meant to be felt beyond the object."
            body="Collectors, collaborators, and partners share the same expectation: the story should be as carefully made as the edition itself."
          />
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.figure
                key={testimonial.name}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-72 flex-col justify-between rounded-md border border-[var(--border)] bg-[var(--ae-white)] p-6 shadow-[var(--ae-shadow-card)] md:p-8"
              >
                <blockquote className="ae-display text-3xl font-medium leading-[1.08] text-[var(--ae-forest)]">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-8 border-t border-[var(--border)] pt-4">
                  <span className="block text-sm font-semibold text-[var(--ae-forest)]">
                    {testimonial.name}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--muted-foreground)]">
                    {testimonial.role}
                  </span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      <section id="journal" className="ae-section overflow-hidden bg-[var(--ae-white)]">
        <div className="ae-container">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="ae-kicker">08 Follow the work</p>
              <h2 className="ae-display mt-4 text-5xl font-semibold leading-none text-[var(--ae-forest)] md:text-7xl">
                From first mark to field report.
              </h2>
            </div>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex w-fit items-center gap-2 rounded-md border-b border-[var(--ae-gilt)] pb-1 text-sm font-semibold text-[var(--ae-forest)] transition hover:text-[var(--ae-gilt)]"
            >
              <Instagram aria-hidden="true" size={17} />
              Follow @arteffect
              <ArrowUpRight aria-hidden="true" size={16} />
            </a>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {instagramPosts.map((post, index) => (
              <motion.a
                key={post.label}
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="focus-ring group relative aspect-square overflow-hidden rounded-md bg-[var(--ae-fog)]"
                aria-label={`View ${post.label} on Instagram`}
              >
                <Image
                  src={post.image}
                  alt={post.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition duration-700 ease-[var(--ae-ease-out)] group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgba(14,14,14,0.72))] px-4 pb-4 pt-12 text-sm font-medium text-white opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  {post.label}
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <section id="newsletter" className="bg-[var(--ae-forest)] py-[clamp(4.5rem,10vw,8rem)] text-[var(--ae-white)]">
        <div className="ae-container grid gap-9 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <motion.div {...sectionMotion}>
            <p className="ae-kicker">Stay close</p>
            <h2 className="ae-display mt-4 max-w-3xl text-5xl font-semibold leading-none md:text-7xl">
              A quieter kind of inbox.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/[0.68]">
              New editions, studio notes, and the field updates that close the loop on every drop. Sent when there is something worth sharing.
            </p>
          </motion.div>
          <motion.form
            {...sectionMotion}
            onSubmit={handleNewsletterSubmit}
            className="rounded-md border border-white/[0.16] bg-white/[0.06] p-5 md:p-6"
          >
            <label htmlFor="newsletter-email" className="text-sm font-semibold text-white">
              Email address
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                disabled={newsletterState === "submitting" || newsletterState === "success"}
                className="focus-ring h-12 min-w-0 flex-1 rounded-md border border-white/[0.22] bg-white/[0.96] px-4 text-sm text-[var(--ae-onyx)] placeholder:text-[var(--ae-stone)] disabled:cursor-not-allowed disabled:opacity-70"
              />
              <Button
                type="submit"
                size="lg"
                loading={newsletterState === "submitting"}
                loadingLabel="Joining"
                disabled={newsletterState === "success"}
                className="bg-[var(--ae-gilt)] text-[var(--ae-onyx)] shadow-none hover:bg-[#b49d68]"
              >
                {newsletterState === "success" ? <Check aria-hidden="true" size={18} /> : <Send aria-hidden="true" size={17} />}
                {newsletterState === "success" ? "You’re on the list" : "Join the list"}
              </Button>
            </div>
            <p className="mt-4 text-xs leading-5 text-white/[0.58]" aria-live="polite">
              {newsletterState === "success"
                ? "Thank you. Look out for a note from us soon."
                : newsletterState === "error"
                  ? "We could not save your email. Please try again."
                  : "By joining, you agree to receive ArtEffect updates. You can unsubscribe at any time."}
            </p>
          </motion.form>
        </div>
      </section>
    </main>
  );
}

function SectionIntro({
  body,
  eyebrow,
  inverted = false,
  title
}: {
  body: string;
  eyebrow: string;
  inverted?: boolean;
  title: string;
}) {
  return (
    <motion.div
      {...sectionMotion}
      className="grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:items-end"
    >
      <div>
        <p className="ae-kicker">{eyebrow}</p>
        <h2
          className={cn(
            "ae-display mt-4 max-w-3xl text-5xl font-semibold leading-none md:text-7xl",
            inverted ? "text-white" : "text-[var(--ae-forest)]"
          )}
        >
          {title}
        </h2>
      </div>
      <p
        className={cn(
          "max-w-2xl text-base leading-7",
          inverted ? "text-white/[0.68]" : "text-[var(--muted-foreground)]"
        )}
      >
        {body}
      </p>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-white/[0.45]">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}
