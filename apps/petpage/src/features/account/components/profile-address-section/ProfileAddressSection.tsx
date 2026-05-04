"use client";

import { AddressForm } from "@/features/account/components/profile-address-section/AddressForm";
import { AddressSummary } from "@/features/account/components/profile-address-section/AddressSummary";
import type { ProfileAddressSectionProps } from "@/features/account/components/profile-address-section/profile-address-section.types";
import { ProfileSectionPanel } from "@/features/account/components/profile-section-panel";

export function ProfileAddressSection({
  data,
  state,
  actions,
}: ProfileAddressSectionProps) {
  return (
    <ProfileSectionPanel id="profile-section-address" title="Endereco de entrega">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <AddressForm
          addressForm={data.addressForm}
          isSavingAddress={state.isSavingAddress}
          onAddressInputChange={actions.onAddressInputChange}
          onAddressSubmit={actions.onAddressSubmit}
        />
        <AddressSummary
          address={data.address}
          addressMessage={state.addressMessage}
          isAddressMessageError={state.isAddressMessageError}
        />
      </div>
    </ProfileSectionPanel>
  );
}
