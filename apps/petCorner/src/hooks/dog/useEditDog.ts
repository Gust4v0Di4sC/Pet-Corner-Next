import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateDog } from "../../services/dogService";
import type { Dog } from "../../types/dog";
import { dogKeys } from "../../utils/dogs/dogs.util";

export function useEditDog(rota = "dogs") {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, { id: string; data: Omit<Dog, "id"> }>({
    mutationFn: ({ id, data }) => updateDog(rota, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dogKeys(rota) });
    },
  });

  const editDog = useCallback(
    async (id: string, data: Omit<Dog, "id">) => {
      await mutation.mutateAsync({ id, data });
    },
    [mutation]
  );

  return {
    editDog,
    isEditing: mutation.isPending,
  };
}
