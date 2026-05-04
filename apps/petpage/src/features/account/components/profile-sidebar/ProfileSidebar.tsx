"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ProfileSidebarBackdrop } from "@/features/account/components/profile-sidebar/ProfileSidebarBackdrop";
import { ProfileSidebarHeader } from "@/features/account/components/profile-sidebar/ProfileSidebarHeader";
import { ProfileSidebarLogoutButton } from "@/features/account/components/profile-sidebar/ProfileSidebarLogoutButton";
import { ProfileSidebarNavigation } from "@/features/account/components/profile-sidebar/ProfileSidebarNavigation";
import { ProfileSidebarUserCard } from "@/features/account/components/profile-sidebar/ProfileSidebarUserCard";
import type { ProfileSidebarProps } from "@/features/account/components/profile-sidebar/profile-sidebar.types";

export function ProfileSidebar({
  user,
  sidebar,
  profileImageUpload,
  actions,
}: ProfileSidebarProps) {
  const { isExpanded, activeSection, isLoggingOut } = sidebar;

  return (
    <>
      <ProfileSidebarBackdrop isVisible={isExpanded} onClose={actions.onClose} />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[300px] -translate-x-full transition-[width,transform] duration-300 lg:left-4 xl:left-6 lg:top-24 lg:bottom-5 lg:h-[calc(100svh-7.25rem)] lg:translate-x-0 ${
          isExpanded ? "translate-x-0" : "translate-x-[-105%]"
        } ${isExpanded ? "lg:w-[300px]" : "lg:w-[88px]"}`}
      >
        <Card className="h-full rounded-none border-y-0 border-l-0 border-r border-slate-700/90 bg-[#0f1722] text-slate-100 shadow-[0_24px_55px_-35px_rgba(15,23,42,0.95)] lg:rounded-[2rem] lg:border">
          <CardContent className="flex h-full flex-col gap-6 p-4">
            <ProfileSidebarHeader isExpanded={isExpanded} onToggle={actions.onToggle} />
            <ProfileSidebarUserCard
              user={user}
              isExpanded={isExpanded}
              profileImageUpload={profileImageUpload}
              onProfileImageSelected={actions.onProfileImageSelected}
            />
            <ProfileSidebarNavigation
              isExpanded={isExpanded}
              activeSection={activeSection}
              onSectionSelected={actions.onSectionSelected}
            />
            <ProfileSidebarLogoutButton
              isExpanded={isExpanded}
              isLoggingOut={isLoggingOut}
              onLogout={actions.onLogout}
            />
          </CardContent>
        </Card>
      </aside>
    </>
  );
}
