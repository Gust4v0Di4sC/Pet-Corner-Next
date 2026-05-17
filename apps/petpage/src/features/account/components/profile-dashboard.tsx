"use client";

import { ProfileAddressSection } from "@/features/account/components/profile-address-section";
import { ProfileAppointmentsSection } from "@/features/account/components/profile-appointments-section";
import { ProfileFavoritesSection } from "@/features/account/components/profile-favorites-section";
import { ProfileOrdersSection } from "@/features/account/components/profile-orders-section";
import { ProfilePageHeader } from "@/features/account/components/profile-page-header";
import { ProfilePetsSection } from "@/features/account/components/profile-pets-section";
import { ProfileSidebar } from "@/features/account/components/profile-sidebar";
import { useProfileDashboardController } from "@/features/account/hooks/use-profile-dashboard-controller";
import type { ProfileSession } from "@/features/account/types/profile-dashboard";

type ProfileDashboardProps = {
  session: ProfileSession;
};

export function ProfileDashboard({ session }: ProfileDashboardProps) {
  const dashboard = useProfileDashboardController({ session });

  return (
    <div className="relative flex gap-6">
      <ProfileSidebar
        user={dashboard.profileSidebar.user}
        sidebar={dashboard.profileSidebar.sidebar}
        profileImageUpload={dashboard.profileSidebar.profileImageUpload}
        actions={dashboard.profileSidebar.actions}
      />

      <div
        className={`min-w-0 flex-1 space-y-6 transition-[margin] duration-300 ${
          dashboard.layout.isSidebarExpanded
            ? "lg:ml-[340px] xl:ml-[348px]"
            : "lg:ml-[128px] xl:ml-[136px]"
        }`}
      >
        <ProfilePageHeader
          session={dashboard.pageHeader.session}
          errorMessage={dashboard.pageHeader.errorMessage}
          onOpenSidebar={dashboard.pageHeader.onOpenSidebar}
        />

        <ProfilePetsSection
          data={dashboard.profilePets.data}
          state={dashboard.profilePets.state}
          actions={dashboard.profilePets.actions}
        />

        <ProfileAppointmentsSection
          loading={dashboard.relatedData.loading}
          appointments={dashboard.relatedData.appointments}
        />
        <ProfileOrdersSection
          loading={dashboard.relatedData.loading}
          orders={dashboard.relatedData.orders}
        />
        <ProfileFavoritesSection
          loading={dashboard.relatedData.loading}
          favorites={dashboard.relatedData.favorites}
        />
        <ProfileAddressSection
          data={dashboard.profileAddress.data}
          state={dashboard.profileAddress.state}
          actions={dashboard.profileAddress.actions}
        />
      </div>
    </div>
  );
}
