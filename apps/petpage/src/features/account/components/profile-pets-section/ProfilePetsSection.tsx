"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
          onToggleForm={actions.onToggleForm}
        />
      }
    >
      <PetList loading={state.loading} pets={data.pets} />

      <Dialog open={state.isFormVisible} onOpenChange={actions.onFormOpenChange}>
        <DialogContent className="relative max-h-[min(720px,calc(100dvh-2rem))] overflow-y-auto rounded-3xl border border-slate-700 bg-[#0f1722] p-5 text-slate-100 shadow-[0_28px_70px_-30px_rgba(15,23,42,0.95)] sm:p-6">
          <DialogHeader className="pr-10">
            <DialogTitle className="text-3xl font-semibold text-slate-100">
              Cadastrar pet
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-300">
              Preencha os dados do pet para adicionar ao seu perfil.
            </DialogDescription>
          </DialogHeader>

          <PetProfileForm
            petForm={state.petForm}
            petErrorMessage={state.petErrorMessage}
            isCreatingPet={state.isCreatingPet}
            className="mt-5 grid gap-3 md:grid-cols-2"
            onPetInputChange={actions.onPetInputChange}
            onCreatePet={actions.onCreatePet}
            onResetBreedSelection={actions.onResetBreedSelection}
          />
        </DialogContent>
      </Dialog>
    </ProfileSectionPanel>
  );
}
