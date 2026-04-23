import { z } from "zod";
import {
  getFirstZodErrorMessage,
  normalizeEmail,
  normalizePhoneNumber,
  normalizeSmsCode,
} from "./inputSanitizers";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe um email para continuar.")
  .email("Informe um email valido.")
  .transform((value) => normalizeEmail(value));

export const adminRecoveryEmailSchema = z.object({
  email: emailSchema,
});

export const adminPhoneRecoverySchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Informe um telefone para continuar.")
    .transform((value) => normalizePhoneNumber(value))
    .refine((value) => /^\+\d{11,15}$/.test(value), {
      message: "Use o telefone no formato +55 11 99999-9999.",
    }),
});

export const adminSmsCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Digite o codigo recebido por SMS.")
    .transform((value) => normalizeSmsCode(value))
    .refine((value) => value.length === 6, {
      message: "Digite um codigo SMS com 6 digitos.",
    }),
});

export const adminResetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "A nova senha deve ter no minimo 6 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas nao conferem.",
  });

export { getFirstZodErrorMessage };
