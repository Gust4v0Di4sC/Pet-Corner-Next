import { z } from "zod";
import { collapseWhitespace, normalizeEmail } from "@/lib/validation/input-sanitizers";

const emailFieldSchema = z
  .string()
  .trim()
  .min(1, "Informe um email para continuar.")
  .email("Informe um email valido.");

const passwordFieldSchema = z.string().min(1, "Informe a senha para continuar.");
const strongPasswordSchema = z
  .string()
  .min(12, "A senha precisa ter pelo menos 12 caracteres.")
  .regex(/[a-z]/, "A senha precisa ter pelo menos uma letra minuscula.")
  .regex(/[A-Z]/, "A senha precisa ter pelo menos uma letra maiuscula.")
  .regex(/\d/, "A senha precisa ter pelo menos um numero.")
  .regex(/[^A-Za-z0-9]/, "A senha precisa ter pelo menos um simbolo.");

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
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  })
  .transform((input) => ({
    name: collapseWhitespace(input.name),
    email: normalizeEmail(input.email),
    password: input.password,
  }));

export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
