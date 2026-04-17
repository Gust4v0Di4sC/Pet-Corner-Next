import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { getAllClients } from "../../services/clientService";
import type { Client, RawClientData } from "../../types/client";
import { clientKeys, normalizeClient } from "../../utils/client/client.utils";

export function useListClients(rota: string) {
  const { data: clients = [], refetch, isFetching } = useQuery<Client[]>({
    queryKey: clientKeys.list(rota),
    queryFn: async () => {
      const data = (await getAllClients(rota)) as RawClientData[];
      return data.map(normalizeClient);
    },
  });

  const fetchAllClients = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    clients,
    fetchAllClients,
    isLoading: isFetching,
  };
}
