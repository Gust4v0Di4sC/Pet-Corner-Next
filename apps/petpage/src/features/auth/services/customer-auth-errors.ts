"use client";

import { FirebaseError } from "firebase/app";

export function mapCustomerAuthError(error: unknown, context: "login" | "register"): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/user-not-found":
        return "Usuário não encontrado.";
      case "auth/wrong-password":
        return "Senha incorreta.";
      case "auth/invalid-credential":
        return "Email ou senha inválidos.";
      case "auth/invalid-email":
        return "Informe um email válido.";
      case "auth/email-already-in-use":
        return "Este email já está em uso.";
      case "auth/weak-password":
        return "A senha precisa ter pelo menos 6 caracteres.";
      case "auth/account-exists-with-different-credential":
        return "Já existe uma conta com outro método para este email.";
      case "auth/popup-blocked":
        return "O navegador bloqueou o popup. Libere popups para continuar.";
      case "auth/popup-closed-by-user":
        return context === "register"
          ? "Cadastro cancelado antes da conclusão."
          : "Login cancelado antes da conclusão.";
      case "auth/unauthorized-domain":
        return "Domínio não autorizado para login.";
      case "auth/operation-not-allowed":
        return context === "register"
          ? "Método de cadastro não habilitado no momento."
          : "Método de login não habilitado no momento.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      default:
        return context === "register"
          ? "Não foi possível concluir o cadastro agora."
          : "Não foi possível autenticar agora.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return context === "register"
    ? "Não foi possível concluir o cadastro."
    : "Não foi possível concluir o login.";
}
