// src/pages/Login/components/LoginForm.tsx
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {zodResolver} from "@hookform/resolvers/zod";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Animation from "../../assets/Animation.lottie";

import LoginTextField from "./LoginTextField";
import LoginButton from "./LoginButton";
import SocialLogin from "./SocialLogin";

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

  onGoogle: () => Promise<boolean>;
  onMicrosoft: () => Promise<boolean>;

  onHoverLogin: (value: boolean) => void;
  showAnimation: boolean;

  // opcional: prefill (ex. lembrar email)
  defaultValues?: Partial<LoginFormValues>;
};

export default function LoginForm({
  header,
  onSubmit,
  onGoogle,
  onMicrosoft,
  onHoverLogin,
  showAnimation,
  defaultValues,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit", // pode trocar pra "onBlur" ou "onChange"
    defaultValues: {
      email: defaultValues?.email ?? "",
      password: defaultValues?.password ?? "",
    },
  });

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

          <SocialLogin onGoogle={onGoogle} onMicrosoft={onMicrosoft} />
        </div>
      </form>

      <div className="paws">
        {showAnimation && <DotLottieReact src={Animation} autoplay loop />}
      </div>
    </>
  );
}
