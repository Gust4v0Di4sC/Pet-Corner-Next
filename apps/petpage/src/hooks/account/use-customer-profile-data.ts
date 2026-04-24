"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCustomerProfileDataBundle,
  type CustomerAccountProfile,
  type CustomerDeliveryAddress,
  type CustomerFavorite,
  type CustomerOrder,
  type CustomerPet,
  type CustomerProfileDataBundle,
  registerCustomerPet,
  saveCustomerDeliveryAddress,
} from "@/services/account/customer-profile.service";

type UseCustomerProfileDataOptions = {
  customerId: string;
  name?: string;
  email: string;
};

type CreatePetInput = {
  name: string;
  animalType: string;
  breed: string;
  age: number;
  weight: number;
};

type SaveAddressInput = {
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement: string;
};

function mapErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const code = (error as { code?: unknown }).code;
    if (code === "permission-denied") {
      return "Sua sessao de autenticacao expirou. Entre novamente para continuar.";
    }
  }

  if (error instanceof Error && error.message) {
    if (error.message.toLowerCase().includes("missing or insufficient permissions")) {
      return "Sua sessao de autenticacao expirou. Entre novamente para continuar.";
    }
    return error.message;
  }

  return "Nao foi possivel concluir a operacao agora.";
}

function createEmptyProfileDataBundle(): CustomerProfileDataBundle {
  return {
    profile: null,
    pets: [],
    orders: [],
    favorites: [],
    address: null,
  };
}

export function useCustomerProfileData(options: UseCustomerProfileDataOptions) {
  const queryClient = useQueryClient();
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);
  const normalizedCustomerId = options.customerId.trim();
  const normalizedName = options.name?.trim() || "";
  const normalizedEmail = options.email.trim();
  const hasValidCustomerId = Boolean(normalizedCustomerId);

  const profileQueryKey = useMemo(
    () =>
      [
        "customer-profile",
        "bundle",
        normalizedCustomerId,
        normalizedName,
        normalizedEmail,
      ] as const,
    [normalizedCustomerId, normalizedEmail, normalizedName]
  );

  const {
    data,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: profileQueryKey,
    enabled: hasValidCustomerId,
    refetchInterval: hasValidCustomerId ? 45_000 : false,
    refetchOnWindowFocus: true,
    queryFn: async () =>
      getCustomerProfileDataBundle({
        customerId: normalizedCustomerId,
        name: normalizedName || undefined,
        email: normalizedEmail,
      }),
  });

  const createPetMutation = useMutation({
    mutationFn: async (input: CreatePetInput) =>
      registerCustomerPet({
        customerId: normalizedCustomerId,
        name: input.name,
        animalType: input.animalType,
        breed: input.breed,
        age: input.age,
        weight: input.weight,
      }),
    onSuccess: (createdPet) => {
      setMutationErrorMessage(null);
      queryClient.setQueryData<CustomerProfileDataBundle>(
        profileQueryKey,
        (currentData) => {
          const safeCurrentData = currentData || createEmptyProfileDataBundle();
          return {
            ...safeCurrentData,
            pets: [
              createdPet,
              ...safeCurrentData.pets.filter((pet) => pet.id !== createdPet.id),
            ],
          };
        }
      );
    },
    onError: (mutationError) => {
      setMutationErrorMessage(mapErrorMessage(mutationError));
    },
  });

  const saveAddressMutation = useMutation({
    mutationFn: async (input: SaveAddressInput) =>
      saveCustomerDeliveryAddress({
        customerId: normalizedCustomerId,
        zipCode: input.zipCode,
        street: input.street,
        number: input.number,
        district: input.district,
        city: input.city,
        state: input.state,
        complement: input.complement,
      }),
    onSuccess: (savedAddress) => {
      setMutationErrorMessage(null);
      queryClient.setQueryData<CustomerProfileDataBundle>(
        profileQueryKey,
        (currentData) => {
          const safeCurrentData = currentData || createEmptyProfileDataBundle();
          return {
            ...safeCurrentData,
            address: savedAddress,
          };
        }
      );
    },
    onError: (mutationError) => {
      setMutationErrorMessage(mapErrorMessage(mutationError));
    },
  });

  const reload = useCallback(async () => {
    if (!hasValidCustomerId) {
      return;
    }

    await refetch();
  }, [hasValidCustomerId, refetch]);

  const createPet = useCallback(
    async (input: CreatePetInput) => {
      setMutationErrorMessage(null);
      return createPetMutation.mutateAsync(input);
    },
    [createPetMutation]
  );

  const saveAddress = useCallback(
    async (input: SaveAddressInput) => {
      setMutationErrorMessage(null);
      return saveAddressMutation.mutateAsync(input);
    },
    [saveAddressMutation]
  );

  const setProfileImageUrl = useCallback(
    (profileImageUrl: string) => {
      const normalizedImageUrl = profileImageUrl.trim();
      if (!normalizedImageUrl) {
        return;
      }

      queryClient.setQueryData<CustomerProfileDataBundle>(
        profileQueryKey,
        (currentData) => {
          const safeCurrentData = currentData || createEmptyProfileDataBundle();
          const currentProfile = safeCurrentData.profile;

          return {
            ...safeCurrentData,
            profile: {
              customerId: currentProfile?.customerId || normalizedCustomerId,
              name: currentProfile?.name || normalizedName || "Cliente Pet Corner",
              email: currentProfile?.email || normalizedEmail,
              updatedAtIso: new Date().toISOString(),
              profileImageUrl: normalizedImageUrl,
            },
          };
        }
      );
    },
    [normalizedCustomerId, normalizedEmail, normalizedName, profileQueryKey, queryClient]
  );

  const safeData = data || createEmptyProfileDataBundle();
  const queryErrorMessage = error ? mapErrorMessage(error) : null;
  const errorMessage = mutationErrorMessage || queryErrorMessage;

  return {
    loading: hasValidCustomerId ? isLoading : false,
    errorMessage,
    profile: safeData.profile as CustomerAccountProfile | null,
    pets: safeData.pets as CustomerPet[],
    orders: safeData.orders as CustomerOrder[],
    favorites: safeData.favorites as CustomerFavorite[],
    address: safeData.address as CustomerDeliveryAddress | null,
    isCreatingPet: createPetMutation.isPending,
    isSavingAddress: saveAddressMutation.isPending,
    setProfileImageUrl,
    createPet,
    saveAddress,
    reload,
  };
}

