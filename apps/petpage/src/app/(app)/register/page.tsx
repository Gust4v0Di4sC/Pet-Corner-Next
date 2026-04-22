import { RegisterForm } from "@/presentation/auth/components/register-form";
import { sanitizeRedirectPath } from "@/utils/shared/route";

type RegisterPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = sanitizeRedirectPath(rawNext, "/profile");

  return (
    <main className="min-h-svh">
      <RegisterForm nextPath={nextPath} />
    </main>
  );
}
