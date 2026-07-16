"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Heart,
  List,
  Search,
  SlidersHorizontal,
  Sparkles,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";

import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/ui/state-message";
import { cn } from "@/lib/utils";
import type {
  ProductAvailability,
  ProductListResult,
  ProductQuery,
  ProductSort,
  ShopProduct,
  ShopVariant
} from "@/types/shop";

type ShopExperienceProps = {
  facets: {
    availability: ProductAvailability[];
    colors: string[];
    sizes: string[];
  };
  notice?: string;
  query: ProductQuery;
  result: ProductListResult;
};

const sortLabels: Record<ProductSort, string> = {
  featured: "Featured",
  newest: "Newest",
  "name-asc": "Name, A–Z",
  "name-desc": "Name, Z–A",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low"
};

const availabilityLabels: Record<ProductAvailability, string> = {
  "in-stock": "In stock",
  "low-stock": "Low stock",
  "out-of-stock": "Out of stock"
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
  blue: "#657385",
  brown: "#796252",
  cream: "#eee5cf",
  green: "#536b58",
  grey: "#8d8b86",
  metallic: "#a08b5a",
  multicolor: "linear-gradient(135deg,#536b58 0 33%,#a08b5a 33% 66%,#8b6666 66%)",
  "off-white": "#f7f2e9",
  orange: "#aa7452",
  pink: "#b88889",
  purple: "#716477",
  red: "#8b5551",
  tan: "#ad9271",
  white: "#fffaf2",
  yellow: "#b69c5d"
};

export function ShopExperience({ facets, notice, query, result }: ShopExperienceProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [filterOpen, setFilterOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState<ShopProduct | null>(null);
  const [searchDraft, setSearchDraft] = useState({
    source: query.search ?? "",
    value: query.search ?? ""
  });
  const [view, setView] = useState<"grid" | "list">("grid");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [wishlistStatus, setWishlistStatus] = useState("");
  const [isPending, beginNavigation] = useTransition();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const saved = readLocalWishlist();
    const savedView = window.localStorage.getItem("arteffect-shop-view");
    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      setWishlist(saved);
      if (savedView === "grid" || savedView === "list") setView(savedView);
    });

    fetch("/api/wishlist", { headers: { Accept: "application/json" } })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!active || !Array.isArray(body?.data)) return;
        const accountWishlist = new Set<string>(
          body.data.map((product: ShopProduct) => String(product.slug))
        );
        setWishlist(accountWishlist);
        writeLocalWishlist(accountWishlist);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const searchValue =
    searchDraft.source === (query.search ?? "") ? searchDraft.value : (query.search ?? "");

  const activeFilterCount =
    query.colors.length +
    query.sizes.length +
    query.availability.length +
    Number(query.minPrice !== undefined) +
    Number(query.maxPrice !== undefined);

  const baseParams = useMemo(() => productQueryParams(query), [query]);

  function navigate(update: (params: URLSearchParams) => void) {
    const next = new URLSearchParams(baseParams);
    update(next);
    next.delete("page");
    beginNavigation(() => router.push(next.size ? `/shop?${next}` : "/shop", { scroll: false }));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate((params) => {
      const value = searchValue.trim().replace(/\s+/g, " ").slice(0, 100);
      if (value) params.set("search", value);
      else params.delete("search");
    });
  }

  function toggleListFilter(name: "color" | "size" | "availability", value: string) {
    navigate((params) => {
      const values = params.getAll(name);
      params.delete(name);
      const next = values.includes(value)
        ? values.filter((entry) => entry !== value)
        : [...values, value];
      next.forEach((entry) => params.append(name, entry));
    });
  }

  function changeView(next: "grid" | "list") {
    setView(next);
    window.localStorage.setItem("arteffect-shop-view", next);
  }

  async function toggleWishlist(product: ShopProduct) {
    const reference = String(product.slug);
    const shouldAdd = !wishlist.has(reference);
    const next = new Set(wishlist);
    if (shouldAdd) next.add(reference);
    else next.delete(reference);
    setWishlist(next);
    writeLocalWishlist(next);
    setWishlistStatus(shouldAdd ? `${product.name} saved to your wishlist.` : `${product.name} removed from your wishlist.`);

    try {
      const response = await fetch(
        shouldAdd ? "/api/wishlist" : `/api/wishlist/${encodeURIComponent(reference)}`,
        {
          method: shouldAdd ? "POST" : "DELETE",
          headers: shouldAdd ? { "Content-Type": "application/json" } : undefined,
          body: shouldAdd ? JSON.stringify({ productId: reference }) : undefined
        }
      );
      if (response.status === 401 || response.status === 503) {
        setWishlistStatus("Saved on this device. Sign in when accounts are available to sync it.");
      }
    } catch {
      setWishlistStatus("Saved on this device. It will sync when the service is available.");
    }
  }

  function quickAdd(product: ShopProduct, variant?: ShopVariant) {
    const selected = variant ?? product.variants.find((item) => item.isAvailable);
    if (!selected) return;
    addItem({
      id: `${product.id}:${selected.id}`,
      productId: product.slug,
      variantId: selected.id,
      image: product.image,
      imageAlt: product.imageAlt,
      name: `${product.name} — ${selected.name}`,
      price: formatMoney(selected.price, product.currency)
    });
  }

  const closeQuickView = useCallback(() => setQuickProduct(null), []);

  return (
    <main id="main-content" className="min-h-screen bg-[var(--ae-parchment)] pt-16">
      <section className="relative overflow-hidden bg-[var(--ae-forest)] text-[var(--ae-white)]">
        <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_82%_18%,rgba(160,139,90,.65),transparent_28%),linear-gradient(120deg,transparent_45%,rgba(255,250,242,.08))]" />
        <div className="ae-container relative grid min-h-[27rem] content-end gap-10 py-16 md:grid-cols-[1fr_0.7fr] md:items-end md:pb-20 md:pt-24">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="ae-kicker">The object archive</p>
            <h1 className="ae-display mt-5 max-w-3xl text-6xl font-semibold leading-[0.9] md:text-8xl">
              Art, made tangible.
            </h1>
          </motion.div>
          <div className="max-w-lg border-t border-white/20 pt-5 md:justify-self-end">
            <p className="text-base leading-7 text-white/70">
              Numbered objects born from original commissions. Every edition keeps the artist visible and its impact traceable.
            </p>
            <p className="mt-5 flex items-center gap-2 text-sm text-[var(--ae-gilt)]">
              <Sparkles className="size-4" aria-hidden="true" />
              Small batches. Considered materials. Lasting stories.
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Product catalog" className="ae-container py-10 md:py-16">
        {notice ? (
          <p role="status" className="mb-6 border-l-2 border-[var(--ae-gilt)] bg-[var(--ae-white)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
            {notice}
          </p>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start">
          <aside className={cn("lg:sticky lg:top-24 lg:block", filterOpen ? "block" : "hidden")} aria-label="Product filters">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <h2 className="ae-display text-3xl text-[var(--ae-forest)]">Filters</h2>
              <button type="button" className="focus-ring grid size-10 place-items-center rounded-full border" onClick={() => setFilterOpen(false)} aria-label="Close filters">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <form
              className="border-y border-[var(--border)] py-6"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                navigate((params) => {
                  for (const name of ["minPrice", "maxPrice"]) {
                    const value = String(form.get(name) ?? "").trim();
                    if (value) params.set(name, value);
                    else params.delete(name);
                  }
                });
              }}
            >
              <FilterGroup title="Availability">
                {facets.availability.map((value) => (
                  <FilterCheck key={value} checked={query.availability.includes(value)} label={availabilityLabels[value]} onChange={() => toggleListFilter("availability", value)} />
                ))}
              </FilterGroup>
              <FilterGroup title="Color">
                {facets.colors.map((value) => (
                  <FilterCheck
                    key={value}
                    checked={query.colors.includes(value)}
                    label={titleCase(value)}
                    onChange={() => toggleListFilter("color", value)}
                    swatch={colorStyles[value]}
                  />
                ))}
              </FilterGroup>
              <FilterGroup title="Size">
                <div className="flex flex-wrap gap-2">
                  {facets.sizes.map((value) => {
                    const active = query.sizes.includes(value);
                    return (
                      <button key={value} type="button" aria-pressed={active} onClick={() => toggleListFilter("size", value)} className={cn("focus-ring min-w-10 rounded-full border px-3 py-2 text-xs font-semibold uppercase transition", active ? "border-[var(--ae-forest)] bg-[var(--ae-forest)] text-white" : "border-[var(--border)] hover:border-[var(--ae-gilt)]")}>
                        {value === "one-size" ? "OS" : value}
                      </button>
                    );
                  })}
                </div>
              </FilterGroup>
              <FilterGroup title="Price">
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-[var(--muted-foreground)]">Min<input name="minPrice" type="number" min="0" step="0.01" defaultValue={query.minPrice} placeholder="$0" className="focus-ring mt-1 h-10 w-full rounded-md border bg-transparent px-3 text-sm text-[var(--ae-onyx)]" /></label>
                  <label className="text-xs text-[var(--muted-foreground)]">Max<input name="maxPrice" type="number" min="0" step="0.01" defaultValue={query.maxPrice} placeholder="Any" className="focus-ring mt-1 h-10 w-full rounded-md border bg-transparent px-3 text-sm text-[var(--ae-onyx)]" /></label>
                </div>
                <Button type="submit" size="sm" variant="outline" className="mt-3 w-full">Apply price</Button>
              </FilterGroup>
            </form>
            {activeFilterCount ? (
              <Button asChild variant="link" className="mt-5"><Link href="/shop">Clear all filters ({activeFilterCount})</Link></Button>
            ) : null}
          </aside>

          <div className={cn("min-w-0 transition-opacity", isPending && "opacity-55")} aria-busy={isPending}>
            <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <form onSubmit={submitSearch} role="search" className="relative w-full sm:max-w-sm">
                <label htmlFor="shop-search" className="sr-only">Search products</label>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ae-stone)]" aria-hidden="true" />
                <input id="shop-search" type="search" value={searchValue} onChange={(event) => setSearchDraft({ source: query.search ?? "", value: event.target.value })} placeholder="Search the object archive" className="focus-ring h-11 w-full rounded-md border bg-[var(--ae-white)] pl-10 pr-20 text-sm placeholder:text-[var(--ae-stone)]" />
                <button type="submit" className="focus-ring absolute right-1.5 top-1.5 rounded px-3 py-2 text-xs font-semibold text-[var(--ae-forest)] hover:bg-[var(--ae-fog)]">Search</button>
              </form>
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => setFilterOpen((open) => !open)} className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm lg:hidden" aria-expanded={filterOpen}>
                  <SlidersHorizontal className="size-4" aria-hidden="true" /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
                </button>
                <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <span className="sr-only sm:not-sr-only">Sort</span>
                  <select value={query.sort} onChange={(event) => navigate((params) => params.set("sort", event.target.value))} className="focus-ring h-10 rounded-md border bg-transparent px-2 text-sm text-[var(--ae-forest)]">
                    {Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <div className="hidden rounded-md border sm:flex" aria-label="Product view">
                  <ViewButton active={view === "grid"} label="Grid view" onClick={() => changeView("grid")}><Grid2X2 className="size-4" /></ViewButton>
                  <ViewButton active={view === "list"} label="List view" onClick={() => changeView("list")}><List className="size-4" /></ViewButton>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-5 text-sm text-[var(--muted-foreground)]">
              <p><span className="font-semibold text-[var(--ae-forest)]">{result.pagination.total}</span> {result.pagination.total === 1 ? "object" : "objects"}</p>
              {query.search ? <p className="truncate">Results for “{query.search}”</p> : <p>Designed in limited editions</p>}
            </div>

            {result.docs.length ? (
              <motion.div layout className={cn(view === "grid" ? "grid gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-5")}>
                {result.docs.map((product, index) => (
                  <ProductCard
                    key={String(product.id)}
                    index={index}
                    list={view === "list"}
                    product={product}
                    saved={wishlist.has(String(product.slug))}
                    onQuickAdd={() => quickAdd(product)}
                    onQuickView={() => setQuickProduct(product)}
                    onWishlist={() => toggleWishlist(product)}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </motion.div>
            ) : (
              <StateMessage title="No objects found" description="Try removing a filter or searching with a broader phrase." action={<Button asChild size="sm" variant="outline"><Link href="/shop">Reset the collection</Link></Button>} />
            )}

            <Pagination pagination={result.pagination} params={baseParams} />
          </div>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{wishlistStatus}</p>
      </section>

      <AnimatePresence>
        {quickProduct ? (
          <QuickView key={String(quickProduct.id)} product={quickProduct} saved={wishlist.has(String(quickProduct.slug))} onAdd={quickAdd} onClose={closeQuickView} onWishlist={() => toggleWishlist(quickProduct)} />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function ProductCard({ index, list, onQuickAdd, onQuickView, onWishlist, product, reducedMotion, saved }: { index: number; list: boolean; onQuickAdd: () => void; onQuickView: () => void; onWishlist: () => void; product: ShopProduct; reducedMotion: boolean | null; saved: boolean }) {
  const available = product.variants.some((variant) => variant.isAvailable);

  return (
    <motion.article layout initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={reducedMotion ? undefined : { opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.2), duration: 0.4 }} className={cn("group min-w-0", list && "grid gap-5 border-b border-[var(--border)] pb-5 sm:grid-cols-[12rem_1fr] sm:items-center")}>
      <div className={cn("relative overflow-hidden rounded-md bg-[var(--ae-fog)]", list ? "aspect-[4/5] sm:aspect-square" : "aspect-[4/5]")}>
        {product.image ? <Image src={product.image} alt={product.imageAlt} fill sizes={list ? "192px" : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 30vw"} className="object-cover transition duration-700 ease-[var(--ae-ease-out)] group-hover:scale-[1.035]" /> : <div className="grid h-full place-items-center text-sm text-[var(--ae-stone)]">Image coming soon</div>}
        <div className="absolute inset-x-3 bottom-3 flex gap-2 transition duration-300 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
          <Button type="button" size="sm" className="flex-1 bg-[var(--ae-white)] text-[var(--ae-forest)] hover:bg-white" onClick={onQuickView}>Quick view</Button>
          <Button type="button" size="sm" disabled={!available} onClick={onQuickAdd} aria-label={`Quick add ${product.name}`}>Quick add</Button>
        </div>
        <button type="button" onClick={onWishlist} aria-pressed={saved} aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`} className="focus-ring absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-[rgba(255,250,242,.9)] text-[var(--ae-forest)] shadow-sm transition hover:scale-105">
          <Heart className={cn("size-4", saved && "fill-current")} aria-hidden="true" />
        </button>
        {product.isFeatured ? <span className="absolute left-3 top-3 rounded-full bg-[var(--ae-forest)] px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white">Featured</span> : null}
      </div>
      <div className={cn("mt-4", list && "mt-0")}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ae-gilt)]">{product.form}</p>
            <Link href={`/shop/${product.slug}`} className="focus-ring ae-display mt-1 block rounded text-left text-2xl font-semibold leading-tight text-[var(--ae-forest)] hover:text-[var(--ae-gilt)]">{product.name}</Link>
          </div>
          <p className="shrink-0 text-sm font-semibold text-[var(--ae-forest)]">{product.displayPrice}</p>
        </div>
        <p className={cn("mt-2 text-sm text-[var(--muted-foreground)]", !list && "line-clamp-2")}>{product.story}</p>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
          <span>{product.edition}</span>
          <span className={cn("font-medium", product.availability === "low-stock" && "text-[var(--ae-gilt)]", product.availability === "out-of-stock" && "text-[var(--destructive)]")}>{availabilityLabels[product.availability]}</span>
        </div>
      </div>
    </motion.article>
  );
}

function QuickView({ onAdd, onClose, onWishlist, product, saved }: { onAdd: (product: ShopProduct, variant: ShopVariant) => void; onClose: () => void; onWishlist: () => void; product: ShopProduct; saved: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const availableVariants = product.variants.filter((variant) => variant.isAvailable);
  const [variantID, setVariantID] = useState(availableVariants[0]?.id ?? "");
  const selected = product.variants.find((variant) => variant.id === variantID);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
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
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center" role="presentation">
      <motion.button type="button" aria-label="Close quick view" className="absolute inset-0 bg-[rgba(14,14,14,.58)]" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="quick-view-title" initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 grid max-h-[92svh] w-full max-w-4xl overflow-y-auto bg-[var(--ae-white)] shadow-2xl sm:grid-cols-2 sm:rounded-md">
        <div className="relative min-h-72 bg-[var(--ae-fog)] sm:min-h-[38rem]">
          {product.image ? <Image src={product.image} alt={product.imageAlt} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /> : null}
        </div>
        <div className="flex flex-col p-6 sm:p-9">
          <button ref={closeRef} type="button" onClick={onClose} className="focus-ring ml-auto grid size-10 place-items-center rounded-full border hover:border-[var(--ae-gilt)]" aria-label="Close quick view"><X className="size-4" aria-hidden="true" /></button>
          <p className="ae-kicker mt-4">{product.form}</p>
          <h2 id="quick-view-title" className="ae-display mt-3 text-5xl font-semibold leading-none text-[var(--ae-forest)]">{product.name}</h2>
          <p className="mt-3 text-lg font-semibold text-[var(--ae-gilt)]">{selected ? formatMoney(selected.price, product.currency) : product.displayPrice}</p>
          <p className="mt-5 text-sm leading-6 text-[var(--muted-foreground)]">{product.story}</p>
          {availableVariants.length ? (
            <fieldset className="mt-7">
              <legend className="text-xs font-semibold uppercase tracking-wider text-[var(--ae-forest)]">Choose an edition</legend>
              <div className="mt-3 grid gap-2">
                {availableVariants.map((variant) => (
                  <label key={variant.id} className={cn("focus-within:ring-2 focus-within:ring-[var(--ae-gilt)] flex cursor-pointer items-center justify-between gap-4 rounded-md border px-4 py-3 text-sm transition", variantID === variant.id && "border-[var(--ae-forest)] bg-[var(--ae-parchment)]")}>
                    <span className="flex items-center gap-3"><input type="radio" name="variant" value={variant.id} checked={variantID === variant.id} onChange={() => setVariantID(variant.id)} className="sr-only" /><span className={cn("grid size-4 place-items-center rounded-full border", variantID === variant.id && "border-[var(--ae-forest)] bg-[var(--ae-forest)] text-white")}>{variantID === variant.id ? <Check className="size-3" /> : null}</span>{variant.name}</span>
                    <span>{formatMoney(variant.price, product.currency)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : <p className="mt-7 text-sm font-medium text-[var(--destructive)]">This edition is currently unavailable.</p>}
          <div className="mt-auto flex gap-2 pt-8">
            <Button type="button" className="flex-1" disabled={!selected} onClick={() => selected && onAdd(product, selected)}>Quick add to bag</Button>
            <Button type="button" variant="outline" onClick={onWishlist} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}><Heart className={cn("size-4", saved && "fill-current")} /></Button>
          </div>
          <dl className="mt-7 grid grid-cols-2 gap-3 border-t pt-5 text-xs text-[var(--muted-foreground)]">
            <div><dt className="font-semibold uppercase tracking-wider text-[var(--ae-forest)]">Edition</dt><dd className="mt-1">{product.edition}</dd></div>
            <div><dt className="font-semibold uppercase tracking-wider text-[var(--ae-forest)]">Materials</dt><dd className="mt-1">{product.materials.join(", ")}</dd></div>
          </dl>
        </div>
      </motion.section>
    </div>
  );
}

function FilterGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return <fieldset className="border-b border-[var(--border)] py-5 first:pt-0 last:border-0 last:pb-0"><legend className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ae-forest)]">{title}</legend><div className="grid gap-2">{children}</div></fieldset>;
}

function FilterCheck({ checked, label, onChange, swatch }: { checked: boolean; label: string; onChange: () => void; swatch?: string }) {
  return <label className="group flex cursor-pointer items-center gap-3 text-sm text-[var(--muted-foreground)]"><input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" /><span className={cn("grid size-4 place-items-center rounded-sm border transition peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ae-gilt)]", checked && "border-[var(--ae-forest)] bg-[var(--ae-forest)] text-white")}>{checked ? <Check className="size-3" aria-hidden="true" /> : null}</span>{swatch ? <span className="size-3 rounded-full border" style={{ background: swatch }} aria-hidden="true" /> : null}<span className="group-hover:text-[var(--ae-forest)]">{label}</span></label>;
}

function ViewButton({ active, children, label, onClick }: { active: boolean; children: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" aria-label={label} aria-pressed={active} onClick={onClick} className={cn("focus-ring grid size-10 place-items-center rounded-md text-[var(--ae-stone)] transition", active && "bg-[var(--ae-forest)] text-white")}>{children}</button>;
}

function Pagination({ pagination, params }: { pagination: ProductListResult["pagination"]; params: URLSearchParams }) {
  if (pagination.totalPages <= 1) return null;
  const href = (page: number) => {
    const next = new URLSearchParams(params);
    if (page > 1) next.set("page", String(page));
    else next.delete("page");
    return next.size ? `/shop?${next}` : "/shop";
  };

  return <nav aria-label="Product pages" className="mt-12 flex items-center justify-between border-t pt-6"><Button asChild variant="outline" size="sm" className={cn(!pagination.hasPreviousPage && "pointer-events-none opacity-45")}><Link href={href(Math.max(1, pagination.page - 1))} aria-disabled={!pagination.hasPreviousPage}><ChevronLeft className="size-4" />Previous</Link></Button><p className="text-sm text-[var(--muted-foreground)]">Page <span className="font-semibold text-[var(--ae-forest)]">{pagination.page}</span> of {pagination.totalPages}</p><Button asChild variant="outline" size="sm" className={cn(!pagination.hasNextPage && "pointer-events-none opacity-45")}><Link href={href(Math.min(pagination.totalPages, pagination.page + 1))} aria-disabled={!pagination.hasNextPage}>Next<ChevronRight className="size-4" /></Link></Button></nav>;
}

function productQueryParams(query: ProductQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  query.colors.forEach((value) => params.append("color", value));
  query.sizes.forEach((value) => params.append("size", value));
  query.availability.forEach((value) => params.append("availability", value));
  if (query.artist) params.set("artist", query.artist);
  if (query.cause) params.set("cause", query.cause);
  if (query.drop) params.set("drop", query.drop);
  if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
  if (query.sort !== "featured") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  return params;
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
  window.localStorage.setItem("arteffect-wishlist", JSON.stringify([...wishlist]));
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

function titleCase(value: string) {
  return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
