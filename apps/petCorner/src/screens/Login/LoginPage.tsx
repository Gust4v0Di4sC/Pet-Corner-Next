import "./login.css";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { FirebaseError } from "firebase/app";
import type { ConfirmationResult } from "firebase/auth";
import { Navigate } from "react-router-dom";

import { sendPasswordResetEmail } from "../../API/auth";
import LoginForm from "../../components/Login/LoginForm";
import { DASHBOARD_ROUTE } from "../../components/Dashboard/dashboard.domain";
import AppLoader from "../../components/Templates/AppLoader";
import Logo from "../../components/Templates/Logo";
import logoimg from "../../assets/Logo.svg";
import pawPrint from "../../assets/paw-print.svg";
import splashLogo from "../../assets/Logo-Home.svg";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { AdminAccessError } from "../../services/adminService";

type LoginFormValues = {
  email: string;
  password: string;
};

type SplashStamp = { x: number; y: number; key: number } | null;
type RecoveryMethod = "email" | "phone";
type SplashBackgroundPaw = {
  left: string;
  top: string;
  size: string;
  rotate: string;
  delay: string;
  duration: string;
};

const PHONE_RECAPTCHA_CONTAINER_ID = "login-phone-recaptcha";

const SPLASH_BACKGROUND_PAWS: SplashBackgroundPaw[] = [
  { left: "8%", top: "12%", size: "82px", rotate: "-18deg", delay: "0s", duration: "2.3s" },
  { left: "18%", top: "22%", size: "70px", rotate: "14deg", delay: "0.35s", duration: "2.8s" },
  { left: "30%", top: "12%", size: "76px", rotate: "-8deg", delay: "0.7s", duration: "2.5s" },
  { left: "42%", top: "26%", size: "64px", rotate: "18deg", delay: "0.15s", duration: "2.1s" },
  { left: "58%", top: "14%", size: "72px", rotate: "10deg", delay: "0.8s", duration: "2.6s" },
  { left: "72%", top: "18%", size: "94px", rotate: "-12deg", delay: "0.45s", duration: "2.9s" },
  { left: "86%", top: "10%", size: "68px", rotate: "20deg", delay: "1.05s", duration: "2.4s" },
  { left: "90%", top: "30%", size: "82px", rotate: "-22deg", delay: "0.25s", duration: "2.7s" },
  { left: "14%", top: "46%", size: "92px", rotate: "12deg", delay: "0.55s", duration: "3s" },
  { left: "26%", top: "66%", size: "78px", rotate: "-16deg", delay: "0.9s", duration: "2.2s" },
  { left: "46%", top: "74%", size: "70px", rotate: "16deg", delay: "0.4s", duration: "2.5s" },
  { left: "62%", top: "60%", size: "88px", rotate: "-14deg", delay: "0.2s", duration: "2.8s" },
  { left: "78%", top: "72%", size: "76px", rotate: "12deg", delay: "1.1s", duration: "2.3s" },
  { left: "88%", top: "84%", size: "86px", rotate: "-18deg", delay: "0.6s", duration: "2.9s" },
  { left: "12%", top: "84%", size: "98px", rotate: "18deg", delay: "0.95s", duration: "3.1s" },
  { left: "54%", top: "40%", size: "66px", rotate: "-10deg", delay: "1.2s", duration: "2.2s" },
];

export default function LoginPage() {
  const {
    isLoading,
    login,
    user,
    sendPhoneLoginCode,
    confirmPhoneLoginCode,
    clearPhoneLoginVerifier,
  } = useAuth();
  const toast = useToast();
  const splashRevealTimeoutRef = useRef<number | null>(null);

  const [showAnimation, setShowAnimation] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);
  const [isConfirmingPhoneCode, setIsConfirmingPhoneCode] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<RecoveryMethod>("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const [smsVerificationCode, setSmsVerificationCode] = useState("");
  const [phoneConfirmationResult, setPhoneConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isSplashStamping, setIsSplashStamping] = useState(false);
  const [splashStamp, setSplashStamp] = useState<SplashStamp>(null);

  const isRecoveryActionBusy =
    isSendingResetEmail || isSendingPhoneCode || isConfirmingPhoneCode;

  const resetPhoneRecoveryState = useCallback(
    (options?: { preservePhone?: boolean }) => {
      clearPhoneLoginVerifier();
      if (!options?.preservePhone) {
        setResetPhone("");
      }
      setSmsVerificationCode("");
      setPhoneConfirmationResult(null);
    },
    [clearPhoneLoginVerifier]
  );

  const getFirebaseErrorMessage = (
    error: unknown,
    fallbackMessage: string
  ) => {
    if (error instanceof AdminAccessError) {
      return error.message;
    }

    if (error instanceof FirebaseError) {
      switch (error.code) {
        case "auth/user-not-found":
          return "Nao encontramos uma conta com esse e-mail.";
        case "auth/wrong-password":
          return "Senha incorreta.";
        case "auth/invalid-credential":
          return "E-mail ou senha invalidos.";
        case "auth/invalid-email":
          return "Informe um e-mail valido.";
        case "auth/operation-not-allowed":
          return "O login por telefone nao esta habilitado no Firebase.";
        case "auth/unauthorized-continue-uri":
          return "O dominio atual nao esta autorizado no Firebase para redefinicao de senha.";
        case "auth/invalid-continue-uri":
          return "O link de retorno da redefinicao de senha esta invalido.";
        case "auth/invalid-phone-number":
          return "Informe o telefone no formato +55 11 99999-9999.";
        case "auth/missing-phone-number":
          return "Informe um telefone para receber o codigo.";
        case "auth/too-many-requests":
          return "Muitas tentativas seguidas. Aguarde um pouco e tente novamente.";
        case "auth/quota-exceeded":
          return "A cota de SMS do Firebase foi atingida.";
        case "auth/captcha-check-failed":
          return "A verificacao reCAPTCHA falhou. Tente novamente.";
        case "auth/invalid-verification-code":
          return "O codigo informado e invalido.";
        case "auth/code-expired":
          return "O codigo SMS expirou. Solicite um novo envio.";
        case "auth/session-expired":
          return "A sessao de verificacao expirou. Solicite um novo codigo.";
        default:
          return fallbackMessage;
      }
    }

    return fallbackMessage;
  };

  const normalizePhoneNumber = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      throw new Error("Informe um telefone para continuar.");
    }

    const normalizedValue = trimmedValue.startsWith("+")
      ? `+${trimmedValue.slice(1).replace(/\D/g, "")}`
      : trimmedValue.replace(/\D/g, "");

    if (!normalizedValue.startsWith("+") || normalizedValue.length < 12) {
      throw new Error("Use o telefone no formato +55 11 99999-9999.");
    }

    return normalizedValue;
  };

  const handleSubmit = async ({ email, password }: LoginFormValues) => {
    try {
      await login(email.trim(), password);
      toast.success("Login realizado com sucesso!");
    } catch (error: unknown) {
      if (error instanceof AdminAccessError) {
        toast.error(error.message);
        return;
      }

      if (error instanceof FirebaseError) {
        toast.error(getFirebaseErrorMessage(error, "Erro ao fazer login."));
        return;
      }

      toast.error("Erro ao fazer login");
    }
  };

  useEffect(() => {
    if (!isResetModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isRecoveryActionBusy) {
        setRecoveryMethod("email");
        setResetEmail("");
        resetPhoneRecoveryState();
        setIsResetModalOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRecoveryActionBusy, isResetModalOpen, resetPhoneRecoveryState]);

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

  const handleResetPhoneStep = () => {
    if (isRecoveryActionBusy) {
      return;
    }

    resetPhoneRecoveryState({ preservePhone: true });
  };

  const handleOpenResetPasswordModal = (email: string) => {
    setRecoveryMethod("email");
    setResetEmail(email.trim());
    resetPhoneRecoveryState();
    setIsResetModalOpen(true);
  };

  const handleOpenPhoneLoginModal = () => {
    setRecoveryMethod("phone");
    setResetEmail("");
    resetPhoneRecoveryState();
    setIsResetModalOpen(true);
  };

  const handleCloseResetPasswordModal = () => {
    if (isRecoveryActionBusy) {
      return;
    }

    setRecoveryMethod("email");
    setResetEmail("");
    resetPhoneRecoveryState();
    setIsResetModalOpen(false);
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    const sanitizedEmail = resetEmail.trim();

    if (!sanitizedEmail) {
      toast.error("Informe seu e-mail para resetar a senha.");
      return;
    }

    setIsSendingResetEmail(true);

    try {
      await sendPasswordResetEmail(sanitizedEmail);
      toast.success("Enviamos um link para resetar sua senha.");
      setRecoveryMethod("email");
      setResetEmail("");
      setIsResetModalOpen(false);
    } catch (error) {
      toast.error(
        getFirebaseErrorMessage(error, "Nao foi possivel enviar o e-mail de redefinicao.")
      );
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const handleSendPhoneCode = async (event: React.FormEvent) => {
    event.preventDefault();

    let phoneNumber = "";

    try {
      phoneNumber = normalizePhoneNumber(resetPhone);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Informe um telefone valido para continuar."
      );
      return;
    }

    setIsSendingPhoneCode(true);

    try {
      const confirmationResult = await sendPhoneLoginCode(
        phoneNumber,
        PHONE_RECAPTCHA_CONTAINER_ID
      );

      setPhoneConfirmationResult(confirmationResult);
      toast.success("Codigo SMS enviado. Digite o codigo recebido para entrar.");
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error, "Nao foi possivel enviar o codigo SMS agora."));
    } finally {
      setIsSendingPhoneCode(false);
    }
  };

  const handleConfirmPhoneCode = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!phoneConfirmationResult) {
      toast.error("Solicite o codigo SMS antes de confirmar o acesso.");
      return;
    }

    const sanitizedVerificationCode = smsVerificationCode.trim();

    if (!sanitizedVerificationCode) {
      toast.error("Digite o codigo recebido por SMS.");
      return;
    }

    setIsConfirmingPhoneCode(true);

    try {
      await confirmPhoneLoginCode(phoneConfirmationResult, sanitizedVerificationCode);
      toast.success("Acesso validado por SMS.");
      setRecoveryMethod("email");
      resetPhoneRecoveryState();
      setIsResetModalOpen(false);
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error, "Nao foi possivel validar o codigo SMS."));
    } finally {
      setIsConfirmingPhoneCode(false);
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
    <div className={`login-page${isLoginVisible ? " is-login-visible" : ""}`}>
      <button
        type="button"
        className={`login-intro${isLoginVisible ? " is-hidden" : ""}${
          isSplashStamping ? " is-stamping" : ""
        }`}
        onClick={handleSplashClick}
        aria-label="Abrir formulario de login"
      >
        {SPLASH_BACKGROUND_PAWS.map((paw, index) => {
          const pawStyle: CSSProperties = {
            left: paw.left,
            top: paw.top,
            width: paw.size,
            animationDelay: paw.delay,
            animationDuration: paw.duration,
            "--paw-rotate": paw.rotate,
          } as CSSProperties;

          return (
            <img
              key={`${paw.left}-${paw.top}-${index}`}
              className="login-intro__bg-paw"
              src={pawPrint}
              alt=""
              aria-hidden="true"
              style={pawStyle}
            />
          );
        })}

        <span className="login-intro__brand">
          <span className="login-intro__brand-box">
            <img className="login-intro__logo" src={splashLogo} alt="Pet Corner" />
            <span className="login-intro__brand-badge">Acesso administrativo</span>
            <span className="login-intro__brand-copy">
              Este ambiente e exclusivo para administradores autorizados da Pet Corner.
            </span>
          </span>
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
        <LoginForm
          onSubmit={handleSubmit}
          onOpenResetPasswordModal={handleOpenResetPasswordModal}
          onOpenPhoneLoginModal={handleOpenPhoneLoginModal}
          onHoverLogin={setShowAnimation}
          showAnimation={showAnimation}
          header={
            <div className="login-form-header">
              <Logo src={logoimg} />
              <span className="login-form-admin-badge">Acesso administrativo</span>
            </div>
          }
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
              disabled={isRecoveryActionBusy}
            >
              <i className="fa fa-times" aria-hidden="true" />
            </button>

            <div className="login-reset-modal__header">
              <h2 id="login-reset-modal-title">
                {recoveryMethod === "email" ? "Resetar senha" : "Entrar com telefone"}
              </h2>
              <p>
                {recoveryMethod === "email"
                  ? "Informe o e-mail para receber o link de redefinicao de senha."
                  : "Valide o acesso do admin por SMS usando um telefone habilitado no Firebase."}
              </p>
            </div>

            {recoveryMethod === "email" ? (
              <form className="login-reset-modal__form" onSubmit={handleResetPassword}>
                <input
                  type="email"
                  name="reset-email"
                  placeholder="Digite seu email..."
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  disabled={isRecoveryActionBusy}
                  autoFocus
                />

                <button type="submit" className="btn-primary" disabled={isSendingResetEmail}>
                  {isSendingResetEmail ? "Enviando..." : "Enviar link"}
                </button>
              </form>
            ) : (
              <div className="login-reset-modal__phone-flow">
                {!phoneConfirmationResult ? (
                  <form className="login-reset-modal__form" onSubmit={handleSendPhoneCode}>
                    <input
                      type="tel"
                      name="reset-phone"
                      placeholder="Telefone no formato +55 11 99999-9999"
                      value={resetPhone}
                      onChange={(event) => setResetPhone(event.target.value)}
                      disabled={isRecoveryActionBusy}
                      autoFocus
                    />

                    <div
                      id={PHONE_RECAPTCHA_CONTAINER_ID}
                      className="login-reset-modal__recaptcha"
                    />

                    <button type="submit" className="btn-primary" disabled={isSendingPhoneCode}>
                      {isSendingPhoneCode ? "Enviando codigo..." : "Enviar codigo SMS"}
                    </button>
                  </form>
                ) : (
                  <form className="login-reset-modal__form" onSubmit={handleConfirmPhoneCode}>
                    <input
                      type="text"
                      name="sms-verification-code"
                      placeholder="Digite o codigo de 6 digitos"
                      value={smsVerificationCode}
                      onChange={(event) => setSmsVerificationCode(event.target.value)}
                      disabled={isConfirmingPhoneCode}
                      inputMode="numeric"
                      autoFocus
                    />

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isConfirmingPhoneCode}
                    >
                      {isConfirmingPhoneCode ? "Validando..." : "Entrar com SMS"}
                    </button>

                    <button
                      type="button"
                      className="login-reset-link"
                      onClick={handleResetPhoneStep}
                      disabled={isRecoveryActionBusy}
                    >
                      Reenviar SMS
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
