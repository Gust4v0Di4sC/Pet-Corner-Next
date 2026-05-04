import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toDisplayDate } from "@/features/account/utils/profile-dashboard-formatters";
import type { ProfileSession } from "@/features/account/types/profile-dashboard";

type ProfilePageHeaderProps = {
  session: ProfileSession;
  errorMessage: string | null;
  onOpenSidebar: () => void;
};

export function ProfilePageHeader({
  session,
  errorMessage,
  onOpenSidebar,
}: ProfilePageHeaderProps) {
  return (
    <header className="space-y-2 px-1">
      <div className="flex items-center lg:hidden">
        <Button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex items-center gap-2 rounded-full border border-amber-100/35 px-3 py-1.5 text-sm font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-100/10"
        >
          <Menu className="h-4 w-4" />
          Menu
        </Button>
      </div>

      <h1 className="text-balance text-5xl font-bold leading-[1.02] text-slate-100 md:text-7xl">
        Meu perfil
      </h1>
      <p className="text-lg text-amber-100/80 md:text-3xl">
        Acompanhe seus pedidos e gerencie seus pets de estimacao.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-amber-100/70">
          Sessao expira em {toDisplayDate(session.expiresAt)}
        </span>
      </div>
      {errorMessage ? (
        <p className="inline-flex rounded-lg bg-red-950/40 px-3 py-2 text-sm font-medium text-red-200">
          {errorMessage}
        </p>
      ) : null}
    </header>
  );
}
