import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellTone = "store" | "success";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  tone?: PageShellTone;
};

const toneClassNames: Record<PageShellTone, string> = {
  store:
    "bg-[radial-gradient(circle_at_85%_15%,rgba(251,139,36,0.18),transparent_40%),linear-gradient(145deg,#4a2d03_0%,#3b2608_55%,#2d1b06_100%)]",
  success:
    "bg-[radial-gradient(circle_at_85%_15%,rgba(34,197,94,0.16),transparent_40%),linear-gradient(145deg,#203047_0%,#122033_55%,#0b1422_100%)]",
};

export function PageShell({ children, className, tone = "store" }: PageShellProps) {
  return <main className={cn("min-h-svh", toneClassNames[tone], className)}>{children}</main>;
}

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1320px] px-4 py-8 md:py-10", className)}>
      {children}
    </div>
  );
}
