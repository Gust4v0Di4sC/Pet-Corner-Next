import { useCallback, useState } from "react";

import type { PetService, UseServicesReturn } from "../types/petService";
import { useCreateService } from "./service/useCreateService";
import { useDeleteService } from "./service/useDeleteService";
import { useEditService } from "./service/useEditService";
import { useListServices } from "./service/useListServices";
import { useSearchService } from "./service/useSearchService";

export const useServices = (rota: string = "services"): UseServicesReturn => {
  const [selected, setSelected] = useState<PetService | null>(null);
  const { services, fetchAllServices, isLoading } = useListServices(rota);
  const { createService } = useCreateService(rota);
  const { editService } = useEditService(rota);
  const { removeService } = useDeleteService(rota);
  const { searchService } = useSearchService(rota);

  const create = useCallback(
    async (data: Omit<PetService, "id">) => {
      await createService(data);
    },
    [createService]
  );

  const update = useCallback(
    async (id: string, data: Omit<PetService, "id">) => {
      await editService(id, data);
    },
    [editService]
  );

  const remove = useCallback(
    async (id: string) => {
      await removeService(id);
      setSelected(null);
    },
    [removeService]
  );

  const searchByName = useCallback(
    async (name: string) => {
      const service = await searchService(name);
      setSelected(service);
    },
    [searchService]
  );

  return {
    items: services,
    selected,
    setSelected,
    fetchAll: fetchAllServices,
    create,
    update,
    remove,
    searchByName,
    isLoading,
  };
};
