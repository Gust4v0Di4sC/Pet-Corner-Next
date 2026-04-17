import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteClient } from "../../services/clientService";
import { clientKeys } from "../../utils/client/client.utils";

export function useDeleteClient(rota: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteClient(rota, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.list(rota) });
    },
  });

  const removeClient = useCallback(
    async (id: string) => {
      await mutation.mutateAsync(id);
    },
    [mutation]
  );

  return {
    removeClient,
    isDeleting: mutation.isPending,
  };
}
