import { Footer } from "@/presentation/marketing/components/footer";
import { NavBar } from "@/presentation/marketing/components/nav-bar";
import { ServiceDetailPage } from "@/presentation/marketing/components/service-detail-page";

export const dynamic = "force-dynamic";

type ServiceDetailRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ServiceDetailRoutePage({
  params,
}: ServiceDetailRoutePageProps) {
  const { id } = await params;

  return (
    <main className="bg-[#f6f2e8] text-slate-900">
      <NavBar />
      <ServiceDetailPage serviceId={id} />
      <Footer />
    </main>
  );
}
