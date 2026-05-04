import type { ChangeEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { darkInputClassName, darkLabelClassName } from "@/features/account/components/profile-form-styles";
import {
  getBreedOptionsForAnimalType,
  MANUAL_BREED_OPTION,
} from "@/features/account/utils/pet-options";
import type { PetFormState } from "@/features/account/types/profile-dashboard";

type PetBreedFieldProps = {
  petForm: PetFormState;
  onInputChange: ChangeEventHandler<HTMLInputElement>;
  onSelectChange: ChangeEventHandler<HTMLSelectElement>;
  onResetBreedSelection: () => void;
};

export function PetBreedField({
  petForm,
  onInputChange,
  onSelectChange,
  onResetBreedSelection,
}: PetBreedFieldProps) {
  const isManualBreed = petForm.breedSelection === MANUAL_BREED_OPTION;

  return (
    <div className="space-y-1">
      <Label
        htmlFor={isManualBreed ? "pet-breed" : "pet-breedSelection"}
        className={darkLabelClassName}
      >
        Raca
      </Label>

      {isManualBreed ? (
        <div className="space-y-2">
          <Input
            id="pet-breed"
            name="breed"
            value={petForm.breed}
            onChange={onInputChange}
            className={darkInputClassName}
            placeholder="Digite a raca manualmente"
          />
          <Button
            type="button"
            onClick={onResetBreedSelection}
            className="text-xs font-semibold text-[#fb8b24] transition hover:text-[#ef7e14]"
          >
            Voltar para lista de racas
          </Button>
        </div>
      ) : (
        <Select
          id="pet-breedSelection"
          name="breedSelection"
          value={petForm.breedSelection}
          onChange={onSelectChange}
          className={darkInputClassName}
          disabled={!petForm.animalType}
        >
          <option value="">Selecione a raca mais comum</option>
          {getBreedOptionsForAnimalType(petForm.animalType).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
