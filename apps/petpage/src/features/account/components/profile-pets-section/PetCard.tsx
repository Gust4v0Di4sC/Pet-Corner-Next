import { PawPrint } from "lucide-react";
import type { CustomerPet } from "@/features/account/services/customer-profile.service";
import {
  toDisplayDate,
  toDisplayPetWeight,
} from "@/features/account/utils/profile-dashboard-formatters";

type PetCardProps = {
  pet: CustomerPet;
};

export function PetCard({ pet }: PetCardProps) {
  return (
    <li className="flex items-center gap-4 rounded-[1.8rem] border border-[#6a3909] bg-[#4e2c09]/90 px-5 py-4">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#66360a] text-[#fb8b24]">
        <PawPrint className="h-7 w-7" />
      </span>
      <div>
        <p className="text-3xl font-semibold text-white">{pet.name}</p>
        <p className="text-lg text-amber-100/90">
          {pet.animalType} | {pet.breed}
        </p>
        <p className="text-sm text-amber-200/80">
          {pet.age} anos | {toDisplayPetWeight(pet.weight)} kg | Registrado em{" "}
          {toDisplayDate(pet.createdAtIso)}
        </p>
      </div>
    </li>
  );
}
