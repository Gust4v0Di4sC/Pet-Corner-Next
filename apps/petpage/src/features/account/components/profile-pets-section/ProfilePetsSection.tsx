"use client";

import { ProfileSectionPanel } from "@/features/account/components/profile-section-panel";
import { PetList } from "@/features/account/components/profile-pets-section/PetList";
import { PetProfileForm } from "@/features/account/components/profile-pets-section/PetProfileForm";
import { PetSectionHeaderAction } from "@/features/account/components/profile-pets-section/PetSectionHeaderAction";
import type { ProfilePetsSectionProps } from "@/features/account/components/profile-pets-section/profile-pets-section.types";

export function ProfilePetsSection({
  data,
  state,
  actions,
}: ProfilePetsSectionProps) {
  return (
    <ProfileSectionPanel
      id="profile-section-pets"
      title="Meus pets"
      headerAction={
        <PetSectionHeaderAction
          isFormVisible={state.isFormVisible}
          onToggleForm={actions.onToggleForm}
        />
      }
    >
      <PetList loading={state.loading} pets={data.pets} />

      {state.isFormVisible ? (
        <PetProfileForm
          petForm={state.petForm}
          petErrorMessage={state.petErrorMessage}
          isCreatingPet={state.isCreatingPet}
          onPetInputChange={actions.onPetInputChange}
          onCreatePet={actions.onCreatePet}
          onResetBreedSelection={actions.onResetBreedSelection}
        />
      ) : null}
    </ProfileSectionPanel>
  );
}
