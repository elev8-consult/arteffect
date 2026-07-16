"use client";

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { RichText } from "@/components/content/rich-text";
import type { FAQCategory, FAQItem } from "@/types/content";

const labels: Record<FAQCategory, string> = { artists: "Artists", drops: "Drops", impact: "Impact", orders: "Orders", products: "Products", "shipping-returns": "Shipping & returns" };

export function FAQExperience({ faqs }: { faqs: FAQItem[] }) {
  const [category, setCategory] = useState<FAQCategory | "all">("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => faqs.filter((faq) => (category === "all" || faq.category === category) && (!query.trim() || faq.question.toLowerCase().includes(query.trim().toLowerCase()))), [category, faqs, query]);

  return <section aria-labelledby="faq-list-title" className="ae-section"><div className="ae-container grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-20">
    <aside><p className="ae-kicker">Find an answer</p><div className="relative mt-5"><label htmlFor="faq-search" className="sr-only">Search frequently asked questions</label><input id="faq-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions" className="focus-ring h-11 w-full rounded-sm border border-[var(--border)] bg-[var(--ae-white)] px-3 pr-10 text-sm" /><Search className="pointer-events-none absolute right-3 top-3.5 size-4 text-[var(--ae-stone)]" aria-hidden="true" /></div><div aria-label="FAQ categories" className="mt-6 grid border-t border-[var(--border)]"><Filter active={category === "all"} onClick={() => setCategory("all")}>All questions</Filter>{(Object.entries(labels) as Array<[FAQCategory, string]>).map(([value, label]) => <Filter key={value} active={category === value} onClick={() => setCategory(value)}>{label}</Filter>)}</div></aside>
    <div><div className="flex items-end justify-between gap-5"><div><p className="ae-kicker">{category === "all" ? "Everything, explained" : labels[category]}</p><h2 id="faq-list-title" className="ae-display mt-3 text-5xl leading-none text-[var(--ae-forest)] sm:text-6xl">Questions, considered.</h2></div><span className="text-xs font-semibold uppercase tracking-[.1em] text-[var(--ae-stone)]">{visible.length} answers</span></div><div className="mt-9 border-t border-[var(--border)]">{visible.map((faq) => <details key={faq.id} className="group border-b border-[var(--border)]"><summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-base font-semibold text-[var(--ae-forest)] marker:content-none"><span>{faq.question}</span><span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--border)] transition group-open:rotate-180 group-open:border-[var(--ae-gilt)]"><ChevronDown className="size-4" aria-hidden="true" /></span></summary><RichText content={faq.answer} className="max-w-2xl pb-7 pr-10" /></details>)}{!visible.length ? <div className="border-b border-[var(--border)] py-14"><p className="ae-display text-4xl text-[var(--ae-forest)]">No exact match.</p><p className="mt-3 text-sm text-[var(--muted-foreground)]">Try a shorter search, or choose another category.</p></div> : null}</div></div>
  </div></section>;
}

function Filter({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) { return <button type="button" aria-pressed={active} onClick={onClick} className={`focus-ring border-b border-[var(--border)] py-3 text-left text-sm transition ${active ? "font-semibold text-[var(--ae-forest)]" : "text-[var(--muted-foreground)] hover:pl-1 hover:text-[var(--ae-forest)]"}`}>{children}</button>; }
