"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { sanitizeRedirectPath } from "@/utils/shared/route";

export function useRedirectQuery(fallbackPath = "/profile") {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const next = searchParams.get("next");
    return sanitizeRedirectPath(next, fallbackPath);
  }, [fallbackPath, searchParams]);
}
