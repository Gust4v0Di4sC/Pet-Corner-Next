import { z } from "zod";
import {
  collapseWhitespace,
  formatCpfCnpjMask,
  normalizeCpfCnpjDocument,
} from "@/utils/validation/input-sanitizers";

export const checkoutFormSchema = z
  .object({
    address: z
      .string()
      .trim()
      .min(1, "Informe o endereco de entrega.")
      .transform((value) => collapseWhitespace(value)),
    document: z
      .string()
      .trim()
      .min(1, "Informe o CPF ou CNPJ.")
      .transform((value) => normalizeCpfCnpjDocument(value))
      .refine((value) => value.length === 11 || value.length === 14, {
        message: "Informe um CPF ou CNPJ valido.",
      }),
  })
  .transform((input) => ({
    address: input.address,
    document: input.document,
    documentMasked: formatCpfCnpjMask(input.document),
  }));

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;
