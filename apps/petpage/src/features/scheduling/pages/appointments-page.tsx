import { Footer } from "@/features/marketing/components/footer";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { AppointmentScheduler } from "@/features/scheduling/components/appointment-scheduler";

type AppointmentsPageProps = {
  initialServiceId: string;
  session: {
    name?: string;
    email: string;
  };
};

export function AppointmentsPage({ initialServiceId, session }: AppointmentsPageProps) {
  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <AppointmentScheduler
        initialServiceId={initialServiceId}
        customerName={session.name?.trim() || session.email}
      />
      <Footer />
    </main>
  );
}
