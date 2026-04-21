export type PetService = {
  id?: string;
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
};

export type RawPetServiceData = Partial<PetService> & { id?: unknown };

export type UseServicesReturn = {
  items: PetService[];
  selected: PetService | null;
  setSelected: (item: PetService | null) => void;
  fetchAll: () => Promise<void>;
  create: (data: Omit<PetService, "id">) => Promise<void>;
  update: (id: string, data: Omit<PetService, "id">) => Promise<void>;
  remove: (id: string) => Promise<void>;
  searchByName: (name: string) => Promise<void>;
  isLoading: boolean;
};
