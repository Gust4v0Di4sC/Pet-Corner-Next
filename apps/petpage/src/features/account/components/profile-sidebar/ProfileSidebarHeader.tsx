import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProfileSidebarHeaderProps = {
  isExpanded: boolean;
  onToggle: () => void;
};

export function ProfileSidebarHeader({
  isExpanded,
  onToggle,
}: ProfileSidebarHeaderProps) {
  return (
    <div className={`flex items-center ${isExpanded ? "justify-between" : "justify-center"}`}>
      <Button
        type="button"
        onClick={onToggle}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-[#172236] text-slate-200 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
        aria-label={isExpanded ? "Retrair menu" : "Expandir menu"}
      >
        {isExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {isExpanded ? (
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Navegacao
        </p>
      ) : null}
    </div>
  );
}
