import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTestimonial } from "../../services/testimonialService";
import type { Testimonial } from "../../types/testimonial";
import { testimonialKeys } from "../../utils/testimonial/testimonial.util";

export function useEditTestimonial(rota = "testimonials") {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, { id: string; data: Omit<Testimonial, "id"> }>({
    mutationFn: ({ id, data }) => updateTestimonial(rota, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys(rota) });
    },
  });

  const editTestimonial = useCallback(
    async (id: string, data: Omit<Testimonial, "id">) => {
      await mutation.mutateAsync({ id, data });
    },
    [mutation]
  );

  return {
    editTestimonial,
    isEditing: mutation.isPending,
  };
}
