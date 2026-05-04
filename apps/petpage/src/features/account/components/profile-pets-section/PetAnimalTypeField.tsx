import type { ChangeEventHandler } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { darkInputClassName, darkLabelClassName } from "@/features/account/components/profile-form-styles";
import { ANIMAL_TYPE_OPTIONS } from "@/features/account/utils/pet-options";

type PetAnimalTypeFieldProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
};

export function PetAnimalTypeField({ value, onChange }: PetAnimalTypeFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor="pet-animalType" className={darkLabelClassName}>
        Tipo do animal
      </Label>
      <Select
        id="pet-animalType"
        name="animalType"
        value={value}
        onChange={onChange}
        className={darkInputClassName}
      >
        {ANIMAL_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
