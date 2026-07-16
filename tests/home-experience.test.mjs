import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

async function source(...segments) {
  return readFile(join(rootDir, ...segments), "utf8");
}

describe("home showcase experience", () => {
  test("renders the editorial hero and links visitors into the two primary journeys", async () => {
    const experience = await source("components", "sections", "home-experience.tsx");

    assert.match(experience, /<main id="main-content">/);
    assert.match(experience, /<h1[^>]*>[\s\S]*Art Meets Impact/);
    assert.match(experience, /href="#products"[\s\S]*Explore objects/);
    assert.match(experience, /href="#impact"[\s\S]*See impact/);
    assert.match(experience, /Limited editions that turn commissioned artwork/);
    assert.match(experience, /priority/);
    assert.match(experience, /href=\{`\/drops\/\$\{drop\.slug\}`\}/);
    assert.doesNotMatch(experience, /href="\/drops\/batch-001"/);
  });

  test("includes animated, accessible impact reporting tied to CMS-provided stats", async () => {
    const [experience, counter] = await Promise.all([
      source("components", "sections", "home-experience.tsx"),
      source("components", "motion", "animated-number.tsx")
    ]);

    assert.match(experience, /impactStats\.map\(\(stat\) =>/);
    assert.match(experience, /import \{ AnimatedNumber \} from "@\/components\/motion\/animated-number"/);
    assert.match(experience, /<AnimatedNumber[\s\S]*value=\{stat\.value\}/);
    assert.match(experience, /stat\.metricType === "projected"/);
    assert.doesNotMatch(experience, /stat\.label\.includes/);
    assert.doesNotMatch(experience, /function AnimatedNumber\(/);
    assert.match(counter, /const isInView = useInView\(ref, \{ once: true, amount: 0\.6 \}\)/);
    assert.match(counter, /animate\(motionValue, value, \{[\s\S]*duration: 1\.25/);
    assert.match(counter, /Math\.round\(latest\)\.toLocaleString\("en-US"\)/);
    assert.match(experience, /The impact story continues after checkout/);
  });

  test("provides testimonial and Instagram storytelling with labeled external links", async () => {
    const [experience, showcase, page] = await Promise.all([
      source("components", "sections", "home-experience.tsx"),
      source("lib", "cms", "showcase.ts"),
      source("app", "(site)", "page.tsx")
    ]);

    assert.doesNotMatch(experience, /const testimonials = \[/);
    assert.match(experience, /testimonials\.map\(\(testimonial, index\) =>/);
    assert.match(showcase, /findMany\(payload, "testimonials", 3\)/);
    assert.match(showcase, /name: text\(doc\.personName, fallback\.name\)/);
    assert.match(page, /testimonials=\{testimonials\}/);
    assert.match(experience, /const instagramPosts = \[/);
    assert.match(experience, /instagramPosts\.map\(\(post, index\) =>/);
    assert.match(experience, /href="https:\/\/www\.instagram\.com\/"/);
    assert.match(experience, /target="_blank"[\s\S]*rel="noreferrer"/);
    assert.match(experience, /aria-label=\{`View \$\{post\.label\} on Instagram`\}/);
    assert.match(experience, /Follow @arteffect/);
  });

  test("submits newsletter consent and exposes pending, success, and failure feedback", async () => {
    const experience = await source("components", "sections", "home-experience.tsx");

    assert.match(experience, /fetch\("\/api\/newsletter", \{/);
    assert.match(experience, /method: "POST"/);
    assert.match(experience, /source: "homepage"/);
    assert.match(experience, /acceptedMarketing: true/);
    assert.match(experience, /setNewsletterState\("submitting"\)/);
    assert.match(experience, /setNewsletterState\("success"\)/);
    assert.match(experience, /setNewsletterState\("error"\)/);
    assert.match(experience, /type="email"/);
    assert.match(experience, /required/);
    assert.match(experience, /aria-live="polite"/);
    assert.match(experience, /You’re on the list/);
    assert.match(experience, /We could not save your email\. Please try again\./);
  });

  test("loads showcase content through the server page and retains the shared minimal footer", async () => {
    const [page, layout, footer] = await Promise.all([
      source("app", "(site)", "page.tsx"),
      source("app", "(site)", "layout.tsx"),
      source("components", "layout", "site-footer.tsx")
    ]);

    assert.match(page, /await getShowcaseContent\(\)/);
    assert.match(page, /<HomeExperience[\s\S]*impactStats=\{impactStats\}/);
    assert.match(layout, /<SiteFooter\s*\/>/);
    assert.match(footer, /<footer/);
    assert.match(footer, /siteConfig\.nav\.map/);
    assert.match(footer, /Limited art objects with artist royalties, NGO partnerships/);
  });
});
