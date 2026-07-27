"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getLandingServiceById,
  type LandingServiceView,
} from "@/features/marketing/services/landing-content.service";
import { getUserErrorMessage } from "@/lib/errors/user-error-messages";

function mapErrorMessage(error: unknown): string {
  return getUserErrorMessage(error, "Nao foi possivel carregar os detalhes do servico agora.");
}

type UseLandingServiceDetailOptions = {
  serviceId: string;
  initialService?: LandingServiceView | null;
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
    initialData: options.initialService,
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
