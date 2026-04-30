import { RegisterForm } from "@/features/auth/components/register-form";
import { sanitizeRedirectPath } from "@/lib/routing/route";

type RegisterPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = sanitizeRedirectPath(rawNext, "/profile");

  return (
    <main className="min-h-svh">
      <RegisterForm nextPath={nextPath} />
    </main>
  );
}
