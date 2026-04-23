import type { RawTestimonialData, Testimonial } from "../../types/testimonial";

export const testimonialKeys = (rota: string) => ["testimonials", rota] as const;

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 5;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === "true" || normalizedValue === "1";
  }

  return false;
}

export function normalizeTestimonial(raw: RawTestimonialData): Testimonial {
  const rating = Math.round(toNumber(raw.rating));
  const normalizedRating = Math.max(1, Math.min(rating, 5));

  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    author: typeof raw.author === "string" ? raw.author : "",
    role: typeof raw.role === "string" ? raw.role : "",
    content: typeof raw.content === "string" ? raw.content : "",
    rating: normalizedRating,
    isActive: toBoolean(raw.isActive),
  };
}
