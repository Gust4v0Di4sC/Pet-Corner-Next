import { ProfileEmptyState, ProfileSectionPanel } from "@/features/account/components/profile-section-panel";
import type { CustomerFavorite } from "@/features/account/services/customer-profile.service";

type ProfileFavoritesSectionProps = {
  loading: boolean;
  favorites: CustomerFavorite[];
};

export function ProfileFavoritesSection({
  loading,
  favorites,
}: ProfileFavoritesSectionProps) {
  return (
    <ProfileSectionPanel id="profile-section-favorites" title="Favoritos">
      {loading ? (
        <p className="text-lg text-slate-300">Carregando favoritos...</p>
      ) : favorites.length === 0 ? (
        <ProfileEmptyState>Nenhum item favorito encontrado para esta conta.</ProfileEmptyState>
      ) : (
        <ul className="space-y-3">
          {favorites.map((favorite) => (
            <FavoriteCard key={favorite.id} favorite={favorite} />
          ))}
        </ul>
      )}
    </ProfileSectionPanel>
  );
}

function FavoriteCard({ favorite }: { favorite: CustomerFavorite }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-[#111b2b] px-4 py-3">
      <div>
        <p className="text-2xl font-semibold text-slate-100">{favorite.name}</p>
        <p className="text-lg text-slate-400">{favorite.category}</p>
      </div>
      <span className="text-2xl font-semibold text-amber-200">{favorite.priceLabel}</span>
    </li>
  );
}
