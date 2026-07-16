"use client";

import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { useCart } from "@/components/cart/cart-context";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { itemCount, setDrawerOpen } = useCart();

  const navHref = (item: (typeof siteConfig.nav)[number]) => {
    if (item.label === "Products") return "/shop";
    if (item.label === "Artist") return "/artists";
    if (item.label === "Cause") return "/causes";
    if (item.label === "Impact") return "/impact";
    return pathname === "/" ? item.href : `/${item.href}`;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[rgba(25,43,30,0.88)] text-[var(--ae-white)] backdrop-blur-xl">
      <div className="ae-container flex h-16 items-center justify-between gap-3">
        <Link href="/" className="focus-ring ae-display rounded text-2xl font-semibold" aria-label="ArtEffect home">
          ArtEffect
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={navHref(item)} className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-white/[0.75] transition hover:text-white">
              {item.label}
            </Link>
          ))}
          <span aria-hidden="true" className="mx-1 h-4 w-px bg-white/20" />
          {siteConfig.utilityNav.slice(0, 2).map((item) => (
            <Link key={item.href} href={item.href} className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-white/[0.75] transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/account" className="focus-ring grid size-10 place-items-center rounded-full text-white transition hover:bg-white/10" aria-label="Your account">
            <UserRound className="size-[1.1rem]" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="focus-ring relative inline-flex size-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
            aria-label={`Open reservation bag, ${itemCount} ${itemCount === 1 ? "edition" : "editions"}`}
          >
            <ShoppingBag className="size-[1.1rem]" aria-hidden="true" />
            {itemCount > 0 ? <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-[var(--ae-gilt)] text-[0.6rem] font-bold text-[var(--ae-onyx)]">{itemCount}</span> : null}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="focus-ring grid size-10 place-items-center rounded-full text-white transition hover:bg-white/10 lg:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div id="mobile-navigation" className={menuOpen ? "border-t border-white/10 lg:hidden" : "hidden"}>
        <nav aria-label="Mobile navigation" className="ae-container grid py-3">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={navHref(item)} onClick={() => setMenuOpen(false)} className="focus-ring rounded px-2 py-3 text-sm font-medium text-white/[0.8] transition hover:bg-white/10 hover:text-white">
              {item.label}
            </Link>
          ))}
          {siteConfig.utilityNav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="focus-ring rounded px-2 py-3 text-sm font-medium text-white/[0.8] transition hover:bg-white/10 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <CartDrawer />
    </header>
  );
}
