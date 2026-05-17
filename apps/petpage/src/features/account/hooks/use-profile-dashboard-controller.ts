"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  INITIAL_ADDRESS_FORM,
  INITIAL_PET_FORM,
} from "@/features/account/components/profile-dashboard.constants";
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
import {
  createPetProfileSchema,
  customerAddressSchema,
} from "@/features/account/validation/profile-schemas";
import { getFirstZodErrorMessage } from "@/lib/validation/input-sanitizers";
import type { ProfileImageFeedback } from "@/features/account/components/profile-sidebar";

const petProfileSchema = createPetProfileSchema(MANUAL_BREED_OPTION);

type UseProfileDashboardControllerInput = {
  session: ProfileSession;
};

export function useProfileDashboardController({
  session,
}: UseProfileDashboardControllerInput) {
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

  return {
    layout: {
      isSidebarExpanded,
    },
    pageHeader: {
      session,
      errorMessage,
      onOpenSidebar: () => setIsSidebarExpanded(true),
    },
    profileSidebar: {
      user: {
        name: customerName,
        email: session.email,
        profileImageUrl,
      },
      sidebar: {
        isExpanded: isSidebarExpanded,
        activeSection,
        isLoggingOut,
      },
      profileImageUpload: {
        isUploading: isUploadingProfileImage,
        feedbackItems: profileImageFeedbackItems,
      },
      actions: {
        onToggle: () => setIsSidebarExpanded((currentValue) => !currentValue),
        onClose: () => setIsSidebarExpanded(false),
        onSectionSelected: scrollToSection,
        onLogout: () => void handleLogout(),
        onProfileImageSelected: (event: ChangeEvent<HTMLInputElement>) =>
          void handleProfileImageSelected(event),
      },
    },
    profilePets: {
      data: {
        pets,
      },
      state: {
        loading,
        isFormVisible: isPetFormVisible,
        petForm,
        petErrorMessage,
        isCreatingPet,
      },
      actions: {
        onToggleForm: () => setShowPetForm((current) => !current),
        onPetInputChange: handlePetInputChange,
        onCreatePet: (event: FormEvent<HTMLFormElement>) => void handleCreatePet(event),
        onResetBreedSelection: resetBreedSelection,
      },
    },
    profileAddress: {
      data: {
        addressForm,
        address,
      },
      state: {
        addressMessage,
        isAddressMessageError,
        isSavingAddress,
      },
      actions: {
        onAddressInputChange: handleAddressInputChange,
        onAddressSubmit: (event: FormEvent<HTMLFormElement>) => void handleAddressSubmit(event),
      },
    },
    relatedData: {
      loading,
      appointments,
      orders,
      favorites,
    },
  };
}
