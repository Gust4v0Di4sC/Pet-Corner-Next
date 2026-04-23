import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTestimonial } from "../../services/testimonialService";
import { testimonialKeys } from "../../utils/testimonial/testimonial.util";

export function useDeleteTestimonial(rota = "testimonials") {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteTestimonial(rota, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys(rota) });
    },
  });

  const removeTestimonial = useCallback(
    async (id: string) => {
      await mutation.mutateAsync(id);
    },
    [mutation]
  );

  return {
    removeTestimonial,
    isDeleting: mutation.isPending,
  };
}
