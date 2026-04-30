"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, PawPrint } from "lucide-react";
import logoImg from "@/assets/Logo-Home.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerAuth } from "@/features/auth/hooks/use-customer-auth";
import { SocialLogin } from "@/features/auth/components/social-login";
import { customerLoginSchema } from "@/features/auth/validation/auth-schemas";
import { getFirstZodErrorMessage } from "@/lib/validation/input-sanitizers";
import styles from "@/features/auth/components/login-form.module.css";

type LoginFormProps = {
  nextPath: string;
  shouldShowSplash: boolean;
};

type PawStep = {
  x: string;
  y: string;
  rotate: string;
  size: number;
};

const PAW_TRAIL: PawStep[] = [
  { x: "10%", y: "70%", rotate: "-14deg", size: 38 },
  { x: "16%", y: "62%", rotate: "10deg", size: 34 },
  { x: "24%", y: "56%", rotate: "-12deg", size: 40 },
  { x: "32%", y: "50%", rotate: "10deg", size: 34 },
  { x: "40%", y: "46%", rotate: "-10deg", size: 42 },
  { x: "48%", y: "42%", rotate: "12deg", size: 36 },
  { x: "56%", y: "40%", rotate: "-10deg", size: 40 },
  { x: "64%", y: "42%", rotate: "12deg", size: 34 },
  { x: "72%", y: "46%", rotate: "-12deg", size: 42 },
  { x: "80%", y: "52%", rotate: "10deg", size: 36 },
  { x: "86%", y: "60%", rotate: "-14deg", size: 40 },
  { x: "92%", y: "68%", rotate: "10deg", size: 34 },
];

function getTrailDistance(index: number, activeIndex: number, total: number): number {
  return (activeIndex - index + total) % total;
}

function getTrailOpacity(distance: number): number {
  if (distance === 0) return 1;
  if (distance === 1) return 0.78;
  if (distance === 2) return 0.52;
  if (distance === 3) return 0.3;
  if (distance === 4) return 0.15;
  return 0.04;
}

function getTrailScale(distance: number): number {
  if (distance === 0) return 1.04;
  if (distance === 1) return 0.94;
  if (distance === 2) return 0.84;
  if (distance === 3) return 0.76;
  return 0.66;
}

export function LoginForm({ nextPath, shouldShowSplash }: LoginFormProps) {
  const [showSplash, setShowSplash] = useState(shouldShowSplash);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activePawIndex, setActivePawIndex] = useState(0);

  const {
    errorMessage,
    loadingMode,
    isBusy,
    setErrorMessage,
    loginWithEmail,
    loginWithGoogle,
    loginWithMicrosoft,
  } = useCustomerAuth({ nextPath });

  useEffect(() => {
    if (!showSplash) {
      return;
    }

    const timeout = window.setTimeout(() => setShowSplash(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [showSplash]);

  useEffect(() => {
    if (!showSplash) {
      return;
    }

    const interval = window.setInterval(() => {
      setActivePawIndex((previous) => (previous + 1) % PAW_TRAIL.length);
    }, 120);

    return () => window.clearInterval(interval);
  }, [showSplash]);

  const registerPath = useMemo(
    () => `/register?next=${encodeURIComponent(nextPath)}`,
    [nextPath]
  );

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedInput = customerLoginSchema.safeParse({ email, password });
    if (!parsedInput.success) {
      setErrorMessage(
        getFirstZodErrorMessage(parsedInput.error, "Preencha email e senha para continuar.")
      );
      return;
    }

    await loginWithEmail(parsedInput.data);
  };

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  };

  const handleMicrosoftLogin = async () => {
    await loginWithMicrosoft();
  };

  return (
    <div className={`${styles.loginPage} ${!showSplash ? styles.loginVisible : ""}`}>
      <div className={`${styles.splash} ${!showSplash ? styles.splashHidden : ""}`}>
        <div className={styles.trail}>
          {PAW_TRAIL.map((step, index) => {
            const trailDistance = getTrailDistance(index, activePawIndex, PAW_TRAIL.length);
            const opacity = getTrailOpacity(trailDistance);
            const scale = getTrailScale(trailDistance);

            return (
              <PawPrint
                key={`${step.x}-${step.y}-${index}`}
                className={styles.paw}
                style={
                  {
                    "--x": step.x,
                    "--y": step.y,
                    "--r": step.rotate,
                    "--paw-opacity": opacity,
                    "--paw-scale": scale,
                    fontSize: `${step.size}px`,
                  } as CSSProperties
                }
              />
            );
          })}
        </div>
      </div>

      <Link href="/" className={`${styles.backLink} ${styles.pageBackLink}`}>
        <ArrowLeft size={16} />
        <span>Voltar para a landing</span>
      </Link>

      <section className={styles.shell}>
        <form className={styles.form} onSubmit={handleEmailLogin}>
          <header className={styles.header}>
            <div className={styles.logoWrap}>
              <Image src={logoImg} alt="PetCorner" width={150} height={40} />
            </div>
            <span className={styles.badge}>Acesso do Cliente</span>
            <p className={styles.subtitle}>
              Entre com seu email, Google ou Microsoft para acessar perfil, pedidos e checkout.
            </p>
          </header>

          <div className={styles.field}>
            <Label htmlFor="customer-email" className={styles.label}>
              Email
            </Label>
            <Input
              id="customer-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={styles.input}
              placeholder="Digite seu email..."
              disabled={isBusy}
              required
            />
          </div>

          <div className={styles.field}>
            <Label htmlFor="customer-password" className={styles.label}>
              Senha
            </Label>
            <Input
              id="customer-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={styles.input}
              placeholder="Digite sua senha..."
              disabled={isBusy}
              required
            />
          </div>

          {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

          <div className={styles.actions}>
            <Button type="submit" className={styles.primary} disabled={isBusy}>
              {loadingMode === "email" ? "Entrando..." : "Entrar"}
            </Button>

            <SocialLogin
              disabled={isBusy}
              isGoogleLoading={loadingMode === "google"}
              isMicrosoftLoading={loadingMode === "microsoft"}
              onGoogle={handleGoogleLogin}
              onMicrosoft={handleMicrosoftLogin}
            />
          </div>

          <p className={styles.helperRow}>
            Novo por aqui?{" "}
            <Link href={registerPath} className={styles.helperLink}>
              Criar conta
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}

