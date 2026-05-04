import type { CustomerPet } from "@/features/account/services/customer-profile.service";
import { ProfileEmptyState } from "@/features/account/components/profile-section-panel";
import { PetCard } from "@/features/account/components/profile-pets-section/PetCard";

type PetListProps = {
  loading: boolean;
  pets: CustomerPet[];
};

export function PetList({ loading, pets }: PetListProps) {
  if (loading) {
    return <p className="text-lg text-slate-300">Carregando pets...</p>;
  }

  if (pets.length === 0) {
    return <ProfileEmptyState>Nenhum pet cadastrado nesta conta.</ProfileEmptyState>;
  }

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}
    </ul>
  );
}
