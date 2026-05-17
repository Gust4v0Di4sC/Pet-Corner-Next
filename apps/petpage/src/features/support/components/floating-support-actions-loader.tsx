"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const FloatingSupportActions = dynamic(
  () =>
    import("@/features/support/components/floating-support-actions").then(
      (module) => module.FloatingSupportActions
    ),
  { ssr: false }
);

export function FloatingSupportActionsLoader() {
  const pathname = usePathname();

  if (pathname === "/" || pathname.startsWith("/app-react")) {
    return null;
  }

  return <FloatingSupportActions />;
}
