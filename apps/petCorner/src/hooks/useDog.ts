import { useCallback, useState } from "react";

import type { Dog, UseDogReturn } from "../types/dog";
import { useCreateDog } from "./dog/useCreateDog";
import { useDeleteDog } from "./dog/useDeleteDog";
import { useEditDog } from "./dog/useEditDog";
import { useListDogs } from "./dog/useListDogs";
import { useSearchDog } from "./dog/useSearchDog";

export const useDog = (rota: string = "dogs"): UseDogReturn => {
  const [selected, setSelected] = useState<Dog | null>(null);
  const { dogs, fetchAllDogs, isLoading } = useListDogs(rota);
  const { createDog } = useCreateDog(rota);
  const { editDog } = useEditDog(rota);
  const { removeDog } = useDeleteDog(rota);
  const { searchDog } = useSearchDog(rota);

  const create = useCallback(async (data: Omit<Dog, "id">) => {
    await createDog(data);
  }, [createDog]);

  const update = useCallback(async (id: string, data: Omit<Dog, "id">) => {
    await editDog(id, data);
  }, [editDog]);

  const remove = useCallback(async (id: string) => {
    await removeDog(id);
    setSelected(null);
  }, [removeDog]);

  const searchByName = useCallback(async (name: string) => {
    const dog = await searchDog(name);
    setSelected(dog);
  }, [searchDog]);

  return {
    items: dogs,
    selected,
    setSelected,
    fetchAll: fetchAllDogs,
    create,
    update,
    remove,
    searchByName,
    isLoading,
  };
};
