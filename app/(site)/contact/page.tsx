import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

import { ContactForm } from "@/components/content/contact-form";
import { getContactContent } from "@/lib/cms/contact";
import { siteConfig } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getContactContent();
  const title = seo.metaTitle ?? "Contact ArtEffect";
  const description = seo.metaDescription ?? "Contact ArtEffect about editions, orders, collaborations, or cause partnerships.";
  const image = seo.openGraphImage ?? siteConfig.socialImage;
  return { title, description, alternates: { canonical: "/contact" }, openGraph: { title, description, type: "website", url: `${siteConfig.url}/contact`, images: [image] }, twitter: { card: "summary_large_image", title, description, images: [image] } };
}

export default async function ContactPage() {
  const content = await getContactContent();
  const details = [
    { href: `mailto:${content.details.email}`, icon: Mail, label: "Email", value: content.details.email },
    content.details.phone ? { href: `tel:${content.details.phone.replace(/[^+\d]/g, "")}`, icon: Phone, label: "Phone", value: content.details.phone } : null,
    content.details.address ? { icon: MapPin, label: "Studio", value: content.details.address } : null,
    content.details.hours ? { icon: Clock3, label: "Hours", value: content.details.hours } : null
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return <main id="main-content" className="bg-[var(--ae-parchment)] pt-16">
    <header className="bg-[var(--ae-forest)] py-20 text-white sm:py-28"><div className="ae-container grid gap-10 lg:grid-cols-[1fr_.6fr] lg:items-end"><div><p className="ae-kicker">{content.eyebrow}</p><h1 className="ae-display mt-5 max-w-4xl text-[clamp(4.5rem,11vw,8.5rem)] font-light leading-[.76] tracking-[-.04em]">{content.title}</h1></div><p className="max-w-md border-l border-[var(--ae-gilt)] pl-5 text-base leading-7 text-white/65">{content.introduction}</p></div></header>
    <section aria-label="Contact ArtEffect" className="ae-section"><div className="ae-container grid gap-10 lg:grid-cols-[.62fr_1.38fr] lg:gap-20"><aside><p className="ae-kicker">Ways to reach us</p><div className="mt-7 divide-y divide-[var(--border)] border-y border-[var(--border)]">{details.map(({ href, icon: Icon, label, value }) => { const body = <><span className="grid size-9 place-items-center rounded-full border border-[var(--ae-gilt)]/40 text-[var(--ae-gilt)]"><Icon className="size-4" aria-hidden="true" /></span><span><span className="block text-[.68rem] font-semibold uppercase tracking-[.12em] text-[var(--ae-stone)]">{label}</span><span className="mt-1 block text-sm leading-6 text-[var(--ae-forest)]">{value}</span></span></>; return href ? <a key={label} href={href} className="focus-ring flex gap-4 py-5 transition hover:translate-x-1">{body}</a> : <div key={label} className="flex gap-4 py-5">{body}</div>; })}</div>{content.responseNote ? <p className="mt-6 text-sm leading-6 text-[var(--muted-foreground)]">{content.responseNote}</p> : null}</aside><div><p className="ae-kicker mb-5">Write to us</p><ContactForm topics={content.topics} /></div></div></section>
  </main>;
}
