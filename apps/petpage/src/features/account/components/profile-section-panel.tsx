import type { ReactNode } from "react";

type ProfileSectionPanelProps = {
  id: string;
  title?: string;
  children: ReactNode;
  headerAction?: ReactNode;
};

export function ProfileSectionPanel({
  id,
  title,
  children,
  headerAction,
}: ProfileSectionPanelProps) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-[2rem] border border-slate-700/90 bg-[#0f1722] p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]"
    >
      {title || headerAction ? (
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title ? <h2 className="text-4xl font-semibold text-slate-100">{title}</h2> : null}
          {headerAction}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function ProfileEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-4 text-lg text-slate-300">
      {children}
    </div>
  );
}
