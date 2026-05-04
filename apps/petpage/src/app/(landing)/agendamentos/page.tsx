import { redirect } from "next/navigation";
import { AppointmentsPage } from "@/features/scheduling/pages/appointments-page";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";

export const dynamic = "force-dynamic";

type AppointmentsRoutePageProps = {
  searchParams: Promise<{
    serviceId?: string;
  }>;
};

export default async function AppointmentsRoutePage({
  searchParams,
}: AppointmentsRoutePageProps) {
  const params = await searchParams;
  const serviceId = params.serviceId?.trim() || "";
  const session = await readServerCustomerSession();

  if (!session) {
    const nextPath = serviceId
      ? `/agendamentos?serviceId=${encodeURIComponent(serviceId)}`
      : "/agendamentos";
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <AppointmentsPage
      initialServiceId={serviceId}
      session={{ name: session.name, email: session.email }}
    />
  );
}
