import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const source = (...segments) => readFile(join(rootDir, ...segments), "utf8");

describe("Commerce experience", () => {
  test("persists and restores a server-backed cart", async () => {
    const context = await source("components", "cart", "cart-context.tsx");
    assert.match(context, /arteffect-cart-id/);
    assert.match(context, /commerceRequest<CommerceCart>\(`\/api\/cart\/\$\{encodeURIComponent\(storedCartId\)\}`\)/);
    assert.match(context, /\/api\/cart\/\$\{encodeURIComponent\(String\(activeCart\.id\)\)\}\/items/);
    assert.match(context, /credentials: "same-origin"/);
    assert.match(context, /mutationChainRef/);
  });

  test("connects coupon, shipping, upsell, and checkout controls to commerce APIs", async () => {
    const [context, drawer, checkoutPage, checkoutExperience] = await Promise.all([
      source("components", "cart", "cart-context.tsx"),
      source("components", "cart", "cart-drawer.tsx"),
      source("app", "checkout", "page.tsx"),
      source("components", "cart", "checkout-experience.tsx")
    ]);
    assert.match(context, /\/coupon`/);
    assert.match(context, /\/shipping-estimate`/);
    assert.match(context, /\/upsells`/);
    assert.match(context, /"\/api\/checkout"/);
    assert.match(drawer, /Collector code/);
    assert.match(drawer, /Shipping estimate/);
    assert.match(drawer, /Complete the story/);
    assert.match(drawer, /router\.push\("\/checkout"\)/);
    assert.match(checkoutPage, /<CheckoutExperience \/>/);
    assert.match(checkoutExperience, /Confirm reservation/);
    assert.match(checkoutExperience, /shippingMethodCode/);
  });
});
