import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteService } from "../../services/petService";
import { serviceKeys } from "../../utils/service/service.util";

export function useDeleteService(rota = "services") {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteService(rota, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys(rota) });
    },
  });

  const removeService = useCallback(
    async (id: string) => {
      await mutation.mutateAsync(id);
    },
    [mutation]
  );

  return {
    removeService,
    isDeleting: mutation.isPending,
  };
}
