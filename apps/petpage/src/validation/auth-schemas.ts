import { z } from "zod";
import { collapseWhitespace, normalizeEmail } from "@/utils/validation/input-sanitizers";

const emailFieldSchema = z
  .string()
  .trim()
  .min(1, "Informe um email para continuar.")
  .email("Informe um email valido.");

const passwordFieldSchema = z.string().min(1, "Informe a senha para continuar.");

export const customerLoginSchema = z
  .object({
    email: emailFieldSchema,
    password: passwordFieldSchema,
  })
  .transform((input) => ({
    email: normalizeEmail(input.email),
    password: input.password,
  }));

export const customerRegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe seu nome completo.")
      .transform((value) => collapseWhitespace(value)),
    email: emailFieldSchema,
    password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "As senhas nao conferem.",
    path: ["confirmPassword"],
  })
  .transform((input) => ({
    name: collapseWhitespace(input.name),
    email: normalizeEmail(input.email),
    password: input.password,
  }));

export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
