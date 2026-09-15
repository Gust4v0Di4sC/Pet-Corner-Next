"use client";

import { type ChangeEvent, type SubmitEvent, useMemo, useRef, useState } from "react";
import { INITIAL_ADDRESS_FORM } from "@/features/account/components/profile-dashboard.constants";
import type { CustomerDeliveryAddress } from "@/features/account/services/customer-profile.service";
import type { AddressFormState } from "@/features/account/types/profile-dashboard";
import {
  normalizeAddressFormValue,
  toAddressFormState,
} from "@/features/account/utils/profile-dashboard-forms";
import {
  customerAddressSchema,
  type CustomerAddressInput,
} from "@/features/account/validation/profile-schemas";
import { getFirstZodErrorMessage } from "@/lib/validation/input-sanitizers";
import { findAddressByZipCode } from "@/lib/address/viacep";

type UseProfileAddressFormInput = {
  address: CustomerDeliveryAddress | null;
  isSavingAddress: boolean;
  saveAddress: (input: CustomerAddressInput) => Promise<unknown>;
};

export function useProfileAddressForm({
  address,
  isSavingAddress,
  saveAddress,
}: UseProfileAddressFormInput) {
  const zipCodeRequestRef = useRef(0);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [addressFormDraft, setAddressFormDraft] = useState<AddressFormState | null>(null);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [isAddressMessageError, setIsAddressMessageError] = useState(false);

  const addressForm = useMemo<AddressFormState>(() => {
    if (addressFormDraft) {
      return addressFormDraft;
    }

    return toAddressFormState(address, INITIAL_ADDRESS_FORM);
  }, [address, addressFormDraft]);

  const handleAddressInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const nextValue = normalizeAddressFormValue(name, value);

    setAddressFormDraft((currentState) => ({
      ...(currentState || addressForm),
      [name]: nextValue,
    }));

    if (name !== "zipCode") {
      return;
    }

    const requestId = ++zipCodeRequestRef.current;
    if (nextValue.replace(/\D/g, "").length !== 8) {
      return;
    }

    void findAddressByZipCode(nextValue).then((foundAddress) => {
      if (!foundAddress || requestId !== zipCodeRequestRef.current) {
        return;
      }

      setAddressFormDraft((currentState) => {
        const currentAddress = currentState || addressForm;
        return {
          ...currentAddress,
          zipCode: foundAddress.zipCode || currentAddress.zipCode,
          street: foundAddress.street || currentAddress.street,
          district: foundAddress.district || currentAddress.district,
          city: foundAddress.city || currentAddress.city,
          state: foundAddress.state || currentAddress.state,
          complement: currentAddress.complement || foundAddress.complement,
        };
      });
    });
  };

  const handleAddressSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddressMessage(null);
    setIsAddressMessageError(false);

    const parsedInput = customerAddressSchema.safeParse(addressForm);
    if (!parsedInput.success) {
      setIsAddressMessageError(true);
      setAddressMessage(
        getFirstZodErrorMessage(
          parsedInput.error,
          "Não foi possível validar os dados do endereço."
        )
      );
      return;
    }

    try {
      await saveAddress(parsedInput.data);
      setAddressFormDraft(null);
      setIsAddressMessageError(false);
      setIsAddressFormOpen(false);
      setAddressMessage("Endereço salvo com sucesso.");
    } catch {
      setIsAddressMessageError(true);
      setAddressMessage("Não foi possível salvar o endereço agora.");
    }
  };

  return {
    data: {
      addressForm,
      address,
    },
    state: {
      isAddressFormOpen,
      addressMessage,
      isAddressMessageError,
      isSavingAddress,
    },
    actions: {
      onToggleAddressForm: () => setIsAddressFormOpen((currentValue) => !currentValue),
      onAddressFormOpenChange: setIsAddressFormOpen,
      onAddressInputChange: handleAddressInputChange,
      onAddressSubmit: (event: SubmitEvent<HTMLFormElement>) => void handleAddressSubmit(event),
    },
  };
}
