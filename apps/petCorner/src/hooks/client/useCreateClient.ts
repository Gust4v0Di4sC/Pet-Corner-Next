import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { addClient } from "../../services/clientService";
import type { Client, CreateClientInput, RawClientData } from "../../types/client";
import { clientKeys, normalizeClient } from "../../utils/client/client.utils";

export function useCreateClient(rota: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation<Client, Error, CreateClientInput>({
    mutationFn: async (data) => {
      const created = (await addClient(rota, data)) as RawClientData;
      return normalizeClient(created);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Client[]>(clientKeys.list(rota), (previous = []) => [
        ...previous,
        created,
      ]);
    },
  });

  const createClient = useCallback(
    async (data: CreateClientInput) => {
      await mutation.mutateAsync(data);
    },
    [mutation]
  );

  return {
    createClient,
    isCreating: mutation.isPending,
  };
}
