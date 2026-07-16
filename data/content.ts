import type { AboutContent, ContactContent, FAQItem, JournalArticle } from "@/types/content";

const paragraph = (text: string) => ({
  root: {
    children: [{ children: [{ detail: 0, format: 0, mode: "normal", style: "", text, type: "text", version: 1 }], direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1 }],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1
  }
});

export const staticAboutContent: AboutContent = {
  hero: {
    eyebrow: "About ArtEffect",
    image: {
      alt: "An artist shaping a considered object in the studio",
      src: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1800&q=85"
    },
    introduction: "ArtEffect makes limited objects where independent art, considered design, and accountable giving belong to the same story.",
    title: "Beautiful objects can carry visible change."
  },
  story: {
    heading: "An edition with a longer life",
    image: {
      alt: "Paper, tools, and artwork arranged in a working studio",
      src: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1400&q=85"
    },
    body: paragraph("We began with a simple conviction: collecting design should sustain the people who make culture and the organisations doing essential work.")
  },
  mission: {
    eyebrow: "Our mission",
    heading: "Keep authorship, craft, and impact connected.",
    body: paragraph("Every drop names its artist, explains its production, introduces its cause partner, and follows the contribution beyond checkout."),
    cta: { href: "/impact", label: "See the impact ledger", style: "text" }
  },
  values: [
    { id: "value-1", title: "Authorship", description: "Artists remain visible, credited, and central to the value of every edition." },
    { id: "value-2", title: "Restraint", description: "We make fewer, more considered objects and give their stories room to breathe." },
    { id: "value-3", title: "Accountability", description: "Impact is recorded as evidence, not used as decoration." }
  ],
  founder: {
    image: {
      alt: "The ArtEffect founder in the studio",
      src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=85"
    },
    name: "The ArtEffect founder",
    role: "Founder and creative director",
    quote: "The object is the beginning of the relationship, not the end of it.",
    story: paragraph("ArtEffect was founded to build a more direct bridge between collectors, working artists, and trusted local causes.")
  },
  milestones: [],
  seo: {
    metaTitle: "About ArtEffect",
    metaDescription: "Meet ArtEffect: limited art objects connecting independent artists, thoughtful design, and measurable NGO impact."
  }
};

export const staticContactContent: ContactContent = {
  eyebrow: "Contact",
  title: "Start a thoughtful conversation.",
  introduction: "Questions about an order, an edition, an artist collaboration, or a cause partnership are welcome.",
  details: { email: "hello@arteffect.com" },
  responseNote: "We usually reply within two working days.",
  topics: [
    { label: "General enquiry", value: "general" },
    { label: "Order support", value: "order-support" },
    { label: "Artist collaboration", value: "artist-collaboration" },
    { label: "NGO partnership", value: "ngo-partnership" },
    { label: "Press", value: "press" }
  ],
  seo: {
    metaTitle: "Contact ArtEffect",
    metaDescription: "Contact ArtEffect about orders, limited editions, artist collaborations, press, or NGO partnerships."
  }
};

export const staticJournalArticles: JournalArticle[] = [
  {
    authorName: "ArtEffect",
    category: "studio",
    content: paragraph("A limited edition asks for clarity: who made it, why this material was chosen, how many exist, and what its sale makes possible. We document those decisions before an object enters the world."),
    excerpt: "Why every ArtEffect edition begins with authorship, material clarity, and a visible promise.",
    isFeatured: true,
    publishedAt: "2026-06-18T09:00:00.000Z",
    readTime: 4,
    seo: {
      metaTitle: "How an ArtEffect edition begins",
      metaDescription: "Inside the decisions that connect artist authorship, considered production, and accountable impact in every ArtEffect edition."
    },
    slug: "how-an-edition-begins",
    tags: ["Process", "Editions"],
    title: "How an edition begins"
  },
  {
    authorName: "ArtEffect",
    category: "impact-report",
    content: paragraph("Impact reporting should remain legible after the campaign ends. Our ledger separates projected, committed, transferred, and verified amounts so that progress is visible without overstating it."),
    excerpt: "A practical note on the evidence behind our impact language and public ledger.",
    isFeatured: false,
    publishedAt: "2026-05-27T09:00:00.000Z",
    readTime: 3,
    seo: {
      metaTitle: "What accountable impact reporting means",
      metaDescription: "How ArtEffect distinguishes projected, committed, transferred, and verified impact across every limited drop."
    },
    slug: "accountable-impact-reporting",
    tags: ["Impact", "Transparency"],
    title: "What accountable impact reporting means"
  }
];

export const staticFAQs: FAQItem[] = [
  { id: "faq-1", category: "drops", audience: "all", question: "What is an ArtEffect drop?", answer: paragraph("A drop is a time-bound, limited batch built around one artwork, its artist, a considered object, and a named cause partner.") },
  { id: "faq-2", category: "products", audience: "collectors", question: "Are the objects limited editions?", answer: paragraph("Yes. Each product page states its batch or edition size and availability. We do not silently extend a closed edition.") },
  { id: "faq-3", category: "orders", audience: "collectors", question: "How can I review my order?", answer: paragraph("Signed-in collectors can review orders in their account. Guest orders remain available through the private link created at checkout.") },
  { id: "faq-4", category: "shipping-returns", audience: "all", question: "Where does ArtEffect ship?", answer: paragraph("Available destinations and delivery estimates are calculated at checkout from the active shipping methods in our CMS.") },
  { id: "faq-5", category: "artists", audience: "artists", question: "How do artist collaborations work?", answer: paragraph("We develop each edition collaboratively, agree authorship and commercial terms before production, and keep the artist visible throughout its story.") },
  { id: "faq-6", category: "impact", audience: "ngo-partners", question: "How is impact recorded?", answer: paragraph("Our public ledger distinguishes projected, committed, transferred, and verified amounts and connects each entry to its cause and drop.") }
];
