import { LoginForm } from "@/presentation/auth/components/login-form";
import { sanitizeRedirectPath } from "@/utils/shared/route";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    from?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const rawFrom = Array.isArray(params.from) ? params.from[0] : params.from;
  const nextPath = sanitizeRedirectPath(rawNext, "/profile");
  const shouldShowSplash = rawFrom === "landing";

  return (
    <main className="min-h-svh">
      <LoginForm nextPath={nextPath} shouldShowSplash={shouldShowSplash} />
    </main>
  );
}
