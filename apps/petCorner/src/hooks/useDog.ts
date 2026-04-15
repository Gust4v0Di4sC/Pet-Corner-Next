// hooks/useDog.ts
import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDog,
  deleteDog,
  getAllDogs,
  searchDogByName,
  updateDog,
} from "../services/dogService";
import type { Dog , RawDogData, UseDogReturn } from "../types/dog";
import { normalizeDog,dogKeys } from "../utils/dogs/dogs.util";



export const useDog = (rota: string = "dogs"): UseDogReturn => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Dog | null>(null);

  const {
    data: dogs = [],
    refetch,
    isFetching,
  } = useQuery<Dog[]>({
    queryKey: dogKeys(rota),
    queryFn: async () => {
      const data = await getAllDogs(rota);
      return (data as RawDogData[]).map(normalizeDog);
    },
  });

  const fetchAll = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const createMutation = useMutation<Dog, Error, Omit<Dog, "id">>({
    mutationFn: async (data) => {
      const created = await addDog(rota, data);
      return normalizeDog(created as RawDogData);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Dog[]>(dogKeys(rota), (prev = []) => [
        ...prev,
        created,
      ]);
    },
  });

  const updateMutation = useMutation<void, Error, { id: string; data: Omit<Dog, "id"> }>({
    mutationFn: ({ id, data }) => updateDog(rota, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dogKeys(rota) });
    },
  });

  const removeMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDog(rota, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dogKeys(rota) });
      setSelected(null);
    },
  });

  const searchMutation = useMutation<Dog | null, Error, string>({
    mutationFn: async (name) => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      const res = await searchDogByName(rota, trimmed);
      const first = res[0];
      return first ? normalizeDog(first as RawDogData) : null;
    },
    onSuccess: (dog) => {
      setSelected(dog);
    },
  });

  // ✅ mesma assinatura do seu useClient (Promise<void>)
  const create = useCallback(async (data: Omit<Dog, "id">) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const update = useCallback(async (id: string, data: Omit<Dog, "id">) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const remove = useCallback(async (id: string) => {
    await removeMutation.mutateAsync(id);
  }, [removeMutation]);

  const searchByName = useCallback(async (name: string) => {
    await searchMutation.mutateAsync(name);
  }, [searchMutation]);

  return {
    items: dogs,
    selected,
    setSelected,
    fetchAll,
    create,
    update,
    remove,
    searchByName,
    isLoading: isFetching,
  };
};
