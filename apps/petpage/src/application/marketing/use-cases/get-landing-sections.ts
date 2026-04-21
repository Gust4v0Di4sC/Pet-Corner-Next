import type { MarketingSection } from "@/domain/marketing/entities/marketing-section";

const DEFAULT_SECTIONS: MarketingSection[] = [
  { sectionId: "hero", isVisible: true },
  { sectionId: "services", isVisible: true },
  { sectionId: "about", isVisible: true },
  { sectionId: "products", isVisible: true },
  { sectionId: "testimonials", isVisible: true },
  { sectionId: "footer", isVisible: true },
];

export function getLandingSections(): MarketingSection[] {
  return DEFAULT_SECTIONS;
}
