import type { AddressFormState, PetFormState } from "@/features/account/types/profile-dashboard";
import { MANUAL_BREED_OPTION } from "@/features/account/utils/pet-options";
import type { CustomerDeliveryAddress } from "@/features/account/services/customer-profile.service";
import {
  applyZipCodeMask,
  normalizeStateCode,
} from "@/lib/validation/input-sanitizers";

export function toAddressFormState(
  address: CustomerDeliveryAddress | null,
  fallback: AddressFormState
): AddressFormState {
  if (!address) {
    return fallback;
  }

  return {
    zipCode: address.zipCode,
    street: address.street,
    number: address.number,
    district: address.district,
    city: address.city,
    state: address.state,
    complement: address.complement,
  };
}

export function normalizeAddressFormValue(name: string, value: string): string {
  if (name === "zipCode") {
    return applyZipCodeMask(value);
  }

  if (name === "state") {
    return normalizeStateCode(value);
  }

  return value;
}

export function updatePetFormField(
  currentState: PetFormState,
  name: string,
  value: string
): PetFormState {
  if (name === "animalType" && currentState.animalType !== value) {
    return {
      ...currentState,
      animalType: value,
      breed: "",
      breedSelection: "",
    };
  }

  if (name === "breedSelection") {
    return {
      ...currentState,
      breedSelection: value,
      breed: value === MANUAL_BREED_OPTION ? "" : value,
    };
  }

  return {
    ...currentState,
    [name]: value,
  };
}

export function resetPetBreedSelection(currentState: PetFormState): PetFormState {
  return {
    ...currentState,
    breed: "",
    breedSelection: "",
  };
}
