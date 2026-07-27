import { Footer } from "@/features/marketing/components/footer";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { ServiceDetailPage } from "@/features/marketing/components/service-detail-page";
import { getLandingServiceByIdServer } from "@/features/marketing/services/landing-content.server";

type ServiceDetailRoutePageProps = {
  serviceId: string;
};

export async function ServiceDetailRoutePage({ serviceId }: ServiceDetailRoutePageProps) {
  const service = await getLandingServiceByIdServer(serviceId);

  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <ServiceDetailPage serviceId={serviceId} initialService={service} />
      <Footer />
    </main>
  );
}
