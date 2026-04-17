import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

import { searchDogByName } from "../../services/dogService";
import type { Dog, RawDogData } from "../../types/dog";
import { normalizeDog } from "../../utils/dogs/dogs.util";

export function useSearchDog(rota = "dogs") {
  const mutation = useMutation<Dog | null, Error, string>({
    mutationFn: async (name) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return null;
      }

      const results = (await searchDogByName(rota, trimmed)) as RawDogData[];
      const firstDog = results[0];
      return firstDog ? normalizeDog(firstDog) : null;
    },
  });

  const searchDog = useCallback(
    async (name: string) => {
      return mutation.mutateAsync(name);
    },
    [mutation]
  );

  return {
    searchDog,
    isSearching: mutation.isPending,
  };
}
