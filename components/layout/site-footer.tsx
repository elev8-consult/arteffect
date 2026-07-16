import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--ae-forest)] py-12 text-[var(--ae-white)]">
      <div className="ae-container grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div>
          <p className="ae-display text-4xl font-semibold">ArtEffect</p>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/[0.68]">
            Limited art objects with artist royalties, NGO partnerships, and
            impact reporting built into every drop.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/[0.68] md:justify-end">
          {siteConfig.nav.map((item) => (
            <a
              key={item.href}
              href={item.label === "Products" ? "/shop" : item.label === "Artist" ? "/artists" : item.label === "Cause" ? "/causes" : item.label === "Impact" ? "/impact" : `/${item.href}`}
              className="transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
          {siteConfig.utilityNav.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
          <a href="/account" className="transition hover:text-white">Account</a>
        </div>
      </div>
    </footer>
  );
}
