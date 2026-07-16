import { unstable_noStore as noStore } from "next/cache";

import { staticImpactDashboard } from "@/data/impact";
import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import type {
  ImpactCauseReference,
  ImpactCauseTotal,
  ImpactDashboard,
  ImpactLedgerEntry,
  ImpactMetricType
} from "@/types/impact";
import type { ImpactStat } from "@/types/showcase";

type CmsRecord = Record<string, unknown>;
type ImpactCauseTotalWithDate = ImpactCauseTotal & { latestAt: string };

type PayloadClient = {
  find: (args: {
    collection: "causes" | "impact-entries" | "impact-stats";
    depth?: number;
    limit?: number;
    pagination?: boolean;
    sort?: string | string[];
    where?: CmsRecord;
  }) => Promise<{ docs: CmsRecord[] }>;
};

const publishedWhere = { isPublished: { equals: true } };

export async function getImpactDashboard(): Promise<ImpactDashboard> {
  if (process.env.NODE_ENV !== "production") noStore();

  if (!hasPayloadDatabase()) return staticImpactDashboard;

  try {
    const payload = (await getPayloadClient()) as unknown as PayloadClient;
    const [entryResult, statResult] = await Promise.all([
      payload.find({
        collection: "impact-entries",
        depth: 1,
        limit: 100,
        pagination: false,
        sort: ["-occurredAt", "sortOrder"],
        where: publishedWhere
      }),
      payload.find({
        collection: "impact-stats",
        depth: 1,
        limit: 6,
        pagination: false,
        sort: "sortOrder",
        where: publishedWhere
      })
    ]);
    const ledgerEntries = entryResult.docs.map(mapLedgerEntry).filter((entry): entry is ImpactLedgerEntry => Boolean(entry));
    const headlineStats = statResult.docs.map((stat, index) => mapImpactStat(stat, staticImpactDashboard.headlineStats[index] ?? staticImpactDashboard.headlineStats[0]));

    return {
      causeTotals: causeTotals(ledgerEntries),
      entries: ledgerEntries,
      headlineStats,
      lastUpdated: latestDate(ledgerEntries)
    };
  } catch (error) {
    console.error("Payload impact read failed; using static fallback.", error);
    return staticImpactDashboard;
  }
}

function mapLedgerEntry(doc: CmsRecord, index: number): ImpactLedgerEntry | undefined {
  const cause = mapCause(record(doc.cause));
  if (!cause) return undefined;

  const drop = record(doc.drop);
  const dropSlug = optionalText(drop.slug);
  const dropTitle = optionalText(drop.title);

  return {
    amount: nonNegativeNumber(doc.amount),
    cause,
    currency: text(doc.currency, "USD"),
    description: text(doc.description, "Impact allocation recorded."),
    drop: dropSlug && dropTitle ? { slug: dropSlug, title: dropTitle } : undefined,
    id: id(doc.id, index),
    impactLabel: optionalText(doc.impactLabel),
    impactSuffix: optionalText(doc.impactSuffix),
    impactValue: optionalNonNegativeNumber(doc.impactValue),
    metricType: metricType(doc.metricType),
    occurredAt: validDate(doc.occurredAt) ?? new Date(0).toISOString(),
    source: optionalText(doc.source),
    title: text(doc.title, "Impact allocation")
  };
}

function mapCause(doc: CmsRecord): ImpactCauseReference | undefined {
  const slug = optionalText(doc.slug);
  if (!slug) return undefined;

  return {
    focus: optionalText(doc.focus),
    name: text(doc.name, "Cause partner"),
    slug
  };
}

function causeTotals(entries: ImpactLedgerEntry[]): ImpactCauseTotal[] {
  const totals = new Map<string, ImpactCauseTotalWithDate>();

  for (const entry of entries) {
    const key = `${entry.cause.slug}\u0000${entry.currency}`;
    const existing = totals.get(key);
    if (existing) {
      existing.entryCount += 1;
      existing.total += entry.amount;
      if (new Date(entry.occurredAt) > new Date(existing.latestAt)) {
        existing.latestMetricType = entry.metricType;
        existing.latestAt = entry.occurredAt;
      }
      continue;
    }

    const total: ImpactCauseTotalWithDate = { ...entry.cause, currency: entry.currency, entryCount: 1, latestAt: entry.occurredAt, latestMetricType: entry.metricType, total: entry.amount };
    totals.set(key, total);
  }

  return [...totals.values()]
    .map((total) => ({
      currency: total.currency,
      entryCount: total.entryCount,
      focus: total.focus,
      latestMetricType: total.latestMetricType,
      name: total.name,
      slug: total.slug,
      total: total.total
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency) || b.total - a.total || a.name.localeCompare(b.name));
}

function mapImpactStat(doc: CmsRecord, fallback: ImpactStat): ImpactStat {
  return {
    detail: text(doc.detail, fallback.detail),
    label: text(doc.label, fallback.label),
    metricType: metricType(doc.metricType, fallback.metricType),
    prefix: optionalText(doc.prefix) ?? fallback.prefix,
    suffix: optionalText(doc.suffix) ?? fallback.suffix,
    value: nonNegativeNumber(doc.value, fallback.value)
  };
}

function latestDate(entries: ImpactLedgerEntry[]) {
  const dates = entries.map((entry) => entry.occurredAt).filter((value) => Number.isFinite(Date.parse(value)));
  return dates.sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

function record(value: unknown): CmsRecord { return value && typeof value === "object" && !Array.isArray(value) ? value as CmsRecord : {}; }
function text(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function optionalText(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
function id(value: unknown, index: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) return value;
  return `impact-entry-${index + 1}`;
}
function nonNegativeNumber(value: unknown, fallback = 0) { return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback; }
function optionalNonNegativeNumber(value: unknown) { return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined; }
function validDate(value: unknown) { return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : undefined; }

function metricType(value: unknown, fallback: ImpactMetricType = "projected"): ImpactMetricType {
  return value === "projected" || value === "committed" || value === "transferred" || value === "verified" ? value : fallback;
}
