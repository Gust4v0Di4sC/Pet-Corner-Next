"use client";

import { type ChangeEvent, type SubmitEvent, useState } from "react";
import { INITIAL_PET_FORM } from "@/features/account/components/profile-dashboard.constants";
import type { CustomerPet } from "@/features/account/services/customer-profile.service";
import type { PetFormState } from "@/features/account/types/profile-dashboard";
import {
  resetPetBreedSelection,
  updatePetFormField,
} from "@/features/account/utils/profile-dashboard-forms";
import { MANUAL_BREED_OPTION } from "@/features/account/utils/pet-options";
import {
  createPetProfileSchema,
  type CustomerPetProfileInput,
} from "@/features/account/validation/profile-schemas";
import { getFirstZodErrorMessage } from "@/lib/validation/input-sanitizers";

const petProfileSchema = createPetProfileSchema(MANUAL_BREED_OPTION);

type UseProfilePetFormInput = {
  loading: boolean;
  pets: CustomerPet[];
  isCreatingPet: boolean;
  createPet: (input: CustomerPetProfileInput) => Promise<unknown>;
};

export function useProfilePetForm({
  loading,
  pets,
  isCreatingPet,
  createPet,
}: UseProfilePetFormInput) {
  const [showPetForm, setShowPetForm] = useState(false);
  const [petForm, setPetForm] = useState<PetFormState>(INITIAL_PET_FORM);
  const [petErrorMessage, setPetErrorMessage] = useState<string | null>(null);

  const isPetFormVisible = showPetForm || (!loading && pets.length === 0);

  const handlePetInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setPetForm((currentState) => updatePetFormField(currentState, name, value));
  };

  const resetBreedSelection = () => {
    setPetForm(resetPetBreedSelection);
  };

  const handleCreatePet = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPetErrorMessage(null);

    const parsedInput = petProfileSchema.safeParse(petForm);
    if (!parsedInput.success) {
      setPetErrorMessage(
        getFirstZodErrorMessage(
          parsedInput.error,
          "Preencha nome, tipo do animal, raça, idade e peso para registrar o pet."
        )
      );
      return;
    }

    try {
      await createPet(parsedInput.data);
      setPetForm(INITIAL_PET_FORM);
      setShowPetForm(false);
    } catch {
      setPetErrorMessage("Não foi possível salvar o pet agora. Tente novamente.");
    }
  };

  return {
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
      onCreatePet: (event: SubmitEvent<HTMLFormElement>) => void handleCreatePet(event),
      onResetBreedSelection: resetBreedSelection,
    },
  };
}
