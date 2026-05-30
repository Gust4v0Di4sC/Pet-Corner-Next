"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, useMemo, useState } from "react";
import { useCustomerProfileData } from "@/features/account/hooks/use-customer-profile-data";
import { useCustomerProfileImageUpload } from "@/features/account/hooks/use-customer-profile-image-upload";
import { useProfileAddressForm } from "@/features/account/hooks/use-profile-address-form";
import { useProfilePetForm } from "@/features/account/hooks/use-profile-pet-form";
import { useProfileSidebarState } from "@/features/account/hooks/use-profile-sidebar-state";
import type { ProfileSession } from "@/features/account/types/profile-dashboard";
import type { ProfileImageFeedback } from "@/features/account/components/profile-sidebar";

type UseProfileDashboardControllerInput = {
  session: ProfileSession;
};

export function useProfileDashboardController({
  session,
}: UseProfileDashboardControllerInput) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileImageMessage, setProfileImageMessage] = useState<string | null>(null);
  const [isProfileImageMessageError, setIsProfileImageMessageError] = useState(false);
  const sidebarState = useProfileSidebarState();

  const customerName = useMemo(
    () => session.name?.trim() || "Cliente Pet Corner",
    [session.name]
  );

  const {
    loading,
    errorMessage,
    profile,
    pets,
    orders,
    appointments,
    favorites,
    address,
    isCreatingPet,
    isSavingAddress,
    setProfileImageUrl,
    createPet,
    saveAddress,
  } = useCustomerProfileData({
    customerId: session.customerId,
    name: session.name,
    email: session.email,
  });

  const profileImageUrl = useMemo(() => {
    return profile?.profileImageUrl?.trim() || "";
  }, [profile?.profileImageUrl]);

  const {
    isUploading: isUploadingProfileImage,
    errorMessage: profileImageUploadErrorMessage,
    clearError: clearProfileImageUploadError,
    uploadProfileImage,
  } = useCustomerProfileImageUpload();

  const profilePets = useProfilePetForm({
    loading,
    pets,
    isCreatingPet,
    createPet,
  });

  const profileAddress = useProfileAddressForm({
    address,
    isSavingAddress,
    saveAddress,
  });

  const profileImageFeedbackItems = useMemo<ProfileImageFeedback[]>(() => {
    const feedbackItems: ProfileImageFeedback[] = [];

    if (profileImageUploadErrorMessage) {
      feedbackItems.push({
        type: "error",
        message: profileImageUploadErrorMessage,
      });
    }

    if (profileImageMessage) {
      feedbackItems.push({
        type: isProfileImageMessageError ? "error" : "success",
        message: profileImageMessage,
      });
    }

    return feedbackItems;
  }, [isProfileImageMessageError, profileImageMessage, profileImageUploadErrorMessage]);

  const handleProfileImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    setProfileImageMessage(null);
    setIsProfileImageMessageError(false);
    clearProfileImageUploadError();

    try {
      const uploadResult = await uploadProfileImage({
        customerId: session.customerId,
        file: selectedFile,
      });

      setProfileImageUrl(uploadResult.imageUrl);
      setProfileImageMessage("Foto de perfil atualizada com sucesso.");
      setIsProfileImageMessageError(false);
    } catch {
      setIsProfileImageMessageError(true);
      setProfileImageMessage("Não foi possível atualizar a foto de perfil.");
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ next: "/" }),
      });
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return {
    layout: {
      isSidebarExpanded: sidebarState.isSidebarExpanded,
    },
    pageHeader: {
      session,
      errorMessage,
      onOpenSidebar: sidebarState.openSidebar,
    },
    profileSidebar: {
      user: {
        name: customerName,
        email: session.email,
        profileImageUrl,
      },
      sidebar: {
        isExpanded: sidebarState.isSidebarExpanded,
        activeSection: sidebarState.activeSection,
        isLoggingOut,
      },
      profileImageUpload: {
        isUploading: isUploadingProfileImage,
        feedbackItems: profileImageFeedbackItems,
      },
      actions: {
        onToggle: sidebarState.toggleSidebar,
        onClose: sidebarState.closeSidebar,
        onSectionSelected: sidebarState.selectSection,
        onLogout: () => void handleLogout(),
        onProfileImageSelected: (event: ChangeEvent<HTMLInputElement>) =>
          void handleProfileImageSelected(event),
      },
    },
    profilePets: {
      data: {
        pets,
      },
      state: profilePets.state,
      actions: profilePets.actions,
    },
    profileAddress,
    relatedData: {
      loading,
      appointments,
      orders,
      favorites,
    },
  };
}
