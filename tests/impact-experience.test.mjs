import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

async function source(...segments) {
  return readFile(join(rootDir, ...segments), "utf8");
}

function moduleUrl(...segments) {
  return pathToFileURL(join(rootDir, ...segments)).href;
}

async function staticImpactDataUrl() {
  const typescript = await import("typescript");
  const dataSource = await source("data", "impact.ts");
  const javascript = typescript.transpileModule(
    dataSource.replace('import { impactStats } from "@/data/showcase";', `import { impactStats } from "${moduleUrl("data", "showcase.ts")}";`),
    { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }
  ).outputText;

  return `data:text/javascript;charset=utf-8,${encodeURIComponent(javascript)}`;
}

async function loadImpactDashboard({ hasDatabase, responses = [] }) {
  const typescript = await import("typescript");
  const [impactSource, dataUrl] = await Promise.all([source("lib", "cms", "impact.ts"), staticImpactDataUrl()]);
  const responseQueue = JSON.stringify(responses);
  const javascript = typescript.transpileModule(
    impactSource
      .replace('import { unstable_noStore as noStore } from "next/cache";', "const noStore = () => undefined;")
      .replace('import { staticImpactDashboard } from "@/data/impact";', `import { staticImpactDashboard } from "${dataUrl}";`)
      .replace('import { hasPayloadDatabase } from "@/lib/cms/env";', `const hasPayloadDatabase = () => ${hasDatabase};`)
      .replace('import { getPayloadClient } from "@/lib/cms/payload";', `const responses = ${responseQueue}; const getPayloadClient = async () => ({ find: async () => responses.shift() ?? { docs: [] } });`),
    { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }
  ).outputText;

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(javascript)}`);
}

describe("Impact ledger showcase", () => {
  test("ships an indexed impact route with animated totals, purchase timeline, public ledger, and per-cause totals", async () => {
    const [page, dashboard, sitemap] = await Promise.all([
      source("app", "impact", "page.tsx"),
      source("components", "impact", "impact-dashboard.tsx"),
      source("app", "sitemap.ts")
    ]);

    assert.match(page, /await getImpactDashboard\(\)/);
    assert.match(page, /"@type": "Dataset"/);
    assert.match(page, /JSON\.stringify\(structuredData\)\.replace\(\/</);
    assert.match(page, /<ImpactDashboard dashboard=\{dashboard\}/);
    assert.match(sitemap, /url: `\$\{siteConfig\.url\}\/impact`/);

    assert.match(dashboard, /<AnimatedNumber value=\{stat\.value\}/);
    assert.match(dashboard, /useReducedMotion/);
    assert.match(dashboard, /role="tablist" aria-label="How an ArtEffect purchase creates change"/);
    assert.match(dashboard, /role="tabpanel"/);
    assert.match(dashboard, /purchaseSteps\.map/);
    assert.match(dashboard, /aria-pressed=\{active\}/);
    assert.match(dashboard, /visibleEntries\.map/);
    assert.match(dashboard, /No published allocations match this cause yet\./);
    assert.match(dashboard, /dashboard\.causeTotals\.map/);
    assert.match(dashboard, /Each allocation appears once\./);
  });

  test("uses complete static ledger data when Payload is unavailable", async () => {
    const { getImpactDashboard } = await loadImpactDashboard({ hasDatabase: false });
    const dashboard = await getImpactDashboard();

    assert.equal(dashboard.entries.length, 3);
    assert.deepEqual(dashboard.causeTotals, [{
      currency: "USD",
      entryCount: 3,
      focus: "Native reforestation and three-year sapling care",
      latestMetricType: "verified",
      name: "Green Cedar Collective",
      slug: "green-cedar-collective",
      total: 6075
    }]);
    assert.equal(dashboard.lastUpdated, "2026-07-10T09:00:00.000Z");
  });

  test("maps published Payload records safely and derives additive, latest-state cause totals", async () => {
    const responses = [
      {
        docs: [
          {
            amount: 100,
            cause: { focus: "Watershed restoration", name: "River Watch", slug: "river-watch" },
            currency: "USD",
            description: "Initial allocation",
            id: 1,
            metricType: "committed",
            occurredAt: "2026-07-01T00:00:00.000Z",
            title: "Planting commitment"
          },
          {
            amount: 250,
            cause: { focus: "Watershed restoration", name: "River Watch", slug: "river-watch" },
            id: 2,
            metricType: "verified",
            occurredAt: "2026-07-09T00:00:00.000Z",
            title: "Transfer verified"
          },
          { amount: 999, cause: { name: "Incomplete cause" }, id: 3, occurredAt: "2026-07-10T00:00:00.000Z" }
        ]
      },
      {
        docs: [{
          detail: "Verified by a field report",
          label: "Verified transfers",
          metricType: "verified",
          prefix: "$",
          suffix: " USD",
          value: 350
        }]
      }
    ];
    const { getImpactDashboard } = await loadImpactDashboard({ hasDatabase: true, responses });
    const dashboard = await getImpactDashboard();

    assert.equal(dashboard.entries.length, 2);
    assert.deepEqual(dashboard.causeTotals, [{
      currency: "USD",
      entryCount: 2,
      focus: "Watershed restoration",
      latestMetricType: "verified",
      name: "River Watch",
      slug: "river-watch",
      total: 350
    }]);
    assert.equal(dashboard.lastUpdated, "2026-07-09T00:00:00.000Z");
    assert.deepEqual(dashboard.headlineStats[0], {
      detail: "Verified by a field report",
      label: "Verified transfers",
      metricType: "verified",
      prefix: "$",
      suffix: "USD",
      value: 350
    });
  });

  test("keeps a connected but empty Payload ledger empty", async () => {
    const { getImpactDashboard } = await loadImpactDashboard({
      hasDatabase: true,
      responses: [{ docs: [] }, { docs: [] }]
    });
    const dashboard = await getImpactDashboard();

    assert.deepEqual(dashboard.entries, []);
    assert.deepEqual(dashboard.causeTotals, []);
    assert.deepEqual(dashboard.headlineStats, []);
    assert.equal(dashboard.lastUpdated, undefined);
  });

  test("keeps cause totals separated by currency and gives malformed IDs unique fallbacks", async () => {
    const responses = [
      {
        docs: [
          {
            amount: 100,
            cause: { name: "River Watch", slug: "river-watch" },
            currency: "USD",
            id: null,
            metricType: "committed",
            occurredAt: "2026-07-01T00:00:00.000Z",
            title: "Dollar allocation"
          },
          {
            amount: 80,
            cause: { name: "River Watch", slug: "river-watch" },
            currency: "EUR",
            id: "",
            metricType: "verified",
            occurredAt: "2026-07-02T00:00:00.000Z",
            title: "Euro allocation"
          }
        ]
      },
      { docs: [] }
    ];
    const { getImpactDashboard } = await loadImpactDashboard({ hasDatabase: true, responses });
    const dashboard = await getImpactDashboard();

    assert.deepEqual(dashboard.entries.map((entry) => entry.id), ["impact-entry-1", "impact-entry-2"]);
    assert.deepEqual(dashboard.causeTotals, [
      {
        currency: "EUR",
        entryCount: 1,
        focus: undefined,
        latestMetricType: "verified",
        name: "River Watch",
        slug: "river-watch",
        total: 80
      },
      {
        currency: "USD",
        entryCount: 1,
        focus: undefined,
        latestMetricType: "committed",
        name: "River Watch",
        slug: "river-watch",
        total: 100
      }
    ]);
  });

  test("queries only published impact content and keeps the new ledger records CMS-editable", async () => {
    const [impact, entries, stats, migration] = await Promise.all([
      source("lib", "cms", "impact.ts"),
      source("payload", "collections", "ImpactEntries.ts"),
      source("payload", "collections", "ImpactStats.ts"),
      source("payload", "migrations", "20260714020000_impact_ledger.ts")
    ]);

    assert.match(impact, /collection: "impact-entries"[\s\S]*?sort: \["-occurredAt", "sortOrder"\][\s\S]*?where: publishedWhere/);
    assert.match(impact, /collection: "impact-stats"[\s\S]*?sort: "sortOrder"[\s\S]*?where: publishedWhere/);
    assert.match(impact, /return staticImpactDashboard/);
    assert.match(entries, /name: "cause"[\s\S]*?relationTo: "causes"/);
    assert.match(entries, /name: "metricType"[\s\S]*?value: "verified"/);
    assert.match(entries, /Do not record the same funds again/);
    assert.match(stats, /name: "value"[\s\S]*?min: 0/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS "impact_entries"/);
    assert.match(migration, /"impact_entries_cause_id_causes_id_fk"/);
  });
});
