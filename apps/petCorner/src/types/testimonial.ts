export type Testimonial = {
  id?: string;
  author: string;
  role: string;
  content: string;
  rating: number;
  isActive: boolean;
};

export type RawTestimonialData = Partial<Testimonial> & { id?: unknown };

export type UseTestimonialsReturn = {
  items: Testimonial[];
  selected: Testimonial | null;
  setSelected: (item: Testimonial | null) => void;
  fetchAll: () => Promise<void>;
  create: (data: Omit<Testimonial, "id">) => Promise<void>;
  update: (id: string, data: Omit<Testimonial, "id">) => Promise<void>;
  remove: (id: string) => Promise<void>;
  searchByAuthor: (author: string) => Promise<void>;
  isLoading: boolean;
};
