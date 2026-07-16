"use client";

import { Heart, LogOut, MapPin, Package, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/ui/state-message";

type Account = { addresses: Array<Record<string, unknown>>; createdAt?: string; email: string; id: number | string; name: string | null; wishlistCount: number };
type Order = { createdAt?: string; currency?: string; itemCount?: number; orderNumber?: string; paymentStatus?: string; status?: string; total?: number };
type ViewState = "loading" | "signed-in" | "signed-out" | "unavailable";
type AccountResult = { account?: Account; message?: string; orders?: Order[]; view: Exclude<ViewState, "loading"> };

export function AccountExperience() {
  const [account, setAccount] = useState<Account | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<ViewState>("loading");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function requestAccount(): Promise<AccountResult> {
    try {
      const response = await fetch("/api/account", { credentials: "same-origin" });
      const body = await response.json() as { data?: Account; error?: { code?: string; message?: string } };
      if (response.status === 401) return { view: "signed-out" };
      if (!response.ok || !body.data) return { message: body.error?.message ?? "Your account could not be loaded.", view: "unavailable" };
      const orderResponse = await fetch("/api/account/orders?limit=20&page=1", { credentials: "same-origin" });
      const orderBody = await orderResponse.json() as { data?: { docs?: Order[] } };
      return { account: body.data, orders: orderResponse.ok ? orderBody.data?.docs ?? [] : [], view: "signed-in" };
    } catch {
      return { message: "Your account could not be loaded. Please try again.", view: "unavailable" };
    }
  }

  function applyAccount(result: AccountResult) {
    setAccount(result.account ?? null);
    setOrders(result.orders ?? []);
    setMessage(result.message ?? "");
    setView(result.view);
  }

  async function loadAccount() {
    setView("loading");
    setMessage("");
    applyAccount(await requestAccount());
  }

  useEffect(() => {
    let active = true;
    void requestAccount().then((result) => { if (active) applyAccount(result); });
    return () => { active = false; };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/users/login", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: fields.get("email"), password: fields.get("password") }) });
      const body = await response.json() as { errors?: Array<{ message?: string }>; message?: string };
      if (!response.ok) throw new Error(body.errors?.[0]?.message ?? body.message ?? "Those sign-in details were not recognised.");
      await loadAccount();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Sign in failed."); } finally { setSaving(false); }
  }

  async function signOut() {
    setSaving(true);
    try { await fetch("/api/users/logout", { method: "POST", credentials: "same-origin" }); } finally { setAccount(null); setOrders([]); setView("signed-out"); setSaving(false); }
  }

  async function updateName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/account", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: fields.get("name") }) });
      const body = await response.json() as { data?: Account; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Your profile could not be saved.");
      setAccount(body.data);
      setMessage("Profile saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Your profile could not be saved."); } finally { setSaving(false); }
  }

  if (view === "loading") return <div className="ae-container py-24"><StateMessage type="loading" title="Opening your account" description="Loading your profile and edition history." /></div>;
  if (view === "unavailable") return <div className="ae-container py-24"><StateMessage type="error" title="Account unavailable" description={message} action={<Button variant="outline" onClick={() => void loadAccount()}>Try again</Button>} /></div>;

  if (view === "signed-out") return <section className="ae-section"><div className="ae-container grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-center lg:gap-24"><div><p className="ae-kicker">Collector account</p><h2 className="ae-display mt-4 text-5xl leading-[.92] text-[var(--ae-forest)] sm:text-7xl">Your editions, kept together.</h2><p className="mt-6 max-w-md text-sm leading-7 text-[var(--muted-foreground)]">Sign in to review orders, saved addresses, and the objects on your wishlist.</p></div><form onSubmit={signIn} className="border border-[var(--border)] bg-[var(--ae-white)] p-7 sm:p-10"><h3 className="ae-display text-4xl text-[var(--ae-forest)]">Welcome back.</h3><label className="mt-8 grid gap-2 text-sm font-semibold text-[var(--ae-forest)]">Email<input name="email" type="email" autoComplete="email" required className="focus-ring h-12 rounded-sm border border-[var(--border)] bg-transparent px-3 font-normal" /></label><label className="mt-5 grid gap-2 text-sm font-semibold text-[var(--ae-forest)]">Password<input name="password" type="password" autoComplete="current-password" required className="focus-ring h-12 rounded-sm border border-[var(--border)] bg-transparent px-3 font-normal" /></label><div className="mt-7 flex flex-wrap items-center gap-5"><Button type="submit" size="lg" loading={saving} loadingLabel="Signing in">Sign in</Button><Link href="/contact" className="focus-ring text-sm text-[var(--muted-foreground)] underline decoration-[var(--ae-gilt)] underline-offset-4">Need help?</Link></div><p role={message ? "alert" : "status"} aria-live="polite" className="mt-5 text-sm text-[var(--destructive)]">{message}</p></form></div></section>;

  if (!account) return null;
  return <section className="ae-section"><div className="ae-container">
    <div className="flex flex-wrap items-end justify-between gap-7"><div><p className="ae-kicker">Collector account</p><h2 className="ae-display mt-3 text-5xl leading-none text-[var(--ae-forest)] sm:text-7xl">Welcome{account.name ? `, ${account.name.split(" ")[0]}` : " back"}.</h2><p className="mt-4 text-sm text-[var(--muted-foreground)]">{account.email}</p></div><Button variant="outline" onClick={() => void signOut()} loading={saving} loadingLabel="Signing out"><LogOut className="size-4" aria-hidden="true" /> Sign out</Button></div>
    <div className="mt-12 grid gap-px bg-[var(--border)] sm:grid-cols-3"><Stat icon={Package} label="Orders" value={orders.length} /><Stat icon={Heart} label="Wishlist" value={account.wishlistCount} /><Stat icon={MapPin} label="Saved addresses" value={account.addresses.length} /></div>
    <div className="mt-14 grid gap-12 lg:grid-cols-[1.25fr_.75fr] lg:gap-20"><div><p className="ae-kicker">Edition history</p><h3 className="ae-display mt-3 text-4xl text-[var(--ae-forest)]">Your orders</h3>{orders.length ? <div className="mt-7 border-t border-[var(--border)]">{orders.map((order, index) => <article key={order.orderNumber ?? index} className="grid gap-4 border-b border-[var(--border)] py-6 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-semibold text-[var(--ae-forest)]">{order.orderNumber ?? "ArtEffect order"}</p><p className="mt-2 text-xs uppercase tracking-[.1em] text-[var(--ae-stone)]">{formatDate(order.createdAt)} · {order.itemCount ?? 0} {(order.itemCount ?? 0) === 1 ? "edition" : "editions"}</p></div><div className="sm:text-right"><p className="ae-display text-3xl text-[var(--ae-forest)]">{formatMoney(order.total, order.currency)}</p><p className="mt-1 text-xs font-semibold uppercase tracking-[.09em] text-[var(--ae-gilt)]">{(order.status ?? "pending").replaceAll("-", " ")}</p></div></article>)}</div> : <StateMessage className="mt-7" title="No orders yet" description="When you reserve an edition, its details will appear here." action={<Button asChild variant="outline"><Link href="/shop">Explore editions</Link></Button>} />}</div>
      <aside><p className="ae-kicker">Profile</p><form onSubmit={updateName} className="mt-7 border border-[var(--border)] bg-[var(--ae-white)] p-6"><UserRound className="size-5 text-[var(--ae-gilt)]" aria-hidden="true" /><label className="mt-6 grid gap-2 text-sm font-semibold text-[var(--ae-forest)]">Display name<input name="name" defaultValue={account.name ?? ""} maxLength={120} autoComplete="name" className="focus-ring h-11 rounded-sm border border-[var(--border)] bg-transparent px-3 font-normal" /></label><Button type="submit" className="mt-5" loading={saving} loadingLabel="Saving">Save profile</Button><p aria-live="polite" className={`mt-4 text-sm ${message === "Profile saved." ? "text-[var(--ae-forest)]" : "text-[var(--destructive)]"}`}>{message}</p></form>{account.addresses.length ? <div className="mt-8"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--ae-stone)]">Saved places</p><div className="mt-3 divide-y divide-[var(--border)] border-y border-[var(--border)]">{account.addresses.map((address, index) => <div key={String(address.id ?? index)} className="py-4"><p className="text-sm font-semibold text-[var(--ae-forest)]">{String(address.label ?? `Address ${index + 1}`)}</p><p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{[address.line1, address.city, address.country].filter((value) => typeof value === "string").join(", ")}</p></div>)}</div></div> : null}</aside>
    </div>
  </div></section>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number }) { return <div className="bg-[var(--ae-white)] p-6"><Icon className="size-5 text-[var(--ae-gilt)]" aria-hidden="true" /><p className="ae-display mt-8 text-5xl text-[var(--ae-forest)]">{value}</p><p className="mt-2 text-xs font-semibold uppercase tracking-[.11em] text-[var(--ae-stone)]">{label}</p></div>; }
function formatDate(value?: string) { const date = value ? new Date(value) : null; return date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(date) : "Date pending"; }
function formatMoney(value?: number, currency = "USD") { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format((value ?? 0) / 100); }
