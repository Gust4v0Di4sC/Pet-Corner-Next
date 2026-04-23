import { useCallback, useState } from "react";
import type { Testimonial, UseTestimonialsReturn } from "../types/testimonial";
import { useCreateTestimonial } from "./testimonial/useCreateTestimonial";
import { useDeleteTestimonial } from "./testimonial/useDeleteTestimonial";
import { useEditTestimonial } from "./testimonial/useEditTestimonial";
import { useListTestimonials } from "./testimonial/useListTestimonials";
import { useSearchTestimonial } from "./testimonial/useSearchTestimonial";

export const useTestimonials = (rota: string = "testimonials"): UseTestimonialsReturn => {
  const [selected, setSelected] = useState<Testimonial | null>(null);
  const { testimonials, fetchAllTestimonials, isLoading } = useListTestimonials(rota);
  const { createTestimonial } = useCreateTestimonial(rota);
  const { editTestimonial } = useEditTestimonial(rota);
  const { removeTestimonial } = useDeleteTestimonial(rota);
  const { searchTestimonial } = useSearchTestimonial(rota);

  const create = useCallback(
    async (data: Omit<Testimonial, "id">) => {
      await createTestimonial(data);
    },
    [createTestimonial]
  );

  const update = useCallback(
    async (id: string, data: Omit<Testimonial, "id">) => {
      await editTestimonial(id, data);
    },
    [editTestimonial]
  );

  const remove = useCallback(
    async (id: string) => {
      await removeTestimonial(id);
      setSelected(null);
    },
    [removeTestimonial]
  );

  const searchByAuthor = useCallback(
    async (author: string) => {
      const testimonial = await searchTestimonial(author);
      setSelected(testimonial);
    },
    [searchTestimonial]
  );

  return {
    items: testimonials,
    selected,
    setSelected,
    fetchAll: fetchAllTestimonials,
    create,
    update,
    remove,
    searchByAuthor,
    isLoading,
  };
};
