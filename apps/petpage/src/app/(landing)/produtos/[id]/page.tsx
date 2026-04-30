import { ProductDetailRoutePage } from "@/features/marketing/pages/product-detail-route-page";

export const dynamic = "force-dynamic";

type ProductDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  return <ProductDetailRoutePage productId={id} />;
}

