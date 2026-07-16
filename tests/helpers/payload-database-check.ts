import config from "../../payload.config";
import { getPayload } from "payload";

const payload = await getPayload({ config });

try {
  const collections = ["products", "drops", "artists", "causes", "journal"] as const;
  const results = await Promise.all(
    collections.map(async (collection) => {
      const result = await payload.find({
        collection,
        depth: 0,
        limit: 1,
        overrideAccess: false
      });
      return [collection, result.totalDocs] as const;
    })
  );

  process.stdout.write(`PAYLOAD_COUNTS=${JSON.stringify(Object.fromEntries(results))}\n`);
} finally {
  await payload.destroy();
}
