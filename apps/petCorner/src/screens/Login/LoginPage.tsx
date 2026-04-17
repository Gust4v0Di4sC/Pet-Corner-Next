import "./login.css";
import { useEffect, useRef, useState } from "react";
import { FirebaseError } from "firebase/app";
import { Navigate } from "react-router-dom";

import { sendPasswordResetEmail } from "../../API/auth";
import LoginAlert from "../../components/Login/LoginAlert";
import LoginForm from "../../components/Login/LoginForm";
import { DASHBOARD_ROUTE } from "../../components/Dashboard/dashboard.domain";
import AppLoader from "../../components/Templates/AppLoader";
import Logo from "../../components/Templates/Logo";
import logoimg from "../../assets/Logo.svg";
import pawPrint from "../../assets/paw-print.svg";
import splashLogo from "../../assets/Logo-Home.svg";
import { useAuth } from "../../hooks/useAuth";
import { AdminAccessError } from "../../services/adminService";

type LoginFormValues = {
  email: string;
  password: string;
};

type AlertType = { severity: "error" | "success"; message: string } | null;
type SplashStamp = { x: number; y: number; key: number } | null;

const SPLASH_BACKGROUND_PAWS = [
  { left: "16%", top: "18%", size: "86px", rotate: "-18deg", delay: "0s", duration: "2.8s" },
  { left: "30%", top: "34%", size: "74px", rotate: "12deg", delay: "0.35s", duration: "2.4s" },
  { left: "82%", top: "22%", size: "92px", rotate: "18deg", delay: "0.6s", duration: "2.9s" },
  { left: "72%", top: "64%", size: "84px", rotate: "-12deg", delay: "0.2s", duration: "2.5s" },
  { left: "18%", top: "72%", size: "96px", rotate: "14deg", delay: "0.8s", duration: "3.1s" },
  { left: "44%", top: "78%", size: "78px", rotate: "-16deg", delay: "0.5s", duration: "2.6s" },
  { left: "58%", top: "16%", size: "72px", rotate: "8deg", delay: "0.95s", duration: "2.7s" },
  { left: "90%", top: "80%", size: "82px", rotate: "-20deg", delay: "0.4s", duration: "2.8s" },
];

export default function LoginPage() {
  const { isLoading, login, user } = useAuth();
  const splashRevealTimeoutRef = useRef<number | null>(null);

  const [alert, setAlert] = useState<AlertType>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isSplashStamping, setIsSplashStamping] = useState(false);
  const [splashStamp, setSplashStamp] = useState<SplashStamp>(null);

  const handleSubmit = async ({ email, password }: LoginFormValues) => {
    try {
      await login(email.trim(), password);
      setAlert({
        severity: "success",
        message: "Login realizado com sucesso!",
      });
    } catch (error: unknown) {
      if (error instanceof AdminAccessError) {
        setAlert({ severity: "error", message: error.message });
        return;
      }

      if (error instanceof FirebaseError) {
        const message =
          error.code === "auth/user-not-found"
            ? "Usuario nao encontrado"
            : error.code === "auth/wrong-password"
              ? "Senha incorreta"
              : error.code === "auth/invalid-credential"
                ? "E-mail ou senha invalidos"
                : "Erro ao fazer login";

        setAlert({ severity: "error", message });
        return;
      }

      setAlert({ severity: "error", message: "Erro ao fazer login" });
    }
  };

  useEffect(() => {
    if (!isResetModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSendingResetEmail) {
        setIsResetModalOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isResetModalOpen, isSendingResetEmail]);

  useEffect(() => {
    if (!isLoginVisible) {
      return undefined;
    }

    const focusTimeout = window.setTimeout(() => {
      const emailInput = document.querySelector<HTMLInputElement>(
        ".login-container input[type='email']"
      );

      emailInput?.focus();
    }, 320);

    return () => window.clearTimeout(focusTimeout);
  }, [isLoginVisible]);

  useEffect(() => {
    return () => {
      if (splashRevealTimeoutRef.current) {
        window.clearTimeout(splashRevealTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenResetPasswordModal = (email: string) => {
    setResetEmail(email.trim());
    setIsResetModalOpen(true);
  };

  const handleCloseResetPasswordModal = () => {
    if (isSendingResetEmail) {
      return;
    }

    setIsResetModalOpen(false);
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    const sanitizedEmail = resetEmail.trim();

    if (!sanitizedEmail) {
      setAlert({
        severity: "error",
        message: "Informe seu e-mail para resetar a senha.",
      });
      return;
    }

    setIsSendingResetEmail(true);

    try {
      await sendPasswordResetEmail(sanitizedEmail);
      setAlert({
        severity: "success",
        message: "Enviamos um link para resetar sua senha.",
      });
      setIsResetModalOpen(false);
    } catch {
      setAlert({
        severity: "error",
        message: "Nao foi possivel enviar o e-mail de redefinicao.",
      });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const handleSplashClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isSplashStamping || isLoginVisible) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const hasPointerPosition = event.clientX !== 0 || event.clientY !== 0;
    const stampX = hasPointerPosition ? event.clientX - bounds.left : bounds.width / 2;
    const stampY = hasPointerPosition ? event.clientY - bounds.top : bounds.height / 2;

    setSplashStamp({ x: stampX, y: stampY, key: Date.now() });
    setIsSplashStamping(true);

    splashRevealTimeoutRef.current = window.setTimeout(() => {
      setIsLoginVisible(true);
      setIsSplashStamping(false);
    }, 420);
  };

  if (isLoading) {
    return <AppLoader fullscreen message="Verificando acesso..." />;
  }

  if (user) {
    return <Navigate to={DASHBOARD_ROUTE} replace />;
  }

  return (
    <div className="login-page">
      <button
        type="button"
        className={`login-intro${isLoginVisible ? " is-hidden" : ""}${
          isSplashStamping ? " is-stamping" : ""
        }`}
        onClick={handleSplashClick}
        aria-label="Abrir formulario de login"
      >
        {SPLASH_BACKGROUND_PAWS.map((paw, index) => (
          <img
            key={`${paw.left}-${paw.top}-${index}`}
            className="login-intro__bg-paw"
            src={pawPrint}
            alt=""
            aria-hidden="true"
            style={{
              left: paw.left,
              top: paw.top,
              width: paw.size,
              transform: `translate(-50%, -50%) rotate(${paw.rotate})`,
              animationDelay: paw.delay,
              animationDuration: paw.duration,
            }}
          />
        ))}

        <span className="login-intro__brand">
          <img className="login-intro__logo" src={splashLogo} alt="Pet Corner" />
        </span>

        <span className="login-intro__hint">clique para entrar</span>

        {splashStamp && (
          <img
            key={splashStamp.key}
            className="login-intro__stamp"
            src={pawPrint}
            alt=""
            aria-hidden="true"
            style={{ left: `${splashStamp.x}px`, top: `${splashStamp.y}px` }}
          />
        )}
      </button>

      <div className={`login-container paw-main${isLoginVisible ? " is-visible" : ""}`}>
        <LoginAlert alert={alert} onClose={() => setAlert(null)} />

        <LoginForm
          onSubmit={handleSubmit}
          onOpenResetPasswordModal={handleOpenResetPasswordModal}
          onHoverLogin={setShowAnimation}
          showAnimation={showAnimation}
          header={<Logo src={logoimg} />}
        />
      </div>

      {isResetModalOpen && (
        <div
          className="login-reset-modal-overlay"
          role="presentation"
          onClick={handleCloseResetPasswordModal}
        >
          <div
            className="login-reset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-reset-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="login-reset-modal__close"
              onClick={handleCloseResetPasswordModal}
              aria-label="Fechar modal"
              disabled={isSendingResetEmail}
            >
              <i className="fa fa-times" aria-hidden="true" />
            </button>

            <form className="login-reset-modal__form" onSubmit={handleResetPassword}>
              <div className="login-reset-modal__header">
                <h2 id="login-reset-modal-title">Resetar senha</h2>
                <p>Digite seu e-mail para receber o link de redefinicao.</p>
              </div>

              <input
                type="email"
                name="reset-email"
                placeholder="Digite seu email..."
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                disabled={isSendingResetEmail}
                autoFocus
              />

              <button type="submit" className="btn-primary" disabled={isSendingResetEmail}>
                {isSendingResetEmail ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
