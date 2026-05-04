import { Button } from "@/components/ui/button";
import { SECTION_NAV_ITEMS } from "@/features/account/components/profile-dashboard.constants";
import type { SectionId } from "@/features/account/types/profile-dashboard";

type ProfileSidebarNavigationProps = {
  isExpanded: boolean;
  activeSection: SectionId;
  onSectionSelected: (section: SectionId) => void;
};

export function ProfileSidebarNavigation({
  isExpanded,
  activeSection,
  onSectionSelected,
}: ProfileSidebarNavigationProps) {
  return (
    <nav className="space-y-1.5">
      {SECTION_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;

        return (
          <Button
            key={item.id}
            type="button"
            onClick={() => onSectionSelected(item.id)}
            title={item.label}
            className={`flex w-full items-center rounded-xl py-2.5 text-left text-base transition ${
              isExpanded ? "justify-start gap-3 px-3" : "justify-center px-2"
            } ${
              isActive
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {isExpanded ? <span className="truncate">{item.label}</span> : null}
          </Button>
        );
      })}
    </nav>
  );
}
