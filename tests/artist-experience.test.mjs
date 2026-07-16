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

async function loadStaticArtists() {
  const typescript = await import("typescript");
  const artistSource = await source("lib", "cms", "artists.ts");
  const staticProduct = {
    displayPrice: "$80.00",
    form: "Scarf",
    image: "https://example.test/edition.jpg",
    imageAlt: "Edition",
    name: "Studio edition",
    slug: "studio-edition"
  };
  const javascript = typescript.transpileModule(
    artistSource
      .replace('import { unstable_noStore as noStore } from "next/cache";', "const noStore = () => undefined;")
      .replace('import { staticArtistProfiles } from "@/data/artists";', `import { staticArtistProfiles } from "${moduleUrl("data", "artists.ts")}";`)
      .replace('import { hasPayloadDatabase } from "@/lib/cms/env";', "const hasPayloadDatabase = () => false;")
      .replace('import { getPayloadClient } from "@/lib/cms/payload";', "const getPayloadClient = async () => { throw new Error(\"Payload must not be used in static tests.\"); };")
      .replace('import { getShopProducts } from "@/lib/cms/products";', `const getShopProducts = async () => ({ docs: [${JSON.stringify(staticProduct)}] });`),
    { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }
  ).outputText;

  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(javascript)}`);
}

describe("Artist showcase experience", () => {
  test("ships an artist directory and resilient, indexed profile route", async () => {
    const [directory, profile] = await Promise.all([
      source("app", "artists", "page.tsx"),
      source("app", "artists", "[slug]", "page.tsx")
    ]);

    assert.match(directory, /await getArtistDirectory\(\)/);
    assert.match(directory, /"@type": "ItemList"/);
    assert.match(directory, /<ArtistDirectory artists=\{artists\}/);
    assert.match(profile, /export async function generateMetadata/);
    assert.match(profile, /ArtistNotFoundError/);
    assert.match(profile, /notFound\(\)/);
    assert.match(profile, /"@type": "Person"/);
    assert.match(profile, /normalizeInstagramUrl\(artist\.instagram\)/);
    assert.match(profile, /<ArtistProfile artist=\{artist\}/);
  });

  test("tells the artist story through biography, process, art, drops, editions, and studio notes", async () => {
    const experience = await source("components", "artists", "artist-profile.tsx");

    assert.match(experience, /id="biography"/);
    assert.match(experience, /Studio process/);
    assert.match(experience, /<video/);
    assert.match(experience, /controls muted loop playsInline/);
    assert.match(experience, /Selected artwork/);
    assert.match(experience, /artist\.representativeWorks\.map/);
    assert.match(experience, /Drops and collections/);
    assert.match(experience, /artist\.drops\.map/);
    assert.match(experience, /Available editions/);
    assert.match(experience, /artist\.products\.map/);
    assert.match(experience, /Behind the scenes/);
    assert.match(experience, /artist\.portraitGallery\.map/);
    assert.match(experience, /aria-pressed=\{selectedWork === index\}/);
    assert.match(experience, /useReducedMotion/);
    assert.match(experience, /const reveal = reducedMotion \? \{ initial: false as const \} : revealMotion/);
  });

  test("maps published artist profiles, local video uploads, related drops, and artist products", async () => {
    const [artists, collection, media, sitemap] = await Promise.all([
      source("lib", "cms", "artists.ts"),
      source("payload", "collections", "Artists.ts"),
      source("payload", "collections", "Media.ts"),
      source("app", "sitemap.ts")
    ]);

    assert.match(artists, /collection: "artists"/);
    assert.match(artists, /slug: \{ equals: slug \}/);
    assert.match(artists, /isPublished: \{ equals: true \}/);
    assert.match(artists, /"artist\.slug": \{ equals: slug \}/);
    assert.match(artists, /getShopProducts\(\{/);
    assert.match(artists, /artist: slug/);
    assert.match(artists, /uploadedProcessVideo \?\? optionalText\(doc\.processVideoUrl\)/);
    assert.match(collection, /name: "processVideo"[\s\S]*?relationTo: "media"/);
    assert.match(collection, /name: "processVideoPoster"[\s\S]*?relationTo: "media"/);
    assert.match(media, /mimeTypes: \["image\/\*", "video\/\*"\]/);
    assert.match(sitemap, /getPublishedArtistSlugs/);
    assert.match(sitemap, /\/artists\/\$\{slug\}/);
  });

  test("returns a complete static directory and profile without requiring Payload", async () => {
    const { ArtistNotFoundError, getArtistDirectory, getArtistProfile, getPublishedArtistSlugs } = await loadStaticArtists();

    const [directory, profile, slugs] = await Promise.all([
      getArtistDirectory(),
      getArtistProfile("maya-raad"),
      getPublishedArtistSlugs()
    ]);

    assert.deepEqual(directory.map(({ image, location, name, role, slug }) => ({
      hasPortrait: Boolean(image?.src), location, name, role, slug
    })), [
      { hasPortrait: true, location: "Beirut, Lebanon", name: "Maya Raad", role: "Painter and textile researcher", slug: "maya-raad" },
      { hasPortrait: true, location: "Tripoli, Lebanon", name: "Rana Khoury", role: "Photographer and collagist", slug: "rana-khoury" },
      { hasPortrait: true, location: "Tyre, Lebanon", name: "Elias Nassar", role: "Ceramic artist", slug: "elias-nassar" }
    ]);
    assert.deepEqual(slugs, ["maya-raad", "rana-khoury", "elias-nassar"]);
    assert.equal(profile.name, "Maya Raad");
    assert.equal(profile.instagram, "https://www.instagram.com/mayaraad.studio/");
    assert.equal(profile.processVideo?.src, "https://cdn.coverr.co/videos/coverr-woman-drawing-1572/1080p.mp4");
    assert.equal(profile.representativeWorks.length, 3);
    assert.equal(profile.portraitGallery.length, 3);
    assert.deepEqual(profile.products.map((product) => product.slug), ["studio-edition"]);

    await assert.rejects(() => getArtistProfile("not-an-artist"), ArtistNotFoundError);
  });

  test("normalizes public artist links for navigation and structured data", async () => {
    const { normalizeExternalUrl, normalizeInstagramUrl } = await import(moduleUrl("lib", "artist-links.ts"));

    assert.equal(normalizeExternalUrl("artist.example"), "https://artist.example/");
    assert.equal(normalizeExternalUrl("http://artist.example"), undefined);
    assert.equal(normalizeInstagramUrl("@studio.name"), "https://www.instagram.com/studio.name/");
    assert.equal(normalizeInstagramUrl("https://instagram.com/studio.name/?hl=en"), "https://www.instagram.com/studio.name/");
    assert.equal(normalizeInstagramUrl("https://example.com/studio.name"), undefined);
  });
});
