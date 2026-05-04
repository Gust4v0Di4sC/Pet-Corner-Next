"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ProfileAddressSection } from "@/features/account/components/profile-address-section";
import {
  INITIAL_ADDRESS_FORM,
  INITIAL_PET_FORM,
} from "@/features/account/components/profile-dashboard.constants";
import { ProfileAppointmentsSection } from "@/features/account/components/profile-appointments-section";
import { ProfileFavoritesSection } from "@/features/account/components/profile-favorites-section";
import { ProfileOrdersSection } from "@/features/account/components/profile-orders-section";
import { ProfilePageHeader } from "@/features/account/components/profile-page-header";
import { ProfilePetsSection } from "@/features/account/components/profile-pets-section";
import {
  ProfileSidebar,
  type ProfileImageFeedback,
} from "@/features/account/components/profile-sidebar";
import { useCustomerProfileData } from "@/features/account/hooks/use-customer-profile-data";
import { useCustomerProfileImageUpload } from "@/features/account/hooks/use-customer-profile-image-upload";
import type {
  AddressFormState,
  PetFormState,
  ProfileSession,
  SectionId,
} from "@/features/account/types/profile-dashboard";
import {
  normalizeAddressFormValue,
  resetPetBreedSelection,
  toAddressFormState,
  updatePetFormField,
} from "@/features/account/utils/profile-dashboard-forms";
import { MANUAL_BREED_OPTION } from "@/features/account/utils/pet-options";
import { getFirstZodErrorMessage } from "@/lib/validation/input-sanitizers";
import {
  createPetProfileSchema,
  customerAddressSchema,
} from "@/features/account/validation/profile-schemas";

type ProfileDashboardProps = {
  session: ProfileSession;
};

const petProfileSchema = createPetProfileSchema(MANUAL_BREED_OPTION);

export function ProfileDashboard({ session }: ProfileDashboardProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SectionId>("pets");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [showPetForm, setShowPetForm] = useState(false);
  const [petForm, setPetForm] = useState<PetFormState>(INITIAL_PET_FORM);
  const [petErrorMessage, setPetErrorMessage] = useState<string | null>(null);

  const [addressFormDraft, setAddressFormDraft] = useState<AddressFormState | null>(null);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [isAddressMessageError, setIsAddressMessageError] = useState(false);
  const [profileImageMessage, setProfileImageMessage] = useState<string | null>(null);
  const [isProfileImageMessageError, setIsProfileImageMessageError] = useState(false);

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

  const addressForm = useMemo<AddressFormState>(() => {
    if (addressFormDraft) {
      return addressFormDraft;
    }

    return toAddressFormState(address, INITIAL_ADDRESS_FORM);
  }, [address, addressFormDraft]);

  const isPetFormVisible = showPetForm || (!loading && pets.length === 0);

  useEffect(() => {
    if (!isSidebarExpanded || typeof window === "undefined") {
      return;
    }

    if (window.innerWidth >= 1024) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarExpanded(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isSidebarExpanded]);

  const scrollToSection = useCallback((section: SectionId) => {
    setActiveSection(section);
    const sectionElement = document.getElementById(`profile-section-${section}`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarExpanded(false);
    }
  }, []);

  const handlePetInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setPetForm((currentState) => updatePetFormField(currentState, name, value));
  };

  const resetBreedSelection = () => {
    setPetForm(resetPetBreedSelection);
  };

  const handleCreatePet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPetErrorMessage(null);

    const parsedInput = petProfileSchema.safeParse(petForm);
    if (!parsedInput.success) {
      setPetErrorMessage(
        getFirstZodErrorMessage(
          parsedInput.error,
          "Preencha nome, tipo do animal, raca, idade e peso para registrar o pet."
        )
      );
      return;
    }

    try {
      await createPet(parsedInput.data);
      setPetForm(INITIAL_PET_FORM);
      setShowPetForm(false);
    } catch {
      setPetErrorMessage("Nao foi possivel salvar o pet agora. Tente novamente.");
    }
  };

  const handleAddressInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const nextValue = normalizeAddressFormValue(name, value);

    setAddressFormDraft((currentState) => ({
      ...(currentState || addressForm),
      [name]: nextValue,
    }));
  };

  const handleAddressSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddressMessage(null);
    setIsAddressMessageError(false);

    const parsedInput = customerAddressSchema.safeParse(addressForm);
    if (!parsedInput.success) {
      setIsAddressMessageError(true);
      setAddressMessage(
        getFirstZodErrorMessage(parsedInput.error, "Nao foi possivel validar os dados do endereco.")
      );
      return;
    }

    try {
      await saveAddress(parsedInput.data);
      setAddressFormDraft(null);
      setIsAddressMessageError(false);
      setAddressMessage("Endereco salvo com sucesso.");
    } catch {
      setIsAddressMessageError(true);
      setAddressMessage("Nao foi possivel salvar o endereco agora.");
    }
  };

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
      setProfileImageMessage("Nao foi possivel atualizar a foto de perfil.");
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

  const handleToggleSidebar = () => {
    setIsSidebarExpanded((currentValue) => !currentValue);
  };

  const handleOpenSidebar = () => {
    setIsSidebarExpanded(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarExpanded(false);
  };

  const handleLogoutClick = () => {
    void handleLogout();
  };

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    void handleProfileImageSelected(event);
  };

  const handleTogglePetForm = () => {
    setShowPetForm((current) => !current);
  };

  const handleCreatePetSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleCreatePet(event);
  };

  const handleAddressFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleAddressSubmit(event);
  };

  const profileSidebarUser = {
    name: customerName,
    email: session.email,
    profileImageUrl,
  };

  const profileSidebarState = {
    isExpanded: isSidebarExpanded,
    activeSection,
    isLoggingOut,
  };

  const profileImageUploadState = {
    isUploading: isUploadingProfileImage,
    feedbackItems: profileImageFeedbackItems,
  };

  const profileSidebarActions = {
    onToggle: handleToggleSidebar,
    onClose: handleCloseSidebar,
    onSectionSelected: scrollToSection,
    onLogout: handleLogoutClick,
    onProfileImageSelected: handleProfileImageChange,
  };

  const profilePetsData = {
    pets,
  };

  const profilePetsState = {
    loading,
    isFormVisible: isPetFormVisible,
    petForm,
    petErrorMessage,
    isCreatingPet,
  };

  const profilePetsActions = {
    onToggleForm: handleTogglePetForm,
    onPetInputChange: handlePetInputChange,
    onCreatePet: handleCreatePetSubmit,
    onResetBreedSelection: resetBreedSelection,
  };

  const profileAddressData = {
    addressForm,
    address,
  };

  const profileAddressState = {
    addressMessage,
    isAddressMessageError,
    isSavingAddress,
  };

  const profileAddressActions = {
    onAddressInputChange: handleAddressInputChange,
    onAddressSubmit: handleAddressFormSubmit,
  };

  return (
    <div className="relative flex gap-6">
      <ProfileSidebar
        user={profileSidebarUser}
        sidebar={profileSidebarState}
        profileImageUpload={profileImageUploadState}
        actions={profileSidebarActions}
      />

      <div
        className={`min-w-0 flex-1 space-y-6 transition-[margin] duration-300 ${
          isSidebarExpanded ? "lg:ml-[340px] xl:ml-[348px]" : "lg:ml-[128px] xl:ml-[136px]"
        }`}
      >
        <ProfilePageHeader
          session={session}
          errorMessage={errorMessage}
          onOpenSidebar={handleOpenSidebar}
        />

        <ProfilePetsSection
          data={profilePetsData}
          state={profilePetsState}
          actions={profilePetsActions}
        />

        <ProfileAppointmentsSection loading={loading} appointments={appointments} />
        <ProfileOrdersSection loading={loading} orders={orders} />
        <ProfileFavoritesSection loading={loading} favorites={favorites} />
        <ProfileAddressSection
          data={profileAddressData}
          state={profileAddressState}
          actions={profileAddressActions}
        />
      </div>
    </div>
  );
}
