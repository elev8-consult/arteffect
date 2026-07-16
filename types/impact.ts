import type { ImpactStat } from "@/types/showcase";

export type ImpactMetricType = "projected" | "committed" | "transferred" | "verified";

export type ImpactCauseReference = {
  focus?: string;
  name: string;
  slug: string;
};

export type ImpactLedgerEntry = {
  amount: number;
  cause: ImpactCauseReference;
  currency: string;
  description: string;
  drop?: { slug: string; title: string };
  id: number | string;
  impactLabel?: string;
  impactSuffix?: string;
  impactValue?: number;
  metricType: ImpactMetricType;
  occurredAt: string;
  source?: string;
  title: string;
};

export type ImpactCauseTotal = ImpactCauseReference & {
  currency: string;
  entryCount: number;
  latestMetricType: ImpactMetricType;
  total: number;
};

export type ImpactDashboard = {
  causeTotals: ImpactCauseTotal[];
  entries: ImpactLedgerEntry[];
  headlineStats: ImpactStat[];
  lastUpdated?: string;
};
