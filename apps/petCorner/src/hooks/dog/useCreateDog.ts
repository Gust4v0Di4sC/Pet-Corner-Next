import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { addDog } from "../../services/dogService";
import type { Dog, RawDogData } from "../../types/dog";
import { dogKeys, normalizeDog } from "../../utils/dogs/dogs.util";

export function useCreateDog(rota = "dogs") {
  const queryClient = useQueryClient();

  const mutation = useMutation<Dog, Error, Omit<Dog, "id">>({
    mutationFn: async (data) => {
      const created = (await addDog(rota, data)) as RawDogData;
      return normalizeDog(created);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Dog[]>(dogKeys(rota), (previous = []) => [...previous, created]);
    },
  });

  const createDog = useCallback(
    async (data: Omit<Dog, "id">) => {
      await mutation.mutateAsync(data);
    },
    [mutation]
  );

  return {
    createDog,
    isCreating: mutation.isPending,
  };
}
