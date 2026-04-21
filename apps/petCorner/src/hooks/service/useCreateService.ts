import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { addService } from "../../services/petService";
import type { PetService, RawPetServiceData } from "../../types/petService";
import { normalizePetService, serviceKeys } from "../../utils/service/service.util";

export function useCreateService(rota = "services") {
  const queryClient = useQueryClient();

  const mutation = useMutation<PetService, Error, Omit<PetService, "id">>({
    mutationFn: async (data) => {
      const created = (await addService(rota, data)) as RawPetServiceData;
      return normalizePetService(created);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<PetService[]>(serviceKeys(rota), (previous = []) => [
        ...previous,
        created,
      ]);
    },
  });

  const createService = useCallback(
    async (data: Omit<PetService, "id">) => {
      await mutation.mutateAsync(data);
    },
    [mutation]
  );

  return {
    createService,
    isCreating: mutation.isPending,
  };
}
