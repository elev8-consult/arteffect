import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const readText = (...segments) => readFile(join(rootDir, ...segments), "utf8");

describe("About, Journal, Contact, FAQ, and Account backend", () => {
  test("ships user-facing routes for every advertised content and account experience", async () => {
    const routes = [
      ["app/(site)/about/page.tsx", /getAboutContent/],
      ["app/(site)/journal/page.tsx", /getJournalPage/],
      ["app/(site)/journal/[slug]/page.tsx", /getJournalArticle/],
      ["app/(site)/contact/page.tsx", /getContactContent/],
      ["app/(site)/faq/page.tsx", /getFAQs/],
      ["app/(site)/account/page.tsx", /AccountExperience/]
    ];

    for (const [path, pattern] of routes) {
      assert.equal((await stat(join(rootDir, path))).isFile(), true, `${path} should exist`);
      const page = await readText(path);
      assert.match(page, /<main id="main-content"/);
      assert.match(page, pattern);
    }

    const [contactForm, faqExperience, accountExperience] = await Promise.all([
      readText("components/content/contact-form.tsx"),
      readText("components/content/faq-experience.tsx"),
      readText("components/account/account-experience.tsx")
    ]);
    assert.match(contactForm, /fetch\("\/api\/contact"/);
    assert.match(contactForm, /aria-live="polite"/);
    assert.match(faqExperience, /<details/);
    assert.match(faqExperience, /aria-pressed=\{active\}/);
    assert.match(accountExperience, /fetch\("\/api\/account"/);
    assert.match(accountExperience, /fetch\("\/api\/users\/login"/);
  });

  test("registers CMS-editable singleton content and the private contact inbox", async () => {
    const [config, about, contact, submissions] = await Promise.all([
      readText("payload.config.ts"),
      readText("payload/globals/About.ts"),
      readText("payload/globals/Contact.ts"),
      readText("payload/collections/ContactSubmissions.ts")
    ]);

    assert.match(config, /globals:\s*\[About, Contact\]/);
    assert.match(config, /\bContactSubmissions\b/);
    for (const field of ["hero", "story", "mission", "values", "founder"]) {
      assert.match(about, new RegExp(`name: "${field}"`));
    }
    assert.match(contact, /name:\s*"topics"/);
    assert.match(submissions, /create:\s*noOne/);
    assert.match(submissions, /name:\s*"requestFingerprint"[\s\S]*?hidden:\s*true/);
  });

  test("ships published content APIs and validates state-changing requests", async () => {
    const routes = [
      ["app/api/about/route.ts", /function GET/],
      ["app/api/journal/route.ts", /function GET/],
      ["app/api/journal/[slug]/route.ts", /function GET/],
      ["app/api/faqs/route.ts", /function GET/],
      ["app/api/contact/route.ts", /function POST/],
      ["app/api/account/route.ts", /function PATCH/],
      ["app/api/account/orders/route.ts", /function GET/]
    ];
    for (const [path, pattern] of routes) {
      assert.equal((await stat(join(rootDir, path))).isFile(), true);
      assert.match(await readText(path), pattern);
    }

    const contactRoute = await readText("app/api/contact/route.ts");
    const accountRoute = await readText("app/api/account/route.ts");
    assert.match(contactRoute, /assertSameOrigin\(request\)/);
    assert.match(contactRoute, /readJsonBody\(request\)/);
    assert.match(accountRoute, /assertSameOrigin\(request\)/);
    assert.match(accountRoute, /noStoreHeaders\(\)/);
  });

  test("enforces publication, ownership, private-field, and migration contracts", async () => {
    const [journal, account, users, access, migration, sitemap] = await Promise.all([
      readText("lib/cms/journal.ts"),
      readText("lib/cms/account.ts"),
      readText("payload/collections/Users.ts"),
      readText("payload/access.ts"),
      readText("payload/migrations/20260715000000_content_account.ts"),
      readText("app/sitemap.ts")
    ]);
    assert.match(journal, /isPublished:\s*\{ equals:\s*true \}/);
    assert.match(journal, /publishedAt:\s*\{ less_than_equal:/);
    assert.match(journal, /publishedRelationship\(doc\.relatedArtist\)/);
    assert.match(journal, /relationship\.isPublished === true/);
    assert.match(account, /payload\.auth\(\{ headers \}\)/);
    assert.match(account, /where:\s*\{ customer:\s*\{ equals:\s*user\.id \} \}/);
    assert.match(users, /read:\s*authenticated/);
    assert.match(users, /name:\s*"addresses"[\s\S]*?maxRows:\s*10/);
    assert.match(access, /adminOrSelf/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS "about"/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS "contact_submissions"/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS "users_addresses"/);
    assert.match(sitemap, /getPublishedJournalSlugs/);
  });

  test("keeps fallback editorial content complete, indexable, and useful to every FAQ audience", async () => {
    const [content, types] = await Promise.all([
      readText("data/content.ts"),
      readText("types/content.ts")
    ]);

    // The application deliberately remains usable when Payload is unavailable.
    // Keep the fallback equivalent to the CMS model, rather than a minimal shell.
    for (const section of ["hero", "story", "mission", "values", "founder", "milestones", "seo"]) {
      assert.match(content, new RegExp(`staticAboutContent[\\s\\S]*?${section}:`));
    }
    assert.match(content, /metaTitle:\s*"About ArtEffect"/);
    assert.match(content, /metaDescription:\s*"Meet ArtEffect/);
    assert.match(content, /staticJournalArticles:\s*JournalArticle\[\]/);
    assert.match(content, /isFeatured:\s*true/);
    assert.match(content, /seo:\s*\{[\s\S]*?metaTitle:/);
    assert.match(content, /staticContactContent[\s\S]*?topics:\s*\[/);

    for (const audience of ["all", "artists", "collectors", "ngo-partners"]) {
      assert.match(content, new RegExp(`audience:\\s*"${audience}"`));
    }
    assert.match(types, /export type AboutContent/);
    assert.match(types, /export type JournalArticle/);
    assert.match(types, /export type ContactContent/);
    assert.match(types, /export type FAQItem/);
  });
});
