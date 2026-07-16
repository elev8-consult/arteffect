"use client";

import { ArrowLeft, Check, Clock3, LockKeyhole, PackageCheck, Truck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { useCart, type CheckoutResult } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/ui/state-message";

const inputClass = "focus-ring mt-2 w-full rounded-md border bg-[var(--ae-white)] px-3 py-2.5 text-sm text-[var(--ae-forest)]";

export function CheckoutExperience() {
  const { cart, checkout, error, estimateShipping, isLoading, isMutating, items, quotes } = useCart();
  const [result, setResult] = useState<CheckoutResult | null>(null);
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

  async function getShippingEstimate() {
    try {
      await estimateShipping(country, postalCode || undefined);
    } catch {
      // The error is rendered by the shared cart state below.
    }
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const methodCode = String(form.get("shippingMethodCode") || cart?.shippingEstimate?.methodCode || "");
    if (!methodCode) {
      await getShippingEstimate();
      return;
    }
    try {
      const completed = await checkout({
        email: String(form.get("email") || ""),
        shippingMethodCode: methodCode,
        shippingAddress: {
          name: String(form.get("name") || ""),
          company: optional(form.get("company")),
          line1: String(form.get("line1") || ""),
          line2: optional(form.get("line2")),
          city: String(form.get("city") || ""),
          state: optional(form.get("state")),
          postalCode: optional(form.get("postalCode")),
          country: String(form.get("country") || ""),
          phone: String(form.get("phone") || "")
        }
      });
      setResult(completed);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // The server validation message is rendered below.
    }
  }

  if (isLoading) {
    return <main id="main-content" className="grid min-h-screen place-items-center bg-[var(--ae-parchment)] px-4 pt-16"><StateMessage type="loading" title="Preparing checkout" description="Restoring your reserved editions." /></main>;
  }

  if (result) return <CheckoutConfirmation result={result} />;

  if (!items.length) {
    return <main id="main-content" className="grid min-h-screen place-items-center bg-[var(--ae-parchment)] px-4 pt-16"><StateMessage title="Your bag is empty" description="Choose an edition before continuing to checkout." action={<Button asChild><Link href="/shop">Explore editions</Link></Button>} /></main>;
  }

  return (
    <main id="main-content" className="min-h-screen bg-[var(--ae-parchment)] pb-20 pt-24">
      <div className="ae-container">
        <Link href="/shop" className="focus-ring inline-flex items-center gap-2 rounded text-sm text-[var(--muted-foreground)] hover:text-[var(--ae-forest)]"><ArrowLeft className="size-4" aria-hidden="true" />Continue collecting</Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
          <form onSubmit={submitCheckout} className="grid gap-9">
            <header>
              <p className="ae-kicker">Secure reservation</p>
              <h1 className="ae-display mt-3 text-5xl font-semibold leading-none text-[var(--ae-forest)] sm:text-6xl">Where should the story arrive?</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">Confirm delivery details and we’ll reserve inventory for 30 minutes. Payment providers are being connected; no payment is taken on this screen.</p>
            </header>

            {error ? <div role="alert" className="border border-[var(--destructive)]/30 bg-[var(--destructive)]/[0.06] p-4 text-sm text-[var(--destructive)]">{error}</div> : null}

            <fieldset className="grid gap-5 border-t border-[var(--border)] pt-7 sm:grid-cols-2">
              <legend className="ae-display pr-4 text-3xl text-[var(--ae-forest)]">Collector details</legend>
              <Field label="Full name" name="name" autoComplete="name" required />
              <Field label="Email" name="email" type="email" autoComplete="email" required />
              <Field label="Phone" name="phone" type="tel" autoComplete="tel" required />
              <Field label="Company (optional)" name="company" autoComplete="organization" />
            </fieldset>

            <fieldset className="grid gap-5 border-t border-[var(--border)] pt-7 sm:grid-cols-2">
              <legend className="ae-display pr-4 text-3xl text-[var(--ae-forest)]">Delivery address</legend>
              <div className="sm:col-span-2"><Field label="Address" name="line1" autoComplete="address-line1" required /></div>
              <div className="sm:col-span-2"><Field label="Apartment, floor, or studio (optional)" name="line2" autoComplete="address-line2" /></div>
              <Field label="City" name="city" autoComplete="address-level2" required />
              <Field label="State or region (optional)" name="state" autoComplete="address-level1" />
              <label className="text-sm font-medium text-[var(--ae-forest)]">Country<select name="country" value={country} onChange={(event) => setCountry(event.target.value)} autoComplete="country" className={inputClass} required><option value="LB">Lebanon</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="FR">France</option><option value="AE">United Arab Emirates</option></select></label>
              <label className="text-sm font-medium text-[var(--ae-forest)]">Postal code <span className="font-normal text-[var(--muted-foreground)]">(optional)</span><input name="postalCode" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} autoComplete="postal-code" maxLength={32} className={inputClass} /></label>
            </fieldset>

            <fieldset className="border-t border-[var(--border)] pt-7">
              <legend className="ae-display pr-4 text-3xl text-[var(--ae-forest)]">Considered delivery</legend>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><p className="max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">Rates reflect the objects, destination, and handling profile in your bag.</p><Button type="button" variant="outline" loading={isMutating} loadingLabel="Checking rates" onClick={() => void getShippingEstimate()}><Truck className="size-4" aria-hidden="true" />Check delivery options</Button></div>
              {quotes.length ? <div className="mt-5 grid gap-3">{quotes.map((quote) => <label key={quote.code} className="focus-within:ring-2 focus-within:ring-[var(--ae-gilt)] flex cursor-pointer items-center gap-4 border border-[var(--border)] bg-[var(--ae-white)] p-4"><input type="radio" name="shippingMethodCode" value={quote.code} defaultChecked={cart?.shippingEstimate?.methodCode === quote.code} required className="size-4 accent-[var(--ae-forest)]" /><span className="min-w-0 flex-1"><strong className="block text-sm text-[var(--ae-forest)]">{quote.name}</strong><span className="text-xs text-[var(--muted-foreground)]">{quote.description || `${quote.minimumDeliveryDays}–${quote.maximumDeliveryDays} business days`}</span></span><strong className="text-sm text-[var(--ae-forest)]">{formatMoney(quote.amount, cart?.currency ?? "USD")}</strong></label>)}</div> : <p className="mt-5 border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">Enter your destination, then check delivery options before reserving.</p>}
            </fieldset>

            <Button type="submit" size="lg" className="w-full sm:w-auto sm:justify-self-end" disabled={!quotes.length} loading={isMutating} loadingLabel="Reserving editions"><LockKeyhole className="size-4" aria-hidden="true" />Confirm reservation</Button>
          </form>

          <OrderSummary />
        </div>
      </div>
    </main>
  );
}

function OrderSummary() {
  const { cart, items } = useCart();
  const currency = cart?.currency ?? "USD";
  return <aside aria-labelledby="order-summary-title" className="border border-[var(--border)] bg-[var(--ae-white)] p-5 lg:sticky lg:top-24"><p className="ae-kicker">Your edition</p><h2 id="order-summary-title" className="ae-display mt-2 text-3xl text-[var(--ae-forest)]">Order summary</h2><ul className="mt-5 divide-y divide-[var(--border)]">{items.map((item) => <li key={item.id} className="flex justify-between gap-5 py-4 text-sm"><span className="text-[var(--ae-forest)]">{item.name}<small className="mt-1 block text-[var(--muted-foreground)]">Quantity {item.quantity}</small></span><strong className="shrink-0 text-[var(--ae-forest)]">{formatMoney(item.lineTotal ?? 0, currency)}</strong></li>)}</ul><div className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4 text-sm"><SummaryRow label="Subtotal" value={formatMoney(cart?.subtotal ?? 0, currency)} />{cart?.discountTotal ? <SummaryRow label="Discount" value={`−${formatMoney(cart.discountTotal, currency)}`} /> : null}<SummaryRow label="Shipping" value={cart?.shippingEstimate ? formatMoney(cart.shippingTotal, currency) : "Calculated next"} /><div className="mt-2 flex justify-between border-t border-[var(--border)] pt-4 text-base font-semibold text-[var(--ae-forest)]"><span>Total</span><span>{formatMoney(cart?.total ?? 0, currency)}</span></div></div><div className="mt-6 grid gap-3 bg-[var(--ae-parchment)] p-4 text-xs leading-5 text-[var(--muted-foreground)]"><span className="flex gap-2"><PackageCheck className="mt-0.5 size-4 shrink-0 text-[var(--ae-gilt)]" aria-hidden="true" />Edition and impact records travel together.</span><span className="flex gap-2"><Clock3 className="mt-0.5 size-4 shrink-0 text-[var(--ae-gilt)]" aria-hidden="true" />Inventory is held for 30 minutes after confirmation.</span></div></aside>;
}

function CheckoutConfirmation({ result }: { result: CheckoutResult }) {
  return <main id="main-content" className="grid min-h-screen place-items-center bg-[var(--ae-forest)] px-4 py-24 text-[var(--ae-white)]"><section className="w-full max-w-2xl border border-white/20 bg-white/[0.04] p-7 text-center sm:p-12"><span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--ae-gilt)] text-[var(--ae-onyx)]"><Check className="size-6" aria-hidden="true" /></span><p className="ae-kicker mt-7">Reservation created</p><h1 className="ae-display mt-3 text-5xl font-semibold leading-none sm:text-6xl">Your editions are being held.</h1><p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-white/65">Your reservation is confirmed for 30 minutes while payment providers are connected. No charge has been made.</p><dl className="mx-auto mt-8 grid max-w-md gap-px bg-white/15 text-left sm:grid-cols-2"><div className="bg-[var(--ae-forest)] p-4"><dt className="text-xs uppercase tracking-[.12em] text-white/45">Order</dt><dd className="mt-2 font-semibold">{result.order.orderNumber}</dd></div><div className="bg-[var(--ae-forest)] p-4"><dt className="text-xs uppercase tracking-[.12em] text-white/45">Total</dt><dd className="mt-2 font-semibold">{formatMoney(result.order.total, result.order.currency)}</dd></div></dl><Button asChild variant="outline" className="mt-8 border-white/30 text-white hover:bg-white/10 hover:text-white"><Link href="/impact">Follow the impact story</Link></Button></section></main>;
}

function Field({ label, name, type = "text", ...props }: { label: string; name: string; type?: string; required?: boolean; autoComplete?: string }) {
  return <label className="text-sm font-medium text-[var(--ae-forest)]">{label}<input name={name} type={type} maxLength={160} className={inputClass} {...props} /></label>;
}

function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 text-[var(--muted-foreground)]"><span>{label}</span><span>{value}</span></div>; }
function optional(value: FormDataEntryValue | null) { const text = String(value || "").trim(); return text || undefined; }
function formatMoney(value: number, currency: string) { return new Intl.NumberFormat("en-US", { currency, style: "currency" }).format(value / (currency === "LBP" ? 1 : 100)); }
