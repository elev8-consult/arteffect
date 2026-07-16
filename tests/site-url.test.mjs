import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeSiteUrl } from "../lib/site-url.ts";

test("normalizeSiteUrl prepends https when the scheme is missing", () => {
  assert.equal(
    normalizeSiteUrl("arteffect-production.up.railway.app"),
    "https://arteffect-production.up.railway.app"
  );
  assert.equal(
    normalizeSiteUrl("https://arteffect-production.up.railway.app/"),
    "https://arteffect-production.up.railway.app"
  );
  assert.equal(normalizeSiteUrl("http://localhost:3000"), "http://localhost:3000");
});
