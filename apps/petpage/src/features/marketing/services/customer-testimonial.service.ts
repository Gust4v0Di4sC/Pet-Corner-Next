export type CustomerTestimonialSubmission = {
  role: string;
  content: string;
  rating: number;
};

type TestimonialApiResponse = {
  ok?: boolean;
  error?: string;
};

export async function submitCustomerTestimonial(
  input: CustomerTestimonialSubmission
): Promise<void> {
  const response = await fetch("/api/testimonials", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => null)) as TestimonialApiResponse | null;

  if (!response.ok) {
    throw new Error(
      payload?.error || "Nao foi possivel enviar seu depoimento agora. Tente novamente."
    );
  }
}
