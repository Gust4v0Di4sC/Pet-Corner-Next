import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProfileSidebarLogoutButtonProps = {
  isExpanded: boolean;
  isLoggingOut: boolean;
  onLogout: () => void;
};

export function ProfileSidebarLogoutButton({
  isExpanded,
  isLoggingOut,
  onLogout,
}: ProfileSidebarLogoutButtonProps) {
  return (
    <Button
      type="button"
      onClick={onLogout}
      disabled={isLoggingOut}
      title="Sair"
      className={`mt-auto inline-flex w-full items-center rounded-xl py-2.5 text-left text-base text-red-400 transition hover:bg-red-900/25 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60 ${
        isExpanded ? "justify-start gap-3 px-3" : "justify-center px-2"
      }`}
    >
      <LogOut className="h-5 w-5 shrink-0" />
      {isExpanded ? (isLoggingOut ? "Saindo..." : "Sair") : null}
    </Button>
  );
}
