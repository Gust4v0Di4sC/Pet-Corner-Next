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

function isValidCardExpiry(expiryDigits: string): boolean {
  if (expiryDigits.length !== 4) {
    return false;
  }

  const month = Number.parseInt(expiryDigits.slice(0, 2), 10);
  const yearSuffix = Number.parseInt(expiryDigits.slice(2), 10);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return false;
  }
  if (!Number.isInteger(yearSuffix)) {
    return false;
  }

  const fullYear = 2000 + yearSuffix;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (fullYear < currentYear) {
    return false;
  }
  if (fullYear === currentYear && month < currentMonth) {
    return false;
  }

  return true;
}

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

export const checkoutPaymentStepSchema = z
  .object({
    cardNumber: z
      .string()
      .trim()
      .min(1, "Informe o numero do cartao.")
      .transform((value) => digitsOnly(value).slice(0, 16))
      .refine((value) => value.length === 16, {
        message: "Informe um cartao valido com 16 digitos.",
      }),
    cardHolderName: requiredText("Informe o nome impresso no cartao."),
    cardExpiry: z
      .string()
      .trim()
      .min(1, "Informe a validade.")
      .transform((value) => digitsOnly(value).slice(0, 4))
      .refine((value) => isValidCardExpiry(value), {
        message: "Informe uma validade valida no formato MM/AA.",
      }),
    cvv: z
      .string()
      .trim()
      .min(1, "Informe o CVV.")
      .transform((value) => digitsOnly(value).slice(0, 4))
      .refine((value) => value.length === 3 || value.length === 4, {
        message: "Informe um CVV valido.",
      }),
  })
  .transform((value) => ({
    cardNumber: value.cardNumber,
    cardHolderName: value.cardHolderName,
    cardExpiry: value.cardExpiry,
    cvv: value.cvv,
    cardLast4: value.cardNumber.slice(-4),
    expiryMonth: Number.parseInt(value.cardExpiry.slice(0, 2), 10),
    expiryYear: 2000 + Number.parseInt(value.cardExpiry.slice(2), 10),
  }));

export type CheckoutDeliveryStepInput = z.infer<typeof checkoutDeliveryStepSchema>;
export type CheckoutPaymentStepInput = z.infer<typeof checkoutPaymentStepSchema>;
