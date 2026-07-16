import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

async function source(...segments) {
  return readFile(join(rootDir, ...segments), "utf8");
}

describe("editorial design-system contracts", () => {
  test("defines luxury tokens, visible keyboard focus, and a reduced-motion fallback", async () => {
    const css = await source("app", "globals.css");

    for (const token of [
      "--ae-forest",
      "--ae-parchment",
      "--ae-fog",
      "--ae-stone",
      "--ae-gilt",
      "--ae-white",
      "--ae-shadow-card",
      "--ae-shadow-drawer",
      "--ae-duration-fast",
      "--ae-ease-out"
    ]) {
      assert.match(css, new RegExp(`${token}:`));
    }

    assert.match(css, /\.focus-ring:focus-visible\s*\{[\s\S]*box-shadow:/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(css, /transition-duration:\s*0\.01ms !important/);
    assert.match(css, /--font-cormorant:/);
  });

  test("supports button variants plus loading and disabled interaction states", async () => {
    const button = await source("components", "ui", "button.tsx");

    for (const variant of ["default", "outline", "ghost", "link"]) {
      assert.match(button, new RegExp(`${variant}:`));
    }

    assert.match(button, /hover:bg-/);
    assert.match(button, /active:translate-y-px/);
    assert.match(button, /disabled:pointer-events-none/);
    assert.match(button, /disabled:opacity-45/);
    assert.match(button, /disabled=\{disabled \|\| loading\}/);
    assert.match(button, /aria-busy=\{loading \|\| undefined\}/);
    assert.match(button, /<LoaderCircle[^>]+animate-spin/);
    assert.match(button, /loadingLabel \?\? "Loading"/);
    assert.match(button, /asChild \? Slot : "button"/);
  });

  test("provides selectable cards and complete loading, empty, and error messages", async () => {
    const [card, stateMessage] = await Promise.all([
      source("components", "ui", "card.tsx"),
      source("components", "ui", "state-message.tsx")
    ]);

    assert.match(card, /interactive\?: boolean/);
    assert.match(card, /selected\?: boolean/);
    assert.match(card, /hover:-translate-y-0\.5/);
    assert.match(card, /hover:shadow-\[var\(--ae-shadow-card\)\]/);
    assert.match(card, /selected && "border-\[var\(--ae-gilt\)\]/);

    assert.match(stateMessage, /type\?: "empty" \| "error" \| "loading"/);
    assert.match(stateMessage, /type === "loading" \? LoaderCircle/);
    assert.match(stateMessage, /type === "error" \? AlertCircle : Inbox/);
    assert.match(stateMessage, /role=\{type === "error" \? "alert" : "status"\}/);
    assert.match(stateMessage, /aria-live="polite"/);
    assert.match(stateMessage, /type === "loading" && "animate-spin"/);
    assert.match(stateMessage, /Try again/);
  });

  test("keeps cart transitions coherent from add through quantity changes, removal, and empty state", async () => {
    const [context, drawer] = await Promise.all([
      source("components", "cart", "cart-context.tsx"),
      source("components", "cart", "cart-drawer.tsx")
    ]);

    assert.match(context, /if \(!existing\) return \[\.\.\.current, \{ \.\.\.item, quantity: 1 \}\]/);
    assert.match(context, /entry\.quantity \+ 1/);
    assert.match(context, /setDrawerOpen\(true\)/);
    assert.match(context, /quantity < 1\s*\? current\.filter/);
    assert.match(context, /itemCount: items\.reduce\(\(total, item\) => total \+ item\.quantity, 0\)/);
    assert.match(context, /useCart must be used within CartProvider/);

    assert.match(drawer, /role="dialog"/);
    assert.match(drawer, /aria-modal="true"/);
    assert.match(drawer, /closeButtonRef\.current\?\.focus\(\)/);
    assert.match(drawer, /event\.key === "Escape"/);
    assert.match(drawer, /aria-label="Close reservation bag"/);
    assert.match(drawer, /Your bag is waiting/);
    assert.match(drawer, /Decrease quantity for \$\{item\.name\}/);
    assert.match(drawer, /Increase quantity for \$\{item\.name\}/);
    assert.match(drawer, /Remove \$\{item\.name\}/);
    assert.match(drawer, /disabled=\{items\.length === 0\}/);
  });

  test("wires the signature product selection interaction to the cart and honors motion preferences", async () => {
    const experience = await source("components", "sections", "home-experience.tsx");

    assert.match(experience, /const \[selectedProductId, setSelectedProductId\] = useState\(products\[0\]\?\.id\)/);
    assert.match(experience, /aria-pressed=\{isSelected\}/);
    assert.match(experience, /onClick=\{\(\) => setSelectedProductId\(product\.id\)\}/);
    assert.match(experience, /<AnimatePresence mode="wait">/);
    assert.match(experience, /const shouldReduceMotion = useReducedMotion\(\)/);
    assert.match(experience, /onClick=\{\(\) => addItem\(\{/);
    assert.match(experience, /Reserve edition/);
    assert.match(experience, /useScroll\(\{[\s\S]*target: heroRef/);
    assert.match(experience, /ref=\{heroRef\}/);
  });
});
