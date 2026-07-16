"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, Truck, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/ui/state-message";
import type { ShopProduct } from "@/types/shop";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

export function CartDrawer() {
  const {
    addItem,
    applyCoupon,
    cart,
    clearError,
    drawerOpen,
    error,
    estimateShipping,
    isLoading,
    isMutating,
    items,
    itemCount,
    quotes,
    removeCoupon,
    removeItem,
    setDrawerOpen,
    updateQuantity,
    upsells
  } = useCart();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const [couponCode, setCouponCode] = useState("");
  const [country, setCountry] = useState("LB");
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    const estimate = cart?.shippingEstimate;
    if (!estimate?.country) return;
    queueMicrotask(() => {
      setCountry(estimate.country || "LB");
      setPostalCode(estimate.postalCode || "");
    });
  }, [cart?.shippingEstimate]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusableElements = Array.from(drawer.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusableElements.length === 0) {
        event.preventDefault();
        drawer.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === firstElement || !drawer.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (activeElement === lastElement || !drawer.contains(activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [drawerOpen, setDrawerOpen]);

  async function submitCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!couponCode.trim()) return;
    try {
      await applyCoupon(couponCode);
      setCouponCode("");
    } catch {
      // The shared live error region announces the API response.
    }
  }

  async function submitShipping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await estimateShipping(country, postalCode || undefined);
    } catch {
      // The shared live error region announces the API response.
    }
  }

  async function selectShipping(methodCode: string) {
    try {
      await estimateShipping(country, postalCode || undefined, methodCode);
    } catch {
      // The shared live error region announces the API response.
    }
  }

  function continueToCheckout() {
    setDrawerOpen(false);
    router.push("/checkout");
  }

  return (
    <AnimatePresence>
      {drawerOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close reservation bag"
            className="fixed inset-0 z-50 cursor-default bg-[rgba(14,14,14,0.36)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            onClick={() => setDrawerOpen(false)}
          />
          <motion.aside
            ref={drawerRef}
            aria-label="Reservation bag"
            aria-modal="true"
            role="dialog"
            tabIndex={-1}
            className="fixed inset-y-0 right-0 z-[51] flex w-full max-w-md flex-col bg-[var(--ae-white)] shadow-[var(--ae-shadow-drawer)]"
            initial={shouldReduceMotion ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={shouldReduceMotion ? undefined : { x: "100%" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5 sm:px-7">
              <div>
                <p className="ae-kicker">Your selection</p>
                <h2 className="ae-display mt-1 text-3xl text-[var(--ae-forest)]">Reservation bag</h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="focus-ring grid size-10 place-items-center rounded-full border border-[var(--border)] text-[var(--ae-forest)] transition hover:border-[var(--ae-gilt)] hover:bg-[var(--ae-fog)]"
                aria-label="Close reservation bag"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              {error ? (
                <div role="alert" className="mb-5 flex items-start justify-between gap-3 border border-[var(--destructive)]/30 bg-[var(--destructive)]/[0.06] p-3 text-sm text-[var(--destructive)]">
                  <span>{error}</span>
                  <button type="button" onClick={clearError} className="focus-ring shrink-0 rounded" aria-label="Dismiss cart error"><X className="size-4" aria-hidden="true" /></button>
                </div>
              ) : null}

              {isLoading ? (
                <StateMessage type="loading" title="Restoring your bag" description="Retrieving your saved selection." />
              ) : items.length === 0 ? (
                <StateMessage
                  title="Your bag is waiting"
                  description="Choose an edition and it will appear here for review."
                  action={<Button type="button" size="sm" variant="outline" onClick={() => setDrawerOpen(false)}>Explore the drop</Button>}
                />
              ) : (
                <>
                  <ul className="divide-y divide-[var(--border)]">
                    {items.map((item) => (
                      <li key={item.id} className="grid grid-cols-[4.5rem_1fr] gap-4 py-5 first:pt-0">
                        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-[var(--ae-fog)]">
                          {item.image ? <Image src={item.image} alt={item.imageAlt} fill sizes="72px" className="object-cover" /> : <ShoppingBag className="absolute inset-0 m-auto size-5 text-[var(--ae-stone)]" aria-hidden="true" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[var(--ae-forest)]">{item.name}</p>
                              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.price}</p>
                            </div>
                            <button
                              type="button"
                              disabled={isMutating}
                              className="focus-ring rounded p-1 text-[var(--ae-stone)] transition hover:text-[var(--ae-onyx)] disabled:opacity-40"
                              aria-label={`Remove ${item.name}`}
                              onClick={() => { void removeItem(item.id).catch(() => undefined); }}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="mt-4 inline-flex items-center rounded-full border border-[var(--border)]">
                            <button type="button" disabled={isMutating} aria-label={`Decrease quantity for ${item.name}`} className="focus-ring grid size-8 place-items-center rounded-l-full text-[var(--ae-forest)] transition hover:bg-[var(--ae-fog)] disabled:opacity-40" onClick={() => { void updateQuantity(item.id, item.quantity - 1).catch(() => undefined); }}><Minus className="size-3.5" aria-hidden="true" /></button>
                            <span className="w-7 text-center text-xs font-medium tabular-nums text-[var(--ae-forest)]" aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
                            <button type="button" disabled={isMutating} aria-label={`Increase quantity for ${item.name}`} className="focus-ring grid size-8 place-items-center rounded-r-full text-[var(--ae-forest)] transition hover:bg-[var(--ae-fog)] disabled:opacity-40" onClick={() => { void updateQuantity(item.id, item.quantity + 1).catch(() => undefined); }}><Plus className="size-3.5" aria-hidden="true" /></button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <section aria-labelledby="coupon-title" className="mt-7 border-t border-[var(--border)] pt-6">
                    <h3 id="coupon-title" className="flex items-center gap-2 text-sm font-semibold text-[var(--ae-forest)]"><Tag className="size-4 text-[var(--ae-gilt)]" aria-hidden="true" />Collector code</h3>
                    {cart?.couponCode ? (
                      <div className="mt-3 flex items-center justify-between bg-[var(--ae-fog)] px-3 py-2 text-sm">
                        <span><strong>{cart.couponCode}</strong> applied</span>
                        <button type="button" disabled={isMutating} onClick={() => { void removeCoupon().catch(() => undefined); }} className="focus-ring rounded text-xs font-semibold underline decoration-[var(--ae-gilt)] underline-offset-4">Remove</button>
                      </div>
                    ) : (
                      <form onSubmit={submitCoupon} className="mt-3 flex gap-2">
                        <label htmlFor="cart-coupon" className="sr-only">Coupon code</label>
                        <input id="cart-coupon" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} maxLength={40} autoComplete="off" placeholder="Enter code" className="focus-ring min-w-0 flex-1 rounded-md border bg-white px-3 py-2 text-sm uppercase text-[var(--ae-forest)] placeholder:normal-case" />
                        <Button type="submit" size="sm" variant="outline" loading={isMutating} disabled={!couponCode.trim()}>Apply</Button>
                      </form>
                    )}
                  </section>

                  <section aria-labelledby="shipping-title" className="mt-7 border-t border-[var(--border)] pt-6">
                    <h3 id="shipping-title" className="flex items-center gap-2 text-sm font-semibold text-[var(--ae-forest)]"><Truck className="size-4 text-[var(--ae-gilt)]" aria-hidden="true" />Shipping estimate</h3>
                    <form onSubmit={submitShipping} className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
                      <label htmlFor="shipping-country" className="sr-only">Country</label>
                      <select id="shipping-country" value={country} onChange={(event) => setCountry(event.target.value)} className="focus-ring min-w-0 rounded-md border bg-white px-2 py-2 text-sm text-[var(--ae-forest)]">
                        <option value="LB">Lebanon</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="FR">France</option><option value="AE">UAE</option>
                      </select>
                      <label htmlFor="shipping-postal" className="sr-only">Postal code</label>
                      <input id="shipping-postal" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} maxLength={32} placeholder="Postal code" className="focus-ring min-w-0 rounded-md border bg-white px-3 py-2 text-sm" />
                      <Button type="submit" size="sm" variant="outline" loading={isMutating}>Check</Button>
                    </form>
                    {quotes.length ? <div className="mt-3 grid gap-2">{quotes.map((quote) => {
                      const selected = cart?.shippingEstimate?.methodCode === quote.code;
                      return <button key={quote.code} type="button" disabled={isMutating} onClick={() => void selectShipping(quote.code)} className={`focus-ring flex items-center justify-between gap-3 border p-3 text-left text-xs transition ${selected ? "border-[var(--ae-gilt)] bg-[var(--ae-parchment)]" : "border-[var(--border)] hover:border-[var(--ae-gilt)]"}`} aria-pressed={selected}><span><strong className="block text-sm text-[var(--ae-forest)]">{quote.name}</strong>{quote.minimumDeliveryDays}–{quote.maximumDeliveryDays} business days</span><span className="font-semibold text-[var(--ae-forest)]">{formatMoney(quote.amount, cart?.currency ?? "USD")}</span></button>;
                    })}</div> : null}
                  </section>

                  {upsells.length ? <Upsells products={upsells} addItem={addItem} busy={isMutating} /> : null}
                </>
              )}
            </div>

            <footer className="border-t border-[var(--border)] bg-[var(--ae-parchment)] px-5 py-5 sm:px-7">
              <div className="grid gap-1.5 text-sm text-[var(--muted-foreground)]">
                <MoneyRow label={`Subtotal · ${itemCount} ${itemCount === 1 ? "edition" : "editions"}`} value={formatMoney(cart?.subtotal ?? 0, cart?.currency ?? "USD")} />
                {cart?.discountTotal ? <MoneyRow label="Collector code" value={`−${formatMoney(cart.discountTotal, cart.currency)}`} /> : null}
                {cart?.shippingEstimate ? <MoneyRow label={cart.shippingEstimate.methodName || "Shipping"} value={formatMoney(cart.shippingTotal, cart.currency)} /> : null}
                <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-3 font-semibold text-[var(--ae-forest)]"><span>Estimated total</span><span>{formatMoney(cart?.total ?? 0, cart?.currency ?? "USD")}</span></div>
              </div>
              <Button className="mt-4 w-full" disabled={items.length === 0} loading={isMutating} loadingLabel="Updating bag" onClick={continueToCheckout}>
                Continue to checkout <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <p className="mt-3 text-center text-xs leading-5 text-[var(--muted-foreground)]">Inventory is reserved when checkout is submitted. No payment is taken yet.</p>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Upsells({ products, addItem, busy }: { products: ShopProduct[]; addItem: ReturnType<typeof useCart>["addItem"]; busy: boolean }) {
  return <section aria-labelledby="upsell-title" className="mt-7 border-t border-[var(--border)] pt-6"><p className="ae-kicker">Consider alongside</p><h3 id="upsell-title" className="ae-display mt-1 text-2xl text-[var(--ae-forest)]">Complete the story</h3><div className="mt-4 grid gap-3">{products.slice(0, 3).map((product) => {
    const variant = product.variants.find((item) => item.isAvailable);
    if (!variant) return null;
    return <article key={product.slug} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3"><div className="relative aspect-[4/5] overflow-hidden bg-[var(--ae-fog)]">{product.image ? <Image src={product.image} alt="" fill sizes="56px" className="object-cover" /> : null}</div><div className="min-w-0"><p className="truncate text-xs font-semibold text-[var(--ae-forest)]">{product.name}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{formatMajorMoney(variant.price, product.currency)}</p></div><button type="button" disabled={busy} onClick={() => void addItem({ id: `${product.id}:${variant.id}`, productId: product.slug, variantId: variant.id, image: product.image, imageAlt: product.imageAlt, name: `${product.name} — ${variant.name}`, price: formatMajorMoney(variant.price, product.currency) })} className="focus-ring grid size-9 place-items-center rounded-full border text-[var(--ae-forest)] transition hover:border-[var(--ae-gilt)] hover:bg-[var(--ae-fog)] disabled:opacity-40" aria-label={`Add ${product.name}`}><Plus className="size-4" aria-hidden="true" /></button></article>;
  })}</div></section>;
}

function MoneyRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><span>{label}</span><span className="tabular-nums">{value}</span></div>;
}

function formatMoney(value: number, currency: string) {
  return formatMajorMoney(value / (currency === "LBP" ? 1 : 100), currency);
}

function formatMajorMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { currency, style: "currency" }).format(value);
}
