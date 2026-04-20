// src/pages/Login/components/LoginForm.tsx
import { lazy, Suspense, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import animationUrl from "../../assets/Animation.lottie?url&no-inline";

import LoginTextField from "./LoginTextField";
import LoginButton from "./LoginButton";

const DotLottieReact = lazy(async () => {
  const module = await import("@lottiefiles/dotlottie-react");
  return { default: module.DotLottieReact };
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type Props = {
  header?: ReactNode;

  // agora sobe os dados já validados
  onSubmit: (data: LoginFormValues) => Promise<void> | void;
  onOpenResetPasswordModal: (email: string) => void;
  onOpenPhoneLoginModal: () => void;

  onHoverLogin: (value: boolean) => void;
  showAnimation: boolean;

  // opcional: prefill (ex. lembrar email)
  defaultValues?: Partial<LoginFormValues>;
};

export default function LoginForm({
  header,
  onSubmit,
  onOpenResetPasswordModal,
  onOpenPhoneLoginModal,
  onHoverLogin,
  showAnimation,
  defaultValues,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit", // pode trocar pra "onBlur" ou "onChange"
    defaultValues: {
      email: defaultValues?.email ?? "",
      password: defaultValues?.password ?? "",
    },
  });

  const currentEmail = watch("email");

  return (
    <>
      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        {header}

        <div className="box">
          <LoginTextField
            type="email"
            placeholder="Digite seu email..."
            // RHF
            {...register("email")}
            // erro
            error={errors.email?.message}
          />

          <LoginTextField
            type="password"
            placeholder="Digite sua senha..."
            {...register("password")}
            error={errors.password?.message}
          />

          <LoginButton
            type="submit"
            onHover={onHoverLogin}
            label={isSubmitting ? "Entrando..." : "Entrar"}
          />

          <div className="login-helper-links">
            <button
              type="button"
              className="login-reset-link"
              onClick={() => onOpenResetPasswordModal(currentEmail ?? "")}
            >
              Resetar senha
            </button>

            <button
              type="button"
              className="login-reset-link"
              onClick={onOpenPhoneLoginModal}
            >
              Entrar com telefone
            </button>
          </div>
        </div>
      </form>

      <div className="paws">
        {showAnimation ? (
          <Suspense fallback={null}>
            <DotLottieReact src={animationUrl} autoplay loop />
          </Suspense>
        ) : null}
      </div>
    </>
  );
}
