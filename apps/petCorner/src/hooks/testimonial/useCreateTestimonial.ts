import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTestimonial } from "../../services/testimonialService";
import type { RawTestimonialData, Testimonial } from "../../types/testimonial";
import { normalizeTestimonial, testimonialKeys } from "../../utils/testimonial/testimonial.util";

export function useCreateTestimonial(rota = "testimonials") {
  const queryClient = useQueryClient();

  const mutation = useMutation<Testimonial, Error, Omit<Testimonial, "id">>({
    mutationFn: async (data) => {
      const created = (await addTestimonial(rota, data)) as RawTestimonialData;
      return normalizeTestimonial(created);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Testimonial[]>(testimonialKeys(rota), (previous = []) => [
        ...previous,
        created,
      ]);
    },
  });

  const createTestimonial = useCallback(
    async (data: Omit<Testimonial, "id">) => {
      await mutation.mutateAsync(data);
    },
    [mutation]
  );

  return {
    createTestimonial,
    isCreating: mutation.isPending,
  };
}
