import { useState } from 'react';
import {
  getAllDogs,
  addDog,
  updateDog,
  deleteDog,
  searchDogByName
} from '../services/dogService';

import type { Dog } from '../services/dogService';

// src/contexts/DogContext.tsx
export type DogContextType = {
  items: Dog[]; // <-- NORMALIZADO
  selected: Dog | null;
  setSelected: (dog: Dog | null) => void;
  fetchAll: () => Promise<void>;
  create: (data: Omit<Dog, 'id'>) => Promise<void>;
  update: (id: string, data: Omit<Dog, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  searchByName: (name: string) => Promise<void>;
};

export const useDog = (rota: string = 'dogs'): DogContextType & { items: Dog[] } => {
  const [dogs, setItems] = useState<Dog[]>([]); // <-- RENOMEADO
  const [selected, setSelected] = useState<Dog | null>(null);

  const fetchAll = async () => {
    const data = await getAllDogs(rota);
    setItems(data);
  };

  const create = async (data: Omit<Dog, 'id'>) => {
    const newDog = await addDog(rota, data);
    setItems(prev => [...prev, newDog]);
  };

  const update = async (id: string, data: Omit<Dog, 'id'>) => {
    await updateDog(rota, id, data);
    fetchAll();
  };

  const remove = async (id: string) => {
    await deleteDog(rota, id);
    fetchAll();
  };

  const searchByName = async (name: string) => {
    const res = await searchDogByName(rota, name);
    setSelected(res.length > 0 ? res[0] : null);
  };

  return {
    items: dogs,
    selected,
    setSelected,
    fetchAll,
    create,
    update,
    remove,
    searchByName
  };
};
