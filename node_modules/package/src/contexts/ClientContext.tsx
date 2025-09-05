// src/contexts/ClientContext.tsx
import { useState } from 'react';
import {
  getAllClients,
  addClient,
  updateClient,
  deleteClient,
  searchClientByName,
} from '../services/clientService';

import { Timestamp } from 'firebase/firestore';

export type Client = {
  id?: string;
  name: string;
  age: Timestamp;
  email: string;
  phone: number;
};

// Tipo para exibição no formulário (com age como string formatada)
export type ClientDisplay = {
  id?: string;
  name: string;
  age: string; // string formatada 'dd/MM/yyyy'
  email: string;
  phone: number;
};

type RawClientData = {
  id?: string;
  name?: string;
  age?: Timestamp;
  email?: string;
  phone?: number;
};

export type ClientContextType = {
  items: Client[];
  selected: ClientDisplay | null; // 👈 Mudança aqui
  setSelected: (client: ClientDisplay | null) => void; // 👈 E aqui
  fetchAll: () => Promise<void>;
  create: (data: Omit<Client, 'id'>) => Promise<void>;
  update: (id: string, data: Omit<Client, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  searchByName: (name: string) => Promise<void>;
};

export const useClient = (rota: string): ClientContextType & { items: Client[] } => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<ClientDisplay | null>(null); // 👈 Mudança aqui

  const fetchAll = async () => {
    const data = await getAllClients(rota);
    const normalizedData: Client[] = data.map((item: RawClientData) => ({
      id: item.id,
      name: item.name ?? '',
      age: item.age ?? new Timestamp(0, 0),
      email: item.email ?? '',
      phone: item.phone ?? 0,
    }));
    setClients(normalizedData);
  };

  const create = async (data: Omit<Client, 'id'>) => {
    const newClient = await addClient(rota, data);

    const normalizedClient: Client = {
      ...newClient,
      age:
        newClient.age instanceof Date
          ? Timestamp.fromDate(newClient.age)
          : newClient.age,
    };

    setClients((prev) => [...prev, normalizedClient]);
  };

  const update = async (id: string, data: Omit<Client, 'id'>) => {
    await updateClient(rota, id, data);
    fetchAll();
  };

  const remove = async (id: string) => {
    await deleteClient(rota, id);
    fetchAll();
  };

  function formatDateToString(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const searchByName = async (name: string) => {
    const res = await searchClientByName(rota, name);
    
    if (res.length > 0) {
      const raw = res[0];
      const ageDate = raw.age instanceof Timestamp
        ? raw.age.toDate()
        : new Date(raw.age);

      const formattedClient: ClientDisplay = {
        ...raw,
        age: formatDateToString(ageDate), // ✅ Agora está correto
      };

      setSelected(formattedClient);
    } else {
      setSelected(null);
    }
  };

  return {
    items: clients,
    selected,
    setSelected,
    fetchAll,
    create,
    update,
    remove,
    searchByName,
  };
};