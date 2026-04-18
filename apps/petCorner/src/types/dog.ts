export type Dog = {
  id?: string
  name: string
  animalType: string
  age: number
  breed: string
  weight: number
}

// 🔒 normalização defensiva (evita {} -> string/number)
export type RawDogData = Partial<Dog> & { id?: unknown };


export type UseDogReturn = {
  items: Dog[];
  selected: Dog | null;
  setSelected: (dog: Dog | null) => void;
  fetchAll: () => Promise<void>;
  create: (data: Omit<Dog, "id">) => Promise<void>;
  update: (id: string, data: Omit<Dog, "id">) => Promise<void>;
  remove: (id: string) => Promise<void>;
  searchByName: (name: string) => Promise<void>;
  isLoading: boolean;
};
