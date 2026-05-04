import type { ChangeEventHandler, FormEventHandler } from "react";
import type { CustomerDeliveryAddress } from "@/features/account/services/customer-profile.service";
import type { AddressFormState } from "@/features/account/types/profile-dashboard";

export type ProfileAddressSectionData = {
  addressForm: AddressFormState;
  address: CustomerDeliveryAddress | null;
};

export type ProfileAddressSectionState = {
  addressMessage: string | null;
  isAddressMessageError: boolean;
  isSavingAddress: boolean;
};

export type ProfileAddressSectionActions = {
  onAddressInputChange: ChangeEventHandler<HTMLInputElement>;
  onAddressSubmit: FormEventHandler<HTMLFormElement>;
};

export type ProfileAddressSectionProps = {
  data: ProfileAddressSectionData;
  state: ProfileAddressSectionState;
  actions: ProfileAddressSectionActions;
};
