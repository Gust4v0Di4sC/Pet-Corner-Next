"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, User, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { waitForFirebaseUser } from "@/lib/auth/firebase-auth.adapter";

type UserPanelDrawerProps = {
  name?: string;
  email: string;
};

export function UserPanelDrawer({ name, email }: UserPanelDrawerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("");

  const displayName = useMemo(() => {
    const normalizedName = name?.trim();
    return normalizedName || "Cliente Pet Corner";
  }, [name]);

  const displayEmail = useMemo(() => {
    const normalizedEmail = email?.trim();
    return normalizedEmail || "cliente@petcorner.com";
  }, [email]);

  const closeDrawer = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    let isMounted = true;

    const loadProfileImage = async () => {
      const firebaseUser = await waitForFirebaseUser();
      if (!isMounted) {
        return;
      }

      setProfileImageUrl(firebaseUser?.photoURL?.trim() || "");
    };

    void loadProfileImage();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeDrawer, isOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ next: "/" }),
      });
    } finally {
      closeDrawer();
      router.replace("/");
      router.refresh();
    }
  };

  const drawerPanel = (
    <div className="fixed inset-0 z-[120] pointer-events-auto">
      <Button
        type="button"
        tabIndex={0}
        onClick={closeDrawer}
        aria-label="Fechar painel"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] transition-opacity duration-200 opacity-100"
      />

      <aside
        id="customer-user-panel"
        aria-label="Painel do perfil"
        className="absolute right-0 top-0 isolate h-full w-full max-w-[430px] overflow-hidden border-l border-slate-300/70 bg-[#f4f0e6] shadow-[0_25px_60px_-20px_rgba(15,23,42,0.55)] transition-transform duration-300 translate-x-0"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(251,139,36,0.09),transparent_170px)]" />
        <div className="pointer-events-none absolute -left-16 bottom-8 h-44 w-44 rounded-full bg-[#fb8b24]/25 blur-3xl" />

        <div className="relative flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-slate-300/80 bg-[#f2f2f3] px-6 py-5">
            <div className="space-y-0.5">
              <h2 className="text-3xl font-semibold leading-none text-slate-900">Minha conta</h2>
              <p className="text-sm text-slate-500">Resumo rapido do seu perfil</p>
            </div>
            <Button
              type="button"
              onClick={closeDrawer}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-[#f2f2f3] text-slate-500 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
              aria-label="Fechar painel"
            >
              <X className="h-6 w-6" />
            </Button>
          </header>

          <div className="flex-1 space-y-6 px-6 py-6">
            <div className="rounded-3xl border border-slate-300/90 bg-[#f7f6f2] p-5">
              <div className="mb-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-full border border-slate-300 bg-[#e4e4e7]">
                  {profileImageUrl ? (
                    <Image
                      src={profileImageUrl}
                      alt={`Foto de perfil de ${displayName}`}
                      fill
                      sizes="56px"
                      unoptimized={/^https?:\/\//i.test(profileImageUrl)}
                      className="object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-full w-full items-center justify-center text-slate-600">
                      <User className="h-6 w-6" />
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#fb8b24]">
                Perfil
              </p>
              <p className="mt-2 text-3xl font-semibold leading-tight text-slate-900">
                {displayName}
              </p>
              <p className="mt-1 text-lg leading-tight text-slate-600">{displayEmail}</p>
              <p className="mt-4 inline-flex rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700">
                Sessao ativa
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href="/profile"
                onClick={closeDrawer}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#fb8b24] px-6 py-3.5 text-xl font-semibold text-white shadow-[0_8px_24px_-12px_rgba(251,139,36,0.9)] transition hover:bg-[#ef7e14]"
              >
                Ir para pagina de perfil
              </Link>
              <Link
                href="/rastreamento"
                onClick={closeDrawer}
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-[#f7f6f2] px-6 py-3 text-lg font-semibold text-slate-700 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
              >
                Ver rastreamento
              </Link>
            </div>
          </div>

          <footer className="border-t border-slate-300/80 px-6 py-5">
            <Button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-[#f7f6f2] px-6 py-3 text-xl font-semibold text-slate-700 transition hover:border-[#fb8b24] hover:text-[#fb8b24] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="h-6 w-6" />
              {isLoggingOut ? "Saindo..." : "Sair"}
            </Button>
          </footer>
        </div>
      </aside>
    </div>
  );

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="customer-user-panel"
        aria-label="Abrir painel do perfil"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-[#273446] text-slate-100 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
      >
        <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
          {profileImageUrl ? (
            <Image
              src={profileImageUrl}
              alt={`Foto de perfil de ${displayName}`}
              fill
              sizes="40px"
              unoptimized={/^https?:\/\//i.test(profileImageUrl)}
              className="object-cover"
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </span>
      </Button>
      {isOpen && typeof document !== "undefined" ? createPortal(drawerPanel, document.body) : null}
    </>
  );
}
