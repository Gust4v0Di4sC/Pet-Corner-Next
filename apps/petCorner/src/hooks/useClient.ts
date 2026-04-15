import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addClient,
  deleteClient,
  getAllClients,
  searchClientByName,
  updateClient,
} from "../services/clientService";
import type { Client, ClientDisplay, RawClientData, UseClientReturn } from "../types/client";
import { normalizeClient, toClientDisplay , clientKeys } from "../utils/client/client.utils";



export const useClient = (rota: string): UseClientReturn => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ClientDisplay | null>(null);

  const { data: clients = [], refetch, isFetching } = useQuery<Client[]>({
    queryKey: clientKeys.list(rota),
    queryFn: async () => {
      const data = (await getAllClients(rota)) as RawClientData[];
      return data.map(normalizeClient);
    },
  });

  const fetchAll = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const createMutation = useMutation<Client, Error, Omit<Client, "id">>({
    mutationFn: async (data) => {
      const created = (await addClient(rota, data)) as RawClientData;
      return normalizeClient(created);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Client[]>(clientKeys.list(rota), (prev = []) => [
        ...prev,
        created,
      ]);
    },
  });

  const updateMutation = useMutation<void, Error, { id: string; data: Omit<Client, "id"> }>({
    mutationFn: ({ id, data }) => updateClient(rota, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.list(rota) }),
  });

  const removeMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteClient(rota, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.list(rota) });
      setSelected(null);
    },
  });

  const searchMutation = useMutation<ClientDisplay | null, Error, string>({
    mutationFn: async (name) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const res = (await searchClientByName(rota, trimmed)) as RawClientData[];
      return toClientDisplay(res[0]);
    },
    onSuccess: setSelected,
  });

  const create = useCallback(async (data: Omit<Client, "id">) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const update = useCallback(async (id: string, data: Omit<Client, "id">) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const remove = useCallback(async (id: string) => {
    await removeMutation.mutateAsync(id);
  }, [removeMutation]);

  const searchByName = useCallback(async (name: string) => {
    await searchMutation.mutateAsync(name);
  }, [searchMutation]);

  return {
    items: clients,
    selected,
    setSelected,
    fetchAll,
    create,
    update,
    remove,
    searchByName,
    isLoading: isFetching,
  };
};
