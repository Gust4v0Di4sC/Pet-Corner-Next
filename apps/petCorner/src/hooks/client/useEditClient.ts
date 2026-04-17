import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateClient } from "../../services/clientService";
import type { UpdateClientInput } from "../../types/client";
import { clientKeys } from "../../utils/client/client.utils";

export function useEditClient(rota: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, { id: string; data: UpdateClientInput }>({
    mutationFn: ({ id, data }) => updateClient(rota, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.list(rota) });
    },
  });

  const editClient = useCallback(
    async (id: string, data: UpdateClientInput) => {
      await mutation.mutateAsync({ id, data });
    },
    [mutation]
  );

  return {
    editClient,
    isEditing: mutation.isPending,
  };
}
