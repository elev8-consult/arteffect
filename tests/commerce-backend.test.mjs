import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const readText = (...segments) => readFile(join(rootDir, ...segments), "utf8");

const typescript = await import("typescript");

async function dataModule(fileName, replacements = {}) {
  const source = await readText("lib/commerce", fileName);
  let javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022
    }
  }).outputText;
  for (const [specifier, replacement] of Object.entries(replacements)) {
    javascript = javascript.replaceAll(`from "${specifier}"`, `from "${replacement}"`);
  }
  return `data:text/javascript;charset=utf-8,${encodeURIComponent(javascript)}`;
}

const errorsURL = await dataModule("errors.ts");
const typesURL = await dataModule("types.ts");
const moneyURL = await dataModule("money.ts", { "./errors": errorsURL });
const calculatorURL = await dataModule("calculator.ts", {
  "./errors": errorsURL,
  "./money": moneyURL,
  "./types": typesURL
});
const validationURL = await dataModule("validation.ts", { "./errors": errorsURL });
const tokensURL = await dataModule("tokens.ts", { "./errors": errorsURL });
const paymentRegistryURL = await dataModule("payments/registry.ts", { "../errors": errorsURL });
const shippingURL = await dataModule("shipping.ts", {
  "./calculator": calculatorURL,
  "./errors": errorsURL,
  "./money": moneyURL,
  "./validation": validationURL
});

describe("Commerce backend", () => {
  test("calculates integer minor-unit totals and coupon discounts without trusting display prices", async () => {
    const [{ calculateCouponDiscount, calculateTotals }, { toMinorUnits }] = await Promise.all([
      import(calculatorURL),
      import(moneyURL)
    ]);
    const lines = [
      {
        product: 1,
        variantId: "v1",
        sku: "AE-1",
        productName: "Edition",
        variantName: "Small",
        shippingProfile: "standard",
        quantity: 2,
        unitPrice: 5025,
        lineTotal: 10050,
        currency: "USD"
      }
    ];
    const coupon = {
      id: 1,
      code: "GIVE20",
      discountType: "percentage",
      value: 20,
      maximumDiscount: 15,
      minimumSubtotal: 50,
      isActive: true,
      uses: 0
    };
    const discount = calculateCouponDiscount(coupon, lines, "USD", 10050, 1200);
    const totals = calculateTotals(lines, discount, 1200);

    assert.equal(toMinorUnits(19.99, "USD"), 1999);
    assert.equal(toMinorUnits(90000, "LBP"), 90000);
    assert.deepEqual(discount, { productDiscount: 1500, shippingDiscount: 0 });
    assert.deepEqual(totals, {
      itemCount: 2,
      subtotal: 10050,
      discountTotal: 1500,
      shippingTotal: 1200,
      taxTotal: 0,
      total: 9750
    });
  });

  test("applies product eligibility and free-shipping coupons safely", async () => {
    const { calculateCouponDiscount } = await import(calculatorURL);
    const line = {
      product: 7,
      variantId: "v7",
      sku: "AE-7",
      productName: "Object",
      variantName: "Edition",
      shippingProfile: "fragile",
      quantity: 1,
      unitPrice: 10000,
      lineTotal: 10000,
      currency: "USD"
    };

    assert.deepEqual(
      calculateCouponDiscount(
        { id: 2, discountType: "free-shipping", value: 0, minimumSubtotal: 0, isActive: true },
        [line],
        "USD",
        10000,
        1800
      ),
      { productDiscount: 0, shippingDiscount: 1800 }
    );
    assert.throws(
      () => calculateCouponDiscount(
        { id: 3, discountType: "percentage", value: 10, applicableProducts: [99], isActive: true },
        [line],
        "USD",
        10000,
        0
      ),
      (error) => error.code === "COUPON_NOT_APPLICABLE"
    );
  });

  test("rejects inactive, expired, under-minimum, and mismatched fixed coupons", async () => {
    const { calculateCouponDiscount } = await import(calculatorURL);
    const line = {
      product: 7,
      variantId: "v7",
      sku: "AE-7",
      productName: "Object",
      variantName: "Edition",
      shippingProfile: "standard",
      quantity: 1,
      unitPrice: 1000,
      lineTotal: 1000,
      currency: "USD"
    };
    const cases = [
      [{ id: 1, isActive: false, discountType: "percentage", value: 10 }, "COUPON_INACTIVE"],
      [{ id: 2, isActive: true, discountType: "percentage", value: 10, endsAt: "2020-01-01T00:00:00.000Z" }, "COUPON_EXPIRED"],
      [{ id: 3, isActive: true, discountType: "percentage", value: 10, minimumSubtotal: 20 }, "COUPON_MINIMUM_NOT_MET"],
      [{ id: 4, isActive: true, discountType: "fixed", value: 10, currency: "LBP" }, "COUPON_CURRENCY_MISMATCH"]
    ];

    for (const [coupon, code] of cases) {
      assert.throws(
        () => calculateCouponDiscount(coupon, [line], "USD", 1000, 0),
        (error) => error.code === code
      );
    }
  });

  test("selects only quoted shipping methods and lets free-shipping coupons zero the quote", async () => {
    const { selectShippingQuote, totalsWithShipping } = await import(shippingURL);
    const quotes = [{
      id: 1,
      code: "standard",
      name: "Standard",
      description: "",
      amount: 1500,
      minimumDeliveryDays: 2,
      maximumDeliveryDays: 4
    }];
    const line = {
      product: 7,
      variantId: "v7",
      sku: "AE-7",
      productName: "Object",
      variantName: "Edition",
      shippingProfile: "standard",
      quantity: 1,
      unitPrice: 5000,
      lineTotal: 5000,
      currency: "USD"
    };

    assert.equal(selectShippingQuote(quotes, undefined), quotes[0]);
    assert.throws(
      () => selectShippingQuote(quotes, "express"),
      (error) => error.code === "INVALID_SHIPPING_METHOD"
    );
    assert.deepEqual(
      totalsWithShipping([line], "USD", { id: 8, isActive: true, discountType: "free-shipping", value: 0 }, quotes[0]),
      { itemCount: 1, subtotal: 5000, discountTotal: 1500, shippingTotal: 0, taxTotal: 0, total: 5000 }
    );
  });

  test("validates checkout identity and address inputs", async () => {
    const { checkoutAddress, emailAddress } = await import(validationURL);
    assert.equal(emailAddress("  Collector@Example.com "), "collector@example.com");
    assert.deepEqual(
      checkoutAddress(
        { name: "Maya Raad", line1: "12 Studio Road", city: "Beirut", country: "lb", phone: "+961 1 000 000" },
        "shippingAddress"
      ),
      { name: "Maya Raad", line1: "12 Studio Road", city: "Beirut", country: "LB", phone: "+961 1 000 000" }
    );
    assert.throws(() => checkoutAddress({ country: "Lebanon" }, "shippingAddress"), /required/i);
  });

  test("uses unguessable tokens, one-way hashes, and an empty payment-provider registry", async () => {
    const [{ accessTokenMatches, createAccessToken, hashAccessToken }, { listPaymentProviders }] = await Promise.all([
      import(tokensURL),
      import(paymentRegistryURL)
    ]);
    const token = createAccessToken();
    const hash = hashAccessToken(token);
    assert.equal(token.length >= 40, true);
    assert.equal(hash.includes(token), false);
    assert.equal(accessTokenMatches(token, hash), true);
    assert.equal(accessTokenMatches(createAccessToken(), hash), false);
    assert.deepEqual(listPaymentProviders(), []);
  });

  test("registers commerce collections, APIs, atomic inventory reservations, and a production migration", async () => {
    const [config, products, inventory, migration, users, access] = await Promise.all([
      readText("payload.config.ts"),
      readText("payload/collections/Products.ts"),
      readText("lib/commerce/inventory.ts"),
      readText("payload/migrations/20260714030000_ecommerce.ts"),
      readText("payload/collections/Users.ts"),
      readText("payload/access.ts")
    ]);
    for (const collection of ["Carts", "Orders", "Coupons", "ShippingMethods", "Transactions", "InventoryMovements"]) {
      assert.match(config, new RegExp(`\\b${collection}\\b`));
    }
    for (const route of [
      "app/api/cart/route.ts",
      "app/api/cart/[cartId]/items/route.ts",
      "app/api/cart/[cartId]/coupon/route.ts",
      "app/api/cart/[cartId]/shipping-estimate/route.ts",
      "app/api/cart/[cartId]/upsells/route.ts",
      "app/api/checkout/route.ts",
      "app/api/orders/[orderNumber]/route.ts",
      "app/api/orders/[orderNumber]/cancel/route.ts",
      "app/api/payment-providers/route.ts"
    ]) {
      assert.match(await readText(route), /export (async )?function (GET|POST|PATCH|DELETE)/, route);
    }
    assert.match(products, /name:\s*"upsells"[\s\S]*?relationTo:\s*"products"/);
    assert.match(inventory, /inventory - reserved >= \$1/);
    assert.match(inventory, /BEGIN[\s\S]*?COMMIT[\s\S]*?ROLLBACK/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS "carts"/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS "orders"/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS "transactions"/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS "inventory_movements"/);
    assert.match(
      await readText("payload/migrations/20260718000000_locked_documents_commerce_rels.ts"),
      /ADD COLUMN IF NOT EXISTS "carts_id"/
    );
    assert.match(users, /name:\s*"role"[\s\S]*?value:\s*"admin"[\s\S]*?value:\s*"customer"/);
    assert.match(access, /isAdmin/);
    assert.doesNotMatch(config, /arteffect-local-payload-secret/);
  });

  test("protects every state-changing commerce endpoint from cross-origin requests", async () => {
    const mutationRoutes = [
      "app/api/cart/route.ts",
      "app/api/cart/[cartId]/items/route.ts",
      "app/api/cart/[cartId]/items/[itemId]/route.ts",
      "app/api/cart/[cartId]/coupon/route.ts",
      "app/api/cart/[cartId]/shipping-estimate/route.ts",
      "app/api/checkout/route.ts",
      "app/api/orders/[orderNumber]/cancel/route.ts"
    ];

    for (const route of mutationRoutes) {
      const source = await readText(route);
      assert.match(source, /assertSameOrigin\(request\)/, route);
      assert.match(source, /commerceErrorResponse\(error\)/, route);
      assert.match(source, /noStoreHeaders\(\)/, route);
    }
  });

  test("claims capped coupon uses atomically and compensates failed checkouts", async () => {
    const [coupons, checkout] = await Promise.all([
      readText("lib/commerce/coupons.ts"),
      readText("lib/commerce/checkout.ts")
    ]);

    assert.match(coupons, /UPDATE coupons[\s\S]*?SET uses = uses \+ 1/);
    assert.match(coupons, /maximum_uses IS NULL OR uses < maximum_uses/);
    assert.match(coupons, /SET uses = GREATEST\(0, uses - 1\)/);
    assert.match(checkout, /claimCouponUse\(payload, coupon\)/);
    assert.match(checkout, /releaseCouponUse\(payload, coupon\)/);
  });

  test("clears obsolete shipping estimates after cart item mutations", async () => {
    const cart = await readText("lib/commerce/cart.ts");
    assert.match(cart, /\["SHIPPING_UNAVAILABLE", "INVALID_SHIPPING_METHOD"\]/);
    assert.match(cart, /shippingMethod = null;[\s\S]*?shippingEstimate = null;/);
    assert.match(cart, /shippingEstimate,[\s\S]*?\.\.\.totals/);
  });
});
