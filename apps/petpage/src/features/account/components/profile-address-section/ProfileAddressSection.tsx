"use client";

import { MapPinPlus, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddressForm } from "@/features/account/components/profile-address-section/AddressForm";
import { AddressSummary } from "@/features/account/components/profile-address-section/AddressSummary";
import type { ProfileAddressSectionProps } from "@/features/account/components/profile-address-section/profile-address-section.types";
import { ProfileSectionPanel } from "@/features/account/components/profile-section-panel";

export function ProfileAddressSection({
  data,
  state,
  actions,
}: ProfileAddressSectionProps) {
  const hasAddress = Boolean(data.address);
  const HeaderIcon = hasAddress ? PencilLine : MapPinPlus;

  return (
    <ProfileSectionPanel
      id="profile-section-address"
      title="Endereço de entrega"
      headerAction={
        <Button
          type="button"
          onClick={actions.onToggleAddressForm}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-lg font-semibold text-[#fb8b24] transition hover:bg-[#fb8b24]/10"
        >
          <HeaderIcon className="h-4 w-4" />
          {hasAddress ? "Editar endereço" : "Adicionar endereço"}
        </Button>
      }
    >
      <AddressSummary
        address={data.address}
        addressMessage={state.addressMessage}
        isAddressMessageError={state.isAddressMessageError}
      />

      <Dialog open={state.isAddressFormOpen} onOpenChange={actions.onAddressFormOpenChange}>
        <DialogContent className="relative max-h-[min(760px,calc(100dvh-2rem))] overflow-y-auto rounded-3xl border border-slate-700 bg-[#0f1722] p-5 text-slate-100 shadow-[0_28px_70px_-30px_rgba(15,23,42,0.95)] sm:p-6">
          <DialogHeader className="pr-10">
            <DialogTitle className="text-3xl font-semibold text-slate-100">
              {hasAddress ? "Editar endereço" : "Adicionar endereço"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-300">
              Informe o endereço usado para entregas dos seus pedidos.
            </DialogDescription>
          </DialogHeader>

          <AddressForm
            addressForm={data.addressForm}
            isSavingAddress={state.isSavingAddress}
            className="mt-5 grid gap-3 sm:grid-cols-2"
            onAddressInputChange={actions.onAddressInputChange}
            onAddressSubmit={actions.onAddressSubmit}
          />
        </DialogContent>
      </Dialog>
    </ProfileSectionPanel>
  );
}
