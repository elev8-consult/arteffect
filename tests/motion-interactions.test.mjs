import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

async function source(...segments) {
  return readFile(join(rootDir, ...segments), "utf8");
}

describe("motion and interaction system", () => {
  test("uses one restrained motion vocabulary and honors reduced-motion preferences", async () => {
    const [motion, styles] = await Promise.all([
      source("lib", "motion.ts"),
      source("app", "globals.css")
    ]);

    assert.match(motion, /export const MOTION_EASE = \[0\.22, 1, 0\.36, 1\] as const/);
    assert.match(motion, /viewport: \{ once: true, amount: 0\.18 \}/);
    assert.match(motion, /duration: 0\.65/);
    assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(styles, /animation-duration: 0\.01ms !important/);
    assert.match(styles, /transition-duration: 0\.01ms !important/);
  });

  test("wraps route changes in a subtle, reduced-motion-safe page transition", async () => {
    const [layout, transition] = await Promise.all([
      source("app", "layout.tsx"),
      source("components", "motion", "page-transition.tsx")
    ]);

    assert.match(layout, /<PageTransition>\{children\}<\/PageTransition>/);
    assert.match(transition, /<AnimatePresence mode="wait" initial=\{false\}>/);
    assert.match(transition, /key=\{pathname\}/);
    assert.match(transition, /initial=\{reducedMotion \? false : \{ opacity: 0, y: 6 \}\}/);
    assert.match(transition, /animate=\{reducedMotion \? undefined : \{ opacity: 1, y: 0 \}\}/);
    assert.match(transition, /exit=\{reducedMotion \? undefined : \{ opacity: 0, y: -4 \}\}/);
    assert.match(transition, /duration: 0\.32, ease: MOTION_EASE/);
  });

  test("keeps the six showcase stories interactive without making motion a prerequisite", async () => {
    const [home, drop, artist, cause, impact, shop, product] = await Promise.all([
      source("components", "sections", "home-experience.tsx"),
      source("components", "drops", "drop-experience.tsx"),
      source("components", "artists", "artist-profile.tsx"),
      source("components", "causes", "cause-profile.tsx"),
      source("components", "impact", "impact-dashboard.tsx"),
      source("components", "shop", "shop-experience.tsx"),
      source("components", "shop", "product-experience.tsx")
    ]);

    assert.match(home, /useScroll\(\{[\s\S]*scrollYProgress/);
    assert.match(home, /style=\{shouldReduceMotion \? undefined : \{ y: heroY \}\}/);
    const reducedMotionProgressBars = home.match(
      /initial=\{shouldReduceMotion \? false : \{ width: 0 \}\}[\s\S]*?whileInView=\{shouldReduceMotion \? undefined : \{ width: `\$\{(?:milestone|metric)\.progress\}%` \}\}[\s\S]*?style=\{shouldReduceMotion \? \{ width: `\$\{(?:milestone|metric)\.progress\}%` \} : undefined\}/g
    );
    assert.equal(reducedMotionProgressBars?.length, 2);
    assert.match(drop, /useTransform\(scrollYProgress, \[0, 1\], \["-4%", "4%"\]\)/);
    assert.match(drop, /style=\{reducedMotion \? undefined : \{ y: heroY \}\}/);
    assert.match(drop, /whileInView=\{reducedMotion \? undefined : \{ width:/);
    assert.match(artist, /const reveal = reducedMotion \? \{ initial: false as const \} : revealMotion/);
    assert.match(cause, /const reveal = reducedMotion \? \{ initial: false as const \} : sectionReveal/);
    assert.match(cause, /whileInView=\{reducedMotion \? undefined : \{ width:/);
    assert.match(impact, /<AnimatedNumber value=\{stat\.value\}/);
    assert.match(impact, /key=\{activeStep\}[\s\S]*initial=\{reducedMotion \? false/);
    assert.match(shop, /<motion\.div layout/);
    assert.match(shop, /<AnimatePresence>[\s\S]*<QuickView/);
    assert.match(shop, /initial=\{reducedMotion \? false : \{ opacity: 0, y: 16 \}\}/);
    assert.match(product, /<AnimatePresence>\{zoomOpen/);
    assert.match(product, /initial=\{reducedMotion \? false : \{ opacity: 0, scale: \.98 \}\}/);
    assert.match(product, /<ProductGallery[\s\S]*reducedMotion=\{Boolean\(reducedMotion\)\}/);
    assert.match(product, /key=\{image\.src\}[\s\S]*initial=\{reducedMotion \? false : \{ opacity: 0\.2, scale: 1\.015 \}\}[\s\S]*animate=\{reducedMotion \? undefined : \{ opacity: 1, scale: 1 \}\}[\s\S]*exit=\{reducedMotion \? undefined : \{ opacity: 0 \}\}/);
  });

  test("counts visible impact values once and leaves reduced-motion values immediately legible", async () => {
    const counter = await source("components", "motion", "animated-number.tsx");

    assert.match(counter, /useInView\(ref, \{ once: true, amount: 0\.6 \}\)/);
    assert.match(counter, /useMotionValue\(reducedMotion \? value : 0\)/);
    assert.match(counter, /if \(!isInView \|\| reducedMotion\) return undefined/);
    assert.match(counter, /animate\(motionValue, value, \{ duration: 1\.25, ease: MOTION_EASE \}\)/);
    assert.match(counter, /return controls\.stop/);
  });
});
