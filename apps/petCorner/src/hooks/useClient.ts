import { useCallback, useState } from "react";

import type { Client, ClientDisplay, UseClientReturn } from "../types/client";
import {
  useCreateClient,
  useDeleteClient,
  useEditClient,
  useListClients,
  useSearchClient,
} from "./client";

export const useClient = (rota: string): UseClientReturn => {
  const [selected, setSelected] = useState<ClientDisplay | null>(null);
  const { clients, fetchAllClients, isLoading } = useListClients(rota);
  const { createClient } = useCreateClient(rota);
  const { editClient } = useEditClient(rota);
  const { removeClient } = useDeleteClient(rota);
  const { searchClient } = useSearchClient(rota);

  const create = useCallback(async (data: Omit<Client, "id">) => {
    await createClient(data);
  }, [createClient]);

  const update = useCallback(async (id: string, data: Omit<Client, "id">) => {
    await editClient(id, data);
  }, [editClient]);

  const remove = useCallback(async (id: string) => {
    await removeClient(id);
    setSelected(null);
  }, [removeClient]);

  const searchByName = useCallback(async (name: string) => {
    const client = await searchClient(name);
    setSelected(client);
  }, [searchClient]);

  return {
    items: clients,
    selected,
    setSelected,
    fetchAll: fetchAllClients,
    create,
    update,
    remove,
    searchByName,
    isLoading,
  };
};
