import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { getAllServices } from "../../services/petService";
import type { PetService, RawPetServiceData } from "../../types/petService";
import { normalizePetService, serviceKeys } from "../../utils/service/service.util";

export function useListServices(rota = "services") {
  const { data: services = [], refetch, isFetching } = useQuery<PetService[]>({
    queryKey: serviceKeys(rota),
    queryFn: async () => {
      const data = (await getAllServices(rota)) as RawPetServiceData[];
      return data.map(normalizePetService);
    },
  });

  const fetchAllServices = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    services,
    fetchAllServices,
    isLoading: isFetching,
  };
}
