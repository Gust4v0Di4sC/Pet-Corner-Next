import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { searchTestimonialByAuthor } from "../../services/testimonialService";
import type { RawTestimonialData, Testimonial } from "../../types/testimonial";
import { normalizeTestimonial } from "../../utils/testimonial/testimonial.util";

export function useSearchTestimonial(rota = "testimonials") {
  const mutation = useMutation<Testimonial | null, Error, string>({
    mutationFn: async (author) => {
      const trimmedAuthor = author.trim();
      if (!trimmedAuthor) {
        return null;
      }

      const results = (await searchTestimonialByAuthor(rota, trimmedAuthor)) as RawTestimonialData[];
      const firstTestimonial = results[0];
      return firstTestimonial ? normalizeTestimonial(firstTestimonial) : null;
    },
  });

  const searchTestimonial = useCallback(
    async (author: string) => {
      return mutation.mutateAsync(author);
    },
    [mutation]
  );

  return {
    searchTestimonial,
    isSearching: mutation.isPending,
  };
}
