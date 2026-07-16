import { impactStats } from "@/data/showcase";
import type { ImpactDashboard } from "@/types/impact";

const greenCedar = {
  focus: "Native reforestation and three-year sapling care",
  name: "Green Cedar Collective",
  slug: "green-cedar-collective"
};

export const staticImpactDashboard: ImpactDashboard = {
  causeTotals: [
    {
      ...greenCedar,
      currency: "USD",
      entryCount: 3,
      latestMetricType: "verified",
      total: 6075
    }
  ],
  entries: [
    {
      amount: 675,
      cause: greenCedar,
      currency: "USD",
      description: "The first public transfer covers site preparation and a survival-check plan for the ridge.",
      drop: { slug: "batch-001", title: "Batch 001" },
      id: "batch-001-site-preparation",
      impactLabel: "field plan approved",
      impactValue: 1,
      metricType: "verified",
      occurredAt: "2026-07-10T09:00:00.000Z",
      source: "Field update / July 2026",
      title: "Site preparation logged"
    },
    {
      amount: 2700,
      cause: greenCedar,
      currency: "USD",
      description: "A ring-fenced allocation for native seedlings and local planting crews was recorded for Batch 001.",
      drop: { slug: "batch-001", title: "Batch 001" },
      id: "batch-001-native-planting",
      impactLabel: "saplings planned",
      impactSuffix: " saplings",
      impactValue: 2400,
      metricType: "committed",
      occurredAt: "2026-07-01T09:00:00.000Z",
      source: "Batch 001 allocation note",
      title: "Native planting allocation committed"
    },
    {
      amount: 2700,
      cause: greenCedar,
      currency: "USD",
      description: "A separate reserve is held for irrigation, maintenance, and three years of survival checks after planting.",
      drop: { slug: "batch-001", title: "Batch 001" },
      id: "batch-001-aftercare",
      impactLabel: "seasons of care",
      impactSuffix: " seasons",
      impactValue: 3,
      metricType: "projected",
      occurredAt: "2026-07-01T09:01:00.000Z",
      source: "Batch 001 allocation note",
      title: "Three-year care reserve committed"
    }
  ],
  headlineStats: impactStats,
  lastUpdated: "2026-07-10T09:00:00.000Z"
};
