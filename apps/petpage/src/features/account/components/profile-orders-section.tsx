import { ProfileEmptyState, ProfileSectionPanel } from "@/features/account/components/profile-section-panel";
import { toDisplayDate } from "@/features/account/utils/profile-dashboard-formatters";
import type { CustomerOrder } from "@/features/account/services/customer-profile.service";

type ProfileOrdersSectionProps = {
  loading: boolean;
  orders: CustomerOrder[];
};

export function ProfileOrdersSection({ loading, orders }: ProfileOrdersSectionProps) {
  return (
    <ProfileSectionPanel id="profile-section-orders" title="Pedidos recentes">
      {loading ? (
        <p className="text-lg text-slate-300">Carregando pedidos...</p>
      ) : orders.length === 0 ? (
        <ProfileEmptyState>Nenhum pedido encontrado para esta conta.</ProfileEmptyState>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ul>
      )}
    </ProfileSectionPanel>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  return (
    <li className="grid gap-3 rounded-2xl border border-slate-700 bg-[#111b2b] px-4 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
      <div>
        <p className="text-4xl font-semibold text-slate-100">{order.label}</p>
        <p className="text-lg text-slate-400">{toDisplayDate(order.dateIso)}</p>
      </div>
      <span className="inline-flex rounded-full bg-emerald-500/20 px-4 py-1.5 text-lg font-semibold text-emerald-300">
        {order.status}
      </span>
      <span className="text-right text-4xl font-semibold text-slate-100">
        {order.totalLabel}
      </span>
    </li>
  );
}
