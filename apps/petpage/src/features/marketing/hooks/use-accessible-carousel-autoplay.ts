"use client";

import { useEffect } from "react";
import type { EmblaCarouselType } from "embla-carousel";

export function useAccessibleCarouselAutoplay(
  api: EmblaCarouselType | undefined,
  itemCount: number,
  intervalMs: number
) {
  useEffect(() => {
    if (!api || itemCount < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = api.rootNode();
    let visible = false;
    let interacted = false;
    const stop = () => { interacted = true; };
    root.addEventListener("pointerdown", stop, { once: true });
    root.addEventListener("keydown", stop, { once: true });
    const observer = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); }, { threshold: 0.25 });
    observer.observe(root);
    const timer = window.setInterval(() => {
      if (!visible || interacted || document.hidden || root.matches(":hover, :focus-within")) return;
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, intervalMs);
    return () => {
      window.clearInterval(timer);
      observer.disconnect();
      root.removeEventListener("pointerdown", stop);
      root.removeEventListener("keydown", stop);
    };
  }, [api, intervalMs, itemCount]);
}
