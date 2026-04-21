import { useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { FirebaseError } from "firebase/app";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import Animation from "../../assets/Animation.lottie";
import logoimg from "../../assets/Logo.svg";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import Logo from "../Templates/Logo";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);
  const { login, loginWithGoogle, loginWithMicrosoft } = useAuth();
  const toast = useToast();

  const handleSubmit: NonNullable<ComponentPropsWithoutRef<"form">["onSubmit"]> = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      await login(email, password);
      toast.success("Login realizado com sucesso!");
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        const errorMessage =
          error.code === "auth/user-not-found"
            ? "Usuário não encontrado"
            : error.code === "auth/wrong-password"
              ? "Senha incorreta"
              : "Erro ao fazer login";

        toast.error(errorMessage);
        return;
      }

      toast.error("Erro ao fazer login");
    }
  };

  return (
    <div className="container paw-main">
      <form className="form" onSubmit={handleSubmit}>
        <Logo src={logoimg} />

        <div className="box">
          <input
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Digite seu nome..."
            value={email}
          />

          <input
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Digite sua senha..."
            value={password}
          />

          <button
            className="btn-primary login-button"
            onMouseEnter={() => setShowAnimation(true)}
            onMouseLeave={() => setShowAnimation(false)}
            type="submit"
          >
            Entrar
          </button>

          <section className="social-login">
            <button
              type="button"
              className="social-button google"
              onClick={loginWithGoogle}
            >
              <i className="fa-brands fa-google" />
            </button>

            <button
              type="button"
              className="social-button microsoft"
              onClick={loginWithMicrosoft}
            >
              <i className="fa-brands fa-windows" />
            </button>
          </section>
        </div>
      </form>

      <div className="paws">
        {showAnimation && <DotLottieReact src={Animation} autoplay loop />}
      </div>
    </div>
  );
}
