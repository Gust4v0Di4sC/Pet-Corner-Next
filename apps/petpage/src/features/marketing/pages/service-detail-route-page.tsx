import { Footer } from "@/features/marketing/components/footer";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { ServiceDetailPage } from "@/features/marketing/components/service-detail-page";

type ServiceDetailRoutePageProps = {
  serviceId: string;
};

export function ServiceDetailRoutePage({ serviceId }: ServiceDetailRoutePageProps) {
  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <ServiceDetailPage serviceId={serviceId} />
      <Footer />
    </main>
  );
}
