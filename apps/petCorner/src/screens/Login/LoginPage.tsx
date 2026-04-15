// src/pages/Login/LoginPage.tsx
import "./login.css";
import { useState } from "react";
import { FirebaseError } from "firebase/app";

import { useAuth } from "../../hooks/useAuth";

import Logo from "../../components/Templates/Logo";
import logoimg from "../../assets/logo.png";

import LoginForm from "../../components/Login/LoginForm";
import LoginAlert from "../../components/Login/LoginAlert";

// 👇 se você exportou o type do LoginForm, importe assim:
// import type { LoginFormValues } from "../../components/Login/LoginForm";

type LoginFormValues = {
  email: string;
  password: string;
};

type AlertType = { severity: "error" | "success"; message: string } | null;

export default function LoginPage() {
  const { login, loginWithGoogle, loginWithMicrosoft } = useAuth();

  const [alert, setAlert] = useState<AlertType>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  // ✅ agora recebe dados já validados pelo zod + react-hook-form
  const handleSubmit = async ({ email, password }: LoginFormValues) => {
    try {
      await login(email.trim(), password);
      setAlert({
        severity: "success",
        message: "Login realizado com sucesso!",
      });
      // navigate("/dashboard");
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        const message =
          error.code === "auth/user-not-found"
            ? "Usuário não encontrado"
            : error.code === "auth/wrong-password"
              ? "Senha incorreta"
              : "Erro ao fazer login";

        setAlert({ severity: "error", message });
      } else {
        setAlert({ severity: "error", message: "Erro ao fazer login" });
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container paw-main">
        <LoginAlert alert={alert} onClose={() => setAlert(null)} />

        <LoginForm
          onSubmit={handleSubmit}
          onGoogle={loginWithGoogle}
          onMicrosoft={loginWithMicrosoft}
          onHoverLogin={setShowAnimation}
          showAnimation={showAnimation}
          header={<Logo src={logoimg} />}
        />
      </div>
    </div>
  );
}
