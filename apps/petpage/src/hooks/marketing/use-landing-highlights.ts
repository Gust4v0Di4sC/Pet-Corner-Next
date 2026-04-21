"use client";

import { useMemo } from "react";
import type { MarketingSection } from "@/domain/marketing/entities/marketing-section";

export function useLandingHighlights(sections: MarketingSection[]) {
  return useMemo(
    () => sections.filter((section) => section.isVisible).map((section) => section.sectionId),
    [sections]
  );
}
