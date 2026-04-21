import { LoginForm } from "@/presentation/auth/components/login-form";
import { sanitizeRedirectPath } from "@/utils/shared/route";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = sanitizeRedirectPath(rawNext, "/profile");

  return (
    <main className="min-h-svh bg-slate-50">
      <div className="mx-auto flex min-h-svh w-full max-w-5xl items-center justify-center p-6">
        <section className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <header className="mb-6 space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">Customer Login</h1>
            <p className="text-sm text-slate-600">
              Access your account to continue with checkout and profile features.
            </p>
          </header>
          <LoginForm nextPath={nextPath} />
        </section>
      </div>
    </main>
  );
}
