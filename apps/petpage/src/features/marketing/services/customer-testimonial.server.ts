import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirebaseServerFirestore } from "@/lib/firebase/firebase-server";

const customerTestimonialSchema = z.object({
  role: z.string().trim().max(80).optional().default("Cliente Pet Corner"),
  content: z.string().trim().min(20).max(600),
  rating: z.coerce.number().int().min(1).max(5),
});

export type CustomerTestimonialInput = z.infer<typeof customerTestimonialSchema>;

export function parseCustomerTestimonialInput(input: unknown): CustomerTestimonialInput {
  return customerTestimonialSchema.parse(input);
}

export async function saveCustomerTestimonial(input: {
  customerId: string;
  customerName?: string;
  customerEmail: string;
  testimonial: CustomerTestimonialInput;
}) {
  const testimonial = customerTestimonialSchema.parse(input.testimonial);
  const customerId = input.customerId.trim();
  const author =
    input.customerName?.trim() || input.customerEmail.split("@")[0]?.trim() || "Cliente Pet Corner";

  if (!customerId) {
    throw new Error("Sessao invalida para enviar o depoimento.");
  }

  const db = getFirebaseServerFirestore();
  const testimonialRef = db.collection("testimonials").doc(customerId);
  const notificationRef = db.collection("adminNotifications").doc();
  const nowIso = new Date().toISOString();
  const batch = db.batch();

  batch.set(
    testimonialRef,
    {
      author,
      role: testimonial.role || "Cliente Pet Corner",
      content: testimonial.content,
      rating: testimonial.rating,
      isActive: true,
      customerId,
      source: "petpage",
      createdAt: FieldValue.serverTimestamp(),
      createdAtIso: nowIso,
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtIso: nowIso,
    },
    { merge: true }
  );
  batch.set(notificationRef, {
    title: "Novo depoimento recebido",
    message: `${author} enviou uma avaliacao de ${testimonial.rating} estrela(s).`,
    category: "testimonial",
    linkHref: "/depoimentos",
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso,
  });

  await batch.commit();

  return {
    id: customerId,
    author,
    role: testimonial.role || "Cliente Pet Corner",
    content: testimonial.content,
    rating: testimonial.rating,
  };
}
