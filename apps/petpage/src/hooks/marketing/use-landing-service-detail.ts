"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [service, setService] = useState<LandingServiceView | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setNotFound(false);

    if (!normalizedServiceId) {
      setService(null);
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    try {
      const serviceData = await getLandingServiceById(normalizedServiceId);
      setService(serviceData);
      setNotFound(!serviceData);
    } catch (error) {
      setService(null);
      setErrorMessage(mapErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [normalizedServiceId]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void reload();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [reload]);

  return {
    isLoading,
    errorMessage,
    notFound,
    service,
    reload,
  };
}
