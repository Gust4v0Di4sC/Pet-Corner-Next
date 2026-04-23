import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllTestimonials } from "../../services/testimonialService";
import type { RawTestimonialData, Testimonial } from "../../types/testimonial";
import { normalizeTestimonial, testimonialKeys } from "../../utils/testimonial/testimonial.util";

export function useListTestimonials(rota = "testimonials") {
  const { data: testimonials = [], refetch, isFetching } = useQuery<Testimonial[]>({
    queryKey: testimonialKeys(rota),
    queryFn: async () => {
      const data = (await getAllTestimonials(rota)) as RawTestimonialData[];
      return data.map(normalizeTestimonial);
    },
  });

  const fetchAllTestimonials = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    testimonials,
    fetchAllTestimonials,
    isLoading: isFetching,
  };
}
