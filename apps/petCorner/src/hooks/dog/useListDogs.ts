import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { getAllDogs } from "../../services/dogService";
import type { Dog, RawDogData } from "../../types/dog";
import { dogKeys, normalizeDog } from "../../utils/dogs/dogs.util";

export function useListDogs(rota = "dogs") {
  const { data: dogs = [], refetch, isFetching } = useQuery<Dog[]>({
    queryKey: dogKeys(rota),
    queryFn: async () => {
      const data = (await getAllDogs(rota)) as RawDogData[];
      return data.map(normalizeDog);
    },
  });

  const fetchAllDogs = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    dogs,
    fetchAllDogs,
    isLoading: isFetching,
  };
}
