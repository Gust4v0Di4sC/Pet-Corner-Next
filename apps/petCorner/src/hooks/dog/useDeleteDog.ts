import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteDog } from "../../services/dogService";
import { dogKeys } from "../../utils/dogs/dogs.util";

export function useDeleteDog(rota = "dogs") {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteDog(rota, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dogKeys(rota) });
    },
  });

  const removeDog = useCallback(
    async (id: string) => {
      await mutation.mutateAsync(id);
    },
    [mutation]
  );

  return {
    removeDog,
    isDeleting: mutation.isPending,
  };
}
