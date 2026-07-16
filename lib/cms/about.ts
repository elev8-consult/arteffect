import { unstable_noStore as noStore } from "next/cache";

import { staticAboutContent } from "@/data/content";
import { hasPayloadDatabase } from "@/lib/cms/env";
import { getPayloadClient } from "@/lib/cms/payload";
import { documentImage, optionalText, record, records, relationshipID, richText, seoContent, text, type CmsRecord } from "@/lib/cms/content-utils";
import type { AboutContent } from "@/types/content";

type AboutPayload = {
  findGlobal: (args: { depth?: number; slug: "about" }) => Promise<CmsRecord>;
};

export async function getAboutContent(): Promise<AboutContent> {
  if (process.env.NODE_ENV !== "production") noStore();
  if (!hasPayloadDatabase()) return staticAboutContent;

  try {
    const payload = (await getPayloadClient()) as unknown as AboutPayload;
    return mapAbout(await payload.findGlobal({ slug: "about", depth: 1 }));
  } catch (error) {
    console.error("Payload about read failed; using static fallback.", error);
    return staticAboutContent;
  }
}

function mapAbout(doc: CmsRecord): AboutContent {
  const hero = record(doc.hero);
  const story = record(doc.story);
  const mission = record(doc.mission);
  const cta = record(mission.cta);
  const founder = record(doc.founder);

  return {
    hero: {
      eyebrow: text(hero.eyebrow, staticAboutContent.hero.eyebrow),
      image: documentImage(hero, "ArtEffect studio"),
      introduction: text(hero.introduction, staticAboutContent.hero.introduction),
      title: text(hero.title, staticAboutContent.hero.title)
    },
    story: {
      body: richText(story.body),
      heading: text(story.heading, staticAboutContent.story.heading),
      image: documentImage(story, "ArtEffect story")
    },
    mission: {
      body: richText(mission.body),
      cta: Object.keys(cta).length
        ? {
            href: optionalText(cta.href),
            label: optionalText(cta.label),
            style: cta.style === "secondary" || cta.style === "text" ? cta.style : "primary"
          }
        : undefined,
      eyebrow: optionalText(mission.eyebrow),
      heading: text(mission.heading, staticAboutContent.mission.heading)
    },
    values: records(doc.values).map((value, index) => ({
      description: text(value.description),
      id: relationshipID(value.id, `value-${index + 1}`),
      title: text(value.title, "Value")
    })),
    founder: {
      image: documentImage(founder, text(founder.name, "ArtEffect founder")),
      name: text(founder.name, staticAboutContent.founder.name),
      quote: optionalText(founder.quote),
      role: text(founder.role, staticAboutContent.founder.role),
      story: richText(founder.story)
    },
    milestones: records(doc.milestones).map((milestone, index) => ({
      description: text(milestone.description),
      id: relationshipID(milestone.id, `milestone-${index + 1}`),
      title: text(milestone.title, "Milestone"),
      year: text(milestone.year)
    })),
    seo: seoContent(doc.seo)
  };
}
