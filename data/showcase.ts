import type {
  Artist,
  Artwork,
  Cause,
  Drop,
  ImpactStat,
  Product,
  ShowcaseContent,
  Testimonial
} from "@/types/showcase";

export const products: Product[] = [
  {
    id: "silk-scarf",
    defaultVariantId: "silk-scarf-multicolor-s",
    name: "Edition Silk Scarf",
    form: "Wearable artwork",
    price: "$120",
    edition: "120 numbered pieces",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Editorial fashion portrait wearing a sculptural textile piece",
    story:
      "A soft square cut from the campaign artwork, edged by hand and shipped with its signed edition card.",
    materials: ["Mulberry silk", "Hand rolled edge", "Edition certificate"]
  },
  {
    id: "ceramic-plate",
    defaultVariantId: "ceramic-plate-off-white-one-size",
    name: "Ceramic Plate",
    form: "Table object",
    price: "$95",
    edition: "80 numbered pieces",
    image:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Handmade ceramic plates arranged on a neutral studio surface",
    story:
      "A functional plate with an artwork fragment fired beneath a transparent glaze for daily rituals.",
    materials: ["Stoneware", "Food-safe glaze", "Kiln fired artwork"]
  },
  {
    id: "cotton-tote",
    defaultVariantId: "cotton-tote-beige-one-size",
    name: "Archive Tote",
    form: "Daily carry",
    price: "$48",
    edition: "300 numbered pieces",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Minimal canvas tote photographed against a warm neutral wall",
    story:
      "A sturdy canvas edition for collectors who want the drop to move through the city with them.",
    materials: ["Organic cotton", "Screen print", "Inside story label"]
  }
];

export const drop: Drop = {
  slug: "batch-001",
  eyebrow: "Batch 001",
  title: "Objects for a reforested ridge",
  summary:
    "The first ArtEffect batch transforms one commissioned artwork into collectable objects. Each sale funds planting, maintenance, and public reporting for a Lebanese reforestation partner.",
  batchSize: 500,
  reserved: 318,
  closesAt: "August 31, 2026",
  image:
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85",
  imageAlt: "A mountain ridge under a quiet evening sky",
  milestones: [
    { label: "Artwork approved", value: "Complete", progress: 100 },
    { label: "Production window", value: "Live", progress: 64 },
    { label: "Impact transfer", value: "After sell-through", progress: 18 }
  ]
};

export const artwork: Artwork = {
  title: "A topography of return",
  artistLine: "Original artwork by Maya Raad",
  summary:
    "Layered ink, pressed leaves, and field notes become a quiet map of regrowth. The design system carries those marks across every object without flattening the work into a logo.",
  image:
    "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1400&q=85",
  imageAlt: "Gallery wall with framed contemporary artworks",
  details: [
    {
      label: "01",
      title: "Contour lines",
      body:
        "Fine graphite paths reference the slope where the batch funds will be allocated.",
      x: 31,
      y: 38
    },
    {
      label: "02",
      title: "Pressed botanicals",
      body:
        "Scanned pine needles and native leaves form the repeat pattern used on textile editions.",
      x: 58,
      y: 48
    },
    {
      label: "03",
      title: "Gilt registration",
      body:
        "A restrained metallic accent marks each numbered object and links the collection together.",
      x: 71,
      y: 68
    }
  ]
};

export const artist: Artist = {
  name: "Maya Raad",
  role: "Painter and textile researcher",
  quote:
    "I wanted the work to feel like evidence of care: slow marks, local plants, and a landscape that is allowed to recover.",
  bio:
    "Maya works between Beirut and mountain villages, translating botanical archives into paintings, textiles, and public art commissions.",
  image:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=85",
  imageAlt: "Portrait of a contemporary artist in natural light",
  facts: [
    { label: "Studio", value: "Beirut" },
    { label: "Medium", value: "Ink, textile, plant scans" },
    { label: "Edition", value: "Signed batch card included" }
  ]
};

export const cause: Cause = {
  name: "Green Cedar Collective",
  focus: "Native reforestation and three-year sapling care",
  summary:
    "The partner NGO receives a fixed allocation from every object sold. Funds are tracked against planting, irrigation, maintenance, and public survival-rate reporting.",
  image:
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=85",
  imageAlt: "Community volunteers gathered outdoors for a cause-led project",
  metrics: [
    { label: "Planting allocation", value: "$18 per object", progress: 72 },
    { label: "Maintenance reserve", value: "3 seasons", progress: 58 },
    { label: "Public reporting", value: "Quarterly", progress: 46 }
  ]
};

export const impactStats: ImpactStat[] = [
  {
    label: "Projected saplings",
    value: 2400,
    metricType: "projected",
    detail: "Funded if Batch 001 sells through"
  },
  {
    label: "Artist royalty",
    value: 12,
    metricType: "committed",
    suffix: "%",
    detail: "Paid on every object, not after profit"
  },
  {
    label: "NGO allocation",
    value: 9000,
    metricType: "transferred",
    prefix: "$",
    detail: "Reserved for planting and aftercare"
  }
];

export const testimonials: Testimonial[] = [
  {
    quote:
      "The object is beautiful on its own, but knowing exactly where part of the sale is going makes it feel like a more considered kind of collecting.",
    name: "Nadine S.",
    role: "Collector, Beirut"
  },
  {
    quote:
      "ArtEffect gave the work room to stay specific. It did not turn the painting into a campaign; it made a tangible route back to the landscape.",
    name: "Maya Raad",
    role: "Batch 001 artist"
  },
  {
    quote:
      "Clear reporting changes the relationship. Donors can see how an edition becomes planting, care, and a living hillside over time.",
    name: "Fadi K.",
    role: "Green Cedar Collective"
  }
];

export const staticShowcaseContent: ShowcaseContent = {
  artist,
  artwork,
  cause,
  drop,
  impactStats,
  products,
  testimonials
};
