import type { CustomerDeliveryAddress } from "@/features/account/services/customer-profile.service";
import { AddressFeedbackMessage } from "@/features/account/components/profile-address-section/AddressFeedbackMessage";
import { AddressSummaryRow } from "@/features/account/components/profile-address-section/AddressSummaryRow";
import { toDisplayDate } from "@/features/account/utils/profile-dashboard-formatters";

type AddressSummaryProps = {
  address: CustomerDeliveryAddress | null;
  addressMessage: string | null;
  isAddressMessageError: boolean;
};

export function AddressSummary({
  address,
  addressMessage,
  isAddressMessageError,
}: AddressSummaryProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-700 bg-[#111b2b] p-4 text-lg text-slate-300">
      <AddressSummaryRow label="CEP" value={address?.zipCode} />
      <AddressSummaryRow label="Rua" value={address?.street} />
      <AddressSummaryRow label="Numero" value={address?.number} />
      <AddressSummaryRow label="Bairro" value={address?.district} />
      <AddressSummaryRow
        label="Cidade/UF"
        value={[address?.city, address?.state].filter(Boolean).join(" / ") || undefined}
      />
      <AddressSummaryRow label="Complemento" value={address?.complement} />
      <AddressSummaryRow
        label="Atualizado em"
        value={address ? toDisplayDate(address.updatedAtIso) : undefined}
      />
      <AddressFeedbackMessage message={addressMessage} isError={isAddressMessageError} />
    </div>
  );
}
