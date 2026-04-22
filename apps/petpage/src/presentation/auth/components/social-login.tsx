"use client";

import { GoogleLogo, WindowsLogo } from "@phosphor-icons/react";

type SocialLoginProps = {
  isGoogleLoading?: boolean;
  isMicrosoftLoading?: boolean;
  disabled?: boolean;
  onGoogle: () => Promise<void> | void;
  onMicrosoft: () => Promise<void> | void;
};

export function SocialLogin({
  isGoogleLoading = false,
  isMicrosoftLoading = false,
  disabled = false,
  onGoogle,
  onMicrosoft,
}: SocialLoginProps) {
  const isAnyLoading = isGoogleLoading || isMicrosoftLoading;

  return (
    <section className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => void onGoogle()}
        aria-label="Entrar com Google"
        disabled={disabled || isAnyLoading}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#fb8b24] hover:text-[#fb8b24] disabled:cursor-wait disabled:opacity-70"
      >
        <GoogleLogo className="h-5 w-5 text-[#db4437]" />
        {isGoogleLoading ? "Conectando..." : "Google"}
      </button>

      <button
        type="button"
        onClick={() => void onMicrosoft()}
        aria-label="Entrar com Microsoft"
        disabled={disabled || isAnyLoading}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#fb8b24] hover:text-[#fb8b24] disabled:cursor-wait disabled:opacity-70"
      >
        <WindowsLogo className="h-5 w-5 text-[#2f99ef]" />
        {isMicrosoftLoading ? "Conectando..." : "Microsoft"}
      </button>
    </section>
  );
}
