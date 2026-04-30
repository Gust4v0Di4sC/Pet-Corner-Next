"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listLandingServices,
  type LandingServiceView,
} from "@/features/marketing/services/landing-content.service";

function mapErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nao foi possivel carregar os servicos agora.";
}

export function useLandingServices() {
  const {
    isLoading,
    error,
    data,
    refetch,
  } = useQuery({
    queryKey: ["landing", "services"],
    queryFn: async () => listLandingServices(),
    staleTime: 45_000,
  });

  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const services: LandingServiceView[] = data || [];
  const errorMessage = error ? mapErrorMessage(error) : null;

  return {
    isLoading,
    errorMessage,
    services,
    reload,
  };
}
