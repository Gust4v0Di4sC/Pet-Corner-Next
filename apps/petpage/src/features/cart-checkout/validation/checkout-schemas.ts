import { z } from "zod";
import {
  collapseWhitespace,
  digitsOnly,
  normalizeStateCode,
  normalizeZipCode,
} from "@/lib/validation/input-sanitizers";

const requiredText = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .transform((value) => collapseWhitespace(value));

export const checkoutDeliveryStepSchema = z
  .object({
    fullName: requiredText("Informe o nome completo para entrega."),
    phone: z
      .string()
      .trim()
      .min(1, "Informe um telefone para contato.")
      .transform((value) => digitsOnly(value).slice(0, 11))
      .refine((value) => value.length === 10 || value.length === 11, {
        message: "Informe um telefone valido com DDD.",
      }),
    zipCode: z
      .string()
      .trim()
      .min(1, "Informe o CEP.")
      .transform((value) => normalizeZipCode(value))
      .refine((value) => value.length === 9, {
        message: "Informe um CEP valido.",
      }),
    city: requiredText("Informe a cidade."),
    street: requiredText("Informe o endereco."),
    number: requiredText("Informe o numero."),
    district: requiredText("Informe o bairro."),
    state: z
      .string()
      .trim()
      .min(1, "Informe o estado.")
      .transform((value) => normalizeStateCode(value))
      .refine((value) => value.length === 2, {
        message: "Informe a UF com 2 letras.",
      }),
    complement: z
      .string()
      .trim()
      .optional()
      .default("")
      .transform((value) => collapseWhitespace(value)),
  })
  .transform((value) => ({
    fullName: value.fullName,
    phone: value.phone,
    zipCode: value.zipCode,
    city: value.city,
    street: value.street,
    number: value.number,
    district: value.district,
    state: value.state,
    complement: value.complement,
  }));

export type CheckoutDeliveryStepInput = z.infer<typeof checkoutDeliveryStepSchema>;
