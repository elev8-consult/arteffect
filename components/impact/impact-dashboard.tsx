"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, BadgeCheck, Leaf, Package, Sprout, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { AnimatedNumber } from "@/components/motion/animated-number";
import type { ImpactDashboard as ImpactDashboardData, ImpactMetricType } from "@/types/impact";

type ImpactDashboardProps = { dashboard: ImpactDashboardData };

const stateCopy: Record<ImpactMetricType, string> = {
  committed: "Committed",
  projected: "Projected",
  transferred: "Transferred",
  verified: "Verified"
};

const purchaseSteps = [
  {
    body: "When an edition is reserved, its published allocation is attached to the batch — never hidden in a general promise.",
    label: "A collector chooses an edition",
    metric: "One purchase, a visible share",
    title: "The object begins a record.",
    icon: Package
  },
  {
    body: "The batch allocation is logged as a distinct ledger entry. That number is shown as projected, committed, transferred, or verified.",
    label: "A batch allocation is logged",
    metric: "No double-counting across states",
    title: "A commitment gets a place and a date.",
    icon: Wallet
  },
  {
    body: "Our NGO partner receives the funds and reports what happened in the field. We publish that update beside the original allocation.",
    label: "The partner shares an update",
    metric: "Evidence stays attached to the work",
    title: "The field closes the loop.",
    icon: BadgeCheck
  }
];

export function ImpactDashboard({ dashboard }: ImpactDashboardProps) {
  const [activeCause, setActiveCause] = useState("all");
  const [activeStep, setActiveStep] = useState(0);
  const reducedMotion = useReducedMotion();
  const visibleEntries = useMemo(
    () => activeCause === "all" ? dashboard.entries : dashboard.entries.filter((entry) => entry.cause.slug === activeCause),
    [activeCause, dashboard.entries]
  );
  const causeFilters = useMemo(
    () => [...new Map(dashboard.causeTotals.map((cause) => [cause.slug, cause])).values()],
    [dashboard.causeTotals]
  );
  const selectedStep = purchaseSteps[activeStep];
  const StepIcon = selectedStep.icon;

  return (
    <main id="main-content" className="overflow-hidden bg-[var(--ae-parchment)] pt-16">
      <section className="relative isolate overflow-hidden bg-[var(--ae-forest)] text-[var(--ae-white)]">
        <div aria-hidden="true" className="absolute inset-0 opacity-50">
          <div className="absolute -right-[12%] top-[-18%] aspect-square w-[min(70rem,110vw)] rounded-full border border-[var(--ae-gilt)]/25" />
          <div className="absolute -right-[4%] top-[-9%] aspect-square w-[min(52rem,82vw)] rounded-full border border-white/10" />
          <div className="absolute bottom-[-16rem] left-[12%] h-[28rem] w-[120%] -rotate-6 border-t border-[var(--ae-gilt)]/20" />
        </div>
        <div className="ae-container relative grid min-h-[min(44rem,calc(100svh-4rem))] content-end py-14 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_23rem] lg:items-end lg:gap-12">
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 24 }} animate={reducedMotion ? undefined : { opacity: 1, y: 0 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }} className="max-w-4xl">
            <p className="ae-kicker">The impact ledger</p>
            <h1 className="ae-display mt-5 max-w-4xl text-[clamp(4.6rem,13vw,9rem)] font-light leading-[.72] tracking-[-.045em]">Proof, not<br />a promise.</h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">Every ArtEffect object carries a published path from edition to allocation to field update. This is where we keep the work visible.</p>
            <a href="#ledger" className="focus-ring mt-9 inline-flex items-center gap-3 rounded-sm border-b border-[var(--ae-gilt)] pb-2 text-sm font-semibold text-[var(--ae-white)] transition hover:text-[var(--ae-gilt)]">
              Follow the ledger <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </motion.div>
          <motion.aside initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={reducedMotion ? undefined : { opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="mt-12 border-l border-[var(--ae-gilt)]/60 pl-5 lg:mt-0">
            <p className="text-xs font-medium uppercase tracking-[.14em] text-[var(--ae-gilt)]">Our reporting principle</p>
            <p className="ae-display mt-3 text-3xl leading-none text-white">Each allocation appears once.</p>
            <p className="mt-4 text-sm leading-6 text-white/60">Its evidence state can change, but it is never added again just to make a total look larger.</p>
          </motion.aside>
        </div>
      </section>

      <section aria-labelledby="impact-totals-title" className="ae-section border-b border-[var(--border)] bg-[var(--ae-fog)]">
        <div className="ae-container">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
            <div><p className="ae-kicker">At a glance</p><h2 id="impact-totals-title" className="ae-display mt-3 text-5xl font-light leading-none text-[var(--ae-forest)] sm:text-6xl">The numbers, with their state.</h2></div>
            <p className="max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">Totals below are additive allocations. The marker tells you how far each reported outcome has travelled.</p>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.headlineStats.map((stat, index) => <motion.article key={`${stat.label}-${index}`} initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className={`group min-h-64 p-6 sm:p-8 ${stat.metricType === "verified" ? "bg-[color-mix(in_srgb,var(--ae-gilt)_18%,var(--ae-white))]" : "bg-[var(--ae-white)]"}`}>
              <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-[.13em] text-[var(--ae-forest)]">{stat.label}</span><StatePill type={stat.metricType} /></div>
              <p className="ae-display mt-12 text-6xl font-medium leading-none tracking-[-.04em] text-[var(--ae-forest)]"><AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} /></p>
              <p className="mt-5 max-w-xs text-sm leading-6 text-[var(--muted-foreground)]">{stat.detail}</p>
            </motion.article>)}
          </div>
        </div>
      </section>

      <section aria-labelledby="purchase-path-title" className="ae-section">
        <div className="ae-container">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.85fr)] md:items-end"><div><p className="ae-kicker">How one purchase creates change</p><h2 id="purchase-path-title" className="ae-display mt-3 max-w-2xl text-5xl font-light leading-[.9] text-[var(--ae-forest)] sm:text-6xl">The path stays attached to the object.</h2></div><p className="max-w-md text-sm leading-6 text-[var(--muted-foreground)]">Explore each point in the chain. The purpose is not to turn an object into a claim — it is to keep the claim accountable.</p></div>
          <div className="mt-11 grid gap-0 border border-[var(--border)] lg:grid-cols-[.82fr_1.18fr]">
            <div role="tablist" aria-label="How an ArtEffect purchase creates change" className="grid content-start border-b border-[var(--border)] bg-[var(--ae-fog)] lg:border-b-0 lg:border-r">
              {purchaseSteps.map((step, index) => {
                const Icon = step.icon;
                const selected = activeStep === index;
                return <button key={step.label} type="button" role="tab" aria-selected={selected} aria-controls="purchase-step-panel" id={`purchase-step-${index}`} onClick={() => setActiveStep(index)} className={`focus-ring group flex items-center gap-4 border-b border-[var(--border)] p-5 text-left transition last:border-b-0 sm:p-6 ${selected ? "bg-[var(--ae-forest)] text-white" : "text-[var(--ae-forest)] hover:bg-white/70"}`}>
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full border ${selected ? "border-[var(--ae-gilt)] text-[var(--ae-gilt)]" : "border-[var(--ae-stone)]/45 text-[var(--ae-stone)]"}`}><Icon className="size-4" aria-hidden="true" /></span><span><span className="block text-xs font-semibold uppercase tracking-[.13em] opacity-65">0{index + 1}</span><span className="mt-1 block text-sm font-semibold leading-5">{step.label}</span></span>
                </button>;
              })}
            </div>
            <motion.div key={activeStep} id="purchase-step-panel" role="tabpanel" aria-labelledby={`purchase-step-${activeStep}`} initial={reducedMotion ? false : { opacity: 0, x: 10 }} animate={reducedMotion ? undefined : { opacity: 1, x: 0 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }} className="relative min-h-[25rem] overflow-hidden bg-[var(--ae-forest-soft)] p-7 text-[var(--ae-white)] sm:p-10">
              <div aria-hidden="true" className="absolute -right-10 -top-14 grid size-64 place-items-center rounded-full border border-[var(--ae-gilt)]/30 sm:size-80"><div className="grid size-44 place-items-center rounded-full border border-white/15 sm:size-56"><StepIcon className="size-14 text-[var(--ae-gilt)] sm:size-20" /></div></div>
              <div className="relative max-w-md pt-36 sm:pt-44"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[var(--ae-gilt)]">{selectedStep.metric}</p><h3 className="ae-display mt-4 text-4xl font-light leading-none sm:text-5xl">{selectedStep.title}</h3><p className="mt-6 text-sm leading-7 text-white/70 sm:text-base">{selectedStep.body}</p></div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="ledger" aria-labelledby="ledger-title" className="ae-section border-y border-[var(--border)] bg-[var(--ae-fog)]">
        <div className="ae-container">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="ae-kicker">The public ledger</p><h2 id="ledger-title" className="ae-display mt-3 text-5xl font-light leading-none text-[var(--ae-forest)] sm:text-6xl">Every entry has a home.</h2></div><div className="flex flex-wrap gap-2" aria-label="Filter ledger by cause"><FilterButton active={activeCause === "all"} onClick={() => setActiveCause("all")}>All causes</FilterButton>{causeFilters.map((cause) => <FilterButton key={cause.slug} active={activeCause === cause.slug} onClick={() => setActiveCause(cause.slug)}>{cause.name}</FilterButton>)}</div></div>
          <div className="mt-10 grid gap-7 lg:grid-cols-[11rem_minmax(0,1fr)]">
            <aside className="border-l-2 border-[var(--ae-gilt)] pl-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--ae-stone)]">Read it this way</p><p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">A state reflects the evidence attached to a distinct allocation. It does not create a second total.</p></aside>
            <ol className="border-t border-[var(--border)]">{visibleEntries.map((entry, index) => <motion.li key={entry.id} initial={reducedMotion ? false : { opacity: 0, y: 12 }} whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ delay: index * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="grid gap-4 border-b border-[var(--border)] py-6 md:grid-cols-[8.5rem_minmax(0,1fr)_auto] md:gap-7">
              <div><time dateTime={entry.occurredAt} className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--ae-stone)]">{formatDate(entry.occurredAt)}</time><div className="mt-3"><StatePill type={entry.metricType} /></div></div>
              <div><h3 className="ae-display text-3xl leading-none text-[var(--ae-forest)]">{entry.title}</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{entry.description}</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-[var(--ae-forest)]"><Link className="focus-ring rounded underline decoration-[var(--ae-gilt)] underline-offset-4" href={`/causes/${entry.cause.slug}`}>{entry.cause.name}</Link>{entry.drop ? <Link className="focus-ring rounded underline decoration-[var(--ae-gilt)] underline-offset-4" href={`/drops/${entry.drop.slug}`}>{entry.drop.title}</Link> : null}{entry.source ? <span className="text-[var(--ae-stone)]">{entry.source}</span> : null}</div></div>
              <div className="flex items-end justify-between gap-5 md:flex-col md:items-end"><p className="ae-display text-3xl leading-none text-[var(--ae-forest)]">{formatCurrency(entry.amount, entry.currency)}</p>{entry.impactValue !== undefined && entry.impactLabel ? <p className="text-right text-xs font-semibold uppercase tracking-[.1em] text-[var(--ae-gilt)]">{entry.impactValue.toLocaleString("en-US")}{entry.impactSuffix}<span className="mt-1 block text-[var(--ae-stone)]">{entry.impactLabel}</span></p> : null}</div>
            </motion.li>)}</ol>
          </div>
          {!visibleEntries.length ? <p className="mt-8 text-sm text-[var(--muted-foreground)]">{activeCause === "all" ? "No published allocations have been added yet." : "No published allocations match this cause yet."}</p> : null}
        </div>
      </section>

      <section aria-labelledby="cause-total-title" className="ae-section bg-[var(--ae-forest)] text-[var(--ae-white)]">
        <div className="ae-container"><div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end"><div><p className="ae-kicker">Totals by cause</p><h2 id="cause-total-title" className="ae-display mt-3 text-5xl font-light leading-none sm:text-6xl">Where the allocations are going.</h2></div>{dashboard.lastUpdated ? <p className="text-sm text-white/55">Ledger updated {formatDate(dashboard.lastUpdated)}</p> : null}</div>
          <div className="mt-10 divide-y divide-white/15 border-y border-white/15">{dashboard.causeTotals.map((cause, index) => <motion.article key={`${cause.slug}-${cause.currency}`} initial={reducedMotion ? false : { opacity: 0, x: -12 }} whileInView={reducedMotion ? undefined : { opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ delay: index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="grid gap-5 py-7 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-12"><div><p className="ae-display text-4xl leading-none">{cause.name}</p>{cause.focus ? <p className="mt-3 text-sm text-white/60">{cause.focus}</p> : null}</div><div className="flex items-center gap-3 text-sm text-white/65"><span className="grid size-8 place-items-center rounded-full bg-[var(--ae-gilt)]/15 text-[var(--ae-gilt)]"><Leaf className="size-4" aria-hidden="true" /></span>{cause.entryCount} {cause.entryCount === 1 ? "allocation" : "allocations"}<StatePill type={cause.latestMetricType} inverted /></div><div className="flex items-center justify-between gap-5 md:justify-end"><p className="ae-display text-5xl leading-none text-[var(--ae-gilt)]">{formatCurrency(cause.total, cause.currency)}</p><Link href={`/causes/${cause.slug}`} className="focus-ring grid size-10 place-items-center rounded-full border border-white/25 transition hover:border-[var(--ae-gilt)] hover:text-[var(--ae-gilt)]" aria-label={`View ${cause.name}'s impact profile`}><ArrowUpRight className="size-4" aria-hidden="true" /></Link></div></motion.article>)}</div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-white/15 pt-7"><p className="max-w-2xl text-sm leading-6 text-white/60">The total is the sum of distinct published allocations, not an estimate of every future outcome.</p><Link href="/causes" className="focus-ring inline-flex items-center gap-2 border-b border-[var(--ae-gilt)] pb-2 text-sm font-semibold text-white transition hover:text-[var(--ae-gilt)]">Meet the cause partners <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
        </div>
      </section>
    </main>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`focus-ring rounded-full border px-4 py-2 text-xs font-semibold transition ${active ? "border-[var(--ae-forest)] bg-[var(--ae-forest)] text-white" : "border-[var(--ae-stone)]/50 text-[var(--ae-forest)] hover:border-[var(--ae-gilt)]"}`}>{children}</button>;
}

function StatePill({ type, inverted = false }: { type: ImpactMetricType; inverted?: boolean }) {
  const verified = type === "verified";
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[.09em] ${verified ? (inverted ? "border-[var(--ae-red)] bg-[var(--ae-red)] text-white" : "border-[var(--ae-red)] bg-white text-[var(--ae-red)]") : (inverted ? "border-white/25 bg-white/10 text-white/75" : "border-[var(--border)] bg-white text-[var(--ae-ink)]")}`}>{verified ? <BadgeCheck className={`size-3 ${inverted ? "text-white" : "text-[var(--ae-red)]"}`} aria-hidden="true" /> : <Sprout className={`size-3 ${inverted ? "text-white/55" : "text-[var(--ae-stone)]"}`} aria-hidden="true" />}{stateCopy[type]}</span>;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { currency, maximumFractionDigits: 0, style: "currency" }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(date) : "Date pending";
}
