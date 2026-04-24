"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getLandingServiceById,
  type LandingServiceView,
} from "@/services/marketing/landing-content.service";

function mapErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nao foi possivel carregar os detalhes do servico.";
}

type UseLandingServiceDetailOptions = {
  serviceId: string;
};

export function useLandingServiceDetail(options: UseLandingServiceDetailOptions) {
  const normalizedServiceId = useMemo(() => options.serviceId.trim(), [options.serviceId]);
  const hasValidServiceId = Boolean(normalizedServiceId);

  const {
    isLoading,
    error,
    data,
    refetch,
  } = useQuery({
    queryKey: ["landing", "service-detail", normalizedServiceId],
    queryFn: async () => getLandingServiceById(normalizedServiceId),
    enabled: hasValidServiceId,
    staleTime: 45_000,
  });

  const reload = useCallback(async () => {
    if (!hasValidServiceId) {
      return;
    }

    await refetch();
  }, [hasValidServiceId, refetch]);

  const service: LandingServiceView | null = data || null;
  const errorMessage = error ? mapErrorMessage(error) : null;
  const notFound = !hasValidServiceId || (!isLoading && !errorMessage && !service);

  return {
    isLoading,
    errorMessage,
    notFound,
    service,
    reload,
  };
}
