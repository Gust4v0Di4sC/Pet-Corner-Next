import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateService } from "../../services/petService";
import type { PetService } from "../../types/petService";
import { serviceKeys } from "../../utils/service/service.util";

export function useEditService(rota = "services") {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, { id: string; data: Omit<PetService, "id"> }>({
    mutationFn: ({ id, data }) => updateService(rota, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys(rota) });
    },
  });

  const editService = useCallback(
    async (id: string, data: Omit<PetService, "id">) => {
      await mutation.mutateAsync({ id, data });
    },
    [mutation]
  );

  return {
    editService,
    isEditing: mutation.isPending,
  };
}
