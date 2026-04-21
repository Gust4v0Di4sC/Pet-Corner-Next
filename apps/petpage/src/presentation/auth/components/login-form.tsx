import Link from "next/link";
import { Button } from "@/components/ui/button";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  return (
    <form method="post" action="/api/auth/session" className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <input type="hidden" name="customerId" value="customer-structural" />

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
        Open Structural Session
      </Button>

      <p className="text-center text-sm text-slate-600">
        New customer?{" "}
        <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className="underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
