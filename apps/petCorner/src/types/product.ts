export type Product = {
  id?: string
  name: string
  price: number
  code: string
  quantity: number
}


// normalização defensiva (doc.data() pode vir com tipos soltos)
export type RawProductData = Partial<Product> & { id?: unknown };


export type UseProductsReturn = {
  items: Product[];
  selected: Product | null;
  setSelected: (item: Product | null) => void;

  fetchAll: () => Promise<void>;
  create: (data: Omit<Product, "id">) => Promise<void>;
  update: (id: string, data: Omit<Product, "id">) => Promise<void>;
  remove: (id: string) => Promise<void>;
  searchByName: (name: string) => Promise<void>;

  isLoading: boolean;
};