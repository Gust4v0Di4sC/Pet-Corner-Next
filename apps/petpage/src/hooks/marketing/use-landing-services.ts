"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listLandingServices,
  type LandingServiceView,
} from "@/services/marketing/landing-content.service";

function mapErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nao foi possivel carregar os servicos agora.";
}

export function useLandingServices() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [services, setServices] = useState<LandingServiceView[]>([]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const allServices = await listLandingServices();
      setServices(allServices);
    } catch (error) {
      setErrorMessage(mapErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    services,
    reload,
  };
}
