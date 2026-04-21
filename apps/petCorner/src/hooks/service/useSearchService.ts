import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

import { searchServiceByName } from "../../services/petService";
import type { PetService, RawPetServiceData } from "../../types/petService";
import { normalizePetService } from "../../utils/service/service.util";

export function useSearchService(rota = "services") {
  const mutation = useMutation<PetService | null, Error, string>({
    mutationFn: async (name) => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return null;
      }

      const results = (await searchServiceByName(rota, trimmedName)) as RawPetServiceData[];
      const firstService = results[0];
      return firstService ? normalizePetService(firstService) : null;
    },
  });

  const searchService = useCallback(
    async (name: string) => {
      return mutation.mutateAsync(name);
    },
    [mutation]
  );

  return {
    searchService,
    isSearching: mutation.isPending,
  };
}
