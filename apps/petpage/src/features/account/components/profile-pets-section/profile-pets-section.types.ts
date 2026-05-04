import type { ChangeEventHandler, FormEventHandler } from "react";
import type { CustomerPet } from "@/features/account/services/customer-profile.service";
import type { PetFormState } from "@/features/account/types/profile-dashboard";

export type ProfilePetsSectionData = {
  pets: CustomerPet[];
};

export type ProfilePetsSectionState = {
  loading: boolean;
  isFormVisible: boolean;
  petForm: PetFormState;
  petErrorMessage: string | null;
  isCreatingPet: boolean;
};

export type ProfilePetsSectionActions = {
  onToggleForm: () => void;
  onPetInputChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  onCreatePet: FormEventHandler<HTMLFormElement>;
  onResetBreedSelection: () => void;
};

export type ProfilePetsSectionProps = {
  data: ProfilePetsSectionData;
  state: ProfilePetsSectionState;
  actions: ProfilePetsSectionActions;
};
