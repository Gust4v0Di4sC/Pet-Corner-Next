import { ProfileOverview } from "@/presentation/account/components/profile-overview";

export default function ProfilePage() {
  return (
    <main className="min-h-svh bg-slate-100">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900">Profile</h1>
          <p className="text-sm text-slate-600">
            Protected customer profile scaffold for the next Firebase integration cycle.
          </p>
        </header>
        <ProfileOverview />
      </div>
    </main>
  );
}
