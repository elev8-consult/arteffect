import type { ArtistProfile } from "@/types/artist";

export const staticArtistProfiles: ArtistProfile[] = [
  {
    bio: "Maya works between Beirut and mountain villages, translating botanical archives into paintings, textiles, and public art commissions. Her studio practice begins outdoors: field notes, pressed matter, and conversations with the people who tend a place over time.",
    drops: [
      {
        eyebrow: "Batch 001",
        image: {
          alt: "A mountain ridge under a quiet evening sky",
          src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85"
        },
        slug: "batch-001",
        summary: "A collection of objects carrying Maya's artwork into daily rituals while funding reforestation and long-term care.",
        title: "Objects for a reforested ridge"
      }
    ],
    facts: [
      { label: "Based", value: "Beirut, Lebanon" },
      { label: "Working with", value: "Ink, textile, plant scans" },
      { label: "Research", value: "Botanical archives & field notes" }
    ],
    image: {
      alt: "Portrait of Maya Raad in her studio",
      src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=85"
    },
    instagram: "https://www.instagram.com/mayaraad.studio/",
    location: "Beirut, Lebanon",
    name: "Maya Raad",
    portraitGallery: [
      {
        alt: "A painter's hands making an ink mark on paper",
        caption: "A study begins with ink, water, and a collected leaf.",
        src: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1400&q=85"
      },
      {
        alt: "Artist studio shelves filled with materials",
        caption: "The studio holds fragments until a new pattern asks for them.",
        src: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1400&q=85"
      },
      {
        alt: "A quiet mountain landscape in Lebanon",
        caption: "The ridge that shaped Batch 001.",
        src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85"
      }
    ],
    processVideo: {
      caption: "A short studio study: ink, gathered leaves, and the first contour lines for A topography of return.",
      poster: {
        alt: "Hands working with ink and paper in a light-filled studio",
        src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1600&q=85"
      },
      src: "https://cdn.coverr.co/videos/coverr-woman-drawing-1572/1080p.mp4"
    },
    products: [],
    quote: "I wanted the work to feel like evidence of care: slow marks, local plants, and a landscape that is allowed to recover.",
    representativeWorks: [
      {
        image: {
          alt: "Abstract ink artwork in a contemporary gallery setting",
          src: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=85"
        },
        medium: "Ink, plant scan, cotton rag",
        title: "A topography of return",
        year: "2026"
      },
      {
        image: {
          alt: "Textile artwork in a neutral studio",
          src: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1200&q=85"
        },
        medium: "Pigment on silk",
        title: "Weather held close",
        year: "2025"
      },
      {
        image: {
          alt: "Landscape-inspired contemporary paper artwork",
          src: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=85"
        },
        medium: "Graphite and found matter",
        title: "After the rain",
        year: "2024"
      }
    ],
    role: "Painter and textile researcher",
    seo: {},
    slug: "maya-raad",
    website: "https://mayaraad.studio"
  },
  {
    bio: "Rana makes images that sit between architecture, memory, and the overlooked rhythms of a city. Her work follows materials as they age, gathering light, dust, and the informal marks left by use.",
    drops: [],
    facts: [{ label: "Based", value: "Tripoli, Lebanon" }, { label: "Medium", value: "Photography & collage" }],
    image: { alt: "Portrait of artist Rana Khoury", src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85" },
    location: "Tripoli, Lebanon",
    name: "Rana Khoury",
    portraitGallery: [],
    products: [],
    quote: "A place is never still. I am interested in the small evidence that proves it has been lived in.",
    representativeWorks: [],
    role: "Photographer and collagist",
    seo: {},
    slug: "rana-khoury"
  },
  {
    bio: "Elias works with clay, ash, and pigments drawn from the coast. His vessels are deliberately irregular: records of the hand, the kiln, and the small shifts that make each object distinct.",
    drops: [],
    facts: [{ label: "Based", value: "Tyre, Lebanon" }, { label: "Medium", value: "Ceramic & natural pigment" }],
    image: { alt: "Portrait of artist Elias Nassar", src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=85" },
    location: "Tyre, Lebanon",
    name: "Elias Nassar",
    portraitGallery: [],
    products: [],
    quote: "Clay keeps a very honest record of pressure, heat, and time.",
    representativeWorks: [],
    role: "Ceramic artist",
    seo: {},
    slug: "elias-nassar"
  }
];
