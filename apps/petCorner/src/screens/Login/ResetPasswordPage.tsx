import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { Link, useSearchParams } from "react-router-dom";

import {
  confirmPasswordResetWithCode,
  verifyPasswordResetActionCode,
} from "../../API/auth";
import logoimg from "../../assets/Logo.svg";
import "./login.css";

type ResetStatus = "loading" | "ready" | "success" | "invalid";

function resolveRouterPathFromContinueUrl(continueUrl: string | null): string {
  if (!continueUrl) {
    return "/";
  }

  const basePath = String(import.meta.env.BASE_URL ?? "/")
    .replace(/\/+$/, "")
    .trim();
  const appPrefix = basePath && basePath !== "/" ? basePath : "";

  try {
    const parsedContinueUrl = new URL(continueUrl, window.location.origin);

    if (parsedContinueUrl.origin !== window.location.origin) {
      return "/";
    }

    if (appPrefix) {
      if (!parsedContinueUrl.pathname.startsWith(`${appPrefix}/`) && parsedContinueUrl.pathname !== appPrefix) {
        return "/";
      }

      const relativePath = parsedContinueUrl.pathname.slice(appPrefix.length) || "/";
      return `${relativePath}${parsedContinueUrl.search}${parsedContinueUrl.hash}`;
    }

    return `${parsedContinueUrl.pathname}${parsedContinueUrl.search}${parsedContinueUrl.hash}`;
  } catch {
    return "/";
  }
}

function getResetErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-action-code":
      case "auth/expired-action-code":
        return "O link de redefinição e inválido ou expirou. Solicite um novo e-mail.";
      case "auth/user-disabled":
        return "Esta conta foi desativada. Entre em contato com o suporte.";
      case "auth/weak-password":
        return "Escolha uma senha mais forte (mínimo de 6 caracteres).";
      default:
        return "Não foi possível concluir a redefinição agora. Tente novamente.";
    }
  }

  return "Não foi possível concluir a redefinição agora. Tente novamente.";
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ResetStatus>("loading");
  const [accountEmail, setAccountEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const continueUrl = searchParams.get("continueUrl");
  const languageCode = searchParams.get("lang") ?? "pt-BR";
  const returnPath = useMemo(
    () => resolveRouterPathFromContinueUrl(continueUrl),
    [continueUrl]
  );

  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      setStatus("invalid");
      setErrorMessage("Link de redefinição inválido. Solicite um novo e-mail de reset.");
      return;
    }

    let isMounted = true;
    setStatus("loading");
    setErrorMessage("");

    verifyPasswordResetActionCode(oobCode, languageCode)
      .then((email) => {
        if (!isMounted) {
          return;
        }

        setAccountEmail(email);
        setStatus("ready");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setStatus("invalid");
        setErrorMessage(getResetErrorMessage(error));
      });

    return () => {
      isMounted = false;
    };
  }, [languageCode, mode, oobCode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!oobCode) {
      setStatus("invalid");
      setErrorMessage("Código de redefinição ausente. Solicite um novo e-mail.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("As senhas não conferem.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await confirmPasswordResetWithCode(oobCode, newPassword, languageCode);
      setStatus("success");
    } catch (error) {
      setErrorMessage(getResetErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page login-page--reset is-login-visible">
      <section className="login-container login-container--reset is-visible">
        <div className="login-reset-panel">
          <img className="login-reset-panel__logo" src={logoimg} alt="PetCorner" />
          <span className="login-form-admin-badge">Redefinição de senha</span>

          {status === "loading" ? (
            <div className="login-reset-panel__state">
              <i className="fa fa-spinner fa-spin" aria-hidden="true" />
              <p>Validando link de redefinição...</p>
            </div>
          ) : null}

          {status === "invalid" ? (
            <div className="login-reset-panel__state">
              <i className="fa fa-triangle-exclamation" aria-hidden="true" />
              <p>{errorMessage}</p>
              <Link className="btn-primary login-reset-panel__action" to="/">
                Voltar para login
              </Link>
            </div>
          ) : null}

          {status === "ready" ? (
            <form className="login-reset-panel__form" onSubmit={handleSubmit}>
              <p className="login-reset-panel__description">
                Defina sua nova senha para <strong>{accountEmail}</strong>.
              </p>

              <input
                type="password"
                name="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Nova senha"
                autoComplete="new-password"
                disabled={isSubmitting}
              />

              <input
                type="password"
                name="confirm-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirmar nova senha"
                autoComplete="new-password"
                disabled={isSubmitting}
              />

              {errorMessage ? <p className="login-reset-panel__error">{errorMessage}</p> : null}

              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          ) : null}

          {status === "success" ? (
            <div className="login-reset-panel__state">
              <i className="fa fa-circle-check" aria-hidden="true" />
              <p>Senha atualizada com sucesso. Você já pode entrar novamente.</p>
              <Link className="btn-primary login-reset-panel__action" to={returnPath}>
                Ir para login
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
