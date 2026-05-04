import type { ChangeEventHandler, FormEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { PetAnimalTypeField } from "@/features/account/components/profile-pets-section/PetAnimalTypeField";
import { PetBreedField } from "@/features/account/components/profile-pets-section/PetBreedField";
import { PetFormField } from "@/features/account/components/profile-pets-section/PetFormField";
import type { PetFormState } from "@/features/account/types/profile-dashboard";

type PetProfileFormProps = {
  petForm: PetFormState;
  petErrorMessage: string | null;
  isCreatingPet: boolean;
  onPetInputChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  onCreatePet: FormEventHandler<HTMLFormElement>;
  onResetBreedSelection: () => void;
};

export function PetProfileForm({
  petForm,
  petErrorMessage,
  isCreatingPet,
  onPetInputChange,
  onCreatePet,
  onResetBreedSelection,
}: PetProfileFormProps) {
  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    onPetInputChange(event);
  };

  const handleSelectChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    onPetInputChange(event);
  };

  return (
    <form
      className="mt-5 grid gap-3 rounded-2xl border border-slate-700 bg-slate-900/65 p-4 md:grid-cols-2"
      onSubmit={onCreatePet}
    >
      <PetFormField
        id="pet-name"
        name="name"
        label="Nome"
        value={petForm.name}
        onChange={handleInputChange}
        placeholder="Ex: Luna"
      />
      <PetAnimalTypeField value={petForm.animalType} onChange={handleSelectChange} />
      <PetBreedField
        petForm={petForm}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        onResetBreedSelection={onResetBreedSelection}
      />
      <PetFormField
        id="pet-age"
        name="age"
        label="Idade"
        type="number"
        min={1}
        value={petForm.age}
        onChange={handleInputChange}
        placeholder="Ex: 3"
      />
      <PetFormField
        id="pet-weight"
        name="weight"
        label="Peso"
        type="number"
        min={0}
        step="0.1"
        value={petForm.weight}
        onChange={handleInputChange}
        placeholder="Ex: 12,5"
      />

      {petErrorMessage ? (
        <p className="rounded-xl bg-red-950/45 px-3 py-2 text-sm font-medium text-red-200 md:col-span-2">
          {petErrorMessage}
        </p>
      ) : null}

      <div className="md:col-span-2">
        <Button
          type="submit"
          disabled={isCreatingPet}
          className="h-10 w-full rounded-full bg-[#fb8b24] text-base font-semibold text-white hover:bg-[#ef7e14] disabled:opacity-60"
        >
          {isCreatingPet ? "Salvando pet..." : "Cadastrar pet"}
        </Button>
      </div>
    </form>
  );
}
