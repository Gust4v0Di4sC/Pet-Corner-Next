"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCustomerProfileDataBundle,
  type CustomerAccountProfile,
  registerCustomerPet,
  saveCustomerDeliveryAddress,
  type CustomerDeliveryAddress,
  type CustomerFavorite,
  type CustomerOrder,
  type CustomerPet,
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

export function useCustomerProfileData(options: UseCustomerProfileDataOptions) {
  const isFetchingRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<CustomerAccountProfile | null>(null);
  const [pets, setPets] = useState<CustomerPet[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [favorites, setFavorites] = useState<CustomerFavorite[]>([]);
  const [address, setAddress] = useState<CustomerDeliveryAddress | null>(null);

  const [isCreatingPet, setIsCreatingPet] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const loadData = useCallback(async (config?: { background?: boolean }) => {
    if (isFetchingRef.current) {
      return;
    }

    const isBackground = Boolean(config?.background);
    isFetchingRef.current = true;

    if (!isBackground) {
      setLoading(true);
    }

    try {
      const dataBundle = await getCustomerProfileDataBundle({
        customerId: options.customerId,
        name: options.name,
        email: options.email,
      });

      setProfile(dataBundle.profile);
      setPets(dataBundle.pets);
      setOrders(dataBundle.orders);
      setFavorites(dataBundle.favorites);
      setAddress(dataBundle.address);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(mapErrorMessage(error));
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [options.customerId, options.email, options.name]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadData();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadData]);

  useEffect(() => {
    const refreshData = () => {
      void loadData({ background: true });
    };

    const intervalId = window.setInterval(refreshData, 45000);
    const handleFocus = () => refreshData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshData();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadData]);

  const createPet = useCallback(
    async (input: CreatePetInput) => {
      setErrorMessage(null);
      setIsCreatingPet(true);

      try {
        const createdPet = await registerCustomerPet({
          customerId: options.customerId,
          name: input.name,
          animalType: input.animalType,
          breed: input.breed,
          age: input.age,
          weight: input.weight,
        });

        setPets((currentPets) => [createdPet, ...currentPets]);
        return createdPet;
      } catch (error) {
        setErrorMessage(mapErrorMessage(error));
        throw error;
      } finally {
        setIsCreatingPet(false);
      }
    },
    [options.customerId]
  );

  const saveAddress = useCallback(
    async (input: SaveAddressInput) => {
      setErrorMessage(null);
      setIsSavingAddress(true);

      try {
        const savedAddress = await saveCustomerDeliveryAddress({
          customerId: options.customerId,
          zipCode: input.zipCode,
          street: input.street,
          number: input.number,
          district: input.district,
          city: input.city,
          state: input.state,
          complement: input.complement,
        });

        setAddress(savedAddress);
        return savedAddress;
      } catch (error) {
        setErrorMessage(mapErrorMessage(error));
        throw error;
      } finally {
        setIsSavingAddress(false);
      }
    },
    [options.customerId]
  );

  const setProfileImageUrl = useCallback(
    (profileImageUrl: string) => {
      const normalizedImageUrl = profileImageUrl.trim();
      if (!normalizedImageUrl) {
        return;
      }

      setProfile((currentProfile) => ({
        customerId: currentProfile?.customerId || options.customerId,
        name: currentProfile?.name || options.name?.trim() || "Cliente Pet Corner",
        email: currentProfile?.email || options.email,
        updatedAtIso: new Date().toISOString(),
        profileImageUrl: normalizedImageUrl,
      }));
    },
    [options.customerId, options.email, options.name]
  );

  return {
    loading,
    errorMessage,
    profile,
    pets,
    orders,
    favorites,
    address,
    isCreatingPet,
    isSavingAddress,
    setProfileImageUrl,
    createPet,
    saveAddress,
    reload: loadData,
  };
}
