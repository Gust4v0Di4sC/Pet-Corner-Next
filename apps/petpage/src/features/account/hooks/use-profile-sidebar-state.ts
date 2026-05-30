"use client";

import { useCallback, useEffect, useState } from "react";
import type { SectionId } from "@/features/account/types/profile-dashboard";

export function useProfileSidebarState() {
  const [activeSection, setActiveSection] = useState<SectionId>("pets");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    if (!isSidebarExpanded || typeof window === "undefined") {
      return;
    }

    if (window.innerWidth >= 1024) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarExpanded(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isSidebarExpanded]);

  const selectSection = useCallback((section: SectionId) => {
    setActiveSection(section);

    const sectionElement = document.getElementById(`profile-section-${section}`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarExpanded(false);
    }
  }, []);

  return {
    activeSection,
    isSidebarExpanded,
    openSidebar: () => setIsSidebarExpanded(true),
    closeSidebar: () => setIsSidebarExpanded(false),
    toggleSidebar: () => setIsSidebarExpanded((currentValue) => !currentValue),
    selectSection,
  };
}
