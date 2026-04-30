"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import logoImg from "@/assets/Logo-Home.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerAuth } from "@/features/auth/hooks/use-customer-auth";
import { customerRegisterSchema } from "@/features/auth/validation/auth-schemas";
import { getFirstZodErrorMessage } from "@/lib/validation/input-sanitizers";
import styles from "@/features/auth/components/login-form.module.css";

type RegisterFormProps = {
  nextPath: string;
};

export function RegisterForm({ nextPath }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    errorMessage,
    loadingMode,
    isBusy,
    setErrorMessage,
    registerWithEmail,
  } = useCustomerAuth({ nextPath });

  const loginPath = useMemo(() => `/login?next=${encodeURIComponent(nextPath)}`, [nextPath]);

  const handleEmailRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedInput = customerRegisterSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });
    if (!parsedInput.success) {
      setErrorMessage(
        getFirstZodErrorMessage(parsedInput.error, "Preencha todos os campos para continuar.")
      );
      return;
    }

    await registerWithEmail(parsedInput.data);
  };

  return (
    <div className={`${styles.loginPage} ${styles.loginVisible}`}>
      <Link href="/" className={`${styles.backLink} ${styles.pageBackLink}`}>
        <ArrowLeft size={16} />
        <span>Voltar para a landing</span>
      </Link>

      <section className={styles.shell}>
        <form className={styles.form} onSubmit={handleEmailRegister}>
          <header className={styles.header}>
            <div className={styles.logoWrap}>
              <Image src={logoImg} alt="PetCorner" width={150} height={40} />
            </div>
            <span className={styles.badge}>Cadastro do Cliente</span>
            <p className={styles.subtitle}>
              Crie sua conta para acompanhar pedidos, editar perfil e concluir compras com rapidez.
            </p>
          </header>

          <div className={styles.field}>
            <Label htmlFor="customer-name" className={styles.label}>
              Nome completo
            </Label>
            <Input
              id="customer-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={styles.input}
              placeholder="Digite seu nome..."
              disabled={isBusy}
              required
            />
          </div>

          <div className={styles.field}>
            <Label htmlFor="customer-register-email" className={styles.label}>
              Email
            </Label>
            <Input
              id="customer-register-email"
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
            <Label htmlFor="customer-register-password" className={styles.label}>
              Senha
            </Label>
            <Input
              id="customer-register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={styles.input}
              placeholder="Crie sua senha..."
              disabled={isBusy}
              required
            />
          </div>

          <div className={styles.field}>
            <Label htmlFor="customer-register-confirm-password" className={styles.label}>
              Confirmar senha
            </Label>
            <Input
              id="customer-register-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={styles.input}
              placeholder="Repita sua senha..."
              disabled={isBusy}
              required
            />
          </div>

          {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

          <div className={styles.actions}>
            <Button type="submit" className={styles.primary} disabled={isBusy}>
              {loadingMode === "email" ? "Criando conta..." : "Criar conta"}
            </Button>
          </div>

          <p className={styles.helperRow}>
            Ja tem conta?{" "}
            <Link href={loginPath} className={styles.helperLink}>
              Entrar
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}

