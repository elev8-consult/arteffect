"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronRight,
  Heart,
  Maximize2,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
  ZoomIn
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShopProduct, ShopReview } from "@/types/shop";

type ProductExperienceProps = {
  product: ShopProduct;
  products: ShopProduct[];
  related: ShopProduct[];
  reviews: ShopReview[];
};

const dialogFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

const colorStyles: Record<string, string> = {
  beige: "#c8b89f",
  black: "#171717",
  green: "#536b58",
  multicolor: "linear-gradient(135deg,#536b58 0 33%,#a08b5a 33% 66%,#8b6666 66%)",
  "off-white": "#f7f2e9",
  white: "#fffaf2"
};

export function ProductExperience({ product, products, related, reviews }: ProductExperienceProps) {
  const { addItem } = useCart();
  const reducedMotion = useReducedMotion();
  const availableVariants = useMemo(
    () => product.variants.filter((variant) => variant.isAvailable),
    [product.variants]
  );
  const [selectedVariantId, setSelectedVariantId] = useState(availableVariants[0]?.id ?? "");
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wishlistStatus, setWishlistStatus] = useState("");
  const [recent, setRecent] = useState<ShopProduct[]>([]);
  const wishlistMutation = useRef(0);
  const selected = availableVariants.find((variant) => variant.id === selectedVariantId);
  const gallery = product.gallery.filter((image) => Boolean(image.src));

  useEffect(() => {
    let active = true;
    const mutationAtStart = wishlistMutation.current;
    const savedItems = readLocalWishlist();
    queueMicrotask(() => {
      if (active) setSaved(savedItems.has(product.slug));
    });

    fetch("/api/wishlist", { headers: { Accept: "application/json" } })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!active || wishlistMutation.current !== mutationAtStart || !Array.isArray(body?.data)) return;
        const accountWishlist = new Set<string>(
          body.data.map((item: ShopProduct) => String(item.slug))
        );
        setSaved(accountWishlist.has(product.slug));
        writeLocalWishlist(accountWishlist);
      })
      .catch(() => undefined);

    try {
      const previous = JSON.parse(window.localStorage.getItem("arteffect-recently-viewed") ?? "[]");
      const next = [product.slug, ...(Array.isArray(previous) ? previous : []).filter((id) => id !== product.slug)]
        .filter((id): id is string => typeof id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && id.length <= 100)
        .filter((id, index, values) => values.indexOf(id) === index)
        .slice(0, 8);
      const recentIds = next.slice(1, 4);
      window.localStorage.setItem("arteffect-recently-viewed", JSON.stringify(next));
      const availableLocally = recentIds
        .map((id) => products.find((item) => item.slug === id))
        .filter((item): item is ShopProduct => Boolean(item));
      queueMicrotask(() => {
        if (!active) return;
        setRecent(availableLocally);
      });

      Promise.all(recentIds.map(fetchProduct))
        .then((items) => {
          if (active) setRecent(items.filter((item): item is ShopProduct => Boolean(item)));
        })
        .catch(() => undefined);
    } catch {
      queueMicrotask(() => {
        if (active) setRecent([]);
      });
    }
    return () => { active = false; };
  }, [product.slug, products]);

  function optionIsAvailable(option: "color" | "size", value: string) {
    return availableVariants.some((variant) => variant[option] === value);
  }

  function chooseOption(option: "color" | "size", value: string) {
    const current = selected;
    const next = availableVariants.find((variant) =>
      variant[option] === value && (option === "color" ? !current?.size || variant.size === current.size : !current?.color || variant.color === current.color)
    ) ?? availableVariants.find((variant) => variant[option] === value);
    if (next) setSelectedVariantId(next.id);
  }

  function addToBag() {
    if (!selected) return;
    addItem({
      id: `${product.id}:${selected.id}`,
      productId: product.slug,
      variantId: selected.id,
      image: gallery[activeImage]?.src || product.image,
      imageAlt: gallery[activeImage]?.alt || product.imageAlt,
      name: `${product.name} — ${selected.name}`,
      price: formatMoney(selected.price, product.currency)
    });
  }

  async function toggleWishlist() {
    const next = !saved;
    wishlistMutation.current += 1;
    setSaved(next);
    const localWishlist = readLocalWishlist();
    if (next) localWishlist.add(product.slug);
    else localWishlist.delete(product.slug);
    try {
      writeLocalWishlist(localWishlist);
    } catch {
      // Wishlist remains available for the current visit when storage is unavailable.
    }

    setWishlistStatus(next ? `${product.name} saved to your wishlist.` : `${product.name} removed from your wishlist.`);
    try {
      const response = await fetch(
        next ? "/api/wishlist" : `/api/wishlist/${encodeURIComponent(product.slug)}`,
        {
          method: next ? "POST" : "DELETE",
          headers: next ? { "Content-Type": "application/json" } : undefined,
          body: next ? JSON.stringify({ productId: product.slug }) : undefined
        }
      );
      if (response.ok) {
        const body = await response.json();
        if (Array.isArray(body?.data)) {
          const accountWishlist = new Set<string>(
            body.data.map((item: ShopProduct) => String(item.slug))
          );
          setSaved(accountWishlist.has(product.slug));
          writeLocalWishlist(accountWishlist);
        }
      } else if (response.status === 401 || response.status === 503) {
        setWishlistStatus("Saved on this device. Sign in when accounts are available to sync it.");
      } else {
        setWishlistStatus("Saved on this device. It will sync when the service is available.");
      }
    } catch {
      setWishlistStatus("Saved on this device. It will sync when the service is available.");
    }
  }

  return (
    <>
      <section className="ae-container pb-16 pt-8 md:pb-24 md:pt-12">
        <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Link className="focus-ring rounded hover:text-[var(--ae-forest)]" href="/shop">Shop</Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <span className="truncate text-[var(--ae-forest)]" aria-current="page">{product.name}</span>
        </nav>

        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(21rem,.72fr)] lg:gap-14">
          <ProductGallery activeImage={activeImage} gallery={gallery} onImageChange={setActiveImage} onZoom={() => setZoomOpen(true)} reducedMotion={Boolean(reducedMotion)} />

          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="ae-kicker">{product.form}</p>
            <h1 className="ae-display mt-3 text-5xl font-semibold leading-[.92] text-[var(--ae-forest)] sm:text-6xl lg:text-7xl">{product.name}</h1>
            <div className="mt-5 flex items-center justify-between gap-4 border-y border-[var(--border)] py-4">
              <p className="text-lg font-semibold text-[var(--ae-gilt)]">{selected ? formatMoney(selected.price, product.currency) : product.displayPrice}</p>
              <p className="text-right text-xs text-[var(--muted-foreground)]">{product.edition}<br />Numbered and editioned</p>
            </div>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">{product.story}</p>

            <div className="mt-7 flex items-center gap-2 text-sm text-[var(--ae-forest)]">
              <span className={cn("size-2 rounded-full", product.availability === "out-of-stock" ? "bg-[var(--destructive)]" : "bg-[var(--ae-gilt)]")} />
              {product.availability === "low-stock" ? "Few editions remain" : product.availability === "out-of-stock" ? "Currently unavailable" : "Available from this edition"}
            </div>

            <div className="mt-7 grid gap-6">
              {product.colors.length > 1 ? <OptionGroup label="Colour" value={selected?.color}>
                {product.colors.map((color) => {
                  const available = optionIsAvailable("color", color);
                  return <button key={color} type="button" disabled={!available} aria-label={`Choose ${titleCase(color)}`} title={available ? undefined : `${titleCase(color)} is unavailable`} aria-pressed={selected?.color === color} onClick={() => chooseOption("color", color)} className={cn("focus-ring grid size-10 place-items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-35", selected?.color === color ? "border-[var(--ae-forest)] ring-2 ring-[var(--ae-parchment)]" : "border-transparent enabled:hover:border-[var(--ae-gilt)]")}><span className="size-7 rounded-full border border-black/10" style={{ background: colorStyles[color] ?? "#a08b5a" }} aria-hidden="true" /></button>;
                })}
              </OptionGroup> : null}
              {product.sizes.length > 1 ? <OptionGroup label="Edition size" value={selected?.size}>
                {product.sizes.map((size) => {
                  const available = optionIsAvailable("size", size);
                  return <button key={size} type="button" disabled={!available} aria-label={available ? `Choose ${titleCase(size)}` : `${titleCase(size)} unavailable`} aria-pressed={selected?.size === size} onClick={() => chooseOption("size", size)} className={cn("focus-ring min-w-12 rounded-full border px-3 py-2 text-xs font-semibold uppercase transition disabled:cursor-not-allowed disabled:opacity-35", selected?.size === size ? "border-[var(--ae-forest)] bg-[var(--ae-forest)] text-white" : "border-[var(--border)] text-[var(--ae-forest)] enabled:hover:border-[var(--ae-gilt)]")}>{size}</button>;
                })}
              </OptionGroup> : null}
            </div>

            <div className="mt-8 grid grid-cols-[1fr_auto] gap-3">
              <Button type="button" size="lg" disabled={!selected} onClick={addToBag}><ShoppingBag className="size-4" aria-hidden="true" />{selected ? "Add to reservation bag" : "Edition unavailable"}</Button>
              <Button type="button" size="lg" variant="outline" aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} onClick={toggleWishlist}><Heart className={cn("size-4", saved && "fill-current")} aria-hidden="true" /></Button>
            </div>
            <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">No payment is taken until checkout.</p>

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-6 text-center text-xs leading-5 text-[var(--muted-foreground)]">
              <span><PackageCheck className="mx-auto mb-2 size-4 text-[var(--ae-gilt)]" aria-hidden="true" />Edition card included</span>
              <span><Truck className="mx-auto mb-2 size-4 text-[var(--ae-gilt)]" aria-hidden="true" />Considered dispatch</span>
              <span><ShieldCheck className="mx-auto mb-2 size-4 text-[var(--ae-gilt)]" aria-hidden="true" />Impact tracked</span>
            </div>
          </div>
        </div>
      </section>

      {product.artist || product.drop || product.artwork || product.cause ? <section className="border-y border-[var(--border)] bg-[var(--ae-fog)]">
        <div className="ae-container grid gap-10 py-14 lg:grid-cols-[.75fr_1.25fr] lg:py-20">
          <div>
            <p className="ae-kicker">The edition, in context</p>
            <h2 className="ae-display mt-3 max-w-md text-4xl font-semibold leading-none text-[var(--ae-forest)] sm:text-5xl">An object with a visible route back.</h2>
          </div>
          <div className="grid gap-px overflow-hidden border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
            {product.artist ? <StoryLink label="Artist" value={product.artist.name} href={`/shop?artist=${product.artist.slug}`} /> : null}
            {product.drop ? <StoryLink label="Current drop" value={product.drop.name} href={`/drops/${product.drop.slug}`} /> : null}
            {product.artwork ? <StoryLink label="Original artwork" value={product.artwork.name} href="/#design" /> : null}
            {product.cause ? <StoryLink label="Cause partner" value={product.cause.name} href={`/causes/${product.cause.slug}`} /> : null}
          </div>
        </div>
      </section> : null}

      <section className="ae-container grid gap-12 py-[var(--ae-space-section)] lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="ae-kicker">Object notes</p>
          <h2 className="ae-display mt-3 text-5xl font-semibold leading-none text-[var(--ae-forest)]">Made to live with.</h2>
          <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">Each batch is specified with the same care as the original artwork: tactile, durable, and made for repeated use.</p>
        </div>
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          <DetailRow title="Materials"><ul className="grid gap-1">{product.materials.map((material) => <li key={material} className="flex items-center gap-2"><Check className="size-3 text-[var(--ae-gilt)]" aria-hidden="true" />{material}</li>)}</ul></DetailRow>
          <DetailRow title="Dimensions">{product.dimensions}</DetailRow>
          <DetailRow title="Care">{product.careInstructions}</DetailRow>
          <DetailRow title="Shipping & returns">{product.shippingReturns}</DetailRow>
        </div>
      </section>

      {reviews.length ? <section aria-labelledby="reviews-title" className="bg-[var(--ae-forest)] text-[var(--ae-white)]">
        <div className="ae-container grid gap-10 py-14 lg:grid-cols-[.7fr_1.3fr] lg:py-20">
          <div>
            <p className="ae-kicker">Collector notes</p>
            <h2 id="reviews-title" className="ae-display mt-3 text-5xl font-semibold leading-none">Quietly loved, thoughtfully kept.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => <Review key={String(review.id)} review={review} />)}
          </div>
        </div>
      </section> : null}

      <ProductRail title="More from the archive" products={related} />
      {recent.length ? <ProductRail title="Recently viewed" products={recent} /> : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[rgba(255,250,242,.94)] p-3 backdrop-blur md:hidden">
        <div className="ae-container flex items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-[var(--ae-forest)]">{product.name}</p><p className="text-xs text-[var(--ae-gilt)]">{selected ? formatMoney(selected.price, product.currency) : product.displayPrice}</p></div><Button type="button" size="sm" disabled={!selected} onClick={addToBag}>Add to bag</Button></div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{wishlistStatus}</p>

      <AnimatePresence>{zoomOpen && gallery.length ? <GalleryDialog gallery={gallery} imageIndex={activeImage} onClose={() => setZoomOpen(false)} reducedMotion={Boolean(reducedMotion)} /> : null}</AnimatePresence>
    </>
  );
}

function ProductGallery({ activeImage, gallery, onImageChange, onZoom, reducedMotion }: { activeImage: number; gallery: ShopProduct["gallery"]; onImageChange: (index: number) => void; onZoom: () => void; reducedMotion: boolean }) {
  const image = gallery[activeImage];
  return <div className="min-w-0"><div className="relative aspect-[4/5] overflow-hidden bg-[var(--ae-fog)] sm:aspect-[5/6]">
    {image ? <><AnimatePresence mode="wait"><motion.div key={image.src} initial={reducedMotion ? false : { opacity: 0.2, scale: 1.015 }} animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0 }} transition={{ duration: 0.38 }} className="absolute inset-0"><Image src={image.src} alt={image.alt || "Product image"} fill priority sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" /></motion.div></AnimatePresence>
    <button type="button" onClick={onZoom} className="focus-ring absolute bottom-4 right-4 grid size-11 place-items-center rounded-full bg-[rgba(255,250,242,.92)] text-[var(--ae-forest)] shadow-sm transition hover:scale-105" aria-label="Zoom product image"><ZoomIn className="size-4" aria-hidden="true" /></button></> : <div className="grid h-full place-items-center px-6 text-center text-sm text-[var(--ae-stone)]">Product photography coming soon</div>}
  </div>
  {gallery.length > 1 ? <div className="mt-3 grid grid-cols-3 gap-3">{gallery.map((image, index) => <button key={image.src} type="button" onClick={() => onImageChange(index)} aria-label={`Show image ${index + 1}`} aria-pressed={activeImage === index} className={cn("focus-ring relative aspect-square overflow-hidden border-2 bg-[var(--ae-fog)] transition", activeImage === index ? "border-[var(--ae-gilt)]" : "border-transparent hover:border-[var(--ae-stone)]")}><Image src={image.src} alt="" fill sizes="(max-width: 640px) 30vw, 140px" className="object-cover" /></button>)}</div> : null}
  <p className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]"><Maximize2 className="size-3" aria-hidden="true" />Select a view for material and lifestyle details.</p>
  </div>;
}

function OptionGroup({ children, label, value }: { children: React.ReactNode; label: string; value?: string }) {
  return <fieldset><legend className="flex w-full justify-between text-xs font-semibold uppercase tracking-[.12em] text-[var(--ae-forest)]"><span>{label}</span><span className="font-normal tracking-normal text-[var(--muted-foreground)]">{value ? titleCase(value) : "Select"}</span></legend><div className="mt-3 flex flex-wrap gap-2">{children}</div></fieldset>;
}

function StoryLink({ href, label, value }: { href: string; label: string; value: string }) {
  return <Link href={href} className="focus-ring group bg-[var(--ae-white)] p-5 transition hover:bg-[var(--ae-parchment)]"><p className="text-[.65rem] font-semibold uppercase tracking-[.13em] text-[var(--ae-gilt)]">{label}</p><p className="mt-2 flex items-center justify-between gap-3 text-sm font-medium text-[var(--ae-forest)]">{value}<ChevronRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" /></p></Link>;
}

function DetailRow({ children, title }: { children: React.ReactNode; title: string }) {
  return <details className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm font-semibold text-[var(--ae-forest)] marker:hidden">{title}<ChevronRight className="size-4 transition group-open:rotate-90" aria-hidden="true" /></summary><div className="max-w-2xl pt-4 text-sm leading-6 text-[var(--muted-foreground)]">{children}</div></details>;
}

function Review({ review }: { review: ShopReview }) {
  return <figure className="border border-white/20 p-5">{review.rating ? <div className="flex gap-0.5 text-[var(--ae-gilt)]" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={cn("size-3", index < review.rating! && "fill-current")} aria-hidden="true" />)}</div> : null}<blockquote className="ae-display mt-4 text-2xl leading-[1.05] text-white/90">“{review.quote}”</blockquote><figcaption className="mt-5 text-xs font-semibold uppercase tracking-[.12em] text-white/55">{review.name}{review.role ? ` — ${review.role}` : ""}</figcaption></figure>;
}

function ProductRail({ products, title }: { products: ShopProduct[]; title: string }) {
  if (!products.length) return null;
  return <section className="ae-container py-14 md:py-20"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="ae-kicker">Keep exploring</p><h2 className="ae-display mt-2 text-4xl font-semibold text-[var(--ae-forest)]">{title}</h2></div><Link href="/shop" className="focus-ring text-sm font-medium text-[var(--ae-forest)] underline decoration-[var(--ae-gilt)] underline-offset-4">View all</Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((item) => <Link key={item.slug} href={`/shop/${item.slug}`} className="focus-ring group"><div className="relative aspect-[4/5] overflow-hidden bg-[var(--ae-fog)]">{item.image ? <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center px-4 text-center text-sm text-[var(--ae-stone)]">Product photography coming soon</div>}</div><div className="mt-3 flex items-start justify-between gap-4"><div><p className="text-xs text-[var(--ae-gilt)]">{item.form}</p><h3 className="ae-display mt-1 text-2xl font-semibold text-[var(--ae-forest)]">{item.name}</h3></div><span className="shrink-0 text-sm font-medium text-[var(--ae-forest)]">{item.displayPrice}</span></div></Link>)}</div></section>;
}

function GalleryDialog({ gallery, imageIndex, onClose, reducedMotion }: { gallery: ShopProduct["gallery"]; imageIndex: number; onClose: () => void; reducedMotion: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(dialogFocusableSelector) ?? []
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialogRef.current?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose]);
  const image = gallery[imageIndex] ?? gallery[0];
  return <div className="fixed inset-0 z-50 grid place-items-center p-4" role="presentation"><motion.button type="button" aria-label="Close image zoom" className="absolute inset-0 bg-[rgba(14,14,14,.88)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} /><motion.section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Zoomed product image" initial={reducedMotion ? false : { opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .98 }} className="relative z-10 flex max-h-full w-full max-w-5xl items-center justify-center"><div className="relative aspect-[4/5] max-h-[86svh] w-auto max-w-full overflow-hidden"><Image src={image.src} alt={image.alt} width={1200} height={1500} sizes="90vw" className="h-auto max-h-[86svh] w-auto object-contain" /></div><button ref={closeRef} type="button" className="focus-ring absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-[var(--ae-white)] text-[var(--ae-forest)]" onClick={onClose} aria-label="Close zoomed image"><X className="size-4" aria-hidden="true" /></button></motion.section></div>;
}

async function fetchProduct(slug: string): Promise<ShopProduct | null> {
  try {
    const response = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.data && typeof body.data === "object" ? body.data as ShopProduct : null;
  } catch {
    return null;
  }
}

function readLocalWishlist() {
  try {
    const value = JSON.parse(window.localStorage.getItem("arteffect-wishlist") ?? "[]");
    return new Set<string>(Array.isArray(value) ? value.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function writeLocalWishlist(wishlist: Set<string>) {
  try {
    window.localStorage.setItem("arteffect-wishlist", JSON.stringify([...wishlist]));
  } catch {
    // Wishlist remains available for the current visit when storage is unavailable.
  }
}

function formatMoney(value: number, currency: string) { return new Intl.NumberFormat("en-US", { currency, style: "currency" }).format(value); }
function titleCase(value: string) { return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
