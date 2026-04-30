import { ServiceDetailRoutePage } from "@/features/marketing/pages/service-detail-route-page";

export const dynamic = "force-dynamic";

type ServiceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { id } = await params;

  return <ServiceDetailRoutePage serviceId={id} />;
}
