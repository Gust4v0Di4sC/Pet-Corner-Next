"use client";

import { FirebaseError } from "firebase/app";

export function mapCustomerAuthError(error: unknown, context: "login" | "register"): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/user-not-found":
        return "Usuario nao encontrado.";
      case "auth/wrong-password":
        return "Senha incorreta.";
      case "auth/invalid-credential":
        return "Email ou senha invalidos.";
      case "auth/invalid-email":
        return "Informe um email valido.";
      case "auth/email-already-in-use":
        return "Este email ja esta em uso.";
      case "auth/weak-password":
        return "A senha precisa ter pelo menos 6 caracteres.";
      case "auth/account-exists-with-different-credential":
        return "Ja existe uma conta com outro metodo para este email.";
      case "auth/popup-blocked":
        return "O navegador bloqueou o popup. Libere popups para continuar.";
      case "auth/popup-closed-by-user":
        return context === "register"
          ? "Cadastro cancelado antes da conclusao."
          : "Login cancelado antes da conclusao.";
      case "auth/unauthorized-domain":
        return "Dominio nao autorizado para login.";
      case "auth/operation-not-allowed":
        return context === "register"
          ? "Metodo de cadastro nao habilitado no momento."
          : "Metodo de login nao habilitado no momento.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      default:
        return context === "register"
          ? "Nao foi possivel concluir o cadastro agora."
          : "Nao foi possivel autenticar agora.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return context === "register"
    ? "Nao foi possivel concluir o cadastro."
    : "Nao foi possivel concluir o login.";
}
