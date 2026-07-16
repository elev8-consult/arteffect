import type { CauseProfile } from "@/types/cause";

export const staticCauseProfiles: CauseProfile[] = [
  {
    contact: { email: "field@greencedarcollective.org", name: "Field partnerships", phone: "+961 1 555 018" },
    drops: [
      {
        donationPercentage: 75,
        eyebrow: "Batch 001",
        gallery: [
          { alt: "A forested mountain ridge in evening light", caption: "The ridge supported by Batch 001.", src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85" },
          { alt: "A cedar forest landscape", caption: "Care continues well beyond planting day.", src: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=85" }
        ],
        image: { alt: "A mountain ridge under a quiet evening sky", src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85" },
        slug: "batch-001",
        summary: "A collection of daily objects that funds native planting, irrigation, and three years of aftercare on a Lebanese ridge.",
        title: "Objects for a reforested ridge"
      }
    ],
    focus: "Native reforestation and three-year sapling care",
    gallery: [
      { alt: "Community volunteers gathered outdoors for a reforestation project", caption: "Planting works best when it begins with local stewardship.", src: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=85" },
      { alt: "A cedar forest in soft light", caption: "A living landscape, measured over seasons rather than a single day.", src: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=85" },
      { alt: "A wide mountain landscape", caption: "Field observations inform every next planting cycle.", src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85" }
    ],
    image: { alt: "Community volunteers gathered outdoors for a cause-led project", src: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=85" },
    legalName: "Green Cedar Collective Association",
    metrics: [
      { label: "Planting allocation", progress: 72, value: "$18 per object" },
      { label: "Maintenance reserve", progress: 58, value: "3 seasons" },
      { label: "Public reporting", progress: 46, value: "Quarterly" }
    ],
    name: "Green Cedar Collective",
    products: [],
    programs: [
      { allocation: "45% of Batch 001 proceeds", description: "Native seedlings are selected for the ridge, planted with local crews, and logged by plot.", name: "Native planting" },
      { allocation: "30% of Batch 001 proceeds", description: "Irrigation, maintenance, and survival checks keep new planting alive through its most vulnerable seasons.", name: "Three-year care" }
    ],
    registrationNumber: "NGO-LEB-2019-047",
    reports: [{ externalUrl: "https://example.org/impact-report", period: "2026 / Q3", title: "Field update: Batch 001" }],
    seo: {},
    slug: "green-cedar-collective",
    summary: "Green Cedar Collective works with local crews to restore native woodland through planting plans that make room for the less visible work: irrigation, maintenance, survival checks, and public field reporting.",
    verificationStatus: "verified",
    website: "https://example.org"
  }
];
