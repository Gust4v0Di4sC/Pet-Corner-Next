import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

import { searchClientByName } from "../../services/clientService";
import type { ClientDisplay, RawClientData } from "../../types/client";
import { toClientDisplay } from "../../utils/client/client.utils";

export function useSearchClient(rota: string) {
  const mutation = useMutation<ClientDisplay | null, Error, string>({
    mutationFn: async (name) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return null;
      }

      const results = (await searchClientByName(rota, trimmed)) as RawClientData[];
      return toClientDisplay(results[0]);
    },
  });

  const searchClient = useCallback(
    async (name: string) => {
      return mutation.mutateAsync(name);
    },
    [mutation]
  );

  return {
    searchClient,
    isSearching: mutation.isPending,
  };
}
