import Link from "next/link";
import { Button } from "@/components/ui/button";

type RegisterFormProps = {
  nextPath: string;
};

export function RegisterForm({ nextPath }: RegisterFormProps) {
  return (
    <form method="post" action="/api/auth/session" className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <input type="hidden" name="customerId" value="customer-structural" />

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue="Customer Structural"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue="customer@example.com"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          defaultValue="12345678"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          required
        />
      </div>

      <Button type="submit" className="w-full">
        Register and Open Session
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="underline">
          Login
        </Link>
      </p>
    </form>
  );
}
